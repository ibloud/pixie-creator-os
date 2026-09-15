import Foundation

enum PIXIEDevelopmentConfiguration {
    // Deliberately not an App Store Connect identifier.
    // Replace only in Xcode after a real Apple App ID exists.
    static let bundleIdentifier = "com.local.pixie"
}

struct CapabilityStatus: Identifiable {
    let capability: NativeCapability
    let state: CapabilityState
    var id: String { capability.id }
}

extension NativeBridge {
    var capabilityStatus: [CapabilityStatus] {
        NativeCapability.allCases.map {
            CapabilityStatus(capability: $0, state: capabilities[$0] ?? .notConfigured)
        }
    }
}
