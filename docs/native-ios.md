# PIXIE native iOS / iPadOS implementation

## What is implemented

The `pixie-ios-native-shell` branch establishes the native boundary without claiming Apple services are active:

1. SwiftUI app entry point.
2. WKWebView host for the PIXIE web UI.
3. JavaScript message handler named `pixieNative`.
4. Browser-safe `window.PIXIE_NATIVE` bridge contract.
5. Explicit capability states for Apple Music, system media, background audio, microphone, camera, Photos, Files, Share Sheet, haptics, notifications, Bluetooth/external audio, AirPlay, Siri/App Intents, and Sign in with Apple.
6. Local-only development bundle identifier `com.local.pixie`.

## What is deliberately not implemented yet

The native shell does not request permissions, declare production entitlements, authenticate users, access Apple Music, publish notifications, expose Siri actions, or control hardware. Those are separate adapters that require the relevant Apple APIs, permissions, entitlements, and account configuration.

## Build note

`project.yml` is an XcodeGen-style project specification. If XcodeGen is available, generate the `.xcodeproj` from it. Otherwise create an iOS App target in Xcode and add the Swift files, `Info.plist`, and the web assets under `Web/` to the target.

The current repository does not yet contain a compiled `.xcodeproj`; this avoids committing generated project metadata before the user's local Apple Team and bundle identifier are known.
