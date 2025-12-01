import { ProjectExecutionStageCard } from '@/components/projects/ProjectExecutionStageCard';
import { ProjectMilestonesCard } from '@/components/projects/ProjectMilestonesCard';
import { ProjectChecklistCard } from '@/components/projects/ProjectChecklistCard';
import { ProjectUpdatesCard } from '@/components/projects/ProjectUpdatesCard';
import { ProjectKeyDatesCard } from '@/components/projects/ProjectKeyDatesCard';

interface ProjectTabExecutionProps {
  project: {
    id: string;
    execution_stage?: string;
    execution_stage_entered_at?: string;
    churn_date?: string;
    churn_reason?: string;
    kickoff_date?: string;
    estimated_delivery_date?: string;
    actual_delivery_date?: string;
  };
  onRefetch: () => void;
}

export function ProjectTabExecution({ project, onRefetch }: ProjectTabExecutionProps) {
  return (
    <div className="space-y-6">
      {/* Top row: Execution Stage + Key Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectExecutionStageCard
            project={project}
            onUpdate={onRefetch}
          />
        </div>
        <ProjectKeyDatesCard
          projectId={project.id}
          kickoffDate={project.kickoff_date}
          estimatedDeliveryDate={project.estimated_delivery_date}
          actualDeliveryDate={project.actual_delivery_date}
          onUpdate={onRefetch}
        />
      </div>

      {/* Two column grid for Milestones and Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectMilestonesCard projectId={project.id} />
        <ProjectChecklistCard projectId={project.id} />
      </div>

      {/* Updates - Full Width for better readability */}
      <ProjectUpdatesCard projectId={project.id} />
    </div>
  );
}
