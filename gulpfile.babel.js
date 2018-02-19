import gulp from 'gulp';
import path from 'path';
import del from 'del';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import UglifyJSPlugin from 'uglifyjs-webpack-plugin';

const getBaseConfig = () => {
    return {
        entry: {
            diver: './wrappers/chrome/diver.js',
            eventPage: './wrappers/chrome/eventPage.js',
            sandbox: './wrappers/chrome/sandbox.js'
        },
        output: {
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
            new CopyWebpackPlugin([{from: './wrappers/chrome/'}], {ignore: ['diver.js', 'eventPage.js', 'sandbox.js']})
        ]
    };
};

const chromeDevConfig = getBaseConfig();
chromeDevConfig.output.path = path.join(__dirname, './dist/chrome/dev');

const chromeProdConfig = getBaseConfig();
chromeProdConfig.output.path = path.join(__dirname, './dist/chrome/prod');
chromeProdConfig.plugins.push(new UglifyJSPlugin());

gulp.task('clean', (done) => {
    del(['dist/']).then(() =>{
        done();
    });
});

gulp.task('build:chrome:dev', ['clean'], (done) => {
    webpack(chromeDevConfig, done);
});

gulp.task('build:chrome:prod', ['clean'], (done) => {
    webpack(chromeProdConfig, done);
});
