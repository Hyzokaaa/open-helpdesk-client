import { useState } from "react";
import { toast } from "react-toastify";
import {
  TicketListItem,
  bulkChangeStatus,
  bulkDeleteTickets,
  changeTicketStatus,
  pickupTicket,
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
  onRefresh: () => void;
  t: (key: TranslationKey) => string;
}

export default function useBulkOperations({
  workspaceSlug,
  selectedIds,
  clearSelection,
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
      const isFromOpen = changeStatusTicket.status === "open";
      const shouldPickup = isFromOpen && selectedStatus !== "open" && selectedStatus !== "discarded";

      if (shouldPickup) {
        await pickupTicket(workspaceSlug, changeStatusTicket.id, selectedStatus);
      } else {
        await changeTicketStatus(
          workspaceSlug,
          changeStatusTicket.id,
          selectedStatus,
          selectedStatus === "discarded" ? discardReason : undefined,
        );
      }
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
      await bulkChangeStatus(workspaceSlug, [...selectedIds], bulkSelectedStatus, reason);
      toast.success(`${selectedIds.size} ${t("tickets.bulkUpdated")}`);
      clearSelection();
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
