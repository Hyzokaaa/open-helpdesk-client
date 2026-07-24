import { createContext, type ComponentType, type ReactNode } from "react";

export interface Extensions {
  /** Component shown when a feature requires a higher plan */
  PlanGate: ComponentType<{ message: string }>;

  /** Component shown as a banner in the dashboard layout (e.g. trial/expiration warnings) */
  DashboardBanner: ComponentType;

  /** Check if an HTTP error is a plan-limit 403 */
  isPlanLimitError: (err: unknown) => boolean;

  /** Handle a plan-limit error (show toast, return true if handled) */
  handlePlanLimitError: (err: unknown, fallbackMessage?: string) => boolean;

  /** Get current user subscription (null = no billing system) */
  getSubscription: () => Promise<unknown | null>;

  /** Get available plans (empty = no billing system) */
  getPlans: () => Promise<unknown[]>;

  /** Additional nav items for the Settings section in sidebar */
  extraSettingsNav: { label: string; path: string }[];

  /** Additional nav items for the Admin section in sidebar */
  extraAdminNav: { label: string; path: string }[];

  /** Extra routes rendered inside the dashboard protected area */
  extraDashboardRoutes?: ReactNode;

  /** Extra routes rendered at the top level (landing pages, etc.) */
  extraPublicRoutes?: ReactNode;

  /** Onboarding steps override — if provided, replaces the default steps */
  onboardingSteps?: string[];

  /** Render a custom onboarding step by name */
  renderOnboardingStep?: (step: string, props: Record<string, unknown>) => ReactNode;

  /** Get plan info for all users (admin only) */
  getUserPlans: () => Promise<Record<string, { planId: string; source: string }>>;

  /** Update a user's subscription (admin only) */
  adminUpdateSubscription: (userId: string, data: Record<string, unknown>) => Promise<void>;

  /** Get max agents per workspace for the current plan (null = unlimited or no billing) */
  getAgentLimit: () => Promise<number | null>;

  /** Check if a feature is locked by plan (returns false in core = always available) */
  isFeatureLocked: (feature: string) => Promise<boolean>;
}

const noopAsync = () => Promise.resolve(null);
const noopAsyncArray = () => Promise.resolve([]);
const noop = () => false;

const noopAsyncEmpty = () => Promise.resolve({} as Record<string, { planId: string; source: string }>);
const noopAsyncVoid = () => Promise.resolve();

export const defaultExtensions: Extensions = {
  PlanGate: () => null,
  DashboardBanner: () => null,
  isPlanLimitError: noop,
  handlePlanLimitError: noop,
  getSubscription: noopAsync,
  getPlans: noopAsyncArray,
  extraSettingsNav: [],
  extraAdminNav: [],
  getUserPlans: noopAsyncEmpty,
  adminUpdateSubscription: noopAsyncVoid as any,
  getAgentLimit: noopAsync as any,
  isFeatureLocked: () => Promise.resolve(false),
};

export const ExtensionContext = createContext<Extensions>(defaultExtensions);
