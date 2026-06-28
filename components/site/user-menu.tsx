"use client";

import Link from "next/link";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/actions/auth";

export function UserMenu({
  displayName,
  avatarUrl,
  username,
}: {
  displayName: string;
  avatarUrl: string | null;
  username: string;
}) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Avatar className="size-9 border border-border">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {username && (
            <p className="truncate text-xs text-muted-foreground">
              @{username}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <UserIcon /> My wishlists
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings /> Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={logout} className="w-full">
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut /> Log out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
