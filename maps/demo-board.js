import { EXAMPLE_PLUGIN_VERSION, EXAMPLE_PLUGIN_CDN, EXAMPLE_PLUGIN_REQUIREMENT } from '../version.js';

export const demoBoard = {
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
                            "when": { "type": "DEMO_TRIGGER", "payload": { "always": true } },
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
