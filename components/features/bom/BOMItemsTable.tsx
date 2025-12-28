'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit2, Trash2, GripVertical, Package, FileText, Box, Eye, Loader2, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useBOMItems, deleteBOMItem, BOMItem } from '@/lib/api/hooks/useBOMItems';
import { apiClient } from '@/lib/api/client';
import { BOMItemType } from '@/lib/types/bom.types';

interface BOMItemsTableProps {
  bomId: string;
  onEditItem: (item: any) => void;
  onViewItem?: (item: BOMItem) => void;
  onAddChildItem?: (parentId: string, childType: BOMItemType) => void;
}

interface ItemThumbnail {
  [key: string]: string | null;
}

interface TreeNode extends BOMItem {
  children: TreeNode[];
  depth: number;
}

export function BOMItemsTable({ bomId, onEditItem, onViewItem, onAddChildItem }: BOMItemsTableProps) {
  const { data, isLoading, refetch } = useBOMItems(bomId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BOMItem | null>(null);
  const [thumbnails, setThumbnails] = useState<ItemThumbnail>({});
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const bomItems = data?.items || [];

  // Build tree structure from flat items
  const buildTree = (flatItems: BOMItem[]): TreeNode[] => {
    const itemMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Create nodes
    flatItems.forEach(item => {
      itemMap.set(item.id, { ...item, children: [], depth: 0 });
    });

    // Build hierarchy
    flatItems.forEach(item => {
      const node = itemMap.get(item.id)!;
      if (item.parentItemId) {
        const parent = itemMap.get(item.parentItemId);
        if (parent) {
          parent.children.push(node);
          node.depth = parent.depth + 1;
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  // Flatten tree for rendering
  const flattenTree = (nodes: TreeNode[], parentExpanded: boolean = true): TreeNode[] => {
    const result: TreeNode[] = [];

    nodes.forEach(node => {
      result.push(node);

      if (parentExpanded && expandedItems.has(node.id) && node.children.length > 0) {
        result.push(...flattenTree(node.children, true));
      } else if (parentExpanded && node.children.length > 0 && !expandedItems.has(node.id)) {
        // Children exist but collapsed - don't add them
      } else if (parentExpanded && node.children.length > 0) {
        result.push(...flattenTree(node.children, true));
      }
    });

    return result;
  };

  const treeData = buildTree(bomItems);

  // Flatten tree for display with depth information
  const items = flattenTree(treeData);

  // Auto-expand all items with children on first load
  useEffect(() => {
    const itemsWithChildren = new Set<string>();
    const findParents = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          itemsWithChildren.add(node.id);
          findParents(node.children);
        }
      });
    };
    findParents(treeData);
    setExpandedItems(itemsWithChildren);
  }, [JSON.stringify(items.map(i => ({ id: i.id, parentItemId: i.parentItemId })))]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Load thumbnails for items with 2D images
  useEffect(() => {
    const loadThumbnails = async () => {
      const newThumbnails: ItemThumbnail = {};
      const loading = new Set<string>();

      console.log('Loading thumbnails for items:', items.length);

      for (const item of items) {
        const hasImageFile = item.file2dPath && (
          item.file2dPath.endsWith('.png') ||
          item.file2dPath.endsWith('.jpg') ||
          item.file2dPath.endsWith('.jpeg')
        );

        if (hasImageFile) {
          console.log(`Loading thumbnail for ${item.name} (${item.id}):`, item.file2dPath);
          loading.add(item.id);
          setLoadingThumbnails(new Set(loading));

          try {
            const response = await apiClient.get<{ url: string }>(`/bom-items/${item.id}/file-url/2d`);
            newThumbnails[item.id] = response.url;
            console.log(`Thumbnail loaded for ${item.name}:`, response.url);
          } catch (error) {
            console.error(`Failed to load thumbnail for ${item.name}:`, error);
            newThumbnails[item.id] = null;
          } finally {
            loading.delete(item.id);
          }
        }
      }

      console.log('All thumbnails loaded:', Object.keys(newThumbnails).length);
      setThumbnails(newThumbnails);
      setLoadingThumbnails(new Set());
    };

    if (items.length > 0) {
      loadThumbnails();
    }
  }, [JSON.stringify(items.map(i => ({ id: i.id, file2dPath: i.file2dPath })))]);

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await deleteBOMItem(itemToDelete.id);
      await refetch(); // Refresh the data
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete item');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const getItemTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; className: string }> = {
      assembly: {
        label: 'Assembly',
        className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400'
      },
      sub_assembly: {
        label: 'Sub-Assembly',
        className: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400'
      },
      child_part: {
        label: 'Child Part',
        className: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400'
      },
    };

    const config = typeConfig[type] || {
      label: type,
      className: 'bg-muted text-muted-foreground border-muted'
    };

    return (
      <Badge
        variant="outline"
        className={`font-medium text-xs ${config.className}`}
      >
        {config.label}
      </Badge>
    );
  };

  // Determine what child type can be added based on parent type
  const getChildType = (parentType: string): BOMItemType | null => {
    switch (parentType) {
      case 'assembly':
        return BOMItemType.SUB_ASSEMBLY;
      case 'sub_assembly':
        return BOMItemType.CHILD_PART;
      case 'child_part':
        return null; // Child part is now the leaf node
      default:
        return null;
    }
  };

  const handleAddChild = (item: BOMItem) => {
    const childType = getChildType(item.itemType);
    if (childType && onAddChildItem) {
      onAddChildItem(item.id, childType);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
        <p className="text-muted-foreground">Loading BOM items...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
        <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No items yet</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          Start adding items to your BOM by clicking the "Add BOM" button above.
        </p>
      </div>
    );
  }

  // Get border color based on item type
  const getBorderColor = (type: string) => {
    switch (type) {
      case 'assembly':
        return 'border-l-emerald-500';
      case 'sub_assembly':
        return 'border-l-blue-500';
      case 'child_part':
        return 'border-l-amber-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <>
      {/* Render All Items as Flat Cards */}
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border bg-card text-card-foreground shadow-sm border-l-4 ${getBorderColor(item.itemType)}`}
            >
              <div className="flex flex-col space-y-1.5 p-6 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                        <h3 className="tracking-tight text-lg font-semibold text-foreground truncate">
                          {item.name}
                        </h3>
                        {getItemTypeBadge(item.itemType)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <div className="text-sm">
                          <p className="text-muted-foreground text-xs mb-0.5">Part Number</p>
                          <p className="font-medium text-foreground">{item.partNumber || '—'}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground text-xs mb-0.5">Quantity</p>
                          <p className="font-medium text-foreground">{item.quantity} {item.unit}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground text-xs mb-0.5">Annual Volume</p>
                          <p className="font-medium text-foreground">{item.annualVolume.toLocaleString()}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground text-xs mb-0.5">Material</p>
                          <p className="font-medium text-foreground truncate" title={item.materialGrade || '—'}>
                            {item.materialGrade || '—'}
                          </p>
                        </div>
                      </div>
                      {item.description && (
                        <div className="text-sm mt-3">
                          <p className="text-muted-foreground text-xs mb-0.5">Description</p>
                          <p className="font-medium text-foreground">{item.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getChildType(item.itemType) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddChild(item)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Component
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditItem(item)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(item)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[80px]">Preview</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Part Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Annual Volume</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.has(item.id);
                return (
                <TableRow
                  key={item.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <TableCell>
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                  </TableCell>
                  <TableCell>
                    <div
                      className="w-16 h-16 border rounded-md overflow-hidden bg-muted/30 flex items-center justify-center cursor-pointer transition-all group relative"
                      onClick={() => onViewItem?.(item)}
                      title={item.file2dPath || item.file3dPath ? "Click to view files" : "No files attached"}
                    >
                      {loadingThumbnails.has(item.id) ? (
                        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                      ) : thumbnails[item.id] ? (
                        <>
                          <img
                            src={thumbnails[item.id]!}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const icon = document.createElement('div');
                                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-muted-foreground"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                parent.appendChild(icon);
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </>
                      ) : item.file3dPath ? (
                        <Box className="h-8 w-8 text-muted-foreground" />
                      ) : item.file2dPath ? (
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center relative" style={{ paddingLeft: `${item.depth * 20}px` }}>
                      {/* Professional tree connector lines */}
                      {item.depth > 0 && (
                        <>
                          {/* Vertical lines for all parent levels */}
                          {Array.from({ length: item.depth - 1 }).map((_, i) => (
                            <div
                              key={`vertical-${i}`}
                              className="absolute top-0 bottom-0 w-px bg-border"
                              style={{ left: `${i * 20 + 10}px` }}
                            />
                          ))}

                          {/* L-shape connector for current item */}
                          <div
                            className="absolute w-px bg-border"
                            style={{
                              left: `${(item.depth - 1) * 20 + 10}px`,
                              top: 0,
                              height: '50%',
                            }}
                          />
                          <div
                            className="absolute h-px bg-border"
                            style={{
                              left: `${(item.depth - 1) * 20 + 10}px`,
                              top: '50%',
                              width: '10px',
                            }}
                          />
                        </>
                      )}

                      <div className="flex items-center gap-1.5 relative z-10">
                        {hasChildren ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(item.id);
                            }}
                            className="h-4 w-4 flex items-center justify-center hover:bg-accent rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : item.depth > 0 ? (
                          <div className="w-4 h-4" />
                        ) : null}

                        {/* Icon based on type */}
                        <div className="flex items-center justify-center w-4 h-4">
                          {item.itemType === 'assembly' ? (
                            <Box className="h-4 w-4 text-emerald-600" />
                          ) : item.itemType === 'sub_assembly' ? (
                            <Package className="h-4 w-4 text-blue-600" />
                          ) : item.itemType === 'child_part' ? (
                            <FileText className="h-3.5 w-3.5 text-amber-600" />
                          ) : (
                            <div className="w-2 h-2 rounded-sm bg-purple-600" />
                          )}
                        </div>

                        <span className="text-sm">{item.name}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.partNumber}</TableCell>
                  <TableCell>{getItemTypeBadge(item.itemType)}</TableCell>
                  <TableCell>
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell>{item.annualVolume.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{item.material}</div>
                      <div className="text-muted-foreground text-xs">{item.materialGrade}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(item.file2dPath || item.file3dPath) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onViewItem?.(item)}
                          title="View files"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {getChildType(item.itemType) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleAddChild(item)}
                          title={`Add ${getChildType(item.itemType)?.replace('_', '-')}`}
                        >
                          <Plus className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEditItem(item)}
                        title="Edit item"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteClick(item)}
                        title="Delete item"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
          </TableBody>
        </Table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete BOM Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
