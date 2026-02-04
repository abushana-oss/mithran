'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Save,
  TrendingUp,
  FileText,
  BarChart3,
  Zap,
  DollarSign,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useUpdateVendorEvaluation,
  useSupplierNomination
} from '@/lib/api/hooks/useSupplierNominations';
// import { useVendors } from '@/lib/api/hooks/useVendors';
import {
  getCapabilityScores,
  initializeCapabilityScores,
  batchUpdateCapabilityScores,
  transformCapabilityDataToTable,
  type CapabilityCriteria,
  type BatchCapabilityUpdate
} from '@/lib/api/capability-scoring';
import {
  Recommendation,
  getRiskLevelColor,
  getRecommendationColor,
  type VendorEvaluation,
  type NominationCriteria
} from '@/lib/api/supplier-nominations';
import { VendorRatingEngine } from './VendorRatingEngine';
import { CostCompetencyAnalysis } from './CostCompetencyAnalysis';
import { SupplierEvaluationDashboard } from './SupplierEvaluationDashboard';

interface DetailedEvaluationViewProps {
  evaluation: VendorEvaluation;
  criteria: NominationCriteria[];
  vendor?: any;
  nominationId: string;
  onBack: () => void;
}

interface CapabilityTabCriteria {
  id: string;
  name: string;
  maxScore: number;
  scores: number[];
}

interface CapabilityTabState {
  criteria: CapabilityTabCriteria[];
  suppliers: string[];
}

export function DetailedEvaluationView({
  evaluation,
  vendor,
  nominationId,
  onBack
}: DetailedEvaluationViewProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'capability' | 'technical' | 'rating' | 'cost'>('dashboard');
  const [evaluationData, setEvaluationData] = useState({
    vendorType: evaluation.vendorType,
    recommendation: evaluation.recommendation,
    riskLevel: evaluation.riskLevel,
    riskMitigationPercentage: evaluation.riskMitigationPercentage,
    minorNcCount: evaluation.minorNcCount,
    majorNcCount: evaluation.majorNcCount,
    capabilityPercentage: evaluation.capabilityPercentage,
    technicalFeasibilityScore: evaluation.technicalFeasibilityScore,
    evaluationNotes: evaluation.evaluationNotes || '',
    technicalDiscussion: evaluation.technicalDiscussion || ''
  });

  // Capability scores state - populated from API
  const [capabilityScores, setCapabilityScores] = useState<CapabilityTabState>({
    criteria: [],
    suppliers: []
  });

  const [capabilityData, setCapabilityData] = useState<CapabilityCriteria[]>([]);
  const [isLoadingCapability, setIsLoadingCapability] = useState(false);
  const [isEditingCapability, setIsEditingCapability] = useState(false);
  const [editingCapabilityScores, setEditingCapabilityScores] = useState<Record<string, Record<string, number>>>({});
  const [isSavingCapability, setIsSavingCapability] = useState(false);

  const updateEvaluationMutation = useUpdateVendorEvaluation(nominationId);

  // Fetch full nomination data to get all vendors
  const { data: fullNomination } = useSupplierNomination(nominationId);

  // Fetch all vendors to get names
  // const { data: allVendors } = useVendors();

  // Create scores map for easy access
  // const scoresMap = useMemo(() => {
  //   const map = new Map();
  //   evaluation.scores.forEach(score => {
  //     map.set(score.criteriaId, score);
  //   });
  //   return map;
  // }, [evaluation.scores]);

  // ENTERPRISE OPTIMIZATION: Load capability scores only once with efficient caching
  useEffect(() => {
    const loadCapabilityScores = async () => {
      if (!fullNomination?.vendorEvaluations || fullNomination.vendorEvaluations.length === 0 || !nominationId) {
        return;
      }

      // Prevent duplicate calls - only load if we don't have data
      if (capabilityData.length > 0) {
        return;
      }

      setIsLoadingCapability(true);
      try {
        // Single optimized call - get existing capability data
        let data = await getCapabilityScores(nominationId);

        // Only initialize if truly no data exists
        if (!data || data.length === 0) {
          await initializeCapabilityScores(nominationId);
          data = await getCapabilityScores(nominationId);
        }

        setCapabilityData(data);

        // Transform data for table display efficiently
        const vendors = fullNomination.vendorEvaluations.map((v, index) => ({
          id: v.vendorId,
          name: v.vendorName || `Supplier -${index + 1}`
        }));

        if (data && data.length > 0) {
          const tableData = transformCapabilityDataToTable(data, vendors);
          setCapabilityScores(tableData as CapabilityTabState);
        } else {
          setCapabilityScores({
            suppliers: vendors.map(v => v.name),
            criteria: []
          });
        }


      } catch (error) {
        console.error('Failed to load capability scores:', error);
        // Fallback to empty state if API fails
        setCapabilityScores({
          suppliers: fullNomination.vendorEvaluations.map((v, index) =>
            v.vendorName || `Supplier -${index + 1}`
          ),
          criteria: []
        });
      } finally {
        setIsLoadingCapability(false);
      }
    };

    loadCapabilityScores();
  }, [fullNomination, nominationId]);

  // Group criteria by category
  // const categorizedCriteria = useMemo(() => {
  //   const categories = new Map<string, NominationCriteria[]>();
  //   criteria.forEach(criterion => {
  //     const category = criterion.criteriaCategory;
  //     if (!categories.has(category)) {
  //       categories.set(category, []);
  //     }
  //     categories.get(category)?.push(criterion);
  //   });
  //   return categories;
  // }, [criteria]);

  // const handleScoreChange = (criteriaId: string, score: number) => {
  //   setEditingScores(prev => ({
  //     ...prev,
  //     [criteriaId]: score
  //   }));
  // };

  // const handleSaveScores = async () => {
  //   const scores: CreateEvaluationScoreData[] = Object.entries(editingScores).map(([criteriaId, score]) => ({
  //     criteriaId,
  //     score,
  //     evidenceText: '',
  //     assessorNotes: ''
  //   }));

  //   try {
  //     await updateScoresMutation.mutateAsync({
  //       evaluationId: evaluation.id,
  //       scores
  //     });
  //     setEditingScores({});
  //     toast.success('Scores updated successfully');
  //   } catch (error) {
  //     console.error('Save scores error:', error);
  //   }
  // };

  const handleSaveEvaluation = async () => {
    try {
      await updateEvaluationMutation.mutateAsync({
        evaluationId: evaluation.id,
        data: evaluationData
      });
      toast.success('Evaluation updated successfully');
    } catch (error) {
      console.error('Save evaluation error:', error);
    }
  };

  // const hasUnsavedScores = Object.keys(editingScores).length > 0;

  // Handle capability score local updates (no API call) - for current vendor only
  const updateCapabilityScoreLocal = (criteriaIndex: number, newScore: number) => {
    if (!fullNomination?.vendorEvaluations || !capabilityData[criteriaIndex]) {
      return;
    }

    const criteria = capabilityData[criteriaIndex];
    const criteriaId = criteria.criteriaId;
    const currentVendorId = evaluation.vendorId;

    if (!criteriaId || !currentVendorId) {
      return;
    }

    const validScore = Math.min(Math.max(0, newScore), criteria.maxScore || 100);

    // Update editing state for current vendor
    setEditingCapabilityScores(prev => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        [currentVendorId]: validScore
      }
    }));
  };

  // Get criteria name (read-only)
  const getCriteriaName = (criteriaIndex: number): string => {
    const criteria = capabilityData[criteriaIndex];
    return criteria?.criteriaName || 'Unnamed Criteria';
  };

  // Save all capability score changes in batch - ENTERPRISE BEST PRACTICE
  const saveCapabilityScores = async () => {
    if (!fullNomination?.vendorEvaluations) {
      toast.error('No vendor data available');
      return;
    }

    // Check if there are any changes to save
    if (Object.keys(editingCapabilityScores).length === 0) {
      toast.error('No changes to save');
      return;
    }

    setIsSavingCapability(true);

    try {
      // Save score changes
      const updates: BatchCapabilityUpdate[] = [];

      // Prepare batch updates - only for current vendor if this is single vendor view
      for (const [criteriaId, vendorScores] of Object.entries(editingCapabilityScores)) {
        for (const [vendorId, score] of Object.entries(vendorScores)) {
          updates.push({
            criteriaId,
            vendorId,
            score
          });
        }
      }

      if (updates.length > 0) {
        // Single API call for all score updates (with fallback) - ENTERPRISE BEST PRACTICE
        await batchUpdateCapabilityScores(nominationId, updates);
      }

      // Refresh capability data from server to ensure consistency
      const refreshedData = await getCapabilityScores(nominationId);
      setCapabilityData(refreshedData);

      // Transform refreshed data for table display
      if (fullNomination?.vendorEvaluations) {
        const vendors = fullNomination.vendorEvaluations.map((v, index) => ({
          id: v.vendorId,
          name: v.vendorName || `Supplier ${index + 1}`
        }));

        if (refreshedData && refreshedData.length > 0) {
          const refreshedTableData = transformCapabilityDataToTable(refreshedData, vendors);
          setCapabilityScores(refreshedTableData as CapabilityTabState);
        }
      }

      // Clear editing state
      setEditingCapabilityScores({});
      setIsEditingCapability(false);

      toast.success(`Successfully saved ${updates.length} score changes`);
    } catch (error) {
      console.error('Failed to save capability scores:', error);

      // Provide specific error message based on the error type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('token') || errorMessage.includes('401')) {
        toast.error('Session expired. Please refresh the page and try again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('Backend server is not running')) {
        toast.error('Backend server is unavailable. Please try again later.');
      } else {
        toast.error(`Failed to save scores: ${errorMessage}`);
      }

      // Keep editing mode active on error so user can retry
    } finally {
      setIsSavingCapability(false);
    }
  };

  // Cancel capability score editing
  const cancelCapabilityEditing = () => {
    setEditingCapabilityScores({});
    setIsEditingCapability(false);
  };

  // Get current vendor index in the evaluation list
  const getCurrentVendorIndex = (): number => {
    if (!fullNomination?.vendorEvaluations) return 0;
    
    const currentVendorIndex = fullNomination.vendorEvaluations.findIndex(
      v => v.vendorId === evaluation.vendorId
    );
    
    return currentVendorIndex >= 0 ? currentVendorIndex : 0;
  };

  // Get current score (edited or original) for the current vendor
  const getCurrentCapabilityScore = (criteriaIndex: number): number => {
    if (!fullNomination?.vendorEvaluations || !capabilityData[criteriaIndex]) {
      return 0;
    }

    const criteria = capabilityData[criteriaIndex];
    const criteriaId = criteria.criteriaId;
    const currentVendorId = evaluation.vendorId;

    if (!criteriaId || !currentVendorId) {
      return 0;
    }

    // Return edited score or original score for current vendor
    return editingCapabilityScores[criteriaId]?.[currentVendorId] ??
      criteria.vendorScores?.[currentVendorId] ?? 0;
  };

  const renderCapabilityTab = () => {
    // Show loading state
    if (isLoadingCapability) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Loading capability scores...</div>
        </div>
      );
    }

    // Calculate total for current vendor using current scores (including edited ones)
    const currentVendorTotal = capabilityScores.criteria.reduce((sum, _criteria, criteriaIndex) => {
      const currentScore = getCurrentCapabilityScore(criteriaIndex);
      return sum + currentScore;
    }, 0);
    const maxTotal = capabilityScores.criteria.reduce((sum, _criteria) => sum + (_criteria.maxScore || 0), 0);

    // Calculate ranks (1 = highest score)
    /* const ranks = totals.map((total, index) => {
      const higherScores = totals.filter(score => score > total).length;
      return higherScores + 1;
    }); */

    return (
      <div className="space-y-6">
        {/* Header with Evaluation Method and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-white font-medium">Select the Evaluation Method</label>
            <Select defaultValue="emuski-audit">
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="emuski-audit" className="text-white focus:bg-gray-700">EMuski Audit</SelectItem>
                <SelectItem value="standard-audit" className="text-white focus:bg-gray-700">Standard Audit</SelectItem>
                <SelectItem value="custom-audit" className="text-white focus:bg-gray-700">Custom Audit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isEditingCapability ? (
              <>
                {Object.keys(editingCapabilityScores).length > 0 && (
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    {Object.values(editingCapabilityScores).reduce((count, vendorScores) =>
                      count + Object.keys(vendorScores).length, 0
                    )} unsaved changes
                  </Badge>
                )}
                <Button
                  onClick={saveCapabilityScores}
                  disabled={isSavingCapability || Object.keys(editingCapabilityScores).length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  {isSavingCapability ? (
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
                  onClick={cancelCapabilityEditing}
                  disabled={isSavingCapability}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditingCapability(true)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Scores
              </Button>
            )}
          </div>
        </div>

        {/* Capability Scoring Table */}
        <Card className="bg-gray-800 border-gray-700 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto min-w-full">
              {/* Header Row */}
              <div className="grid grid-cols-3 bg-gray-800 border-b border-gray-600 sticky top-0">
                <div className="text-white font-semibold py-4 px-6 text-left">
                  CRITERIA
                </div>
                <div className="text-white font-semibold py-4 px-4 text-center">
                  Max Score
                </div>
                <div className="text-white font-semibold py-4 px-4 text-center">
                  Current Score
                </div>
              </div>

              {/* Table Body */}
              <div className="bg-gray-900">
                {capabilityData.length === 0 ? (
                  <div className="grid grid-cols-1 text-center py-8 text-gray-400 border-b border-gray-700">
                    <div>
                      No capability criteria available.
                      <br />
                      <span className="text-sm">Initialize capability scoring to get started.</span>
                      <Button 
                        onClick={async () => {
                          try {
                            await initializeCapabilityScores(nominationId);
                            window.location.reload();
                          } catch (error) {
                            toast.error('Failed to initialize capability scoring');
                          }
                        }}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Initialize Capability Scoring
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {capabilityData.map((criteria, criteriaIndex) => (
                      <div key={criteriaIndex} className="grid grid-cols-3 border-b border-gray-700 hover:bg-gray-800/50">
                        <div className="text-white py-4 px-6 font-medium break-words">
                          <span>{getCriteriaName(criteriaIndex)}</span>
                        </div>
                        <div className="text-white text-center py-4 px-4 font-medium">
                          {criteria.maxScore || 0}
                        </div>
                        <div className="text-center py-4 px-4 flex justify-center items-center">
                          {isEditingCapability ? (
                            <Input
                              type="number"
                              min="0"
                              max={criteria.maxScore || 100}
                              step="1"
                              value={getCurrentCapabilityScore(criteriaIndex)}
                              onChange={(e) => updateCapabilityScoreLocal(criteriaIndex, parseInt(e.target.value) || 0)}
                              className="w-20 h-10 text-center bg-gray-700 border-gray-600 text-white hover:bg-gray-600 focus:bg-gray-600 focus:border-blue-500"
                            />
                          ) : (
                            <span className="text-white font-medium text-lg">
                              {getCurrentCapabilityScore(criteriaIndex)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Total Score Row */}
                    <div className="grid grid-cols-3 border-b-2 border-gray-600 bg-gray-800">
                      <div className="text-white font-bold py-4 px-6">
                        Total Score
                      </div>
                      <div className="text-white text-center font-bold py-4 px-4">
                        {maxTotal}
                      </div>
                      <div className="text-white text-center font-bold py-4 px-4">
                        {currentVendorTotal?.toFixed(1) || 0}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };


  const renderTechnicalTab = () => (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Evaluation Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter evaluation notes and observations..."
            value={evaluationData.evaluationNotes}
            onChange={(e) => setEvaluationData(prev => ({
              ...prev,
              evaluationNotes: e.target.value
            }))}
            className="min-h-32 bg-gray-700 border-gray-600 text-white"
          />
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Technical Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter technical discussion and analysis..."
            value={evaluationData.technicalDiscussion}
            onChange={(e) => setEvaluationData(prev => ({
              ...prev,
              technicalDiscussion: e.target.value
            }))}
            className="min-h-32 bg-gray-700 border-gray-600 text-white"
          />
        </CardContent>
      </Card>

      <Button
        onClick={handleSaveEvaluation}
        disabled={updateEvaluationMutation.isPending}
        className="bg-green-600 hover:bg-green-700"
      >
        <Save className="h-4 w-4 mr-2" />
        Save Technical Documentation
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {vendor?.name || 'Vendor Evaluation'}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  variant="outline"
                  className={`border-${getRecommendationColor(evaluation.recommendation || Recommendation.PENDING)}-500 text-${getRecommendationColor(evaluation.recommendation || Recommendation.PENDING)}-400`}
                >
                  {evaluation.recommendation?.toUpperCase() || 'PENDING'}
                </Badge>
                <Badge variant="secondary">
                  {evaluation.vendorType.toUpperCase()}
                </Badge>
                <Badge
                  variant="outline"
                  className={`border-${getRiskLevelColor(evaluation.riskLevel)}-500 text-${getRiskLevelColor(evaluation.riskLevel)}-400`}
                >
                  {evaluation.riskLevel.toUpperCase()} RISK
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              {(() => {
                if (activeTab === 'capability' && capabilityScores.criteria.length > 0) {
                  // Calculate capability score percentage for current vendor
                  const totalActualScore = capabilityScores.criteria.reduce((sum, _criteria, criteriaIndex) => {
                    const currentScore = getCurrentCapabilityScore(criteriaIndex);
                    return sum + currentScore;
                  }, 0);
                  const totalMaxScore = capabilityScores.criteria.reduce((sum, criteria) =>
                    sum + (criteria.maxScore || 0), 0
                  );

                  const capabilityPercentage = totalMaxScore > 0 ? (totalActualScore / totalMaxScore) * 100 : 0;
                  return capabilityPercentage.toFixed(1);
                } else {
                  return evaluation.overallScore.toFixed(1);
                }
              })()}%
            </div>
            <div className="text-sm text-gray-400">
              {activeTab === 'capability' ? 'Capability Score' : 'Overall Score'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Overview', icon: BarChart3 },
              { id: 'cost', label: 'Cost Analysis', icon: DollarSign },
              { id: 'rating', label: 'Rating Engine', icon: Zap },
              { id: 'capability', label: 'Capability', icon: TrendingUp },
              { id: 'technical', label: 'Technical', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === 'dashboard' && (
            <SupplierEvaluationDashboard
              supplierId={evaluation.vendorId}
              nominationId={nominationId}
            />
          )}
          {activeTab === 'capability' && renderCapabilityTab()}
          {activeTab === 'technical' && renderTechnicalTab()}
          {activeTab === 'rating' && (
            <VendorRatingEngine
              vendorId={evaluation.vendorId}
              nominationId={nominationId}
              onScoreUpdate={(scores) => {
                console.log('Updated scores:', scores);
                // Handle score updates here if needed
              }}
            />
          )}
          {activeTab === 'cost' && (
            <CostCompetencyAnalysis
              nominationId={nominationId}
              vendors={fullNomination?.vendorEvaluations ?
                fullNomination.vendorEvaluations.map(v => ({
                  id: v.vendorId,
                  name: v.vendorName || `Vendor ${v.vendorId.slice(-4)}`
                })) : []
              }
              onDataUpdate={(data) => {
                console.log('Updated cost data:', data);
                // Handle cost data updates here if needed
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}