import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import MiniEditor, { MiniEditorRef } from "@modules/app/modules/ui/components/MiniEditor/MiniEditor";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import {
  CannedResponse,
  listCannedResponses,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
} from "../services/canned-response.service";

export default function WorkspaceCannedResponsesPage() {
  const { workspaceSlug } = useParams();
  const { can } = usePermissions(workspaceSlug);
  const { t } = useTranslation();
  const { isPlanLimitError, PlanGate } = useExtensions();
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const editorRef = useRef<MiniEditorRef>(null);
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [denied, setDenied] = useState(false);

  const isDirty = title !== originalTitle || content !== originalContent;

  const handleClose = () => {
    if (isDirty) {
      setShowDiscard(true);
    } else {
      setShowSheet(false);
    }
  };

  const fetchResponses = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listCannedResponses(workspaceSlug, { silent: true })
      .then((res) => { setResponses(res); setDenied(false); })
      .catch((err) => {
        if (isPlanLimitError(err)) setDenied(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResponses();
  }, [workspaceSlug]);

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setOriginalTitle("");
    setOriginalContent("");
    setShowSheet(true);
  };

  const openEdit = (r: CannedResponse) => {
    setEditingId(r.id);
    setTitle(r.title);
    setContent(r.content);
    setOriginalTitle(r.title);
    setOriginalContent(r.content);
    setShowSheet(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug) return;
    if (!title.trim()) { toast.error(t("cannedResponses.titleRequired")); return; }
    const html = editorRef.current?.getHTML() || content;
    const finalContent = html === "<p></p>" ? "" : html;
    if (!finalContent) { toast.error(t("cannedResponses.contentRequired")); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateCannedResponse(workspaceSlug, editingId, { title: title.trim(), content: finalContent });
        toast.success(t("cannedResponses.updated"));
      } else {
        await createCannedResponse(workspaceSlug, { title: title.trim(), content: finalContent });
        toast.success(t("cannedResponses.created"));
      }
      setShowSheet(false);
      fetchResponses();
    } catch {
      toast.error(t("cannedResponses.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !deleteId) return;
    await deleteCannedResponse(workspaceSlug, deleteId);
    setDeleteId(null);
    fetchResponses();
    toast.success(t("cannedResponses.deleted"));
  };

  if (denied) {
    return (
      <div className="w-full">
        <h2 className="text-lg font-body-bold text-heading mb-4">{t("cannedResponses.title")}</h2>
        <PlanGate message={t("planLimit.cannedResponsesBlocked")} />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-body-bold text-heading">
          {t("cannedResponses.title")}
        </h2>
        {can(P.CANNED_RESPONSE_CREATE) && (
          <Button size="sm" onClick={openCreate}>
            {t("cannedResponses.new")}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner width={24} />
        </div>
      ) : responses.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">
          {t("cannedResponses.empty")}
        </p>
      ) : (
        <div className="bg-surface border border-border-card rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-card bg-surface-hover">
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">
                  {t("cannedResponses.titleLabel")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-body-semibold text-subtle uppercase">
                  {t("cannedResponses.content")}
                </th>
                <th className="px-2 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id} className="border-b border-border-row">
                  <td className="px-4 py-3">
                    <span className="text-sm font-body-semibold text-heading">
                      {r.title}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-subtle truncate block max-w-md">
                      {r.content.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <ActionMenu
                      items={[
                        ...(can(P.CANNED_RESPONSE_EDIT)
                          ? [{ label: t("cannedResponses.edit"), onClick: () => openEdit(r) }]
                          : []),
                        ...(can(P.CANNED_RESPONSE_DELETE)
                          ? [{ label: t("common.delete"), onClick: () => setDeleteId(r.id), danger: true }]
                          : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title={t("cannedResponses.confirmDelete")}
          message={t("ticketDetail.deleteMessage")}
          confirmLabel={t("common.delete")}
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {showDiscard && (
        <ConfirmModal
          title={t("discard.title")}
          message={t("discard.message")}
          confirmLabel={t("discard.confirm")}
          danger
          onConfirm={() => { setShowDiscard(false); setShowSheet(false); }}
          onCancel={() => setShowDiscard(false)}
        />
      )}

      {showSheet && (
        <Sheet onClose={handleClose}>
          <h2 className="text-lg font-body-bold text-heading mb-6">
            {editingId ? t("cannedResponses.edit") : t("cannedResponses.new")}
          </h2>
          <form onSubmit={handleSubmit}>
            <FormInput label={t("cannedResponses.titleLabel")} required>
              <Input
                placeholder="e.g. Greeting"
                value={title}
                onChange={setTitle}
                autoFocus
              />
            </FormInput>
            <FormInput label={t("cannedResponses.content")} required>
              <MiniEditor
                ref={editorRef}
                initialValue={content}
                placeholder="e.g. Hello! How can I help you today?"
              />
            </FormInput>
            <div className="flex justify-end gap-3">
              <Button size="sm" color="light" onClick={handleClose}>
                {t("cannedResponses.cancel")}
              </Button>
              <Button type="submit" size="sm" loading={saving}>
                {editingId ? t("cannedResponses.save") : t("cannedResponses.create")}
              </Button>
            </div>
          </form>
        </Sheet>
      )}
    </div>
  );
}
