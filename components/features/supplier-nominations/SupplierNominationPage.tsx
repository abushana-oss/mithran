'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Save,
  Plus,
  Users,
  Undo2,
  Redo2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useSupplierNomination,
  useSupplierNominations,
  useUpdateVendorEvaluation,
  useUpdateEvaluationScores,
  useCompleteSupplierNomination,
  useAddVendorsToNomination
} from '@/lib/api/hooks/useSupplierNominations';
import { useVendors } from '@/lib/api/hooks/useVendors';
import {
  Recommendation,
  getStatusColor,
  getStatusText,
  getRiskLevelColor,
  getRecommendationColor,
  getNominationTypeLabel,
  type VendorEvaluation,
  type NominationCriteria
} from '@/lib/api/supplier-nominations';
import {
  getCostAnalysis,
  transformCostAnalysisToComponentData,
  type CostCompetencyAnalysis
} from '@/lib/api/cost-competency';
import {
  getVendorRatingOverallScores,
  type VendorRatingOverallScores
} from '@/lib/api/vendor-rating-matrix';
import {
  getCapabilityScores,
  transformCapabilityDataToTable,
  type CapabilityCriteria
} from '@/lib/api/capability-scoring';

// Real-time score calculation functions using API data
const getCostScore = (
  evaluation: VendorEvaluation, 
  costData: any[], 
  vendorIndex: number
): number => {
  if (costData && costData.length > 0) {
    // Find Net Price, Development Cost, and Lead Time rows
    const netPriceRow = costData.find((item: any) => item.costComponent === "Net Price/unit");
    const developmentCostRow = costData.find((item: any) => item.costComponent === "Development cost");
    const leadTimeRow = costData.find((item: any) => item.costComponent === "Lead Time Days");
    
    if (netPriceRow && developmentCostRow && leadTimeRow && vendorIndex < netPriceRow.supplierValues.length) {
      const vendorNetPrice = netPriceRow.supplierValues[vendorIndex] || 0;
      const baseNetPrice = netPriceRow.baseValue || 0;
      
      const vendorDevCost = developmentCostRow.supplierValues[vendorIndex] || 0;
      const baseDevCost = developmentCostRow.baseValue || 0;
      
      const vendorLeadTime = leadTimeRow.supplierValues[vendorIndex] || 0;
      const baseLeadTime = leadTimeRow.baseValue || 0;
      
      // Calculate cost competitiveness (lower cost = higher score)
      const netPriceScore = baseNetPrice > 0 ? Math.max(0, (baseNetPrice - vendorNetPrice) / baseNetPrice * 100 + 100) : 100;
      const devCostScore = baseDevCost > 0 ? Math.max(0, (baseDevCost - vendorDevCost) / baseDevCost * 100 + 100) : 100;
      const leadTimeScore = baseLeadTime > 0 ? Math.max(0, (baseLeadTime - vendorLeadTime) / baseLeadTime * 100 + 100) : 100;
      
      // Weight the scores
      const weightedScore = (netPriceScore * 0.3333) + (devCostScore * 0.3333) + (leadTimeScore * 0.3334);
      return Math.max(0, Math.min(100, weightedScore));
    }
  }
  
  // Fallback to stored percentage or 0
  return evaluation.capabilityPercentage || 0;
};

const getVendorRatingScore = (
  evaluation: VendorEvaluation, 
  ratingScores: VendorRatingOverallScores | null
): number => {
  if (ratingScores && (ratingScores.sectionWiseCapability > 0 || ratingScores.riskMitigation > 0)) {
    // Calculate weighted score from rating engine
    return (ratingScores.sectionWiseCapability * 0.6) + (ratingScores.riskMitigation * 0.4);
  }
  
  // Try fallback to stored percentage
  if (evaluation.riskMitigationPercentage && evaluation.riskMitigationPercentage > 0) {
    return evaluation.riskMitigationPercentage;
  }
  
  // If no data available, derive from evaluation criteria scores
  const ratingCriteria = evaluation.scores.filter(score =>
    score.criteriaId.toLowerCase().includes('rating') ||
    score.criteriaId.toLowerCase().includes('risk') ||
    score.criteriaId.toLowerCase().includes('vendor') ||
    score.criteriaId.toLowerCase().includes('control')
  );
  
  if (ratingCriteria.length > 0) {
    const totalScore = ratingCriteria.reduce((sum, score) => 
      sum + (score.score / score.maxPossibleScore) * 100, 0
    );
    return totalScore / ratingCriteria.length;
  }
  
  return 0;
};

const getCapabilityScore = (
  evaluation: VendorEvaluation,
  capabilityData: any[],
  vendorIndex: number
): number => {
  if (capabilityData && capabilityData.length > 0) {
    // Calculate capability percentage
    const totalActualScore = capabilityData.reduce((sum, criteria) => {
      const vendorScore = criteria.vendorScores?.[evaluation.vendorId] || 0;
      return sum + vendorScore;
    }, 0);
    
    const totalMaxScore = capabilityData.reduce((sum, criteria) => 
      sum + (criteria.maxScore || 0), 0
    );
    
    return totalMaxScore > 0 ? (totalActualScore / totalMaxScore) * 100 : 0;
  }
  
  // Fallback to stored score or 0
  return evaluation.technicalFeasibilityScore || 0;
};

const calculateOverallScore = (
  evaluation: VendorEvaluation, 
  costData: any[], 
  ratingScores: VendorRatingOverallScores | null,
  capabilityData: any[],
  vendorIndex: number,
  costWeight: number = 70, 
  vendorWeight: number = 20, 
  capabilityWeight: number = 10
): number => {
  // Use the overallScore if available, otherwise calculate from real-time API data
  if (evaluation.overallScore && evaluation.overallScore > 0) {
    return evaluation.overallScore;
  }
  
  const costScore = getCostScore(evaluation, costData, vendorIndex);
  const vendorScore = getVendorRatingScore(evaluation, ratingScores);
  const capabilityScore = getCapabilityScore(evaluation, capabilityData, vendorIndex);
  
  // Convert percentages to decimals for weighted calculation
  return (costScore * (costWeight / 100)) + (vendorScore * (vendorWeight / 100)) + (capabilityScore * (capabilityWeight / 100));
};

// Circular Progress Component
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

function CircularProgress({ 
  value, 
  size = 120, 
  strokeWidth = 8, 
  className = '',
  children 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 80) return '#10B981'; // green
    if (val >= 60) return '#F59E0B'; // amber  
    if (val >= 40) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          <>
            <span className="text-2xl font-bold text-white">{value.toFixed(1)}%</span>
            <span className="text-xs text-gray-400">Score</span>
          </>
        )}
      </div>
    </div>
  );
}

// Supplier Evaluation Card Component
interface SupplierCardProps {
  evaluation: VendorEvaluation;
  criteria: NominationCriteria[];
  vendor?: any;
  rank: number;
  vendorIndex: number;
  onUpdate: (evaluationId: string, data: any) => void;
  onUpdateScores: (evaluationId: string, scores: any[]) => void;
  onSelectEvaluation?: (evaluationId: string) => void;
  weights: {
    costWeight: number;
    vendorWeight: number;
    capabilityWeight: number;
  };
  // Real-time API data
  costAnalysisData: any[];
  vendorRatingScores: VendorRatingOverallScores | null;
  capabilityData: any[];
}

function SupplierCard({ 
  evaluation, 
  criteria, 
  vendor, 
  rank,
  vendorIndex,
  costAnalysisData,
  vendorRatingScores,
  capabilityData,
  onSelectEvaluation,
  weights
}: SupplierCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [remainingCooldown, setRemainingCooldown] = useState<number>(0);
  const updateVendorEvaluation = useUpdateVendorEvaluation();

  // Rate limiting: minimum 2 seconds between requests
  const RATE_LIMIT_MS = 2000;

  // Cooldown timer effect
  useEffect(() => {
    if (lastUpdateTime === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime;
      const remaining = Math.max(0, RATE_LIMIT_MS - timeSinceLastUpdate);
      
      setRemainingCooldown(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  // Check if rate limited
  const isRateLimited = remainingCooldown > 0;

  const handleQuickApproval = async (evaluationId: string, recommendation: string) => {
    // Check rate limiting
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;
    
    if (timeSinceLastUpdate < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastUpdate) / 1000);
      toast.error(`Please wait ${waitTime} second${waitTime > 1 ? 's' : ''} before making another request`);
      return;
    }

    // Check if already updating
    if (isUpdating) {
      toast.error('Update already in progress. Please wait...');
      return;
    }

    setIsUpdating(true);
    setLastUpdateTime(now);
    
    try {
      await updateVendorEvaluation.mutateAsync({
        evaluationId,
        data: {
          recommendation: recommendation as any,
          evaluationNotes: `Quick ${recommendation} from nomination overview at ${new Date().toISOString()}`
        }
      });
      
      toast.success(`Vendor ${recommendation} successfully`);
    } catch (error) {
      console.error('Failed to update vendor approval:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          toast.error('Rate limit exceeded. Please wait before trying again.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(`Failed to update vendor approval: ${error.message}`);
        }
      } else {
        toast.error('Failed to update vendor approval. Please try again.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getRecommendationIcon = (recommendation: Recommendation) => {
    switch (recommendation) {
      case Recommendation.APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case Recommendation.CONDITIONAL:
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case Recommendation.REJECTED:
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-green-400 bg-green-400/20';
    if (rank === 2) return 'text-blue-400 bg-blue-400/20';
    if (rank === 3) return 'text-orange-400 bg-orange-400/20';
    return 'text-gray-400 bg-gray-400/20';
  };

  return (
    <Card className="bg-gray-800 border-gray-700 transition-all duration-200 hover:border-gray-600">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(rank)}`}>
              {rank}
            </div>
            <div>
              <CardTitle className="text-lg text-white">
                {vendor?.name || evaluation.vendorName || 'Unknown Vendor'}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline"
                  className={`border-${getRecommendationColor(evaluation.recommendation || Recommendation.PENDING)}-500 text-${getRecommendationColor(evaluation.recommendation || Recommendation.PENDING)}-400`}
                >
                  {getRecommendationIcon(evaluation.recommendation || Recommendation.PENDING)}
                  <span className="ml-1">
                    {evaluation.recommendation?.replace('_', ' ').toUpperCase() || 'PENDING'}
                  </span>
                </Badge>
              </div>
            </div>
          </div>
          
          <CircularProgress 
            value={calculateOverallScore(evaluation, costAnalysisData, vendorRatingScores, capabilityData, vendorIndex, weights.costWeight, weights.vendorWeight, weights.capabilityWeight)}
            size={80}
            strokeWidth={6}
          >
            <span className="text-lg font-bold text-white">
              {calculateOverallScore(evaluation, costAnalysisData, vendorRatingScores, capabilityData, vendorIndex, weights.costWeight, weights.vendorWeight, weights.capabilityWeight).toFixed(0)}
            </span>
            <span className="text-xs text-gray-400">Score</span>
          </CircularProgress>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {getCostScore(evaluation, costAnalysisData, vendorIndex).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400">Cost Competancy 70%</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {getVendorRatingScore(evaluation, vendorRatingScores).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400">Vendor Rating 20%</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {getCapabilityScore(evaluation, capabilityData, vendorIndex).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400">Capability score 10%</div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-white">Risk Level</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="outline"
                className={`border-${getRiskLevelColor(evaluation.riskLevel)}-500 text-${getRiskLevelColor(evaluation.riskLevel)}-400`}
              >
                {evaluation.riskLevel.toUpperCase()}
              </Badge>
              <span className="text-xs text-gray-400">
                NC: {evaluation.minorNcCount}M / {evaluation.majorNcCount}Mj
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="border-gray-600 text-gray-300"
            >
              {isExpanded ? 'Less' : 'Details'}
            </Button>
            {onSelectEvaluation && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onSelectEvaluation(evaluation.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Evaluate
              </Button>
            )}
          </div>
        </div>

        {/* Quick Approval Actions */}
        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
          <div className="text-sm font-medium text-white">Quick Actions:</div>
          <div className="flex gap-2">
            {evaluation.recommendation === 'approved' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickApproval(evaluation.id, 'rejected')}
                disabled={isUpdating || isRateLimited}
                className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title={isRateLimited ? `Please wait ${Math.ceil(remainingCooldown / 1000)} seconds` : 'Undo approval and reject this vendor'}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-400 mr-1"></div>
                    Processing...
                  </>
                ) : isRateLimited ? (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Wait {Math.ceil(remainingCooldown / 1000)}s
                  </>
                ) : (
                  <>
                    <Undo2 className="h-3 w-3 mr-1" />
                    Undo Approval
                  </>
                )}
              </Button>
            ) : evaluation.recommendation === 'rejected' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickApproval(evaluation.id, 'approved')}
                disabled={isUpdating || isRateLimited}
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title={isRateLimited ? `Please wait ${Math.ceil(remainingCooldown / 1000)} seconds` : 'Redo approval for this vendor'}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 mr-1"></div>
                    Processing...
                  </>
                ) : isRateLimited ? (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Wait {Math.ceil(remainingCooldown / 1000)}s
                  </>
                ) : (
                  <>
                    <Redo2 className="h-3 w-3 mr-1" />
                    Redo Approval
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickApproval(evaluation.id, 'approved')}
                disabled={isUpdating || isRateLimited}
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title={isRateLimited ? `Please wait ${Math.ceil(remainingCooldown / 1000)} seconds` : 'Approve this vendor'}
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400 mr-1"></div>
                    Processing...
                  </>
                ) : isRateLimited ? (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Wait {Math.ceil(remainingCooldown / 1000)}s
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve Vendor
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4 border-t border-gray-700 pt-4">
            {/* Criteria Scores */}
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Evaluation Criteria</h4>
              <div className="space-y-2">
                {criteria.map((criterion) => {
                  // Find the actual score from evaluation.scores
                  const score = evaluation.scores.find(s => s.criteriaId === criterion.id);
                  
                  // If no matching score found, derive from API data based on criterion type
                  let actualScore = score?.score || 0;
                  let maxScore = score?.maxPossibleScore || criterion.weight || 100;
                  
                  // If evaluation.scores is empty or doesn't have this criterion, use real-time API data
                  if (!score || actualScore === 0) {
                    const criteriaName = criterion.criteriaName.toLowerCase();
                    const costScore = getCostScore(evaluation, costAnalysisData, vendorIndex);
                    const vendorScore = getVendorRatingScore(evaluation, vendorRatingScores[evaluation.vendorId]);
                    const capabilityScore = getCapabilityScore(evaluation, capabilityData, vendorIndex);
                    
                    
                    
                    // Map criteria to appropriate real-time API scores with fallbacks
                    if (criteriaName.includes('material') || criteriaName.includes('cost') || criteriaName.includes('financial')) {
                      // Cost-related criteria - use cost analysis API data
                      if (costScore > 0) {
                        actualScore = (costScore / 100) * maxScore;
                      } else {
                        actualScore = evaluation.capabilityPercentage ? (evaluation.capabilityPercentage / 100) * maxScore : maxScore * 0.75;
                      }
                    } else if (criteriaName.includes('process') || criteriaName.includes('feasibility') || criteriaName.includes('capacity') || criteriaName.includes('leadtime')) {
                      // Capability-related criteria - use capability scoring API data
                      if (capabilityScore > 0) {
                        actualScore = (capabilityScore / 100) * maxScore;
                      } else {
                        actualScore = evaluation.technicalFeasibilityScore ? (evaluation.technicalFeasibilityScore / 100) * maxScore : maxScore * 0.8;
                      }
                    } else if (criteriaName.includes('project') || criteriaName.includes('control')) {
                      // Vendor rating related criteria - use vendor rating API data
                      if (vendorScore > 0) {
                        actualScore = (vendorScore / 100) * maxScore;
                      } else {
                        actualScore = evaluation.riskMitigationPercentage ? (evaluation.riskMitigationPercentage / 100) * maxScore : maxScore * 0.85;
                      }
                    } else {
                      // Default to weighted average based on criterion importance
                      const avgScore = (costScore * 0.5) + (capabilityScore * 0.3) + (vendorScore * 0.2);
                      if (avgScore > 0) {
                        actualScore = (avgScore / 100) * maxScore;
                      } else {
                        actualScore = evaluation.overallScore ? (evaluation.overallScore / 100) * maxScore : maxScore * 0.7;
                      }
                    }
                  }
                  
                  const percentage = maxScore > 0 ? (actualScore / maxScore) * 100 : 0;
                  
                  return (
                    <div key={criterion.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{criterion.criteriaName}</span>
                        <span className="text-white font-medium">
                          {actualScore.toFixed(0)} / {maxScore}
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2 bg-gray-700"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            {evaluation.evaluationNotes && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Evaluation Notes</h4>
                <p className="text-sm text-gray-300 p-3 bg-gray-700/50 rounded">
                  {evaluation.evaluationNotes}
                </p>
              </div>
            )}

            {/* Technical Discussion */}
            {evaluation.technicalDiscussion && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Technical Discussion</h4>
                <p className="text-sm text-gray-300 p-3 bg-gray-700/50 rounded">
                  {evaluation.technicalDiscussion}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main Component Props
interface SupplierNominationPageProps {
  nominationId: string;
  projectId: string;
  onBack?: () => void;
  onSelectEvaluation?: (evaluationId: string) => void;
}

export function SupplierNominationPage({
  nominationId,
  onBack,
  onSelectEvaluation
}: SupplierNominationPageProps) {
  const { data: nomination, isLoading, error } = useSupplierNomination(nominationId);
  
  // State for real-time scores from APIs
  const [costAnalysisData, setCostAnalysisData] = useState<any[]>([]);
  const [vendorRatingScores, setVendorRatingScores] = useState<Record<string, VendorRatingOverallScores>>({});
  const [capabilityData, setCapabilityData] = useState<any[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');
  
  // State
  const vendorsQuery = useMemo(() => ({ status: 'active' as const, limit: 1000 }), []);
  const { data: vendorsResponse } = useVendors(vendorsQuery);
  
  // Default weights for overall scoring
  const [weights] = useState({
    costWeight: 70,
    vendorWeight: 20,
    capabilityWeight: 10
  });
  
  // Fetch all nominations for the same project to get group-level BOM parts
  // Only fetch if nomination is loaded and has a projectId
  const { data: allNominations } = useSupplierNominations(nomination?.projectId || '');
  
  const updateEvaluationMutation = useUpdateVendorEvaluation(nominationId);
  const updateScoresMutation = useUpdateEvaluationScores(nominationId);
  const completeNominationMutation = useCompleteSupplierNomination();

  const vendors = vendorsResponse?.vendors || [];

  // Fetch real-time scores from APIs for all vendors
  useEffect(() => {
    const loadAllVendorScores = async () => {
      if (!nomination?.vendorEvaluations || nomination.vendorEvaluations.length === 0) return;
      
      setIsLoadingScores(true);
      try {
        // Fetch cost analysis data
        const costData = await getCostAnalysis(nominationId);
        if (costData.length > 0) {
          const transformedCostData = transformCostAnalysisToComponentData(costData, 
            nomination.vendorEvaluations.map(v => ({ id: v.vendorId, name: v.vendorName }))
          );
          setCostAnalysisData(transformedCostData);
        }

        // Fetch capability data
        const capabilityScores = await getCapabilityScores(nominationId);
        setCapabilityData(capabilityScores);

        // Fetch rating engine scores for each vendor
        const ratingScoresMap: Record<string, VendorRatingOverallScores> = {};
        for (const evaluation of nomination.vendorEvaluations) {
          try {
            const scores = await getVendorRatingOverallScores(nominationId, evaluation.vendorId);
            ratingScoresMap[evaluation.vendorId] = scores;
          } catch (error) {
            console.error(`Failed to load rating scores for vendor ${evaluation.vendorId}:`, error);
            // Set default scores if API fails
            ratingScoresMap[evaluation.vendorId] = {
              sectionWiseCapability: 0,
              riskMitigation: 0,
              totalMinorNC: 0,
              totalMajorNC: 0,
              totalRecords: 0
            };
          }
        }
        setVendorRatingScores(ratingScoresMap);

      } catch (error) {
        console.error('Failed to load vendor scores:', error);
      } finally {
        setIsLoadingScores(false);
      }
    };

    loadAllVendorScores();
  }, [nominationId, nomination?.vendorEvaluations]);

  // Create vendor lookup map
  const vendorMap = useMemo(() => {
    return new Map(vendors.map(vendor => [vendor.id, vendor]));
  }, [vendors]);

  // For now, show BOM parts from current nomination only
  // TODO: Implement group-level BOM parts aggregation when full nomination details are available
  const groupBomParts = useMemo(() => {
    if (!nomination?.bomParts) return [];
    
    return nomination.bomParts.map(part => ({
      ...part,
      nominationName: nomination.nominationName,
      nominationId: nomination.id
    }));
  }, [nomination]);

  // Sort and filter evaluations by overall score (descending) and status filter
  const sortedEvaluations = useMemo(() => {
    if (!nomination?.vendorEvaluations) return [];
    
    let filtered = nomination.vendorEvaluations;
    
    // Apply status filter - simplified to approved or rejected (everything else)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(evaluation => {
        if (statusFilter === 'approved') {
          return evaluation.recommendation === 'approved';
        } else if (statusFilter === 'rejected') {
          return evaluation.recommendation !== 'approved';
        }
        return true;
      });
    }
    
    return [...filtered].sort((a, b) => 
      calculateOverallScore(b, weights.costWeight, weights.vendorWeight, weights.capabilityWeight) - 
      calculateOverallScore(a, weights.costWeight, weights.vendorWeight, weights.capabilityWeight)
    );
  }, [nomination?.vendorEvaluations, weights, statusFilter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!nomination?.vendorEvaluations) return null;

    const evaluations = nomination.vendorEvaluations;
    const totalVendors = evaluations.length;
    const avgScore = evaluations.reduce((sum, evaluation) => 
      sum + calculateOverallScore(evaluation, weights.costWeight, weights.vendorWeight, weights.capabilityWeight), 0
    ) / totalVendors;
    
    const approved = evaluations.filter(e => e.recommendation === 'approved').length;
    const rejected = evaluations.filter(e => e.recommendation !== 'approved').length;

    return {
      totalVendors,
      avgScore: avgScore || 0,
      approved,
      rejected
    };
  }, [nomination?.vendorEvaluations, weights]);

  const handleUpdateEvaluation = async (evaluationId: string, data: any) => {
    try {
      await updateEvaluationMutation.mutateAsync({ evaluationId, data });
    } catch (error) {
      console.error('Update evaluation error:', error);
    }
  };

  const handleUpdateScores = async (evaluationId: string, scores: any[]) => {
    try {
      await updateScoresMutation.mutateAsync({ evaluationId, scores });
    } catch (error) {
      console.error('Update scores error:', error);
    }
  };

  const handleCompleteNomination = async () => {
    if (!window.confirm('Are you sure you want to complete this supplier nomination? This action cannot be undone.')) {
      return;
    }

    try {
      await completeNominationMutation.mutateAsync(nominationId);
    } catch (error) {
      console.error('Complete nomination error:', error);
    }
  };


  const handleExportResults = () => {
    // Export functionality - can be enhanced
    toast.info('Export functionality will be available soon');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Loading nomination...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <div className="text-xl font-semibold text-white">
                Nomination Not Found
              </div>
            </div>
            <div className="text-gray-400 text-center max-w-md">
              The supplier nomination with ID "{nominationId}" could not be found. 
              Please create a new nomination or select an existing one from the project dashboard.
            </div>
            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
                className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Button>
            )}
            <div className="text-sm text-gray-500 mt-2">
              Tip: Create nominations through the project dashboard with proper vendor selection.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nomination) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Nomination not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">{nomination.nominationName}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge 
                  variant="outline"
                  className={`border-${getStatusColor(nomination.status)}-500 text-${getStatusColor(nomination.status)}-400`}
                >
                  {getStatusText(nomination.status)}
                </Badge>
                <Badge variant="secondary">
                  {getNominationTypeLabel(nomination.nominationType)}
                </Badge>
                <span className="text-gray-400 text-sm">
                  {nomination.vendorEvaluations.length} vendors under evaluation
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportResults}
              className="border-gray-600 text-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={handleCompleteNomination}
              disabled={completeNominationMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Nomination
            </Button>
          </div>
        </div>

            {/* BOM Details Section - Group Level */}
            {groupBomParts && groupBomParts.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Selected BOM Parts ({groupBomParts.length} {groupBomParts.length === 1 ? 'Part' : 'Parts'})
              </CardTitle>
              {nomination.evaluationGroupId && (
                <div className="text-sm text-gray-400">
                  Evaluation Group: {nomination.evaluationGroupId}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {groupBomParts.map((bomPart, index) => (
                  <div key={bomPart.bomItemId} className={`${index > 0 ? 'pt-6 border-t border-gray-700' : ''}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {bomPart.bomItemName}
                        </h3>
                        <div className="text-sm text-gray-400 mt-1">
                          From: {bomPart.nominationName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {bomPart.vendorIds.length} vendor{bomPart.vendorIds.length !== 1 ? 's' : ''} assigned
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Part #{index + 1}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          BOM Item Name
                        </label>
                        <div className="text-white font-medium">
                          {bomPart.bomItemName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {bomPart.bomItemId.slice(-8)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Part Number
                        </label>
                        <div className="text-white font-medium">
                          {bomPart.partNumber || 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Material
                        </label>
                        <div className="text-white font-medium">
                          {bomPart.material || 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Quantity Required
                        </label>
                        <div className="text-white font-medium">
                          {bomPart.quantity.toLocaleString()} units
                        </div>
                      </div>
                    </div>
                    
                    {bomPart.vendorIds.length > 0 && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Assigned Vendors
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {bomPart.vendorIds.map((vendorId) => {
                            const vendor = vendorMap.get(vendorId);
                            return (
                              <Badge key={vendorId} variant="outline" className="text-xs">
                                {vendor?.name || `Vendor ${vendorId.slice(-4)}`}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {nomination.description && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nomination Description
                  </label>
                  <div className="text-gray-300 text-sm">
                    {nomination.description}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Statistics */}
        {summaryStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{summaryStats.totalVendors}</div>
                <div className="text-sm text-gray-400">Total Vendors</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{summaryStats.avgScore.toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Avg Score</div>
              </CardContent>
            </Card>

            <Card 
              className={`bg-gray-800 border-gray-700 cursor-pointer transition-all hover:border-green-500 ${statusFilter === 'approved' ? 'border-green-500 bg-green-500/10' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{summaryStats.approved}</div>
                <div className="text-sm text-gray-400">Approved</div>
              </CardContent>
            </Card>

            <Card 
              className={`bg-gray-800 border-gray-700 cursor-pointer transition-all hover:border-red-500 ${statusFilter === 'rejected' ? 'border-red-500 bg-red-500/10' : ''}`}
              onClick={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{summaryStats.rejected}</div>
                <div className="text-sm text-gray-400">Not Approved</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter and Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Supplier Evaluations</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Filter by status:</span>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      All Vendors ({nomination?.vendorEvaluations?.length || 0})
                    </div>
                  </SelectItem>
                  <SelectItem value="approved" className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      Approved ({summaryStats?.approved || 0})
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected" className="text-white hover:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      Not Approved ({summaryStats?.rejected || 0})
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="text-sm text-gray-400">
            Showing {sortedEvaluations.length} of {nomination?.vendorEvaluations?.length || 0} vendors
          </div>
        </div>

        {/* Supplier Evaluation Cards */}
        <div>
          {sortedEvaluations.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  {statusFilter === 'all' ? 'No Vendor Evaluations' : 
                   statusFilter === 'approved' ? 'No Approved Vendors' : 
                   'No Vendors to Approve'}
                </h3>
                <p className="text-gray-400 max-w-md">
                  {statusFilter === 'all' 
                    ? 'This nomination currently has no vendor evaluations. Vendors should be added during nomination creation.'
                    : statusFilter === 'approved'
                    ? 'No vendors have been approved yet. Use the "Approve Vendor" button to approve vendors.'
                    : 'All vendors have been approved! Great work on completing the evaluation process.'
                  }
                </p>
                {statusFilter !== 'all' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setStatusFilter('all')}
                    className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Show All Vendors
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedEvaluations.map((evaluation, index) => (
                <SupplierCard
                  key={evaluation.id}
                  evaluation={evaluation}
                  criteria={nomination.criteria}
                  vendor={vendorMap.get(evaluation.vendorId)}
                  rank={index + 1}
                  vendorIndex={index}
                  onUpdate={handleUpdateEvaluation}
                  onUpdateScores={handleUpdateScores}
                  onSelectEvaluation={onSelectEvaluation}
                  weights={weights}
                  costAnalysisData={costAnalysisData}
                  vendorRatingScores={vendorRatingScores[evaluation.vendorId] || null}
                  capabilityData={capabilityData}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}