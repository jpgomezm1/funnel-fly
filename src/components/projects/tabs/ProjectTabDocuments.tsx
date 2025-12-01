import { ProjectDocumentsCard } from '@/components/projects/ProjectDocumentsCard';

interface ProjectTabDocumentsProps {
  projectId: string;
}

export function ProjectTabDocuments({ projectId }: ProjectTabDocumentsProps) {
  return (
    <div className="max-w-4xl">
      <ProjectDocumentsCard projectId={projectId} />
    </div>
  );
}
