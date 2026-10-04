import { Composition } from "remotion";
import { Promo } from "./Promo";
import timeline from "./timeline.json";
import { Titles } from "./titles/Titles";
import titles from "./titles_timeline.json";
import { Lesson, LessonTimeline } from "./lesson/Lesson";
import { timelines } from "./lesson/timelines";
import { Story } from "./story/Story";
import storyTl from "./story/story_timeline.json";
import storyTeTl from "./story/story_timeline_te.json";
import { StoryTe, StoryYT, PromoCfg } from "./story/StoryTe";
import storyEnTl from "./story/story_timeline_en.json";
import { RideWorld } from "./reel/World";
import { Scene3DTest } from "./reel/Scene3D";
import { ChariotRace } from "./reel/Chariot3D";
import { LEAD, MascotCTA, TAIL } from "./reel/Mascot";
import mascotTe from "./reel/mascot_te.json";
import mascotEn from "./reel/mascot_en.json";
import { BuildProps, BuildTimelapse, buildDuration } from "./reel/BuildTimelapse";
import { GAG_LEN, GagReel } from "./reel/Gags";
import { WATCH_LEN, WatchAssembly } from "./reel/Watch3D";
import { CompareProps, CompareReel, compareDuration } from "./reel/Compare";
import { BrandShowreel, CaptionsDemo, FollowOutro, SHOWREEL_LEN, SubscribeOutro } from "./brand/Showreel";
import ep00v2Timeline from "./reel/timelines/ep00v2.json";
import { LogoSting } from "./brand/Logo";
import { NewsReel, NewsTimeline } from "./news/NewsReel";
import { NewsYT, ytDuration } from "./news/NewsYT";
import { Reel, ReelTimeline, ReelYT } from "./reel/Reel";
import { reels } from "./reel/timelines";
import { FumbleSheet } from "./reel/FumbleSheet";
import { YESH_LEN, YeshCompare, YeshDance } from "./reel/YeshDance";
import { DROP, YESH_DROP_LEN, YESH_FULL_LEN, YeshFull } from "./reel/YeshFull";
import { HOOK_TUT_LEN, HookTutorial } from "./reel/HookStep";
import { SolSheet } from "./reel/SolSheet";
import { MocapCheck } from "./reel/MocapCheck";
import { HeroinePoses, HeroineSheet } from "./reel/HeroineSheet";
import { FumbleMotion, MOTION_LEN } from "./reel/FumbleMotion";
import { BossCheck, BOSS_LEN } from "./reel/BossCheck";
import { FM_LEN, FumbleMaking, FumbleMakingProps, FumbleSketch, SKETCH_LEN } from "./reel/FumbleMaking";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MusePromo"
      component={Promo}
      durationInFrames={timeline.totalFrames}
      fps={timeline.fps}
      width={1920}
      height={1080}
    />
    {(reels as unknown as ReelTimeline[]).map((tl) => (
      <Composition
        key={`yt-${tl.id}`}
        id={`YT-${tl.id}`}
        component={ReelYT as unknown as React.FC<Record<string, unknown>>}
        defaultProps={{ tl }}
        durationInFrames={tl.totalFrames}
        fps={tl.fps}
        width={1920}
        height={1080}
      />
    ))}
    {(reels as unknown as ReelTimeline[]).map((tl) => (
      <Composition
        key={tl.id}
        id={`Reel-${tl.id}`}
        component={Reel as unknown as React.FC<Record<string, unknown>>}
        defaultProps={{ tl }}
        durationInFrames={tl.totalFrames}
        fps={tl.fps}
        width={1080}
        height={1920}
      />
    ))}
    <Composition id="Scene3DTest" component={Scene3DTest} durationInFrames={150} fps={30} width={1000} height={560} />
    <Composition id="MascotTe" component={MascotCTA as unknown as React.FC<Record<string, unknown>>} durationInFrames={LEAD + mascotTe.frames + TAIL} calculateMetadata={({ props }) => ({ durationInFrames: LEAD + (props as { data: { frames: number } }).data.frames + TAIL })} fps={30} width={1080} height={1920} defaultProps={{ data: mascotTe, audio: "mascot/cta_te.wav", handle: "@ai_maastaaru_telugu" }} />
    <Composition id="MascotEn" component={MascotCTA as unknown as React.FC<Record<string, unknown>>} durationInFrames={LEAD + mascotEn.frames + TAIL} calculateMetadata={({ props }) => ({ durationInFrames: LEAD + (props as { data: { frames: number } }).data.frames + TAIL })} fps={30} width={1080} height={1920} defaultProps={{ data: mascotEn, audio: "mascot/cta_en.wav", handle: "@ai_maastaaru" }} />
    <Composition id="BuildTimelapse" component={BuildTimelapse as unknown as React.FC<Record<string, unknown>>} durationInFrames={buildDuration(mascotEn)} fps={30} width={1080} height={1920}
      defaultProps={{ label: "AI", name: "Bittu", minutes: 0, clock: [0, 1, 2, 3, 4], code: "// code", data: mascotEn, audio: "mascot/cta_en.wav", handle: "@ai_maastaaru", snaps: { before: "mascot/cta_en.wav", after: "mascot/cta_en.wav" } }}
      calculateMetadata={({ props }) => ({ durationInFrames: buildDuration((props as unknown as BuildProps).data, (props as unknown as BuildProps).gag ?? 0) })} />
    <Composition id="GagFollow" component={GagReel as unknown as React.FC<Record<string, unknown>>} durationInFrames={GAG_LEN} fps={30} width={1080} height={1920} defaultProps={{ handle: "@ai_maastaaru" }} />
    <Composition id="WatchAssembly" component={WatchAssembly} durationInFrames={WATCH_LEN} fps={30} width={1080} height={1920} />
    <Composition id="CompareReel" component={CompareReel as unknown as React.FC<Record<string, unknown>>} durationInFrames={300} fps={30} width={1080} height={1920}
      defaultProps={{ title: "Same prompt", prompt: "...", items: [], question: "Which one was better?", handle: "@ai_maastaaru" }}
      calculateMetadata={({ props }) => ({ durationInFrames: compareDuration(props as unknown as CompareProps) })} />
    <Composition id="Brand-Showreel" component={BrandShowreel} durationInFrames={SHOWREEL_LEN} fps={30} width={1080} height={1920} />
    <Composition id="Brand-Sting" component={LogoSting as unknown as React.FC<Record<string, unknown>>} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{ dark: true, tagline: "AI, explained simply." }} />
    <Composition id="Brand-Sting-Light" component={LogoSting as unknown as React.FC<Record<string, unknown>>} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{ dark: false, tagline: "AI, explained simply." }} />
    <Composition id="Brand-Sting-Te" component={LogoSting as unknown as React.FC<Record<string, unknown>>} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={{ dark: true, tagline: "AI, explained in Telugu." }} />
    <Composition id="Brand-Sting-YT" component={LogoSting as unknown as React.FC<Record<string, unknown>>} durationInFrames={90} fps={30} width={1920} height={1080} defaultProps={{ dark: true, tagline: "AI, explained simply." }} />
    <Composition id="Brand-Follow" component={FollowOutro as unknown as React.FC<Record<string, unknown>>} durationInFrames={120} fps={30} width={1080} height={1920} defaultProps={{ handle: "@ai_maastaaru", tagline: "AI, explained simply." }} />
    <Composition id="Brand-Follow-Te" component={FollowOutro as unknown as React.FC<Record<string, unknown>>} durationInFrames={120} fps={30} width={1080} height={1920} defaultProps={{ handle: "@ai_maastaaru_telugu", tagline: "AI, explained in Telugu." }} />
    <Composition id="Brand-Captions" component={CaptionsDemo as unknown as React.FC<Record<string, unknown>>} durationInFrames={ep00v2Timeline.scenes[0].lines[0].frames + 10} fps={30} width={1080} height={1920} defaultProps={{ audio: ep00v2Timeline.scenes[0].lines[0].audio, words: ep00v2Timeline.scenes[0].lines[0].words, handle: "@ai_maastaaru" }} />
    <Composition id="Brand-Subscribe" component={SubscribeOutro as unknown as React.FC<Record<string, unknown>>} durationInFrames={90} fps={30} width={1920} height={1080} defaultProps={{ handle: "AI Maastaaru" }} />
    <Composition id="NewsReel" component={NewsReel as unknown as React.FC<Record<string, unknown>>} durationInFrames={300} fps={30} width={1080} height={1920}
      defaultProps={{ handle: "@ai_maastaaru", tl: { id: "x", date: "", range: "", edition: "AI NEWS", lang: "en", frames: 300, segments: [] } }}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(30, (props as unknown as { tl: NewsTimeline }).tl.frames) })} />
    <Composition id="NewsYT" component={NewsYT as unknown as React.FC<Record<string, unknown>>} durationInFrames={300} fps={30} width={1920} height={1080}
      defaultProps={{ tl: { id: "x", date: "", range: "", edition: "AI NEWS", lang: "en", frames: 300, segments: [] } }}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(120, ytDuration((props as unknown as { tl: NewsTimeline }).tl)) })} />
    <Composition id="FumbleSheet" component={FumbleSheet} durationInFrames={120} fps={30} width={1080} height={1920} />
    <Composition id="YeshDance" component={YeshDance} durationInFrames={YESH_LEN} fps={30} width={1080} height={1920} />
    <Composition id="YeshFull" component={YeshFull as unknown as React.FC<Record<string, unknown>>} durationInFrames={YESH_FULL_LEN} fps={30} width={1080} height={1920} defaultProps={{ title: true, handle: "@ai_maastaaru_telugu" }} />
    <Composition id="BossCheck" component={BossCheck as unknown as React.FC<Record<string, unknown>>} durationInFrames={BOSS_LEN} fps={30} width={1080} height={1920} />
    <Composition id="HookTutorial" component={HookTutorial} durationInFrames={HOOK_TUT_LEN} fps={30} width={1080} height={1920} />
    <Composition id="SolSheet" component={SolSheet} durationInFrames={60} fps={30} width={1080} height={1920} />
    <Composition id="YeshDrop" component={YeshFull as unknown as React.FC<Record<string, unknown>>} durationInFrames={YESH_DROP_LEN} fps={30} width={1080} height={1920} defaultProps={{ title: true, handle: "@ai_maastaaru_telugu", from: DROP }} />
    <Composition id="YeshCompare" component={YeshCompare} durationInFrames={YESH_LEN} fps={30} width={1440} height={1280} />
    <Composition id="MocapCheck" component={MocapCheck as unknown as React.FC<Record<string, unknown>>} durationInFrames={480} fps={30} width={1080} height={1920} defaultProps={{ name: "test_jp" }} />
    <Composition id="HeroineSheet" component={HeroineSheet} durationInFrames={120} fps={30} width={1080} height={1920} />
    <Composition id="HeroinePoses" component={HeroinePoses} durationInFrames={120} fps={30} width={1080} height={1920} />
    <Composition id="FumbleMotion" component={FumbleMotion as unknown as React.FC<Record<string, unknown>>} durationInFrames={MOTION_LEN} fps={30} width={1080} height={1920} defaultProps={{ onion: false }} />
    <Composition id="FumbleSketch" component={FumbleSketch as unknown as React.FC<Record<string, unknown>>} durationInFrames={SKETCH_LEN} fps={30} width={1080} height={1920} defaultProps={{ handle: "@ai_maastaaru" }} />
    <Composition id="FumbleMaking" component={FumbleMaking as unknown as React.FC<Record<string, unknown>>} durationInFrames={FM_LEN} fps={30} width={1080} height={1920}
      defaultProps={{ label: "AI", minutes: 30, clock: [0, 3, 8, 12, 15, 25], code: "// code", handle: "@ai_maastaaru", snaps: { before: "fumble/snaps/before.png", after: "fumble/snaps/after.png" } } satisfies FumbleMakingProps} />
    <Composition id="ChariotRace" component={ChariotRace} durationInFrames={450} fps={30} width={1920} height={1080} />
    <Composition id="WorldDemo" component={RideWorld as unknown as React.FC<Record<string, unknown>>} durationInFrames={180} fps={30} width={1000} height={560} />
    {([
      ["Te", { tl: storyTeTl, handle: "@ai_maastaaru_telugu", subline: "AI, explained in Telugu.", drake: ["Confusing English AI tutorials", "AI explained in Telugu, simply"], episodes: "82 episodes, zero jargon" }],
      ["En", { tl: storyEnTl, handle: "@ai_maastaaru", subline: "AI, explained simply.", drake: ["Confusing AI tutorials full of jargon", "AI explained simply, from scratch"], episodes: "82 episodes, zero jargon" }],
    ] as [string, PromoCfg][]).flatMap(([k, cfg]) => [
      <Composition key={`p${k}`} id={`ChannelStory${k}`} component={StoryTe as unknown as React.FC<Record<string, unknown>>} defaultProps={{ cfg }} durationInFrames={cfg.tl.totalFrames} fps={30} width={1080} height={1920} />,
      <Composition key={`py${k}`} id={`ChannelStory${k}YT`} component={StoryYT as unknown as React.FC<Record<string, unknown>>} defaultProps={{ cfg }} durationInFrames={cfg.tl.totalFrames} fps={30} width={1920} height={1080} />,
    ])}
    <Composition
      id="ChannelStory"
      component={Story}
      durationInFrames={storyTl.totalFrames}
      fps={storyTl.fps}
      width={1080}
      height={1920}
    />
    <Composition
      id="MuseTitles"
      component={Titles}
      durationInFrames={titles.totalFrames}
      fps={titles.fps}
      width={1920}
      height={1080}
    />
    {(timelines as unknown as LessonTimeline[]).map((tl) => (
      <Composition
        key={tl.id}
        id={`Lesson-${tl.id}`}
        component={Lesson as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={tl.totalFrames}
        fps={tl.fps}
        width={1080}
        height={1920}
        defaultProps={tl as unknown as Record<string, unknown>}
      />
    ))}
  </>
);
