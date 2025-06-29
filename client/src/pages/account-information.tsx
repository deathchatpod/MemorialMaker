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
import { AccessibilitySettings } from '@/components/AccessibilitySettings';
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

  // State for collapsible sections with localStorage persistence
  const [sectionStates, setSectionStates] = useState(() => {
    try {
      const saved = localStorage.getItem('accountSectionStates');
      return saved ? JSON.parse(saved) : {
        personalInfo: false,
        address: false,
        security: false,
        notifications: false,
        accessibility: false
      };
    } catch {
      return {
        personalInfo: false,
        address: false,
        security: false,
        notifications: false,
        accessibility: false
      };
    }
  });

  const [isAdditionalAddressesOpen, setIsAdditionalAddressesOpen] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save section states to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('accountSectionStates', JSON.stringify(sectionStates));
    } catch (error) {
      console.warn('Could not save section states to localStorage');
    }
  }, [sectionStates]);

  const toggleSection = (section: string) => {
    setSectionStates((prev: any) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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

    // In a real implementation, this would update the password
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    
    toast({
      title: 'Password updated',
      description: 'Your password has been updated successfully.',
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
        <h1 className="text-2xl font-bold text-foreground">My Account</h1>
        <p className="text-muted-foreground">Manage your account details and security settings</p>
      </div>

      <div className="grid gap-6">
        {/* Personal Information */}
        <Card>
          <Collapsible open={sectionStates.personalInfo} onOpenChange={() => toggleSection('personalInfo')}>
            <CardHeader>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:bg-muted/50 p-2 -m-2 rounded">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle>Personal Information</CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${sectionStates.personalInfo ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CardDescription>
                Update your personal account details
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
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
                      placeholder="public@example.com"
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
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Address Information */}
        <Card>
          <Collapsible open={sectionStates.address} onOpenChange={() => toggleSection('address')}>
            <CardHeader>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:bg-muted/50 p-2 -m-2 rounded">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <CardTitle>Address</CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${sectionStates.address ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CardDescription>
                Manage your primary address information
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-4">
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

                  <Separator className="my-6" />

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
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Security Settings */}
        <Card>
          <Collapsible open={sectionStates.security} onOpenChange={() => toggleSection('security')}>
            <CardHeader>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:bg-muted/50 p-2 -m-2 rounded">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <CardTitle>Security Settings</CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${sectionStates.security ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CardDescription>
                Update your password and security preferences
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
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
                      placeholder="Enter current password"
                    />
                  </div>

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

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Password must be at least 8 characters long and contain a mix of letters, numbers, and special characters.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    className="flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Notification Settings */}
        <Card>
          <Collapsible open={sectionStates.notifications} onOpenChange={() => toggleSection('notifications')}>
            <CardHeader>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:bg-muted/50 p-2 -m-2 rounded">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <CardTitle>Notification Settings</CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${sectionStates.notifications ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <NotificationSettings />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Accessibility Settings */}
        <Card>
          <Collapsible open={sectionStates.accessibility} onOpenChange={() => toggleSection('accessibility')}>
            <CardHeader>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:bg-muted/50 p-2 -m-2 rounded">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  <CardTitle>Accessibility Settings</CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${sectionStates.accessibility ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CardDescription>
                Customize your accessibility preferences
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <AccessibilitySettings />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </div>
  );
}