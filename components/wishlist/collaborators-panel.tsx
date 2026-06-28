"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import { inviteCollaborator, removeCollaborator } from "@/lib/actions/collaborators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Collaborator = {
  id: string;
  role: "viewer" | "editor";
  profile: { username: string; display_name: string; avatar_url: string | null };
};

export function CollaboratorsPanel({
  wishlistId,
  collaborators,
}: {
  wishlistId: string;
  collaborators: Collaborator[];
}) {
  const [role, setRole] = useState("viewer");
  const [isPending, startTransition] = useTransition();

  async function handleInvite(formData: FormData) {
    formData.set("role", role);
    const result = await inviteCollaborator(wishlistId, formData);
    if (result && "error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Invited!");
      (document.getElementById("invite-username") as HTMLInputElement).value = "";
    }
  }

  function handleRemove(collaboratorId: string) {
    startTransition(async () => {
      const result = await removeCollaborator(wishlistId, collaboratorId);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <form action={handleInvite} className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="invite-username"
          name="username"
          placeholder="Username to invite"
          required
          className="flex-1"
        />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit">
          <UserPlus /> Invite
        </Button>
      </form>

      {collaborators.length > 0 ? (
        <ul className="space-y-2">
          {collaborators.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-2.5"
            >
              <div className="flex items-center gap-2.5">
                <Avatar className="size-8">
                  {c.profile.avatar_url && (
                    <AvatarImage src={c.profile.avatar_url} />
                  )}
                  <AvatarFallback>
                    {c.profile.display_name.charAt(0).toUpperCase() ||
                      c.profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {c.profile.display_name || c.profile.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{c.profile.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {c.role}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => handleRemove(c.id)}
                  disabled={isPending}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No one invited yet. Invite people by their EiWish username.
        </p>
      )}
    </div>
  );
}
