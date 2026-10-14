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
    PostgrestVersion: "12.2.12"
  }
  public: {
    Tables: {
      barcoded_products: {
        Row: {
          barcode_id: string
          calories: number | null
          carbohydrates: number | null
          category: string | null
          fats: number | null
          fiber: number | null
          image: string | null
          last_updated: string | null
          product_name: string | null
          protein: number | null
          salt: number | null
          saturated_fats: number | null
          serving_size_unit: string | null
          serving_size_value: number | null
          sugar: number | null
        }
        Insert: {
          barcode_id: string
          calories?: number | null
          carbohydrates?: number | null
          category?: string | null
          fats?: number | null
          fiber?: number | null
          image?: string | null
          last_updated?: string | null
          product_name?: string | null
          protein?: number | null
          salt?: number | null
          saturated_fats?: number | null
          serving_size_unit?: string | null
          serving_size_value?: number | null
          sugar?: number | null
        }
        Update: {
          barcode_id?: string
          calories?: number | null
          carbohydrates?: number | null
          category?: string | null
          fats?: number | null
          fiber?: number | null
          image?: string | null
          last_updated?: string | null
          product_name?: string | null
          protein?: number | null
          salt?: number | null
          saturated_fats?: number | null
          serving_size_unit?: string | null
          serving_size_value?: number | null
          sugar?: number | null
        }
        Relationships: []
      }
      non_barcoded_products: {
        Row: {
          calories: number | null
          carbohydrates: number | null
          category: string | null
          fats: number | null
          fiber: number | null
          id: string
          image: string | null
          last_updated: string | null
          product_name_en: string | null
          product_name_ro: string | null
          protein: number | null
          salt: number | null
          saturated_fats: number | null
          serving_size_unit: string | null
          serving_size_value: number | null
          sugar: number | null
        }
        Insert: {
          calories?: number | null
          carbohydrates?: number | null
          category?: string | null
          fats?: number | null
          fiber?: number | null
          id?: string
          image?: string | null
          last_updated?: string | null
          product_name_en?: string | null
          product_name_ro?: string | null
          protein?: number | null
          salt?: number | null
          saturated_fats?: number | null
          serving_size_unit?: string | null
          serving_size_value?: number | null
          sugar?: number | null
        }
        Update: {
          calories?: number | null
          carbohydrates?: number | null
          category?: string | null
          fats?: number | null
          fiber?: number | null
          id?: string
          image?: string | null
          last_updated?: string | null
          product_name_en?: string | null
          product_name_ro?: string | null
          protein?: number | null
          salt?: number | null
          saturated_fats?: number | null
          serving_size_unit?: string | null
          serving_size_value?: number | null
          sugar?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_products_similarity: {
        Args: {
          limit_count?: number
          search_term: string
          similarity_threshold?: number
        }
        Returns: {
          calories: number
          carbohydrates: number
          category: string
          fats: number
          fiber: number
          id: string
          image: string
          last_updated: string
          match_type: string
          product_name_en: string
          product_name_ro: string
          protein: number
          salt: number
          saturated_fats: number
          serving_size_unit: string
          serving_size_value: number
          similarity_score: number
          sugar: number
        }[]
      }
      uuid_v7: { Args: never; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
