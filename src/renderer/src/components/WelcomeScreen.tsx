import { PlusIcon, FolderOpenIcon } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

/**
 * WelcomeScreen Component
 *
 * Full-screen welcome screen shown when no project is open.
 * Provides options to create a new project or open an existing one.
 */

export function WelcomeScreen() {
  const { newProject, openProject } = useProjectStore()

  const handleNewProject = async () => {
    try {
      await newProject()
    } catch (error) {
      console.error('Failed to create new project:', error)
    }
  }

  const handleOpenProject = async () => {
    try {
      await openProject()
    } catch (error) {
      console.error('Failed to open project:', error)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-6">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Panoramic Game Creator</h1>
          <p className="text-muted-foreground">Create immersive 360° adventure games</p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          {/* New Project Card */}
          <Card
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={handleNewProject}
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <PlusIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <CardTitle>New Project</CardTitle>
                  <CardDescription>Start from scratch</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Open Project Card */}
          <Card
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={handleOpenProject}
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FolderOpenIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <CardTitle>Open Project</CardTitle>
                  <CardDescription>Continue existing work</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
