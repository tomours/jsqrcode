/*
 * @Author: junhui
 * @Date: 2023-07-12 16:31:46
 * @LastEditors: junhui
 * @LastEditTime: 2023-07-13 11:06:33
 * @FilePath: \jsqrcode\rollup.config.js
 * @Description: 
 */
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

export default {
    // input: 'demo/test.js',
    // output: {
    //     // dir: 'lib',
    //     file: 'lib/qrcode.js',
    //     name: 'zqrcode',
    //     format: 'iife'  // iife cjs umd
    // },
    input: 'src/index.js',
    output: [
        {
            file: 'lib/zqrcode.js',
            format: 'umd',
            name: 'zqrcode'
        },
        {
            file: 'lib/zqrcode.min.js',
            format: 'umd',
            name: 'zqrcode',
            plugins: [terser()]
        }
    ],
    plugins: [
        resolve(),
        babel({ babelHelpers: 'bundled' })
    ]
};