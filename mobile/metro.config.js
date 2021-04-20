const { getDefaultConfig } = require('@expo/metro-config');
const { mergeConfig } = require('metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const customConfig = {
    resolver: {
        sourceExts: [
            'expo.ts',
            'expo.tsx',
            'expo.js',
            'expo.jsx',
            'ts',
            'tsx',
            'js',
            'jsx',
            'json',
            'wasm',
            'svg'
        ],
        extraNodeModules: {
            'idai-field-core': path.resolve(__dirname, '../core')
        }
    },
    watchFolders: [
        path.resolve(__dirname, '../core')
    ]
};

module.exports = mergeConfig(defaultConfig, customConfig);
