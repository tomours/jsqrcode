/*
 * @Author: junhui
 * @Date: 2023-07-12 16:31:46
 * @LastEditors: junhui
 * @LastEditTime: 2023-07-13 14:29:38
 * @FilePath: \jsqrcode\rollup.config.js
 * @Description: 
 */
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/index.js',
    output: [
        {
            file: 'lib/jsqrcode.js',
            format: 'umd',
            name: 'jsqrcode'
        },
        {
            file: 'lib/jsqrcode.min.js',
            format: 'umd',
            name: 'jsqrcode',
            plugins: [terser()]
        }
    ],
    plugins: [
        resolve(),
        babel({ babelHelpers: 'bundled' })
    ]
};