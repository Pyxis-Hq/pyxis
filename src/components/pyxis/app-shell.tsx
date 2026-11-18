"use client";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Boxes, FlaskConical, Globe, KeyRound, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Wallet, X } from "lucide-react";
import { NetworkStellar } from "@web3icons/react";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { fmt, NativeSelect, Skeleton } from "./ui";
import { useLogoutMutation, useMeQuery, useProjectQuery, useProjectsQuery } from "@/lib/api";
import { cn } from "@/lib/utils";

const PROJECT_NAV = [
  { href: "", label: "API metrics", icon: LayoutDashboard },
  { href: "/sites", label: "Web analytics", icon: Globe },
  { href: "/wallet", label: "Wallet funnel", icon: Wallet },
  { href: "/keys", label: "Keys & setup", icon: KeyRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLink({ href, active, icon: Icon, children }: { href: string; active: boolean; icon: typeof Boxes; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150",
        active ? "bg-sidebar-accent font-medium text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active && "text-violet-text")} aria-hidden />
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data, isLoading } = useMeQuery();
  const [logout] = useLogoutMutation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const user = data?.user;
  const { data: projects } = useProjectsQuery(undefined, { skip: !user });
  const { data: project } = useProjectQuery(id ?? "", { skip: !user || !id });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/signin");
  }, [isLoading, user, router]);
  useEffect(() => setOpen(false), [pathname]);

  if (!user) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="w-64 space-y-3" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  const base = id ? `/projects/${id}` : "";
  const section = id ? PROJECT_NAV.find((n) => n.href && pathname.startsWith(base + n.href))?.label ?? "API metrics" : pathname.startsWith("/operator") ? "Operator" : "All projects";

  const sidebar = (
    <div className="flex h-full flex-col gap-5 px-3 py-4">
      <div className="flex items-center justify-between px-1.5">
        <Link href="/projects" className="flex items-center gap-2 text-[0.9375rem] font-semibold tracking-tight">
          <Logo className="size-6" /> Pyxis
        </Link>
        <button className="rounded-md p-1 text-muted-foreground hover:text-foreground lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-4" />
        </button>
      </div>

      <div>
        <label htmlFor="switch" className="px-1.5 text-xs font-medium text-muted-foreground">Project</label>
        <div className="mt-1.5">
          <NativeSelect id="switch" value={id ?? ""} onChange={(e) => router.push(e.target.value ? `/projects/${e.target.value}` : "/projects")} className="font-medium">
            <option value="">All projects</option>
            {(projects?.projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <nav aria-label="Primary" className="flex flex-col gap-0.5">
        {id ? (
          PROJECT_NAV.map((n) => {
            const href = base + n.href;
            const active = n.href ? pathname.startsWith(href) : pathname === base;
            return <NavLink key={n.label} href={href} active={active} icon={n.icon}>{n.label}</NavLink>;
          })
        ) : (
          <NavLink href="/projects" active={pathname === "/projects"} icon={Boxes}>All projects</NavLink>
        )}
      </nav>

      <nav aria-label="Workspace" className="flex flex-col gap-0.5 border-t border-border pt-4">
        {id && <NavLink href="/projects" active={false} icon={Boxes}>All projects</NavLink>}
        {user.isOperator && <NavLink href="/operator" active={pathname.startsWith("/operator")} icon={ShieldCheck}>Operator overview</NavLink>}
        <NavLink href="/demo" active={pathname.startsWith("/demo")} icon={FlaskConical}>Wallet demo</NavLink>
      </nav>

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <p className="flex items-center gap-1.5 px-1.5 text-xs text-muted-foreground">
          <NetworkStellar variant="mono" size={14} /> Stellar testnet
        </p>
        <div className="flex items-center justify-between gap-2 px-1.5">
          <code className="font-mono text-xs text-muted-foreground" title={user.account}>{fmt.short(user.account)}</code>
          <Button variant="ghost" size="xs" onClick={async () => { await logout(); router.replace("/"); }}>
            <LogOut /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:block lg:h-dvh lg:overflow-y-auto">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 overflow-y-auto border-r border-sidebar-border bg-sidebar">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm lg:px-8">
          <button className="-ml-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/projects" className="hover:text-foreground">Projects</Link>
            {id && (
              <>
                <span aria-hidden>/</span>
                <Link href={base} className="max-w-[14rem] truncate hover:text-foreground">{project?.name ?? "…"}</Link>
              </>
            )}
            <span aria-hidden>/</span>
            <span className="truncate font-medium text-foreground">{section}</span>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-[84rem] flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
