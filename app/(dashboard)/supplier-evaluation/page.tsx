'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Package, Users, FileText, Search, Plus, ChevronRight, FolderKanban } from 'lucide-react';
import { useVendors } from '@/lib/api/hooks/useVendors';
import { useAllSupplierEvaluationGroups } from '@/lib/api/hooks/useSupplierEvaluationGroups';

export default function SupplierEvaluationPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all evaluation groups across all projects
  const { data: allEvaluationGroups = [], isLoading: isLoadingGroups } = useAllSupplierEvaluationGroups();
  
  // Fetch vendors for active vendors count
  const vendorsQuery = useMemo(() => ({ status: 'active' as const, limit: 1000 }), []);
  const { data: vendorsData } = useVendors(vendorsQuery);

  const activeVendors = vendorsData?.total || vendorsData?.vendors?.length || 0;

  // Calculate statistics
  const totalEvaluations = Array.isArray(allEvaluationGroups) ? allEvaluationGroups.length : 0;
  const totalParts = Array.isArray(allEvaluationGroups) 
    ? allEvaluationGroups.reduce((acc, group) => acc + (group.bomItemsCount || 0), 0)
    : 0;

  // Filter evaluation groups
  const filteredGroups = Array.isArray(allEvaluationGroups) 
    ? allEvaluationGroups.filter(group =>
        group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Stats cards
  const statsCards = [
    { title: 'Total Parts', value: totalParts, icon: Package },
    { title: 'Active Vendors', value: activeVendors, icon: Users },
    { title: 'Evaluations', value: totalEvaluations, icon: FileText }
  ];

  const handleNewEvaluation = () => {
    router.push('/projects');
  };

  const handleSelectEvaluationGroup = (groupId: string) => {
    const group = allEvaluationGroups.find(g => g.id === groupId);
    if (group?.projectId) {
      router.push(`/projects/${group.projectId}/supplier-evaluation`);
    }
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Evaluation"
        description="Process-based supplier matching and evaluation groups"
      />

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Evaluation Groups Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Evaluation Groups</h2>
            <p className="text-sm text-muted-foreground">Your supplier evaluations across all projects</p>
          </div>
          <Button onClick={handleNewEvaluation}>
            <Plus className="h-4 w-4 mr-2" />
            New Evaluation
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search evaluations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Groups List */}
        {isLoadingGroups ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-3"></div>
                  <div className="h-3 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'No matches found' : 'No evaluations yet'}
              </h3>
              {!searchTerm && (
                <p className="text-muted-foreground mb-6">
                  Create your first supplier evaluation by selecting a project
                </p>
              )}
              {!searchTerm && (
                <Button onClick={handleNewEvaluation}>
                  <FolderKanban className="h-4 w-4 mr-2" />
                  Browse Projects
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <EvaluationCard
                key={group.id}
                group={group}
                onSelectGroup={() => handleSelectEvaluationGroup(group.id)}
                onViewProject={() => handleViewProject(group.projectId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface EvaluationCardProps {
  group: any;
  onSelectGroup: () => void;
  onViewProject: () => void;
}

function EvaluationCard({ group, onSelectGroup, onViewProject }: EvaluationCardProps) {
  const partsCount = group.bomItemsCount || 0;
  const processesCount = group.processesCount || 0;

  // Get status info
  const status = (group.status || 'draft') as 'draft' | 'active' | 'completed' | 'archived';
  const statusColor: Record<'draft' | 'active' | 'completed' | 'archived', string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-100 text-gray-800'
  };
  const statusColorClass = statusColor[status] || 'bg-gray-100 text-gray-800';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-base leading-tight">
                {group.name || 'Unnamed Evaluation'}
              </h3>
              <Badge variant="outline" className={`text-xs capitalize ml-2 ${statusColorClass}`}>
                {status}
              </Badge>
            </div>
            
            {/* Project Info */}
            {group.projectName && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FolderKanban className="h-3 w-3" />
                <span>{group.projectName}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-medium text-sm">{partsCount}</div>
              <div className="text-muted-foreground">BOM Items</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-medium text-sm">{processesCount}</div>
              <div className="text-muted-foreground">Processes</div>
            </div>
          </div>

          {/* Description */}
          {group.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
          )}

          {/* Created Date */}
          <div className="text-xs text-muted-foreground">
            Created: {new Date(group.createdAt).toLocaleDateString()}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={onSelectGroup}
            >
              <ChevronRight className="h-3 w-3 mr-1" />
              View Details
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onViewProject}
            >
              <FolderKanban className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}