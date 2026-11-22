/**
 * Central white-label branding.
 *
 * Every user-facing brand string/logo/color comes from here. Priority:
 *   1. Runtime /api/branding (per-deployment server config) — applied at startup
 *   2. Build-time env vars (VITE_BRAND_*) — per-deployment build override
 *   3. Defaults below — the current Bdaey identity
 *
 * Build-time env vars:
 *   VITE_BRAND_NAME_AR / VITE_BRAND_NAME_EN / VITE_BRAND_LOGO_URL /
 *   VITE_BRAND_FAVICON_URL / VITE_BRAND_SITE_URL / VITE_BRAND_TWITTER /
 *   VITE_BRAND_PRIMARY / VITE_BRAND_PRIMARY_LIGHT / VITE_BRAND_PRIMARY_LIGHTER /
 *   VITE_BRAND_ACCENT / VITE_BRAND_ACCENT_LIGHT / VITE_BRAND_ACCENT_LIGHTER
 */
export interface BrandColors {
    primary: string;
    primaryLight: string;
    primaryLighter: string;
    accent: string;
    accentLight: string;
    accentLighter: string;
}

export interface Branding {
    nameAr: string;
    nameEn: string;
    logoUrl: string;
    faviconUrl: string;
    siteUrl: string;
    twitterHandle: string;
    colors: BrandColors;
}

export const branding: Branding = {
    nameAr: import.meta.env.VITE_BRAND_NAME_AR || 'Bdaey',
    nameEn: import.meta.env.VITE_BRAND_NAME_EN || 'Bdaey',
    logoUrl: import.meta.env.VITE_BRAND_LOGO_URL || '/logo.png',
    faviconUrl: import.meta.env.VITE_BRAND_FAVICON_URL || '/favicon.png',
    siteUrl: import.meta.env.VITE_BRAND_SITE_URL || 'https://bdaey.com',
    twitterHandle: import.meta.env.VITE_BRAND_TWITTER || '@bdaey',
    colors: {
        primary: import.meta.env.VITE_BRAND_PRIMARY || '#1B5E20',
        primaryLight: import.meta.env.VITE_BRAND_PRIMARY_LIGHT || '#2E7D32',
        primaryLighter: import.meta.env.VITE_BRAND_PRIMARY_LIGHTER || '#4CAF50',
        accent: import.meta.env.VITE_BRAND_ACCENT || '#D4AF37',
        accentLight: import.meta.env.VITE_BRAND_ACCENT_LIGHT || '#C49F30',
        accentLighter: import.meta.env.VITE_BRAND_ACCENT_LIGHTER || '#FFE57F',
    },
};

/** Display name used in titles and schema. Live binding: updated by applyBranding. */
export let brandDisplayName = branding.nameEn;

/** Push the current brand colors into the CSS custom properties the theme uses. */
export function applyBrandColors(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement.style;
    const c = branding.colors;
    root.setProperty('--primary-green', c.primary);
    root.setProperty('--primary-green-light', c.primaryLight);
    root.setProperty('--primary-green-lighter', c.primaryLighter);
    root.setProperty('--primary-gold', c.accent);
    root.setProperty('--primary-gold-light', c.accentLight);
    root.setProperty('--primary-gold-lighter', c.accentLighter);
}

function applyFavicon(): void {
    if (typeof document === 'undefined' || !branding.faviconUrl) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = branding.faviconUrl;
}

/** Merge server-provided branding over the current values and apply side effects. */
export function applyBranding(patch: Partial<Branding> & { colors?: Partial<BrandColors> }): void {
    if (patch.nameAr) branding.nameAr = patch.nameAr;
    if (patch.nameEn) branding.nameEn = patch.nameEn;
    if (patch.logoUrl) branding.logoUrl = patch.logoUrl;
    if (patch.faviconUrl) branding.faviconUrl = patch.faviconUrl;
    if (patch.siteUrl) branding.siteUrl = patch.siteUrl;
    if (patch.twitterHandle) branding.twitterHandle = patch.twitterHandle;
    if (patch.colors) Object.assign(branding.colors, patch.colors);
    brandDisplayName = branding.nameEn;
    applyBrandColors();
    applyFavicon();
}
