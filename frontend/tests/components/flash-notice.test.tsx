import { render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it } from "vitest";
import FlashNotice from "@/components/flash-notice";
import { Toaster } from "@/components/ui/toaster";
import { setFlashNotice } from "@/lib/flash-notice";
import { createWrapper } from "../utils";

describe("FlashNotice", () => {
  it("shows the notice left by the previous page once, even though it mounts before the Toaster", async () => {
    setFlashNotice("account_delete.cancelled_on_sign_in");
    const { Wrapper } = createWrapper();

    // Same order as the app: the page (child) mounts its effects before the root Toaster subscribes.
    render(
      <StrictMode>
        <FlashNotice />
        <Toaster />
      </StrictMode>,
      { wrapper: Wrapper }
    );

    expect(await screen.findByText("Welcome back. Your account will not be deleted.")).toBeInTheDocument();
    expect(sessionStorage.getItem("casedex_flash_notice")).toBeNull();
  });
});
