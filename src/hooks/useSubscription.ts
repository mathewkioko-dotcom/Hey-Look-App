import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useSubscription = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const existingChannels = supabase.getChannels();
    existingChannels.forEach((ch) => {
      if (ch.topic.includes('subscription_changes')) {
        supabase.removeChannel(ch);
      }
    });

    const channelName = `subscription_changes_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_subscriptions' },
        (payload) => {
          if (payload.new && (payload.new as any).status === 'active') {
            setIsSubscribed(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isSubscribed };
};
