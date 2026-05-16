README.md

# Shopify Price Anomaly Checker
A small full-stack Shopify demo that scans products and variants for pricing issues that could affect merchant revenue.
The app connects to a real Shopify development store through the Shopify Admin GraphQL API, analyzes product variant prices in a Node.js backend, saves scan history in PostgreSQL, and displays the results in a React + Shopify Polaris dashboard.
## Why this exists
This was built as a practical vertical slice for a Shopify/e-commerce full-stack role.
It demonstrates:
- React + TypeScript frontend
- Shopify Polaris UI
- Node.js + Express backend
- Shopify Admin GraphQL API integration
- PostgreSQL + Prisma persistence
- product/variant data handling
- pricing rules engine
- scan history
- merchant-friendly issue reporting
## Features
- Fetches real Shopify products and variants
- Detects price anomalies:
  - zero or invalid price
  - compare-at price lower than active price
  - unusually high discount
  - missing SKU
  - generic Shopify variant title
- Saves each scan in PostgreSQL
- Displays scan history
- Shows issue severity and recommendations
## Tech Stack
### Frontend
- React
- TypeScript
- Vite
- Shopify Polaris
- React Query
- CSS
### Backend
- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Shopify Admin GraphQL API
### Dev
- Docker Compose
- Environment variables
- GitHub-ready project structure
## Architecture
```txt
React dashboard
  ↓
Node.js API
  ↓
Shopify Admin GraphQL API
  ↓
Price anomaly analyzer
  ↓
PostgreSQL / Prisma
  ↓
React dashboard report

Project Structure

shopify-price-anomaly-checker/
  backend/
    prisma/
      schema.prisma
    src/
      analyzer.ts
      db.ts
      env.ts
      index.ts
      routes.ts
      shopify.ts
  frontend/
    src/
      api.ts
      App.tsx
      App.css
      main.tsx
  docs/
    API.md
  docker-compose.yml
  README.md

Environment Variables

Create backend/.env:

PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shopify_price_checker?schema=public"
SHOPIFY_SHOP_DOMAIN="your-dev-store.myshopify.com"
SHOPIFY_ADMIN_ACCESS_TOKEN="your_admin_api_access_token"

Do not commit .env.

Use backend/.env.example for placeholders.

Local Setup

1. Start PostgreSQL

docker compose up -d

2. Backend

cd backend
npm install
npm run prisma:dev -- --name init
npm run dev

Backend runs on:

http://localhost:4000

3. Frontend

cd frontend
npm install
npm run dev

Frontend runs on:

http://localhost:5173

Main API Endpoints

GET  /api/health
GET  /api/shopify/products
GET  /api/shopify/analyze-preview
POST /api/scans/run
GET  /api/scans
GET  /api/scans/:id

Full API docs:

docs/API.md

Shopify Notes

For this MVP, the app uses a Shopify development store and an Admin API access token.

A production Shopify app would add:

* OAuth install flow
* per-shop token storage
* App Bridge embedded UI
* webhook registration
* webhook HMAC validation
* Billing API, if monetized

Production Improvements

If this were production, I would add:

* full OAuth flow
* multi-shop support
* encrypted token storage
* webhook processing
* background jobs for large catalogs
* query pagination
* rate limit handling
* request validation
* automated tests
* Cloud Run + Cloud SQL deployment
* monitoring/logging



