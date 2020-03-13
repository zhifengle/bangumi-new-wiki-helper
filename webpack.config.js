const path = require('path');
// const ExtractTextPlugin = require("extract-text-webpack-plugin");
// const webpack = require('webpack');

module.exports = {
  entry: {
    // background: './src/background.js',
    // popup: './src/popup.js',
    // content: './src/content/index.js',
    // bangumi: './src/content/bangumi.js',
    // background: './src/bg/index.js'
    test: './src/index.ts'
  },
  output: {
    path: path.join(__dirname, 'extension/dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [],
  // devtool: 'inline-source-map',
  devtool: 'cheap-module-source-map',
  mode: 'development',
  optimization: {
    usedExports: true,
  }
};
