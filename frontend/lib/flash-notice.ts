/**
 * A message that survives the full page reload after sign-in: set before
 * navigating, shown once by <FlashNotice /> on the next page.
 */
const KEY = "casedex_flash_notice";

export function setFlashNotice(i18nKey: string): void {
  try {
    sessionStorage.setItem(KEY, i18nKey);
  } catch {
    // sessionStorage unavailable (private mode); the email still informs them.
  }
}

export function takeFlashNotice(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return value;
  } catch {
    return null;
  }
}
