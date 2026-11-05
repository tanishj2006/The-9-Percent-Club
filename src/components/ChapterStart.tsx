"use client";

import { useLayoutEffect } from "react";
import { hudStore, STARTING_MONEY, type HudNote } from "@/lib/hud-store";

/**
 * Puts the HUD back at a chapter's starting point before first paint, so the
 * previous chapter's balance never shows on this chapter's intro, even while the
 * scene chunk is still loading. Sits before the scene in the tree, so a scene
 * restoring a mid-page scroll position still has the last word.
 */
export function ChapterStart({
  note = null,
  noteValue,
}: {
  note?: HudNote | null;
  noteValue?: string;
}) {
  useLayoutEffect(() => {
    hudStore.set({ money: STARTING_MONEY, settled: STARTING_MONEY, note, noteValue });
  }, [note, noteValue]);

  return null;
}
