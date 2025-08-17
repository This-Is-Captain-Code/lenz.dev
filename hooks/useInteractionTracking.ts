import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface TrackInteractionData {
  lensId: string;
  userId?: string;
  interactionType: 'apply' | 'capture' | 'share' | 'download';
  metadata?: string;
}

export function useInteractionTracking() {
  const trackInteraction = useMutation({
    mutationFn: async (data: TrackInteractionData) => {
      return apiRequest('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables) => {
      console.log(`Tracked ${variables.interactionType} interaction for lens ${variables.lensId}`);
    },
    onError: (error, variables) => {
      console.error(`Failed to track ${variables.interactionType} interaction:`, error);
    },
  });

  return {
    trackInteraction: trackInteraction.mutate,
    isTracking: trackInteraction.isPending,
  };
}