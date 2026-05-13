"use client";

import { useEffect, useId, useRef, useState } from "react";

type PanelPlacement = "above" | "below";

type InlineGlossaryTipProps = {
  label: string;
  heading: string;
  lines: readonly [string, string];
  labelClassName?: string;
  /** Footer tips open upward so panels stay in view; default opens below. */
  panelPlacement?: PanelPlacement;
};

export function InlineGlossaryTip({
  label,
  heading,
  lines,
  labelClassName,
  panelPlacement = "below",
}: InlineGlossaryTipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const placementClass =
    panelPlacement === "above"
      ? "bottom-full mb-2 origin-bottom"
      : "top-full mt-2 origin-top";

  return (
    <span ref={rootRef} className="relative inline-block align-baseline">
      <button
        type="button"
        className={
          labelClassName ??
          "cursor-help border-b border-dotted border-forest-moss/70 bg-transparent p-0 font-inherit text-inherit underline-offset-2 hover:border-bioluminescent hover:text-bioluminescent"
        }
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${label}, ${heading}. Press to ${open ? "close" : "open"} definition.`}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open ? (
        <div
          id={panelId}
          className={`absolute left-1/2 z-50 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border border-forest-canopy/60 bg-forest-deep p-3 text-left shadow-lg sm:left-0 sm:translate-x-0 max-h-[min(20rem,50vh)] overflow-y-auto ${placementClass}`}
        >
          <span className="block font-lineal text-xs font-semibold tracking-tight text-mycelium-cream">
            {heading}
          </span>
          <span className="mt-2 block font-display text-xs leading-relaxed text-forest-spring">
            {lines[0]}
          </span>
          <span className="mt-2 block font-display text-xs leading-relaxed text-forest-spring">
            {lines[1]}
          </span>
        </div>
      ) : null}
    </span>
  );
}
