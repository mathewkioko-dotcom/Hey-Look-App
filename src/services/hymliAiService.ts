import { GoogleGenAI } from '@google/genai';
import { supabase } from '../lib/supabase';
import { ChatMessage, Profile } from '../types';
import { ollamaService } from './ollamaService';
import { chatService } from './chatService';


// Standard Hymli AI Bot Profile
export const HYMLI_AI_BOT_ID = '00000000-0000-0000-0000-0000000000a1';

export const HYMLI_BOT_PROFILE: Profile = {
  id: HYMLI_AI_BOT_ID,
  username: 'hymli_ai',
  full_name: 'Hymli AI',
  avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=HymliAI&backgroundColor=0284c7',
  custom_status: 'In Focus',
  bio: 'Executive Fleet Assistant AI - Charting optimal courses for your fleet.',
  is_online: true,
  nautical_presence: 'In Focus',
  last_anchored: new Date().toISOString(),
};

export type AiProvider = 'gemini' | 'ollama';

class HymliAiService {
  private activeProvider: AiProvider = 'gemini';
  private activeModelId: string = 'gemini-2.5-flash';
  private geminiClient: GoogleGenAI | null = null;
  private isSynthesizing = false;

  constructor() {
    this.initGemini();
  }

  private initGemini() {
    try {
      const apiKey =
        (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
        import.meta.env?.VITE_GEMINI_API_KEY ||
        '';

      this.geminiClient = new GoogleGenAI({
        apiKey: apiKey || 'dummy-key-for-initialization',
      });
    } catch (err) {
      console.warn('[HymliAI] Gemini client initialization warning:', err);
      this.geminiClient = null;
    }
  }

  /**
   * Set active model ID (e.g. 'gemini-2.5-flash', 'llama-3.1-8b', 'gpt-4o-mini', 'claude-3-5-sonnet')
   */
  public setModel(modelId: string): void {
    this.activeModelId = modelId;
    if (modelId === 'llama-3.1-8b') {
      this.activeProvider = 'ollama';
    } else {
      this.activeProvider = 'gemini';
    }
  }

  /**
   * Get active model ID
   */
  public getModel(): string {
    return this.activeModelId;
  }

  /**
   * Set active LLM Provider ('gemini' | 'ollama')
   */
  public setProvider(provider: AiProvider): void {
    this.activeProvider = provider;
  }

  /**
   * Get active LLM Provider
   */
  public getProvider(): AiProvider {
    return this.activeProvider;
  }

  /**
   * Toggle between Gemini and local Ollama provider
   */
  public toggleProvider(): AiProvider {
    this.activeProvider = this.activeProvider === 'gemini' ? 'ollama' : 'gemini';
    return this.activeProvider;
  }

  /**
   * Check or create the Hymli AI conversation thread in Supabase
   */
  public async getOrCreateAiConversation(currentUserId: string): Promise<{
    conversationId: string;
    isNew: boolean;
    partner: Profile;
  }> {
    if (!currentUserId) {
      throw new Error('Current user ID is required to get or create Hymli AI thread');
    }

    try {
      // 1. Check if a conversation row exists with is_ai = true or title = 'Hymli AI'
      const { data: existingConvs, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', currentUserId)
        .or(`is_ai.eq.true,title.eq.Hymli AI,partner_id.eq.${HYMLI_AI_BOT_ID}`)
        .limit(1);

      if (!convErr && existingConvs && existingConvs.length > 0) {
        return {
          conversationId: existingConvs[0].id,
          isNew: false,
          partner: HYMLI_BOT_PROFILE,
        };
      }

      // 2. Check if messages exist between currentUserId and HYMLI_AI_BOT_ID
      const { data: existingMsgs } = await supabase
        .from('messages')
        .select('id')
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${HYMLI_AI_BOT_ID}),and(sender_id.eq.${HYMLI_AI_BOT_ID},receiver_id.eq.${currentUserId})`
        )
        .limit(1);

      const convId = `conv_hymli_${currentUserId}`;

      // 3. Insert or update conversation record
      const { data: insertedConv, error: insertErr } = await supabase
        .from('conversations')
        .upsert(
          {
            id: convId,
            user_id: currentUserId,
            partner_id: HYMLI_AI_BOT_ID,
            title: 'Hymli AI',
            is_ai: true,
            is_auto_reply_enabled: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      const finalConvId = insertedConv?.id || convId;

      // 4. Inject initial welcome message if no previous messages exist
      if (!existingMsgs || existingMsgs.length === 0) {
        await supabase.from('messages').insert({
          sender_id: HYMLI_AI_BOT_ID,
          receiver_id: currentUserId,
          text: 'Anchored and ready. How can I assist your fleet today?',
          type: 'text',
          delivery_state: 3,
          created_at: new Date().toISOString(),
        });
      }

      return {
        conversationId: finalConvId,
        isNew: true,
        partner: HYMLI_BOT_PROFILE,
      };
    } catch (err) {
      console.warn('[HymliAI] Exception in getOrCreateAiConversation, returning fallback:', err);
      return {
        conversationId: `conv_hymli_${currentUserId}`,
        isNew: false,
        partner: HYMLI_BOT_PROFILE,
      };
    }
  }

  /**
   * Pull last N messages for memory context before querying LLM
   */
  public async fetchContextHistory(currentUserId: string, limit = 10): Promise<{ role: string; content: string }[]> {
    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('sender_id, text, created_at')
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${HYMLI_AI_BOT_ID}),and(sender_id.eq.${HYMLI_AI_BOT_ID},receiver_id.eq.${currentUserId})`
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !msgs) return [];

      // Reverse so oldest is first
      return msgs
        .reverse()
        .map((m) => ({
          role: m.sender_id === currentUserId ? 'user' : 'assistant',
          content: m.text || '',
        }))
        .filter((m) => m.content.trim().length > 0);
    } catch (err) {
      console.warn('[HymliAI] Error fetching context history:', err);
      return [];
    }
  }

  /**
   * Main query method to ask Hymli AI
   */
  public async askHymli(
    userPrompt: string,
    currentUserId: string,
    conversationId?: string,
    saveMessagesToDb = true
  ): Promise<string> {
    if (!userPrompt.trim()) return '';

    // 1. Pull context memory (last 10 messages)
    const contextHistory = await this.fetchContextHistory(currentUserId, 10);

    // 2. Save user input to Supabase messages table if requested
    if (saveMessagesToDb && currentUserId) {
      try {
        await supabase.from('messages').insert({
          sender_id: currentUserId,
          receiver_id: HYMLI_AI_BOT_ID,
          text: userPrompt,
          type: 'text',
          delivery_state: 1,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[HymliAI] User message save exception:', e);
      }
    }

    // 3. Generate response via Gemini or Ollama
    let replyText = '';
    const systemInstruction = `You are Hymli AI, a sharp, executive fleet companion. 
Sound like a real, helpful human peer—never a scripted chatbot.
Rules:
1. Match the user's energy and length. If they say "hi" or "hey", reply naturally in 1 short sentence (e.g., "Hey Mahnee! What's on the agenda today?").
2. Only dive into detailed or technical analysis if the user asks for it.
3. Keep nautical terms subtle and natural—never use boilerplate speeches or forced roleplay on basic greetings.`;

    if (this.activeProvider === 'ollama') {
      replyText = await this.queryOllamaWithHistory(userPrompt, contextHistory, systemInstruction);
    } else {
      try {
        replyText = await this.queryGeminiWithHistory(userPrompt, contextHistory, systemInstruction);
      } catch (error: any) {
        console.error("Gemini API Error:", error);
        if (error?.message?.toLowerCase().includes("permission denied") || error?.status === 403) {
          replyText = "⚠️ API Permission Error: Please verify your GEMINI_API_KEY in environment settings.";
        } else {
          replyText = "I ran into an issue connecting to the core model. Please try again in a moment.";
        }
      }
    }

    if (!replyText) {
      replyText = "I'm having trouble connecting right now. Please try sending your message again.";
    }

    // 4. Save Hymli AI reply directly to Supabase messages table
    if (saveMessagesToDb && currentUserId) {
      try {
        await supabase.from('messages').insert({
          sender_id: HYMLI_AI_BOT_ID,
          receiver_id: currentUserId,
          text: replyText,
          type: 'text',
          delivery_state: 3,
          created_at: new Date().toISOString(),
        });

        // Update conversation timestamp
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('user_id', currentUserId)
          .eq('partner_id', HYMLI_AI_BOT_ID);
      } catch (e) {
        console.warn('[HymliAI] AI reply message save exception:', e);
      }
    }

    return replyText;
  }

  /**
   * Internal Gemini Caller using Edge Proxy with local SDK fallback
   */
  private async queryGeminiWithHistory(
    userPrompt: string,
    history: { role: string; content: string }[],
    systemInstruction: string
  ): Promise<string> {
    try {
      const formattedHistory = history
        .map((h) => `${h.role === 'user' ? 'Captain' : 'Hymli AI'}: ${h.content}`)
        .join('\n');

      const fullPrompt = formattedHistory
        ? `Previous Fleet Context:\n${formattedHistory}\n\nCaptain: ${userPrompt}`
        : userPrompt;

      // 1. Try serverless chat edge function proxy with model verification
      try {
        const edgeResponse = await chatService.callChatEdgeProxy(
          fullPrompt,
          this.activeModelId,
          systemInstruction
        );
        if (edgeResponse && edgeResponse.trim().length > 0) {
          return edgeResponse.trim();
        }
      } catch (proxyErr) {
        console.warn('[HymliAI] Edge proxy attempt warning, using local SDK fallback:', proxyErr);
      }

      // 2. Direct local SDK fallback
      if (!this.geminiClient) {
        this.initGemini();
      }

      if (this.geminiClient) {
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
          config: {
            systemInstruction,
            temperature: 0.7,
            topP: 0.9,
          },
        });

        if (response && response.text) {
          return response.text.trim();
        }
      }
      return '';
    } catch (err: any) {
      console.warn('[HymliAI] Gemini query exception:', err);
      throw err;
    }
  }


  /**
   * Internal Ollama Caller with history
   */
  private async queryOllamaWithHistory(
    userPrompt: string,
    history: { role: string; content: string }[],
    systemInstruction: string
  ): Promise<string> {
    try {
      const formattedHistory = history
        .map((h) => `${h.role === 'user' ? 'Captain' : 'Hymli AI'}: ${h.content}`)
        .join('\n');

      const fullPrompt = `${systemInstruction}\n\n${
        formattedHistory ? `Recent Log:\n${formattedHistory}\n\n` : ''
      }Captain: ${userPrompt}`;

      const res = await ollamaService.queryOllama(fullPrompt);
      if (res.success && res.result) {
        return res.result.trim();
      }
      return '';
    } catch (err) {
      console.warn('[HymliAI] Ollama query exception:', err);
      return '';
    }
  }

  // =========================================================================
  // EXECUTIVE FEATURES: Tone Polish, Summaries, Action Items, Auto-Replies
  // =========================================================================

  /**
   * Tone Polish for executive communications
   */
  public async generateTonePolish(text: string, tone = 'Executive Fleet'): Promise<string> {
    if (!text) return '';
    try {
      if (this.activeProvider === 'ollama') {
        const res = await ollamaService.generateTonePolish(text, tone);
        return res.result;
      }

      if (this.geminiClient) {
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `Rewrite the following message into an polished, professional, concise ${tone} tone suitable for executive fleet communications:\n\n"${text}"`,
          config: {
            systemInstruction: 'Return only the polished text without meta commentary.',
          },
        });
        if (response?.text) return response.text.trim();
      }

      return `✨ [${tone} Polish]: ${text}`;
    } catch (err) {
      return `✨ [Polished]: ${text}`;
    }
  }

  /**
   * Brief Chat Transcript Summary
   */
  public async generateChatSummary(messages: string[]): Promise<string> {
    if (!messages || messages.length === 0) {
      return 'No message transcript available for executive summary.';
    }

    try {
      if (this.activeProvider === 'ollama') {
        const res = await ollamaService.summarizeChat(messages);
        return res.result;
      }

      if (this.geminiClient) {
        const transcript = messages.join('\n');
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `Provide a 3-bullet executive summary with nautical precision for this chat transcript:\n\n${transcript}`,
          config: {
            systemInstruction: 'Be concise, executive, and direct.',
          },
        });
        if (response?.text) return response.text.trim();
      }

      return `📌 NAUTICAL EXECUTIVE SUMMARY\n• ${messages.length} log messages reviewed.\n• Key operational updates synchronized.\n• All fleet signals green.`;
    } catch {
      return `📌 Fleet Brief: ${messages.length} messages analyzed.`;
    }
  }

  /**
   * Extract Instant Action Items
   */
  public async generateActionItems(textOrMessages: string | string[]): Promise<string[]> {
    const content = Array.isArray(textOrMessages) ? textOrMessages.join('\n') : textOrMessages;
    if (!content.trim()) return ['Confirm fleet readiness'];

    try {
      if (this.geminiClient) {
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `Extract up to 3 high-priority action items from this text. Return each item as a short single line:\n\n${content}`,
        });
        if (response?.text) {
          return response.text
            .split('\n')
            .map((line) => line.replace(/^[\s•\-\d\.]+\s*/, '').trim())
            .filter((line) => line.length > 0);
        }
      }
    } catch (e) {
      console.warn('[HymliAI] Action item generation exception:', e);
    }

    return ['Review operational parameters', 'Acknowledge fleet dispatch', 'Verify anchor logs'];
  }

  /**
   * Auto-reply generator for contextual suggested responses
   */
  public async generateAutoReply(messageText: string, contextMessages?: string[]): Promise<string> {
    if (!messageText) return 'Acknowledged, Captain.';

    try {
      if (this.geminiClient) {
        const prompt = `Generate a brief, 1-sentence executive auto-reply with subtle nautical flair for this message:\n"${messageText}"`;
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });
        if (response?.text) return response.text.trim();
      }
    } catch {
      // Fallback
    }

    return 'Understood, Captain. Signals received and course aligned.';
  }

  // =========================================================================
  // WebRTC VOICE CALL TRIGGER HANDLER
  // =========================================================================

  /**
   * WebRTC voice call handler: receives spoken transcript, queries Hymli AI,
   * saves both messages to Supabase, and speaks response back via SpeechSynthesis.
   */
  public async handleVoiceCallUtterance(
    spokenText: string,
    currentUserId: string,
    conversationId?: string
  ): Promise<{ replyText: string; audioPlayed: boolean }> {
    if (!spokenText || !spokenText.trim()) {
      return { replyText: '', audioPlayed: false };
    }

    // Query Hymli AI engine and sync with Supabase
    const replyText = await this.askHymli(spokenText, currentUserId, conversationId, true);

    // Speak response back hands-free
    let audioPlayed = false;
    if (this.isSpeechSynthesisSupported()) {
      this.speakText(replyText);
      audioPlayed = true;
    }

    return { replyText, audioPlayed };
  }

  // =========================================================================
  // NATIVE WEB SPEECH API (TTS & STT)
  // =========================================================================

  public isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isSpeechRecognitionSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  /**
   * Speak text using Native Web SpeechSynthesis API
   */
  public speakText(
    text: string,
    options?: {
      voiceName?: string;
      rate?: number;
      pitch?: number;
      onEnd?: () => void;
    }
  ): void {
    if (!this.isSpeechSynthesisSupported()) {
      console.warn('[HymliAI] SpeechSynthesis is not supported in this environment');
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const preferredVoice =
          voices.find(
            (v) =>
              v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Daniel') ||
              v.name.includes('Samantha')
          ) || voices[0];
        utterance.voice = preferredVoice;
      }

      if (options?.onEnd) {
        utterance.onend = () => {
          this.isSynthesizing = false;
          options.onEnd!();
        };
      }

      this.isSynthesizing = true;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[HymliAI] SpeechSynthesis error:', err);
    }
  }

  /**
   * Stop Speech Synthesis
   */
  public stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.isSynthesizing = false;
    }
  }

  /**
   * Start Speech Recognition (Speech-To-Text) for voice notes or voice call inputs
   */
  public startSpeechRecognition(
    onResult: (transcript: string) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!this.isSpeechRecognitionSupported()) {
      if (onError) onError(new Error('Speech recognition not supported in browser'));
      return () => {};
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          onResult(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[HymliAI] Speech recognition error:', event.error);
        if (onError) onError(event);
      };

      recognition.start();

      return () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      };
    } catch (err) {
      if (onError) onError(err);
      return () => {};
    }
  }
}

export const hymliAiService = new HymliAiService();
