import boardManifest from './demo-board/board.json';
import metadataJson from './demo-board/metadata.json';
import engineJson from './demo-board/engine.json';
import rulesJson from './demo-board/rules.json';
import uiJson from './demo-board/ui.json';
import topologyJson from './demo-board/topology.json';
import dependenciesJson from './demo-board/dependencies.json';
import spaceImage from './demo-board/assets/space.png';
import previewImage from './demo-board/preview.png';
import { EXAMPLE_PLUGIN_VERSION, EXAMPLE_PLUGIN_CDN, EXAMPLE_PLUGIN_REQUIREMENT } from '../version.js';

// Resolve emitted assets so they work from CDN or cached blob URLs
const resolveAssetUrl = (assetPath) => {
    if (!assetPath) return assetPath;
    try {
        return new URL(assetPath, import.meta.url).href;
    } catch (err) {
        if (typeof window !== 'undefined') {
            const base = `${window.location.origin}/plugins/`;
            try {
                return new URL(assetPath, base).href;
            } catch {
                return `${base}${assetPath}`;
            }
        }
        return assetPath;
    }
};

const resolvedSpaceImage = resolveAssetUrl(spaceImage);
const resolvedPreviewImage = resolveAssetUrl(previewImage);

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
