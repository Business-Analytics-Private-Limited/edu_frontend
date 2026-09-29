/**
 * Home page (placeholder until Phase 2 adds login and the module sidebar).
 *
 * It also shows, in the smallest possible way, how a page reads from the backend: a server
 * component calls lib/api.ts, and the response type comes from the API contract.
 */
import { getHealth } from '../lib/api';

// Render on every request, never at build time: the backend may not be running during a build.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let apiStatus: string;
  try {
    const health = await getHealth();
    apiStatus = health.data.status; // typed from the contract: 'ok'
  } catch {
    apiStatus = 'not reachable (start the backend with pnpm dev in its repository)';
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>EduPlatform</h1>
      <p>Institution web app. Login and the module sidebar arrive in Phase 2.</p>
      <p>
        Backend API: <strong>{apiStatus}</strong>
      </p>
    </main>
  );
}
