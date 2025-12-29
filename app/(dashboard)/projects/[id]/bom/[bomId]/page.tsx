'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/lib/api/hooks/useProjects';
import { useBOM } from '@/lib/api/hooks/useBOM';
import { useBOMItems, deleteBOMItem } from '@/lib/api/hooks/useBOMItems';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Plus,
  Download,
  Upload,
  Save,
  FileSpreadsheet,
  Settings,
  FileText,
  Box,
} from 'lucide-react';
import { BOMItemsFlat, BOMItemDialog, BOMTreeView, BOMItemDetailPanel } from '@/components/features/bom';
import { BOMItem } from '@/lib/api/hooks/useBOMItems';
import { BOMItemType } from '@/lib/types/bom.types';
import { toast } from 'sonner';

export default function 
BOMDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const bomId = params.bomId as string;

  const { data: project } = useProject(projectId);
  const { data: bomData } = useBOM(bomId);
  const { data: bomItemsData, refetch: refetchBOMItems } = useBOMItems(bomId);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [parentItemId, setParentItemId] = useState<string | null>(null);
  const [defaultItemType, setDefaultItemType] = useState<BOMItemType>(BOMItemType.ASSEMBLY);
  const [viewingItem, setViewingItem] = useState<BOMItem | null>(null);
  const [preferredView, setPreferredView] = useState<'2d' | '3d'>('3d');

  const bom = bomData || {
    id: bomId,
    name: 'Loading...',
    description: '',
    version: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Build tree structure from flat items list
  const buildTree = (items: any[]) => {
    const itemMap = new Map();
    const roots: any[] = [];

    // Create a map of all items
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Build the tree
    items.forEach(item => {
      const node = itemMap.get(item.id);
      if (item.parentItemId) {
        const parent = itemMap.get(item.parentItemId);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent not found, treat as root
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const bomItems = buildTree(bomItemsData?.items || []);

  // Calculate depth for each item
  const getItemDepth = (itemId: string, items: any[], visited = new Set<string>()): number => {
    if (visited.has(itemId)) return 0; // Cycle detected
    const item = items.find(i => i.id === itemId);
    if (!item || !item.parentItemId) return 0;
    visited.add(itemId);
    return 1 + getItemDepth(item.parentItemId, items, visited);
  };

  // Sort items to maintain hierarchy (parents before children)
  const getSortedItems = (items: any[]) => {
    const itemMap = new Map(items.map(item => [item.id, item]));
    const sorted: any[] = [];
    const added = new Set<string>();

    const addItem = (item: any) => {
      if (added.has(item.id)) return;

      // Add parent first if it exists
      if (item.parentItemId && itemMap.has(item.parentItemId)) {
        addItem(itemMap.get(item.parentItemId));
      }

      sorted.push(item);
      added.add(item.id);
    };

    items.forEach(item => addItem(item));
    return sorted;
  };

  // Auto-assign parent based on item type hierarchy
  const getAutoParentForType = (type: BOMItemType): string | null => {
    const flatItems = bomItemsData?.items || [];

    if (type === BOMItemType.ASSEMBLY) {
      // Assemblies are always top-level
      return null;
    }

    if (type === BOMItemType.SUB_ASSEMBLY) {
      // Sub-assemblies go under the most recent assembly
      const assemblies = flatItems.filter(item => item.itemType === 'assembly');
      return assemblies.length > 0 ? assemblies[assemblies.length - 1]?.id ?? null : null;
    }

    if (type === BOMItemType.CHILD_PART) {
      // Child parts go under the most recent sub-assembly
      const subAssemblies = flatItems.filter(item => item.itemType === 'sub_assembly');
      if (subAssemblies.length > 0) {
        return subAssemblies[subAssemblies.length - 1]?.id ?? null;
      }
      // If no sub-assembly, go under most recent assembly
      const assemblies = flatItems.filter(item => item.itemType === 'assembly');
      return assemblies.length > 0 ? assemblies[assemblies.length - 1]?.id ?? null : null;
    }

    return null;
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setParentItemId(null);
    setDefaultItemType(BOMItemType.ASSEMBLY); // Always create Assembly from main button
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setParentItemId(null);
    setItemDialogOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteBOMItem(id);
      await refetchBOMItems(); // Refresh the list
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete item');
      console.error('Delete error:', error);
    }
  };

  const handleAddTreeItem = (parentId: string | null, type: BOMItemType) => {
    setSelectedItem(null);
    setParentItemId(parentId);
    setDefaultItemType(type);
    setItemDialogOpen(true);
  };

  const handleViewItem = (item: BOMItem, viewType?: '2d' | '3d') => {
    setViewingItem(item);
    setPreferredView(viewType || '3d');
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={bom.name}
        description={bom.description}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/projects/${projectId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </PageHeader>

      {/* BOM Header Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>BOM Information</CardTitle>
              <CardDescription>Version: {bom.version}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Project</p>
              <p className="font-medium">{project?.name || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(bom.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">{new Date(bom.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Files - Hierarchical List */}
      {bomItemsData?.items && bomItemsData.items.some(item => item.file2dPath || item.file3dPath) && (
        <Card>
          <CardHeader>
            <CardTitle>Project Files</CardTitle>
            <CardDescription>All 2D drawings and 3D models in hierarchical order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0.5">
              {getSortedItems(bomItemsData.items)
                .filter(item => item.file2dPath || item.file3dPath)
                .map((item) => {
                  const depth = getItemDepth(item.id, bomItemsData.items);

                  // Get item type badge color
                  const getTypeColor = (type: string) => {
                    switch (type) {
                      case 'assembly':
                        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
                      case 'sub_assembly':
                        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
                      case 'child_part':
                        return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
                      default:
                        return 'bg-muted text-muted-foreground border-muted';
                    }
                  };

                  const getTypeLabel = (type: string) => {
                    switch (type) {
                      case 'assembly':
                        return 'Assembly';
                      case 'sub_assembly':
                        return 'Sub-Assembly';
                      case 'child_part':
                        return 'Part';
                      default:
                        return type;
                    }
                  };

                  return (
                    <div
                      key={item.id}
                      className="group hover:bg-muted/50 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-2 py-1.5 px-2" style={{ paddingLeft: `${8 + depth * 20}px` }}>
                        {/* Hierarchy indicator */}
                        {depth > 0 && (
                          <div className="flex items-center">
                            <div className="w-3 h-px bg-border" />
                          </div>
                        )}

                        {/* Item Name & Type */}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-4 ${getTypeColor(item.itemType)}`}
                          >
                            {getTypeLabel(item.itemType)}
                          </Badge>
                          {item.partNumber && (
                            <span className="text-xs text-muted-foreground">#{item.partNumber}</span>
                          )}
                        </div>

                        {/* Uploaded File Names - Clickable */}
                        <div className="flex items-center gap-4 text-xs">
                          {item.file2dPath && (() => {
                            const fileName = item.file2dPath.split('/').pop() || '';
                            // Remove timestamp prefix (pattern: timestamp_originalname)
                            const originalName = fileName.includes('_')
                              ? fileName.substring(fileName.indexOf('_') + 1)
                              : fileName;
                            return (
                              <button
                                onClick={() => handleViewItem(item, '2d')}
                                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              >
                                <FileText className="h-3 w-3 flex-shrink-0" />
                                <span title={originalName}>
                                  {originalName}
                                </span>
                              </button>
                            );
                          })()}
                          {item.file3dPath && (() => {
                            const fileName = item.file3dPath.split('/').pop() || '';
                            // Remove timestamp prefix (pattern: timestamp_originalname)
                            const originalName = fileName.includes('_')
                              ? fileName.substring(fileName.indexOf('_') + 1)
                              : fileName;
                            return (
                              <button
                                onClick={() => handleViewItem(item, '3d')}
                                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              >
                                <Box className="h-3 w-3 flex-shrink-0" />
                                <span title={originalName}>
                                  {originalName}
                                </span>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Items & Parts
          </TabsTrigger>
          <TabsTrigger value="tree">Tree View</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>BOM Items</CardTitle>
                  <CardDescription>Manage parts, materials, and components</CardDescription>
                </div>
                <Button onClick={handleAddItem} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add BOM
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <BOMItemsFlat
                bomId={bomId}
                onEditItem={handleEditItem}
                onViewItem={handleViewItem}
                onAddChildItem={handleAddTreeItem}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tree" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>BOM Tree Structure</CardTitle>
              <CardDescription>Hierarchical view of assemblies and sub-assemblies</CardDescription>
            </CardHeader>
            <CardContent>
              <BOMTreeView
                items={bomItems}
                projectName={project?.name}
                projectId={projectId}
                onAddItem={handleAddTreeItem}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BOMItemDialog
        bomId={bomId}
        item={selectedItem}
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        parentItemId={parentItemId}
        defaultItemType={defaultItemType}
        onSuccess={() => refetchBOMItems()}
        getAutoParent={getAutoParentForType}
      />

      <BOMItemDetailPanel
        item={viewingItem}
        onClose={() => setViewingItem(null)}
        onUpdate={() => refetchBOMItems()}
        preferredView={preferredView}
      />
    </div>
  );
}
