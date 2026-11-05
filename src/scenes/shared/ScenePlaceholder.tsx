import type { CSSProperties } from "react";
import { Beat, type BeatCopy } from "./Beat";

/**
 * Shown while a scene's chunk loads. Holds the scene's full height so the page
 * does not jump and a restored scroll position survives.
 */
export function ScenePlaceholder({ beats, first }: { beats: number; first: BeatCopy }) {
  return (
    <section className="scene" style={{ "--beats": beats } as CSSProperties}>
      <div className="scene-sticky">
        <div className="stage" />
        <div className="caption gutter">
          <Beat beat={first} />
        </div>
      </div>
    </section>
  );
}
