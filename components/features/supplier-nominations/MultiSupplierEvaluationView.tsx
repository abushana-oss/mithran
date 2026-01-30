'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye,
  BarChart3,
  AlertTriangle,
  Factory,
  TrendingUp
} from 'lucide-react';

interface SupplierData {
  id: number;
  name: string;
  status: string;
  vendorType: string;
  score: number;
  costCompetency: number;
  vendorRating: number;
  capabilityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  minorNC: number;
  majorNC: number;
}

const mockSuppliers: SupplierData[] = [
  {
    id: 1,
    name: 'EMUSKI',
    status: 'PENDING',
    vendorType: 'MANUFACTURER',
    score: 0,
    costCompetency: 0,
    vendorRating: 0,
    capabilityScore: 0,
    riskLevel: 'MEDIUM',
    minorNC: 0,
    majorNC: 0
  },
  {
    id: 2,
    name: 'Samay forge',
    status: 'PENDING',
    vendorType: 'MANUFACTURER',
    score: 0,
    costCompetency: 0,
    vendorRating: 0,
    capabilityScore: 0,
    riskLevel: 'MEDIUM',
    minorNC: 0,
    majorNC: 0
  },
  {
    id: 3,
    name: 'Proactive Polymers',
    status: 'PENDING',
    vendorType: 'MANUFACTURER',
    score: 0,
    costCompetency: 0,
    vendorRating: 0,
    capabilityScore: 0,
    riskLevel: 'MEDIUM',
    minorNC: 0,
    majorNC: 0
  }
];

interface MultiSupplierEvaluationViewProps {
  onEvaluateSupplier: (supplierId: number) => void;
  onViewDetails: (supplierId: number) => void;
}

export function MultiSupplierEvaluationView({ 
  onEvaluateSupplier, 
  onViewDetails 
}: MultiSupplierEvaluationViewProps) {
  const [suppliers] = useState<SupplierData[]>(mockSuppliers);

  const getRiskLevelColor = (level: string) => {
    switch(level) {
      case 'LOW': return 'bg-green-500/20 text-green-400 border-green-500';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'HIGH': return 'bg-red-500/20 text-red-400 border-red-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'bg-green-500/20 text-green-400 border-green-500';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Supplier Evaluation Dashboard</h1>
            <p className="text-gray-300 mt-1">
              Comprehensive evaluation of {suppliers.length} suppliers
            </p>
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="space-y-4">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  
                  {/* Supplier Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {supplier.id}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white">{supplier.name}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge className={getStatusColor(supplier.status)}>
                          {supplier.status}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Factory className="h-3 w-3" />
                          {supplier.vendorType}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Score Section */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{supplier.score}</div>
                    <div className="text-sm text-gray-400">Score</div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{supplier.costCompetency}%</div>
                      <div className="text-xs text-gray-400">Cost Competancy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{supplier.vendorRating}%</div>
                      <div className="text-xs text-gray-400">Vendor Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{supplier.capabilityScore}%</div>
                      <div className="text-xs text-gray-400">Capability score</div>
                    </div>
                  </div>

                  {/* Risk & NC Info */}
                  <div className="text-center">
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-400">Risk Level</div>
                        <Badge className={getRiskLevelColor(supplier.riskLevel)}>
                          {supplier.riskLevel}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-white">
                          NC: {supplier.minorNC}M / {supplier.majorNC}Mj
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDetails(supplier.id)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Details
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => onEvaluateSupplier(supplier.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Evaluate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{suppliers.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Pending Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {suppliers.filter(s => s.status === 'PENDING').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {(suppliers.reduce((sum, s) => sum + s.score, 0) / suppliers.length).toFixed(1)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Medium Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {suppliers.filter(s => s.riskLevel === 'MEDIUM').length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}