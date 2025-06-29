import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, Save, Lock, MapPin, Plus, Trash2, ChevronDown, Mail, User, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';
import NotificationSettings from '@/components/NotificationSettings';

export default function AccountInformation() {
  // Get user info from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userType = urlParams.get('userType') || 'admin';
  const userId = parseInt(urlParams.get('userId') || '1');

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    website: '',
    contactEmail: '',
  });

  const [additionalAddresses, setAdditionalAddresses] = useState<Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }>>([]);
  const [isAdditionalAddressesOpen, setIsAdditionalAddressesOpen] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for now since we don't have specific user endpoints
  useEffect(() => {
    // Set mock data based on user type
    const mockData = {
      admin: { name: 'John Admin', email: 'admin@deathmatters.com', businessName: '', phone: '(555) 123-4567' },
      funeral_home: { name: 'Jane Smith', email: 'funeral@deathmatters.com', businessName: 'Smith Funeral Home', phone: '(555) 234-5678' },
      employee: { name: 'Mike Johnson', email: 'employee@deathmatters.com', businessName: '', phone: '(555) 345-6789' },
      individual: { name: 'Sarah Wilson', email: 'individual@deathmatters.com', businessName: '', phone: '(555) 456-7890' }
    };

    const userData = mockData[userType as keyof typeof mockData] || mockData.admin;
    setFormData({
      name: userData.name,
      businessName: userData.businessName,
      email: userData.email,
      phone: userData.phone,
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      website: '',
      contactEmail: '',
    });
  }, [userType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAccountUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real implementation, this would save to the database
    const accountData = {
      ...formData,
      additionalAddresses
    };
    

    
    toast({
      title: 'Account updated',
      description: 'Your account information has been updated successfully.',
    });
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'New password and confirmation do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Password changed',
      description: 'Your password has been changed successfully.',
    });
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const addAdditionalAddress = () => {
    setAdditionalAddresses([...additionalAddresses, {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    }]);
  };

  const removeAdditionalAddress = (index: number) => {
    setAdditionalAddresses(additionalAddresses.filter((_, i) => i !== index));
  };

  const updateAdditionalAddress = (index: number, field: string, value: string) => {
    const updated = [...additionalAddresses];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalAddresses(updated);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Account</h1>
        <p className="text-gray-600">Manage your account details and security settings</p>
      </div>

      <div className="grid gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccountUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Smith"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name (if applicable)</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Smith Funeral Home"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contact@example.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email (if different from login email)</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="info@example.com"
                />
              </div>

              <Button 
                type="submit" 
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
            <CardDescription>
              Manage your primary address information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Primary Address</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      placeholder="10001"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Addresses - Collapsible */}
              <Collapsible 
                open={isAdditionalAddressesOpen} 
                onOpenChange={setIsAdditionalAddressesOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${isAdditionalAddressesOpen ? 'rotate-180' : ''}`} />
                    Additional Addresses {additionalAddresses.length > 0 && `(${additionalAddresses.length})`}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  {additionalAddresses.map((address, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-sm">Additional Address {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAdditionalAddress(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Street Address</Label>
                        <Input
                          value={address.street}
                          onChange={(e) => updateAdditionalAddress(index, 'street', e.target.value)}
                          placeholder="123 Main Street"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input
                            value={address.city}
                            onChange={(e) => updateAdditionalAddress(index, 'city', e.target.value)}
                            placeholder="New York"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>State/Province</Label>
                          <Input
                            value={address.state}
                            onChange={(e) => updateAdditionalAddress(index, 'state', e.target.value)}
                            placeholder="NY"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>ZIP/Postal Code</Label>
                          <Input
                            value={address.zipCode}
                            onChange={(e) => updateAdditionalAddress(index, 'zipCode', e.target.value)}
                            placeholder="10001"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Country</Label>
                          <Input
                            value={address.country}
                            onChange={(e) => updateAdditionalAddress(index, 'country', e.target.value)}
                            placeholder="United States"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAdditionalAddress}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Address
                  </Button>
                </CollapsibleContent>
              </Collapsible>
              
              <Button 
                onClick={handleAccountUpdate}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Address Information
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notification Settings
            </CardTitle>
            <CardDescription>
              Configure your email notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              Email notification options will be available here once all email features are implemented.
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Change your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your current password"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                disabled={!passwordData.currentPassword || !passwordData.newPassword}
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Accessibility Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <CardTitle>Accessibility Settings</CardTitle>
            </div>
            <CardDescription>
              Customize display and interaction preferences to improve your experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div id="accessibility-tools">
              <AccessibilityToolbar />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>
              Configure your notification preferences for different types of platform activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationSettings />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}