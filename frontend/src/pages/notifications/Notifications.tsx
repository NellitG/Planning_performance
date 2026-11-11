import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useMarkAllWorkflowNotificationsRead,
  useMarkWorkflowNotificationRead,
  useWorkflowNotifications,
} from "@/hooks/useProjectsApi";

export default function Notifications() {
  const { data: notifications = [], isLoading, isError, error } = useWorkflowNotifications();
  const markRead = useMarkWorkflowNotificationRead();
  const markAllRead = useMarkAllWorkflowNotificationsRead();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  useEffect(() => {
    if (!selectedId && notifications.length) setSelectedId(notifications[0].id);
  }, [notifications, selectedId]);

  const selected = notifications.find((notification) => notification.id === selectedId);
  const selectNotification = (id: string, isRead: boolean) => {
    setSelectedId(id);
    if (!isRead) markRead.mutate(id, {
      onError: (reason) => toast.error(reason instanceof Error ? reason.message : "Unable to mark notification as read."),
    });
  };
  const markAll = () => markAllRead.mutate(undefined, {
    onError: (reason) => toast.error(reason instanceof Error ? reason.message : "Unable to mark notifications as read."),
  });

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs text-muted-foreground">Dashboard › Notifications</div>
          <h1 className="mt-1 text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Review technical report workflow updates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-2 text-sm">{unreadCount} unread</Badge>
          <Button variant="outline" size="sm" onClick={markAll} disabled={!unreadCount || markAllRead.isPending}>
            {markAllRead.isPending ? "Marking..." : "Mark all read"}
          </Button>
        </div>
      </div>

      {isError && <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error instanceof Error ? error.message : "Unable to load notifications."}</p>}
      {isLoading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading notifications...</p> :
        !notifications.length ? <Card className="p-8 text-center text-sm text-muted-foreground">You have no workflow notifications.</Card> :
          <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>All notifications</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => selectNotification(notification.id, notification.isRead)}
                    className={`w-full border-b px-4 py-4 text-left last:border-0 hover:bg-muted ${selectedId === notification.id ? "bg-muted" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{notification.reportTitle}</p>
                      {!notification.isRead && <Badge variant="secondary">New</Badge>}
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{notification.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {selected && <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>{selected.reportTitle}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{new Date(selected.createdAt).toLocaleString()}</p>
                  </div>
                  {selected.newStatus && <Badge variant="outline">{selected.newStatus}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="whitespace-pre-wrap text-sm leading-7">{selected.message}</p>
                <Button asChild><Link to={`/technical-reports/${selected.reportId}`}>Open technical report</Link></Button>
              </CardContent>
            </Card>}
          </div>}
    </>
  );
}
