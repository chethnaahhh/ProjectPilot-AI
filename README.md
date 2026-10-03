# ProjectPilot AI

ProjectPilot AI is a product intelligence workspace designed to help product teams turn customer feedback into prioritized product decisions. The application centralizes feature triage, roadmap planning, KPI tracking, and PRD generation in one streamlined workflow.

## Overview

ProjectPilot AI helps product managers:
- collect and review customer feedback
- analyze sentiment and recurring feedback themes
- prioritize features using weighted scoring
- track roadmap milestones and delivery progress
- monitor KPI trends and product health
- generate PRDs from structured product inputs

## Key Features

- Dashboard with summary metrics and visual analytics
- Customer feedback intake, editing, and deletion
- Feedback analysis with categorization and keyword extraction
- Feature prioritization scoring model
- Roadmap and milestone planning
- KPI analytics and release progress tracking
- PRD generation and document export options
- JSON export/import and demo data restore
- Responsive SaaS-style UI with local persistence

## Technology Stack

- React 18
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Vitest
- Playwright
- LocalStorage persistence

## Installation

```bash
npm install
```

## Running the App

```bash
npm run dev
```

The app will run in the local Vite development server and is typically available on the local preview URL shown in the terminal.

## Running Tests

```bash
npm test
```

## Production Build

```bash
npm run build
```

## Screenshots

Screenshots are not yet included in this repository. Add images here when available:

- `docs/screenshots/dashboard.png`
- `docs/screenshots/roadmap.png`
- `docs/screenshots/prd.png`

## Project Structure

```text
.
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── utils/
├── tests/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── playwright.config.js
├── .gitignore
├── README.md
└── package-lock.json
```

## Future Improvements

- integrate real AI APIs and LLM summarization
- add authentication and multi-user workspaces
- connect to a backend database and real project data
- add export to PDF and shareable roadmap views
- support team collaboration and comments
- add advanced forecasting and trend analysis

## Notes

This project is designed as a local, portfolio-ready product management tool and does not require external credentials or a hosted backend for the core experience.
