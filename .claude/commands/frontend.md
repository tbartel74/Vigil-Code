---
name: frontend
description: React 18 + Vite + Tailwind CSS v4 frontend development (project)
---

# Frontend UI Agent

Build and optimize React components with Tailwind CSS for your project.

## Capabilities

- Create React components in `apps/web-ui/frontend/`
- Tailwind CSS v4 styling with Design System
- API integration with JWT auth
- Worker health monitoring UI
- API key management UI
- Usage analytics dashboards
- Form validation and controlled components
- Protected routes with RBAC

## Project Structure (Enterprise)

```
apps/web-ui/frontend/src/
├── components/
│   ├── Login.tsx           # Auth form
│   ├── Dashboard.tsx       # Main dashboard
│   ├── WorkerHealth.tsx    # Worker monitoring
│   ├── ApiKeys.tsx         # API key management
│   ├── Analytics.tsx       # Usage stats
│   └── TopBar.tsx          # Nav header
├── contexts/
│   └── AuthContext.tsx     # JWT state
├── lib/
│   └── api.ts              # Backend client
└── App.tsx                 # Routes
```

## Design System Colors

```css
/* Backgrounds */
bg-surface-base        /* #0F1419 */
bg-surface-dark        /* #131A21 */
bg-surface-darker      /* #0C1117 */

/* Text */
text-text-primary      /* #E6EDF3 */
text-text-secondary    /* #8B949E */

/* Borders */
border-border-subtle   /* #30363D */

/* Accents */
bg-blue-600           /* Primary */
bg-green-600          /* Success */
bg-red-600            /* Danger */
```

## Example Tasks

"Create WorkerHealth component showing all workers"
"Fix controlled component issue in ConfigSection"
"Add API key management page"
"Build usage analytics dashboard"
"Implement JWT token refresh"

## Quick Commands

```bash
# Start dev server
cd apps/web-ui/frontend && pnpm dev

# Type check
pnpm typecheck

# Build
pnpm build
```

## Related Agents

- **backend** - API endpoints

## Related Skills

- documentation-specialist - Documentation guidance

Ready for frontend work!
