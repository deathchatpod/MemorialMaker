import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Bell, Users, FileText, Settings, Shield, MessageSquare } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface NotificationPreferences {
  id?: number;
  userId: number;
  userType: string;
  inPlatformEnabled: boolean;
  emailEnabled: boolean;
  collaborationInviteReceived: { inPlatform: boolean; email: boolean };
  collaborationInviteAccepted: { inPlatform: boolean; email: boolean };
  newCollaboratorAdded: { inPlatform: boolean; email: boolean };
  collaboratorMadeChanges: { inPlatform: boolean; email: boolean };
  obituaryStatusChanged: { inPlatform: boolean; email: boolean };
  finalspaceUpdated: { inPlatform: boolean; email: boolean };
  newObituaryPublished: { inPlatform: boolean; email: boolean };
  contentReviewCompleted: { inPlatform: boolean; email: boolean };
  employeeInvitationSent: { inPlatform: boolean; email: boolean };
  employeeInvitationAccepted: { inPlatform: boolean; email: boolean };
  newTeamMemberJoined: { inPlatform: boolean; email: boolean };
  teamMemberRoleChanged: { inPlatform: boolean; email: boolean };
  accountInformationUpdated: { inPlatform: boolean; email: boolean };
  passwordChanged: { inPlatform: boolean; email: boolean };
  loginFromNewDevice: { inPlatform: boolean; email: boolean };
  newFeedbackReceived: { inPlatform: boolean; email: boolean };
}

interface NotificationCategory {
  title: string;
  icon: any;
  description: string;
  items: {
    key: keyof NotificationPreferences;
    label: string;
    description: string;
  }[];
}

export default function NotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  const { data: fetchedPreferences, isLoading } = useQuery({
    queryKey: ["/api/notification-preferences"],
    queryFn: async () => {
      const response = await fetch("/api/notification-preferences");
      if (!response.ok) throw new Error("Failed to fetch notification preferences");
      return response.json();
    },
  });

  useEffect(() => {
    if (fetchedPreferences) {
      setPreferences(fetchedPreferences);
    }
  }, [fetchedPreferences]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updatedPreferences: Partial<NotificationPreferences>) => {
      const response = await fetch("/api/notification-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPreferences),
      });
      if (!response.ok) throw new Error("Failed to update notification preferences");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update notification preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMasterToggle = (type: 'inPlatform' | 'email', enabled: boolean) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences };
    if (type === 'inPlatform') {
      updatedPreferences.inPlatformEnabled = enabled;
    } else {
      updatedPreferences.emailEnabled = enabled;
    }

    setPreferences(updatedPreferences);
    updatePreferencesMutation.mutate(updatedPreferences);
  };

  const handleNotificationToggle = (
    key: keyof NotificationPreferences,
    type: 'inPlatform' | 'email',
    enabled: boolean
  ) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences };
    const currentValue = updatedPreferences[key] as { inPlatform: boolean; email: boolean };
    
    updatedPreferences[key] = {
      ...currentValue,
      [type]: enabled,
    } as any;

    setPreferences(updatedPreferences);
    updatePreferencesMutation.mutate(updatedPreferences);
  };

  const notificationCategories: NotificationCategory[] = [
    {
      title: "Collaboration & Sharing",
      icon: Users,
      description: "Notifications about collaboration invites and shared content",
      items: [
        {
          key: "collaborationInviteReceived",
          label: "Collaboration Invite Received",
          description: "When someone invites you to collaborate on content",
        },
        {
          key: "collaborationInviteAccepted",
          label: "Collaboration Invite Accepted",
          description: "When someone accepts your collaboration invitation",
        },
        {
          key: "newCollaboratorAdded",
          label: "New Collaborator Added",
          description: "When a new collaborator is added to your content",
        },
        {
          key: "collaboratorMadeChanges",
          label: "Collaborator Made Changes",
          description: "When a collaborator updates shared content",
        },
      ],
    },
    {
      title: "Content Management",
      icon: FileText,
      description: "Notifications about obituaries and memorials",
      items: [
        {
          key: "obituaryStatusChanged",
          label: "Obituary Status Changed",
          description: "When an obituary status changes (draft to published)",
        },
        {
          key: "finalspaceUpdated",
          label: "Memorial Updated",
          description: "When a memorial space is updated by collaborators",
        },
        {
          key: "newObituaryPublished",
          label: "New Obituary Published",
          description: "When a team member publishes a new obituary",
        },
        {
          key: "contentReviewCompleted",
          label: "Content Review Completed",
          description: "When obituary review processing is completed",
        },
      ],
    },
    {
      title: "Team Management",
      icon: Settings,
      description: "Notifications about team and employee activities",
      items: [
        {
          key: "employeeInvitationSent",
          label: "Employee Invitation Sent",
          description: "When you send an employee invitation",
        },
        {
          key: "employeeInvitationAccepted",
          label: "Employee Invitation Accepted",
          description: "When someone accepts your employee invitation",
        },
        {
          key: "newTeamMemberJoined",
          label: "New Team Member Joined",
          description: "When a new team member joins your organization",
        },
        {
          key: "teamMemberRoleChanged",
          label: "Team Member Role Changed",
          description: "When a team member's role is updated",
        },
      ],
    },
    {
      title: "System & Account",
      icon: Shield,
      description: "Notifications about account security and updates",
      items: [
        {
          key: "accountInformationUpdated",
          label: "Account Information Updated",
          description: "When your account information is changed",
        },
        {
          key: "passwordChanged",
          label: "Password Changed",
          description: "When your account password is updated",
        },
        {
          key: "loginFromNewDevice",
          label: "Login from New Device",
          description: "When your account is accessed from a new device",
        },
      ],
    },
    {
      title: "Admin Notifications",
      icon: MessageSquare,
      description: "Administrative notifications (Admin users only)",
      items: [
        {
          key: "newFeedbackReceived",
          label: "New Feedback Received",
          description: "When new customer feedback is submitted",
        },
      ],
    },
  ];

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-300 mt-4">Loading notification settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8">
          <div className="text-center">
            <p className="text-gray-300">Failed to load notification preferences.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Master Controls */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Master Notification Controls
          </CardTitle>
          <CardDescription className="text-gray-400">
            Control all notifications at once with these master toggles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-gray-100 font-medium">In-Platform Notifications</h4>
              <p className="text-sm text-gray-400">
                Enable or disable all in-platform notifications
              </p>
            </div>
            <Switch
              checked={preferences.inPlatformEnabled}
              onCheckedChange={(checked) => handleMasterToggle('inPlatform', checked)}
              disabled={updatePreferencesMutation.isPending}
            />
          </div>
          <Separator className="bg-gray-700" />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-gray-100 font-medium">Email Notifications</h4>
              <p className="text-sm text-gray-400">
                Enable or disable all email notifications
              </p>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => handleMasterToggle('email', checked)}
              disabled={updatePreferencesMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Individual Notification Categories */}
      {notificationCategories.map((category) => {
        // Hide admin notifications for non-admin users
        if (category.title === "Admin Notifications" && preferences.userType !== "admin") {
          return null;
        }

        // Hide team management for individual users
        if (category.title === "Team Management" && preferences.userType === "individual") {
          return null;
        }

        return (
          <Card key={category.title} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <category.icon className="w-5 h-5" />
                {category.title}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {category.items.map((item, index) => {
                const currentValue = preferences[item.key] as { inPlatform: boolean; email: boolean };
                
                return (
                  <div key={item.key}>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-gray-100 font-medium">{item.label}</h4>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={currentValue?.inPlatform || false}
                              onCheckedChange={(checked) =>
                                handleNotificationToggle(item.key, 'inPlatform', checked)
                              }
                              disabled={updatePreferencesMutation.isPending || !preferences.inPlatformEnabled}
                            />
                            <span className="text-sm text-gray-300">In-Platform</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={currentValue?.email || false}
                              onCheckedChange={(checked) =>
                                handleNotificationToggle(item.key, 'email', checked)
                              }
                              disabled={updatePreferencesMutation.isPending || !preferences.emailEnabled}
                            />
                            <span className="text-sm text-gray-300">Email</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < category.items.length - 1 && (
                      <Separator className="bg-gray-700 mt-4" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Information Note */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <p className="text-sm text-gray-400">
            <strong className="text-gray-300">Note:</strong> These settings control your notification preferences only. 
            No actual notifications will be sent as this is a framework for future notification functionality. 
            Your preferences will be saved and can be used when notification features are implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}