'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useBOMs } from '@/lib/api/hooks/useBOM';
import { useBOMItems } from '@/lib/api/hooks/useBOMItems';
import { ModelViewer } from '@/components/ui/model-viewer';
import { Viewer2D } from '@/components/ui/viewer-2d';
import { apiClient } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { BOMSelectionCard } from '@/components/features/process-planning/BOMSelectionCard';
import { RawMaterialsSection } from '@/components/features/process-planning/RawMaterialsSection';
import { ManufacturingProcessSection } from '@/components/features/process-planning/ManufacturingProcessSection';
import { PackagingLogisticsSection } from '@/components/features/process-planning/PackagingLogisticsSection';
import { ChildPartsSection } from '@/components/features/process-planning/ChildPartsSection';
import { ProcuredPartsSection } from '@/components/features/process-planning/ProcuredPartsSection';
import { ParentEstimatesSection } from '@/components/features/process-planning/ParentEstimatesSection';

export default function ProcessPlanningPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [selectedBomId, setSelectedBomId] = useState<string>('');
  const [selectedPartNumber, setSelectedPartNumber] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [file3dUrl, setFile3dUrl] = useState<string | null>(null);
  const [file2dUrl, setFile2dUrl] = useState<string | null>(null);


  const handleModelMeasurements = (data: any) => {
    // TODO: Use measurements for calculations
    console.log('Model measurements:', data);
  };

  // Fetch data
  const { data: bomsData } = useBOMs({ projectId });
  const boms = bomsData?.boms || [];

  const { data: bomItemsData } = useBOMItems(selectedBomId);
  const bomItems = bomItemsData?.items || [];
  const selectedItem = bomItems.find((item) => item.partNumber === selectedPartNumber);

  // Clear measurements when item changes
  useEffect(() => {
    // Clear measurements/cache when item changes
  }, [selectedItem?.id]);

  const handleBomChange = (bomId: string) => {
    setSelectedBomId(bomId);
    setSelectedPartNumber('');
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const handleCreateRoute = () => {
    console.log('Creating route for:', selectedPartNumber);
  };

  // Load file URLs
  useEffect(() => {
    if (!selectedItem) {
      setFile3dUrl(null);
      setFile2dUrl(null);
      return;
    }

    const loadFile3dUrl = async () => {
      try {
        if (selectedItem.file3dPath) {
          const response = await apiClient.get<{ url: string }>(`/bom-items/${selectedItem.id}/file-url/3d`);
          setFile3dUrl(response.url);
        } else {
          setFile3dUrl(null);
        }
      } catch (error) {
        console.error('Failed to load 3D file URL:', error);
        setFile3dUrl(null);
      }
    };

    const loadFile2dUrl = async () => {
      try {
        if (selectedItem.file2dPath) {
          const response = await apiClient.get<{ url: string }>(`/bom-items/${selectedItem.id}/file-url/2d`);
          setFile2dUrl(response.url);
        } else {
          setFile2dUrl(null);
        }
      } catch (error) {
        console.error('Failed to load 2D file URL:', error);
        setFile2dUrl(null);
      }
    };

    loadFile3dUrl();
    loadFile2dUrl();
  }, [selectedItem]);

  // Transform BOM items to match BOMSelectionCard expected format
  const transformedBoms = boms.map(bom => ({
    ...bom,
    items: bomItems
      .filter(item => item.bomId === bom.id)
      .map(item => ({
        id: item.id,
        partNumber: item.partNumber || item.id,
        description: item.name,
        itemType: (item.itemType || 'child_part') as 'assembly' | 'sub_assembly' | 'child_part',
        status: 'pending' as const, // You can map this from your actual data if available
      })),
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* PAGE HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Process Planning & Costing</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Simplified workflow for creating manufacturing process routes
            </p>
          </div>
          {selectedPartNumber && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Current Part:</span>
              <Badge variant="default" className="text-xs">
                {selectedPartNumber}
              </Badge>
            </div>
          )}
        </div>

        {/* BOM SELECTION CARD WITH FILTERS */}
        <BOMSelectionCard
          boms={transformedBoms}
          selectedBomId={selectedBomId}
          selectedPartNumber={selectedPartNumber}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          onBomChange={handleBomChange}
          onPartChange={setSelectedPartNumber}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onTypeFilterChange={setTypeFilter}
          onCreateRoute={handleCreateRoute}
        />

        {/* PROCESS PLANNING SECTIONS - Only show if part is selected */}
        {selectedPartNumber && selectedItem && (
          <>
            {/* Selected Part Details Card */}
            <div className="card border-l-4 border-l-green-500 shadow-md rounded-lg overflow-hidden">
              <div className="bg-green-500 py-2 px-4">
                <h6 className="m-0 font-semibold text-white text-xs">
                  Creating Process Plan For
                </h6>
              </div>
              <div className="bg-card p-3">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Part Number</p>
                    <p className="text-sm font-semibold">{selectedItem.partNumber || selectedItem.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm font-semibold">{selectedItem.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <Badge variant="outline" className="text-xs">
                      {(selectedItem.itemType || 'child_part').replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Material</p>
                    <p className="text-sm font-semibold">{selectedItem.material || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3D MODEL & 2D DRAWING VIEWERS */}
            <div className="border border-border rounded-lg overflow-hidden shadow-md">
              <div className="bg-primary p-3">
                <h2 className="text-sm font-semibold text-primary-foreground">3D Model & 2D Drawing Viewers</h2>
              </div>
              <div className="bg-card p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 3D Viewer */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">3D Model (.STEP)</h3>
                    <div className="aspect-square bg-secondary border border-border rounded flex items-center justify-center overflow-hidden">
                      {selectedItem.file3dPath && file3dUrl ? (
                        <ModelViewer
                          fileUrl={file3dUrl}
                          fileName={selectedItem.file3dPath.split('/').pop() || selectedItem.name || 'model'}
                          fileType={selectedItem.file3dPath.split('.').pop() || 'step'}
                          bomItemId={selectedItem.id}
                          onMeasurements={handleModelMeasurements}
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <p className="text-sm">No 3D file available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2D Viewer */}
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">2D Drawing (PDF/Image)</h3>
                    <div className="aspect-square bg-secondary border border-border rounded flex items-center justify-center overflow-hidden">
                      {selectedItem.file2dPath && file2dUrl ? (
                        <Viewer2D
                          fileUrl={file2dUrl}
                          fileName={selectedItem.file2dPath.split('/').pop() || selectedItem.name || 'drawing'}
                          fileType={
                            selectedItem.file2dPath.toLowerCase().endsWith('.pdf')
                              ? 'pdf'
                              : ['.png', '.jpg', '.jpeg', '.webp'].some((ext) =>
                                selectedItem.file2dPath?.toLowerCase().endsWith(ext)
                              )
                                ? 'img'
                                : 'other'
                          }
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <p className="text-sm">No 2D drawing available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw Materials Section */}
            <RawMaterialsSection />

            {/* Manufacturing Process Section */}
            <ManufacturingProcessSection />

            {/* Packaging & Logistics Section */}
            <PackagingLogisticsSection />

            {/* Child Parts Section - Only show for assembly and sub_assembly */}
            {selectedItem && selectedItem.itemType !== 'child_part' && (
              <ChildPartsSection />
            )}

            {/* Procured Parts Section */}
            <ProcuredPartsSection />

            {/* Parent Estimates Section */}
            <ParentEstimatesSection />

            {/* Action Buttons */}
            <div className="flex items-center justify-between p-4 bg-card border-l-4 border-l-primary rounded-lg shadow-md">
              <div>
                <p className="text-sm font-semibold">Complete Process Plan</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All sections above will be saved for part: {selectedPartNumber}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline">Save as Draft</Button>
                <Button>Save & Calculate Cost</Button>
              </div>
            </div>
          </>
        )}

        {/* Empty State - No Part Selected */}
        {!selectedPartNumber && selectedBomId && (
          <div className="text-center py-12 bg-card border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground mb-2 text-sm font-semibold">
              No Part Selected
            </p>
            <p className="text-xs text-muted-foreground">
              Use the filters and dropdown above to find and select a part
            </p>
          </div>
        )}

        {/* Empty State - No BOM Selected */}
        {!selectedBomId && (
          <div className="text-center py-12 bg-card border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground mb-2 text-sm font-semibold">
              No BOM Selected
            </p>
            <p className="text-xs text-muted-foreground">
              Select a BOM from the dropdown above to begin
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
