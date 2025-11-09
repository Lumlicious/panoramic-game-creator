import { AppLayout } from '@/components/layout/AppLayout'
import { WelcomeScreen } from '@/components/WelcomeScreen'
import { useProjectStore } from '@/stores/projectStore'

/**
 * Main App Component
 *
 * Entry point for the Panoramic Game Creator application.
 * Conditionally renders:
 * - WelcomeScreen when no project is open (projectPath is null)
 * - AppLayout when a project is loaded (projectPath exists)
 *
 * State-driven navigation - React automatically switches views when
 * projectPath changes in the Zustand store.
 */

function App(): JSX.Element {
  const projectPath = useProjectStore((state) => state.projectPath)

  // No project open - show welcome screen
  if (!projectPath) {
    return <WelcomeScreen />
  }

  // Project open - show editor
  return <AppLayout />
}

export default App
