// Global state variables for pausing and queuing modals
var isPaused = false;
var isInitialized = false;
var popupQueue = [];

// Define the current game version
const GAME_VERSION = "1.0.3";

var gameData = {
	version: GAME_VERSION, // Save the version in state
	taskData: {},
	itemData: {},
	coins: 0,
	days: 365 * 20, // Starts at 20
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
	
	// Multipliers for work, skill, and writing (1 is default)
	workMultiplier: 1,
	skillMultiplier: 1,
	writingMultiplier: 1,
	
	// XP gain multipliers for each category to adjust leveling speed independently
	workXpMultiplier: 0.4,
	skillXpMultiplier: 0.4,
	writingXpMultiplier: 0.4,
	
	// Potions state
	potions: {
		inspiration: 0,
		acceleration: 0
	},
	
	// Track unlocked features
	unlocks: {
		shop: false,
		skills: false,
		writing: false
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
	currentBookComposition: {}, // Tracks words written per scene type
	selectedGenre: null, // Track the currently selected genre for new books
	
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
var authorsBaseData, booksBaseData, potionsBaseData, lifeExperiencesBaseData, genresBaseData, sceneTypesBaseData, genreIdealsBaseData;

// Manual Writing State
var activeSceneType = null;
var pendingTypewriterChars = 0;
var currentTypewriterSentence = "";
var typewriterIndex = 0;
var typewriterText = "";
var lastSceneType = "Action";
var isLiveCorrecting = false; // Tracks if the typewriter is currently fixing a typo
var liveTypingDelay = 0;      // Timer for the next keystroke
