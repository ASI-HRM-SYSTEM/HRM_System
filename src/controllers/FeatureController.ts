import { FEATURE_FLAGS } from "../config/featureConfig";
import { FEATURE_LIST, FeatureId } from "../models/Feature";

export const isFeatureEnabled = (featureId: FeatureId): boolean => {
  return FEATURE_FLAGS[featureId] !== false;
};

export const getFirstEnabledFeature = (preferred: FeatureId = "dashboard"): FeatureId => {
  if (isFeatureEnabled(preferred)) return preferred;

  const firstEnabled = FEATURE_LIST.find((featureId) => isFeatureEnabled(featureId));
  return firstEnabled ?? "about";
};

export const filterEnabledFeatures = <T extends { id: FeatureId }>(items: T[]): T[] => {
  return items.filter((item) => isFeatureEnabled(item.id));
};
