const {
  configureManifest,
  normalizePrivacyPolicyUrl,
} = require('../../../plugins/withHealthConnectRationale');

const MAIN_ACTIVITY = 'com.example.uptrack.MainActivity';
const PACKAGE_NAME = 'com.example.uptrack';
const RATIONALE_ACTION = 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE';
const VIEW_PERMISSION_ACTION = 'android.intent.action.VIEW_PERMISSION_USAGE';

const createManifest = () => ({
  manifest: {
    application: [{
      activity: [
        {
          $: { 'android:name': MAIN_ACTIVITY },
          'intent-filter': [
            { action: [{ $: { 'android:name': RATIONALE_ACTION } }] },
            { action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }] },
          ],
        },
      ],
      'activity-alias': [{
        $: {
          'android:name': 'ViewPermissionUsageActivity',
          'android:exported': 'true',
          'android:targetActivity': MAIN_ACTIVITY,
          'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE',
        },
        'intent-filter': [{
          action: [{ $: { 'android:name': VIEW_PERMISSION_ACTION } }],
          category: [{ $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } }],
        }],
      }],
    }],
  },
});

describe('Health Connect rationale config plugin', () => {
  it('routes both Health Connect rationale intents to the dedicated policy activity', () => {
    const manifest = configureManifest(
      createManifest(),
      MAIN_ACTIVITY,
      PACKAGE_NAME,
      'https://example.com/privacy.html',
    );
    const application = manifest.manifest.application[0];
    const mainActivity = application.activity.find(activity => activity.$['android:name'] === MAIN_ACTIVITY);
    const rationaleActivity = application.activity.find(
      activity => activity.$['android:name'] === `${PACKAGE_NAME}.HealthConnectRationaleActivity`,
    );
    const permissionUsageAlias = application['activity-alias'][0];

    expect(mainActivity['intent-filter']).toHaveLength(1);
    expect(rationaleActivity.$['android:exported']).toBe('true');
    expect(rationaleActivity['intent-filter'][0].action[0].$['android:name']).toBe(RATIONALE_ACTION);
    expect(permissionUsageAlias.$['android:targetActivity']).toBe(rationaleActivity.$['android:name']);
    expect(application['meta-data'][0]).toEqual({
      $: {
        'android:name': `${PACKAGE_NAME}.PRIVACY_POLICY_URL`,
        'android:value': 'https://example.com/privacy.html',
      },
    });
  });

  it('keeps manifest configuration idempotent', () => {
    const once = configureManifest(
      createManifest(),
      MAIN_ACTIVITY,
      PACKAGE_NAME,
      'https://example.com/privacy.html',
    );
    const twice = configureManifest(
      once,
      MAIN_ACTIVITY,
      PACKAGE_NAME,
      'https://example.com/privacy.html',
    );
    const application = twice.manifest.application[0];

    expect(application.activity.filter(activity => activity.$['android:name'] === `${PACKAGE_NAME}.HealthConnectRationaleActivity`)).toHaveLength(1);
    expect(application['meta-data']).toHaveLength(1);
  });

  it('defaults to UpTrack’s public privacy page and rejects non-HTTPS URLs', () => {
    expect(normalizePrivacyPolicyUrl(undefined)).toBe('https://iulianbirladeanu07.github.io/uptrack/privacy.html');
    expect(() => normalizePrivacyPolicyUrl('http://example.com/privacy.html')).toThrow(
      'Health Connect rationale requires a public HTTPS privacy policy URL.',
    );
  });
});
