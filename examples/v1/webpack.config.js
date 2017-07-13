const webpack = require("webpack");
const path = require("path");
const root = (src) => path.resolve(__dirname, src);

const config = {
  entry: root('src/client/entry.js'),
  output: { filename: 'bundle.js', path: root('build'), publicPath: '/', pathinfo: true },
  devtool: 'eval',
  module: {
    exprContextCritical: false,
    rules: [{
      test: /\.(js|jsx)$/,
      use: [{
        loader: 'babel-loader',
        options: {
          presets: ["env", 'react'],
          babelrc: false,
        }
      }]
    }]
  }
};

module.exports = config