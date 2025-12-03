import { useEffect, useState } from 'react'
import { PlusIcon, FolderOpenIcon, ClockIcon } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { RecentProject } from '../../../shared/types/ipc'

/**
 * WelcomeScreen Component
 *
 * Full-screen welcome screen shown when no project is open.
 * Provides options to create a new project, open an existing one,
 * or quickly access recently opened projects.
 */

export function WelcomeScreen() {
  const { newProject, openProject, openProjectByPath } = useProjectStore()
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load recent projects on mount
  useEffect(() => {
    loadRecentProjects()
  }, [])

  const loadRecentProjects = async () => {
    try {
      const result = await window.recentProjectsAPI.getRecent()
      if (result.success && result.data) {
        setRecentProjects(result.data)
      }
    } catch (error) {
      console.error('Failed to load recent projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleOpenRecentProject = async (projectPath: string) => {
    try {
      const success = await openProjectByPath(projectPath)
      if (!success) {
        // Project might have been deleted - refresh the list
        await loadRecentProjects()
      }
    } catch (error) {
      console.error('Failed to open recent project:', error)
      // Refresh list in case of error
      await loadRecentProjects()
    }
  }

  // Format date for display
  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-2xl space-y-8 px-6">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Panoramic Game Creator</h1>
          <p className="text-muted-foreground">Create immersive 360° adventure games</p>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Actions */}
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

          {/* Right Column - Recent Projects */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground px-1">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Recent Projects</span>
            </div>

            {isLoading ? (
              <div className="text-sm text-muted-foreground px-1">Loading...</div>
            ) : recentProjects.length === 0 ? (
              <div className="text-sm text-muted-foreground px-1">
                No recent projects yet. Create your first project to get started!
              </div>
            ) : (
              <ScrollArea className="h-[240px] rounded-md border p-2">
                <div className="space-y-1">
                  {recentProjects.map((project) => (
                    <div
                      key={project.path}
                      className="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors hover:bg-accent"
                      onClick={() => handleOpenRecentProject(project.path)}
                    >
                      <span className="font-medium truncate">{project.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(project.lastOpened)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
