import { useState } from "react";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import type { WorkspaceMember } from "@modules/workspace/services/workspace.service";

export type MemberPickerMode = "assign" | "transfer";

interface Props {
  mode: MemberPickerMode;
  assignableMembers: WorkspaceMember[];
  /** Excluded from the list in transfer mode: you cannot transfer a ticket to yourself. */
  currentUserId: string;
  initialTarget?: string | null;
  onSubmit: (targetUserId: string) => void | Promise<void>;
  onClose: () => void;
  t: (key: any) => string;
}

export default function TicketMemberPickerModal({
  mode, assignableMembers, currentUserId, initialTarget, onSubmit, onClose, t,
}: Props) {
  const [target, setTarget] = useState<string | null>(initialTarget ?? null);
  const isTransfer = mode === "transfer";

  const options = isTransfer
    ? assignableMembers.filter((m) => m.userId !== currentUserId)
    : assignableMembers;

  return (
    <Sheet size="sm" onClose={onClose}>
      <h3 className="text-base font-body-bold text-heading mb-1">
        {t(isTransfer ? "tickets.transferTitle" : "tickets.assignTitle")}
      </h3>
      <p className="text-sm text-muted mb-4">
        {t(isTransfer ? "tickets.transferMessage" : "tickets.assignMessage")}
      </p>
      <Select
        options={options}
        label={(m) => `${m.firstName} ${m.lastName}`}
        value={(m) => m.userId === target}
        onChange={(m) => setTarget(m.userId)}
        placeholder={t("ticketDetail.selectAssignee")}
      />
      <div className="flex gap-2 mt-4 justify-end">
        <Button size="sm" color="light" onClick={onClose}>{t("ticketDetail.cancel")}</Button>
        <Button size="sm" color="primary" disabled={!target} onClick={() => target && onSubmit(target)}>
          {t(isTransfer ? "tickets.transfer" : "tickets.assign")}
        </Button>
      </div>
    </Sheet>
  );
}
