import { http } from "@modules/app/modules/http/domain/http";

export interface ChangelogFeature {
  en: string;
  es: string;
}

export interface ChangelogCategory {
  title: { en: string; es: string };
  features: ChangelogFeature[];
}

export interface ChangelogVersion {
  version: string;
  date: string;
  categories: ChangelogCategory[];
}

export async function getChangelog(): Promise<ChangelogVersion[]> {
  try {
    const res = await http.get<ChangelogVersion[]>("/changelog");
    return res.data;
  } catch {
    return [];
  }
}
