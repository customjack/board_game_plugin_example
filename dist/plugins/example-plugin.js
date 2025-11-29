const createDemoAction = (BaseAction) =>
    class DemoAction extends BaseAction {
        constructor(payload = {}) {
            super('DEMO_ACTION', payload);
        }

        execute(gameEngine, postExecutionCallback) {
            this.emitEvent(gameEngine?.eventBus, 'demoActionExecuted', gameEngine);
            postExecutionCallback?.();
            return { success: true, message: 'Demo action executed' };
        }

        validate() {
            return { valid: true, errors: [] };
        }

        static getMetadata() {
            return {
                type: 'DEMO_ACTION',
                displayName: 'Demo Action',
                description: 'Logs that the demo action ran.',
                payloadSchema: {
                    note: {
                        type: 'string',
                        required: false,
                        description: 'Optional note to log'
                    }
                },
                category: 'demo'
            };
        }
    };

const createDemoTrigger = (BaseTrigger) =>
    class DemoTrigger extends BaseTrigger {
        constructor(payload = {}) {
            super('DEMO_TRIGGER', payload);
        }

        isTriggered(context) {
            const { gameState, space, eventBus } = context;
            const targetSpaceId = this.payload?.spaceId || 'demo-trigger';
            
            // Only trigger when checking the target space
            if (space.id !== targetSpaceId) {
                return false;
            }

            const player = gameState.getCurrentPlayer();
            if (!player) {
                return false;
            }

            // Check if player is on this space
            const isOnSpace = player.currentSpaceId === space.id;
            
            // Check if player has no moves left (has actually landed)
            const noMovesLeft = !gameState.hasMovesLeft();

            // Only trigger when player has actually landed on the space
            const isTriggered = isOnSpace && noMovesLeft && Boolean(this.payload?.always ?? true);

            if (isTriggered) {
                this.emitEvent(eventBus, 'demoTriggerChecked', {
                    space: space,
                    gameState: gameState
                });
            }

            return isTriggered;
        }

        static getMetadata() {
            return {
                type: 'DEMO_TRIGGER',
                displayName: 'Demo Trigger',
                description: 'Always triggers (configurable).',
                category: 'demo',
                payloadSchema: {
                    always: {
                        type: 'boolean',
                        required: false,
                        default: true,
                        description: 'Return true by default'
                    }
                }
            };
        }
    };

const createDemoEffect = (PlayerEffect) =>
    class DemoEffect extends PlayerEffect {
        constructor(id = 'demo-effect', duration = 1) {
            super(id, duration, false);
        }

        apply(gameEngine) {
            // Attach to current player so it shows in UI
            const player = gameEngine?.gameState?.getCurrentPlayer?.();
            if (player && typeof player.addEffect === 'function') {
                const already = (player.effects || []).find(e => e.id === this.id);
                if (!already) {
                    player.addEffect(this);
                }
            }
            this.enact(gameEngine);
        }

        enact(gameEngine) {
            gameEngine?.emitEvent?.('demoEffectApplied', { effectId: this.id });
        }

        static getMetadata() {
            return {
                type: 'DemoEffect',
                displayName: 'Demo Effect',
                description: 'Marks itself for removal after firing once.',
                category: 'demo',
                payloadSchema: {
                    id: { type: 'string', required: false, description: 'Effect id' },
                    duration: { type: 'number', required: false, default: 1 }
                }
            };
        }
    };

const createDemoStat = (BaseStat) =>
    class DemoStat extends BaseStat {
        constructor(id = 'demo-stat', initialValue = 0, metadata = {}) {
            super(id, initialValue, metadata);
        }

        onChange(oldValue, newValue) {
            this.metadata.lastChange = { oldValue, newValue };
        }

        static getMetadata() {
            return {
                type: 'DemoStat',
                displayName: 'Demo Stat',
                description: 'Tracks a numeric counter for demonstration.',
                category: 'demo',
                defaultValue: 0,
                valueType: 'number'
            };
        }
    };

const createDemoState = (BaseGameState) =>
    class DemoGameState extends BaseGameState {
        constructor(options = {}) {
            super(options);
            this.demoCounter = options.demoCounter || 0;
        }

        getStateType() {
            return 'demo-state';
        }

        incrementDemoCounter() {
            this.demoCounter += 1;
            this.incrementVersion();
        }

        getDeltaFields() {
            return [...super.getDeltaFields(), 'demoCounter'];
        }

        toJSON() {
            return {
                ...super.toJSON(),
                demoCounter: this.demoCounter
            };
        }

        static fromJSON(json, factoryManager) {
            const state = super.fromJSON(json, factoryManager);
            state.demoCounter = json.demoCounter || 0;
            return state;
        }
    };

const createDemoEngine = (TurnBasedGameEngine, DemoStatClass) =>
    class DemoGameEngine extends TurnBasedGameEngine {
        constructor(dependencies, config = {}) {
            super(dependencies, { ...config, manualMoveChoice: true });
            this.demoMessages = [];
        }

        init() {
            super.init();
            this.ensureDemoStats();
            this.emitEvent('demoEngineInit');
        }

        updateGameState(gameState) {
            super.updateGameState(gameState);
            this.emitEvent('demoGameStateUpdated', { counter: gameState.demoCounter });
        }

        handleBeginTurn() {
            const currentPlayer = this.turnManager.getCurrentPlayer();
            
            // Check for finished players before starting their turn
            if (currentPlayer?.state === 'FINISHED') {
                console.log(`[DemoGameEngine] Skipping turn for finished player ${currentPlayer.nickname}`);
                
                // Check if all players are finished
                const allFinished = this.gameState.players.every(p => p.state === 'FINISHED');
                if (allFinished) {
                    // All players finished - end the game
                    console.log('[DemoGameEngine] All players have finished. Ending game.');
                    this.log('All players have finished the game.', { type: 'system' });
                    this.changePhase({ 
                        newGamePhase: this.gamePhases?.GAME_ENDED || 'GAME_ENDED', 
                        newTurnPhase: this.turnPhases?.CHANGE_TURN || 'CHANGE_TURN', 
                        delay: 0 
                    });
                    return;
                }
                
                // Skip this finished player - go directly to END_TURN
                // We'll handle the turn advancement in handleEndTurn
                this.gameState.setRemainingMoves(0);
                this.updateRemainingMoves(0);
                this.deactivateRollButton();
                this.stopTimer();
                // Go to END_TURN - handleEndTurn will advance to next player
                this.changePhase({ newTurnPhase: this.turnPhases?.END_TURN || 'END_TURN', delay: 0 });
                return;
            }

            // Call parent to handle normal turn start
            super.handleBeginTurn();
        }

        handleEndTurn() {
            const currentPlayer = this.turnManager.getCurrentPlayer();
            
            // If current player is finished, we need to advance the turn
            // (parent only advances on client turn, but we need to advance for finished players)
            if (currentPlayer?.state === 'FINISHED') {
                // Log the turn end
                this.logPlayerAction(currentPlayer, 'skipped turn (finished).', {
                    type: 'turn-end',
                    metadata: { reason: 'finished' }
                });
                
                // Advance to next player
                this.turnManager.nextTurn();
                
                // Check if all players are finished after advancing
                const allFinished = this.gameState.players.every(p => p.state === 'FINISHED');
                if (allFinished) {
                    // All players finished - end the game
                    console.log('[DemoGameEngine] All players have finished. Ending game.');
                    this.log('All players have finished the game.', { type: 'system' });
                    this.changePhase({ 
                        newGamePhase: this.gamePhases?.GAME_ENDED || 'GAME_ENDED', 
                        newTurnPhase: this.turnPhases?.CHANGE_TURN || 'CHANGE_TURN', 
                        delay: 0 
                    });
                    return;
                }
                
                // Move to next player's turn
                this.changePhase({ newTurnPhase: this.turnPhases?.CHANGE_TURN || 'CHANGE_TURN', delay: 0 });
                return;
            }

            // Call parent for normal turn end handling
            super.handleEndTurn();
        }

        handleWaitingForMove() {
            const currentPlayer = this.turnManager.getCurrentPlayer();
            
            // Defensive check - this shouldn't happen if handleBeginTurn works correctly
            if (currentPlayer?.state === 'FINISHED') {
                console.warn(`[DemoGameEngine] Finished player ${currentPlayer.nickname} reached WAITING_FOR_MOVE - this should not happen`);
                this.deactivateRollButton();
                // Immediately end turn
                this.changePhase({ newTurnPhase: this.turnPhases?.END_TURN || 'END_TURN', delay: 0 });
                return;
            }

            // Call parent to handle normal roll button activation
            super.handleWaitingForMove();
        }

        async handlePlayerRollDice(playerId, actionData) {
            const currentPlayer = this.turnManager.getCurrentPlayer();
            
            // Reject roll action if player is finished
            if (currentPlayer?.state === 'FINISHED') {
                return {
                    success: false,
                    error: 'Cannot roll dice: player has finished the game'
                };
            }

            // Call parent to handle normal roll
            return await super.handlePlayerRollDice(playerId, actionData);
        }

        rollDiceForCurrentPlayer() {
            const currentPlayer = this.turnManager.getCurrentPlayer();
            if (currentPlayer?.state === 'FINISHED') {
                // This should not be called for finished players, but handle it defensively
                console.warn(`[DemoGameEngine] rollDiceForCurrentPlayer called for finished player ${currentPlayer.nickname}`);
                this.deactivateRollButton();
                return null;
            }

            const input = window.prompt('Enter number of spaces to move (developer demo)', '1');
            const parsed = parseInt(input, 10);
            const result = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
            const name = currentPlayer?.nickname || 'Player';
            console.log(`[DemoGameEngine] ${name} chose to move ${result} space(s)`);
            this.logPlayerAction(currentPlayer, `chose to move ${result} space(s).`, {
                type: 'dice-roll',
                metadata: { result }
            });
            this.deactivateRollButton();
            return result;
        }

        handleAfterDiceRoll(rollResult) {
            if (rollResult === null || rollResult === undefined) {
                return;
            }
            super.handleAfterDiceRoll(rollResult);
        }

        async onPlayerAction(playerId, actionType, actionData) {
            this.demoMessages.push({ playerId, actionType, actionData });
            this.emitEvent('demoPlayerAction', { playerId, actionType, actionData });
            return { success: true, stored: this.demoMessages.length };
        }

        cleanup() {
            this.demoMessages = [];
            super.cleanup();
        }

        getEngineType() {
            return 'demo-engine';
        }

        getRequiredUIComponents() {
            // Use default TurnBased requirements (roll button, timer, etc.)
            return super.getRequiredUIComponents();
        }

        getOptionalUIComponents() {
            return super.getOptionalUIComponents();
        }

        ensureDemoStats() {
            if (!Array.isArray(this.gameState?.players) || !DemoStatClass) return;
            this.gameState.players.forEach((player) => {
                const existing = player.stats?.find?.(s => s.id === 'demo-stat');
                if (!existing && typeof player.addStat === 'function') {
                    try {
                        player.addStat(new DemoStatClass('demo-stat', 0));
                    } catch (e) {
                        console.warn('[DemoGameEngine] Failed to add demo-stat', e);
                    }
                }
            });
        }
    };

const createDemoPhaseStateMachine = (PhaseStateMachine, GamePhases, TurnPhases) =>
    class DemoPhaseStateMachine extends PhaseStateMachine {
        constructor(config = {}, eventBus = null) {
            super({
                gamePhases: config.gamePhases || Object.values(GamePhases),
                turnPhases: config.turnPhases || Object.values(TurnPhases)
            }, eventBus);
        }
    };

const createDemoTurnManager = () =>
    class DemoTurnManager {
        constructor(gameState, config = {}) {
            this.gameState = gameState;
            this.config = config;
        }

        getCurrentPlayer() {
            return this.gameState?.players?.[0] || null;
        }
    };

const createDemoEventProcessor = () =>
    class DemoEventProcessor {
        constructor(config = {}) {
            this.config = config;
        }

        process(event) {
            return { ...event, processed: true };
        }
    };

const createDemoUIController = () =>
    class DemoUIController {
        constructor(dependencies, config = {}) {
            this.dependencies = dependencies;
            this.config = config;
        }

        init() {
            // No-op demo initialization
        }
    };

const createDemoUIComponent = () =>
    class DemoUIComponent {
        constructor(config = {}) {
            this.config = config;
            this.renderCount = 0;
        }

        init() {
            this.renderCount++;
        }
    };

const createDemoAnimation = () =>
    class DemoAnimation {
        constructor(options = {}) {
            this.options = options;
        }

        animate() {
            return Promise.resolve({ complete: true, options: this.options });
        }
    };

const createDemoPieceManager = (BasePieceManager) =>
    class DemoPieceManager extends BasePieceManager {
        buildRenderablePieces() {
            return [];
        }
    };

/**
 * Demo Player States - Registration function for custom player states
 * 
 * This module registers custom player states used by the demo engine.
 * Player states extend beyond the built-in PlayerStates enum to allow
 * plugins to define game-specific states.
 */

/**
 * Register custom player states for the demo plugin
 * @param {Object} registryManager - The registry manager instance
 */
function registerDemoPlayerStates(registryManager) {
    const playerStateRegistry = registryManager?.getRegistry?.('playerStateRegistry');
    if (!playerStateRegistry) {
        console.warn('[DemoPlugin] PlayerStateRegistry not available');
        return;
    }

    // Register FINISHED state for the demo engine
    // This state is set when a player reaches the finish space
    playerStateRegistry.register('FINISHED', {
        displayName: 'Finished',
        description: 'Player has completed the game and reached the finish',
        category: 'demo'
    });

    console.log('[DemoPlugin] Registered custom player states');
}

var version = "1.1.0";
var pkg = {
	version: version};

const EXAMPLE_PLUGIN_VERSION = pkg.version;

const EXAMPLE_PLUGIN_CDN = (version = EXAMPLE_PLUGIN_VERSION) =>
    `https://cdn.jsdelivr.net/gh/customjack/board_game_plugin_example@v${version}/dist/plugins/example-plugin.js`;

const EXAMPLE_PLUGIN_REQUIREMENT = (version = EXAMPLE_PLUGIN_VERSION) => `^${version}`;

const demoBoard = {
    "$schema": "https://boardgame.example.com/schemas/game-v3.json",
    "version": EXAMPLE_PLUGIN_VERSION,
    "type": "game",
    "metadata": {
        "id": "demo-plugin-board",
        "name": "Demo Plugin Board",
        "author": "Plugin Example",
        "description": "Showcase board that exercises every demo component in the example plugin",
        "plugins": [
            {
                "id": "example-everything-plugin",
                "version": EXAMPLE_PLUGIN_REQUIREMENT(),
                "source": "plugin-bundled"
            }
        ]
    },
    "requirements": {
        "plugins": [
            {
                "id": "core",
                "version": "^1.0.0",
                "source": "builtin",
                "description": "Core game functionality"
            },
            {
                "id": "example-everything-plugin",
                "version": EXAMPLE_PLUGIN_REQUIREMENT(),
                "source": "remote",
                "cdn": EXAMPLE_PLUGIN_CDN(),
                "name": "Example Everything Plugin",
                "description": "Registers dummy implementations for every extension point"
            }
        ],
        "minPlayers": 1,
        "maxPlayers": 10
    },
    "engine": {
        "type": "demo-engine",
        "config": {}
    },
    "ui": {
        "layout": "standard-board",
        "components": []
    },
    "board": {
        "topology": {
            "spaces": [
                {
                    "id": "start",
                    "name": "Start",
                    "type": "start",
                    "position": { "x": 120, "y": 200 },
                    "visual": { "size": 60, "color": "#ddeeff", "textColor": "#000000" },
                    "connections": [
                        { "targetId": "demo-action", "draw": true }
                    ],
                    "triggers": [
                        {
                            "when": { "type": "ON_LAND" },
                            "action": {
                                "type": "PROMPT_CURRENT_PLAYER",
                                "payload": {
                                    "message": "Welcome to the demo board! Move along the path to see each component."
                                }
                            },
                            "priority": "LOW"
                        }
                    ]
                },
                {
                    "id": "demo-action",
                    "name": "Demo Action",
                    "type": "action",
                    "position": { "x": 260, "y": 200 },
                    "visual": { "size": 60, "color": "#e6f7ff", "textColor": "#000000" },
                    "connections": [
                        { "targetId": "demo-effect", "draw": true }
                    ],
                    "triggers": [
                        {
                            "when": { "type": "ON_LAND" },
                            "action": {
                                "type": "DEMO_ACTION",
                                "payload": {
                                    "note": "Demo action executed on landing."
                                }
                            },
                            "priority": "MID"
                        },
                        {
                            "when": { "type": "ON_LAND" },
                            "action": {
                                "type": "PROMPT_CURRENT_PLAYER",
                                "payload": {
                                    "message": "Demo Action space: fired the demo action."
                                }
                            },
                            "priority": "LOW"
                        }
                    ]
                },
                {
                    "id": "demo-effect",
                    "name": "Demo Effect",
                    "type": "action",
                    "position": { "x": 400, "y": 200 },
                    "visual": { "size": 60, "color": "#fff7e6", "textColor": "#000000" },
                    "connections": [
                        { "targetId": "demo-stat", "draw": true }
                    ],
                    "triggers": [
                        {
                            "when": { "type": "ON_LAND" },
                            "action": {
                                "type": "APPLY_EFFECT",
                                "payload": {
                                    "effect": {
                                        "type": "DemoEffect",
                                        "args": [
                                            { "id": "demo-effect-1" },
                                            { "duration": 1 },
                                            { "toRemove": false }
                                        ]
                                    }
                                }
                            },
                            "priority": "MID"
                        },
                        {
                            "when": { "type": "ON_LAND" },
                            "action": {
                                "type": "PROMPT_CURRENT_PLAYER",
                                "payload": {
                                    "message": "Demo Effect space: applied DemoEffect to your player."
                                }
                            },
                            "priority": "LOW"
                        }
                    ]
                },
                {
                    "id": "demo-stat",
                    "name": "Demo Stat",
                    "type": "action",
                    "position": { "x": 540, "y": 200 },
                    "visual": { "size": 60, "color": "#f0e6ff", "textColor": "#000000" },
                    "connections": [
                        { "targetId": "demo-trigger", "draw": true }
                    ],
                    "triggers": [
                        {
                            "when": { "type": "ON_LAND" },
                            "action": {
                                "type": "SET_STAT",
                                "payload": {
                                    "statId": "demo-stat",
                                    "value": 42,
                                    "mode": "both"
                                }
                            },
                            "priority": "MID"
                        },
                        {
                            "when": { "type": "ON_LAND" },
                            "action": {
                                "type": "PROMPT_CURRENT_PLAYER",
                                "payload": {
                                    "message": "Demo Stat space: set demo-stat to 42. Check Player Info > Activity."
                                }
                            },
                            "priority": "LOW"
                        }
                    ]
                },
                {
                    "id": "demo-trigger",
                    "name": "Demo Trigger",
                    "type": "action",
                    "position": { "x": 680, "y": 200 },
                    "visual": { "size": 60, "color": "#e6ffe6", "textColor": "#000000" },
                    "connections": [
                        { "targetId": "finish", "draw": true }
                    ],
                    "triggers": [
                        {
                            "when": { "type": "DEMO_TRIGGER", "payload": { "always": true, "spaceId": "demo-trigger" } },
                            "action": {
                                "type": "PROMPT_CURRENT_PLAYER",
                                "payload": {
                                    "message": "Demo trigger fired! Stat demo-stat was set earlier on this path. Check Player Info to see it."
                                }
                            },
                            "priority": "MID"
                        },
                        {
                            "when": { "type": "ON_LAND" },
                            "action": {
                                "type": "PROMPT_CURRENT_PLAYER",
                                "payload": {
                                    "message": "Demo Trigger space: ran custom trigger and prompt."
                                }
                            },
                            "priority": "LOW"
                        }
                    ]
                },
                {
                    "id": "finish",
                    "name": "Finish",
                    "type": "end",
                    "position": { "x": 820, "y": 200 },
                    "visual": { "size": 60, "color": "#d9f7be", "textColor": "#000000" },
                    "connections": [],
                    "triggers": [
                        {
                            "when": { "type": "ON_LAND" },
                            "action": {
                                "type": "SET_PLAYER_STATE",
                                "payload": {
                                    "state": "FINISHED"
                                }
                            },
                            "priority": "MID"
                        },
                        {
                            "when": { "type": "ON_LAND" },
                            "action": {
                                "type": "PROMPT_CURRENT_PLAYER",
                                "payload": {
                                    "message": "You reached the finish! Your state is now FINISHED."
                                }
                            },
                            "priority": "LOW"
                        },
                        {
                            "when": { "type": "ON_LAND" },
                            "action": {
                                "type": "PROMPT_CURRENT_PLAYER",
                                "payload": {
                                    "message": "Finish space: game end state applied."
                                }
                            },
                            "priority": "LOW"
                        }
                    ]
                }
            ]
        }
    }
};

/**
 * Example Everything Plugin - Entry point for CDN loading
 *
 * Demonstrates registering every supported extension point. The plugin is
 * self-contained and built via the local rollup config for CDN hosting.
 */


const PLUGIN_ID = 'example-everything-plugin';

/**
 * Factory function that receives dependencies and returns the plugin class
 * @param {Object} bundle - Dependency injection bundle from host
 * @returns {Class} Example plugin class
 */
function createExampleEverythingPlugin(bundle) {
    const {
        Plugin,
        BaseAction,
        BaseTrigger,
        PlayerEffect,
        BaseStat,
        BaseGameEngine,
        BaseGameState,
        BasePieceManager,
        GameEngineFactory,
        GameStateFactory,
        PhaseStateMachine,
        TurnPhases,
        GamePhases,
        PluginMapProvider,
        MapStorageManager
    } = bundle;

    const DemoAction = createDemoAction(BaseAction);
    const DemoTrigger = createDemoTrigger(BaseTrigger);
    const DemoEffect = createDemoEffect(PlayerEffect);
    const DemoStat = createDemoStat(BaseStat);
    const DemoGameState = createDemoState(BaseGameState);
    const DemoGameEngine = createDemoEngine(bundle.TurnBasedGameEngine || BaseGameEngine, DemoStat);
    const DemoPhaseStateMachine = createDemoPhaseStateMachine(PhaseStateMachine, GamePhases, TurnPhases);
    const DemoTurnManager = createDemoTurnManager();
    const DemoEventProcessor = createDemoEventProcessor();
    const DemoUIController = createDemoUIController();
    const DemoUIComponent = createDemoUIComponent();
    const DemoAnimation = createDemoAnimation();
    const DemoPieceManager = createDemoPieceManager(BasePieceManager);

    return class ExamplePlugin extends Plugin {
        initialize(eventBus, registryManager, factoryManager) {
            this.eventBus = eventBus;
            this.registryManager = registryManager;
            this.factoryManager = factoryManager;
            this.placeholderKeys = [];

            this.registerGameBits();
            this.registerFactories();
            this.registerPlaceholders();
            this.registerMap();
        }

        registerGameBits() {
            if (!GameStateFactory.isRegistered('demo-state')) {
                GameStateFactory.register('demo-state', DemoGameState);
            }
            if (!GameEngineFactory.isRegistered('demo-engine')) {
                GameEngineFactory.register('demo-engine', DemoGameEngine);
            }

            const pieceRegistry = this.registryManager.getPieceManagerRegistry?.();
            if (pieceRegistry && !pieceRegistry.get?.('demo-piece-manager')) {
                pieceRegistry.register('demo-piece-manager', DemoPieceManager);
            }

            // Register custom player states
            registerDemoPlayerStates(this.registryManager);
        }

        registerFactories() {
            const phaseFactory = this.factoryManager.getFactory('PhaseStateMachineFactory');
            phaseFactory?.register?.('demo-phase-machine', DemoPhaseStateMachine);

            const turnFactory = this.factoryManager.getFactory('TurnManagerFactory');
            turnFactory?.register?.('demo-turn-manager', DemoTurnManager);

            const eventProcessorFactory = this.factoryManager.getFactory('EventProcessorFactory');
            eventProcessorFactory?.register?.('demo-event-processor', DemoEventProcessor);

            const uiControllerFactory = this.factoryManager.getFactory('UIControllerFactory');
            uiControllerFactory?.register?.('demo-ui-controller', DemoUIController);

            const uiComponentFactory = this.factoryManager.getFactory('UIComponentFactory');
            uiComponentFactory?.register?.('demo-ui', DemoUIComponent);

            const animationFactory = this.factoryManager.getFactory('AnimationFactory');
            animationFactory?.register?.('demo-animation', DemoAnimation, {
                displayName: 'Demo Animation',
                description: 'Resolves immediately for testing',
                category: 'demo',
                duration: 'instant'
            });

            const actionFactory = this.factoryManager.getFactory('ActionFactory');
            actionFactory?.register?.('DEMO_ACTION', DemoAction);

            const triggerFactory = this.factoryManager.getFactory('TriggerFactory');
            triggerFactory?.register?.('DEMO_TRIGGER', DemoTrigger);

            const effectFactory = this.factoryManager.getFactory('EffectFactory');
            effectFactory?.register?.('DemoEffect', DemoEffect);

            const statFactory = this.factoryManager.getFactory('StatFactory');
            statFactory?.register?.('DemoStat', DemoStat);
        }

        registerPlaceholders() {
            const placeholderRegistry = this.registryManager.getRegistry?.('placeholderRegistry');
            if (!placeholderRegistry) return;

            placeholderRegistry.register('DEMO_PHRASE', () => 'Hello from the plugin!');
            this.placeholderKeys.push('DEMO_PHRASE');

            placeholderRegistry.register('DEMO_COUNTER', (_min = 0, _max = 10, context = {}) => {
                const counter = context?.gameState?.demoCounter ?? 0;
                return `Demo counter is ${counter}`;
            });
            this.placeholderKeys.push('DEMO_COUNTER');
        }

        registerMap() {
            const providerFactory = bundle.createMapProvider
                ? () => bundle.createMapProvider(PLUGIN_ID)
                : PluginMapProvider
                    ? () => new PluginMapProvider(PLUGIN_ID, MapStorageManager || bundle.MapStorageManager || null)
                    : null;

            if (!providerFactory) {
                console.warn('[ExamplePlugin] Map provider unavailable in bundle');
                return;
            }

            try {
                this.mapProvider = providerFactory();
                this.mapProvider.registerMap(demoBoard, {
                    id: demoBoard.metadata.id,
                    name: demoBoard.metadata.name,
                    description: demoBoard.metadata.description
                });
            } catch (error) {
                console.warn('[ExamplePlugin] Failed to register demo map', error);
            }
        }

        setEventHandler(eventHandler) {
            super.setEventHandler(eventHandler);
            if (eventHandler?.registerPluginEventHandler) {
                eventHandler.registerPluginEventHandler('demo:ping', ({ playerId }) => {
                    eventHandler.handlePlayerAction({
                        playerId,
                        actionType: 'DEMO_ACTION',
                        actionData: { note: 'ping from plugin' }
                    });
                });
            }
        }

        cleanup() {
            const placeholderRegistry = this.registryManager.getRegistry?.('placeholderRegistry');
            this.placeholderKeys.forEach((key) => {
                placeholderRegistry?.unregister?.(key);
            });
            this.placeholderKeys = [];
            this.mapProvider?.unregisterAllMaps();
            this.mapProvider = null;
        }

        static getPluginMetadata() {
            return {
                id: PLUGIN_ID,
                name: 'Example Everything Plugin',
                version: EXAMPLE_PLUGIN_VERSION,
                description: 'Registers dummy implementations for every extension point.',
                author: 'Example',
                tags: ['example', 'demo', 'plugin'],
                isDefault: false,
                dependencies: ['core'],
                provides: {
                    actions: ['DEMO_ACTION'],
                    triggers: ['DEMO_TRIGGER'],
                    effects: ['DemoEffect'],
                    components: [
                        'demo-engine',
                        'demo-state',
                        'demo-phase-machine',
                        'demo-turn-manager',
                        'demo-event-processor',
                        'demo-ui-controller',
                        'demo-ui',
                        'demo-animation',
                        'demo-stat',
                        'demo-map'
                    ]
                }
            };
        }
    };
}

export { createExampleEverythingPlugin as default };
//# sourceMappingURL=example-plugin.js.map
