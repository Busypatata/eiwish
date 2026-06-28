"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { addWishlistItem, updateWishlistItem } from "@/lib/actions/items";
import { uploadItemImage, UploadError } from "@/lib/uploads";
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
import type { WishlistItem } from "@/types/database";

const priorityOptions = [
  { value: "0", label: "No preference" },
  { value: "1", label: "Nice to have" },
  { value: "2", label: "Would love" },
  { value: "3", label: "Really want" },
];

export function ItemFormDialog({
  open,
  onOpenChange,
  wishlistId,
  userId,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlistId: string;
  userId: string;
  item?: WishlistItem | null;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    item?.image_url ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [priority, setPriority] = useState(String(item?.priority ?? 0));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(item);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadItemImage(file, userId, wishlistId);
      setImageUrl(url);
    } catch (err) {
      toast.error(
        err instanceof UploadError ? err.message : "Couldn't upload image."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    if (imageUrl) formData.set("imageUrl", imageUrl);

    const result = isEditing
      ? await updateWishlistItem(wishlistId, item!.id, formData)
      : await addWishlistItem(wishlistId, formData);

    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Wish updated" : "Wish added");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-full max-w-lg mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit wish" : "Add a wish"}</DialogTitle>
          <DialogDescription>
            Tell people what makes this a great gift.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Photo (optional)</Label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/50 transition-colors hover:bg-muted"
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              ) : imageUrl ? (
                <div className="relative h-full w-full">
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <ImagePlus className="size-6" />
                  <span className="text-xs">Add a photo</span>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={item?.title}
              placeholder="Noise-cancelling headphones"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={item?.description}
              placeholder="Color, size, or any details that help"
              maxLength={2000}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item?.price ?? undefined}
                placeholder="49.99"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={item?.currency ?? "USD"}
                maxLength={3}
                className="uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="productUrl">Link to item (optional)</Label>
            <Input
              id="productUrl"
              name="productUrl"
              type="url"
              defaultValue={item?.product_url ?? undefined}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="priority">How much do you want this?</Label>
            <input type="hidden" name="priority" value={priority} />
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <SubmitButton disabled={uploading}>
              {isEditing ? "Save changes" : "Add wish"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
