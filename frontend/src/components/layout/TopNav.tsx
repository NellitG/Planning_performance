"use client";

import { Bell, ChevronDown, LayoutGrid, Search, Moon, Sun, LogOut, User as UserIcon } from "lucide-react";
import { useState, useEffect, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import * as notificationsStore from "@/utils/notificationsStore";
import { useAuth } from "@/context/AuthContext";
import { MODULES } from "@/utils/modules";

export function TopNav() {
  const [dark, setDark] = useState(false);
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const notifications = useSyncExternalStore(
    notificationsStore.subscribe,
    notificationsStore.getNotifications,
    notificationsStore.getNotifications,
  );
  const unreadCount = useSyncExternalStore(
    notificationsStore.subscribe,
    notificationsStore.getUnreadCount,
    notificationsStore.getUnreadCount,
  );

  const moduleLabel = auth ? (MODULES[auth.module as keyof typeof MODULES]?.label ?? "KALRO PPM") : "KALRO PPM";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="hidden items-center gap-2 md:flex">
        <div className="leading-tight">
          <div className="text-sm font-semibold">KALRO | {moduleLabel}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Planning, Performance & Management
          </div>
        </div>
      </div>

      <div className="relative ml-2 hidden flex-1 max-w-md lg:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search projects, reports, partners…"
          className="h-9 w-full rounded-md border bg-muted/40 pl-9 pr-3 text-sm outline-none focus:border-[(--brand-green)]"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="hidden items-center gap-2 rounded-md bg-[(--brand-navy)] px-3 py-2 text-xs font-medium text-white hover:opacity-90 md:inline-flex">
          <LayoutGrid className="h-4 w-4" /> Interactive Dashboard
        </button>

        <button
          onClick={() => setDark((d) => !d)}
          className="rounded-md p-2 hover:bg-muted"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative rounded-md p-2 hover:bg-muted">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5">
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.desc}</div>
                <div className="text-[10px] text-muted-foreground">{n.time}</div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-between">
              <a href="/notifications" className="flex w-full items-center justify-between gap-2">
                <span>View all notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                    {unreadCount} new
                  </Badge>
                )}
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-emerald-700 text-white">
                {auth?.user?.initials ?? "KA"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left leading-tight md:block">
              <div className="text-xs font-semibold">{auth?.user?.name ?? "Guest"}</div>
              <div className="text-[10px] text-muted-foreground">{auth?.user?.role ?? "Administrator"}</div>
            </div>
            <ChevronDown className="hidden h-3 w-3 md:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm font-semibold">{auth?.user?.name ?? "Guest"}</div>
              <div className="text-xs text-muted-foreground">{auth?.user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><UserIcon className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700">
              <LogOut className="mr-2 h-4 w-4" />Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
