import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import type { ChangelogVersion } from "../services/changelog.service";

interface Props {
  release: ChangelogVersion;
  lang: "en" | "es";
  /** Badge and date above the entries; left out where the caller shows them itself. */
  header?: boolean;
}

/** What one version brings, by category, in the reader's language. */
export default function ChangelogRelease({ release, lang, header = true }: Props) {
  return (
    <div>
      {header && (
        <div className="flex items-center gap-3 mb-4">
          <StatusBadge label={`v${release.version}`} color="primary" />
          <span className="text-xs text-muted">{release.date}</span>
        </div>
      )}
      <div className="space-y-4">
        {release.categories.map((category) => (
          <div key={category.title.en}>
            <p className="text-xs font-body-semibold text-subtle uppercase mb-2">{category.title[lang]}</p>
            <ul className="space-y-1.5">
              {category.features.map((feature, i) => (
                <li key={i} className="flex gap-2 text-sm text-body">
                  <span className="text-primary mt-0.5 shrink-0">-</span>
                  <span>{feature[lang]}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
