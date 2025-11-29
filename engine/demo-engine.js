export const createDemoEngine = (TurnBasedGameEngine, DemoStatClass) =>
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

        rollDiceForCurrentPlayer() {
            const currentPlayer = this.turnManager.getCurrentPlayer();
            if (currentPlayer?.state === 'FINISHED') {
                // Skip finished players and advance turn
                this.gameState.setRemainingMoves(0);
                this.updateRemainingMoves(0);
                this.gameState.nextPlayerTurn();

                const allFinished = this.gameState.players.every(p => p.state === 'FINISHED');
                if (!allFinished) {
                    this.changePhase({ newTurnPhase: this.turnPhases?.BEGIN_TURN || 'BEGIN_TURN', delay: 0 });
                } else {
                    this.changePhase({ newTurnPhase: this.turnPhases?.END_TURN || 'END_TURN', delay: 0 });
                }
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
