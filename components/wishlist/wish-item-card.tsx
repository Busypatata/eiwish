"use client";

import Image from "next/image";
import { useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, MoreVertical, Pencil, Trash2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { deleteWishlistItem, toggleItemPurchased } from "@/lib/actions/items";
import type { WishlistItem } from "@/types/database";
import { cn } from "@/lib/utils";

const priorityLabel = ["", "Nice to have", "Would love", "Really want"];

export function WishItemCard({
  item,
  wishlistId,
  canEdit,
  canMarkPurchased,
  onEdit,
  addedByName,
}: {
  item: WishlistItem;
  wishlistId: string;
  canEdit: boolean;
  canMarkPurchased: boolean;
  onEdit: () => void;
  addedByName?: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleTogglePurchased() {
    startTransition(async () => {
      const result = await toggleItemPurchased(
        wishlistId,
        item.id,
        !item.is_purchased
      );
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteWishlistItem(wishlistId, item.id);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div
      className={cn(
        "tag-notch group relative flex flex-col rounded-xl border border-border bg-card pt-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        item.is_purchased && "opacity-60"
      )}
    >
      {(canEdit || canMarkPurchased) && (
        <div className="absolute right-3 top-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 bg-card/80 backdrop-blur"
              >
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil /> Edit
                </DropdownMenuItem>
              )}
              {(canEdit || canMarkPurchased) && (
                <DropdownMenuItem onClick={handleTogglePurchased} disabled={isPending}>
                  <Check />
                  {item.is_purchased ? "Mark as not bought" : "Mark as bought"}
                </DropdownMenuItem>
              )}
              {canEdit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this wish?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {item.image_url && (
        <div className="relative mx-4 mb-1 aspect-[4/3] overflow-hidden rounded-lg bg-muted">
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-medium leading-snug">
            {item.title}
          </h3>
        </div>

        {item.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {item.price != null && (
            <Badge variant="muted">
              {item.currency} {item.price.toFixed(2)}
            </Badge>
          )}
          {item.priority > 0 && (
            <Badge variant="outline">{priorityLabel[item.priority]}</Badge>
          )}
          {item.is_purchased && (
            <Badge variant="secondary" className="gap-1">
              <Check className="size-3" /> Bought
            </Badge>
          )}
        </div>
        
        {addedByName && (
          <p className="mt-1 text-xs text-muted-foreground">
            Added by {addedByName}
          </p>
        )}

        {item.product_url && (
          <a
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View item <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
