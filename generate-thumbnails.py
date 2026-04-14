import os
import json
from PIL import Image

# --- Main Configuration ---

# Updated to point to the 3 game JSON files
TASKS = [
    {
        "json_filename": "data/items.json",
    },
    {
        "json_filename": "data/jobs.json",
    },
    {
        "json_filename": "data/skills.json",
    }
]

# Set target size to exactly 256x256 as requested
TARGET_SIZE = (256, 256)

def process_task(task_config):
    """Processes a single task to generate thumbnails for existing images."""

    # --- 1. Unpack configuration for this task ---
    json_filename = task_config.get("json_filename")

    if not json_filename:
        print("Error: Task configuration is missing a required key (json_filename). Skipping.")
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

    print(f"Found {len(data_entries)} entries in '{json_filename}'. Checking for images...")
    print("-" * 30)

    # --- 2. Loop through each entry in the JSON dictionary ---
    for key, entry in data_entries.items():
        name = entry.get("name", key)

        # Extract the image properties from the JSON
        img_filename = entry.get("filename")
        img_folder = entry.get("filefolder")

        if not img_filename or not img_folder:
            # Silently skip entries without proper image data
            continue

        # --- 3. Construct Paths ---
        # Assuming original images were saved in 'img/{filefolder}/' by the previous script
        original_image_path = os.path.join("img", img_folder, img_filename)

        # Create the new thumbnails directory: 'images/{filefolder}256'
        # e.g., 'images/items256', 'images/jobs256'
        thumbnails_dir = os.path.join("images", f"{img_folder}256")
        os.makedirs(thumbnails_dir, exist_ok=True)

        # Change the file extension to .jpg for the thumbnail
        base_name = os.path.splitext(img_filename)[0]
        thumbnail_filename = f"{base_name}.jpg"
        thumbnail_image_path = os.path.join(thumbnails_dir, thumbnail_filename)

        # Check if the original image exists
        if not os.path.exists(original_image_path):
            # Silently skip if the source image hasn't been generated yet
            continue

        # Check if thumbnail already exists to save processing time
        if os.path.exists(thumbnail_image_path):
            print(f"Skipping '{name}': Thumbnail already exists.")
            continue

        print(f"Creating thumbnail for: '{name}'...")

        try:
            # Open the original image
            with Image.open(original_image_path) as img:

                # Convert to RGB before saving as JPEG (JPEG does not support transparency/RGBA)
                if img.mode in ("RGBA", "P"):
                    # Create a white background to paste the transparent image onto
                    background = Image.new("RGB", img.size, (255, 255, 255))
                    if img.mode == "RGBA":
                        background.paste(img, mask=img.split()[3]) # 3 is the alpha channel
                    else:
                        background.paste(img)
                    img = background
                elif img.mode != "RGB":
                    img = img.convert("RGB")

                # Resize the image to exactly 256x256 using LANCZOS (high quality)
                # Since the original images were generated at 1:1 aspect ratio, this won't stretch them
                img_resized = img.resize(TARGET_SIZE, Image.Resampling.LANCZOS)

                # Save the thumbnail as JPEG with high quality
                img_resized.save(thumbnail_image_path, format="JPEG", quality=90)
                print(f" -> Saved thumbnail to {thumbnail_image_path}")

        except Exception as e:
            print(f"An error occurred while resizing '{name}': {e}")

    print(f"All entries for '{json_filename}' processed.")


def main():
    """Main function to run all configured tasks."""
    print(f"Starting thumbnail generation for {len(TASKS)} configured task(s).")

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
