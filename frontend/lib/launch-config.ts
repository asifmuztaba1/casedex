export const launchConfig = {
  privateBeta: true,
  bangladeshFirst: true,
  allowLemonCheckout: false,
  billingMode: "manual_mfs_only" as const,
  languages: ["en", "bn"] as const,
};

export function isManualMfsOnlyLaunch(): boolean {
  return launchConfig.billingMode === "manual_mfs_only";
}
