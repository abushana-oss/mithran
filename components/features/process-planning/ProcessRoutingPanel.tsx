'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  DollarSign,
  Clock,
  FileText,
  Trash2,
  Calculator,
  Layers
} from 'lucide-react';
import { useProcessRoutes, useDeleteProcessRoute, useCalculateRouteCost } from '@/lib/api/hooks/useProcessRoutes';
import { ProcessRouteDialog } from './ProcessRouteDialog';
import { ProcessStepsList } from './ProcessStepsList';
import { MaterialSelectionCard } from './MaterialSelectionCard';

interface ProcessRoutingPanelProps {
  bomItemId: string;
  currentMaterialId?: string;
}

export function ProcessRoutingPanel({ bomItemId, currentMaterialId }: ProcessRoutingPanelProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: routesData, isLoading: routesLoading } = useProcessRoutes({ bomItemId });
  const routes = routesData?.routes || [];

  const deleteRouteMutation = useDeleteProcessRoute();
  const calculateCostMutation = useCalculateRouteCost();

  const handleDeleteRoute = (routeId: string) => {
    if (confirm('Are you sure you want to delete this process route? All steps will be removed.')) {
      deleteRouteMutation.mutate(routeId);
    }
  };

  const handleCalculateCost = (routeId: string) => {
    calculateCostMutation.mutate(routeId);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return '0 min';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  if (routesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-muted-foreground">Loading process routes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Material Selection Section */}
      <MaterialSelectionCard
        bomItemId={bomItemId}
        currentMaterialId={currentMaterialId}
      />

      <Separator />

      {/* Process Routes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Process Routes
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Define manufacturing operations and sequences
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Route
          </Button>
        </div>

        {routes.length === 0 ? (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              No process routes defined yet. Create a route to start planning manufacturing operations.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {routes.map((route) => (
              <Card key={route.id} className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{route.name}</CardTitle>
                      {route.description && (
                        <CardDescription className="mt-1">{route.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCalculateCost(route.id)}
                        disabled={calculateCostMutation.isPending}
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate Cost
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRoute(route.id)}
                        disabled={deleteRouteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Cost Summary */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="text-xs text-muted-foreground">Total Cost</div>
                        <div className="font-semibold text-green-700">
                          {formatCurrency(route.totalCost)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-xs text-muted-foreground">Setup Time</div>
                        <div className="font-semibold text-blue-700">
                          {formatTime(route.totalSetupTimeMinutes)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="text-xs text-muted-foreground">Cycle Time</div>
                        <div className="font-semibold text-orange-700">
                          {formatTime(route.totalCycleTimeMinutes)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <ProcessStepsList
                    routeId={route.id}
                    steps={route.steps || []}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Route Dialog */}
      <ProcessRouteDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        bomItemId={bomItemId}
      />
    </div>
  );
}
