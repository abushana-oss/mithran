'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState } from 'react';
import { Loader2, Download, RotateCcw, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

/**
 * Production-Ready 3D Model Viewer
 *
 * Industry Standards 2025-2026:
 * - Dynamic imports for code splitting
 * - Error boundaries for graceful failures
 * - Progressive enhancement
 * - Accessibility support
 * - Performance optimized
 */

// Professional eDrawings-Style CAD Viewer
const EDrawingsViewer = dynamic(
  () => import('./edrawings-viewer').then((mod) => mod.EDrawingsViewer),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#2d2d2d]">
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin" />
          <p className="text-sm font-medium">Initializing 3D viewer...</p>
          <p className="text-xs text-gray-300 mt-1">Loading WebGL engine</p>
        </div>
      </div>
    ),
  }
);

interface ModelViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  bomItemId?: string; // For triggering conversion
  onDownload?: () => void;
}

export function ModelViewer({ fileUrl, fileName, fileType, bomItemId }: ModelViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const fileExt = fileType.toLowerCase().replace('.', '');

  // Check actual file URL extension (backend may have converted STEP to STL)
  // Remove query string first, then extract extension
  const urlPath = fileUrl.split('?')[0] || fileUrl;
  const actualFileExt = urlPath.toLowerCase().split('.').pop() || fileExt;

  // Check if format is supported for interactive viewing
  const isInteractiveSupported = ['stl', 'obj'].includes(actualFileExt);
  const isOriginalSTEP = ['step', 'stp', 'iges', 'igs'].includes(fileExt);
  const isConvertedToSTL = isOriginalSTEP && actualFileExt === 'stl';

  const handleConvertToSTL = async () => {
    if (!bomItemId) {
      toast.error('Cannot convert: BOM item ID not provided');
      return;
    }

    setIsConverting(true);
    try {
      await apiClient.post(`/bom-items/${bomItemId}/convert-step`);

      toast.success('STEP file converted to STL successfully! Refreshing...');

      // Refresh the page to show the converted model
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Conversion error:', error);
      toast.error(error.message || 'Failed to convert STEP file. Make sure CAD engine is running.');
    } finally {
      setIsConverting(false);
    }
  };

  // STEP File that was converted to STL - show in 3D viewer
  if (isConvertedToSTL) {
    return (
      <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-[85vh] min-h-[700px]'} overflow-hidden`}>
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-[#4a4a4a]">
            <div className="text-center text-white">
              <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin" />
              <p className="text-sm font-medium">Loading 3D model...</p>
            </div>
          </div>
        }>
          <EDrawingsViewer
            fileUrl={fileUrl}
            fileName={fileName}
          />
        </Suspense>

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="text-center max-w-md">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Failed to load 3D model</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setError(null)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button asChild>
                  <a href={fileUrl} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // STEP File not yet converted - show placeholder
  if (isOriginalSTEP && !isConvertedToSTL) {
    return (
      <div className="relative h-full min-h-[400px] border rounded-lg overflow-hidden bg-gradient-to-br from-muted/30 via-muted/10 to-background">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          {/* File Info */}
          <div className="mb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-xs font-mono font-semibold text-primary uppercase">{fileExt}</span>
              <span className="text-xs text-muted-foreground">CAD File</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground max-w-md truncate">
              {fileName}
            </h3>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {bomItemId && (
              <Button
                size="lg"
                className="gap-2 shadow-lg shadow-primary/20"
                onClick={handleConvertToSTL}
                disabled={isConverting}
              >
                {isConverting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Convert to 3D
                  </>
                )}
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              asChild
            >
              <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" />
                Download {fileExt.toUpperCase()}
              </a>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            {bomItemId
              ? 'Click "Convert to 3D" to view this model in your browser'
              : 'Download to view in professional CAD software'}
          </p>
        </div>
      </div>
    );
  }

  // Interactive 3D Viewer (STL/OBJ)
  if (isInteractiveSupported) {
    return (
      <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'h-[85vh] min-h-[700px]'} overflow-hidden`}>
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-[#4a4a4a]">
            <div className="text-center text-white">
              <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin" />
              <p className="text-sm font-medium">Loading 3D model...</p>
            </div>
          </div>
        }>
          <EDrawingsViewer
            fileUrl={fileUrl}
            fileName={fileName}
          />
        </Suspense>

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="text-center max-w-md">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Failed to load 3D model</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setError(null)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button asChild>
                  <a href={fileUrl} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Unsupported Format Fallback
  return (
    <div className="relative h-full min-h-[400px] border rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <span className="text-2xl">📄</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Unsupported File Format</h3>
        <p className="text-sm text-muted-foreground mb-4">
          File type "{fileType}" cannot be previewed in browser
        </p>
        <Button asChild>
          <a href={fileUrl} download>
            <Download className="h-4 w-4 mr-2" />
            Download File
          </a>
        </Button>
      </div>
    </div>
  );
}
