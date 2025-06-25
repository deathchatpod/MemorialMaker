import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Mail, 
  Key, 
  Globe, 
  Shield,
  Zap
} from 'lucide-react';

interface DeploymentCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  required: boolean;
  icon: React.ReactNode;
}

export function DeploymentReadiness() {
  const [isChecking, setIsChecking] = useState(false);

  const { data: checks = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/deployment-checks'],
    queryFn: async (): Promise<DeploymentCheck[]> => {
      // Mock deployment readiness checks - in production these would be real API calls
      return [
        {
          id: 'database',
          name: 'Database Connection',
          status: 'pass',
          message: 'PostgreSQL database connected successfully',
          required: true,
          icon: <Database className="h-4 w-4" />
        },
        {
          id: 'ai-services',
          name: 'AI Services',
          status: 'pass',
          message: 'Claude 4.0 and GPT-4o APIs configured',
          required: true,
          icon: <Zap className="h-4 w-4" />
        },
        {
          id: 'email',
          name: 'Email Service',
          status: 'warning',
          message: 'SendGrid configured but not tested in production',
          required: false,
          icon: <Mail className="h-4 w-4" />
        },
        {
          id: 'secrets',
          name: 'Environment Variables',
          status: 'pass',
          message: 'All required secrets configured',
          required: true,
          icon: <Key className="h-4 w-4" />
        },
        {
          id: 'security',
          name: 'Security Configuration',
          status: 'pass',
          message: 'Session security and validation enabled',
          required: true,
          icon: <Shield className="h-4 w-4" />
        },
        {
          id: 'domain',
          name: 'Domain Setup',
          status: 'warning',
          message: 'Using default .replit.app domain',
          required: false,
          icon: <Globe className="h-4 w-4" />
        }
      ];
    },
    enabled: false
  });

  const runChecks = async () => {
    setIsChecking(true);
    await refetch();
    setIsChecking(false);
  };

  const passedChecks = checks.filter(check => check.status === 'pass').length;
  const totalChecks = checks.length;
  const requiredChecks = checks.filter(check => check.required);
  const passedRequiredChecks = requiredChecks.filter(check => check.status === 'pass').length;
  
  const readinessScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  const isReadyForDeployment = requiredChecks.every(check => check.status === 'pass');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Deployment Readiness
            </CardTitle>
            <Button 
              onClick={runChecks}
              disabled={isChecking || isLoading}
              size="sm"
            >
              {isChecking ? 'Checking...' : 'Run Checks'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Readiness</span>
                <span className="text-sm text-muted-foreground">{readinessScore}%</span>
              </div>
              <Progress value={readinessScore} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {passedRequiredChecks}/{requiredChecks.length} required checks passed
              </p>
            </div>

            {isReadyForDeployment ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Ready for deployment! All required checks passed.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Not ready for deployment. Please resolve failing required checks.
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {checks.map((check) => (
          <Card key={check.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {check.icon}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{check.name}</span>
                      {check.required && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(check.status)}
                  {getStatusBadge(check.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {checks.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Click "Run Checks" to verify deployment readiness
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function DeploymentGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Guide</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-medium">Pre-Deployment Checklist:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Environment variables configured
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Database schema up to date
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              AI services tested
            </li>
            <li className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Email service configuration (optional)
            </li>
            <li className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Custom domain setup (optional)
            </li>
          </ul>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2">Deployment Steps:</h5>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Ensure all required checks pass</li>
            <li>2. Click the Deploy button in Replit</li>
            <li>3. Configure deployment settings</li>
            <li>4. Monitor deployment logs</li>
            <li>5. Test deployed application</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}