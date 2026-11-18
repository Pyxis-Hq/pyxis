import { createContext, createElement, useContext, useEffect, useMemo, type ReactNode } from "react";
import { PyxisWallet, type PyxisWalletOptions, type TrackProps, type WalletEvent } from "./index";

const Ctx = createContext<PyxisWallet | null>(null);

export function PyxisProvider({ children, ...options }: PyxisWalletOptions & { children?: ReactNode }) {
  const client = useMemo(() => new PyxisWallet(options), [options.endpoint, options.ingestKey, options.network]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { client.setEnabled(options.enabled !== false); }, [client, options.enabled]);
  useEffect(() => () => client.destroy(), [client]);
  return createElement(Ctx.Provider, { value: client }, children);
}

export function usePyxis(): { track: (event: WalletEvent, props?: TrackProps) => void; client: PyxisWallet | null } {
  const client = useContext(Ctx);
  return useMemo(() => ({ client, track: (e: WalletEvent, p?: TrackProps) => client?.track(e, p) }), [client]);
}
