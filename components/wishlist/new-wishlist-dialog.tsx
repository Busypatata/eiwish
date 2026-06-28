"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createWishlist } from "@/lib/actions/wishlists";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/site/submit-button";

export function NewWishlistDialog() {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState("private");

  async function handleSubmit(formData: FormData) {
    const result = await createWishlist(formData);
    // createWishlist redirects on success, so reaching here means an error.
    if (result && "error" in result) {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New wishlist
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-lg mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Create a wishlist</DialogTitle>
          <DialogDescription>
            You can change any of this later.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Birthday wishes"
              required
              maxLength={120}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="A few things that would make my day"
              maxLength={2000}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="visibility">Who can see this?</Label>
            <input type="hidden" name="visibility" value={visibility} />
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger id="visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private — only me</SelectItem>
                <SelectItem value="shared">
                  Shared — people I invite
                </SelectItem>
                <SelectItem value="public">
                  Public — anyone with the link
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <SubmitButton>Create wishlist</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
