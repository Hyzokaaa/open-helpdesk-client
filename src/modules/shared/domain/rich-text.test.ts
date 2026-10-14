import { describe, expect, it } from "vitest";
import { htmlToText, isRichText } from "./rich-text";

describe("htmlToText", () => {
  it("turns block tags into spaces, removes tags and decodes entities", () => {
    expect(htmlToText("<p>Primera versión</p><p>Tom &amp; Jerry &lt;3&gt; &#39;ok&#39;</p>")).toBe("Primera versión Tom & Jerry <3> 'ok'");
    expect(htmlToText("line<br/>break<ul><li>one</li><li>two</li></ul>")).toBe("line break one two");
  });

  it("keeps mentions as @Name", () => {
    expect(htmlToText("<p>Hola @[Ana Pérez](01HZX5C3V9J8Q2W4E6R8T0Y1U3)</p>")).toBe("Hola @Ana Pérez");
  });
});

describe("isRichText", () => {
  it("tells editor markup from plain text", () => {
    expect(isRichText("<p>Hola</p>")).toBe(true);
    expect(isRichText("Hola equipo,\n\nla impresora")).toBe(false);
    expect(isRichText("Usa a < b y 3 > 2")).toBe(false);
    expect(isRichText(null)).toBe(false);
  });
});
