"use client";

import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "system", label: "System", description: "Match your device", Icon: LaptopIcon },
  { value: "light", label: "Light", description: "Always light", Icon: SunIcon },
  { value: "dark", label: "Dark", description: "Always dark", Icon: MoonIcon },
] as const;

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div role="radiogroup" aria-label="Theme" className="grid gap-3 sm:grid-cols-3">
      {THEMES.map(({ value, label, description, Icon }) => {
        const selected = mounted && theme === value;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border border-border p-4 text-left transition-colors outline-none",
              "hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              selected &&
                "border-primary bg-primary/5 ring-1 ring-primary/30 dark:border-primary/50 dark:bg-primary/10"
            )}
          >
            <Icon className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </button>
        );
      })}
    </div>
  );
}
