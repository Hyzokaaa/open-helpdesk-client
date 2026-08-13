import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import Input from "@modules/app/modules/ui/components/Input/Input";
import Button from "@modules/app/modules/ui/components/Button/Button";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import StatusBadge from "@modules/app/modules/ui/components/StatusBadge/StatusBadge";
import ActionMenu from "@modules/app/modules/ui/components/ActionMenu/ActionMenu";
import ConfirmModal from "@modules/app/modules/ui/components/ConfirmModal/ConfirmModal";
import { createWorkspace } from "../services/workspace.service";
import {
  Department,
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@modules/department/services/department.service";
import {
  listMailboxes,
  deleteMailbox,
  type MailboxDto,
} from "../services/mailbox.service";
import { MailboxForm } from "../components/MailboxSettings";
import {
  InvitationItem,
  listInvitations,
  createInvitationBatch,
  cancelInvitation,
  getInvitationLink,
} from "../services/invitation.service";
import { getEmailSender } from "../services/email-sender.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import useConfig from "@modules/app/hooks/useConfig";

type Step = "workspace" | "departments" | "email" | "invite" | "done";
const STEPS: Step[] = ["workspace", "departments", "email", "invite", "done"];
const ROLES = ["admin", "supervisor", "agent", "reporter"] as const;

export default function WorkspaceCreatePage() {
  const navigate = useNavigate();
  const { t, tEnum } = useTranslation();
  const { emailConfigured } = useConfig();

  const [step, setStep] = useState<Step>("workspace");
  const [slug, setSlug] = useState("");

  // Step 1: Workspace
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Step 2: Departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [addingDept, setAddingDept] = useState(false);
  const [editDeptId, setEditDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDeptDesc, setEditDeptDesc] = useState("");
  const [deleteDeptId, setDeleteDeptId] = useState<string | null>(null);

  // Step 3: Email
  const [mailboxes, setMailboxes] = useState<MailboxDto[]>([]);
  const [showMailboxForm, setShowMailboxForm] = useState(false);
  const [editMailbox, setEditMailbox] = useState<MailboxDto | null>(null);
  const [deleteMailboxId, setDeleteMailboxId] = useState<string | null>(null);
  const [hasWorkspaceSender, setHasWorkspaceSender] = useState(false);

  // Step 4: Invite
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [newInvites, setNewInvites] = useState([{ email: "", role: "agent" }]);
  const [inviting, setInviting] = useState(false);
  const [cancelInvId, setCancelInvId] = useState<string | null>(null);

  const canSendEmail = emailConfigured || hasWorkspaceSender;
  const stepIndex = STEPS.indexOf(step);

  // Fetchers
  const fetchDepartments = () => { if (slug) listDepartments(slug).then(setDepartments).catch(() => {}); };
  const fetchMailboxes = () => { if (slug) listMailboxes(slug).then(setMailboxes).catch(() => {}); };
  const fetchInvitations = () => { if (slug) listInvitations(slug).then(setInvitations).catch(() => {}); };
  const checkSender = () => { if (slug) getEmailSender(slug).then((s) => setHasWorkspaceSender(!!s)).catch(() => {}); };

  useEffect(() => {
    if (!slug) return;
    if (step === "departments") fetchDepartments();
    if (step === "email") { fetchMailboxes(); checkSender(); }
    if (step === "invite") { fetchInvitations(); checkSender(); }
  }, [step, slug]);

  // Step 1
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const ws = await createWorkspace({ name: name.trim(), description: description.trim() });
      setSlug(ws.slug);
      toast.success(t("workspaces.created"));
      setStep("departments");
    } catch (err: any) {
      if (!err?.handled) toast.error(t("workspaces.createError"));
    } finally {
      setCreating(false);
    }
  };

  // Step 2
  const handleAddDept = async () => {
    if (!deptName.trim() || !slug) return;
    setAddingDept(true);
    try {
      await createDepartment(slug, { name: deptName.trim(), description: deptDesc.trim() || undefined });
      setDeptName(""); setDeptDesc("");
      fetchDepartments();
    } catch { toast.error("Failed to create department"); }
    finally { setAddingDept(false); }
  };

  const handleUpdateDept = async () => {
    if (!editDeptId || !slug) return;
    try {
      await updateDepartment(slug, editDeptId, { name: editDeptName, description: editDeptDesc || undefined });
      setEditDeptId(null);
      fetchDepartments();
    } catch { toast.error("Failed to update department"); }
  };

  const handleDeleteDept = async () => {
    if (!deleteDeptId || !slug) return;
    try {
      await deleteDepartment(slug, deleteDeptId);
      setDeleteDeptId(null);
      fetchDepartments();
    } catch { toast.error("Failed to delete department"); }
  };

  // Step 3
  const handleMailboxSaved = () => {
    setShowMailboxForm(false);
    setEditMailbox(null);
    fetchMailboxes();
    setHasWorkspaceSender(true);
  };

  const handleDeleteMailbox = async () => {
    if (!deleteMailboxId || !slug) return;
    try {
      await deleteMailbox(slug, deleteMailboxId);
      setDeleteMailboxId(null);
      fetchMailboxes();
    } catch { toast.error("Failed to delete mailbox"); }
  };

  // Step 4
  const handleInvite = async () => {
    const valid = newInvites.filter((i) => i.email.trim());
    if (!valid.length || !slug) return;
    setInviting(true);
    try {
      const results = await createInvitationBatch(slug, valid.map((i) => ({ email: i.email.trim(), role: i.role })));
      const emailed = results.filter((r: any) => r.emailSent).length;
      const created = results.filter((r) => r.status === "sent").length;
      toast.success(emailed > 0 ? `${emailed} ${t("invitations.sent")}` : `${created} ${t("invitations.createdNotSent")}`);
      setNewInvites([{ email: "", role: "agent" }]);
      fetchInvitations();
    } catch { toast.error(t("invitations.sendError")); }
    finally { setInviting(false); }
  };

  const handleCancelInv = async () => {
    if (!cancelInvId || !slug) return;
    try {
      await cancelInvitation(slug, cancelInvId);
      setCancelInvId(null);
      fetchInvitations();
    } catch { toast.error("Failed to cancel invitation"); }
  };

  const handleCopyLink = async (id: string) => {
    if (!slug) return;
    try {
      const link = await getInvitationLink(slug, id);
      await navigator.clipboard.writeText(link);
      toast.success(t("invitations.linkCopied"));
    } catch { toast.error(t("invitations.sendError")); }
  };

  const goToWorkspace = () => navigate(`/dashboard/workspaces/${slug}/tickets`);
  const handleClose = () => navigate(-1);
  const goBack = () => { const prev = STEPS[stepIndex - 1]; if (prev && prev !== "workspace") setStep(prev); };

  return (
    <Sheet onClose={step === "workspace" ? handleClose : goToWorkspace}>
      <div className="w-full">
        {/* Progress */}
        <div className="flex gap-1 mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-border-card"}`} />
          ))}
        </div>

        {/* Back button */}
        {stepIndex > 1 && (
          <button onClick={goBack} className="text-xs text-muted hover:text-heading cursor-pointer mb-3 flex items-center gap-1">
            <span>←</span> {t("tickets.previous")}
          </button>
        )}

        {/* Step 1: Workspace */}
        {step === "workspace" && (
          <>
            <h3 className="text-lg font-body-bold text-heading mb-1">{t("workspaces.newWorkspace")}</h3>
            <p className="text-xs text-muted mb-4">{t("wizard.workspaceDesc")}</p>
            <form onSubmit={handleCreateWorkspace}>
              <FormInput label={t("workspaces.name")} required>
                <Input placeholder={t("workspaces.namePlaceholder")} value={name} onChange={setName} />
              </FormInput>
              <FormInput label={t("workspaces.description")}>
                <Input placeholder={t("workspaces.descriptionPlaceholder")} value={description} onChange={setDescription} />
              </FormInput>
              <div className="flex justify-end gap-2 mt-2">
                <Button size="sm" color="light" onClick={handleClose}>{t("workspaces.cancel")}</Button>
                <Button type="submit" size="sm" loading={creating} disabled={!name.trim()}>{t("wizard.next")}</Button>
              </div>
            </form>
          </>
        )}

        {/* Step 2: Departments */}
        {step === "departments" && (
          <>
            <h3 className="text-lg font-body-bold text-heading mb-1">{t("wizard.addDepartments")}</h3>
            <p className="text-xs text-muted mb-4">{t("wizard.addDepartmentsDesc")}</p>

            {departments.length > 0 && (
              <div className="bg-surface border border-border-card rounded-lg mb-4 overflow-hidden">
                {departments.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-3 py-2 border-b border-border-row last:border-b-0">
                    {editDeptId === d.id ? (
                      <div className="flex gap-2 flex-1 items-end">
                        <FormInput className="flex-1 !mb-0">
                          <Input value={editDeptName} onChange={setEditDeptName} />
                        </FormInput>
                        <FormInput className="flex-1 !mb-0">
                          <Input value={editDeptDesc} onChange={setEditDeptDesc} placeholder={t("wizard.deptDescPlaceholder")} />
                        </FormInput>
                        <Button size="xs" onClick={handleUpdateDept}>{t("members.save")}</Button>
                        <Button size="xs" color="light" onClick={() => setEditDeptId(null)}>{t("workspaces.cancel")}</Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-sm font-body-medium text-heading">{d.name}</span>
                          {d.description && <span className="text-xs text-muted ml-2">{d.description}</span>}
                        </div>
                        <ActionMenu items={[
                          { label: t("ticketDetail.edit"), onClick: () => { setEditDeptId(d.id); setEditDeptName(d.name); setEditDeptDesc(d.description ?? ""); } },
                          { label: t("members.remove"), onClick: () => setDeleteDeptId(d.id), danger: true },
                        ]} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-2 items-end">
              <FormInput label={t("departments.name")} className="flex-1 !mb-0">
                <Input value={deptName} onChange={setDeptName} placeholder={t("wizard.deptPlaceholder")} />
              </FormInput>
              <FormInput label={t("departments.description")} className="flex-1 !mb-0">
                <Input value={deptDesc} onChange={setDeptDesc} placeholder={t("wizard.deptDescPlaceholder")} />
              </FormInput>
              <Button size="sm" onClick={handleAddDept} disabled={!deptName.trim()} loading={addingDept}>{t("wizard.addDepartment")}</Button>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button size="sm" color="light" onClick={() => setStep("email")}>{t("wizard.skip")}</Button>
              <Button size="sm" onClick={() => setStep("email")}>{t("wizard.next")}</Button>
            </div>

            {deleteDeptId && (
              <ConfirmModal
                title={t("departments.confirmDelete")}
                message={t("departments.confirmDelete")}
                confirmLabel={t("members.remove")}
                danger
                onConfirm={handleDeleteDept}
                onCancel={() => setDeleteDeptId(null)}
              />
            )}
          </>
        )}

        {/* Step 3: Email */}
        {step === "email" && (
          <>
            <h3 className="text-lg font-body-bold text-heading mb-1">{t("wizard.configureEmail")}</h3>
            <p className="text-xs text-muted mb-4">{t("wizard.configureEmailDesc")}</p>

            {mailboxes.length > 0 && !showMailboxForm && (
              <div className="bg-surface border border-border-card rounded-lg mb-4 overflow-hidden">
                {mailboxes.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 border-b border-border-row last:border-b-0">
                    <div>
                      <span className="text-sm font-body-medium text-heading">{m.address}</span>
                      <StatusBadge label={m.isActive ? t("emailRules.active") : t("emailRules.inactive")} color={m.isActive ? "green" : "gray"} size="xs" />
                    </div>
                    <ActionMenu items={[
                      { label: t("ticketDetail.edit"), onClick: () => { setEditMailbox(m); setShowMailboxForm(true); } },
                      { label: t("members.remove"), onClick: () => setDeleteMailboxId(m.id), danger: true },
                    ]} />
                  </div>
                ))}
              </div>
            )}

            {showMailboxForm ? (
              <>
                <MailboxForm
                  slug={slug}
                  mailbox={editMailbox}
                  onSaved={handleMailboxSaved}
                  onPlanLimit={() => false}
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm" color="light" onClick={() => { setShowMailboxForm(false); setEditMailbox(null); }}>{t("workspaces.cancel")}</Button>
                </div>
              </>
            ) : (
              <Button size="sm" color="light" onClick={() => { setEditMailbox(null); setShowMailboxForm(true); }}>
                + {t("mailbox.add")}
              </Button>
            )}

            {!showMailboxForm && (
              <div className="flex justify-end gap-2 mt-4">
                <Button size="sm" color="light" onClick={() => setStep("invite")}>{t("wizard.skip")}</Button>
                <Button size="sm" onClick={() => setStep("invite")}>{t("wizard.next")}</Button>
              </div>
            )}

            {deleteMailboxId && (
              <ConfirmModal
                title={t("common.delete")}
                message={t("common.delete")}
                confirmLabel={t("members.remove")}
                danger
                onConfirm={handleDeleteMailbox}
                onCancel={() => setDeleteMailboxId(null)}
              />
            )}
          </>
        )}

        {/* Step 4: Invite */}
        {step === "invite" && (
          <>
            <h3 className="text-lg font-body-bold text-heading mb-1">{t("wizard.inviteTeam")}</h3>
            <p className="text-xs text-muted mb-4">{t("wizard.inviteTeamDesc")}</p>

            {!canSendEmail && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800/40">
                <p className="text-xs text-amber-800 dark:text-amber-300">{t("invitations.noEmailInfo")}</p>
              </div>
            )}

            {invitations.length > 0 && (
              <div className="bg-surface border border-border-card rounded-lg mb-4 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-card bg-surface-hover">
                      <th className="px-3 py-2 text-left text-xs font-body-semibold text-subtle uppercase">{t("admin.col.email")}</th>
                      <th className="px-3 py-2 text-left text-xs font-body-semibold text-subtle uppercase w-[80px]">{t("admin.col.role")}</th>
                      <th className="px-2 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="border-b border-border-row last:border-b-0">
                        <td className="px-3 py-2 text-sm text-body">{inv.email}</td>
                        <td className="px-3 py-2"><StatusBadge label={tEnum("role", inv.role)} color="gray" size="xs" /></td>
                        <td className="px-2 py-2">
                          <ActionMenu items={[
                            { label: t("invitations.copyLink"), onClick: () => handleCopyLink(inv.id) },
                            { label: t("invitations.cancel"), onClick: () => setCancelInvId(inv.id), danger: true },
                          ]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="space-y-2 mb-3">
              {newInvites.map((inv, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <FormInput label={i === 0 ? t("invitations.email") : undefined} className="flex-[3] !mb-0">
                    <Input type="email" placeholder="user@example.com" value={inv.email} onChange={(v) => setNewInvites((p) => p.map((r, j) => j === i ? { ...r, email: v } : r))} />
                  </FormInput>
                  <FormInput label={i === 0 ? t("members.role") : undefined} className="flex-1 !mb-0">
                    <Select options={[...ROLES]} label={(r) => r} value={(r) => r === inv.role} onChange={(r) => setNewInvites((p) => p.map((row, j) => j === i ? { ...row, role: r } : row))} />
                  </FormInput>
                  {newInvites.length > 1 && (
                    <button type="button" onClick={() => setNewInvites((p) => p.filter((_, j) => j !== i))} className="text-muted hover:text-danger text-sm pb-1 cursor-pointer">✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setNewInvites((p) => [...p, { email: "", role: "agent" }])} className="text-xs text-primary cursor-pointer mb-4">
              + {t("invitations.addAnother")}
            </button>

            <div className="flex justify-between mt-4">
              <Button size="sm" loading={inviting} onClick={handleInvite} disabled={!newInvites.some((i) => i.email.trim())}>
                {canSendEmail ? t("invitations.send") : t("invitations.createInvitation")}
              </Button>
              <div className="flex gap-2">
                <Button size="sm" color="light" onClick={() => setStep("done")}>{t("wizard.skip")}</Button>
                <Button size="sm" onClick={() => setStep("done")} disabled={invitations.length === 0}>{t("wizard.next")}</Button>
              </div>
            </div>

            {cancelInvId && (
              <ConfirmModal
                title={t("invitations.cancel")}
                message={t("invitations.cancel")}
                confirmLabel={t("invitations.cancel")}
                danger
                onConfirm={handleCancelInv}
                onCancel={() => setCancelInvId(null)}
              />
            )}
          </>
        )}

        {/* Step 5: Done */}
        {step === "done" && (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-body-bold text-heading mb-2">{t("wizard.done")}</h3>
            <p className="text-sm text-muted mb-6">{t("wizard.doneDesc")}</p>
            <div className="flex justify-center">
              <Button onClick={goToWorkspace}>{t("wizard.goToWorkspace")}</Button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
