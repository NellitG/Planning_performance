import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as notificationsStore from "@/utils/notificationsStore";

export default function Notifications() {
  const notifications = useSyncExternalStore(
    notificationsStore.subscribe,
    notificationsStore.getNotifications,
    notificationsStore.getNotifications,
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const [selectedId, setSelectedId] = useState<number | null>(() => notifications[0]?.id ?? null);

  useEffect(() => {
    if (!selectedId && notifications.length) {
      setSelectedId(notifications[0].id);
    }
  }, [notifications, selectedId]);

  const selectedNotification =
    notifications.find((notification) => notification.id === selectedId) ?? notifications[0];

  if (!selectedNotification) {
    return null;
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Dashboard › Notifications</div>
          <h1 className="mt-1 text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Review recent updates, read full details, and keep your notifications up to date.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-2 text-sm">
            {unreadCount} unread
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => notificationsStore.markAllAsRead()}
            disabled={unreadCount === 0}
          >
            Mark all read
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <Card className="border-border bg-background">
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>All notifications</CardTitle>
              <p className="text-sm text-muted-foreground">
                Click a notification to open and read it.
              </p>
            </div>
            <Badge variant="outline" className="rounded-full px-2 py-1 text-xs">
              {unreadCount} unread
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            <div className="space-y-1">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => setSelectedId(notification.id)}
                  className={`flex w-full items-start justify-between gap-3 border-b border-border px-4 py-4 text-left transition-colors hover:bg-muted ${
                    selectedId === notification.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{notification.title}</p>
                      {!notification.read && (
                        <Badge variant="secondary" className="rounded-full px-2 py-1 text-[11px]">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{notification.desc}</p>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-muted-foreground">
                    {notification.time}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle>{selectedNotification.title}</CardTitle>
                {!selectedNotification.read && (
                  <Badge variant="secondary" className="rounded-full px-2 py-1 text-xs">
                    Unread
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{selectedNotification.time}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm leading-7 text-foreground">{selectedNotification.desc}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => notificationsStore.markAsRead(selectedNotification.id)}
                disabled={selectedNotification.read}
              >
                {selectedNotification.read ? "Already read" : "Mark read"}
              </Button>
              {selectedNotification.read && (
                <Badge variant="outline" className="rounded-full px-2 py-1 text-xs">
                  Read
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
