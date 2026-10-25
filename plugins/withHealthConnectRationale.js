const fs = require('node:fs/promises');
const path = require('node:path');
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

const ACTION_SHOW_RATIONALE = 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE';
const ACTION_VIEW_PERMISSION_USAGE = 'android.intent.action.VIEW_PERMISSION_USAGE';
const CATEGORY_HEALTH_PERMISSIONS = 'android.intent.category.HEALTH_PERMISSIONS';
const RATIONALE_ALIAS = 'ViewPermissionUsageActivity';
const DEFAULT_PRIVACY_POLICY_URL = 'https://iulianbirladeanu07.github.io/uptrack/privacy.html';

const getActions = intentFilter => {
  const actions = intentFilter.action ?? [];
  return Array.isArray(actions) ? actions : [actions];
};

const hasAction = (intentFilter, name) =>
  getActions(intentFilter).some(action => action.$?.['android:name'] === name);

const configureManifest = (modResults, mainActivityName, packageName, privacyPolicyUrl) => {
  const application = modResults.manifest.application[0];
  const mainActivity = (application.activity ?? []).find(
    activity => activity.$?.['android:name'] === mainActivityName,
  );
  if (!mainActivity) throw new Error(`Could not find Android main activity: ${mainActivityName}`);

  const rationaleActivityName = `${packageName}.HealthConnectRationaleActivity`;
  const filters = mainActivity['intent-filter'] ?? [];
  mainActivity['intent-filter'] = filters.filter(
    intentFilter => !hasAction(intentFilter, ACTION_SHOW_RATIONALE),
  );
  if (mainActivity['intent-filter'].length === 0) delete mainActivity['intent-filter'];

  const activity = {
    $: {
      'android:name': rationaleActivityName,
      'android:exported': 'true',
      'android:label': 'UpTrack privacy policy',
    },
    'intent-filter': [
      {
        action: [{ $: { 'android:name': ACTION_SHOW_RATIONALE } }],
      },
    ],
  };
  application.activity = (application.activity ?? []).filter(
    item => item.$?.['android:name'] !== rationaleActivityName,
  );
  application.activity.push(activity);

  const aliasName = `${packageName}.${RATIONALE_ALIAS}`;
  const alias = (application['activity-alias'] ?? []).find(
    item => item.$?.['android:name'] === RATIONALE_ALIAS || item.$?.['android:name'] === aliasName,
  );
  if (alias) {
    alias.$['android:name'] = RATIONALE_ALIAS;
    alias.$['android:targetActivity'] = rationaleActivityName;
  } else {
    application['activity-alias'] = application['activity-alias'] ?? [];
    application['activity-alias'].push({
      $: {
        'android:name': RATIONALE_ALIAS,
        'android:exported': 'true',
        'android:targetActivity': rationaleActivityName,
        'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE',
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': ACTION_VIEW_PERMISSION_USAGE } }],
          category: [{ $: { 'android:name': CATEGORY_HEALTH_PERMISSIONS } }],
        },
      ],
    });
  }

  const metadata = application['meta-data'] ?? [];
  const privacyUrlMetadataName = `${packageName}.PRIVACY_POLICY_URL`;
  application['meta-data'] = metadata.filter(
    item => item.$?.['android:name'] !== privacyUrlMetadataName,
  );
  application['meta-data'].push({
    $: {
      'android:name': privacyUrlMetadataName,
      'android:value': privacyPolicyUrl,
    },
  });

  return modResults;
};

const normalizePrivacyPolicyUrl = value => {
  const url = new URL(String(value ?? '').trim() || DEFAULT_PRIVACY_POLICY_URL);
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
    throw new Error('Health Connect rationale requires a public HTTPS privacy policy URL.');
  }
  return url.toString();
};

const withHealthConnectRationale = (config, options = {}) => {
  const privacyPolicyUrl = normalizePrivacyPolicyUrl(
    options.privacyPolicyUrl ?? config.extra?.privacyPolicyUrl,
  );

  config = withAndroidManifest(config, config => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    configureManifest(
      config.modResults,
      mainActivity.$['android:name'],
      config.android.package,
      privacyPolicyUrl,
    );
    return config;
  });

  config = withDangerousMod(config, ['android', async config => {
    const packageName = config.android?.package;
    if (!packageName || !/^[$A-Z_a-z][$\w]*(\.[$A-Z_a-z][$\w]*)+$/.test(packageName)) {
      throw new Error('Health Connect rationale requires a valid Android package name.');
    }

    const sourcePath = path.join(__dirname, 'HealthConnectRationaleActivity.java');
    const packagePath = packageName.split('.').join(path.sep);
    const targetDirectory = path.join(
      config.modRequest.platformProjectRoot,
      'app',
      'src',
      'main',
      'java',
      packagePath,
    );
    await fs.mkdir(targetDirectory, { recursive: true });
    const source = await fs.readFile(sourcePath, 'utf8');
    await fs.writeFile(
      path.join(targetDirectory, 'HealthConnectRationaleActivity.java'),
      source.replaceAll('__PACKAGE__', packageName),
    );
    return config;
  }]);

  return config;
};

module.exports = withHealthConnectRationale;
module.exports.configureManifest = configureManifest;
module.exports.normalizePrivacyPolicyUrl = normalizePrivacyPolicyUrl;
