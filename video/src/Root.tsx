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
import { Reel, ReelTimeline, ReelYT } from "./reel/Reel";
import { reels } from "./reel/timelines";

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
    <Composition id="MascotTe" component={MascotCTA as unknown as React.FC<Record<string, unknown>>} durationInFrames={LEAD + mascotTe.frames + TAIL} fps={30} width={1080} height={1920} defaultProps={{ data: mascotTe, audio: "mascot/cta_te.wav", handle: "@ai_maastaaru_telugu" }} />
    <Composition id="MascotEn" component={MascotCTA as unknown as React.FC<Record<string, unknown>>} durationInFrames={LEAD + mascotEn.frames + TAIL} fps={30} width={1080} height={1920} defaultProps={{ data: mascotEn, audio: "mascot/cta_en.wav", handle: "@ai_maastaaru" }} />
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
