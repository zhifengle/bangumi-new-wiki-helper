const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const webpack = require('webpack');

module.exports = {
  entry: {
    // Each entry in here would declare a file that needs to be transpiled
    // and included in the extension source.
    // For example, you could add a background script like:
    // background: './src/background.js',
    popup: './src/popup.js',
    content: './src/content/index.js',
    bangumi: './src/content/bangumi.js',
    background: './src/bg/index.js'
  },
  output: {
    // This copies each source entry into the extension dist folder named
    // after its entry config key.
    path: path.join(__dirname, 'extension/dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
      {
        test: /.less|.css$/,
        use: ExtractTextPlugin.extract([
          { loader: 'css-loader', options: { minimize: true }}, "less-loader"]
        )
        // ["style-loader", "css-loader", "less-loader"]
      },
    ]
  },
  plugins: [
    // Since some NodeJS modules expect to be running in Node, it is helpful
    // to set this environment var to avoid reference errors.
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new ExtractTextPlugin('[name].css')
  ],
  devtool: 'sourcemap',
};
