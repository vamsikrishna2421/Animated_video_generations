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
      .join("\n")}
  </style>
);
