# Design resources (shared by the channel owner)

Remotion renders React, so React UI libraries are usable, with one rule: their animations run on real time
(framer-motion, CSS keyframes), but video frames must be a pure function of the frame number. So we port the
*look* into frame-driven components (`interpolate` / `spring` on `useCurrentFrame()`), never drop them in as-is.

| Resource | Use for us |
|---|---|
| ui.shadcn.com | Realistic app UI mockups (chat boxes, dashboards, settings) so on-screen "products" look real, not drawn. Static markup ports directly. |
| ui.aceternity.com / magicui.design / motion-primitives.com | Effect ideas to port frame-driven: border beams, meteors, spotlight cards, number tickers, marquees, text reveals, animated grids. |
| component.gallery | Reference for how real products lay out a component (for believable UI). |
| uiverse.io / 21st.dev / jiro.build | Extra component and prompt references. |
| spline.design / unicorn.studio | Runtime 3D / WebGL effects for websites; not frame-deterministic, so only as visual reference (our 3D goes through @remotion/three). |

Source: https://x.com/iamtanzil_/status/2105531744896303163 (Oct 1, 2026)
