'use client';

import React, { useState, useMemo } from 'react';
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
  DollarSign,
  TrendingDown,
  TrendingUp,
  Award,
  Calculator,
  BarChart3
} from 'lucide-react';

export interface CostCompetencyData {
  id: number;
  costComponent: string;
  baseValue?: number;
  supplier1: number;
  supplier2: number;
  supplier3: number;
  supplier4: number;
  isRanking?: boolean;
  unit?: string;
  paymentTerms?: {
    supplier1: string;
    supplier2: string;
    supplier3: string;
    supplier4: string;
  };
}

const mockCostData: CostCompetencyData[] = [
  {
    id: 1,
    costComponent: "Raw Material Cost",
    baseValue: 2.52,
    supplier1: 3.00,
    supplier2: 2.80,
    supplier3: 3.80,
    supplier4: 2.70,
    unit: "₹"
  },
  {
    id: 2,
    costComponent: "Process Cost",
    baseValue: 2.52,
    supplier1: 0.60,
    supplier2: 0.84,
    supplier3: 0.67,
    supplier4: 0.73,
    unit: "₹"
  },
  {
    id: 3,
    costComponent: "Overheads & Profit",
    supplier1: 0.60,
    supplier2: 0.84,
    supplier3: 0.67,
    supplier4: 0.63,
    unit: "₹"
  },
  {
    id: 4,
    costComponent: "Packing & Forwarding Cost",
    baseValue: 0.20,
    supplier1: 0.26,
    supplier2: 0.22,
    supplier3: 0.13,
    supplier4: 0.26,
    unit: "₹"
  },
  {
    id: 5,
    costComponent: "Total cost/unit",
    supplier1: 5.85,
    supplier2: 6.70,
    supplier3: 6.50,
    supplier4: 7.06,
    unit: "₹"
  },
  {
    id: 6,
    costComponent: "Payment Terms",
    paymentTerms: {
      supplier1: "100% Advance",
      supplier2: "30 Days credit",
      supplier3: "Against delivery",
      supplier4: "50% ADP +50% AD"
    }
  },
  {
    id: 7,
    costComponent: "Net Price/unit",
    supplier1: 7.08,
    supplier2: 7.01,
    supplier3: 7.51,
    supplier4: 7.14,
    unit: "₹"
  },
  {
    id: 8,
    costComponent: "Price/unit - Ranking",
    supplier1: 2,
    supplier2: 1,
    supplier3: 4,
    supplier4: 3,
    isRanking: true
  },
  {
    id: 9,
    costComponent: "Development cost",
    supplier1: 4.00,
    supplier2: 4.50,
    supplier3: 3.00,
    supplier4: 2.00,
    unit: "Lakhs"
  },
  {
    id: 10,
    costComponent: "Development Cost - Ranking",
    supplier1: 3,
    supplier2: 4,
    supplier3: 2,
    supplier4: 1,
    isRanking: true
  },
  {
    id: 11,
    costComponent: "Financial Risk",
    supplier1: 0.08,
    supplier2: 0.12,
    supplier3: 0.05,
    supplier4: 0.15,
    unit: "%"
  },
  {
    id: 12,
    costComponent: "Financial Risk/Stability - Rank",
    supplier1: 2,
    supplier2: 3,
    supplier3: 1,
    supplier4: 4,
    isRanking: true
  },
  {
    id: 13,
    costComponent: "Overall Ranking",
    supplier1: 2.00,
    supplier2: 4.00,
    supplier3: 3.00,
    supplier4: 1.00,
    isRanking: true
  },
  {
    id: 14,
    costComponent: "Cost Competency Score",
    supplier1: 2.60,
    supplier2: 2.80,
    supplier3: 2.50,
    supplier4: 2.90,
    unit: "Score"
  }
];

interface CostCompetencyAnalysisProps {
  nominationId?: string;
  onDataUpdate?: (data: CostCompetencyData[]) => void;
}

export function CostCompetencyAnalysis({ nominationId, onDataUpdate }: CostCompetencyAnalysisProps) {
  const [costData, setCostData] = useState<CostCompetencyData[]>(mockCostData);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const supplierSummary = useMemo(() => {
    const overallRanking = costData.find(item => item.costComponent === "Overall Ranking");
    const competencyScore = costData.find(item => item.costComponent === "Cost Competency Score");
    const netPrice = costData.find(item => item.costComponent === "Net Price/unit");
    const devCost = costData.find(item => item.costComponent === "Development cost");
    
    return {
      supplier1: {
        rank: overallRanking?.supplier1 || 0,
        score: competencyScore?.supplier1 || 0,
        netPrice: netPrice?.supplier1 || 0,
        devCost: devCost?.supplier1 || 0
      },
      supplier2: {
        rank: overallRanking?.supplier2 || 0,
        score: competencyScore?.supplier2 || 0,
        netPrice: netPrice?.supplier2 || 0,
        devCost: devCost?.supplier2 || 0
      },
      supplier3: {
        rank: overallRanking?.supplier3 || 0,
        score: competencyScore?.supplier3 || 0,
        netPrice: netPrice?.supplier3 || 0,
        devCost: devCost?.supplier3 || 0
      },
      supplier4: {
        rank: overallRanking?.supplier4 || 0,
        score: competencyScore?.supplier4 || 0,
        netPrice: netPrice?.supplier4 || 0,
        devCost: devCost?.supplier4 || 0
      }
    };
  }, [costData]);

  const updateValue = (id: number, supplier: 'supplier1' | 'supplier2' | 'supplier3' | 'supplier4', value: number) => {
    setCostData(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [supplier]: value };
      }
      return item;
    }));
  };

  const getRankingColor = (rank: number) => {
    switch(rank) {
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
    const bestRank = Math.min(
      supplierSummary.supplier1.rank,
      supplierSummary.supplier2.rank,
      supplierSummary.supplier3.rank,
      supplierSummary.supplier4.rank
    );
    
    if (supplierSummary.supplier1.rank === bestRank) return 'Supplier-1';
    if (supplierSummary.supplier2.rank === bestRank) return 'Supplier-2';
    if (supplierSummary.supplier3.rank === bestRank) return 'Supplier-3';
    return 'Supplier-4';
  };

  return (
    <div className="space-y-6">
      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Best Supplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{getBestSupplier()}</div>
            <p className="text-xs text-gray-400 mt-1">Overall Winner</p>
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
              ₹{Math.min(
                supplierSummary.supplier1.netPrice,
                supplierSummary.supplier2.netPrice,
                supplierSummary.supplier3.netPrice,
                supplierSummary.supplier4.netPrice
              ).toFixed(2)}
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
              {Math.max(
                supplierSummary.supplier1.score,
                supplierSummary.supplier2.score,
                supplierSummary.supplier3.score,
                supplierSummary.supplier4.score
              ).toFixed(1)}
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
              ₹{Math.min(
                supplierSummary.supplier1.devCost,
                supplierSummary.supplier2.devCost,
                supplierSummary.supplier3.devCost,
                supplierSummary.supplier4.devCost
              ).toFixed(1)}L
            </div>
            <p className="text-xs text-gray-400 mt-1">Lowest Cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Competency Analysis Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Competency Score & Financial Stability Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300 font-medium">Cost Component</TableHead>
                <TableHead className="text-center text-gray-300 font-medium">Base/Reference</TableHead>
                <TableHead className="text-center text-blue-400 font-medium">Supplier-1</TableHead>
                <TableHead className="text-center text-green-400 font-medium">Supplier-2</TableHead>
                <TableHead className="text-center text-yellow-400 font-medium">Supplier-3</TableHead>
                <TableHead className="text-center text-purple-400 font-medium">Supplier-4</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costData.map((row) => (
                <TableRow key={row.id} className="border-gray-700">
                  <TableCell className="text-white font-medium">{row.costComponent}</TableCell>
                  
                  <TableCell className="text-center text-gray-300">
                    {row.baseValue ? `${row.unit || ''}${row.baseValue}` : '-'}
                  </TableCell>
                  
                  {/* Supplier 1 */}
                  <TableCell className="text-center">
                    {row.paymentTerms ? (
                      <span className="text-blue-400 text-xs">{row.paymentTerms.supplier1}</span>
                    ) : editingRow === row.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={row.supplier1}
                        onChange={(e) => updateValue(row.id, 'supplier1', parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 bg-gray-700 border-gray-600 text-white text-sm text-center"
                      />
                    ) : row.isRanking ? (
                      <Badge className={`${getRankingColor(row.supplier1)} flex items-center gap-1 justify-center w-12`}>
                        {getRankingIcon(row.supplier1)}
                        {row.supplier1}
                      </Badge>
                    ) : (
                      <span className="text-blue-400 font-medium">
                        {row.unit && row.unit !== 'Score' ? row.unit : ''}{row.supplier1}{row.unit === 'Score' ? '' : ''}
                      </span>
                    )}
                  </TableCell>
                  
                  {/* Supplier 2 */}
                  <TableCell className="text-center">
                    {row.paymentTerms ? (
                      <span className="text-green-400 text-xs">{row.paymentTerms.supplier2}</span>
                    ) : editingRow === row.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={row.supplier2}
                        onChange={(e) => updateValue(row.id, 'supplier2', parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 bg-gray-700 border-gray-600 text-white text-sm text-center"
                      />
                    ) : row.isRanking ? (
                      <Badge className={`${getRankingColor(row.supplier2)} flex items-center gap-1 justify-center w-12`}>
                        {getRankingIcon(row.supplier2)}
                        {row.supplier2}
                      </Badge>
                    ) : (
                      <span className="text-green-400 font-medium">
                        {row.unit && row.unit !== 'Score' ? row.unit : ''}{row.supplier2}{row.unit === 'Score' ? '' : ''}
                      </span>
                    )}
                  </TableCell>
                  
                  {/* Supplier 3 */}
                  <TableCell className="text-center">
                    {row.paymentTerms ? (
                      <span className="text-yellow-400 text-xs">{row.paymentTerms.supplier3}</span>
                    ) : editingRow === row.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={row.supplier3}
                        onChange={(e) => updateValue(row.id, 'supplier3', parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 bg-gray-700 border-gray-600 text-white text-sm text-center"
                      />
                    ) : row.isRanking ? (
                      <Badge className={`${getRankingColor(row.supplier3)} flex items-center gap-1 justify-center w-12`}>
                        {getRankingIcon(row.supplier3)}
                        {row.supplier3}
                      </Badge>
                    ) : (
                      <span className="text-yellow-400 font-medium">
                        {row.unit && row.unit !== 'Score' ? row.unit : ''}{row.supplier3}{row.unit === 'Score' ? '' : ''}
                      </span>
                    )}
                  </TableCell>
                  
                  {/* Supplier 4 */}
                  <TableCell className="text-center">
                    {row.paymentTerms ? (
                      <span className="text-purple-400 text-xs">{row.paymentTerms.supplier4}</span>
                    ) : editingRow === row.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={row.supplier4}
                        onChange={(e) => updateValue(row.id, 'supplier4', parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 bg-gray-700 border-gray-600 text-white text-sm text-center"
                      />
                    ) : row.isRanking ? (
                      <Badge className={`${getRankingColor(row.supplier4)} flex items-center gap-1 justify-center w-12`}>
                        {getRankingIcon(row.supplier4)}
                        {row.supplier4}
                      </Badge>
                    ) : (
                      <span className="text-purple-400 font-medium">
                        {row.unit && row.unit !== 'Score' ? row.unit : ''}{row.supplier4}{row.unit === 'Score' ? '' : ''}
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {!row.paymentTerms && (
                      <Button
                        size="sm"
                        variant={editingRow === row.id ? "default" : "outline"}
                        onClick={() => setEditingRow(editingRow === row.id ? null : row.id)}
                        className="h-8 text-xs"
                      >
                        {editingRow === row.id ? 'Save' : 'Edit'}
                      </Button>
                    )}
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