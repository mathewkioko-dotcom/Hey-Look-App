import { supabase } from '../lib/supabase';

export const usePaystack = () => {
  const handleCheckout = async (planType: 'weekly' | 'monthly' | 'yearly') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'user@hymli.com';

      const { data, error } = await supabase.functions.invoke('paystack-checkout', {
        body: { user_id: user?.id, email: userEmail, plan_type: planType },
      });

      if (error || !data?.data?.authorization_url) {
        console.warn("[usePaystack] Functions invoke failed or missing authorization_url:", error, data);
        return { success: false, url: null, data, error };
      }

      // Redirect to Paystack checkout (handles M-Pesa STK push prompt & card tabs)
      if (data?.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      }
      return { success: true, url: data.data.authorization_url, data };
    } catch (err) {
      console.error("[usePaystack] Exception:", err);
      return { success: false, url: null, err };
    }
  };

  return { handleCheckout };
};
