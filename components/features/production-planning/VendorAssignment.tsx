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
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Search,
  Plus,
  Edit,
  Calendar,
  DollarSign,
  Truck
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

interface VendorAssignment {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  vendorId: string;
  vendorName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  quotedPrice: number;
  negotiatedPrice: number | null;
  leadTime: number;
  deliveryDate: string;
  orderStatus: 'PENDING' | 'ORDERED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';
  paymentTerms: string;
  qualityRating: number;
  deliveryRating: number;
  notes: string;
  trackingNumber: string | null;
  invoiceAmount: number | null;
}

interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  rating: number;
  specialization: string[];
}

interface VendorAssignmentProps {
  lotId: string;
}

export const VendorAssignment = ({ lotId }: VendorAssignmentProps) => {
  const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingAssignment, setEditingAssignment] = useState<VendorAssignment | null>(null);
  const [showNewAssignment, setShowNewAssignment] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mock vendor assignments data
        const mockAssignments: VendorAssignment[] = [
          {
            id: '1',
            partId: '1',
            partNumber: 'STL-001',
            partName: 'Steel Plate',
            vendorId: 'vendor-1',
            vendorName: 'SteelCorp Industries',
            contactPerson: 'John Smith',
            contactEmail: 'john@steelcorp.com',
            contactPhone: '+1-555-0101',
            quotedPrice: 1500,
            negotiatedPrice: 1450,
            leadTime: 7,
            deliveryDate: '2026-02-08',
            orderStatus: 'CONFIRMED',
            paymentTerms: 'Net 30',
            qualityRating: 4.5,
            deliveryRating: 4.2,
            notes: 'Preferred vendor for steel materials. Good quality and on-time delivery.',
            trackingNumber: 'TRK-12345',
            invoiceAmount: 1450
          },
          {
            id: '2',
            partId: '3',
            partNumber: 'ELC-003',
            partName: 'Circuit Board',
            vendorId: 'vendor-2',
            vendorName: 'ElectronicsPlus',
            contactPerson: 'Sarah Johnson',
            contactEmail: 'sarah@electronicsplus.com',
            contactPhone: '+1-555-0102',
            quotedPrice: 2200,
            negotiatedPrice: null,
            leadTime: 10,
            deliveryDate: '2026-02-12',
            orderStatus: 'ORDERED',
            paymentTerms: 'Net 15',
            qualityRating: 4.8,
            deliveryRating: 4.6,
            notes: 'Specialist in custom PCB manufacturing. ISO certified.',
            trackingNumber: null,
            invoiceAmount: null
          },
          {
            id: '3',
            partId: '4',
            partNumber: 'MSC-004',
            partName: 'Mounting Screws',
            vendorId: 'vendor-3',
            vendorName: 'FastenerWorld',
            contactPerson: 'Mike Chen',
            contactEmail: 'mike@fastenerworld.com',
            contactPhone: '+1-555-0103',
            quotedPrice: 120,
            negotiatedPrice: 115,
            leadTime: 3,
            deliveryDate: '2026-02-06',
            orderStatus: 'DELIVERED',
            paymentTerms: 'Net 7',
            qualityRating: 4.0,
            deliveryRating: 4.8,
            notes: 'Fast delivery for standard hardware. Bulk pricing available.',
            trackingNumber: 'TRK-67890',
            invoiceAmount: 115
          }
        ];

        // Mock available vendors
        const mockVendors: Vendor[] = [
          {
            id: 'vendor-1',
            name: 'SteelCorp Industries',
            contactPerson: 'John Smith',
            email: 'john@steelcorp.com',
            phone: '+1-555-0101',
            rating: 4.3,
            specialization: ['Metal', 'Steel', 'Aluminum']
          },
          {
            id: 'vendor-2',
            name: 'ElectronicsPlus',
            contactPerson: 'Sarah Johnson',
            email: 'sarah@electronicsplus.com',
            phone: '+1-555-0102',
            rating: 4.7,
            specialization: ['Electronic', 'PCB', 'Components']
          },
          {
            id: 'vendor-3',
            name: 'FastenerWorld',
            contactPerson: 'Mike Chen',
            email: 'mike@fastenerworld.com',
            phone: '+1-555-0103',
            rating: 4.4,
            specialization: ['Hardware', 'Fasteners', 'Screws']
          },
          {
            id: 'vendor-4',
            name: 'PlasticWorks',
            contactPerson: 'Lisa Williams',
            email: 'lisa@plasticworks.com',
            phone: '+1-555-0104',
            rating: 4.1,
            specialization: ['Plastic', 'Injection Molding', 'Polymer']
          }
        ];
        
        setAssignments(mockAssignments);
        setAvailableVendors(mockVendors);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching vendor assignment data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [lotId]);

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-600',
      ORDERED: 'bg-blue-100 text-blue-600',
      CONFIRMED: 'bg-green-100 text-green-600',
      SHIPPED: 'bg-purple-100 text-purple-600',
      DELIVERED: 'bg-emerald-100 text-emerald-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'ORDERED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4" />;
      case 'SHIPPED':
        return <Truck className="h-4 w-4" />;
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || assignment.orderStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalQuotedAmount = assignments.reduce((sum, assignment) => sum + assignment.quotedPrice, 0);
  const totalNegotiatedAmount = assignments.reduce((sum, assignment) => sum + (assignment.negotiatedPrice || assignment.quotedPrice), 0);
  const savings = totalQuotedAmount - totalNegotiatedAmount;

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
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Assigned vendors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quoted Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalQuotedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Initial quotes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negotiated Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalNegotiatedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Final prices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <div className="text-green-600">₹</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{savings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((savings / totalQuotedAmount) * 100).toFixed(1)}% reduction
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
                  <DialogTitle>Assign Vendor to Part</DialogTitle>
                  <DialogDescription>
                    Select a vendor and configure assignment details
                  </DialogDescription>
                </DialogHeader>
                {/* New assignment form would go here */}
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="part" className="text-right">Part</Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a part" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="part-1">PLT-002 - Plastic Housing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="vendor" className="text-right">Vendor</Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVendors.map(vendor => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name} - {vendor.specialization.join(', ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Quoted Price</Label>
                    <Input id="price" placeholder="0" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="delivery" className="text-right">Delivery Date</Label>
                    <div className="col-span-3">
                      <DatePicker />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Assign Vendor</Button>
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
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ORDERED">Ordered</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vendor Assignment Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Details</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ratings</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{assignment.partName}</div>
                        <div className="text-sm text-muted-foreground">{assignment.partNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{assignment.vendorName}</div>
                        <div className="text-sm text-muted-foreground">{assignment.contactPerson}</div>
                        <div className="text-xs text-muted-foreground">{assignment.contactEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground line-through">
                          ₹{assignment.quotedPrice.toLocaleString()}
                        </div>
                        <div className="font-medium">
                          ₹{(assignment.negotiatedPrice || assignment.quotedPrice).toLocaleString()}
                        </div>
                        {assignment.negotiatedPrice && assignment.negotiatedPrice < assignment.quotedPrice && (
                          <div className="text-xs text-green-600">
                            Saved ₹{(assignment.quotedPrice - assignment.negotiatedPrice).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(assignment.deliveryDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {assignment.leadTime} days lead time
                        </div>
                        {assignment.trackingNumber && (
                          <div className="text-xs text-blue-600">
                            Track: {assignment.trackingNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(assignment.orderStatus)}
                        <Badge className={getStatusColor(assignment.orderStatus)}>
                          {assignment.orderStatus}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Quality:</span>
                          <span className={`text-xs font-medium ${getRatingColor(assignment.qualityRating)}`}>
                            {assignment.qualityRating}/5
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Delivery:</span>
                          <span className={`text-xs font-medium ${getRatingColor(assignment.deliveryRating)}`}>
                            {assignment.deliveryRating}/5
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingAssignment(assignment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-medium mb-2">No vendor assignments found</div>
              <div className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Assign vendors to parts to get started'
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};