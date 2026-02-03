'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, TrendingUp, AlertTriangle, Edit, Save, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { getVendorRatingMatrix, initializeVendorRatingMatrix, batchUpdateVendorRatingMatrix, getVendorRatingOverallScores } from '@/lib/api/vendor-rating-matrix';

interface VendorRatingMatrix {
  id: string;
  sNo: number;
  category: string;
  assessmentAspects: string;
  sectionWiseCapabilityPercent: number;
  riskMitigationPercent: number;
  minorNC: number;
  majorNC: number;
}

interface OverallScores {
  sectionWiseCapability: number;
  riskMitigation: number;
  totalMinorNC: number;
  totalMajorNC: number;
}

interface Props {
  vendorId: string;
  nominationId?: string;
}

export function VendorRatingMatrix({ vendorId, nominationId }: Props) {
  const [data, setData] = useState<VendorRatingMatrix[]>([]);
  const [overall, setOverall] = useState<OverallScores>({ sectionWiseCapability: 0, riskMitigation: 0, totalMinorNC: 0, totalMajorNC: 0 });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changes, setChanges] = useState<Record<string, Partial<VendorRatingMatrix>>>({});
  const [saving, setSaving] = useState(false);

  // Load data
  useEffect(() => {
    if (!nominationId || !vendorId) return;
    
    const load = async () => {
      setLoading(true);
      try {
        let result = await getVendorRatingMatrix(nominationId, vendorId);
        if (result.length === 0) {
          await initializeVendorRatingMatrix(nominationId, vendorId);
          result = await getVendorRatingMatrix(nominationId, vendorId);
        }
        setData(result);
        
        const scores = await getVendorRatingOverallScores(nominationId, vendorId);
        setOverall(scores);
      } catch (error) {
        toast.error('Failed to load rating data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [nominationId, vendorId]);

  // Update value locally
  const updateValue = (id: string, field: keyof VendorRatingMatrix, value: number) => {
    setChanges(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  // Get current value (edited or original)
  const getValue = (item: VendorRatingMatrix, field: keyof VendorRatingMatrix): number => {
    return (changes[item.id]?.[field] as number) ?? (item[field] as number);
  };

  // Save changes
  const save = async () => {
    if (!nominationId || !vendorId || Object.keys(changes).length === 0) {
      toast.error('No changes to save');
      return;
    }

    setSaving(true);
    try {
      const updates = Object.entries(changes).map(([id, change]) => ({ id, ...change }));
      const updated = await batchUpdateVendorRatingMatrix(nominationId, vendorId, updates);
      setData(updated);
      
      const scores = await getVendorRatingOverallScores(nominationId, vendorId);
      setOverall(scores);
      
      setChanges({});
      setEditing(false);
      toast.success(`Saved ${updates.length} changes`);
    } catch (error) {
      toast.error('Failed to save changes');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const cancel = () => {
    setChanges({});
    setEditing(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-white">Vendor Rating Assessment Matrix</h3>
          <Badge className={data.length > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
            {data.length > 0 ? `${data.length} criteria` : 'No data'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              {Object.keys(changes).length > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-400">
                  {Object.keys(changes).length} unsaved
                </Badge>
              )}
              <Button onClick={save} disabled={saving || Object.keys(changes).length === 0} className="bg-green-600 hover:bg-green-700" size="sm">
                {saving ? <Save className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
              <Button onClick={cancel} disabled={saving} variant="outline" size="sm" className="border-gray-600">
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} disabled={data.length === 0} variant="outline" size="sm" className="border-gray-600">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Overall Scores */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Section Capability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overall.sectionWiseCapability}%</div>
            <Progress value={overall.sectionWiseCapability} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Risk Mitigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overall.riskMitigation}%</div>
            <Progress value={overall.riskMitigation} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Minor NC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{overall.totalMinorNC}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Major NC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{overall.totalMajorNC}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Assessment Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">S.No</TableHead>
                <TableHead className="text-gray-300">Category</TableHead>
                <TableHead className="text-gray-300">Assessment Aspects</TableHead>
                <TableHead className="text-gray-300">Section Capability %</TableHead>
                <TableHead className="text-gray-300">Risk Mitigation %</TableHead>
                <TableHead className="text-gray-300">Minor NC</TableHead>
                <TableHead className="text-gray-300">Major NC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id} className="border-gray-700">
                  <TableCell className="text-gray-300">{item.sNo}</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-500/20 text-blue-400">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-white">{item.assessmentAspects}</TableCell>
                  
                  <TableCell>
                    {editing ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={getValue(item, 'sectionWiseCapabilityPercent')}
                        onChange={(e) => updateValue(item.id, 'sectionWiseCapabilityPercent', parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 bg-gray-700 border-gray-600 text-white"
                      />
                    ) : (
                      <span className="text-white">{item.sectionWiseCapabilityPercent.toFixed(2)}%</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editing ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={getValue(item, 'riskMitigationPercent')}
                        onChange={(e) => updateValue(item.id, 'riskMitigationPercent', parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 bg-gray-700 border-gray-600 text-white"
                      />
                    ) : (
                      <span className="text-white">{item.riskMitigationPercent.toFixed(2)}%</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editing ? (
                      <Input
                        type="number"
                        min="0"
                        value={getValue(item, 'minorNC')}
                        onChange={(e) => updateValue(item.id, 'minorNC', parseInt(e.target.value) || 0)}
                        className="w-16 h-8 bg-gray-700 border-gray-600 text-white"
                      />
                    ) : (
                      <span className="text-yellow-400">{item.minorNC}</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editing ? (
                      <Input
                        type="number"
                        min="0"
                        value={getValue(item, 'majorNC')}
                        onChange={(e) => updateValue(item.id, 'majorNC', parseInt(e.target.value) || 0)}
                        className="w-16 h-8 bg-gray-700 border-gray-600 text-white"
                      />
                    ) : (
                      <span className="text-red-400">{item.majorNC}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}