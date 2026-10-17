import { getOnboarding } from "../services/onboarding.service";

/**
 * Where to go once signed in (password, Google, signup, the verification link): the onboarding
 * while a step is pending, otherwise where the person was headed or the dashboard. Every way in
 * asks the same backend rule, so none can skip a step.
 */
export async function pathAfterSignIn(redirect?: string | null): Promise<string> {
  const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/dashboard";
  try {
    const { nextStep } = await getOnboarding();
    if (!nextStep) return target;
    return target === "/dashboard" ? "/onboarding" : `/onboarding?redirect=${encodeURIComponent(target)}`;
  } catch {
    return target;
  }
}
