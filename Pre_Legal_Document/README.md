# ⚖️ Pre Legal Document Generator

> **Create. Customize. Review. Download.**\
> A modern SaaS platform for preparing professional pre-legal document
> drafts through reusable templates, guided forms, optional AI
> assistance, and secure document management.

![Project
Status](https://img.shields.io/badge/status-in%20development-4F46E5)
![License](https://img.shields.io/badge/license-MIT-22C55E)
![Docker](https://img.shields.io/badge/docker-ready-2496ED)
![SaaS](https://img.shields.io/badge/product-SaaS-06B6D4)
![Responsive](https://img.shields.io/badge/UI-responsive-F97316)

> **Legal notice:** This product supports document preparation; it does
> not provide legal representation or guarantee that a document is
> enforceable or suitable for a particular situation. Laws vary by
> jurisdiction and change over time. Users should verify their
> information and obtain qualified legal advice where appropriate. Do
> not describe templates as professionally reviewed unless that review
> has actually taken place.

------------------------------------------------------------------------

## Table of Contents

-   [Overview](#overview)
-   [Vision and product principles](#vision-and-product-principles)
-   [Features](#features)
-   [User workflow](#user-workflow)
-   [Recommended technology stack](#recommended-technology-stack)
-   [Architecture](#architecture)
-   [Suggested repository structure](#suggested-repository-structure)
-   [Database design](#database-design)
-   [Template format](#template-format)
-   [Bright UI design system](#bright-ui-design-system)
-   [Getting started](#getting-started)
-   [Environment configuration](#environment-configuration)
-   [Docker implementation](#docker-implementation)
-   [Deployment and CI/CD](#deployment-and-cicd)
-   [Security and privacy](#security-and-privacy)
-   [Testing and quality gates](#testing-and-quality-gates)
-   [Performance and scalability](#performance-and-scalability)
-   [Roadmap](#roadmap)
-   [Documentation](#documentation)
-   [Contributing](#contributing)
-   [License](#license)

------------------------------------------------------------------------

## Overview

**Pre Legal Document Generator** is a subscription-based Software as a
Service (SaaS) platform intended to make common preliminary paperwork
easier to prepare for individuals, startups, freelancers, businesses,
and eligible professionals.

Users can select a template, answer a guided questionnaire, customize
the generated draft, review missing fields and jurisdiction notices,
save versions, and export the result to commonly used formats. The
platform is designed around privacy, clear review steps, versioned
templates, and a bright, approachable interface.

This README defines a **recommended product specification and
implementation blueprint**. Features and commands described here should
be considered planned or illustrative until implemented and verified in
the repository.

### Goals

-   Make document drafting faster and more consistent.
-   Replace intimidating blank pages with guided, validated forms.
-   Provide secure document storage and ownership controls.
-   Support a sustainable subscription model without locking the core
    architecture to one provider.
-   Keep users in control of final wording, exports, and deletion.
-   Make the intended jurisdiction and review status of each template
    visible.

## Vision and product principles

-   **Guided, not intimidating:** use plain-language questions and
    helpful examples.
-   **Transparent:** identify the template version, jurisdiction, review
    date, missing fields, and drafting warnings.
-   **Private by default:** collect only necessary data and restrict
    document access.
-   **Human review matters:** do not imply that automated drafting
    replaces qualified legal advice.
-   **Accessible:** support keyboard navigation, readable contrast,
    responsive layouts, and reduced motion.
-   **Modular:** start with a maintainable modular monolith and extract
    services only when justified.
-   **Provider-flexible:** isolate email, AI, storage, and payment
    integrations behind adapters.

## Features

### 1. Smart document generation

-   Reusable, versioned templates with structured fields.
-   Guided multi-step forms with conditional fields and validation.
-   Automatic insertion of names, dates, addresses, amounts, and other
    variables.
-   Optional clauses and sections controlled by user answers.
-   Editable document preview and rich-text editing.
-   Draft saving, autosave status, and resume-later support.
-   Document duplication, version history, and revision restoration.
-   PDF and DOCX export, with print-friendly output.
-   Missing-field warnings and a review checklist before export.
-   Preserve the exact template version used to generate each document.

### 2. Template library

Example categories and documents:

  Category      Example templates
  ------------- --------------------------------------------------------
  Business      Service agreements, consulting agreements, NDAs
  Employment    Offer letters, employment agreements, warning letters
  Freelancing   Freelance contracts, project agreements, payment terms
  Personal      Authorization letters, declarations, consent letters
  Property      Rental agreements, notices, property-related letters
  Finance       Payment reminders, debt acknowledgment letters
  Disputes      Demand letters, breach notices, settlement proposals
  General       Formal correspondence and draft declarations

Library capabilities:

-   Search and filter by category, keyword, and jurisdiction.
-   Preview descriptions, intended use, required information, and
    limitations.
-   Free and premium template visibility.
-   Template lifecycle: draft, review, publish, archive, and rollback.
-   Version history and reviewer metadata.
-   Clear jurisdiction-dependent warnings.
-   User feedback/reporting for outdated or inaccurate templates.

Templates must only be described as legally vetted when qualified review
has actually occurred. Store review status, reviewer, date,
jurisdiction, and version metadata.

### 3. Optional AI-assisted drafting

AI is an optional enhancement; core template-based generation should
work without an AI provider configured.

Potential capabilities:

-   Prepare a first draft from structured user instructions.
-   Improve clarity, grammar, and professional tone.
-   Explain clauses in plain language.
-   Summarize long documents or compare revisions.
-   Suggest missing information and flag inconsistent names, dates, or
    amounts.
-   Recommend a template based on the user's stated goal.

Responsible AI requirements:

-   Clearly label AI-generated or AI-modified text.
-   Require user approval before applying suggestions.
-   Do not claim AI output guarantees legal validity.
-   Do not fabricate legal citations, facts, or statutory requirements.
-   Explain when a question needs jurisdiction-specific legal review.
-   Obtain appropriate consent before sending document content to an
    external provider.
-   Do not use customer documents to train models without explicit,
    informed permission.
-   Apply provider-specific retention, access, and privacy controls.

### 4. Authentication and account security

-   Email/password registration and login.
-   Email verification and password recovery.
-   Secure sessions, logout, and session expiration.
-   Optional Google or Microsoft OAuth.
-   Optional multi-factor authentication.
-   Rate limiting for authentication endpoints.
-   Profile, locale, and preferred-jurisdiction settings.
-   Account data export and deletion.
-   Server-enforced role-based access control.
-   Administrative account and template management.

Suggested roles:

  -----------------------------------------------------------------------
  Role                                Typical permissions
  ----------------------------------- -----------------------------------
  Guest                               Browse public templates and product
                                      information

  User                                Create and manage personal
                                      documents

  Professional                        Access eligible professional
                                      workflows

  Workspace member                    Access permitted workspace
                                      resources

  Workspace owner                     Manage workspace members and
                                      settings

  Administrator                       Manage templates, plans, platform
                                      settings, and users
  -----------------------------------------------------------------------

Role names and permissions should be finalized during implementation.
Never rely on hiding a UI element as an authorization control; enforce
permissions on the server.

### 5. Document workspace

-   Personal dashboard with recent activity and quick actions.
-   Draft, completed, archived, and deleted states.
-   Search by title, category, tag, or creation date.
-   Sorting, filtering, favorites, and pinned documents.
-   Autosave with visible save status.
-   Version history and restoration.
-   Secure PDF/DOCX downloads.
-   Optional revocable sharing links with expiration and access codes.
-   Optional third-party electronic-signature integration.
-   Clear document export and deletion controls.

Documents should be private by default. Sharing links must be
unpredictable, revocable, and protected by appropriate access controls.

### 6. SaaS plans and billing

Suggested plans (pricing and entitlements must be configured for the
target market):

  -----------------------------------------------------------------------
  Plan                                Possible features
  ----------------------------------- -----------------------------------
  Free                                Limited generations and basic
                                      templates

  Pro                                 Higher limits, premium templates,
                                      PDF/DOCX exports, version history

  Business                            Team workspace, shared templates,
                                      member roles, centralized billing

  Enterprise                          Custom limits, organization
                                      controls, advanced audit
                                      capabilities
  -----------------------------------------------------------------------

Billing capabilities:

-   Monthly and annual subscriptions.
-   Optional trials and promotion codes.
-   Hosted checkout through a supported payment provider.
-   Upgrade, downgrade, cancellation, and renewal workflows.
-   Invoice and payment history.
-   Server-side quotas and usage meters.
-   Webhook signature verification and idempotent event processing.
-   Grace periods and payment-failure handling.
-   Administrative plan and limit configuration.

Use a payment provider supported in the operating country and target
markets. Never store raw payment-card details in the application
database. Billing is an integration, not a feature that works without
provider setup.

### 7. Dashboards and administration

**User dashboard** - Documents created and updated. - Monthly usage and
remaining quota. - Recently used templates. - Subscription status. -
Quick action to start a new document.

**Admin dashboard** - User and workspace management. - Aggregated
document-generation metrics. - Template popularity and publication
status. - Subscription and revenue trends, where billing is
configured. - Failed jobs, application errors, and operational health. -
Template review and publishing workflow. - Plan and quota
configuration. - Feature flags and maintenance settings. - Security
events and audit logs.

Prefer aggregated analytics. Do not expose the contents of private user
documents to administrators unless there is a defined, authorized,
audited operational need.

### 8. Professional product experience

-   Bright, responsive landing page and dashboard.
-   Guided onboarding and sample demo.
-   Searchable help center, FAQs, and support form.
-   Clear loading, empty, error, and success states.
-   Inline validation and non-intrusive notifications.
-   Confirmation dialogs for destructive actions.
-   Accessible document-editor controls.
-   Optional dark mode, with light mode as the default.
-   Status/health endpoint and operational monitoring.
-   API documentation and consistent error responses.

------------------------------------------------------------------------

## User workflow

1.  Create an account or sign in.
2.  Browse templates and select the intended jurisdiction.
3.  Read the template description and limitations.
4.  Complete the guided questionnaire.
5.  The server validates the input, ownership, permissions, and usage
    limits.
6.  The template engine renders a draft from the selected template
    version.
7.  Optionally request AI suggestions and approve or reject them.
8.  Review, edit, and save the document.
9.  Export to PDF or DOCX.
10. Manage the document, restore an earlier version, share it securely
    if enabled, or delete it.

Do not silently rewrite existing saved documents when a template is
updated. Existing documents should retain a reference to the template
version from which they were created.

## Recommended technology stack

The following is a suggested implementation baseline. Equivalent
technologies are acceptable if the same security, maintainability, and
deployment requirements are met.

  ---------------------------------------------------------------------------
  Layer                   Recommended technology     Purpose
  ----------------------- -------------------------- ------------------------
  Frontend                Next.js, React, TypeScript Responsive SaaS UI

  Styling                 Tailwind CSS               Design tokens and
                                                     responsive layouts

  UI components           shadcn/ui or equivalent    Consistent interface
                          accessible components      

  Icons                   Lucide                     Interface iconography

  Forms                   React Hook Form + Zod      Guided forms and
                                                     validation

  Backend                 Next.js server routes or   Business logic and API
                          NestJS API                 

  Database                PostgreSQL                 Relational data

  ORM                     Prisma                     Typed queries and
                                                     migrations

  Authentication          Auth.js or a               Identity and sessions
                          well-configured identity   
                          provider                   

  Document editor         TipTap or equivalent       Rich-text editing

  PDF generation          Playwright-based HTML      Print-quality PDF
                          rendering or equivalent    

  DOCX generation         `docx` or compatible       Editable office
                          library                    documents

  Background jobs         Redis + BullMQ, if         Asynchronous exports and
                          required                   email

  File storage            Private S3-compatible      Optional generated files
                          object storage             

  Email                   Resend, Postmark, or SMTP  Verification and
                                                     notifications

  Payments                Stripe or a regionally     Subscriptions
                          supported alternative      

  AI integration          Provider-agnostic adapter  Optional drafting
                                                     assistance

  Testing                 Vitest, Testing Library,   Unit and end-to-end
                          Playwright                 tests

  Containers              Docker + Docker Compose    Repeatable
                                                     development/deployment

  CI/CD                   GitHub Actions             Automated quality gates

  Reverse proxy           Caddy or Nginx             TLS and routing, if
                                                     self-hosted

  Monitoring              Sentry and                 Errors and observability
                          OpenTelemetry-compatible   
                          tools                      
  ---------------------------------------------------------------------------

For an initial release, prefer a **modular monolith** over unnecessary
microservices. Keep UI, business logic, data access, and provider
integrations clearly separated. Add a separate worker when background
jobs justify it.

## Architecture

``` text
                          ┌────────────────────────┐
                          │ Browser / Responsive UI│
                          │     Next.js / React    │
                          └────────────┬───────────┘
                                       │ HTTPS
                          ┌────────────▼───────────┐
                          │ Reverse Proxy / TLS    │
                          └────────────┬───────────┘
                                       │
                          ┌────────────▼───────────┐
                          │ Application / API      │
                          │ Auth, Templates, Docs  │
                          │ Billing, Permissions  │
                          └──────┬──────┬──────┬───┘
                                 │      │      │
                   ┌─────────────┘      │      └─────────────┐
                   │                    │                    │
          ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
          │   PostgreSQL    │  │ Redis / Queue   │  │ Private Storage │
          │ Users, Docs,    │  │ Async Exports   │  │ Exports / Files │
          │ Templates, Plans│  │ Optional        │  │ Optional        │
          └─────────────────┘  └────────┬────────┘  └─────────────────┘
                                        │
                               ┌────────▼────────┐
                               │ Worker (optional)│
                               │ PDF / DOCX / AI │
                               └─────────────────┘

                 External adapters: Email, Billing, AI, E-signatures
```

## Suggested repository structure

This is illustrative; adapt it to the actual framework, package manager,
and deployment approach.

``` text
pre-legal-document-generator/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (marketing)/
│   │   │   ├── (auth)/
│   │   │   ├── dashboard/
│   │   │   ├── documents/
│   │   │   ├── templates/
│   │   │   ├── billing/
│   │   │   ├── settings/
│   │   │   └── admin/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── tests/
│   └── worker/
│       ├── jobs/
│       └── services/
├── packages/
│   ├── database/
│   │   ├── prisma/
│   │   └── migrations/
│   ├── document-engine/
│   ├── template-engine/
│   ├── ui/
│   ├── validation/
│   └── shared/
├── templates/
│   ├── business/
│   ├── employment/
│   ├── personal/
│   └── general/
├── docker/
│   ├── app/
│   └── proxy/
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── security.md
│   ├── template-authoring.md
│   ├── api.md
│   └── backup-restore.md
├── scripts/
├── .github/workflows/
├── .env.example
├── .dockerignore
├── .gitignore
├── compose.yaml
├── Dockerfile
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── LICENSE
```

Only retain workspace files and directories that are actually used by
the project.

## Database design

Use PostgreSQL as the primary relational database. Suggested core
models:

  -----------------------------------------------------------------------
  Model                               Purpose
  ----------------------------------- -----------------------------------
  `User`                              Identity, profile, and account
                                      status

  `Session`                           Active sessions, if database-backed

  `Organization`                      Team or business workspace

  `OrganizationMember`                Membership and organization role

  `Plan`                              Pricing plan and configurable
                                      limits

  `Subscription`                      Billing references and subscription
                                      status

  `Template`                          Template metadata and publication
                                      status

  `TemplateVersion`                   Immutable content, schema,
                                      jurisdiction, review metadata

  `Document`                          Owner/workspace, title, status,
                                      current template version

  `DocumentVersion`                   Content snapshots and revision
                                      history

  `DocumentShare`                     Revocable sharing permissions

  `GenerationJob`                     Background document-generation
                                      tasks

  `UsageRecord`                       Generation/export quota tracking

  `AuditLog`                          Security-sensitive and
                                      administrative events

  `WebhookEvent`                      Idempotent external webhook
                                      processing
  -----------------------------------------------------------------------

### Data integrity requirements

-   Use UUIDs or another suitable non-sequential public identifier.
-   Add foreign keys and indexes for ownership, dates, categories, and
    common lookups.
-   Use transactions for related document, usage, and billing changes.
-   Enforce tenant ownership in every relevant query.
-   Store money as integer minor units or a precise decimal type.
-   Store timestamps consistently in UTC.
-   Preserve the template version used by each existing document.
-   Apply migrations through a controlled deployment process.
-   Keep private document contents out of shared caches and unnecessary
    logs.

## Template format

Templates should separate content from rendering logic. Example schema
only:

``` json
{
  "id": "service-agreement",
  "version": 1,
  "title": "Service Agreement",
  "category": "business",
  "jurisdiction": {
    "country": "US",
    "region": null
  },
  "fields": [
    {
      "name": "client_name",
      "label": "Client name",
      "type": "text",
      "required": true
    },
    {
      "name": "service_provider",
      "label": "Service provider",
      "type": "text",
      "required": true
    },
    {
      "name": "effective_date",
      "label": "Effective date",
      "type": "date",
      "required": true
    }
  ],
  "sections": [
    {
      "id": "parties",
      "title": "Parties",
      "content": "This draft is between {{client_name}} and {{service_provider}}, effective {{effective_date}}."
    }
  ]
}
```

This schema is illustrative, not a complete or legally reviewed
agreement. A production template engine should support safe variable
substitution, field validation, conditional sections, localization,
rendering constraints, and immutable template versions. Do not evaluate
arbitrary template code supplied by users.

## Bright UI design system

The interface should feel like a modern productivity SaaS: bright,
clear, professional, and easy to navigate.

  Token                     Suggested value   Use
  ------------------------- ----------------- ----------------------------------
  Primary electric indigo   `#4F46E5`         Main actions and navigation
  Bright cyan               `#06B6D4`         Secondary accents
  Vibrant orange            `#F97316`         Highlights and selected emphasis
  Fresh green               `#22C55E`         Success states
  Soft white                `#F8FAFC`         App background
  Pure white                `#FFFFFF`         Cards and editor surfaces
  Deep navy                 `#172033`         Main text
  Muted slate               `#475569`         Supporting text
  Border slate              `#E2E8F0`         Dividers and card borders

### UI recommendations

-   Use a light theme by default, with optional dark mode.
-   Use generous spacing, rounded cards, subtle shadows, and restrained
    gradients.
-   Keep the document editor focused, with visible save status and a
    clear preview.
-   Use text and icons as well as color to communicate status.
-   Ensure keyboard navigation, visible focus, accessible form labels,
    and reduced-motion support.
-   Check contrast and accessibility against WCAG 2.2 AA targets where
    applicable.
-   Include skeleton loaders, helpful empty states, inline validation,
    and confirmation dialogs.

------------------------------------------------------------------------

## Getting started

### Prerequisites

-   Git
-   Node.js LTS compatible with the chosen framework
-   pnpm or the package manager used by the repository
-   Docker Engine and Docker Compose v2
-   PostgreSQL and Redis, or a Compose configuration that provides them

### 1. Clone the repository

Replace the URL with the actual repository location:

``` bash
git clone https://github.com/YOUR_USERNAME/pre-legal-document-generator.git
cd pre-legal-document-generator
```

### 2. Install dependencies

For a pnpm-based project:

``` bash
corepack enable
pnpm install
```

Use the repository's lockfile and package manager consistently.

### 3. Configure environment variables

``` bash
cp .env.example .env
```

Fill in required local values. Never commit `.env`, production
credentials, or real customer documents.

### 4. Start infrastructure

If the Compose file defines `db` and `redis` services:

``` bash
docker compose up -d db redis
```

Service names must match the actual `compose.yaml`.

### 5. Run database commands

Example commands for a project that defines these scripts:

``` bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

The seed step is optional. These scripts must be implemented in
`package.json` before they can be used.

### 6. Start the application

``` bash
pnpm dev
```

Open `http://localhost:3000` if that is the configured development port.

### Typical package scripts

Adapt this example to the actual framework and repository:

``` json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

Do not assume a script exists until it has been added and tested.

## Environment configuration

Use `.env.example` to document the configuration expected by the
application. The following is a reference, not a universal set of
required variable names.

``` dotenv
NODE_ENV=development
APP_NAME="Pre Legal Document Generator"
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:change-me@localhost:5432/prelegal
POSTGRES_PASSWORD=change-me

# Optional background jobs
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Authentication
AUTH_SECRET=replace-with-a-cryptographically-random-secret
AUTH_URL=http://localhost:3000

# Email
EMAIL_FROM=documents@example.com
EMAIL_API_KEY=

# Optional private object storage
STORAGE_ENDPOINT=
STORAGE_BUCKET=prelegal-documents
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=

# Optional billing
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=

# Optional AI provider
AI_PROVIDER=
AI_API_KEY=

# Optional error reporting
SENTRY_DSN=
```

The actual application may require different names, formats, or
additional variables. Validate required configuration at startup and
fail safely when it is missing.

**Secret management rules** - Use local `.env` files only for
development. - Keep `.env` out of version control. - Use
cryptographically random secrets. - Use separate credentials for
development, staging, and production. - Store production secrets in the
hosting platform's secret manager. - Never expose server-only keys in
client-side code. - Use least-privilege database and storage
credentials.

## Docker implementation

Docker should provide reproducible development and deployment
environments. A production setup should use a multi-stage build, a
non-root runtime user, a minimal runtime image, a `.dockerignore`,
health checks, and persistent database storage.

### Example Dockerfile

This is a starter pattern only. Adapt the workspace paths, build output,
native dependencies, and runtime command to the actual app.

``` dockerfile
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy all workspace package manifests required by your monorepo here.
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# For production, copy only the runtime artifacts and required dependencies.
COPY --from=builder --chown=appuser:appgroup /app ./

USER appuser
EXPOSE 3000
CMD ["pnpm", "start"]
```

A production Next.js build may benefit from standalone output so the
runtime image can contain only the required artifacts. Verify that the
final image starts correctly and does not contain build secrets or
unnecessary development files.

### Example Compose file

This is a baseline for local development, not a complete production
deployment. It assumes the application reads the configured database and
Redis credentials and exposes `/api/health`.

``` yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test:
        - CMD
        - node
        - -e
        - "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
      interval: 30s
      timeout: 5s
      retries: 3

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: prelegal
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d prelegal"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: ["sh", "-c", "exec redis-server --appendonly yes --requirepass \"$${REDIS_PASSWORD}\""]
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD:?Set REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a \"$$REDIS_PASSWORD\" ping | grep -q PONG"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

Before using this example: - Implement `/api/health` or change the
health check to the real endpoint. - Configure the app's database URL
and Redis client to use the same credentials. - Add a worker service if
background jobs are implemented. - Do not expose database or Redis ports
publicly in production. - Use separate production secrets and managed
persistent services where appropriate. - Review the Redis health check
and credential handling for the exact image/version in use.

### Common Docker commands

``` bash
# Build images
docker compose build

# Start services
docker compose up -d

# View status
docker compose ps

# Follow application logs
docker compose logs -f app

# Stop services without deleting named volumes
docker compose down
```

**Data warning:** `docker compose down -v` removes named volumes and can
permanently delete local database data. Only use it when you
intentionally want to reset the environment and have confirmed you do
not need that data.

## Deployment and CI/CD

Select a platform based on regional availability, data residency, cost,
operational capacity, and workload needs.

  -----------------------------------------------------------------------
  Platform                            Potential fit
  ----------------------------------- -----------------------------------
  Vercel                              Managed Next.js frontend and
                                      supported server-side workloads

  Render                              Web services, workers, and managed
                                      infrastructure

  Railway                             Container-based apps and managed
                                      databases

  AWS                                 ECS or another container platform,
                                      RDS, S3, and related services

  DigitalOcean                        App Platform or Docker-based
                                      deployment

  VPS + Docker                        Self-managed hosting with
                                      operational responsibility
  -----------------------------------------------------------------------

### Production checklist

1.  Configure the production domain and HTTPS.
2.  Provision PostgreSQL and a least-privilege database user.
3.  Provision Redis only if background jobs or caching require it.
4.  Configure private object storage if exports are stored externally.
5.  Put secrets in the hosting provider's secret manager.
6.  Build and scan immutable container images.
7.  Run reviewed database migrations as a controlled release step.
8.  Configure authentication callback URLs, secure cookies, and trusted
    origins.
9.  Configure email verification and password recovery.
10. Configure billing webhook signatures and idempotent processing, if
    billing is enabled.
11. Configure health checks, structured logs, error reporting, and
    uptime alerts.
12. Enable automated backups and test restoration.
13. Verify tenant isolation, document permissions, and download access.
14. Document incident response, data retention, and rollback procedures.
15. Run smoke tests after deployment and confirm the application is
    healthy.

### Suggested CI pipeline

A GitHub Actions pipeline should:

-   Install dependencies using the lockfile.
-   Run linting, formatting checks, and TypeScript type checks.
-   Run unit and integration tests.
-   Check migrations against a clean database.
-   Build the production app and Docker image.
-   Run dependency and container vulnerability scans.
-   Publish a versioned image to a registry.
-   Deploy to staging and run smoke tests.
-   Promote to production with approval where appropriate.
-   Support rollback to the previous healthy release.

Never place production secrets in source control, build arguments, or
public logs.

## Security and privacy

Pre-legal documents may contain confidential personal, employment,
business, or financial information. Security must be treated as a core
product requirement.

### Authentication and authorization

-   Use a reputable authentication framework and modern password
    hashing.
-   Use secure, HTTP-only session cookies with appropriate SameSite
    settings.
-   Protect against CSRF where applicable.
-   Rate-limit login, recovery, generation, and sharing endpoints.
-   Validate input on the server and encode output appropriately.
-   Check ownership and permissions for every document operation.
-   Apply tenant isolation to all workspace queries.
-   Require stronger authentication for sensitive admin actions where
    appropriate.
-   Log important security events without recording document bodies,
    passwords, tokens, or API secrets.

### Document and file security

-   Store documents in private storage by default.
-   Encrypt network traffic and use appropriate at-rest encryption
    controls.
-   Use short-lived signed URLs for authorized downloads.
-   Validate file types, file sizes, and export parameters.
-   Restrict external resource loading when rendering HTML to PDF.
-   Protect rendering workers against SSRF, unsafe HTML, and template
    injection.
-   Apply quotas, timeouts, and resource limits to expensive operations.
-   Define retention and deletion rules for temporary exports.
-   Scan uploaded files if uploads are supported.

### Privacy and governance

-   Publish clear privacy and retention policies.
-   Collect only necessary personal information.
-   Support account data export and deletion.
-   Explain how deletion interacts with backups and legal retention
    requirements.
-   Obtain appropriate consent before sending content to an AI provider.
-   Review data-processing agreements and subprocessors where required.
-   Do not claim legal compliance or certification without an
    appropriate assessment.
-   Assess applicable privacy, consumer-protection,
    electronic-signature, and legal-services rules for each target
    market.

Authentication and encryption alone do not establish regulatory
compliance. Compliance depends on the complete product, organizational
practices, contracts, and applicable law.

### Legal-content governance

-   Show the intended jurisdiction and template review date.
-   Preserve the template version used by existing documents.
-   Record reviewer status and template publication history.
-   Never fabricate facts, legal citations, or statutory references.
-   Clearly mark assumptions, missing information, and AI-generated
    suggestions.
-   Provide a way to report outdated or inaccurate templates.
-   Require qualified professional review before claiming a template has
    been legally vetted.

## Testing and quality gates

### Unit tests

-   Template variable substitution and escaping.
-   Conditional section rendering.
-   Input validation.
-   Usage quota calculations.
-   Authorization helpers.
-   Document versioning and restoration.

### Integration tests

-   Authentication and session handling.
-   Database transactions and migrations.
-   Document persistence and retrieval.
-   PDF and DOCX generation.
-   Payment webhook idempotency.
-   Email workflows.
-   Tenant isolation and storage access.

### End-to-end tests

-   Registration, verification, login, and password recovery.
-   Template selection and guided document creation.
-   Editing, autosave, and version restoration.
-   PDF/DOCX downloads.
-   Subscription changes and cancellation, if enabled.
-   Admin template review and publication.
-   Attempts to access another user's documents.
-   Account export and deletion.

### Release quality gates

-   Linting and type checks pass.
-   Required tests pass.
-   Migrations work against a clean database.
-   No unresolved critical security findings without an approved
    mitigation.
-   Backup restoration has been tested.
-   Key accessibility checks pass.
-   Health checks succeed after deployment.

## Performance and scalability

-   Index document ownership, creation dates, template categories, and
    subscription lookups.
-   Paginate document and template lists.
-   Cache public template metadata where appropriate.
-   Keep private document contents out of shared caches.
-   Process large exports asynchronously when justified.
-   Add queue limits, retry policies, dead-letter handling, and
    idempotency.
-   Apply request timeouts and resource limits.
-   Use connection pooling where appropriate.
-   Monitor slow queries, export latency, failed jobs, and queue depth.
-   Add workers or read replicas only when measured demand justifies the
    complexity.

## Roadmap

### Phase 1 --- Foundation

-   [ ] Set up repository and development tooling.
-   [ ] Build responsive landing page and dashboard.
-   [ ] Configure PostgreSQL, ORM, and migrations.
-   [ ] Implement authentication, recovery, and server-side
    authorization.
-   [ ] Create the initial template categories.
-   [ ] Add Docker development environment and health checks.

### Phase 2 --- Document engine

-   [ ] Build versioned template schemas and safe rendering.
-   [ ] Implement guided forms and validation.
-   [ ] Add preview and rich-text editing.
-   [ ] Implement save, autosave, and document duplication.
-   [ ] Add version history and restoration.
-   [ ] Generate PDF and DOCX exports.
-   [ ] Add private downloads and deletion controls.

### Phase 3 --- SaaS foundation

-   [ ] Add configurable free and paid plans.
-   [ ] Implement usage tracking and server-side quota enforcement.
-   [ ] Integrate hosted checkout and billing webhooks.
-   [ ] Add premium template access.
-   [ ] Implement account data export and deletion.
-   [ ] Build the template administration workflow.

### Phase 4 --- Advanced capabilities

-   [ ] Add optional AI-assisted drafting with user approval.
-   [ ] Add organization workspaces and role-based collaboration.
-   [ ] Add revocable, expiring document sharing.
-   [ ] Add advanced search and filtering.
-   [ ] Integrate e-signatures where appropriate.
-   [ ] Add localization and jurisdiction-specific metadata.
-   [ ] Add audit reporting and advanced administration.

### Phase 5 --- Production readiness

-   [ ] Harden application and container security.
-   [ ] Configure CI/CD, staging, and production.
-   [ ] Configure monitoring, alerting, and incident response.
-   [ ] Implement and test backups and restoration.
-   [ ] Conduct security and privacy reviews.
-   [ ] Validate tenant isolation and document access controls.
-   [ ] Complete operational runbooks and product documentation.

## Documentation

As the project grows, maintain:

-   `docs/architecture.md` --- architecture and design decisions.
-   `docs/deployment.md` --- local, staging, and production deployment.
-   `docs/security.md` --- security controls, threat model, and incident
    response.
-   `docs/template-authoring.md` --- schema, fields, conditional
    sections, and review process.
-   `docs/api.md` --- endpoints, authentication, and error formats.
-   `docs/backup-restore.md` --- database and file backup procedures.
-   `CONTRIBUTING.md` --- contribution and development workflow.
-   `CHANGELOG.md` --- release history.

## Contributing

Contributions, bug reports, and feature suggestions are welcome.

1.  Open an issue describing the problem or proposed improvement.
2.  Create a focused feature branch.
3.  Implement the change and add appropriate tests.
4.  Run linting, type checks, and tests.
5.  Submit a pull request with a clear description; include screenshots
    for significant UI changes.

Example commands for a pnpm repository:

``` bash
git checkout -b feature/your-feature
pnpm install
pnpm lint
pnpm test
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

Adapt commands to scripts that actually exist. Do not include real legal
documents, personal information, API credentials, or confidential data
in issues, commits, or test fixtures. Template contributions should
identify the jurisdiction and accurately state the review status.

## License

The project is intended to use the MIT License. Add a `LICENSE` file
containing the complete MIT License text before distributing the project
under that license. Confirm the license fits your intended distribution
model. Legal templates, third-party libraries, fonts, and other assets
may have separate licensing requirements.

## Disclaimer

Pre Legal Document Generator is a document-preparation tool and does not
provide legal representation or establish an attorney-client
relationship. Templates, generated drafts, and AI-assisted suggestions
are for informational and drafting assistance only. They may be
incomplete, inaccurate, outdated, or unsuitable for a particular
jurisdiction.

Users are responsible for verifying supplied information and obtaining
qualified legal advice where appropriate. Do not represent a document as
guaranteed enforceable, legally compliant, or suitable for every
situation.

------------------------------------------------------------------------

**Pre Legal Document Generator --- professional document preparation,
built for the modern web.**
