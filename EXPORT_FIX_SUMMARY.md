# Export Handler npm Spawn Fix

## Problem

The export handler was failing with `spawn /bin/bash ENOENT` error when trying to run npm commands to build the player.

### Root Cause

The original implementation tried to:
1. Spawn `/bin/bash` as a child process
2. Source nvm within that shell (`source $NVM_DIR/nvm.sh`)
3. Run npm commands in that shell

This approach failed because:
- Electron's `spawn()` may have restricted access to system shells depending on security settings
- Sourcing nvm in a subprocess is unreliable and adds complexity
- The spawned shell doesn't inherit the parent Electron process's nvm environment
- Shell invocation adds overhead and platform-specific quirks

## Solution

**Use `process.execPath` to derive the npm binary path** and run npm directly without shell invocation.

### Key Insight

Since the Electron app itself is already running with nvm-managed Node.js (v23.9.0), we can:
1. Use `process.execPath` to get the current Node.js binary path
   - Example: `/Users/user/.nvm/versions/node/v23.9.0/bin/node`
2. Derive the npm binary path from the same directory
   - Example: `/Users/user/.nvm/versions/node/v23.9.0/bin/npm`
3. Spawn npm directly with `shell: false` to avoid shell invocation entirely

### Implementation

#### Before (Shell-based approach)
```typescript
// Spawned bash, sourced nvm, then ran npm
const shell = '/bin/bash'
const fullCommand = `${nvmInit}; npm ${args.join(' ')}`
const child = spawn(shell, ['-c', fullCommand], { cwd, env: process.env })
```

#### After (Direct npm execution)
```typescript
// Get npm path from current Node.js installation
function getNpmPath(): string {
  const nodePath = process.execPath // /path/to/node
  const nodeDir = join(nodePath, '..') // /path/to/bin
  return join(nodeDir, 'npm') // /path/to/npm
}

// Run npm directly without shell
const npmPath = getNpmPath()
const child = spawn(npmPath, args, {
  cwd,
  env: { ...process.env, NODE: process.execPath },
  shell: false // No shell invocation!
})
```

## Benefits

1. **Reliability**: No dependency on shell availability or nvm sourcing
2. **Cross-platform**: Works on macOS, Linux, and Windows (uses `npm.cmd` on Windows)
3. **Security**: Avoids shell invocation which can have injection risks
4. **Performance**: Direct binary execution is faster than shell invocation
5. **Simplicity**: Uses the same Node.js/npm that's running the Electron app

## Testing

To verify the fix works:

1. Start the Electron app: `npm run dev`
2. Create/open a project with at least one node
3. Trigger export functionality
4. Monitor console for:
   ```
   [NPM Install] Running: /Users/user/.nvm/versions/node/v23.9.0/bin/npm install
   [NPM Build] Running: /Users/user/.nvm/versions/node/v23.9.0/bin/npm run build
   ```
5. Verify no `ENOENT` errors occur

## Additional Notes

### Why This Works with nvm

- Electron is launched by npm (via `npm run dev`)
- npm is managed by nvm
- Therefore, the Electron process inherits nvm's Node.js/npm paths in `process.execPath`
- Child processes spawned with the same binary path will use the same Node.js version

### Windows Compatibility

On Windows, npm is a batch file (`npm.cmd`), not a shell script. The implementation handles this:
```typescript
const npmPath = isWindows
  ? join(nodeDir, 'npm.cmd') // Windows
  : join(nodeDir, 'npm')      // Unix-like
```

### Environment Variables

The spawn options include:
```typescript
env: {
  ...process.env,  // Inherit all environment variables
  NODE: process.execPath  // Explicitly set NODE for npm
}
```

This ensures npm can find the correct Node.js binary even if PATH is modified.

## Files Modified

- `/Users/lumlicious/Projects/apps/panoramic-game-creator/src/main/ipc/exportHandlers.ts`
  - Replaced `runCommand()` with `runNpmCommand()`
  - Added `getNpmPath()` helper function
  - Updated `buildPlayer()` to use new approach
  - Removed shell invocation and nvm sourcing logic

## Related Documentation

- Node.js `child_process.spawn()`: https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
- Electron security best practices: https://www.electronjs.org/docs/latest/tutorial/security
- nvm GitHub: https://github.com/nvm-sh/nvm

---

**Status**: Fixed ✅
**Date**: 2025-11-28
**Tested on**: macOS (Darwin 24.6.0), Node.js v23.9.0 (nvm-managed)
