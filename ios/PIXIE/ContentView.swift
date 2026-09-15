import SwiftUI
import WebKit

struct ContentView: View {
    @StateObject private var bridge = NativeBridge()

    var body: some View {
        ZStack {
            PIXIEWKWebView(bridge: bridge)
                .ignoresSafeArea()
        }
        .onOpenURL { url in
            bridge.handle(url: url)
        }
    }
}

struct PIXIEWKWebView: UIViewRepresentable {
    let bridge: NativeBridge

    func makeCoordinator() -> Coordinator { Coordinator(bridge: bridge) }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.userContentController.add(context.coordinator, name: "pixieNative")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true

        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web") {
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            let html = "<main style=\"font:17px monospace;padding:2rem\"><h1>PIXIE</h1><p>WEB BUNDLE NOT INCLUDED</p></main>"
            webView.loadHTMLString(html, baseURL: nil)
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        let bridge: NativeBridge
        init(bridge: NativeBridge) { self.bridge = bridge }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "pixieNative" else { return }
            bridge.receive(message.body)
        }
    }
}

final class NativeBridge: ObservableObject {
    @Published private(set) var capabilities: [NativeCapability: CapabilityState] = {
        Dictionary(uniqueKeysWithValues: NativeCapability.allCases.map { ($0, .notConfigured) })
    }()

    func receive(_ body: Any) {
        // Native bridge boundary only. No capability is marked connected here.
        // Add a real adapter only when the corresponding Apple permission and API are configured.
        print("PIXIE native bridge message:", body)
    }

    func handle(url: URL) {
        print("PIXIE URL:", url.absoluteString)
    }
}

enum NativeCapability: String, CaseIterable, Identifiable {
    case appleMusic = "Apple Music"
    case systemMedia = "System media / Lock Screen"
    case backgroundAudio = "Background audio"
    case microphone = "Microphone"
    case camera = "Camera"
    case photos = "Photos"
    case files = "Files"
    case shareSheet = "Share Sheet"
    case haptics = "Haptics"
    case notifications = "Notifications"
    case bluetooth = "Bluetooth / external audio"
    case airPlay = "AirPlay"
    case siri = "Siri / App Intents"
    case signInWithApple = "Sign in with Apple"

    var id: String { rawValue }
}

enum CapabilityState: String {
    case notConfigured = "NOT CONFIGURED"
    case readyForLocalTesting = "READY FOR LOCAL TESTING"
}
