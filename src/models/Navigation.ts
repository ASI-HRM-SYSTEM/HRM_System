import type { ReactNode } from "react";
import type { FeatureId } from "./Feature";

export type PageType = FeatureId;

export interface NavigationItem {
  id: PageType;
  label: string;
  icon: ReactNode;
}

export interface NavigationRenderContext {
  page: PageType;
  showTerms: boolean;
  onOpenTerms: () => void;
}
