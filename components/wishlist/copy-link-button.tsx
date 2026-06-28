"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ wishlistId }: { wishlistId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/wishlists/${wishlistId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" onClick={handleCopy}>
      {copied ? <Check /> : <Link2 />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
