"use client";

import { useState } from "react";
import { BookmarkPlus } from "lucide-react";
import { toast } from "sonner";

import { useLMSStore } from "@/store/lms-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function NotesPanel() {
  const [draft, setDraft] = useState("");
  const { notes, addNote } = useLMSStore();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Notes and bookmarks</CardTitle>
        <BookmarkPlus className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add a bookmark note..." />
          <Button
            onClick={() => {
              if (!draft.trim()) return;
              addNote(draft.trim());
              setDraft("");
              toast.success("Note saved");
            }}
          >
            Save
          </Button>
        </div>
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note} className="rounded-2xl border border-white/10 bg-white/50 p-3 text-sm dark:bg-white/5">
              {note}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
