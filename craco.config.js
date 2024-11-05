module.exports = {
    webpack: {
        configure: ( webpackConfig, { env, paths } ) => {
            // Customize webpackConfig here
            // For example, add a new rule:
            webpackConfig.module.rules.push( {
                test: /\.cjs$/,
                type: 'javascript/auto',
            } );
            return webpackConfig;
        },
    },
};