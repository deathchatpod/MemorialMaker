import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FinalSpace, InsertFinalSpace, FinalSpaceComment, InsertFinalSpaceComment } from "@shared/schema";

export function useFinalSpaces(userId: number, userType: string) {
  return useQuery({
    queryKey: ['/api/final-spaces', userId, userType],
    queryFn: () => apiRequest(`/api/final-spaces?userId=${userId}&userType=${userType}`)
  });
}

export function useFinalSpace(id: number) {
  return useQuery({
    queryKey: ['/api/final-spaces', id],
    queryFn: () => apiRequest(`/api/final-spaces/${id}`),
    enabled: !!id
  });
}

export function useFinalSpaceBySlug(slug: string) {
  return useQuery({
    queryKey: ['/api/final-spaces/slug', slug],
    queryFn: () => apiRequest(`/api/final-spaces/slug/${slug}`),
    enabled: !!slug
  });
}

export function useCreateFinalSpace() {
  return useMutation({
    mutationFn: async (data: InsertFinalSpace): Promise<FinalSpace> => {
      return apiRequest('/api/final-spaces', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/final-spaces'] });
    }
  });
}

export function useUpdateFinalSpace() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FinalSpace> }): Promise<FinalSpace> => {
      return apiRequest(`/api/final-spaces/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/final-spaces'] });
    }
  });
}

export function useDeleteFinalSpace() {
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/final-spaces/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/final-spaces'] });
    }
  });
}

export function useFinalSpaceComments(finalSpaceId: number) {
  return useQuery({
    queryKey: ['/api/final-spaces', finalSpaceId, 'comments'],
    queryFn: () => apiRequest(`/api/final-spaces/${finalSpaceId}/comments`, {
      method: 'GET'
    }),
    enabled: !!finalSpaceId
  });
}

export function useCreateFinalSpaceComment() {
  return useMutation({
    mutationFn: async ({ finalSpaceId, data }: { finalSpaceId: number; data: Omit<InsertFinalSpaceComment, 'finalSpaceId'> }): Promise<FinalSpaceComment> => {
      return apiRequest(`/api/final-spaces/${finalSpaceId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (_, { finalSpaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/final-spaces', finalSpaceId, 'comments'] });
    }
  });
}

export function useDeleteFinalSpaceComment() {
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/final-spaces/comments/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/final-spaces'] });
    }
  });
}

export function useCompletedObituaries(userId: number) {
  return useQuery({
    queryKey: ['/api/obituaries/completed', userId],
    queryFn: () => apiRequest(`/api/obituaries/completed?userId=${userId}`, {
      method: 'GET'
    }),
    enabled: !!userId
  });
}