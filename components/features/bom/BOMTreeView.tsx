import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BOMItemType } from '@/lib/types/bom.types';

export interface BOMItem {
  id: string;
  name: string;
  partNumber?: string;
  itemType: BOMItemType;
  quantity: number;
  unit?: string;
  material?: string;
  children?: BOMItem[];
}

interface BOMTreeViewProps {
  items: BOMItem[];
  projectName?: string;
  projectId?: string;
  onAddItem: (parentId: string | null, type: BOMItemType) => void;
  onEditItem: (item: BOMItem) => void;
  onDeleteItem: (id: string) => void;
}

interface NodePosition {
  x: number;
  y: number;
  level: number;
}

interface TreeNode extends BOMItem {
  position: NodePosition;
  isExpanded: boolean;
  parentPos?: NodePosition;
}

// Generate curved path between two points (horizontal mind-map style)
function generateCurvedPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  // Create a smooth horizontal curve
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

// Count total descendants for spacing calculation
function countDescendants(item: BOMItem, expandedNodes: Set<string>): number {
  if (!item.children || item.children.length === 0 || !expandedNodes.has(item.id)) return 1;

  return item.children.reduce((sum, child) => {
    return sum + countDescendants(child, expandedNodes);
  }, 0);
}

// Calculate vertical position for hierarchical layout
function calculateHierarchicalPositions(
  items: BOMItem[],
  expandedNodes: Set<string>,
  startY: number = 0,
  level: number = 1,
  parentPos?: NodePosition
): { nodes: TreeNode[]; totalHeight: number } {
  const nodes: TreeNode[] = [];
  const levelSpacing = 280; // Horizontal spacing between levels
  const verticalSpacing = 110; // Compact spacing (card height is 80px)

  let currentY = startY;

  items.forEach((item) => {
    const isExpanded = expandedNodes.has(item.id);

    // Calculate how much vertical space this node and its children need
    const descendantCount = countDescendants(item, expandedNodes);
    const nodeHeight = Math.max(descendantCount * verticalSpacing, verticalSpacing);

    // Position this node in the middle of its allocated space
    const nodeY = currentY + nodeHeight / 2;
    const nodeX = level * levelSpacing;

    const position: NodePosition = {
      x: nodeX,
      y: nodeY,
      level
    };

    nodes.push({
      ...item,
      position,
      isExpanded,
      parentPos
    });

    // Process children if expanded
    if (isExpanded && item.children && item.children.length > 0) {
      const childResult = calculateHierarchicalPositions(
        item.children,
        expandedNodes,
        currentY,
        level + 1,
        position
      );
      nodes.push(...childResult.nodes);
    }

    // Move to next position
    currentY += nodeHeight;
  });

  return {
    nodes,
    totalHeight: currentY - startY
  };
}

function HierarchicalNode({
  node,
  onToggle,
  onEdit,
  onDelete,
  onAdd,
}: {
  node: TreeNode;
  onToggle: (id: string) => void;
  onEdit: (item: BOMItem) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string, type: BOMItemType) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const finalPosition = node.position;

  const getChildType = (): BOMItemType | null => {
    if (node.itemType === BOMItemType.ASSEMBLY) return BOMItemType.SUB_ASSEMBLY;
    if (node.itemType === BOMItemType.SUB_ASSEMBLY) return BOMItemType.CHILD_PART;
    return null;
  };

  const getTypeLabel = () => {
    switch (node.itemType) {
      case BOMItemType.ASSEMBLY:
        return 'Assembly';
      case BOMItemType.SUB_ASSEMBLY:
        return 'Sub-assembly';
      case BOMItemType.CHILD_PART:
        return 'Part';
      default:
        return '';
    }
  };

  const getTypeColors = () => {
    switch (node.itemType) {
      case BOMItemType.ASSEMBLY:
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          hoverBorder: 'hover:border-emerald-500/50',
          text: 'text-emerald-700',
          hoverBg: 'bg-emerald-500/15',
          hoverBorderStrong: 'border-emerald-500/60'
        };
      case BOMItemType.SUB_ASSEMBLY:
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          hoverBorder: 'hover:border-blue-500/50',
          text: 'text-blue-700',
          hoverBg: 'bg-blue-500/15',
          hoverBorderStrong: 'border-blue-500/60'
        };
      case BOMItemType.CHILD_PART:
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          hoverBorder: 'hover:border-orange-500/50',
          text: 'text-orange-700',
          hoverBg: 'bg-orange-500/15',
          hoverBorderStrong: 'border-orange-500/60'
        };
      default:
        return {
          bg: 'bg-card',
          border: 'border-border',
          hoverBorder: 'hover:border-foreground/30',
          text: 'text-muted-foreground',
          hoverBg: 'bg-card',
          hoverBorderStrong: 'border-primary/50'
        };
    }
  };

  const childType = getChildType();
  const typeColors = getTypeColors();

  return (
    <>
      {/* Curved connection line */}
      {node.parentPos && (
        <motion.path
          d={generateCurvedPath(
            node.parentPos.x,
            node.parentPos.y,
            finalPosition.x,
            finalPosition.y
          )}
          stroke="hsl(var(--border))"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          exit={{ pathLength: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )}

      {/* Node Card */}
      <motion.g
        initial={{ opacity: 0, x: finalPosition.x - 50 }}
        animate={{
          opacity: 1,
          x: finalPosition.x,
          y: finalPosition.y
        }}
        exit={{ opacity: 0, x: finalPosition.x - 50 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <foreignObject
          x={-80}
          y={-40}
          width="160"
          height="80"
        >
          <div
            className="flex flex-col items-center justify-center h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div
              className={cn(
                "relative rounded-md p-2.5 w-full",
                "border transition-all duration-200 cursor-pointer",
                typeColors.bg,
                isHovered
                  ? cn("shadow-lg scale-105", typeColors.hoverBg, typeColors.hoverBorderStrong)
                  : cn("shadow-sm", typeColors.border, typeColors.hoverBorder)
              )}
              onClick={() => hasChildren && onToggle(node.id)}
            >
              <div className="space-y-1">
                {/* Header with type and expand */}
                <div className="flex items-center justify-between gap-1">
                  <div className={cn("text-[9px] uppercase tracking-wider font-semibold", typeColors.text)}>
                    {getTypeLabel()}
                  </div>
                  {hasChildren && (
                    <motion.div
                      animate={{ rotate: node.isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={typeColors.text}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M4 2 L8 6 L4 10" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </motion.div>
                  )}
                </div>

                {/* Name */}
                <h4 className="font-semibold text-foreground text-xs leading-tight line-clamp-1">
                  {node.name}
                </h4>

                {/* Part number & Quantity */}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {node.partNumber && (
                    <span className="font-medium">{node.partNumber}</span>
                  )}
                  <span>•</span>
                  <span>{node.quantity} {node.unit || 'pcs'}</span>
                </div>
              </div>

              {/* Action buttons on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex gap-0.5 bg-background rounded border border-border shadow-lg p-0.5 z-50"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {childType && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAdd(node.id, childType);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(node);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(node.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </foreignObject>
      </motion.g>
    </>
  );
}

export function BOMTreeView({ items, projectName, projectId, onAddItem, onEditItem, onDeleteItem }: BOMTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const expanded = new Set(items.map(i => i.id));
    expanded.add('project-root'); // Always expand project root by default
    return expanded;
  });
  const [zoom, setZoom] = useState(0.8);
  const [isRootHovered, setIsRootHovered] = useState(false);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Build tree structure with hierarchical positions
  const { treeNodes, svgDimensions } = useMemo(() => {
    if (items.length === 0) return { treeNodes: [], svgDimensions: { width: 800, height: 500 } };

    const rootPos: NodePosition = { x: 150, y: 50, level: 0 };

    // If project root is not expanded, don't show any children
    if (!expandedNodes.has('project-root')) {
      return { treeNodes: [], svgDimensions: { width: 800, height: 500 } };
    }

    const result = calculateHierarchicalPositions(
      items,
      expandedNodes,
      50,
      1,
      rootPos
    );

    // Calculate SVG dimensions based on content
    const maxX = Math.max(...result.nodes.map(n => n.position.x), rootPos.x) + 200;
    const maxY = Math.max(result.totalHeight + 100, 500);

    return {
      treeNodes: result.nodes,
      svgDimensions: { width: maxX, height: maxY }
    };
  }, [items, expandedNodes]);

  const hasItems = items.length > 0;

  return (
    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] bg-background rounded-lg overflow-hidden border border-border">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))}
          className="h-7 w-7"
          title="Zoom in"
        >
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom((z) => Math.max(z - 0.1, 0.4))}
          className="h-7 w-7"
          title="Zoom out"
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom(0.8)}
          className="h-7 w-7"
          title="Reset zoom"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>

      {/* SVG Canvas */}
      <div className="w-full h-full overflow-auto">
        <svg
          className="min-w-full min-h-full"
          width={svgDimensions.width * zoom}
          height={svgDimensions.height * zoom}
          viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
          preserveAspectRatio="xMinYMin meet"
        >
          {/* Root node - Project */}
          <g transform="translate(150, 50)">
            <foreignObject x="-90" y="-45" width="180" height="90">
              <div
                className="flex items-center justify-center h-full"
                onMouseEnter={() => setIsRootHovered(true)}
                onMouseLeave={() => setIsRootHovered(false)}
              >
                <div
                  className={cn(
                    "relative rounded-lg p-3 w-full cursor-pointer",
                    "border-2 shadow-md transition-all duration-200",
                    isRootHovered
                      ? "bg-primary/15 border-primary/60 shadow-lg scale-105"
                      : "bg-primary/10 border-primary/30 hover:border-primary/50"
                  )}
                  onClick={() => toggleNode('project-root')}
                >
                  <div className="space-y-1.5">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[10px] text-primary font-bold uppercase tracking-wider">
                        Project Root
                      </div>
                      {hasItems && (
                        <motion.div
                          animate={{ rotate: expandedNodes.has('project-root') ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-primary"
                        >
                          <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M4 2 L8 6 L4 10" stroke="currentColor" strokeWidth="2" fill="none" />
                          </svg>
                        </motion.div>
                      )}
                    </div>

                    {/* Project Name */}
                    <h4 className="font-bold text-foreground text-sm leading-tight">
                      {projectName || 'Project'}
                    </h4>

                    {/* Project ID */}
                    {projectId && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="font-medium">ID: {projectId}</span>
                      </div>
                    )}
                  </div>

                  {/* Action button for project root */}
                  <AnimatePresence>
                    {isRootHovered && (
                      <motion.div
                        className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex gap-0.5 bg-background rounded border border-border shadow-lg p-0.5 z-50"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddItem(null, BOMItemType.ASSEMBLY);
                          }}
                          title="Add BOM Assembly"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </foreignObject>
          </g>

          {/* Render all child nodes and connections */}
          <AnimatePresence>
            {treeNodes.map((node) => (
              <HierarchicalNode
                key={node.id}
                node={node}
                onToggle={toggleNode}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
                onAdd={onAddItem}
              />
            ))}
          </AnimatePresence>
        </svg>
      </div>
    </div>
  );
}
