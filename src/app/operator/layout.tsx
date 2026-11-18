import { AppShell } from "@/components/pyxis/app-shell";

export default function OperatorLayout({ children }: LayoutProps<"/operator">) {
  return <AppShell>{children}</AppShell>;
}
