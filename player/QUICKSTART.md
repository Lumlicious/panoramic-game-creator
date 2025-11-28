# Quick Start Guide

Get the player running in 3 minutes.

## 1. Install Dependencies

```bash
cd player
npm install
```

## 2. Add a Test Panorama (Optional)

Download a sample equirectangular panorama:
- Go to https://polyhaven.com/hdris
- Download any HDRI in JPG format
- Rename to `sample.jpg`
- Place in `public/assets/panoramas/sample.jpg`

Or skip this step - the app will work without it (just show black screen).

## 3. Start Dev Server

```bash
npm run dev
```

Opens http://localhost:3000

## 4. What You'll See

- Loading screen (2 seconds)
- Panorama view (or black if no image)
- Debug info (top-left): Node name and hotspot count
- Sample hotspot (red polygon in the view)

## 5. Test Navigation

Click on the red hotspot area to test navigation (it loops back to the same node in sample data).

## Next Steps

- Replace sample data in `src/App.tsx` with real game data
- Or wait for export functionality from editor (Phase 7 Step 5)
- Build for production: `npm run build`

## Common Issues

**Vite not found**: Run `npm install` first

**Port 3000 in use**: Edit `vite.config.ts` to change port

**TypeScript errors**: Run `npm run typecheck` to see details

**Black screen**: Normal if no panorama image provided

---

Ready for Phase 7 Step 4: Navigation System Testing
