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

type Translate = {
  raw: (key: string) => unknown;
  (key: string, values: Record<string, string>): string;
};

/** Beat copy with computed figures filled in. Figures never live in the JSON. */
export function resolveBeats(t: Translate, values: Record<string, string>): BeatCopy[] {
  return (t.raw("beats") as BeatCopy[]).map((beat, i) => ({
    ...beat,
    tag: t(`beats.${i}.tag`, values),
    h: t(`beats.${i}.h`, values),
    p: t(`beats.${i}.p`, values),
  }));
}
