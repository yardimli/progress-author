<?php
	// index-items.php
	// Main interface for editing item data.
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>JSON Item Order & Value Editor</title>
	<style>
      /* --- MODIFIED & NEW STYLES --- */
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
      #folderSelect, #imageSearch { /* Style both inputs */
          width: 100%;
          padding: 5px;
          box-sizing: border-box;
      }
      #imageSearch {
          margin-top: 10px;
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
          width: 80px;
          height: 80px;
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
          width: 100px;
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
      .prompt-text {
          font-size: 0.75rem;
          color: #777;
          background: #f9f9f9;
          padding: 5px;
          border-radius: 4px;
          max-height: 60px;
          overflow-y: auto;
          margin-top: 5px;
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
          flex: 1;
          margin: 0 5px;
      }
      .btn-move:hover {
          background-color: #0056b3;
      }
      button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
      }
	</style>
</head>
<body>

<!-- Sidebar for image assets -->
<div class="sidebar">
	<div class="sidebar-fixed-top">
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
		<!-- NEW: Search input box -->
		<label for="imageSearch" style="margin-top: 10px;">Search All Assets:</label>
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
			<h1>JSON Item Order & Value Editor</h1>
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

	// --- UTILITY FUNCTIONS ---
	function setNestedValue(obj, path, value) {
		const keys = path.split('.');
		let current = obj;
		for (let i = 0; i < keys.length - 1; i++) {
			current = current[keys[i]];
		}
		current[keys[keys.length - 1]] = value;
	};

	// --- DATA HANDLING AND LOADING ---
	document.addEventListener('DOMContentLoaded', () => {
		const saveStatus = document.getElementById('saveStatus');
		saveStatus.textContent = 'Loading data/items.json...';
		saveStatus.style.color = '#666';

		fetch('data/items.json?t=' + new Date().getTime())
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
	});

	function processJsonData(parsedObj) {
		itemsData = Object.keys(parsedObj).map(key => ({
			key: key,
			data: parsedObj[key]
		}));
		renderCards();
	};

	// --- RENDERING AND UI ---
	function renderCards() {
		const container = document.getElementById('cardsContainer');
		container.innerHTML = '';

		itemsData.forEach((item, index) => {
			const d = item.data;
			const card = document.createElement('div');
			card.className = 'card';
			card.dataset.index = index;

			const coinReqIndex = d.requirements?.findIndex(r => r.type === 'coins');
			const coinReq = coinReqIndex > -1 ? d.requirements[coinReqIndex] : null;

			const expenseHTML = `<div class="card-body-row"><strong>Expense:</strong><input class="card-input" type="number" step="1" data-index="${index}" data-key="expense" value="${d.expense}" oninput="updateItem(event)"></div>`;
			const effectHTML = `<div class="card-body-row"><strong>Effect:</strong><input class="card-input" type="number" step="0.01" data-index="${index}" data-key="effect" value="${d.effect}" oninput="updateItem(event)"></div>`;
			const wmHTML = d.writingMultiplier !== undefined ? `<div class="card-body-row"><strong>Writing Multiplier:</strong><input class="card-input" type="number" step="0.01" data-index="${index}" data-key="writingMultiplier" value="${d.writingMultiplier}" oninput="updateItem(event)"></div>` : '';
			const wqHTML = d.writingQuality !== undefined ? `<div class="card-body-row"><strong>Writing Quality:</strong><input class="card-input" type="number" step="0.01" data-index="${index}" data-key="writingQuality" value="${d.writingQuality}" oninput="updateItem(event)"></div>` : '';
			const coinsHTML = coinReq ? `<div class="card-body-row"><strong>Coins:</strong><input class="card-input" type="number" step="1" data-index="${index}" data-key="requirements.${coinReqIndex}.value" value="${coinReq.value}" oninput="updateItem(event)"></div>` : `<div class="card-body-row"><strong>Coins:</strong><span>None</span></div>`;

			const imagePath = d.filename_pixelart ? `pixelart-images/${d.filename_pixelart}` : `img/items/${d.filename}`;
			const imageStyle = d.filename_pixelart ? 'style="height: auto; object-fit: initial;"' : '';

			card.innerHTML = `
                <div class="card-header">
                    <img class="card-image" src="${imagePath}" alt="${d.name}" ${imageStyle} onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2FhYSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                    <div>
                        <h3 class="card-title">${d.name}</h3>
                        <p class="card-category">${d.category}</p>
                    </div>
                </div>
                <div class="card-body">
                    ${expenseHTML}
                    ${effectHTML}
                    ${wmHTML}
                    ${wqHTML}
                    ${coinsHTML}
                    ${d.description ? `<div class="card-body-row"><strong>Description:</strong> <span>${d.description}</span></div>` : ''}
                    <div><strong>Prompt:</strong><div class="prompt-text">${d.imageprompt}</div></div>
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
	function updateItem(event) {
		const input = event.target;
		const index = parseInt(input.dataset.index, 10);
		const key = input.dataset.key;
		const value = parseFloat(input.value);

		if (!isNaN(value)) {
			setNestedValue(itemsData[index].data, key, value);
		}
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
			const response = await fetch('save-items.php', {
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
	// NEW: Get search input and set up debounce timer.
	const imageSearchInput = document.getElementById('imageSearch');
	let searchTimeout;

	folderSelect.addEventListener('change', handleFolderSelect);
	imageSearchInput.addEventListener('input', handleImageSearch);

	// NEW: Central function to render images in the sidebar.
	/**
	 * Renders a list of image objects into the sidebar.
	 * @param {Array<Object>} images - Array of {path, filename}.
	 */
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

	// MODIFIED: This function now just handles the event and clears the search.
	function handleFolderSelect() {
		imageSearchInput.value = ''; // Clear search when a folder is selected.
		loadSidebarImagesFromFolder();
	};

	/**
	 * Fetches and displays images for the selected folder.
	 */
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
					// Format the data for the renderer.
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

	// NEW: Debounced search handler.
	function handleImageSearch(e) {
		clearTimeout(searchTimeout);
		const query = e.target.value.trim();

		if (query === '') {
			// If search is cleared, revert to folder view.
			handleFolderSelect();
			return;
		}

		if (query.length < 2) {
			sidebarImagesContainer.innerHTML = '<i>Enter 2+ characters to search...</i>';
			return;
		}

		// Debounce the search to avoid excessive requests.
		searchTimeout = setTimeout(() => {
			performSearch(query);
		}, 300);
	};

	// NEW: Function to execute the search via fetch.
	function performSearch(query) {
		folderSelect.value = ''; // Deselect folder to indicate search is active.
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
