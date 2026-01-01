import boardManifest from './demo-board/board.json';
import metadataJson from './demo-board/metadata.json';
import engineJson from './demo-board/engine.json';
import rulesJson from './demo-board/rules.json';
import uiJson from './demo-board/ui.json';
import topologyJson from './demo-board/topology.json';
import dependenciesJson from './demo-board/dependencies.json';
import { EXAMPLE_PLUGIN_VERSION, EXAMPLE_PLUGIN_CDN, EXAMPLE_PLUGIN_REQUIREMENT } from '../version.js';
import spaceImage from './demo-board/assets/space.png';
import previewImage from './demo-board/preview.png';

// Rollup + @rollup/plugin-url will emit these assets into dist/plugins/assets and rewrite
// them to absolute URLs using import.meta.url in the bundle.
const resolvedSpaceImage = new URL(spaceImage, import.meta.url).href;
const resolvedPreviewImage = new URL(previewImage, import.meta.url).href;

// Rebuild the monolithic board object from the modular bundle files
// Note: mark as plugin-bundled so the host doesn't try to resolve Node-style deps from a remote build
const pluginRequirement = {
    id: 'example-everything-plugin',
    version: EXAMPLE_PLUGIN_REQUIREMENT(),
    source: 'plugin-bundled',
    cdn: EXAMPLE_PLUGIN_CDN(),
    name: 'Example Everything Plugin',
    description: 'Registers dummy implementations for every extension point'
};

const dependencies = {
    ...dependenciesJson,
    plugins: (dependenciesJson.plugins || []).map((dep) =>
        dep.id === pluginRequirement.id ? { ...dep, ...pluginRequirement } : dep
    )
};

const metadata = {
    ...metadataJson,
    id: metadataJson.id || boardManifest.id,
    version: EXAMPLE_PLUGIN_VERSION,
    plugins: metadataJson.plugins || [
        { id: pluginRequirement.id, version: EXAMPLE_PLUGIN_REQUIREMENT(), source: 'plugin-bundled' }
    ],
    thumbnail: metadataJson.thumbnail || resolvedPreviewImage
};

const topologyWithImages = {
    ...topologyJson,
    spaces: (topologyJson.spaces || []).map((space) => ({
        ...space,
        visual: {
            ...space.visual,
            image: resolvedSpaceImage
        }
    }))
};

export const demoBoard = {
    $schema: 'https://boardgame.example.com/schemas/game-v3.json',
    version: metadata.version,
    type: 'game',
    metadata,
    requirements: {
        plugins: dependencies.plugins || [],
        minPlayers: dependencies.minPlayers,
        maxPlayers: dependencies.maxPlayers
    },
    engine: {
        type: engineJson.type,
        config: engineJson.config || {}
    },
    ui: {
        layout: uiJson.layout || 'standard-board',
        theme: uiJson.theme || {},
        components: uiJson.components || []
    },
    rules: {
        ...rulesJson,
        minPlayers: rulesJson.minPlayers ?? dependencies.minPlayers,
        maxPlayers: rulesJson.maxPlayers ?? dependencies.maxPlayers
    },
    board: {
        topology: {
            spaces: topologyWithImages.spaces || [],
            connections: topologyWithImages.connections || []
        },
        rendering: {}
    }
};
