import { describe, it, expect } from "vitest";
import { escapeHtml, renderMentions, MENTION_CLASS } from "./render-mentions";

const members = [
  { userId: "u1", firstName: "Ana", lastName: "García" },
  { userId: "u2", firstName: "<img src=x onerror=alert(1)>", lastName: "\"Evil\" O'Neil" },
];

describe("renderMentions", () => {
  it("renders a normal mention as the highlighted span with the member's current name", () => {
    expect(renderMentions("Hi @[Old Name](u1), welcome", members)).toBe(
      `Hi <span class="${MENTION_CLASS}">@Ana García</span>, welcome`,
    );
  });

  it("falls back to the stored name when the member is no longer in the workspace", () => {
    expect(renderMentions("@[Gone User](u9)", members)).toBe(
      `<span class="${MENTION_CLASS}">@Gone User</span>`,
    );
  });

  it("escapes markup in a member's name instead of emitting it as HTML", () => {
    const html = renderMentions("@[x](u2)", members);
    expect(html).not.toMatch(/<img/i);
    expect(html).toBe(
      `<span class="${MENTION_CLASS}">@&lt;img src=x onerror=alert(1)&gt; &quot;Evil&quot; O&#x27;Neil</span>`,
    );
  });

  it("escapes markup in a stored name used as fallback", () => {
    expect(renderMentions("@[<b>bold</b>](u9)", members)).toBe(
      `<span class="${MENTION_CLASS}">@&lt;b&gt;bold&lt;/b&gt;</span>`,
    );
  });

  it("leaves content without mentions untouched", () => {
    const content = "<p>Plain <strong>comment</strong> with an email a@b.c</p>";
    expect(renderMentions(content, members)).toBe(content);
  });

  it("replaces every mention in the content", () => {
    const html = renderMentions("@[a](u1) and @[b](u9)", members);
    expect(html.match(/<span/g)).toHaveLength(2);
  });
});

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#x27;");
  });
});
