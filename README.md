# Business Management System

Local demo application for a single system administrator to manage customers, products, orders, invoices, and firm profile details.

## Stack
- Backend: Python, FastAPI, SQLAlchemy, SQLite
- Frontend: React, Vite
- API docs: http://localhost:8000/docs

## Quick start

### Backend
From the `backend` folder:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload
```

API: http://localhost:8000

### Frontend
From the `frontend` folder:

```powershell
npm install
npm run dev
```

UI: http://localhost:5173

## Demo login
- Email: `admin@bms.local`
- Password: `admin123`

## Constraints
- Single-admin demo only; no multi-user login or role management.
- Local development only; no production deployment setup, scaling, or cloud hosting.
- Uses SQLite for persistence; not intended for high-volume or production data workloads.
- Authentication is basic JWT-based demo auth, not enterprise-grade security hardening.
- Business rules are simplified for demo use, including stock deduction and invoice creation on order placement.
- The app is designed for a demo environment and not for real financial or compliance workflows.
