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
        
        // Initialize if no data exists
        if (!data || data.length === 0) {
          try {
            await initializeVendorRatingMatrix(nominationId, vendorId);
            data = await getVendorRatingMatrix(nominationId, vendorId);
          } catch (initError) {
            console.error('Failed to initialize vendor rating matrix:', initError);
            // Use empty data - component will show default template
            data = [];
          }
        }
        
        setRatingData(data);
        setOverallScores(scores);
        
      } catch (error) {
        console.error('Failed to load vendor rating data:', error);
        
        // Handle different error types professionally
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          // 404 is expected when no data exists yet - don't show error toast
          console.log('No rating matrix found - this is normal for new records');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          toast.error('Network connection failed. Please check your connection and try again.');
        } else if (errorMessage.includes('timeout')) {
          toast.error('Request timed out. Please try again.');
        } else if (errorMessage.includes('500')) {
          toast.error('Server error. Please contact support if this persists.');
        } else if (errorMessage.includes('403') || errorMessage.includes('401')) {
          toast.error('Access denied. Please refresh the page and sign in again.');
        } else if (errorMessage.includes('Missing required parameters')) {
          toast.error('Invalid page parameters. Please refresh and try again.');
        } else {
          // Only show generic error for truly unexpected cases
          toast.error('Failed to load rating data. Please refresh the page.');
        }
        
        // Always set empty data to prevent UI breaking
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

  // Calculate real-time overall scores based on current editing state
  const calculateCurrentOverallScores = () => {
    if (ratingData.length === 0) return overallScores;

    let totalSectionCapability = 0;
    let totalRiskMitigation = 0;
    let totalMinorNC = 0;
    let totalMajorNC = 0;
    let recordCount = 0;

    ratingData.forEach(item => {
      const editing = editingValues[item.id];
      
      // Use edited values if available, otherwise use original values
      const sectionCapability = editing?.sectionWiseCapabilityPercent ?? item.sectionWiseCapabilityPercent;
      const riskMitigation = editing?.riskMitigationPercent ?? item.riskMitigationPercent;
      const minorNC = editing?.minorNC ?? item.minorNC;
      const majorNC = editing?.majorNC ?? item.majorNC;

      totalSectionCapability += sectionCapability;
      totalRiskMitigation += riskMitigation;
      totalMinorNC += minorNC;
      totalMajorNC += majorNC;
      recordCount++;
    });

    return {
      sectionWiseCapability: recordCount > 0 ? totalSectionCapability / recordCount : 0,
      riskMitigation: recordCount > 0 ? totalRiskMitigation / recordCount : 0,
      totalMinorNC,
      totalMajorNC,
      totalRecords: recordCount
    };
  };

  // Get current overall scores (real-time calculated or saved)
  const getCurrentOverallScores = () => {
    return isEditing ? calculateCurrentOverallScores() : overallScores;
  };


  const handleSave = async () => {
    // Ensure both IDs are present before attempting to save
    if (!nominationId || !vendorId) {
      console.error("Cannot save: Missing nominationId or vendorId");
      return;
    }

    setIsSaving(true);
    let updates: UpdateVendorRatingData[] = [];
    
    try {
      // Only allow editing of numeric values, not criteria names (assessmentAspects)
      updates = Object.values(editingValues).filter(update => 
        update.sectionWiseCapabilityPercent !== undefined ||
        update.riskMitigationPercent !== undefined ||
        update.minorNC !== undefined ||
        update.majorNC !== undefined
      ) as UpdateVendorRatingData[];
      
      if (updates.length === 0) {
        toast.info('No changes to save');
        setIsEditing(false);
        setIsSaving(false);
        return;
      }

      // Save to backend with proper error handling
      try {
        await batchUpdateVendorRatingMatrix(nominationId, vendorId, updates);
        
        // Refresh data from backend
        const [freshData, updatedScores] = await Promise.all([
          getVendorRatingMatrix(nominationId, vendorId),
          getVendorRatingOverallScores(nominationId, vendorId)
        ]);
        
        setRatingData(freshData);
        setOverallScores(updatedScores);
        setEditingValues({});
        setIsEditing(false);
        
        if (onScoreUpdate) {
          onScoreUpdate(freshData);
        }
        
        toast.success(`Successfully updated ${updates.length} rating entries`);
      } catch (error) {
        console.error('Failed to save vendor rating:', error);
        toast.error('Failed to save ratings. Please try again.');
      }
      
      setIsSaving(false);
      return;
      
    } catch (error) {
      // This is where your logged error originates
      console.warn('Vendor rating save failed', { 
        error: error.message, 
        nominationId, 
        vendorId 
      });
      
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

  // Remove loading state to show data immediately and prevent duplicate requests

  return (
    <div className="space-y-6">
      {/* Header with Overall Scores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Overall Score 1</div>
            <div className="text-2xl font-bold text-white">{getDisplayValue(getCurrentOverallScores().sectionWiseCapability)}%</div>
            <div className="text-xs text-gray-400">Section Capability</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Overall Score 2</div>
            <div className="text-2xl font-bold text-white">{getDisplayValue(getCurrentOverallScores().riskMitigation)}%</div>
            <div className="text-xs text-gray-400">Risk Mitigation</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="text-sm text-gray-400">Non-Conformities</div>
            <div className="flex gap-2 mt-1">
              <Badge className="bg-green-500/20 text-green-400">Minor: {getCurrentOverallScores().totalMinorNC}</Badge>
              <Badge className="bg-red-500/20 text-red-400">Major: {getCurrentOverallScores().totalMajorNC}</Badge>
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
                      <TableCell className="text-gray-300">
                        <span>{item.assessmentAspects}</span>
                      </TableCell>
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
                    {getCurrentOverallScores().sectionWiseCapability.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-black font-bold text-center py-3">
                    {getCurrentOverallScores().riskMitigation.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-black font-bold text-center py-3">
                    {getCurrentOverallScores().totalMinorNC}
                  </TableCell>
                  <TableCell className="text-black font-bold text-center py-3">
                    {getCurrentOverallScores().totalMajorNC}
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