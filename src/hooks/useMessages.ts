import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChatMessage, MessageDeliveryStatus } from '../types';
import { filterVanishingMessages } from '../services/chatService';

// Helper to resolve string IDs safely even if an object was passed by mistake
function resolveUserId(param: any): string | null {
  if (!param) return null;
  if (typeof param === 'string') return param.trim();
  if (typeof param === 'object' && param.id && typeof param.id === 'string') {
    return param.id.trim();
  }
  return null;
}

// Helper to map DB string/number statuses to MessageDeliveryStatus safely
function parseMessageStatus(item: any): MessageDeliveryStatus {
  if (item.is_read || item.status === 'submerged' || item.status === '2' || item.status === 2) {
    return 2; // Submerged / Read
  }
  if (item.status === 'delivered' || item.status === '1' || item.status === 1) {
    return 1; // Surfaced / Delivered
  }
  return 0; // Anchored / Sent
}

export function useMessages(currentUserIdParam?: any, activeUserIdParam?: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Extract clean string IDs
  const currentUserId = resolveUserId(currentUserIdParam);
  const activeUserId = resolveUserId(activeUserIdParam);

  useEffect(() => {
    // STRICT GUARD: Don't run query if IDs are invalid or missing
    if (!activeUserId || !currentUserId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchMessages() {
      try {
        // Construct clean PostgREST filter string
        const filterStr = `and(sender_id.eq.${currentUserId},receiver_id.eq.${activeUserId}),and(sender_id.eq.${activeUserId},receiver_id.eq.${currentUserId})`;

        let { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(filterStr);

        if (error) {
          // Graceful fallback to simple select('*') and JS filtering
          const fallbackRes = await supabase.from('messages').select('*');
          if (!fallbackRes.error && fallbackRes.data) {
            data = fallbackRes.data.filter(
              (m: any) =>
                (m.sender_id === currentUserId && m.receiver_id === activeUserId) ||
                (m.sender_id === activeUserId && m.receiver_id === currentUserId)
            );
            error = null;
          }
        }

        if (error) {
          console.error('Error fetching messages details:', error);
          if (isMounted) {
            setMessages([]);
            setLoading(false);
          }
          return;
        }

        if (isMounted && data && Array.isArray(data)) {
          // Sort messages in JavaScript safely
          const sorted = [...data].sort((a: any, b: any) => {
            const timeA = new Date(a.created_at || 0).getTime();
            const timeB = new Date(b.created_at || 0).getTime();
            return timeA - timeB;
          });

          const mapped: ChatMessage[] = sorted.map((item: any) => ({
            id: item.id || `msg-${Math.random()}`,
            sender_id: item.sender_id,
            receiver_id: item.receiver_id,
            text: item.text || item.content || '',
            created_at: item.created_at || new Date().toISOString(),
            is_me: item.sender_id === currentUserId,
            status: parseMessageStatus(item),
            type: item.type || 'text',
            image_url: item.image_url,
            audio_duration: item.audio_duration,
            is_encrypted: item.is_encrypted ?? true,
            burn_at: item.burn_at,
            reply_to_id: item.reply_to_id,
            reply_preview: item.reply_preview,
            call_info: item.call_info,
          }));

          setMessages(filterVanishingMessages(mapped));
        }
      } catch (err) {
        console.error('Unexpected query failure in useMessages:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [activeUserId, currentUserId]);

  return { messages, setMessages, loading };
}