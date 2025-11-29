export const createDemoTrigger = (BaseTrigger) =>
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
