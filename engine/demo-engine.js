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
