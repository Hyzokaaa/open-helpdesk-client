import { describe, expect, it } from "vitest";
import { channelName, sourceDetails } from "./signup-origin";

describe("channelName", () => {
  it("names the sites the backend recognises, and leaves others as they came", () => {
    expect(channelName("reddit")).toBe("Reddit");
    expect(channelName("hacker-news")).toBe("Hacker News");
    expect(channelName("blog.example.org")).toBe("blog.example.org");
    expect(channelName("newsletter")).toBe("newsletter");
  });

  it("leaves direct to the page, which words it in its language", () => {
    expect(channelName("direct")).toBeNull();
  });
});

describe("sourceDetails", () => {
  it("lists only what the browser told", () => {
    expect(sourceDetails({
      channel: "reddit", referrer: "reddit.com", ref: null, utmSource: null, utmMedium: null,
      utmCampaign: "launch", landingPath: "/pricing", firstSeenAt: null,
    })).toEqual(["referrer: reddit.com", "utm_campaign: launch", "landing: /pricing"]);
  });
});
