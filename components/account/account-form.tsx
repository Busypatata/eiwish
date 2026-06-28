"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { updateProfile, updateAvatar } from "@/lib/actions/profile";
import { uploadAvatar, UploadError } from "@/lib/uploads";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/site/submit-button";
import type { Profile } from "@/types/database";

export function AccountForm({ profile }: { profile: Profile }) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(file, profile.id);
      const result = await updateAvatar(url);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      setAvatarUrl(url);
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(
        err instanceof UploadError ? err.message : "Couldn't upload image."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    const result = await updateProfile(formData);
    if (result && "error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative"
          disabled={uploading}
        >
          <Avatar className="size-20 border border-border">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="text-2xl">
              {(profile.display_name || profile.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? (
              <Loader2 className="size-5 animate-spin text-white" />
            ) : (
              <Camera className="size-5 text-white" />
            )}
          </div>
        </button>
        <div>
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP, or GIF. 5MB max.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Username</Label>
          <Input value={`@${profile.username}`} disabled />
          <p className="text-xs text-muted-foreground">
            Your public link: eiwish.app/u/{profile.username}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={profile.display_name}
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={profile.bio}
            maxLength={500}
            rows={3}
            placeholder="A little about you"
          />
        </div>
        <SubmitButton className="w-auto">Save changes</SubmitButton>
      </form>
    </div>
  );
}
