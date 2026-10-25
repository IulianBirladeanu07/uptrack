const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;
const tanstackEntries = new Map([
  ['@tanstack/query-core', path.join(__dirname, 'node_modules/@tanstack/query-core/build/modern/index.js')],
  ['@tanstack/react-query', path.join(__dirname, 'node_modules/@tanstack/react-query/build/modern/index.js')],
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const filePath = tanstackEntries.get(moduleName);
  if (filePath) return { type: 'sourceFile', filePath };
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
