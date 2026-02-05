'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  Calendar,
  User,
  Flag,
  Package,
  Settings,
  Bug,
  Lightbulb
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Remark {
  id: string;
  type: 'GENERAL' | 'DELAY' | 'QUALITY' | 'MATERIAL' | 'SAFETY' | 'SUGGESTION';
  level: 'LOT' | 'PROCESS' | 'SUBTASK';
  targetId: string;
  targetName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  assignedToName?: string;
  resolution?: string;
  attachments: string[];
  comments: Comment[];
}

interface Comment {
  id: string;
  remarkId: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

interface RemarksIssuesProps {
  lotId: string;
}

export const RemarksIssues = ({ lotId }: RemarksIssuesProps) => {
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewRemark, setShowNewRemark] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState<Remark | null>(null);

  useEffect(() => {
    const fetchRemarksData = async () => {
      try {
        // Mock remarks and issues data
        const mockRemarks: Remark[] = [
          {
            id: '1',
            type: 'DELAY',
            level: 'PROCESS',
            targetId: '1',
            targetName: 'Material Preparation',
            priority: 'HIGH',
            title: 'Material Delivery Delay',
            description: 'Steel plates delivery is delayed by 2 days due to supplier transport issues. This will impact the overall production timeline.',
            status: 'IN_PROGRESS',
            createdBy: 'user-1',
            createdByName: 'Alice Johnson',
            createdAt: '2026-02-04T10:30:00',
            updatedAt: '2026-02-04T14:20:00',
            assignedTo: 'user-2',
            assignedToName: 'Michael Brown',
            resolution: '',
            attachments: [],
            comments: [
              {
                id: 'c1',
                remarkId: '1',
                content: 'Contacted supplier, they confirmed delivery by Feb 6th morning.',
                createdBy: 'user-2',
                createdByName: 'Michael Brown',
                createdAt: '2026-02-04T14:20:00'
              }
            ]
          },
          {
            id: '2',
            type: 'QUALITY',
            level: 'SUBTASK',
            targetId: 'st-1-1',
            targetName: 'Material Inspection',
            priority: 'MEDIUM',
            title: 'Surface Quality Issue',
            description: 'Minor surface scratches observed on steel plates. Need to assess if this affects the final product quality.',
            status: 'RESOLVED',
            createdBy: 'user-3',
            createdByName: 'Bob Smith',
            createdAt: '2026-02-03T09:15:00',
            updatedAt: '2026-02-03T16:45:00',
            assignedTo: 'user-4',
            assignedToName: 'Sarah Garcia',
            resolution: 'QC team confirmed scratches are within acceptable tolerance. No impact on final product.',
            attachments: [],
            comments: [
              {
                id: 'c2',
                remarkId: '2',
                content: 'Photos of the scratches have been documented for future reference.',
                createdBy: 'user-3',
                createdByName: 'Bob Smith',
                createdAt: '2026-02-03T11:30:00'
              },
              {
                id: 'c3',
                remarkId: '2',
                content: 'Quality standards review completed. Marks acceptable.',
                createdBy: 'user-4',
                createdByName: 'Sarah Garcia',
                createdAt: '2026-02-03T16:45:00'
              }
            ]
          },
          {
            id: '3',
            type: 'SUGGESTION',
            level: 'LOT',
            targetId: lotId,
            targetName: 'LOT-20260205-332',
            priority: 'LOW',
            title: 'Process Optimization Suggestion',
            description: 'Consider implementing parallel processing for assembly steps to reduce overall production time by 15%.',
            status: 'OPEN',
            createdBy: 'user-5',
            createdByName: 'Emma Taylor',
            createdAt: '2026-02-02T14:00:00',
            updatedAt: '2026-02-02T14:00:00',
            assignedTo: undefined,
            assignedToName: undefined,
            resolution: '',
            attachments: [],
            comments: []
          },
          {
            id: '4',
            type: 'SAFETY',
            level: 'PROCESS',
            targetId: '2',
            targetName: 'Assembly',
            priority: 'CRITICAL',
            title: 'Safety Protocol Reminder',
            description: 'Ensure all operators wear proper PPE during welding operations. Safety audit scheduled for next week.',
            status: 'OPEN',
            createdBy: 'user-6',
            createdByName: 'Safety Officer',
            createdAt: '2026-02-01T08:00:00',
            updatedAt: '2026-02-01T08:00:00',
            assignedTo: 'user-2',
            assignedToName: 'Michael Brown',
            resolution: '',
            attachments: [],
            comments: [
              {
                id: 'c4',
                remarkId: '4',
                content: 'PPE checklist updated and distributed to all operators.',
                createdBy: 'user-2',
                createdByName: 'Michael Brown',
                createdAt: '2026-02-01T10:30:00'
              }
            ]
          }
        ];
        
        setRemarks(mockRemarks);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching remarks data:', error);
        setLoading(false);
      }
    };

    fetchRemarksData();
  }, [lotId]);

  const getTypeColor = (type: string) => {
    const colors = {
      GENERAL: 'bg-gray-100 text-gray-600',
      DELAY: 'bg-red-100 text-red-600',
      QUALITY: 'bg-yellow-100 text-yellow-600',
      MATERIAL: 'bg-blue-100 text-blue-600',
      SAFETY: 'bg-orange-100 text-orange-600',
      SUGGESTION: 'bg-green-100 text-green-600'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DELAY': return <Clock className="h-4 w-4" />;
      case 'QUALITY': return <CheckCircle className="h-4 w-4" />;
      case 'MATERIAL': return <Package className="h-4 w-4" />;
      case 'SAFETY': return <Flag className="h-4 w-4" />;
      case 'SUGGESTION': return <Lightbulb className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'bg-green-100 text-green-600',
      MEDIUM: 'bg-yellow-100 text-yellow-600',
      HIGH: 'bg-orange-100 text-orange-600',
      CRITICAL: 'bg-red-100 text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      OPEN: 'bg-blue-100 text-blue-600',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-600',
      RESOLVED: 'bg-green-100 text-green-600',
      CLOSED: 'bg-gray-100 text-gray-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const filteredRemarks = remarks.filter(remark => {
    const matchesSearch = remark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         remark.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         remark.createdByName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || remark.type === filterType;
    const matchesLevel = filterLevel === 'all' || remark.level === filterLevel;
    const matchesStatus = filterStatus === 'all' || remark.status === filterStatus;
    return matchesSearch && matchesType && matchesLevel && matchesStatus;
  });

  // Calculate statistics
  const totalRemarks = remarks.length;
  const openRemarks = remarks.filter(r => r.status === 'OPEN').length;
  const criticalRemarks = remarks.filter(r => r.priority === 'CRITICAL').length;
  const resolvedRemarks = remarks.filter(r => r.status === 'RESOLVED').length;

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
            <CardTitle className="text-sm font-medium">Total Remarks</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRemarks}</div>
            <p className="text-xs text-muted-foreground">
              All issues and remarks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{openRemarks}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <Flag className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalRemarks}</div>
            <p className="text-xs text-muted-foreground">
              High priority items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedRemarks}</div>
            <p className="text-xs text-muted-foreground">
              Completed issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Remarks and Issues */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Remarks & Issues</CardTitle>
              <CardDescription>
                Track and manage issues, delays, and suggestions for this production lot
              </CardDescription>
            </div>
            <Dialog open={showNewRemark} onOpenChange={setShowNewRemark}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Remark
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Remark</DialogTitle>
                  <DialogDescription>
                    Record an issue, suggestion, or important note
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GENERAL">General</SelectItem>
                          <SelectItem value="DELAY">Delay</SelectItem>
                          <SelectItem value="QUALITY">Quality Issue</SelectItem>
                          <SelectItem value="MATERIAL">Material Issue</SelectItem>
                          <SelectItem value="SAFETY">Safety</SelectItem>
                          <SelectItem value="SUGGESTION">Suggestion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="level">Applies To</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOT">Entire Lot</SelectItem>
                          <SelectItem value="PROCESS">Specific Process</SelectItem>
                          <SelectItem value="SUBTASK">Sub-task</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="target">Assign To</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select person" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user-1">Alice Johnson</SelectItem>
                          <SelectItem value="user-2">Michael Brown</SelectItem>
                          <SelectItem value="user-3">Sarah Garcia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" placeholder="Brief description of the issue" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Detailed description of the issue, impact, and any immediate actions taken"
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Remark</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search remarks and issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 lg:w-96">
              <div>
                <Label>Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="DELAY">Delays</SelectItem>
                    <SelectItem value="QUALITY">Quality</SelectItem>
                    <SelectItem value="MATERIAL">Material</SelectItem>
                    <SelectItem value="SAFETY">Safety</SelectItem>
                    <SelectItem value="SUGGESTION">Suggestions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="LOT">Lot</SelectItem>
                    <SelectItem value="PROCESS">Process</SelectItem>
                    <SelectItem value="SUBTASK">Sub-task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Remarks List */}
          <div className="space-y-4">
            {filteredRemarks.map((remark) => (
              <Card key={remark.id} className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(remark.type)} variant="outline">
                          {getTypeIcon(remark.type)}
                          {remark.type}
                        </Badge>
                        <Badge className={getPriorityColor(remark.priority)}>
                          {remark.priority}
                        </Badge>
                        <Badge className={getStatusColor(remark.status)} variant="outline">
                          {remark.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{remark.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {remark.level}: {remark.targetName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedRemark(remark)}
                      >
                        View Details
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm mb-4">{remark.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Created by {remark.createdByName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(remark.createdAt).toLocaleDateString()}
                      </div>
                      {remark.assignedToName && (
                        <div className="flex items-center gap-2">
                          <Flag className="h-3 w-3" />
                          Assigned to {remark.assignedToName}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3" />
                      {remark.comments.length} comments
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRemarks.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg font-medium mb-2">No remarks found</div>
              <div className="text-muted-foreground">
                {searchTerm || filterType !== 'all' || filterLevel !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No issues or remarks have been recorded yet'
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remark Details Modal */}
      {selectedRemark && (
        <Dialog open={!!selectedRemark} onOpenChange={() => setSelectedRemark(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getTypeIcon(selectedRemark.type)}
                {selectedRemark.title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={getTypeColor(selectedRemark.type)} variant="outline">
                  {selectedRemark.type}
                </Badge>
                <Badge className={getPriorityColor(selectedRemark.priority)}>
                  {selectedRemark.priority}
                </Badge>
                <Badge className={getStatusColor(selectedRemark.status)} variant="outline">
                  {selectedRemark.status}
                </Badge>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedRemark.description}</p>
              </div>
              
              {selectedRemark.resolution && (
                <div>
                  <h4 className="font-medium mb-2">Resolution</h4>
                  <p className="text-sm text-muted-foreground">{selectedRemark.resolution}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Created by:</span> {selectedRemark.createdByName}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(selectedRemark.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Applies to:</span> {selectedRemark.level} - {selectedRemark.targetName}
                </div>
                {selectedRemark.assignedToName && (
                  <div>
                    <span className="font-medium">Assigned to:</span> {selectedRemark.assignedToName}
                  </div>
                )}
              </div>

              {selectedRemark.comments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Comments ({selectedRemark.comments.length})</h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {selectedRemark.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {comment.createdByName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.createdByName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Add Comment</h4>
                <Textarea placeholder="Add a comment or update..." rows={3} />
                <Button size="sm" className="mt-2">Post Comment</Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRemark(null)}>
                Close
              </Button>
              <Button>Update Status</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};