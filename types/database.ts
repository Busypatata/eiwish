export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Visibility = "private" | "shared" | "public";
export type CollaboratorRole = "viewer" | "editor";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string | null;
        };
        Update: {
          username?: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      wishlists: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string;
          cover_image_url: string | null;
          visibility: Visibility;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string;
          cover_image_url?: string | null;
          visibility?: Visibility;
          slug: string;
        };
        Update: {
          title?: string;
          description?: string;
          cover_image_url?: string | null;
          visibility?: Visibility;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlists_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      wishlist_collaborators: {
        Row: {
          id: string;
          wishlist_id: string;
          user_id: string;
          role: CollaboratorRole;
          invited_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          user_id: string;
          role?: CollaboratorRole;
          invited_by: string;
        };
        Update: {
          role?: CollaboratorRole;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_collaborators_wishlist_id_fkey";
            columns: ["wishlist_id"];
            isOneToOne: false;
            referencedRelation: "wishlists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlist_collaborators_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlist_collaborators_profile_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      wishlist_items: {
        Row: {
          id: string;
          wishlist_id: string;
          title: string;
          description: string;
          image_url: string | null;
          product_url: string | null;
          price: number | null;
          currency: string;
          priority: number;
          is_purchased: boolean;
          purchased_by: string | null;
          purchased_at: string | null;
          sort_order: number;
          added_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          title: string;
          description?: string;
          image_url?: string | null;
          product_url?: string | null;
          price?: number | null;
          currency?: string;
          priority?: number;
          is_purchased?: boolean;
          purchased_by?: string | null;
          purchased_at?: string | null;
          sort_order?: number;
          added_by?: string | null;
        };
        Update: {
          title?: string;
          description?: string;
          image_url?: string | null;
          product_url?: string | null;
          price?: number | null;
          currency?: string;
          priority?: number;
          is_purchased?: boolean;
          purchased_by?: string | null;
          purchased_at?: string | null;
         sort_order?: number;
          added_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"];
            isOneToOne: false;
            referencedRelation: "wishlists";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_wishlist_collaborator: {
        Args: { target_wishlist_id: string };
        Returns: boolean;
      };
      is_wishlist_editor: {
        Args: { target_wishlist_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Wishlist = Database["public"]["Tables"]["wishlists"]["Row"];
export type WishlistCollaborator =
  Database["public"]["Tables"]["wishlist_collaborators"]["Row"];
export type WishlistItem = Database["public"]["Tables"]["wishlist_items"]["Row"];
