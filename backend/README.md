# GrowthCraft Backend API

This directory contains the backend service for GrowthCraft EdTech SaaS API built with Node.js, Express, TypeScript, MongoDB (Mongoose), and Redis.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB & Redis instances (or local instances)

### Environment Setup
Copy `.env.example` to `.env` and fill in the required environment variables:
```bash
cp .env.example .env
```

### Running Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Documentation

All API guides, feature documentation, and testing guides have been consolidated into the [`docs/`](./docs) directory:

- **General Setup & Quickstart**: [`docs/QUICK_START.md`](./docs/QUICK_START.md)
- **API Documentation**: Interactive Swagger docs available at `/api-docs` when running the server
- **Feature Guides**: Available in [`docs/`](./docs)
