import { useState } from "react";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import type { WorkspaceMember } from "@modules/workspace/services/workspace.service";

export type MemberPickerMode = "assign" | "transfer" | "follow";

interface Props {
  mode: MemberPickerMode;
  assignableMembers: WorkspaceMember[];
  /** Excluded from the list in transfer mode: you cannot transfer a ticket to yourself. */
  currentUserId: string;
  initialTarget?: string | null;
  /** Assign mode: offers "Unassigned", so the ticket goes back to the queue. */
  allowUnassign?: boolean;
  onSubmit: (targetUserId: string | null) => void | Promise<void>;
  onClose: () => void;
  t: (key: any) => string;
}

const TEXTS: Record<MemberPickerMode, { title: string; message: string; submit: string }> = {
  assign: { title: "tickets.assignTitle", message: "tickets.assignMessage", submit: "tickets.assign" },
  transfer: { title: "tickets.transferTitle", message: "tickets.transferMessage", submit: "tickets.transfer" },
  follow: { title: "ticketDetail.addFollowerTitle", message: "ticketDetail.addFollowerMessage", submit: "ticketDetail.addFollower" },
};

/** The "Unassigned" choice, kept apart from real members by its empty id. */
const NOBODY = "";

export default function TicketMemberPickerModal({
  mode, assignableMembers, currentUserId, initialTarget, allowUnassign, onSubmit, onClose, t,
}: Props) {
  // undefined: nothing chosen yet; NOBODY: "Unassigned"
  const [target, setTarget] = useState<string | undefined>(initialTarget ?? undefined);
  const [saving, setSaving] = useState(false);
  const texts = TEXTS[mode];

  const members = mode === "transfer" ? assignableMembers.filter((m) => m.userId !== currentUserId) : assignableMembers;
  const options: { userId: string; name: string }[] = [
    ...(mode === "assign" && allowUnassign ? [{ userId: NOBODY, name: t("ticketDetail.unassigned") }] : []),
    ...members.map((m) => ({ userId: m.userId, name: `${m.firstName} ${m.lastName}` })),
  ];
  // Choosing the current assignee again changes nothing
  const unchanged = target === undefined || (mode === "assign" && (target || null) === (initialTarget ?? null));

  const submit = async () => {
    if (unchanged) return;
    setSaving(true);
    try { await onSubmit(target || null); } finally { setSaving(false); }
  };

  return (
    <Sheet size="sm" onClose={onClose}>
      <h3 className="text-base font-body-bold text-heading mb-1">{t(texts.title)}</h3>
      <p className="text-sm text-muted mb-4">{t(texts.message)}</p>
      <Select
        options={options}
        label={(o) => o.name}
        value={(o) => o.userId === target}
        onChange={(o) => setTarget(o.userId)}
        placeholder={t(mode === "follow" ? "ticketDetail.selectMember" : "ticketDetail.selectAssignee")}
        searchable={options.length > 8}
      />
      <div className="flex gap-2 mt-4 justify-end">
        <Button size="sm" color="light" onClick={onClose}>{t("ticketDetail.cancel")}</Button>
        <Button size="sm" color="primary" disabled={unchanged || saving} onClick={submit}>
          {target === NOBODY ? t("ticketDetail.unassign") : t(texts.submit)}
        </Button>
      </div>
    </Sheet>
  );
}
