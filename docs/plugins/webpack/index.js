// eslint-disable-next-line
module.exports = function (context, options) {
    return {
      name: 'webpack-plugin',
      // eslint-disable-next-line
      configureWebpack(config, isServer, utils) {
      
        if (isServer){
          if (!config.resolve) config.resolve = {}
          if (!config.resolve.fallback) config.resolve.fallback = {}
          config.resolve.fallback.path = false
          config.resolve.fallback.fs = false
        }

          // if (!isServer){
            return config.module.rules.push(
              // Load YAML Files
              {
                test: /\.ya?ml$/,
                type: 'json', // Required by Webpack v4
                use: 'yaml-loader'
              }
            )
          // }

        // return config
      },
    };
  };