import { useState, useEffect } from "react";
import Navigation from "@/components/layout/Navigation";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Send, Users } from "lucide-react";

interface ChatRoom {
  room_id: string;
  room_name: string;
  is_group: boolean;
  members: any[];
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

const Chat = ({ hideNavigation = false }: { hideNavigation?: boolean } = {}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.room_id);
    }
  }, [selectedRoom]);

  const fetchChatRooms = async () => {
    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_chat_rooms_with_context', {
        _session_token: sessionToken
      });

      if (error) throw error;
      setRooms(data || []);
      if (data && data.length > 0) {
        setSelectedRoom(data[0]);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      toast.error("Failed to load chat rooms");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;

    try {
      const { data: userData } = await supabase.rpc('get_user_by_session', {
        _session_token: sessionToken
      });

      if (!userData || userData.length === 0) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: selectedRoom.room_id,
          sender_id: userData[0].user_id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedRoom.room_id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Halloween decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[5%] text-6xl animate-float opacity-20">🎃</div>
        <div className="absolute top-32 right-[8%] text-5xl animate-float-delayed opacity-25">👻</div>
      </div>

      {!hideNavigation && <Navigation />}
      {!hideNavigation && <AnnouncementBanner />}
      
      <div className="container mx-auto px-4 py-12 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="mb-8 space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold tracking-tight">
              Chat <span className="text-primary">Rooms</span>
            </h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat Rooms List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>{rooms.length} active chats</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading rooms...
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No chat rooms yet
                </div>
              ) : (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <button
                      key={room.room_id}
                      onClick={() => setSelectedRoom(room)}
                      className={`w-full p-4 rounded-lg text-left transition-colors ${
                        selectedRoom?.room_id === room.room_id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="font-medium truncate">{room.room_name}</span>
                      </div>
                      <p className="text-xs mt-1 opacity-70">
                        {room.members.length} members
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{selectedRoom?.room_name || "Select a chat"}</CardTitle>
              <CardDescription>
                {selectedRoom ? `${selectedRoom.members.length} members` : "Choose a conversation"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="h-[400px] overflow-y-auto space-y-3 p-4 bg-muted/30 rounded-lg">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className="p-3 rounded-lg bg-card border border-border"
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              {selectedRoom && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} className="gap-2">
                    <Send className="w-4 h-4" />
                    Send
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;
