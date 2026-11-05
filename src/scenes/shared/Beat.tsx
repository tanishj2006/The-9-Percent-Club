export interface BeatCopy {
  tag: string;
  tone: "gold" | "teal" | "brick";
  h: string;
  p: string;
}

export function Beat({ beat }: { beat: BeatCopy }) {
  return (
    <div className="beat" data-testid="beat">
      <span className="beat-tag" data-tone={beat.tone}>
        {beat.tag}
      </span>
      <h2>{beat.h}</h2>
      <p>{beat.p}</p>
    </div>
  );
}
