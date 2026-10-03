# ProjectPilot AI

ProjectPilot AI is a product management and product intelligence dashboard built for teams that need to turn customer feedback into actionable product decisions. The application brings together feedback intake, sentiment analysis, prioritization, roadmap planning, KPI monitoring, and PRD generation in a single local workspace.

## Overview

Based on the current implementation in this repository, ProjectPilot AI is a product-focused project dashboard for teams that need to:
- capture and manage customer feedback
- analyze sentiment and recurring themes in incoming feedback
- prioritize feature requests using weighted scoring criteria
- organize roadmap items and milestones
- monitor the health of the product through KPI metrics
- generate product requirements documents from structured inputs

## Verified Features

The following features are implemented in the current source code and are available in the running app:

- Dashboard summary cards with live product metrics and analytics
- Customer feedback management: add, edit, and delete entries
- Feedback analysis with sentiment classification, keyword extraction, and category grouping
- Feature prioritization scoring based on customer value, business impact, confidence, and strategic alignment
- Product roadmap planning with status filters and milestone tracking
- KPI analytics for satisfaction, feedback volume, adoption, resolution rate, and release progress
- PRD generation and preview with export options for Markdown/TXT and print support
- JSON import/export and demo data restoration
- Responsive interface with local browser persistence using localStorage

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

The app runs in the Vite development server and is typically available on the local URL shown in the terminal.

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
- `docs/screenshots/feedback-analysis.png`
- `docs/screenshots/roadmap.png`
- `docs/screenshots/prd.png`

## Project Structure

```text
.
├── src/
│   ├── App.jsx
│   ├── App.test.jsx
│   ├── index.css
│   ├── main.jsx
│   ├── test/
│   │   └── setup.js
│   └── utils/
│       ├── logic.js
│       └── logic.test.js
├── tests/
│   └── e2e.spec.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── playwright.config.js
├── .gitignore
├── README.md
└── dist/
```

## Notes

This project is a local portfolio-ready application and does not require external credentials or a hosted backend for the core experience.
