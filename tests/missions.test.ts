import { describe, expect, it } from "vitest";
import { getMarsOneWayDelaySeconds, LIGHT_SPEED_KM_PER_SECOND } from "@/config/missions";

describe("mission delay model", () => {
  it("uses the verified light-speed value and labels conjunction as unavailable", () => {
    expect(LIGHT_SPEED_KM_PER_SECOND.value).toBe(299_792.458);
    expect(getMarsOneWayDelaySeconds(100, false)).toBeGreaterThan(0);
    expect(getMarsOneWayDelaySeconds(100, true)).toBeNull();
  });
});
