import { ProjectEventsCard } from '@/components/projects/ProjectEventsCard';

interface ProjectTabEventsProps {
  projectId: string;
}

export function ProjectTabEvents({ projectId }: ProjectTabEventsProps) {
  return (
    <div className="space-y-6">
      <ProjectEventsCard projectId={projectId} />
    </div>
  );
}
