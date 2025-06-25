import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, Mail, Calendar, Users, CheckCircle, Clock, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface Notification {
  id: number;
  type: 'collaboration_invite' | 'comment_notification' | 'evaluation_reminder' | 'weekly_digest';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  userId: number;
  userType: string;
}

export function NotificationCenter({ userId, userType }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock notifications for demo - in production this would come from API
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['/api/notifications', userId, userType],
    queryFn: async (): Promise<Notification[]> => {
      // Mock data - replace with actual API call
      return [
        {
          id: 1,
          type: 'collaboration_invite',
          title: 'Collaboration Invitation',
          message: 'You have been invited to collaborate on John Smith\'s obituary',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          actionUrl: '/collaborate/123'
        },
        {
          id: 2,
          type: 'comment_notification',
          title: 'New Memorial Comment',
          message: 'Sarah Johnson left a comment on Mary Wilson\'s memorial',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          actionUrl: '/memorial/mary-wilson'
        },
        {
          id: 3,
          type: 'evaluation_reminder',
          title: 'Pre-Need Evaluation Reminder',
          message: 'Complete your pre-need evaluation to ensure your wishes are documented',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          actionUrl: '/take-pre-need-evaluation'
        }
      ];
    },
    refetchInterval: 30000 // Poll every 30 seconds
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      // Mock - replace with actual API call
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      // Mock - replace with actual API call
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    }
  });

  const dismissNotification = useMutation({
    mutationFn: async (notificationId: number) => {
      // Mock - replace with actual API call
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'collaboration_invite':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'comment_notification':
        return <Mail className="h-4 w-4 text-green-500" />;
      case 'evaluation_reminder':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'weekly_digest':
        return <Bell className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </DialogTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                Mark all read
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  notification.isRead ? 'opacity-75' : 'border-blue-200'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification.mutate(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="text-center pt-2 border-t">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View all notifications
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Email preferences component
export function EmailPreferences({ userId, userType }: NotificationCenterProps) {
  const [preferences, setPreferences] = useState({
    collaborationInvites: true,
    commentNotifications: true,
    evaluationReminders: true,
    weeklyDigests: false,
    instantNotifications: false
  });

  const updatePreferences = useMutation({
    mutationFn: async (newPreferences: typeof preferences) => {
      // Mock - replace with actual API call
      return Promise.resolve(newPreferences);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email preferences updated"
      });
    }
  });

  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Collaboration Invitations</span>
            <input
              type="checkbox"
              checked={preferences.collaborationInvites}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                collaborationInvites: e.target.checked
              }))}
              className="rounded"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Comment Notifications</span>
            <input
              type="checkbox"
              checked={preferences.commentNotifications}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                commentNotifications: e.target.checked
              }))}
              className="rounded"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Evaluation Reminders</span>
            <input
              type="checkbox"
              checked={preferences.evaluationReminders}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                evaluationReminders: e.target.checked
              }))}
              className="rounded"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Weekly Digests</span>
            <input
              type="checkbox"
              checked={preferences.weeklyDigests}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                weeklyDigests: e.target.checked
              }))}
              className="rounded"
            />
          </label>
        </div>
        
        <Button
          onClick={() => updatePreferences.mutate(preferences)}
          disabled={updatePreferences.isPending}
          className="w-full"
        >
          {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
}