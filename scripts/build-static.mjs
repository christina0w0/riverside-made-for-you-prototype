import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const sourcePath = new URL(
  "../public/episode-plan-interactive.html",
  import.meta.url,
);
const madeForYouImagePath = new URL(
  "../public/assets/riverside-made-for-you.png",
  import.meta.url,
);
const editorImagePath = new URL(
  "../public/assets/riverside-editor.png",
  import.meta.url,
);
const hostingPath = new URL("../.openai/hosting.json", import.meta.url);
const distPath = new URL("../dist/", import.meta.url);

const [sourceTemplate, madeForYouImage, editorImage] = await Promise.all([
  readFile(sourcePath, "utf8"),
  readFile(madeForYouImagePath),
  readFile(editorImagePath),
]);
const source = sourceTemplate
  .replaceAll(
    "assets/riverside-made-for-you.png",
    `data:image/png;base64,${madeForYouImage.toString("base64")}`,
  )
  .replaceAll(
    "assets/riverside-editor.png",
    `data:image/png;base64,${editorImage.toString("base64")}`,
  );
const hosting = await readFile(hostingPath, "utf8");
const encoded = Buffer.from(source).toString("base64");
const worker = `const encoded = ${JSON.stringify(encoded)};
const worker = {
  async fetch() {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new Response(bytes, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer"
      }
    });
  }
};
export default worker;
`;

await rm(distPath, { recursive: true, force: true });
await mkdir(new URL("server/", distPath), { recursive: true });
await mkdir(new URL("client/", distPath), { recursive: true });
await mkdir(new URL(".openai/", distPath), { recursive: true });
await writeFile(new URL("server/index.js", distPath), worker);
await writeFile(
  new URL("client/episode-plan-interactive.html", distPath),
  source,
);
await writeFile(new URL(".openai/hosting.json", distPath), hosting);
