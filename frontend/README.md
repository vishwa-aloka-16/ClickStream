# Vantage frontend

React and Vite frontend for the ClickStream Commerce Analytics project.

The application contains the customer storefront, product details, favorites, cart, simulated checkout, authentication, order history, and administrator catalog/order screens. Browser interactions are sent to the backend event endpoint for Kafka ingestion.

## Development

```bash
npm install
npm run dev
```

The frontend expects the API at `http://localhost:3000`. Copy `.env.example` to `.env` and set `VITE_API_URL` when using another address.

## Checks

```bash
npm run lint
npm run build
```

See the [root project README](../README.md) for infrastructure, Python pipeline, synthetic-data, and Power BI instructions.
