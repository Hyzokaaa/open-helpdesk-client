import { http } from "@modules/app/modules/http/domain/http";

export interface Plan {
  id: string;
  name: string;
  limits: {
    maxWorkspaces: number;
    maxAgentsPerWorkspace: number;
    maxTicketsPerMonth: number;
  };
  priceMonthly: number;
  priceYearly: number;
  popular?: boolean;
}

export interface Subscription {
  planId: string;
  planName: string;
  billingCycle: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
}

export async function getPlans(): Promise<Plan[]> {
  const res = await http.get<Plan[]>("/billing/plans");
  return res.data;
}

export async function getSubscription(): Promise<Subscription | null> {
  const res = await http.get<Subscription | null>("/billing/subscription");
  return res.data;
}

export async function subscribe(data: {
  planId: string;
  billingCycle: string;
}): Promise<{ id: string; planId: string; status: string }> {
  const res = await http.post("/billing/subscribe", data);
  return res.data;
}

export async function getUserPlans(): Promise<Record<string, string>> {
  try {
    const res = await http.get<Record<string, string>>("/billing/admin/user-plans");
    return res.data;
  } catch {
    return {};
  }
}

export async function adminUpdateSubscription(
  userId: string,
  data: { planId?: string; billingCycle?: string; status?: string },
): Promise<void> {
  await http.patch(`/billing/admin/subscription/${userId}`, data);
}
