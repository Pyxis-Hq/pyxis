"use client";
// Browser-only. Stellar Wallets Kit v2 (verified against node_modules d.ts): init, authModal, signMessage.
import { Networks } from "@stellar/stellar-sdk";

let ready = false;

export async function connectAndSign(getChallenge: (account: string) => Promise<{ nonce: string; message: string }>) {
  const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
  const { defaultModules } = await import("@creit.tech/stellar-wallets-kit/modules/utils");
  if (!ready) {
    StellarWalletsKit.init({ modules: defaultModules(), network: Networks.TESTNET } as never);
    ready = true;
  }
  const { address } = await StellarWalletsKit.authModal();
  const ch = await getChallenge(address);
  const { signedMessage } = await StellarWalletsKit.signMessage(ch.message, { address, networkPassphrase: Networks.TESTNET });
  return { account: address, nonce: ch.nonce, signature: signedMessage };
}
