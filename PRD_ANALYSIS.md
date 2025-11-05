# PRD Analysis & Reconciliation Report

**Date**: November 5, 2025
**Status**: Critical conflicts identified - requires discussion

---

## Executive Summary

The PRD.md represents a **significantly more ambitious scope** than the current plan.md. It introduces major new features (interactive nodes, audio system, game state management) and contains **critical conflicts** with existing technical decisions. This document identifies all conflicts and provides recommendations for reconciliation.

---

## 1. Major Scope Additions (Not in plan.md)

### 1.1 Interactive Nodes System ⚠️ NEW
**PRD Section 5**: Complete React component system for custom puzzles
- User writes custom React components
- GameContext API for state/inventory/navigation
- Component scaffolding generation
- Live preview in editor
- Props editor and state variable management

**Impact**: This is a **full game engine feature**, not just a panorama editor. Adds significant complexity.

**Timeline**: PRD allocates 4 weeks (Weeks 11-14)

**Recommendation**:
- ✅ Keep this feature - it's a key differentiator
- ⚠️ Make it Phase 6 or later (not MVP)
- Requires new IPC handlers, component bundler, runtime loader

---

### 1.2 Audio System ⚠️ NEW
**PRD Section 2.4**: Comprehensive audio management
- Per-node: Ambient music, ambient SFX, entry sound
- Per-hotspot: Hover SFX, click SFX
- Volume controls, fade in/out
- Web Audio API integration

**Impact**: Adds audio asset management, playback, UI controls

**Timeline**: PRD Phase 4 (Weeks 7-8)

**Recommendation**:
- ✅ Keep this feature - enhances immersion
- Add to plan.md as Phase 6 (after hotspots work)
- Requires audio upload, validation, UI controls

---

### 1.3 Game State Management ⚠️ NEW
**PRD Section 2.5**: Game engine features
- Global variables (boolean, number, string)
- Inventory system (item IDs)
- Conditional hotspot visibility
- Save/load game state in runtime

**Impact**: Transforms tool from editor to game engine

**Timeline**: PRD Phase 7 (Weeks 15+)

**Recommendation**:
- ✅ Keep but defer to Phase 7
- Essential for interactive nodes to be useful
- Add state management UI to properties panel

---

### 1.4 Preview Mode ⚠️ NEW
**PRD Section 2.7**: Player perspective testing
- First-person navigation
- Clickable hotspots
- Audio playback
- Debug overlay
- Camera rotation persistence

**Impact**: Requires full runtime implementation in editor

**Timeline**: PRD Phase 4 (Weeks 7-8)

**Recommendation**:
- ✅ Keep but simplify for MVP
- Essential for testing game flow
- Can reuse panorama viewer with hotspot click handlers

---

## 2. Critical Conflicts

### 2.1 Hotspot Rendering Architecture 🚨 CONFLICT

**PRD Approach (Section 6.8)**: SVG Overlay
```typescript
// Render polygons as SVG elements overlaid on Three.js canvas
// Convert spherical coords → screen coords each frame
// Update positions when camera moves
```
**Pros**: Easy styling, smooth edges, simpler implementation

**plan.md/TECHNICAL_SPEC.md Approach**: 3D Mesh Triangulation
```typescript
// Render as BufferGeometry on sphere surface
// Use earcut for triangulation on tangent plane
// Create MeshBasicMaterial with color/opacity
```
**Pros**: Accurate 3D positioning, no screen reprojection, proper occlusion

**Conflict Analysis**:
- These are **fundamentally different architectures**
- SVG overlay is 2D projection (can have distortion near edges)
- 3D mesh is accurate but more complex (earcut triangulation)
- plan.md already specified 3D mesh approach in detail

**Recommendation**:
- ❌ **Reject PRD's SVG approach**
- ✅ **Keep plan.md's 3D mesh approach**
- **Reason**: More technically accurate, properly handles sphere curvature, plan.md already has detailed implementation spec
- **Update PRD** to reflect 3D mesh rendering

---

### 2.2 Cubic Panoramas 🚨 CONFLICT

**PRD (Section 8, Phase 7)**: Lists cubic panoramas as "Advanced Features (Weeks 15+)"
```
Phase 7: Advanced Features (Weeks 15+)
- 🔲 Cubic panorama support
```

**Current Status**: ✅ **Already implemented in Phase 3**
- PanoramaSphere.tsx supports both equirectangular and cubic
- TestCubicLoader.tsx for testing
- Working correctly with proper face mapping

**Conflict**: PRD is outdated regarding cubic support

**Recommendation**:
- ✅ Update PRD Phase 1 to mark cubic support as complete
- ✅ Remove from Phase 7
- Note: Equirectangular support still needs implementation

---

### 2.3 Development Phases 🚨 CONFLICT

**PRD Phases** (Week-based):
1. Core Editor (Weeks 1-3)
2. Hotspot System (Weeks 4-5)
3. Graph View (Week 6)
4. Preview & Audio (Weeks 7-8)
5. Export & Polish (Weeks 9-10)
6. Interactive Nodes (Weeks 11-14)
7. Advanced Features (Weeks 15+)

**plan.md Phases** (Feature-based):
1. ✅ Project Setup (complete)
2. ✅ Basic App Layout (complete)
3. ✅ Panorama Viewer (complete - cubic only)
4. 📝 Hotspot Drawing System (next)
5. 📝 Node Management
6. 📝 Node Graph
7. 📝 Project Files
8. 📝 Game Export

**Conflicts**:
- Different phase ordering
- PRD includes features not in plan.md
- plan.md more granular, PRD more time-based
- Current progress (Phase 3 complete) doesn't map to PRD phases

**Recommendation**:
- ✅ Create unified phase plan combining both
- Keep plan.md's feature-based approach (clearer)
- Add PRD's new features as additional phases
- Update timeline estimates

---

### 2.4 Target User & Scope 🚨 CONFLICT

**PRD (Section 1.2)**:
> "Game developers comfortable with light front-end coding (React/TypeScript)"

**plan.md**: Treats it as a visual editor for non-programmers

**Conflict**: PRD assumes users will write React code (interactive nodes), plan.md assumes visual-only workflow

**Recommendation**:
- ✅ Embrace PRD's vision - interactive nodes are a killer feature
- Make interactive nodes **optional** - tool still useful without coding
- MVP should work for non-coders (panoramas + hotspots only)
- Interactive nodes as advanced feature for developers

---

## 3. Architecture Differences

### 3.1 File Structure

**PRD adds**:
- `assets/audio/` directory
- `assets/images/` directory (for interactive nodes)
- `interactive-nodes/` directory for .tsx components

**plan.md has**:
- `assets/panoramas/`
- `assets/thumbnails/`
- `.pgc-meta/`

**Recommendation**: ✅ Adopt PRD's expanded structure

---

### 3.2 Data Models

**PRD adds**:
- `GameState` interface (variables, inventory)
- `ProjectSettings` interface (more detailed)
- `NodeAudio`, `HotspotAudio`, `AudioAsset` interfaces
- `InteractiveNodeData` interface
- `HotspotConditions` interface

**plan.md has**:
- Basic `Node`, `Hotspot`, `Project` interfaces

**Recommendation**: ✅ Adopt PRD's expanded data models (add to types/)

---

### 3.3 IPC Channels

**PRD specifies** (Section 9.3):
```typescript
ipcMain.handle('component:create', async (event, name: string) => string)
ipcMain.handle('component:list', async () => string[])
ipcMain.handle('component:openExternal', async (event, path: string) => void)
ipcMain.handle('asset:upload', async (event, files: FileList) => Asset[])
```

**plan.md**: Doesn't specify IPC in detail

**Recommendation**: ✅ Add PRD's IPC channels to plan.md Phase 7

---

## 4. UI Layout Differences

### PRD Specifies:
- 3-pane layout with exact widths (280px left, 320px right)
- Specific color scheme with hex codes
- Detailed component breakdown
- Status bar at bottom

### plan.md:
- General layout description
- Uses shadcn components
- Less specific about dimensions

**Recommendation**: ✅ Adopt PRD's detailed UI spec (helps implementation)

---

## 5. Technical Specifications

### 5.1 Image Validation

**PRD (Section 9.1)**:
- Max: 4096x4096 per face / 8192x4096 equirect
- Formats: JPG, PNG, WebP

**plan.md**:
- Max: 8192px width
- Formats: JPG, PNG, WebP
- Aspect ratio: 2:1 ±5%

**Conflict**: Different max resolutions

**Recommendation**:
- ✅ Use PRD's limits (4096x4096 for cubic, 8192x4096 for equirect)
- More realistic for performance
- Update plan.md

---

### 5.2 Performance Targets

**PRD (Section 9.5)**:
| Metric | Target |
|--------|--------|
| Panorama rendering | 60fps |
| Hotspot ray-casting | <5ms per frame |
| Node switching | <200ms |
| Export time | <30s for 50 nodes |
| Memory usage | <500MB |
| Web bundle size | <50MB |

**plan.md**: Doesn't specify detailed targets

**Recommendation**: ✅ Add PRD's performance targets to plan.md

---

## 6. Missing from PRD (in plan.md)

### 6.1 Coordinate System Details
plan.md/TECHNICAL_SPEC.md has detailed spherical coordinate specifications, conversion utilities. PRD mentions it briefly but not in depth.

**Recommendation**: ✅ Keep TECHNICAL_SPEC.md's detailed coordinate system docs

---

### 6.2 Earcut Triangulation
plan.md specifies using earcut library for polygon triangulation. PRD doesn't mention this implementation detail.

**Recommendation**: ✅ Keep plan.md's triangulation approach

---

### 6.3 Seam Crossing Validation
plan.md specifies that hotspots cannot cross theta=±π boundary (MVP limitation). PRD doesn't mention this.

**Recommendation**: ✅ Add this limitation to PRD

---

## 7. Recommendations for Unified Plan

### Immediate Actions:

1. **✅ Update PRD.md**:
   - Change Section 6.8 hotspot rendering to 3D mesh approach
   - Move cubic panorama support from Phase 7 to Phase 1 (complete)
   - Add seam crossing limitation to Section 6.10
   - Update image resolution limits

2. **✅ Update plan.md**:
   - Add Phase 6: Audio System
   - Add Phase 7: Game State Management
   - Add Phase 8: Interactive Nodes System
   - Add Phase 9: Preview Mode
   - Add PRD's performance targets
   - Expand data models with PRD's interfaces

3. **✅ Update TECHNICAL_SPEC.md**:
   - Add audio system specifications
   - Add GameContext API specification
   - Add component bundling process
   - Add runtime player architecture

4. **✅ Create ROADMAP.md**:
   - Unified phase plan with timelines
   - MVP scope (Phases 1-5: no audio, no interactive nodes)
   - Post-MVP features (Phases 6-9)
   - Clear milestones

---

## 8. Proposed Unified Phase Plan

### MVP Scope (8-10 weeks)

**Phase 1: ✅ Project Setup** (Complete)
- Electron + React + Three.js
- Type definitions
- Configuration constants

**Phase 2: ✅ Basic App Layout** (Complete)
- 3-pane layout
- Toolbar, panels
- View switching

**Phase 3: ✅ Panorama Viewer** (Complete - Cubic only)
- Three.js scene with React Three Fiber
- OrbitControls with FOV zoom
- Cubic panorama support ✅
- TODO: Add equirectangular support

**Phase 4: 📝 Hotspot Drawing System** (Next - Weeks 4-5)
- 3D mesh rendering with earcut triangulation
- Raycasting for click detection
- Polygon drawing (click to add vertices)
- Vertex editing (drag, add, remove)
- Keyboard shortcuts (Delete, Escape, Enter)
- Hotspot selection and styling

**Phase 5: 📝 Node Management** (Week 6)
- Image upload and validation
- Thumbnail generation (sharp)
- Node CRUD operations
- Properties panel updates

**Phase 6: 📝 Node Graph** (Week 7)
- React Flow integration
- Display nodes with thumbnails
- Connections between nodes
- Drag to reposition

**Phase 7: 📝 Project File Operations** (Week 8)
- Save/load .pgc bundles
- Error handling
- Auto-save
- Recent projects

**Phase 8: 📝 Basic Export** (Weeks 9-10)
- Export to web bundle (HTML/JS/CSS)
- Runtime player (panorama + hotspot navigation only)
- No audio, no interactive nodes yet

### Post-MVP Features (10+ weeks)

**Phase 9: Audio System** (Weeks 11-12)
- Audio asset management
- Per-node ambient/entry sounds
- Per-hotspot SFX
- Volume controls

**Phase 10: Preview Mode** (Week 13)
- Player perspective in editor
- Test hotspot navigation
- Audio playback
- Debug overlay

**Phase 11: Game State Management** (Week 14-15)
- Variables system
- Inventory system
- Conditional hotspot visibility
- Save/load state in runtime

**Phase 12: Interactive Nodes** (Weeks 16-20)
- Component scaffolding
- GameContext API
- Live preview in editor
- Component bundling
- Runtime integration

**Phase 13: Polish & Distribution** (Weeks 21-22)
- Undo/redo
- Equirectangular panorama support
- Error boundary improvements
- Electron packaging
- Documentation

---

## 9. Questions for Discussion

1. **Should MVP include audio?**
   - PRD: Yes (Phase 4)
   - Recommendation: No, defer to Phase 9 (simpler MVP)

2. **Should MVP include equirectangular panoramas?**
   - PRD: Yes (Phase 1)
   - Current: Only cubic implemented
   - Recommendation: Add to Phase 3 (shouldn't be too complex)

3. **Is interactive nodes system in scope for initial release?**
   - PRD: Yes (Phase 6)
   - Recommendation: Yes, but not MVP - defer to Phase 12
   - It's a killer feature but adds 4+ weeks

4. **Should hotspots be 3D mesh or SVG overlay?**
   - **Decision: 3D mesh** (more accurate, plan.md already specifies this)

5. **What's the actual timeline?**
   - PRD says 22+ weeks for full feature set
   - MVP (Phases 1-8): 10 weeks
   - Reasonable given scope?

6. **Should we support seam crossing?**
   - plan.md says no (MVP limitation)
   - PRD doesn't mention this
   - Recommendation: Keep as limitation, document clearly

---

## 10. Critical Path Issues

### Issue 1: Hotspot Rendering Architecture Decision
**Blocker**: Need to decide 3D mesh vs SVG before Phase 4
**Recommendation**: 3D mesh (already decided in plan.md)

### Issue 2: Equirectangular Support
**Question**: When to implement equirectangular?
**Options**:
  a) Now (before Phase 4)
  b) Phase 13 (after MVP)
**Recommendation**: Add to Phase 3 (relatively simple, completes panorama viewer)

### Issue 3: Interactive Nodes Complexity
**Question**: Can we deliver this in 4 weeks?
**Concern**: Component bundling, GameContext, runtime loading is complex
**Recommendation**: Phase 12 (16-20 weeks), thoroughly plan architecture first

---

## 11. Next Steps

1. **Review this analysis** with user
2. **Resolve conflicts** (especially hotspot rendering)
3. **Update documentation**:
   - PRD.md (hotspot rendering, cubic status, limitations)
   - plan.md (add audio, state, interactive nodes phases)
   - TECHNICAL_SPEC.md (add new system specs)
4. **Create ROADMAP.md** with unified timeline
5. **Continue Phase 4** (Hotspot Drawing System) once conflicts resolved

---

## Summary

The PRD is **excellent and comprehensive**, but represents a much larger scope than currently documented. Main actions:

1. ✅ Adopt PRD's expanded feature set (audio, state, interactive nodes)
2. ✅ Keep plan.md's 3D mesh hotspot rendering approach
3. ✅ Update PRD to reflect cubic panoramas already implemented
4. ✅ Create unified roadmap with MVP (10 weeks) and post-MVP phases
5. ✅ Add equirectangular support to Phase 3 before moving to Phase 4
6. ⚠️ Acknowledge this is now a 20+ week project, not an 8-week project

**Estimated Timeline**:
- MVP (panorama editor with hotspots + export): 10 weeks
- Full feature set (audio + state + interactive nodes): 22 weeks

---

**Status**: Awaiting user decisions on conflicts before updating documentation.
