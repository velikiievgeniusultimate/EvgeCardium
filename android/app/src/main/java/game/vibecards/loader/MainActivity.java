package game.vibecards.loader;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import java.io.File;

public final class MainActivity extends Activity {
    private static final String UPDATE_CHANNEL_URL =
        "https://raw.githubusercontent.com/velikiievgeniusultimate/EvgeCardium/main/channel/stable.json";
    private WebView webView;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        setContentView(webView);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        UpdateManager updates = new UpdateManager(this, UPDATE_CHANNEL_URL);
        load(updates.activeEntry());
        updates.checkAsync(path -> runOnUiThread(() -> load(path)));
    }

    private void load(File entry) { webView.loadUrl("file://" + entry.getAbsolutePath()); }
    @Override public void onBackPressed() { if (webView.canGoBack()) webView.goBack(); else super.onBackPressed(); }
}
