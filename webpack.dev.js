const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const path = require("path");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    static: path.resolve(__dirname, "dist"),
    hot: true,
    client: {
      overlay: {
        errors: true,
      },
    },
    devMiddleware: {
      writeToDisk: true, // Menulis file ke disk untuk menghindari multiple injections
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/,
        type: "asset/resource",
        generator: {
          filename: "images/[hash][ext][query]",
        },
      },
    ],
  },
  devServer: {
    static: path.resolve(__dirname, "dist"),
    port: 9000,
    hot: true,
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },
  },
});
