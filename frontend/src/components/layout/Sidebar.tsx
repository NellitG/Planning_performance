"use client";

import { Link, useLocation } from "react-router-dom";
import { LogOut, ChevronLeft, ChevronDown, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import * as notificationsStore from "@/utils/notificationsStore";
import { useAuth } from "@/context/AuthContext";
import { MODULES, SIDEBAR_SECTIONS, SIDEBAR_TREE } from "@/utils/modules";
import type { NavNode } from "@/utils/types";
import logoSrc from "@/assets/logo.png";

function hasActiveDescendant(node: NavNode, pathname: string): boolean {
  if (node.to) {
    return node.to === "/" ? pathname === "/" : pathname.startsWith(node.to);
  }
  if (node.children) {
    return node.children.some((c) => hasActiveDescendant(c, pathname));
  }
  return false;
}

interface NavLeafProps {
  node: NavNode & { to: string };
  depth: number;
  sidebarCollapsed: boolean;
  pathname: string;
  unreadCount: number;
}

function NavLeaf({ node, depth, sidebarCollapsed, pathname, unreadCount }: NavLeafProps) {
  const Icon = node.icon;
  const active = node.to === "/" ? pathname === "/" : pathname.startsWith(node.to);
  const paddingLeft = depth === 0 ? "pl-3" : depth === 1 ? "pl-5" : depth === 2 ? "pl-7" : "pl-9";

  return (
    <li>
      <Link
        to={node.to}
        className={cn(
          "flex items-center gap-2.5 rounded-md py-1.5 pr-3 text-xs font-medium transition-colors",
          paddingLeft,
          active
            ? "bg-white/15 text-white shadow-sm"
            : "text-white/75 hover:bg-white/10 hover:text-white",
        )}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        {!sidebarCollapsed && (
          <span className="flex flex-1 items-center justify-between gap-1 truncate">
            <span className="truncate">{node.label}</span>
            {node.to === "/notifications" && unreadCount > 0 && (
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </span>
        )}
      </Link>
    </li>
  );
}

interface NavGroupProps {
  node: NavNode & { children: NavNode[] };
  depth: number;
  sidebarCollapsed: boolean;
  pathname: string;
  unreadCount: number;
}

function NavGroup({ node, depth, sidebarCollapsed, pathname, unreadCount }: NavGroupProps) {
  const Icon = node.icon;
  const childActive = hasActiveDescendant(node, pathname);
  const [open, setOpen] = useState(childActive);

  const paddingLeft = depth === 0 ? "pl-3" : depth === 1 ? "pl-5" : "pl-7";
  const fontSize = depth === 0 ? "text-sm" : "text-xs";
  const iconSize = depth === 0 ? "h-4 w-4" : "h-3.5 w-3.5";
  const py = depth === 0 ? "py-2" : "py-1.5";

  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-md pr-3 font-medium transition-colors",
          paddingLeft, py, fontSize,
          childActive ? "text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
        )}
      >
        {Icon && <Icon className={cn("shrink-0", iconSize)} />}
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 truncate text-left">{node.label}</span>
            <ChevronDown
              className={cn(
                "h-3 w-3 shrink-0 opacity-60 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </>
        )}
      </button>

      {open && !sidebarCollapsed && (
        <ul
          className={cn(
            "mt-0.5 space-y-0.5",
            depth === 0 ? "ml-4 border-l border-white/15 pl-2" : "ml-3 border-l border-white/10 pl-2",
          )}
        >
          {node.children.map((child) =>
            child.to ? (
              <NavLeaf
                key={child.to}
                node={child as NavNode & { to: string }}
                depth={depth + 1}
                sidebarCollapsed={sidebarCollapsed}
                pathname={pathname}
                unreadCount={unreadCount}
              />
            ) : (
              <NavGroup
                key={child.label}
                node={child as NavNode & { children: NavNode[] }}
                depth={depth + 1}
                sidebarCollapsed={sidebarCollapsed}
                pathname={pathname}
                unreadCount={unreadCount}
              />
            ),
          )}
        </ul>
      )}
    </li>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { auth } = useAuth();
  const unreadCount = useSyncExternalStore(
    notificationsStore.subscribe,
    notificationsStore.getUnreadCount,
    notificationsStore.getUnreadCount,
  );

  const moduleKey = auth?.module ?? "projects";
  const mod = MODULES[moduleKey as keyof typeof MODULES] ?? MODULES.projects;
  const treeNodes = SIDEBAR_TREE[moduleKey];
  const sections = treeNodes ? null : (SIDEBAR_SECTIONS[moduleKey] ?? SIDEBAR_SECTIONS.projects);

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 256 }}
      transition={{ duration: 0.25 }}
      className="sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground shadow-xl md:flex"
    >
      <div className="relative flex flex-col border-b border-sidebar-border px-4 py-5">
        <div className="flex w-full flex-col items-center gap-3">
          <img
            src={logoSrc}
            alt="KALRO Logo"
            className="h-16 w-16 shrink-0 rounded-xl bg-white p-2 object-contain shadow-lg"
          />
          {!collapsed && (
            <div className="text-center leading-tight">
              <div className="text-base font-bold tracking-tight">KALRO</div>
              <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80">
                {mod.short}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute right-2 top-2 rounded-md p-1 hover:bg-white/10 transition-colors"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {treeNodes ? (
          <ul className="space-y-1">
            {treeNodes.map((node) =>
              node.to ? (
                <NavLeaf
                  key={node.to}
                  node={node as NavNode & { to: string }}
                  depth={0}
                  sidebarCollapsed={collapsed}
                  pathname={pathname}
                  unreadCount={unreadCount}
                />
              ) : (
                <NavGroup
                  key={node.label}
                  node={node as NavNode & { children: NavNode[] }}
                  depth={0}
                  sidebarCollapsed={collapsed}
                  pathname={pathname}
                  unreadCount={unreadCount}
                />
              ),
            )}
          </ul>
        ) : (
          sections?.map((sec) => (
            <div key={sec.title} className="mb-5">
              {!collapsed && (
                <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider opacity-60">
                  {sec.title}
                </div>
              )}
              <ul className="space-y-1">
                {sec.items.map((item) => {
                  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active ? "bg-white/15 text-white shadow-sm" : "text-white/85 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="flex w-full items-center justify-between gap-2 truncate">
                            <span className="truncate">{item.label}</span>
                            {item.to === "/notifications" && unreadCount > 0 && (
                              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px]">
                                {unreadCount}
                              </Badge>
                            )}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}

        <div className="mt-2 px-3">
          <Link
            to="/logout"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-red-500/20 hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Link>
        </div>
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-4 text-xs opacity-70">
          v1.0 · © KALRO {new Date().getFullYear()}
        </div>
      )}
    </motion.aside>
  );
}
