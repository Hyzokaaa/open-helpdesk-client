import { useState } from "react";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Select from "@modules/app/modules/ui/components/Select/Select";
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
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
      </div>
    </div>
  );
}
