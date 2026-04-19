import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Spinner from "@modules/app/modules/ui/components/Spinner/Spinner";
import { Tag, listTags, createTag, deleteTag } from "../services/tag.service";
import ColorPicker from "@modules/app/modules/ui/components/ColorPicker/ColorPicker";
import usePermissions from "@modules/workspace/hooks/usePermissions";
import { P } from "@modules/workspace/domain/permissions";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function WorkspaceTagsPage() {
  const { workspaceSlug } = useParams();
  const { can } = usePermissions(workspaceSlug);
  const { t } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTags = () => {
    if (!workspaceSlug) return;
    setLoading(true);
    listTags(workspaceSlug)
      .then(setTags)
      .catch(() => toast.error("Failed to load tags"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTags();
  }, [workspaceSlug]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug) return;
    setCreating(true);
    try {
      await createTag(workspaceSlug, {
        name,
        color: color || undefined,
      });
      setName("");
      setColor("");
      setShowCreate(false);
      fetchTags();
      toast.success(t("tags.created"));
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!workspaceSlug) return;
    try {
      await deleteTag(workspaceSlug, tagId);
      fetchTags();
      toast.success(t("tags.deleted"));
    } catch {
      toast.error("Failed to delete tag");
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-body-bold text-heading">{t("tags.title")}</h2>
        {can(P.TAG_CREATE) && (
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? t("tags.cancel") : t("tags.new")}
          </Button>
        )}
      </div>

      {showCreate && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate}>
            <FormInput label={t("tags.name")} required>
              <Input
                placeholder="Tag name"
                value={name}
                onChange={setName}
              />
            </FormInput>
            <FormInput label={t("tags.color")}>
              <ColorPicker value={color || null} onChange={setColor} />
            </FormInput>
            <Button type="submit" size="sm" loading={creating}>
              {t("tags.create")}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner width={24} />
        </div>
      ) : tags.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">
          {t("tags.empty")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 bg-surface border border-border-input rounded-lg px-3 py-2"
            >
              {tag.color && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
              )}
              <span className="text-sm font-body-medium text-body">
                {tag.name}
              </span>
              {can(P.TAG_DELETE) && (
                <button
                  className="text-subtle hover:text-red-500 text-xs ml-1 cursor-pointer"
                  onClick={() => handleDelete(tag.id)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
