import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Edit, Users, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DataTable, { createBadgeRenderer, formatDate, createActionButtons } from "@/components/DataTable";

export default function MyCollaborations() {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const userTypeParam = urlParams.get('userType') || 'admin';
  const userIdParam = parseInt(urlParams.get('userId') || '1');
  
  // Get user email based on type
  const getUserEmail = () => {
    switch (userTypeParam) {
      case 'admin': return 'admin@deathmatters.com';
      case 'funeral_home': return 'funeral@deathmatters.com';
      case 'employee': return 'employee@deathmatters.com';
      case 'individual': return 'individual@deathmatters.com';
      default: return 'admin@deathmatters.com';
    }
  };

  const { data: collaborations = [], isLoading, error } = useQuery({
    queryKey: ['/api/my-collaborations', { 
      userEmail: getUserEmail(),
      userId: userIdParam,
      userType: userTypeParam 
    }],
    queryFn: async () => {
      const userEmail = getUserEmail();
      const response = await fetch(`/api/my-collaborations?userEmail=${encodeURIComponent(userEmail)}&userId=${userIdParam}&userType=${userTypeParam}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch collaborations: ${response.status}`);
      }
      const data = await response.json();
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: true,
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'obituary':
        return 'bg-purple-100 text-purple-800';
      case 'finalspace':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    console.error('Collaboration query error:', error);
  }

  return (
    <DataTable
      data={Array.isArray(collaborations) ? collaborations : []}
      columns={[
        {
          key: "name",
          title: "Name",
          sortable: true,
          render: (value) => value || "Untitled"
        },
        {
          key: "type",
          title: "Type",
          sortable: true,
          filterable: true,
          filterOptions: [
            { value: "obituary", label: "Obituary" },
            { value: "finalspace", label: "Memorial" }
          ],
          render: (value) => (
            <Badge className={getTypeColor(value)}>
              {value === 'FinalSpace' ? 'Memorial' : value}
            </Badge>
          )
        },
        {
          key: "status",
          title: "Status",
          sortable: true,
          filterable: true,
          filterOptions: [
            { value: "pending", label: "Pending" },
            { value: "accepted", label: "Accepted" },
            { value: "declined", label: "Declined" }
          ],
          render: createBadgeRenderer(getStatusColor)
        },
        {
          key: "invitedBy",
          title: "Invited By",
          sortable: true,
          render: (value) => value || "Unknown"
        },
        {
          key: "createdAt",
          title: "Date Invited",
          sortable: true,
          render: formatDate
        },
        {
          key: "actions",
          title: "Actions",
          render: createActionButtons([
            {
              icon: <Eye className="w-4 h-4" />,
              onClick: (row) => {
                if (row.type === 'Obituary') {
                  window.location.href = `/obituaries/${row.entityId}/generate`;
                } else {
                  window.location.href = `/final-spaces/${row.entityId}`;
                }
              },
              title: "View"
            },
            {
              icon: <Edit className="w-4 h-4" />,
              onClick: (row) => {
                if (row.type === 'Obituary') {
                  window.location.href = `/obituaries/${row.entityId}/edit`;
                } else {
                  window.location.href = `/final-spaces/edit/${row.entityId}?userType=${userTypeParam}&userId=${userIdParam}`;
                }
              },
              title: "Edit"
            }
          ])
        }
      ]}
      searchPlaceholder="Search by name or email..."
      emptyState={{
        title: "No collaborations found",
        description: "You haven't been invited to collaborate on any obituaries or memorials yet.",
        icon: <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      }}
      isLoading={isLoading}
    />
  );
}