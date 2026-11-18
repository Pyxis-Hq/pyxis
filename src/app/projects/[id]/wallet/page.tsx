"use client";
import { use, useState } from "react";
import { PageHeader, Segmented } from "@/components/pyxis/ui";
import { WalletFunnel } from "@/components/pyxis/wallet-funnel";

const RANGES = [["24h", 24], ["7d", 168], ["30d", 720]] as const;

export default function Wallet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [hours, setHours] = useState(168);
  return (
    <>
      <PageHeader
        title="Wallet funnel"
        description="How people move from connecting a wallet to a reported submission."
        actions={<Segmented label="Time range" value={hours} onChange={setHours} options={RANGES} />}
      />
      <WalletFunnel id={id} hours={hours} />
    </>
  );
}
