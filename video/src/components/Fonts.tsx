import { staticFile } from "remotion";

const weights = [400, 600, 800];

export const Fonts: React.FC = () => (
  <style>
    {weights
      .map(
        (w) => `@font-face{font-family:Inter;font-weight:${w};font-style:normal;src:url(${staticFile(
          `fonts/inter-latin-${w}-normal.woff2`
        )}) format('woff2');}`
      )
      .join("\n") +
      // Telugu glyphs (U+0C00-0C7F) come from Noto Sans Telugu under the Inter/Anton names, so any text can be Telugu.
      "\n" +
      [400, 700, 800]
        .map(
          (w) => `@font-face{font-family:Inter;font-weight:${w === 700 ? 600 : w};font-style:normal;unicode-range:U+0C00-0C7F,U+200C-200D;src:url(${staticFile(
            `fonts/noto-sans-telugu-telugu-${w}-normal.woff2`
          )}) format('woff2');}`
        )
        .join("\n") +
      `\n@font-face{font-family:Anton;unicode-range:U+0C00-0C7F,U+200C-200D;src:url(${staticFile("fonts/noto-sans-telugu-telugu-800-normal.woff2")}) format('woff2');}`}
  </style>
);
