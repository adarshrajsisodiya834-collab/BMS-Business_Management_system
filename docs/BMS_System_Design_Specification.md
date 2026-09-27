# System Design Specification (SDS)
## Business Management System (BMS)

---

## 1. Overview

**Purpose:** A Business Management System (BMS) to manage core business operations — e.g. inventory, sales, customers, invoicing, reports — through a secure, dashboard-style web application.

**Scope for this build:**
- **Single user only** — one "System Administrator" account. No multi-user, no roles/permissions system.
- **Demo purpose only** — running locally for demonstration. No production deployment, no scaling concerns, no CI/CD.
- Auth is still implemented (login/logout, protected routes) — it's part of the demo, just not multi-role.

**Goals:**
- Centralize business data in one system
- Show a working, secure, full-stack demo (login-protected dashboard)
- Keep the build simple and fast to complete — nothing here is over-engineered for scale it won't need

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python + FastAPI |
| ORM | SQLAlchemy |
| Database | SQLite (fine as-is for a demo — no need to plan a PostgreSQL move) |
| Auth | JWT (access + refresh tokens) — single admin account |
| Frontend | React + CSS |
| UI Style | Dashboard (sidebar + topbar + content panels) |
| Versioning | Git + GitHub |
| Config | `.env` files |
| Migrations | Alembic |
| Docs | OpenAPI/Swagger (auto via FastAPI) |

---

## 3. High-Level Architecture

```
┌─────────────┐        HTTPS/REST        ┌──────────────┐
│   React     │ ───────────────────────▶ │   FastAPI    │
│  Frontend   │ ◀─────────────────────── │   Backend    │
└─────────────┘        JSON + JWT        └──────┬───────┘
                                                  │
                                          SQLAlchemy ORM
                                                  │
                                          ┌───────▼───────┐
                                          │  SQLite / PG  │
                                          └───────────────┘
```

- Frontend and backend are **decoupled** — communicate only via REST API (JSON).
- Backend is **stateless** (if using JWT) so it can scale horizontally later.
- Alembic manages schema changes so switching SQLite → PostgreSQL doesn't break the DB structure.

---

## 4. Project Structure

```
bms/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI entrypoint
│   │   ├── core/
│   │   │   ├── config.py          # reads .env, settings
│   │   │   └── security.py        # JWT, password hashing
│   │   ├── db/
│   │   │   ├── base.py            # SQLAlchemy Base
│   │   │   ├── session.py         # DB session/engine
│   │   │   └── init_db.py
│   │   ├── models/                # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   └── ...
│   │   ├── schemas/                # Pydantic request/response models
│   │   │   ├── user.py
│   │   │   └── ...
│   │   ├── api/
│   │   │   ├── deps.py            # shared dependencies (auth, db session)
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── products.py
│   │   │       └── ...
│   │   ├── crud/                  # DB operations, separated from routes
│   │   │   ├── user.py
│   │   │   └── ...
│   │   └── services/               # business logic
│   ├── alembic/                    # migrations
│   ├── tests/
│   ├── .env
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/
│   ├── src/
│   │   ├── api/                   # axios/fetch API calls
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/                # dashboard shell, sidebar, topbar
│   │   ├── context/                 # auth context, global state
│   │   ├── routes/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── .env
│   └── package.json
│
├── docs/
│   └── api-reference.md
├── .gitignore
└── README.md
```

**Why this layout:** separating `models` (DB tables), `schemas` (API-facing shapes), and `crud` (DB logic) keeps FastAPI apps clean — routes stay thin, and logic is testable in isolation.

---

## 5. Core Modules (typical BMS scope)

| Module | Responsibility |
|---|---|
| Auth | Login/logout for the single admin account, JWT issue/refresh |
| Customers | Customer records, contact info |
| Inventory/Products | Stock items, categories, quantity tracking |
| Sales/Orders | Order creation, line items, status |
| Invoicing | Generate/send invoices, payment status |
| Reports | Dashboard metrics (sales, stock levels, revenue) |

No "Users" module, no roles/permissions — there's only one account, so that whole layer is dropped. Adjust the domain modules (Customers/Orders/etc.) to whatever your actual demo needs to show.

---

## 6. Database Design (example core tables)

- **admin**: id, email, hashed_password, created_at — just one row, seeded once. No `role` column needed since there's only one account type.
- **customers**: id, name, email, phone, address
- **products**: id, name, sku, price, quantity_in_stock, category_id
- **categories**: id, name
- **orders**: id, customer_id, status, total_amount, created_at
- **order_items**: id, order_id, product_id, quantity, unit_price
- **invoices**: id, order_id, invoice_number, status, issued_at

Relationships: `orders → order_items → products`, `orders → customers`, `invoices → orders`.

Use SQLAlchemy relationships (`relationship()`, `ForeignKey`) to keep integrity. Alembic is still worth using (good habit, and makes resetting/reseeding your demo data easy) — just don't worry about it as a PostgreSQL-migration safety net, since that's out of scope here.

---

## 7. Authentication Design

**JWT-based**, scoped down for a single admin account — still real auth, just no role system to manage.

Flow:
1. `POST /auth/login` → verify credentials against the one seeded admin record → issue **access token** (short-lived, ~15–30 min) + **refresh token** (long-lived, ~7 days).
2. Access token sent as `Authorization: Bearer <token>` on each request.
3. FastAPI dependency (`get_current_user`) decodes token and confirms it matches the admin record — no role check needed, since if you're authenticated, you're the admin.
4. Refresh endpoint issues new access token when expired.

Passwords: hash with **bcrypt** (via `passlib`), never store plaintext — even for a demo, this is worth doing properly since it's a core part of what you're demonstrating.

**No register endpoint needed.** Seed the single admin account directly (e.g. a small `init_db.py` script or Alembic seed migration) rather than building sign-up flow you'll never use.

---

## 8. API Design Conventions

- REST-style, versioned: `/api/v1/...`
- Resource-based routes: `/users`, `/products`, `/orders`
- Standard verbs: `GET`, `POST`, `PUT/PATCH`, `DELETE`
- Consistent response shape (success + error format)
- FastAPI auto-generates docs at `/docs` (Swagger) and `/redoc` — this satisfies your "API documentation" requirement with almost no extra work, just write good docstrings and Pydantic schemas.

---

## 9. Environment Configuration (`.env`)

Backend `.env` (example keys, not values):
```
DATABASE_URL=sqlite:///./bms.db
SECRET_KEY=
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=development
```

Frontend `.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Never commit `.env` — only commit `.env.example`.

---

## 10. Deployment Scope

**Out of scope.** This is a local-only demo — no PostgreSQL migration, no Docker, no hosting, no CI/CD. SQLite running locally is the end state, not a stepping stone. If that ever changes, the SQLAlchemy/Alembic setup already makes a future PostgreSQL move straightforward — but don't build for it now.

---

## 11. Frontend Structure (Dashboard)

- **Layout:** Sidebar (navigation) + Topbar (user info, logout) + main content area.
- **State:** React Context (or Zustand/Redux later if it grows) for auth state and user session.
- **API calls:** centralized in `src/api/` using `axios` with an interceptor that attaches the JWT and handles 401s (auto-redirect to login).
- **Routing:** `react-router-dom`, with protected routes wrapping pages that require auth.
- **Pages (typical):** Login, Dashboard/Overview, Products, Orders, Customers, Invoices, Settings. (No Users/roles page — nothing to manage there.)

---

## 12. Development Workflow

- **Git branching:** `main` (stable) + feature branches (`feature/auth`, `feature/inventory`) is plenty for a solo demo project — no need for a `dev` branch or CI pipeline.
- Small, focused commits so you can track progress module by module.
- `.gitignore`: exclude `.env`, `__pycache__`, `node_modules`, `*.db`.

---

## 13. Suggested Build Order

1. Backend skeleton (FastAPI app, DB connection, `.env`, project structure)
2. Admin model + Auth (seed the one admin account, login/JWT — no register flow)
3. Core domain models (products, customers, orders) + Alembic migrations
4. CRUD API endpoints for each module
5. React app skeleton + auth flow (login page, protected routes)
6. Dashboard shell (sidebar/topbar) + connect first module (e.g. Products) end-to-end
7. Build out remaining modules one at a time
8. Reports/dashboard metrics last (they depend on other modules having data)

This order lets you get one full vertical slice (login → one working module) done early, which is the fastest way to validate the whole stack is wired correctly before building everything else.
