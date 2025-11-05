# Panoramic Game Creator

A desktop application for creating panoramic point-and-click adventure games.

## About

Create immersive point-and-click games using 360° panoramic images. Draw hotspot areas that link between scenes and export playable games.

**Status**: In development (Phase 1 complete)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

## Installation

Install dependencies:

```bash
npm install
```

## Running the App

Start the development server:

```bash
npm run dev
```

This will launch the Electron application with hot-reload enabled.

## Documentation

- **[plan.md](./plan.md)** - Implementation roadmap
- **[TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)** - Detailed technical specifications
- **[DECISIONS.md](./DECISIONS.md)** - Technical decisions and rationale
- **[CLAUDE.md](./CLAUDE.md)** - Developer onboarding guide

## Tech Stack

- Electron + electron-vite
- React + TypeScript
- Three.js (panoramic rendering)
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- React Flow (node graph visualization)

## License

MIT
