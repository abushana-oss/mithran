'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calculator,
  Zap
} from 'lucide-react';

export interface AssessmentCriteria {
  id: number;
  category: string;
  assessmentAspects: string;
  totalScore: number;
  actualScore: number;
  highThreshold: number;
  lowThreshold: number;
  sectionwiseCapability: number;
  riskSectionTotal: number;
  riskActualScore: number;
  riskMitigation: number;
  minorNC: number;
  majorNC: number;
}

const mockAssessmentData: AssessmentCriteria[] = [
  {
    id: 1,
    category: "Quality",
    assessmentAspects: "Manufacturing Capability",
    totalScore: 65,
    actualScore: 51,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 78.46,
    riskSectionTotal: 25,
    riskActualScore: 19,
    riskMitigation: 76.00,
    minorNC: 1,
    majorNC: 3
  },
  {
    id: 2,
    category: "Quality",
    assessmentAspects: "Problem Solving Capability",
    totalScore: 85,
    actualScore: 65,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 76.47,
    riskSectionTotal: 5,
    riskActualScore: 3,
    riskMitigation: 60.00,
    minorNC: 4,
    majorNC: 0
  },
  {
    id: 3,
    category: "Quality",
    assessmentAspects: "Quality Control Capability",
    totalScore: 85,
    actualScore: 85,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 100.00,
    riskSectionTotal: 10,
    riskActualScore: 10,
    riskMitigation: 100.00,
    minorNC: 0,
    majorNC: 0
  },
  {
    id: 4,
    category: "Quality",
    assessmentAspects: "Prevention Capability",
    totalScore: 60,
    actualScore: 37,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 61.67,
    riskSectionTotal: 10,
    riskActualScore: 10,
    riskMitigation: 100.00,
    minorNC: 10,
    majorNC: 0
  },
  {
    id: 5,
    category: "Cost",
    assessmentAspects: "Cost",
    totalScore: 60,
    actualScore: 40,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 66.67,
    riskSectionTotal: 15,
    riskActualScore: 3,
    riskMitigation: 20.00,
    minorNC: 0,
    majorNC: 5
  },
  {
    id: 6,
    category: "Logistics",
    assessmentAspects: "Delivery Performance",
    totalScore: 50,
    actualScore: 30,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 60.00,
    riskSectionTotal: 10,
    riskActualScore: 6,
    riskMitigation: 60.00,
    minorNC: 10,
    majorNC: 0
  },
  {
    id: 7,
    category: "Logistics",
    assessmentAspects: "Customer Supplier Management",
    totalScore: 30,
    actualScore: 18,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 60.00,
    riskSectionTotal: 5,
    riskActualScore: 3,
    riskMitigation: 60.00,
    minorNC: 6,
    majorNC: 0
  },
  {
    id: 8,
    category: "Development",
    assessmentAspects: "Design & Development",
    totalScore: 55,
    actualScore: 37,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 67.27,
    riskSectionTotal: 5,
    riskActualScore: 5,
    riskMitigation: 100.00,
    minorNC: 9,
    majorNC: 0
  },
  {
    id: 9,
    category: "Management",
    assessmentAspects: "Strategy",
    totalScore: 45,
    actualScore: 27,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 60.00,
    riskSectionTotal: 15,
    riskActualScore: 9,
    riskMitigation: 60.00,
    minorNC: 9,
    majorNC: 0
  },
  {
    id: 10,
    category: "Management",
    assessmentAspects: "Management Culture",
    totalScore: 55,
    actualScore: 33,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 60.00,
    riskSectionTotal: 35,
    riskActualScore: 21,
    riskMitigation: 60.00,
    minorNC: 11,
    majorNC: 0
  },
  {
    id: 11,
    category: "Management",
    assessmentAspects: "TQM Culture Focus",
    totalScore: 70,
    actualScore: 42,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 60.00,
    riskSectionTotal: 45,
    riskActualScore: 27,
    riskMitigation: 60.00,
    minorNC: 14,
    majorNC: 0
  },
  {
    id: 12,
    category: "Management",
    assessmentAspects: "Legal & Statutory Compliances",
    totalScore: 45,
    actualScore: 27,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 60.00,
    riskSectionTotal: 20,
    riskActualScore: 12,
    riskMitigation: 60.00,
    minorNC: 9,
    majorNC: 0
  },
  {
    id: 13,
    category: "Core Process",
    assessmentAspects: "Commodity",
    totalScore: 270,
    actualScore: 200,
    highThreshold: 70,
    lowThreshold: 50,
    sectionwiseCapability: 74.07,
    riskSectionTotal: 0,
    riskActualScore: 0,
    riskMitigation: 0,
    minorNC: 0,
    majorNC: 0
  }
];

interface VendorRatingEngineProps {
  vendorId: string;
  onScoreUpdate?: (scores: AssessmentCriteria[]) => void;
}

export function VendorRatingEngine({ vendorId, onScoreUpdate }: VendorRatingEngineProps) {
  const [assessmentData, setAssessmentData] = useState<AssessmentCriteria[]>(mockAssessmentData);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const overallMetrics = useMemo(() => {
    const totalPossible = assessmentData.reduce((sum, item) => sum + item.totalScore, 0);
    const totalActual = assessmentData.reduce((sum, item) => sum + item.actualScore, 0);
    const overallScore1 = (totalActual / totalPossible) * 100;

    const riskTotalPossible = assessmentData.reduce((sum, item) => sum + item.riskSectionTotal, 0);
    const riskTotalActual = assessmentData.reduce((sum, item) => sum + item.riskActualScore, 0);
    const overallScore2 = riskTotalPossible > 0 ? (riskTotalActual / riskTotalPossible) * 100 : 0;

    const totalMinorNC = assessmentData.reduce((sum, item) => sum + item.minorNC, 0);
    const totalMajorNC = assessmentData.reduce((sum, item) => sum + item.majorNC, 0);

    return {
      overallScore1: overallScore1.toFixed(1),
      overallScore2: overallScore2.toFixed(1),
      totalMinorNC,
      totalMajorNC,
      totalPossible,
      totalActual
    };
  }, [assessmentData]);

  const updateScore = (id: number, field: keyof AssessmentCriteria, value: number) => {
    setAssessmentData(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate capability percentage
        if (field === 'actualScore' || field === 'totalScore') {
          updated.sectionwiseCapability = (updated.actualScore / updated.totalScore) * 100;
        }
        if (field === 'riskActualScore' || field === 'riskSectionTotal') {
          updated.riskMitigation = updated.riskSectionTotal > 0 
            ? (updated.riskActualScore / updated.riskSectionTotal) * 100 
            : 0;
        }
        return updated;
      }
      return item;
    }));
  };

  const getCapabilityColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getNCBadgeColor = (count: number) => {
    if (count === 0) return 'bg-green-500/20 text-green-400';
    if (count <= 5) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Overall Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overall Score 1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overallMetrics.overallScore1}%</div>
            <Progress value={parseFloat(overallMetrics.overallScore1)} className="mt-2" />
            <p className="text-xs text-gray-400 mt-1">
              {overallMetrics.totalActual} / {overallMetrics.totalPossible} points
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overall Score 2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overallMetrics.overallScore2}%</div>
            <Progress value={parseFloat(overallMetrics.overallScore2)} className="mt-2" />
            <p className="text-xs text-gray-400 mt-1">Risk Mitigation Score</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Non-Conformities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={getNCBadgeColor(overallMetrics.totalMinorNC)}>
                Minor: {overallMetrics.totalMinorNC}
              </Badge>
              <Badge className={getNCBadgeColor(overallMetrics.totalMajorNC)}>
                Major: {overallMetrics.totalMajorNC}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Rating Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {parseFloat(overallMetrics.overallScore1) >= 75 ? (
                <span className="text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Excellent
                </span>
              ) : parseFloat(overallMetrics.overallScore1) >= 60 ? (
                <span className="text-yellow-400 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Good
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  Needs Improvement
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Assessment Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Vendor Rating Assessment Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">S.No</TableHead>
                <TableHead className="text-gray-300">Category</TableHead>
                <TableHead className="text-gray-300">Assessment Aspects</TableHead>
                <TableHead className="text-gray-300">Total Score</TableHead>
                <TableHead className="text-gray-300">Actual Score</TableHead>
                <TableHead className="text-gray-300">High %</TableHead>
                <TableHead className="text-gray-300">Low %</TableHead>
                <TableHead className="text-gray-300">Section Capability %</TableHead>
                <TableHead className="text-gray-300">Risk Section Total</TableHead>
                <TableHead className="text-gray-300">Risk Actual</TableHead>
                <TableHead className="text-gray-300">Risk Mitigation %</TableHead>
                <TableHead className="text-gray-300">Minor NC</TableHead>
                <TableHead className="text-gray-300">Major NC</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessmentData.map((row) => (
                <TableRow key={row.id} className="border-gray-700">
                  <TableCell className="text-gray-300">{row.id}</TableCell>
                  <TableCell className="text-gray-300 font-medium">{row.category}</TableCell>
                  <TableCell className="text-white">{row.assessmentAspects}</TableCell>
                  
                  <TableCell>
                    {editingRow === row.id ? (
                      <Input
                        type="number"
                        value={row.totalScore}
                        onChange={(e) => updateScore(row.id, 'totalScore', parseInt(e.target.value) || 0)}
                        className="w-16 h-8 bg-gray-700 border-gray-600 text-white text-sm"
                      />
                    ) : (
                      <span className="text-gray-300">{row.totalScore}</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editingRow === row.id ? (
                      <Input
                        type="number"
                        value={row.actualScore}
                        onChange={(e) => updateScore(row.id, 'actualScore', parseInt(e.target.value) || 0)}
                        className="w-16 h-8 bg-gray-700 border-gray-600 text-white text-sm"
                      />
                    ) : (
                      <span className="text-white font-medium">{row.actualScore}</span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-gray-300">{row.highThreshold}%</TableCell>
                  <TableCell className="text-gray-300">{row.lowThreshold}%</TableCell>
                  
                  <TableCell>
                    <span className={`font-medium ${getCapabilityColor(row.sectionwiseCapability)}`}>
                      {row.sectionwiseCapability.toFixed(2)}%
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    {editingRow === row.id ? (
                      <Input
                        type="number"
                        value={row.riskSectionTotal}
                        onChange={(e) => updateScore(row.id, 'riskSectionTotal', parseInt(e.target.value) || 0)}
                        className="w-16 h-8 bg-gray-700 border-gray-600 text-white text-sm"
                      />
                    ) : (
                      <span className="text-gray-300">{row.riskSectionTotal}</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editingRow === row.id ? (
                      <Input
                        type="number"
                        value={row.riskActualScore}
                        onChange={(e) => updateScore(row.id, 'riskActualScore', parseInt(e.target.value) || 0)}
                        className="w-16 h-8 bg-gray-700 border-gray-600 text-white text-sm"
                      />
                    ) : (
                      <span className="text-white">{row.riskActualScore}</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <span className={`font-medium ${getCapabilityColor(row.riskMitigation)}`}>
                      {row.riskMitigation.toFixed(2)}%
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    {editingRow === row.id ? (
                      <Input
                        type="number"
                        value={row.minorNC}
                        onChange={(e) => updateScore(row.id, 'minorNC', parseInt(e.target.value) || 0)}
                        className="w-16 h-8 bg-gray-700 border-gray-600 text-white text-sm"
                      />
                    ) : (
                      <Badge className={getNCBadgeColor(row.minorNC)}>{row.minorNC}</Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editingRow === row.id ? (
                      <Input
                        type="number"
                        value={row.majorNC}
                        onChange={(e) => updateScore(row.id, 'majorNC', parseInt(e.target.value) || 0)}
                        className="w-16 h-8 bg-gray-700 border-gray-600 text-white text-sm"
                      />
                    ) : (
                      <Badge className={getNCBadgeColor(row.majorNC)}>{row.majorNC}</Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Button
                      size="sm"
                      variant={editingRow === row.id ? "default" : "outline"}
                      onClick={() => setEditingRow(editingRow === row.id ? null : row.id)}
                      className="h-8 text-xs"
                    >
                      {editingRow === row.id ? 'Save' : 'Edit'}
                    </Button>
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