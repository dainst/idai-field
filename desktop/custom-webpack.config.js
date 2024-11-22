module.exports = {
    target: 'electron-renderer',
    externals: {
        'pouchdb-mapreduce-utils': 'commonjs pouchdb-mapreduce-utils',
        'sharp': 'commonjs sharp'
    },
    resolve: {
        fallback: {
            buffer: require.resolve('buffer'),
            querystring: require.resolve('querystring-es3'),
            url: require.resolve('url')
        }
    }
};
