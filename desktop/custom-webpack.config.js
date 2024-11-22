module.exports = {
    target: 'electron-renderer',
    externals: {
        'sharp': 'commonjs sharp'
    },
    resolve: {
        fallback: {
            buffer: require.resolve('buffer'),
            'pouchdb-mapreduce-utils': require.resolve('pouchdb-mapreduce-utils'),
            querystring: require.resolve('querystring-es3'),
            url: require.resolve('url')
        }
    }
};
