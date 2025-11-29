# Example Everything Plugin

A standalone demonstration plugin for the Board Game project that shows every extension point in one place. Built and hosted independently (like the Trouble plugin).

## Usage

Load via CDN in the Board Game plugin manager:

[CDN Link (v1.0.7)](https://cdn.jsdelivr.net/gh/customjack/board_game_plugin_example@v1.0.7/dist/plugins/example-plugin.js)

```
https://cdn.jsdelivr.net/gh/customjack/board_game_plugin_example@v1.0.7/dist/plugins/example-plugin.js
```

This registers the plugin and its bundled demo map when loaded.

Sample requirements block for a board/map:
```json
{
  "id": "example-everything-plugin",
  "version": "^1.0.0",
  "source": "remote",
  "cdn": "https://cdn.jsdelivr.net/gh/customjack/board_game_plugin_example@v1.0.7/dist/plugins/example-plugin.js",
  "name": "Example Everything Plugin",
  "description": "Registers dummy implementations for every extension point"
}
```

## What It Registers
- **Game bits:** `demo-state`, `demo-engine`, demo piece manager, phase state machine, turn manager, event processor.
- **Factories:** demo action, trigger, effect, stat, UI controller, UI component, animation.
- **Placeholders:** `{{DEMO_PHRASE}}`, `{{DEMO_COUNTER}}`.
- **Event handler hook:** listens for `demo:ping` and routes to the demo action.
- **Map:** bundled demo board via `createMapProvider`/`PluginMapProvider` (auto-registered on load).

## Build Instructions (independent package)
From `plugins/example/`:
```bash
npm install
npm run build   # emits dist/plugins/example-plugin.js
# npm run watch # optional dev mode
```

## Local Testing
From repo root:
```bash
npm run cdn:start
```
Then load `http://localhost:8080/plugins/example-plugin.js` in the plugin manager or map requirements.

## Metadata
- Plugin ID: `example-everything-plugin`
- Version: `1.0.0` (managed in `package.json` and exposed via `version.js`)
