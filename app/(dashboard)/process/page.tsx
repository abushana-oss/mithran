'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Edit2, Trash2, Plus, Save, XCircle, Loader2, Settings, Search, Database, ChevronRight } from 'lucide-react';
import {
  useProcesses,
  useReferenceTables,
  useBulkUpdateTableRows,
  type ReferenceTable,
} from '@/lib/api/hooks/useProcesses';
import {
  useProcessCalculatorMappings,
  useCreateProcessCalculatorMapping,
  useUpdateProcessCalculatorMapping,
  useDeleteProcessCalculatorMapping,
  useProcessHierarchy,
  type ProcessCalculatorMapping,
} from '@/lib/api/hooks/useProcessCalculatorMappings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Helper function to convert snake_case to camelCase
const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Helper function to get value from row data with fallback for both naming conventions
const getRowValue = (row: any, columnName: string): any => {
  // Try exact match first
  if (row[columnName] !== undefined) {
    return row[columnName];
  }

  // Try camelCase version
  const camelCaseName = snakeToCamel(columnName);
  if (row[camelCaseName] !== undefined) {
    return row[camelCaseName];
  }

  // Return undefined if neither exists
  return undefined;
};

export default function ProcessPage() {
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editedTableData, setEditedTableData] = useState<Record<string, any[]>>({});

  // Calculator Mapping States
  const [isAddMappingDialogOpen, setIsAddMappingDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ProcessCalculatorMapping | null>(null);
  const [mappingFormData, setMappingFormData] = useState({
    processGroup: '',
    processRoute: '',
    operation: '',
    calculatorName: '',
  });

  // Filter states
  const [filterProcessGroup, setFilterProcessGroup] = useState<string>('');
  const [filterProcessRoute, setFilterProcessRoute] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State for selected process group in manufacturing processes section
  const [selectedManufacturingGroup, setSelectedManufacturingGroup] = useState<string | null>(null);
  const [selectedManufacturingProcessId, setSelectedManufacturingProcessId] = useState<string | null>(null);

  // Reset process route filter when process group changes
  const handleProcessGroupChange = (value: string) => {
    setFilterProcessGroup(value);
    if (value === 'all' || !value) {
      setFilterProcessRoute('all');
    }
  };

  // Map process names to process groups
  const processToGroupMapping: Record<string, string> = {
    'Injection Molding': 'Plastic & Rubber',
    'CNC Machining': 'Machining',
    'Sheet Metal Bending': 'Sheet Metal',
    'Laser Cutting': 'Sheet Metal',
    'Welding': 'Assembly',
    'Die Casting': 'Machining',
    'Powder Coating': 'Post Processing',
    'Assembly': 'Assembly',
    'Quality Inspection': 'Post Processing',
    'Heat Treatment': 'Post Processing',
  };

  // Fetch processes from database
  const { data: processesData, isLoading: loadingProcesses } = useProcesses();

  // Fetch reference tables for selected process (from old functionality)
  const { data: referenceTables, isLoading: loadingTables } = useReferenceTables(selectedProcessId || undefined);

  // Fetch reference tables for selected manufacturing process
  const { data: manufacturingReferenceTables, isLoading: loadingManufacturingTables } = useReferenceTables(
    selectedManufacturingProcessId || undefined
  );

  // Fetch calculator mappings with filters
  const { data: calculatorMappings, isLoading: loadingMappings } = useProcessCalculatorMappings({
    processGroup: filterProcessGroup && filterProcessGroup !== 'all' ? filterProcessGroup : undefined,
    processRoute: filterProcessRoute && filterProcessRoute !== 'all' ? filterProcessRoute : undefined,
    search: searchQuery || undefined,
    limit: 1000,
  });
  const { data: hierarchy } = useProcessHierarchy();

  // Handle manufacturing process card click
  const handleManufacturingProcessClick = (processName: string, processId: string) => {
    const groupName = processToGroupMapping[processName];
    if (groupName) {
      if (selectedManufacturingGroup === groupName && selectedManufacturingProcessId === processId) {
        setSelectedManufacturingGroup(null);
        setSelectedManufacturingProcessId(null);
      } else {
        setSelectedManufacturingGroup(groupName);
        setSelectedManufacturingProcessId(processId);
      }
    }
  };

  // Get mappings for selected manufacturing group
  const selectedGroupMappings = calculatorMappings?.mappings.filter(
    (m) => m.processGroup === selectedManufacturingGroup
  ) || [];

  // Group mappings by process route
  const groupedMappings = selectedGroupMappings.reduce((acc, mapping) => {
    const route = mapping.processRoute;
    if (!acc[route]) {
      acc[route] = [];
    }
    acc[route].push(mapping);
    return acc;
  }, {} as Record<string, typeof selectedGroupMappings>);

  // Bulk update mutation
  const bulkUpdateMutation = useBulkUpdateTableRows();

  // Calculator mapping mutations
  const createMappingMutation = useCreateProcessCalculatorMapping();
  const updateMappingMutation = useUpdateProcessCalculatorMapping();
  const deleteMappingMutation = useDeleteProcessCalculatorMapping();



  const handleEditTable = (tableId: string) => {
    setEditingTableId(tableId);
    // Initialize edited data with current table rows
    const table = referenceTables?.find(t => t.id === tableId);
    if (table?.rows) {
      setEditedTableData({
        ...editedTableData,
        [tableId]: table.rows.map(row => {
          const rowData = (row as any).row_data || row.rowData || {};

          // Normalize data to have both snake_case and camelCase keys
          const normalizedData: any = { ...rowData };

          // For each column definition, ensure both naming conventions exist
          table.columnDefinitions.forEach(col => {
            const snakeCase = col.name;
            const camelCase = snakeToCamel(col.name);

            // If we have the value in either format, copy to both
            if (rowData[snakeCase] !== undefined) {
              normalizedData[camelCase] = rowData[snakeCase];
            } else if (rowData[camelCase] !== undefined) {
              normalizedData[snakeCase] = rowData[camelCase];
            }
          });

          return {
            ...normalizedData,
            _id: row.id,
            _order: (row as any).row_order || row.rowOrder
          };
        })
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTableId(null);
    setEditedTableData({});
  };

  const handleSaveTable = async (tableId: string) => {
    const tableData = editedTableData[tableId];
    if (!tableData) return;

    // Convert to the format expected by the API
    const rows = tableData.map((row, index) => ({
      row_data: Object.fromEntries(
        Object.entries(row).filter(([key]) => !key.startsWith('_'))
      ),
      row_order: index
    }));

    try {
      await bulkUpdateMutation.mutateAsync({ tableId, rows });
      setEditingTableId(null);
      setEditedTableData({});
    } catch (error) {
      console.error('Failed to save table:', error);
    }
  };

  // Generic handlers for any table
  const handleAddRow = (tableId: string) => {
    const table = referenceTables?.find(t => t.id === tableId);
    if (!table) return;

    // Create empty row based on column definitions with both naming conventions
    const newRow: Record<string, any> = {};
    table.columnDefinitions.forEach(col => {
      const defaultValue = col.type === 'number' ? 0 : '';
      newRow[col.name] = defaultValue;  // snake_case
      newRow[snakeToCamel(col.name)] = defaultValue;  // camelCase
    });

    const currentData = editedTableData[tableId] || [];
    setEditedTableData({
      ...editedTableData,
      [tableId]: [...currentData, newRow]
    });
  };

  const handleDeleteRow = (tableId: string, index: number) => {
    const currentData = editedTableData[tableId] || [];
    setEditedTableData({
      ...editedTableData,
      [tableId]: currentData.filter((_, i) => i !== index)
    });
  };

  const handleUpdateRow = (tableId: string, index: number, field: string, value: any, fieldType?: string) => {
    const currentData = editedTableData[tableId] || [];
    const updated = [...currentData];

    // Store in both snake_case and camelCase for compatibility
    const camelCaseField = snakeToCamel(field);
    const processedValue = fieldType === 'number' ? Number(value) : value;

    updated[index] = {
      ...updated[index],
      [field]: processedValue,  // snake_case (for backend)
      [camelCaseField]: processedValue  // camelCase (for display)
    };

    setEditedTableData({
      ...editedTableData,
      [tableId]: updated
    });
  };

  const renderEditableTable = (table: ReferenceTable) => {
    const isEditing = editingTableId === table.id;

    // Enhanced data mapping - handle both snake_case and camelCase
    const mapRowData = (row: any) => {
      // Try row_data (snake_case from DB) first, then rowData (camelCase)
      const rowData = row.row_data || row.rowData || row;

      // Debug log for problematic tables
      if (!rowData || Object.keys(rowData).length === 0) {
        console.warn('Empty row data detected:', row);
      }

      return rowData;
    };

    const displayData = isEditing
      ? (editedTableData[table.id] || table.rows?.map(mapRowData) || [])
      : (table.rows?.map(mapRowData) || []);

    return (
      <Card key={table.id}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{table.tableName}</CardTitle>
              {table.tableDescription && (
                <CardDescription>{table.tableDescription}</CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditTable(table.id)}
                  disabled={!table.isEditable}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleSaveTable(table.id)}
                    disabled={bulkUpdateMutation.isPending}
                  >
                    {bulkUpdateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {table.columnDefinitions.map((col, colIdx) => (
                    <TableHead key={col.name} className={colIdx !== 0 ? 'text-right' : ''}>
                      {col.label}
                    </TableHead>
                  ))}
                  {isEditing && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={table.columnDefinitions.length + (isEditing ? 1 : 0)} className="text-center text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  displayData.map((row, idx) => (
                    <TableRow key={idx}>
                      {table.columnDefinitions.map((col, colIdx) => {
                        const cellValue = getRowValue(row, col.name);
                        return (
                          <TableCell key={col.name} className={colIdx !== 0 ? 'text-right' : ''}>
                            {isEditing ? (
                              <Input
                                type={col.type === 'number' ? 'number' : 'text'}
                                value={cellValue ?? ''}
                                onChange={(e) => handleUpdateRow(table.id, idx, col.name, e.target.value, col.type)}
                                className="h-8"
                              />
                            ) : (
                              <span className={colIdx === 0 ? 'font-medium' : ''}>
                                {cellValue}
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                      {isEditing && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRow(table.id, idx)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {isEditing && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddRow(table.id)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Row
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Calculator Mapping Handlers
  const handleAddMapping = () => {
    setEditingMapping(null);
    setMappingFormData({
      processGroup: '',
      processRoute: '',
      operation: '',
      calculatorName: '',
    });
    setIsAddMappingDialogOpen(true);
  };

  const handleEditMapping = (mapping: ProcessCalculatorMapping) => {
    setEditingMapping(mapping);
    setMappingFormData({
      processGroup: mapping.processGroup,
      processRoute: mapping.processRoute,
      operation: mapping.operation,
      calculatorName: mapping.calculatorName || '',
    });
    setIsAddMappingDialogOpen(true);
  };

  const handleSaveMapping = async () => {
    try {
      if (editingMapping) {
        await updateMappingMutation.mutateAsync({
          id: editingMapping.id,
          data: mappingFormData,
        });
        toast.success('Calculator mapping updated successfully');
      } else {
        await createMappingMutation.mutateAsync(mappingFormData);
        toast.success('Calculator mapping created successfully');
      }
      setIsAddMappingDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save calculator mapping');
      console.error(error);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm('Are you sure you want to delete this calculator mapping?')) return;

    try {
      await deleteMappingMutation.mutateAsync(id);
      toast.success('Calculator mapping deleted successfully');
    } catch (error) {
      toast.error('Failed to delete calculator mapping');
      console.error(error);
    }
  };

  const renderProcessTables = () => {
    if (!selectedProcessId) return null;

    const process = processesData?.processes.find(p => p.id === selectedProcessId);
    if (!process) return null;

    return (
      <Card className="mt-6 border-2 border-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{process.processName} - Reference Tables</CardTitle>
              <CardDescription>Click Edit to modify tables, add or remove rows</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedProcessId(null)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingTables ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading reference tables...</span>
            </div>
          ) : referenceTables && referenceTables.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {referenceTables.map((table) => renderEditableTable(table))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No reference tables found for this process.</p>
              <p className="text-sm mt-2">Reference tables can be added via the database migration.</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Process"
        description="Manage processes, calculator mappings, and detailed specifications"
      />

      <div className="space-y-6">
        {/* CALCULATOR MAPPINGS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Process Calculator Mappings
                </CardTitle>
                <CardDescription>
                  Define which calculator is used for each process group, route, and operation combination
                </CardDescription>
              </div>
              <Button onClick={handleAddMapping}>
                <Plus className="h-4 w-4 mr-2" />
                Add Mapping
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="filter-group" className="text-xs mb-1">Process Group</Label>
                <Select value={filterProcessGroup} onValueChange={handleProcessGroupChange}>
                  <SelectTrigger id="filter-group" className="h-9">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {hierarchy?.processGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="filter-route" className="text-xs mb-1">Process Route</Label>
                <Select
                  value={filterProcessRoute}
                  onValueChange={setFilterProcessRoute}
                  disabled={!filterProcessGroup || filterProcessGroup === 'all'}
                >
                  <SelectTrigger id="filter-route" className="h-9">
                    <SelectValue placeholder="All Routes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Routes</SelectItem>
                    {hierarchy?.processRoutes
                      .filter((route) => {
                        if (!filterProcessGroup || filterProcessGroup === 'all') return true;
                        return calculatorMappings?.mappings.some(
                          (m) => m.processGroup === filterProcessGroup && m.processRoute === route
                        );
                      })
                      .map((route) => (
                        <SelectItem key={route} value={route}>
                          {route}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="filter-search" className="text-xs mb-1">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="filter-search"
                    placeholder="Search operations or calculators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
              {((filterProcessGroup && filterProcessGroup !== 'all') ||
                (filterProcessRoute && filterProcessRoute !== 'all') ||
                searchQuery) && (
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterProcessGroup('all');
                        setFilterProcessRoute('all');
                        setSearchQuery('');
                      }}
                      className="h-9"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                )}
            </div>
            {loadingMappings ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading calculator mappings...</span>
              </div>
            ) : (
              <>
                {calculatorMappings && calculatorMappings.mappings.length > 0 && (
                  <div className="text-sm text-muted-foreground mb-4">
                    Showing <span className="font-semibold text-foreground">{calculatorMappings.mappings.length}</span> of{' '}
                    <span className="font-semibold text-foreground">{calculatorMappings.count}</span> mappings
                  </div>
                )}
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Process Group</TableHead>
                        <TableHead>Process Route</TableHead>
                        <TableHead>Operations</TableHead>
                        <TableHead>Process Calculator</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculatorMappings?.mappings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No calculator mappings found. Add one to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        calculatorMappings?.mappings.map((mapping) => (
                          <TableRow key={mapping.id}>
                            <TableCell className="font-medium">{mapping.processGroup}</TableCell>
                            <TableCell>{mapping.processRoute}</TableCell>
                            <TableCell>{mapping.operation}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{mapping.calculatorName || 'NA'}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditMapping(mapping)}
                                  className="h-8 w-8"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteMapping(mapping.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* MANUFACTURING PROCESSES */}
        <Card>
          <CardHeader>
            <CardTitle>Manufacturing Processes</CardTitle>
            <CardDescription>Click on a process to view calculator mappings</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProcesses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading processes...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {processesData?.processes.map((process) => {
                    const groupName = processToGroupMapping[process.processName];
                    const isSelected = selectedManufacturingProcessId === process.id;

                    return (
                      <Card
                        key={process.id}
                        className={`border-l-4 cursor-pointer transition-all hover:shadow-md ${isSelected
                          ? 'border-l-primary bg-primary/5 shadow-md'
                          : 'border-l-primary/30'
                          }`}
                        onClick={() => handleManufacturingProcessClick(process.processName, process.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{process.processName}</p>
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {process.processCategory}
                              </Badge>
                            </div>
                            {groupName && (
                              <Badge variant="outline" className="text-[10px]">
                                {groupName}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Calculator Mappings and Reference Tables for Selected Process */}
                {selectedManufacturingGroup && (
                  <div className="mt-6 border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold">
                          {processesData?.processes.find(p => p.id === selectedManufacturingProcessId)?.processName || selectedManufacturingGroup}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Calculator mappings and reference tables
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedManufacturingGroup(null);
                          setSelectedManufacturingProcessId(null);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Close
                      </Button>
                    </div>

                    {/* Calculator Mappings Section - Grouped by Process Route */}
                    {selectedGroupMappings.length > 0 && (
                      <div className="mb-6">
                        <h5 className="text-md font-semibold mb-3 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          {selectedManufacturingGroup} - Calculator Mappings
                          <Badge variant="outline" className="ml-auto">
                            {Object.keys(groupedMappings).length} routes
                          </Badge>
                        </h5>

                        <div className="space-y-3">
                          {Object.entries(groupedMappings).map(([processRoute, mappings]) => (
                            <Card key={processRoute} className="border-l-4 border-l-primary/30">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  {/* Process Route Header */}
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <h6 className="font-semibold text-sm flex items-center gap-2">
                                        <ChevronRight className="h-4 w-4 text-primary" />
                                        {processRoute}
                                      </h6>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {mappings.length} operation{mappings.length !== 1 ? 's' : ''}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Operations List */}
                                  <div className="space-y-2 pl-6">
                                    {mappings.map((mapping) => (
                                      <div
                                        key={mapping.id}
                                        className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                                      >
                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Operation</p>
                                            <p className="text-sm font-medium">{mapping.operation}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Calculator</p>
                                            <Badge variant="secondary" className="text-xs">
                                              {mapping.calculatorName || 'NA'}
                                            </Badge>
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditMapping(mapping);
                                          }}
                                          className="h-7 w-7 shrink-0"
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reference Tables Section */}
                    <div className="mt-6">
                      <h5 className="text-md font-semibold mb-3 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Reference Tables & Lookup Data
                      </h5>
                      {loadingManufacturingTables ? (
                        <div className="flex items-center justify-center py-8 border rounded-lg">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2 text-muted-foreground">Loading reference tables...</span>
                        </div>
                      ) : manufacturingReferenceTables && manufacturingReferenceTables.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {manufacturingReferenceTables.map((table) => renderEditableTable(table))}
                        </div>
                      ) : (
                        <div className="border rounded-lg p-8 bg-muted/20">
                          <div className="text-center">
                            <Database className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                            <h6 className="font-semibold mb-2">No Reference Tables Available</h6>
                            <p className="text-sm text-muted-foreground mb-4">
                              This process doesn't have any lookup tables configured yet.
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-left max-w-md mx-auto">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                💡 Available for:
                              </p>
                              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                                <li>Injection Molding (5 tables)</li>
                              </ul>
                              <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                                More reference tables can be added via database migrations.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* PROCESS-SPECIFIC TABLES */}
        {renderProcessTables()}
      </div>

      {/* ADD/EDIT CALCULATOR MAPPING DIALOG */}
      <Dialog open={isAddMappingDialogOpen} onOpenChange={setIsAddMappingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingMapping ? 'Edit' : 'Add'} Calculator Mapping</DialogTitle>
            <DialogDescription>
              Define the relationship between process hierarchy and calculator
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="processGroup">Process Group</Label>
              <Input
                id="processGroup"
                value={mappingFormData.processGroup}
                onChange={(e) =>
                  setMappingFormData({ ...mappingFormData, processGroup: e.target.value })
                }
                placeholder="e.g., Plastic & Rubber"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="processRoute">Process Route</Label>
              <Input
                id="processRoute"
                value={mappingFormData.processRoute}
                onChange={(e) =>
                  setMappingFormData({ ...mappingFormData, processRoute: e.target.value })
                }
                placeholder="e.g., Injection Molding"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="operation">Operation</Label>
              <Input
                id="operation"
                value={mappingFormData.operation}
                onChange={(e) =>
                  setMappingFormData({ ...mappingFormData, operation: e.target.value })
                }
                placeholder="e.g., Injection Molding-Cold Runner"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="calculatorName">Calculator Name</Label>
              <Input
                id="calculatorName"
                value={mappingFormData.calculatorName}
                onChange={(e) =>
                  setMappingFormData({ ...mappingFormData, calculatorName: e.target.value })
                }
                placeholder="e.g., Tonnage Calculator"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMappingDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveMapping}
              disabled={
                !mappingFormData.processGroup ||
                !mappingFormData.processRoute ||
                !mappingFormData.operation ||
                createMappingMutation.isPending ||
                updateMappingMutation.isPending
              }
            >
              {(createMappingMutation.isPending || updateMappingMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingMapping ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
