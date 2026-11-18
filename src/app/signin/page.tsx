"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { NetworkStellar } from "@web3icons/react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/pyxis/logo";
import { Notice } from "@/components/pyxis/ui";
import { useChallengeMutation, useMeQuery, useVerifyMutation } from "@/lib/api";
import { connectAndSign } from "@/lib/wallet";

export default function SignIn() {
  const { data } = useMeQuery();
  const router = useRouter();
  const [challenge] = useChallengeMutation();
  const [verify] = useVerifyMutation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.user) router.replace("/projects");
  }, [data, router]);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const s = await connectAndSign((account) => challenge({ account }).unwrap());
      await verify(s).unwrap();
      router.replace("/projects");
    } catch (e) {
      const msg = (e as { data?: { message?: string } })?.data?.message ?? (e instanceof Error ? e.message : null);
      setError(msg ?? "Sign-in was cancelled or failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-muted/50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-base font-semibold tracking-tight"><Logo className="size-7" /> Pyxis</Link>
        <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect a Stellar wallet set to <strong className="font-medium text-foreground">Testnet</strong> and sign a one-time message. No transaction is sent and no funds move.
          </p>
          <Button className="mt-6 w-full" size="lg" onClick={signIn} disabled={busy}>
            <Wallet /> {busy ? "Waiting for your wallet…" : "Connect wallet"}
          </Button>
          {error && <div className="mt-4"><Notice tone="bad">{error}</Notice></div>}
          <p className="mt-5 text-xs text-muted-foreground">Works with Freighter, xBull, Albedo, Lobstr and other Stellar Wallets Kit modules. There is no password or email.</p>
        </div>
        <ul className="mt-6 grid gap-2 text-xs text-muted-foreground">
          <li>Your account signs in once. It is never written to metric tables.</li>
          <li>Each project&apos;s data is isolated from every other project.</li>
        </ul>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><NetworkStellar variant="mono" size={14} /> Stellar testnet MVP</p>
      </div>
    </div>
  );
}
