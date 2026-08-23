export type ActiveTab = "chats" | "feed" | "reels" | "profile";

export type ThemeMode = "dark" | "light";

export type NauticalPresenceState =
  | "In Focus"
  | "Adrift"
  | "Last Anchored"
  | "in_focus"
  | "adrift"
  | "last_anchored";

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  email?: string;
  custom_status?: NauticalPresenceState;
  is_online?: boolean;
  last_seen?: string;
  nautical_presence?: NauticalPresenceState;
  last_anchored?: string;
  bio?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

/**
 * Nautical Delivery Status integer values:
 * 0 = Stranded (Failed / Hazard)
 * 1 = Launched (Sent / Sailboat)
 * 2 = Docked (Delivered / Outline Anchor)
 * 3 = Submerged (Read / Deep Blue Filled Anchor)
 */
export type MessageDeliveryStatus = 0 | 1 | 2 | 3;

export interface MessageMetadata {
  translation?: string;
  translatedLang?: string;
  polishedText?: string;
  tone?: string;
  factCheck?: string;
  note?: string;
  isBlurred?: boolean;
  isLocked?: boolean;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  room_id?: string;
  sender_id: string;
  receiver_id?: string;
  text: string;
  created_at: string;
  is_me: boolean;
  status: MessageDeliveryStatus; // 0, 1, 2, 3
  delivery_state?: MessageDeliveryStatus;
  type?: "text" | "image" | "voice" | "call_log";
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  audio_duration?: string;
  is_encrypted?: boolean;
  burn_at?: string; // Vanishing message timestamp
  reply_to_id?: string;
  reply_preview?: {
    sender_name: string;
    text: string;
    image_url?: string;
  };
  call_info?: {
    call_type: "audio" | "video";
    duration?: string;
    status: "connected" | "missed";
  };
  metadata?: MessageMetadata;
  is_edited?: boolean;
  is_deleted?: boolean;
}

export interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    is_online?: boolean;
    last_seen?: string;
    nautical_presence?: NauticalPresenceState;
    custom_status?: NauticalPresenceState;
    last_anchored?: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  last_message_at?: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export interface CallLog {
  id: string;
  caller_id: string;
  receiver_id: string;
  caller_name: string;
  caller_avatar: string;
  call_type: "audio" | "video";
  status: "connected" | "missed";
  duration?: string;
  created_at: string;
}

export type ReactionType = "Like" | "Love" | "Haha" | "Wow" | "Sad" | "Angry";

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // array of user_ids who voted for this option
}

export interface PollData {
  question: string;
  options: PollOption[];
}

export type PrivacyLevel = "Public" | "Only Me" | "Anchors Only";

export interface PostComment {
  id: string;
  user_id?: string;
  user_name: string;
  user_avatar: string;
  content: string;
  created_at: string;
  likes_count: number;
  parent_id?: string | null;
  replies?: PostComment[];
}

export interface FeedPost {
  id: string;
  user_id?: string;
  author: {
    name: string;
    avatar: string;
    username: string;
    is_online?: boolean;
    custom_status?: NauticalPresenceState;
  };
  content: string;
  image_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  comments: PostComment[];
  feeling_tag?: string;

  // New Domain Features
  background_style?: string | null; // CSS dual-tone gradient code
  poll_data?: PollData | null;
  privacy_level?: PrivacyLevel;
  shared_post_id?: string | null;
  shared_post?: FeedPost | null;
  reactions_summary?: {
    top_reactions: ReactionType[];
    total_count: number;
    user_reaction?: ReactionType;
    counts_by_type?: Record<ReactionType, number>;
  };
}

export interface ReelItem {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  caption: string;
  song_title: string;
  video_url: string;
  poster_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
}

export interface BeaconComment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  text: string;
  created_at: string;
  is_private_dm?: boolean;
}

export interface Beacon {
  id: string;
  user_id: string;
  author: {
    name: string;
    avatar: string;
    username?: string;
  };
  media_type: "image" | "video" | "audio" | "text";
  content_url?: string;
  text_content?: string;
  bg_gradient?: string;
  custom_hex?: string;
  font_family?: string;
  font_size?: number;
  caption_font_family?: string;
  audio_visualizer?: string;
  is_edited?: boolean;
  original_caption?: string;
  edited_at?: string;
  is_one_time?: boolean;
  created_at: string;
  expires_at: string;
  ttl_setting: "1h" | "6h" | "12h" | "24h" | "48h" | "7d" | "1-time" | "custom";
  allow_public_comments: boolean;
  viewed_by?: string[];
  comments?: BeaconComment[];
}

export type OAuthProvider =
  | "google"
  | "github"
  | "discord"
  | "facebook"
  | "spotify"
  | "twitter";

// ============================================================================
// MESSAGE ACTION ENGINE TYPES
// ============================================================================

/** Sub-category groups for the advanced emoji reaction drawer */
export type ReactionCategory = "Frequently Used" | "Animals" | "Objects";

/** Export file formats for the Export Message action */
export type ExportFormat = "TXT" | "JSON" | "PDF";

/** Collections for the Star/Bookmark message action */
export type StarCollection = "Work" | "Personal" | "Read Later";

/** Languages available for the Translate action */
export type TranslateLanguage =
  | "English"
  | "Spanish"
  | "French"
  | "Swahili"
  | "Japanese";

/** Pin duration options for the Pin Message action */
export type PinDuration = "24 Hours" | "7 Days" | "30 Days";

/** Report reasons for the Report Message action */
export type ReportReason = "Spam" | "Harassment" | "Misinformation";

/** A message the current user reacted to, persisted to Supabase */
export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  category: ReactionCategory;
  created_at: string;
}

/** A bookmarked / starred message in a named collection */
export interface StarredMessage {
  id: string;
  message_id: string;
  user_id: string;
  collection: StarCollection;
  created_at: string;
}

/** A moderation report submitted for a message */
export interface MessageReport {
  id: string;
  message_id: string;
  reporter_id: string;
  reason: ReportReason;
  created_at: string;
}

/** A single entry in the edit-history revision log */
export interface MessageEditHistory {
  id: string;
  message_id: string;
  previous_text: string;
  edited_at: string;
}

/** Rich metadata surfaced by the Message Info action */
export interface MessageInfo {
  id: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  encryption_hash?: string;
  sender_id?: string;
  receiver_id?: string;
  delivery_state?: MessageDeliveryStatus;
}

// ============================================================================
// CHAT INFO DRAWER TYPES (WhatsApp-style Conversation Settings)
// ============================================================================

/** Timer options for disappearing / vanishing messages */
export type DisappearingTimer = "Off" | "24 Hours" | "7 Days" | "90 Days";

/** Duration options for the mute-notifications popup */
export type MuteDuration = "1 Hour" | "8 Hours" | "1 Week" | "Always";

/** Sub-category filters for the Media, Links & Docs viewer */
export type MediaFilter =
  | "Photos"
  | "Videos"
  | "Audio Clips"
  | "Links"
  | "Documents";

/** Wallpaper style category selector */
export type WallpaperCategory =
  | "Solid Colors"
  | "Dark Gradients"
  | "Custom Gallery";

/** A selected wallpaper theme */
export interface WallpaperChoice {
  category: WallpaperCategory;
  value: string;
  solid?: string;
  gradient?: string;
  imageUrl?: string;
}

/** Search sub-filter mode toggles for "Search in Conversation" */
export interface ConversationSearchFilters {
  byDate: boolean;
  bySender: boolean;
  hasMedia: boolean;
}

/** Toast / notice handler used by the drawer to surface transient messages */
export type NoticeFn = (msg: string) => void;

/** A group the current user shares with the target contact */
export interface SharedGroup {
  id: string;
  name: string;
  avatar: string;
  members_count: number;
  last_active: string;
  is_active?: boolean;
}

/** Lock-chat PIN configuration state */
export interface LockChatConfig {
  enabled: boolean;
  requiresBiometric: boolean;
  pin: string;
}

/** Per-conversation preference overrides (persisted per room) */
export interface ConversationPreferences {
  conversationId: string;
  mutedUntil?: string | null;
  disappearingTimer?: DisappearingTimer;
  wallpaper?: WallpaperChoice | null;
  isLocked?: boolean;
  lockConfig?: LockChatConfig | null;
  isBlocked?: boolean;
  blockReason?: string;
}
