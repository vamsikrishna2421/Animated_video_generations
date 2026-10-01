import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { BrandFonts, Meta } from "./Base";
import { CTA_SFX, FollowCard, Subscribe } from "./Cta";
import { BigNumber, DotMatrix, LetterAssemble, PromptBox, RansomStamp, SearchHook, Seg, Statement, stampTimes } from "./Kinetic";
import { NewsFlash, RankBars, StatRings } from "./Data";
import { LogoBug, LogoSting } from "./Logo";
import { Karaoke, Word } from "./Captions";
import { Flash, Wipe } from "./Transitions";
import { Aurora, Grain } from "./Base";
import { B, beat, typeTimes } from "./tokens";

// Brand kit showreel: every template once, cut on the 120 BPM beat map. The music drops (beat 56) exactly
// on the logo sting's impact. Scene names match the components so a template can be asked for by name.
const A = (f: string) => `brand/audio/brand_${f}.wav`;
const Sfx: React.FC<{ at: number; src: string; vol?: number }> = ({ at, src, vol = 0.7 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={90} layout="none">
    <Audio src={staticFile(src)} volume={vol} />
  </Sequence>
);

const HOOK: Seg[] = [{ t: "What is " }, { t: "AI", accent: true }, { t: ", really?" }];
const PROMPT = "Explain AI like I'm 10.";
const STAMP = ["NO", "JARGON.", "NO", "PANIC."];
const STING_AT = beat(56) - 13; // the sting's impact sits 13 frames in

type Scene = { from: number; to: number; name: string; dark: boolean; el: React.ReactNode };
export const SCENES: Scene[] = [
  { from: 0, to: beat(8), name: "01 · SEARCH HOOK", dark: false, el: <SearchHook segs={HOOK} label="Asked to AI" /> },
  { from: beat(8), to: beat(12), name: "02 · STATEMENT", dark: false, el: <Statement lines={[[{ t: "Learn " }, { t: "AI", accent: true }], [{ t: "from scratch." }]]} size={150} /> },
  { from: beat(12), to: beat(16), name: "03 · RANSOM STAMP", dark: true, el: <RansomStamp words={STAMP} bg={B.violet} /> },
  { from: beat(16), to: beat(20), name: "04 · BIG NUMBER", dark: true, el: <BigNumber value={100} suffix="M" label="ChatGPT users in 2 months" note="UBS ESTIMATE, VIA REUTERS · FEB 2023" /> },
  { from: beat(20), to: beat(28), name: "05 · PROMPT BOX", dark: true, el: <PromptBox prompt={PROMPT} /> },
  { from: beat(28), to: beat(32), name: "06 · LETTER ASSEMBLE", dark: true, el: <LetterAssemble word="MAASTAARU" sub="= teacher, in Telugu" size={200} /> },
  { from: beat(32), to: beat(36), name: "07 · DOT MATRIX", dark: true, el: <DotMatrix text="EP 01" sub="LEARN AI FROM SCRATCH" /> },
  { from: beat(36), to: beat(42), name: "08 · STAT RINGS", dark: false, el: <StatRings title="How people use AI at work" stats={[{ label: "Writing", value: 64 }, { label: "Research", value: 48 }, { label: "Coding", value: 37 }]} example /> },
  { from: beat(42), to: beat(48), name: "09 · RANK BARS", dark: true, el: <RankBars title="Most asked AI questions" rows={[{ label: "What is AI?", value: 41 }, { label: "Is AI safe?", value: 27 }, { label: "Will AI take my job?", value: 19 }, { label: "How do I start?", value: 13 }]} highlight={0} example /> },
  { from: beat(48), to: STING_AT, name: "10 · NEWS FLASH", dark: true, el: <NewsFlash headline={["Your weekly", "AI news,", "explained simply."]} date="01 OCT 2026" source="TEMPLATE" example /> },
  { from: STING_AT, to: STING_AT + 90, name: "11 · LOGO STING", dark: true, el: <LogoSting sound={false} /> },
  { from: STING_AT + 90, to: beat(72) + 15, name: "12 · FOLLOW CTA", dark: true, el: (<><Aurora dark intensity={0.8} /><FollowCard handle="@ai_maastaaru" /><Grain /></>) },
];
export const SHOWREEL_LEN = beat(72) + 15;

export const BrandShowreel: React.FC = () => {
  const follow = SCENES[11].from;
  const hookTimes = typeTimes(HOOK.map((s) => s.t).join(""), 10);
  const promptTimes = typeTimes(PROMPT, 8, 1.3).map((t) => t + SCENES[4].from);
  const cuts = [beat(8), beat(16), beat(20), beat(28), beat(36), beat(42), beat(48)];
  return (
    <AbsoluteFill style={{ background: B.night }}>
      <BrandFonts />
      {SCENES.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.to - s.from}>
          {s.el}
          <Meta left="AI MAASTAARU · MOTION KIT" right={s.name} dark={s.dark} progress={(i + 1) / SCENES.length} />
        </Sequence>
      ))}
      {cuts.map((c) => <Wipe key={c} at={c} />)}
      <Flash at={beat(12)} />
      <Flash at={beat(32)} />
      <Flash at={STING_AT + 13} len={8} />
      {/* music + sound design */}
      <Audio src={staticFile(A("bed_120"))} volume={0.55} />
      {hookTimes.map((t, i) => <Sfx key={`k${i}`} at={t} src={A(`type${i % 6}`)} vol={0.5} />)}
      <Sfx at={hookTimes[hookTimes.length - 1] + 12} src={A("enter")} />
      {cuts.map((c) => <Sfx key={`w${c}`} at={c - 8} src={A("whoosh")} vol={0.45} />)}
      {stampTimes(STAMP).map((t, i) => <Sfx key={`s${i}`} at={SCENES[2].from + t} src={A("stamp")} vol={0.8} />)}
      {Array.from({ length: 13 }, (_, i) => <Sfx key={`t${i}`} at={SCENES[3].from + 4 + i * 3} src={A("tick")} vol={0.35} />)}
      {promptTimes.map((t, i) => <Sfx key={`p${i}`} at={t} src={A(`type${(i + 3) % 6}`)} vol={0.45} />)}
      <Sfx at={promptTimes[promptTimes.length - 1] + 10} src={A("click")} />
      <Sfx at={SCENES[5].from} src={A("swipe")} vol={0.5} />
      <Sfx at={SCENES[5].from + 30} src={A("pop")} />
      {[0, 1, 2].map((i) => <Sfx key={`r${i}`} at={SCENES[7].from + 8 + i * 5} src={A("pop")} vol={0.45} />)}
      <Sfx at={SCENES[9].from + 2} src={A("chime")} vol={0.5} />
      <Sfx at={STING_AT} src={A("sting")} vol={0.85} />
      <Sfx at={follow + CTA_SFX.follow.click} src={A("click")} vol={0.8} />
      <Sfx at={follow + CTA_SFX.follow.heart} src={A("heart")} />
      <Sfx at={follow + CTA_SFX.follow.chime} src={A("chime")} vol={0.5} />
      {CTA_SFX.engage.map((t, i) => <Sfx key={`e${i}`} at={follow + t + 4} src={A(i === 0 ? "heart" : "pop")} vol={0.5} />)}
    </AbsoluteFill>
  );
};

// Standalone, reusable pieces (rendered once, dropped into any video).
export const FollowOutro: React.FC<{ handle: string; tagline?: string }> = ({ handle, tagline }) => (
  <AbsoluteFill>
    <BrandFonts />
    <Aurora dark intensity={0.8} />
    <FollowCard handle={handle} tagline={tagline} />
    <Grain />
    <Sfx at={CTA_SFX.follow.click} src={A("click")} vol={0.8} />
    <Sfx at={CTA_SFX.follow.heart} src={A("heart")} />
    <Sfx at={CTA_SFX.follow.chime} src={A("chime")} vol={0.5} />
    {CTA_SFX.engage.map((t, i) => <Sfx key={i} at={t + 4} src={A(i === 0 ? "heart" : "pop")} vol={0.5} />)}
    <Audio src={staticFile(A("loop_120"))} volume={0.35} />
  </AbsoluteFill>
);

export const SubscribeOutro: React.FC<{ handle: string }> = ({ handle }) => (
  <AbsoluteFill>
    <BrandFonts />
    <Aurora dark intensity={0.8} />
    <Subscribe handle={handle} />
    <Grain />
    <Sfx at={30} src={A("click")} vol={0.8} />
    <Sfx at={32} src={A("bell")} vol={0.5} />
    <Audio src={staticFile(A("loop_120"))} volume={0.35} />
  </AbsoluteFill>
);

/** Karaoke captions demo on real narration: words come from a reel timeline ({w, from, to} per word). */
export const CaptionsDemo: React.FC<{ audio: string; words: { w: string; from: number; to: number }[]; handle: string }> = ({ audio, words, handle }) => {
  const ws: Word[] = words.map((w) => ({ w: w.w.replace(/[,]/g, ""), s: w.from, e: w.to }));
  return (
    <AbsoluteFill>
      <BrandFonts />
      <Aurora dark intensity={0.9} />
      <LogoBug handle={handle} at={4} />
      <Karaoke words={ws} bottom={760} size={120} />
      <Grain />
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};
