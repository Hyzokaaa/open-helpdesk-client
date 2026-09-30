import { useState } from "react";
import { toast } from "react-toastify";
import {
  TicketListItem,
  bulkChangeStatus,
  bulkDeleteTickets,
  changeTicketStatus,
} from "../services/ticket.service";
import type { TranslationKey } from "@modules/app/i18n/translations";

export interface UseBulkOperationsReturn {
  // Single ticket status change
  changeStatusTicket: TicketListItem | null;
  setChangeStatusTicket: React.Dispatch<React.SetStateAction<TicketListItem | null>>;
  selectedStatus: string;
  setSelectedStatus: React.Dispatch<React.SetStateAction<string>>;
  showDiscardReason: boolean;
  setShowDiscardReason: React.Dispatch<React.SetStateAction<boolean>>;
  discardReason: string;
  setDiscardReason: React.Dispatch<React.SetStateAction<string>>;
  handleChangeStatus: () => Promise<void>;
  // Bulk status change
  bulkStatusModal: boolean;
  setBulkStatusModal: React.Dispatch<React.SetStateAction<boolean>>;
  bulkSelectedStatus: string;
  setBulkSelectedStatus: React.Dispatch<React.SetStateAction<string>>;
  bulkDiscardReason: boolean;
  setBulkDiscardReason: React.Dispatch<React.SetStateAction<boolean>>;
  handleBulkStatusChange: (reason?: string) => Promise<void>;
  // Bulk delete
  confirmBulkDelete: boolean;
  setConfirmBulkDelete: React.Dispatch<React.SetStateAction<boolean>>;
  handleBulkDelete: () => Promise<void>;
  // Single delete
  deleteTicketId: string | null;
  setDeleteTicketId: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseBulkOperationsProps {
  workspaceSlug: string | undefined;
  selectedIds: Set<string>;
  clearSelection: () => void;
  selectOnly: (ids: string[]) => void;
  onRefresh: () => void;
  t: (key: TranslationKey) => string;
}

export default function useBulkOperations({
  workspaceSlug,
  selectedIds,
  clearSelection,
  selectOnly,
  onRefresh,
  t,
}: UseBulkOperationsProps): UseBulkOperationsReturn {
  // Single ticket status change
  const [changeStatusTicket, setChangeStatusTicket] = useState<TicketListItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showDiscardReason, setShowDiscardReason] = useState(false);
  const [discardReason, setDiscardReason] = useState("");

  // Bulk status change
  const [bulkStatusModal, setBulkStatusModal] = useState(false);
  const [bulkSelectedStatus, setBulkSelectedStatus] = useState("");
  const [bulkDiscardReason, setBulkDiscardReason] = useState(false);

  // Bulk delete
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // Single delete
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null);

  const handleChangeStatus = async () => {
    if (!workspaceSlug || !changeStatusTicket || !selectedStatus) return;
    if (selectedStatus === "discarded" && !discardReason) {
      setShowDiscardReason(true);
      return;
    }
    try {
      // A plain status change never assigns. Agents only reach this on tickets already assigned
      // to them (open ones go through pickup), and a supervisor moving an open ticket leaves it
      // unassigned on purpose so it can be assigned to someone else.
      await changeTicketStatus(
        workspaceSlug,
        changeStatusTicket.id,
        selectedStatus,
        selectedStatus === "discarded" ? discardReason : undefined,
      );
      toast.success(t("tickets.statusUpdated"));
      setChangeStatusTicket(null);
      setSelectedStatus("");
      setDiscardReason("");
      setShowDiscardReason(false);
      onRefresh();
    } catch {
      toast.error(t("tickets.changeStatusError"));
    }
  };

  const handleBulkStatusChange = async (reason?: string) => {
    if (!workspaceSlug || !bulkSelectedStatus) return;
    if (bulkSelectedStatus === "discarded" && !reason) {
      setBulkDiscardReason(true);
      return;
    }
    try {
      // The backend applies each ticket on its own and reports per ticket, so a partial failure
      // (no permission, transition not allowed) still answers 200.
      const results = await bulkChangeStatus(workspaceSlug, [...selectedIds], bulkSelectedStatus, reason);
      const failedIds = results.filter((r) => !r.success).map((r) => r.ticketId);
      const updatedCount = results.length - failedIds.length;
      if (updatedCount > 0) toast.success(`${updatedCount} ${t("tickets.bulkUpdated")}`);
      if (failedIds.length > 0) {
        toast.error(`${failedIds.length} ${t("tickets.bulkNotUpdated")}`);
        // Leave the rejected ones selected so they are easy to spot
        selectOnly(failedIds);
      } else {
        clearSelection();
      }
      setBulkStatusModal(false);
      setBulkSelectedStatus("");
      setBulkDiscardReason(false);
      onRefresh();
    } catch {
      toast.error(t("tickets.bulkUpdateError"));
    }
  };

  const handleBulkDelete = async () => {
    if (!workspaceSlug) return;
    try {
      await bulkDeleteTickets(workspaceSlug, [...selectedIds]);
      toast.success(`${selectedIds.size} ${t("tickets.bulkDeleted")}`);
      clearSelection();
      onRefresh();
    } catch {
      toast.error(t("tickets.bulkDeleteError"));
    }
  };

  return {
    changeStatusTicket,
    setChangeStatusTicket,
    selectedStatus,
    setSelectedStatus,
    showDiscardReason,
    setShowDiscardReason,
    discardReason,
    setDiscardReason,
    handleChangeStatus,
    bulkStatusModal,
    setBulkStatusModal,
    bulkSelectedStatus,
    setBulkSelectedStatus,
    bulkDiscardReason,
    setBulkDiscardReason,
    handleBulkStatusChange,
    confirmBulkDelete,
    setConfirmBulkDelete,
    handleBulkDelete,
    deleteTicketId,
    setDeleteTicketId,
  };
}
