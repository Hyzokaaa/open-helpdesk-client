import { useState } from "react";
import { getCommentHistory } from "@modules/comment/services/comment.service";
import { getDescriptionHistory } from "../services/ticket.service";

interface HistoryItem {
  id: string;
  content: string;
  editorName: string;
  createdAt: string;
}

interface HistoryModal {
  type: "comment" | "description";
  commentId?: string;
}

export default function useVersionHistory(
  workspaceSlug: string | undefined,
  ticketId: string | undefined,
  getMemberName: (id: string) => string,
) {
  const [historyModal, setHistoryModal] = useState<HistoryModal | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[] | null>(null);

  const openHistory = async (type: "comment" | "description", commentId?: string) => {
    if (!workspaceSlug || !ticketId) return;
    setHistoryModal({ type, commentId });
    setHistoryItems(null);
    try {
      const edits = type === "comment" && commentId
        ? await getCommentHistory(workspaceSlug, ticketId, commentId)
        : await getDescriptionHistory(workspaceSlug, ticketId);
      setHistoryItems(edits.map((e) => ({
        id: e.id,
        content: e.content,
        editorName: getMemberName(e.editedById),
        createdAt: e.createdAt,
      })));
    } catch {
      setHistoryItems([]);
    }
  };

  const closeHistory = () => {
    setHistoryModal(null);
    setHistoryItems(null);
  };

  return { historyModal, historyItems, openHistory, closeHistory };
}
