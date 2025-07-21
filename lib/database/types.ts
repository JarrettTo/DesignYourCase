export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      case_styles: {
        Row: {
          color: string | null
          id: number
          material: string | null
          mockup: string | null
          phoneBrand: string | null
          phoneModel: string | null
          price: number | null
          seller: string
          thumbnail: string | null
          type: string | null
          variation: string | null
        }
        Insert: {
          color?: string | null
          id?: number
          material?: string | null
          mockup?: string | null
          phoneBrand?: string | null
          phoneModel?: string | null
          price?: number | null
          seller?: string
          thumbnail?: string | null
          type?: string | null
          variation?: string | null
        }
        Update: {
          color?: string | null
          id?: number
          material?: string | null
          mockup?: string | null
          phoneBrand?: string | null
          phoneModel?: string | null
          price?: number | null
          seller?: string
          thumbnail?: string | null
          type?: string | null
          variation?: string | null
        }
        Relationships: []
      }
      designs: {
        Row: {
          case_style_id: number
          created_at: string | null
          design_data: Json | null
          id: string
          image_url: string | null
          user_id: string | null
        }
        Insert: {
          case_style_id: number
          created_at?: string | null
          design_data?: Json | null
          id?: string
          image_url?: string | null
          user_id?: string | null
        }
        Update: {
          case_style_id?: number
          created_at?: string | null
          design_data?: Json | null
          id?: string
          image_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "designs_case_style_id_fkey"
            columns: ["case_style_id"]
            isOneToOne: false
            referencedRelation: "case_styles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          additional_notes: string | null
          address: string | null
          collection_method: string | null
          created_at: string | null
          customer_id: string | null
          design_id: string
          discount_code: string | null
          order_id: string
          proof_of_payment: string | null
          status: boolean | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          additional_notes?: string | null
          address?: string | null
          collection_method?: string | null
          created_at?: string | null
          customer_id?: string | null
          design_id: string
          discount_code?: string | null
          order_id?: string
          proof_of_payment?: string | null
          status?: boolean | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          additional_notes?: string | null
          address?: string | null
          collection_method?: string | null
          created_at?: string | null
          customer_id?: string | null
          design_id?: string
          discount_code?: string | null
          order_id?: string
          proof_of_payment?: string | null
          status?: boolean | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          email: string
          id: string
        }
        Insert: {
          email: string
          id: string
        }
        Update: {
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_designs_by_brand: {
        Args: { p_brand: string }
        Returns: {
          color: string | null
          id: number
          material: string | null
          mockup: string | null
          phoneBrand: string | null
          phoneModel: string | null
          price: number | null
          seller: string
          thumbnail: string | null
          type: string | null
          variation: string | null
        }[]
      }
      get_designs_with_details: {
        Args: { design_ids: string[] }
        Returns: {
          id: string
          user_id: string
          case_style_id: number
          phone_model: string
          phone_brand: string
          material: string
          color: string
          price: number
          mockup: string
        }[]
      }
      get_user_orders: {
        Args: { p_customer_id: string }
        Returns: {
          additional_notes: string | null
          address: string | null
          collection_method: string | null
          created_at: string | null
          customer_id: string | null
          design_id: string
          discount_code: string | null
          order_id: string
          proof_of_payment: string | null
          status: boolean | null
          updated_at: string | null
          whatsapp: string | null
        }[]
      }
      insert_order: {
        Args: {
          p_customer_id: string
          p_design_id: string
          p_whatsapp: string
          p_collection_method: string
          p_address: string
          p_additional_notes: string
          p_proof_of_payment: string
        }
        Returns: {
          additional_notes: string | null
          address: string | null
          collection_method: string | null
          created_at: string | null
          customer_id: string | null
          design_id: string
          discount_code: string | null
          order_id: string
          proof_of_payment: string | null
          status: boolean | null
          updated_at: string | null
          whatsapp: string | null
        }
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
