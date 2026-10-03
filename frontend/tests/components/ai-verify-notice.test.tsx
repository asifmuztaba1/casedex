import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AiVerifyNotice from "@/components/ai-verify-notice";
import { createWrapper } from "../utils";

function renderNotice(feature: string) {
  const { Wrapper } = createWrapper();
  return render(<AiVerifyNotice feature={feature} />, { wrapper: Wrapper });
}

describe("AiVerifyNotice", () => {
  it("marks every AI result as a draft, not legal advice", () => {
    renderNotice("hearing_summary");

    expect(screen.getByRole("note")).toHaveTextContent("AI draft, not legal advice.");
    expect(screen.queryByText(/case citations/)).not.toBeInTheDocument();
  });

  it.each([
    ["case_law_suggestion", /invent or misquote case citations/],
    ["legal_section_lookup", /current official text of the Act/],
    ["next_steps", /deadline and limitation period/],
    ["petition_draft", /nothing here is ready to file/],
  ])("adds what to check for %s", (feature, warning) => {
    renderNotice(feature);

    expect(screen.getByRole("note")).toHaveTextContent(warning);
  });
});
