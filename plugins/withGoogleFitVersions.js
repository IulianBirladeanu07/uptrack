const { withProjectBuildGradle } = require('@expo/config-plugins');

const AUTH_VERSION = '20.7.0';
const FITNESS_VERSION = '21.1.0';

const withGoogleFitVersions = (config) => {
    return withProjectBuildGradle(config, (config) => {
        if (config.modResults.language !== 'groovy') {
            return config;
        }

        if (config.modResults.contents.includes('authVersion =')) {
            return config;
        }

        config.modResults.contents =
            `ext {\n    authVersion = "${AUTH_VERSION}"\n    fitnessVersion = "${FITNESS_VERSION}"\n}\n\n` +
            config.modResults.contents;

        return config;
    });
};

module.exports = withGoogleFitVersions;
