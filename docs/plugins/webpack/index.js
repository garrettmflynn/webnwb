// eslint-disable-next-line
module.exports = function (context, options) {
    return {
      name: 'webpack-plugin',
      // eslint-disable-next-line
      configureWebpack(config, isServer, utils) {
        return config.module.rules.push(
           // Load YAML Files
           {
            test: /\.ya?ml$/,
            type: 'json', // Required by Webpack v4
            use: 'yaml-loader'
          }
        )
      },
    };
  };