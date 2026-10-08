import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { ATTN_SCENES } from "./AttentionCrayon";
import { DISTILL_SCENES } from "./DistillCrayon";
import { CHEAP_SCENES } from "./CheapCrayon";
import CHEAP_PREVIEW from "./cheap_preview.json";

// Dev-only: every EP27 scene with evenly spaced cues (no audio) for look checks.
const ORDER = ["at_hook", "at_old", "at_attn", "at_how", "at_cost", "at_origin", "at_quiz", "at_outro"] as const;
export const ATTN_PREVIEW_SCENE = 300;
export const AttnPreview: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {ORDER.map((t, i) => {
      const Comp = ATTN_SCENES[t] as unknown as React.FC<any>;
      const s = { id: t, data: { handle: "@ai_maastaaru" }, frames: ATTN_PREVIEW_SCENE, lines: [{ from: 0, frames: ATTN_PREVIEW_SCENE }] };
      const cue = (n: number) => Math.round(ATTN_PREVIEW_SCENE * n / 5);
      return (
        <Sequence key={t} from={i * ATTN_PREVIEW_SCENE} durationInFrames={ATTN_PREVIEW_SCENE}>
          <Comp s={s} cue={cue} line={() => s.lines[0]} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

// Dev-only: the distillation explainer scenes, evenly spaced cues.
const DORDER = ["ds_hook", "ds_class", "ds_soft", "ds_results", "ds_cheap", "ds_catch", "ds_pick", "ds_ask"] as const;
export const DistPreview: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {DORDER.map((t, i) => {
      const Comp = DISTILL_SCENES[t] as unknown as React.FC<any>;
      const s = { id: t, data: { handle: "@ai_maastaaru" }, frames: ATTN_PREVIEW_SCENE, lines: [{ from: 0, frames: ATTN_PREVIEW_SCENE }] };
      const cue = (n: number) => Math.round(ATTN_PREVIEW_SCENE * n / 5);
      return (
        <Sequence key={t} from={i * ATTN_PREVIEW_SCENE} durationInFrames={ATTN_PREVIEW_SCENE}>
          <Comp s={s} cue={cue} line={() => s.lines[0]} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

// Dev preview of the cheap-models scenes with fixed timing (cues at n/5 of each scene).
export const CheapPreview: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    {(CHEAP_PREVIEW as any[]).map((sc, i) => {
      const Comp = (CHEAP_SCENES as any)[sc.type] as React.FC<any>;
      const s = { id: sc.id, data: sc.data, frames: ATTN_PREVIEW_SCENE, lines: [{ from: 0, frames: ATTN_PREVIEW_SCENE }] };
      const cue = (n: number) => Math.round(ATTN_PREVIEW_SCENE * n / 5);
      return (
        <Sequence key={sc.id} from={i * ATTN_PREVIEW_SCENE} durationInFrames={ATTN_PREVIEW_SCENE}>
          <Comp s={s} cue={cue} line={() => s.lines[0]} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
