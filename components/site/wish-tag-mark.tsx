import { cn } from "@/lib/utils";

/**
 * EiWish's signature mark: a gift tag with a punched string-hole, the
 * same motif used on wish cards (.tag-notch). Drawn as inline SVG so it
 * inherits currentColor and scales crisply at any size.
 */
export function WishTagMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={cn("text-primary", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 13.5L13.5 3H23a2 2 0 0 1 2 2v9.5L14.5 25a2 2 0 0 1-2.83 0L3 16.33a2 2 0 0 1 0-2.83Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="18.5" cy="8.5" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
