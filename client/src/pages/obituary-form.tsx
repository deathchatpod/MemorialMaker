import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
// UserContext removed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ImageUpload from "@/components/image-upload";

const obituaryFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  age: z.number().optional(),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  location: z.string().optional(),
  highSchool: z.string().optional(),
  hsGradYear: z.number().optional(),
  higherEducation: z.string().optional(),
  degree: z.string().optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  yearsOfService: z.number().optional(),
  achievements: z.string().optional(),
  spouseName: z.string().optional(),
  anniversaryDate: z.string().optional(),
  spouseDeceased: z.boolean().optional(),
  children: z.array(z.object({
    relation: z.string(),
    name: z.string(),
    spouse: z.string().optional(),
    deceased: z.boolean().optional(),
  })).optional(),
  grandchildrenCount: z.number().optional(),
  greatGrandchildrenCount: z.number().optional(),
  tone: z.string().min(1, "Please select a tone"),
  ageCategory: z.string().min(1, "Please select an age category"),
  traits: z.array(z.string()).optional(),
  hobbies: z.array(z.string()).optional(),
  hobbiesDetails: z.string().optional(),
  religion: z.string().optional(),
  religiousOrganization: z.string().optional(),
  religiousVerse: z.string().optional(),
  favoriteQuotes: z.string().optional(),
  memorialRequests: z.string().optional(),
  specialNotes: z.string().optional(),
  avoidNotes: z.string().optional(),
});

type ObituaryFormData = z.infer<typeof obituaryFormSchema>;

export default function ObituaryForm() {
  // Get current user from URL params (same pattern as dashboard)
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType');
  
  const currentUser = (() => {
    if (userTypeParam === 'admin') {
      return { id: 1, username: 'John Admin', userType: 'admin' };
    } else if (userTypeParam === 'employee') {
      return { id: 2, username: 'Mike Johnson', userType: 'employee' };
    } else if (userTypeParam === 'individual') {
      return { id: 3, username: 'Sarah Wilson', userType: 'individual' };
    } else {
      return { id: 4, username: 'Jane Smith', userType: 'funeral_home' };
    }
  })();
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [childrenEntries, setChildrenEntries] = useState([
    { relation: 'son', name: '', spouse: '', deceased: false }
  ]);

  const form = useForm<ObituaryFormData>({
    resolver: zodResolver(obituaryFormSchema),
    defaultValues: {
      traits: [],
      hobbies: [],
      children: childrenEntries,
    },
  });

  const createObituaryMutation = useMutation({
    mutationFn: async (data: ObituaryFormData) => {
      const formData = new FormData();
      formData.append('userId', currentUser.id.toString());
      formData.append('formData', JSON.stringify(data));
      if (selectedImage) {
        formData.append('photo', selectedImage);
      }

      const response = await fetch('/api/obituaries', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create obituary');
      }

      return response.json();
    },
    onSuccess: (obituary) => {
      queryClient.invalidateQueries({ queryKey: ["/api/obituaries"] });
      toast({
        title: "Success",
        description: "Obituary created successfully. Generating AI versions...",
      });
      
      // Generate obituaries immediately
      generateObituariesMutation.mutate(obituary.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create obituary. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateObituariesMutation = useMutation({
    mutationFn: async (obituaryId: number) => {
      return await apiRequest('POST', `/api/obituaries/${obituaryId}/generate`);
    },
    onSuccess: (_, obituaryId) => {
      toast({
        title: "Success",
        description: "6 obituaries generated successfully!",
      });
      setLocation(`/obituary/${obituaryId}/generated`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate obituaries. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ObituaryFormData) => {
    const formDataWithChildren = {
      ...data,
      children: childrenEntries.filter(child => child.name.trim() !== ''),
    };
    createObituaryMutation.mutate(formDataWithChildren);
  };

  const addChildEntry = () => {
    setChildrenEntries([...childrenEntries, { relation: 'son', name: '', spouse: '', deceased: false }]);
  };

  const removeChildEntry = (index: number) => {
    setChildrenEntries(childrenEntries.filter((_, i) => i !== index));
  };

  const updateChildEntry = (index: number, field: string, value: any) => {
    const updated = [...childrenEntries];
    updated[index] = { ...updated[index], [field]: value };
    setChildrenEntries(updated);
  };

  const personalityTraits = [
    { value: 'kind', label: 'Kind and Compassionate' },
    { value: 'hardworking', label: 'Hardworking and Dedicated' },
    { value: 'loyal', label: 'Loyal and Devoted' },
    { value: 'funny', label: 'Funny and Witty' },
    { value: 'strong', label: 'Strong and Resilient' },
    { value: 'generous', label: 'Generous and Giving' },
    { value: 'adventurous', label: 'Adventurous and Free-Spirited' },
    { value: 'creative', label: 'Creative and Artistic' },
    { value: 'loving', label: 'Loving and Family Oriented' },
    { value: 'wise', label: 'Wise and Thoughtful' },
    { value: 'patient', label: 'Patient and Understanding' },
    { value: 'faithful', label: 'Faithful and Spiritual' },
  ];

  const hobbiesList = [
    { value: 'gardening', label: 'Gardening' },
    { value: 'cooking', label: 'Cooking/Baking' },
    { value: 'reading', label: 'Reading' },
    { value: 'fishing', label: 'Fishing/Hunting' },
    { value: 'sports', label: 'Sports' },
    { value: 'crafting', label: 'Crafting/Artist' },
    { value: 'knitting', label: 'Knitting/Sewing' },
    { value: 'music', label: 'Music' },
    { value: 'traveling', label: 'Traveling' },
    { value: 'volunteering', label: 'Community Service' },
    { value: 'dancing', label: 'Dancing' },
    { value: 'animals', label: 'Animals/Pets' },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-background">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="text-muted-foreground hover:text-foreground mb-4"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-semibold text-foreground">Create New Obituary</h2>
        <p className="text-muted-foreground mt-1">Fill out the information below to generate personalized obituaries</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <i className="fas fa-user mr-2 text-muted-foreground"></i>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Include maiden name if applicable" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age at Death</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfDeath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Death</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Where they lived/passed or are from" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Biography Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <i className="fas fa-book mr-2 text-muted-foreground"></i>
                Biography & Life Story
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Education */}
              <div>
                <h4 className="text-md font-medium text-foreground mb-4">Education</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="highSchool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>High School</FormLabel>
                        <FormControl>
                          <Input placeholder="School name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hsGradYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduation Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="higherEducation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Higher Education</FormLabel>
                        <FormControl>
                          <Input placeholder="College/University name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="degree"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree & Major</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Bachelor of Arts in History" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Career */}
              <div>
                <h4 className="text-md font-medium text-foreground mb-4">Career & Occupation</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company/Organization</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="yearsOfService"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Service</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="achievements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Noteworthy Achievements</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Outside of work and school..." 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Family Information Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <i className="fas fa-users mr-2 text-muted-foreground"></i>
                Family Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Spouse */}
              <div>
                <h4 className="text-md font-medium text-foreground mb-4">Spouse</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="spouseName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spouse Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="anniversaryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anniversary Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="spouseDeceased"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 pt-6">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Deceased (preceded by)</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Children */}
              <div>
                <h4 className="text-md font-medium text-foreground mb-4">Children</h4>
                <div className="space-y-4">
                  {childrenEntries.map((child, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div>
                        <FormLabel>Relationship</FormLabel>
                        <Select 
                          value={child.relation} 
                          onValueChange={(value) => updateChildEntry(index, 'relation', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="son">Son</SelectItem>
                            <SelectItem value="daughter">Daughter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FormLabel>Name</FormLabel>
                        <Input 
                          value={child.name}
                          onChange={(e) => updateChildEntry(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <FormLabel>Spouse Name</FormLabel>
                        <Input 
                          value={child.spouse}
                          onChange={(e) => updateChildEntry(index, 'spouse', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          checked={child.deceased}
                          onCheckedChange={(checked) => updateChildEntry(index, 'deceased', checked)}
                        />
                        <FormLabel>Deceased</FormLabel>
                        {childrenEntries.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeChildEntry(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-times"></i>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={addChildEntry}
                    className="text-primary hover:text-blue-700"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Another Child
                  </Button>
                </div>
              </div>

              {/* Grandchildren & Great-Grandchildren */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="grandchildrenCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Grandchildren</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="greatGrandchildrenCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Great-Grandchildren</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Characteristics & Preferences Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <i className="fas fa-heart mr-2 text-muted-foreground"></i>
                Characteristics & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Tone Selection */}
              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone *</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                      >
                        <div className="flex items-center p-3 border border-border rounded-lg hover:bg-muted">
                          <RadioGroupItem value="traditional" id="traditional" />
                          <div className="ml-3">
                            <label htmlFor="traditional" className="text-sm font-medium text-foreground cursor-pointer">
                              Traditional / Formal
                            </label>
                            <div className="text-xs text-muted-foreground">Classic, respectful approach</div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 border border-border rounded-lg hover:bg-muted">
                          <RadioGroupItem value="celebratory" id="celebratory" />
                          <div className="ml-3">
                            <label htmlFor="celebratory" className="text-sm font-medium text-foreground cursor-pointer">
                              Celebratory / Uplifting
                            </label>
                            <div className="text-xs text-muted-foreground">Focus on joy and life celebration</div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 border border-border rounded-lg hover:bg-muted">
                          <RadioGroupItem value="poetic" id="poetic" />
                          <div className="ml-3">
                            <label htmlFor="poetic" className="text-sm font-medium text-foreground cursor-pointer">
                              Poetic / Reflective
                            </label>
                            <div className="text-xs text-muted-foreground">Thoughtful and meaningful</div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 border border-border rounded-lg hover:bg-muted">
                          <RadioGroupItem value="lighthearted" id="lighthearted" />
                          <div className="ml-3">
                            <label htmlFor="lighthearted" className="text-sm font-medium text-foreground cursor-pointer">
                              Lighthearted / Humorous
                            </label>
                            <div className="text-xs text-muted-foreground">Warm and uplifting with gentle humor</div>
                          </div>
                        </div>
                        <div className="flex items-center p-3 border border-border rounded-lg hover:bg-muted">
                          <RadioGroupItem value="personal" id="personal" />
                          <div className="ml-3">
                            <label htmlFor="personal" className="text-sm font-medium text-foreground cursor-pointer">
                              Personal / Story Driven
                            </label>
                            <div className="text-xs text-muted-foreground">Rich in personal stories and anecdotes</div>
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Age Category */}
              <FormField
                control={form.control}
                name="ageCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age Category *</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        value={field.value}
                        className="flex flex-wrap gap-3"
                      >
                        <div className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="child" id="child" />
                          <label htmlFor="child" className="ml-2 text-sm text-gray-900 cursor-pointer">
                            Child / Infant
                          </label>
                        </div>
                        <div className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="young" id="young" />
                          <label htmlFor="young" className="ml-2 text-sm text-gray-900 cursor-pointer">
                            Teenager / Young Adult
                          </label>
                        </div>
                        <div className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="middle" id="middle" />
                          <label htmlFor="middle" className="ml-2 text-sm text-gray-900 cursor-pointer">
                            Middle-Aged Adult
                          </label>
                        </div>
                        <div className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="senior" id="senior" />
                          <label htmlFor="senior" className="ml-2 text-sm text-gray-900 cursor-pointer">
                            Senior / Elderly
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personality Traits */}
              <FormField
                control={form.control}
                name="traits"
                render={() => (
                  <FormItem>
                    <FormLabel>Personality Traits</FormLabel>
                    <p className="text-sm text-gray-600 mb-4">Select all that apply:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {personalityTraits.map((trait) => (
                        <FormField
                          key={trait.value}
                          control={form.control}
                          name="traits"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={trait.value}
                                className="flex items-center p-2 border border-gray-300 rounded hover:bg-gray-50"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(trait.value)}
                                    onCheckedChange={(checked) => {
                                      const updated = checked
                                        ? [...(field.value || []), trait.value]
                                        : (field.value || []).filter((value) => value !== trait.value);
                                      field.onChange(updated);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="ml-2 text-sm text-gray-900 cursor-pointer">
                                  {trait.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Hobbies & Interests Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-palette mr-2 text-primary"></i>
                Hobbies & Interests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="hobbies"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {hobbiesList.map((hobby) => (
                        <FormField
                          key={hobby.value}
                          control={form.control}
                          name="hobbies"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={hobby.value}
                                className="flex items-center p-2 border border-border rounded hover:bg-muted"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(hobby.value)}
                                    onCheckedChange={(checked) => {
                                      const updated = checked
                                        ? [...(field.value || []), hobby.value]
                                        : (field.value || []).filter((value) => value !== hobby.value);
                                      field.onChange(updated);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="ml-2 text-sm text-foreground cursor-pointer">
                                  {hobby.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hobbiesDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Details about Hobbies</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide more details about their interests and passions..." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Religion & Spirituality Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <i className="fas fa-praying-hands mr-2 text-muted-foreground"></i>
                Religion & Spirituality (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="religion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Religious Affiliation</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select (Optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="christian">Christian (General)</SelectItem>
                        <SelectItem value="catholic">Catholic</SelectItem>
                        <SelectItem value="jehovah">Jehovah's Witness</SelectItem>
                        <SelectItem value="mormon">Latter-day Saint / Mormon</SelectItem>
                        <SelectItem value="templar">Knights Templar</SelectItem>
                        <SelectItem value="amish">Amish / Mennonite</SelectItem>
                        <SelectItem value="quaker">Quaker / Society of Friends</SelectItem>
                        <SelectItem value="pentecostal">Pentecostal</SelectItem>
                        <SelectItem value="adventist">Seventh-day Adventist</SelectItem>
                        <SelectItem value="jewish">Jewish</SelectItem>
                        <SelectItem value="muslim">Muslim (Islamic)</SelectItem>
                        <SelectItem value="hindu">Hindu</SelectItem>
                        <SelectItem value="buddhist">Buddhist</SelectItem>
                        <SelectItem value="secular">Secular</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="religiousOrganization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Church/Temple/Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="Specific membership or congregation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="religiousVerse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biblical/Religious Verse</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional verse or quote" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <i className="fas fa-clipboard-list mr-2 text-primary"></i>
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="favoriteQuotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite Quotes or Sayings</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any meaningful quotes, sayings, or phrases they loved..." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="memorialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Memorial or Donation Requests</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Where to send donations, flowers, etc." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Notes to Include</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Anything specifically to mention..." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avoidNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Information to Avoid</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Anything to avoid writing about..." 
                        className="min-h-[60px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Photo Upload Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <i className="fas fa-camera mr-2 text-muted-foreground"></i>
                Photo Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload onImageSelect={setSelectedImage} />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6">
            <Button type="button" variant="outline">
              Save as Draft
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-white hover:bg-blue-700"
              disabled={createObituaryMutation.isPending || generateObituariesMutation.isPending}
            >
              {createObituaryMutation.isPending || generateObituariesMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Generate Obituaries
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
