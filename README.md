# BTC Guessr

A simple webapp game where players can guess whether the price of Bitcoin (BTC/USD) will go up or down after one minute. No sign-in is required; players are identified anonymously, and their guess history is persisted in a database. BTC price is acquired from a third-party API.

## Features
- Guesses are persisted in a backend database.
- On first visit new player uuid is generated and stored locally.
- Player's score is computed based on guess history.
- Each guess is ready for resolution after at least one minute.
- A guess remains active until it is successfully resolved.
- Guess's resolution is triggered client-side.
- In case of a tie, the guess is resolved and player's score remains unchanged.
- Only one active guess per player is allowed.

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
- **Guesses table**: `{ guessId, playerId, direction, referencePrice, createdAt, status, resolvedAt?, resolvedPrice? }`

### API
- AWS API Gateway backed by Node.js Lambda functions
- Endpoints:
  - `GET /api/guesses/{playerId}` — get guess history for a player
  - `POST /api/guesses/{playerId}` — Make a guess for a player
  - `POST /api/guesses/{playerId}/resolve` — Try to resolve the active guess for a player
  - `GET /api/ticker` — Retrieve the latest BTC price

### Frontend
- **TypeScript + React (Vite)** single-page application consuming the backend API
- State management: **Zustand**
- Styling: **Tailwind CSS**

## Design descisions
- Used DynamoDB as a serverless NoSQL database as simplest solution for persisting guesses.
- Guess resolution is triggered client-side, bugt should happend automatically on the server (e.g. via scheduled jobs)
