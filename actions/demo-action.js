export const createDemoAction = (BaseAction) =>
    class DemoAction extends BaseAction {
        constructor(payload = {}) {
            super(payload);
        }

        execute(gameEngine, postExecutionCallback) {
            this.emitEvent(gameEngine?.eventBus, 'demoActionExecuted', gameEngine);
            postExecutionCallback?.();
            return { success: true, message: 'Demo action executed' };
        }

        validate() {
            return { valid: true, errors: [] };
        }

        static type = 'DEMO_ACTION';

        static getMetadata() {
            return {
                type: DemoAction.type,
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
