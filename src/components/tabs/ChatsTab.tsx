import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Anchor,
  Users,
  MessageSquarePlus,
  X,
  Radio,
  RadioReceiver,
  Sparkles,
} from "lucide-react";
import {
  Conversation,
  ChatMessage,
  Profile,
  Beacon,
  BeaconComment,
} from "../../types";
import { ChatView } from "../ChatView";
import { usePresence } from "../../hooks/usePresence";
import {
  useTypingIndicator,
  getCustomTypingPhrase,
} from "../../hooks/useTypingIndicator";
import { chatService, isValidUuid } from "../../services/chatService";
import {
  formatConversationTime,
  formatNauticalPresence,
} from "../../utils/formatTime";
import { BeaconModal } from "../BeaconModal";
import { BeaconViewer } from "../BeaconViewer";
import { ContactRosterModal } from "../ContactRosterModal";
import { HymliAiButton } from "../HymliAiButton";
import { supabase } from "../../lib/supabase";
import { WebRTCState } from "../../hooks/useWebRTCCall";

interface ChatsTabProps {
  currentUser: Profile;
  isDark: boolean;
  webrtc?: WebRTCState;
}

export const ChatsTab: React.FC<ChatsTabProps> = ({
  currentUser,
  isDark,
  webrtc,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [registeredProfiles, setRegisteredProfiles] = useState<Profile[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

  // Beacon Modal & Viewer State
  const [isBeaconModalOpen, setIsBeaconModalOpen] = useState(false);
  const [isBeaconViewerOpen, setIsBeaconViewerOpen] = useState(false);
  const [selectedBeaconProfileId, setSelectedBeaconProfileId] =
    useState<string>("");
  const [beacons, setBeacons] = useState<Beacon[]>([]);

  // Nautical presence hook for currentUser
  const currentUserId = currentUser?.id || "";
  const { isUserOnline, onlinePresences } = usePresence(currentUserId);
  const { isUserTyping } = useTypingIndicator();

  // Load real Supabase database conversations, profiles, & beacons
  useEffect(() => {
    let isMounted = true;
    if (!currentUserId) return;

    const loadRealBackendData = async () => {
      setIsLoading(true);
      try {
        const [convs, profiles, beaconsResult, viewsResult] = await Promise.all(
          [
            chatService.fetchConversations(currentUserId).catch(() => []),
            chatService.fetchAllProfiles(currentUserId).catch(() => []),
            (async () => {
              try {
                return await supabase.from("beacons").select("*");
              } catch {
                return { data: [], error: null };
              }
            })(),
            (async () => {
              try {
                return await supabase.from("beacon_views").select("*");
              } catch {
                return { data: [], error: null };
              }
            })(),
          ],
        );

        const viewedBeaconSet = new Set(
          viewsResult && viewsResult.data && Array.isArray(viewsResult.data)
            ? viewsResult.data.map((v: any) => v.beacon_id || v.id)
            : [],
        );

        if (isMounted) {
          setConversations(convs || []);
          setRegisteredProfiles(profiles || []);
          if (convs && convs.length > 0 && !selectedConvId) {
            setSelectedConvId(convs[0].id);
          }

          if (
            beaconsResult &&
            beaconsResult.data &&
            beaconsResult.data.length > 0
          ) {
            const fetchedBeacons: Beacon[] = beaconsResult.data.map(
              (row: any) => {
                const hasViewedInDb = viewedBeaconSet.has(row.id);
                const hasViewedInArray =
                  Array.isArray(row.viewed_by) &&
                  row.viewed_by.includes(currentUserId);
                const viewedByList: string[] =
                  hasViewedInDb || hasViewedInArray ? [currentUserId] : [];

                return {
                  id: row.id || `beacon_${Date.now()}_${Math.random()}`,
                  user_id: row.user_id,
                  author: {
                    name:
                      row.author_name ||
                      row.profiles?.full_name ||
                      row.profiles?.username ||
                      "Harbor User",
                    avatar:
                      row.author_avatar ||
                      row.profiles?.avatar_url ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
                    username: row.author_username || row.profiles?.username,
                  },
                  media_type: row.media_type || row.format || "text",
                  content_url: row.content_url || row.media_url,
                  text_content: row.text_content || row.caption,
                  bg_gradient: row.bg_gradient || row.bg_aura,
                  custom_hex: row.custom_hex,
                  font_family: row.font_family,
                  font_size: row.font_size,
                  created_at: row.created_at || new Date().toISOString(),
                  expires_at:
                    row.expires_at ||
                    new Date(Date.now() + 86400000).toISOString(),
                  ttl_setting: row.ttl_setting || "24h",
                  allow_public_comments: row.allow_public_comments !== false,
                  is_one_time: row.is_one_time === true,
                  viewed_by: viewedByList,
                  comments: row.comments || [],
                };
              },
            );

            // Merge fetched Supabase beacons with existing initial beacons
            setBeacons((prev) => {
              const existingIds = new Set(prev.map((b) => b.id));
              const newItems = fetchedBeacons.filter(
                (b) => !existingIds.has(b.id),
              );
              return [...newItems, ...prev];
            });
          }

          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error loading backend data:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRealBackendData();

    // Subscribe to realtime beacon broadcasts if table exists
    const existingBeaconChannels = supabase.getChannels();
    existingBeaconChannels.forEach((ch) => {
      if (ch.topic.includes("beacons_realtime")) {
        supabase.removeChannel(ch);
      }
    });

    const beaconChannelName = `beacons_realtime_${Math.random().toString(36).substring(2, 9)}`;
    const beaconChannel = supabase
      .channel(beaconChannelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "beacons" },
        (payload) => {
          if (!isMounted) return;
          const row = payload.new;
          if (row) {
            const newBeacon: Beacon = {
              id: row.id,
              user_id: row.user_id,
              author: {
                name: row.author_name || "Harbor Member",
                avatar:
                  row.author_avatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
              },
              media_type: row.media_type || "text",
              content_url: row.content_url,
              text_content: row.text_content,
              bg_gradient: row.bg_gradient,
              custom_hex: row.custom_hex,
              font_family: row.font_family,
              font_size: row.font_size,
              created_at: row.created_at || new Date().toISOString(),
              expires_at:
                row.expires_at || new Date(Date.now() + 86400000).toISOString(),
              ttl_setting: row.ttl_setting || "24h",
              allow_public_comments: row.allow_public_comments !== false,
              is_one_time: row.is_one_time === true,
              viewed_by: [],
              comments: [],
            };
            setBeacons((prev) => [newBeacon, ...prev]);
          }
        },
      )
      .subscribe();

    // ---- REAL-TIME MESSAGES: keep sidebar conversation list in sync ----
    // Subscribes to any INSERT on the messages table and refreshes the
    // conversation list so both the sender and the receiver see the new
    // message preview + reordered list instantly, even when the chat is not
    // actively open.
    const messagesChannel = supabase
      .channel(
        `messages_realtime_${Math.random().toString(36).substring(2, 9)}`,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (!isMounted) return;
          const row = payload.new as any;
          if (!row) return;

          // Only react to messages involving the current user.
          const isMine = row.sender_id === currentUserId;
          const isForMe = row.receiver_id === currentUserId;
          if (!isMine && !isForMe) return;

          // Determine which conversation this message belongs to.
          const otherUserId = isMine ? row.receiver_id : row.sender_id;
          const convId = row.room_id || `conv_${otherUserId}`;

          const text =
            (row.text as string) ||
            (row.type === "image"
              ? "🖼️ Photo"
              : row.type === "voice"
                ? "🎤 Voice note"
                : "New message");

          const createdAt = row.created_at || new Date().toISOString();

          // Determine whether this is the currently-selected (active) chat. If
          // the incoming message is for a DIFFERENT contact (a background
          // chat) and was sent by that contact (not by me), we bump their
          // unread count so the sidebar shows a live badge without a refresh.
          const isBackgroundChat =
            convId !== selectedConvId &&
            row.sender_id !== currentUserId &&
            row.sender_id !== selectedConvId;

          setConversations((prev) => {
            const list = prev || [];
            const existing = list.find((c) => c.id === convId);
            if (existing) {
              const updated: Conversation = {
                ...existing,
                lastMessage: text,
                lastMessageTime: formatConversationTime(createdAt),
                last_message_at: createdAt,
                unreadCount: isBackgroundChat
                  ? (existing.unreadCount || 0) + 1
                  : existing.unreadCount || 0,
              };

              // Move the touched conversation to the top of the list.
              const rest = list.filter((c) => c.id !== convId);
              return [updated, ...rest];
            }

            // ---- AUTO-UPDATING ROSTER ----
            // The message is from a contact that is not yet in the sidebar
            // (e.g. a brand-new sender). Instead of ignoring it (which is why
            // "No active anchors yet" used to persist until a refresh), we
            // optimistically create a placeholder conversation now and then
            // fetch the partner's profile to fill in their name/avatar so the
            // roster updates immediately.
            const partnerId = otherUserId;
            // Use the exact same conv id used for the existence lookup above so
            // a message can never create a duplicate roster entry.
            const placeholder: Conversation = {
              id: convId,
              user: {
                id: partnerId,
                name: "Nautical Contact",
                avatar:
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
                is_online: false,
                nautical_presence: "last_anchored",
              },
              lastMessage: text,
              lastMessageTime: formatConversationTime(createdAt),
              last_message_at: createdAt,
              unreadCount: isForMe ? 1 : 0,
              messages: [],
            };

            // Fire-and-forget profile enrichment. We capture the conversation
            // id so we can fill in the real name/avatar once fetched.
            chatService
              .fetchProfileById(partnerId)
              .then((profile) => {
                if (!profile || !isMounted) return;
                setRegisteredProfiles((prev) => {
                  const exists = (prev || []).some((p) => p.id === profile.id);
                  return exists ? prev : [profile, ...(prev || [])];
                });
                setConversations((prevConv) =>
                  (prevConv || []).map((c) =>
                    c.id === convId && c.user?.id === profile.id
                      ? {
                          ...c,
                          user: {
                            id: profile.id,
                            name:
                              profile.full_name ||
                              profile.username ||
                              "Nautical Contact",
                            avatar: profile.avatar_url,
                            is_online: profile.is_online,
                            last_seen: profile.last_seen,
                            nautical_presence:
                              profile.nautical_presence || "last_anchored",
                          },
                        }
                      : c,
                  ),
                );
              })
              .catch((e) => {
                console.warn(
                  "[ChatsTab] Could not enrich new-contact profile:",
                  e,
                );
              });

            return [placeholder, ...list];
          });
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(beaconChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUserId]);

  // ---- AUTO-CLEAR UNREAD ON CHAT SELECT ----
  // When the active conversation changes to a contact, immediately zero out
  // that conversation's unread badge in local state AND mark the unread
  // messages as read in the database so the badge stays cleared after reload.
  useEffect(() => {
    if (!selectedConvId || !currentUserId) return;

    // Clear the local badge for the now-selected conversation.
    setConversations((prev) =>
      (prev || []).map((c) =>
        c.id === selectedConvId ? { ...c, unreadCount: 0 } : c,
      ),
    );

    // Determine the partner (sender) for this conversation so we can mark only
    // that sender's messages to me as read.
    const conv = conversations.find((c) => c.id === selectedConvId);
    const senderId = conv?.user?.id;
    if (!senderId || !isValidUuid(senderId)) return;

    // Fire-and-forget DB update: mark messages from this sender to me as read.
    (async () => {
      try {
        await supabase
          .from("messages")
          .update({ is_read: true, delivery_state: 3, status: 3 })
          .eq("sender_id", senderId)
          .eq("receiver_id", currentUserId);
      } catch (e) {
        console.warn("[ChatsTab] Could not mark messages read:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConvId]);

  if (!currentUser || !currentUser.id) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <Anchor className="w-10 h-10 text-cyan-400 animate-spin" />
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-200">
          Initializing User Session...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          Connecting to Supabase realtime engine and validating authentication
          status.
        </p>
      </div>
    );
  }

  const safeConversations = conversations || [];
  const safeRegisteredProfiles = registeredProfiles || [];
  const activeConv =
    safeConversations.find((c) => c?.id === selectedConvId) ||
    safeConversations[0] ||
    null;

  // Active unexpired Beacons
  const activeBeacons = beacons.filter(
    (b) => new Date(b.expires_at).getTime() > Date.now(),
  );

  // Derive unique profiles/authors that currently have active beacons
  const beaconProfilesMap = new Map<
    string,
    { id: string; name: string; avatar: string }
  >();
  activeBeacons.forEach((b) => {
    if (!beaconProfilesMap.has(b.user_id)) {
      beaconProfilesMap.set(b.user_id, {
        id: b.user_id,
        name: b.author.name,
        avatar: b.author.avatar,
      });
    }
  });
  const profilesWithActiveBeacons = Array.from(beaconProfilesMap.values());

  const isProfileBeaconViewed = (userId: string) => {
    const userBeacons = activeBeacons.filter((b) => b.user_id === userId);
    return (
      userBeacons.length > 0 &&
      userBeacons.every((b) => b.viewed_by?.includes(currentUser.id))
    );
  };

  const handleCreateBeacon = (newBeacon: Beacon) => {
    setBeacons((prev) => [newBeacon, ...prev]);
  };

  const handleViewBeacon = (beaconId: string) => {
    setBeacons((prev) =>
      prev.map((b) => {
        if (b.id === beaconId && !b.viewed_by?.includes(currentUser.id)) {
          return {
            ...b,
            viewed_by: [...(b.viewed_by || []), currentUser.id],
          };
        }
        return b;
      }),
    );
  };

  const handleAddBeaconComment = (beaconId: string, comment: BeaconComment) => {
    setBeacons((prev) =>
      prev.map((b) => {
        if (b.id === beaconId) {
          return {
            ...b,
            comments: [...(b.comments || []), comment],
          };
        }
        return b;
      }),
    );
  };

  const handleOpenBeaconViewerForUser = (userId: string) => {
    setSelectedBeaconProfileId(userId);
    setIsBeaconViewerOpen(true);
  };

  const viewerBeacons = selectedBeaconProfileId
    ? activeBeacons.filter((b) => b.user_id === selectedBeaconProfileId)
    : activeBeacons;

  const handleUpdateConversation = (
    convId: string,
    lastMsgText: string,
    newMsg?: ChatMessage,
    cleared?: boolean,
  ) => {
    setConversations((prev) =>
      (prev || []).map((c) => {
        if (c.id === convId) {
          if (cleared) {
            return {
              ...c,
              lastMessage: "",
              lastMessageTime: "",
              last_message_at: undefined,
              messages: [],
            };
          }
          const existingMsgs = c.messages || [];
          const updatedMessages = newMsg
            ? [...existingMsgs, newMsg]
            : existingMsgs;
          const latest = updatedMessages[updatedMessages.length - 1];
          const hasMsgs = updatedMessages.length > 0;
          const msgTimestamp = newMsg?.created_at || latest?.created_at;
          return {
            ...c,
            lastMessage: lastMsgText || (latest ? latest.text : ""),
            lastMessageTime: msgTimestamp
              ? formatConversationTime(msgTimestamp)
              : "",
            last_message_at: msgTimestamp,
            messages: updatedMessages,
          };
        }
        return c;
      }),
    );
  };

// ---- CLEAR UNREAD ON REPLY ----
  // Called by ChatView right after the user submits a reply so the sidebar
  // badge immediately drops to 0 and the unread highlight is removed.
  const handleClearUnread = (convId: string) => {
    if (!convId) return;
    setConversations((prev) =>
      (prev || []).map((c) =>
        c.id === convId ? { ...c, unreadCount: 0 } : c,
      ),
    );
  };

  const handleStartNewChatWithProfile = (targetProfile: Profile) => {
    if (!targetProfile) return;
    const existing = safeConversations.find(
      (c) => c?.user?.id === targetProfile.id,
    );
    if (existing) {
      setSelectedConvId(existing.id);
    } else {
      const nowIso = new Date().toISOString();
      const newConv: Conversation = {
        id: `conv_${targetProfile.id}`,
        user: {
          id: targetProfile.id,
          name: targetProfile.full_name || targetProfile.username || "User",
          avatar:
            targetProfile.avatar_url ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
          is_online: targetProfile.is_online,
          nautical_presence: targetProfile.nautical_presence || "in_focus",
          last_anchored: targetProfile.last_anchored,
        },
        lastMessage: "",
        lastMessageTime: "",
        last_message_at: undefined,
        unreadCount: 0,
        messages: [],
      };
      setConversations((prev) => [newConv, ...(prev || [])]);
      setSelectedConvId(newConv.id);
    }
    setIsRosterModalOpen(false);
  };

  const handleSelectHymliAiConversation = (
    convId: string,
    partnerProfile: Profile,
  ) => {
    const existing = safeConversations.find(
      (c) => c.id === convId || c.user?.id === partnerProfile.id,
    );
    if (existing) {
      setSelectedConvId(existing.id);
    } else {
      const newConv: Conversation = {
        id: convId,
        user: {
          id: partnerProfile.id,
          name: partnerProfile.full_name,
          avatar: partnerProfile.avatar_url,
          is_online: true,
          nautical_presence: "In Focus",
          custom_status: "In Focus",
        },
        lastMessage: "Anchored and ready. How can I assist your fleet today?",
        lastMessageTime: "Just now",
        unreadCount: 0,
        messages: [],
      };
      setConversations((prev) => [newConv, ...(prev || [])]);
      setSelectedConvId(convId);
    }
  };

  const filteredConversations = safeConversations.filter(
    (c) =>
      c?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c?.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-[calc(100dvh-10rem)] min-h-0 md:h-[calc(100vh-8rem)] flex flex-col md:flex-row overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 relative">
      {/* LEFT SIDEBAR: Conversation list */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 dark:border-slate-800 ${
          selectedConvId && "hidden md:flex"
        }`}
      >
        {/* Header & Status bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              Chats
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRosterModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                title="Start a conversation with registered user"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>New Anchor</span>
              </button>
            </div>
          </div>

          {/* TOP BEACON TRAY */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                Beacons
              </span>
              <span className="text-[10px] text-slate-400">
                {activeBeacons.length} Active{" "}
                {activeBeacons.length === 1 ? "Beacon" : "Beacons"}
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
              {/* First circle MUST always be the "+ Cast Beacon" button */}
              <div
                onClick={() => setIsBeaconModalOpen(true)}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-pink-500 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-all">
                  <div className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center text-cyan-400">
                    <Plus className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-cyan-400 truncate max-w-[54px]">
                  + Cast Beacon
                </span>
              </div>

              {/* Profile circles MUST ONLY appear in this top tray if profile has active, unexpired Beacons */}
              {profilesWithActiveBeacons.map((prof) => {
                const viewed = isProfileBeaconViewed(prof.id);
                return (
                  <div
                    key={prof.id}
                    onClick={() => handleOpenBeaconViewerForUser(prof.id)}
                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                  >
                    <div
                      className={`relative p-0.5 rounded-full transition-all group-hover:scale-105 ${
                        viewed
                          ? "ring-1 ring-slate-800 bg-slate-800"
                          : "ring-2 ring-cyan-400 animate-pulse bg-gradient-to-tr from-cyan-400 to-indigo-500"
                      }`}
                    >
                      <img
                        src={prof.avatar}
                        alt={prof.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-slate-900"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-slate-950 text-cyan-400 border border-slate-800">
                        <Radio className="w-2.5 h-2.5" />
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[54px]">
                      {prof.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hymli AI Copilot Launch Button */}
          <HymliAiButton
            currentUserId={currentUserId}
            onSelectConversation={handleSelectHymliAiConversation}
            variant="sidebar"
          />

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts or messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-cyan-500 focus:outline-none transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Conversation List / High-Tech Empty State */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <Anchor className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs font-mono">
                Syncing Supabase Nautical Stream...
              </p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center space-y-3 h-64">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Anchor className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">
                  No active anchors yet.
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                  Select a contact from the roster to launch a conversation.
                </p>
              </div>
              <button
                onClick={() => setIsRosterModalOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all cursor-pointer"
              >
                Explore Roster
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const isOnline = isUserOnline(conv.user.id);
              const hasMessages = Boolean(
                (conv.messages && conv.messages.length > 0) ||
                conv.last_message_at,
              );
              const lastTimestamp =
                conv.last_message_at ||
                conv.messages?.[conv.messages.length - 1]?.created_at;
              const displayTime = hasMessages
                ? formatConversationTime(lastTimestamp) || conv.lastMessageTime
                : "";
              const isTypingNow = isUserTyping(conv.user.id, conv.id);
              const displaySubtitle = isTypingNow
                ? getCustomTypingPhrase()
                : hasMessages
                  ? conv.lastMessage ||
                    conv.messages?.[conv.messages.length - 1]?.text ||
                    "No messages yet"
                  : "No messages yet";

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? isDark
                        ? "bg-slate-800/90"
                        : "bg-indigo-50/70"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.user.avatar}
                      alt={conv.user.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-700"
                    />
                    <span
                      title={formatNauticalPresence(
                        isOnline,
                        conv.user.last_seen || conv.user.last_anchored,
                      )}
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                        isOnline
                          ? "bg-emerald-400 animate-pulse ring-2 ring-emerald-500/30"
                          : "bg-slate-500"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-sm truncate ${
                          (conv.unreadCount || 0) > 0
                            ? "font-semibold text-white"
                            : "font-normal text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {conv.user.name}
                      </span>
                      {hasMessages && displayTime ? (
                        <span className="text-xs text-slate-400 shrink-0 ml-2">
                          {displayTime}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs truncate ${
                          isTypingNow
                            ? "text-cyan-500 dark:text-cyan-400 italic font-semibold"
                            : (conv.unreadCount || 0) > 0
                              ? "font-semibold text-white"
                              : "font-normal text-slate-400"
                        }`}
                      >
                        {displaySubtitle}
                      </p>
                      {(conv.unreadCount || 0) > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT CHAT VIEW AREA */}
      <div
        className={`min-w-0 min-h-0 flex-1 flex flex-col h-full ${!selectedConvId && "hidden md:flex"}`}
      >
        {activeConv && activeConv.user ? (
<ChatView
            activeConv={activeConv}
            currentUser={currentUser}
            isDark={isDark}
            onBack={() => setSelectedConvId("")}
            onUpdateConversation={handleUpdateConversation}
            onClearUnread={handleClearUnread}
            webrtc={webrtc}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950/40 space-y-3">
            <Anchor className="w-12 h-12 text-cyan-500/60" />
            <h3 className="text-base font-bold text-slate-200">
              No active anchors yet.
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Select a contact from the roster to launch a conversation.
            </p>
            <button
              onClick={() => setIsRosterModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-xs shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              Open Contact Roster
            </button>
          </div>
        )}
      </div>

      {/* NEW ANCHOR / ROSTER MODAL */}
      <ContactRosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        currentUser={currentUser}
        profiles={registeredProfiles}
        onSelectContact={handleStartNewChatWithProfile}
      />

      {/* BEACON CREATOR MODAL */}
      <BeaconModal
        isOpen={isBeaconModalOpen}
        onClose={() => setIsBeaconModalOpen(false)}
        currentUser={currentUser}
        onCreateBeacon={handleCreateBeacon}
      />

      {/* BEACON VIEWER OVERLAY */}
      <BeaconViewer
        beacons={viewerBeacons}
        isOpen={isBeaconViewerOpen}
        onClose={() => setIsBeaconViewerOpen(false)}
        currentUser={currentUser}
        onAddComment={handleAddBeaconComment}
        onViewBeacon={handleViewBeacon}
      />
    </div>
  );
};
