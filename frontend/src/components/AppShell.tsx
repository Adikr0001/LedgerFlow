import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity, ArrowLeftRight, Bell, ChevronDown, CircleHelp, CreditCard, LayoutDashboard,
  LogOut, Menu, ShieldCheck, X, WalletCards,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { cn } from "../lib/utils";
import { Dialog } from "./ui/Dialog";
import { dateTime } from "../lib/utils";

const links = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/wallets", label: "My wallets", icon: WalletCards },
  { to: "/app/transfers", label: "Transfers", icon: ArrowLeftRight },
  { to: "/app/transactions", label: "Transactions", icon: CreditCard },
];

const adminLinks = [
  { to: "/app/admin", label: "Operations", icon: ShieldCheck },
];

function NavItems({ close }: { close?: () => void }) {
  const { session } = useAuth();
  return (
    <nav aria-label="Main navigation" className="space-y-1">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={close}
          className={({ isActive }) => cn("flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition", isActive ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-white hover:text-ink")}
        >
          <Icon size={18} strokeWidth={1.8} />{label}
        </NavLink>
      ))}
      {session?.role === "ADMIN" && (
        <>
          <p className="px-3 pb-1 pt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Workspace</p>
          {adminLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={close} className={({ isActive }) => cn("flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition", isActive ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-white hover:text-ink")}>
              <Icon size={18} strokeWidth={1.8} />{label}
            </NavLink>
          ))}
        </>
      )}
    </nav>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { session, signOut } = useAuth();
  const location = useLocation();
  const pageTitle = location.pathname.includes("admin")
    ? "Operations"
    : location.pathname.includes("wallets")
      ? "My wallets"
      : location.pathname.includes("transfers")
        ? "Transfers"
        : location.pathname.includes("transactions")
          ? "Transactions"
          : "Overview";
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: api.notifications, retry: 1 });
  const unread = notifications.data?.filter((item) => !item.readFlag).length ?? 0;

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] border-r border-line bg-[#f2f5f2] px-5 py-6 lg:block">
        <Brand />
        <div className="mt-12"><NavItems /></div>
        <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-[#e4e9e5] bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink"><CircleHelp size={16} className="text-brand" />Need a hand?</div>
          <p className="mt-2 text-xs leading-5 text-muted">Your LedgerFlow workspace is here to keep money moving clearly.</p>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-ink/35 lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="h-full w-[min(82vw,300px)] bg-[#f2f5f2] p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between"><Brand /><button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-muted hover:bg-white"><X size={19} /></button></div>
            <div className="mt-10"><NavItems close={() => setMobileOpen(false)} /></div>
          </aside>
        </div>
      )}

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button aria-label="Open menu" className="rounded-lg p-2 text-muted hover:bg-canvas lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
            <div><p className="text-xs font-medium text-muted">Good to see you, {session?.username}</p><h1 className="mt-0.5 text-lg font-semibold tracking-tight text-ink">{pageTitle}</h1></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button type="button" aria-label="Notifications" onClick={() => setNotificationsOpen(true)} className="relative rounded-xl border border-line p-2.5 text-muted hover:bg-canvas">
                <Bell size={18} />
                {unread > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-white">{unread}</span>}
              </button>
            </div>
            <div className="hidden h-8 w-px bg-line sm:block" />
            <div className="hidden items-center gap-2 sm:flex"><div className="grid size-9 place-items-center rounded-full bg-lime text-xs font-bold uppercase text-ink">{session?.username.slice(0, 2)}</div><span className="max-w-28 truncate text-sm font-medium text-ink">{session?.username}</span><ChevronDown size={15} className="text-muted" /></div>
            <button type="button" onClick={signOut} aria-label="Sign out" className="rounded-xl p-2.5 text-muted hover:bg-rose-50 hover:text-rose-700"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 sm:py-9"><Outlet /></main>
        <footer className="mx-auto flex max-w-[1440px] items-center justify-between px-4 pb-8 text-xs text-muted sm:px-8"><span>© {new Date().getFullYear()} LedgerFlow</span><span className="flex items-center gap-1.5"><Activity size={13} className="text-brand" /> Secure wallet workspace</span></footer>
      </div>
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen} title="Notifications" description="Messages delivered to your account by LedgerFlow.">
        {notifications.isLoading ? <p className="py-8 text-center text-sm text-muted">Loading notifications…</p> : notifications.isError ? <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{notifications.error instanceof Error ? notifications.error.message : "Notifications could not be loaded."}</div> : notifications.data?.length ? <div className="max-h-[60vh] divide-y divide-line overflow-y-auto">{notifications.data.map((item) => <div key={item.id} className="py-4 first:pt-0 last:pb-0"><div className="flex items-start gap-3"><span className={`mt-1 size-2 shrink-0 rounded-full ${item.readFlag ? "bg-line" : "bg-brand"}`} /><div><p className="text-sm leading-6 text-ink">{item.message}</p><p className="mt-1 text-xs text-muted">{dateTime(item.createdAt)}</p></div></div></div>)}</div> : <p className="py-8 text-center text-sm text-muted">You’re all caught up. No notifications yet.</p>}
      </Dialog>
    </div>
  );
}

function Brand() {
  return <NavLink to="/app" className="inline-flex items-center gap-2.5" aria-label="LedgerFlow home">
    <span className="grid size-9 place-items-center rounded-xl bg-brand text-lime"><Activity size={19} strokeWidth={2.5} /></span>
    <span className="text-[17px] font-bold tracking-tight text-ink">ledger<span className="text-brand">flow</span></span>
  </NavLink>;
}
