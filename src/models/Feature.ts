export type FeatureId =
  | "dashboard"
  | "cader"
  | "jobdesk"
  | "employees"
  | "leave"
  | "attendance"
  | "payroll"
  | "admin"
  | "settings"
  | "backup"
  | "audit"
  | "about"
  | "terms";

export type FeatureFlagMap = Record<FeatureId, boolean>;

export const FEATURE_LIST: FeatureId[] = [
  "dashboard",
  "cader",
  "jobdesk",
  "employees",
  "leave",
  "attendance",
  "payroll",
  "admin",
  "settings",
  "backup",
  "audit",
  "about",
  "terms",
];
