import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./global.css";

export const metadata: Metadata = {
  title: { default: "Pyxis Docs", template: "%s | Pyxis Docs" },
  description: "Documentation for Pyxis, privacy-first web and API analytics for Stellar projects.",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        {/* Dark only, like the app: the theme switch is hidden and the theme is forced. */}
        <RootProvider theme={{ forcedTheme: "dark", enableSystem: false }}>{children}</RootProvider>
      </body>
    </html>
  );
}
