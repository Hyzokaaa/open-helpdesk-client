import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import useTranslation from "@modules/app/i18n/useTranslation";
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
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchResponses = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listCannedResponses(workspaceSlug)
      .then(setResponses)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResponses();
  }, [workspaceSlug]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug) return;
    setCreating(true);
    try {
      await createCannedResponse(workspaceSlug, { title, content });
      setTitle("");
      setContent("");
      setShowCreate(false);
      fetchResponses();
      toast.success(t("cannedResponses.created"));
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (r: CannedResponse) => {
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditContent(r.content);
  };

  const handleUpdate = async () => {
    if (!workspaceSlug || !editingId) return;
    setSaving(true);
    try {
      await updateCannedResponse(workspaceSlug, editingId, {
        title: editTitle,
        content: editContent,
      });
      setEditingId(null);
      fetchResponses();
      toast.success(t("cannedResponses.updated"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!workspaceSlug) return;
    try {
      await deleteCannedResponse(workspaceSlug, id);
      fetchResponses();
      toast.success(t("cannedResponses.deleted"));
    } catch {
      // handled by interceptor
    }
  };

  const textareaClass =
    "w-full bg-surface rounded-input border-input transition-all duration-200 outline-none shadow-input text-body border-input-effect px-3 py-1.5 text-sm resize-none";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-body-bold text-heading">
          {t("cannedResponses.title")}
        </h2>
        {can(P.CANNED_RESPONSE_CREATE) && (
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? t("cannedResponses.cancel") : t("cannedResponses.new")}
          </Button>
        )}
      </div>

      {showCreate && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate}>
            <FormInput label={t("cannedResponses.titleLabel")} required>
              <Input
                placeholder="e.g. Greeting"
                value={title}
                onChange={setTitle}
              />
            </FormInput>
            <FormInput label={t("cannedResponses.content")} required>
              <textarea
                className={textareaClass}
                rows={4}
                placeholder="e.g. Hello! How can I help you today?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </FormInput>
            <Button type="submit" size="sm" loading={creating}>
              {t("cannedResponses.create")}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner width={24} />
        </div>
      ) : responses.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">
          {t("cannedResponses.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {responses.map((r) => (
            <Card key={r.id} className="p-4">
              {editingId === r.id ? (
                <div className="flex flex-col gap-3">
                  <FormInput label={t("cannedResponses.titleLabel")} required>
                    <Input value={editTitle} onChange={setEditTitle} />
                  </FormInput>
                  <FormInput label={t("cannedResponses.content")} required>
                    <textarea
                      className={textareaClass}
                      rows={4}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                  </FormInput>
                  <div className="flex gap-2">
                    <Button size="sm" loading={saving} onClick={handleUpdate}>
                      {t("cannedResponses.save")}
                    </Button>
                    <Button
                      size="sm"
                      color="light"
                      onClick={() => setEditingId(null)}
                    >
                      {t("cannedResponses.cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-body-semibold text-heading">
                      {r.title}
                    </h3>
                    <p className="text-sm text-subtle mt-1 whitespace-pre-wrap line-clamp-3">
                      {r.content}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {can(P.CANNED_RESPONSE_EDIT) && (
                      <button
                        className="text-xs text-subtle hover:text-primary cursor-pointer"
                        onClick={() => startEdit(r)}
                      >
                        {t("cannedResponses.edit")}
                      </button>
                    )}
                    {can(P.CANNED_RESPONSE_DELETE) && (
                      <button
                        className="text-xs text-subtle hover:text-red-500 cursor-pointer"
                        onClick={() => handleDelete(r.id)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
