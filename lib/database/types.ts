export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          id: string
          image_url: string
          user_id: string | null
        }
        Insert: {
          case_style_id: number
          created_at?: string | null
          id?: string
          image_url: string
          user_id?: string | null
        }
        Update: {
          case_style_id?: number
          created_at?: string | null
          id?: string
          image_url?: string
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
          {
            foreignKeyName: "designs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["email"]
          },
        ]
      }
      orders: {
        Row: {
          additional_notes: string | null
          address: string | null
          collection_method: string | null
          created_at: string | null
          customer_id: string
          design_id: string
          id: number
          order_id: string | null
          proof_of_payment: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          additional_notes?: string | null
          address?: string | null
          collection_method?: string | null
          created_at?: string | null
          customer_id: string
          design_id: string
          id?: never
          order_id?: string | null
          proof_of_payment?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          additional_notes?: string | null
          address?: string | null
          collection_method?: string | null
          created_at?: string | null
          customer_id?: string
          design_id?: string
          id?: never
          order_id?: string | null
          proof_of_payment?: string | null
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
          id: number
          name: string
        }
        Insert: {
          email: string
          id?: number
          name: string
        }
        Update: {
          email?: string
          id?: number
          name?: string
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
      get_user_orders: {
        Args: { p_customer_id: string }
        Returns: {
          additional_notes: string | null
          address: string | null
          collection_method: string | null
          created_at: string | null
          customer_id: string
          design_id: string
          id: number
          order_id: string | null
          proof_of_payment: string | null
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
          customer_id: string
          design_id: string
          id: number
          order_id: string | null
          proof_of_payment: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
