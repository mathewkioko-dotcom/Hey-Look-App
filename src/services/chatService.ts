import { supabase } from '../lib/supabase';
import { ChatMessage, MessageDeliveryStatus, CallLog, Profile, Conversation } from '../types';

/**
 * Filter out vanishing messages whose burn_at timestamp is in the past
 */
export function filterVanishingMessages(messages: ChatMessage[]): ChatMessage[] {
  const now = new Date().getTime();
  return messages.filter((msg) => {
    if (!msg.burn_at) return true;
    const burnTime = new Date(msg.burn_at).getTime();
    return burnTime > now;
  });
}

/**
 * Real Supabase backend binding for Chat Messages, Profiles, and Conversations
 */
export const chatService = {
  /**
   * Fetch all registered profiles from Supabase `profiles` table
   */
  async fetchAllProfiles(_currentUserId?: string): Promise<Profile[]> {
    try {
      // Strictly supabase.from('profiles').select('*') with NO .order(), .or(), or .ilike()
      const { data, error } = await supabase.from('profiles').select('*');

      if (error) {
        console.error('Profile fetch error details:', error);
        return [];
      }

      if (!data || !Array.isArray(data)) {
        return [];
      }

      // Safe mapping of results with JavaScript sorting
      return data
        .map((item: any) => ({
          id: item?.id || '',
          username: item?.username || (item?.full_name || 'nautical_user').toLowerCase().replace(/\s+/g, ''),
          full_name: item?.full_name || item?.name || 'Nautical User',
          avatar_url: item?.avatar_url || item?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item?.id || 'user')}`,
          email: item?.email || item?.email_address || '',
          is_online: Boolean(item?.is_online),
          last_seen: item?.last_seen || 'Recently',
          nautical_presence: item?.nautical_presence || (item?.is_online ? 'in_focus' : 'last_anchored'),
          last_anchored: item?.last_anchored,
          bio: item?.bio || 'Exploring HeyLook Nautical Stream',
        }))
        .sort((a, b) => (a.full_name || a.username || '').localeCompare(b.full_name || b.username || ''));
    } catch (err) {
      console.error('Profile fetch error details:', err);
      return [];
    }
  },

  /**
   * Fetch conversations grouped by partner user from Supabase `messages` table
   */
  async fetchConversations(currentUserId: string): Promise<Conversation[]> {
    if (!currentUserId) {
      return [];
    }
    try {
      // Fetch all messages involving the current user
      const { data: rawMessages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: true });

      if (error || !rawMessages || rawMessages.length === 0) {
        return [];
      }

      // Group messages by partner user ID
      const convMap: Record<string, ChatMessage[]> = {};
      rawMessages.forEach((item: any) => {
        const partnerId = item.sender_id === currentUserId ? item.receiver_id : item.sender_id;
        if (!partnerId) return;

        if (!convMap[partnerId]) {
          convMap[partnerId] = [];
        }

        convMap[partnerId].push({
          id: item.id || `msg-${Math.random()}`,
          sender_id: item.sender_id,
          receiver_id: item.receiver_id,
          text: item.text || item.content || '',
          created_at: item.created_at || new Date().toISOString(),
          is_me: item.sender_id === currentUserId,
          status: (typeof item.status === 'number' ? item.status : 3) as MessageDeliveryStatus,
          type: item.type || 'text',
          image_url: item.image_url,
          audio_duration: item.audio_duration,
          is_encrypted: item.is_encrypted ?? true,
          burn_at: item.burn_at,
          reply_to_id: item.reply_to_id,
          reply_preview: item.reply_preview,
          call_info: item.call_info,
        });
      });

      // Fetch profiles for all partner IDs
      const partnerIds = Object.keys(convMap);
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('*')
        .in('id', partnerIds);

      const profileMap: Record<string, any> = {};
      if (profileRows) {
        profileRows.forEach((p: any) => {
          profileMap[p.id] = p;
        });
      }

      const conversations: Conversation[] = partnerIds.map((partnerId) => {
        const msgs = filterVanishingMessages(convMap[partnerId]);
        const lastMsgObj = msgs[msgs.length - 1];
        const prof = profileMap[partnerId] || {};

        return {
          id: `conv_${partnerId}`,
          user: {
            id: partnerId,
            name: prof.full_name || prof.username || 'Nautical Contact',
            avatar: prof.avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
            is_online: Boolean(prof.is_online),
            last_seen: prof.last_seen || 'Recently',
            nautical_presence: prof.nautical_presence || (prof.is_online ? 'in_focus' : 'last_anchored'),
            last_anchored: prof.last_anchored,
          },
          lastMessage: lastMsgObj ? lastMsgObj.text : '',
          lastMessageTime: lastMsgObj
            ? new Date(lastMsgObj.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
          last_message_at: lastMsgObj ? lastMsgObj.created_at : undefined,
          unreadCount: msgs.filter((m) => !m.is_me && m.status !== 3).length,
          messages: msgs,
        };
      });

      return conversations;
    } catch (err) {
      console.warn('[ChatService] Exception building conversations:', err);
      return [];
    }
  },

  /**
   * Fetch messages for a specific conversation from Supabase `messages` table
   */
  async fetchMessages(currentUserId: string, targetUserId: string): Promise<ChatMessage[]> {
    if (!currentUserId || !targetUserId) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return [];
      }

      const mapped: ChatMessage[] = data.map((item: any) => ({
        id: item.id || `msg-${Math.random()}`,
        sender_id: item.sender_id,
        receiver_id: item.receiver_id,
        text: item.text || item.content || '',
        created_at: item.created_at || new Date().toISOString(),
        is_me: item.sender_id === currentUserId,
        status: (typeof item.status === 'number' ? item.status : 3) as MessageDeliveryStatus,
        type: item.type || 'text',
        image_url: item.image_url,
        audio_duration: item.audio_duration,
        is_encrypted: item.is_encrypted ?? true,
        burn_at: item.burn_at,
        reply_to_id: item.reply_to_id,
        reply_preview: item.reply_preview,
        call_info: item.call_info,
      }));

      return filterVanishingMessages(mapped);
    } catch (err) {
      console.warn('[ChatService] Error on message fetch:', err);
      return [];
    }
  },

  /**
   * Insert new message directly to Supabase `messages` table
   */
  async sendMessage(msg: Partial<ChatMessage> & { sender_id: string; receiver_id: string }): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender_id: msg.sender_id,
      receiver_id: msg.receiver_id,
      text: msg.text || '',
      created_at: msg.created_at || new Date().toISOString(),
      is_me: true,
      status: (msg.status ?? 1) as MessageDeliveryStatus, // 1 = Launched
      type: msg.type || 'text',
      image_url: msg.image_url,
      audio_duration: msg.audio_duration,
      is_encrypted: msg.is_encrypted ?? true,
      burn_at: msg.burn_at,
      reply_to_id: msg.reply_to_id,
      reply_preview: msg.reply_preview,
      call_info: msg.call_info,
    };

    try {
      const { error } = await supabase.from('messages').insert({
        id: newMessage.id,
        sender_id: newMessage.sender_id,
        receiver_id: newMessage.receiver_id,
        text: newMessage.text,
        status: newMessage.status,
        type: newMessage.type,
        image_url: newMessage.image_url,
        is_encrypted: newMessage.is_encrypted,
        burn_at: newMessage.burn_at,
        reply_to_id: newMessage.reply_to_id,
        reply_preview: newMessage.reply_preview,
        call_info: newMessage.call_info,
        created_at: newMessage.created_at,
      });

      if (error) {
        console.warn('[ChatService] Could not persist to DB:', error.message);
      }
    } catch (err) {
      console.warn('[ChatService] Network exception inserting message:', err);
    }

    return newMessage;
  },

  /**
   * Realtime Listener for messages table (INSERT and UPDATE for status updates)
   */
  subscribeToMessages(
    currentUserId: string,
    targetUserId: string,
    onNewMessage: (msg: ChatMessage) => void,
    onUpdateMessage?: (msg: Partial<ChatMessage> & { id: string }) => void
  ) {
    const topicBase = `chat_${currentUserId}_${targetUserId}`;
    const existing = supabase.getChannels();
    existing.forEach((ch) => {
      if (ch.topic === `realtime:${topicBase}` || ch.topic.startsWith(`realtime:${topicBase}_`)) {
        supabase.removeChannel(ch);
      }
    });

    const channelName = `${topicBase}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const item = payload.new;
          if (
            (item.sender_id === currentUserId && item.receiver_id === targetUserId) ||
            (item.sender_id === targetUserId && item.receiver_id === currentUserId)
          ) {
            const incoming: ChatMessage = {
              id: item.id,
              sender_id: item.sender_id,
              receiver_id: item.receiver_id,
              text: item.text || item.content || '',
              created_at: item.created_at,
              is_me: item.sender_id === currentUserId,
              status: (typeof item.status === 'number' ? item.status : 1) as MessageDeliveryStatus,
              type: item.type || 'text',
              image_url: item.image_url,
              audio_duration: item.audio_duration,
              is_encrypted: item.is_encrypted ?? true,
              burn_at: item.burn_at,
              reply_to_id: item.reply_to_id,
              reply_preview: item.reply_preview,
              call_info: item.call_info,
            };

            onNewMessage(incoming);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const item = payload.new;
          if (
            (item.sender_id === currentUserId && item.receiver_id === targetUserId) ||
            (item.sender_id === targetUserId && item.receiver_id === currentUserId)
          ) {
            if (onUpdateMessage) {
              onUpdateMessage({
                id: item.id,
                status: (typeof item.status === 'number' ? item.status : item.delivery_state || 3) as MessageDeliveryStatus,
                text: item.text,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Record Call Log in database
   */
  async recordCallLog(log: Omit<CallLog, 'id' | 'created_at'>): Promise<CallLog> {
    const newLog: CallLog = {
      ...log,
      id: `call-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('call_logs').insert(newLog);
    } catch (err) {
      console.warn('[ChatService] Call log insert fallback:', err);
    }

    return newLog;
  },

  /**
   * Advance message delivery status to 3 (Submerged) when read in viewport
   */
  async markSubmerged(messageId: string, currentUserId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('mark_message_submerged', {
        p_message_id: messageId,
        p_user_id: currentUserId,
      });

      if (error) {
        await supabase
          .from('messages')
          .update({ delivery_state: 3, status: 3 })
          .eq('id', messageId)
          .eq('receiver_id', currentUserId);
      }
      return true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Delete a message by ID from Supabase
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('messages').delete().eq('id', messageId);
      if (error) {
        console.warn('[ChatService] Error deleting message:', error.message);
      }
      return !error;
    } catch (err) {
      console.warn('[ChatService] Exception deleting message:', err);
      return false;
    }
  },

  /**
   * Clear chat history between two users
   */
  async clearHistory(currentUserId: string, targetUserId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`);
      if (error) {
        console.warn('[ChatService] Error clearing history:', error.message);
      }
      return !error;
    } catch (err) {
      console.warn('[ChatService] Exception clearing history:', err);
      return false;
    }
  },

  /**
   * Call Supabase Edge Function Chat Proxy Endpoint
   */
  async callChatEdgeProxy(prompt: string, model: string, systemInstruction?: string): Promise<string> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || '';

      const response = await fetch("https://vjgejpcglyadjladwygt.supabase.co/functions/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify({ prompt, model, systemInstruction }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Proxy error status ${response.status}`);
      }

      const resJson = await response.json();
      return resJson.text || resJson.response || 'No response returned from chat edge function.';
    } catch (err: any) {
      console.warn('[ChatService] Edge Proxy fallback:', err);
      throw err;
    }
  },
};

