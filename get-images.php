<?php
// get-images.php
// This script returns a list of image files from a specified folder.

	header('Content-Type: application/json');

// Define the root directory for assets.
	$asset_root = 'image-assets';

// --- Security Check ---
	if (!isset($_GET['folder'])) {
		echo json_encode(['success' => false, 'message' => 'No folder specified.']);
		exit;
	}

	$folder_path = $_GET['folder'];
// Normalize directory separators.
	$folder_path_normalized = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $folder_path);

// Get the real, absolute paths to prevent directory traversal.
	$real_asset_root = realpath($asset_root);
	$real_folder_path = realpath($folder_path_normalized);

// Check if the requested folder is valid and within the allowed asset root.
	if ($real_folder_path === false || strpos($real_folder_path, $real_asset_root) !== 0) {
		echo json_encode(['success' => false, 'message' => 'Invalid or forbidden folder path.']);
		exit;
	}

// --- Image Scanning ---
	$images = [];
	$allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// Use glob for a simple and safe way to find files.
	$files = glob($real_folder_path . DIRECTORY_SEPARATOR . '*.{'.implode(',', $allowed_extensions).'}', GLOB_BRACE);

	if ($files !== false) {
		foreach ($files as $file) {
			$images[] = basename($file);
		}
	}

	echo json_encode(['success' => true, 'images' => $images]);
?>
