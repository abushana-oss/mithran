'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useProductionProcesses } from '@/lib/hooks/useProductionProcesses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Edit,
  Calendar,
  PlayCircle,
  StopCircle,
  ChevronDown,
  ChevronRight,
  Users,
  Package,
  Trash2,

  Search,
  Plus,
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DatePicker } from "@/components/ui/date-picker";
import { apiClient } from "@/lib/api/client";

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

interface MainProcessSection {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  isExpanded?: boolean;
  subProcesses: ProcessStep[];
}

interface ProcessPlanningProps {
  lotId: string;
}

const defaultMainSections: MainProcessSection[] = [
  {
    id: 'raw-material',
    name: 'Raw Material',
    description: 'Raw material preparation and handling',
    startDate: '',
    endDate: '',
    estimatedDuration: 8,
    status: 'PLANNED',
    isExpanded: false,
    subProcesses: []
  },
  {
    id: 'process-conversion',
    name: 'Process Conversion',
    description: 'Manufacturing and processing operations',
    startDate: '',
    endDate: '',
    estimatedDuration: 8,
    status: 'PLANNED',
    isExpanded: false,
    subProcesses: []
  },
  {
    id: 'inspection',
    name: 'Inspection',
    description: 'Quality control and inspection processes',
    startDate: '',
    endDate: '',
    estimatedDuration: 8,
    status: 'PLANNED',
    isExpanded: false,
    subProcesses: []
  },
  {
    id: 'packing',
    name: 'Packing',
    description: 'Final packaging and preparation for delivery',
    startDate: '',
    endDate: '',
    estimatedDuration: 8,
    status: 'PLANNED',
    isExpanded: false,
    subProcesses: []
  }
];


// Flags to prevent duplicate process creation calls
const creatingProcessFlags: Record<string, boolean> = {};

export const ProcessPlanning = ({ lotId }: ProcessPlanningProps) => {
  const [processes, setProcesses] = useState<ProcessStep[]>([]);
  const [mainSections, setMainSections] = useState<MainProcessSection[]>(defaultMainSections);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingProcess, setEditingProcess] = useState<ProcessStep | null>(null);

  const [showNewProcess, setShowNewProcess] = useState(false);
  const [showNewSubTask, setShowNewSubTask] = useState<string | null>(null);
  const [selectedBOMParts, setSelectedBOMParts] = useState<{ [key: string]: { selected: boolean, quantity: number, unit: string } }>({});
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<{ processId?: string, subTaskId?: string } | null>(null);
  const [lotBomItems, setLotBomItems] = useState<BOMPartRequirement[]>([]);

  // Form state for new process
  const [processName, setProcessName] = useState('');
  const [processDescription, setProcessDescription] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [duration, setDuration] = useState('');

  // Form state for editing process
  const [editProcessName, setEditProcessName] = useState('');
  const [editProcessDescription, setEditProcessDescription] = useState('');
  const [editResponsiblePerson, setEditResponsiblePerson] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // Form state for editing main sections (dates only)
  // const [mainSectionStartDate, setMainSectionStartDate] = useState('');
  // const [mainSectionEndDate, setMainSectionEndDate] = useState('');

  // Form state for new sub-task
  const [subTaskName, setSubTaskName] = useState('');

  const [subTaskOperator, setSubTaskOperator] = useState('');
  const [subTaskStartDate, setSubTaskStartDate] = useState('');
  const [subTaskEndDate, setSubTaskEndDate] = useState('');
  const [subTaskStatus, setSubTaskStatus] = useState('PENDING');

  // Autocomplete state
  const [processNameSuggestions, setProcessNameSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const { createProcess, getAvailableProcesses, getProcessesByLot, deleteProcess, updateProcess, getLotBomItems, loading: apiLoading } = useProductionProcesses();

  // Debounced search for process suggestions
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const searchProcessSuggestions = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setProcessNameSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response: any = await getAvailableProcesses();
      const allProcesses = response.processes || response.data || [];

      // Filter processes that match the search term
      const filtered = allProcesses.filter((process: any) =>
        process.processName?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions

      setProcessNameSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } catch (error) {
      console.error('Failed to fetch process suggestions:', error);
      setProcessNameSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [getAvailableProcesses]);

  const handleProcessNameChange = (value: string) => {
    setProcessName(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchProcessSuggestions(value);
    }, 300);
  };

  const handleSuggestionSelect = (suggestion: any) => {
    setProcessName(suggestion.processName);
    setProcessDescription(suggestion.description || '');
    setShowSuggestions(false);
  };

  // Date editing handlers
  const handleDateSelect = async (sectionId: string, dateType: 'start' | 'end', selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    const dateString = selectedDate.toISOString().split('T')[0];

    setMainSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        const updatedSection = {
          ...section,
          [dateType === 'start' ? 'startDate' : 'endDate']: dateString
        };

        // If both dates are now set and no process exists, create one automatically
        const hasStartDate = dateType === 'start' ? dateString : section.startDate;
        const hasEndDate = dateType === 'end' ? dateString : section.endDate;

        if (hasStartDate && hasStartDate.trim() !== '' &&
          hasEndDate && hasEndDate.trim() !== '' &&
          section.subProcesses.length === 0) {
          // Create a default production process for this section
          // Use a unique flag to prevent duplicate creation
          const processKey = `${lotId}-${sectionId}-process-creation`;
          if (!creatingProcessFlags[processKey]) {
            creatingProcessFlags[processKey] = true;

            setTimeout(async () => {
              try {
                // Double-check that process wasn't already created
                setMainSections(currentSections => {
                  const currentState = currentSections.find(s => s.id === sectionId);
                  if (currentState && currentState.subProcesses.length > 0) {
                    console.log('Process already exists, skipping creation');
                    delete creatingProcessFlags[processKey];
                    return currentSections; // Return unchanged state
                  }

                  // If we reach here, proceed with process creation
                  return currentSections; // Return unchanged state for now
                });

                // Final check before making API call
                const finalCheck = mainSections.find(s => s.id === sectionId);
                if (finalCheck && finalCheck.subProcesses.length > 0) {
                  console.log('Process already exists after final check, skipping creation');
                  delete creatingProcessFlags[processKey];
                  return;
                }

                const processData = {
                  production_lot_id: lotId,
                  process_name: `${section.name} Process`,
                  description: section.description,
                  planned_start_date: hasStartDate,
                  planned_end_date: hasEndDate
                };

                console.log('Auto-creating production process for section:', processData);

                const response = await apiClient.post(`/production-planning/lots/${lotId}/processes`, processData) as any;

                console.log('Production process created:', response);
                console.log('Response structure:', JSON.stringify(response, null, 2));

                // Extract the actual process ID from response - must be a UUID
                const processId = response?.id || response?.data?.id || response?.process_id;
                console.log('Extracted process ID:', processId);
                
                if (!processId) {
                  console.error('No valid process ID found in response:', response);
                  throw new Error('Invalid response: no process ID found');
                }
                
                // Validate that the ID is a UUID
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(processId)) {
                  console.error('Invalid process ID format. Expected UUID, got:', processId);
                  throw new Error(`Invalid process ID format: ${processId}`);
                }

                // Update the section with the new process
                setMainSections(prev2 => prev2.map(section2 => {
                  if (section2.id === sectionId) {
                    return {
                      ...section2,
                      subProcesses: [{
                        id: processId, // This must be a UUID from the API response
                        name: section.name,
                        description: section.description,
                        sequence: 1,
                        estimatedDuration: section.estimatedDuration,
                        actualDuration: null,
                        startDate: hasStartDate,
                        endDate: hasEndDate,
                        responsiblePerson: '',
                        responsiblePersonName: '',
                        status: 'PLANNED',
                        dependencies: [],
                        subTasks: [],
                        notes: '',
                        bomRequirements: []
                      }]
                    };
                  }
                  return section2;
                }));

                // Clear the flag after successful creation
                delete creatingProcessFlags[processKey];

              } catch (error) {
                console.error('Error auto-creating production process:', error);
                // Clear the flag so user can try again
                delete creatingProcessFlags[processKey];
              }
            }, 100); // Small delay to ensure state update completes
          }
        }

        return updatedSection;
      }
      return section;
    }));
  };

  // Handler for deleting a process
  const handleDeleteProcess = async (processId: string) => {
    if (!window.confirm('Are you sure you want to delete this process? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteProcess(processId);

      // Refresh the process list after deletion
      await refreshProcessData();
    } catch (error) {
      console.error('Error deleting process:', error);
    }
  };

  // Function to refresh process data
  const refreshProcessData = async () => {
    try {
      const processData = await getProcessesByLot(lotId);
      // Transform API data to match the expected interface
      const dataArray = processData?.data || processData || [];
      const transformedProcesses: ProcessStep[] = (Array.isArray(dataArray) ? dataArray : []).map((process: any) => {
        return {
          id: process.id,
          name: process.processName || process.process_name || process.name || process.title || 'Unnamed Process',
          description: process.description || '',
          sequence: process.processSequence || process.process_sequence || 0,
          estimatedDuration: process.estimatedDuration || 0,
          actualDuration: null,
          startDate: (process.planned_start_date ? new Date(process.planned_start_date).toISOString().split('T')[0] : (process.plannedStartDate ? new Date(process.plannedStartDate).toISOString().split('T')[0] : '')) as string,
          endDate: (process.planned_end_date ? new Date(process.planned_end_date).toISOString().split('T')[0] : (process.plannedEndDate ? new Date(process.plannedEndDate).toISOString().split('T')[0] : '')) as string,
          responsiblePerson: process.responsiblePerson || process.responsible_person || '',
          responsiblePersonName: process.responsiblePerson || process.responsible_person || '',
          status: process.status?.toUpperCase() || 'PLANNED',
          dependencies: process.dependsOnProcessId ? [process.dependsOnProcessId] : [],
          notes: process.remarks || '',
          isExpanded: false,
          bomRequirements: [],
          subTasks: process.subTasks || []
        };
      });

      // Organize processes under "Process Conversion" section
      setMainSections(prev => prev.map(section =>
        section.id === 'process-conversion'
          ? { ...section, subProcesses: transformedProcesses }
          : section
      ));
    } catch (error) {
      console.error('Error refreshing process data:', error);
    }
  };

  // Handler for creating a new process
  const handleCreateProcess = async () => {
    try {
      if (!processName.trim()) {
        alert('Please enter a process name');
        return;
      }

      await createProcess({
        productionLotId: lotId,
        processName: processName.trim(),
        description: processDescription.trim(),
        responsiblePerson: responsiblePerson.trim(),
        plannedStartDate: new Date().toISOString(),
        plannedEndDate: new Date(Date.now() + (parseInt(duration) || 8) * 60 * 60 * 1000).toISOString(),
      });

      // Reset form
      setProcessName('');
      setProcessDescription('');
      setResponsiblePerson('');
      setDuration('');
      setShowNewProcess(false);

      // Refresh the process list
      await refreshProcessData();
    } catch (error) {
      console.error('Error creating process:', error);
    }
  };

  // Function to calculate duration in hours between two dates
  const calculateDurationInHours = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 8; // Default 8 hours if dates not set

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) return 8; // Default if end is before or same as start

    const diffInMs = end.getTime() - start.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60); // Convert milliseconds to hours

    return Math.round(diffInHours);
  };

  // Function to calculate timeline position based on dates
  const calculateTimelinePosition = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return { left: 0, width: 10 };

    const projectStart = new Date(); // Today as baseline
    const processStart = new Date(startDate);
    const processEnd = new Date(endDate);

    // Calculate days from project start
    const daysFromStart = Math.max((processStart.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24), 0);
    const duration = Math.max((processEnd.getTime() - processStart.getTime()) / (1000 * 60 * 60 * 24), 0.5);

    // Scale to fit in timeline (assuming 30 days visible)
    const left = Math.min((daysFromStart / 30) * 100, 90);
    const width = Math.max((duration / 30) * 100, 2);

    return { left, width };
  };

  // Update duration when dates change
  const handleStartDateChange = (date: string) => {
    setEditStartDate(date);
    if (date && editEndDate) {
      const calculatedDuration = calculateDurationInHours(date, editEndDate);
      setEditDuration(calculatedDuration.toString());
    }
  };

  const handleEndDateChange = (date: string) => {
    setEditEndDate(date);
    if (editStartDate && date) {
      const calculatedDuration = calculateDurationInHours(editStartDate, date);
      setEditDuration(calculatedDuration.toString());
    }
  };

  // Handler for starting edit process
  const handleEditProcess = (process: ProcessStep) => {
    setEditProcessName(process.name);
    setEditProcessDescription(process.description);
    setEditResponsiblePerson(process.responsiblePersonName);
    setEditDuration('8'); // Default duration
    setEditStartDate(process.startDate || '');
    setEditEndDate(process.endDate || '');
    setEditingProcess(process);
  };

  // Handler for updating a process
  const handleUpdateProcess = async () => {
    if (!editingProcess) return;

    try {
      if (!editProcessName.trim()) {
        alert('Please enter a process name');
        return;
      }

      const startDate = editStartDate ? new Date(editStartDate).toISOString() : new Date().toISOString();
      const endDate = editEndDate ? new Date(editEndDate).toISOString() : new Date(Date.now() + (parseInt(editDuration) || 8) * 60 * 60 * 1000).toISOString();

      await updateProcess(editingProcess.id, {
        processName: editProcessName.trim(),
        description: editProcessDescription.trim(),
        responsiblePerson: editResponsiblePerson.trim(),
        plannedStartDate: startDate,
        plannedEndDate: endDate,
      });

      // Reset edit form
      setEditProcessName('');
      setEditProcessDescription('');
      setEditResponsiblePerson('');
      setEditDuration('');
      setEditStartDate('');
      setEditEndDate('');
      setEditingProcess(null);

      // Refresh the process list
      await refreshProcessData();
    } catch (error) {
      console.error('Error updating process:', error);
    }
  };

  // Handler for creating a new sub-task
  const handleCreateSubTask = async () => {
    try {
      if (!subTaskName.trim()) {
        alert('Please enter a sub-task name');
        return;
      }

      if (!subTaskOperator.trim()) {
        alert('Please enter an assigned operator');
        return;
      }

      // Find the current section to get the process ID
      const currentSection = mainSections.find(section => section.id === showNewSubTask);
      if (!currentSection) {
        alert('Cannot create subtask: Section not found');
        return;
      }

      if (!currentSection.subProcesses.length) {
        alert('Cannot create subtask: No production process found. This should have been created automatically when you set the dates. Please try refreshing the page.');
        return;
      }

      // Use the first process in the section for the subtask
      const targetProcess = currentSection.subProcesses[0];
      console.log('Target process for subtask:', targetProcess);
      console.log('Current section:', currentSection);

      if (!targetProcess) {
        alert('Cannot create subtask: No target process found in section');
        return;
      }

      if (!targetProcess.id) {
        alert(`Cannot create subtask: Production process ID is missing. Process: ${JSON.stringify(targetProcess)}`);
        return;
      }

      // Validate that the ID looks like a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(targetProcess.id)) {
        alert(`Cannot create subtask: Invalid process ID format. ID: ${targetProcess.id}`);
        return;
      }

      // Get selected BOM parts with quantities
      const selectedBomParts = Object.entries(selectedBOMParts)
        .filter(([_, config]) => config.selected && config.quantity > 0)
        .map(([bomItemId, config]) => ({
          bom_item_id: bomItemId,
          required_quantity: config.quantity,
          unit: config.unit || 'pcs'
        }));

      // Prepare subtask data for API
      const subtaskData = {
        productionProcessId: targetProcess.id,
        taskName: subTaskName.trim(),
        assignedOperator: subTaskOperator.trim(),
        taskSequence: 1, // Will be auto-calculated by database
        plannedStartDate: subTaskStartDate || undefined,
        plannedEndDate: subTaskEndDate || undefined,
        bomParts: selectedBomParts
      };

      console.log('Creating subtask with data:', subtaskData);

      // Make API call to create subtask
      const response = await apiClient.post(
        `/production-planning/processes/${targetProcess.id}/subtasks`,
        subtaskData
      );

      console.log('Subtask created successfully:', response);

      // Refresh the data to show the new subtask
      await refreshProcessData();

      // Reset form
      setSubTaskName('');
      setSubTaskOperator('');
      setSubTaskStartDate('');
      setSubTaskEndDate('');
      setSubTaskStatus('PENDING');
      setSelectedBOMParts({});
      setShowNewSubTask(null);

      // Show success message
      alert(`Sub-task "${subtaskData.taskName}" created successfully!`);

    } catch (error) {
      console.error('Error creating sub-task:', error);
      alert('Error creating sub-task: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Function to fetch BOM items for the lot
  const fetchLotBomItems = async () => {
    if (!lotId || lotId.trim() === '') {
      return;
    }

    try {
      const bomData = await getLotBomItems(lotId, true);
      const bomItems = bomData?.data || [];

      // Transform BOM items to match the BOMPartRequirement interface
      const transformedBomItems: BOMPartRequirement[] = bomItems.map((item: any) => ({
        id: item.id || `${item.partId}-${Date.now()}`,
        partId: item.partId || item.part_id,
        partNumber: item.partNumber || item.part_number || '',
        partName: item.partName || item.part_name || item.name || '',
        requiredQuantity: item.requiredQuantity || item.required_quantity || 0,
        consumedQuantity: item.consumedQuantity || item.consumed_quantity || 0,
        availableQuantity: item.availableQuantity || item.available_quantity || item.quantity || 0,
        status: item.status?.toUpperCase() || 'AVAILABLE'
      }));

      setLotBomItems(transformedBomItems);
      return transformedBomItems;
    } catch (error: any) {
      console.log('BOM items not found or error fetching:', error);
      setLotBomItems([]);
      return [];
    }
  };

  useEffect(() => {
    const fetchProcessData = async () => {
      // Skip API call if lotId is not provided
      if (!lotId || lotId.trim() === '') {
        console.log('No lotId provided, skipping process data fetch');
        setProcesses([]);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching processes for lotId:', lotId);

        // Fetch processes first
        const processData = await getProcessesByLot(lotId, true);

        // Fetch BOM items
        const bomItems = await fetchLotBomItems();

        // Handle process data
        if (processData) {
          // Transform API data to match the expected interface
          const dataArray = (processData as any).data || processData || [];
          const transformedProcesses: ProcessStep[] = (Array.isArray(dataArray) ? dataArray : []).map((process: any) => ({
            id: process.id,
            name: process.processName || process.process_name || process.name || process.title || 'Unnamed Process',
            description: process.description || '',
            sequence: process.processSequence || process.process_sequence || 0,
            estimatedDuration: process.estimatedDuration || 0,
            actualDuration: null,
            startDate: (process.planned_start_date ? new Date(process.planned_start_date).toISOString().split('T')[0] : (process.plannedStartDate ? new Date(process.plannedStartDate).toISOString().split('T')[0] : '')) as string,
            endDate: (process.planned_end_date ? new Date(process.planned_end_date).toISOString().split('T')[0] : (process.plannedEndDate ? new Date(process.plannedEndDate).toISOString().split('T')[0] : '')) as string,
            responsiblePerson: process.responsiblePerson || '',
            responsiblePersonName: process.responsiblePerson || '',
            status: process.status?.toUpperCase() || 'PLANNED',
            dependencies: process.dependsOnProcessId ? [process.dependsOnProcessId] : [],
            notes: process.remarks || '',
            isExpanded: false,
            bomRequirements: bomItems || [], // Use the fetched BOM items directly
            subTasks: process.subTasks || []
          }));

          // Organize processes under "Process Conversion" section
          setMainSections(prev => prev.map(section =>
            section.id === 'process-conversion'
              ? { ...section, subProcesses: transformedProcesses }
              : section
          ));
        } else {
          console.log('Production lot not found - this may be a new lot without processes yet');
          setProcesses([]);
        }

        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching process planning data:', error);

        // Show a user-friendly message for lot not found
        if (error?.message?.includes('Production lot not found')) {
          console.log('Production lot not found - this may be a new lot without processes yet');
        }

        setMainSections(defaultMainSections); // Reset to default sections on error
        setLoading(false);
      }
    };

    fetchProcessData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);


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



  const filteredMainSections = mainSections.map(section => ({
    ...section,
    subProcesses: section.subProcesses.filter(process => {
      const matchesSearch = (process.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (process.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (process.responsiblePersonName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || process.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
  }));

  const allProcesses = mainSections.flatMap(section => section.subProcesses);
  const totalEstimatedHours = allProcesses.reduce((sum, process) => sum + process.estimatedDuration, 0);
  const completedProcesses = allProcesses.filter(p => p.status === 'COMPLETED').length;
  const inProgressProcesses = allProcesses.filter(p => p.status === 'IN_PROGRESS').length;

  const currentSubTaskSection = mainSections.find(section => section.id === showNewSubTask);

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
                    <div className="col-span-3 relative">
                      <Input
                        id="process-name"
                        placeholder="Type to search existing processes..."
                        value={processName}
                        onChange={(e) => handleProcessNameChange(e.target.value)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onFocus={() => processName.length >= 2 && setShowSuggestions(processNameSuggestions.length > 0)}
                      />

                      {/* Suggestions Dropdown */}
                      {showSuggestions && (
                        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                          {loadingSuggestions && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              Searching processes...
                            </div>
                          )}

                          {!loadingSuggestions && processNameSuggestions.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className="px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b border-border last:border-b-0 transition-colors"
                              onClick={() => handleSuggestionSelect(suggestion)}
                            >
                              <div className="font-medium text-sm text-foreground">{suggestion.processName}</div>
                              <div className="text-xs text-muted-foreground">{suggestion.processCategory}</div>
                              {suggestion.description && (
                                <div className="text-xs text-muted-foreground/70 truncate mt-1">
                                  {suggestion.description}
                                </div>
                              )}
                            </div>
                          ))}

                          {!loadingSuggestions && processNameSuggestions.length === 0 && processName.length >= 2 && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              No matching processes found. You can create a new one.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Process description"
                      className="col-span-3"
                      value={processDescription}
                      onChange={(e) => setProcessDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="responsible" className="text-right">Responsible Person</Label>
                    <Input
                      id="responsible"
                      placeholder="Enter responsible person name"
                      className="col-span-3"
                      value={responsiblePerson}
                      onChange={(e) => setResponsiblePerson(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="duration" className="text-right">Duration (hours)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="8"
                      className="col-span-3"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={handleCreateProcess}
                    disabled={apiLoading}
                  >
                    {apiLoading ? 'Creating...' : 'Create Process'}
                  </Button>
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

          {/* Main Process Sections */}
          <div className="space-y-4">
            {filteredMainSections.map((mainSection) => (
              <div key={mainSection.id} className="space-y-4">
                {/* Main Section Header */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setMainSections(prev => prev.map(s =>
                                  s.id === mainSection.id
                                    ? { ...s, isExpanded: !s.isExpanded }
                                    : s
                                ));
                              }}
                              className="p-0 h-auto"
                            >
                              {mainSection.isExpanded ?
                                <ChevronDown className="h-4 w-4" /> :
                                <ChevronRight className="h-4 w-4" />
                              }
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{mainSection.name}</h3>
                            <Badge className={getStatusColor(mainSection.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(mainSection.status)}
                                {mainSection.status}
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{mainSection.description}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <DatePicker
                            date={mainSection.startDate ? new Date(mainSection.startDate) : undefined}
                            onDateChange={(date) => handleDateSelect(mainSection.id, 'start', date)}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <DatePicker
                            date={mainSection.endDate ? new Date(mainSection.endDate) : undefined}
                            onDateChange={(date) => handleDateSelect(mainSection.id, 'end', date)}
                            className="w-full"
                          />
                        </div>

                      </div>
                    </div>
                  </CardHeader>

                  {/* Sub-Processes (Collapsible) */}
                  <Collapsible open={mainSection.isExpanded}>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Sub-Processes ({mainSection.subProcesses.length})
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
                            {/* Debug info - remove after testing */}
                            {process.env.NODE_ENV === 'development' && (
                              <div className="text-xs text-gray-500">
                                Start: {mainSection.startDate || 'None'} | End: {mainSection.endDate || 'None'}
                              </div>
                            )}

                            {(mainSection.startDate && mainSection.startDate.trim() !== '') &&
                              (mainSection.endDate && mainSection.endDate.trim() !== '') ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowNewSubTask(mainSection.id);
                                  // Pre-fill dates with parent process dates
                                  setSubTaskStartDate(mainSection.startDate || '');
                                  setSubTaskEndDate(mainSection.endDate || '');
                                }}
                                className="flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Sub-Process
                              </Button>
                            ) : (
                              <div className="text-xs text-muted-foreground italic">
                                Set start and end dates to enable subtask creation
                              </div>
                            )}
                          </div>

                          <div className="grid gap-2">
                            {mainSection.subProcesses.map((subProcess, index) => (
                              <div key={subProcess.id || `${mainSection.id}-process-${index}`} className="p-3 bg-muted/30 rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(subProcess.status)}
                                      <Badge className={getStatusColor(subProcess.status)} variant="outline">
                                        {subProcess.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm">{subProcess.name}</div>
                                      <div className="text-xs text-muted-foreground">{subProcess.description}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="text-center">
                                      <div className="text-muted-foreground text-xs">Start Date</div>
                                      <div className="font-medium">{subProcess.startDate ? new Date(subProcess.startDate).toLocaleDateString() : 'Not set'}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-muted-foreground text-xs">End Date</div>
                                      <div className="font-medium">{subProcess.endDate ? new Date(subProcess.endDate).toLocaleDateString() : 'Not set'}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-muted-foreground text-xs">Duration</div>
                                      <div className="font-medium">{subProcess.estimatedDuration}h</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-muted-foreground text-xs">Responsible</div>
                                      <div className="font-medium">{subProcess.responsiblePersonName}</div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditProcess(subProcess)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteProcess(subProcess.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* BOM Requirements for Sub-Task */}
                                {subProcess.bomRequirements && subProcess.bomRequirements.length > 0 && (
                                  <div className="border-t pt-2 mt-2">
                                    <h6 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                      <Package className="h-3 w-3" />
                                      Required BOM Parts ({subProcess.bomRequirements.length})
                                    </h6>
                                    <div className="grid gap-1">
                                      {subProcess.bomRequirements.map((bomPart) => (
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


                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>

              </div>
            ))}
          </div>

          {filteredMainSections.length === 0 && (
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
            < div className="space-y-4" >
              <h4 className="font-medium text-sm">Sub-Task Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtask-name">Sub-Task Name</Label>
                  <Input
                    id="subtask-name"
                    placeholder="Enter sub-task name"
                    value={subTaskName}
                    onChange={(e) => setSubTaskName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtask-operator">Assigned Operator</Label>
                  <Input
                    id="subtask-operator"
                    placeholder="Enter operator name"
                    value={subTaskOperator}
                    onChange={(e) => setSubTaskOperator(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtask-start-date">Start Date</Label>
                  <Input
                    id="subtask-start-date"
                    type="date"
                    value={subTaskStartDate}
                    min={currentSubTaskSection?.startDate || undefined}
                    max={currentSubTaskSection?.endDate || undefined}
                    onChange={(e) => setSubTaskStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtask-end-date">End Date</Label>
                  <Input
                    id="subtask-end-date"
                    type="date"
                    value={subTaskEndDate}
                    min={currentSubTaskSection?.startDate || undefined}
                    max={currentSubTaskSection?.endDate || undefined}
                    onChange={(e) => setSubTaskEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtask-status">Status</Label>
                <Select value={subTaskStatus} onValueChange={setSubTaskStatus}>
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
                      // Use the lot-level BOM items for sub-task creation
                      if (lotBomItems.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No BOM parts available for this lot</p>
                            <p className="text-xs">Add BOM items to the production lot first</p>
                          </div>
                        );
                      }

                      return lotBomItems.map((bomPart) => (
                        <div key={bomPart.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`bom-${bomPart.id}`}
                                className="w-4 h-4 rounded border-gray-300"
                                checked={selectedBOMParts[bomPart.id]?.selected || false}
                                onChange={(e) => setSelectedBOMParts(prev => ({
                                  ...prev,
                                  [bomPart.id]: {
                                    ...prev[bomPart.id],
                                    selected: e.target.checked,
                                    quantity: prev[bomPart.id]?.quantity || 0,
                                    unit: prev[bomPart.id]?.unit || 'pcs'
                                  }
                                }))}
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
                                value={selectedBOMParts[bomPart.id]?.quantity || ''}
                                onChange={(e) => setSelectedBOMParts(prev => ({
                                  ...prev,
                                  [bomPart.id]: {
                                    ...prev[bomPart.id],
                                    selected: prev[bomPart.id]?.selected || false,
                                    quantity: parseFloat(e.target.value) || 0,
                                    unit: prev[bomPart.id]?.unit || 'pcs'
                                  }
                                }))}
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
                                value={selectedBOMParts[bomPart.id]?.unit || 'pcs'}
                                onChange={(e) => setSelectedBOMParts(prev => ({
                                  ...prev,
                                  [bomPart.id]: {
                                    ...prev[bomPart.id],
                                    selected: prev[bomPart.id]?.selected || false,
                                    quantity: prev[bomPart.id]?.quantity || 0,
                                    unit: e.target.value
                                  }
                                }))}
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

          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewSubTask(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSubTask}>
              Create Sub-Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT PROCESS DIALOG */}
      <Dialog open={!!editingProcess} onOpenChange={(open) => !open && setEditingProcess(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Process</DialogTitle>
            <DialogDescription>
              Update the manufacturing process details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-process-name" className="text-right">Process Name</Label>
              <Input
                id="edit-process-name"
                placeholder="Enter process name"
                className="col-span-3"
                value={editProcessName}
                onChange={(e) => setEditProcessName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Process description"
                className="col-span-3"
                value={editProcessDescription}
                onChange={(e) => setEditProcessDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-responsible" className="text-right">Responsible Person</Label>
              <Input
                id="edit-responsible"
                placeholder="Enter responsible person name"
                className="col-span-3"
                value={editResponsiblePerson}
                onChange={(e) => setEditResponsiblePerson(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-start-date" className="text-right">Start Date</Label>
              <Input
                id="edit-start-date"
                type="date"
                className="col-span-3"
                value={editStartDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-end-date" className="text-right">End Date</Label>
              <Input
                id="edit-end-date"
                type="date"
                className="col-span-3"
                value={editEndDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingProcess(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateProcess}
              disabled={apiLoading}
            >
              {apiLoading ? 'Updating...' : 'Update Process'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* GANTT CHART SCHEDULE DIALOG */}
      < Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog} >
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
                  Total Duration: {filteredMainSections.reduce((sum, section) =>
                    sum + section.subProcesses.reduce((subSum, process) => subSum + process.estimatedDuration, 0), 0
                  )}h
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
                <div className="flex-1 grid grid-cols-10 gap-1 text-xs text-muted-foreground">
                  {Array.from({ length: 10 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + (i * 3));
                    return (
                      <div key={i} className="text-center py-1 border-l border-muted">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        <div className="text-xs opacity-60">
                          Day {i * 3 + 1}-{i * 3 + 3}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Sections Timeline */}
              {filteredMainSections.map((mainSection, sectionIndex) => (
                <div key={mainSection.id} className="space-y-2">
                  {/* Main Section Header */}
                  <div className="flex items-center group bg-muted/10 p-2 rounded">
                    <div className="w-80 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {sectionIndex + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{mainSection.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {mainSection.subProcesses.length} process{mainSection.subProcesses.length !== 1 ? 'es' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 relative h-6 bg-muted/20 rounded">
                      <div className="absolute inset-0 bg-primary/20 rounded"></div>
                    </div>
                  </div>

                  {/* Sub-Processes */}
                  {mainSection.subProcesses.map((process, processIndex) => (
                    <div key={process.id} className="flex items-center ml-4 group">
                      <div className="w-76 pr-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center text-xs font-medium">
                              {processIndex + 1}
                            </div>
                            <Badge className={`${getStatusColor(process.status)} scale-75`}>
                              {getStatusIcon(process.status)}
                            </Badge>
                            <div>
                              <div className="font-medium text-xs">{process.name}</div>
                              <div className="text-xs text-muted-foreground">{process.responsiblePersonName}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSchedule({ processId: process.id })}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 relative h-6 bg-muted/10 rounded cursor-pointer hover:bg-muted/20">
                        {process.startDate && process.endDate && (() => {
                          const { left, width } = calculateTimelinePosition(process.startDate, process.endDate);
                          return (
                            <div
                              className="absolute top-1 h-4 rounded flex items-center px-1"
                              style={{
                                backgroundColor: 'rgb(34, 197, 94)',
                                left: `${left}%`,
                                width: `${width}%`,
                                opacity: 0.8
                              }}
                            >
                              <div className="text-white text-xs truncate">
                                {process.estimatedDuration}h
                              </div>
                            </div>
                          );
                        })()}
                      </div>

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
      </Dialog >

    </div >
  );
};