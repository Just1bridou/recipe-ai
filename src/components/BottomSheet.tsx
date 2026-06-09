"use client";

import { useEffect, useState, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Mobile-first bottom sheet: slides up from the bottom over a dimmed,
 * blurred backdrop. Animates on both open and close, locks body scroll,
 * and respects the device safe-area inset.
 */
export function BottomSheet({ open, onClose, title, children }: Props) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 300);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={`sheet-backdrop${visible ? " visible" : ""}`}
      onClick={onClose}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-grab" aria-hidden />
        {title ? (
          <div className="sheet-header">
            <h2>{title}</h2>
            <button
              type="button"
              className="sheet-close"
              onClick={onClose}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
