'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2, Edit2, X, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCalculators, useCreateCalculator, useDeleteCalculator, useUpdateCalculator } from '@/lib/api/hooks';


export default function CalculatorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    calcCategory: '',
    isTemplate: false,
    isPublic: false,
  });

  const { data, isLoading } = useCalculators({
    search: searchQuery || undefined,
  });

  const createCalculatorMutation = useCreateCalculator();
  const deleteCalculatorMutation = useDeleteCalculator();
  const updateCalculatorMutation = useUpdateCalculator();

  const handleCreateCalculator = async () => {
    try {
      const newCalc = await createCalculatorMutation.mutateAsync({
        name: 'New Calculator',
        description: 'Enter description...',
        calculatorType: 'single',
      });
      router.push(`/calculators/builder/${newCalc.id}`);
    } catch (error) {
      // Failed to create calculator
    }
  };

  const handleDeleteCalculator = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${name}"?`)) {
      try {
        await deleteCalculatorMutation.mutateAsync(id);
      } catch (error) {
        // Failed to delete calculator
      }
    }
  };

  const handleEditClick = (calc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(calc.id);
    setEditForm({
      name: calc.name,
      description: calc.description || '',
      calcCategory: calc.calcCategory || '',
      isTemplate: calc.isTemplate || false,
      isPublic: calc.isPublic || false,
    });
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateCalculatorMutation.mutateAsync({
        id,
        data: editForm,
      });
      setEditingId(null);
    } catch (error) {
      // Failed to update calculator
    }
  };

  const calculators = data?.calculators || [];

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Calculators</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {calculators.length} {calculators.length === 1 ? 'calculator' : 'calculators'}
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreateCalculator}
          disabled={createCalculatorMutation.isPending}
          variant="default"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>


      {/* Calculator List - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : calculators.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? 'No calculators found' : 'No calculators'}
            </p>
            {!searchQuery && (
              <Button
                onClick={handleCreateCalculator}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Calculator
              </Button>
            )}
          </div>
        ) : (
          calculators.map((calc) => {
            const isEditing = editingId === calc.id;

            return (
              <Card
                key={calc.id}
                className="border hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                onClick={() => router.push(`/calculators/builder/${calc.id}`)}
              >
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="space-y-3 flex-1">
                    {/* Header with Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="h-8 text-sm font-semibold"
                              placeholder="Calculator name"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : (
                          <h3 className="font-semibold text-base truncate">{calc.name}</h3>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => handleSaveEdit(calc.id, e)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={(e) => handleEditClick(calc, e)}
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => handleDeleteCalculator(calc.id, calc.name, e)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {calc.calcCategory && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {calc.calcCategory}
                        </Badge>
                      )}
                      {calc.isTemplate && (
                        <Badge variant="outline" className="text-xs bg-amber-400/10 text-amber-400 border-amber-400/20">
                          Template
                        </Badge>
                      )}
                      {calc.fields && calc.fields.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {calc.fields.length} Field{calc.fields.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    {/* Fields Preview - Compact */}
                    {calc.fields && calc.fields.length > 0 && (
                      <div className="border-t border-border pt-3 space-y-2 flex-1 overflow-hidden">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase">Fields</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {calc.fields.slice(0, 12).map((field: any, idx: number) => (
                            <div key={field.id || idx} className="space-y-1">
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0 mt-1.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm">{field.displayLabel || field.fieldName}</span>
                                    {field.unit && (
                                      <span className="text-xs text-muted-foreground">({field.unit})</span>
                                    )}
                                  </div>

                                  {/* Show formula for calculated fields */}
                                  {field.fieldType === 'calculated' && field.defaultValue && (
                                    <code className="text-xs bg-muted px-2 py-1 rounded text-primary block mt-1 break-all">
                                      {field.defaultValue}
                                    </code>
                                  )}

                                  {/* Show database source */}
                                  {field.fieldType === 'database_lookup' && field.dataSource && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      <span className="font-medium">Source:</span> {field.dataSource.replace('_', ' ')}
                                      {field.sourceField && <span> → {field.sourceField}</span>}
                                    </div>
                                  )}

                                  {/* Show default value for number fields */}
                                  {field.fieldType === 'number' && field.defaultValue && (
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      <span className="font-medium">Default:</span> {field.defaultValue}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {calc.fields.length > 12 && (
                            <div className="text-xs text-muted-foreground italic pl-4">
                              +{calc.fields.length - 12} more fields...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Footer */}
                    <div className="border-t border-border pt-3 mt-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/calculators/builder/${calc.id}`);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-2" />
                        Edit Calculator
                      </Button>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
