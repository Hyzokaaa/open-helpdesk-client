import { http } from "@modules/app/modules/http/domain/http";

export interface PaddleDiscount {
  id: string;
  description: string;
  type: "percentage" | "flat";
  amount: string;
  code: string | null;
  recur: boolean;
  maximum_recurring_intervals: number | null;
  usage_limit: number | null;
  times_used: number;
  enabled_for_checkout: boolean;
  expires_at: string | null;
  status: string;
  created_at: string;
}

export interface CreateDiscountPayload {
  description: string;
  type: "percentage" | "flat";
  amount: string;
  code?: string;
  recur?: boolean;
  maximum_recurring_intervals?: number;
  usage_limit?: number;
  enabled_for_checkout?: boolean;
  expires_at?: string;
}

export async function listDiscounts(): Promise<PaddleDiscount[]> {
  const res = await http.get<PaddleDiscount[]>("/billing/admin/discounts");
  return res.data;
}

export async function createDiscount(data: CreateDiscountPayload): Promise<PaddleDiscount> {
  const res = await http.post<PaddleDiscount>("/billing/admin/discounts", data);
  return res.data;
}

export async function updateDiscount(id: string, data: Partial<CreateDiscountPayload & { enabled_for_checkout: boolean }>): Promise<PaddleDiscount> {
  const res = await http.patch<PaddleDiscount>(`/billing/admin/discounts/${id}`, data);
  return res.data;
}
