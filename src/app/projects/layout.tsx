import { AppShell } from "@/components/pyxis/app-shell";

export default function ProjectsLayout({ children }: LayoutProps<"/projects">) {
  return <AppShell>{children}</AppShell>;
}
