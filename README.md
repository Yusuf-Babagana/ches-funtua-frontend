# Funtua Frontend

A modern, responsive frontend for the Funtua application, built with **Next.js 13+ (App Router)** and **TypeScript**. This project integrates with a generic Django DRF backend to provide a comprehensive management interface for students, lecturers, and administrators within an educational institution.

---

## 🤖 Guide for AI Agents & Developers

This documentation section is specifically structured to give an architectural and logical overview of how the **Funtua Frontend** works, to aid in rapid onboarding, debugging, and feature development.

### 1. High-Level Architecture & Purpose
Funtua-front is a comprehensive **Role-Based Educational Dashboard**. It serves multiple user types within a school/university system. The core logic relies on fetching data from a robust Django backend (via REST APIs) and rendering personalized views depending on the authenticated user's role. 

### 2. Core Technologies
- **Framework**: Next.js 13+ (using the App Router `app/` directory).
- **Language**: TypeScript (strict typing throughout the project).
- **Styling**: Tailwind CSS v4, initialized with PostCSS.
- **UI Architecture**: Radix UI primitives (`@radix-ui/react-*`), wrapped in a Shadcn UI-like structure for atomic components (accessible in `components/ui/`).
- **Icons**: Lucide React.
- **Form Management**: `react-hook-form` paired with `zod` for robust client-side validation schemas.
- **Data Fetching & API logic**: A custom central API client wrapper located in `lib/api.ts`.
- **State Management**: Primarily handled through React Context API (Auth Contexts, Role Contexts) and local component states.
- **Visuals & Charts**: Recharts for data visualization and Embla Carousel for sliders.

### 3. Routing & Role-Based Logic
The `app/` directory is logically separated by user roles and public/auth boundaries:
- `app/login/` & `app/register/`: Authentication boundaries.
- `app/portal/`: Public-facing portal elements.
- `app/dashboard/`: The core protected routes. Inside `dashboard/`, the application branches out into highly separated access modules based on the user's role:
  - `bursar/`: Financial tracking and payment management.
  - `desk-officer/`: Front-desk administrative operations.
  - `exam-officer/`: Result compilation, exam scheduling, and results publication.
  - `hod/`: Head of Department view for managing staff, students, and course approvals.
  - `ict/`: IT administration, potentially handling system configurations.
  - `lecturer/`: Course management, grading, and student attendance.
  - `registrar/`: Core registry functions, student enrolments, and records.
  - `student/`: Student-centric views (course registration, results, fee payments).
  - `super-admin/`: System-wide settings and oversight.

**Security Logic:** Components like `dashboard-layout.tsx` wrap the `dashboard/` sub-routes, acting as a gateway that checks authentication state via the Next.js layouts. The API logic in `lib/api.ts` manages API token injection (JWTs) and handles `401/403` intercepts to redirect to login or show permission errors.

### 4. Component Structure
- `components/ui/`: Contains primitive, reusable building blocks (Buttons, Inputs, Dialogs, Selects, Toasts). Never edit the core logic here without strong reasons; build *compositions* of these instead.
- `components/users/` or `app/dashboard/.../components/`: Role-specific view components abstracting logic out of standard `page.tsx` files.

### 5. API Integration & Error Handling
- The backend expects RESTful requests. 
- Look out for `lib/api.ts` -- it contains the abstractions used to interact with the backend (like `get`, `post`, `patch`, `delete`).
- Standard API responses are usually managed by `sonner` / `sooner` toast notifications on the UI level (intercepted via hooks).

### 6. Common AI Tasks to Anticipate
- **Debugging Views**: A page inside `app/dashboard/[role]/` is crashing or not displaying data. Check the hook calling `lib/api.ts` and ensure the Zod schema or TypeScript interface matches the Django DRF response.
- **Adding New Features**: When requested to add a feature for a specific role (e.g., adding "Approve Results" for `hod`), you must:
  1. Define the UI in `app/dashboard/hod/.../page.tsx`.
  2. Implement the API call in `lib/api.ts` (or equivalent file).
  3. Validate forms with a newly defined `zod` schema.
  4. Ensure the UI aligns with existing Tailwind/Radix patterns.

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: v18.17.0 or higher
- **pnpm**: v8.0.0 or higher (recommended) or npm/yarn
- **Backend**: A running instance of the Funtua Django Backend

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd Funtua-front
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8000/api
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📦 Build for Production

To create a production build:

```bash
npm run build
npm run start
```
