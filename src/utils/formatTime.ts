export const formatConversationTime = (timestamp?: string): string => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }

  // Less than 1 hour (e.g., 5m, 42m)
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`;
  }

  // Same day -> show time (e.g., 01:30 PM)
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // Older -> show date (e.g., Aug 3)
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const formatNauticalPresence = (isOnline?: boolean, lastSeenTime?: string | null): string => {
  if (isOnline) return 'Anchored';
  if (!lastSeenTime) return 'Adrift';
  const date = new Date(lastSeenTime);
  if (isNaN(date.getTime())) return 'Adrift';

  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSec < 60) return 'Last anchored 1m ago';
  if (diffInSec < 3600) return `Last anchored ${Math.floor(diffInSec / 60)}m ago`;

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) {
    return `Last anchored today at ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Last anchored yesterday at ${timeStr}`;
  }

  return `Last anchored ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
};

export const formatLastSeenStatus = (lastSeenTime?: string | null): string => {
  return formatNauticalPresence(false, lastSeenTime);
};
