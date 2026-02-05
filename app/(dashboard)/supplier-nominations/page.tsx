'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Package,
    Users,
    FileText,
    Search,
    Plus,
    ChevronRight,
    FolderKanban,
    TrendingUp,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { useProjects } from '@/lib/api/hooks/useProjects';
import { useSupplierNominations } from '@/lib/api/hooks/useSupplierNominations';
import {
    NominationStatus,
    getStatusColor,
    getStatusText,
    getNominationTypeLabel,
    type SupplierNominationSummary
} from '@/lib/api/supplier-nominations';

export default function SupplierNominationsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch all projects
    const { data: projectsData } = useProjects();
    const projects = projectsData?.projects || [];

    // Fetch nominations for all projects and aggregate them
    const allNominations = useMemo(() => {
        const nominations: Array<SupplierNominationSummary & { projectName?: string; projectId?: string }> = [];

        // Note: We can't use hooks conditionally in useMemo, so nominations are fetched
        // per-project in the ProjectNominationsCard component below

        return nominations;
    }, [projects]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalNominations = allNominations.length;
        const totalVendors = allNominations.reduce((sum, n) => sum + n.vendorCount, 0);
        const completedNominations = allNominations.filter(n => n.status === NominationStatus.COMPLETED || n.status === NominationStatus.APPROVED).length;
        const inProgressNominations = allNominations.filter(n => n.status === NominationStatus.IN_PROGRESS).length;

        return {
            totalNominations,
            totalVendors,
            completedNominations,
            inProgressNominations
        };
    }, [allNominations]);

    // Filter nominations
    const filteredNominations = allNominations.filter(nomination =>
        nomination.nominationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nomination.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats cards
    const statsCards = [
        {
            title: 'Total Nominations',
            value: stats.totalNominations,
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'Vendors Evaluated',
            value: stats.totalVendors,
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            title: 'Completed',
            value: stats.completedNominations,
            icon: CheckCircle2,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            title: 'In Progress',
            value: stats.inProgressNominations,
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
        }
    ];

    const handleNewNomination = () => {
        router.push('/projects');
    };

    const handleSelectNomination = (nominationId: string, projectId: string) => {
        router.push(`/projects/${projectId}/supplier-nominations/${nominationId}`);
    };

    const handleViewProject = (projectId: string) => {
        router.push(`/projects/${projectId}`);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Supplier Nominations"
                description="Manage and track supplier nominations across all projects"
            />

            {/* Overview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Nominations Section */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold">All Nominations</h2>
                        <p className="text-sm text-muted-foreground">Supplier nominations across all your projects</p>
                    </div>
                    <Button onClick={handleNewNomination}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Nomination
                    </Button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search nominations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Nominations List */}
                {projects.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No projects found</h3>
                            <p className="text-muted-foreground mb-6">
                                Create a project first to start supplier nominations
                            </p>
                            <Button onClick={() => router.push('/projects')}>
                                <FolderKanban className="h-4 w-4 mr-2" />
                                Go to Projects
                            </Button>
                        </CardContent>
                    </Card>
                ) : filteredNominations.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                                {searchTerm ? 'No matches found' : 'No nominations yet'}
                            </h3>
                            {!searchTerm && (
                                <>
                                    <p className="text-muted-foreground mb-6">
                                        Create your first supplier nomination by selecting a project
                                    </p>
                                    <Button onClick={handleNewNomination}>
                                        <FolderKanban className="h-4 w-4 mr-2" />
                                        Browse Projects
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNominations.map((nomination) => (
                            <NominationCard
                                key={nomination.id}
                                nomination={nomination}
                                onSelectNomination={() => handleSelectNomination(nomination.id, nomination.projectId!)}
                                onViewProject={() => handleViewProject(nomination.projectId!)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Projects with Nominations */}
            {projects.length > 0 && (
                <ProjectNominationsList
                    projects={projects}
                    onSelectNomination={handleSelectNomination}
                    onViewProject={handleViewProject}
                />
            )}
        </div>
    );
}

interface NominationCardProps {
    nomination: SupplierNominationSummary & { projectName?: string; projectId?: string };
    onSelectNomination: () => void;
    onViewProject: () => void;
}

function NominationCard({ nomination, onSelectNomination, onViewProject }: NominationCardProps) {
    const statusColor = getStatusColor(nomination.status);
    const statusText = getStatusText(nomination.status);
    const typeLabel = getNominationTypeLabel(nomination.nominationType);

    const statusColorClass = {
        gray: 'bg-gray-100 text-gray-800',
        blue: 'bg-blue-100 text-blue-800',
        green: 'bg-green-100 text-green-800',
        emerald: 'bg-emerald-100 text-emerald-800',
        red: 'bg-red-100 text-red-800',
    }[statusColor] || 'bg-gray-100 text-gray-800';

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="space-y-4">
                    {/* Header */}
                    <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-base leading-tight line-clamp-2">
                                {nomination.nominationName || 'Unnamed Nomination'}
                            </h3>
                            <Badge variant="outline" className={`text-xs capitalize shrink-0 ${statusColorClass}`}>
                                {statusText}
                            </Badge>
                        </div>

                        {/* Project Info */}
                        {nomination.projectName && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <FolderKanban className="h-3 w-3" />
                                <span className="truncate">{nomination.projectName}</span>
                            </div>
                        )}

                        {/* Type Badge */}
                        <Badge variant="secondary" className="text-xs">
                            {typeLabel}
                        </Badge>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="font-medium text-sm">{nomination.vendorCount}</div>
                            <div className="text-muted-foreground">Vendors</div>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                            <div className="font-medium text-sm">{nomination.completionPercentage}%</div>
                            <div className="text-muted-foreground">Complete</div>
                        </div>
                    </div>

                    {/* BOM Parts Count */}
                    {nomination.bomPartsCount !== undefined && nomination.bomPartsCount > 0 && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{nomination.bomPartsCount} BOM parts</span>
                        </div>
                    )}

                    {/* Created Date */}
                    <div className="text-xs text-muted-foreground">
                        Created: {new Date(nomination.createdAt).toLocaleDateString()}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={onSelectNomination}
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

interface ProjectNominationsListProps {
    projects: any[];
    onSelectNomination: (nominationId: string, projectId: string) => void;
    onViewProject: (projectId: string) => void;
}

function ProjectNominationsList({ projects, onSelectNomination, onViewProject }: ProjectNominationsListProps) {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold mb-2">Nominations by Project</h2>
                <p className="text-sm text-muted-foreground">Browse nominations organized by project</p>
            </div>

            <div className="space-y-4">
                {projects.map((project) => (
                    <ProjectNominationsCard
                        key={project.id}
                        project={project}
                        onSelectNomination={onSelectNomination}
                        onViewProject={onViewProject}
                    />
                ))}
            </div>
        </div>
    );
}

interface ProjectNominationsCardProps {
    project: any;
    onSelectNomination: (nominationId: string, projectId: string) => void;
    onViewProject: (projectId: string) => void;
}

function ProjectNominationsCard({ project, onSelectNomination, onViewProject }: ProjectNominationsCardProps) {
    const { data: nominationsData = [], isLoading } = useSupplierNominations(project.id);
    const nominations = Array.isArray(nominationsData) ? nominationsData : [];

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!nominations || nominations.length === 0) {
        return null; // Don't show projects with no nominations
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    {/* Project Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <FolderKanban className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{project.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {nominations.length} nomination{nominations.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewProject(project.id)}
                        >
                            View Project
                        </Button>
                    </div>

                    {/* Nominations List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {nominations.map((nomination) => (
                            <NominationCard
                                key={nomination.id}
                                nomination={{ ...nomination, projectName: project.name, projectId: project.id }}
                                onSelectNomination={() => onSelectNomination(nomination.id, project.id)}
                                onViewProject={() => onViewProject(project.id)}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
