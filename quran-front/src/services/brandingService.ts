/**
 * Fetches the deployment's white-label branding from the backend
 * (GET /api/branding, public) and applies it over the build-time defaults.
 * Fails soft: any error keeps the current branding.
 */
import { API_BASE_URL } from '../config';
import { applyBranding, type Branding } from '../branding';

export async function loadRuntimeBranding(timeoutMs = 2500): Promise<void> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(`${API_BASE_URL}/branding`, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) return;
        const data = (await res.json()) as Partial<Branding>;
        applyBranding(data);
    } catch {
        // Offline, slow API or old backend: keep env/default branding.
    }
}
