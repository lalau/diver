'use strict';

import gulp from 'gulp';
import gutil from 'gulp-util';
import path from 'path';
import del from 'del';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import CopyWebpackPlugin from 'copy-webpack-plugin';

gulp.task('clean', (done) => {
    del(['dist/']).then(() =>{
        done();
    });
});

const devConfig = {
    entry: [
        'webpack-dev-server/client?http://localhost:8000', // WebpackDevServer host and port
        'webpack/hot/only-dev-server', // "only" prevents reload on syntax errors
        './wrappers/dev/main.js'
    ],
    output: {
        path: path.join(__dirname,'./dist/dev/')
    },
    module: {
        loaders: [
            {
                test: /.jsx?$/,
                //loader: 'babel',
                loaders: ['react-hot','babel'],
                include: path.join(__dirname,'/src/')|path.join(__dirname,'/wrappers/')
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            {from: './vendor', to: './vendor'},
            {from: './wrappers/dev/'}
        ],{ignore: ['main.js']}),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('development')
            }
        })
    ]
};

gulp.task('build:dev', (done) => {
    webpack(devConfig, done);
});

const chromeConfig = {
    entry: [
        './wrappers/chrome/diver.js'
    ],
    output: {
        path: path.join(__dirname,'./dist/chrome/'),
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loaders: ['babel-loader'],
                include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'wrappers')]
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([{from: './vendor', to: './vendor'}, {from: './wrappers/chrome/'}],{ignore: ['diver.js']}),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        })
    ]
};

const chromeDevConfig = {
    entry: [
        './wrappers/chrome/diver.js'
    ],
    output: {
        path: path.join(__dirname, './dist/chrome/'),
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loaders: ['babel-loader'],
                include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'wrappers')]
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            {from: './vendor', to: './vendor'},
            {from: './wrappers/chrome/'},
            {from: './node_modules/react-table/react-table.css'}
        ], {ignore: ['diver.js']}),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('development')
            }
        })
    ]
};

gulp.task('build:chrome:prod', ['clean'], (done) => {
    webpack(chromeConfig, done);
});

gulp.task('build:chrome:dev', ['clean'], (done) => {
    webpack(chromeDevConfig, done);
});

gulp.task('dev-server:web:dev', () => {
    const compiler = webpack(devConfig);

    new WebpackDevServer(compiler).listen(8000,'localhost', (err) => {
        if(err) throw new gutil.PluginError('webpack-dev-server', err);
        // Server listening
        gutil.log('[webpack-dev-server]', 'http://localhost:8000/webpack-dev-server/index.html');
    });
});

gulp.task('dev-server:chrome:dev', ['build:chrome:dev'], () => {
    gulp.watch(['./src/**/*', './vendor/**/*', './wrappers/**/*'], ['build:chrome:dev']);
});
