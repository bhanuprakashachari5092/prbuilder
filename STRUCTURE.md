# PR Builder & KaizenQ Identity — Project Architecture & Structure

This repository is organized into distinct **Frontend** and **Backend** directories, establishing clean separation of concerns, strict type contracts, and straightforward deployment.

```
portofolio & resume builder/
├── backend/                        # BACKEND SERVICE & DATABASE LAYER
│   ├── migrations/                 # PostgreSQL migrations (01 through 17)
│   ├── functions/                  # Supabase Edge Functions (youpi-webhook)
│   ├── types/                      # Database type contracts & RPC signatures
│   ├── scripts/                    # Backend verification & validation scripts
│   └── README.md                   # Comprehensive backend documentation
│
├── kaizenq-identity/               # FRONTEND WEB APPLICATION (React 19 + Vite)
│   ├── src/
│   │   ├── app/                    # Routing, contexts, providers (App.tsx, routes.tsx)
│   │   ├── components/             # Reusable UI widgets, layout, brand elements
│   │   ├── hooks/                  # React custom hooks (usePricingCatalog, useEntitlements)
│   │   ├── lib/                    # Supabase client singleton, domain utils
│   │   ├── pages/                  # Page views:
│   │   │   ├── Admin/              # Platform administration console
│   │   │   ├── Auth/               # 3D animated auth card, iframe showcase & password visibility
│   │   │   ├── Builder/            # Quick start builder hub
│   │   │   ├── Dashboard/          # Student workspace dashboard & custom domains
│   │   │   ├── Portfolio/          # Portfolio builder studio & live preview
│   │   │   ├── Resume/             # ATS vector resume builder & PDF export
│   │   │   └── Settings/           # Student profile & billing settings
│   │   ├── services/               # Frontend-to-Backend RPC & REST service layer
│   │   └── types/                  # Application TypeScript contracts
│   ├── public/                     # Static production assets
│   ├── scripts/                    # Automated platform verification test suites
│   └── package.json                # Frontend dependencies & scripts
│
├── package.json                    # Workspace orchestrator (Frontend & Backend scripts)
└── README.md                       # Project overview & quick start
```

---

## Command Reference

| Action | Command | Scope |
| :--- | :--- | :--- |
| **Run Frontend (Dev)** | `npm run frontend:dev` | Starts Vite local dev server with HMR |
| **Build Frontend** | `npm run frontend:build` | Runs `tsc -b` type-check and Vite production build |
| **Preview Frontend** | `npm run frontend:preview` | Previews the compiled production bundle |
| **Verify Backend** | `npm run backend:verify` | Checks all 17 migrations, edge functions, and types |
| **Run All Test Suites** | `npm run test` | Executes 165 automated verification tests across all domains |
| **Deploy Build** | `npm run build` | Monorepo CI/CD production build target (Vercel & Render) |
