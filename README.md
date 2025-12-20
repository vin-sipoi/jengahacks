# JengaHacks Hub

> Built in Nairobi. Ready for the World.

A modern, responsive website for **JengaHacks** - East Africa's premier hackathon event. This platform provides information about the hackathon, registration capabilities, sponsor showcases, and more.

## 🎯 About

JengaHacks is a 48-hour hackathon event taking place in Nairobi, Kenya, bringing together developers, designers, and entrepreneurs to build innovative solutions across multiple tracks including FinTech, HealthTech, AgriTech, EdTech, Climate Tech, and Open Innovation.

**Event Details:**
- 📅 **Date**: February 21-22, 2026
- 📍 **Location**: iHub, Nairobi
- ⏱️ **Duration**: 48 hours
- 👥 **Expected Participants**: 100+ hackers

## ✨ Features

- 🎨 **Modern UI/UX** - Beautiful, responsive design built with Tailwind CSS and shadcn/ui
- 📝 **Registration System** - Easy event registration with form validation and rate limiting
- 🏢 **Sponsor Showcase** - Dedicated section highlighting event sponsors
- 📱 **Fully Responsive** - Optimized for all devices and screen sizes
- ⚡ **Fast Performance** - Built with Vite for lightning-fast development and builds
- 🔐 **Supabase Integration** - Backend services for data management
- 🎯 **Multi-page Navigation** - Clean routing with React Router

## 🛠️ Tech Stack

### Core
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Routing & State
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching

### Backend & Database
- **Supabase** - Backend-as-a-Service (BaaS)

### Forms & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting rules
- **PostCSS** - CSS processing
- **Vitest** - Fast unit test framework
- **React Testing Library** - Component testing utilities
- **jsdom** - DOM environment for testing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **bun** - Package manager (npm comes with Node.js)

> 💡 **Tip**: We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions.

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd jengahacks-hub
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using bun:
```bash
bun install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your Supabase credentials and reCAPTCHA site key:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
VITE_USE_REGISTRATION_EDGE_FUNCTION=false
```

> **Note**: Set `VITE_USE_REGISTRATION_EDGE_FUNCTION=true` to enable IP-based rate limiting via Edge Function (requires deployment of `register-with-ip` function).

> ⚠️ **Note**: Replace the placeholder values with your actual credentials.
> 
> **reCAPTCHA Setup**: 
> 1. Get your site key from [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
> 2. Add the site key to your `.env` file
> 3. The form will work without CAPTCHA in development, but requires it in production

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Run tests with coverage report |

## 📁 Project Structure

```
jengahacks-hub/
├── public/                 # Static assets
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── assets/            # Images and static files
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── About.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── Navbar.tsx
│   │   ├── Registration.tsx
│   │   └── Sponsors.tsx
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Third-party integrations
│   │   └── supabase/     # Supabase client and types
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   │   ├── Index.tsx
│   │   ├── NotFound.tsx
│   │   └── Sponsorship.tsx
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── supabase/             # Supabase configuration
│   └── migrations/       # Database migrations
├── components.json       # shadcn/ui configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── vite.config.ts       # Vite configuration
└── package.json         # Project dependencies
```

## 🧪 Testing

The project uses **Vitest** and **React Testing Library** for testing. Tests are located alongside the components they test with the `.test.tsx` or `.test.ts` extension.

### Running Tests

```bash
# Run tests in watch mode (recommended for development)
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Writing Tests

Test files should be placed next to the components they test:
- `src/components/ComponentName.test.tsx`
- `src/lib/utils.test.ts`

The test setup includes:
- React Testing Library for component testing
- Custom render utility with providers (Router, QueryClient, etc.)
- Mocked Supabase client for integration tests
- jsdom for DOM simulation

Example test:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

## 🎨 Customization

### Adding New Components

Components are organized in the `src/components/` directory. UI components from shadcn/ui are located in `src/components/ui/`.

### Styling

The project uses Tailwind CSS for styling. Configuration can be found in `tailwind.config.ts`. Custom CSS variables and global styles are defined in `src/index.css`.

### Routes

Routes are defined in `src/App.tsx`. Add new routes above the catch-all `*` route.

## 🚢 Deployment

### Using Lovable

1. Open your [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID)
2. Navigate to **Share → Publish**
3. Follow the deployment prompts

### Custom Domain

To connect a custom domain:
1. Navigate to **Project > Settings > Domains**
2. Click **Connect Domain**
3. Follow the setup instructions

For more information, see [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

### Manual Deployment

Build the project for production:

```bash
npm run build
```

The `dist/` directory will contain the production-ready files that can be deployed to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## 🤝 Contributing

Contributions are welcome! Here are a few ways you can contribute:

1. **Report Issues** - Found a bug? Open an issue with details
2. **Suggest Features** - Have an idea? Share it with us
3. **Submit Pull Requests** - Fix bugs or add features

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 Editing Options

### Using Lovable

Visit your [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting. Changes made via Lovable will be automatically committed to this repository.

### Using Your IDE

1. Clone the repository
2. Install dependencies (`npm install`)
3. Make your changes locally
4. Push changes to the repository
5. Changes will be reflected in Lovable

### Using GitHub

- Navigate to the desired file
- Click the "Edit" button (pencil icon)
- Make changes and commit

### Using GitHub Codespaces

1. Navigate to the repository main page
2. Click "Code" → "Codespaces" tab
3. Click "New codespace"
4. Edit files directly in the Codespace
5. Commit and push when done

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the amazing component library
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Vite](https://vitejs.dev/) for the excellent build tooling
- [Supabase](https://supabase.com/) for backend services

## 📞 Support

For questions or support, please open an issue in the repository or contact the project maintainers.

---

**Built with ❤️ for the JengaHacks community**
