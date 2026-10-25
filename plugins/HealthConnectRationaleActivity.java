package __PACKAGE__;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.WindowInsets;
import android.view.ViewGroup;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class HealthConnectRationaleActivity extends Activity {
    private static final String PRIVACY_URL_METADATA = "__PACKAGE__.PRIVACY_POLICY_URL";
    private static final int BACKGROUND = Color.rgb(10, 14, 19);
    private static final int SECONDARY_TEXT = Color.rgb(189, 189, 189);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(BACKGROUND);
        getWindow().setNavigationBarColor(BACKGROUND);
        getWindow().getDecorView().setSystemUiVisibility(0);

        String privacyPolicyUrl = getPrivacyPolicyUrl();
        Uri privacyUri = Uri.parse(privacyPolicyUrl);
        if (!"https".equals(privacyUri.getScheme()) || privacyUri.getHost() == null) {
            finish();
            return;
        }

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setBackgroundColor(BACKGROUND);
        int horizontalPadding = dp(24);
        root.setPadding(horizontalPadding, dp(24), horizontalPadding, 0);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsets.Type.systemBars());
            view.setPadding(horizontalPadding, dp(24) + systemBars.top, horizontalPadding, systemBars.bottom);
            return insets;
        });

        TextView title = new TextView(this);
        title.setText("How UpTrack uses your step data");
        title.setTextColor(Color.WHITE);
        title.setTextSize(20);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        title.setGravity(Gravity.START);
        title.setAccessibilityHeading(true);
        root.addView(title, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        TextView explanation = new TextView(this);
        explanation.setText("UpTrack reads step counts from Health Connect to show your daily activity progress. Daily totals are synced to your UpTrack account. UpTrack does not write step data to Health Connect.");
        explanation.setTextColor(SECONDARY_TEXT);
        explanation.setTextSize(14);
        explanation.setLineSpacing(dp(4), 1f);
        explanation.setPadding(0, dp(12), 0, dp(16));
        root.addView(explanation, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        TextView policyHeading = new TextView(this);
        policyHeading.setText("Privacy policy");
        policyHeading.setTextColor(Color.WHITE);
        policyHeading.setTextSize(16);
        policyHeading.setTypeface(null, android.graphics.Typeface.BOLD);
        policyHeading.setGravity(Gravity.START);
        policyHeading.setPadding(0, 0, 0, dp(8));
        root.addView(policyHeading, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        WebView policy = new WebView(this);
        policy.setBackgroundColor(Color.WHITE);
        WebSettings settings = policy.getSettings();
        settings.setJavaScriptEnabled(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        policy.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri destination = request.getUrl();
                if ("https".equals(destination.getScheme()) && privacyUri.getHost().equals(destination.getHost())) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, destination));
                } catch (ActivityNotFoundException ignored) {
                }
                return true;
            }
        });
        LinearLayout.LayoutParams policyLayout = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            0,
            1f
        );
        root.addView(policy, policyLayout);
        setContentView(root);
        policy.loadUrl(privacyPolicyUrl);
    }

    private String getPrivacyPolicyUrl() {
        try {
            ApplicationInfo applicationInfo = getPackageManager().getApplicationInfo(
                getPackageName(),
                android.content.pm.PackageManager.GET_META_DATA
            );
            Bundle metadata = applicationInfo.metaData;
            String url = metadata == null ? null : metadata.getString(PRIVACY_URL_METADATA);
            return url == null ? "" : url;
        } catch (Exception ignored) {
            return "";
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
