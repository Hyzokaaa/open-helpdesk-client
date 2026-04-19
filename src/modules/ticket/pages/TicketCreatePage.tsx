import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Textarea from "@modules/app/modules/ui/components/Textarea/Textarea";
import Select from "@modules/app/modules/ui/components/Select/Select";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Card from "@modules/app/modules/ui/components/Card/Card";
import DropOverlay from "@modules/app/modules/ui/components/DropOverlay/DropOverlay";
import { createTicket } from "../services/ticket.service";
import { uploadToTicket } from "@modules/attachment/services/attachment.service";
import { PRIORITIES, CATEGORIES } from "../domain/ticket-enums";
import { Tag, listTags } from "@modules/tag/services/tag.service";
import TagSelector from "@modules/tag/components/TagSelector";
import useFileDrop from "@modules/shared/hooks/useFileDrop";
import Lightbox from "@modules/app/modules/ui/components/Lightbox/Lightbox";
import useTranslation from "@modules/app/i18n/useTranslation";

interface Props {
  workspaceSlugProp?: string;
  onCreated?: (ticketId: string) => void;
  onClose?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function TicketCreatePage({ workspaceSlugProp, onCreated, onClose, onDirtyChange }: Props = {}) {
  const params = useParams();
  const workspaceSlug = workspaceSlugProp || params.workspaceSlug;
  const navigate = useNavigate();
  const { t, tEnum } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("issue");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; type: "image" | "video" } | null>(null);

  const isDirty = name.trim() !== "" || description.trim() !== "" || files.length > 0 || tagIds.length > 0;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleCancel = () => {
    if (onClose) onClose();
    else navigate(`/dashboard/workspaces/${workspaceSlug}/tickets`);
  };

  useEffect(() => {
    if (workspaceSlug) listTags(workspaceSlug).then(setTags);
  }, [workspaceSlug]);

  const handleDroppedFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    toast.info(`${newFiles.length} file(s) added`);
  }, []);

  const { dragging } = useFileDrop({
    onFiles: handleDroppedFiles,
    accept: ["image/*", "video/*"],
  });

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug) return;
    setLoading(true);

    try {
      const res = await createTicket(workspaceSlug, {
        name,
        description,
        priority,
        category,
        tagIds,
      });

      for (const file of files) {
        await uploadToTicket(workspaceSlug, res.id, file);
      }

      toast.success(t("ticketCreate.success"));
      if (onCreated) {
        onCreated(res.id);
      } else {
        navigate(
          `/dashboard/workspaces/${workspaceSlug}/tickets/${res.id}`,
        );
      }
    } catch {
      toast.error("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const isImage = (file: File) => file.type.startsWith("image/");

  return (
    <div className="w-full max-w-2xl">
      <DropOverlay visible={dragging} />

      <h2 className="text-lg font-body-bold text-gray-800 mb-6">
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
            <Textarea
              placeholder={t("ticketCreate.descriptionPlaceholder")}
              value={description}
              onChange={setDescription}
              height={150}
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
                options={[...CATEGORIES]}
                label={(c) => tEnum("category", c)}
                value={(c) => c === category}
                onChange={setCategory}
              />
            </FormInput>
          </div>

          <FormInput label={t("ticketCreate.tags")}>
            <TagSelector tags={tags} selectedIds={tagIds} onChange={setTagIds} />
          </FormInput>

          <FormInput label={t("ticketCreate.attachments")}>
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
                className="inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-body-semibold rounded-button border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 cursor-pointer transition-all"
              >
                {t("ticketCreate.addFiles")}
              </label>
              <span className="text-exs text-gray-400 ml-2">
                {t("ticketCreate.pasteOrDrag")}
              </span>
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="relative group border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setLightbox({
                          src: URL.createObjectURL(file),
                          type: isImage(file) ? "image" : "video",
                        })
                      }
                      className="cursor-pointer"
                    >
                      {isImage(file) ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-24 h-24 object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center bg-gray-50">
                          <span className="text-exs text-gray-500 text-center px-1 break-all">
                            {file.name}
                          </span>
                        </div>
                      )}
                    </button>
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
          </FormInput>

          <div className="flex gap-3 mt-2">
            <Button type="submit" loading={loading}>
              {t("ticketCreate.submit")}
            </Button>
            <Button
              color="light"
              onClick={handleCancel
              }
            >
              {t("ticketCreate.cancel")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
