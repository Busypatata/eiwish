"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, Trash2 } from "lucide-react";
import { updateWishlist, deleteWishlist } from "@/lib/actions/wishlists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SubmitButton } from "@/components/site/submit-button";
import { CollaboratorsPanel } from "@/components/wishlist/collaborators-panel";
import type { Wishlist } from "@/types/database";

type Collaborator = {
  id: string;
  role: "viewer" | "editor";
  profile: { username: string; display_name: string; avatar_url: string | null };
};

export function WishlistSettingsDialog({
  wishlist,
  collaborators: initialCollaborators,
}: {
  wishlist: Wishlist;
  collaborators: Collaborator[];
}) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState(wishlist.visibility);
  const [collaborators, setCollaborators] = useState(initialCollaborators);

  // Refresh collaborators from server when dialog opens
  useEffect(() => {
    if (open && wishlist.visibility === "shared") {
      fetch(`/api/wishlists/${wishlist.id}/collaborators`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setCollaborators(data);
        })
        .catch(() => {});
    }
  }, [open, wishlist.id, wishlist.visibility]);

  async function handleSubmit(formData: FormData) {
    const result = await updateWishlist(wishlist.id, formData);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Wishlist updated");
    setOpen(false);
  }

  async function handleDelete() {
    const result = await deleteWishlist(wishlist.id);
    if (result && "error" in result) {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Settings /> Settings
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-lg mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Wishlist settings</DialogTitle>
          <DialogDescription>
            Manage details and sharing for &quot;{wishlist.title}&quot;.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            <TabsTrigger value="sharing" className="flex-1">Sharing</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <form action={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" name="title" defaultValue={wishlist.title} required maxLength={120} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea id="edit-description" name="description" defaultValue={wishlist.description} maxLength={2000} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-visibility">Who can see this?</Label>
                <input type="hidden" name="visibility" value={visibility} />
                <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
                  <SelectTrigger id="edit-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private — only me</SelectItem>
                    <SelectItem value="shared">Shared — people I invite</SelectItem>
                    <SelectItem value="public">Public — anyone with the link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" className="text-destructive hover:text-destructive">
                      <Trash2 /> Delete wishlist
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this wishlist?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &quot;{wishlist.title}&quot; and every wish in it. This can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete forever
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <SubmitButton className="w-auto">Save changes</SubmitButton>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="sharing">
            <div className="pt-2">
              {wishlist.visibility === "shared" ? (
                <CollaboratorsPanel
                  wishlistId={wishlist.id}
                  collaborators={collaborators}
                  onCollaboratorsChange={setCollaborators}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Set visibility to &quot;Shared&quot; on the Details tab to invite specific people.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
