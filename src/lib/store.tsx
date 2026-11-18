"use client";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { useState, type ReactNode } from "react";
import { pyxisApi } from "./api";

const makeStore = () =>
  configureStore({ reducer: { [pyxisApi.reducerPath]: pyxisApi.reducer }, middleware: (gdm) => gdm().concat(pyxisApi.middleware) });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);
  return <Provider store={store}>{children}</Provider>;
}
