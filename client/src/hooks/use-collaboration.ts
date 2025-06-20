import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useObituaryCollaborators(obituaryId: number) {
  return useQuery({
    queryKey: ['/api/obituaries', obituaryId, 'collaborators'],
    queryFn: () => apiRequest(`/api/obituaries/${obituaryId}/collaborators`),
    enabled: obituaryId > 0,
  });
}

export function useAddCollaborator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ obituaryId, email }: { obituaryId: number; email: string }) => {
      return apiRequest(`/api/obituaries/${obituaryId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },
    onSuccess: (_, { obituaryId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/obituaries', obituaryId, 'collaborators'] 
      });
    },
  });
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ collaboratorId, obituaryId }: { collaboratorId: number; obituaryId: number }) => {
      return apiRequest(`/api/obituaries/collaborators/${collaboratorId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: (_, { obituaryId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/obituaries', obituaryId, 'collaborators'] 
      });
    },
  });
}

export function useCollaborationSession(uuid: string) {
  return useQuery({
    queryKey: ['/api/collaborate', uuid],
    queryFn: () => apiRequest(`/api/collaborate/${uuid}`),
    enabled: !!uuid,
  });
}

export function useIdentifyCollaborator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ uuid, name }: { uuid: string; name: string }) => {
      return apiRequest(`/api/collaborate/${uuid}/identify`, {
        method: 'POST',
        body: JSON.stringify({ name })
      });
    },
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/collaborate', uuid] 
      });
    },
  });
}