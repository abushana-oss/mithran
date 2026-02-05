'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { VendorAssignment } from '@/components/features/production-planning/VendorAssignment';
import { ProcessPlanning } from '@/components/features/production-planning/ProcessPlanning';
import { ScheduleView } from '@/components/features/production-planning/ScheduleView';
import { ProductionEntry } from '@/components/features/production-planning/ProductionEntry';
import { RemarksIssues } from '@/components/features/production-planning/RemarksIssues';
import { IntegratedMonitoringBOM } from '@/components/features/production-planning/IntegratedMonitoringBOM';

interface LotDetailPageProps {
  params: Promise<{ lotId: string }>;
}

const LotDetailPage = ({ params }: LotDetailPageProps) => {
  const router = useRouter();
  const [lot, setLot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lotId, setLotId] = useState<string>('');

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setLotId(resolvedParams.lotId);
    };
    
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (!lotId) return;
    
    const fetchLotDetails = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockLot = {
          id: lotId,
          lotNumber: 'LOT-20260205-332',
          type: 'prototype',
          bomName: 'emuski',
          bomVersion: 'v1.0',
          quantity: 3,
          status: 'PLANNED',
          priority: 'MEDIUM',
          startDate: '2026-02-05',
          endDate: '2026-02-20',
          progress: 0,
          totalCost: 0,
          materialCost: 0,
          processCount: 0,
          completedProcesses: 0
        };
        setLot(mockLot);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching lot details:', error);
        setLoading(false);
      }
    };

    fetchLotDetails();
  }, [lotId]);

  const getStatusColor = (status: string) => {
    const colors = {
      PLANNED: 'bg-blue-100 text-blue-600',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-600',
      COMPLETED: 'bg-green-100 text-green-600',
      ON_HOLD: 'bg-red-100 text-red-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      HIGH: 'bg-red-100 text-red-600',
      MEDIUM: 'bg-yellow-100 text-yellow-600',
      LOW: 'bg-green-100 text-green-600'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Lot Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested lot could not be found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{lot.lotNumber}</h1>
            <Badge variant="secondary" className="text-xs">
              {lot.type}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {lot.bomName} v{lot.bomVersion} • {lot.quantity} units
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(lot.status)}>
              {lot.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getPriorityColor(lot.priority)}>
              {lot.priority}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={lot.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {lot.completedProcesses} / {lot.processCount} processes
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">₹{lot.totalCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Material: ₹{lot.materialCost.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-sm font-medium">Start Date</p>
              <p className="text-sm text-muted-foreground">
                {new Date(lot.startDate).toLocaleDateString()}
              </p>
            </div>
            <Separator orientation="horizontal" className="flex-1 mx-4" />
            <div className="text-center">
              <p className="text-sm font-medium">End Date</p>
              <p className="text-sm text-muted-foreground">
                {new Date(lot.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="integrated" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="integrated">Monitoring & Materials</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="remarks">Remarks</TabsTrigger>
        </TabsList>

        <TabsContent value="integrated">
          <IntegratedMonitoringBOM lotId={lotId} />
        </TabsContent>

        <TabsContent value="vendors">
          <VendorAssignment lotId={lotId} />
        </TabsContent>

        <TabsContent value="processes">
          <ProcessPlanning lotId={lotId} />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleView lotId={lotId} />
        </TabsContent>

        <TabsContent value="production">
          <ProductionEntry lotId={lotId} />
        </TabsContent>

        <TabsContent value="remarks">
          <RemarksIssues lotId={lotId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LotDetailPage;