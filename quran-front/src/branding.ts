/**
 * Central white-label branding.
 *
 * Every user-facing brand string/logo should come from here so a managed
 * per-academy deployment only sets env vars at build time:
 *   VITE_BRAND_NAME_AR   e.g. "أكاديمية النور"
 *   VITE_BRAND_NAME_EN   e.g. "Al-Noor Academy"
 *   VITE_BRAND_LOGO_URL  e.g. "/tenants/alnoor/logo.png" or a full URL
 *   VITE_BRAND_SITE_URL  e.g. "https://alnoor.example.com"
 *   VITE_BRAND_TWITTER   e.g. "@alnoor" (optional)
 *
 * Defaults keep the current Bdaey identity, so existing deployments need
 * no changes.
 */
export const branding = {
    nameAr: import.meta.env.VITE_BRAND_NAME_AR || 'Bdaey',
    nameEn: import.meta.env.VITE_BRAND_NAME_EN || 'Bdaey',
    logoUrl: import.meta.env.VITE_BRAND_LOGO_URL || '/logo.png',
    siteUrl: import.meta.env.VITE_BRAND_SITE_URL || 'https://bdaey.com',
    twitterHandle: import.meta.env.VITE_BRAND_TWITTER || '@bdaey',
} as const;

/** Display name used in titles and schema (English branch). */
export const brandDisplayName = branding.nameEn;
