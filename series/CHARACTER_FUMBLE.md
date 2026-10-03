# Mr. Fumble — silent-comedy character

Original character (not a likeness of any real actor or existing show). Mustard argyle vest, light-blue shirt,
orange bow tie, charcoal trousers, brown shoes, side-parted hair, very mobile eyebrows. He never speaks:
comedy comes from mannerisms, hums and foley.

## Files
- Rig + mannerism library: `video/src/reel/Fumble.tsx`
- Making-of film + reusable sketch + `Stage` backdrop: `video/src/reel/FumbleMaking.tsx`
- Model sheet (rig check): `video/src/reel/FumbleSheet.tsx` (composition `FumbleSheet`)
- Audio kit: `pipeline/fumble_audio.py` -> `video/public/fumble/audio/` (hums, tiptoe plinks, clunk, slide whistle, sneak music)

## Using him in a reel
```tsx
<svg width={1080} height={1920}>
  <g transform="translate(540,1660) scale(1.22)"><Fumble f={frame} p={tiptoe(frame)} /></g>
</svg>
```
`p` is a pose object (44 controls, including a flexible torso: `hipTilt`, `bend`, `twist`, `shrug`/`shrugL`/`shrugR`, `breath`). Mannerism clips return poses from a local frame count:
`idle`, `stiffWalk(t, dir)`, `tiptoe(t, dir)`, `browWiggle`, `doubleTake` (60 f), `smugGrin`, `innocent`,
`peek(t, dir)`, `shock`, `pout`. Spread a clip and override fields to vary it:
`{ ...smugGrin(t), shut: 0, lookX: 1 }`.

Sound sync: stiff-walk heel strikes every 11 frames (`fumble_clunk`), tiptoe steps every 18 frames
(`fumble_tip0..3`), double-take snap at clip frame 30 (`fumble_slide_up` + `fumble_gasp`).

## Compositions
- `FumbleSketch` (16 s): Mr. Fumble vs the Follow button. Props: `handle`.
- `FumbleMaking` (88 s): build time-lapse. Props: `label`, `minutes`, `clock`, `code`, `handle`, `snaps`.
  Renders that name the builder go to git-ignored `out/local/`.
