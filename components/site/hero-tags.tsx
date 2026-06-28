/**
 * Signature hero element: a small constellation of overlapping gift tags,
 * tilted at different angles like they've been tossed onto a table —
 * the "characteristic thing in the subject's world" called for by the
 * frontend-design brief, rendered as one orchestrated illustration rather
 * than generic stock iconography.
 */
export function HeroTags() {
  return (
    <svg
      viewBox="0 0 480 360"
      className="w-full max-w-md"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g transform="rotate(-8 150 200)">
        <rect
          x="60"
          y="150"
          width="170"
          height="110"
          rx="14"
          fill="#ffffff"
          stroke="#e3d6c4"
          strokeWidth="2"
        />
        <circle cx="86" cy="176" r="7" fill="#fbf4ed" stroke="#e3d6c4" strokeWidth="2" />
        <rect x="80" y="206" width="120" height="10" rx="5" fill="#f1e8dd" />
        <rect x="80" y="226" width="80" height="8" rx="4" fill="#f1e8dd" />
        <rect x="80" y="186" width="70" height="12" rx="6" fill="#e0623f" opacity="0.85" />
      </g>

      <g transform="rotate(6 320 160)">
        <rect
          x="230"
          y="90"
          width="180"
          height="116"
          rx="14"
          fill="#ffffff"
          stroke="#e3d6c4"
          strokeWidth="2"
        />
        <circle cx="258" cy="118" r="7" fill="#fbf4ed" stroke="#e3d6c4" strokeWidth="2" />
        <rect x="252" y="150" width="130" height="10" rx="5" fill="#f1e8dd" />
        <rect x="252" y="170" width="90" height="8" rx="4" fill="#f1e8dd" />
        <rect x="252" y="128" width="64" height="12" rx="6" fill="#2f6f62" opacity="0.85" />
      </g>

      <g transform="rotate(-3 250 280)">
        <rect
          x="150"
          y="230"
          width="190"
          height="110"
          rx="14"
          fill="#ffffff"
          stroke="#e3d6c4"
          strokeWidth="2"
        />
        <circle cx="178" cy="256" r="7" fill="#fbf4ed" stroke="#e3d6c4" strokeWidth="2" />
        <rect x="172" y="286" width="135" height="10" rx="5" fill="#f1e8dd" />
        <rect x="172" y="306" width="95" height="8" rx="4" fill="#f1e8dd" />
        <rect x="172" y="266" width="72" height="12" rx="6" fill="#c9a26a" opacity="0.9" />
      </g>
    </svg>
  );
}
