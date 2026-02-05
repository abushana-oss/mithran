'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getFactorWeights,
  updateFactorWeights,
  calculateSupplierRankings
} from '@/lib/api/supplier-nominations';
import {
  getCostAnalysis,
  initializeCostAnalysis,
  batchUpdateCostAnalysis,
  transformCostAnalysisToComponentData,
  transformComponentDataToCostAnalysis,
  type CostCompetencyAnalysis
} from '@/lib/api/cost-competency';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Award,
  Calculator,
  BarChart3,
  Edit,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

export interface CostCompetencyData {
  id: number;
  costComponent: string;
  baseValue?: number;
  supplierValues: number[]; // Dynamic array for supplier values
  isRanking?: boolean;
  unit?: string;
  paymentTerms?: string[]; // Dynamic array for payment terms
  basePaymentTerm?: string; // Base payment term for reference
}


interface CostCompetencyAnalysisProps {
  nominationId: string;
  onDataUpdate?: (data: CostCompetencyData[]) => void;
  vendors?: Array<{ id: string; name: string; }>;
}

export function CostCompetencyAnalysis({ nominationId, vendors = [], onDataUpdate }: CostCompetencyAnalysisProps) {
  // Create empty cost data structure for real data input
  const createEmptyCostData = () => {
    const numVendors = vendors.length || 0;

    return [
      {
        id: 1,
        costComponent: "Raw Material Cost",
        baseValue: 0,
        supplierValues: new Array(numVendors).fill(0),
        unit: "₹"
      },
      {
        id: 2,
        costComponent: "Process Cost",
        baseValue: 0,
        supplierValues: new Array(numVendors).fill(0),
        unit: "₹"
      },
      {
        id: 3,
        costComponent: "Overheads & Profit",
        baseValue: 0,
        supplierValues: new Array(numVendors).fill(0),
        unit: "₹"
      },
      {
        id: 4,
        costComponent: "Packing & Forwarding Cost",
        baseValue: 0,
        supplierValues: new Array(numVendors).fill(0),
        unit: "₹"
      },
      {
        id: 5,
        costComponent: "Payment Terms",
        paymentTerms: new Array(numVendors).fill(""),
        supplierValues: [],
        basePaymentTerm: ""
      },
      {
        id: 6,
        costComponent: "Net Price/unit",
        baseValue: 0,
        supplierValues: new Array(numVendors).fill(0),
        unit: "₹"
      },
      {
        id: 7,
        costComponent: "Development cost",
        baseValue: 0,
        supplierValues: new Array(numVendors).fill(0),
        unit: "Lakhs"
      },
      {
        id: 8,
        costComponent: "Financial Risk",
        baseValue: 0,
        supplierValues: new Array(numVendors).fill(0),
        unit: "%"
      },
      {
        id: 9,
        costComponent: "Cost Competency Score",
        baseValue: 0,
        supplierValues: new Array(numVendors).fill(0),
        unit: "Score"
      },
      {
        id: 10,
        costComponent: "Lead Time Days",
        baseValue: 0,
        supplierValues: new Array(numVendors).fill(0),
        unit: "Days"
      },
      // Ranking rows
      {
        id: 11,
        costComponent: "Rank-Cost",
        supplierValues: new Array(numVendors).fill(0), // Will be calculated
        isRanking: true
      },
      {
        id: 12,
        costComponent: "Rank-Development cost",
        supplierValues: new Array(numVendors).fill(0), // Will be calculated
        isRanking: true
      },
      {
        id: 13,
        costComponent: "Lead Time Ranking",
        supplierValues: new Array(numVendors).fill(0), // Will be calculated dynamically
        isRanking: true
      },
      {
        id: 14,
        costComponent: "Total Score",
        supplierValues: new Array(numVendors).fill(0), // Will be calculated dynamically
        unit: "Score",
        isRanking: true
      },
      {
        id: 15,
        costComponent: "Overall Rank",
        supplierValues: new Array(numVendors).fill(0), // Will be calculated dynamically
        isRanking: true
      }
    ];
  };

  const [costData, setCostData] = useState<CostCompetencyData[]>([]);
  const [isLoadingCostData, setIsLoadingCostData] = useState(false);
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [editingCostValues, setEditingCostValues] = useState<Record<string, any>>({});
  const [isSavingCost, setIsSavingCost] = useState(false);

  // Function to clean duplicate and malformed entries
  const removeDuplicateEntries = (data: CostCompetencyData[]) => {
    const seen = new Set();
    return data.filter(item => {
      // Filter out malformed entries
      if (!item.costComponent ||
        item.costComponent.includes('Development costss') ||
        item.costComponent.includes('Vendor 1e8e') ||
        item.costComponent === '' ||
        item.costComponent.length > 100) {
        console.log(`Removing malformed entry: ${item.costComponent}`);
        return false;
      }

      // Filter out duplicates
      if (seen.has(item.costComponent)) {
        console.log(`Removing duplicate entry: ${item.costComponent}`);
        return false;
      }

      seen.add(item.costComponent);
      return true;
    });
  };

  // Factor weights for ranking calculations
  const [factorWeights, setFactorWeights] = useState({
    cost: 33.3,
    developmentCost: 33.3,
    leadTime: 33.34
  });
  const [isLoadingWeights, setIsLoadingWeights] = useState(false);
  // const [rankings, setRankings] = useState<SupplierRanking[]>([]); // Removed unused state

  // ENTERPRISE OPTIMIZATION: Load cost analysis data and factor weights with single optimized call
  React.useEffect(() => {
    const loadCostAnalysisData = async () => {
      if (!nominationId || vendors.length === 0) return;

      // Prevent duplicate calls
      if (isLoadingCostData || isLoadingWeights) return;

      try {
        setIsLoadingCostData(true);
        setIsLoadingWeights(true);

        // BATCH LOAD: Get both cost analysis and factor weights in parallel - ENTERPRISE BEST PRACTICE
        const [costAnalysis, weights] = await Promise.all([
          getCostAnalysis(nominationId),
          getFactorWeights(nominationId)
        ]);

        // Process cost analysis data efficiently
        if (costAnalysis.length === 0) {
          // Initialize if no data exists (one-time setup)
          console.log('Initializing cost analysis for nomination:', nominationId);
          await initializeCostAnalysis(nominationId);
          // Single re-fetch after initialization
          const newCostAnalysis = await getCostAnalysis(nominationId);
          const transformedData = transformCostAnalysisToComponentData(newCostAnalysis, vendors);
          setCostData(transformedData);
        } else {
          const transformedData = transformCostAnalysisToComponentData(costAnalysis, vendors);
          setCostData(transformedData);
        }

        // Set factor weights from parallel call
        setFactorWeights({
          cost: weights.costFactor,
          developmentCost: weights.developmentCostFactor,
          leadTime: weights.leadTimeFactor
        });

      } catch (error) {
        console.error('Failed to load cost analysis data:', error);
        // Fallback to empty data structure only if no data exists
        if (costData.length === 0) {
          const fallbackData = createEmptyCostData();
          setCostData(fallbackData);
        }
      } finally {
        setIsLoadingCostData(false);
        setIsLoadingWeights(false);
      }
    };

    // Only load once when component mounts or nominationId changes
    if (nominationId && vendors.length > 0 && costData.length === 0) {
      loadCostAnalysisData();
    }
  }, [nominationId, vendors.length]); // Stable dependencies

  // Clean up duplicates on initial mount
  React.useEffect(() => {
    setCostData(prevData => removeDuplicateEntries(prevData));
  }, []);

  // Update cost data when vendors change - memoized to prevent loops
  React.useEffect(() => {
    if (vendors.length > 0 && costData.length === 0) {
      const newData = createEmptyCostData();
      const cleanData = removeDuplicateEntries(newData);
      setCostData(cleanData);
    }
  }, [vendors.length]); // Only depend on vendor count, not vendor objects

  // Calculate rankings based on cost data - REAL-TIME WITH EDITING VALUES
  React.useEffect(() => {
    setCostData(prev => {
      const newData = [...prev];

      // Find relevant rows
      const netPriceRow = newData.find(item => item.costComponent === "Net Price/unit");
      const devCostRow = newData.find(item => item.costComponent === "Development cost");
      const leadTimeDaysRow = newData.find(item => item.costComponent === "Lead Time Days");

      const rankCostRow = newData.find(item => item.costComponent === "Rank-Cost");
      const rankDevRow = newData.find(item => item.costComponent === "Rank-Development cost");
      const rankLeadRow = newData.find(item => item.costComponent === "Lead Time Ranking");
      const totalScoreRow = newData.find(item => item.costComponent === "Total Score");
      const overallRankRow = newData.find(item => item.costComponent === "Overall Rank");

      // Get current values (including edited ones)
      const getCurrentNetPriceValues = () =>
        netPriceRow ? netPriceRow.supplierValues.map((_, index) =>
          getCurrentSupplierValue(netPriceRow.id, index)
        ) : [];

      const getCurrentDevCostValues = () =>
        devCostRow ? devCostRow.supplierValues.map((_, index) =>
          getCurrentSupplierValue(devCostRow.id, index)
        ) : [];

      const getCurrentLeadTimeValues = () =>
        leadTimeDaysRow ? leadTimeDaysRow.supplierValues.map((_, index) =>
          getCurrentSupplierValue(leadTimeDaysRow.id, index)
        ) : [];

      if (netPriceRow && rankCostRow) {
        // Calculate Cost Rankings using current values (including edited ones)
        const currentNetPrices = getCurrentNetPriceValues();
        const hasNetPriceData = currentNetPrices.some(val => val > 0);

        if (hasNetPriceData) {
          const sortedIndices = [...Array(currentNetPrices.length).keys()]
            .sort((a, b) => (currentNetPrices[a] ?? 0) - (currentNetPrices[b] ?? 0));
          rankCostRow.supplierValues = rankCostRow.supplierValues.map((_, index) =>
            sortedIndices.indexOf(index) + 1
          );
        } else {
          rankCostRow.supplierValues = new Array(rankCostRow.supplierValues.length).fill(0);
        }
      }

      if (devCostRow && rankDevRow) {
        // Calculate Development Cost Rankings using current values (including edited ones)
        const currentDevCosts = getCurrentDevCostValues();
        const hasDevCostData = currentDevCosts.some(val => val > 0);

        if (hasDevCostData) {
          const sortedIndices = [...Array(currentDevCosts.length).keys()]
            .sort((a, b) => (currentDevCosts[a] ?? 0) - (currentDevCosts[b] ?? 0));
          rankDevRow.supplierValues = rankDevRow.supplierValues.map((_, index) =>
            sortedIndices.indexOf(index) + 1
          );
        } else {
          rankDevRow.supplierValues = new Array(rankDevRow.supplierValues.length).fill(0);
        }
      }

      if (leadTimeDaysRow && rankLeadRow) {
        // Calculate Lead Time Rankings using current values (including edited ones)
        const currentLeadTimes = getCurrentLeadTimeValues();
        const hasLeadTimeData = currentLeadTimes.some(val => val > 0);

        if (hasLeadTimeData) {
          const sortedIndices = [...Array(currentLeadTimes.length).keys()]
            .sort((a, b) => (currentLeadTimes[a] ?? 0) - (currentLeadTimes[b] ?? 0));
          rankLeadRow.supplierValues = rankLeadRow.supplierValues.map((_, index) =>
            sortedIndices.indexOf(index) + 1
          );
        } else {
          rankLeadRow.supplierValues = new Array(rankLeadRow.supplierValues.length).fill(0);
        }
      }

      if (rankCostRow && rankDevRow && rankLeadRow && totalScoreRow && netPriceRow && devCostRow && leadTimeDaysRow) {
        // Calculate Total Score using current values (including edited ones)
        const currentNetPrices = getCurrentNetPriceValues();
        const currentDevCosts = getCurrentDevCostValues();
        const currentLeadTimes = getCurrentLeadTimeValues();

        const hasRealData = currentNetPrices.some(val => val > 0) ||
          currentDevCosts.some(val => val > 0) ||
          currentLeadTimes.some(val => val > 0);

        if (hasRealData) {
          totalScoreRow.supplierValues = totalScoreRow.supplierValues.map((_, index) =>
            Math.round((((rankCostRow.supplierValues[index] ?? 0) * factorWeights.cost / 100) +
              ((rankDevRow.supplierValues[index] ?? 0) * factorWeights.developmentCost / 100) +
              ((rankLeadRow.supplierValues[index] ?? 0) * factorWeights.leadTime / 100)) * 100) / 100
          );
        } else {
          // Reset to 0 if no real data
          totalScoreRow.supplierValues = new Array(totalScoreRow.supplierValues.length).fill(0);
        }
      }

      if (totalScoreRow && overallRankRow) {
        // Only calculate Overall Rankings if there are actual total scores
        const hasTotalScores = totalScoreRow.supplierValues.some(val => val > 0);

        if (hasTotalScores) {
          const sortedIndices = [...Array(totalScoreRow.supplierValues.length).keys()]
            .sort((a, b) => (totalScoreRow.supplierValues[a] ?? 0) - (totalScoreRow.supplierValues[b] ?? 0));
          overallRankRow.supplierValues = overallRankRow.supplierValues.map((_, index) =>
            sortedIndices.indexOf(index) + 1
          );
        } else {
          // Reset to 0 if no total scores
          overallRankRow.supplierValues = new Array(overallRankRow.supplierValues.length).fill(0);
        }
      }

      return newData;
    });
  }, [factorWeights, editingCostValues]);

  // Call onDataUpdate when costData changes - memoized to prevent loops
  const memoizedOnDataUpdate = React.useCallback((data: CostCompetencyData[]) => {
    if (onDataUpdate) {
      onDataUpdate(data);
    }
  }, [onDataUpdate]);

  React.useEffect(() => {
    if (costData.length > 0) {
      // Debounce the callback to prevent excessive calls
      const timeoutId = setTimeout(() => {
        memoizedOnDataUpdate(costData);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [costData, memoizedOnDataUpdate]);

  // ENTERPRISE BEST PRACTICE: Local updates without API calls
  const updateSupplierValueLocal = (rowId: number, supplierIndex: number, value: number) => {
    // Only update local editing state
    const key = `${rowId}_${supplierIndex}`;
    setEditingCostValues(prev => ({
      ...prev,
      [key]: { type: 'supplier', value }
    }));
  };

  const updateBaseValueLocal = (rowId: number, value: number) => {
    const key = `base_${rowId}`;
    setEditingCostValues(prev => ({
      ...prev,
      [key]: { type: 'base', value }
    }));
  };

  const updatePaymentTermLocal = (rowId: number, index: number, value: string) => {
    const key = `payment_${rowId}_${index}`;
    setEditingCostValues(prev => ({
      ...prev,
      [key]: { type: 'payment', value }
    }));
  };

  const updateBasePaymentTermLocal = (value: string) => {
    const key = 'base_payment_terms';
    setEditingCostValues(prev => ({
      ...prev,
      [key]: { type: 'base_payment', value }
    }));
  };

  // Get current value (edited or original)
  const getCurrentSupplierValue = (rowId: number, supplierIndex: number): number => {
    const key = `${rowId}_${supplierIndex}`;
    const editedValue = editingCostValues[key];
    if (editedValue?.type === 'supplier') {
      return editedValue.value;
    }
    const row = costData.find(item => item.id === rowId);
    return row?.supplierValues[supplierIndex] || 0;
  };

  const getCurrentBaseValue = (rowId: number): number => {
    const key = `base_${rowId}`;
    const editedValue = editingCostValues[key];
    if (editedValue?.type === 'base') {
      return editedValue.value;
    }
    const row = costData.find(item => item.id === rowId);
    return row?.baseValue || 0;
  };

  const getCurrentPaymentTerm = (rowId: number, index: number): string => {
    const key = `payment_${rowId}_${index}`;
    const editedValue = editingCostValues[key];
    if (editedValue?.type === 'payment') {
      return editedValue.value;
    }
    const row = costData.find(item => item.id === rowId);
    return row?.paymentTerms?.[index] || '';
  };

  const getCurrentBasePaymentTerm = (): string => {
    const key = 'base_payment_terms';
    const editedValue = editingCostValues[key];
    if (editedValue?.type === 'base_payment') {
      return editedValue.value;
    }
    const row = costData.find(item => item.costComponent === 'Payment Terms');
    return row?.basePaymentTerm || '';
  };

  // ENTERPRISE BEST PRACTICE: Batch save all changes
  const saveCostData = async () => {
    if (!nominationId || Object.keys(editingCostValues).length === 0) {
      return;
    }

    setIsSavingCost(true);

    try {
      // Apply all changes to local state first
      const updatedCostData = [...costData];

      Object.entries(editingCostValues).forEach(([key, change]) => {
        if (change.type === 'supplier') {
          const parts = key.split('_');
          const rowId = Number(parts[0]);
          const supplierIndex = Number(parts[1]);
          if (!isNaN(rowId) && !isNaN(supplierIndex)) {
            const row = updatedCostData.find(item => item.id === rowId);
            if (row) {
              row.supplierValues[supplierIndex] = change.value;
            }
          }
        } else if (change.type === 'base') {
          const rowId = Number(key.replace('base_', ''));
          const row = updatedCostData.find(item => item.id === rowId);
          if (row) {
            row.baseValue = change.value;
          }
        } else if (change.type === 'payment') {
          const parts = key.split('_');
          const rowId = Number(parts[1]);
          const index = Number(parts[2]);
          if (!isNaN(rowId) && !isNaN(index)) {
            const row = updatedCostData.find(item => item.id === rowId);
            if (row && row.paymentTerms) {
              row.paymentTerms[index] = change.value;
            }
          }
        } else if (change.type === 'base_payment') {
          const row = updatedCostData.find(item => item.costComponent === 'Payment Terms');
          if (row) {
            row.basePaymentTerm = change.value;
          }
        }
      });

      // Transform to API format and send batch update - ENTERPRISE BEST PRACTICE
      const bulkUpdateData = transformComponentDataToCostAnalysis(updatedCostData, vendors);
      await batchUpdateCostAnalysis(nominationId, bulkUpdateData);

      // Update local state and clear editing state
      setCostData(updatedCostData);
      setEditingCostValues({});
      setIsEditingCost(false);

      // Show success message with count
      const changeCount = Object.keys(editingCostValues).length;
      toast.success(`Successfully saved ${changeCount} cost data changes`);

    } catch (error) {
      console.error('Failed to save cost data:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Provide specific error message based on the error type
      if (errorMessage.includes('token')) {
        toast.error('Session expired. Please refresh the page and try again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(`Failed to save cost data: ${errorMessage}`);
      }
    } finally {
      setIsSavingCost(false);
    }
  };

  // Cancel cost editing
  const cancelCostEditing = () => {
    setEditingCostValues({});
    setIsEditingCost(false);
  };

  // Handle weight changes with API integration
  const handleWeightChange = async (type: 'cost' | 'developmentCost' | 'leadTime', value: number) => {
    const newWeights = { ...factorWeights, [type]: value };

    // Validate weights sum to 100 (with tolerance for floating point precision)
    const sum = newWeights.cost + newWeights.developmentCost + newWeights.leadTime;
    if (Math.abs(sum - 100) > 0.1) {
      console.warn(`Weights must sum to 100%. Current sum: ${sum.toFixed(2)}%`);
      // Still allow the change for UI responsiveness, but warn user
    }

    setFactorWeights(newWeights);

    // Update via API with rounded values to avoid floating-point precision issues
    if (nominationId) {
      try {
        // Round to 2 decimal places to avoid floating-point precision issues
        const roundedWeights = {
          costFactor: Math.round(newWeights.cost * 100) / 100,
          developmentCostFactor: Math.round(newWeights.developmentCost * 100) / 100,
          leadTimeFactor: Math.round(newWeights.leadTime * 100) / 100
        };

        await updateFactorWeights(nominationId, roundedWeights);

        // Recalculate rankings with new weights
        await handleCalculateRankings();
      } catch (error) {
        console.error('Failed to update factor weights:', error);
        // Show user-friendly error message
        if (error instanceof Error && error.message.includes('must sum to 100%')) {
          console.warn('Weight validation failed due to precision. Auto-adjusting...');
          // Auto-adjust the last weight to make sum exactly 100
          const adjustedLeadTime = 100 - newWeights.cost - newWeights.developmentCost;
          setFactorWeights(prev => ({ ...prev, leadTime: adjustedLeadTime }));
        }
      }
    }
  };

  // Calculate and update rankings
  const handleCalculateRankings = async () => {
    if (!nominationId) return;

    try {
      const newRankings = await calculateSupplierRankings(nominationId);
      // setRankings(newRankings); // Removed unused state update

      // Update the cost data with new rankings
      setCostData(prev => {
        const newData = [...prev];

        // Update ranking data from API response
        newRankings.forEach((ranking, index) => {
          const rankCostRow = newData.find(item => item.costComponent === "Rank-Cost");
          const rankDevRow = newData.find(item => item.costComponent === "Rank-Development cost");
          const rankLeadRow = newData.find(item => item.costComponent === "Lead Time Ranking");
          const totalScoreRow = newData.find(item => item.costComponent === "Total Score");
          const overallRankRow = newData.find(item => item.costComponent === "Overall Rank");

          if (rankCostRow) rankCostRow.supplierValues[index] = ranking.costRank;
          if (rankDevRow) rankDevRow.supplierValues[index] = ranking.developmentCostRank;
          if (rankLeadRow) rankLeadRow.supplierValues[index] = ranking.leadTimeRank;
          if (totalScoreRow) totalScoreRow.supplierValues[index] = ranking.totalScore;
          if (overallRankRow) overallRankRow.supplierValues[index] = ranking.overallRank;
        });

        return newData;
      });
    } catch (error) {
      console.error('Failed to calculate rankings:', error);
    }
  };

  // Simplified inline editing - no mode management needed

  // Common payment terms options
  const paymentTermOptions = [
    "100% Advance",
    "30 Days credit",
    "Against delivery",
    "50% ADP +50% AD",
    "15 Days credit",
    "45 Days credit",
    "60 Days credit",
    "90 Days credit",
    "Cash on Delivery",
    "Letter of Credit"
  ];

  const supplierSummary = useMemo(() => {
    const overallRanking = costData.find(item => item.costComponent === "Overall Rank");
    const competencyScore = costData.find(item => item.costComponent === "Cost Competency Score");
    const netPrice = costData.find(item => item.costComponent === "Net Price/unit");
    const devCost = costData.find(item => item.costComponent === "Development cost");

    const numVendors = vendors.length || 4;
    return Array(numVendors).fill(0).map((_, index) => ({
      rank: overallRanking?.supplierValues[index] || 0,
      score: competencyScore?.supplierValues[index] || 0,
      netPrice: netPrice?.supplierValues[index] || 0,
      devCost: devCost?.supplierValues[index] || 0
    }));
  }, [costData, vendors]);

  const getRankingColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-green-500/20 text-green-400 border-green-500';
      case 2: return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 3: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 4: return 'bg-red-500/20 text-red-400 border-red-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getRankingIcon = (rank: number) => {
    if (rank === 1) return <Award className="h-3 w-3" />;
    if (rank <= 2) return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  const getBestSupplier = () => {
    if (supplierSummary.length === 0) return 'No suppliers';

    const bestRank = Math.min(...supplierSummary.map(s => s.rank));
    const bestIndex = supplierSummary.findIndex(s => s.rank === bestRank);

    if (vendors[bestIndex]) {
      return vendors[bestIndex].name;
    }
    return `Supplier-${bestIndex + 1}`;
  };

  // Remove loading state to show data immediately and prevent duplicate requests

  // Show empty state if no vendors
  if (!vendors || vendors.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No Vendors Selected</h3>
            <p className="text-gray-400 mb-4">Add vendors to the nomination to start cost competency analysis</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Top Supplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{getBestSupplier() || 'Not calculated'}</div>
            <p className="text-xs text-gray-400 mt-1">Highest ranked</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Lowest Net Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹{supplierSummary.length > 0 ? Math.min(...supplierSummary.map(s => s.netPrice)).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-gray-400 mt-1">Per Unit</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Highest Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {supplierSummary.length > 0 ? Math.max(...supplierSummary.map(s => s.score)).toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-gray-400 mt-1">Competency Score</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Development Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹{supplierSummary.length > 0 ? Math.min(...supplierSummary.map(s => s.devCost)).toFixed(1) : '0.0'}L
            </div>
            <p className="text-xs text-gray-400 mt-1">Lowest Cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Competency Analysis Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Competency Score & Financial Stability Analysis
            </CardTitle>

            {/* Action Buttons - ENTERPRISE BEST PRACTICE */}
            <div className="flex items-center gap-2">
              {isEditingCost ? (
                <>
                  {Object.keys(editingCostValues).length > 0 && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {Object.keys(editingCostValues).length} unsaved changes
                    </Badge>
                  )}
                  <Button
                    onClick={saveCostData}
                    disabled={isSavingCost || Object.keys(editingCostValues).length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    {isSavingCost ? (
                      <>
                        <Save className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={cancelCostEditing}
                    disabled={isSavingCost}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditingCost(true)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Cost Data
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300 font-medium w-[200px]">Cost Component</TableHead>
                <TableHead className="text-center text-gray-300 font-medium w-[120px]">Base/Reference</TableHead>
                {vendors.length > 0 ? vendors.map((vendor, index) => {
                  const colors = ['text-blue-400', 'text-green-400', 'text-yellow-400', 'text-purple-400'];
                  return (
                    <TableHead key={vendor.id} className={`text-center ${colors[index % colors.length]} font-medium w-[100px]`}>
                      {vendor.name}
                    </TableHead>
                  );
                }) : (
                  <>
                    <TableHead className="text-center text-blue-400 font-medium w-[100px]">Supplier-1</TableHead>
                    <TableHead className="text-center text-green-400 font-medium w-[100px]">Supplier-2</TableHead>
                    <TableHead className="text-center text-yellow-400 font-medium w-[100px]">Supplier-3</TableHead>
                    <TableHead className="text-center text-purple-400 font-medium w-[100px]">Supplier-4</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {costData.map((row) => (
                <TableRow key={row.id} className="border-gray-700">
                  <TableCell className="text-white font-medium text-left pl-4">{row.costComponent}</TableCell>

                  {/* Base/Reference Value - Edit Mode Pattern */}
                  <TableCell className="text-center text-gray-300">
                    {row.costComponent === "Payment Terms" ? (
                      isEditingCost ? (
                        <Select
                          value={getCurrentBasePaymentTerm()}
                          onValueChange={updateBasePaymentTermLocal}
                        >
                          <SelectTrigger className="w-32 h-8 bg-gray-700 border-gray-600 text-white text-xs">
                            <SelectValue placeholder="Base terms" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {paymentTermOptions.map((option) => (
                              <SelectItem
                                key={option}
                                value={option}
                                className="text-white hover:bg-gray-600 focus:bg-gray-600"
                              >
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-white font-medium text-sm px-2 py-1">
                          {getCurrentBasePaymentTerm() || "-"}
                        </span>
                      )
                    ) : row.isRanking ? (
                      <div className="text-xs text-gray-400 px-2 py-1">
                        Auto-calc
                      </div>
                    ) : isEditingCost ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={getCurrentBaseValue(row.id)}
                        onChange={(e) => updateBaseValueLocal(row.id, parseFloat(e.target.value) || 0)}
                        className="w-24 h-8 bg-gray-700 border-gray-600 text-white text-sm text-center"
                        placeholder="0.00"
                      />
                    ) : (
                      <span className="text-white font-medium text-sm">
                        {getCurrentBaseValue(row.id).toFixed(2)}
                      </span>
                    )}
                  </TableCell>

                  {/* Dynamic Supplier Columns - Edit Mode Pattern */}
                  {row.paymentTerms ? (
                    // Payment Terms Row - Edit Mode Pattern
                    row.paymentTerms.map((_, index) => {
                      return (
                        <TableCell key={index} className="text-center">
                          {isEditingCost ? (
                            <Select
                              value={getCurrentPaymentTerm(row.id, index)}
                              onValueChange={(value) => updatePaymentTermLocal(row.id, index, value)}
                            >
                              <SelectTrigger className="w-32 h-8 bg-gray-700 border-gray-600 text-white text-xs">
                                <SelectValue placeholder="Select terms" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600">
                                {paymentTermOptions.map((option) => (
                                  <SelectItem
                                    key={option}
                                    value={option}
                                    className="text-white hover:bg-gray-600 focus:bg-gray-600"
                                  >
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-white font-medium text-sm px-2 py-1">
                              {getCurrentPaymentTerm(row.id, index) || "-"}
                            </span>
                          )}
                        </TableCell>
                      );
                    })
                  ) : (
                    // Regular Numeric Values - Edit Mode Pattern  
                    row.supplierValues.map((_, index) => {
                      const colors = ['text-blue-400', 'text-green-400', 'text-yellow-400', 'text-purple-400'];
                      const colorClass = colors[index % colors.length];
                      const currentValue = getCurrentSupplierValue(row.id, index);

                      return (
                        <TableCell key={index} className="text-center">
                          {row.isRanking ? (
                            <Badge className={`${getRankingColor(currentValue)} flex items-center gap-1 justify-center w-12`}>
                              {getRankingIcon(currentValue)}
                              {currentValue || '-'}
                            </Badge>
                          ) : isEditingCost ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={currentValue}
                              onChange={(e) => updateSupplierValueLocal(row.id, index, parseFloat(e.target.value) || 0)}
                              className={`w-20 h-8 bg-gray-700 border-gray-600 text-white text-sm text-center ${colorClass} font-medium`}
                              placeholder="0.00"
                            />
                          ) : (
                            <span className={`${colorClass} font-medium text-sm`}>
                              {currentValue.toFixed(2)}
                            </span>
                          )}
                        </TableCell>
                      );
                    })
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Factor Weights Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Ranking Factor Weights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cost Factor
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={factorWeights.cost}
                  onChange={(e) => handleWeightChange('cost', parseFloat(e.target.value) || 0)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <span className="text-gray-300 text-sm">%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Development Cost Factor
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={factorWeights.developmentCost}
                  onChange={(e) => handleWeightChange('developmentCost', parseFloat(e.target.value) || 0)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <span className="text-gray-300 text-sm">%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lead Time Factor
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={factorWeights.leadTime}
                  onChange={(e) => handleWeightChange('leadTime', parseFloat(e.target.value) || 0)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <span className="text-gray-300 text-sm">%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <span className="text-sm text-gray-400">
              Total: {(factorWeights.cost + factorWeights.developmentCost + factorWeights.leadTime).toFixed(1)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                // Use exact values that sum to 100.00
                const defaultWeights = { cost: 33.33, developmentCost: 33.33, leadTime: 33.34 };
                setFactorWeights(defaultWeights);

                if (nominationId) {
                  try {
                    await updateFactorWeights(nominationId, {
                      costFactor: 33.33,
                      developmentCostFactor: 33.33,
                      leadTimeFactor: 33.34  // This ensures sum = 100.00
                    });
                    await handleCalculateRankings();
                  } catch (error) {
                    console.error('Failed to reset factor weights:', error);
                  }
                }
              }}
              className="h-8 text-xs"
              disabled={isLoadingWeights}
            >
              Reset to Equal (33.3% each)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}