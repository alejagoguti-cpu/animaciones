import { createClient } from "@supabase/supabase-js";
import type { Design } from "../src/editor/types";

// Clave pública (publishable): está pensada para ir en el navegador. El acceso
// real lo controlan las reglas RLS de la base de datos (solo correos autorizados).
export const supabase = createClient(
  "https://ltbudfohnctcbriitebu.supabase.co",
  "sb_publishable_g5BwEh4WuQe3vS5Y-VYRTQ_pbV6a5Gl",
);

export type DesignRow = {
  id: string;
  name: string;
  format: string;
  data: Design;
  created_at: string;
  updated_at: string;
};

export const UPLOADS_BUCKET = "uploads";

export const publicUrl = (path: string) => supabase.storage.from(UPLOADS_BUCKET).getPublicUrl(path).data.publicUrl;
