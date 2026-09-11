import { useState } from "react";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Select from "@modules/app/modules/ui/components/Select/Select";
import Sheet from "@modules/app/modules/ui/components/Sheet/Sheet";
import type { WorkspaceMember } from "@modules/workspace/services/workspace.service";

interface Props {
  assignableMembers: WorkspaceMember[];
  currentUserId: string;
  onTransfer: (targetUserId: string) => Promise<void>;
  onClose: () => void;
  t: (key: any) => string;
}

export default function TicketTransferModal({ assignableMembers, currentUserId, onTransfer, onClose, t }: Props) {
  const [target, setTarget] = useState<string | null>(null);

  return (
    <Sheet size="sm" onClose={onClose}>
      <h3 className="text-base font-body-bold text-heading mb-1">{t("tickets.transferTitle")}</h3>
      <p className="text-sm text-muted mb-4">{t("tickets.transferMessage")}</p>
      <Select
        options={assignableMembers.filter((m) => m.userId !== currentUserId)}
        label={(m) => `${m.firstName} ${m.lastName}`}
        value={(m) => m.userId === target}
        onChange={(m) => setTarget(m.userId)}
        placeholder={t("ticketDetail.selectAssignee")}
      />
      <div className="flex gap-2 mt-4 justify-end">
        <Button size="sm" color="light" onClick={onClose}>{t("ticketDetail.cancel")}</Button>
        <Button size="sm" color="primary" disabled={!target} onClick={() => target && onTransfer(target)}>{t("tickets.transfer")}</Button>
      </div>
    </Sheet>
  );
}
