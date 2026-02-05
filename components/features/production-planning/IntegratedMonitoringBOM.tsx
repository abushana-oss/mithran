'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  useIntegratedDashboard, 
  useProductionMonitoring, 
  useLotMaterials,
  useProductionAlerts,
  useUpdateMaterialStatus,
  useResolveAlert,
  useRefreshDashboard,
  useInitializeLotMaterials,
} from '@/lib/api/hooks/useIntegratedProduction';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Activity,
  Package,
  Users,
  Flag,
  RefreshCw,
  Search,
  Plus,
  Edit,
  Eye,
  Calendar,
  User,
  MapPin,
  Truck,
  History,
  AlertCircle,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProcessProgress {
  id: string;
  name: string;
  progress: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  estimatedCompletionDate?: string;
  delay: number;
  bottlenecks: string[];
  requiredMaterials: string[];
  materialReadiness: number;
}

interface BOMItem {
  id: string;
  partNumber: string;
  partName: string;
  description: string;
  unitQuantity: number;
  totalQuantity: number;
  receivedQuantity: number;
  inspectedQuantity: number;
  approvedQuantity: number;
  rejectedQuantity: number;
  consumedQuantity: number;
  unit: string;
  materialType: string;
  assignedVendor: string | null;
  vendorName: string | null;
  materialStatus: 'PLANNING' | 'ORDERED' | 'SHIPPED' | 'RECEIVED' | 'INSPECTED' | 'APPROVED' | 'IN_USE' | 'DEPLETED';
  trackingHistory: TrackingHistory[];
  estimatedCost: number;
  actualCost: number | null;
  deliveryDate: string | null;
  receivedDate: string | null;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  alerts: PartAlert[];
  processImpact: string[];
}

interface TrackingHistory {
  id: string;
  partId: string;
  action: 'ORDERED' | 'SHIPPED' | 'RECEIVED' | 'INSPECTED' | 'APPROVED' | 'REJECTED' | 'CONSUMED' | 'RETURNED';
  quantity: number;
  date: string;
  performedBy: string;
  performedByName: string;
  notes: string;
  batchNumber?: string;
  location?: string;
}

interface PartAlert {
  id: string;
  type: 'DELAY' | 'SHORTAGE' | 'QUALITY' | 'REORDER' | 'EXPIRY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  createdAt: string;
  resolved: boolean;
  affectedProcesses?: string[];
}

interface IntegratedAlert {
  id: string;
  type: 'PROCESS' | 'MATERIAL' | 'QUALITY' | 'EQUIPMENT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  impact: string;
  suggestedAction: string;
  createdAt: string;
  source: 'MONITORING' | 'BOM';
  relatedItems?: string[];
}

interface IntegratedMonitoringBOMProps {
  lotId: string;
}

export const IntegratedMonitoringBOM = ({ lotId }: IntegratedMonitoringBOMProps) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCriticality, setFilterCriticality] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<BOMItem | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [addMaterialDialogOpen, setAddMaterialDialogOpen] = useState(false);

  // API Hooks for real data
  const { 
    data: dashboardData, 
    isLoading, 
    error: dashboardError 
  } = useIntegratedDashboard(lotId);
  
  const { 
    data: monitoringData, 
    refetch: refetchMonitoring 
  } = useProductionMonitoring(lotId);
  
  const { 
    data: materialsData, 
    refetch: refetchMaterials 
  } = useLotMaterials(lotId);
  
  const { 
    data: alertsData, 
    refetch: refetchAlerts 
  } = useProductionAlerts(lotId);

  // Mutations
  const updateMaterialMutation = useUpdateMaterialStatus();
  const resolveAlertMutation = useResolveAlert();
  const initializeMaterialsMutation = useInitializeLotMaterials();
  
  // Refresh utilities
  const { refreshAll } = useRefreshDashboard(lotId);
  
  // Real-time updates handled by refetchInterval in queries

  // Extract data from API responses with proper structure
  const processProgress = dashboardData?.data?.processes || [];
  const bomItems = dashboardData?.data?.materials || [];
  const integratedAlerts = dashboardData?.data?.alerts || [];
  const metrics = dashboardData?.data?.metrics || {};
  const loading = isLoading;

  const handleRefresh = async () => {
    refreshAll();
  };

  // Handle material status updates
  const handleMaterialUpdate = async (materialId: string, updateData: any) => {
    try {
      await updateMaterialMutation.mutateAsync({ materialId, updateData });
    } catch (error) {
      console.error('Failed to update material:', error);
    }
  };

  // Handle showing add materials dialog
  const handleShowAddMaterialDialog = () => {
    setAddMaterialDialogOpen(true);
  };

  // Handle adding/initializing materials from BOM
  const handleAddMaterials = async () => {
    try {
      await initializeMaterialsMutation.mutateAsync(lotId);
      // Refresh the dashboard to show new materials
      refreshAll();
      setAddMaterialDialogOpen(false);
    } catch (error) {
      console.error('Failed to initialize materials:', error);
    }
  };

  // Handle alert resolution
  const handleResolveAlert = async (alertId: string, notes: string) => {
    try {
      await resolveAlertMutation.mutateAsync({ alertId, notes });
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  // Error handling
  if (dashboardError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">Failed to load production data</p>
          <Button onClick={() => refreshAll()}>Retry</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors = {
      PLANNED: 'bg-blue-100 text-blue-600',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-600',
      COMPLETED: 'bg-green-100 text-green-600',
      BLOCKED: 'bg-red-100 text-red-600',
      PLANNING: 'bg-gray-100 text-gray-600',
      ORDERED: 'bg-blue-100 text-blue-600',
      SHIPPED: 'bg-purple-100 text-purple-600',
      RECEIVED: 'bg-yellow-100 text-yellow-600',
      INSPECTED: 'bg-orange-100 text-orange-600',
      APPROVED: 'bg-green-100 text-green-600',
      IN_USE: 'bg-emerald-100 text-emerald-600',
      DEPLETED: 'bg-red-100 text-red-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      LOW: 'bg-green-100 text-green-600',
      MEDIUM: 'bg-yellow-100 text-yellow-600',
      HIGH: 'bg-orange-100 text-orange-600',
      CRITICAL: 'bg-red-100 text-red-600'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'MATERIAL': return <Package className="h-4 w-4" />;
      case 'PROCESS': return <Activity className="h-4 w-4" />;
      case 'QUALITY': return <CheckCircle className="h-4 w-4" />;
      case 'EQUIPMENT': return <Users className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const toggleRowExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedRows);
    if (expandedRows.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedRows(newExpanded);
  };

  const filteredBOMItems = bomItems.filter(item => {
    // Use safe field access with fallbacks
    const partName = item.bom_items?.name || item.partName || '';
    const partNumber = item.bom_items?.part_number || item.partNumber || '';
    const materialStatus = item.material_status || item.materialStatus || '';
    const criticality = item.criticality || '';

    const matchesSearch = partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || materialStatus.toUpperCase() === filterStatus;
    const matchesCriticality = filterCriticality === 'all' || criticality.toUpperCase() === filterCriticality;
    return matchesSearch && matchesStatus && matchesCriticality;
  });

  // Use backend-calculated metrics with safe defaults
  const totalProgress = metrics.productionProgress || 0;
  const materialReadiness = metrics.materialReadiness || 0;
  const criticalAlerts = metrics.criticalAlerts || 0;
  const highAlerts = integratedAlerts.filter(a => a.severity === 'HIGH').length;
  const blockedProcesses = metrics.blockedProcesses || 0;
  const totalEstimatedCost = metrics.totalCost || 0;
  const totalActualCost = bomItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integrated Production Monitoring & Materials</h2>
          <p className="text-muted-foreground">Real-time production insights with BOM material tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={updateMaterialMutation.isPending || resolveAlertMutation.isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${updateMaterialMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Integrated Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{totalProgress}%</div>
            <Progress value={totalProgress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {processProgress.filter(p => p.status === 'COMPLETED').length} of {processProgress.length} processes complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Material Readiness</CardTitle>
            <Package className={`h-4 w-4 ${materialReadiness >= 80 ? 'text-green-500' : materialReadiness >= 60 ? 'text-yellow-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${materialReadiness >= 80 ? 'text-green-600' : materialReadiness >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {materialReadiness}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all processes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Processes</CardTitle>
            {blockedProcesses > 0 ? 
              <AlertTriangle className="h-4 w-4 text-red-500" /> : 
              <CheckCircle className="h-4 w-4 text-green-500" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${blockedProcesses > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {blockedProcesses}
            </div>
            <p className="text-xs text-muted-foreground">
              {blockedProcesses > 0 ? 'Need immediate attention' : 'All processes active'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${criticalAlerts > 0 ? 'text-red-500' : highAlerts > 0 ? 'text-orange-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalAlerts > 0 ? 'text-red-600' : highAlerts > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {integratedAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts} critical, {highAlerts} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Material Cost</CardTitle>
            <div className="text-green-600">₹</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalActualCost.toLocaleString()}</div>
            <p className={`text-xs ${totalActualCost <= totalEstimatedCost ? 'text-green-600' : 'text-red-600'}`}>
              {totalActualCost > 0 ? 
                `${((totalActualCost - totalEstimatedCost) / totalEstimatedCost * 100).toFixed(1)}% vs estimate` : 
                'Pending invoices'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Integrated Dashboard */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Process & Material Overview</TabsTrigger>
          <TabsTrigger value="materials">Material Tracking</TabsTrigger>
          <TabsTrigger value="alerts">Integrated Alerts</TabsTrigger>
          <TabsTrigger value="timeline">Production Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Process-Material Integration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Process Progress with Material Impact */}
            <Card>
              <CardHeader>
                <CardTitle>Process Progress & Material Status</CardTitle>
                <CardDescription>
                  Production processes with material readiness indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {processProgress.map((process) => (
                    <div key={process.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{process.name}</h3>
                          <Badge className={getStatusColor(process.status)}>
                            {process.status}
                          </Badge>
                          {process.delay > 0 && (
                            <Badge variant="destructive">
                              {process.delay} day delay
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-medium">
                          {process.progress}%
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Production Progress</span>
                          <span>{process.progress}%</span>
                        </div>
                        <Progress value={process.progress} className="h-2" />
                        
                        <div className="flex items-center justify-between text-sm">
                          <span>Material Readiness</span>
                          <span className={process.materialReadiness < 50 ? 'text-red-600' : process.materialReadiness < 80 ? 'text-yellow-600' : 'text-green-600'}>
                            {process.materialReadiness}%
                          </span>
                        </div>
                        <Progress 
                          value={process.materialReadiness} 
                          className="h-2" 
                        />
                      </div>

                      {process.requiredMaterials.length > 0 && (
                        <div className="text-sm">
                          <div className="font-medium mb-2">Required Materials:</div>
                          <div className="flex flex-wrap gap-2">
                            {process.requiredMaterials.map(materialId => {
                              const material = bomItems.find(item => item.partNumber === materialId);
                              return material ? (
                                <Badge 
                                  key={materialId}
                                  className={getStatusColor(material.materialStatus)}
                                  variant="outline"
                                >
                                  {material.partNumber}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {process.bottlenecks.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-orange-800 font-medium mb-1">
                            <AlertTriangle className="h-4 w-4" />
                            Material Issues
                          </div>
                          <ul className="text-sm text-orange-700">
                            {process.bottlenecks.map((bottleneck, index) => (
                              <li key={index}>• {bottleneck}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Material Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Critical Materials Status</CardTitle>
                <CardDescription>
                  High and critical priority materials affecting production
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bomItems
                    .filter(item => item.criticality === 'CRITICAL' || item.criticality === 'HIGH')
                    .map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{item.partName}</h3>
                            <p className="text-sm text-muted-foreground">{item.partNumber}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(item.criticality)} variant="outline">
                              {item.criticality}
                            </Badge>
                            <Badge className={getStatusColor(item.materialStatus)}>
                              {item.materialStatus}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div className="text-center">
                            <div className="text-lg font-semibold">{item.approvedQuantity}</div>
                            <div className="text-muted-foreground">Available</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">{item.consumedQuantity}</div>
                            <div className="text-muted-foreground">Used</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              {item.totalQuantity - item.consumedQuantity}
                            </div>
                            <div className="text-muted-foreground">Remaining</div>
                          </div>
                        </div>

                        {item.processImpact.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Affects Processes: </span>
                            {item.processImpact.join(', ')}
                          </div>
                        )}

                        {item.alerts.filter(a => !a.resolved).length > 0 && (
                          <div className="mt-2">
                            {item.alerts.filter(a => !a.resolved).map(alert => (
                              <div key={alert.id} className="flex items-center gap-2 text-sm p-2 bg-red-50 border border-red-200 rounded">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="text-red-800">{alert.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Material Inventory & Tracking</CardTitle>
                  <CardDescription>
                    Comprehensive material tracking with production impact
                  </CardDescription>
                </div>
                <Button 
                  className="flex items-center gap-2"
                  onClick={handleShowAddMaterialDialog}
                >
                  <Plus className="h-4 w-4" />
                  Add Material
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Search Materials</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by part name, number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:w-96">
                  <div>
                    <Label>Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="PLANNING">Planning</SelectItem>
                        <SelectItem value="ORDERED">Ordered</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="IN_USE">In Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Criticality</Label>
                    <Select value={filterCriticality} onValueChange={setFilterCriticality}>
                      <SelectTrigger>
                        <SelectValue placeholder="All levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Material Details</TableHead>
                      <TableHead>Quantities</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Process Impact</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Alerts</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBOMItems.map((item) => (
                      <React.Fragment key={item.id}>
                        <TableRow className="hover:bg-muted/50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto"
                              onClick={() => toggleRowExpansion(item.id)}
                            >
                              {expandedRows.has(item.id) ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{item.bom_items?.name || item.partName || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">{item.bom_items?.part_number || item.partNumber || 'N/A'}</div>
                              <Badge className={getSeverityColor(item.criticality || 'medium')} variant="outline" className="text-xs">
                                {(item.criticality || 'medium').toUpperCase()}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Required:</span>
                                <span className="font-semibold">{item.required_quantity || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Available:</span>
                                <span className="font-semibold text-green-600">{item.approved_quantity || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Used:</span>
                                <span className="font-semibold text-blue-600">{item.consumed_quantity || 0}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(item.material_status || 'planning')}>
                              {(item.material_status || 'planning').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {(item.processImpact || ['Material Preparation', 'Assembly']).map(processName => {
                                const process = processProgress.find(p => p.name === processName);
                                return (
                                  <Badge 
                                    key={processName}
                                    variant="outline" 
                                    className={`text-xs ${process ? getStatusColor(process.status) : 'bg-gray-100 text-gray-600'}`}
                                  >
                                    {processName}
                                  </Badge>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.vendors?.name || item.vendorName || 'Not assigned'}
                          </TableCell>
                          <TableCell>
                            {(item.alerts || []).filter(a => !a.resolved).length > 0 ? (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-semibold text-red-800">
                                  {(item.alerts || []).filter(a => !a.resolved).length}
                                </span>
                              </div>
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedMaterial(item)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {expandedRows.has(item.id) && (
                          <TableRow>
                            <TableCell colSpan={8}>
                              <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Description</h4>
                                    <p className="text-sm text-muted-foreground">{item.bom_items?.description || item.description || 'No description'}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Timeline</h4>
                                    <div className="space-y-1 text-sm">
                                      {item.received_date && (
                                        <div>Received: {new Date(item.received_date).toLocaleDateString()}</div>
                                      )}
                                      {item.expected_delivery_date && (
                                        <div>Expected: {new Date(item.expected_delivery_date).toLocaleDateString()}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Cost</h4>
                                    <div className="space-y-1 text-sm">
                                      <div>Estimated: ₹{(item.estimated_cost || 0).toLocaleString()}</div>
                                      {item.actual_cost && (
                                        <div>Actual: ₹{item.actual_cost.toLocaleString()}</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {(item.alerts || []).filter(a => !a.resolved).length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Active Alerts</h4>
                                    <div className="space-y-2">
                                      {(item.alerts || []).filter(a => !a.resolved).map(alert => (
                                        <div key={alert.id} className="flex items-start gap-3 text-sm p-3 bg-white border rounded">
                                          <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                          <div className="flex-1">
                                            <div className="font-semibold">{alert.type}</div>
                                            <div>{alert.message}</div>
                                            {alert.affectedProcesses && (
                                              <div className="text-muted-foreground mt-1">
                                                Affects: {alert.affectedProcesses.join(', ')}
                                              </div>
                                            )}
                                          </div>
                                          <Badge className={getSeverityColor(alert.severity)}>
                                            {alert.severity}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrated Production & Material Alerts</CardTitle>
              <CardDescription>
                Unified view of production and material issues requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integratedAlerts.map((alert) => (
                  <div key={alert.id} className="border border-l-4 border-l-orange-500 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getAlertTypeIcon(alert.type)}
                        <div>
                          <h3 className="font-medium">{alert.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline">
                              {alert.source}
                            </Badge>
                            <Badge variant="outline">
                              {alert.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-3">
                      <div>
                        <span className="font-medium">Description:</span> {alert.description}
                      </div>
                      <div>
                        <span className="font-medium">Impact:</span> {alert.impact}
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <span className="font-medium text-blue-800">Suggested Action:</span>
                        <span className="text-blue-700"> {alert.suggestedAction}</span>
                      </div>
                    </div>

                    {alert.relatedItems && alert.relatedItems.length > 0 && (
                      <div className="mb-3">
                        <span className="font-medium text-sm">Related Items:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {alert.relatedItems.map(item => (
                            <Badge key={item} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id, 'Resolved from dashboard')}
                        disabled={resolveAlertMutation.isPending}
                      >
                        {resolveAlertMutation.isPending ? 'Resolving...' : 'Resolve'}
                      </Button>
                      <Button size="sm" variant="outline">
                        Assign
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}

                {integratedAlerts.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <div className="text-lg font-medium mb-2">All Systems Optimal</div>
                    <div className="text-muted-foreground">
                      No critical alerts for production or materials
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Timeline with Material Dependencies</CardTitle>
              <CardDescription>
                Integrated timeline showing process progress and material availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {processProgress.map((process, index) => (
                  <div key={process.id} className="relative">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{process.name}</h3>
                          <Badge className={getStatusColor(process.status)}>
                            {process.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground mb-2">Production Progress</div>
                            <Progress value={process.progress} className="h-3" />
                            <div className="flex justify-between text-sm mt-1">
                              <span>{process.progress}%</span>
                              <span className="text-muted-foreground">
                                {new Date(process.startDate).toLocaleDateString()} - {new Date(process.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm text-muted-foreground mb-2">Material Readiness</div>
                            <Progress 
                              value={process.materialReadiness} 
                              className={`h-3 ${process.materialReadiness < 50 ? 'bg-red-100' : process.materialReadiness < 80 ? 'bg-yellow-100' : 'bg-green-100'}`}
                            />
                            <div className="flex justify-between text-sm mt-1">
                              <span className={process.materialReadiness < 50 ? 'text-red-600' : process.materialReadiness < 80 ? 'text-yellow-600' : 'text-green-600'}>
                                {process.materialReadiness}%
                              </span>
                              <span className="text-muted-foreground">Materials Ready</span>
                            </div>
                          </div>
                        </div>

                        {process.requiredMaterials.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-medium mb-2">Required Materials:</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {process.requiredMaterials.map(materialId => {
                                const material = bomItems.find(item => item.partNumber === materialId);
                                return material ? (
                                  <div key={materialId} className="flex items-center justify-between p-2 border rounded text-sm">
                                    <span>{material.partName}</span>
                                    <Badge className={getStatusColor(material.materialStatus)} variant="outline">
                                      {material.materialStatus}
                                    </Badge>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}

                        {process.bottlenecks.length > 0 && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-orange-800 font-medium mb-1">
                              <AlertTriangle className="h-4 w-4" />
                              Material Bottlenecks
                            </div>
                            <ul className="text-sm text-orange-700">
                              {process.bottlenecks.map((bottleneck, idx) => (
                                <li key={idx}>• {bottleneck}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {index < processProgress.length - 1 && (
                      <div className="w-px h-6 bg-border ml-5 mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {selectedMaterial.partName} - Production Impact View
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedMaterial.totalQuantity}</div>
                  <div className="text-sm text-muted-foreground">Required</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedMaterial.approvedQuantity}</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{selectedMaterial.consumedQuantity}</div>
                  <div className="text-sm text-muted-foreground">Consumed</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedMaterial.totalQuantity - selectedMaterial.consumedQuantity}
                  </div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Process Impact Analysis</h4>
                <div className="space-y-2">
                  {selectedMaterial.processImpact.map(processName => {
                    const process = processProgress.find(p => p.name === processName);
                    return process ? (
                      <div key={processName} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{processName}</div>
                          <div className="text-sm text-muted-foreground">
                            Progress: {process.progress}% | Material Readiness: {process.materialReadiness}%
                          </div>
                        </div>
                        <Badge className={getStatusColor(process.status)}>
                          {process.status}
                        </Badge>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMaterial(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Material Dialog */}
      <Dialog open={addMaterialDialogOpen} onOpenChange={setAddMaterialDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Add Materials from BOM
            </DialogTitle>
            <DialogDescription>
              This will automatically add all materials from the BOM to this production lot for tracking.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">What this will do:</span>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Load all BOM items for this production lot</li>
                <li>• Calculate required quantities based on production quantity</li>
                <li>• Set up material tracking for each item</li>
                <li>• Enable vendor assignment and status tracking</li>
              </ul>
            </div>

            {bomItems.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">
                    {bomItems.length} materials already loaded
                  </span>
                </div>
                <p className="text-xs text-yellow-800 mt-1">
                  This will refresh and update existing materials with any BOM changes.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAddMaterialDialogOpen(false)}
              disabled={initializeMaterialsMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddMaterials}
              disabled={initializeMaterialsMutation.isPending}
              className="flex items-center gap-2"
            >
              {initializeMaterialsMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding Materials...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Materials
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};