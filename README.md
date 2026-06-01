# Inventory & Order Management System

Full-stack technical assessment project for managing products, customers, orders, and stock movement.

## Stack

- Frontend: React, Vite, JavaScript
- Backend: Python, FastAPI, SQLAlchemy
- Database: PostgreSQL
- Containers: Docker and Docker Compose

## Features

- Product CRUD with unique SKU/code validation
- Customer creation/list/detail/delete with unique email validation
- Order creation with multiple product line items
- Automatic backend total calculation
- Inventory checks before order placement
- Stock reduction after successful order creation
- Dashboard summary for products, customers, orders, and low stock products
- Responsive React UI with form validation and API error messages

## Project Structure

```text
.
├── backend
│   ├── app
│   │   ├── routers
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend
│   ├── src
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── .env.example
```

## Local Docker Run

1. Create an environment file:

```bash
cp .env.example .env
```

2. Start all services:

```bash
docker compose up --build
```

3. Open the app:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

PostgreSQL data is persisted in the named Docker volume `postgres_data`.

## API Endpoints

Products:

- `POST /products`
- `GET /products`
- `GET /products/{id}`
- `PUT /products/{id}`
- `DELETE /products/{id}`

Customers:

- `POST /customers`
- `GET /customers`
- `GET /customers/{id}`
- `DELETE /customers/{id}`

Orders:

- `POST /orders`
- `GET /orders`
- `GET /orders/{id}`
- `DELETE /orders/{id}`

Dashboard:

- `GET /dashboard/summary`

Health:

- `GET /health`

## Example Order Payload

```json
{
  "customer_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 2,
      "quantity": 1
    }
  ]
}
```

The backend validates the customer and products, verifies available inventory, calculates `total_amount`, stores line item price snapshots, and reduces stock after a successful order.

## Environment Variables

Backend:

- `DATABASE_URL`: SQLAlchemy PostgreSQL URL
- `BACKEND_CORS_ORIGINS`: comma-separated frontend origins

Frontend:

- `VITE_API_URL`: public backend API URL used at build time

Database:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

## Free Hosting Deployment

Backend on Render:

1. Create a PostgreSQL database in Render.
2. Create a Web Service from this GitHub repository.
3. Set the root directory to `backend`.
4. Use Docker as the environment.
5. Set `DATABASE_URL` to the Render PostgreSQL internal connection string, using the `postgresql+psycopg://` scheme.
6. Set `BACKEND_CORS_ORIGINS` to the deployed frontend URL.
7. Deploy and confirm `https://your-backend.onrender.com/health` returns `{"status":"ok"}`.

Frontend on Vercel:

1. Import the GitHub repository in Vercel.
2. Set the root directory to `frontend`.
3. Set build command to `npm run build`.
4. Set output directory to `dist`.
5. Add `VITE_API_URL=https://your-backend.onrender.com`.
6. Deploy and confirm the dashboard loads API data.

Docker Hub backend image:

```bash
docker build -t your-dockerhub-username/inventory-backend:latest ./backend
docker push your-dockerhub-username/inventory-backend:latest
```

## Submission Checklist

- GitHub repository link: add after pushing this repository
- Docker Hub backend image link: add after pushing the backend image
- Live frontend deployment URL: add after Vercel/Netlify deployment
- Live backend API URL: add after Render/Railway/Fly.io deployment
