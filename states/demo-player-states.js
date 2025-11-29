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
export function registerDemoPlayerStates(registryManager) {
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

