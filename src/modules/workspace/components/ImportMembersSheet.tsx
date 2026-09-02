import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import useTranslation from "@modules/app/i18n/useTranslation";
import {
  importMembersPreview,
  importMembersConfirm,
  downloadImportTemplate,
  ImportPreviewResult,
  ImportPreviewRow,
  ImportPreviewError,
} from "../services/workspace.service";

interface Props {
  workspaceSlug: string;
  onClose: () => void;
  onImported?: () => void;
}

type Step = "upload" | "preview" | "success";

type EditingCell = { section: "valid" | "error"; rowIndex: number; field: string } | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ["admin", "agent", "user"];

function validateRow(row: { email: string; firstName: string; role: string }): string | null {
  if (!row.email) return "Email is required";
  if (!EMAIL_REGEX.test(row.email)) return "Invalid email format";
  if (!row.firstName) return "First name is required";
  if (!VALID_ROLES.includes(row.role)) return `Invalid role`;
  return null;
}

export default function ImportMembersSheet({ workspaceSlug, onClose, onImported }: Props) {
  const { t, tEnum } = useTranslation();
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [validRows, setValidRows] = useState<ImportPreviewRow[]>([]);
  const [errorRows, setErrorRows] = useState<ImportPreviewError[]>([]);
  const [result, setResult] = useState<{ created: number; added: number; skipped: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [skipVerification, setSkipVerification] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error(t("import.invalidFile"));
      return;
    }
    setLoading(true);
    try {
      const data = await importMembersPreview(workspaceSlug, file);
      setPreview(data);
      setValidRows([...data.valid]);
      setErrorRows([...data.errors]);
      setStep("preview");
    } catch (err: any) {
      if (!err?.handled) toast.error(t("import.previewError"));
    }
    setLoading(false);
  }, [workspaceSlug, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleConfirm = async () => {
    if (validRows.length === 0) return;
    setLoading(true);
    try {
      const res = await importMembersConfirm(
        workspaceSlug,
        validRows.map((r) => ({
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          role: r.role,
        })),
        skipVerification,
      );
      setResult(res);
      setStep("success");
      onImported?.();
    } catch (err: any) {
      if (!err?.handled) toast.error(t("import.confirmError"));
    }
    setLoading(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadImportTemplate(workspaceSlug);
    } catch {
      toast.error(t("import.templateError"));
    }
  };

  const startEditing = (section: "valid" | "error", rowIndex: number, field: string) => {
    setEditingCell({ section, rowIndex, field });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = (value: string) => {
    if (!editingCell) return;
    const { section, rowIndex, field } = editingCell;

    if (section === "valid") {
      setValidRows((prev) => {
        const updated = [...prev];
        updated[rowIndex] = { ...updated[rowIndex], [field]: value };
        return updated;
      });
    } else {
      const row = errorRows[rowIndex];
      const updatedRow = {
        email: field === "email" ? value : row.email,
        firstName: field === "firstName" ? value : row.firstName,
        lastName: field === "lastName" ? value : row.lastName,
        role: field === "role" ? value : row.role,
      };

      const validationError = validateRow(updatedRow);
      if (!validationError) {
        setErrorRows((prev) => prev.filter((_, i) => i !== rowIndex));
        setValidRows((prev) => [
          ...prev,
          { ...updatedRow, status: "new_user" as const },
        ]);
      } else {
        setErrorRows((prev) => {
          const updated = [...prev];
          updated[rowIndex] = { ...updated[rowIndex], [field]: value, error: validationError };
          return updated;
        });
      }
    }

    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, value: string) => {
    if (e.key === "Enter") {
      commitEdit(value);
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const removeValidRow = (index: number) => {
    setValidRows((prev) => prev.filter((_, i) => i !== index));
  };

  const removeErrorRow = (index: number) => {
    setErrorRows((prev) => prev.filter((_, i) => i !== index));
  };

  const renderEditableCell = (
    section: "valid" | "error",
    rowIndex: number,
    field: string,
    value: string,
    className: string,
  ) => {
    const isEditing =
      editingCell?.section === section &&
      editingCell?.rowIndex === rowIndex &&
      editingCell?.field === field;

    if (isEditing && field === "role") {
      return (
        <td className="px-3 py-1">
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            defaultValue={value}
            onChange={(e) => commitEdit(e.target.value)}
            onBlur={(e) => commitEdit(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, (e.target as HTMLSelectElement).value)}
            className="w-full px-1.5 py-0.5 text-sm border border-primary rounded bg-surface text-heading focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {VALID_ROLES.map((r) => (
              <option key={r} value={r}>{tEnum("role", r)}</option>
            ))}
          </select>
        </td>
      );
    }

    if (isEditing) {
      return (
        <td className="px-3 py-1">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            defaultValue={value}
            onBlur={(e) => commitEdit(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, (e.target as HTMLInputElement).value)}
            className="w-full px-1.5 py-0.5 text-sm border border-primary rounded bg-surface text-heading focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </td>
      );
    }

    return (
      <td
        className={`px-3 py-2 cursor-pointer hover:bg-surface-hover transition-colors ${className}`}
        onClick={() => startEditing(section, rowIndex, field)}
        title={t("import.clickToEdit")}
      >
        {field === "role" ? (
          <StatusBadge
            label={tEnum("role", value)}
            color={value === "admin" ? "primary" : value === "agent" ? "blue" : "gray"}
            size="xs"
          />
        ) : (
          value || <span className="text-muted italic">{t("import.empty")}</span>
        )}
      </td>
    );
  };

  return (
    <Sheet onClose={onClose}>
      <div className="w-full">
        <h2 className="text-lg font-body-bold text-heading mb-1">{t("import.title")}</h2>

        {step === "upload" && (
          <>
            <p className="text-sm text-muted mb-4">{t("import.description")}</p>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border-input"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="text-3xl mb-2 text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-sm text-muted mb-3">{t("import.dropHint")}</p>
              <label className="inline-block cursor-pointer">
                <span className="text-sm text-primary font-body-medium hover:underline">{t("import.browse")}</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="mt-3 text-sm text-primary hover:underline cursor-pointer"
            >
              {t("import.downloadTemplate")}
            </button>

            {loading && (
              <p className="text-sm text-muted mt-3">{t("import.parsing")}</p>
            )}
          </>
        )}

        {step === "preview" && preview && (
          <>
            <div className="flex gap-4 mb-4 mt-2">
              <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg text-sm">
                <span className="font-body-bold">{validRows.length}</span> {t("import.toImport")}
              </div>
              {errorRows.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
                  <span className="font-body-bold">{errorRows.length}</span> {t("import.withErrors")}
                </div>
              )}
              {preview.summary.alreadyMembers > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-2 rounded-lg text-sm">
                  <span className="font-body-bold">{preview.summary.alreadyMembers}</span> {t("import.alreadyMembers")}
                </div>
              )}
            </div>

            {validRows.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-body-semibold text-heading mb-2">{t("import.validRows")}</h3>
                <div className="bg-surface border border-border-card rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-card bg-surface-hover">
                        <th className="px-3 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.email")}</th>
                        <th className="px-3 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.name")}</th>
                        <th className="px-3 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.role")}</th>
                        <th className="px-3 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("import.status")}</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {validRows.map((row, i) => (
                        <tr key={i} className="border-b border-border-row group">
                          {renderEditableCell("valid", i, "email", row.email, "text-sm text-muted")}
                          <td className="px-3 py-2 text-sm text-heading">
                            <div className="flex gap-1">
                              <span
                                className="cursor-pointer hover:bg-surface-hover rounded px-1 transition-colors"
                                onClick={() => startEditing("valid", i, "firstName")}
                                title={t("import.clickToEdit")}
                              >
                                {editingCell?.section === "valid" && editingCell?.rowIndex === i && editingCell?.field === "firstName" ? (
                                  <input
                                    ref={inputRef as React.RefObject<HTMLInputElement>}
                                    type="text"
                                    defaultValue={row.firstName}
                                    onBlur={(e) => commitEdit(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, (e.target as HTMLInputElement).value)}
                                    className="w-20 px-1 py-0 text-sm border border-primary rounded bg-surface text-heading focus:outline-none"
                                  />
                                ) : (
                                  row.firstName
                                )}
                              </span>
                              <span
                                className="cursor-pointer hover:bg-surface-hover rounded px-1 transition-colors"
                                onClick={() => startEditing("valid", i, "lastName")}
                                title={t("import.clickToEdit")}
                              >
                                {editingCell?.section === "valid" && editingCell?.rowIndex === i && editingCell?.field === "lastName" ? (
                                  <input
                                    ref={inputRef as React.RefObject<HTMLInputElement>}
                                    type="text"
                                    defaultValue={row.lastName}
                                    onBlur={(e) => commitEdit(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, (e.target as HTMLInputElement).value)}
                                    className="w-20 px-1 py-0 text-sm border border-primary rounded bg-surface text-heading focus:outline-none"
                                  />
                                ) : (
                                  row.lastName
                                )}
                              </span>
                            </div>
                          </td>
                          {renderEditableCell("valid", i, "role", row.role, "")}
                          <td className="px-3 py-2">
                            <StatusBadge
                              label={row.status === "new_user" ? t("import.newUser") : t("import.existingUser")}
                              color={row.status === "new_user" ? "green" : "blue"}
                              size="xs"
                            />
                          </td>
                          <td className="px-1 py-2">
                            <button
                              type="button"
                              onClick={() => removeValidRow(i)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-danger rounded transition-all cursor-pointer"
                              title={t("import.removeRow")}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {errorRows.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-body-semibold text-heading mb-2">{t("import.errorRows")}</h3>
                <p className="text-xs text-muted mb-2">{t("import.editToFix")}</p>
                <div className="bg-surface border border-border-card rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-card bg-surface-hover">
                        <th className="px-3 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.email")}</th>
                        <th className="px-3 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.name")}</th>
                        <th className="px-3 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.role")}</th>
                        <th className="px-3 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("import.error")}</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {errorRows.map((err, i) => (
                        <tr key={i} className="border-b border-border-row bg-red-50/30 dark:bg-red-900/5 group">
                          {renderEditableCell("error", i, "email", err.email, "text-sm text-muted")}
                          <td className="px-3 py-2 text-sm text-heading">
                            <div className="flex gap-1">
                              <span
                                className="cursor-pointer hover:bg-surface-hover rounded px-1 transition-colors"
                                onClick={() => startEditing("error", i, "firstName")}
                                title={t("import.clickToEdit")}
                              >
                                {editingCell?.section === "error" && editingCell?.rowIndex === i && editingCell?.field === "firstName" ? (
                                  <input
                                    ref={inputRef as React.RefObject<HTMLInputElement>}
                                    type="text"
                                    defaultValue={err.firstName}
                                    onBlur={(e) => commitEdit(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, (e.target as HTMLInputElement).value)}
                                    className="w-20 px-1 py-0 text-sm border border-primary rounded bg-surface text-heading focus:outline-none"
                                  />
                                ) : (
                                  err.firstName || <span className="text-muted italic">{t("import.empty")}</span>
                                )}
                              </span>
                              <span
                                className="cursor-pointer hover:bg-surface-hover rounded px-1 transition-colors"
                                onClick={() => startEditing("error", i, "lastName")}
                                title={t("import.clickToEdit")}
                              >
                                {editingCell?.section === "error" && editingCell?.rowIndex === i && editingCell?.field === "lastName" ? (
                                  <input
                                    ref={inputRef as React.RefObject<HTMLInputElement>}
                                    type="text"
                                    defaultValue={err.lastName}
                                    onBlur={(e) => commitEdit(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, (e.target as HTMLInputElement).value)}
                                    className="w-20 px-1 py-0 text-sm border border-primary rounded bg-surface text-heading focus:outline-none"
                                  />
                                ) : (
                                  err.lastName || <span className="text-muted italic">{t("import.empty")}</span>
                                )}
                              </span>
                            </div>
                          </td>
                          {renderEditableCell("error", i, "role", err.role, "")}
                          <td className="px-3 py-2 text-sm text-danger">{err.error}</td>
                          <td className="px-1 py-2">
                            <button
                              type="button"
                              onClick={() => removeErrorRow(i)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-danger rounded transition-all cursor-pointer"
                              title={t("import.removeRow")}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={skipVerification}
                onChange={(e) => setSkipVerification(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-body">{t("import.skipVerification")}</span>
            </label>

            <div className="flex justify-between items-center mt-3">
              <button
                type="button"
                onClick={() => { setStep("upload"); setPreview(null); setValidRows([]); setErrorRows([]); }}
                className="text-sm text-muted hover:text-heading cursor-pointer"
              >
                {t("import.uploadAnother")}
              </button>
              <div className="flex gap-2">
                <Button size="sm" color="light" onClick={onClose}>
                  {t("members.cancel")}
                </Button>
                <Button
                  size="sm"
                  loading={loading}
                  disabled={validRows.length === 0}
                  onClick={handleConfirm}
                >
                  {t("import.confirm")} ({validRows.length})
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "success" && result && (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-body-bold text-heading mb-2">{t("import.successTitle")}</h3>
            <p className="text-sm text-muted mb-1">
              {t("import.usersCreated").replace("{count}", String(result.created))}
            </p>
            <p className="text-sm text-muted mb-1">
              {t("import.membersAdded").replace("{count}", String(result.added))}
            </p>
            {result.skipped > 0 && (
              <p className="text-sm text-muted mb-1">
                {t("import.skipped").replace("{count}", String(result.skipped))}
              </p>
            )}
            {result.created > 0 && (
              <p className="text-sm text-muted mt-3">
                {t("import.welcomeEmailsSent")}
              </p>
            )}
            <div className="mt-6">
              <Button size="sm" onClick={onClose}>
                {t("import.done")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
