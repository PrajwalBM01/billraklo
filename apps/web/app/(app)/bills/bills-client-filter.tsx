"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

type ClientOption = { id: string; legalName: string };

export function BillsClientFilter({
  clients,
  value,
}: {
  clients: ClientOption[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const items = [
    { value: "all", label: "All clients" },
    ...clients.map((client) => ({ value: client.id, label: client.legalName })),
  ];

  function handleChange(next: string | null) {
    if (!next) return;
    const href = next === "all" ? pathname : `${pathname}?client=${encodeURIComponent(next)}`;
    startTransition(() => router.push(href));
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Client</span>
      {pending && <Spinner className="size-4 text-muted-foreground" />}
      <Select items={items} value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-52" aria-label="Filter bills by client">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
