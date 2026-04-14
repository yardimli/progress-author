import os
import json
import fal_client
import requests # Used to download the image

# --- Main Configuration ---

# Updated tasks to point to the 3 game JSON files.
TASKS = [
    {
        "json_filename": "data/items.json",
        "start_prompt": "An image for a game item."
    },
    {
        "json_filename": "data/jobs.json",
        "start_prompt": "An image for a game job/profession."
    },
    {
        "json_filename": "data/skills.json",
        "start_prompt": "An image for a game skill."
    }
]

FAL_MODEL_ID = "fal-ai/gemini-25-flash-image"
# Removed FAL_EDIT_MODEL_ID as it is no longer needed for this single-image structure


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
        print(f"Successfully saved image to: {filepath}")
    except requests.exceptions.RequestException as e:
        print(f"Error downloading image: {e}")

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
    # Modified to iterate over dictionary items instead of a list
    for key, entry in data_entries.items():
        name = entry.get("name", key)

        # Extract the new image properties from the JSON
        img_filename = entry.get("filename")
        img_folder = entry.get("filefolder")
        imageprompt = entry.get("imageprompt")

        # Skip if any of the required image generation fields are missing
        if not img_filename or not img_folder or not imageprompt:
            print(f"Skipping '{name}': Missing 'filename', 'filefolder', or 'imageprompt'.")
            continue

        # Create the output path (e.g., img/items/homeless.png)
        # Added an 'img' root directory to keep the project structure clean
        output_dir = os.path.join("img", img_folder)
        output_path = os.path.join(output_dir, img_filename)

        # Ensure the target directory exists
        os.makedirs(output_dir, exist_ok=True)

        if os.path.exists(output_path):
            print(f"Skipping '{name}': File already exists at {output_path}")
            continue

        print(f"Processing entry: '{name}'...")

        # Modified prompt text to enforce the requested art style
        prompt_text = f"""{start_prompt}

{imageprompt}

Vibe: Classic literature, Great Gatsby, old printing presses, academia.
Execution: Icons are monochromatic (sepia or dark brown ink) resembling woodblock prints or old newspaper illustrations.
The final image should be a clean, square icon on a parchment-textured background.
"""

        try:
            # Standard Text-to-Image Generation (Removed edit logic)
            print(f"Subscribing to {FAL_MODEL_ID} for text-to-image...")
            result = fal_client.subscribe(
                FAL_MODEL_ID,
                arguments={
                    "prompt": prompt_text,
                    "aspect_ratio": "1:1", # Changed to 1:1 for UI icons
                    "safety_tolerance": 6
                }
            )

            # Process the result
            if result and 'images' in result and len(result['images']) > 0:
                image_url = result['images'][0]['url']
                print(f"Image generated successfully. Downloading to {output_path}...")
                download_image(image_url, output_path)
            else:
                print(f"Failed to generate image for '{name}'. Response: {result}")

        except Exception as e:
            print(f"An error occurred for '{name}': {e}")

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
