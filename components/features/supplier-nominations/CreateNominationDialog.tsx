'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  CheckCircle,
  Award,
  Factory,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useCreateSupplierNomination } from '@/lib/api/hooks/useSupplierNominations';
import { useVendors } from '@/lib/api/hooks/useVendors';
import { useRfqTrackingRecords } from '@/lib/api/hooks/useRfqTracking';
import { useSupplierEvaluations } from '@/lib/api/hooks/useSupplierEvaluation';
import {
  NominationType,
  type CreateSupplierNominationData
} from '@/lib/api/supplier-nominations';

interface CreateNominationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  evaluationGroupId?: string;
  onSuccess?: (nominationId: string) => void;
}

export function CreateNominationDialog({
  open,
  onOpenChange,
  projectId,
  evaluationGroupId,
  onSuccess
}: CreateNominationDialogProps) {
  const [nominationName, setNominationName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);

  const createNominationMutation = useCreateSupplierNomination();

  // Static queries to prevent re-renders
  const { data: vendorsResponse } = useVendors({ status: 'active', limit: 1000 });
  const { data: rfqTrackingRecords = [] } = useRfqTrackingRecords(projectId);
  const { data: supplierEvaluations = [] } = useSupplierEvaluations({ projectId });

  const vendors = vendorsResponse?.vendors || [];

  // Stable approved vendors calculation
  const approvedVendors = useMemo(() => {
    const approvedVendorIds = new Set<string>();

    // Add vendors from supplier evaluations
    supplierEvaluations.forEach(evaluation => {
      if (evaluation?.status === 'completed' ||
          evaluation?.status === 'approved' ||
          evaluation?.recommendationStatus === 'recommended') {
        if (evaluation.vendorId) {
          approvedVendorIds.add(evaluation.vendorId);
        }
      }
    });

    // Add vendors from RFQ tracking
    rfqTrackingRecords.forEach(record => {
      if (record?.vendors && Array.isArray(record.vendors)) {
        record.vendors.forEach(vendor => {
          if (vendor?.id) {
            approvedVendorIds.add(vendor.id);
          }
        });
      }
    });

    return vendors.filter(vendor => vendor?.id && approvedVendorIds.has(vendor.id));
  }, [vendors, supplierEvaluations, rfqTrackingRecords]);

  // Stable vendor stats calculation
  const vendorStats = useMemo(() => {
    const stats = new Map();
    rfqTrackingRecords.forEach(record => {
      if (record?.vendors && Array.isArray(record.vendors)) {
        record.vendors.forEach(vendor => {
          if (vendor?.responded && vendor?.quoteAmount && vendor?.id) {
            const existing = stats.get(vendor.id) || { responseCount: 0, totalQuotes: 0 };
            existing.responseCount++;
            existing.totalQuotes += vendor.quoteAmount;
            existing.avgQuote = existing.totalQuotes / existing.responseCount;
            stats.set(vendor.id, existing);
          }
        });
      }
    });
    return stats;
  }, [rfqTrackingRecords]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setNominationName('');
      setDescription('');
      setSelectedVendorIds([]);
    }
  }, [open]);

  const handleVendorToggle = useCallback((vendorId: string) => {
    setSelectedVendorIds(prev => {
      if (prev.includes(vendorId)) {
        return prev.filter(id => id !== vendorId);
      } else {
        return [...prev, vendorId];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allVendorIds = approvedVendors.map(v => v.id).filter(Boolean);
    setSelectedVendorIds(prev => 
      prev.length === allVendorIds.length ? [] : allVendorIds
    );
  }, [approvedVendors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nominationName.trim()) {
      toast.error('Please enter a nomination name');
      return;
    }

    if (selectedVendorIds.length === 0) {
      toast.error('Please select at least one vendor');
      return;
    }

    const formData: CreateSupplierNominationData = {
      nominationName: nominationName.trim(),
      description: description.trim(),
      nominationType: NominationType.MANUFACTURER, // Fixed value since field was removed
      projectId,
      evaluationGroupId,
      vendorIds: selectedVendorIds
    };

    try {
      const result = await createNominationMutation.mutateAsync(formData);
      
      if (result?.id) {
        onSuccess?.(result.id);
      }
      onOpenChange(false);
      toast.success('Supplier nomination created successfully');
    } catch (error: any) {
      console.error('Create nomination error:', error);
      const errorMessage = error?.message || error?.response?.data?.error?.message || error?.response?.data?.message || 'Failed to create nomination';
      toast.error(errorMessage);
    }
  };

  const getVendorTypeIcon = (vendorType?: string) => {
    switch (vendorType?.toLowerCase()) {
      case 'oem':
        return <Award className="h-4 w-4 text-blue-400" />;
      case 'manufacturer':
        return <Factory className="h-4 w-4 text-green-400" />;
      default:
        return <Building2 className="h-4 w-4 text-gray-400" />;
    }
  };

  const getReliabilityBadge = (stats: any) => {
    if (!stats) return null;

    const responseRate = stats.responseCount || 0;
    if (responseRate >= 3) {
      return <Badge variant="outline" className="border-green-500 text-green-400">Highly Reliable</Badge>;
    } else if (responseRate >= 2) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-400">Reliable</Badge>;
    }
    return <Badge variant="outline" className="border-gray-500 text-gray-400">New Vendor</Badge>;
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/80"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-white">Create Supplier Nomination</h2>
              <p className="text-sm text-gray-400 mt-1">
                Create a new supplier nomination from approved RFQ vendors for evaluation and scoring.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nomination Name *
                </label>
                <Input
                  value={nominationName}
                  onChange={(e) => setNominationName(e.target.value)}
                  placeholder="e.g., Q2 2026 OEM Selection"
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter nomination description and objectives..."
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">
                    Select Approved Vendors ({approvedVendors.length} available)
                  </h3>
                  {approvedVendors.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      {selectedVendorIds.length === approvedVendors.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </div>

                {approvedVendors.length === 0 ? (
                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-6 text-center">
                      <div className="text-gray-400 mb-2">No approved vendors found</div>
                      <div className="text-sm text-gray-500">
                        Complete RFQ evaluations first to nominate vendors
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {approvedVendors.map((vendor) => {
                      if (!vendor?.id) return null;

                      const stats = vendorStats.get(vendor.id);
                      const isSelected = selectedVendorIds.includes(vendor.id);

                      return (
                        <Card
                          key={vendor.id}
                          className={`cursor-pointer transition-all duration-200 ${isSelected
                            ? 'bg-blue-900/50 border-blue-500'
                            : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                            }`}
                          onClick={() => handleVendorToggle(vendor.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={`w-4 h-4 mt-1 rounded border-2 flex items-center justify-center cursor-pointer ${
                                  isSelected 
                                    ? 'bg-blue-600 border-blue-600' 
                                    : 'border-gray-400 bg-transparent'
                                }`}>
                                  {isSelected && (
                                    <CheckCircle className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getVendorTypeIcon(vendor.vendorType)}
                                    <h4 className="font-medium text-white">{vendor.name || 'Unknown Vendor'}</h4>
                                  </div>

                                  <div className="space-y-2">
                                    {vendor.companyEmail && (
                                      <p className="text-sm text-gray-400">{vendor.companyEmail}</p>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                      {getReliabilityBadge(stats)}

                                      {stats && (
                                        <Badge variant="secondary" className="text-xs">
                                          {stats.responseCount} RFQ responses
                                        </Badge>
                                      )}
                                    </div>

                                    {vendor.process && Array.isArray(vendor.process) && vendor.process.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {vendor.process.slice(0, 3).map((process: string, idx: number) => (
                                          <Badge key={idx} variant="outline" className="text-xs border-gray-500 text-gray-400">
                                            {process}
                                          </Badge>
                                        ))}
                                        {vendor.process.length > 3 && (
                                          <Badge variant="outline" className="text-xs border-gray-500 text-gray-400">
                                            +{vendor.process.length - 3} more
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {isSelected && (
                                <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedVendorIds.length > 0 && (
                <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <div className="text-sm text-blue-400">
                    <strong>{selectedVendorIds.length}</strong> vendor(s) selected for nomination
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  disabled={createNominationMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createNominationMutation.isPending ||
                    selectedVendorIds.length === 0 ||
                    !nominationName.trim()
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {createNominationMutation.isPending ? 'Creating...' : 'Create Nomination'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}