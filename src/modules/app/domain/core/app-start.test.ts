import { describe, expect, it } from "vitest";
import { runAppStart, type AppStartSteps } from "./app-start";

function steps(overrides: Partial<AppStartSteps> = {}) {
  const ran: string[] = [];
  const all: AppStartSteps = {
    listen: () => { ran.push("listen"); },
    settleSession: async () => { ran.push("session"); },
    settleHandoff: async () => { ran.push("handoff"); return false; },
    mount: () => { ran.push("mount"); },
    ...overrides,
  };
  return { all, ran };
}

describe("Starting the app", () => {
  it("settles the session, then the trip between addresses, and only then shows the app", async () => {
    const { all, ran } = steps();
    await runAppStart(all);
    expect(ran).toEqual(["listen", "session", "handoff", "mount"]);
  });

  it("does not show the app on a page that is leaving for another address", async () => {
    const { all, ran } = steps({ settleHandoff: async () => { ran.push("handoff"); return true; } });
    await runAppStart(all);
    expect(ran).toEqual(["listen", "session", "handoff"]);
  });

  it("still shows the app when a step fails", async () => {
    const { all, ran } = steps({ settleSession: async () => { throw new Error("storage"); } });
    await runAppStart(all);
    expect(ran).toEqual(["listen", "mount"]);
  });
});
