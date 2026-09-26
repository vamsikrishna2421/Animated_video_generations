import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { Background } from "./components/Background";
import { Caption } from "./components/Caption";
import { Fonts } from "./components/Fonts";
import { SceneFade } from "./components/SceneFade";
import { Cta } from "./scenes/Cta";
import { Docs } from "./scenes/Docs";
import { File } from "./scenes/File";
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Plan } from "./scenes/Plan";
import { Refund } from "./scenes/Refund";
import { SceneProps } from "./scenes/types";
import { theme } from "./theme";
import timeline from "./timeline.json";

const SCENES: Record<string, React.FC<SceneProps>> = {
  hook: Hook,
  intro: Intro,
  docs: Docs,
  plan: Plan,
  refund: Refund,
  file: File,
  cta: Cta,
};

// Music sits under the narration: full level between lines, ducked while Muse speaks.
const musicVolume = (f: number) => {
  const { volume, duckedVolume } = timeline.music;
  const speaking = timeline.scenes.some((s) => {
    const a = s.from + s.voiceFrom;
    return f >= a - 6 && f <= a + s.voiceFrames + 6;
  });
  const base = speaking ? duckedVolume : volume;
  return base * interpolate(f, [0, 20], [0, 1], { extrapolateRight: "clamp" });
};

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: theme.bg1 }}>
    <Fonts />
    <Background />
    <Audio src={staticFile(timeline.music.audio)} volume={musicVolume} />
    {timeline.scenes.map((s) => {
      const Scene = SCENES[s.id];
      return (
        <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={s.id}>
          <SceneFade duration={s.durationInFrames}>
            <Scene duration={s.durationInFrames} voiceFrom={s.voiceFrom} voiceFrames={s.voiceFrames} />
            <Caption text={s.caption} from={s.voiceFrom} frames={s.voiceFrames} />
          </SceneFade>
          <Sequence from={s.voiceFrom} layout="none">
            <Audio src={staticFile(s.audio)} />
          </Sequence>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
