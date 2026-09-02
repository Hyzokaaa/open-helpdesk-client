import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Card from "@modules/app/modules/ui/components/Card/Card";
import {
  acceptTransfer,
  rejectTransfer,
  cancelTransfer,
} from "../services/ticket.service";
import type { PendingTransfer } from "../services/ticket.service";

interface PendingTransferCardProps {
  pendingTransfer: PendingTransfer;
  workspaceSlug: string;
  ticketId: string;
  userId: string | undefined;
  fetchTicket: (refreshActivity?: boolean) => void;
  t: (key: any) => string;
}

export default function PendingTransferCard({
  pendingTransfer,
  workspaceSlug,
  ticketId,
  userId,
  fetchTicket,
  t,
}: PendingTransferCardProps) {
  return (
    <Card className="p-4 border-amber-300 dark:border-amber-700">
      <p className="text-xs text-subtle font-body-medium mb-1">{t("tickets.pendingTransfer")}</p>
      <p className="text-xs text-muted mb-3">
        {pendingTransfer.targetUserId === userId
          ? t("tickets.pendingTransferFrom").replace("{name}", pendingTransfer.requesterName)
          : t("tickets.pendingTransferTo").replace("{name}", pendingTransfer.targetName)}
      </p>
      <div className="flex gap-2">
        {pendingTransfer.targetUserId === userId ? (
          <>
            <Button size="xs" color="primary" onClick={async () => {
              try {
                await acceptTransfer(workspaceSlug, ticketId, pendingTransfer.id);
                toast.success(t("tickets.transferAccepted"));
                fetchTicket(true);
              } catch { toast.error(t("ticketDetail.actionError")); }
            }}>{t("tickets.accept")}</Button>
            <Button size="xs" color="light" onClick={async () => {
              try {
                await rejectTransfer(workspaceSlug, ticketId, pendingTransfer.id);
                toast.success(t("tickets.transferRejected"));
                fetchTicket(true);
              } catch { toast.error(t("ticketDetail.actionError")); }
            }}>{t("tickets.reject")}</Button>
          </>
        ) : pendingTransfer.requesterId === userId ? (
          <Button size="xs" color="light" onClick={async () => {
            try {
              await cancelTransfer(workspaceSlug, ticketId, pendingTransfer.id);
              toast.success(t("tickets.transferCancelled"));
              fetchTicket(true);
            } catch { toast.error(t("ticketDetail.actionError")); }
          }}>{t("tickets.cancelTransfer")}</Button>
        ) : null}
      </div>
    </Card>
  );
}
