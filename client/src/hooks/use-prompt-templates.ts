import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { PromptTemplate } from "@shared/schema";

export function usePromptTemplates() {
  return useQuery<PromptTemplate[]>({
    queryKey: ["/api/prompt-templates"],
    queryFn: async () => {
      const response = await fetch('/api/prompt-templates');
      if (!response.ok) throw new Error('Failed to fetch prompt templates');
      return response.json();
    },
  });
}

export function useUpdatePromptTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PromptTemplate> }) => {
      return await apiRequest('PUT', `/api/prompt-templates/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
    },
  });
}

export function useCreatePromptTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<PromptTemplate>) => {
      return await apiRequest('POST', '/api/prompt-templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
    },
  });
}