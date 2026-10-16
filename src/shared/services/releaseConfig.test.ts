const appConfig = require('../../../app.config.js');
const easConfig = require('../../../eas.json');

const expo = appConfig.expo;
const android = expo.android;

describe('Android release configuration', () => {
  it('keeps the published package id', () => {
    expect(android.package).toBe('com.iulianbirladeanu.uptrack');
    expect(expo.ios.bundleIdentifier).toBe('com.iulianbirladeanu.uptrack');
  });

  it('has a positive integer version code and a semantic version', () => {
    expect(Number.isInteger(android.versionCode)).toBe(true);
    expect(android.versionCode).toBeGreaterThanOrEqual(3);
    expect(expo.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('targets API 36 with minimum SDK 26', () => {
    const buildProperties = expo.plugins.find(
      (plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties',
    );
    expect(buildProperties[1].android).toMatchObject({
      compileSdkVersion: 36,
      targetSdkVersion: 36,
      minSdkVersion: 26,
    });
  });

  it('disables Android backup', () => {
    expect(android.allowBackup).toBe(false);
  });

  it('declares only the permissions the app uses', () => {
    expect([...android.permissions].sort()).toEqual([
      'CAMERA',
      'android.permission.health.READ_STEPS',
    ]);
  });

  it('blocks permissions the app does not use', () => {
    expect(android.blockedPermissions).toEqual(expect.arrayContaining([
      'android.permission.RECORD_AUDIO',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ]));
  });

  it('does not block permissions the app declares', () => {
    const declared = android.permissions.map((name: string) =>
      name.includes('.') ? name : `android.permission.${name}`,
    );
    declared.forEach((name: string) => {
      expect(android.blockedPermissions).not.toContain(name);
    });
  });
});

describe('EAS build profiles', () => {
  it('builds an app bundle for production and APKs for internal profiles', () => {
    expect(easConfig.build.production.android.buildType).toBe('app-bundle');
    expect(easConfig.build.preview.android.buildType).toBe('apk');
    expect(easConfig.build.development.android.buildType).toBe('apk');
  });

  it('uses the matching remote environment for every profile', () => {
    ['development', 'preview', 'production'].forEach(name => {
      expect(easConfig.build[name].environment).toBe(name);
    });
  });

  it('keeps the production profile free of development client and internal distribution', () => {
    expect(easConfig.build.production.developmentClient).toBeUndefined();
    expect(easConfig.build.production.distribution).toBeUndefined();
  });

  it('has no literal variable placeholders that would override remote values', () => {
    expect(JSON.stringify(easConfig)).not.toContain('${');
  });
});
