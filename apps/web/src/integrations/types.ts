export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          abandoned_at: string
          cart_items: Json
          cart_total: number
          created_at: string
          email: string | null
          id: string
          order_id: string | null
          recovered_at: string | null
          recovery_email_sent: boolean | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          abandoned_at?: string
          cart_items?: Json
          cart_total?: number
          created_at?: string
          email?: string | null
          id?: string
          order_id?: string | null
          recovered_at?: string | null
          recovery_email_sent?: boolean | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          abandoned_at?: string
          cart_items?: Json
          cart_total?: number
          created_at?: string
          email?: string | null
          id?: string
          order_id?: string | null
          recovered_at?: string | null
          recovery_email_sent?: boolean | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          page_url: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      back_in_stock_alerts: {
        Row: {
          created_at: string
          email: string
          id: string
          is_notified: boolean | null
          notified_at: string | null
          product_id: string
          size: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_notified?: boolean | null
          notified_at?: string | null
          product_id: string
          size?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_notified?: boolean | null
          notified_at?: string | null
          product_id?: string
          size?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "back_in_stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      breed_sizing_rules: {
        Row: {
          breed: string
          created_at: string
          id: string
          max_chest_cm: number | null
          max_weight_kg: number | null
          min_chest_cm: number | null
          min_weight_kg: number | null
          notes: string | null
          recommended_size: string
          size_category: string
          species: string
        }
        Insert: {
          breed: string
          created_at?: string
          id?: string
          max_chest_cm?: number | null
          max_weight_kg?: number | null
          min_chest_cm?: number | null
          min_weight_kg?: number | null
          notes?: string | null
          recommended_size: string
          size_category: string
          species?: string
        }
        Update: {
          breed?: string
          created_at?: string
          id?: string
          max_chest_cm?: number | null
          max_weight_kg?: number | null
          min_chest_cm?: number | null
          min_weight_kg?: number | null
          notes?: string | null
          recommended_size?: string
          size_category?: string
          species?: string
        }
        Relationships: []
      }
      campaign_metrics: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          cost: number | null
          created_at: string
          id: string
          impressions: number | null
          metric_date: string
          revenue: number | null
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          cost?: number | null
          created_at?: string
          id?: string
          impressions?: number | null
          metric_date: string
          revenue?: number | null
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          cost?: number | null
          created_at?: string
          id?: string
          impressions?: number | null
          metric_date?: string
          revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          campaign_type: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          target_audience: Json | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          campaign_type: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          campaign_type?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          pet_size: string | null
          product_id: string
          quantity: number | null
          size: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pet_size?: string | null
          product_id: string
          quantity?: number | null
          size?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pet_size?: string | null
          product_id?: string
          quantity?: number | null
          size?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      coupon_uses: {
        Row: {
          coupon_id: string
          created_at: string | null
          discount_applied: number
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string | null
          discount_applied: number
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string | null
          discount_applied?: number
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_uses_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applies_to: string | null
          applies_to_ids: string[] | null
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
          min_order_amount: number | null
          starts_at: string | null
          updated_at: string | null
          uses_count: number | null
        }
        Insert: {
          applies_to?: string | null
          applies_to_ids?: string[] | null
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string | null
          uses_count?: number | null
        }
        Update: {
          applies_to?: string | null
          applies_to_ids?: string[] | null
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string | null
          uses_count?: number | null
        }
        Relationships: []
      }
      delivery_sla: {
        Row: {
          actual_delivery_date: string | null
          created_at: string
          delay_hours: number | null
          delay_reason: string | null
          id: string
          order_id: string
          promised_delivery_date: string
          sla_met: boolean | null
          updated_at: string
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string
          delay_hours?: number | null
          delay_reason?: string | null
          id?: string
          order_id: string
          promised_delivery_date: string
          sla_met?: boolean | null
          updated_at?: string
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string
          delay_hours?: number | null
          delay_reason?: string | null
          id?: string
          order_id?: string
          promised_delivery_date?: string
          sla_met?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_sla_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_slots: {
        Row: {
          created_at: string
          current_orders: number
          date: string
          id: string
          is_available: boolean | null
          max_orders: number
          time_slot: string
        }
        Insert: {
          created_at?: string
          current_orders?: number
          date: string
          id?: string
          is_available?: boolean | null
          max_orders?: number
          time_slot: string
        }
        Update: {
          created_at?: string
          current_orders?: number
          date?: string
          id?: string
          is_available?: boolean | null
          max_orders?: number
          time_slot?: string
        }
        Relationships: []
      }
      dynamic_pricing_rules: {
        Row: {
          applies_to: string | null
          applies_to_ids: string[] | null
          conditions: Json
          created_at: string
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          rule_type: string
          starts_at: string | null
        }
        Insert: {
          applies_to?: string | null
          applies_to_ids?: string[] | null
          conditions?: Json
          created_at?: string
          discount_type: string
          discount_value: number
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          rule_type: string
          starts_at?: string | null
        }
        Update: {
          applies_to?: string | null
          applies_to_ids?: string[] | null
          conditions?: Json
          created_at?: string
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          rule_type?: string
          starts_at?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          question?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fit_feedback: {
        Row: {
          comments: string | null
          created_at: string
          fit_rating: string
          id: string
          order_item_id: string | null
          pet_id: string | null
          product_id: string
          size_purchased: string | null
          user_id: string
          would_recommend_size: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          fit_rating: string
          id?: string
          order_item_id?: string | null
          pet_id?: string | null
          product_id: string
          size_purchased?: string | null
          user_id: string
          would_recommend_size?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          fit_rating?: string
          id?: string
          order_item_id?: string | null
          pet_id?: string | null
          product_id?: string
          size_purchased?: string | null
          user_id?: string
          would_recommend_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fit_feedback_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fit_feedback_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fit_feedback_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          category_ids: string[] | null
          created_at: string
          description: string | null
          discount_percentage: number
          ends_at: string
          id: string
          is_active: boolean | null
          name: string
          product_ids: string[] | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          category_ids?: string[] | null
          created_at?: string
          description?: string | null
          discount_percentage: number
          ends_at: string
          id?: string
          is_active?: boolean | null
          name: string
          product_ids?: string[] | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          category_ids?: string[] | null
          created_at?: string
          description?: string | null
          discount_percentage?: number
          ends_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          product_ids?: string[] | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_comments: {
        Row: {
          content: string
          created_at: string
          gallery_post_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          gallery_post_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          gallery_post_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_comments_gallery_post_id_fkey"
            columns: ["gallery_post_id"]
            isOneToOne: false
            referencedRelation: "pet_gallery"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_likes: {
        Row: {
          created_at: string
          gallery_post_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gallery_post_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gallery_post_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_likes_gallery_post_id_fkey"
            columns: ["gallery_post_id"]
            isOneToOne: false
            referencedRelation: "pet_gallery"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          data_url: string | null
          id: string
          notes: string | null
          request_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data_url?: string | null
          id?: string
          notes?: string | null
          request_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data_url?: string | null
          id?: string
          notes?: string | null
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      image_moderation_logs: {
        Row: {
          gallery_post_id: string | null
          id: string
          image_url: string
          is_approved: boolean | null
          moderated_at: string
          moderation_result: Json | null
          rejection_reason: string | null
        }
        Insert: {
          gallery_post_id?: string | null
          id?: string
          image_url: string
          is_approved?: boolean | null
          moderated_at?: string
          moderation_result?: Json | null
          rejection_reason?: string | null
        }
        Update: {
          gallery_post_id?: string | null
          id?: string
          image_url?: string
          is_approved?: boolean | null
          moderated_at?: string
          moderation_result?: Json | null
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_moderation_logs_gallery_post_id_fkey"
            columns: ["gallery_post_id"]
            isOneToOne: false
            referencedRelation: "pet_gallery"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_profiles: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          follower_count: number | null
          handle: string
          id: string
          instagram_url: string | null
          is_active: boolean | null
          is_verified: boolean | null
          tiktok_url: string | null
          updated_at: string
          user_id: string
          youtube_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          follower_count?: number | null
          handle: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          tiktok_url?: string | null
          updated_at?: string
          user_id: string
          youtube_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          follower_count?: number | null
          handle?: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          tiktok_url?: string | null
          updated_at?: string
          user_id?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string | null
          id: string
          lifetime_points: number
          points: number
          tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lifetime_points?: number
          points?: number
          tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lifetime_points?: number
          points?: number
          tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          order_id: string | null
          points: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      occasion_tags: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          pet_size: string | null
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          size: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          pet_size?: string | null
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
          size?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          pet_size?: string | null
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          carrier: string | null
          cod_collected: boolean | null
          cod_collected_at: string | null
          created_at: string | null
          delivery_slot_id: string | null
          gift_message: string | null
          gift_wrap: boolean | null
          gift_wrap_price: number | null
          id: string
          notes: string | null
          order_number: string
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          refund_amount: number | null
          refund_processed_at: string | null
          refund_status: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax: number | null
          total: number
          tracking_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_address?: Json | null
          carrier?: string | null
          cod_collected?: boolean | null
          cod_collected_at?: string | null
          created_at?: string | null
          delivery_slot_id?: string | null
          gift_message?: string | null
          gift_wrap?: boolean | null
          gift_wrap_price?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_processed_at?: string | null
          refund_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax?: number | null
          total: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_address?: Json | null
          carrier?: string | null
          cod_collected?: boolean | null
          cod_collected_at?: string | null
          created_at?: string | null
          delivery_slot_id?: string | null
          gift_message?: string | null
          gift_wrap?: boolean | null
          gift_wrap_price?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_processed_at?: string | null
          refund_status?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tax?: number | null
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_slot_id_fkey"
            columns: ["delivery_slot_id"]
            isOneToOne: false
            referencedRelation: "delivery_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          gateway_response: Json | null
          id: string
          order_id: string | null
          payment_method: string
          payment_status: string
          refund_amount: number | null
          refund_processed_at: string | null
          refund_status: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          gateway_response?: Json | null
          id?: string
          order_id?: string | null
          payment_method: string
          payment_status?: string
          refund_amount?: number | null
          refund_processed_at?: string | null
          refund_status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          gateway_response?: Json | null
          id?: string
          order_id?: string | null
          payment_method?: string
          payment_status?: string
          refund_amount?: number | null
          refund_processed_at?: string | null
          refund_status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          influencer_id: string | null
          is_approved: boolean | null
          is_featured: boolean | null
          likes_count: number | null
          pet_id: string | null
          product_id: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          influencer_id?: string | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          likes_count?: number | null
          pet_id?: string | null
          product_id?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          influencer_id?: string | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          likes_count?: number | null
          pet_id?: string | null
          product_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_gallery_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_gallery_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_gallery_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_of_the_week: {
        Row: {
          created_at: string
          gallery_post_id: string
          id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          gallery_post_id: string
          id?: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          gallery_post_id?: string
          id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_of_the_week_gallery_post_id_fkey"
            columns: ["gallery_post_id"]
            isOneToOne: false
            referencedRelation: "pet_gallery"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          birth_date: string | null
          breed: string | null
          chest_cm: number | null
          created_at: string | null
          height_cm: number | null
          id: string
          is_primary: boolean | null
          length_cm: number | null
          name: string
          neck_cm: number | null
          notes: string | null
          photo_url: string | null
          species: string
          updated_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          birth_date?: string | null
          breed?: string | null
          chest_cm?: number | null
          created_at?: string | null
          height_cm?: number | null
          id?: string
          is_primary?: boolean | null
          length_cm?: number | null
          name: string
          neck_cm?: number | null
          notes?: string | null
          photo_url?: string | null
          species?: string
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          birth_date?: string | null
          breed?: string | null
          chest_cm?: number | null
          created_at?: string | null
          height_cm?: number | null
          id?: string
          is_primary?: boolean | null
          length_cm?: number | null
          name?: string
          neck_cm?: number | null
          notes?: string | null
          photo_url?: string | null
          species?: string
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      product_bundles: {
        Row: {
          bundle_price: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          original_price: number
          product_ids: string[]
          updated_at: string
        }
        Insert: {
          bundle_price: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          original_price: number
          product_ids?: string[]
          updated_at?: string
        }
        Update: {
          bundle_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          original_price?: number
          product_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      product_comparisons: {
        Row: {
          created_at: string
          id: string
          product_ids: string[]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_ids?: string[]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_ids?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      product_occasions: {
        Row: {
          created_at: string
          id: string
          occasion_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          occasion_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          occasion_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_occasions_occasion_id_fkey"
            columns: ["occasion_id"]
            isOneToOne: false
            referencedRelation: "occasion_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_occasions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          breathability: number | null
          care_dry: string | null
          care_wash: string | null
          category_id: string | null
          collection_id: string | null
          created_at: string | null
          description: string | null
          durability_rating: number | null
          fabric_type: string | null
          features: string[] | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean | null
          is_allergy_safe: boolean | null
          is_best_seller: boolean | null
          is_featured: boolean | null
          is_new_arrival: boolean | null
          low_stock_threshold: number | null
          matching_human_product_id: string | null
          matching_outfit_description: string | null
          name: string
          original_price: number | null
          pet_sizes: string[] | null
          price: number
          seasonal_tags: string[] | null
          sizes: string[] | null
          slug: string
          stock: number | null
          stretch_level: number | null
          updated_at: string | null
        }
        Insert: {
          breathability?: number | null
          care_dry?: string | null
          care_wash?: string | null
          category_id?: string | null
          collection_id?: string | null
          created_at?: string | null
          description?: string | null
          durability_rating?: number | null
          fabric_type?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_allergy_safe?: boolean | null
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          low_stock_threshold?: number | null
          matching_human_product_id?: string | null
          matching_outfit_description?: string | null
          name: string
          original_price?: number | null
          pet_sizes?: string[] | null
          price: number
          seasonal_tags?: string[] | null
          sizes?: string[] | null
          slug: string
          stock?: number | null
          stretch_level?: number | null
          updated_at?: string | null
        }
        Update: {
          breathability?: number | null
          care_dry?: string | null
          care_wash?: string | null
          category_id?: string | null
          collection_id?: string | null
          created_at?: string | null
          description?: string | null
          durability_rating?: number | null
          fabric_type?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_allergy_safe?: boolean | null
          is_best_seller?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          low_stock_threshold?: number | null
          matching_human_product_id?: string | null
          matching_outfit_description?: string | null
          name?: string
          original_price?: number | null
          pet_sizes?: string[] | null
          price?: number
          seasonal_tags?: string[] | null
          sizes?: string[] | null
          slug?: string
          stock?: number | null
          stretch_level?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_matching_human_product_id_fkey"
            columns: ["matching_human_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: []
      }
      recently_viewed: {
        Row: {
          id: string
          product_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          reward_points: number | null
          user_id: string
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          reward_points?: number | null
          user_id: string
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          reward_points?: number | null
          user_id?: string
          uses_count?: number | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          points_awarded: boolean | null
          referral_code_id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded?: boolean | null
          referral_code_id: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: boolean | null
          referral_code_id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      return_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          order_id: string
          order_item_id: string | null
          reason: string
          refund_amount: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          order_item_id?: string | null
          reason: string
          refund_amount?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          order_item_id?: string | null
          reason?: string
          refund_amount?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpful_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_verified_purchase: boolean | null
          photos: string[] | null
          product_id: string
          rating: number
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          photos?: string[] | null
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          photos?: string[] | null
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_ratings: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          order_id: string | null
          rating: number
          rating_type: string
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          order_id?: string | null
          rating: number
          rating_type: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          order_id?: string | null
          rating?: number
          rating_type?: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean | null
          label: string
          phone: string | null
          postal_code: string
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean | null
          label?: string
          phone?: string | null
          postal_code: string
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean | null
          label?: string
          phone?: string | null
          postal_code?: string
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shipment_events: {
        Row: {
          created_at: string
          description: string | null
          event_time: string
          id: string
          location: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_time?: string
          id?: string
          location?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_time?: string
          id?: string
          location?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          frequency: string
          id: string
          last_order_id: string | null
          next_delivery_date: string
          pet_size: string | null
          product_id: string
          quantity: number
          size: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          last_order_id?: string | null
          next_delivery_date: string
          pet_size?: string | null
          product_id: string
          quantity?: number
          size?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          last_order_id?: string | null
          next_delivery_date?: string
          pet_size?: string | null
          product_id?: string
          quantity?: number
          size?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_last_order_id_fkey"
            columns: ["last_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          message: string
          order_id: string | null
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          order_id?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          order_id?: string | null
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_staff: boolean | null
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_staff?: boolean | null
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_staff?: boolean | null
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weather_suggestions: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          message: string
          suggested_category_id: string | null
          suggested_collection_id: string | null
          temperature_max: number | null
          temperature_min: number | null
          weather_condition: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          suggested_category_id?: string | null
          suggested_collection_id?: string | null
          temperature_max?: number | null
          temperature_min?: number | null
          weather_condition: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          suggested_category_id?: string | null
          suggested_collection_id?: string | null
          temperature_max?: number | null
          temperature_min?: number | null
          weather_condition?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_suggestions_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weather_suggestions_suggested_collection_id_fkey"
            columns: ["suggested_collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
