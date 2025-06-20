import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useObituaryCollaborators(obituaryId: number) {
  return useQuery({
    queryKey: ['/api/obituaries', obituaryId, 'collaborators'],
    queryFn: async () => {
      const response = await fetch(`/api/obituaries/${obituaryId}/collaborators`);
      if (!response.ok) throw new Error('Failed to fetch collaborators');
      return response.json();
    },
    enabled: obituaryId > 0,
  });
}

export function useAddCollaborator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ obituaryId, email }: { obituaryId: number; email: string }) => {
      const response = await fetch(`/api/obituaries/${obituaryId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error('Failed to add collaborator');
      return response.json();
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
      const response = await fetch(`/api/obituaries/collaborators/${collaboratorId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove collaborator');
      return response.json();
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
    queryFn: async () => {
      const response = await fetch(`/api/collaborate/${uuid}`);
      if (!response.ok) throw new Error('Failed to fetch collaboration session');
      return response.json();
    },
    enabled: !!uuid,
  });
}

export function useIdentifyCollaborator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ uuid, name }: { uuid: string; name: string }) => {
      const response = await fetch(`/api/collaborate/${uuid}/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name })
      });
      if (!response.ok) throw new Error('Failed to identify collaborator');
      return response.json();
    },
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/collaborate', uuid] 
      });
    },
  });
}