export interface Product {
  id: string;
  item_id: string;
  title: string;
  sku: string;
  thumbnail: string;
  price: number;
  currency_id: string;
  status: 'active' | 'paused' | 'closed';
  listing_type_id: 'gold_pro' | 'gold_special';
  shipping_type: 'me2' | 'fulfillment';
  is_catalog: boolean;
  is_full: boolean;
  variations_count: number;
  metrics: {
    visits: number;
    sold_quantity: number;
    conversion_rate: number;
    health_score: number;
    risk_score: number;
  };
  financials: {
    sale_fee: number;
    shipping_cost: number;
    net_profit: number;
  };
  updated_at: string;
  description_text?: string;
}

export type ProductFilter = {
  search: string;
  status: string;
  listing_type: string;
  shipping: string;
};

export interface DuplicationJob {
  id: string;
  source_item_id: string;
  source_title: string;
  target_account: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  completed_at?: string;
  error?: string;
  new_item_id?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  plan: 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled';
  mrr: number;
  total_spent: number;
  stores_count: number;
  duplications_count: number;
  joined_at: string;
  last_active: string;
  ml_credentials?: {
    access_token: string;
    refresh_token: string;
    user_id: number;
    expires_at: number; // Timestamp em ms
  };
}

export interface SubscriptionStats {
  total_mrr: number;
  active_subscribers: number;
  churn_rate: number;
  ltv: number;
}
