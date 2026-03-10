import { FeatureFlagMap } from "../models/Feature";

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return defaultValue;
};

export const FEATURE_FLAGS: FeatureFlagMap = {
  dashboard: parseBoolean(import.meta.env.VITE_FEATURE_DASHBOARD, true),
  cader: parseBoolean(import.meta.env.VITE_FEATURE_CADER, true),
  jobdesk: parseBoolean(import.meta.env.VITE_FEATURE_JOBDESK, true),
  employees: parseBoolean(import.meta.env.VITE_FEATURE_EMPLOYEES, true),
  leave: parseBoolean(import.meta.env.VITE_FEATURE_LEAVE, true),
  attendance: parseBoolean(import.meta.env.VITE_FEATURE_ATTENDANCE, true),
  payroll: parseBoolean(import.meta.env.VITE_FEATURE_PAYROLL, true),
  admin: parseBoolean(import.meta.env.VITE_FEATURE_ADMIN, true),
  settings: parseBoolean(import.meta.env.VITE_FEATURE_SETTINGS, true),
  backup: parseBoolean(import.meta.env.VITE_FEATURE_BACKUP, true),
  audit: parseBoolean(import.meta.env.VITE_FEATURE_AUDIT, true),
  about: parseBoolean(import.meta.env.VITE_FEATURE_ABOUT, true),
  terms: parseBoolean(import.meta.env.VITE_FEATURE_TERMS, true),
};
