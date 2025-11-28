# Panoramic Game Creator - Player

React + TypeScript + Three.js game player for panoramic point-and-click adventure games.

## Architecture

- **Framework**: React 18 + TypeScript
- **3D Rendering**: React Three Fiber + Three.js
- **State Management**: Zustand
- **Build Tool**: Vite
- **Deployment**: Static site (Vercel, Netlify, VPS, GitHub Pages)

## Project Structure

```
player/
├── src/
│   ├── components/
│   │   ├── GameEngine.tsx        # Top-level game coordinator
│   │   ├── PanoramaView.tsx      # Canvas container
│   │   └── three/                # Three.js components
│   │       ├── PanoramaSphere.tsx
│   │       ├── HotspotLayer.tsx
│   │       └── HotspotMesh.tsx
│   ├── stores/
│   │   └── gameStore.ts          # Zustand game state
│   ├── types/
│   │   └── game.ts               # TypeScript interfaces
│   ├── lib/
│   │   ├── coordinates.ts        # Coordinate conversions
│   │   ├── config.ts             # Constants
│   │   └── triangulation.ts     # Polygon rendering
│   ├── App.tsx                   # Main app component
│   └── main.tsx                  # React entry point
├── public/                       # Static assets
├── dist/                         # Build output (deploy this)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Development Setup

### 1. Install Dependencies

```bash
cd player
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

This will start Vite dev server at http://localhost:3000 with hot reload.

### 3. Test with Sample Data

The app includes sample game data in `src/App.tsx`. To test with real panoramas:

1. Place panorama images in `public/assets/panoramas/`
2. Update the URLs in the sample data

### 4. Build for Production

```bash
npm run build
```

Output goes to `dist/` directory.

## Game Data Format

The player expects a `game.json` file in `public/assets/data/`:

```json
{
  "version": "1.0.0",
  "settings": {
    "title": "My Panoramic Game",
    "startNodeId": "node-1"
  },
  "nodes": [
    {
      "id": "node-1",
      "name": "Start Location",
      "panorama": {
        "type": "equirectangular",
        "url": "./assets/panoramas/node-1.jpg"
      },
      "hotspots": [
        {
          "id": "hotspot-1",
          "name": "Go to Room 2",
          "polygon": [
            { "theta": 0.5, "phi": 1.3 },
            { "theta": 0.7, "phi": 1.3 },
            { "theta": 0.7, "phi": 1.7 },
            { "theta": 0.5, "phi": 1.7 }
          ],
          "targetNodeId": "node-2",
          "interactionType": "navigate"
        }
      ]
    }
  ]
}
```

## Deployment

### Vercel

```bash
npm run build
npx vercel --prod
```

### Netlify

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

### Static Hosting

1. Build: `npm run build`
2. Upload `dist/` contents to your web server
3. Ensure `index.html` is served for all routes

## Testing Locally

To test the built version locally:

```bash
npm run preview
```

This serves the production build at http://localhost:4173

## Controls

- **Mouse drag**: Rotate camera
- **Click hotspot**: Navigate to linked node
- **Debug info**: Top-left corner shows current node and hotspot count

## Asset Requirements

### Panorama Images

- **Format**: JPG, PNG, or WebP
- **Type**: Equirectangular (2:1 aspect ratio)
- **Resolution**: 4096x2048 recommended (2048-8192 width)
- **File size**: Under 10MB per image (optimize for web)

### File Paths

- Use relative paths: `./assets/panoramas/filename.jpg`
- Or CDN URLs: `https://cdn.example.com/panoramas/filename.jpg`

## Performance Optimization

The player includes:

- **Code splitting**: React/Three.js in separate chunks
- **Lazy loading**: Textures load on demand
- **Automatic cleanup**: Textures disposed when switching nodes
- **Efficient rendering**: Only current node rendered at a time

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL support.

## Troubleshooting

### Textures not loading

- Check browser console for CORS errors
- Ensure panorama URLs are accessible
- Verify file paths are correct (relative to `public/`)

### Black screen

- Check `game.json` format
- Verify `startNodeId` exists in nodes array
- Check browser console for errors

### Hotspots not clickable

- Ensure polygons have at least 3 points
- Verify `targetNodeId` exists
- Check coordinates are in valid range (theta: -π to π, phi: 0 to π)

## Future Features

Planned for later versions:

- Inventory system
- Dialog system
- Save/load game state
- Sound effects and ambient audio
- Touch controls for mobile
- VR mode

## Development Status

**Current Phase**: Phase 7 Step 3 - Initial GamePlayer Component ✅

**Next Steps**:
- Add texture caching and preloading
- Implement progressive loading (preload adjacent nodes)
- Create export functionality from editor
- Add CDN support for asset hosting

## License

Part of Panoramic Game Creator project.

---

**Last Updated**: 2025-11-18
