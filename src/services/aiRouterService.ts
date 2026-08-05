import { supabase } from '../lib/supabase';

export interface ModelOption {
  id: string;
  name: string;
  isFree: boolean;
  provider: 'gemini' | 'groq' | 'openai' | 'anthropic';
  priceLabel: string;
  priceAmount: number;
  badge: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Hymli AI Core (Gemini 2.5 Flash)',
    isFree: true,
    provider: 'gemini',
    priceLabel: 'FREE',
    priceAmount: 0,
    badge: 'Core',
  },
  {
    id: 'llama-3.1-8b',
    name: 'Hymli Speed (Groq / Llama 3.1 8B)',
    isFree: true,
    provider: 'groq',
    priceLabel: 'FREE',
    priceAmount: 0,
    badge: 'Speed',
  },
  {
    id: 'gpt-4o-mini',
    name: 'Hymli Pro (GPT-4o Mini)',
    isFree: false,
    provider: 'openai',
    priceLabel: 'KSH 300 / mo',
    priceAmount: 300,
    badge: 'Pro',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Hymli Master (Claude 3.5 Sonnet)',
    isFree: false,
    provider: 'anthropic',
    priceLabel: 'KSH 500 / mo',
    priceAmount: 500,
    badge: 'Master',
  },
];

export function canUserAccessModel(modelId: string, isPaidUser: boolean): boolean {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model) return false;
  if (model.isFree) return true;
  return isPaidUser;
}

/**
  * Check model access via Supabase RPC check_model_access or table lookup
  */
export async function checkModelAccess(userId: string, modelId: string): Promise<boolean> {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model) return false;
  if (model.isFree) return true;
  if (!userId) return false;

  try {
    // 1. Try Supabase RPC check_model_access
    const { data, error } = await supabase.rpc('check_model_access', {
      user_id: userId,
      model_id: modelId,
    });

    if (!error && typeof data === 'boolean') {
      return data;
    }

    // Fallback if RPC uses p_user_id / p_model_id param names
    const { data: dataAlt, error: errAlt } = await supabase.rpc('check_model_access', {
      p_user_id: userId,
      p_model_id: modelId,
    });

    if (!errAlt && typeof dataAlt === 'boolean') {
      return dataAlt;
    }

    // 2. Direct Table Fallback on user_subscriptions
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subData) {
      const isExpired = subData.expires_at ? new Date(subData.expires_at) < new Date() : false;
      if (!isExpired) {
        if (subData.unlocked_models && Array.isArray(subData.unlocked_models)) {
          if (subData.unlocked_models.includes(modelId) || subData.unlocked_models.includes('*')) {
            return true;
          }
        }
        if (subData.tier === 'pro' || subData.tier === 'master' || subData.status === 'active') {
          return true;
        }
      }
    }
  } catch (err) {
    console.warn('[AIRouterService] Error checking model access:', err);
  }

  return false;
}

/**
 * Record M-Pesa subscription transaction and unlock model in Supabase
 */
export async function unlockModelInSupabase(
  userId: string,
  modelId: string,
  amount: number,
  phoneNumber?: string,
  durationDays: number = 30
): Promise<boolean> {
  if (!userId) return false;

  try {
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // Fetch existing subscription to append unlocked model
    const { data: existing } = await supabase
      .from('user_subscriptions')
      .select('unlocked_models')
      .eq('user_id', userId)
      .single();

    const existingModels: string[] = existing?.unlocked_models || ['gemini-2.5-flash', 'llama-3.1-8b'];
    if (!existingModels.includes(modelId)) {
      existingModels.push(modelId);
    }

    const { error } = await supabase.from('user_subscriptions').upsert(
      {
        user_id: userId,
        plan_type: 'pro_all',
        tier: amount >= 500 ? 'master' : 'pro',
        status: 'active',
        unlocked_models: existingModels,
        phone_number: phoneNumber || null,
        amount_paid: amount,
        updated_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.warn('[AIRouterService] Error unlocking model in Supabase:', error.message);
    }
    return !error;
  } catch (err) {
    console.warn('[AIRouterService] Exception unlocking model:', err);
    return true; // Gracefully allow unlock in UI state
  }
}

