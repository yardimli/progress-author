import os
import json
import fal_client
import requests # Used to download the image
from PIL import Image # Used for resizing and converting to JPG

# --- Main Configuration ---

# Updated tasks to point to the 5 game JSON files and include aspect ratios.
TASKS = [
    {
        "json_filename": "data/items.json",
        "start_prompt": "An image for a game item.",
        "aspect_ratio": "1:1"
    },
    {
        "json_filename": "data/jobs.json",
        "start_prompt": "An image for a game job/profession.",
        "aspect_ratio": "1:1"
    },
    {
        "json_filename": "data/skills.json",
        "start_prompt": "An image for a game skill.",
        "aspect_ratio": "1:1"
    },
    {
        "json_filename": "data/authors.json",
        "start_prompt": "An image of a modern day author. Don't include any name.",
        "aspect_ratio": "1:1"
    },
    {
        "json_filename": "data/books.json",
        "start_prompt": "An image of a classic book cover.",
        "aspect_ratio": "3:4" # Tall aspect ratio for books
    }
]

FAL_MODEL_ID = "fal-ai/gemini-25-flash-image"

def check_api_key():
    """Checks if the FAL_KEY environment variable is set."""
    if "FAL_KEY" not in os.environ:
        print("Error: The FAL_KEY environment variable is not set.")
        return False
    return True

def download_image(url, filepath):
    """Downloads an image from a URL and saves it to a local file."""
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Successfully saved original image to: {filepath}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error downloading image: {e}")
        return False

def resize_and_convert_image(input_path, output_path, target_width=256):
    """Resizes an image to a target width (keeping aspect ratio) and saves as JPG."""
    try:
        with Image.open(input_path) as img:
            # Convert to RGB if the image has an alpha channel (e.g., PNG)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # Calculate new height to maintain aspect ratio
            width_percent = (target_width / float(img.size[0]))
            target_height = int((float(img.size[1]) * float(width_percent)))

            # Resize image
            # Use Image.Resampling.LANCZOS for high-quality downsampling
            resized_img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)

            # Save as JPG
            resized_img.save(output_path, "JPEG", quality=90)
            print(f"Successfully resized and saved JPG to: {output_path}")
    except Exception as e:
        print(f"Error resizing image {input_path}: {e}")

def on_queue_update(update):
    """Callback for fal_client to print log messages during generation."""
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

def process_task(task_config):
    """Processes a single image generation task based on the provided configuration."""

    # --- 1. Unpack configuration for this task ---
    json_filename = task_config.get("json_filename")
    start_prompt = task_config.get("start_prompt")
    aspect_ratio = task_config.get("aspect_ratio", "1:1") # Default to 1:1 if missing

    if not all([json_filename, start_prompt]):
        print("Error: Task configuration is missing a required key (json_filename or start_prompt). Skipping.")
        return

    try:
        with open(json_filename, 'r') as f:
            data_entries = json.load(f)
    except FileNotFoundError:
        print(f"Error: JSON file not found at '{json_filename}'. Skipping this task.")
        return
    except Exception as e:
        print(f"Error reading JSON file '{json_filename}': {e}. Skipping this task.")
        return

    print(f"Found {len(data_entries)} entries in '{json_filename}'. Starting generation...")
    print("-" * 30)

    # --- 2. Loop through each entry in the JSON dictionary ---
    for key, entry in data_entries.items():
        name = entry.get("name", key)

        img_filename = entry.get("filename")
        img_folder = entry.get("filefolder")
        imageprompt = entry.get("imageprompt")

        if not img_filename or not img_folder or not imageprompt:
            print(f"Skipping '{name}': Missing 'filename', 'filefolder', or 'imageprompt'.")
            continue

        # Paths for the original generated image
        output_dir = os.path.join("img", img_folder)
        output_path = os.path.join(output_dir, img_filename)

        # Paths for the resized JPG image
        resized_dir = os.path.join("img", f"{img_folder}256")
        base_filename = os.path.splitext(img_filename)[0]
        resized_path = os.path.join(resized_dir, f"{base_filename}.jpg")

        # Ensure target directories exist
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(resized_dir, exist_ok=True)

        # Verification checks
        original_exists = os.path.exists(output_path)
        resized_exists = os.path.exists(resized_path)

        if original_exists and resized_exists:
            print(f"Skipping '{name}': Both original and resized images already exist.")
            continue

        print(f"Processing entry: '{name}'...")

        # If the original doesn't exist, we need to generate it
        if not original_exists:
            prompt_text = f"""{start_prompt}

{imageprompt}

Vibe: Classic literature, Great Gatsby, old printing presses, academia.
Execution: Icons are monochromatic (sepia or dark brown ink) resembling woodblock prints or old newspaper illustrations.
The final image should be a clean icon on a parchment-textured background.
"""
            try:
                print(f"Subscribing to {FAL_MODEL_ID} for text-to-image (Aspect Ratio: {aspect_ratio})...")
                result = fal_client.subscribe(
                    FAL_MODEL_ID,
                    arguments={
                        "prompt": prompt_text,
                        "aspect_ratio": aspect_ratio,
                        "safety_tolerance": 6
                    }
                )

                if result and 'images' in result and len(result['images']) > 0:
                    image_url = result['images'][0]['url']
                    print(f"Image generated successfully. Downloading to {output_path}...")
                    download_success = download_image(image_url, output_path)
                    if not download_success:
                        continue # Skip resizing if download failed
                else:
                    print(f"Failed to generate image for '{name}'. Response: {result}")
                    continue # Skip resizing if generation failed

            except Exception as e:
                print(f"An error occurred generating '{name}': {e}")
                continue # Skip resizing if generation threw an error
        else:
            print(f"Original image for '{name}' already exists. Proceeding directly to resize step.")

        # If we reach here, the original image exists (either just generated or already existed),
        # but the resized version might be missing.
        if not os.path.exists(resized_path):
            print(f"Resizing '{name}' to 256px width...")
            resize_and_convert_image(output_path, resized_path, target_width=256)

        print("-" * 30)

    print(f"All entries for '{json_filename}' processed.")


def main():
    """Main function to run all configured tasks."""
    if not check_api_key():
        return

    print(f"Starting image generation for {len(TASKS)} configured task(s).")

    for i, task in enumerate(TASKS):
        print(f"\n{'='*50}")
        print(f"RUNNING TASK {i+1}/{len(TASKS)}: Processing '{task.get('json_filename', 'N/A')}'")
        print(f"{'='*50}")

        process_task(task)

        print(f"\n--- FINISHED TASK {i+1}/{len(TASKS)} ---")

    print(f"\n{'='*50}")
    print("All configured tasks have been processed.")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
