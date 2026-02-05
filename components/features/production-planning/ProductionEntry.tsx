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
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Search,
  Plus,
  Edit,
  Calendar,
  BarChart3,
  Target,
  XCircle,
  AlertCircle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProductionEntry {
  id: string;
  date: string;
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  processId: string;
  processName: string;
  targetQuantity: number;
  producedQuantity: number;
  rejectedQuantity: number;
  reworkQuantity: number;
  downtimeMinutes: number;
  downtimeReason: string;
  qualityIssues: string;
  operatorNotes: string;
  enteredBy: string;
  enteredAt: string;
}

interface WeeklyEntry {
  week: string;
  targetQuantity: number;
  producedQuantity: number;
  rejectedQuantity: number;
  efficiency: number;
}

interface ProductionEntryProps {
  lotId: string;
}

export const ProductionEntry = ({ lotId }: ProductionEntryProps) => {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<WeeklyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterProcess, setFilterProcess] = useState<string>('all');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryType, setEntryType] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    const fetchProductionData = async () => {
      try {
        // Mock production entry data
        const mockEntries: ProductionEntry[] = [
          {
            id: '1',
            date: '2026-02-05',
            shift: 'MORNING',
            processId: '1',
            processName: 'Material Preparation',
            targetQuantity: 10,
            producedQuantity: 8,
            rejectedQuantity: 1,
            reworkQuantity: 1,
            downtimeMinutes: 30,
            downtimeReason: 'Equipment calibration',
            qualityIssues: 'Minor surface scratches on 1 unit',
            operatorNotes: 'New operator training session conducted',
            enteredBy: 'Alice Johnson',
            enteredAt: '2026-02-05T16:30:00'
          },
          {
            id: '2',
            date: '2026-02-05',
            shift: 'AFTERNOON',
            processId: '1',
            processName: 'Material Preparation',
            targetQuantity: 10,
            producedQuantity: 9,
            rejectedQuantity: 0,
            reworkQuantity: 1,
            downtimeMinutes: 15,
            downtimeReason: 'Tool change',
            qualityIssues: '',
            operatorNotes: 'Smooth operation, good quality output',
            enteredBy: 'Bob Smith',
            enteredAt: '2026-02-05T22:15:00'
          },
          {
            id: '3',
            date: '2026-02-06',
            shift: 'MORNING',
            processId: '2',
            processName: 'Assembly',
            targetQuantity: 8,
            producedQuantity: 6,
            rejectedQuantity: 1,
            reworkQuantity: 1,
            downtimeMinutes: 45,
            downtimeReason: 'Material delay',
            qualityIssues: 'Alignment issue in 1 unit, corrected',
            operatorNotes: 'Waiting for steel plates delivery affected production',
            enteredBy: 'Michael Brown',
            enteredAt: '2026-02-06T16:45:00'
          }
        ];

        // Mock weekly entries
        const mockWeeklyEntries: WeeklyEntry[] = [
          {
            week: 'Week 6 (Feb 3-9)',
            targetQuantity: 50,
            producedQuantity: 42,
            rejectedQuantity: 3,
            efficiency: 84
          },
          {
            week: 'Week 7 (Feb 10-16)',
            targetQuantity: 60,
            producedQuantity: 0,
            rejectedQuantity: 0,
            efficiency: 0
          }
        ];
        
        setEntries(mockEntries);
        setWeeklyEntries(mockWeeklyEntries);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching production entry data:', error);
        setLoading(false);
      }
    };

    fetchProductionData();
  }, [lotId]);

  const getShiftColor = (shift: string) => {
    const colors = {
      MORNING: 'bg-yellow-100 text-yellow-600',
      AFTERNOON: 'bg-blue-100 text-blue-600',
      NIGHT: 'bg-purple-100 text-purple-600'
    };
    return colors[shift as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyIcon = (efficiency: number) => {
    if (efficiency >= 90) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (efficiency >= 75) return <Target className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const filteredEntries = entries.filter(entry => {
    const matchesDate = !filterDate || entry.date === filterDate;
    const matchesProcess = filterProcess === 'all' || entry.processId === filterProcess;
    return matchesDate && matchesProcess;
  });

  // Calculate totals
  const totalTarget = entries.reduce((sum, entry) => sum + entry.targetQuantity, 0);
  const totalProduced = entries.reduce((sum, entry) => sum + entry.producedQuantity, 0);
  const totalRejected = entries.reduce((sum, entry) => sum + entry.rejectedQuantity, 0);
  const totalDowntime = entries.reduce((sum, entry) => sum + entry.downtimeMinutes, 0);
  const overallEfficiency = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;

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
            <CardTitle className="text-sm font-medium">Target vs Actual</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProduced}/{totalTarget}</div>
            <p className="text-xs text-muted-foreground">
              Units produced vs target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            {getEfficiencyIcon(overallEfficiency)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getEfficiencyColor(overallEfficiency)}`}>
              {overallEfficiency}%
            </div>
            <p className="text-xs text-muted-foreground">
              Production efficiency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Units</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalRejected}</div>
            <p className="text-xs text-muted-foreground">
              {totalProduced > 0 ? `${((totalRejected / totalProduced) * 100).toFixed(1)}% rejection rate` : 'No production yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downtime</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(totalDowntime / 60)}h {totalDowntime % 60}m</div>
            <p className="text-xs text-muted-foreground">
              Equipment downtime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Production Entry Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Production Tracking</CardTitle>
              <CardDescription>
                Record and monitor daily and weekly production metrics
              </CardDescription>
            </div>
            <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Record Production Entry</DialogTitle>
                  <DialogDescription>
                    Enter production data for a specific process and shift
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="entry-date">Date</Label>
                      <DatePicker />
                    </div>
                    <div>
                      <Label htmlFor="shift">Shift</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MORNING">Morning (6 AM - 2 PM)</SelectItem>
                          <SelectItem value="AFTERNOON">Afternoon (2 PM - 10 PM)</SelectItem>
                          <SelectItem value="NIGHT">Night (10 PM - 6 AM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="process">Process</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select process" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Material Preparation</SelectItem>
                        <SelectItem value="2">Assembly</SelectItem>
                        <SelectItem value="3">Testing & Quality Control</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="target">Target Qty</Label>
                      <Input id="target" type="number" placeholder="10" />
                    </div>
                    <div>
                      <Label htmlFor="produced">Produced</Label>
                      <Input id="produced" type="number" placeholder="8" />
                    </div>
                    <div>
                      <Label htmlFor="rejected">Rejected</Label>
                      <Input id="rejected" type="number" placeholder="1" />
                    </div>
                    <div>
                      <Label htmlFor="rework">Rework</Label>
                      <Input id="rework" type="number" placeholder="1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="downtime">Downtime (minutes)</Label>
                      <Input id="downtime" type="number" placeholder="30" />
                    </div>
                    <div>
                      <Label htmlFor="downtime-reason">Downtime Reason</Label>
                      <Input id="downtime-reason" placeholder="Equipment maintenance" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="quality-issues">Quality Issues</Label>
                    <Textarea id="quality-issues" placeholder="Describe any quality issues observed" />
                  </div>
                  <div>
                    <Label htmlFor="notes">Operator Notes</Label>
                    <Textarea id="notes" placeholder="Additional notes or observations" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Entry</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={entryType} onValueChange={(value: any) => setEntryType(value)}>
            <TabsList>
              <TabsTrigger value="daily">Daily Entries</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="date-filter">Filter by Date</Label>
                  <Input
                    id="date-filter"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="process-filter">Filter by Process</Label>
                  <Select value={filterProcess} onValueChange={setFilterProcess}>
                    <SelectTrigger>
                      <SelectValue placeholder="All processes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Processes</SelectItem>
                      <SelectItem value="1">Material Preparation</SelectItem>
                      <SelectItem value="2">Assembly</SelectItem>
                      <SelectItem value="3">Testing & Quality Control</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Daily Entries Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Shift</TableHead>
                      <TableHead>Process</TableHead>
                      <TableHead>Production</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Downtime</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => {
                      const efficiency = Math.round((entry.producedQuantity / entry.targetQuantity) * 100);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {new Date(entry.date).toLocaleDateString()}
                              </div>
                              <Badge className={getShiftColor(entry.shift)} variant="outline">
                                {entry.shift}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{entry.processName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{entry.producedQuantity}/{entry.targetQuantity}</span>
                                <div className={`text-sm ${getEfficiencyColor(efficiency)}`}>
                                  ({efficiency}%)
                                </div>
                              </div>
                              {entry.reworkQuantity > 0 && (
                                <div className="text-xs text-orange-600">
                                  {entry.reworkQuantity} rework
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {entry.rejectedQuantity > 0 ? (
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span className="text-red-600">{entry.rejectedQuantity} rejected</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-green-600">No rejects</span>
                                </div>
                              )}
                              {entry.qualityIssues && (
                                <div className="text-xs text-orange-600 max-w-48 truncate">
                                  {entry.qualityIssues}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{entry.downtimeMinutes}m</div>
                              {entry.downtimeReason && (
                                <div className="text-xs text-muted-foreground max-w-32 truncate">
                                  {entry.downtimeReason}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.operatorNotes && (
                              <div className="text-xs text-muted-foreground max-w-48 truncate">
                                {entry.operatorNotes}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredEntries.length === 0 && (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-lg font-medium mb-2">No production entries found</div>
                  <div className="text-muted-foreground">
                    {filterDate || filterProcess !== 'all' 
                      ? 'Try adjusting your filter criteria'
                      : 'Start recording daily production data'
                    }
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              {/* Weekly Summary Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Produced</TableHead>
                      <TableHead>Rejected</TableHead>
                      <TableHead>Efficiency</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyEntries.map((week, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">{week.week}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{week.targetQuantity}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{week.producedQuantity}</div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${week.rejectedQuantity > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {week.rejectedQuantity}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-2 font-medium ${getEfficiencyColor(week.efficiency)}`}>
                            {getEfficiencyIcon(week.efficiency)}
                            {week.efficiency}%
                          </div>
                        </TableCell>
                        <TableCell>
                          {week.producedQuantity >= week.targetQuantity ? (
                            <Badge className="bg-green-100 text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              On Track
                            </Badge>
                          ) : week.producedQuantity === 0 ? (
                            <Badge className="bg-gray-100 text-gray-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Planned
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Behind
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};