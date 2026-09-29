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
import { StoryTe } from "./story/StoryTe";
import { RideWorld } from "./reel/World";
import { Scene3DTest } from "./reel/Scene3D";
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
    <Composition id="WorldDemo" component={RideWorld as unknown as React.FC<Record<string, unknown>>} durationInFrames={180} fps={30} width={1000} height={560} />
    <Composition
      id="ChannelStoryTe"
      component={StoryTe}
      durationInFrames={storyTeTl.totalFrames}
      fps={storyTeTl.fps}
      width={1080}
      height={1920}
    />
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
