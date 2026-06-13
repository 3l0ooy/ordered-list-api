# Ordered List API

Small REST API for managing ordered lists of items. Positions stay
contiguous when items are moved or deleted.

Built with Node.js, Express, and SQLite (raw SQL via `better-sqlite3`).

## Run

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`.

## Test

In another terminal:

```bash
npm test
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST   | `/lists` | Create a list |
| POST   | `/lists/:listId/items` | Add item to end |
| GET    | `/lists/:listId/items` | Get all items, sorted |
| GET    | `/lists/:listId/items/:itemId` | Get one item |
| PATCH  | `/lists/:listId/items/:itemId/move` | Move item to new position |
| DELETE | `/lists/:listId/items/:itemId` | Delete