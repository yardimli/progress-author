<?php
// search-images.php
// Recursively searches for image files in the asset directory based on a query.

	header('Content-Type: application/json');

// --- Configuration ---
	$asset_root = 'image-assets';
	$allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// --- Input Validation ---
// Ensure a search query is provided.
	if (!isset($_GET['q']) || empty(trim($_GET['q']))) {
		echo json_encode(['success' => true, 'results' => []]);
		exit;
	}
	$query = trim($_GET['q']);

// --- Security Check ---
	$real_asset_root = realpath($asset_root);
	if ($real_asset_root === false) {
		echo json_encode(['success' => false, 'message' => 'Asset root directory not found.']);
		exit;
	}

// --- File Search Logic ---
	$results = [];
// Use RecursiveIteratorIterator for efficient and simple directory traversal.
	$iterator = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator($real_asset_root, RecursiveDirectoryIterator::SKIP_DOTS),
		RecursiveIteratorIterator::SELF_FIRST
	);

	foreach ($iterator as $file) {
		// Process only files with allowed extensions.
		if ($file->isFile() && in_array(strtolower($file->getExtension()), $allowed_extensions)) {
			// Perform a case-insensitive search on the filename.
			if (stripos($file->getFilename(), $query) !== false) {
				// Get the relative path for use in the client-side `src` attribute.
				$relative_path = str_replace($real_asset_root, $asset_root, $file->getRealPath());
				// Normalize path separators for web use.
				$web_path = str_replace(DIRECTORY_SEPARATOR, '/', $relative_path);

				$results[] = [
					'path' => $web_path,
					'filename' => $file->getFilename()
				];
			}
		}
	}

	echo json_encode(['success' => true, 'results' => $results]);
?>
