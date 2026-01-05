# Pebric - Pet & Owner Matching Outfits E-Commerce

A modern e-commerce application designed for matching outfits for pets and their owners.

## Project Overview

Pebric is a full-featured e-commerce platform specializing in pet clothing and accessories. The application includes features such as breed-specific sizing guides, pet galleries, fit feedback, wishlist management, and comprehensive admin tools.

## Technology Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn-ui (Radix UI based)
- **Backend**: Supabase (PostgreSQL, Authentication)
- **State Management**: React Context API, React Query

## Getting Started

### Prerequisites

- Node.js (v16 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm (comes with Node.js)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the project root with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the production bundle
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
d:/Pebric/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React Context providers (Auth, Cart)
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # External service integrations (Supabase)
│   ├── lib/             # Utility functions
│   ├── pages/           # Page components and routes
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── supabase/            # Supabase functions and configuration
├── package.json         # Project dependencies
├── tailwind.config.ts   # Tailwind CSS configuration
└── vite.config.ts       # Vite build configuration
```

## Key Features

- **E-Commerce**: Product browsing, cart management, checkout flow
- **Pet-Specific**: Breed sizing guides, fit feedback system
- **Social**: Pet gallery with likes and comments
- **User Management**: Authentication, profiles, addresses
- **Admin Dashboard**: Product management, campaigns, analytics
- **Customer Support**: FAQ, order tracking, loyalty program

## Deployment

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` folder.

### Deployment Options

You can deploy the built application to any static hosting service:

- **Netlify**: Connect your Git repository or drag-and-drop the `dist` folder
- **Vercel**: Connect your Git repository for automatic deployments
- **GitHub Pages**: Use GitHub Actions for automated deployment
- **AWS S3 + CloudFront**: Upload `dist` folder to S3 bucket
- **Firebase Hosting**: Use Firebase CLI to deploy

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is private and proprietary.
