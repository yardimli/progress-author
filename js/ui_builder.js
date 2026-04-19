// DOM generation and initialization functions

function createData (data, baseData) {
	for (const key in baseData) {
		const entity = baseData[key];
		createEntity(data, entity);
	}
}

function createEntity (data, entity) {
	if ('income' in entity) {
		data[entity.name] = new Job(entity);
	} else if ('maxXp' in entity) {
		data[entity.name] = new Skill(entity);
	} else {
		data[entity.name] = new Item(entity);
	}
	data[entity.name].id = 'row ' + entity.name;
}

function createAllRows (categoryType, containerId) {
	const container = document.getElementById(containerId);
	container.innerHTML = '';
	
	const isJob = categoryType === jobCategories;
	const isSkill = categoryType === skillCategories;
	const isItem = categoryType === itemCategories;
	
	const baseData = isJob ? jobBaseData : (isSkill ? skillBaseData : itemBaseData);
	
	for (const categoryName in categoryType) {
		const headerTemplate = document.getElementById('categoryHeaderTemplate');
		const headerClone = headerTemplate.content.cloneNode(true);
		const categoryDiv = headerClone.querySelector('.category-section');
		categoryDiv.querySelector('.category-header').textContent = categoryName;
		
		const contentDiv = categoryDiv.querySelector('.category-content');
		
		if (isJob || (isItem && categoryName === 'Properties')) {
			contentDiv.classList.add('grid');
		} else {
			contentDiv.classList.add('list');
		}
		
		const category = categoryType[categoryName];
		category.forEach(function (name) {
			let templateId;
			if (isJob) templateId = 'jobCardTemplate';
			else if (isSkill) templateId = 'skillRowTemplate';
			else if (isItem && categoryName === 'Properties') templateId = 'propertyCardTemplate';
			else templateId = 'miscRowTemplate';
			
			const template = document.getElementById(templateId);
			const rowClone = template.content.cloneNode(true);
			const element = rowClone.firstElementChild;
			
			element.id = 'row ' + name;
			element.querySelector('.name').textContent = name;
			
			const entityData = baseData[name];
			if (entityData && entityData.filefolder && entityData.filename) {
				const imgElement = element.querySelector('.card-image, .row-image');
				if (imgElement) {
					const filefolder = entityData.filefolder + '256';
					let filename = entityData.filename;
					filename = filename.replace('.png', '.jpg');
					imgElement.src = `img/${filefolder}/${filename}`;
					imgElement.alt = name;
					
					imgElement.setAttribute('data-name', name);
					imgElement.setAttribute('data-type', isJob ? 'job' : (isSkill ? 'skill' : 'item'));
					imgElement.style.cursor = 'pointer';
					imgElement.onclick = function (e) {
						e.stopPropagation();
						showModal(this);
					};
				}
			}
			
			if (isJob || isSkill) {
				element.onclick = function () {
					setTask(name);
				};
			} else if (isItem) {
				element.onclick = categoryName === 'Properties'
					? function () { setProperty(name); }
					: function () { setMisc(name); };
			}
			
			contentDiv.appendChild(element);
		});
		
		const lockedPlaceholder = document.createElement('div');
		lockedPlaceholder.id = 'locked-' + categoryName.replace(/\s+/g, '-');
		if (isJob || (isItem && categoryName === 'Properties')) {
			lockedPlaceholder.className = 'ui-card locked-card hiddenTask';
			lockedPlaceholder.innerHTML = `
        <div class="locked-icon">🔒</div>
        <div class="locked-text"></div>
      `;
		} else {
			lockedPlaceholder.className = 'ui-row locked-row hiddenTask';
			lockedPlaceholder.innerHTML = `
        <div class="locked-icon">🔒</div>
        <div class="row-info">
          <div class="locked-text"></div>
        </div>
      `;
		}
		contentDiv.appendChild(lockedPlaceholder);
		
		container.appendChild(categoryDiv);
		
		if (isItem && categoryName === 'Properties') {
			const freeItemsDiv = document.createElement('div');
			freeItemsDiv.className = 'category-section';
			
			// Dynamically generate Cheat Items (Potions) using JSON data
			const headerHTML = `
        <div class="category-header" style="margin-top: 25px;">Cheat Items</div>
      `;
			const contentDivPotions = document.createElement('div');
			contentDivPotions.className = 'category-content list';
			
			if (typeof potionsBaseData !== 'undefined') {
				for (const key in potionsBaseData) {
					const potion = potionsBaseData[key];
					const row = document.createElement('div');
					row.className = 'ui-row';
					row.style.cursor = 'default';
					
					const imgSrc = `img/${potion.filefolder}256/${potion.filename.replace('.png', '.jpg')}`;
					
					row.innerHTML = `
            <img src="${imgSrc}" class="row-image" alt="${potion.name}" data-name="${potion.name}" data-type="potion" style="cursor: pointer; object-fit: cover;" onclick="showModal(this)">
            <div class="row-info">
              <div class="row-title">${potion.name}</div>
              <div class="row-value">x${potion.effect.toFixed(1)} ${potion.type === 'inspiration' ? 'Inspiration' : 'Game Speed'}</div>
            </div>
            <div class="potion-action" id="action-${potion.type}" style="width: 80px; text-align: right; flex-shrink: 0;">
              <button class="btn" onclick="drinkPotion('${potion.type}')">Drink</button>
            </div>
          `;
					contentDivPotions.appendChild(row);
				}
			}
			
			freeItemsDiv.innerHTML = headerHTML;
			freeItemsDiv.appendChild(contentDivPotions);
			container.appendChild(freeItemsDiv);
		}
	}
}

// Function to dynamically generate the Life Experiences UI
function initLifeExperiencesUI () {
	const container = document.getElementById('lifeExperiencesContainer');
	if (!container) return;
	container.innerHTML = '';
	
	if (typeof lifeExperiencesBaseData !== 'undefined') {
		for (const key in lifeExperiencesBaseData) {
			const exp = lifeExperiencesBaseData[key];
			const div = document.createElement('div');
			div.style.textAlign = 'center';
			div.style.flex = '1';
			div.style.minWidth = '80px';
			
			const imgSrc = `img/${exp.filefolder}256/${exp.filename.replace('.png', '.jpg')}`;
			
			div.innerHTML = `
        <img src="${imgSrc}" alt="${exp.name}" data-name="${exp.name}" data-type="experience" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%; margin-bottom: 5px; cursor: pointer;" onclick="showModal(this)">
        <div style="font-size: 0.85em; font-weight: bold; color: #666;">${exp.name}</div>
        <div id="exp${exp.name}Display" style="color: #b8860b; font-weight: bold;">0</div>
      `;
			container.appendChild(div);
		}
	}
}

// Populate the genre selection buttons
function populateGenres () {
	const container = document.getElementById('genreButtonsContainer');
	if (!container) return;
	container.innerHTML = '';
	
	if (typeof genresBaseData !== 'undefined') {
		let firstGenre = null;
		for (const genre in genresBaseData) {
			if (!firstGenre) firstGenre = genre;
			
			const btn = document.createElement('button');
			btn.className = 'btn';
			if (gameData.selectedGenre === genre) {
				btn.classList.add('btn-active');
			}
			btn.textContent = genre;
			btn.onclick = function () {
				selectGenre(genre);
			};
			container.appendChild(btn);
		}
		
		// Set a default if none selected
		if (!gameData.selectedGenre && firstGenre) {
			gameData.selectedGenre = firstGenre;
			populateGenres(); // Re-render to show active state
		}
	}
}

// Handle genre selection
function selectGenre (genre) {
	gameData.selectedGenre = genre;
	populateGenres(); // Update active button classes
	if (typeof updateUI === 'function') updateUI(); // Refresh expected quality
}

// Build the manual writing scene buttons dynamically based on the current genre
function buildSceneButtons() {
	const container = document.getElementById('sceneButtonsContainer');
	if (!container || typeof sceneTypesBaseData === 'undefined') return;
	container.innerHTML = '';
	
	// Determine current genre to pull appropriate scene types
	let currentGenre = "Romance";
	if (gameData.currentBook && booksBaseData && booksBaseData[gameData.currentBook]) {
		currentGenre = booksBaseData[gameData.currentBook].genre;
	} else if (gameData.selectedGenre) {
		currentGenre = gameData.selectedGenre;
	}
	
	// Pull all available scenes for the current genre, allowing the player to make mistakes
	let availableScenes = sceneTypesBaseData[currentGenre];
	if (!availableScenes) return;
	
	for (let sceneType in availableScenes) {
		let btn = document.createElement('button');
		btn.className = 'btn scene-btn';
		
		// Modified: Create text node for the scene name
		btn.appendChild(document.createTextNode(sceneType + " "));
		
		// Added: Create a dedicated span for the percentage so it can be updated independently
		let pctSpan = document.createElement('span');
		pctSpan.className = 'scene-pct';
		pctSpan.dataset.scene = sceneType;
		pctSpan.textContent = '(0.0%)';
		pctSpan.style.fontSize = '0.85em';
		pctSpan.style.opacity = '0.7'; // Subdue the text slightly so it blends well in light/dark mode
		
		btn.appendChild(pctSpan);
		
		// Mouse events
		btn.addEventListener('mousedown', () => handleSceneHoldStart(sceneType));
		btn.addEventListener('mouseup', () => handleSceneHoldEnd());
		btn.addEventListener('mouseleave', () => handleSceneHoldEnd());
		
		// Touch events for mobile
		btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleSceneHoldStart(sceneType); });
		btn.addEventListener('touchend', (e) => { e.preventDefault(); handleSceneHoldEnd(); });
		
		// Click event (3 seconds progress)
		btn.addEventListener('click', () => handleSceneClick(sceneType));
		
		container.appendChild(btn);
	}
}
