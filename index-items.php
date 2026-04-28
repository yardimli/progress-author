<?php
	// index-items.php
	// Main interface for editing game data JSON files.
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>JSON Data Editor</title>
	<style>
      html, body {
          height: 100%;
          margin: 0;
      }
      body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f6f8;
          color: #333;
          display: flex;
          align-items: flex-start;
          padding: 0;
          overflow: hidden;
      }
      .sidebar {
          width: 400px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #e9ecef;
          border-right: 1px solid #ccc;
          flex-shrink: 0;
          box-sizing: border-box;
      }
      .sidebar-fixed-top {
          padding: 10px;
          background: #e9ecef;
          border-bottom: 1px solid #ddd;
          z-index: 10;
      }
      .sidebar-fixed-top label {
          font-weight: bold;
          font-size: 0.9rem;
          display: block;
          margin-bottom: 5px;
      }
      /* NEW: Style for the JSON file selector */
      #jsonFileSelect, #folderSelect, #imageSearch {
          width: 100%;
          padding: 5px;
          box-sizing: border-box;
          margin-bottom: 10px;
      }
      .sidebar-scrollable-content {
          overflow-y: auto;
          flex-grow: 1;
          padding: 10px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          align-content: flex-start;
      }
      .sidebar-image-card {
          background: #fff;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          padding: 5px;
          text-align: center;
          font-size: 0.7rem;
          word-break: break-all;
      }
      .sidebar-image-card img {
          width: 100%;
          height: 70px;
          object-fit: contain;
          cursor: grab;
          margin-bottom: 5px;
      }
      .container {
          flex-grow: 1;
          padding: 20px;
          height: 100vh;
          overflow-y: auto;
          box-sizing: border-box;
      }
      .container-content {
          width: 100%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin: 0 auto;
      }
      .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: -10px;
      }
      .main-header h1 {
          margin: 0;
      }
      .save-controls {
          display: flex;
          align-items: center;
          gap: 15px;
      }
      #saveStatus {
          font-weight: bold;
          font-size: 0.9rem;
          transition: color 0.3s;
      }
      #saveButton {
          background-color: #28a745;
          min-width: 100px;
          padding: 8px 16px;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
      }
      #saveButton:hover {
          background-color: #218838;
      }
      #saveButton:disabled {
          background-color: #94d3a2;
          cursor: not-allowed;
      }
      #cardsContainer {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
          margin-top: 20px;
      }
      .card {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 15px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: border-color 0.2s, box-shadow 0.2s;
      }
      .card.drag-over {
          box-shadow: 0 0 0 3px rgba(0,123,255,.5);
          border-color: #007bff;
      }
      .card-header {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          align-items: center;
      }
      .card-image {
          width: 140px;
          height: 140px;
          object-fit: cover;
          border-radius: 8px;
          background-color: #eee;
          border: 1px solid #ddd;
          flex-shrink: 0;
      }
      .card-title {
          font-size: 1.2rem;
          font-weight: bold;
          margin: 0 0 5px 0;
      }
      .card-category {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
      }
      .card-body {
          font-size: 0.85rem;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
      }
      .card-body-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
      }
      .card-body-row strong {
          color: #222;
      }
      .card-input {
          width: 120px;
          padding: 4px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 0.85rem;
          text-align: right;
      }
      .card-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,.25);
      }
      /* NEW: Textarea styling for prompts and descriptions */
      .card-textarea {
          width: 100%;
          padding: 6px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 0.85rem;
          resize: vertical;
          min-height: 60px;
          font-family: inherit;
          box-sizing: border-box;
      }
      .card-textarea.json-editor {
          font-family: monospace;
          background-color: #f8f9fa;
      }
      .card-textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,.25);
      }
      .card-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #eee;
      }
      .btn-move {
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px;
          flex: 1;
          margin: 0 5px;
          cursor: pointer;
          font-weight: bold;
      }
      .btn-move:hover {
          background-color: #0056b3;
      }
      .btn-move:disabled {
          background-color: #ccc;
          cursor: not-allowed;
      }
	</style>
</head>
<body>

<!-- Sidebar for image assets -->
<div class="sidebar">
	<div class="sidebar-fixed-top">
		<!-- NEW: Dropdown to select which JSON file to edit -->
		<label for="jsonFileSelect">Select JSON File:</label>
		<select id="jsonFileSelect">
			<option value="authors.json">authors.json</option>
			<option value="badges.json">badges.json</option>
			<option value="items.json" selected>items.json</option>
			<option value="jobs.json">jobs.json</option>
			<option value="lifeExperiences.json">lifeExperiences.json</option>
			<option value="potions.json">potions.json</option>
			<option value="skills.json">skills.json</option>
		</select>
		
		<label for="folderSelect">Image Folder:</label>
		<select id="folderSelect">
			<?php
				function get_directories($path) {
					$directories = [];
					$iterator = new RecursiveIteratorIterator(
						new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS),
						RecursiveIteratorIterator::SELF_FIRST
					);
					foreach ($iterator as $file) {
						if ($file->isDir()) {
							$directories[] = str_replace('\\', '/', $file->getPathname());
						}
					}
					return $directories;
				}
				
				$asset_root = 'image-assets';
				if (is_dir($asset_root)) {
					$folders = get_directories($asset_root);
					array_unshift($folders, $asset_root);
					sort($folders);
					echo '<option value="">Select a folder...</option>';
					foreach ($folders as $folder) {
						$folder_path = htmlspecialchars($folder, ENT_QUOTES, 'UTF-8');
						echo "<option value=\"{$folder_path}\">{$folder_path}</option>";
					}
				} else {
					echo '<option value="">`image-assets` folder not found</option>';
				}
			?>
		</select>
		<label for="imageSearch">Search All Assets:</label>
		<input type="search" id="imageSearch" placeholder="e.g., 'house', 'potion'">
	</div>
	<div id="sidebarImages" class="sidebar-scrollable-content">
		<!-- Images will be loaded here by JavaScript -->
	</div>
</div>

<!-- Main Content Area -->
<div class="container">
	<div class="container-content">
		<div class="main-header">
			<h1 id="editorTitle">JSON Data Editor</h1>
			<div class="save-controls">
				<span id="saveStatus"></span>
				<button id="saveButton" onclick="saveItems()">Save Changes</button>
			</div>
		</div>
		
		<div id="cardsContainer"></div>
	</div>
</div>

<script>
	let itemsData = [];
	let currentFile = 'items.json'; // Track currently selected file
	
	// --- UTILITY FUNCTIONS ---
	// MODIFIED: Ensure nested objects are created if they don't exist
	function setNestedValue(obj, path, value) {
		const keys = path.split('.');
		let current = obj;
		for (let i = 0; i < keys.length - 1; i++) {
			if (current[keys[i]] === undefined) {
				current[keys[i]] = {};
			}
			current = current[keys[i]];
		}
		current[keys[keys.length - 1]] = value;
	};
	
	// NEW: Helper to create standard inputs
	function createInput(index, key, label, value, type="text", step="any") {
		const valStr = value !== undefined ? value : '';
		return `<div class="card-body-row"><strong>${label}:</strong><input class="card-input" type="${type}" step="${step}" data-index="${index}" data-key="${key}" value="${valStr}" oninput="updateItem(event)"></div>`;
	};
	
	// NEW: Helper to create textareas (for prompts, descriptions, JSON requirements)
	function createTextarea(index, key, label, value, isJson=false) {
		const valStr = value !== undefined ? value : '';
		const jsonClass = isJson ? 'json-editor' : '';
		const jsonAttr = isJson ? 'data-isjson="true"' : '';
		return `<div style="display:flex; flex-direction:column; gap:5px; margin-top:5px;"><strong>${label}:</strong><textarea class="card-textarea ${jsonClass}" data-index="${index}" data-key="${key}" ${jsonAttr} oninput="updateItem(event)">${valStr}</textarea></div>`;
	};
	
	// --- DATA HANDLING AND LOADING ---
	document.addEventListener('DOMContentLoaded', () => {
		const fileSelect = document.getElementById('jsonFileSelect');
		currentFile = fileSelect.value;
		
		// Event listener for changing JSON files
		fileSelect.addEventListener('change', (e) => {
			currentFile = e.target.value;
			document.getElementById('editorTitle').textContent = `Editing ${currentFile}`;
			loadJsonData(currentFile);
		});
		
		document.getElementById('editorTitle').textContent = `Editing ${currentFile}`;
		loadJsonData(currentFile);
	});
	
	// NEW: Function to load specific JSON data
	function loadJsonData(filename) {
		const saveStatus = document.getElementById('saveStatus');
		saveStatus.textContent = `Loading data/${filename}...`;
		saveStatus.style.color = '#666';
		
		fetch(`data/${filename}?t=` + new Date().getTime())
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(data => {
				saveStatus.textContent = "Loaded successfully ✓";
				saveStatus.style.color = "#28a745";
				processJsonData(data);
				setTimeout(() => { saveStatus.textContent = ''; }, 3000);
			})
			.catch(error => {
				console.error('Error loading JSON:', error);
				saveStatus.textContent = "Auto-load failed.";
				saveStatus.style.color = "#d9534f";
			});
	};
	
	function processJsonData(parsedObj) {
		itemsData = Object.keys(parsedObj).map(key => ({
			key: key,
			data: parsedObj[key]
		}));
		renderCards();
	};
	
	// --- RENDERING AND UI ---
	// MODIFIED: dynamically generate card templates based on the current JSON schema
	function renderCards() {
		const container = document.getElementById('cardsContainer');
		container.innerHTML = '';
		
		itemsData.forEach((item, index) => {
			const d = item.data;
			const card = document.createElement('div');
			card.className = 'card';
			card.dataset.index = index;
			
			// Determine image path based on filefolder attribute
			const folder = d.filefolder ? d.filefolder : currentFile.replace('.json', '');
			const imagePath = d.filename_pixelart ? `pixelart-images/${d.filename_pixelart}` : `img/${folder}/${d.filename}`;
			const imageStyle = d.filename_pixelart ? 'style="height: auto; object-fit: initial;"' : '';
			
			let bodyHTML = '';
			
			// Common fields
			bodyHTML += createInput(index, 'name', 'Name', d.name);
			
			// Switch to build the rest of the card based on the current file
			switch (currentFile) {
				case 'authors.json':
					bodyHTML += createInput(index, 'gender', 'Gender', d.gender);
					bodyHTML += createInput(index, 'multipliers.hardship', 'Hardship Mult', d.multipliers?.hardship, 'number');
					bodyHTML += createInput(index, 'multipliers.observation', 'Observation Mult', d.multipliers?.observation, 'number');
					bodyHTML += createInput(index, 'multipliers.escapism', 'Escapism Mult', d.multipliers?.escapism, 'number');
					bodyHTML += createInput(index, 'multipliers.social', 'Social Mult', d.multipliers?.social, 'number');
					bodyHTML += createTextarea(index, 'biography', 'Biography', d.biography);
					break;
				case 'badges.json':
					bodyHTML += createTextarea(index, 'description', 'Description', d.description);
					bodyHTML += createInput(index, 'effect.type', 'Effect Type', d.effect?.type);
					bodyHTML += createInput(index, 'effect.value', 'Effect Value', d.effect?.value, 'number');
					bodyHTML += createInput(index, 'effect.text', 'Effect Text', d.effect?.text);
					break;
				case 'items.json':
					bodyHTML += createInput(index, 'category', 'Category', d.category);
					bodyHTML += createInput(index, 'expense', 'Expense', d.expense, 'number');
					bodyHTML += createInput(index, 'effect', 'Effect', d.effect, 'number');
					bodyHTML += createInput(index, 'writingMultiplier', 'Writing Mult', d.writingMultiplier, 'number');
					bodyHTML += createInput(index, 'writingQuality', 'Writing Quality', d.writingQuality, 'number');
					bodyHTML += createTextarea(index, 'description', 'Description', d.description);
					break;
				case 'jobs.json':
					bodyHTML += createInput(index, 'category', 'Category', d.category);
					bodyHTML += createInput(index, 'maxXp', 'Max XP', d.maxXp, 'number');
					bodyHTML += createInput(index, 'income', 'Income', d.income, 'number');
					bodyHTML += createInput(index, 'hardship', 'Hardship', d.hardship, 'number');
					bodyHTML += createInput(index, 'observation', 'Observation', d.observation, 'number');
					bodyHTML += createInput(index, 'escapism', 'Escapism', d.escapism, 'number');
					bodyHTML += createInput(index, 'social', 'Social', d.social, 'number');
					break;
				case 'lifeExperiences.json':
					bodyHTML += createInput(index, 'multiplier', 'Multiplier', d.multiplier, 'number');
					break;
				case 'potions.json':
					bodyHTML += createInput(index, 'effect', 'Effect', d.effect, 'number');
					bodyHTML += createInput(index, 'type', 'Type', d.type);
					break;
				case 'skills.json':
					bodyHTML += createInput(index, 'category', 'Category', d.category);
					bodyHTML += createInput(index, 'maxXp', 'Max XP', d.maxXp, 'number');
					bodyHTML += createInput(index, 'effect', 'Effect', d.effect, 'number');
					bodyHTML += createInput(index, 'writingQuality', 'Writing Quality', d.writingQuality, 'number');
					bodyHTML += createTextarea(index, 'description', 'Description', d.description);
					break;
			}
			
			// Add requirements JSON editor for files that support requirements
			if (d.requirements !== undefined) {
				bodyHTML += createTextarea(index, 'requirements', 'Requirements (JSON)', JSON.stringify(d.requirements, null, 2), true);
			}
			
			// Add image prompt editor for all files
			bodyHTML += createTextarea(index, 'imageprompt', 'Image Prompt', d.imageprompt || '');
			
			card.innerHTML = `
                <div class="card-header">
                    <img class="card-image" src="${imagePath}" alt="${d.name}" ${imageStyle} onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2FhYSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                    <div style="flex-grow: 1;">
                        <h3 class="card-title">${d.name || item.key}</h3>
                        <p class="card-category">${d.category || currentFile}</p>
                    </div>
                </div>
                <div class="card-body">
                    ${bodyHTML}
                </div>
                <div class="card-actions">
                    <button class="btn-move" onclick="moveUp(${index})" ${index === 0 ? 'disabled' : ''}>⬆ Move Up</button>
                    <button class="btn-move" onclick="moveDown(${index})" ${index === itemsData.length - 1 ? 'disabled' : ''}>⬇ Move Down</button>
                </div>
            `;
			
			card.addEventListener('dragover', handleDragOver);
			card.addEventListener('dragleave', handleDragLeave);
			card.addEventListener('drop', handleDrop);
			
			container.appendChild(card);
		});
	};
	
	// --- ACTIONS AND UPDATES ---
	// MODIFIED: Handle JSON parsing for requirement fields
	function updateItem(event) {
		const input = event.target;
		const index = parseInt(input.dataset.index, 10);
		const key = input.dataset.key;
		const isJson = input.dataset.isjson === 'true';
		let value = input.value;
		
		if (input.type === 'number') {
			value = parseFloat(value);
			if (isNaN(value)) return; // Ignore invalid numbers
		} else if (isJson) {
			try {
				value = JSON.parse(value);
				input.style.borderColor = '#ccc'; // Reset error state
			} catch (e) {
				input.style.borderColor = '#d9534f'; // Indicate invalid JSON
				return; // Do not save invalid JSON
			}
		}
		
		setNestedValue(itemsData[index].data, key, value);
	};
	
	function moveUp(index) {
		if (index > 0) {
			[itemsData[index - 1], itemsData[index]] = [itemsData[index], itemsData[index - 1]];
			renderCards();
		}
	};
	
	function moveDown(index) {
		if (index < itemsData.length - 1) {
			[itemsData[index], itemsData[index + 1]] = [itemsData[index + 1], itemsData[index]];
			renderCards();
		}
	};
	
	// MODIFIED: Pass currentFile as a parameter to save-items.php
	async function saveItems() {
		const saveButton = document.getElementById('saveButton');
		const saveStatus = document.getElementById('saveStatus');
		
		const outputObj = itemsData.reduce((acc, item) => {
			acc[item.key] = item.data;
			return acc;
		}, {});
		
		const jsonData = JSON.stringify(outputObj, null, 2);
		
		saveButton.disabled = true;
		saveStatus.textContent = 'Saving...';
		saveStatus.style.color = '#007bff';
		
		try {
			const response = await fetch(`save-items.php?file=${encodeURIComponent(currentFile)}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: jsonData,
			});
			
			const result = await response.json();
			
			if (result.success) {
				saveStatus.textContent = 'Saved successfully ✓';
				saveStatus.style.color = '#28a745';
			} else {
				throw new Error(result.message || 'Unknown error occurred.');
			}
		} catch (error) {
			console.error('Save failed:', error);
			saveStatus.textContent = `Error: ${error.message}`;
			saveStatus.style.color = '#d9534f';
		} finally {
			saveButton.disabled = false;
			setTimeout(() => {
				saveStatus.textContent = '';
			}, 4000);
		}
	};
	
	// --- Sidebar and Drag & Drop Logic ---
	const folderSelect = document.getElementById('folderSelect');
	const sidebarImagesContainer = document.getElementById('sidebarImages');
	const imageSearchInput = document.getElementById('imageSearch');
	let searchTimeout;
	
	folderSelect.addEventListener('change', handleFolderSelect);
	imageSearchInput.addEventListener('input', handleImageSearch);
	
	function renderSidebarImages(images) {
		sidebarImagesContainer.innerHTML = '';
		if (!images || images.length === 0) {
			sidebarImagesContainer.innerHTML = 'No images found.';
			return;
		}
		
		images.forEach(image => {
			const card = document.createElement('div');
			card.className = 'sidebar-image-card';
			card.innerHTML = `
                <img src="${image.path}" alt="${image.filename}" draggable="true" data-filename="${image.filename}" data-fullpath="${image.path}">
                <span>${image.filename}</span>
            `;
			sidebarImagesContainer.appendChild(card);
		});
		addDragListenersToSidebar();
	};
	
	function handleFolderSelect() {
		imageSearchInput.value = '';
		loadSidebarImagesFromFolder();
	};
	
	function loadSidebarImagesFromFolder() {
		const folder = folderSelect.value;
		if (!folder) {
			sidebarImagesContainer.innerHTML = '';
			return;
		}
		sidebarImagesContainer.innerHTML = 'Loading...';
		
		fetch(`get-images.php?folder=${encodeURIComponent(folder)}`)
			.then(response => response.json())
			.then(data => {
				if (data.success) {
					const formattedImages = data.images.map(filename => ({
						path: `${folder}/${filename}`,
						filename: filename
					}));
					renderSidebarImages(formattedImages);
				} else {
					sidebarImagesContainer.innerHTML = data.message || 'Error loading images.';
				}
			})
			.catch(error => {
				sidebarImagesContainer.innerHTML = 'Error loading images.';
				console.error('Error:', error);
			});
	};
	
	function handleImageSearch(e) {
		clearTimeout(searchTimeout);
		const query = e.target.value.trim();
		
		if (query === '') {
			handleFolderSelect();
			return;
		}
		
		if (query.length < 2) {
			sidebarImagesContainer.innerHTML = '<i>Enter 2+ characters to search...</i>';
			return;
		}
		
		searchTimeout = setTimeout(() => {
			performSearch(query);
		}, 300);
	};
	
	function performSearch(query) {
		folderSelect.value = '';
		sidebarImagesContainer.innerHTML = 'Searching...';
		
		fetch(`search-images.php?q=${encodeURIComponent(query)}`)
			.then(response => response.json())
			.then(data => {
				if (data.success) {
					renderSidebarImages(data.results);
				} else {
					sidebarImagesContainer.innerHTML = data.message || 'Search failed.';
				}
			})
			.catch(error => {
				sidebarImagesContainer.innerHTML = 'Error during search.';
				console.error('Search Error:', error);
			});
	};
	
	function addDragListenersToSidebar() {
		const images = sidebarImagesContainer.querySelectorAll('img');
		images.forEach(img => {
			img.addEventListener('dragstart', handleDragStart);
		});
	};
	
	function handleDragStart(e) {
		e.dataTransfer.setData('application/json', JSON.stringify({
			filename: e.target.dataset.filename,
			fullpath: e.target.dataset.fullpath
		}));
		e.dataTransfer.effectAllowed = 'copy';
	};
	
	function handleDragOver(e) {
		e.preventDefault();
		e.currentTarget.classList.add('drag-over');
	};
	
	function handleDragLeave(e) {
		e.currentTarget.classList.remove('drag-over');
	};
	
	function handleDrop(e) {
		e.preventDefault();
		e.currentTarget.classList.remove('drag-over');
		
		const cardIndex = parseInt(e.currentTarget.dataset.index, 10);
		if (isNaN(cardIndex)) return;
		
		try {
			const imageData = JSON.parse(e.dataTransfer.getData('application/json'));
			
			itemsData[cardIndex].data.filename_pixelart = imageData.filename;
			
			const cardImage = e.currentTarget.querySelector('.card-image');
			if (cardImage) {
				cardImage.src = imageData.fullpath;
				cardImage.style.height = 'auto';
				cardImage.style.objectFit = 'initial';
			}
			
			copyImageToServer(imageData.fullpath);
		} catch (error) {
			console.error("Failed to process drop data:", error);
		}
	};
	
	function copyImageToServer(sourcePath) {
		const formData = new FormData();
		formData.append('source', sourcePath);
		
		fetch('copy-image.php', {
			method: 'POST',
			body: formData
		})
			.then(response => response.json())
			.then(data => {
				console.log('Copy result:', data);
				const saveStatus = document.getElementById('saveStatus');
				saveStatus.textContent = data.message;
				saveStatus.style.color = data.success ? '#28a745' : '#d9534f';
				setTimeout(() => {
					if (saveStatus.textContent === data.message) {
						saveStatus.textContent = '';
					}
				}, 3000);
			})
			.catch(error => {
				console.error('Copy error:', error);
				const saveStatus = document.getElementById('saveStatus');
				saveStatus.textContent = 'Error during file copy operation.';
				saveStatus.style.color = '#d9534f';
			});
	};
</script>

</body>
</html>
