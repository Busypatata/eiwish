"use client";

import { useState } from "react";
import { Plus, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishItemCard } from "@/components/wishlist/wish-item-card";
import { ItemFormDialog } from "@/components/wishlist/item-form-dialog";
import type { WishlistItem } from "@/types/database";

export function ItemsGrid({
  items,
  wishlistId,
  userId,
  canEdit,
  canMarkPurchased,
}: {
  items: WishlistItem[];
  wishlistId: string;
  userId: string;
  canEdit: boolean;
  canMarkPurchased: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

  function openAddDialog() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function openEditDialog(item: WishlistItem) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-medium">
          {items.length} {items.length === 1 ? "wish" : "wishes"}
        </h2>
        {canEdit && (
          <Button onClick={openAddDialog}>
            <Plus /> Add a wish
          </Button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <WishItemCard
              key={item.id}
              item={item}
              wishlistId={wishlistId}
              canEdit={canEdit}
              canMarkPurchased={canMarkPurchased}
              onEdit={() => openEditDialog(item)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-accent text-primary">
            <Gift className="size-7" />
          </div>
          <h3 className="font-display text-lg font-medium">
            Nothing here yet
          </h3>
          {canEdit && (
            <p className="max-w-xs text-sm text-muted-foreground">
              Add the first wish to get this list started.
            </p>
          )}
        </div>
      )}

      {canEdit && (
        <ItemFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          wishlistId={wishlistId}
          userId={userId}
          item={editingItem}
        />
      )}
    </>
  );
}
