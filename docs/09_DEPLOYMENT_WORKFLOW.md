# 09 — Deployment Workflow

**Product:** GovindOS v3.0  
**Document Type:** Build Strategy, Environment Configuration, and Release Flow

---

## 1. Deployment Philosophy

GovindOS is a fully static application. There is no server-side rendering, no API backend, no database, and no runtime compute. Every artifact produced by the build is a static file — HTML, JavaScript chunks, CSS, JSON, fonts, and a PDF. Deployment is the act of publishing these files to a CDN-backed static host and configuring cache and routing rules correctly.

This simplicity is a feature: deployments are atomic, reversible, and carry no infrastructure risk. The only moving part is the build pipeline itself.

---

## 2. Hosting and Infrastructure

### 2.1 Static Host Selection

The application is deployed to a CDN-backed static hosting platform. The recommended platform is **Vercel** for the following reasons:

- Native Vite project support with zero-configuration build detection.
- Automatic per-branch preview deployments (critical for reviewing content updates and UI changes before merging).
- Edge CDN distribution with automatic asset hashing and cache headers.
- Built-in Lighthouse CI integration via third-party Vercel plugins.
- Custom HTTP header configuration via `vercel.json` (required for cache-control and security headers).

**Acceptable alternatives:** Netlify (equivalent feature set), Cloudflare Pages (superior CDN performance, slightly more configuration overhead).

**Not acceptable:** S3 + CloudFront without a deployment automation layer — the configuration overhead is unjustified for this project scale.

### 2.2 Domain and CDN

A custom domain is configured at the hosting provider level. HTTPS is enforced; HTTP redirects to HTTPS at the CDN edge. No additional infrastructure (load balancer, reverse proxy, origin server) exists — the CDN is the only layer between the user and the static files.

---

## 3. Environment Configuration

### 3.1 Environment Model

GovindOS has three environments:

| Environment | Trigger | Purpose |
|---|---|---|
| Development | Local `vite dev` | Active development with HMR |
| Preview | Pull request opened / pushed to | Review of changes before merge; stakeholder sign-off |
| Production | Merge to `main` branch | Live public deployment |

There are no staging or QA environments beyond Preview. Preview deployments are ephemeral — they are created automatically per pull request and destroyed when the PR is closed.

### 3.2 Environment Variables

GovindOS has minimal environment variable requirements given its fully static nature. The following variables are defined:

| Variable | Purpose | Required In |
|---|---|---|
| `VITE_APP_VERSION` | Injected into the boot sequence version string | All environments |
| `VITE_ANALYTICS_ID` | Analytics provider ID (if analytics is added in future) | Production only |

No secrets, API keys, or sensitive credentials exist in this application. All environment variables are build-time values injected by Vite's `import.meta.env` mechanism — they are embedded in the compiled JS bundle and must not contain sensitive data.

### 3.3 Development Environment Setup

A new developer environment is set up via:

```
1. Clone repository
2. Install Node.js (version specified in .nvmrc / engines field in package.json)
3. Run: npm install
4. Run: npm run dev
5. Application serves at localhost:5173
```

No database setup, no environment variable configuration, and no service dependencies are required for local development. Content is served from `/content` directory files via Vite's dev server.

---

## 4. Build Strategy

### 4.1 Build Command

The production build is executed via:

```
npm run build
```

This invokes `vite build` with the production Vite configuration. The output is written to `/dist`.

### 4.2 Build Output Structure

```
/dist
├── index.html                          // Entry HTML with preload tags injected
├── /assets
│   ├── core.[hash].js                  // Entry chunk
│   ├── neural-graph.[hash].js          // Neural Graph + D3 chunk
│   ├── terminal.[hash].js              // Terminal overlay chunk
│   ├── control-room.[hash].js
│   ├── memory-vault.[hash].js
│   ├── timeline-tunnel.[hash].js
│   ├── arena.[hash].js
│   ├── gateway.[hash].js
│   ├── quiz-modal.[hash].js
│   ├── boot.[hash].js
│   └── [hash].css                      // Single extracted CSS bundle
├── /content
│   ├── projects.json
│   ├── skills.json
│   ├── edges.json
│   ├── timeline.json
│   ├── arena.json
│   └── meta.json
├── /fonts
│   └── [font files]
└── resume.pdf
```

All JS and CSS assets have content-hashed filenames. `index.html` and content JSON files do not — they are revalidated on each visit.

### 4.3 Build Validation Steps

The build pipeline runs the following checks before producing the final `/dist` output:

```
1. TypeScript type check (tsc --noEmit)
   Fails build on any type error.

2. Vitest unit and integration tests
   Fails build on any test failure.

3. Bundle size check
   Measures each chunk's gzipped size against targets from Document 07.
   Logs a warning if any chunk exceeds its target.
   Fails build if any chunk exceeds target by more than 20%.

4. Content schema validation
   Runs the content validator tests against /content/*.json.
   Fails build on any schema violation.

5. Vite production build
   Produces /dist output.

6. Resume PDF presence check
   Asserts /dist/resume.pdf exists.
   Fails build if absent.
```

Steps 1–4 run before the Vite build is invoked. If any fail, the build aborts and the deployment does not proceed.

### 4.4 Build Performance

Expected clean build time on a standard CI runner: under 60 seconds. Vite's production build is fast; the dominant cost is TypeScript type checking across the full codebase.

---

## 5. CI/CD Pipeline

### 5.1 Pipeline Tool

GitHub Actions is the CI/CD platform. All pipeline configuration lives in `.github/workflows/`.

### 5.2 Pipeline Definitions

**On pull request (`pull_request.yml`):**

```
Trigger: Pull request opened or updated

Steps:
  1. Checkout repository
  2. Set up Node.js (version from .nvmrc)
  3. Install dependencies (npm ci)
  4. TypeScript type check
  5. Run unit and integration tests (Vitest)
  6. Run UI interaction tests (React Testing Library via Vitest)
  7. Build production bundle
  8. Deploy to Preview environment (Vercel preview URL)
  9. Post preview URL as PR comment

Blocking: Steps 1–7 block merge if they fail.
          Step 8 is informational (preview URL for review).
```

**On merge to main (`deploy.yml`):**

```
Trigger: Push to main branch

Steps:
  1. Checkout repository
  2. Set up Node.js
  3. Install dependencies (npm ci)
  4. TypeScript type check
  5. Run all tests (unit + integration + UI)
  6. Build production bundle
  7. Run Playwright E2E tests against built /dist (served locally)
  8. Run Lighthouse CI against built /dist
  9. Deploy to Production (Vercel production)
  10. Post deployment summary (commit hash, Lighthouse scores, chunk sizes)

Blocking: Steps 1–8 block production deployment if they fail.
          Step 10 is informational.
```

### 5.3 Dependency Caching

Node modules are cached in GitHub Actions using the `actions/cache` action keyed on `package-lock.json` hash. On cache hit, `npm ci` runs in under 5 seconds. On cache miss (dependency change), the full install runs (~30–60 seconds).

### 5.4 Secrets Management

The only CI secret required is the Vercel deployment token (`VERCEL_TOKEN`), stored as a GitHub Actions repository secret. No application secrets exist.

---

## 6. Cache-Control Configuration

Cache-control headers are configured via `vercel.json`. The rules align with the asset strategy defined in Document 07.

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/fonts/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/content/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=86400, stale-while-revalidate=3600" }
      ]
    },
    {
      "source": "/resume.pdf",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=86400" }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" }
      ]
    }
  ]
}
```

### 6.1 Cache Invalidation on Deployment

Because all JS and CSS asset filenames are content-hashed, a new deployment automatically invalidates all modified assets. Users visiting after a deployment always receive the latest code without manual cache purging. `index.html` is always revalidated (`no-cache`), so the new asset hashes are always fetched.

Content JSON files are cached for 24 hours with `stale-while-revalidate`. A content-only update (no JS changes) is served to users within 24 hours without a full deployment. For immediate content propagation, a Vercel cache purge can be triggered manually via the Vercel CLI.

---

## 7. Security Headers

The following security headers are applied to all responses via `vercel.json`:

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information on external links |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser features |
| `Content-Security-Policy` | Defined below | Controls resource loading origins |

### 7.1 Content Security Policy

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
font-src 'self';
img-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
```

`unsafe-inline` for `style-src` is required for Framer Motion's inline style injection. No external CDN scripts, no analytics scripts (initial version), no third-party embeds. All resources are self-hosted.

---

## 8. Routing Configuration

GovindOS is a single-page application with no server-side routing. All routes must serve `index.html`. Vercel handles this automatically for SPA projects when the output contains a single `index.html`.

If a custom redirect rule is needed for a future deep-link feature (e.g., `govindos.com/?zone=neural-graph`), it is handled via URL query parameter parsing in `main.tsx` — no server-side route configuration is required.

---

## 9. Content Update Workflow

Content updates (new projects, skill adjustments, metric changes) follow a lightweight workflow separate from code changes:

```
1. Author edits relevant JSON file(s) in /content
2. Content schema validation tests run locally (npm run test:content)
3. Changes committed and pushed to a content-update branch
4. Pull request opened:
   - CI runs schema validation and full test suite
   - Preview deployment generated for visual review
5. PR merged to main
6. Production deployment runs automatically
7. New content live within seconds of deployment completion
```

Content updates never require JavaScript code changes and do not affect JS chunk hashes — only the content JSON files are re-deployed. CDN cache for content files invalidates within 24 hours (or immediately via manual purge).

---

## 10. Rollback Procedure

Vercel maintains a full deployment history. Rolling back to a previous deployment is a single action in the Vercel dashboard or via CLI:

```
vercel rollback [deployment-url]
```

Rollback is instant — Vercel re-points the production domain to the previous deployment without a rebuild. Content JSON files and all assets from the previous deployment are restored simultaneously.

A rollback is appropriate when a production deployment introduces a visual regression, a broken interaction, or a content error that must be corrected before a fix is ready. The fix is then deployed normally via the PR → main flow.
