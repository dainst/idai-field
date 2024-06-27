module.exports = {
    externals: {
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
