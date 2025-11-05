import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, CheckCircle, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Quest {
  id: string;
  name: string;
  description: string;
  quest_type: string;
  requirement_count: number;
  xp_reward: number;
  icon: string;
  is_active: boolean;
}

interface QuestProgress {
  quest_id: string;
  progress: number;
  completed: boolean;
}

export const QuestList = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [progress, setProgress] = useState<Record<string, QuestProgress>>({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestsAndProgress();
  }, []);

  const fetchQuestsAndProgress = async () => {
    try {
      // Get user ID
      const sessionToken = localStorage.getItem('session_token');
      if (sessionToken) {
        const { data: userData } = await supabase.rpc('get_user_by_session', {
          _session_token: sessionToken
        });
        
        if (userData && userData.length > 0) {
          setUserId(userData[0].user_id);
          
          // Fetch user's quest progress
          const { data: progressData } = await supabase
            .from('user_quest_progress')
            .select('quest_id, progress, completed')
            .eq('user_id', userData[0].user_id);
          
          if (progressData) {
            const progressMap: Record<string, QuestProgress> = {};
            progressData.forEach(p => {
              progressMap[p.quest_id] = p;
            });
            setProgress(progressMap);
          }
        }
      }

      // Fetch all active quests
      const { data: questsData, error } = await supabase
        .from('quests')
        .select('*')
        .eq('is_active', true)
        .order('xp_reward', { ascending: true });
      
      if (error) throw error;
      setQuests(questsData || []);
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (questId: string, requirement: number) => {
    const questProgress = progress[questId];
    if (!questProgress) return 0;
    return Math.min((questProgress.progress / requirement) * 100, 100);
  };

  const getProgressText = (questId: string, requirement: number) => {
    const questProgress = progress[questId];
    if (!questProgress) return `0/${requirement}`;
    return `${Math.min(questProgress.progress, requirement)}/${requirement}`;
  };

  const isQuestCompleted = (questId: string) => {
    return progress[questId]?.completed || false;
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-primary/30">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Quests</h2>
        </div>
        <p className="text-muted-foreground">Loading quests...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-card/80 border-primary/30 hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold gradient-text-animated">Quests</h2>
      </div>
      
      {!userId && (
        <p className="text-muted-foreground text-sm mb-4">
          Login to track your quest progress
        </p>
      )}

      <div className="space-y-3">
        {quests.length === 0 ? (
          <p className="text-muted-foreground text-center py-3 text-sm">No active quests</p>
        ) : (
          quests.map((quest) => {
            const completed = isQuestCompleted(quest.id);
            const progressPercent = getProgressPercentage(quest.id, quest.requirement_count);
            const progressText = getProgressText(quest.id, quest.requirement_count);

            return (
              <div
                key={quest.id}
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  completed
                    ? 'bg-primary/10 border-primary/50'
                    : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xl">{quest.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <h3 className="font-semibold text-sm truncate">{quest.name}</h3>
                      {completed && (
                        <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {quest.description}
                    </p>
                    
                    {userId && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {progressText}
                          </span>
                          <span className="text-primary font-semibold">
                            +{quest.xp_reward} XP
                          </span>
                        </div>
                        <Progress value={progressPercent} className="h-1.5" />
                      </div>
                    )}
                    
                    {!userId && (
                      <span className="text-xs text-primary font-semibold">
                        +{quest.xp_reward} XP
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {userId && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground">
            💡 Complete quests to earn XP!
          </p>
        </div>
      )}
    </Card>
  );
};
