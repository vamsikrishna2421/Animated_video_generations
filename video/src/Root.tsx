import { Composition } from "remotion";
import { Promo } from "./Promo";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MusePromo"
    component={Promo}
    durationInFrames={timeline.totalFrames}
    fps={timeline.fps}
    width={1920}
    height={1080}
  />
);
