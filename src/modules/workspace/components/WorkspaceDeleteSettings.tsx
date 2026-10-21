import { useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import useTranslation from "@modules/app/i18n/useTranslation";
import DeleteWorkspaceModal from "./DeleteWorkspaceModal";
import { deleteWorkspace } from "../services/workspace.service";

interface Props {
  slug: string;
  workspaceName: string;
  /** Where to export the data first; absent when the person cannot export. */
  exportHref?: string;
  onExport?: () => void;
  onDeleted: () => void;
}

/** Deleting the workspace: what it means, a way to export first, and the confirmation by name. */
export default function WorkspaceDeleteSettings({ slug, workspaceName, exportHref, onExport, onDeleted }: Props) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (typedName: string) => {
    setDeleting(true);
    try {
      await deleteWorkspace(slug, typedName);
      toast.success(t("workspaceDelete.deleted"));
      onDeleted();
    } catch (err) {
      const e = err as { handled?: boolean; message?: string };
      if (!e?.handled) toast.error(e?.message || t("workspaceSettings.deleteError"));
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4">
      {confirming && (
        <DeleteWorkspaceModal
          workspaceName={workspaceName}
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
      <p className="text-sm text-body">{t("workspaceSettings.dangerDescription")}</p>
      {exportHref && (
        <p className="text-xs text-muted">
          {t("settingsNav.exportFirst")}{" "}
          <Link
            to={exportHref}
            onClick={(e) => {
              if (!onExport || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              onExport();
            }}
            className="text-primary hover:underline"
          >
            {t("workspaceSettings.dataMigration")}
          </Link>
        </p>
      )}
      <div>
        <Button size="xs" color="danger" onClick={() => setConfirming(true)}>
          {t("workspaceSettings.deleteWorkspace")}
        </Button>
      </div>
    </div>
  );
}
