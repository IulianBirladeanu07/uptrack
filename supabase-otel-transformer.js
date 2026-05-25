const upstreamTransformer = require('babel-jest').default || require('@expo/metro-config/babel-transformer');
const metroTransformer = require('@expo/metro-config/babel-transformer');

module.exports.transform = async function({ src, filename, options }) {
  if (filename.includes('@supabase') && src.includes('OTEL_PKG')) {
    src = src.replace(
      /import\s*\([\s\S]*?OTEL_PKG\s*\)/g,
      'Promise.resolve(null)'
    );
  }
  return metroTransformer.transform({ src, filename, options });
};