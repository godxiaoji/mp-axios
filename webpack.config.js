var webpack = require('webpack');
var path = require('path');

function generateConfig(name) {
  var config = {
    entry: './index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: name + '.js',
      sourceMapFilename: name + '.map',
      library: 'axios',
      libraryTarget: 'umd'
    },
    node: {
      process: false
    },
    devtool: 'source-map'
  };

  config.plugins = [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ];

  return config;
}

module.exports = generateConfig('axios');
