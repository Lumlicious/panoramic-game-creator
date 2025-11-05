# Project Decisions - Confirmed

**Date**: 2025-11-04
**Status**: ✅ All Confirmed - Ready for Implementation

## Critical Decisions

### 1. Project File Format
**Decision**: ✅ Directory bundle with `.pgc` extension
- Structure: `MyAdventure.pgc/` directory containing project.json + assets
- Benefits: Easy to debug, cross-platform, git-friendly
- Trade-off: User can modify contents, requires manual zip for sharing

### 2. Panoramic Image Formats (MVP)
**Decision**: ✅ Equirectangular only
- Single image, 2:1 aspect ratio
- Supported formats: JPG, PNG, WebP
- Resolution range: 2048-8192px width
- **Deferred**: Cubic panoramas (6-face)

### 3. Hotspot Polygon Constraints
**Decision**: ✅ Min 3 points, Max 20 points
- **Disallow crossing theta=±π seam** (back of sphere)
- Rationale: Simplifies triangulation, prevents edge cases
- Workaround for seam: Create two separate hotspots

## Important Decisions

### 4. Image Filename Strategy
**Decision**: ✅ Use Node ID as filename
- Format: `assets/panoramas/{nodeId}.{ext}`
- Example: `assets/panoramas/node-abc123.jpg`
- Prevents filename conflicts, clean structure

### 5. State Management
**Decision**: ✅ Zustand
- Lightweight, simple API
- Two stores: projectStore (data) + editorStore (UI state)

### 6. UI Component Library
**Decision**: ✅ shadcn/ui via official template
- Clone from `shadcn/shadcn-electron-app`
- Pre-configured with Tailwind + electron-vite
- Copy-paste components, full customization

## Minor Decisions

### 7. Thumbnail Specifications
**Decision**: ✅ 200x100 JPEG
- Generated with sharp library
- Stored in `assets/thumbnails/{nodeId}.jpg`

### 8. Camera Initial Direction
**Decision**: ✅ Look at positive X axis (right), horizon level
- Position: (0, 0, 0)
- Initial rotation: theta=0, phi=π/2

### 9. Default Hotspot Style
**Decision**: ✅ Red with semi-transparency
- Fill color: `#ff0000`
- Opacity: `0.3`
- Stroke color: `#ff0000`
- Stroke width: `2`

### 10. Graph Layout
**Decision**: ✅ Manual positioning (no auto-layout)
- User drags nodes to arrange
- Positions saved in project.json
- Auto-layout deferred to post-MVP

## Technology Stack - Final

### Core
- electron-vite (Electron + Vite integration)
- React 18 + TypeScript
- Tailwind CSS
- shadcn/ui components

### Key Libraries
- Three.js + React Three Fiber + Drei (panorama rendering + hotspots)
- React Flow (node graph)
- Zustand (state management)
- earcut (polygon triangulation)
- sharp (thumbnail generation)
- file-type (image validation)
- electron-store (app preferences)
- lodash-es (throttle utility)

## Configuration Constants

```typescript
SPHERE_RADIUS = 500
HOTSPOT_RADIUS = 499.5
DEFAULT_FOV = 75°
FOV_RANGE = 30° - 110°
MAX_NODES = 500
MAX_HOTSPOTS_PER_NODE = 50
MIN_POLYGON_POINTS = 3
MAX_POLYGON_POINTS = 20
IMAGE_ASPECT_RATIO = 2.0 (±5%)
IMAGE_WIDTH_RANGE = 2048 - 8192px
MAX_FILE_SIZE = 50MB
THUMBNAIL_SIZE = 200x100
```

## Next Steps

### Phase 1: Project Setup
1. Clone shadcn/shadcn-electron-app template
2. Install additional dependencies
3. Verify dev environment
4. Set up project structure

**Status**: Ready to begin implementation ✅

---

**All decisions locked**. If we need to change anything during development, we'll document it here.
