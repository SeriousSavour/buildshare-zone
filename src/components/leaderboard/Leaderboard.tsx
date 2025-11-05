import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Crown, Medal } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  quests_completed: number;
  total_xp: number;
}

export const Leaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase.rpc('get_leaderboard', { _limit: 10 });
      
      if (error) throw error;
      setLeaders(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-muted-foreground font-semibold">#{index + 1}</span>;
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-primary/30">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Quest Leaderboard</h2>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-card/80 border-primary/30 hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold gradient-text-animated">Leaderboard</h2>
      </div>
      
      <div className="space-y-2">
        {leaders.length === 0 ? (
          <p className="text-muted-foreground text-center py-3 text-sm">No completions yet!</p>
        ) : (
          leaders.map((leader, index) => (
            <div
              key={leader.user_id}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ${
                index === 0
                  ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/30'
                  : index === 1
                  ? 'bg-gradient-to-r from-gray-400/10 to-gray-400/5 border border-gray-400/30'
                  : index === 2
                  ? 'bg-gradient-to-r from-amber-600/10 to-amber-600/5 border border-amber-600/30'
                  : 'bg-muted/30 border border-border/50 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                {getRankIcon(index)}
              </div>
              
              <div className="flex-shrink-0">
                {leader.avatar_url ? (
                  <img
                    src={leader.avatar_url}
                    alt={leader.username}
                    className="w-8 h-8 rounded-full border-2 border-primary/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                    <span className="text-sm">{leader.username[0].toUpperCase()}</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm">
                  {leader.display_name || leader.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  {leader.quests_completed} {leader.quests_completed === 1 ? 'quest' : 'quests'}
                </p>
              </div>
              
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-primary">{leader.total_xp} XP</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
