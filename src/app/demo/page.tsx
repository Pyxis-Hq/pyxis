"use client";
// Testnet demo dApp. Real wallet connect, real testnet payment, funnel events reported through @pyxis-hq/wallets-kit.
// Public page: it needs no Pyxis login, only an ingest key for the project that should receive the events.
import { useRef, useState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { Logo } from "@/components/pyxis/logo";
import { Notice } from "@/components/pyxis/ui";
import { NetworkStellar } from "@web3icons/react";
import { Asset, BASE_FEE, Horizon, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PyxisWallet, type WalletProvider } from "../../../sdk/wallets-kit";

const HORIZON = "https://horizon-testnet.stellar.org";
type Line = { t: string; text: string; kind: "info" | "ok" | "err" };

export default function Demo() {
  const [key, setKey] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [log, setLog] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const pyxis = useRef<PyxisWallet | null>(null);
  const say = (text: string, kind: Line["kind"] = "info") => setLog((l) => [...l, { t: new Date().toLocaleTimeString(), text, kind }]);

  const sdk = () => (pyxis.current ??= new PyxisWallet({ endpoint: "/v1/wallet-events", ingestKey: key.trim(), network: "testnet", batchSize: 1 }));
  const kit = async () => {
    const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
    const { defaultModules } = await import("@creit.tech/stellar-wallets-kit/modules/utils");
    if (!(globalThis as { __kitInit?: boolean }).__kitInit) { StellarWalletsKit.init({ modules: defaultModules(), network: Networks.TESTNET } as never); (globalThis as { __kitInit?: boolean }).__kitInit = true; }
    return StellarWalletsKit;
  };

  async function connect() {
    if (!/^pyx_live_/.test(key.trim())) return say("Paste an ingest key first (project → Keys & setup).", "err");
    setBusy(true);
    const p = sdk();
    try {
      p.track("wallet_connect_started");
      const K = await kit();
      const { address } = await K.authModal();
      setAddress(address);
      p.track("wallet_connected", { wallet_provider: "other" as WalletProvider });
      say("Wallet connected on testnet. Funding with Friendbot if needed…", "ok");
      await fetch(`https://friendbot.stellar.org?addr=${address}`).catch(() => null);
    } catch { say("Connection cancelled or failed.", "err"); } finally { setBusy(false); }
  }

  async function pay() {
    if (!address) return;
    setBusy(true);
    const p = sdk();
    try {
      const server = new Horizon.Server(HORIZON);
      const acct = await server.loadAccount(address);
      // 1 XLM to yourself: a real, harmless testnet transaction. Only the event NAMES are reported to Pyxis; never the address or XDR.
      const tx = new TransactionBuilder(acct, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.payment({ destination: address, asset: Asset.native(), amount: "1" })).setTimeout(120).build();
      p.track("transaction_sign_started");
      const K = await kit();
      let signed: string;
      try { ({ signedTxXdr: signed } = await K.signTransaction(tx.toXDR(), { networkPassphrase: Networks.TESTNET, address })); p.track("transaction_sign_completed"); }
      catch { p.track("transaction_sign_failed", { failure_category: "user_rejected" }); say("Signing rejected.", "err"); return; }
      p.track("transaction_submit_started");
      try {
        const res = await server.submitTransaction(TransactionBuilder.fromXDR(signed, Networks.TESTNET));
        p.track("transaction_submit_completed");
        say(`Submitted. Testnet tx ${res.hash.slice(0, 10)}…`, "ok");
      } catch { p.track("transaction_submit_failed", { failure_category: "network_error" }); say("Submit failed.", "err"); }
    } catch { say("Could not build the transaction (is the account funded?).", "err"); } finally { setBusy(false); }
  }

  return (
    <div className="min-h-dvh bg-muted/50">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-[0.9375rem] font-semibold tracking-tight"><Logo className="size-6" /> Pyxis</Link>
          <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">Back to app</Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="text-[1.375rem] font-semibold tracking-tight">Wallet funnel demo</h1>
        <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground">A small testnet dApp that reports its wallet funnel to Pyxis. Connect a testnet wallet and send 1 test XLM to yourself. Pyxis receives only event names and a wallet category, never addresses, signatures or transactions.</p>
        <div className="mt-6 grid gap-4 rounded-lg border border-border bg-card p-4">
          <div className="grid gap-1.5">
            <Label htmlFor="k">Ingest key</Label>
            <Input id="k" value={key} onChange={(e) => { setKey(e.target.value); pyxis.current?.destroy(); pyxis.current = null; }} placeholder="pyx_live_…" className="font-mono text-xs" autoComplete="off" />
            <p className="text-xs text-muted-foreground">Create one under a project's Keys &amp; setup. Use a dedicated key for this page: ingest keys in browsers are visible to users, so revoke it when done.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={connect} disabled={busy}><Wallet /> {address ? "Reconnect" : "Connect wallet"}</Button>
            <Button variant="outline" onClick={pay} disabled={busy || !address}>Send 1 test XLM to myself</Button>
          </div>
          {address && <Notice tone="ok">Connected on testnet as <code className="font-mono text-xs">{address.slice(0, 4)}…{address.slice(-4)}</code></Notice>}
        </div>
        <section className="mt-6 rounded-lg border border-border bg-card">
          <h2 className="border-b border-border px-4 py-2.5 text-sm font-semibold">Activity</h2>
          <ol className="text-sm" aria-live="polite">
            {log.map((l, i) => <li key={i} className="flex gap-3 border-b border-border px-4 py-2 last:border-b-0"><span className="tnum text-muted-foreground">{l.t}</span><span className={l.kind === "err" ? "text-danger" : l.kind === "ok" ? "text-ok" : ""}>{l.text}</span></li>)}
            {!log.length && <li className="px-4 py-6 text-center text-muted-foreground">No activity yet. Paste a key and connect a wallet to begin.</li>}
          </ol>
        </section>
      </main>
    </div>
  );
}
