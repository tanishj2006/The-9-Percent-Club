"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * A small dropdown: opens from a trigger, moves focus with the arrow keys, and
 * closes on Escape, on Tab away, on an outside click, or when the route changes.
 * Items are any element marked `data-menu-item`.
 */
export function useMenu() {
  const pathname = usePathname();
  // Remembers the page it was opened on, so navigating closes it for free.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const items = () => [...(root.current?.querySelectorAll<HTMLElement>("[data-menu-item]") ?? [])];
  const close = useCallback(() => setOpenOn(null), []);
  const toggle = () => setOpenOn(open ? null : pathname);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", outside);
    // Start on the current choice, so the reader can see where they are.
    const current = root.current?.querySelector<HTMLElement>('[aria-current="page"], [aria-checked="true"]');
    (current ?? items()[0])?.focus();
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, close]);

  const onKeyDown = (event: KeyboardEvent) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);

    if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
      trigger.current?.focus();
      return;
    }
    if (!open) {
      if (event.target === trigger.current && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        setOpenOn(pathname);
      }
      return;
    }

    const move = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: list.length - 1 }[event.key];
    if (move === undefined) return;
    event.preventDefault();
    list[(move + list.length) % list.length]?.focus();
  };

  const onBlur = (event: React.FocusEvent) => {
    if (open && !root.current?.contains(event.relatedTarget as Node)) close();
  };

  return { open, toggle, close, root, trigger, onKeyDown, onBlur };
}
