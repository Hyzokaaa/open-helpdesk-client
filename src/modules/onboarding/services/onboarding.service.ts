import { http } from "@modules/app/modules/http/domain/http";

export interface OnboardingStepState {
  key: string;
  done: boolean;
  skippable: boolean;
}

export interface OnboardingState {
  /** Every step, in order, done or not. */
  steps: OnboardingStepState[];
  /** The first step still pending, or null when the onboarding is complete. */
  nextStep: string | null;
}

/** Where the signed-in person is in the onboarding; the backend decides it for every way in. */
export async function getOnboarding(): Promise<OnboardingState> {
  const res = await http.get<OnboardingState>("/onboarding");
  return res.data;
}

/** Leaves a step for later and answers where to go next. */
export async function skipOnboardingStep(step: string): Promise<OnboardingState> {
  const res = await http.post<OnboardingState>(`/onboarding/steps/${encodeURIComponent(step)}/skip`);
  return res.data;
}
