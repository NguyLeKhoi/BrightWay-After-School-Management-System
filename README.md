# BrightWay – After-School Management System

A comprehensive web platform for managing after-school learning centers, supporting 4 distinct user roles: parents, staff, branch managers, and system administrators.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Roles & Access Control](#roles--access-control)
- [Features by Role](#features-by-role)
- [Technical Architecture](#technical-architecture)
- [Deployment](#deployment)

---

## Overview

BrightWay is a full-featured after-school center management platform covering:

- Child enrollment into learning packages and schedules
- Branch, classroom, and slot management
- Staff and manager administration
- Parent and student management
- NFC card assignment per student
- Branch transfer requests
- Online payments and digital wallets
- Analytics dashboards and real-time notifications

The UI is fully rendered in **Vietnamese**.

---

## Tech Stack

| Category | Library / Tool | Version |
|---|---|---|
| Core Framework | React | ^18.3.1 |
| Build Tool | Vite + @vitejs/plugin-react | ^7.1.2 |
| Routing | react-router-dom | ^7.9.1 |
| UI Library | MUI (@mui/material) + Emotion | ^5.15.0 |
| HTTP Client | Axios | ^1.12.2 |
| Form Handling | react-hook-form + @hookform/resolvers | ^7.64.0 |
| Validation | Yup | ^1.7.1 |
| Notifications | react-toastify | ^11.0.5 |
| Calendar | FullCalendar (daygrid/timegrid/interaction/react) | ^6.1.19 |
| Charts | Recharts | ^3.5.1 |
| Animation | Framer Motion, GSAP | ^12.x, ^3.13 |
| 3D / WebGL | Three.js, @react-three/fiber, OGL | ^0.181, ^8.15 |
| JWT | jwt-decode | ^4.0.0 |
| Icons | @fortawesome, @mui/icons-material | ^7.x |
| Image Compression | browser-image-compression | ^2.0.2 |
| Testing | Vitest + @testing-library/react | ^1.0.4 |
| Linting | ESLint 9 (react-hooks + react-refresh) | ^9.x |
| Deployment | Vercel | — |

**Path aliases (`vite.config.js`):**
- `@` → `./src`
- `@components` → `./src/components`

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd FE

# Install dependencies
npm install
```

### npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest |
| `npm run test:ui` | Run Vitest with the UI panel |
| `npm run test:coverage` | Generate coverage report |

---

## Environment Variables

Create a `.env` file at the project root:

```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_JWT_CLAIM_ROLE=<jwt-role-claim-key>
```

---

## Project Structure

```
src/
├── App.jsx                   # Root component: provider tree + ToastContainer
├── main.jsx                  # Entry point (StrictMode)
│
├── router/
│   ├── Router.jsx            # All routes defined via createBrowserRouter
│   └── ProtectedRoute.jsx    # Role-based route guard
│
├── contexts/
│   ├── AuthContext.jsx       # JWT auth state (login / logout / token refresh)
│   └── AppContext.jsx        # UI state (sidebar, theme, session dialog, toasts)
│
├── config/
│   └── axios.config.js       # Axios instance + interceptors (token injection & silent refresh)
│
├── services/                 # 26 domain-scoped API service files
│   ├── auth.service.js
│   ├── branch.service.js
│   ├── branchSlot.service.js
│   ├── branchTransfer.service.js
│   ├── student.service.js
│   ├── package.service.js
│   ├── order.service.js
│   ├── wallet.service.js
│   ├── nfcCard.service.js
│   ├── notification.service.js
│   └── ...
│
├── hooks/                    # 18 custom hooks
│   ├── useBaseCRUD.js        # Central hook for management page CRUD logic
│   ├── useLoading.js
│   ├── usePackageDependencies.js
│   ├── useStudentDependencies.js
│   └── ...
│
├── pages/                    # Pages organised by role
│   ├── admin/
│   ├── manager/
│   ├── staff/
│   ├── user/
│   ├── auth/
│   ├── main/                 # Public landing pages
│   └── common/
│
├── components/
│   ├── Layout/               # Per-role layouts (sidebar + header + outlet)
│   ├── Headers/              # MainHeader, ManagementHeader, UserHeader
│   ├── Common/               # DataTable, StepperForm, ConfirmDialog, Loading...
│   ├── Management/           # PageHeader, SearchSection, FormDialog, AssignDialogs...
│   ├── AccountForms/         # FamilyAccountForm, ParentForm, StaffAccountForm
│   ├── Auth/                 # AuthCard
│   └── Animation/            # WebGL background animation (Three.js / OGL)
│
├── definitions/              # Per-entity table schema (tableColumns.jsx) & form schema (formFields.jsx)
│   ├── branch/
│   ├── package/
│   ├── student/
│   └── ...
│
├── styles/
│   ├── theme.css             # CSS custom properties: brand colors, spacing, shadows
│   └── management-pages.css
│
├── utils/
│   ├── dateHelper.js
│   ├── errorHandler.js
│   ├── packageForm.utils.js
│   └── studentForm.utils.js
│
├── core/error/               # ErrorBoundary + GlobalErrorHandler
└── test/                     # setup.js, testHelpers.jsx
```

---

## Roles & Access Control

| Role | Route Prefix | Description |
|---|---|---|
| **Admin** | `/admin` | System-wide administration |
| **Manager** | `/manager` | Branch-level management |
| **Staff** | `/staff` | Branch staff operations |
| **User** | `/user` | Parent / end-user portal |

The role is decoded from the JWT claim. `ProtectedRoute` redirects unauthenticated users to `/login` and wrong-role users to their designated dashboard.

---

## Features by Role

### Public (`/`)
- Landing page: learning packages overview, facilities showcase
- Contact form
- FAQ

### Authentication
- Login (`/login`)
- Account activation / set password (`/set-password`)
- Payment success / cancel callback pages

### Admin (`/admin/*`)
- Overview dashboard
- **Branch Management** — CRUD, detail view, assign benefits / schools / student levels
- **Facility Management**
- **Staff & Manager Management**
- **User Management** (parents)
- **Benefit Management**
- **Student Level Management**
- **Package Management** — package templates (create/update/detail) + packages (multi-step, slot type assignment)
- **School Management**
- **Service Management**
- **Slot Type Management**
- **Timeframe Management**
- System settings

### Manager (`/manager/*`)
- Branch dashboard
- **Staff Management** within the branch
- **Room Management**
- **Branch Slot Management** — single create/update, bulk create (multi-step: date selection → room & staff assignment)
- **Package Management** scoped to the branch (multi-step: BasicInfo → GeneralInfo → Pricing → Benefits → SlotTypes)
- **Service Management** for the branch
- **Parent Management** — create accounts with OCR scanning of Vietnamese national ID (CCCD)
- **Student Management** — multi-step create/update (BasicInfo, Associations, AdditionalInfo)
- **NFC Card Management** — assign and manage NFC cards per student
- **Branch Transfer Requests** — review incoming transfer requests from parents
- Slot type management, notifications, profile, change password

### Staff (`/staff/*`)
- Dashboard
- **Activity Type Management**
- **Assignments** — view assigned slots, slot detail
- Profile, change password

### User / Parent (`/user/*`)
- Dashboard
- **Children Management** — list, create (3 steps: BasicInfo, Associations, Document), child profile
- **Schedule Management** — per-child schedule view, single slot registration (5 steps), bulk registration (date range → week selection → slot selection → confirmation)
- **Package Management** — browse and purchase packages per child, package detail
- **Finance** — main wallet, children's wallets, transaction history
- **Branch Transfer** — submit request (3 steps: child & branch, school & level, document & reason), request list, request detail
- Notifications, profile, change password
- Payment result pages

---

## Technical Architecture

### Authentication
- **JWT** — `accessToken` + `refreshToken` stored in `localStorage`
- `AuthContext` manages `user`, `isAuthenticated`, and `loading` state; session is restored on page reload from `localStorage`
- **Axios request interceptor** automatically attaches `Authorization: Bearer <token>` to every request
- **401 handling via response interceptor:**
  - `session_ended` / `invalid_token` → clears storage, shows `SessionEndedDialog`, redirects to `/login`
  - Otherwise → silent token refresh with a queued retry mechanism (prevents parallel refresh race conditions using an `isRefreshing` flag + `failedQueue`)
  - Skip-refresh endpoints: login, refresh, contact, parent creation, branch-transfer approve/reject

### API Service Layer
- One service file per domain entity in `src/services/` (26 services total)
- Pattern: build query string → call `axiosInstance.get/post/put/delete` → return `response.data`, throw `error.response?.data`
- `buildQueryString` helper handles paginated requests; `getAllX` helpers auto-paginate to fetch all records

### `useBaseCRUD` Hook
The central hook used by virtually every management page, encapsulating:
- Pagination, keyword search, and filter state
- Loading with minimum duration for smooth UX
- Reusable confirm dialog
- CRUD action handlers (create, update, delete, get detail)

### Multi-step Wizard Forms
Complex create/update flows use a `StepperForm` component with co-located `Step1…`, `Step2…` child files inside the page folder.

### Definitions Pattern
Each entity has two co-located schema files:
- `tableColumns.jsx` — table column definitions, cell renderers, action callbacks
- `formFields.jsx` — form field schema, decoupled from the page component

### Design System
| Token | Value |
|---|---|
| Brand name | BrightWay |
| Primary color | `#5cbdb9` (teal/mint) |
| Secondary color | `#f5a8b8` (pink) |
| Token source | CSS custom properties in `theme.css` |

### Error Handling
- `ErrorBoundary` + `GlobalErrorHandler` wrap the entire application as a last-resort catch
- Runtime errors are surfaced via react-toastify toast notifications

---

## Deployment

The project is deployed on **Vercel** with configuration defined in `vercel.json`:

- **SPA routing** — all non-`/api/` paths are rewritten to `index.html`
- **Asset caching** — static files under `assets/` receive a 1-year immutable cache header

```json
// vercel.json (summary)
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "headers": [{ "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }]
}
```

---

## Brand Colors

```css
--color-primary: #5cbdb9;       /* Primary teal */
--color-secondary: #f5a8b8;     /* Secondary pink */
```

All colors, spacing, and shadows are defined as CSS custom properties in [src/styles/theme.css](src/styles/theme.css).
