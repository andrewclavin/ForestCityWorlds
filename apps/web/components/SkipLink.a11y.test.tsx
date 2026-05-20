import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { SkipLink } from "./SkipLink";

describe("SkipLink", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<SkipLink />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
