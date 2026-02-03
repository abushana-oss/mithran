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

  // Handle capability score local updates (no API call)
  const updateCapabilityScoreLocal = (criteriaIndex: number, supplierIndex: number, newScore: number) => {
    if (!fullNomination?.vendorEvaluations || !capabilityData[criteriaIndex]) {
      return;
    }

    const criteria = capabilityData[criteriaIndex];
    const vendor = fullNomination.vendorEvaluations[supplierIndex];
    const criteriaId = criteria.criteria_id;

    if (!criteriaId || !vendor?.vendorId) {
      return;
    }

    const validScore = Math.min(Math.max(0, newScore), criteria.max_score || 100);

    // Update editing state
    setEditingCapabilityScores(prev => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        [vendor.vendorId]: validScore
      }
    }));
  };

  // Save all capability score changes in batch - ENTERPRISE BEST PRACTICE
  const saveCapabilityScores = async () => {
    if (!fullNomination?.vendorEvaluations) {
      toast.error('No vendor data available');
      return;
    }

    setIsSavingCapability(true);

    try {
      const updates: BatchCapabilityUpdate[] = [];

      // Prepare batch updates
      for (const [criteriaId, vendorScores] of Object.entries(editingCapabilityScores)) {
        for (const [vendorId, score] of Object.entries(vendorScores)) {
          updates.push({
            criteriaId,
            vendorId,
            score
          });
        }
      }

      // Single API call for all updates (with fallback) - ENTERPRISE BEST PRACTICE
      await batchUpdateCapabilityScores(nominationId, updates);

      // Update local state with saved values
      setCapabilityScores(prev => ({
        ...prev,
        criteria: prev.criteria.map((crit) => {
          const criteriaId = crit.id;
          const vendorScores = editingCapabilityScores[criteriaId];

          if (vendorScores) {
            return {
              ...crit,
              scores: crit.scores.map((score, supplierIndex) => {
                const vendor = fullNomination.vendorEvaluations![supplierIndex];
                const vendorId = vendor?.vendorId;
                return (vendorId && vendorScores[vendorId] !== undefined) ? vendorScores[vendorId] : score;
              })
            };
          }

          return crit;
        })
      }));

      // Update capability data state
      setCapabilityData(prev =>
        prev.map(item => {
          const criteriaId = item.criteria_id;
          const vendorScores = editingCapabilityScores[criteriaId];

          if (vendorScores) {
            return {
              ...item,
              vendor_scores: {
                ...item.vendor_scores,
                ...vendorScores
              }
            };
          }

          return item;
        })
      );

      // Clear editing state
      setEditingCapabilityScores({});
      setIsEditingCapability(false);

      toast.success(`Successfully saved ${updates.length} capability scores`);
    } catch (error) {
      console.error('Failed to save capability scores:', error);

      // Provide specific error message based on the error type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('token')) {
        toast.error('Session expired. Please refresh the page and try again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(`Failed to save scores: ${errorMessage}`);
      }
    } finally {
      setIsSavingCapability(false);
    }
  };

  // Cancel capability score editing
  const cancelCapabilityEditing = () => {
    setEditingCapabilityScores({});
    setIsEditingCapability(false);
  };

  // Get current score (edited or original)
  const getCurrentCapabilityScore = (criteriaIndex: number, supplierIndex: number): number => {
    if (!fullNomination?.vendorEvaluations || !capabilityData[criteriaIndex]) {
      return 0;
    }

    const criteria = capabilityData[criteriaIndex];
    const vendor = fullNomination.vendorEvaluations[supplierIndex];
    const criteriaId = criteria.criteria_id;

    if (!criteriaId || !vendor?.vendorId) {
      return 0;
    }

    // Return edited score or original score
    return editingCapabilityScores[criteriaId]?.[vendor.vendorId] ??
      capabilityScores.criteria[criteriaIndex]?.scores[supplierIndex] ?? 0;
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

    // Calculate totals and ranks using current scores (including edited ones)
    const totals = capabilityScores.suppliers.map((_, supplierIndex) =>
      capabilityScores.criteria.reduce((sum, _criteria, criteriaIndex) => {
        const currentScore = getCurrentCapabilityScore(criteriaIndex, supplierIndex);
        return sum + currentScore;
      }, 0)
    );
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-600">
                    <TableHead className="bg-gray-800 text-white font-semibold py-4 px-6 text-left">
                      CRITERIA
                    </TableHead>
                    <TableHead className="bg-gray-800 text-white font-semibold py-4 px-4 text-center">
                      Max Score
                    </TableHead>
                    <TableHead className="bg-gray-800 text-white font-semibold py-4 px-4 text-center">
                      Current Score
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-gray-900">
                  {capabilityScores.criteria.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-400">
                        No capability criteria available.
                        <br />
                        <span className="text-sm">Initialize capability scoring to get started.</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    capabilityScores.criteria.map((criteria, criteriaIndex) => (
                      <TableRow key={criteriaIndex} className="border-b border-gray-700 hover:bg-gray-800/50">
                        <TableCell className="text-white py-4 px-6 font-medium">
                          {criteria.name || capabilityData[criteriaIndex]?.criteria_name || 'Unnamed Criteria'}
                        </TableCell>
                        <TableCell className="text-white text-center py-4 px-4 font-medium">
                          {criteria.maxScore || capabilityData[criteriaIndex]?.max_score || 0}
                        </TableCell>
                        <TableCell className="text-center py-4 px-4">
                          {isEditingCapability ? (
                            <Input
                              type="number"
                              min="0"
                              max={criteria.maxScore || capabilityData[criteriaIndex]?.max_score || 100}
                              step="1"
                              value={getCurrentCapabilityScore(criteriaIndex, 0)}
                              onChange={(e) => updateCapabilityScoreLocal(criteriaIndex, 0, parseInt(e.target.value) || 0)}
                              className="w-20 h-10 text-center bg-gray-700 border-gray-600 text-white hover:bg-gray-600 focus:bg-gray-600 focus:border-blue-500"
                            />
                          ) : (
                            <span className="text-white font-medium text-lg">
                              {getCurrentCapabilityScore(criteriaIndex, 0)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}

                  {/* Total Score Row */}
                  {capabilityScores.criteria.length > 0 && (
                    <TableRow className="border-b-2 border-gray-600 bg-gray-800">
                      <TableCell className="text-white font-bold py-4 px-6">
                        Total Score
                      </TableCell>
                      <TableCell className="text-white text-center font-bold py-4 px-4">
                        {maxTotal}
                      </TableCell>
                      <TableCell className="text-white text-center font-bold py-4 px-4">
                        {totals[0]?.toFixed(1) || 0}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
                  // Calculate capability score percentage
                  const totalActualScore = capabilityScores.suppliers.reduce((sum, _, supplierIndex) =>
                    sum + capabilityScores.criteria.reduce((criteriaSum, _criteria, criteriaIndex) => {
                      const currentScore = getCurrentCapabilityScore(criteriaIndex, supplierIndex);
                      return criteriaSum + currentScore;
                    }, 0), 0
                  );
                  const totalMaxScore = capabilityScores.criteria.reduce((sum, criteria) =>
                    sum + (criteria.maxScore || 0), 0
                  ) * capabilityScores.suppliers.length;

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