// Global variables, gameData, constants

var gameData = {
	taskData: {},
	itemData: {},
	coins: 0,
	days: 365 * 18, // Starts at 18
	fame: 0,
	// MODIFIED: Removed speedMultiplier and paused
	timeWarpingEnabled: true,
	rebirthOneCount: 0,
	rebirthTwoCount: 0,
	currentJob: null,
	currentSkill: null,
	currentProperty: null,
	currentMisc: null,
	
	// NEW: Potions state
	potions: {
		inspiration: 0,
		acceleration: 0
	},
	
	// Writing Process variables
	wordsWritten: 0,
	booksPublished: 0,
	royalties: 0,
	loggedDeath: false,
	
	// New Author and Book properties
	currentAuthor: null,
	currentBook: null,
	completedBooks: []
};

var tempData = {};
// MODIFIED: Removed skillWithLowestMaxXp

// DOM Elements
// MODIFIED: Removed autoPromoteElement and autoLearnElement
var jobTabButton = document.getElementById("jobTabButton");

// Constants
const baseLifespan = 365 * 70;
const baseGameSpeed = 4;
// MODIFIED: Removed "Automation" from permanent unlocks
const permanentUnlocks = ["Shop", "Quick task display"];
const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"];

// Variables for requestAnimationFrame loop
var lastTime = performance.now();
var deltaTime = 0;
var saveTimer = 0;
// MODIFIED: Removed skillTimer

// JSON Data containers
var jobBaseData, skillBaseData, itemBaseData, jobCategories, skillCategories, itemCategories, headerRowColors, tooltips;
var authorsBaseData, booksBaseData; // Added for new Author and Book data
