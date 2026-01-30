'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useSupplierNomination,
  useUpdateVendorEvaluation,
  useUpdateEvaluationScores,
  useCompleteSupplierNomination
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
import { MultiSupplierEvaluationView } from './MultiSupplierEvaluationView';

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
  onUpdate: (evaluationId: string, data: any) => void;
  onUpdateScores: (evaluationId: string, scores: any[]) => void;
  onSelectEvaluation?: (evaluationId: string) => void;
}

function SupplierCard({ 
  evaluation, 
  criteria, 
  vendor, 
  rank,
  onSelectEvaluation
}: SupplierCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
                {vendor?.name || `Supplier ${rank}`}
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
                <Badge variant="secondary" className="text-xs">
                  {evaluation.vendorType.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          
          <CircularProgress 
            value={evaluation.overallScore}
            size={80}
            strokeWidth={6}
          >
            <span className="text-lg font-bold text-white">
              {evaluation.overallScore.toFixed(0)}
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
              {evaluation.capabilityPercentage.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400">Cost Competancy 70%</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {evaluation.riskMitigationPercentage.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400">Vendor Rating 20%</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {evaluation.technicalFeasibilityScore.toFixed(0)}%
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

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4 border-t border-gray-700 pt-4">
            {/* Criteria Scores */}
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Evaluation Criteria</h4>
              <div className="space-y-2">
                {criteria.map((criterion) => {
                  const score = evaluation.scores.find(s => s.criteriaId === criterion.id);
                  const percentage = score ? (score.score / score.maxPossibleScore) * 100 : 0;
                  
                  return (
                    <div key={criterion.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{criterion.criteriaName}</span>
                        <span className="text-white font-medium">
                          {score?.score.toFixed(0) || 0} / {criterion.maxScore}
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
  const { data: nomination, isLoading } = useSupplierNomination(nominationId);
  const vendorsQuery = useMemo(() => ({ status: 'active' as const, limit: 1000 }), []);
  const { data: vendorsResponse } = useVendors(vendorsQuery);
  
  const updateEvaluationMutation = useUpdateVendorEvaluation(nominationId);
  const updateScoresMutation = useUpdateEvaluationScores(nominationId);
  const completeNominationMutation = useCompleteSupplierNomination();

  const vendors = vendorsResponse?.vendors || [];

  // Create vendor lookup map
  const vendorMap = useMemo(() => {
    return new Map(vendors.map(vendor => [vendor.id, vendor]));
  }, [vendors]);

  // Sort evaluations by overall score (descending)
  const sortedEvaluations = useMemo(() => {
    if (!nomination?.vendorEvaluations) return [];
    return [...nomination.vendorEvaluations].sort((a, b) => b.overallScore - a.overallScore);
  }, [nomination?.vendorEvaluations]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!nomination?.vendorEvaluations) return null;

    const evaluations = nomination.vendorEvaluations;
    const totalVendors = evaluations.length;
    const avgScore = evaluations.reduce((sum, evaluation) => sum + evaluation.overallScore, 0) / totalVendors;
    
    const approved = evaluations.filter(e => e.recommendation === Recommendation.APPROVED).length;
    const conditional = evaluations.filter(e => e.recommendation === Recommendation.CONDITIONAL).length;
    const rejected = evaluations.filter(e => e.recommendation === Recommendation.REJECTED).length;

    return {
      totalVendors,
      avgScore: avgScore || 0,
      approved,
      conditional,
      rejected,
      pending: totalVendors - approved - conditional - rejected
    };
  }, [nomination?.vendorEvaluations]);

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

        {/* Summary Statistics */}
        {summaryStats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{summaryStats.approved}</div>
                <div className="text-sm text-gray-400">Approved</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{summaryStats.conditional}</div>
                <div className="text-sm text-gray-400">Conditional</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{summaryStats.rejected}</div>
                <div className="text-sm text-gray-400">Rejected</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-400">{summaryStats.pending}</div>
                <div className="text-sm text-gray-400">Pending</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Supplier Evaluation Cards */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Supplier Evaluations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedEvaluations.map((evaluation, index) => (
              <SupplierCard
                key={evaluation.id}
                evaluation={evaluation}
                criteria={nomination.criteria}
                vendor={vendorMap.get(evaluation.vendorId)}
                rank={index + 1}
                onUpdate={handleUpdateEvaluation}
                onUpdateScores={handleUpdateScores}
                onSelectEvaluation={onSelectEvaluation}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}