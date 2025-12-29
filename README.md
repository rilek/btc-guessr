# BTC Guessr

A simple webapp game where players can guess whether the price of Bitcoin (BTC/USD) will go up or down after one minute. No sign-in is required; players are identified anonymously, and their score is persisted across sessions. BTC price is acquired from a third-party API.

## Features
- Player scores and guesses are persisted in a backend database.
- A new player with score 0 is automatically created on the first visit.
- The player ID is stored in localStorage; clearing it or switching browsers resets the player state.
- Each guess is ready for resolution after at least one minute.
- A guess remains active until it is successfully resolved.
- Guess is requested to be resolved client-side.
- In case of a tie, the guess is resolved and player's score remains unchanged.
- Only one active guess per player is allowed at any time.

## Solution
This repository is a monorepo managed with pnpm workspaces and contains all code and resources required for development and deployment of the app. Infrastructure is defined and managed using the SST framework. The application is designed to be deployed entirely on AWS cloud services.


## Development
1. Rename `.env.example` to `.env` and fill it with your AWS credentials
2. Install dependencies and start the development environment:
```sh
pnpm install
pnpm dev
```

## Deployment
`TBD`

## Infrastructure

### Database (DynamoDB)
- **Players table**: `{ id, score, created_at }`
- **Guesses table**: `{ id, player_id, direction, reference_price, resolved_at, resolved_price, created_at }`

### API
- AWS API Gateway backed by Node.js Lambda functions
- Endpoints:
  - `POST /api/players` — Create a new player
  - `GET /api/players/{id}` — Retrieve player details (score and active guess)
  - `POST /api/players/{id}/guess` — Submit a new guess for a player
  - `POST /api/players/{id}/guess/resolve` — Attempt to resolve the active guess
  - `GET /api/ticker` — Retrieve the latest BTC price

### Frontend
- **TypeScript + React (Vite)** single-page application consuming the backend API
- State management: **Zustand**
- Styling: **Tailwind CSS**

## Design descisions
- It's not an explicit requirement to store guesses in the db as guesses don't need to be resolved after closing the page and coming back. However, I wasn't comfortable to do it fully client-side as guesses could be updated before resolution.
- Resolve guesses automatically on the server (e.g. via scheduled jobs). Currently client triggers resolution as it allows simpler implementations, but long term isn't solution.
