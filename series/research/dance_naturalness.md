# Natural-looking 2D dance from a reference clip: research notes

Researched October 2026 for the `pipeline/mocap.py` -> `video/src/reel/*` (Fumble / Heroine) pipeline. Constraints
assumed: CPU-only container, 360p film clips, 30 fps Remotion render, monetised channel (so licences matter).

What the current code does (read before planning): MediaPipe `pose_landmarker_full` in VIDEO mode, crop+upscale
follow for crowds, angles unwrapped then Savitzky-Golay (window 5-9) plus a median filter, hip height solved from
the lower foot, wrist bend from landmark 19/20, hands always `"open"`, and limbs drawn as two rigid round-capped
`<line>` segments per arm/leg (`Fumble.tsx` ~l.70-122).

Why it looks puppet-like, in one paragraph: every joint is a filtered copy of noisy data, so (a) all joints move at
the same time with the same easing (no overlap, no drag), (b) the filter is symmetric and uniform, so it softens hits
as much as noise, (c) limbs are straight rods that hinge at a point, (d) nothing on the body moves that the tracker
did not see (hair, cloth, hands, jewellery), (e) feet are only constrained vertically, so they skate sideways, and
(f) poses are not timed to the music, so the dance reads as "near" the beat instead of "on" it.

---

## Ranking (impact on perceived naturalness vs effort, for this pipeline)

| # | Change | Impact | Effort | CPU ok |
|---|--------|--------|--------|--------|
| 1 | Outlier rejection + zero-phase, speed-adaptive smoothing on landmarks (not angles) | High | Low | yes |
| 2 | Bendy tapered limbs (one Bezier per limb) instead of two rigid segments | High | Low | yes |
| 3 | Procedural overlap / follow-through layer (distal joints lag + overshoot via springs) | High | Low-Med | yes |
| 4 | Secondary motion sims for braid, pallu, pleats, jewellery (precomputed Verlet) | High | Med | yes |
| 5 | Beat-snapped accents: retime pose extremes onto beats, hold 1-2 frames, exaggerate hits | High | Med | yes |
| 6 | Foot contact detection + horizontal foot lock with 2D two-bone IK | Med-High | Med | yes |
| 7 | Whole-body estimator (RTMW / DWPose via `rtmlib`) for hands, feet and crowds; fuse with MediaPipe | Med-High | Med | yes |
| 8 | Saree rig: drive skirt/pleats procedurally from pelvis + beat instead of tracking hidden legs | Med-High | Med | yes |
| 9 | Hand-key workflow: extremes + breakdowns, Hermite/TCB splines, inertialized blends, move library | Med | Low-Med | yes |
| 10 | Crowd: reuse a few cycles with offsets/mirroring/amplitude jitter instead of tracking everyone | Med | Low | yes |
| 11 | Turn views (front / 3-4 / profile swaps) keyed off world-landmark yaw with hysteresis | Med | Med-High | yes |
| 12 | Moving holds and optional "on twos" for stylised sections | Low-Med | Low | yes |
| 13 | 2D->3D lifting (MotionBERT / MotionAGFormer) for better depth than MediaPipe world | Low-Med | Med | slow but ok |
| -- | SMPL video mocap (GVHMR, WHAM, TRAM, 4D-Humans) | Med | High | no (GPU) + licence blocker |
| -- | Music-to-dance generators (EDGE, Bailando, FineDance) to fill gaps | Low | High | no + licence blocker |
| -- | Spine / Live2D runtimes | Med | High | licence + integration cost |

---

## 1. Filtering: kill jitter without killing hits (High / Low)

Best practice from mocap cleanup and the One Euro paper:

1. **Filter positions, then compute angles.** Filtering angles after `atan2` amplifies noise when a segment is short
   or foreshortened (the angle of a 5 px forearm swings wildly). Filter the 2D landmarks (and world landmarks), then
   derive angles. Keep unwrap for safety.
2. **Reject outliers before smoothing.** Use visibility < 0.5 or a Hampel test (sample further than 3 MAD from a
   7-frame rolling median) to mark samples missing, then interpolate (cubic for gaps <= 6 frames, hold/hand-key for
   longer). Also reject frames where bone length deviates > 25% from the clip median (classic left/right swap or
   limb snap). Fix L/R swaps explicitly: if swapping wrists/ankles reduces the frame-to-frame distance, swap.
3. **Offline means zero-phase.** We are not real-time, so run the filter forward and backward (`scipy.signal.filtfilt`
   for a Butterworth, or One Euro forward then on the reversed signal and average) or use a Rauch-Tung-Striebel
   smoother on a constant-velocity Kalman model. Both remove the lag that makes motion look "late" and mushy.
   Savitzky-Golay is zero-phase too but has a fixed bandwidth, so it smooths hits and holds equally.
4. **Speed-adaptive cutoff (One Euro).** `fc = min_cutoff + beta * |velocity|`. Tuning recipe from the authors:
   set beta = 0, lower `min_cutoff` until slow/still poses stop shimmering, then raise beta until fast moves stop
   lagging. Starting points at 30 fps with pixel coordinates normalised by torso length:
   - torso, hips, shoulders: min_cutoff 0.8-1.0 Hz, beta 0.3-0.7
   - elbows, knees: min_cutoff 1.2 Hz, beta 0.7
   - wrists, hand points, ankles/toes: min_cutoff 1.5-2.0 Hz, beta 1.0-2.0 (these carry the accents)
   - d_cutoff 1.0 Hz. (Units matter: beta is tuned per unit of velocity, so normalise first.)
5. **Option: SmoothNet** (plug-and-play temporal refiner, works on 2D or 3D joints from any estimator). PyTorch,
   tiny MLP, runs on CPU, but the shipped checkpoints are per-dataset/keypoint layout (COCO-17, H36M-17, SMPL), so
   it needs mapping from MediaPipe-33. Try only if One Euro + RTS is still not enough.

Links: One Euro paper/notes <https://jaantollander.com/post/noise-filtering-using-one-euro-filter/>,
PyPI `OneEuroFilter` <https://pypi.org/project/OneEuroFilter/>, filter comparison for MediaPipe
<https://medium.com/@debasishraut.dev/setting-up-smoothing-filters-for-mediapipe-pose-estimation-pipeline-a-practical-guide-fcc03f462196>,
SmoothNet <https://github.com/cure-lab/SmoothNet> (<https://arxiv.org/abs/2112.13715>),
RTS smoother overview <https://www.sbg-systems.com/glossary/rts-rauch-tung-striebel/>.

Quick win in the current code: switch the model to `pose_landmarker_heavy.task` (offline accuracy is what matters
here; same API).

## 2. Bendy limbs instead of rods (High / Low)

Rigid two-segment limbs with a visible hinge are the single biggest "cutout puppet" tell. Industry answers:
After Effects RubberHose / Limber "path limbs", DreamWorks' Curvy-Limb rig (a curviness control that makes the bend
a broad "U" or a sharp "V"), and mesh-weighted limbs in Spine/Live2D.

For an SVG rig in React this is cheap:
- Draw each limb as **one path**: shoulder -> elbow -> wrist with a quadratic/cubic Bezier whose control point is the
  elbow pushed slightly outward, and a filled outline offset to both sides (tapered: thick at shoulder/hip, thin at
  wrist/ankle). Blend `curviness` from 0 (straight arm, crisp hit) to ~0.35 (soft bend) based on elbow angle.
- Keep a little volume preservation: when the limb is nearly straight, narrow it 3-5%; when bent, thicken at the
  joint (fake muscle). Sleeves/kurta/saree blouse edges follow the same curve.
- Hands: add 4-6 hand drawings (open, soft-open/"Kathak" relaxed, point, fist, flat palm/alapadma-like, finger flick)
  and rotate them by the wrist angle you already compute. Switch shapes on beats or from hand landmarks (see 7).

Links: DreamWorks Curvy-Limb rig <https://dl.acm.org/doi/10.1145/3744199.3744627>, Limber limb types
<https://limber.docs.animatable.co/limb-types/>, RubberHose review <https://schoolofmotion.com/blog/rubberhose-2-review>,
Spine meshes/weights <http://en.esotericsoftware.com/spine-in-depth>, <http://esotericsoftware.com/blog/Mesh-weight-workflows>.

## 3. Overlap, follow-through, drag: the procedural animator layer (High / Low-Med)

The 12 principles applied to mocap cleanup (gamedeveloper.com / Game Anim, mocap cleanup guides): fix broken arcs,
remove pops, add overlap and follow-through, then exaggerate if the style is cartoony. Concretely, as a post-pass on
the filtered angle curves (Python, before JSON export):

- **Successive breaking of joints / drag:** time-shift distal joints: lower arm 1 frame after upper arm, wrist/hand
  2 frames, head 1-2 frames after torso, fingers 2-3 frames. Shifting by a frame or two is invisible as "lag" but
  reads as weight.
- **Follow-through / overshoot:** pass the distal angle through a critically-under-damped spring
  (`x'' = k(target - x) - c x'`, frequency 4-6 Hz, damping ratio 0.5-0.7 for hands, 0.8 for forearm). When the
  tracked arm stops hard, the hand overshoots and settles, which is exactly what is missing.
- **Arcs:** wrist and ankle paths should be curves. After filtering, check wrist trajectories for straight-line
  segments between keyed frames; in hand-keyed spans interpolate in angle space (which yields arcs) not in position.
- **Anticipation:** before big hits (detected as velocity peaks that land on a beat, see 5), add a small opposite
  move 3-5 frames earlier (5-10% of the move amplitude). Cheap and very effective for jumps and arm throws.
- **Exaggeration:** scale each joint's deviation from its 1-second moving average by 1.15-1.3, more at hits, clamp
  to joint limits. Push hip sway and shoulder bounce (the Tollywood "weight" lives there).
- **Squash/stretch:** vertical torso scale 0.96-1.04 driven by pelvis vertical acceleration (squash on landing,
  stretch on rise). Keep it subtle on human-proportion characters.

Remotion note: `spring()` and `interpolate()` with `Easing` are available, but every frame is rendered independently
(and in parallel), so any stateful spring/sim must be **precomputed** (in `mocap.py` or once in a `useMemo` over the
whole track) and then indexed by frame. Never integrate across frames inside the component.

Links: <https://www.gamedeveloper.com/production/the-12-principles-of-animation-in-video-games>,
<https://www.gameanim.com/2019/05/15/the-12-principles-of-animation-in-video-games/>,
<https://en.wikipedia.org/wiki/Follow_through_and_overlapping_action>,
mocap cleanup tasks <http://dglatour.blogspot.com/p/mocap-cleanup-mc.html>, <https://animost.com/tutorials/mocap-cleanup-and-edit/>,
stylised mocap thesis (retiming, posing, graph edits) <https://eprints.qut.edu.au/132351/1/Steven_Mohr_Thesis.pdf>.

## 4. Secondary motion: braid, pallu, pleats, jhumkas, dupatta (High / Med)

Nothing makes a dancer look alive faster than things that move *because* she moved. Use a small Verlet chain:
`p_new = p + (p - p_old) * damping + g * dt^2`, then 3-5 iterations of distance constraints; pin the first particle
to the rig attachment point (nape for braid, shoulder for pallu, waist for pleats, ear for jhumka).

- Braid: 8-12 particles, damping 0.96-0.98, segment length fixed; render as a tapered path with a repeating braid
  texture/scallop along the curve. Add a bending constraint (distance between particle i and i+2) so it does not
  fold like a rope.
- Pallu / dupatta: 2-3 parallel chains linked sideways = a cheap cloth strip; render as a filled polygon with a
  hem border. Add a small sideways "wind" force proportional to torso angular velocity.
- Saree pleats / skirt hem: 5-9 short pendulums along the hem, each pinned at the waist line, driven by pelvis
  acceleration and the hidden leg proxy (see 8). Flare outward on spins (centrifugal term from pelvis yaw speed).
- Jhumkas/earrings, bangles, ponytail ribbons: single damped pendulums (frequency ~2-3 Hz).

Precompute in Python into the mocap JSON (deterministic), or in TS once per track. Run the sim at 2-4 substeps per
frame for stability.

Links: Verlet procedural animation <https://www.lexaloffle.com/bbs/?tid=154658>, Verlet chains
<https://steemit.com/utopian-io/@sp33dy/tutorial-godot-engine-v3-gdscript-verlet-chain-v0-01>,
JS Verlet engines <https://github.com/topics/verlet-integration>, 2D hair strip physics
<https://www.comp.nus.edu.sg/~huangzy/EG01/koh_huang_cam.PDF>, skirt motion notes
<https://www.lemon8-app.com/@koanlicolors/7460925912599740974?region=us>.

## 5. Music-driven timing: land poses on the beat (High / Med)

Film choreography is cut to the song, but tracking noise + smoothing shifts extremes by 1-3 frames, which is enough to
look "off". Fix:

1. `librosa.beat.beat_track` (and `librosa.onset.onset_strength` for accents; `librosa.beat.plp` is more stable for
   folk percussion with tempo drift) -> beat times -> frame numbers at 30 fps.
2. Compute a "motion energy" curve (sum of joint angular speeds). Pose extremes are local **minima** of speed;
   hits are sharp decelerations.
3. Greedy monotonic matching of extremes to beats within +/-3 frames (same idea as the 2025 "Let Your Video Listen
   to Your Music" paper), then locally time-warp the curves (piecewise-linear time remap) so each extreme lands on
   its beat.
4. On matched hits: ease-in hard (last 2-3 frames decelerate), **hold 1-2 frames** (the "hit stop" from action
   animation), small overshoot via the spring in section 3, then release. Off-beat filler motion keeps its timing.
5. Use the beat grid also for hand-shape switches, blinks, and camera shakes so everything agrees.

Links: <https://librosa.org/doc/main/api/generated/librosa.beat.beat_track.html>,
<https://librosa.org/doc-playground/0.9.1/generated/librosa.beat.plp.html>,
<https://arxiv.org/html/2506.18881v1>, beat-keyframe dance evaluation <https://pmc.ncbi.nlm.nih.gov/articles/PMC11478525>,
hit stop and hit poses <https://mocaponline.com/blogs/mocap-news/combat-animation-game-dev-guide>.

## 6. Foot sliding: contact detection + foot lock (Med-High / Med)

Current code only fixes vertical (lowest foot on floor). Horizontal skate remains, and it is very visible on folk
steps with stamps.

- **Contact detection:** per foot use ankle/heel/toe (MediaPipe 27-32, or the 6 foot points in COCO-WholeBody).
  Contact when (a) speed < threshold and (b) foot is within a small margin of the lowest foot height in a 1 s window.
  Threshold: The Orange Duck uses 0.1-0.5 m/s on toes for 3D data; for 2D normalise by leg length, start at
  ~0.02 leg-lengths/frame. Clean with a 5-frame majority vote; drop contacts shorter than 3 frames.
- **Lock:** while in contact, pin the foot at the position where contact began; unlock when contact ends or the
  input drifts more than an unlock distance (~0.15 leg length). Blend in/out over 3-4 frames (inertialization or a
  smoothstep), never snap.
- **2D two-bone IK:** given hip and pinned ankle, solve knee with the law of cosines (L1=200, L2=195 already in
  code), choose the knee side from the tracked knee to avoid flips; clamp to full extension and let the pelvis drop
  a little when the leg would over-stretch.
- Stamps on the beat: if a contact starts within 2 frames of a beat, snap it to the beat and add a 1-frame
  squash + dust/ghungroo accent.
- WHAM's decoder also predicts foot-contact probabilities, but it is GPU/SMPL-bound (see below).

Links: <https://theorangeduck.com/page/inverse-kinematics-foot-locking>,
UnderPressure contact detection <https://arxiv.org/abs/2208.04598>,
footskate with ground constraints <https://openaccess.thecvf.com/content_WACV_2020/papers/Zou_Reducing_Footskate_in_Human_Motion_Reconstruction_with_Ground_Contact_Constraints_WACV_2020_paper.pdf>.

## 7. Better 2D tracking on CPU: rtmlib (RTMW / DWPose / RTMO) (Med-High / Med)

`rtmlib` packages the RTMPose family as ONNX with **no mmcv/mmpose dependency**: `pip install rtmlib onnxruntime`,
`device='cpu', backend='onnxruntime'`. Apache-2.0. Models download on first use (~50-200 MB).

- **RTMW / DWPose (COCO-WholeBody, 133 points):** body 17 + 6 feet + 68 face + 2x21 hands. This is what gives
  real hand shapes and finger flicks (MediaPipe Pose only has 3 points per hand). RTMW-l 70.2 mAP vs DWPose-l
  66.5 on COCO-WholeBody; hand accuracy remains the weak part (~0.6 AP), so at 360p use it for wrist orientation
  and open/closed/point classification, not individual finger angles.
- **RTMPose-m (body)**: ~75.8 COCO AP, reported 90+ fps on an i7 CPU with ONNX Runtime; whole-body variants are
  slower but fine offline.
- **RTMO** (one-stage multi-person) or rtmlib's `PoseTracker` with a YOLOX/RTMDet detector: proper multi-person
  output for crowd shots, instead of MediaPipe's single-person bias. Add an IoU+appearance tracker (keep the
  existing clothing histogram) for identity.
- Low-res trick (already used for crowds): crop around the target, upscale 2-3x (consider Real-ESRGAN only if CPU
  time allows), and run top-down at 256x192 or 384x288.
- **Fusion:** where both MediaPipe and RTMW are confident, average; where one drops, take the other. Disagreement
  > 15% of torso length marks a frame for review/hand-keying.
- MediaPipe's world landmarks remain useful for depth/foreshortening; RTMW is 2D only. For 3D from RTMW you would
  need a lifter (section 13).

Links: <https://github.com/Tau-J/rtmlib>, <https://pypi.org/project/rtmlib>,
RTMPose <https://github.com/open-mmlab/mmpose/tree/main/projects/rtmpose> (<https://arxiv.org/abs/2303.07399>),
RTMW <https://www.alphaxiv.org/abs/2407.08634>, DWPose <https://arxiv.org/pdf/2307.15880>,
estimator comparison 2026 <https://www.forasoft.com/learn/ai-for-video-engineering/articles-ai/openpose-mediapipe-rtmpose-pose-tracking>.
ViTPose is more accurate but heavier (GPU-friendly); not worth it on CPU when RTMW exists.

## 8. The saree heroine: stop tracking legs you cannot see (Med-High / Med)

Trackers hallucinate legs under a saree; the jitter you get is noise on fabric. Animator approach for long skirts:
treat the lower body as **one silhouette** (skirt/pleat shape) placed in front of simplified merged legs, and let
the feet appear only when they peek out.

- Drive from what is reliable: pelvis position/tilt/sway (hips 23/24 are usually tracked), torso lean, ankle points
  only when visibility is high.
- Generate a **procedural step cycle** under the cloth: weight shift side follows pelvis lateral motion; steps
  (and foot peeks) are placed on beats (section 5) where the pelvis changes direction.
- Skirt shape = hem polyline with 7-9 pendulum points (section 4) attached to waist; knee "pokes" deform the cloth
  forward on the stepping side. Flare on spins. Pleats fan (accordion bounce) on stamps.
- Keep tracked arms/torso/head as-is; this is where her expression is anyway (hands, wrists, neck slides).

Links: skirt-over-legs layering technique <https://community.adobe.com/questions-571/how-to-animate-a-skirt-between-two-legs-together-250538>,
skirt rig reacting to legs <https://blenderartists.org/t/make-skirt-rig-react-to-leg-movement/1563573>.

## 9. Hand-keying gaps that do not look hand-keyed (Med / Low-Med)

- Key **extremes and breakdowns**, not every few frames; interpolate in angle space with Hermite/Kochanek-Bartels
  (TCB) or Catmull-Rom splines and per-key ease (ease-in to the hit, fast out). Linear interpolation = robot.
- At the seams with tracked data, inertialize: carry the tracked velocity into the keyed span and decay the offset
  over 4-6 frames, so there is no pop.
- Build a **move library** from the best tracked bars (signature hook step, shoulder bounce, hand flick turn),
  stored as beat-normalised clips, so gaps can be filled by "same move, mirrored, re-timed to these beats".
  This is the realistic, licence-clean version of "dance generation" (section below).
- Keep a review overlay (`MocapCheck.tsx`) showing low-confidence frames in red so keying effort goes where needed.

## 10. Crowd scenes (Med / Low)

Studios do not mocap every background dancer. Track 1-2 visible leads cleanly; drive the crowd from 2-4 cycles
from the library with per-dancer offsets (0-4 frames), mirroring, amplitude 0.85-1.1, palette swaps and small
height/scale variation; keep everyone on the same beat grid. Occluded leads get gaps filled by section 9. Perfect
lockstep looks fake; 1-3 frame offsets look like a real troupe.

## 11. Turn views (Med / Med-High)

A frontal cutout that rotates its arms when the dancer turns profile looks flat. Draw 3 views (front, 3/4, profile)
of head, torso, hips; choose view from world-landmark shoulder/hip yaw (MediaPipe world z), with hysteresis (switch at
+/-35 deg going out, +/-25 deg coming back) and switch on a fast-motion frame (ideally a beat) so the swap hides in
motion; optionally add a 1-frame smear. Foreshortening already in `to_rig3d` then handles in-between angles.

## 12. Moving holds and "twos" (Low-Med / Low)

- When the tracked dancer freezes in a pose, add breathing (torso scale 0.5%, 0.25 Hz) and tiny Perlin drift
  (`@remotion/noise`) so the character never goes dead.
- For stylised beats, render body on twos (hold every pose 2 frames) while keeping cloth/hair on ones: hides residual
  jitter and reads anime-like. Use per-section, not globally.
Link: moving hold <https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation>,
limited animation <https://en.wikipedia.org/wiki/Limited_animation>.

## 13. 2D -> 3D lifting (Low-Med / Med)

MotionBERT / MotionAGFormer lift sequences of 2D joints (H36M-17 layout) to 3D and are temporally smooth; they run
on CPU (slowly) and avoid SMPL. Useful if MediaPipe world landmarks give bad depth for foreshortening/turn views.
Check each repo's licence before use. <https://arxiv.org/pdf/2310.16288>,
<https://www.researchgate.net/publication/364518366_MotionBERT_Unified_Pretraining_for_Human_Motion_Analysis>.

---

## Not recommended for this container (and why)

**SMPL-based video mocap: GVHMR, WHAM, TRAM, 4D-Humans/HMR2.0.** Best-in-class world-grounded 3D with better
occlusion handling and (WHAM) foot contacts, but:
- GPU-oriented (ViTPose + DPVO/DROID-SLAM + transformers); CPU is possible only for some (GVHMR auto-falls back to
  CPU) and would be very slow on long clips.
- **Licence blocker:** they output SMPL/SMPL-X, whose model licence forbids commercial use including "production of
  other artifacts for commercial purposes" unless licensed via Meshcapade. GVHMR's own code is also
  non-commercial. WHAM, TRAM and 4D-Humans code is MIT, but still needs SMPL. For a monetised channel, treat these as
  research-only (e.g. a Colab experiment to compare, not production).
Links: <https://github.com/zju3dv/GVHMR>, <https://github.com/yohanshin/WHAM>, <https://github.com/yufu-wang/tram>,
<https://github.com/shubham-goel/4D-Humans>, SMPL licence <https://smpl.is.tue.mpg.de/modellicense.html>,
<https://meshcapade.com/smpl/>.

**Music-to-dance generators: EDGE, Bailando, FineDance.** EDGE (MIT code, in-betweening and joint-conditioning are
exactly the right features) needs Jukebox audio features and a GPU; all three output SMPL motion trained on
AIST++/FineDance (FineDance and Bailando licences are non-commercial research; no Indian/Tollywood genres in any of
them), so generated motion would be off-style and licence-encumbered. Use the beat-quantised move library (section 9)
instead. Links: <https://github.com/Stanford-TML/EDGE>, <https://github.com/lisiyao21/Bailando>,
<https://github.com/li-ronghui/FineDance>, AIST++ <https://research.google/blog/music-conditioned-3d-dance-generation-with-aist/>.

**Spine / Live2D.** Excellent mesh deformation, but Spine runtimes require a Spine licence to integrate/distribute,
the editor is GUI-only, and integrating PixiJS/WebGL rendering into Remotion's frame-by-frame renderer adds work.
The bendy-limb SVG approach (section 2) gets ~80% of the benefit inside the existing React rig.
Links: <https://github.com/EsotericSoftware/spine-runtimes/blob/4.2/spine-ts/README.md>,
<https://www.npmjs.com/package/@esotericsoftware/spine-pixi>.

---

## Indian / Tollywood specifics

No public 3D dataset or model targets Tollywood or Telugu folk choreography (searched AIST++, FineDance,
PhantomDance, OpenDance); there is research on Bharatanatyam/Kathakali mudra recognition (single images, not
animation). Practical implications:
- The style lives in **hands, wrists, neck and hips**, which are exactly what MediaPipe Pose tracks worst. Prioritise
  section 7 (hand shapes from RTMW), a hand-shape library (open, relaxed Kathak-style, point, fist, flat palm,
  flick), and exaggerated hip sway/shoulder bounce (section 3).
- **Signature "hook step" repetition:** song hooks repeat the same move; track the cleanest repetition once, polish
  it by hand, then reuse it on every repetition (beat-aligned). Consistency is what audiences recognise.
- **Percussive accents** (dappu, dholak, ghungroo): stamps, chest pops and head jerks should land on onsets, with a
  1-2 frame hold (section 5). Kolatam-style stick hits are perfect hit-stop moments.
- **Costume physics carries the reading** of folk dance (Lambadi mirror skirts, pleats, braids, bangles) - section 4.
- Mudra references if needed: <https://arxiv.org/pdf/2609.03415> (Mudragen),
  <https://arxiv.org/html/2404.11205v2> (Pose2Gest); background on forms:
  <https://en.wikipedia.org/wiki/Dance_forms_of_Andhra_Pradesh>, <https://en.wikipedia.org/wiki/Kolattam>,
  <https://en.wikipedia.org/wiki/Dappankuthu>.
- Keep it an original interpretation: the reference clip is for timing only (already the rule in `mocap.py`); avoid
  recreating an identifiable star's signature look on the character.

## Suggested order of work

1. Filtering rewrite (section 1) + heavy model. Measure: count of frames with |angular acceleration| spikes before vs after.
2. Bendy limbs + hand library (2) and overlap/overshoot springs (3), all as a post-pass over the JSON.
3. Beat grid + hit holds (5), then foot lock (6).
4. Braid/pallu/pleat sims (4) and the saree skirt rig (8).
5. rtmlib whole-body as a second tracker for hands/crowds (7); crowd cycles (10).
6. Turn views (11) only if review still flags flatness.
