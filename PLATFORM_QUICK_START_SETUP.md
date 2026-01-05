# ELOITY PLATFORM - QUICK START SETUP GUIDE

## Prerequisites

- **Node.js:** Version 20 or higher
- **npm/yarn/pnpm:** Latest version
- **Supabase Account:** Free tier sufficient for testing
- **Stripe Account:** For payment processing (optional for testing)
- **Git:** For version control

---

## Step 1: Project Setup

### 1.1 Create React App with Vite

```bash
npm create vite@latest eloity-platform -- --template react-ts
cd eloity-platform

# Install dependencies
npm install
```

### 1.2 Install Core Dependencies

```bash
# UI Framework & Components
npm install react-router-dom@^6.24.0
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip @radix-ui/react-visually-hidden

# Styling
npm install tailwindcss postcss autoprefixer class-variance-authority clsx tailwind-merge @tailwindcss/typography
npm install -D tailwindcss postcss autoprefixer

# Form & Validation
npm install react-hook-form@^7.63.0 @hookform/resolvers zod@^4.2.1

# State Management & Data Fetching
npm install @tanstack/react-query@^5.90.1
npm install axios

# Icons & UI Utilities
npm install lucide-react react-icons
npm install sonner react-hot-toast
npm install framer-motion

# Supabase
npm install @supabase/supabase-js@^2.50.0

# Utilities
npm install date-fns uuid react-helmet-async

# Real-time
npm install socket.io-client@^4.7.5
```

### 1.3 Configure Tailwind CSS

```bash
npx tailwindcss init -p
```

**tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss';

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        accent: "hsl(var(--accent))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} as const satisfies Config;
```

**postcss.config.cjs:**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 1.4 Configure Vite

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

---

## Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to https://supabase.com
2. Sign up for free account
3. Create a new project
4. Wait for database initialization (~2 minutes)

### 2.2 Get Supabase Credentials

From Supabase dashboard:
- **Settings** → **API** → Copy:
  - `supabase_url` (VITE_SUPABASE_URL)
  - `anon` public key (VITE_SUPABASE_PUBLISHABLE_KEY)
  - `service_role` key (for backend, keep secure)

### 2.3 Environment Variables

Create `.env` file in project root:

```env
# Frontend
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_API_URL=http://localhost:5000

# Backend (if using Node.js backend)
DATABASE_URL=postgresql://postgres.your-project-id:password@aws-0-region.pooler.supabase.com:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=your-service-key-here
JWT_SECRET=your-jwt-secret-here
```

---

## Step 3: Core Structure Setup

### 3.1 Create Folder Structure

```
src/
├── components/
│   ├── ui/                 # Radix UI primitives
│   ├── feed/               # Feed components
│   ├── marketplace/        # Marketplace components
│   ├── chat/               # Chat components
│   ├── crypto/             # Crypto components
│   ├── wallet/             # Wallet components
│   └── admin/              # Admin components
├── pages/                  # Page components
│   ├── Feed.tsx
│   ├── CreatePost.tsx
│   ├── marketplace/
│   ├── chat/
│   ├── Wallet.tsx
│   ├── UnifiedProfile.tsx
│   └── admin/
├── contexts/               # React Context
│   ├── AuthContext.tsx
│   ├── WalletContext.tsx
│   └── ...
├── hooks/                  # Custom hooks
│   ├── use-feed.ts
│   ├── use-wallet.ts
│   ├── use-realtime-messaging.ts
│   └── ...
├── services/               # Business logic
│   ├── postService.ts
│   ├── walletService.ts
│   ├── profileService.ts
│   └── ...
├── integrations/
│   └── supabase/
│       ├── client.ts       # Supabase client
│       └── types.ts        # Generated DB types
├── types/                  # TypeScript types
│   ├── user.ts
│   ├── post.ts
│   └── ...
├── lib/
│   └── utils.ts            # Utility functions
├── App.tsx                 # Main app & routing
├── main.tsx                # Entry point
└── index.css               # Global styles
```

### 3.2 Create Global CSS

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary: 262 80% 50%;
  --primary-foreground: 210 40% 98%;
  --secondary: 220 13% 91%;
  --secondary-foreground: 222 47% 11%;
  --accent: 262 80% 50%;
  --accent-foreground: 210 40% 98%;
  --background: 210 40% 98%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --muted: 220 13% 91%;
  --muted-foreground: 215 16% 47%;
  --border: 220 13% 91%;
  --radius: 0.5rem;
}

[data-theme="dark"] {
  --background: 222 84% 5%;
  --foreground: 210 40% 98%;
  --card: 222 84% 8%;
  --card-foreground: 210 40% 98%;
  --primary: 262 80% 60%;
  --secondary: 222 84% 15%;
}

* {
  @apply border-border;
}

body {
  @apply bg-background text-foreground;
}
```

---

## Step 4: Authentication Setup

### 4.1 Create Auth Context

**src/contexts/AuthContext.tsx:**
```typescript
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface ExtendedUser extends User {
  username?: string;
  avatar?: string;
  full_name?: string;
  level?: string;
  points?: number;
}

interface AuthContextType {
  user: ExtendedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: Error }>;
  signup: (email: string, password: string, name: string) => Promise<{ error?: Error }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser({
            ...data.session.user,
            username: data.session.user.user_metadata?.username || data.session.user.email?.split('@')[0],
            full_name: data.session.user.user_metadata?.full_name || 'User',
          });
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            ...session.user,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
            full_name: session.user.user_metadata?.full_name || 'User',
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error };
      if (data.user) {
        setUser({
          ...data.user,
          username: data.user.user_metadata?.username || email.split('@')[0],
          full_name: data.user.user_metadata?.full_name || 'User',
        });
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            username: name.toLowerCase().replace(/\s+/g, '_'),
          },
        },
      });
      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## Step 5: Database Schema

### 5.1 Create Initial Tables

In Supabase **SQL Editor**, run:

```sql
-- Users table (note: Supabase has built-in auth.users, this is optional extended data)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'bronze',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  media_urls JSONB,
  type TEXT DEFAULT 'text',
  privacy TEXT DEFAULT 'public',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Post comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Post likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Followers table
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Wallet transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'transfer', 'deposit', 'withdrawal'
  from_user_id UUID REFERENCES auth.users(id),
  to_user_id UUID REFERENCES auth.users(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'completed',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow users to view public profiles
CREATE POLICY "public_profiles_readable"
  ON public.profiles FOR SELECT
  USING (TRUE);

-- Allow users to update own profile
CREATE POLICY "own_profile_editable"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to view public posts
CREATE POLICY "public_posts_readable"
  ON public.posts FOR SELECT
  USING (privacy = 'public' OR auth.uid() = user_id);

-- Allow users to create posts
CREATE POLICY "posts_creatable"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view own transactions
CREATE POLICY "own_transactions_readable"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Create indexes for performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX idx_followers_following_id ON public.followers(following_id);
```

### 5.2 Setup Storage Buckets

In Supabase, create buckets for:
- `avatars` - User profile pictures
- `post-images` - Post media
- `products` - Marketplace product images
- `chat-attachments` - Chat file uploads

---

## Step 6: Create UI Components

### 6.1 Create Button Component

**src/components/ui/button.tsx:**
```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### 6.2 Create Card Component

**src/components/ui/card.tsx:**
```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

---

## Step 7: Create Basic Pages

### 7.1 Auth Page

**src/pages/AuthPage.tsx:**
```typescript
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: err } = await signup(email, password, name);
        if (err) throw err;
        alert('Check your email to confirm signup');
      } else {
        const { error: err } = await login(email, password);
        if (err) throw err;
        navigate('/app/feed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Input
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </form>
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Have an account? Sign In' : "Don't have an account? Sign Up"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Step 8: Setup Routing

**src/App.tsx:**
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/pages/AuthPage';
import Feed from '@/pages/Feed';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/auth" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/app/feed"
            element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/app/feed" />} />
          <Route path="*" element={<Navigate to="/app/feed" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

---

## Step 9: Run Development Server

```bash
npm run dev
```

Open http://localhost:8080 in your browser.

---

## Next Steps

1. **Create more UI components** (Input, Dialog, Tabs, etc.) based on the components/ui folder
2. **Build Feed page** with post listing and creation
3. **Implement real-time features** with Socket.io or Supabase Realtime
4. **Add marketplace** with product listing and checkout
5. **Integrate payments** with Stripe
6. **Setup chat** with WebSockets
7. **Add admin dashboard** for moderation and analytics

---

## Useful Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit

# Format code
npx prettier --write .
```

---

## Troubleshooting

**Issue:** Supabase client not found
- **Solution:** Ensure `.env` file exists with correct SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

**Issue:** Tailwind styles not applying
- **Solution:** Clear node_modules and rebuild: `rm -rf node_modules && npm install`

**Issue:** Authentication not working
- **Solution:** Check Supabase RLS policies, ensure "Enable email provider" is on

---

**Next:** Follow the comprehensive documentation (`PLATFORM_COMPREHENSIVE_DOCUMENTATION.md`) to implement all features!
