export const createDemoEffect = (PlayerEffect) =>
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
