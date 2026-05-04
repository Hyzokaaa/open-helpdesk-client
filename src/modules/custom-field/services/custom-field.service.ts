import { http } from "@modules/app/modules/http/domain/http";
import { CustomFieldDefinition } from "../domain/custom-field-types";

export async function listCustomFields(
  workspaceSlug: string,
): Promise<CustomFieldDefinition[]> {
  const res = await http.get<CustomFieldDefinition[]>(
    `/workspaces/${workspaceSlug}/custom-fields`,
  );
  return res.data;
}

export async function createCustomField(
  workspaceSlug: string,
  data: {
    name: string;
    type: string;
    options?: string[];
    required?: boolean;
  },
): Promise<CustomFieldDefinition> {
  const res = await http.post<CustomFieldDefinition>(
    `/workspaces/${workspaceSlug}/custom-fields`,
    data,
  );
  return res.data;
}

export async function updateCustomField(
  workspaceSlug: string,
  id: string,
  data: { name?: string; options?: string[]; required?: boolean },
): Promise<CustomFieldDefinition> {
  const res = await http.put<CustomFieldDefinition>(
    `/workspaces/${workspaceSlug}/custom-fields/${id}`,
    data,
  );
  return res.data;
}

export async function deleteCustomField(
  workspaceSlug: string,
  id: string,
): Promise<void> {
  await http.delete(`/workspaces/${workspaceSlug}/custom-fields/${id}`);
}

export async function reorderCustomFields(
  workspaceSlug: string,
  items: { id: string; position: number }[],
): Promise<void> {
  await http.put(`/workspaces/${workspaceSlug}/custom-fields/reorder`, {
    items,
  });
}
