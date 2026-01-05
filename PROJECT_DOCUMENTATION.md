# Pebric Project Documentation

## 1. Introduction
Pebric is a modern e-commerce application designed for matching outfits for pets and their owners. It runs on a React-based frontend and utilizes Supabase for backend services, including authentication and database management. The project emphasizes a premium user experience with a responsive design, rich aesthetics, and specific features tailored for pet owners such as breed sizing guides and fit feedback.

## 2. Technology Stack

### Frontend
- **Framework**: [React](https://react.dev/) (with [Vite](https://vitejs.dev/) as the build tool)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: shadcn-ui (Radix UI based)
- **State Management**: React Context API (`AuthContext`, `CartContext`), React Query (`@tanstack/react-query`)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Icons**: Lucide React

### Backend (Supabase)
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Client**: `@supabase/supabase-js`

## 3. Architecture Overview
The application follows a standard Single Page Application (SPA) architecture.
- **Client-Side**: The browser loads the React app, which handles routing, UI rendering, and local state management.
- **Server Communication**: The app communicates directly with Supabase via the Supabase Client (`src/integrations/client.ts`) to fetch data, authenticate users, and subscribe to real-time updates.
- **Security**: Row Level Security (RLS) policies are assumed to be configured in Supabase to protect user data, as the client connects directly to the DB.

## 4. Key Functionalities

### 4.1. Authentication & User Management
The `AuthContext` (`src/contexts/AuthContext.tsx`) manages the user's session.
- **Sign Up/Login**: Users can sign up and login using email and password.
- **Persistence**: Sessions are persisted to `localStorage` via the Supabase client.
- **Profiles**: User profile data (name, address, etc.) is stored in the `profiles` table and fetched upon login.
- **Admin Role**: The application checks the `user_roles` table to determine if a user has 'admin' privileges, enabling access to `/admin` routes.

### 4.2. E-Commerce Shopping Flow
- **Product Browsing**: Users can browse products, view collections (Summer, Winter, Rainy), and see product details.
- **Cart Management**: The `CartContext` (`src/contexts/CartContext.tsx`) handles the shopping cart state locally.
    - Features: Add to cart, remove items, update quantities.
    - **Pet Matching**: Cart items track both `ownerSize` and `petSize`.
- **Wishlist**: Users can add items to a wishlist (managed locally in context).
- **Checkout**: A dedicated checkout page (`/checkout`) handles order placement.

### 4.3. Pet-Specific Features
Pebric distinguishes itself with pet-centric features:
- **Breed Sizing**: The database contains `breed_sizing_rules` to help users find the right fit for their pets based on breed, chest size, and weight.
- **Fit Feedback**: Users can provide feedback on how well items fit (`fit_feedback` table), helping others make better choices.
- **Pet Gallery**: A social feature (`/gallery`) where users can post photos of their pets (`pet_gallery` table), and others can like or comment.

### 4.4. Admin & Operations
- **Dashboard**: An admin interface (`/admin`) for managing the store.
- **Campaigns**: Management of marketing campaigns (`campaigns`, `campaign_metrics`) to track clicks, conversions, and revenue.
- **Delivery**: Management of delivery slots (`delivery_slots`) and tracking of Service Level Agreements (`delivery_sla`).
- **Dynamic Pricing**: Implementation of pricing rules (`dynamic_pricing_rules`) for discounts and promotions.

### 4.5. Customer Support & Engagement
- **FAQ**: Frequently Asked Questions (`faqs` table).
- **Tracking**: Order tracking functionality (`/tracking`).
- **Loyalty Program**: Loyalty points and rewards (`/loyalty`).
- **Referrals**: Referral system to encourage user growth (`/referrals`).

## 5. Database Schema (Key Tables)
The underlying PostgreSQL database supports the rich feature set:

- **Core Commerce**: `products`, `collections`, `categories`, `orders`, `order_items`, `cart_items`.
- **Users**: `profiles`, `user_roles`, `addresses`.
- **Marketing**: `coupons`, `coupon_uses`, `flash_sales`, `abandoned_carts`.
- **Pet Features**: `pets`, `breed_sizing_rules`, `fit_feedback`, `pet_gallery`, `gallery_comments`.
- **System**: `audit_logs`, `analytics_events`.

## 6. Project Structure
```
d:/Pebric/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components (buttons, inputs, etc.)
│   ├── contexts/        # React Contexts (Global state)
│   │   ├── AuthContext.tsx
│   │   └── CartContext.tsx
│   ├── hooks/           # Custom React Hooks
│   ├── integrations/    # External service integrations
│   │   ├── client.ts    # Supabase Client initialization
│   │   └── types.ts     # Supabase Database Types
│   ├── lib/             # Utility functions
│   ├── pages/           # Page components (Routes)
│   ├── App.tsx          # Main Application Component & Routing
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles (Tailwind)
├── supabase/            # Supabase configuration or local dev files
├── package.json         # Dependencies and scripts
├── tailwind.config.ts   # Tailwind CSS configuration
└── vite.config.ts       # Vite configuration
```

## 7. Development Setup
To run the project locally:

1.  **Clone Requirements**: Ensure Node.js is installed.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    - Ensure `.env` or environment variables are set for `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:8080` (or similar).

## 8. State Management Note
Currently, the `CartContext` operates with local state for the immediate session. While the database has a `cart_items` table, the frontend implementation (as of `CartContext.tsx`) manages items in React memory. This allows for a fast, responsive UI, but cart contents may not persist across devices unless a sync mechanism is implemented (likely intended via future updates or existing hooks not detailed in the core context).
