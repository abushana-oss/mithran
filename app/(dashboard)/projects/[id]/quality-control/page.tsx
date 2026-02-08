'use client';

import { useParams } from 'next/navigation';
import { WorkflowNavigation } from '@/components/features/workflow/WorkflowNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, CheckCircle, AlertTriangle, Clock, FileText, BarChart3, Target } from 'lucide-react';
import Link from 'next/link';

export default function QualityControlPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Workflow Navigation */}
        <WorkflowNavigation 
          currentModuleId="quality-control" 
          projectId={projectId}
        />
        
        {/* BREADCRUMB & HEADER */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link 
                href={`/projects/${projectId}`}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Project
              </Link>
              <span>/</span>
              <span>Quality Control</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Quality Control & Assurance
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor quality standards and ensure compliance across production
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Create QC Inspection
          </Button>
        </div>

        {/* OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inspections</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                Completed this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground">
                Quality compliance rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non-Conformances</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Inspection Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3</div>
              <p className="text-xs text-muted-foreground">
                Hours per inspection
              </p>
            </CardContent>
          </Card>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ACTIVE INSPECTIONS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Active Inspections
              </CardTitle>
              <CardDescription>
                Current quality control processes and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Batch #PB001 - Final Inspection</p>
                    <p className="text-sm text-muted-foreground">50 units • Inspector: John Doe</p>
                  </div>
                  <Badge>In Progress</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Batch #PB002 - Material Testing</p>
                    <p className="text-sm text-muted-foreground">Material compliance check</p>
                  </div>
                  <Badge variant="secondary">Scheduled</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Batch #PB003 - Dimensional Check</p>
                    <p className="text-sm text-muted-foreground">CAD vs Actual measurements</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
                
                <Button className="w-full">
                  View All Inspections
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* NON-CONFORMANCES */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Non-Conformances
              </CardTitle>
              <CardDescription>
                Quality issues requiring attention and corrective action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                  <div>
                    <p className="font-medium">Surface Finish Issue</p>
                    <p className="text-sm text-muted-foreground">Batch #PB001 • Raised: 2 hours ago</p>
                  </div>
                  <Badge variant="destructive">High</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                  <div>
                    <p className="font-medium">Dimensional Deviation</p>
                    <p className="text-sm text-muted-foreground">Batch #PB002 • Raised: Yesterday</p>
                  </div>
                  <Badge variant="secondary">Medium</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg border-blue-200 bg-blue-50">
                  <div>
                    <p className="font-medium">Material Certificate Missing</p>
                    <p className="text-sm text-muted-foreground">Supplier documentation issue</p>
                  </div>
                  <Badge variant="outline">Low</Badge>
                </div>
                
                <Button className="w-full">
                  Manage Non-Conformances
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QC STANDARDS & PROCEDURES */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quality Standards & Procedures
            </CardTitle>
            <CardDescription>
              Quality control standards, procedures, and inspection checklists
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Inspection Checklists</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Standard inspection procedures and quality checkpoints
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  View Checklists
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Quality Standards</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  ISO standards and industry quality requirements
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Manage Standards
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Test Procedures</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Material testing and performance validation procedures
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Setup Procedures
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QUALITY METRICS & REPORTING */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quality Metrics & Reporting
            </CardTitle>
            <CardDescription>
              Quality performance analytics and compliance reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Quality Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">First Pass Yield</span>
                    <span className="font-medium">92.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Defect Rate</span>
                    <span className="font-medium">2.1%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer Complaints</span>
                    <span className="font-medium">0.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rework Rate</span>
                    <span className="font-medium">1.8%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Compliance Status</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">ISO 9001 Compliance</span>
                    <Badge variant="default">✓ Compliant</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Customer QA Approval</span>
                    <Badge variant="default">✓ Approved</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Material Certificates</span>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Test Reports</span>
                    <Badge variant="default">✓ Complete</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <Button className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Generate Quality Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}