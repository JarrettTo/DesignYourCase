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
      designs: {
        Row: {
          case_type: string
          color: string
          created_at: string | null
          design_data: string
          id: string
          image_url: string
          phone_model: string
          user_id: string | null
        }
        Insert: {
          case_type: string
          color: string
          created_at?: string | null
          design_data: string
          id?: string
          image_url: string
          phone_model: string
          user_id?: string | null
        }
        Update: {
          case_type?: string
          color?: string
          created_at?: string | null
          design_data?: string
          id?: string
          image_url?: string
          phone_model?: string
          user_id?: string | null
        }
        Relationships: [
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
      get_user_orders: {
        Args: {
          p_customer_id: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
