# KALRO Projects & Reporting Platform

## Overview
A project planning, performance tracking, and reporting platform for KALRO
(Kenya Agricultural and Livestock Research Organization). It tracks projects,
mappings, activities/sub-activities, outcomes & output indicators, technical
reports, and partners across counties.

## Stack
- **Frontend**: React 19 + TanStack Router/Start + Vite, Tailwind CSS v4,
  Radix UI, TanStack Query. Located in `frontend/`.
- **Backend**: Django 5.2 + Django REST Framework, `django-cors-headers`,
  `django-filter`, token auth (`rest_framework.authtoken`). Located in
  `backend/`, main app is `backend/projects`.
- Uses SQLite (Django default) locally — no external database configured.

## Running locally (Replit)
Two workflows run in parallel:
- `Start application`: `cd frontend && npm run dev` — Vite dev server on port 5000 (this is the webview/preview).
- `Django Backend`: `cd backend && python3 manage.py migrate --run-syncdb && python3 manage.py runserver 0.0.0.0:8000` — Django API on port 8000.

Dependencies:
- Frontend: `npm install` in `frontend/`.
- Backend: Python packages managed via the Python module's package manager
  (see `backend/requirements.txt` for the pinned versions: Django, DRF,
  django-cors-headers, django-filter, etc.).

## User preferences
None recorded yet.
