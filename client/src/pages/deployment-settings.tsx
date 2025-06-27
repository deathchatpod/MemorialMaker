import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeploymentReadiness, DeploymentGuide } from '@/components/DeploymentReadiness';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Rocket, 
  Settings, 
  Database, 
  Mail, 
  Shield,
  Globe,
  ArrowLeft 
} from 'lucide-react';
import { Link } from 'wouter';

export default function DeploymentSettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const userType = urlParams.get('userType') || 'admin';
  const userId = parseInt(urlParams.get('userId') || '1');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="h-6 w-6" />
              Deployment Center
            </h1>
            <p className="text-muted-foreground">
              Prepare your platform for production deployment
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          Phase 4 Ready
        </Badge>
      </div>

      <Tabs defaultValue="readiness" className="space-y-6">
        <TabsList>
          <TabsTrigger value="readiness" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Readiness Check
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Deployment Guide
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="readiness">
          <DeploymentReadiness />
        </TabsContent>

        <TabsContent value="guide">
          <div className="grid gap-6 lg:grid-cols-2">
            <DeploymentGuide />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Service Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">SendGrid Configuration:</h4>
                  <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                    SENDGRID_API_KEY=your_api_key_here
                  </div>
                  <p className="text-sm text-muted-foreground">
                    If SendGrid is not available, the system will fall back to Nodemailer with Gmail SMTP.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Gmail Fallback Setup:</h4>
                  <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                    EMAIL_USER=your_email@gmail.com<br/>
                    EMAIL_PASSWORD=your_app_password
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <h4 className="font-medium">Required Variables:</h4>
                    <div className="p-4 bg-gray-50 rounded-md font-mono text-sm space-y-1">
                      <div>DATABASE_URL=postgresql://...</div>
                      <div>ANTHROPIC_API_KEY=sk-ant-...</div>
                      <div>OPENAI_API_KEY=sk-...</div>
                      <div>SESSION_SECRET=your_secret_key</div>
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    <h4 className="font-medium">Optional Variables:</h4>
                    <div className="p-4 bg-gray-50 rounded-md font-mono text-sm space-y-1">
                      <div>SENDGRID_API_KEY=SG....</div>
                      <div>EMAIL_USER=your_email@gmail.com</div>
                      <div>EMAIL_PASSWORD=your_app_password</div>
                      <div>FROM_EMAIL=noreply@yourdomain.com</div>
                      <div>BASE_URL=https://your-domain.com</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">Production Ready:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• AI-powered obituary generation (Claude 4.0 & GPT-4)</li>
                      <li>• Comprehensive user management system</li>
                      <li>• Collaboration and feedback systems</li>
                      <li>• Memorial spaces (FinalSpaces) with media</li>
                      <li>• Survey and evaluation systems</li>
                      <li>• Mobile-responsive design</li>
                      <li>• Email notification system</li>
                      <li>• Database with full schema</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-600">Future Enhancements:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• OAuth social login integration</li>
                      <li>• Real-time collaboration features</li>
                      <li>• Advanced analytics dashboard</li>
                      <li>• Custom domain configuration</li>
                      <li>• Advanced theming system</li>
                      <li>• API rate limiting</li>
                      <li>• Automated backup systems</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}