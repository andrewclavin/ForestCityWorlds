import { can } from "@fcw/auth-policy";
import { describe, expect, it } from "vitest";

describe("auth-policy", () => {
  it("allows public access to home", () => {
    expect(can("public", "home.view")).toBe(true);
  });

  it("denies public access to business plans", () => {
    expect(can("public", "business-plan.view")).toBe(false);
  });

  it("allows approved access to business plans", () => {
    expect(can("approved", "business-plan.view")).toBe(true);
  });
});
