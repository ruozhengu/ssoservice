const path = require("path");
const slsw = require("serverless-webpack");

module.exports = {
  entry: slsw.lib.entries,
  target: "node",
  mode: slsw.lib.webpack.isLocal ? "development" : "production",
  stats: "minimal",
  devtool: "nosources-source-map",
  optimization: {
    minimize: false,
  },
  performance: {
    hints: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
      {
        test: /\.pem|.crt$/,
        use: "raw-loader",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", "..."],
  },
  output: {
    library: {
      type: "commonjs2",
    },
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js",
  },
};
