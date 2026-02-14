'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  CheckCircle,
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
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
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { useAuth, useAuthReady } from '@/lib/providers/auth';
import { getApprovedVendorsByBomPart, type ApprovedVendor } from '@/lib/api/supplier-nominations';

interface LotBOMItem {
  id: string;
  bom_item_id: string;
  bom_item_name: string;
  description?: string;
  part_number: string;
  material: string;
  quantity: number;
}

interface Vendor {
  id: string;
  name: string;
  supplier_code: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  city?: string;
  // Added from supplier nominations
  nominationId?: string;
  nominationName?: string;
  overallScore?: number;
  isApproved?: boolean;
}

interface VendorAssignment {
  id: string;
  bom_item_id: string;
  vendor_id: string;
  vendor_name: string;
  quoted_price: number;
  delivery_date: string;
  lead_time_days: number;
  assignment_reason: string;
  assigned_at: string;
  vendor?: { name: string };
  unit_cost?: number;
  expected_delivery_date?: string;
  created_at?: string;
}

interface VendorAssignmentProps {
  lotId: string;
}

export const VendorAssignment = ({ lotId }: VendorAssignmentProps) => {
  const [lotBOMItems, setLotBOMItems] = useState<LotBOMItem[]>([]);
  const [vendorAssignments, setVendorAssignments] = useState<VendorAssignment[]>([]);
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([]);
  const [approvedVendorsByPart, setApprovedVendorsByPart] = useState<Record<string, ApprovedVendor[]>>({});
  // const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [selectedBOMItem, setSelectedBOMItem] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [quotedPrice, setQuotedPrice] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  // const [leadTimeDays, setLeadTimeDays] = useState<string>('');
  const [editingAssignment, setEditingAssignment] = useState<VendorAssignment | null>(null);

  const { } = useAuth(); // User unused
  const isAuthReady = useAuthReady();
  const hasFetchedRef = React.useRef(false);

  useEffect(() => {
    const fetchLotData = async () => {
      try {
        // Fetch production lot details
        const lotResponse: any = await apiClient.get(`/production-planning/lots/${lotId}`);
        const lotData = lotResponse.data;

        // Fetch BOM items for this production lot from the dedicated endpoint
        const bomItemsResponse: any = await apiClient.get(`/production-planning/lots/${lotId}/bom-items`);
        const bomItems = bomItemsResponse.data || [];

        // Transform BOM items for display
        const lotBomItems = bomItems.map((bomItem: any) => ({
          id: bomItem.id,
          bom_item_id: bomItem.id,
          bom_item_name: bomItem.name || bomItem.description,
          description: bomItem.description,
          part_number: bomItem.part_number,
          material: bomItem.material_grade || bomItem.material || 'Not specified',
          quantity: bomItem.quantity,
          unit_cost: bomItem.unit_cost,
          make_buy: bomItem.make_buy
        }));

        setLotBOMItems(lotBomItems);

        // Fetch approved vendors for each BOM part from supplier nominations (in parallel)
        const approvedVendorsPromises = lotBomItems.map((bomItem: any) =>
          getApprovedVendorsByBomPart(bomItem.bom_item_id, lotData.projectId)
            .then(vendors => ({ bomItemId: bomItem.bom_item_id, vendors }))
            .catch(() => ({ bomItemId: bomItem.bom_item_id, vendors: [] }))
        );

        // Fetch only approved vendors (no need for all vendors)
        const approvedVendorsResults = await Promise.all(approvedVendorsPromises);

        const approvedVendorsMap: Record<string, ApprovedVendor[]> = {};
        approvedVendorsResults.forEach((result: any) => {
          approvedVendorsMap[result.bomItemId] = result.vendors;
        });

        setApprovedVendorsByPart(approvedVendorsMap);

        // Convert approved vendors to vendor format for dropdown
        const allApprovedVendors: Vendor[] = [];
        Object.values(approvedVendorsMap).forEach(vendors => {
          vendors.forEach(vendor => {
            if (!allApprovedVendors.find(v => v.id === vendor.vendorId)) {
              allApprovedVendors.push({
                id: vendor.vendorId,
                name: vendor.vendorName,
                supplier_code: vendor.supplierCode || '',
                nominationId: vendor.nominationId,
                nominationName: vendor.nominationName,
                overallScore: vendor.overallScore,
                isApproved: true
              });
            }
          });
        });

        // Only use approved vendors
        setAvailableVendors(allApprovedVendors);

        // Process vendor assignments - get existing assignments for this lot
        let assignments: VendorAssignment[] = [];
        try {
          const assignmentsResponse: any = await apiClient.get(`/production-planning/lots/${lotId}/vendor-assignments`);
          assignments = assignmentsResponse.data || [];
          console.log('Raw assignments response:', assignmentsResponse.data);
        } catch (assignmentError) {
          console.log('No existing assignments found for this lot, starting with empty assignments');
          assignments = [];
        }


        setVendorAssignments(assignments);

        // setLoading(false);
      } catch (error) {
        console.error('Error fetching lot data:', error);
        toast.error('Failed to load production lot data');
        // setLoading(false);
      }
    };

    if (lotId && isAuthReady && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchLotData();
    }
  }, [lotId, isAuthReady]);

  // Reset vendor selection when BOM item changes
  useEffect(() => {
    setSelectedVendor('');
  }, [selectedBOMItem]);

  // Get only approved vendors for the selected BOM item
  const getVendorsForSelectedBOMItem = (): Vendor[] => {
    if (!selectedBOMItem) return availableVendors;

    const approvedForThisPart = approvedVendorsByPart[selectedBOMItem] || [];
    const approvedVendorIds = approvedForThisPart.map(v => v.vendorId);

    // Only show vendors that are approved for this specific BOM part
    return availableVendors.filter(v => approvedVendorIds.includes(v.id));
  };

  // Filter assignments based on search term
  const filteredAssignments = vendorAssignments.filter(assignment => {
    const bomItem = lotBOMItems.find(item => item.bom_item_id === assignment.bom_item_id);
    const matchesSearch = searchTerm === '' ||
      (bomItem?.bom_item_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bomItem?.part_number?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      assignment.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleAssignVendor = async () => {
    if (!selectedBOMItem || !selectedVendor || !quotedPrice || !deliveryDate.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Get the selected BOM item to retrieve quantity
      const selectedItem = lotBOMItems.find(item => item.bom_item_id === selectedBOMItem);

      if (!selectedItem) {
        toast.error('Selected BOM item not found');
        return;
      }

      // Validate and convert quantity to number
      const requiredQuantity = Number(selectedItem.quantity);
      if (isNaN(requiredQuantity) || requiredQuantity <= 0) {
        toast.error('Invalid quantity for selected BOM item');
        console.error('Invalid quantity:', selectedItem.quantity);
        return;
      }

      // Format the data to match CreateLotVendorAssignmentDto
      const assignmentData = {
        productionLotId: lotId,
        bomItemId: selectedBOMItem,
        vendorId: selectedVendor,
        requiredQuantity: requiredQuantity,
        unitCost: parseFloat(quotedPrice),
        expectedDeliveryDate: deliveryDate,
        remarks: 'Assigned via production planning'
      };


      await apiClient.post(`/production-planning/lots/${lotId}/vendor-assignments`, assignmentData);

      toast.success('Vendor assigned successfully');
      setShowNewAssignment(false);

      // Reset form
      setSelectedBOMItem('');
      setSelectedVendor('');
      setQuotedPrice('');
      setDeliveryDate('');
      // setLeadTimeDays('');

      // Refresh assignments
      const assignmentsResponse: any = await apiClient.get(`/production-planning/lots/${lotId}/vendor-assignments`);
      const assignments = assignmentsResponse.data || [];

      setVendorAssignments(assignments);
    } catch (error) {
      console.error('Error assigning vendor:', error);
      toast.error('Failed to assign vendor');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this vendor assignment?')) {
      return;
    }

    try {
      await apiClient.delete(`/production-planning/lots/${lotId}/vendor-assignments/${assignmentId}`);
      toast.success('Vendor assignment deleted successfully');

      // Remove from local state
      setVendorAssignments(prev => prev.filter(a => a.id !== assignmentId));
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete vendor assignment');
    }
  };

  const handleEditAssignment = (assignment: VendorAssignment) => {
    // const bomItem = lotBOMItems.find(item => item.bom_item_id === assignment.bom_item_id);

    setEditingAssignment(assignment);
    setSelectedBOMItem(assignment.bom_item_id);
    setSelectedVendor(assignment.vendor_id);
    setQuotedPrice(assignment.quoted_price.toString());
    setDeliveryDate(assignment.delivery_date ? new Date(assignment.delivery_date).toISOString().split('T')[0] || '' : '');
    setShowNewAssignment(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment || !selectedBOMItem || !selectedVendor || !quotedPrice || !deliveryDate.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const selectedItem = lotBOMItems.find(item => item.bom_item_id === selectedBOMItem);

      if (!selectedItem) {
        toast.error('Selected BOM item not found');
        return;
      }

      const requiredQuantity = Number(selectedItem.quantity);
      if (isNaN(requiredQuantity) || requiredQuantity <= 0) {
        toast.error('Invalid quantity for selected BOM item');
        return;
      }

      const updateData = {
        vendorId: selectedVendor,
        requiredQuantity: requiredQuantity,
        unitCost: parseFloat(quotedPrice),
        expectedDeliveryDate: deliveryDate,
        remarks: 'Updated via production planning'
      };

      await apiClient.patch(`/production-planning/lots/${lotId}/vendor-assignments/${editingAssignment.id}`, updateData);

      toast.success('Vendor assignment updated successfully');
      setShowNewAssignment(false);
      setEditingAssignment(null);

      // Reset form
      setSelectedBOMItem('');
      setSelectedVendor('');
      setQuotedPrice('');
      setDeliveryDate('');
      // setLeadTimeDays('');

      // Refresh assignments
      const assignmentsResponse: any = await apiClient.get(`/production-planning/lots/${lotId}/vendor-assignments`);
      const assignments = assignmentsResponse.data || [];

      setVendorAssignments(assignments);
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Failed to update vendor assignment');
    }
  };

  if (!isAuthReady) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BOM Parts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lotBOMItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Parts in production lot
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Vendors</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(() => {
                const uniqueApprovedVendors = new Set();
                Object.values(approvedVendorsByPart).forEach(vendors => {
                  vendors.forEach(v => uniqueApprovedVendors.add(v.vendorId));
                });
                return uniqueApprovedVendors.size;
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              From supplier nominations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendorAssignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Vendors assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{vendorAssignments.reduce((sum, a) => sum + (a.quoted_price || 0), 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total quoted amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Assignments */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Vendor Assignments</CardTitle>
              <CardDescription>
                Manage vendor assignments for each part in the production lot
              </CardDescription>
            </div>
            <Dialog open={showNewAssignment} onOpenChange={setShowNewAssignment}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Assign Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingAssignment ? 'Edit Vendor Assignment' : 'Assign Vendor to Part'}</DialogTitle>
                  <DialogDescription>
                    {editingAssignment ? 'Update vendor assignment details' : 'Select a vendor and configure assignment details'}
                  </DialogDescription>
                </DialogHeader>
                {/* New assignment form would go here */}
                <div className="grid gap-4 py-4">
                  {/* Select BOM Part */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bom-part" className="text-right">BOM Part</Label>
                    <Select value={selectedBOMItem} onValueChange={setSelectedBOMItem}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a BOM part" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[400px]">
                        {lotBOMItems.map(item => {
                          const partName = item.bom_item_name !== item.description ? item.bom_item_name : '';
                          const label = partName ? `${item.part_number} - ${partName}` : item.part_number;

                          return (
                            <SelectItem key={item.bom_item_id} value={item.bom_item_id}>
                              <span className="truncate block" title={label}>
                                {label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select Vendor */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="vendor" className="text-right">Vendor</Label>
                    <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {getVendorsForSelectedBOMItem().map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>
                                {vendor.name} - {vendor.supplier_code || 'No Code'}
                              </span>
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                Approved
                              </Badge>
                              {vendor.overallScore && (
                                <Badge variant="outline" className="text-xs">
                                  {vendor.overallScore.toFixed(1)}%
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quote Details */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Quoted Price</Label>
                    <Input
                      id="price"
                      placeholder="0.00"
                      className="col-span-3"
                      value={quotedPrice}
                      onChange={(e) => setQuotedPrice(e.target.value)}
                      type="number"
                      step="0.01"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="delivery" className="text-right">Delivery Date</Label>
                    <div className="col-span-3">
                      <Input
                        id="delivery"
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewAssignment(false);
                      setEditingAssignment(null);
                      setSelectedBOMItem('');
                      setSelectedVendor('');
                      setQuotedPrice('');
                      setDeliveryDate('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={editingAssignment ? handleUpdateAssignment : handleAssignVendor}
                  >
                    {editingAssignment ? 'Update Assignment' : 'Assign Vendor'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search Assignments</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by part or vendor name..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="alternate">Alternate</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vendor Assignment Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>BOM Part</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Quote</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => {
                  const bomItem = lotBOMItems.find(item => item.bom_item_id === assignment.bom_item_id);
                  console.log('Assignment object:', assignment);
                  console.log('Vendor object in assignment:', assignment.vendor);
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{bomItem?.bom_item_name || 'Unknown Part'}</div>
                          <div className="text-sm text-muted-foreground">{bomItem?.part_number || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{bomItem?.material || 'Material not specified'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">
                              {(() => {
                                // First try vendor.name from assignment
                                if (assignment.vendor?.name) return assignment.vendor.name;

                                // Fallback: try to find vendor name from approved vendors
                                const bomApprovedVendors = approvedVendorsByPart[assignment.bom_item_id] || [];
                                const approvedVendor = bomApprovedVendors.find(av => av.vendorId === assignment.vendor_id);
                                if (approvedVendor) return approvedVendor.vendorName;

                                // Last resort: show vendor ID if available
                                return assignment.vendor_id ? `Vendor ${assignment.vendor_id}` : 'Unknown Vendor';
                              })()}
                            </div>
                            {(() => {
                              const bomApprovedVendors = approvedVendorsByPart[assignment.bom_item_id] || [];
                              const isApproved = bomApprovedVendors.some(av => av.vendorId === assignment.vendor_id);

                              if (isApproved) {
                                return (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approved
                                  </Badge>
                                );
                              } else {
                                return (
                                  <Badge variant="outline" className="text-xs text-gray-600">
                                    Not Approved
                                  </Badge>
                                );
                              }
                            })()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(() => {
                              const bomApprovedVendors = approvedVendorsByPart[assignment.bom_item_id] || [];
                              const approvedVendor = bomApprovedVendors.find(av => av.vendorId === assignment.vendor_id);

                              if (approvedVendor) {
                                return `From: ${approvedVendor.nominationName} (Score: ${approvedVendor.overallScore.toFixed(1)}%)`;
                              } else {
                                return 'Assigned directly';
                              }
                            })()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            ₹{(assignment.unit_cost || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total for {bomItem?.quantity || 1} units
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {assignment.expected_delivery_date ? new Date(assignment.expected_delivery_date).toLocaleDateString() : 'Not set'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {assignment.expected_delivery_date ? `${Math.ceil((new Date(assignment.expected_delivery_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from now` : 'Lead time not calculated'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <Badge className="bg-green-100 text-green-600">
                              Assigned
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : 'Unknown date'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditAssignment(assignment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Empty State */}
          {vendorAssignments.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <div className="text-xl font-medium mb-2">No Vendor Assignments Yet</div>
              <div className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start by selecting a BOM part from your production lot and assign vendors from your supplier nominations.
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>• BOM Parts Available: {lotBOMItems.length}</div>
                <div>• Vendors Available: {availableVendors.length}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};