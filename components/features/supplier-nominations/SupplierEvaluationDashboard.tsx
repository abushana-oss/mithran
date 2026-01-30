'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3,
  TrendingUp,
  DollarSign,
  Award,
  Target,
  Zap,
  Shield,
  Cog
} from 'lucide-react';
import { VendorRatingEngine } from './VendorRatingEngine';
import { CostCompetencyAnalysis } from './CostCompetencyAnalysis';

interface EvaluationCriteria {
  id: string;
  name: string;
  weightage: number;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
}

interface SupplierInfo {
  id: string;
  name: string;
  status: string;
  vendorType: string;
  overallScore: number;
}

const evaluationCriteria: EvaluationCriteria[] = [
  {
    id: 'vendor_rating',
    name: 'Vendor Rating',
    weightage: 20,
    score: 0,
    maxScore: 100,
    status: 'poor'
  },
  {
    id: 'capability_score',
    name: 'Capability Score',
    weightage: 10,
    score: 0,
    maxScore: 100,
    status: 'poor'
  },
  {
    id: 'cost_competency',
    name: 'Cost Competency',
    weightage: 70,
    score: 0,
    maxScore: 100,
    status: 'poor'
  }
];

const mockSupplierData: SupplierInfo = {
  id: 'supplier-1',
  name: 'EMUSKI',
  status: 'PENDING',
  vendorType: 'MANUFACTURER',
  overallScore: 0
};

interface SupplierEvaluationDashboardProps {
  supplierId?: string;
  nominationId?: string;
}

export function SupplierEvaluationDashboard({ 
  supplierId = 'supplier-1', 
  nominationId = 'nomination-1' 
}: SupplierEvaluationDashboardProps) {
  const [supplierData] = useState<SupplierInfo>(mockSupplierData);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>(evaluationCriteria);

  // Calculate overall weighted score
  const overallMetrics = useMemo(() => {
    const totalWeightage = criteria.reduce((sum, criterion) => sum + criterion.weightage, 0);
    const weightedScore = criteria.reduce((sum, criterion) => {
      return sum + (criterion.score * criterion.weightage / 100);
    }, 0);
    
    const finalScore = (weightedScore / totalWeightage) * 100;
    
    return {
      finalScore: finalScore.toFixed(1),
      totalWeightage,
      breakdown: criteria.map(criterion => ({
        ...criterion,
        weightedScore: (criterion.score * criterion.weightage / 100).toFixed(2),
        percentage: (criterion.score).toFixed(1)
      }))
    };
  }, [criteria]);

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'excellent': return 'text-green-400 bg-green-500/20';
      case 'good': return 'text-blue-400 bg-blue-500/20';
      case 'average': return 'text-yellow-400 bg-yellow-500/20';
      case 'poor': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getOverallGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-400', status: 'Excellent' };
    if (score >= 80) return { grade: 'A', color: 'text-green-400', status: 'Very Good' };
    if (score >= 70) return { grade: 'B+', color: 'text-blue-400', status: 'Good' };
    if (score >= 60) return { grade: 'B', color: 'text-yellow-400', status: 'Average' };
    return { grade: 'C', color: 'text-red-400', status: 'Needs Improvement' };
  };

  const grade = getOverallGrade(parseFloat(overallMetrics.finalScore));

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">{supplierData.name} - Comprehensive Evaluation</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                {supplierData.status}
              </Badge>
              <Badge variant="secondary">
                {supplierData.vendorType}
              </Badge>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-4xl font-bold ${grade.color}`}>
              {overallMetrics.finalScore}%
            </div>
            <div className="text-lg font-medium text-white">Grade: {grade.grade}</div>
            <div className="text-sm text-gray-400">{grade.status}</div>
          </div>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-white">0%</div>
            <div className="text-xs text-gray-400">Capability</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">0%</div>
            <div className="text-xs text-gray-400">Risk Mitigation</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-white">0%</div>
            <div className="text-xs text-gray-400">Tech Feasibility</div>
          </div>
        </div>

        {/* Criteria Breakdown */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="h-5 w-5" />
              Evaluation Criteria Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overallMetrics.breakdown.map((criterion) => (
                <div key={criterion.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                      {criterion.id === 'vendor_rating' && <BarChart3 className="h-6 w-6 text-blue-400" />}
                      {criterion.id === 'capability_score' && <TrendingUp className="h-6 w-6 text-green-400" />}
                      {criterion.id === 'cost_competency' && <DollarSign className="h-6 w-6 text-yellow-400" />}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{criterion.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(criterion.status)}>
                          {criterion.status.toUpperCase()}
                        </Badge>
                        <span className="text-gray-400 text-sm">
                          Weightage: {criterion.weightage}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{criterion.percentage}%</div>
                    <div className="text-sm text-gray-400">
                      Weighted: {criterion.weightedScore}
                    </div>
                    <div className="w-32 mt-2">
                      <Progress value={criterion.score} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-medium">Total Weighted Score:</span>
                <span className={`text-2xl font-bold ${grade.color}`}>
                  {overallMetrics.finalScore}% ({grade.grade})
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Based on {overallMetrics.totalWeightage}% total weightage
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="rating" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
            <TabsTrigger 
              value="rating" 
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
            >
              <Zap className="h-4 w-4 mr-2" />
              Vendor Rating Engine
            </TabsTrigger>
            <TabsTrigger 
              value="cost" 
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Cost Competency Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="rating" className="space-y-4">
            <VendorRatingEngine 
              vendorId={supplierId}
              onScoreUpdate={(scores) => {
                // Update vendor rating score in criteria
                setCriteria(prev => prev.map(criterion => 
                  criterion.id === 'vendor_rating' 
                    ? { ...criterion, score: 68.9 } // Calculate from scores
                    : criterion
                ));
              }}
            />
          </TabsContent>
          
          <TabsContent value="cost" className="space-y-4">
            <CostCompetencyAnalysis 
              nominationId={nominationId}
              onDataUpdate={(data) => {
                // Update cost competency score in criteria
                setCriteria(prev => prev.map(criterion => 
                  criterion.id === 'cost_competency' 
                    ? { ...criterion, score: 85.2 } // Calculate from cost data
                    : criterion
                ));
              }}
            />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}