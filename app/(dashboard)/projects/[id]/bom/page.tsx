'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  ArrowLeft,
  FileSpreadsheet,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';
import { useProject, useBOMs } from '@/lib/api/hooks';
import { BOMCreateDialog } from '@/components/features/bom';

export default function ProjectBOMList() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: bomsData, isLoading: bomsLoading, refetch } = useBOMs({ projectId: id });
  const boms = bomsData?.boms || [];

  // Auto-redirect to first BOM if exists, or auto-open create dialog if no BOMs
  useEffect(() => {
    if (!bomsLoading && boms.length > 0 && boms[0]) {
      // Redirect to the first BOM
      router.push(`/projects/${id}/bom/${boms[0].id}`);
    } else if (!bomsLoading && boms.length === 0 && !createDialogOpen) {
      // Auto-open create dialog when no BOMs exist
      setCreateDialogOpen(true);
    }
  }, [boms, bomsLoading, id, router, createDialogOpen]);

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/projects/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="BOM Management"
          description={`Manage Bills of Materials for ${project.name}`}
        >
          <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create BOM
          </Button>
        </PageHeader>
      </div>

      {/* BOM List */}
      {bomsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-4">Loading BOMs...</p>
        </div>
      ) : boms.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Bills of Materials</h2>
            </div>
            <Badge variant="secondary" className="text-sm">
              {boms.length} {boms.length === 1 ? 'BOM' : 'BOMs'}
            </Badge>
          </div>
          {boms.map((bom) => (
            <Card
              key={bom.id}
              className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-primary/50 hover:border-l-primary"
              onClick={() => router.push(`/projects/${id}/bom/${bom.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{bom.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          v{bom.version || '1.0'}
                        </Badge>
                      </div>
                      {bom.description && (
                        <p className="text-sm text-muted-foreground mb-1">{bom.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(bom.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/projects/${id}/bom/${bom.id}`);
                    }}
                  >
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground mt-4">Loading...</p>
        </div>
      )}

      {/* BOM Create Dialog */}
      <BOMCreateDialog
        projectId={id}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
