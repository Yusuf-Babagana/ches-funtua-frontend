# Funtua Frontend

A modern, responsive frontend for the Funtua application, built with **Next.js 13+ (App Router)** and **TypeScript**. This project integrates with a generic Django DRF backend to provide a comprehensive management interface for students, lecturers, and administrators.

## 🚀 Features

- **Modern Tech Stack**: Next.js 13+ with App Router, TypeScript, and Tailwind CSS.
- **Role-Based Dashboards**: Dedicated views for Students, Lecturers, HODs, Desk Officers, and Super Admins.
- **Authentication**: JWT-based authentication context with secure protected routes.
- **UI Components**: Reusable, accessible components built with Radix UI and Tailwind (shadcn/ui inspired).
- ** responsive Design**: Fully responsive layout for all device sizes.

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context API
- **Form Handling**: Native React forms / React Hook Form

## 📂 Project Structure

```bash
Funtua-front/
├── app/                        # Next.js App Router (pages & layouts)
│   ├── dashboard/              # Dashboard views (Super Admin, Student, etc.)
│   ├── login/                  # Authentication pages
│   ├── portal/                 # Public portal pages
│   ├── register/               # Registration flows
│   ├── settings/               # User settings
│   ├── api/                    # API route handlers (if any)
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/                 # Reusable UI components
│   ├── ui/                     # Primitives (Button, Input, Card, etc.)
│   ├── users/                  # User-specific components
│   ├── dashboard-layout.tsx    # Main dashboard wrapper
│   └── student-sidebar.tsx     # Student navigation
├── contexts/                   # React Contexts (AuthContext, etc.)
├── hooks/                      # Custom React Hooks
├── lib/                        # Utilities & API clients
│   ├── api.ts                  # Central API client configuration
│   └── utils.ts                # Helper functions
├── public/                     # Static assets (images, icons)
├── types/                      # TypeScript type definitions
├── .env.local                  # Environment variables
├── next.config.mjs             # Next.js configuration
├── package.json                # Dependencies & scripts
└── tsconfig.json               # TypeScript configuration
```

## 🏁 Getting Started

### Prerequisites

- **Node.js**: v18.17.0 or higher
- **pnpm**: v8.0.0 or higher (recommended) or npm/yarn
- **Backend**: A running instance of the Funtua Django Backend

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/Funtua-front.git
    cd Funtua-front
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    # or
    npm install
    ```

3.  **Configure Environment**:
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:8000/api
    ```

4.  **Run Development Server**:
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📦 Build for Production

To create a production build:

```bash
pnpm build
pnpm start
```

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.
