import { Composition } from "remotion";
import { Promo } from "./Promo";
import timeline from "./timeline.json";
import { Titles } from "./titles/Titles";
import titles from "./titles_timeline.json";
import { Lesson, LessonTimeline } from "./lesson/Lesson";
import { timelines } from "./lesson/timelines";
import { Story } from "./story/Story";
import storyTl from "./story/story_timeline.json";

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
