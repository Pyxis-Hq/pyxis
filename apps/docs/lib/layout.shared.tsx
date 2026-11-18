import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, gitConfig } from "./shared";

function Mark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" role="img" aria-label="Pyxis">
      <rect width="24" height="24" rx="5" fill="var(--primary)" />
      <rect x="5" y="11" width="3.6" height="8" rx="0.6" fill="#fff" fillOpacity="0.55" />
      <rect x="10.2" y="5" width="3.6" height="14" rx="0.6" fill="#fff" />
      <rect x="15.4" y="9" width="3.6" height="10" rx="0.6" fill="#fff" fillOpacity="0.8" />
    </svg>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2 font-semibold tracking-tight">
          <Mark />
          {appName}
        </span>
      ),
    },
    themeSwitch: { enabled: false },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
