# MSP Frontend

A production-grade Next.js application with modern tooling, beautiful UI components, and best practices built-in.

## 🚀 Features

- **Next.js 15** with App Router and React 19
- **Tailwind CSS v4** for styling
- **JavaScript** (not TypeScript) for simplicity
- **ESLint** for code quality
- **Production-ready** folder structure
- **Reusable UI components** with variants
- **Custom hooks** for common functionality
- **Utility functions** for common tasks
- **Security headers** and optimizations
- **Responsive design** with mobile-first approach

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/
│   ├── ui/             # Reusable UI components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── utils/              # Utility functions
└── constants/          # App constants and configuration
```

## 🛠️ Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your values
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 UI Components

The project includes a set of reusable UI components:

- **Button** - Multiple variants (default, outline, ghost, etc.)
- **Header** - Navigation with responsive design
- **Footer** - Site footer with links

### Using Components

```javascript
import Button from '@/components/ui/Button';

function MyComponent() {
  return (
    <Button variant="outline" size="lg">
      Click me
    </Button>
  );
}
```

## 🔧 Utilities

### Class Name Merging

```javascript
import { cn } from '@/lib/utils';

const className = cn(
  'base-classes',
  condition && 'conditional-classes',
  'additional-classes'
);
```

### Local Storage Hook

```javascript
import { useLocalStorage } from '@/hooks/useLocalStorage';

function MyComponent() {
  const [value, setValue] = useLocalStorage('key', 'defaultValue');
  // Use like useState but with localStorage persistence
}
```

## 🚀 Production Deployment

### Build Optimization

The project is configured for optimal production builds:

- **Image optimization** with WebP/AVIF support
- **Bundle optimization** with package imports
- **Security headers** for enhanced security
- **Compression** enabled
- **Static generation** where possible

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Deploy with zero configuration

### Deploy to Other Platforms

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

## 🔒 Environment Variables

Create a `.env.local` file based on `env.example`:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Add your environment variables here
```

## 📚 Tech Stack

- **Framework:** Next.js 15
- **Language:** JavaScript
- **Styling:** Tailwind CSS v4
- **Linting:** ESLint
- **Fonts:** Geist Sans & Geist Mono

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to check code quality
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).