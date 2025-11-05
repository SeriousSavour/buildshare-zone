import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type QuestType = 'create_game' | 'like_games' | 'play_games' | 'add_friends' | 'upload_avatar';

export const useQuestTracking = () => {
  const trackQuestProgress = useCallback(async (questType: QuestType, userId?: string) => {
    try {
      // Get user ID if not provided
      let targetUserId = userId;
      if (!targetUserId) {
        const sessionToken = localStorage.getItem('session_token');
        if (!sessionToken) return;

        const { data } = await supabase.rpc('get_user_by_session', {
          _session_token: sessionToken
        });
        
        if (!data || data.length === 0) return;
        targetUserId = data[0].user_id;
      }

      // Update quest progress
      const { data: updated, error } = await supabase.rpc('update_quest_progress', {
        _user_id: targetUserId,
        _quest_type: questType,
        _increment: 1
      });

      if (error) throw error;

      // Check if quest was just completed
      if (updated) {
        const { data: questData } = await supabase
          .from('user_quest_progress')
          .select('*, quests(*)')
          .eq('user_id', targetUserId)
          .eq('completed', true)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();

        if (questData && questData.completed_at) {
          const completedTime = new Date(questData.completed_at).getTime();
          const now = Date.now();
          
          // If completed within last 5 seconds, show notification
          if (now - completedTime < 5000) {
            toast.success(`Quest Complete! ${questData.quests.icon} ${questData.quests.name}`, {
              description: `You earned ${questData.quests.xp_reward} XP!`
            });
          }
        }
      }
    } catch (error) {
      console.error('Error tracking quest progress:', error);
    }
  }, []);

  return { trackQuestProgress };
};
