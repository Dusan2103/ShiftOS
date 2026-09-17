package com.shiftos.terminal

import android.Manifest
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.Ndef
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebResourceResponse
import androidx.activity.addCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject

private const val TAG = "ShiftOSTerminal"

private const val ASSET_DOMAIN = "appassets.androidplatform.net"
private const val POCETNA_STRANICA = "https://$ASSET_DOMAIN/assets/www/index.html"
private const val KAMERA_ZAHTEV_KOD = 1001

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
    private var nfcAdapter: NfcAdapter? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        if (0 != (applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        assetLoader = WebViewAssetLoader.Builder()
            .setDomain(ASSET_DOMAIN)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = findViewById(R.id.webView)
        podesiWebView(webView)
        ubrizgajFlavorOznaku(webView)
        webView.addJavascriptInterface(ShiftOSMost(), "ShiftOSAndroid")
        webView.loadUrl(POCETNA_STRANICA)

        nfcAdapter = NfcAdapter.getDefaultAdapter(this)

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), KAMERA_ZAHTEV_KOD)
        }

        onBackPressedDispatcher.addCallback(this) {
            if (webView.canGoBack()) {
                webView.goBack()
            } else {
                isEnabled = false
                onBackPressedDispatcher.onBackPressed()
            }
        }
    }

    private fun podesiWebView(webView: WebView) {
        val postavke: WebSettings = webView.settings
        postavke.javaScriptEnabled = true
        postavke.domStorageEnabled = true
        postavke.cacheMode = WebSettings.LOAD_DEFAULT

        postavke.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        postavke.useWideViewPort = true
        postavke.loadWithOverviewMode = true

        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)) {

        }

        webView.webViewClient = object : WebViewClient() {

            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest,
            ): WebResourceResponse? {

                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError,
            ) {
                super.onReceivedError(view, request, error)
                if (request.isForMainFrame) {
                    Log.e(
                        TAG,
                        "Greška pri učitavanju ${request.url}: ${error.errorCode} ${error.description}",
                    )
                }
            }

            override fun onReceivedHttpError(
                view: WebView,
                request: WebResourceRequest,
                errorResponse: android.webkit.WebResourceResponse,
            ) {
                super.onReceivedHttpError(view, request, errorResponse)
                if (request.isForMainFrame) {
                    Log.e(TAG, "HTTP greška ${errorResponse.statusCode} za ${request.url}")
                }
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                Log.i(TAG, "Stranica učitana: $url")
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                Log.i(
                    TAG,
                    "JS konzola [${consoleMessage.messageLevel()}] ${consoleMessage.message()} " +
                        "(${consoleMessage.sourceId()}:${consoleMessage.lineNumber()})",
                )
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest) {
                val trazeneKamere = request.resources.filter { it == PermissionRequest.RESOURCE_VIDEO_CAPTURE }
                if (
                    trazeneKamere.isNotEmpty() &&
                    ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA) ==
                    PackageManager.PERMISSION_GRANTED
                ) {
                    request.grant(trazeneKamere.toTypedArray())
                } else {
                    request.deny()
                }
            }
        }
    }

    private fun ubrizgajFlavorOznaku(webView: WebView) {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) return
        WebViewCompat.addDocumentStartJavaScript(
            webView,
            "window.__SHIFTOS_FLAVOR__ = ${JSONObject.quote(BuildConfig.FLAVOR)};",
            setOf("https://$ASSET_DOMAIN"),
        )
    }

    override fun onResume() {
        super.onResume()
        val adapter = nfcAdapter ?: return
        if (!adapter.isEnabled) return

        val intent = Intent(this, javaClass).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_MUTABLE
        } else {
            0
        }
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, pendingIntentFlags)
        adapter.enableForegroundDispatch(this, pendingIntent, null, null)
    }

    override fun onPause() {
        super.onPause()
        nfcAdapter?.disableForegroundDispatch(this)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        val tag: Tag? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(NfcAdapter.EXTRA_TAG, Tag::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(NfcAdapter.EXTRA_TAG)
        }
        tag?.let { posaljiNfcOcitavanjeUJs(it) }
    }

    private fun posaljiNfcOcitavanjeUJs(tag: Tag) {
        val serijskiBroj = tag.id.joinToString(":") { String.format("%02x", it) }
        val poziv = "window.onNfcTagFromNative && window.onNfcTagFromNative(${JSONObject.quote(serijskiBroj)});"
        webView.post {
            webView.evaluateJavascript(poziv, null)
        }
    }

    private fun procitajNdefIProslediUJs(tag: Tag) {
        val ndef = Ndef.get(tag) ?: return
        try {
            ndef.connect()
            val poruka: NdefMessage = ndef.ndefMessage ?: return
            val zapis: NdefRecord = poruka.records.firstOrNull() ?: return
            val tekst = dekodirajNdefTekst(zapis.payload) ?: return
            val poziv = "window.onNdefTekstFromNative && window.onNdefTekstFromNative(${JSONObject.quote(tekst)});"
            webView.post { webView.evaluateJavascript(poziv, null) }
        } catch (e: Exception) {
            Log.w(TAG, "Čitanje NDEF poruke nije uspelo: ${e.message}")
        } finally {
            try {
                ndef.close()
            } catch (_: Exception) {

            }
        }
    }

    private fun dekodirajNdefTekst(payload: ByteArray): String? {
        if (payload.isEmpty()) return null
        val statusBajt = payload[0].toInt()
        val jezikDuzina = statusBajt and 0x3F
        val utf16 = (statusBajt and 0x80) != 0
        if (payload.size < 1 + jezikDuzina) return null
        val tekstBajtovi = payload.copyOfRange(1 + jezikDuzina, payload.size)
        return String(tekstBajtovi, if (utf16) Charsets.UTF_16 else Charsets.UTF_8)
    }

    private inner class ShiftOSMost {
        @JavascriptInterface
        fun postaviTerminalId(terminalId: String) {
            TerminalIdentitet.terminalId = terminalId
        }
    }
}
