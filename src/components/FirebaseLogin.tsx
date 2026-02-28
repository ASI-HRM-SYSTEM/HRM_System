/**
 * Firebase Login Gate
 * Full-screen Google Sign-In page shown before the local HRM login.
 * Only renders when Firebase is configured AND user is not yet authenticated.
 */

import { useFirebaseAuth } from "../context/FirebaseAuthContext";

function FirebaseLogin() {
    const { status, firebaseUser, signInWithGoogle, signOut, error } = useFirebaseAuth();

    // ── Loading spinner ───────────────────────────────────────────────────────
    if (status === "loading" || status === "checking") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
                    <p className="text-blue-300 text-sm">
                        {status === "checking" ? "Verifying access…" : "Checking authentication…"}
                    </p>
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
                        <h1 className="text-2xl font-bold text-white">New Lanka Clothing</h1>
                        <p className="text-blue-300 text-sm mt-1">HRM System — Secure Access</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-400/30 rounded-xl">
                            <p className="text-red-300 text-sm font-medium mb-2">{error}</p>
                            {error.toLowerCase().includes("popup") && (
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
                            Sign in with your authorized Google account to continue.
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
