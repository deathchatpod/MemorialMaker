import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Obituary, GeneratedObituary } from "@shared/schema";

export function useObituary(id: number) {
  return useQuery<Obituary>({
    queryKey: ["/api/obituaries", id],
    queryFn: async () => {
      const response = await fetch(`/api/obituaries/${id}`);
      if (!response.ok) throw new Error('Failed to fetch obituary');
      return response.json();
    },
    enabled: !!id,
  });
}

export function useObituaries(userId: number, userType: string) {
  return useQuery<Obituary[]>({
    queryKey: ["/api/obituaries", userId, userType],
    queryFn: async () => {
      const response = await fetch(`/api/obituaries?userId=${userId}&userType=${userType}`);
      if (!response.ok) throw new Error('Failed to fetch obituaries');
      return response.json();
    },
  });
}

export function useGeneratedObituaries(obituaryId: number) {
  return useQuery<GeneratedObituary[]>({
    queryKey: ["/api/obituaries", obituaryId, "generated"],
    queryFn: async () => {
      const response = await fetch(`/api/obituaries/${obituaryId}/generated`);
      if (!response.ok) throw new Error('Failed to fetch generated obituaries');
      return response.json();
    },
    enabled: !!obituaryId,
  });
}

export function useCreateObituary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ formData, userId, photo }: { formData: any; userId: number; photo?: File }) => {
      const form = new FormData();
      form.append('userId', userId.toString());
      form.append('formData', JSON.stringify(formData));
      if (photo) {
        form.append('photo', photo);
      }

      const response = await fetch('/api/obituaries', {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        throw new Error('Failed to create obituary');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/obituaries"] });
      toast({
        title: "Success",
        description: "Obituary created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create obituary. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useGenerateObituaries() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (obituaryId: number) => {
      return await apiRequest('POST', `/api/obituaries/${obituaryId}/generate`);
    },
    onSuccess: (_, obituaryId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/obituaries", obituaryId, "generated"] });
      toast({
        title: "Success",
        description: "6 obituaries generated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate obituaries. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateObituary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      return await apiRequest('PUT', `/api/generated-obituaries/${id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/obituaries"] });
      toast({
        title: "Success",
        description: "Obituary updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update obituary. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useGenerateRevision() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      obituaryId, 
      aiProvider, 
      feedback 
    }: { 
      obituaryId: number; 
      aiProvider: string; 
      feedback: { liked: string[]; disliked: string[] } 
    }) => {
      return await apiRequest('POST', `/api/obituaries/${obituaryId}/revise`, {
        aiProvider,
        feedback,
      });
    },
    onSuccess: (_, { obituaryId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/obituaries", obituaryId, "generated"] });
      toast({
        title: "Success",
        description: "Revised obituary generated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate revision. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDownloadPDF() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ obituaryId, generatedObituaryId }: { obituaryId: number; generatedObituaryId: number }) => {
      const response = await fetch(`/api/obituaries/${obituaryId}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generatedObituaryId }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `obituary_${generatedObituaryId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "PDF downloaded successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    },
  });
}
