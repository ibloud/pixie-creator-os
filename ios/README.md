# PIXIE iOS / iPadOS shell

This directory contains the native shell scaffold for local Xcode testing.

## Current state

- Swift + SwiftUI shell
- WKWebView host for the existing PIXIE web UI
- JavaScript ↔ native bridge boundary
- Capability registry with explicit `NOT CONFIGURED` states
- Local development bundle identifier placeholder only
- No Apple Music, Sign in with Apple, Push Notifications, Siri/App Intents, or production entitlements are claimed as connected

## Local testing

Open `ios/PIXIE/PIXIE.xcodeproj` in Xcode and select a Personal Team for signing. A physical-device build with free provisioning is a development test only; it is not App Store Connect configuration.

Before distribution, replace the development bundle identifier with the real Apple App ID and configure the required capabilities in Xcode and the Apple developer portal.

Never place Apple API keys, private keys, certificates, or signing secrets in this repository.
