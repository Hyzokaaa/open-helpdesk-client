import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { toast } from "react-toastify";
import DropZone from "@modules/app/modules/ui/components/DropZone/DropZone";
import {
  getPortalInfo,
  getPortalCustomFields,
  createPortalTicket,
  portalStageUpload,
  PortalInfo,
  PortalCustomField,
} from "../services/portal.service";
import {
  getPalette,
  DEFAULT_PALETTE,
  PaletteDefinition,
} from "@modules/workspace/domain/palettes";
import { needsDarkText } from "@modules/workspace/domain/color-scale";
import { LOCAL_STORAGE_KEY, LocalStorage } from "@modules/app/domain/core/local-storage";
import translations from "@modules/app/i18n/translations";

function t(key: string): string {
  const lang = LocalStorage.get(LOCAL_STORAGE_KEY.LANGUAGE) || navigator.language?.slice(0, 2) || "en";
  const entry = (translations as Record<string, Record<string, string>>)[key];
  if (!entry) return key;
  return entry[lang] || entry["en"] || key;
}

function applyPortalPalette(def: PaletteDefinition) {
  const root = document.documentElement;
  Object.entries(def.scale).forEach(([shade, color]) => {
    root.style.setProperty(`--color-primary-${shade}`, color);
  });
  root.style.setProperty("--palette-accent-rgb", def.accentRgb);
  const lightPrimary = needsDarkText(def.scale["600"]);
  root.style.setProperty("--color-primary-contrast", lightPrimary ? "#1f2937" : "#ffffff");
}

interface StagedFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  token?: string;
}

export default function PortalPage() {
  const { workspaceSlug } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [info, setInfo] = useState<PortalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [customFieldDefs, setCustomFieldDefs] = useState<PortalCustomField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ ticketNumber: number; portalToken: string } | null>(null);

  useEffect(() => {
    if (!workspaceSlug) return;
    Promise.all([
      getPortalInfo(workspaceSlug),
      getPortalCustomFields(workspaceSlug),
    ])
      .then(([data, fields]) => {
        setInfo(data);
        setCustomFieldDefs(fields);
        const paletteName = data.palette ?? DEFAULT_PALETTE;
        const def = getPalette(paletteName);
        if (paletteName !== DEFAULT_PALETTE) {
          applyPortalPalette(def);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    return () => {
      const root = document.documentElement;
      const defaultDef = getPalette(DEFAULT_PALETTE);
      Object.keys(defaultDef.scale).forEach((shade) => {
        root.style.removeProperty(`--color-primary-${shade}`);
      });
      root.style.removeProperty("--palette-accent-rgb");
      root.style.removeProperty("--color-primary-contrast");
    };
  }, [workspaceSlug]);

  const stageFiles = useCallback(
    async (newFiles: File[]) => {
      if (!workspaceSlug) return;
      const staged: StagedFile[] = newFiles.map((file) => ({ file, status: "pending" as const }));
      setFiles((prev) => [...prev, ...staged]);

      for (const file of newFiles) {
        setFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, status: "uploading" as const } : f)),
        );
        try {
          const result = await portalStageUpload(workspaceSlug, file);
          setFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, status: "done" as const, token: result.token } : f,
            ),
          );
        } catch {
          setFiles((prev) =>
            prev.map((f) => (f.file === file ? { ...f, status: "error" as const } : f)),
          );
          toast.error(`${t("portal.uploadFailed")}: ${file.name}`);
        }
      }
    },
    [workspaceSlug],
  );

  const handleDroppedFiles = useCallback((newFiles: File[]) => {
    stageFiles(newFiles);
  }, [stageFiles]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      stageFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceSlug) return;
    setSubmitting(true);

    try {
      const uploadTokens = files
        .filter((f) => f.status === "done" && f.token)
        .map((f) => f.token!);

      const hasCustomFields = Object.keys(customFieldValues).length > 0;
      const res = await createPortalTicket(workspaceSlug, {
        name,
        email,
        subject,
        description,
        uploadTokens: uploadTokens.length > 0 ? uploadTokens : undefined,
        customFields: hasCustomFields ? customFieldValues : undefined,
      });

      setSubmitted({ ticketNumber: res.ticketNumber, portalToken: res.portalToken });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || t("portal.submitError");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isImage = (file: File) => file.type.startsWith("image/");
  const hasPending = files.some((f) => f.status === "uploading" || f.status === "pending");
  const requiredCustomFieldsFilled = customFieldDefs
    .filter((d) => d.required)
    .every((d) => {
      const v = customFieldValues[d.id];
      if (v === undefined || v === null || v === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
      return true;
    });
  const canSubmit =
    name.trim() !== "" &&
    email.trim() !== "" &&
    subject.trim() !== "" &&
    description.trim() !== "" &&
    requiredCustomFieldsFilled &&
    !hasPending &&
    !submitting;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">404</h1>
          <p className="text-gray-600 dark:text-gray-400">{t("portal.notFound")}</p>
        </div>
      </div>
    );
  }

  if (submitted !== null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t("portal.successTitle")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-1">
            {t("portal.successTicketNumber").replace("{number}", String(submitted.ticketNumber))}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
            {t("portal.successMessage")}
          </p>

          <a
            href={`/portal/tickets/${submitted.portalToken}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {t("portal.trackTicket")}
          </a>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {t("portal.trackTicketDesc")}
          </p>

          <button
            type="button"
            onClick={() => {
              setSubmitted(null);
              setName("");
              setEmail("");
              setSubject("");
              setDescription("");
              setCustomFieldValues({});
              setFiles([]);
            }}
            className="mt-6 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            {t("portal.submitAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:py-12">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{info.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {t("portal.subtitle")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("portal.name")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("portal.namePlaceholder")}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("portal.email")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("portal.emailPlaceholder")}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("portal.subject")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("portal.subjectPlaceholder")}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("portal.description")} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("portal.descriptionPlaceholder")}
                required
                rows={5}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-y"
              />
            </div>

            {customFieldDefs.length > 0 && (
              <div className="space-y-4">
                {customFieldDefs.map((def) => (
                  <div key={def.id}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {def.name} {def.required && <span className="text-red-500">*</span>}
                    </label>
                    {def.type === "text" && (
                      <input
                        type="text"
                        value={(customFieldValues[def.id] as string) ?? ""}
                        onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [def.id]: e.target.value }))}
                        placeholder={def.name}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      />
                    )}
                    {def.type === "number" && (
                      <input
                        type="number"
                        value={(customFieldValues[def.id] as number) ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCustomFieldValues((prev) => ({ ...prev, [def.id]: v === "" ? null : Number(v) }));
                        }}
                        placeholder={def.name}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      />
                    )}
                    {def.type === "select" && (
                      <select
                        value={(customFieldValues[def.id] as string) ?? ""}
                        onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [def.id]: e.target.value || null }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      >
                        <option value="">{t("portal.selectOption")}</option>
                        {(def.options ?? []).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {def.type === "multi-select" && (
                      <div className="flex flex-wrap gap-1.5">
                        {(def.options ?? []).map((opt) => {
                          const selected = Array.isArray(customFieldValues[def.id]) ? (customFieldValues[def.id] as string[]) : [];
                          const isSelected = selected.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const next = isSelected ? selected.filter((s) => s !== opt) : [...selected, opt];
                                setCustomFieldValues((prev) => ({ ...prev, [def.id]: next }));
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                                isSelected
                                  ? "bg-primary-600 text-white border-primary-600"
                                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {def.type === "date" && (
                      <input
                        type="date"
                        value={(customFieldValues[def.id] as string) ?? ""}
                        onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [def.id]: e.target.value || null }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      />
                    )}
                    {def.type === "checkbox" && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!customFieldValues[def.id]}
                          onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [def.id]: e.target.checked }))}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{def.name}</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("portal.attachments")}
              </label>
              <DropZone onFiles={handleDroppedFiles} accept={["image/*", "video/*"]} dropHint={t("drop.hint")}>
                <div>
                  <input
                    id="portal-files"
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                    className="hidden"
                    onChange={handleFilesChange}
                  />
                  <label
                    htmlFor="portal-files"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {t("portal.addFiles")}
                  </label>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{t("portal.pasteOrDrag")}</span>
                </div>

                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {files.map((entry, i) => (
                      <div
                        key={i}
                        className={`relative group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                          entry.status === "error"
                            ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                        }`}
                      >
                        {isImage(entry.file) ? (
                          <img
                            src={URL.createObjectURL(entry.file)}
                            alt={entry.file.name}
                            className="w-6 h-6 object-cover rounded"
                          />
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        )}
                        <span className="max-w-[120px] truncate text-gray-700 dark:text-gray-300">
                          {entry.file.name}
                        </span>
                        {(entry.status === "pending" || entry.status === "uploading") && (
                          <div className="w-3.5 h-3.5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        )}
                        {entry.status === "error" && (
                          <span className="text-red-500 text-xs font-medium">{t("portal.failed")}</span>
                        )}
                        {entry.status === "done" && (
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </DropZone>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-2.5 px-4 text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("portal.submitting")}
                </span>
              ) : (
                t("portal.submit")
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          {t("portal.poweredBy")}
        </p>
      </div>
    </div>
  );
}
