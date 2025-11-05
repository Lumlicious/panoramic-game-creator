# Technical Specification - Panoramic Game Creator

This document provides detailed technical specifications, answers to open questions, and implementation guidance for the Panoramic Game Creator project.

## Table of Contents
1. [Core Technical Decisions](#core-technical-decisions)
2. [Coordinate System Specification](#coordinate-system-specification)
3. [Polygon Rendering on Sphere](#polygon-rendering-on-sphere)
4. [Vertex Dragging Implementation](#vertex-dragging-implementation)
5. [Project File Format](#project-file-format)
6. [File Path Resolution](#file-path-resolution)
7. [Camera Configuration](#camera-configuration)
8. [Hotspot Interaction System](#hotspot-interaction-system)
9. [Image Specifications](#image-specifications)
10. [Performance Limits](#performance-limits)
11. [Error Handling Strategy](#error-handling-strategy)
12. [Keyboard Shortcuts](#keyboard-shortcuts)
13. [Complete Dependencies](#complete-dependencies)

---

## Core Technical Decisions

### 1. Sphere Configuration
```typescript
export const SPHERE_CONFIG = {
  RADIUS: 500,                    // Base sphere radius
  HOTSPOT_RADIUS: 499.5,          // Hotspot geometry radius (0.1% smaller to prevent z-fighting)
  SEGMENTS: 64,                   // Sphere geometry segments (balance quality/performance)

  // Coordinate system
  THETA_RANGE: [-Math.PI, Math.PI],     // Azimuthal angle (horizontal)
  PHI_RANGE: [0, Math.PI],              // Polar angle (vertical)

  // Orientation
  THETA_ZERO: 'POSITIVE_X',       // theta=0 points to positive X axis (right)
  PHI_ZERO: 'POSITIVE_Y',         // phi=0 points to positive Y axis (top)
  COORDINATE_SYSTEM: 'RIGHT_HANDED',
} as const;
```

**Rationale**:
- Radius 500 provides good precision for calculations
- 64 segments balances visual quality with performance
- Standard spherical coordinates align with Three.js conventions

### 2. Project File Format: Directory Bundle (macOS Bundle Style)

**Decision**: Use `.pgc` as a directory, treated as a bundle on macOS and as a regular directory on other platforms.

**Structure**:
```
MyAdventure.pgc/
├── project.json                 # Manifest with relative paths
├── assets/
│   ├── panoramas/
│   │   ├── node-abc123.jpg
│   │   ├── node-def456.jpg
│   │   └── ...
│   └── thumbnails/
│       ├── node-abc123.jpg
│       └── node-def456.jpg
└── .pgc-meta/
    └── version.txt              # File format version
```

**Implementation**:
```typescript
// Save project
async function saveProject(project: Project, targetPath: string) {
  const pgcPath = targetPath.endsWith('.pgc') ? targetPath : `${targetPath}.pgc`;

  // Create directory structure
  await fs.mkdir(pgcPath, { recursive: true });
  await fs.mkdir(path.join(pgcPath, 'assets', 'panoramas'), { recursive: true });
  await fs.mkdir(path.join(pgcPath, 'assets', 'thumbnails'), { recursive: true });
  await fs.mkdir(path.join(pgcPath, '.pgc-meta'), { recursive: true });

  // Write version file
  await fs.writeFile(
    path.join(pgcPath, '.pgc-meta', 'version.txt'),
    '1.0.0'
  );

  // Copy panorama images with node ID as filename
  for (const node of project.nodes) {
    const sourceImage = node.panorama.filePath;
    const ext = path.extname(sourceImage);
    const destImage = path.join(pgcPath, 'assets', 'panoramas', `${node.id}${ext}`);
    await fs.copyFile(sourceImage, destImage);

    // Update node to use relative path
    node.panorama.filePath = `assets/panoramas/${node.id}${ext}`;
  }

  // Save project.json
  await fs.writeFile(
    path.join(pgcPath, 'project.json'),
    JSON.stringify(project, null, 2)
  );
}
```

**File Dialog Handling**:
```typescript
// Electron main process
ipcMain.handle('project:save', async (event, project) => {
  const result = await dialog.showSaveDialog({
    title: 'Save Project',
    defaultPath: `${project.name}.pgc`,
    properties: ['createDirectory', 'showOverwriteConfirmation'],
    // Don't use filters - let user create directory
  });

  if (!result.canceled && result.filePath) {
    return await saveProject(project, result.filePath);
  }
});

ipcMain.handle('project:open', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Project',
    properties: ['openDirectory'],
    filters: [
      { name: 'Panoramic Game Creator Projects', extensions: ['pgc'] }
    ]
  });

  if (!result.canceled && result.filePaths[0]) {
    return await loadProject(result.filePaths[0]);
  }
});
```

**Pros**:
- Easy to inspect/debug (files visible in explorer)
- No compression overhead
- Easy to add/remove individual assets
- Cross-platform compatible
- Git-friendly for development

**Cons**:
- User might accidentally modify contents
- Harder to share (need to zip manually)

**Alternative (Phase 2)**: Add "Export as Archive" feature to create `.pgcz` (zipped `.pgc` directory)

---

## Coordinate System Specification

### Spherical Coordinates Definition

```typescript
interface SphericalPoint {
  theta: number;  // Azimuthal angle [-π, π]
  phi: number;    // Polar angle [0, π]
}

// Visualization:
//        Y (phi=0)
//        |
//        |
//        +------ X (theta=0)
//       /
//      /
//     Z (theta=π/2)

// Conversions
export function sphericalToCartesian(
  spherical: SphericalPoint,
  radius: number = SPHERE_CONFIG.RADIUS
): THREE.Vector3 {
  const { theta, phi } = spherical;

  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),  // X
    radius * Math.cos(phi),                     // Y
    radius * Math.sin(phi) * Math.sin(theta)   // Z
  );
}

export function cartesianToSpherical(position: THREE.Vector3): SphericalPoint {
  const radius = position.length();

  return {
    theta: Math.atan2(position.z, position.x),
    phi: Math.acos(position.y / radius)
  };
}

// Normalize theta to [-π, π]
export function normalizeTheta(theta: number): number {
  let normalized = theta % (2 * Math.PI);
  if (normalized > Math.PI) normalized -= 2 * Math.PI;
  if (normalized < -Math.PI) normalized += 2 * Math.PI;
  return normalized;
}

// Clamp phi to [0, π]
export function clampPhi(phi: number): number {
  return Math.max(0, Math.min(Math.PI, phi));
}
```

### Handling Seam Discontinuity

When hotspots cross theta = ±π boundary:

```typescript
// Check if polygon crosses the seam
function crossesSeam(points: SphericalPoint[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const delta = Math.abs(points[i].theta - points[i + 1].theta);
    if (delta > Math.PI) return true;
  }
  return false;
}

// Split polygon into two if it crosses seam
function splitPolygonAtSeam(points: SphericalPoint[]): SphericalPoint[][] {
  // For MVP: Disallow polygons that cross the seam
  // Show error to user: "Hotspots cannot cross the back seam"
  // Future: Implement polygon splitting algorithm
  return [points];
}
```

**MVP Decision**: Disallow hotspots that cross the seam. Add validation in drawing mode.

---

## Polygon Rendering on Sphere

### Challenge
THREE.Shape works on 2D planes, but we need polygons on a sphere surface.

### Solution: Project to Tangent Plane + Triangulate + Map Back

```typescript
import earcut from 'earcut';

export function createHotspotMesh(
  sphericalPoints: SphericalPoint[],
  style: HotspotStyle
): THREE.Mesh {
  // 1. Convert to 3D cartesian
  const cartesianPoints = sphericalPoints.map(sp =>
    sphericalToCartesian(sp, SPHERE_CONFIG.HOTSPOT_RADIUS)
  );

  // 2. Calculate centroid and normal (for tangent plane)
  const centroid = new THREE.Vector3();
  cartesianPoints.forEach(p => centroid.add(p));
  centroid.divideScalar(cartesianPoints.length);

  const normal = centroid.clone().normalize();

  // 3. Create tangent plane coordinate system
  const tangentU = new THREE.Vector3();
  const tangentV = new THREE.Vector3();

  // Choose arbitrary perpendicular vector
  const arbitrary = Math.abs(normal.y) < 0.9
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);

  tangentU.crossVectors(normal, arbitrary).normalize();
  tangentV.crossVectors(normal, tangentU).normalize();

  // 4. Project 3D points to 2D tangent plane
  const points2D: number[] = [];
  cartesianPoints.forEach(point => {
    const localPoint = point.clone().sub(centroid);
    const u = localPoint.dot(tangentU);
    const v = localPoint.dot(tangentV);
    points2D.push(u, v);
  });

  // 5. Triangulate using earcut
  const triangles = earcut(points2D);

  // 6. Create geometry from triangulated mesh
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];

  for (let i = 0; i < triangles.length; i++) {
    const idx = triangles[i];
    const point = cartesianPoints[idx];
    vertices.push(point.x, point.y, point.z);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();

  // 7. Create material
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(style.fillColor),
    transparent: true,
    opacity: style.opacity,
    side: THREE.DoubleSide,
    depthWrite: false, // Prevent z-fighting
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.hotspotId = crypto.randomUUID();

  return mesh;
}
```

### Add Outline/Stroke

```typescript
export function createHotspotOutline(
  sphericalPoints: SphericalPoint[],
  style: HotspotStyle
): THREE.Line {
  const cartesianPoints = sphericalPoints.map(sp =>
    sphericalToCartesian(sp, SPHERE_CONFIG.HOTSPOT_RADIUS)
  );

  // Close the loop
  const vertices: number[] = [];
  [...cartesianPoints, cartesianPoints[0]].forEach(p => {
    vertices.push(p.x, p.y, p.z);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(style.strokeColor),
    linewidth: style.strokeWidth, // Note: may not work on all platforms
  });

  return new THREE.Line(geometry, material);
}
```

**Dependency**: Add `earcut` to package.json

---

## Vertex Dragging Implementation

### Challenge
Dragging 3D vertices while constraining to sphere surface.

### Solution: Custom Drag Handler with Sphere Constraint

```typescript
export function useSphereVertexDragging() {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    vertexIndex: number | null;
    hotspotId: string | null;
  }>({ isDragging: false, vertexIndex: null, hotspotId: null });

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const startDrag = (hotspotId: string, vertexIndex: number) => {
    setDragState({ isDragging: true, vertexIndex, hotspotId });
  };

  const onPointerMove = useCallback((event: PointerEvent, camera: THREE.Camera, sphereMesh: THREE.Mesh) => {
    if (!dragState.isDragging) return;

    // Update mouse position
    mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast to sphere
    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObject(sphereMesh);

    if (intersects.length > 0) {
      const newPosition = intersects[0].point;
      const spherical = cartesianToSpherical(newPosition);

      // Update hotspot vertex
      updateHotspotVertex(dragState.hotspotId!, dragState.vertexIndex!, spherical);
    }
  }, [dragState]);

  const endDrag = () => {
    setDragState({ isDragging: false, vertexIndex: null, hotspotId: null });
  };

  return { dragState, startDrag, onPointerMove, endDrag };
}
```

### Vertex Marker Component

```typescript
export function VertexMarker({
  position,
  index,
  hotspotId,
  isSelected,
  onStartDrag
}: VertexMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerDown={(e) => {
        e.stopPropagation();
        onStartDrag(hotspotId, index);
      }}
    >
      <sphereGeometry args={[2, 16, 16]} />
      <meshBasicMaterial
        color={isSelected ? "#00ff00" : "#ffffff"}
        opacity={0.9}
        transparent
      />
    </mesh>
  );
}
```

---

## File Path Resolution

### Strategy

**Storage**: Always store relative paths in project.json
**Loading**: Resolve relative to project directory

```typescript
// Types
interface ImageReference {
  relativePath: string;  // "assets/panoramas/node-123.jpg"
  absolutePath?: string; // Resolved at runtime, not serialized
}

// Main process - Image loading
ipcMain.handle('image:load', async (event, projectPath: string, relativePath: string) => {
  const absolutePath = path.join(projectPath, relativePath);

  // Verify file exists
  if (!await fs.pathExists(absolutePath)) {
    throw new Error(`Image not found: ${relativePath}`);
  }

  // Return file:// URL for renderer to load
  return `file://${absolutePath}`;
});

// Renderer process - Loading texture
async function loadPanoramaTexture(node: Node, projectPath: string): Promise<THREE.Texture> {
  const imageUrl = await window.electronAPI.image.load(
    projectPath,
    node.panorama.filePath
  );

  const loader = new THREE.TextureLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      imageUrl,
      (texture) => resolve(texture),
      undefined,
      (error) => reject(error)
    );
  });
}
```

### Image Import Process

```typescript
// When user selects panorama image:
async function importPanoramaImage(sourceFilePath: string, nodeId: string, projectPath: string) {
  // 1. Validate image
  const validation = await validateImage(sourceFilePath);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Generate destination path
  const ext = path.extname(sourceFilePath);
  const relativePath = `assets/panoramas/${nodeId}${ext}`;
  const destPath = path.join(projectPath, relativePath);

  // 3. Ensure directory exists
  await fs.mkdir(path.dirname(destPath), { recursive: true });

  // 4. Copy file
  await fs.copyFile(sourceFilePath, destPath);

  // 5. Generate thumbnail
  await generateThumbnail(destPath, nodeId, projectPath);

  // 6. Return relative path for storage
  return relativePath;
}
```

---

## Camera Configuration

### Camera Setup

```typescript
export const CAMERA_CONFIG = {
  FOV: 75,              // Default field of view (degrees)
  FOV_MIN: 30,          // Max zoom in
  FOV_MAX: 110,         // Max zoom out
  NEAR: 0.1,
  FAR: 2000,

  // Initial orientation
  INITIAL_ROTATION: {
    theta: 0,           // Look at positive X axis
    phi: Math.PI / 2,   // Look at horizon
  }
} as const;
```

### Controls: Custom Implementation

**Decision**: Use **custom controls** built on OrbitControls foundation, with constraints.

```typescript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export function createPanoramaControls(
  camera: THREE.PerspectiveCamera,
  domElement: HTMLCanvasElement
): OrbitControls {
  const controls = new OrbitControls(camera, domElement);

  // Constrain rotation
  controls.enablePan = false;              // No panning
  controls.enableZoom = true;              // Scroll to zoom
  controls.enableRotate = true;            // Drag to rotate
  controls.enableDamping = true;           // Smooth movement
  controls.dampingFactor = 0.05;

  // Prevent camera from flipping
  controls.minPolarAngle = 0;              // Can look up to zenith
  controls.maxPolarAngle = Math.PI;        // Can look down to nadir

  // Zoom controls FOV instead of dolly
  controls.minDistance = SPHERE_CONFIG.RADIUS;
  controls.maxDistance = SPHERE_CONFIG.RADIUS;
  controls.target.set(0, 0, 0);            // Always look at center

  // Custom zoom behavior (adjust FOV)
  domElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY;
    camera.fov = THREE.MathUtils.clamp(
      camera.fov + delta * 0.05,
      CAMERA_CONFIG.FOV_MIN,
      CAMERA_CONFIG.FOV_MAX
    );
    camera.updateProjectionMatrix();
  });

  return controls;
}
```

---

## Hotspot Interaction System

### Priority Order

When multiple objects can be clicked, priority:
1. **Vertex markers** (if editing mode)
2. **Hotspot meshes** (if edit mode or normal mode)
3. **Sphere surface** (for drawing new points)

### Implementation

```typescript
export function useHotspotInteraction(
  sphereMesh: THREE.Mesh,
  hotspotMeshes: THREE.Mesh[],
  vertexMarkers: THREE.Mesh[],
  mode: 'normal' | 'drawing' | 'editing'
) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const onClick = (event: MouseEvent, camera: THREE.Camera) => {
    // Normalize mouse coords
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Priority 1: Vertex markers
    if (mode === 'editing' && vertexMarkers.length > 0) {
      const vertexHits = raycaster.intersectObjects(vertexMarkers);
      if (vertexHits.length > 0) {
        handleVertexClick(vertexHits[0]);
        return;
      }
    }

    // Priority 2: Hotspots
    if (hotspotMeshes.length > 0) {
      const hotspotHits = raycaster.intersectObjects(hotspotMeshes);
      if (hotspotHits.length > 0) {
        handleHotspotClick(hotspotHits[0]);
        return;
      }
    }

    // Priority 3: Sphere (for drawing)
    if (mode === 'drawing') {
      const sphereHits = raycaster.intersectObject(sphereMesh);
      if (sphereHits.length > 0) {
        handleSphereClick(sphereHits[0]);
        return;
      }
    }
  };

  return { onClick };
}
```

### Hover Performance

Throttle hover detection to avoid excessive raycasting:

```typescript
import { throttle } from 'lodash-es'; // or implement custom

const onPointerMove = throttle((event: PointerEvent) => {
  // Update hover state
  const hoveredHotspot = detectHoveredHotspot(event);
  setHoveredHotspotId(hoveredHotspot?.id || null);
}, 16); // ~60fps
```

### Overlapping Hotspots

If multiple hotspots overlap, the one closest to camera wins (first in raycaster results).

**Future enhancement**: Z-order property to override depth sorting.

---

## Image Specifications

### Supported Formats

```typescript
export const IMAGE_SPECS = {
  FORMATS: ['jpg', 'jpeg', 'png', 'webp'] as const,

  // Equirectangular
  EQUIRECT: {
    ASPECT_RATIO: 2.0,          // Width must be 2x height
    ASPECT_TOLERANCE: 0.05,      // ±5% tolerance
    MIN_WIDTH: 2048,
    MAX_WIDTH: 8192,
    RECOMMENDED_WIDTH: 4096,
  },

  // Cubic (future)
  CUBIC: {
    FACE_ASPECT_RATIO: 1.0,
    MIN_SIZE: 1024,
    MAX_SIZE: 4096,
  },

  // General
  MAX_FILE_SIZE_MB: 50,
} as const;
```

### Image Validation

```typescript
import { fileTypeFromFile } from 'file-type';
import sharp from 'sharp'; // For thumbnail generation in main process

export async function validateImage(filePath: string): Promise<ValidationResult> {
  // Check file type
  const fileType = await fileTypeFromFile(filePath);
  if (!fileType || !IMAGE_SPECS.FORMATS.includes(fileType.ext as any)) {
    return { valid: false, error: `Unsupported format: ${fileType?.ext}` };
  }

  // Check file size
  const stats = await fs.stat(filePath);
  const sizeMB = stats.size / (1024 * 1024);
  if (sizeMB > IMAGE_SPECS.MAX_FILE_SIZE_MB) {
    return { valid: false, error: `File too large: ${sizeMB.toFixed(1)}MB (max ${IMAGE_SPECS.MAX_FILE_SIZE_MB}MB)` };
  }

  // Load image metadata
  const metadata = await sharp(filePath).metadata();
  const width = metadata.width!;
  const height = metadata.height!;
  const aspectRatio = width / height;

  // Check equirectangular aspect ratio
  const expectedAspect = IMAGE_SPECS.EQUIRECT.ASPECT_RATIO;
  const tolerance = IMAGE_SPECS.EQUIRECT.ASPECT_TOLERANCE;
  const minAspect = expectedAspect * (1 - tolerance);
  const maxAspect = expectedAspect * (1 + tolerance);

  if (aspectRatio < minAspect || aspectRatio > maxAspect) {
    return {
      valid: false,
      error: `Invalid aspect ratio: ${aspectRatio.toFixed(2)} (expected ~2.0 for equirectangular)`
    };
  }

  // Check resolution
  if (width < IMAGE_SPECS.EQUIRECT.MIN_WIDTH) {
    return { valid: false, error: `Image too small: ${width}px (min ${IMAGE_SPECS.EQUIRECT.MIN_WIDTH}px)` };
  }

  if (width > IMAGE_SPECS.EQUIRECT.MAX_WIDTH) {
    return { valid: false, error: `Image too large: ${width}px (max ${IMAGE_SPECS.EQUIRECT.MAX_WIDTH}px)` };
  }

  return { valid: true };
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}
```

### Thumbnail Generation

```typescript
// Main process
export async function generateThumbnail(
  sourceImagePath: string,
  nodeId: string,
  projectPath: string
): Promise<string> {
  const thumbnailPath = path.join(
    projectPath,
    'assets',
    'thumbnails',
    `${nodeId}.jpg`
  );

  await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });

  await sharp(sourceImagePath)
    .resize(200, 100, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

  return `assets/thumbnails/${nodeId}.jpg`;
}
```

**Dependency**: Add `sharp` and `file-type` to dependencies

---

## Performance Limits

### Hard Limits

```typescript
export const PERFORMANCE_LIMITS = {
  // Project limits
  MAX_NODES: 500,                // Hard limit
  RECOMMENDED_NODES: 100,        // Soft warning

  // Per-node limits
  MAX_HOTSPOTS_PER_NODE: 50,
  RECOMMENDED_HOTSPOTS_PER_NODE: 20,

  // Hotspot limits
  MIN_POLYGON_POINTS: 3,
  MAX_POLYGON_POINTS: 20,        // Prevent performance issues

  // Image limits
  MAX_TEXTURE_SIZE: 8192,        // WebGL max texture size

  // Interaction
  HOVER_THROTTLE_MS: 16,         // ~60fps
  RAYCAST_THROTTLE_MS: 16,
} as const;
```

### Validation

```typescript
export function validateHotspot(points: SphericalPoint[]): ValidationResult {
  if (points.length < PERFORMANCE_LIMITS.MIN_POLYGON_POINTS) {
    return { valid: false, error: 'Hotspot must have at least 3 points' };
  }

  if (points.length > PERFORMANCE_LIMITS.MAX_POLYGON_POINTS) {
    return { valid: false, error: `Too many points: ${points.length} (max ${PERFORMANCE_LIMITS.MAX_POLYGON_POINTS})` };
  }

  if (crossesSeam(points)) {
    return { valid: false, error: 'Hotspot cannot cross the back seam (theta = ±π)' };
  }

  return { valid: true };
}
```

### Memory Management

```typescript
// Dispose textures when switching nodes
export function disposeTexture(texture: THREE.Texture | null) {
  if (texture) {
    texture.dispose();
  }
}

export function disposeGeometry(geometry: THREE.BufferGeometry | null) {
  if (geometry) {
    geometry.dispose();
  }
}

export function disposeMaterial(material: THREE.Material | THREE.Material[] | null) {
  if (!material) return;

  const materials = Array.isArray(material) ? material : [material];
  materials.forEach(mat => mat.dispose());
}

// Use in component cleanup
useEffect(() => {
  return () => {
    disposeTexture(panoramaTexture);
    hotspotMeshes.forEach(mesh => {
      disposeGeometry(mesh.geometry);
      disposeMaterial(mesh.material);
    });
  };
}, [nodeId]);
```

---

## Error Handling Strategy

### Error Categories

1. **User Errors** - Show in UI with clear message
2. **System Errors** - Show error dialog with details
3. **Fatal Errors** - Error boundary, offer to save & restart

### Toast Notification System

Use `shadcn/ui` Toast component:

```typescript
// lib/toast.ts
import { toast } from '@/components/ui/use-toast';

export const showError = (message: string, description?: string) => {
  toast({
    variant: 'destructive',
    title: message,
    description,
  });
};

export const showSuccess = (message: string) => {
  toast({
    title: message,
  });
};

export const showWarning = (message: string, description?: string) => {
  toast({
    variant: 'warning',
    title: message,
    description,
  });
};
```

### Error Boundary

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Offer to save project
    if (this.props.project) {
      this.attemptEmergencySave(this.props.project);
    }
  }

  async attemptEmergencySave(project: Project) {
    try {
      const savePath = path.join(
        app.getPath('documents'),
        `${project.name}-recovery-${Date.now()}.json`
      );
      await fs.writeJSON(savePath, project);
      this.setState({ recoverySavePath: savePath });
    } catch (e) {
      console.error('Failed to save recovery file:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          {this.state.recoverySavePath && (
            <p>Project saved to: {this.state.recoverySavePath}</p>
          )}
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### IPC Error Handling

```typescript
// Main process
ipcMain.handle('project:save', async (event, project: Project, savePath: string) => {
  try {
    await saveProject(project, savePath);
    return { success: true };
  } catch (error) {
    console.error('Save failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// Renderer process
async function handleSave() {
  const result = await window.electronAPI.project.save(project, savePath);

  if (result.success) {
    showSuccess('Project saved');
    setIsDirty(false);
  } else {
    showError('Failed to save project', result.error);
  }
}
```

### Missing Image Handling

```typescript
// When loading project
async function loadProject(projectPath: string): Promise<Project> {
  const project = await fs.readJSON(path.join(projectPath, 'project.json'));

  // Validate all image references
  const missingImages: string[] = [];

  for (const node of project.nodes) {
    const imagePath = path.join(projectPath, node.panorama.filePath);
    if (!await fs.pathExists(imagePath)) {
      missingImages.push(node.panorama.filePath);
    }
  }

  if (missingImages.length > 0) {
    // Show warning but allow opening
    showWarning(
      'Missing images',
      `${missingImages.length} panorama image(s) could not be found. Affected nodes will appear blank.`
    );
  }

  return project;
}
```

---

## Keyboard Shortcuts

### Essential for MVP

These are required for basic functionality:

```typescript
export const KEYBOARD_SHORTCUTS = {
  // File operations
  NEW_PROJECT: 'Ctrl+N / Cmd+N',
  OPEN_PROJECT: 'Ctrl+O / Cmd+O',
  SAVE_PROJECT: 'Ctrl+S / Cmd+S',
  SAVE_AS: 'Ctrl+Shift+S / Cmd+Shift+S',

  // Drawing/Editing (REQUIRED for Phase 4)
  DELETE: 'Delete / Backspace',       // Delete selected hotspot
  ESCAPE: 'Escape',                   // Cancel drawing mode / Deselect
  ENTER: 'Enter',                     // Finish polygon

  // Navigation
  TAB: 'Tab',                         // Switch between Editor/Graph view

  // Zoom
  ZOOM_IN: 'Ctrl+= / Cmd+=',
  ZOOM_OUT: 'Ctrl+- / Cmd+-',
  ZOOM_RESET: 'Ctrl+0 / Cmd+0',
} as const;
```

### Implementation

```typescript
// hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // File operations
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        handlers.onNewProject();
      }
      if (ctrl && e.key === 'o') {
        e.preventDefault();
        handlers.onOpenProject();
      }
      if (ctrl && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handlers.onSaveAs();
        } else {
          handlers.onSave();
        }
      }

      // Drawing/Editing
      if (e.key === 'Escape') {
        handlers.onEscape();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handlers.onDelete();
      }
      if (e.key === 'Enter') {
        handlers.onEnter();
      }

      // View
      if (e.key === 'Tab' && !ctrl) {
        e.preventDefault();
        handlers.onToggleView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
```

---

## Complete Dependencies

### package.json

```json
{
  "name": "panoramic-game-creator",
  "version": "0.1.0",
  "main": "dist-electron/main/index.js",
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.170.0",
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.117.0",
    "reactflow": "^11.11.4",
    "zustand": "^5.0.2",
    "uuid": "^11.0.3",
    "earcut": "^2.2.4",
    "file-type": "^18.7.0",
    "sharp": "^0.33.1",
    "electron-store": "^8.2.0",
    "lodash-es": "^4.17.21"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.170.0",
    "@types/uuid": "^10.0.0",
    "@types/earcut": "^2.1.4",
    "@types/lodash-es": "^4.17.12",
    "@vitejs/plugin-react": "^4.3.4",
    "electron": "^31.0.0",
    "electron-builder": "^24.13.3",
    "electron-vite": "^2.3.0",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "eslint": "^8.57.0"
  }
}
```

### Why Each Dependency

- **earcut**: Polygon triangulation for hotspot meshes
- **file-type**: Detect image format from file buffer
- **sharp**: High-performance thumbnail generation (main process)
- **electron-store**: Persist app preferences (recent files, window size)
- **lodash-es**: Throttle utility for performance optimization

---

## Additional Data Model Fields

### Updated Interfaces

```typescript
// Extended Project interface
interface Project {
  id: string;
  name: string;
  version: string;
  created: string;
  modified: string;
  startNodeId: string | null;
  nodes: Node[];
  settings: ProjectSettings;

  // NEW FIELDS
  filePath?: string;              // Absolute path to .pgc directory (runtime only, not saved)
  graphLayout?: GraphLayoutData;  // Node positions in graph view
}

interface GraphLayoutData {
  nodePositions: Record<string, { x: number; y: number }>;
  zoom: number;
  viewportX: number;
  viewportY: number;
}

// Extended Hotspot interface
interface Hotspot {
  id: string;
  name: string;
  targetNodeId: string;
  polygon: SphericalPoint[];
  style: HotspotStyle;

  // NEW FIELDS
  enabled: boolean;                    // Allow toggling hotspots on/off
  description?: string;                // For future tooltips
  transitionType?: 'instant' | 'fade'; // Future feature
}

// New interface for editor state
interface EditorState {
  selectedNodeId: string | null;
  selectedHotspotId: string | null;
  currentView: 'editor' | 'graph';
  drawingMode: DrawingMode;
  isDirty: boolean;                    // Has unsaved changes
}

type DrawingMode = 'none' | 'drawing' | 'editing';
```

---

## IPC Security & Type Safety

### Preload Script

```typescript
// electron/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  project: {
    new: () => ipcRenderer.invoke('project:new'),
    save: (project: unknown, savePath: string) =>
      ipcRenderer.invoke('project:save', project, savePath),
    saveAs: (project: unknown) =>
      ipcRenderer.invoke('project:saveAs', project),
    open: () =>
      ipcRenderer.invoke('project:open'),
  },
  file: {
    pickImage: () =>
      ipcRenderer.invoke('file:pickImage'),
  },
  image: {
    load: (projectPath: string, relativePath: string) =>
      ipcRenderer.invoke('image:load', projectPath, relativePath),
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
```

### Type Declarations

```typescript
// src/types/electron.d.ts
import { ElectronAPI } from '../../electron/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

---

## Testing Strategy (Brief)

### Unit Tests
- Coordinate conversion functions
- Polygon triangulation
- Validation functions
- State management stores

### Integration Tests
- Project save/load
- Image import
- Hotspot creation

### E2E Tests (Future)
- Complete workflow: create project → add node → draw hotspot → save → export

**Tools**: Vitest for unit tests, Playwright for E2E

---

## Development Workflow

### Hot Module Replacement
electron-vite provides HMR for renderer process. Main process requires restart.

### Debugging Three.js
```typescript
// Enable Three.js DevTools
if (import.meta.env.DEV) {
  window.__THREE__ = THREE;
}
```

Install browser extension: "Three.js Developer Tools"

### Logging
```typescript
// Use electron-log for production-ready logging
import log from 'electron-log';

log.info('Application started');
log.error('Error details:', error);

// Logs stored in:
// macOS: ~/Library/Logs/panoramic-game-creator/
// Windows: %USERPROFILE%\AppData\Roaming\panoramic-game-creator\logs\
```

---

## Platform-Specific Considerations

### macOS
- Use `.pgc` bundle (appears as file in Finder)
- Set `CFBundleTypeExtensions` in electron-builder config

### Windows
- `.pgc` will appear as folder
- Consider custom icon for folders

### Linux
- Similar to Windows
- Test on Ubuntu/Fedora

---

## Summary of Decisions

✅ **Sphere radius**: 500 units
✅ **Hotspot rendering**: Earcut triangulation on tangent plane
✅ **Vertex dragging**: Custom raycasting with sphere constraint
✅ **Project format**: Directory bundle (`.pgc`)
✅ **File paths**: Relative paths in JSON, resolved at runtime
✅ **Camera controls**: OrbitControls with FOV zoom
✅ **Coordinate system**: Standard spherical (theta: azimuth, phi: polar)
✅ **Image validation**: Aspect ratio check, format check, size limits
✅ **Thumbnail generation**: Sharp library, 200x100 JPEG
✅ **Keyboard shortcuts**: Include Delete, Escape, Enter in Phase 4
✅ **Dependencies**: Add earcut, sharp, file-type, electron-store
✅ **Error handling**: Toast notifications + error boundary
✅ **Seam crossing**: Disallow for MVP

---

**Last Updated**: 2025-11-04
**Status**: Technical Specification Complete
**Next Step**: Update plan.md and begin Phase 1 implementation
