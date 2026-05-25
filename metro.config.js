const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('cjs');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes('@opentelemetry')) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.blockList = [
  /node_modules\/@supabase\/supabase-js\/dist\/umd\/.*/,
];

module.exports = config;