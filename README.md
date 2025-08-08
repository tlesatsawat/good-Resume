# good-Resume

This repository contains a minimal Node.js HTTP server prototype for a resume-building web app with manual payment verification.

## Endpoints
- `POST /register` — create a new user.
- `POST /login` — authenticate a user.
- `GET /templates` — list available templates.
- `POST /orders` — create a new order for a template.
- `POST /orders/:id/payment` — submit a payment slip URL and mark order as pending verification.
- `GET /orders/:id` — retrieve status of an order.

Data is stored in memory for demonstration purposes only.

## Running the server
```bash
node server.js
```

The server listens on port 3000 by default.
