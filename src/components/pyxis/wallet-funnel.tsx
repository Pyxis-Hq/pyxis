"use client";
import Link from "next/link";
import { Empty, fmt, Notice, Panel, Skeleton } from "./ui";
import { Button } from "@/components/ui/button";
import { useWalletQuery } from "@/lib/api";
import { cn } from "@/lib/utils";

const LABEL: Record<string, string> = {
  wallet_connect_started: "Connect started",
  wallet_connected: "Connected",
  transaction_sign_started: "Sign started",
  transaction_sign_completed: "Signed",
  transaction_submit_started: "Submit started",
  transaction_submit_completed: "Submit reported OK",
};
const STEPS = Object.keys(LABEL);

export function WalletFunnel({ id, hours }: { id: string; hours: number }) {
  const { data, isLoading } = useWalletQuery({ id, hours });
  const by = Object.fromEntries((data?.funnel ?? []).map((f) => [f.event, f.count]));
  const top = Math.max(1, ...STEPS.map((s) => by[s] ?? 0));
  const fails = (by.transaction_sign_failed ?? 0) + (by.transaction_submit_failed ?? 0);
  const empty = !data || data.funnel.every((f) => f.count === 0);

  return (
    <div className="grid gap-6">
      <Notice tone="warn" title="Frontend-reported, not ledger-confirmed">
        These events come from your app&apos;s frontend through the tracker. Pyxis cannot prove that a transaction reached the Stellar ledger, so &quot;Submit reported OK&quot; means your app said so.
      </Notice>
      <Panel title="Wallet funnel" aside="Event counts only. No addresses, signatures or transactions are stored.">
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : empty ? (
          <Empty
            title="No wallet events yet"
            action={<Button variant="outline" render={<Link href="/demo" />}>Open the testnet demo</Button>}
          >
            Install the tracker, then connect and sign in your app. The demo sends real events with an ingest key from this project.
          </Empty>
        ) : (
          <>
            <ol className="grid gap-3">
              {STEPS.map((s, i) => {
                const n = by[s] ?? 0;
                const prev = i > 0 ? by[STEPS[i - 1]] ?? 0 : 0;
                return (
                  <li key={s} className="grid grid-cols-[9.5rem_1fr_4.5rem] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_5.5rem]">
                    <span>{LABEL[s]}</span>
                    <span className="h-5 rounded-[2px] bg-muted">
                      <span className="block h-full rounded-[2px] bg-series" style={{ width: `${(n / top) * 100}%` }} />
                    </span>
                    <span className="text-right tnum">
                      {fmt.n(n)}
                      {i > 0 && prev > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{Math.round((n / prev) * 100)}%</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
              Percentages compare each step with the step above it. Failures reported:{" "}
              <span className={cn("tnum font-medium", fails ? "text-danger" : "text-foreground")}>{fmt.n(fails)}</span>
            </p>
          </>
        )}
      </Panel>
    </div>
  );
}
