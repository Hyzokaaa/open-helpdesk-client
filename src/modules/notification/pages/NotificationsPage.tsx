import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import clsx from "clsx";
import Card from "@modules/app/modules/ui/components/Card/Card";
import { Notification } from "../domain/notification";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../services/notification.service";
import useTranslation from "@modules/app/i18n/useTranslation";
import NotificationIcon from "../components/NotificationIcon";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetch = useCallback(async () => {
    const res = await getNotifications(filter === "unread");
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  }, [filter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      await markAsRead(n.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
      );
    }
    if (n.ticketId) {
      navigate(`/dashboard/workspaces/${n.workspaceSlug}/tickets`);
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
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-body-bold text-heading">
          {t("notifications.title")}
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-3 py-1.5 text-xs rounded-full cursor-pointer transition-colors",
              filter === f
                ? "bg-primary-600 text-on-primary"
                : "bg-surface border border-border-card text-muted hover:text-body",
            )}
          >
            {f === "all" ? t("notifications.filterAll") : t("notifications.filterUnread")}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 bg-white/20 px-1.5 py-0.5 rounded-full text-exs">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted text-center py-12">
            {t("notifications.empty")}
          </p>
        ) : (
          <div className="divide-y divide-border-row">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={clsx(
                  "w-full text-left px-5 py-4 flex gap-3 items-start transition-colors cursor-pointer",
                  n.isRead
                    ? "hover:bg-surface-hover"
                    : "bg-surface-active hover:bg-surface-hover",
                )}
              >
                <NotificationIcon type={n.type} />
                <div className="flex-1 min-w-0">
                  <p
                    className={clsx(
                      "text-sm",
                      n.isRead ? "text-muted" : "text-heading font-body-medium",
                    )}
                  >
                    {n.title}
                  </p>
                  <p className="text-exs text-subtle mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
