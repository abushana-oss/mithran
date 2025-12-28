'use client';

import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/status-badge';
import {
  ArrowLeft,
  ClipboardList,
  DollarSign,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';
import { useProject, useBOMs } from '@/lib/api/hooks';
import { ProjectModules } from '@/components/features/projects/ProjectModules';

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const router = useRouter();

  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: sourcingListsData } = useBOMs({ projectId: id });
  const sourcingLists = sourcingListsData?.boms || [];
  const firstBomId = sourcingLists.length > 0 && sourcingLists[0] ? sourcingLists[0].id : undefined;

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={project.name}
          description={project.description || 'Project overview and cost management'}
        />
      </div>

      {/* Cost Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Project Status</p>
                <StatusBadge status={project.status} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Quoted Cost</p>
                <p className="text-xl font-bold text-foreground">
                  {project.quotedCost ? `$${Number(project.quotedCost).toLocaleString()}` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Should Cost</p>
                <p className="text-xl font-bold text-foreground">
                  {project.shouldCost ? `$${Number(project.shouldCost).toLocaleString()}` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active BOMs</p>
                <p className="text-xl font-bold text-foreground">{sourcingLists.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Modules */}
      <ProjectModules projectId={id} bomCount={sourcingLists.length} firstBomId={firstBomId} />
    </div>
  );
}
