import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import Card from "@modules/app/modules/ui/components/Card/Card";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Button from "@modules/app/modules/ui/components/Button/Button";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import { createWorkspace } from "../services/workspace.service";
import useTranslation from "@modules/app/i18n/useTranslation";

export default function WorkspaceCreatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const ws = await createWorkspace({ name: name.trim(), description: description.trim() });
      toast.success(t("workspaces.created"));
      navigate(`/dashboard/workspaces/${ws.slug}/tickets`);
    } catch {
      toast.error(t("workspaces.createError"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      <h2 className="text-lg font-body-bold text-heading mb-4">{t("workspaces.newWorkspace")}</h2>
      <Card className="p-5">
        <form onSubmit={handleSubmit}>
          <FormInput label={t("workspaces.name")} required>
            <Input placeholder={t("workspaces.namePlaceholder")} value={name} onChange={setName} />
          </FormInput>
          <FormInput label={t("workspaces.description")}>
            <Input placeholder={t("workspaces.descriptionPlaceholder")} value={description} onChange={setDescription} />
          </FormInput>
          <div className="flex gap-2 mt-2">
            <Button type="submit" size="sm" loading={creating} disabled={!name.trim()}>
              {t("workspaces.create")}
            </Button>
            <Button size="sm" color="light" onClick={() => navigate(-1)}>
              {t("workspaces.cancel")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
