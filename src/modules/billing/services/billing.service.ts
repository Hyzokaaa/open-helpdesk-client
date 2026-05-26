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
  source: string;
  gateway: string | null;
  extraSeats: number;
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

export async function activatePlan(planId: string): Promise<{ planId: string; status: string }> {
  const res = await http.post("/billing/activate-plan", { planId });
  return res.data;
}

export interface CheckoutResult {
  paymentUrl: string;
  transactionId?: string;
  gateway: string;
}

export async function checkout(data: {
  planId: string;
  billingCycle: string;
  gateway?: string;
}): Promise<CheckoutResult> {
  const res = await http.post<CheckoutResult>("/billing/checkout", data);
  return res.data;
}

export interface UserPlanInfo {
  planId: string;
  source: string;
}

export async function getUserPlans(): Promise<Record<string, UserPlanInfo>> {
  try {
    const res = await http.get<Record<string, UserPlanInfo>>("/billing/admin/user-plans");
    return res.data;
  } catch {
    return {};
  }
}

export async function renewSubscription(): Promise<{ paymentUrl: string }> {
  const res = await http.post<{ paymentUrl: string }>("/billing/renew");
  return res.data;
}

export async function cancelSubscription(): Promise<void> {
  await http.post("/billing/cancel");
}

export async function reactivateSubscription(): Promise<void> {
  await http.post("/billing/reactivate");
}

export interface SeatsPreview {
  immediate: {
    subtotal: string;
    tax: string;
    total: string;
    credit: string;
    balance: string;
    grandTotal: string;
    creditToBalance: string;
    remainingCredit: string;
    currencyCode: string;
  } | null;
}

export async function previewSeats(quantity: number): Promise<SeatsPreview> {
  const res = await http.post<SeatsPreview>("/billing/preview-seats", { quantity });
  return res.data;
}

export async function updateExtraSeats(quantity: number): Promise<void> {
  await http.patch("/billing/extra-seats", { quantity });
}

export async function adminUpdateSubscription(
  userId: string,
  data: { planId?: string; billingCycle?: string; status?: string; extraSeats?: number },
): Promise<void> {
  await http.patch(`/billing/admin/subscription/${userId}`, data);
}
