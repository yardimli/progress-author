// Global variables, gameData, constants

var gameData = {
	taskData: {},
	itemData: {},
	coins: 0,
	days: 365 * 18, // Starts at 18
	fame: 0,
	speedMultiplier: 1, // Added game speed multiplier
	paused: false,
	timeWarpingEnabled: true,
	rebirthOneCount: 0,
	rebirthTwoCount: 0,
	currentJob: null,
	currentSkill: null,
	currentProperty: null,
	currentMisc: null,
	
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
var skillWithLowestMaxXp = null;

// DOM Elements
var autoPromoteElement = document.getElementById("autoPromote");
var autoLearnElement = document.getElementById("autoLearn");
var jobTabButton = document.getElementById("jobTabButton");

// Constants
const baseLifespan = 365 * 70;
const baseGameSpeed = 4;
const permanentUnlocks = ["Shop", "Automation", "Quick task display"];
const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"];

// Variables for requestAnimationFrame loop
var lastTime = performance.now();
var deltaTime = 0;
var saveTimer = 0;
var skillTimer = 0;

// JSON Data containers
var jobBaseData, skillBaseData, itemBaseData, jobCategories, skillCategories, itemCategories, headerRowColors, tooltips;
var authorsBaseData, booksBaseData; // Added for new Author and Book data
