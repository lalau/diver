import gulp from 'gulp';
import path from 'path';
import del from 'del';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const chromeDevConfig = {
    entry: {
        diver: './wrappers/chrome/diver.js',
        sandbox: './wrappers/chrome/sandbox.js'
    },
    output: {
        path: path.join(__dirname, './dist/chrome/'),
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loaders: ['babel-loader'],
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, 'wrappers')
                ]
            },
            {
                test: /\.s?css$/,
                loaders: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            minimize: true
                        }
                    },
                    {
                        loader: 'sass-loader'
                    }
                ],
                include: [
                    path.resolve(__dirname, 'styles'),
                    path.resolve(__dirname, 'node_modules/react-table')
                ]
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([{from: './wrappers/chrome/'}], {ignore: ['diver.js', 'sandbox.js']})
    ]
};

gulp.task('clean', (done) => {
    del(['dist/']).then(() =>{
        done();
    });
});

gulp.task('build:chrome:dev', ['clean'], (done) => {
    webpack(chromeDevConfig, done);
});
