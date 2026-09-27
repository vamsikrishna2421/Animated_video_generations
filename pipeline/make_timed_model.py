"""Create models/kokoro-v1.0-timed.onnx: the stock Kokoro v1.0 ONNX with the encoder's
per-phoneme frame durations exposed as a second output named "duration". kokoro-onnx uses
that output for word timings and continuous (cross-sentence) synthesis.
Requires: pip install onnx
"""
from pathlib import Path

import onnx
from onnx import TensorProto, helper

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "models" / "kokoro-v1.0.onnx"
DST = ROOT / "models" / "kokoro-v1.0-timed.onnx"
DURATION_TENSOR = "/encoder/Cast_output_0"  # Round -> Clip -> Cast: integer frames per token

m = onnx.load(str(SRC))
if not any(n.output and DURATION_TENSOR in n.output for n in m.graph.node):
    raise SystemExit(f"{DURATION_TENSOR} not found; this script targets kokoro-v1.0.onnx")
m.graph.node.append(helper.make_node("Identity", [DURATION_TENSOR], ["duration"], name="expose_duration"))
m.graph.output.append(helper.make_tensor_value_info("duration", TensorProto.INT64, None))
onnx.save(m, str(DST))
print("wrote", DST.relative_to(ROOT))
