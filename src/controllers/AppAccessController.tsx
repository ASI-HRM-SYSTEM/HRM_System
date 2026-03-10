import FirebaseLogin from "../components/FirebaseLogin";
import Login from "../components/Login";
import UserAgreementGate from "../components/UserAgreementGate";
import { TERMS_ACCEPTANCE_KEY } from "../config/appAccessConfig";
import type {
  FirebaseAccessStage,
  FirebaseAuthStatus,
  LocalAccessStage,
} from "../models/AppAccess";

export const hasAcceptedTerms = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(TERMS_ACCEPTANCE_KEY));
};

export const acceptTermsAgreement = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TERMS_ACCEPTANCE_KEY, new Date().toISOString());
  window.location.reload();
};

export const resolveFirebaseAccessStage = (
  status: FirebaseAuthStatus
): FirebaseAccessStage => {
  if (status === "unconfigured" || status === "allowed" || status === "allowed-offline") {
    return "local-auth";
  }

  return "firebase-login";
};

export const resolveLocalAccessStage = (isAuthenticated: boolean): LocalAccessStage => {
  if (isAuthenticated) return "app";
  return hasAcceptedTerms() ? "login" : "terms";
};

export const renderFirebaseAccessStage = (stage: FirebaseAccessStage) => {
  if (stage === "firebase-login") {
    return <FirebaseLogin />;
  }

  return null;
};

export const renderLocalAccessStage = (stage: LocalAccessStage) => {
  if (stage === "terms") {
    return <UserAgreementGate onAccept={acceptTermsAgreement} />;
  }

  if (stage === "login") {
    return <Login />;
  }

  return null;
};
