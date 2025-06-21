import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FinalSpace, InsertFinalSpace, FinalSpaceComment, InsertFinalSpaceComment } from "@shared/schema";

export function useFinalSpaces(userId: number, userType: string) {
  return useQuery({
    queryKey: ['/api/final-spaces', userId, userType],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/final-spaces?userId=${userId}&userType=${userType}`);
      return res.json();
    }
  });
}

export function useFinalSpace(id: number) {
  return useQuery({
    queryKey: ['/api/final-spaces', id],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/final-spaces/${id}`);
      return res.json();
    },
    enabled: !!id
  });
}

export function useFinalSpaceBySlug(slug: string) {
  return useQuery({
    queryKey: ['/api/final-spaces/slug', slug],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/final-spaces/slug/${slug}`);
      return res.json();
    },
    enabled: !!slug
  });
}

export function useCreateFinalSpace() {
  return useMutation({
    mutationFn: async (data: InsertFinalSpace): Promise<FinalSpace> => {
      const res = await apiRequest('POST', '/api/final-spaces', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/final-spaces'] });
    }
  });
}

export function useUpdateFinalSpace() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FinalSpace> }): Promise<FinalSpace> => {
      const res = await apiRequest('PUT', `/api/final-spaces/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/final-spaces'] });
    }
  });
}

export function useDeleteFinalSpace() {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/final-spaces/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/final-spaces'] });
    }
  });
}

export function useFinalSpaceComments(finalSpaceId: number) {
  return useQuery({
    queryKey: ['/api/final-spaces', finalSpaceId, 'comments'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/final-spaces/${finalSpaceId}/comments`);
      return res.json();
    },
    enabled: !!finalSpaceId
  });
}

export function useCreateFinalSpaceComment() {
  return useMutation({
    mutationFn: async ({ finalSpaceId, data }: { finalSpaceId: number; data: Omit<InsertFinalSpaceComment, 'finalSpaceId'> }): Promise<FinalSpaceComment> => {
      const res = await apiRequest('POST', `/api/final-spaces/${finalSpaceId}/comments`, data);
      return res.json();
    },
    onSuccess: (_, { finalSpaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/final-spaces', finalSpaceId, 'comments'] });
    }
  });
}

export function useDeleteFinalSpaceComment() {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/final-spaces/comments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/final-spaces'] });
    }
  });
}

export function useCompletedObituaries(userId: number, userType: string = 'user') {
  return useQuery({
    queryKey: ['/api/obituaries/completed', userId, userType],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/obituaries/completed?userId=${userId}&userType=${userType}`);
      return res.json();
    },
    enabled: !!userId
  });
}