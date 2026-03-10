export type FirebaseAuthStatus =
  | "loading"
  | "unconfigured"
  | "unauthenticated"
  | "redirecting"
  | "checking"
  | "allowed"
  | "allowed-offline"
  | "denied";

export type FirebaseAccessStage = "local-auth" | "firebase-login";

export type LocalAccessStage = "app" | "terms" | "login";
