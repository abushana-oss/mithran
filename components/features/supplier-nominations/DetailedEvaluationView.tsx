'use client';

import React, { useState, useMemo } from 'react';
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
  Calculator,
  TrendingUp,
  AlertTriangle,
  FileText,
  BarChart3,
  PieChart,
  Zap,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useUpdateVendorEvaluation,
  useUpdateEvaluationScores
} from '@/lib/api/hooks/useSupplierNominations';
import {
  VendorType,
  RiskLevel,
  Recommendation,
  getRiskLevelColor,
  getRecommendationColor,
  type VendorEvaluation,
  type NominationCriteria,
  type CreateEvaluationScoreData
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

export function DetailedEvaluationView({
  evaluation,
  criteria,
  vendor,
  nominationId,
  onBack
}: DetailedEvaluationViewProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scoring' | 'capability' | 'risk' | 'technical' | 'rating' | 'cost' | 'evaluation'>('dashboard');
  const [editingScores, setEditingScores] = useState<Record<string, number>>({});
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

  const updateEvaluationMutation = useUpdateVendorEvaluation(nominationId);
  const updateScoresMutation = useUpdateEvaluationScores(nominationId);

  // Create scores map for easy access
  const scoresMap = useMemo(() => {
    const map = new Map();
    evaluation.scores.forEach(score => {
      map.set(score.criteriaId, score);
    });
    return map;
  }, [evaluation.scores]);

  // Group criteria by category
  const categorizedCriteria = useMemo(() => {
    const categories = new Map();
    criteria.forEach(criterion => {
      const category = criterion.criteriaCategory;
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category).push(criterion);
    });
    return categories;
  }, [criteria]);

  const handleScoreChange = (criteriaId: string, score: number) => {
    setEditingScores(prev => ({
      ...prev,
      [criteriaId]: score
    }));
  };

  const handleSaveScores = async () => {
    const scores: CreateEvaluationScoreData[] = Object.entries(editingScores).map(([criteriaId, score]) => ({
      criteriaId,
      score,
      evidenceText: '',
      assessorNotes: ''
    }));

    try {
      await updateScoresMutation.mutateAsync({
        evaluationId: evaluation.id,
        scores
      });
      setEditingScores({});
      toast.success('Scores updated successfully');
    } catch (error) {
      console.error('Save scores error:', error);
    }
  };

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

  const hasUnsavedScores = Object.keys(editingScores).length > 0;

  const renderEvaluationScoringTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Comprehensive Evaluation Scoring</h3>
        <Button
          onClick={handleSaveScores}
          disabled={!hasUnsavedScores || updateScoresMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save All Scores
        </Button>
      </div>

      {/* Quality Category */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Quality (40%)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Manufacturing Capability (25%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Enter score (0-100)"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Quality Control Systems (15%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Enter score (0-100)"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Category */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Cost (20%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Cost Competency (20%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="Enter score (0-100)"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Core Process Category */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Core Process (15%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Production Capacity (15%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="Enter score (0-100)"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logistics Category */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Logistics (15%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Delivery Performance (15%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="Enter score (0-100)"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Management Category */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Management (10%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Process Improvement (10%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="Enter score (0-100)"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-gray-700 border-gray-600">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-white">Overall Weighted Score:</span>
            <span className="text-2xl font-bold text-green-400">0.0%</span>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Based on weighted criteria (Quality 40%, Cost 20%, Core Process 15%, Logistics 15%, Management 10%)
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderScoringTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Evaluation Scoring</h3>
        <Button
          onClick={handleSaveScores}
          disabled={!hasUnsavedScores || updateScoresMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Scores
        </Button>
      </div>

      {Array.from(categorizedCriteria.entries()).map(([category, criteriaList]) => (
        <Card key={category} className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Criteria</TableHead>
                  <TableHead className="text-gray-300">Weight</TableHead>
                  <TableHead className="text-gray-300">Current Score</TableHead>
                  <TableHead className="text-gray-300">New Score</TableHead>
                  <TableHead className="text-gray-300">Weighted Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criteriaList.map((criterion) => {
                  const currentScore = scoresMap.get(criterion.id);
                  const editScore = editingScores[criterion.id];
                  const scoreToUse = editScore !== undefined ? editScore : (currentScore?.score || 0);
                  const weightedScore = (scoreToUse * criterion.weightPercentage) / 100;

                  return (
                    <TableRow key={criterion.id} className="border-gray-700">
                      <TableCell className="text-white">{criterion.criteriaName}</TableCell>
                      <TableCell className="text-gray-300">{criterion.weightPercentage}%</TableCell>
                      <TableCell className="text-gray-300">
                        {currentScore?.score.toFixed(1) || '0.0'} / {criterion.maxScore}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={criterion.maxScore}
                          step="0.1"
                          value={editScore !== undefined ? editScore : (currentScore?.score || 0)}
                          onChange={(e) => handleScoreChange(criterion.id, parseFloat(e.target.value) || 0)}
                          className="w-20 bg-gray-700 border-gray-600 text-white"
                        />
                      </TableCell>
                      <TableCell className="text-green-400 font-medium">
                        {weightedScore.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCapabilityTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Capability Assessment */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Capability Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Overall Capability Percentage
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={evaluationData.capabilityPercentage}
                onChange={(e) => setEvaluationData(prev => ({
                  ...prev,
                  capabilityPercentage: parseFloat(e.target.value) || 0
                }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Technical Feasibility Score
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={evaluationData.technicalFeasibilityScore}
                onChange={(e) => setEvaluationData(prev => ({
                  ...prev,
                  technicalFeasibilityScore: parseFloat(e.target.value) || 0
                }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vendor Classification */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Vendor Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vendor Type
              </label>
              <Select
                value={evaluationData.vendorType}
                onValueChange={(value: VendorType) => setEvaluationData(prev => ({
                  ...prev,
                  vendorType: value
                }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value={VendorType.OEM}>OEM</SelectItem>
                  <SelectItem value={VendorType.MANUFACTURER}>Manufacturer</SelectItem>
                  <SelectItem value={VendorType.HYBRID}>Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recommendation
              </label>
              <Select
                value={evaluationData.recommendation || Recommendation.PENDING}
                onValueChange={(value: Recommendation) => setEvaluationData(prev => ({
                  ...prev,
                  recommendation: value
                }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value={Recommendation.APPROVED}>Approved</SelectItem>
                  <SelectItem value={Recommendation.CONDITIONAL}>Conditional</SelectItem>
                  <SelectItem value={Recommendation.REJECTED}>Rejected</SelectItem>
                  <SelectItem value={Recommendation.PENDING}>Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={handleSaveEvaluation}
        disabled={updateEvaluationMutation.isPending}
        className="bg-green-600 hover:bg-green-700"
      >
        <Save className="h-4 w-4 mr-2" />
        Save Capability Assessment
      </Button>
    </div>
  );

  const renderRiskTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Assessment */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Risk Level
              </label>
              <Select
                value={evaluationData.riskLevel}
                onValueChange={(value: RiskLevel) => setEvaluationData(prev => ({
                  ...prev,
                  riskLevel: value
                }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value={RiskLevel.LOW}>Low</SelectItem>
                  <SelectItem value={RiskLevel.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={RiskLevel.HIGH}>High</SelectItem>
                  <SelectItem value={RiskLevel.CRITICAL}>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Risk Mitigation Percentage
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={evaluationData.riskMitigationPercentage}
                onChange={(e) => setEvaluationData(prev => ({
                  ...prev,
                  riskMitigationPercentage: parseFloat(e.target.value) || 0
                }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Non-Conformance Tracking */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Non-Conformance Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minor NC Count
              </label>
              <Input
                type="number"
                min="0"
                value={evaluationData.minorNcCount}
                onChange={(e) => setEvaluationData(prev => ({
                  ...prev,
                  minorNcCount: parseInt(e.target.value) || 0
                }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Major NC Count
              </label>
              <Input
                type="number"
                min="0"
                value={evaluationData.majorNcCount}
                onChange={(e) => setEvaluationData(prev => ({
                  ...prev,
                  majorNcCount: parseInt(e.target.value) || 0
                }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={handleSaveEvaluation}
        disabled={updateEvaluationMutation.isPending}
        className="bg-green-600 hover:bg-green-700"
      >
        <Save className="h-4 w-4 mr-2" />
        Save Risk Assessment
      </Button>
    </div>
  );

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
            <div className="text-3xl font-bold text-white">{evaluation.overallScore.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Overall Score</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Overview', icon: BarChart3 },
              { id: 'evaluation', label: 'Evaluation Scoring', icon: Save },
              { id: 'scoring', label: 'Scoring', icon: Calculator },
              { id: 'capability', label: 'Capability', icon: TrendingUp },
              { id: 'risk', label: 'Risk', icon: AlertTriangle },
              { id: 'technical', label: 'Technical', icon: FileText },
              { id: 'rating', label: 'Rating Engine', icon: Zap },
              { id: 'cost', label: 'Cost Analysis', icon: DollarSign }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
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
          {activeTab === 'evaluation' && renderEvaluationScoringTab()}
          {activeTab === 'scoring' && renderScoringTab()}
          {activeTab === 'capability' && renderCapabilityTab()}
          {activeTab === 'risk' && renderRiskTab()}
          {activeTab === 'technical' && renderTechnicalTab()}
          {activeTab === 'rating' && (
            <VendorRatingEngine 
              vendorId={evaluation.vendorId} 
              onScoreUpdate={(scores) => {
                console.log('Updated scores:', scores);
                // Handle score updates here if needed
              }}
            />
          )}
          {activeTab === 'cost' && (
            <CostCompetencyAnalysis 
              nominationId={nominationId}
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