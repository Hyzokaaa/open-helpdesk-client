import { useEffect, useState } from "react";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import useTranslation from "@modules/app/i18n/useTranslation";
import { getVersionInfo, type VersionInfo } from "../services/version.service";

declare const __APP_VERSION__: string;

function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1;
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1;
  }
  return 0;
}

type Status = "up-to-date" | "behind" | "ahead";

function getStatus(current: string, latest: string | null): Status {
  if (!latest) return "up-to-date";
  const cmp = compareSemver(current, latest);
  if (cmp < 0) return "behind";
  if (cmp > 0) return "ahead";
  return "up-to-date";
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "behind") return <span className="text-amber-500">↑</span>;
  if (status === "ahead") return <span className="text-blue-500">✓</span>;
  return <span className="text-green-600">✓</span>;
}

type OverallStatus = "up-to-date" | "behind" | "pre-release";

export default function SystemVersionInfo() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const clientVersion = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "unknown";

  useEffect(() => {
    getVersionInfo()
      .then(setInfo)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-6"><Spinner width={20} /></div>;
  if (error || !info) return <p className="text-sm text-muted py-4">{t("admin.versionError")}</p>;

  const releaseVersion = info.latestRelease?.product ?? null;
  const releaseBackend = info.latestRelease?.components.backend ?? null;
  const releaseClient = info.latestRelease?.components.client ?? null;

  const backendVsRelease = getStatus(info.backend, releaseBackend);
  const clientVsRelease = getStatus(clientVersion, releaseClient);
  const backendVsLatest = getStatus(info.backend, info.latestComponents.backend);
  const clientVsLatest = getStatus(clientVersion, info.latestComponents.client);

  const hasBehind = backendVsRelease === "behind" || clientVsRelease === "behind"
    || backendVsLatest === "behind" || clientVsLatest === "behind";
  const hasAhead = backendVsRelease === "ahead" || clientVsRelease === "ahead";

  let overall: OverallStatus = "up-to-date";
  if (hasBehind) overall = "behind";
  else if (hasAhead) overall = "pre-release";

  return (
    <div>
      {overall === "behind" && info.latestRelease && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            Open Helpdesk <span className="font-body-bold">v{releaseVersion}</span> {t("admin.versionAvailable")}
          </p>
          <a
            href={info.latestRelease.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-amber-800 underline hover:text-amber-900 shrink-0 ml-4"
          >
            {t("admin.versionViewRelease")}
          </a>
        </div>
      )}

      {overall === "pre-release" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-blue-800">
            {t("admin.versionPreRelease")} (v{releaseVersion})
          </p>
        </div>
      )}

      <div className="bg-surface border border-border-card rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-card bg-surface-hover">
              <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.versionComponent")}</th>
              <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.versionCurrent")}</th>
              <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">
                {releaseVersion ? `${t("admin.versionRelease")} (v${releaseVersion})` : t("admin.versionRelease")}
              </th>
              <th className="px-4 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.versionLatestComponent")}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-row">
              <td className="px-4 py-2.5 text-sm font-body-medium text-heading">Backend</td>
              <td className="px-4 py-2.5 text-sm text-body font-mono">v{info.backend}</td>
              <td className="px-4 py-2.5 text-sm text-muted font-mono">
                {releaseBackend ? <><StatusIcon status={backendVsRelease} /> v{releaseBackend}</> : "—"}
              </td>
              <td className="px-4 py-2.5 text-sm text-muted font-mono">
                {info.latestComponents.backend ? <><StatusIcon status={backendVsLatest} /> v{info.latestComponents.backend}</> : "—"}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-sm font-body-medium text-heading">Client</td>
              <td className="px-4 py-2.5 text-sm text-body font-mono">v{clientVersion}</td>
              <td className="px-4 py-2.5 text-sm text-muted font-mono">
                {releaseClient ? <><StatusIcon status={clientVsRelease} /> v{releaseClient}</> : "—"}
              </td>
              <td className="px-4 py-2.5 text-sm text-muted font-mono">
                {info.latestComponents.client ? <><StatusIcon status={clientVsLatest} /> v{info.latestComponents.client}</> : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {overall === "up-to-date" && (
        <p className="text-xs text-green-600 mt-3">✓ {t("admin.versionUpToDate")}</p>
      )}
    </div>
  );
}
