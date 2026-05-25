const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes('@opentelemetry') || moduleName.includes('opentelemetry')) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.blockList = [
  /node_modules\/@supabase\/supabase-js\/dist\/umd\/.*/,
];

const defaultTransformerPath = require.resolve('metro-transform-worker');

config.transformer = {
  ...config.transformer,
  babelTransformerPath: path.join(__dirname, 'supabase-otel-transformer.js'),
};

module.exports = config;