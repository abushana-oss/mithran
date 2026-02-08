'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { costEngine, CostCalculationResult } from '@/lib/services/cost-engine';

interface CostDataContextType {
  bomCosts: Map<string, CostCalculationResult[]>;
  aggregatedData: any;
  isCalculating: boolean;
  calculateBomCosts: (bomId: string, itemCount?: number) => Promise<void>;
  getCostData: (bomId: string) => CostCalculationResult[] | null;
  getAggregatedData: (bomId: string) => any | null;
  clearCache: () => void;
}

const CostDataContext = createContext<CostDataContextType | undefined>(undefined);

interface CostDataProviderProps {
  children: ReactNode;
}

export const CostDataProvider: React.FC<CostDataProviderProps> = ({ children }) => {
  const [bomCosts, setBomCosts] = useState<Map<string, CostCalculationResult[]>>(new Map());
  const [aggregatedData, setAggregatedData] = useState<Map<string, any>>(new Map());
  const [isCalculating, setIsCalculating] = useState(false);

  /**
   * Calculate comprehensive cost data for a BOM
   */
  const calculateBomCosts = async (bomId: string, itemCount: number = 2): Promise<void> => {
    setIsCalculating(true);
    
    try {
      // Simulate API delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const itemCosts: CostCalculationResult[] = [];
      
      // Generate sample costs for different item types
      const itemTypes = ['assembly', 'sub_assembly', 'child_part'];
      
      for (let i = 0; i < itemCount; i++) {
        const itemType = itemTypes[i % itemTypes.length];
        const costData = costEngine.generateSampleCostData(itemType);
        
        // Add some variation to make data more realistic
        const variation = 0.8 + (Math.random() * 0.4); // 80% to 120%
        costData.breakdown.rawMaterialCost *= variation;
        costData.breakdown.processCost *= variation;
        costData.breakdown.totalCost *= variation;
        costData.breakdown.sellingPrice *= variation;
        
        // Recalculate dependent values
        costData.breakdown.sgaCost = costData.breakdown.totalCost * 0.125;
        costData.breakdown.profitAmount = (costData.breakdown.totalCost + costData.breakdown.sgaCost) * 0.08;
        costData.breakdown.sellingPrice = costData.breakdown.totalCost + costData.breakdown.sgaCost + costData.breakdown.profitAmount;
        
        itemCosts.push(costData);
      }
      
      // Store individual item costs
      setBomCosts(prev => new Map(prev.set(bomId, itemCosts)));
      
      // Calculate and store aggregated data
      const aggregated = costEngine.aggregateBomCosts(itemCosts);
      setAggregatedData(prev => new Map(prev.set(bomId, aggregated)));
      
    } catch (error) {
      console.error('Failed to calculate BOM costs:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Get calculated cost data for a specific BOM
   */
  const getCostData = (bomId: string): CostCalculationResult[] | null => {
    return bomCosts.get(bomId) || null;
  };

  /**
   * Get aggregated cost data for a specific BOM
   */
  const getAggregatedData = (bomId: string): any | null => {
    return aggregatedData.get(bomId) || null;
  };

  /**
   * Clear all cached cost data
   */
  const clearCache = (): void => {
    setBomCosts(new Map());
    setAggregatedData(new Map());
  };

  const contextValue: CostDataContextType = {
    bomCosts,
    aggregatedData: Object.fromEntries(aggregatedData),
    isCalculating,
    calculateBomCosts,
    getCostData,
    getAggregatedData,
    clearCache,
  };

  return (
    <CostDataContext.Provider value={contextValue}>
      {children}
    </CostDataContext.Provider>
  );
};

/**
 * Hook to use cost data context
 */
export const useCostData = (): CostDataContextType => {
  const context = useContext(CostDataContext);
  if (!context) {
    throw new Error('useCostData must be used within a CostDataProvider');
  }
  return context;
};