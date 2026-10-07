import { useEffect, useState } from "react";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import useTranslation from "@modules/app/i18n/useTranslation";
import { useModalLayer } from "@modules/app/modules/ui/shared/domain/modal-stack";

interface Props {
  workspaceName: string;
  busy?: boolean;
  /** For another irreversible action confirmed the same way; deleting the workspace by default. */
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: (typedName: string) => void;
  onCancel: () => void;
}

/** Same comparison the server makes: case and extra spaces do not matter. */
function sameName(a: string, b: string): boolean {
  const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  return normalize(a) === normalize(b);
}

/**
 * Deleting a workspace asks for its name: it can be restored for a while, but after that it is
 * erased with everything in it, so it must never be one careless click.
 */
export default function DeleteWorkspaceModal({ workspaceName, busy = false, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  const layer = useModalLayer();
  const [typed, setTyped] = useState("");
  const matches = sameName(typed, workspaceName);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && layer.isTop() && !busy) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel, layer, busy]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={busy ? undefined : onCancel}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-body-bold text-heading mb-1">{title ?? t("workspaceDelete.title")}</h3>
        <p className="text-sm text-muted mb-3">{message ?? t("workspaceDelete.message")}</p>
        <p className="text-sm text-body mb-2">
          {t("workspaceDelete.typeName")} <span className="font-body-bold">{workspaceName}</span>
        </p>
        <form onSubmit={(e) => { e.preventDefault(); if (matches && !busy) onConfirm(typed); }}>
          <Input value={typed} onChange={setTyped} autoFocus disabled={busy} />
          <div className="flex justify-end gap-2 mt-6">
            <Button size="sm" color="light" onClick={onCancel} disabled={busy}>{t("workspaceDelete.cancel")}</Button>
            <Button size="sm" color="danger" type="submit" disabled={!matches} loading={busy}>
              {confirmLabel ?? t("workspaceDelete.confirm")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
