'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Search,
  Plus,
  Edit,
  Calendar,
  User,
  PlayCircle,
  PauseCircle,
  StopCircle,
  ChevronDown,
  ChevronRight,
  Users,
  ArrowRight,
  Package
} from 'lucide-react';
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
import { DatePicker } from '@/components/ui/date-picker';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  isExpanded?: boolean;
  bomRequirements: BOMPartRequirement[];
}

interface ProcessPlanningProps {
  lotId: string;
}

export const ProcessPlanning = ({ lotId }: ProcessPlanningProps) => {
  const [processes, setProcesses] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingProcess, setEditingProcess] = useState<ProcessStep | null>(null);
  const [editingSubTask, setEditingSubTask] = useState<SubTask | null>(null);
  const [showNewProcess, setShowNewProcess] = useState(false);
  const [showNewSubTask, setShowNewSubTask] = useState<string | null>(null);
  const [selectedBOMParts, setSelectedBOMParts] = useState<{[key: string]: {selected: boolean, quantity: number, unit: string}}>({});
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<{processId?: string, subTaskId?: string} | null>(null);

  useEffect(() => {
    const fetchProcessData = async () => {
      try {
        // Mock process planning data
        const mockProcesses: ProcessStep[] = [
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
            isExpanded: false,
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
                bomRequirements: [
                  {
                    id: 'br-st-1-1-1',
                    partId: '1',
                    partNumber: 'STL-001',
                    partName: 'Steel Plate',
                    requiredQuantity: 6,
                    consumedQuantity: 0,
                    availableQuantity: 4,
                    status: 'PARTIAL'
                  }
                ]
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
                bomRequirements: [
                  {
                    id: 'br-st-1-2-1',
                    partId: '1',
                    partNumber: 'STL-001',
                    partName: 'Steel Plate',
                    requiredQuantity: 6,
                    consumedQuantity: 0,
                    availableQuantity: 4,
                    status: 'PARTIAL'
                  }
                ]
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
                bomRequirements: [
                  {
                    id: 'br-st-1-3-1',
                    partId: '4',
                    partNumber: 'MSC-004',
                    partName: 'Mounting Screws',
                    requiredQuantity: 24,
                    consumedQuantity: 0,
                    availableQuantity: 24,
                    status: 'AVAILABLE'
                  }
                ]
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
            isExpanded: false,
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
              },
              {
                id: 'br-2-2',
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
                bomRequirements: [
                  {
                    id: 'br-st-2-1-1',
                    partId: '1',
                    partNumber: 'STL-001',
                    partName: 'Steel Plate',
                    requiredQuantity: 6,
                    consumedQuantity: 0,
                    availableQuantity: 4,
                    status: 'PARTIAL'
                  },
                  {
                    id: 'br-st-2-1-2',
                    partId: '4',
                    partNumber: 'MSC-004',
                    partName: 'Mounting Screws',
                    requiredQuantity: 12,
                    consumedQuantity: 0,
                    availableQuantity: 24,
                    status: 'AVAILABLE'
                  }
                ]
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
                bomRequirements: [
                  {
                    id: 'br-st-2-2-1',
                    partId: '3',
                    partNumber: 'ELC-003',
                    partName: 'Circuit Board',
                    requiredQuantity: 3,
                    consumedQuantity: 0,
                    availableQuantity: 3,
                    status: 'AVAILABLE'
                  },
                  {
                    id: 'br-st-2-2-2',
                    partId: '2',
                    partNumber: 'PLT-002',
                    partName: 'Plastic Housing',
                    requiredQuantity: 2,
                    consumedQuantity: 0,
                    availableQuantity: 0,
                    status: 'SHORTAGE'
                  }
                ]
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
                bomRequirements: [
                  {
                    id: 'br-st-2-3-1',
                    partId: '3',
                    partNumber: 'ELC-003',
                    partName: 'Circuit Board',
                    requiredQuantity: 3,
                    consumedQuantity: 0,
                    availableQuantity: 3,
                    status: 'AVAILABLE'
                  }
                ]
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
            isExpanded: false,
            bomRequirements: [
              {
                id: 'br-3-1',
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
        
        setProcesses(mockProcesses);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching process planning data:', error);
        setLoading(false);
      }
    };

    fetchProcessData();
  }, [lotId]);

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

  const getBOMStatusColor = (status: string) => {
    const colors = {
      AVAILABLE: 'bg-green-100 text-green-700',
      PARTIAL: 'bg-yellow-100 text-yellow-700',
      SHORTAGE: 'bg-red-100 text-red-700',
      CONSUMED: 'bg-gray-100 text-gray-700'
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

  const toggleProcessExpansion = (processId: string) => {
    setProcesses(prevProcesses => 
      prevProcesses.map(process => 
        process.id === processId 
          ? { ...process, isExpanded: !process.isExpanded }
          : process
      )
    );
  };

  const filteredProcesses = processes.filter(process => {
    const matchesSearch = process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         process.responsiblePersonName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || process.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalEstimatedHours = processes.reduce((sum, process) => sum + process.estimatedDuration, 0);
  const completedProcesses = processes.filter(p => p.status === 'COMPLETED').length;
  const inProgressProcesses = processes.filter(p => p.status === 'IN_PROGRESS').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processes</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processes.length}</div>
            <p className="text-xs text-muted-foreground">
              Manufacturing steps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstimatedHours}h</div>
            <p className="text-xs text-muted-foreground">
              Total duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <PlayCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressProcesses}</div>
            <p className="text-xs text-muted-foreground">
              Active processes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProcesses}</div>
            <p className="text-xs text-muted-foreground">
              Finished processes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Process Planning */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Manufacturing Processes</CardTitle>
              <CardDescription>
                Define and manage the manufacturing process flow for this lot
              </CardDescription>
            </div>
            <Dialog open={showNewProcess} onOpenChange={setShowNewProcess}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Process
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Process</DialogTitle>
                  <DialogDescription>
                    Define a new manufacturing process step
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="process-name" className="text-right">Process Name</Label>
                    <Input id="process-name" placeholder="Enter process name" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <Textarea id="description" placeholder="Process description" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="responsible" className="text-right">Responsible Person</Label>
                    <Input id="responsible" placeholder="Enter responsible person name" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="duration" className="text-right">Duration (hours)</Label>
                    <Input id="duration" type="number" placeholder="8" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Process</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search Processes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by process name or responsible person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Process Flow */}
          <div className="space-y-4">
            {filteredProcesses.map((process, index) => (
              <div key={process.id} className="space-y-2">
                {/* Process Header */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleProcessExpansion(process.id)}
                              className="p-0 h-auto"
                            >
                              {process.isExpanded ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                          {process.sequence}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{process.name}</h3>
                            <Badge className={getStatusColor(process.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(process.status)}
                                {process.status}
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{process.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-muted-foreground">Duration</div>
                          <div className="font-medium">{process.estimatedDuration}h</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Responsible</div>
                          <div className="font-medium">{process.responsiblePersonName}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingProcess(process)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Sub-tasks (Collapsible) */}
                  <Collapsible open={process.isExpanded}>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Sub-Tasks ({process.subTasks.length})
                              </h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowScheduleDialog(true)}
                                className="flex items-center gap-1 text-xs"
                              >
                                <Calendar className="h-3 w-3" />
                                View Schedule
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowNewSubTask(process.id)}
                              className="flex items-center gap-1"
                            >
                              Add Sub-Task
                            </Button>
                          </div>
                          
                          <div className="grid gap-2">
                            {process.subTasks.map((subTask) => (
                              <div key={subTask.id} className="p-3 bg-muted/30 rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(subTask.status)}
                                      <Badge className={getStatusColor(subTask.status)} variant="outline">
                                        {subTask.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm">{subTask.name}</div>
                                      <div className="text-xs text-muted-foreground">{subTask.description}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                      <div className="text-muted-foreground text-xs">Operator</div>
                                      <div className="font-medium">{subTask.operatorName}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-muted-foreground text-xs">Duration</div>
                                      <div className="font-medium">{subTask.estimatedDuration}h</div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingSubTask(subTask)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* BOM Requirements for Sub-Task */}
                                {subTask.bomRequirements && subTask.bomRequirements.length > 0 && (
                                  <div className="border-t pt-2 mt-2">
                                    <h6 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                      <Package className="h-3 w-3" />
                                      Required BOM Parts ({subTask.bomRequirements.length})
                                    </h6>
                                    <div className="grid gap-1">
                                      {subTask.bomRequirements.map((bomPart) => (
                                        <div key={bomPart.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono">{bomPart.partNumber}</span>
                                            <span className="text-muted-foreground">{bomPart.partName}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Req: {bomPart.requiredQuantity}</span>
                                            <span className="text-muted-foreground">Avail: {bomPart.availableQuantity}</span>
                                            <Badge className={getBOMStatusColor(bomPart.status)} variant="outline">
                                              {bomPart.status}
                                            </Badge>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Process-Level BOM Requirements */}
                          {process.bomRequirements && process.bomRequirements.length > 0 && (
                            <div className="mt-4 border-t pt-3">
                              <h5 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <Package className="h-4 w-4" />
                                Process BOM Requirements ({process.bomRequirements.length})
                              </h5>
                              <div className="grid gap-2">
                                {process.bomRequirements.map((bomPart) => (
                                  <div key={bomPart.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono font-medium">{bomPart.partNumber}</span>
                                      <span className="text-muted-foreground">{bomPart.partName}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-center">
                                        <div className="text-xs text-muted-foreground">Required</div>
                                        <div className="font-medium">{bomPart.requiredQuantity}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-xs text-muted-foreground">Available</div>
                                        <div className="font-medium">{bomPart.availableQuantity}</div>
                                      </div>
                                      <Badge className={getBOMStatusColor(bomPart.status)} variant="outline">
                                        {bomPart.status}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
                
                {/* Process Flow Arrow */}
                {index < filteredProcesses.length - 1 && (
                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredProcesses.length === 0 && (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-medium mb-2">No processes found</div>
              <div className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create processes to define the manufacturing workflow'
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE SUB-TASK DIALOG */}
      <Dialog open={!!showNewSubTask} onOpenChange={(open) => !open && setShowNewSubTask(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Sub-Task</DialogTitle>
            <DialogDescription>
              Add a new sub-task with required BOM parts and specifications
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Basic Sub-Task Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Sub-Task Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtask-name">Sub-Task Name</Label>
                  <Input id="subtask-name" placeholder="Enter sub-task name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtask-operator">Assigned Operator</Label>
                  <Input id="subtask-operator" placeholder="Enter operator name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtask-description">Description</Label>
                <Textarea id="subtask-description" placeholder="Describe the sub-task" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtask-duration">Duration (hours)</Label>
                  <Input id="subtask-duration" type="number" placeholder="2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtask-status">Status</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="BLOCKED">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtask-notes">Notes</Label>
                <Textarea id="subtask-notes" placeholder="Additional notes or instructions" />
              </div>
            </div>

            {/* BOM Parts Selection */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Required BOM Parts
                </h4>
                <Badge variant="outline">
                  Available from Process BOM
                </Badge>
              </div>
              
              {showNewSubTask && (
                <div className="space-y-3">
                  {(() => {
                    const currentProcess = processes.find(p => p.id === showNewSubTask);
                    if (!currentProcess?.bomRequirements || currentProcess.bomRequirements.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No BOM parts available for this process</p>
                          <p className="text-xs">Add BOM requirements to the parent process first</p>
                        </div>
                      );
                    }
                    
                    return currentProcess.bomRequirements.map((bomPart) => (
                      <div key={bomPart.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              id={`bom-${bomPart.id}`} 
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <Label htmlFor={`bom-${bomPart.id}`} className="flex items-center gap-2">
                              <span className="font-mono font-medium">{bomPart.partNumber}</span>
                              <span className="text-muted-foreground">{bomPart.partName}</span>
                            </Label>
                          </div>
                          <Badge className={getBOMStatusColor(bomPart.status)} variant="outline">
                            {bomPart.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 ml-7">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Required Quantity</Label>
                            <Input 
                              type="number" 
                              placeholder="0"
                              max={bomPart.availableQuantity}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Available</Label>
                            <div className="h-8 px-3 bg-muted rounded-md flex items-center text-sm">
                              {bomPart.availableQuantity}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Unit</Label>
                            <Input 
                              placeholder="pcs, kg, m"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        
                        {bomPart.status === 'SHORTAGE' && (
                          <div className="ml-7 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            ⚠️ Insufficient stock available. Consider adjusting quantity or ordering more.
                          </div>
                        )}
                      </div>
                    ));
                  })()
                  }
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewSubTask(null)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Sub-Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GANTT CHART SCHEDULE DIALOG */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Production Schedule - Gantt Chart
            </DialogTitle>
            <DialogDescription>
              Gantt chart showing timeline and dependencies for all processes with BOM parts tracking
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 overflow-y-auto max-h-[70vh]">
            {/* Timeline Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <Button size="sm" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Today: Feb 5, 2026
                </Button>
                <div className="text-sm text-muted-foreground">
                  Total Duration: {processes.reduce((sum, p) => sum + p.estimatedDuration, 0)}h
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">Days View</Button>
                <Button size="sm" variant="outline">Hours View</Button>
                <Button size="sm" variant="outline">BOM View</Button>
              </div>
            </div>

            {/* Timeline Grid */}
            <div className="space-y-4">
              {/* Time Scale */}
              <div className="flex items-center">
                <div className="w-80"></div>
                <div className="flex-1 grid grid-cols-9 gap-1 text-xs text-muted-foreground">
                  {Array.from({length: 9}, (_, i) => (
                    <div key={i} className="text-center py-1 border-l border-muted">
                      Feb {5 + Math.floor(i / 3)}
                      <div className="text-xs opacity-60">
                        {['AM', 'PM', 'Night'][i % 3]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Process Timeline */}
              {processes.map((process) => (
                <div key={process.id} className="space-y-2">
                  {/* Main Process Row */}
                  <div className="flex items-center group">
                    <div className="w-80 pr-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(process.status)}>
                            {getStatusIcon(process.status)}
                            {process.status}
                          </Badge>
                          <div>
                            <div className="font-medium text-sm">{process.name}</div>
                            <div className="text-xs text-muted-foreground">{process.responsiblePersonName}</div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingSchedule({processId: process.id})}
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 relative h-8 bg-muted/20 rounded cursor-pointer hover:bg-muted/30">
                      <div 
                        className="absolute top-1 h-6 rounded flex items-center px-2" 
                        style={{
                          backgroundColor: 'rgb(59, 130, 246)',
                          left: '0%',
                          width: `${(process.estimatedDuration / 36) * 100}%`,
                          opacity: 0.8
                        }}
                      >
                        <div className="text-white text-xs font-medium truncate">
                          {process.actualDuration || 0}% • {process.estimatedDuration}h
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Tasks */}
                  {process.subTasks.map((subTask, subIndex) => (
                    <div key={subTask.id} className="flex items-center ml-4 group">
                      <div className="w-76 pr-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(subTask.status)} scale-75`}>
                              {getStatusIcon(subTask.status)}
                            </Badge>
                            <div>
                              <div className="font-medium text-xs">{subTask.name}</div>
                              <div className="text-xs text-muted-foreground">{subTask.operatorName}</div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setEditingSchedule({processId: process.id, subTaskId: subTask.id})}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 relative h-6 bg-muted/10 rounded cursor-pointer hover:bg-muted/20">
                        <div 
                          className="absolute top-1 h-4 rounded flex items-center px-1" 
                          style={{
                            backgroundColor: 'rgb(59, 130, 246)',
                            left: `${(subIndex * 11.1111)}%`,
                            width: `${(subTask.estimatedDuration / 36) * 100}%`,
                            opacity: 0.6
                          }}
                        >
                          <div className="text-white text-xs truncate">
                            {subTask.actualDuration || 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* BOM Parts Timeline for Process */}
                  {process.bomRequirements && process.bomRequirements.length > 0 && (
                    <div className="ml-8 space-y-1 border-l-2 border-dashed border-muted pl-4">
                      <h6 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        BOM Parts Consumption
                      </h6>
                      {process.bomRequirements.map((bomPart) => (
                        <div key={bomPart.id} className="flex items-center group">
                          <div className="w-72 pr-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={`${getBOMStatusColor(bomPart.status)} scale-75`} variant="outline">
                                  {bomPart.status}
                                </Badge>
                                <div>
                                  <div className="font-mono text-xs">{bomPart.partNumber}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Req: {bomPart.requiredQuantity} | Avail: {bomPart.availableQuantity}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 relative h-4 bg-muted/10 rounded">
                            <div 
                              className="absolute top-0.5 h-3 rounded" 
                              style={{
                                backgroundColor: bomPart.status === 'AVAILABLE' ? 'rgb(34, 197, 94)' : 
                                               bomPart.status === 'PARTIAL' ? 'rgb(234, 179, 8)' : 'rgb(239, 68, 68)',
                                left: '0%',
                                width: `${Math.min((bomPart.requiredQuantity / bomPart.availableQuantity) * 100, 100)}%`,
                                opacity: 0.7
                              }}
                            >
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Edit Schedule Form */}
            {editingSchedule && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Edit Schedule</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <DatePicker />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <DatePicker />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (hours)</Label>
                    <Input type="number" placeholder="8" />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm">
                    Save Changes
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingSchedule(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Close
            </Button>
            <Button>
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};