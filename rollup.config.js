import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'gatsby-node.js',
  output: {
    file: 'bundle.js',
    format: 'iife',
    name: 'GatsbySourceFirestore'
  },
  plugins: [
    resolve({
      mainFields: ['main'], // Default: ['module', 'main']
    })
  ]
};