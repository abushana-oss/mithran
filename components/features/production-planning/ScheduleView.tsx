'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Edit,
  TrendingUp,
  Package,
  Plus,
  Settings
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BOMPartRequirement {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  requiredQuantity: number;
  consumedQuantity: number;
  availableQuantity: number;
  status: 'AVAILABLE' | 'PARTIAL' | 'SHORTAGE' | 'CONSUMED';
}

interface SubTask {
  id: string;
  name: string;
  description: string;
  assignedOperator: string;
  operatorName: string;
  estimatedDuration: number;
  actualDuration: number | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  startTime: string | null;
  endTime: string | null;
  notes: string;
  bomRequirements: BOMPartRequirement[];
}

interface ProcessStep {
  id: string;
  name: string;
  description: string;
  sequence: number;
  estimatedDuration: number;
  actualDuration: number | null;
  startDate: string;
  endDate: string;
  responsiblePerson: string;
  responsiblePersonName: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  dependencies: string[];
  subTasks: SubTask[];
  notes: string;
  bomRequirements: BOMPartRequirement[];
}

interface ScheduleViewProps {
  lotId: string;
}

export const ScheduleView = ({ lotId }: ScheduleViewProps) => {
  const [startDate, setStartDate] = useState<Date>(new Date('2026-02-05'));
  const [endDate, setEndDate] = useState<Date>(new Date('2026-02-20'));
  const [viewMode, setViewMode] = useState<'weekly' | 'daily' | 'monthly'>('weekly');
  const [showAddProcess, setShowAddProcess] = useState(false);
  const [editingTask, setEditingTask] = useState<{type: 'process' | 'subtask', id: string, processId?: string} | null>(null);
  const [showBOMView, setShowBOMView] = useState(false);

  // Mock data - this would come from props or API
  const processes: ProcessStep[] = [
    {
      id: '1',
      name: 'Material Preparation',
      description: 'Prepare and inspect all raw materials',
      sequence: 1,
      estimatedDuration: 18,
      actualDuration: null,
      startDate: '2026-02-05',
      endDate: '2026-02-07',
      responsiblePerson: 'emp-001',
      responsiblePersonName: 'Alice Johnson',
      status: 'PLANNED',
      dependencies: [],
      notes: 'Ensure all materials meet quality standards before proceeding',
      bomRequirements: [
        {
          id: 'br-1-1',
          partId: '1',
          partNumber: 'STL-001',
          partName: 'Steel Plate',
          requiredQuantity: 6,
          consumedQuantity: 0,
          availableQuantity: 4,
          status: 'PARTIAL'
        },
        {
          id: 'br-1-2',
          partId: '4',
          partNumber: 'MSC-004',
          partName: 'Mounting Screws',
          requiredQuantity: 24,
          consumedQuantity: 0,
          availableQuantity: 24,
          status: 'AVAILABLE'
        },
        {
          id: 'br-1-3',
          partId: '2',
          partNumber: 'PLT-002',
          partName: 'Plastic Housing',
          requiredQuantity: 2,
          consumedQuantity: 0,
          availableQuantity: 0,
          status: 'SHORTAGE'
        },
        {
          id: 'br-1-4',
          partId: '3',
          partNumber: 'ELC-003',
          partName: 'Circuit Board',
          requiredQuantity: 3,
          consumedQuantity: 0,
          availableQuantity: 3,
          status: 'AVAILABLE'
        }
      ],
      subTasks: [
        {
          id: 'st-1-1',
          name: 'Material Inspection',
          description: 'Visual and dimensional inspection of raw materials',
          assignedOperator: 'op-001',
          operatorName: 'Bob Smith',
          estimatedDuration: 2,
          actualDuration: null,
          status: 'PENDING',
          startTime: null,
          endTime: null,
          notes: 'Use calibrated measurement tools',
          bomRequirements: []
        },
        {
          id: 'st-1-2',
          name: 'Cutting to Size',
          description: 'Cut materials to required dimensions',
          assignedOperator: 'op-002',
          operatorName: 'Carol Davis',
          estimatedDuration: 4,
          actualDuration: null,
          status: 'PENDING',
          startTime: null,
          endTime: null,
          notes: 'Follow cutting specifications exactly',
          bomRequirements: []
        },
        {
          id: 'st-1-3',
          name: 'Surface Treatment',
          description: 'Clean and prepare surfaces',
          assignedOperator: 'op-003',
          operatorName: 'David Wilson',
          estimatedDuration: 2,
          actualDuration: null,
          status: 'PENDING',
          startTime: null,
          endTime: null,
          notes: 'Use approved cleaning solvents',
          bomRequirements: []
        }
      ]
    },
    {
      id: '2',
      name: 'Assembly',
      description: 'Assemble components according to specifications',
      sequence: 2,
      estimatedDuration: 16,
      actualDuration: null,
      startDate: '2026-02-07',
      endDate: '2026-02-10',
      responsiblePerson: 'emp-002',
      responsiblePersonName: 'Michael Brown',
      status: 'PLANNED',
      dependencies: ['1'],
      notes: 'Follow assembly sequence strictly to avoid rework',
      bomRequirements: [
        {
          id: 'br-2-1',
          partId: '2',
          partNumber: 'PLT-002',
          partName: 'Plastic Housing',
          requiredQuantity: 2,
          consumedQuantity: 0,
          availableQuantity: 0,
          status: 'SHORTAGE'
        }
      ],
      subTasks: [
        {
          id: 'st-2-1',
          name: 'Frame Assembly',
          description: 'Assemble main frame structure',
          assignedOperator: 'op-004',
          operatorName: 'Emma Taylor',
          estimatedDuration: 6,
          actualDuration: null,
          status: 'PENDING',
          startTime: null,
          endTime: null,
          notes: 'Ensure proper alignment before welding',
          bomRequirements: []
        },
        {
          id: 'st-2-2',
          name: 'Component Installation',
          description: 'Install electronic components',
          assignedOperator: 'op-005',
          operatorName: 'Frank Miller',
          estimatedDuration: 8,
          actualDuration: null,
          status: 'PENDING',
          startTime: null,
          endTime: null,
          notes: 'Handle ESD-sensitive components with care',
          bomRequirements: []
        },
        {
          id: 'st-2-3',
          name: 'Wiring',
          description: 'Connect all electrical components',
          assignedOperator: 'op-006',
          operatorName: 'Grace Chen',
          estimatedDuration: 2,
          actualDuration: null,
          status: 'PENDING',
          startTime: null,
          endTime: null,
          notes: 'Follow wiring diagram precisely',
          bomRequirements: []
        }
      ]
    },
    {
      id: '3',
      name: 'Testing & Quality Control',
      description: 'Comprehensive testing and quality verification',
      sequence: 3,
      estimatedDuration: 12,
      actualDuration: null,
      startDate: '2026-02-11',
      endDate: '2026-02-13',
      responsiblePerson: 'emp-003',
      responsiblePersonName: 'Sarah Garcia',
      status: 'PLANNED',
      dependencies: ['2'],
      notes: 'Document all test results and quality metrics',
      bomRequirements: [],
      subTasks: [
        {
          id: 'st-3-1',
          name: 'Functional Testing',
          description: 'Test all functions and features',
          assignedOperator: 'op-007',
          operatorName: 'Henry Kim',
          estimatedDuration: 4,
          actualDuration: null,
          status: 'PENDING',
          startTime: null,
          endTime: null,
          notes: 'Use approved test procedures',
          bomRequirements: []
        },
        {
          id: 'st-3-2',
          name: 'Quality Inspection',
          description: 'Visual and dimensional quality check',
          assignedOperator: 'op-008',
          operatorName: 'Ivy Rodriguez',
          estimatedDuration: 3,
          actualDuration: null,
          status: 'PENDING',
          startTime: null,
          endTime: null,
          notes: 'Check against quality standards',
          bomRequirements: []
        },
        {
          id: 'st-3-3',
          name: 'Final Packaging',
          description: 'Package units for delivery',
          assignedOperator: 'op-009',
          operatorName: 'Jack Thompson',
          estimatedDuration: 2,
          actualDuration: null,
          status: 'PENDING',
          startTime: null,
          endTime: null,
          notes: 'Use protective packaging materials',
          bomRequirements: []
        },
        {
          id: 'st-3-4',
          name: 'Documentation',
          description: 'Complete all required documentation',
          assignedOperator: 'op-010',
          operatorName: 'Kelly White',
          estimatedDuration: 3,
          actualDuration: null,
          status: 'PENDING',
          startTime: null,
          endTime: null,
          notes: 'Include test certificates and quality reports',
          bomRequirements: []
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      PLANNED: 'bg-blue-100 text-blue-600',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-600',
      COMPLETED: 'bg-green-100 text-green-600',
      BLOCKED: 'bg-red-100 text-red-600',
      PENDING: 'bg-gray-100 text-gray-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return <Calendar className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'BLOCKED':
        return <StopCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getBOMStatusColor = (status: string) => {
    const colors = {
      AVAILABLE: 'bg-green-100 text-green-700',
      PARTIAL: 'bg-yellow-100 text-yellow-700',
      SHORTAGE: 'bg-red-100 text-red-700',
      CONSUMED: 'bg-gray-100 text-gray-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const totalTasks = processes.reduce((sum, p) => sum + p.subTasks.length + 1, 0);
  const inProgressTasks = processes.filter(p => p.status === 'IN_PROGRESS').length + 
                          processes.flatMap(p => p.subTasks).filter(st => st.status === 'IN_PROGRESS').length;
  const completedTasks = processes.filter(p => p.status === 'COMPLETED').length + 
                         processes.flatMap(p => p.subTasks).filter(st => st.status === 'COMPLETED').length;

  const processColors = {
    'Material Preparation': '#3B82F6', // Blue
    'Assembly': '#10B981', // Green  
    'Testing & Quality Control': '#F59E0B' // Orange
  };

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <DatePicker />
              <div className="text-xs text-muted-foreground">2/5/2026</div>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <DatePicker />
              <div className="text-xs text-muted-foreground">2/20/2026</div>
            </div>
            <div className="space-y-2">
              <Label>Monitor</Label>
              <div className="text-sm space-x-1">
                <Badge variant="outline">BOM & Materials</Badge>
                <Badge variant="outline">Vendors</Badge>
                <Badge variant="outline">Processes</Badge>
                <Badge variant="default">Schedule</Badge>
                <Badge variant="outline">Production</Badge>
                <Badge variant="outline">Remarks</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Including sub-tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <PlayCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              Active tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              Finished tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Overall completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Production Schedule</CardTitle>
              <CardDescription>
                Gantt chart showing timeline and dependencies for all processes
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant={viewMode === 'weekly' ? 'default' : 'outline'}
                onClick={() => setViewMode('weekly')}
              >
                Weekly
              </Button>
              <Button 
                size="sm" 
                variant={viewMode === 'daily' ? 'default' : 'outline'}
                onClick={() => setViewMode('daily')}
              >
                Daily
              </Button>
              <Button 
                size="sm" 
                variant={viewMode === 'monthly' ? 'default' : 'outline'}
                onClick={() => setViewMode('monthly')}
              >
                Monthly
              </Button>
              <Button 
                size="sm" 
                variant={showBOMView ? 'default' : 'outline'}
                onClick={() => setShowBOMView(!showBOMView)}
              >
                <Package className="h-3 w-3 mr-1" />
                BOM View
              </Button>
              <Dialog open={showAddProcess} onOpenChange={setShowAddProcess}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Process
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {/* Header Row */}
            <div className="flex items-center bg-muted/40 border-b">
              <div className="w-80 p-3 border-r font-medium text-sm">Task</div>
              <div className="flex-1 grid grid-cols-7 text-xs">
                {[
                  'Feb 5\nThu',
                  'Feb 6\nFri', 
                  'Feb 7\nSat',
                  'Feb 8\nSun',
                  'Feb 9\nMon',
                  'Feb 10\nTue',
                  'Feb 11\nWed'
                ].map((date, i) => (
                  <div key={i} className="p-2 text-center border-r border-muted/30 font-medium">
                    {date.split('\n').map((line, j) => (
                      <div key={j} className={j === 0 ? 'font-medium' : 'text-muted-foreground text-xs'}>
                        {line}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Process Rows */}
            {processes.map((process, processIndex) => (
              <div key={process.id} className="border-b border-muted/20">
                {/* Main Process Row */}
                <div className="flex items-center hover:bg-muted/10 group">
                  <div className="w-80 p-3 border-r border-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(process.status)} variant="outline">
                          {getStatusIcon(process.status)}
                          {process.status}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{process.name}</div>
                          <div className="text-xs text-muted-foreground">{process.responsiblePersonName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">0%</div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingTask({type: 'process', id: process.id})}
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-7">
                    {Array.from({length: 7}, (_, dayIndex) => {
                      const isInRange = dayIndex < Math.ceil(process.estimatedDuration / 24 * 7);
                      
                      return (
                        <div key={dayIndex} className="p-1 border-r border-muted/30 relative h-12">
                          {isInRange && (
                            <div 
                              className="absolute inset-1 rounded flex items-center justify-center text-white text-xs font-medium"
                              style={{
                                backgroundColor: processColors[process.name as keyof typeof processColors] || '#3B82F6',
                                opacity: 0.8
                              }}
                            >
                              {dayIndex === 0 && `${process.actualDuration || 0}%`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-Tasks */}
                {process.subTasks.map((subTask, subIndex) => (
                  <div key={subTask.id} className="flex items-center hover:bg-muted/5 group border-t border-muted/10">
                    <div className="w-80 p-2 pl-8 border-r border-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-muted rounded-full"></div>
                          <div>
                            <div className="font-medium text-xs">{subTask.name}</div>
                            <div className="text-xs text-muted-foreground">{subTask.operatorName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">0%</div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setEditingTask({type: 'subtask', id: subTask.id, processId: process.id})}
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                          >
                            <Edit className="h-2 w-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-7">
                      {Array.from({length: 7}, (_, dayIndex) => {
                        const subTaskDayStart = Math.floor(subIndex * 1.5);
                        const subTaskDuration = Math.ceil(subTask.estimatedDuration / 24 * 7);
                        const isInRange = dayIndex >= subTaskDayStart && dayIndex < subTaskDayStart + subTaskDuration;
                        
                        return (
                          <div key={dayIndex} className="p-1 border-r border-muted/30 relative h-8">
                            {isInRange && (
                              <div 
                                className="absolute inset-1 rounded flex items-center justify-center text-white text-xs"
                                style={{
                                  backgroundColor: processColors[process.name as keyof typeof processColors] || '#3B82F6',
                                  opacity: 0.6
                                }}
                              >
                                {dayIndex === subTaskDayStart && `${subTask.actualDuration || 0}%`}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* BOM Parts Visualization */}
                {showBOMView && process.bomRequirements && process.bomRequirements.length > 0 && (
                  <div className="border-t border-dashed border-muted/40 bg-muted/5">
                    <div className="p-2 bg-muted/10 border-b border-muted/20">
                      <div className="w-80 text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        BOM Parts ({process.bomRequirements.length})
                      </div>
                    </div>
                    {process.bomRequirements.map((bomPart) => (
                      <div key={bomPart.id} className="flex items-center hover:bg-muted/10 group border-t border-muted/10">
                        <div className="w-80 p-2 pl-12 border-r border-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded"
                                style={{
                                  backgroundColor: bomPart.status === 'AVAILABLE' ? 'rgb(34, 197, 94)' : 
                                                 bomPart.status === 'PARTIAL' ? 'rgb(234, 179, 8)' : 
                                                 bomPart.status === 'SHORTAGE' ? 'rgb(239, 68, 68)' : 'rgb(156, 163, 175)'
                                }}
                              ></div>
                              <div>
                                <div className="font-mono text-xs font-medium">{bomPart.partNumber} - {bomPart.partName}</div>
                                <div className="text-xs text-muted-foreground">
                                  Required: {bomPart.requiredQuantity} | Available: {bomPart.availableQuantity}
                                </div>
                              </div>
                            </div>
                            <Badge className={getBOMStatusColor(bomPart.status)} variant="outline">
                              {bomPart.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 grid grid-cols-7">
                          {Array.from({length: 7}, (_, dayIndex) => {
                            const consumptionDay = dayIndex < Math.ceil(process.estimatedDuration / 24 * 7);
                            const consumptionPercentage = bomPart.status === 'AVAILABLE' ? 100 : 
                                                        bomPart.status === 'PARTIAL' ? 60 : 
                                                        bomPart.status === 'SHORTAGE' ? 20 : 0;
                            
                            return (
                              <div key={dayIndex} className="p-1 border-r border-muted/30 relative h-6">
                                {consumptionDay && (
                                  <div 
                                    className="absolute inset-1 rounded-sm flex items-center justify-center"
                                    style={{
                                      background: `linear-gradient(to right, ${
                                        bomPart.status === 'AVAILABLE' ? 'rgba(34, 197, 94, 0.7)' : 
                                        bomPart.status === 'PARTIAL' ? 'rgba(234, 179, 8, 0.7)' : 'rgba(239, 68, 68, 0.7)'
                                      } ${consumptionPercentage}%, transparent ${consumptionPercentage}%)`,
                                      border: `1px dashed ${
                                        bomPart.status === 'AVAILABLE' ? 'rgb(34, 197, 94)' : 
                                        bomPart.status === 'PARTIAL' ? 'rgb(234, 179, 8)' : 'rgb(239, 68, 68)'
                                      }`
                                    }}
                                  >
                                    {dayIndex === 0 && (
                                      <span className="text-xs font-medium text-white">
                                        {consumptionPercentage}%
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(processColors).map(([processName, color]) => (
              <div key={processName} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-sm">{processName}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">Progress:</div>
              <div className="text-xs text-muted-foreground">completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Process Dialog */}
      <Dialog open={showAddProcess} onOpenChange={setShowAddProcess}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Process</DialogTitle>
            <DialogDescription>
              Create a new manufacturing process with BOM parts requirements
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="process-name">Process Name</Label>
                <Input id="process-name" placeholder="Enter process name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsible-person">Responsible Person</Label>
                <Input id="responsible-person" placeholder="Enter responsible person" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="process-description">Description</Label>
              <Textarea id="process-description" placeholder="Describe the process" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input id="duration" type="number" placeholder="8" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <DatePicker />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <DatePicker />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">BOM Parts Requirements</h4>
              <div className="border rounded-lg p-4 space-y-3 bg-muted/5">
                {[
                  { partNumber: 'STL-001', partName: 'Steel Plate', available: 4, status: 'PARTIAL' },
                  { partNumber: 'PLT-002', partName: 'Plastic Housing', available: 0, status: 'SHORTAGE' },
                  { partNumber: 'ELC-003', partName: 'Circuit Board', available: 3, status: 'AVAILABLE' },
                  { partNumber: 'MSC-004', partName: 'Mounting Screws', available: 24, status: 'AVAILABLE' }
                ].map((part, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="rounded" />
                      <div>
                        <div className="font-mono text-sm">{part.partNumber}</div>
                        <div className="text-xs text-muted-foreground">{part.partName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        placeholder="Qty"
                        className="w-16 h-8 text-xs"
                      />
                      <Badge className={getBOMStatusColor(part.status)} variant="outline">
                        {part.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProcess(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Process</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                Edit {editingTask.type === 'process' ? 'Process' : 'Sub-Task'}
              </DialogTitle>
              <DialogDescription>
                Modify task details, timing, and BOM requirements
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="Task name" />
                </div>
                <div className="space-y-2">
                  <Label>Responsible Person</Label>
                  <Input placeholder="Person name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Task description" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Duration (hours)</Label>
                  <Input type="number" placeholder="8" />
                </div>
                <div className="space-y-2">
                  <Label>Progress (%)</Label>
                  <Input type="number" placeholder="0" min="0" max="100" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNED">Planned</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="BLOCKED">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <DatePicker />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <DatePicker />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};