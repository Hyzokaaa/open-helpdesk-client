import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import clsx from "clsx";
import { Notification } from "../domain/notification";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../services/notification.service";
import useTranslation from "@modules/app/i18n/useTranslation";

const TYPE_ICONS: Record<string, string> = {
  "ticket-created": "+",
  "ticket-assigned": "@",
  "status-changed": "~",
  "comment-created": "#",
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silent
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // silent
    }
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      await markAsRead(n.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
      );
    }
    setOpen(false);
    if (n.ticketId) {
      navigate(
        `/dashboard/workspaces/${n.workspaceSlug}/tickets`,
      );
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
  };

  const timeAgo = (date: string | undefined) => {
    if (!date) return "";
    const ms = Date.now() - new Date(date).getTime();
    if (isNaN(ms) || ms < 0) return "";
    if (ms < 60000) return "now";
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center rounded-button border border-border-input bg-surface hover:bg-surface-hover transition-all duration-300 cursor-pointer text-muted hover:text-body relative"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full w-2.5 h-2.5 border-2 border-surface" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border-card rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-card">
            <p className="text-sm font-body-semibold text-heading">
              {t("notifications.title")}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-exs text-primary hover:underline cursor-pointer"
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">
                {t("notifications.empty")}
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={clsx(
                    "w-full text-left px-4 py-3 flex gap-3 items-start transition-colors cursor-pointer border-b border-border-row",
                    n.isRead
                      ? "hover:bg-surface-hover"
                      : "bg-surface-active hover:bg-surface-hover",
                  )}
                >
                  <span className="text-exs text-subtle font-body-bold w-4 shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type] || "?"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={clsx(
                        "text-xs truncate",
                        n.isRead ? "text-muted" : "text-heading font-body-medium",
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-exs text-subtle mt-0.5">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
