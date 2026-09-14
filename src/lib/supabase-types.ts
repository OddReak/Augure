/**
 * Types Supabase minimaux (§10) : à la main plutôt que générés
 * (`supabase gen types typescript`) — la seule table (`devices`) n'est
 * jamais interrogée directement depuis le client (RLS la ferme entièrement
 * à `anon`, voir la migration), seules les deux fonctions RPC le sont. Pas
 * de script de génération à maintenir pour deux signatures qui ne bougent
 * pas souvent ; à régénérer si le schéma grossit.
 */
export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: {
      abonner_appareil: {
        Args: {
          p_endpoint: string;
          p_p256dh: string;
          p_auth: string;
          p_lat: number;
          p_lon: number;
          p_label: string | null;
          p_heure_locale: string;
          p_fuseau: string;
        };
        Returns: void;
      };
      desabonner_appareil: {
        Args: { p_endpoint: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
