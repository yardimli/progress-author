// Global state variables for pausing and queuing modals
var isPaused = false;
var isInitialized = false;
var popupQueue = [];
// Explicit local opt-in; public games never expose the level editor.
var isDebugMode = /^(localhost|.*\.localhost|127(?:\.\d{1,3}){3}|\[?::1\]?)$/i.test(window.location?.hostname || '') &&
    /(?:^|[?&])debug=1(?:&|$)/.test(window.location?.search || '');

// Define the current game version
const GAME_VERSION = "1.1.0";

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
	currentTransportation: null, // Added new state for Transportation
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
	
	// The 'unlocks' object now tracks all unlockable entities.
	unlocks: {},
	activePlaySeconds: 0,
	nextCardUnlockAt: 0,
	accelerationUnlocked: false,
	
	wordsWritten: 0,
	booksPublished: 0,
	royalties: 0,
	royaltyBalanceVersion: 0,
	loggedDeath: false,
	
	currentAuthor: null,
	currentBook: null,
	completedBooks: [],
	currentBookComposition: {},
	selectedGenre: null,
	activeScene: null,
	notifications: [],
	lastProgressAt: null,
	offlineEligible: false,
	ownedItems: [],
	purchaseVersion: 1,
	manuscript: null,
	draftPlan: null,
	queueRemaining: 0,
	queueGenre: null,
	
	introSeen: false,
	
	rebirthOnePrompted: false,
	rebirthTwoPrompted: false,
	
	earnedBadges: [],
	
	// Data for author profile modal
	monthlyChartData: [], // Stores monthly data points for the chart
	journalFinance: [],
	journalShowIncome: true,
	journalShowExpenses: true,
	logHistory: [] // Stores all log messages
};

var tempData = {
	// Temporary tracker for monthly chart data
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
// Three game days per second: about 101 minutes for a baseline lifetime.
const baseGameSpeed = 3;
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
