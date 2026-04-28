<?php
// copy-image.php
// This script handles copying an image from the asset library to the final pixelart directory.

	header('Content-Type: application/json');

// Define the root directory for assets and the destination directory.
	$asset_root = 'image-assets';
	$destination_root = 'pixelart-images';

// --- Security Check ---
// Ensure the source file is provided.
	if (!isset($_POST['source'])) {
		echo json_encode(['success' => false, 'message' => 'No source file specified.']);
		exit;
	}

	$source_path = $_POST['source'];
// Normalize directory separators for cross-platform compatibility.
	$source_path_normalized = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $source_path);

// Get the real, absolute paths to prevent directory traversal attacks.
	$real_asset_root = realpath($asset_root);
	$real_source_path = realpath($source_path_normalized);

// Check if the source path is valid and exists within the allowed asset root.
	if ($real_source_path === false || strpos($real_source_path, $real_asset_root) !== 0) {
		echo json_encode(['success' => false, 'message' => 'Invalid or forbidden source path.']);
		exit;
	}

// --- File Copy Operation ---
	$filename = basename($real_source_path);
	$destination_path = $destination_root . DIRECTORY_SEPARATOR . $filename;

// Create the destination directory if it doesn't exist.
	if (!is_dir($destination_root)) {
		if (!mkdir($destination_root, 0755, true)) {
			echo json_encode(['success' => false, 'message' => 'Failed to create destination directory.']);
			exit;
		}
	}

// Copy the file and return the result.
	if (copy($real_source_path, $destination_path)) {
		echo json_encode(['success' => true, 'message' => "Copied '{$filename}' successfully."]);
	} else {
		echo json_encode(['success' => false, 'message' => "Failed to copy '{$filename}'."]);
	}
?>
