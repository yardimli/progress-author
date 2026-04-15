// Global variables, gameData, constants

var gameData = {
	taskData: {},
	itemData: {},
	coins: 0,
	days: 365 * 18, // Starts at 18
	fame: 0,
	timeWarpingEnabled: true,
	rebirthOneCount: 0,
	rebirthTwoCount: 0,
	currentJob: null,
	currentSkill: null,
	currentProperty: null,
	currentMisc: null,
	
	// Track the work vs writing balance (0 = 100% work, 100 = 100% writing)
	workWritingBalance: 0,
	
	// MODIFIED: Multipliers for work, skill, and writing (1 is default)
	workMultiplier: 1,
	skillMultiplier: 1,
	writingMultiplier: 1,
	
	// NEW: XP gain multipliers for each category to adjust leveling speed independently
	workXpMultiplier: 0.4,
	skillXpMultiplier: 0.4,
	writingXpMultiplier: 0.4,
	
	// Potions state
	potions: {
		inspiration: 0,
		acceleration: 0
	},
	
	// Writing Process variables
	wordsWritten: 0,
	booksPublished: 0,
	royalties: 0,
	loggedDeath: false,
	
	// Author and Book properties
	currentAuthor: null,
	currentBook: null,
	completedBooks: [],
	
	// Track if the player has seen the intro tutorial
	introSeen: false
};

var tempData = {};

// DOM Elements
var jobTabButton = document.getElementById("jobTabButton");

// Constants
const baseLifespan = 365 * 70;
const baseGameSpeed = 4;
const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"];

// Variables for requestAnimationFrame loop
var lastTime = performance.now();
var deltaTime = 0;
var saveTimer = 0;

// JSON Data containers
var jobBaseData, skillBaseData, itemBaseData, jobCategories, skillCategories, itemCategories, headerRowColors, tooltips;
var authorsBaseData, booksBaseData;
