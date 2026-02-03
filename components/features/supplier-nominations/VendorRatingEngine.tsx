'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Calculator,
  Edit,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getVendorRatingMatrix,
  initializeVendorRatingMatrix,
  batchUpdateVendorRatingMatrix,
  getVendorRatingOverallScores,
  type VendorRatingMatrix,
  type UpdateVendorRatingData,
  type VendorRatingOverallScores
} from '@/lib/api/vendor-rating-matrix';

interface VendorRatingEngineProps {
  vendorId: string;
  nominationId?: string;
  onScoreUpdate?: (scores: any[]) => void;
}

export function VendorRatingEngine({ vendorId, nominationId, onScoreUpdate }: VendorRatingEngineProps) {
  const [ratingData, setRatingData] = useState<VendorRatingMatrix[]>([]);
  const [overallScores, setOverallScores] = useState<VendorRatingOverallScores>({
    sectionWiseCapability: 0,
    riskMitigation: 0,
    totalMinorNC: 0,
    totalMajorNC: 0,
    totalRecords: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingValues, setEditingValues] = useState<Record<string, Partial<UpdateVendorRatingData>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // ENTERPRISE OPTIMIZATION: Load data on mount with request deduplication
  useEffect(() => {
    if (!nominationId || !vendorId) {
      console.log('Missing nominationId or vendorId:', { nominationId, vendorId });
      return;
    }
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        // SINGLE API CALL - Get existing data first, minimize requests
        let data = await getVendorRatingMatrix(nominationId, vendorId);
        
        // BATCH LOAD: Get scores and data together to minimize API calls
        const [scores] = await Promise.all([
          getVendorRatingOverallScores(nominationId, vendorId)
        ]);
        
        // Only initialize if truly no data exists
        if (!data || data.length === 0) {
          await initializeVendorRatingMatrix(nominationId, vendorId);
          // Re-fetch after initialization
          [data] = await Promise.all([
            getVendorRatingMatrix(nominationId, vendorId)
          ]);
        }
        
        setRatingData(data);
        setOverallScores(scores);
        
      } catch (error) {
        console.error('Failed to load vendor rating data:', error);
        
        // More specific error messages
        if (error.message?.includes('404')) {
          toast.error('Vendor rating matrix endpoint not found. Please check backend configuration.');
        } else if (error.message?.includes('500')) {
          toast.error('Database error. The vendor_rating_matrix table or function may not exist.');
        } else if (error.message?.includes('403')) {
          toast.error('Permission denied. Please check authentication.');
        } else {
          toast.error(`Failed to load vendor rating data: ${error.message || error}`);
        }
        setRatingData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [nominationId, vendorId]);

  // Handle field updates
  const handleFieldChange = (id: string, field: keyof UpdateVendorRatingData, value: number) => {
    setEditingValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        id,
        [field]: value
      }
    }));
  };

  // Save all changes
  const handleSave = async () => {
    if (!nominationId || !vendorId) return;
    
    setIsSaving(true);
    try {
      const updates = Object.values(editingValues).filter(update => 
        update.sectionWiseCapabilityPercent !== undefined ||
        update.riskMitigationPercent !== undefined ||
        update.minorNC !== undefined ||
        update.majorNC !== undefined
      ) as UpdateVendorRatingData[];
      
      if (updates.length === 0) {
        toast.info('No changes to save');
        setIsEditing(false);
        return;
      }
      
      await batchUpdateVendorRatingMatrix(nominationId, vendorId, updates);
      
      // Reload data to get latest values
      const updatedData = await getVendorRatingMatrix(nominationId, vendorId);
      setRatingData(updatedData);
      
      const updatedScores = await getVendorRatingOverallScores(nominationId, vendorId);
      setOverallScores(updatedScores);
      
      setEditingValues({});
      setIsEditing(false);
      
      toast.success(`Successfully updated ${updates.length} rating items`);
      
      if (onScoreUpdate) {
        onScoreUpdate(updatedData);
      }
      
    } catch (error) {
      console.error('Failed to save vendor rating:', error);
      toast.error('Failed to save vendor rating');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingValues({});
    setIsEditing(false);
  };

  // Get current value (edited or original) with safe fallbacks
  const getCurrentValue = (item: VendorRatingMatrix, field: keyof UpdateVendorRatingData): number => {
    const edited = editingValues[item.id];
    if (edited && edited[field] !== undefined) {
      return edited[field] as number;
    }
    
    switch (field) {
      case 'sectionWiseCapabilityPercent': return item.sectionWiseCapabilityPercent || 0;
      case 'riskMitigationPercent': return item.riskMitigationPercent || 0;
      case 'minorNC': return item.minorNC || 0;
      case 'majorNC': return item.majorNC || 0;
      default: return 0;
    }
  };

  // Safe display value with fallback
  const getDisplayValue = (value: number | undefined): string => {
    return value !== undefined ? value.toFixed(1) : '0.0';
  };

  // Group data by category
  const groupedData = ratingData.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, VendorRatingMatrix[]>);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Loading vendor rating matrix...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Overall Scores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Overall Score 1</div>
            <div className="text-2xl font-bold text-white">{getDisplayValue(overallScores.sectionWiseCapability)}%</div>
            <div className="text-xs text-gray-400">Section Capability</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Overall Score 2</div>
            <div className="text-2xl font-bold text-white">{getDisplayValue(overallScores.riskMitigation)}%</div>
            <div className="text-xs text-gray-400">Risk Mitigation</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Non-Conformities</div>
            <div className="flex gap-2 mt-1">
              <Badge className="bg-green-500/20 text-green-400">Minor: {overallScores.totalMinorNC}</Badge>
              <Badge className="bg-red-500/20 text-red-400">Major: {overallScores.totalMajorNC}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Rating Status</div>
            <div className="text-lg font-bold text-white">{overallScores.totalRecords} criteria loaded</div>
            <div className="flex items-center gap-2 mt-2">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                disabled={isSaving}
                variant={isEditing ? "secondary" : "default"}
                size="sm"
                className="flex items-center gap-2"
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                {isEditing ? 'Cancel' : 'Edit Assessment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Rating Assessment Matrix */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Vendor Rating Assessment Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300 text-center bg-blue-100 text-black">S.no</TableHead>
                <TableHead className="text-gray-300 text-center bg-blue-100 text-black">category</TableHead>
                <TableHead className="text-gray-300 text-center bg-blue-100 text-black">Assessment Aspects</TableHead>
                <TableHead className="text-gray-300 text-center bg-blue-100 text-black">Section wise<br/>Capability %</TableHead>
                <TableHead className="text-gray-300 text-center bg-blue-100 text-black">Risk Mitigation %</TableHead>
                <TableHead className="text-gray-300 text-center bg-blue-100 text-black">No of Minor NC</TableHead>
                <TableHead className="text-gray-300 text-center bg-blue-100 text-black">No of Major NC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(ratingData.length === 0 ? [
                { id: '1', sNo: 1, category: 'Quality', assessmentAspects: 'Manufacturing Capability', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 },
                { id: '2', sNo: 2, category: 'Quality', assessmentAspects: 'Problem Solving Capability', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 },
                { id: '3', sNo: 3, category: 'Quality', assessmentAspects: 'Quality Control Capability', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 },
                { id: '4', sNo: 4, category: 'Quality', assessmentAspects: 'Prevention Capability', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 },
                { id: '5', sNo: 5, category: 'Cost', assessmentAspects: 'Cost', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 },
                { id: '6', sNo: 6, category: 'Logistics', assessmentAspects: 'Delivery Performance', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 },
                { id: '7', sNo: 7, category: 'Logistics', assessmentAspects: 'Customer Supplier Management', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 },
                { id: '8', sNo: 8, category: 'Development', assessmentAspects: 'Design & Development', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 },
                { id: '9', sNo: 9, category: 'Management', assessmentAspects: 'Strategy', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 },
                { id: '10', sNo: 10, category: 'Management', assessmentAspects: 'Management Culture', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 },
                { id: '11', sNo: 11, category: 'Management', assessmentAspects: 'TQM culture focus', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 },
                { id: '12', sNo: 12, category: 'Management', assessmentAspects: 'Legal & statutory Compliances', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 },
                { id: '13', sNo: 13, category: 'Core Process', assessmentAspects: 'Commodity', sectionWiseCapabilityPercent: 0, riskMitigationPercent: 0, minorNC: 0, majorNC: 0 }
              ] : ratingData).map((item) => (
                    <TableRow key={item.id} className="border-gray-700">
                      <TableCell className="text-gray-300 text-center">{item.sNo}</TableCell>
                      <TableCell className="text-gray-300 font-medium text-center">{item.category}</TableCell>
                      <TableCell className="text-gray-300">{item.assessmentAspects}</TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={getCurrentValue(item, 'sectionWiseCapabilityPercent')}
                            onChange={(e) => handleFieldChange(item.id, 'sectionWiseCapabilityPercent', parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-center bg-gray-700 border-gray-600 text-white"
                          />
                        ) : (
                          <span className="text-gray-300">{getDisplayValue(item.sectionWiseCapabilityPercent)}%</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={getCurrentValue(item, 'riskMitigationPercent')}
                            onChange={(e) => handleFieldChange(item.id, 'riskMitigationPercent', parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-center bg-gray-700 border-gray-600 text-white"
                          />
                        ) : (
                          <span className="text-gray-300">{getDisplayValue(item.riskMitigationPercent)}%</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={getCurrentValue(item, 'minorNC')}
                            onChange={(e) => handleFieldChange(item.id, 'minorNC', parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center bg-gray-700 border-gray-600 text-white"
                          />
                        ) : (
                          <span className="text-gray-300">{item.minorNC || 0}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={getCurrentValue(item, 'majorNC')}
                            onChange={(e) => handleFieldChange(item.id, 'majorNC', parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center bg-gray-700 border-gray-600 text-white"
                          />
                        ) : (
                          <span className="text-gray-300">{item.majorNC || 0}</span>
                        )}
                      </TableCell>
                    </TableRow>
                ))}
                
                {/* Overall Score Row - matching the image */}
                <TableRow className="bg-yellow-200 border-t-2 border-gray-600">
                  <TableCell colSpan={3} className="text-black font-bold text-center py-3">
                    Overall Score
                  </TableCell>
                  <TableCell className="text-black font-bold text-center py-3">
                    {overallScores.sectionWiseCapability.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-black font-bold text-center py-3">
                    {overallScores.riskMitigation.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-black font-bold text-center py-3">
                    {overallScores.totalMinorNC}
                  </TableCell>
                  <TableCell className="text-black font-bold text-center py-3">
                    {overallScores.totalMajorNC}
                  </TableCell>
                </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Save/Cancel Actions */}
      {isEditing && Object.keys(editingValues).length > 0 && (
        <div className="flex justify-end gap-2 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mr-auto">
            {Object.keys(editingValues).length} unsaved changes
          </Badge>
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={isSaving}
            className="border-gray-600 text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Save className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}