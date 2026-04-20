"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type UserRow = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  created_at: string;
  currentRole: string | null;
  currentClientId: string | null;
  membershipStatus: string | null;
};

type Client = {
  id: string;
  name: string;
};

type Props = {
  clients: Client[];
};

export function PendingUsers({ clients }: Props) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, { clientId: string; role: string }>>({});

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setFetchError(data.error); return; }
        const rows: UserRow[] = data.users ?? [];
        setUsers(rows);
        const initial: Record<string, { clientId: string; role: string }> = {};
        rows.forEach((u) => {
          const normalizedRole = u.currentRole === "ADMIN" ? "CLIENT_ADMIN" : u.currentRole ?? "LEARNER";
          initial[u.id] = {
            clientId: u.currentClientId ?? clients[0]?.id ?? "",
            role: normalizedRole,
          };
        });
        setSelections(initial);
      })
      .finally(() => setLoading(false));
  }, [clients]);

  async function save(userId: string) {
    const sel = selections[userId];
    if (!sel?.clientId) return;

    setSaving(userId);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, clientId: sel.clientId, role: sel.role }),
    });

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, currentRole: sel.role, currentClientId: sel.clientId, membershipStatus: "ACTIVE" }
            : u
        )
      );
      setSaved(userId);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  }

  function setField(userId: string, field: "clientId" | "role", value: string) {
    setSelections((prev) => ({ ...prev, [userId]: { ...prev[userId], [field]: value } }));
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading users...</p>;
  }

  if (fetchError) {
    return <p className="text-sm text-destructive">Error loading users: {fetchError}</p>;
  }

  if (!users.length) {
    return <p className="text-sm text-muted-foreground">No users found.</p>;
  }

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="hidden grid-cols-[1fr_160px_160px_100px] gap-3 px-4 text-xs font-medium text-muted-foreground lg:grid">
        <span>User</span>
        <span>Workspace</span>
        <span>Role</span>
        <span />
      </div>

      {users.map((user) => {
        const hasMembership = !!user.currentRole;
        const isApproved = user.membershipStatus === "ACTIVE";
        const isPending = !hasMembership || !isApproved;
        const isDirty =
          selections[user.id]?.role !== user.currentRole ||
          selections[user.id]?.clientId !== user.currentClientId;

        return (
          <div
            key={user.id}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 lg:grid-cols-[1fr_160px_160px_100px] lg:items-center"
          >
            {/* User info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{user.name}</p>
                {isPending && (
                  <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30 shrink-0">
                    Pending
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>

            {/* Workspace selector */}
            <select
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm w-full"
              value={selections[user.id]?.clientId ?? ""}
              onChange={(e) => setField(user.id, "clientId", e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Role selector */}
            <select
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm w-full"
              value={selections[user.id]?.role ?? "LEARNER"}
              onChange={(e) => setField(user.id, "role", e.target.value)}
            >
              <option value="LEARNER">Learner</option>
              <option value="INSTRUCTOR">Instructor</option>
              <option value="CLIENT_ADMIN">Admin</option>
            </select>

            {/* Save button */}
            <Button
              size="sm"
              variant={saved === user.id ? "outline" : "default"}
              className="w-full lg:w-auto"
              onClick={() => save(user.id)}
              disabled={saving === user.id || (!isDirty && hasMembership && isApproved)}
            >
              <Save className="h-4 w-4" />
              {saving === user.id ? "Saving..." : saved === user.id ? "Saved" : hasMembership ? "Update" : "Assign"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
