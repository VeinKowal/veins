const webpackMerge = require('webpack-merge');
const conmonConfig = require('./webpack.config.js');

module.exports = webpackMerge.merge(conmonConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
});
