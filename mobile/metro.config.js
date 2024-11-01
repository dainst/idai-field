/* eslint-disable no-undef */
const { getDefaultConfig } = require('@expo/metro-config');
const { mergeConfig } = require('metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const customConfig = {
    resolver: {
        extraNodeModules: {
            'idai-field-core': path.resolve(__dirname, '../core')
        }
    },
    watchFolders: [
        path.resolve(__dirname, '../core')
    ]
};

module.exports = mergeConfig(defaultConfig, customConfig);