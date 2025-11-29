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
            this.emitEvent(context?.eventBus, 'demoTriggerChecked', {
                space: context?.space,
                gameState: context?.gameState
            });
            return Boolean(this.payload?.always ?? true);
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
            this.enact(gameEngine);
        }

        enact(gameEngine) {
            gameEngine?.emitEvent?.('demoEffectApplied', { effectId: this.id });
            this.markForRemoval();
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

const createDemoEngine = (BaseGameEngine) =>
    class DemoGameEngine extends BaseGameEngine {
        constructor(dependencies, config = {}) {
            super(dependencies, config);
            this.demoMessages = [];
        }

        init() {
            this.initialized = true;
            this.emitEvent('demoEngineInit');
        }

        updateGameState(gameState) {
            this.gameState = gameState;
            this.emitEvent('demoGameStateUpdated', { counter: gameState.demoCounter });
        }

        async onPlayerAction(playerId, actionType, actionData) {
            this.demoMessages.push({ playerId, actionType, actionData });
            this.emitEvent('demoPlayerAction', { playerId, actionType, actionData });
            return { success: true, stored: this.demoMessages.length };
        }

        cleanup() {
            this.demoMessages = [];
            this.running = false;
            this.initialized = false;
        }

        getEngineType() {
            return 'demo-engine';
        }

        getRequiredUIComponents() {
            return [{
                id: 'demo-ui',
                type: 'demo-ui',
                required: false,
                description: 'Simple demo UI component',
                config: { label: 'Demo UI' },
                events: { emits: ['demoClick'], listens: [] }
            }];
        }

        getOptionalUIComponents() {
            return [];
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

var version = "1.0.0";
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
        "description": "Minimal board packaged with the example plugin",
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
        "minPlayers": 2,
        "maxPlayers": 4
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
                    "position": { "x": 200, "y": 200 },
                    "visual": { "size": 60, "color": "#ddeeff", "textColor": "#000000" },
                    "connections": [],
                    "triggers": []
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
        MapStorageManager,
        createMapProvider
    } = bundle;

    const DemoAction = createDemoAction(BaseAction);
    const DemoTrigger = createDemoTrigger(BaseTrigger);
    const DemoEffect = createDemoEffect(PlayerEffect);
    const DemoStat = createDemoStat(BaseStat);
    const DemoGameState = createDemoState(BaseGameState);
    const DemoGameEngine = createDemoEngine(BaseGameEngine);
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
            const providerFactory = createMapProvider
                ? () => createMapProvider(PLUGIN_ID)
                : PluginMapProvider
                    ? () => new PluginMapProvider(PLUGIN_ID, MapStorageManager || null)
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
