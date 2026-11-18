/** Mark: three bars on a shared baseline, a small multiple, with the live bar in the accent. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Pyxis">
      <rect width="24" height="24" rx="5" className="fill-primary" />
      <rect x="5" y="11" width="3.6" height="8" rx="0.6" fill="#fff" fillOpacity="0.55" />
      <rect x="10.2" y="5" width="3.6" height="14" rx="0.6" fill="#fff" />
      <rect x="15.4" y="9" width="3.6" height="10" rx="0.6" fill="#fff" fillOpacity="0.8" />
    </svg>
  );
}
