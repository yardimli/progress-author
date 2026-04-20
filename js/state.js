// Global state variables for pausing and queuing modals
var isPaused = false;
var isInitialized = false;
var popupQueue = [];

// Define the current game version
const GAME_VERSION = "1.0.5";

var gameData = {
	version: GAME_VERSION,
	taskData: {},
	itemData: {},
	coins: 0,
	days: 365 * 20,
	fame: 0,
	timeWarpingEnabled: true,
	rebirthOneCount: 0,
	rebirthTwoCount: 0,
	currentJob: null,
	currentSkill: null,
	currentProperty: null,
	currentMisc: null,
	
	workWritingBalance: 0,
	
	workMultiplier: 1,
	skillMultiplier: 1,
	writingMultiplier: 1,
	
	workXpMultiplier: 0.4,
	skillXpMultiplier: 0.4,
	writingXpMultiplier: 0.4,
	
	potions: {
		inspiration: 0,
		acceleration: 0
	},
	
	unlocks: {
		shop: false,
		skills: false,
		writing: false
	},
	
	wordsWritten: 0,
	booksPublished: 0,
	royalties: 0,
	loggedDeath: false,
	
	currentAuthor: null,
	currentBook: null,
	completedBooks: [],
	currentBookComposition: {},
	selectedGenre: null,
	
	introSeen: false,
	
	rebirthOnePrompted: false,
	rebirthTwoPrompted: false,
	
	earnedBadges: [],
	
	// Added: Data for author profile modal
	monthlyChartData: [], // Stores monthly data points for the chart
	logHistory: [] // Stores all log messages
};

var tempData = {
	// Added: Temporary tracker for monthly chart data
	monthlyTracker: {
		lastDayChecked: 365 * 20,
		income: 0,
		expense: 0,
		royalties: 0,
		wordsWritten: 0,
		booksPublished: 0,
		inspirationSum: 0,
		inspirationCount: 0,
		qualitySum: 0,
		qualityCount: 0
	}
};

// Constants
const baseLifespan = 365 * 70;
const baseGameSpeed = 4;
const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"];

// Variables for requestAnimationFrame loop
var lastTime = performance.now();
var deltaTime = 0;
var saveTimer = 0;
var textUpdateTimer = 0;

// JSON Data containers
var jobBaseData, skillBaseData, itemBaseData, jobCategories, skillCategories, itemCategories, headerRowColors, tooltips;
var authorsBaseData, booksBaseData, potionsBaseData, lifeExperiencesBaseData, genresBaseData, sceneTypesBaseData, genreIdealsBaseData, booksFirstPageBaseData, introSlidesBaseData;
var badgeBaseData;

// Track current intro slide index
var currentIntroSlide = 0;

// Modified: Manual & Automatic Writing State
var currentAutoSceneType = null;
var nextSceneType = "Action";
var isHoldingSceneButton = false;
var currentTypewriterSentence = "";
var typewriterIndex = 0;
var typewriterText = "";
var isLiveCorrecting = false;
var liveTypingDelay = 0;
var isWaitingToClearLine = false;
var isClearingLine = false;
var currentTypingSceneType = null;
