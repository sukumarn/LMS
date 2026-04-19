"use client";

import { useTransition } from "react";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

type ClientOption = {
  clientId: string;
  clientName: string;
  clientSlug: string;
};

export function ClientSwitcher({
  activeClientId,
  activeClientName,
  clients,
  onClientChange
}: {
  activeClientId: string | null;
  activeClientName: string | null;
  clients: ClientOption[];
  onClientChange?: (clientId: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!clients.length) {
    return null;
  }

  function selectClient(clientId: string) {
    startTransition(async () => {
      await fetch("/api/session/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ clientId })
      });
      onClientChange?.(clientId);
      router.refresh();
    });
  }

  return (
    <label className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/60 px-3 py-2 text-sm dark:bg-white/5 sm:flex">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <select
        value={activeClientId ?? ""}
        onChange={(event) => selectClient(event.target.value)}
        disabled={isPending}
        className="bg-transparent text-sm outline-none"
      >
        {clients.map((client) => (
          <option key={client.clientId} value={client.clientId}>
            {client.clientName}
          </option>
        ))}
      </select>
    </label>
  );
}
