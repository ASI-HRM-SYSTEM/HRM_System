/**
 * Firebase Login Gate
 * Full-screen Google Sign-In page shown before the local HRM login.
 * Only renders when Firebase is configured AND user is not yet authenticated.
 */

import { useFirebaseAuth } from "../context/FirebaseAuthContext";
import { APP_CONFIG } from "../config/appConfig";

function FirebaseLogin() {
    const { status, firebaseUser, signInWithGoogle, signOut, error, isOffline } = useFirebaseAuth();

    // ── Loading spinner ───────────────────────────────────────────────────────
    if (status === "loading" || status === "checking" || status === "redirecting") {
        const message =
            status === "checking"    ? "Verifying access…" :
            status === "redirecting" ? "Opening Google sign-in… please wait" :
            "Checking authentication…";
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
                    <p className="text-blue-300 text-sm">{message}</p>
                    {status === "redirecting" && (
                        <p className="text-gray-500 text-xs mt-2">
                            You will be redirected to Google and returned automatically.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // ── Access denied ─────────────────────────────────────────────────────────
    if (status === "denied") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
                <div className="w-full max-w-md mx-4">
                    <div className="bg-white/10 backdrop-blur-md border border-red-400/30 rounded-2xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                        <p className="text-red-300 text-sm mb-6">
                            {error || "Your email is not authorized to use this system."}
                        </p>
                        <p className="text-gray-400 text-xs mb-6">
                            Signed in as: <span className="text-white font-medium">{firebaseUser?.email}</span>
                        </p>
                        <button onClick={signOut}
                            className="w-full py-2.5 px-4 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors text-sm font-medium">
                            Sign Out &amp; Try Another Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Offline first-run / offline info screen ──────────────────────────────
    if (status === "unauthenticated" && isOffline) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4">
                <div className="w-full max-w-lg rounded-2xl border p-8 text-center" style={{ backgroundColor: "rgba(15, 23, 42, 0.96)", borderColor: "rgba(148, 163, 184, 0.2)" }}>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-amber-500/15 text-amber-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404A5.5 5.5 0 1115.89 8.626M8.111 16.404L5 19.515M8.111 16.404l3.183-3.182m4.596-4.596L19 5.515" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Offline Mode</h2>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                        This device is currently offline. The app can work offline only after first-time setup is completed online on this device.
                    </p>
                    <div className="rounded-xl border p-4 mb-6 text-left" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(148, 163, 184, 0.15)" }}>
                        <p className="text-sm text-slate-200 font-medium mb-2">What to do</p>
                        <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                            <li>Connect to the internet for the first app setup.</li>
                            <li>Sign in with your approved Google account.</li>
                            <li>Let the app finish verification and sync preparation.</li>
                            <li>After that, this device can continue working offline.</li>
                        </ul>
                    </div>
                    {error && <p className="text-xs text-amber-300">{error}</p>}
                </div>
            </div>
        );
    }

    if (status === "allowed-offline") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4">
                <div className="w-full max-w-lg rounded-2xl border p-8 text-center" style={{ backgroundColor: "rgba(15, 23, 42, 0.96)", borderColor: "rgba(148, 163, 184, 0.2)" }}>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-emerald-500/15 text-emerald-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7 2A9 9 0 113 12a9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Offline Access Ready</h2>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                        First-time setup was completed earlier on this device, so the app can continue to open without internet.
                    </p>
                    <div className="rounded-xl border p-4 mb-6 text-left" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(148, 163, 184, 0.15)" }}>
                        <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                            <li>Local HRM features continue working.</li>
                            <li>Cloud verification is skipped until internet returns.</li>
                            <li>Sync and updates resume automatically once online.</li>
                        </ul>
                    </div>
                    <p className="text-xs text-emerald-300">{error || "Offline mode is active."}</p>
                </div>
            </div>
        );
    }

    // ── Sign-in screen ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md mx-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {/* Logo / Brand */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
                            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white">{APP_CONFIG.companyName}</h1>
                        <p className="text-blue-300 text-sm mt-1">{APP_CONFIG.name} — Secure Access</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className={`mb-4 p-4 rounded-xl border ${isOffline ? "bg-amber-500/15 border-amber-400/30" : "bg-red-500/20 border-red-400/30"}`}>
                            <p className={`${isOffline ? "text-amber-200" : "text-red-300"} text-sm font-medium mb-2`}>{error}</p>
                            {!isOffline && error.toLowerCase().includes("popup") && (
                                <p className="text-red-200 text-xs opacity-80">
                                    💡 <strong>Tip:</strong> If using a browser, ensure popups are enabled. If using the desktop app, try clicking the button again.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Info box */}
                    <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                        <p className="text-gray-300 text-sm text-center leading-relaxed">
                            This system requires company authorization.<br />
                            First-time setup must be done online. After successful sign-in and verification, this device can work offline later.
                        </p>
                    </div>

                    {/* Google Sign-In button */}
                    <button onClick={signInWithGoogle}
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-gray-800 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]">
                        {/* Google logo SVG */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    <p className="text-center text-gray-500 text-xs mt-6">
                        Only authorized company accounts can access this system.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default FirebaseLogin;
