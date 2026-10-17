import { useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import { LocalStorage } from "@modules/app/domain/core/local-storage";
import useWorkspaceMembership from "../hooks/useWorkspaceMembership";

const hiddenKey = (slug: string) => `not_member_bar_hidden:${slug}`;

function readHidden(slug: string): boolean {
  try { return LocalStorage.get(hiddenKey(slug)) === "1"; } catch { return false; }
}

/** A slim bar on every page of a workspace the system admin is not on the team of. Hidden per workspace. */
export default function NotMemberBar() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { needsJoin, isUserRole, joining, failed, join } = useWorkspaceMembership(workspaceSlug);
  const [hiddenFor, setHiddenFor] = useState<Record<string, boolean>>({});

  if (!workspaceSlug || !needsJoin) return null;
  if (hiddenFor[workspaceSlug] ?? readHidden(workspaceSlug)) return null;

  const hide = () => {
    try { LocalStorage.set(hiddenKey(workspaceSlug), "1"); } catch { /* still hidden for this visit */ }
    setHiddenFor((h) => ({ ...h, [workspaceSlug]: true }));
    toast.info(t("membership.barHidden"));
  };

  const onJoin = async () => {
    if (!(await join())) return;
    toast.success(t("membership.joined"));
    // The bar disappears with the focus in it
    document.querySelector<HTMLElement>("main")?.focus();
  };

  return (
    <div
      role="region"
      aria-label={t(isUserRole ? "membership.cardTitleUser" : "membership.cardTitle")}
      className="w-full flex flex-wrap items-center gap-x-3 gap-y-1.5 pl-4 pr-2 py-1.5 text-xs bg-blue-50 text-blue-800 border-b border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800"
    >
      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-[200px]">
        {t(isUserRole ? "membership.barTextUser" : "membership.barText")}
        {failed && <span role="alert" className="ml-1 text-red-600 dark:text-red-400">{t("membership.joinError")}</span>}
      </span>
      <Button size="xs" color="primary" onClick={onJoin} disabled={joining} aria-busy={joining}>
        {joining ? t("membership.joining") : failed ? t("membership.retry") : t(isUserRole ? "membership.makeAdmin" : "membership.join")}
      </Button>
      <button
        type="button"
        onClick={hide}
        aria-label={t("membership.hideBar")}
        title={t("membership.hideBar")}
        className="w-8 h-8 grid place-items-center rounded-md text-base leading-none hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
      >
        ×
      </button>
    </div>
  );
}
