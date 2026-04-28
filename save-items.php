<?php
// save-items.php
// Handles backing up and saving the various data JSON files.

	header('Content-Type: application/json');

// --- Configuration ---
	$data_dir = 'data';

	// NEW: Define allowed files to prevent directory traversal and arbitrary file writes
	$allowed_files = [
		'authors.json',
		'badges.json',
		'items.json',
		'jobs.json',
		'lifeExperiences.json',
		'potions.json',
		'skills.json'
	];

// --- Input Validation ---
// Ensure the request method is POST.
	if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
		echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
		exit;
	}

	// NEW: Validate the requested file parameter
	$file_param = isset($_GET['file']) ? $_GET['file'] : 'items.json';
	if (!in_array($file_param, $allowed_files)) {
		echo json_encode(['success' => false, 'message' => 'Invalid file specified.']);
		exit;
	}

	$file_path = $data_dir . '/' . $file_param;

// Get the raw JSON data from the request body.
	$json_data = file_get_contents('php://input');
	if ($json_data === false || empty($json_data)) {
		echo json_encode(['success' => false, 'message' => 'No data received.']);
		exit;
	}

// Check if the received data is valid JSON.
	json_decode($json_data);
	if (json_last_error() !== JSON_ERROR_NONE) {
		echo json_encode(['success' => false, 'message' => 'Invalid JSON data received.']);
		exit;
	}

// --- Backup Logic ---
	if (file_exists($file_path)) {
		$backup_num = 1;
		// Find the next available backup number.
		while (file_exists("{$file_path}.backup{$backup_num}")) {
			$backup_num++;
		}
		$backup_path = "{$file_path}.backup{$backup_num}";

		// Use rename for an atomic move operation, which is safer than copy+delete.
		if (!rename($file_path, $backup_path)) {
			echo json_encode([
				'success' => false,
				'message' => 'Error: Could not create backup file. Save aborted.'
			]);
			exit;
		}
	}

// --- Save Logic ---
// Write the new JSON data to the file.
// Using file_put_contents is a safe and standard way to write files.
	if (file_put_contents($file_path, $json_data) !== false) {
		echo json_encode(['success' => true, 'message' => "{$file_param} saved successfully!"]);
	} else {
		// Attempt to restore the backup if the save fails.
		if (isset($backup_path) && file_exists($backup_path)) {
			rename($backup_path, $file_path);
		}
		echo json_encode([
			'success' => false,
			'message' => "Error: Could not write to {$file_param}. Permissions might be incorrect."
		]);
	}
?>
