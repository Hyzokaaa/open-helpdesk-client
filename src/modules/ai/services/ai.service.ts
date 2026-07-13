import { http } from "@modules/app/modules/http/domain/http";

export async function improveText(text: string, workspaceSlug: string, language?: string): Promise<string> {
  const res = await http.post<{ result: string }>("/ai/improve", { text, workspaceSlug, language });
  return res.data.result;
}

export async function translateText(text: string, workspaceSlug: string, targetLanguage: string): Promise<string> {
  const res = await http.post<{ result: string }>("/ai/translate", { text, workspaceSlug, targetLanguage });
  return res.data.result;
}

export async function saveAiCache(
  workspaceSlug: string, ticketId: string, key: string, source: string, result: string,
): Promise<void> {
  await http.patch(`/workspaces/${workspaceSlug}/tickets/${ticketId}/ai-cache`, { key, source, result });
}

export async function clearAiCache(
  workspaceSlug: string, ticketId: string, key: string,
): Promise<void> {
  await http.patch(`/workspaces/${workspaceSlug}/tickets/${ticketId}/ai-cache`, { key, clear: true });
}
