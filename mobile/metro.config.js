/* eslint-disable no-undef */
const { getDefaultConfig } = require('@expo/metro-config');
const { mergeConfig } = require('metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);
const resolveFromMobileNodeModules = (moduleName) =>
    path.resolve(__dirname, 'node_modules', moduleName);

const forcedMobileModules = [
    'react',
    'react-native',
    '@react-native',
    '@react-native-async-storage/async-storage',
    'uuid',
    '@neighbourhoodie/pouchdb-asyncstorage-adapter'
];

const shouldResolveFromMobileNodeModules = (moduleName) =>
    forcedMobileModules.some((forcedModule) =>
        moduleName === forcedModule || moduleName.startsWith(`${forcedModule}/`)
    );

const customConfig = {
    resolver: {
        resolveRequest: (context, moduleName, platform) => {
            if (moduleName === 'idai-field-core') {
                return context.resolveRequest(
                    context,
                    path.resolve(__dirname, '../core'),
                    platform
                );
            }

            if (shouldResolveFromMobileNodeModules(moduleName)) {
                return context.resolveRequest(
                    context,
                    resolveFromMobileNodeModules(moduleName),
                    platform
                );
            }

            return context.resolveRequest(context, moduleName, platform);
        },
        nodeModulesPaths: [
            path.resolve(__dirname, 'node_modules')
        ],
        extraNodeModules: {
            'idai-field-core': path.resolve(__dirname, '../core'),
            react: path.resolve(__dirname, 'node_modules/react'),
            'react-native': path.resolve(__dirname, 'node_modules/react-native'),
            '@react-native': path.resolve(__dirname, 'node_modules/@react-native'),
            '@react-native-async-storage/async-storage': path.resolve(
                __dirname,
                'node_modules/@react-native-async-storage/async-storage'
            ),
            '@neighbourhoodie/pouchdb-asyncstorage-adapter': path.resolve(
                __dirname,
                'node_modules/@neighbourhoodie/pouchdb-asyncstorage-adapter'
            ),
            uuid: path.resolve(__dirname, 'node_modules/uuid')
        }
    },
    watchFolders: [
        path.resolve(__dirname, '../core')
    ]
};

module.exports = mergeConfig(defaultConfig, customConfig);
