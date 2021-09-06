const path = require('path');
const WebpackBar = require('webpackbar');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const HOST = process.env.HOST
const PORT = process.env.PORT && Number(process.env.PORT)

module.exports = {
  mode: 'production',
  entry: './src/index',
  output: {
    filename: 'veins.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: "VEINS",
  },
  devtool: 'inline-source-map',
  performance: {
    hints: 'error',
    maxAssetSize: 30000000, // 整数类型（以字节为单位）
    maxEntrypointSize: 50000000 // 整数类型（以字节为单位）
  },
  plugins: [
    // 进度条
    new WebpackBar(),
    new CleanWebpackPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          "babel-loader",
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            }
          }
        ],
        exclude: [path.resolve(__dirname, "node_modules")]
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            }
          }
        ],
        exclude: /node_modules/
      }, {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};