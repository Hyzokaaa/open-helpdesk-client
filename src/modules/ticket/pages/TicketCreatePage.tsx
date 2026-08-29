import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import MiniEditor, { MiniEditorRef } from "@modules/app/modules/ui/components/MiniEditor/MiniEditor";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Card from "@modules/app/modules/ui/components/Card/Card";
import DropZone from "@modules/app/modules/ui/components/DropZone/DropZone";
import { createTicket } from "../services/ticket.service";
import { stageUpload, StagedUpload } from "@modules/attachment/services/attachment.service";
import { PRIORITIES } from "../domain/ticket-enums";
import { listCategories, listProjects, type TicketCategoryDto, type Project } from "@modules/project/services/project.service";
import { Tag, listTags } from "@modules/tag/services/tag.service";
import { Department, listDepartments } from "@modules/department/services/department.service";
import { listMembers, type WorkspaceMember } from "@modules/workspace/services/workspace.service";
import TagSelector from "@modules/tag/components/TagSelector";
import Lightbox from "@modules/app/modules/ui/components/Lightbox/Lightbox";
import useTranslation from "@modules/app/i18n/useTranslation";
import useExtensions from "@modules/app/extensions/useExtensions";
import { CustomFieldDefinition } from "@modules/custom-field/domain/custom-field-types";
import { listCustomFields } from "@modules/custom-field/services/custom-field.service";
import CustomFieldsForm from "@modules/custom-field/components/CustomFieldsForm";

interface Props {
  workspaceSlugProp?: string;
  initialProjectId?: string;
  onCreated?: (ticketId: string) => void;
  onClose?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function TicketCreatePage({ workspaceSlugProp, initialProjectId, onCreated, onClose, onDirtyChange }: Props = {}) {
  const params = useParams();
  const workspaceSlug = workspaceSlugProp || params.workspaceSlug;
  const navigate = useNavigate();
  const { t, tEnum } = useTranslation();
  const { handlePlanLimitError } = useExtensions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<MiniEditorRef>(null);

  const [name, setName] = useState("");
  const [priority, setPriority] = useState("medium");
  const [projectId, setProjectId] = useState<string | undefined>(initialProjectId);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [allCategories, setAllCategories] = useState<TicketCategoryDto[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<TicketCategoryDto[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  interface StagedFile {
    file: File;
    status: "pending" | "uploading" | "done" | "error";
    token?: string;
  }
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({});
  const [onBehalfOf, setOnBehalfOf] = useState("");
  const [allMembers, setAllMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; type: "image" | "video" } | null>(null);

  const isDirty = name.trim() !== "" || files.length > 0 || tagIds.length > 0;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleCancel = () => {
    if (onClose) onClose();
    else navigate(`/dashboard/workspaces/${workspaceSlug}/tickets`);
  };

  useEffect(() => {
    if (workspaceSlug) {
      listTags(workspaceSlug).then(setTags);
      listDepartments(workspaceSlug).then(setDepartments).catch(() => {});
      listCustomFields(workspaceSlug).then(setCustomFieldDefs).catch(() => {});
      listMembers(workspaceSlug).then(setAllMembers).catch(() => {});
      listProjects(workspaceSlug).then(setProjects).catch(() => {});
      listCategories(workspaceSlug).then((cats) => {
        setAllCategories(cats);
        if (initialProjectId) {
          listCategories(workspaceSlug, initialProjectId).then((projCats) => {
            const inProject = projCats.filter((c) => c.inProject);
            const filtered = inProject.length > 0 ? inProject : cats;
            setVisibleCategories(filtered);
            const def = filtered.find((c) => c.slug === "issue") ?? filtered[0];
            if (def) setCategoryId(def.id);
          });
        } else {
          setVisibleCategories(cats);
          const def = cats.find((c) => c.slug === "issue") ?? cats[0];
          if (def) setCategoryId(def.id);
        }
      }).catch(() => {});
    }
  }, [workspaceSlug]);

  const handleProjectChange = (newProjectId: string | undefined) => {
    setProjectId(newProjectId);
    if (!workspaceSlug) return;
    if (newProjectId) {
      listCategories(workspaceSlug, newProjectId).then((projCats) => {
        const inProject = projCats.filter((c) => c.inProject);
        const filtered = inProject.length > 0 ? inProject : allCategories;
        setVisibleCategories(filtered);
        if (!filtered.some((c) => c.id === categoryId)) {
          const def = filtered.find((c) => c.slug === "issue") ?? filtered[0];
          if (def) setCategoryId(def.id);
        }
      });
    } else {
      setVisibleCategories(allCategories);
    }
  };

  const onBehalfOfTrimmed = onBehalfOf.trim().toLowerCase();
  const matchedMember = onBehalfOfTrimmed
    ? allMembers.find((m) => m.email.toLowerCase() === onBehalfOfTrimmed)
    : null;
  const isNewContact = onBehalfOfTrimmed && onBehalfOfTrimmed.includes("@") && !matchedMember;

  const stageFiles = useCallback(async (newFiles: File[]) => {
    const staged: StagedFile[] = newFiles.map((file) => ({ file, status: "pending" as const }));
    setFiles((prev) => [...prev, ...staged]);

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      setFiles((prev) => prev.map((f) => f.file === file ? { ...f, status: "uploading" as const } : f));
      try {
        const result = await stageUpload(file);
        setFiles((prev) => prev.map((f) => f.file === file ? { ...f, status: "done" as const, token: result.token } : f));
      } catch {
        setFiles((prev) => prev.map((f) => f.file === file ? { ...f, status: "error" as const } : f));
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }, []);

  const retryFile = useCallback(async (index: number) => {
    const entry = files[index];
    if (!entry || entry.status !== "error") return;
    const file = entry.file;
    setFiles((prev) => prev.map((f, i) => i === index ? { ...f, status: "uploading" as const } : f));
    try {
      const result = await stageUpload(file);
      setFiles((prev) => prev.map((f, i) => i === index ? { ...f, status: "done" as const, token: result.token } : f));
    } catch {
      setFiles((prev) => prev.map((f, i) => i === index ? { ...f, status: "error" as const } : f));
      toast.error(`Failed to upload ${file.name}`);
    }
  }, [files]);

  const handleDroppedFiles = useCallback((newFiles: File[]) => {
    stageFiles(newFiles);
  }, [stageFiles]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      stageFiles(Array.from(e.target.files!));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug) return;

    const descriptionHtml = editorRef.current?.getHTML() || "";
    const descriptionEmpty = editorRef.current?.isEmpty() ?? true;

    if (name.trim().length < 3) {
      toast.error(t("ticketCreate.nameMinLength"));
      return;
    }
    if (descriptionEmpty) {
      toast.error(t("ticketCreate.descriptionRequired"));
      return;
    }

    setLoading(true);

    try {
      const uploadTokens = files
        .filter((f) => f.status === "done" && f.token)
        .map((f) => f.token!);
      const res = await createTicket(workspaceSlug, {
        name,
        description: descriptionHtml,
        priority,
        categoryId,
        projectId,
        tagIds,
        departmentId: departmentId || undefined,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
        uploadTokens: uploadTokens.length > 0 ? uploadTokens : undefined,
        onBehalfOf: onBehalfOf.trim() || undefined,
      });

      toast.success(t("ticketCreate.success"));
      if (onCreated) {
        onCreated(res.id);
      } else {
        navigate(
          `/dashboard/workspaces/${workspaceSlug}/tickets/${res.id}`,
        );
      }
    } catch (err: any) {
      handlePlanLimitError(err, "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const isImage = (file: File) => file.type.startsWith("image/");
  const hasFilesPending = files.some((f) => f.status === "uploading" || f.status === "pending" || f.status === "error");
  const canSubmit = name.trim().length >= 3 && !hasFilesPending;
  const hasFilesErrored = files.some((f) => f.status === "error");

  return (
    <div className="w-full max-w-2xl">

      <h2 className="text-lg font-body-bold text-heading mb-6">
        {t("ticketCreate.title")}
      </h2>

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          type={lightbox.type}
          onClose={() => setLightbox(null)}
        />
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <FormInput label={t("ticketCreate.name")} required>
            <Input
              placeholder={t("ticketCreate.namePlaceholder")}
              value={name}
              onChange={setName}
            />
          </FormInput>

          <FormInput label={t("ticketCreate.description")} required>
            <MiniEditor
              ref={editorRef}
              initialValue=""
              placeholder={t("ticketCreate.descriptionPlaceholder")}
            />
          </FormInput>

          <div className="flex gap-4">
            <FormInput label={t("ticketCreate.priority")} required className="flex-1">
              <Select
                options={[...PRIORITIES]}
                label={(p) => tEnum("priority", p)}
                value={(p) => p === priority}
                onChange={setPriority}
              />
            </FormInput>

            <FormInput label={t("ticketCreate.category")} required className="flex-1">
              <Select
                options={visibleCategories}
                label={(c) => c.name}
                value={(c) => c.id === categoryId}
                onChange={(c) => setCategoryId(c.id)}
              />
            </FormInput>
          </div>

          {departments.length > 0 && (
            <FormInput label={t("ticketCreate.department")}>
              <Select
                options={[{ id: "", name: "—" } as Department, ...departments]}
                label={(d) => d.name}
                value={(d) => d.id === (departmentId ?? "")}
                onChange={(d) => setDepartmentId(d.id || undefined)}
              />
            </FormInput>
          )}

          {projects.length > 0 && (
            <FormInput label={t("ticketCreate.project")}>
              <Select
                options={[{ id: "", name: "—", description: null } as Project, ...projects]}
                label={(p) => p.name}
                value={(p) => p.id === (projectId ?? "")}
                onChange={(p) => handleProjectChange(p.id || undefined)}
              />
            </FormInput>
          )}

          <FormInput label={t("ticketCreate.tags")}>
            <TagSelector tags={tags} selectedIds={tagIds} onChange={setTagIds} />
          </FormInput>

          <FormInput label={t("ticketCreate.onBehalfOf")}>
            <Input
              placeholder={t("ticketCreate.onBehalfOfPlaceholder")}
              value={onBehalfOf}
              onChange={setOnBehalfOf}
              type="email"
            />
            {matchedMember && (
              <p className="text-exs text-green-600 mt-1">
                ✓ {matchedMember.firstName} {matchedMember.lastName}
              </p>
            )}
            {isNewContact && (
              <p className="text-exs text-amber-600 mt-1">
                {t("ticketCreate.newContactWillBeCreated")}
              </p>
            )}
          </FormInput>

          <CustomFieldsForm
            definitions={customFieldDefs}
            values={customFields}
            onChange={setCustomFields}
          />

          <FormInput label={t("ticketCreate.attachments")}>
            <DropZone onFiles={handleDroppedFiles} accept={["image/*", "video/*"]} dropHint={t("drop.hint")}>
              <div>
                <input
                  id="ticket-files"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFilesChange}
                />
                <label
                  htmlFor="ticket-files"
                  className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-body-semibold rounded-button border border-border-input bg-surface text-secondary-text hover:bg-surface-hover cursor-pointer transition-all"
                >
                  {t("ticketCreate.addFiles")}
                </label>
                <span className="text-exs text-subtle ml-2">
                  {t("ticketCreate.pasteOrDrag")}
                </span>
              </div>

              {files.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {files.map((entry, i) => (
                    <div
                      key={i}
                      className={`relative group border-2 rounded-lg ${entry.status === "error" ? "border-red-400" : "overflow-hidden border-border-input"}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          entry.status === "error"
                            ? retryFile(i)
                            : setLightbox({
                                src: URL.createObjectURL(entry.file),
                                type: isImage(entry.file) ? "image" : "video",
                              })
                        }
                        className="cursor-pointer"
                        title={undefined}
                      >
                        {isImage(entry.file) ? (
                          <img
                            src={URL.createObjectURL(entry.file)}
                            alt={entry.file.name}
                            className={`w-24 h-24 object-cover ${entry.status !== "done" ? "opacity-50" : ""}`}
                          />
                        ) : (
                          <div className="w-24 h-24 flex items-center justify-center bg-surface-hover">
                            <span className={`text-exs text-center px-1 break-all ${entry.status === "error" ? "text-red-500" : "text-muted"}`}>
                              {entry.file.name}
                            </span>
                          </div>
                        )}
                      </button>
                      {(entry.status === "pending" || entry.status === "uploading") && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {entry.status === "error" && (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 pointer-events-none">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </div>
                          <span className="absolute bottom-1 left-1 group/tip z-10">
                            <span className="bg-red-500 text-white rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center cursor-help">!</span>
                            <span className="hidden group-hover/tip:block absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                              {t("ticketCreate.uploadFailed")}
                            </span>
                          </span>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </DropZone>
          </FormInput>

          <div className="flex justify-end gap-3 mt-2">
            <Button
              color="light"
              onClick={handleCancel}
            >
              {t("ticketCreate.cancel")}
            </Button>
            <Button type="submit" loading={loading} disabled={!canSubmit}>
              {t("ticketCreate.submit")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
