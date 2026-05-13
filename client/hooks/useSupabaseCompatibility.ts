import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface CompatibilityRecord {
  id: string;
  equipamento: string;
  parametro: string;
  fabricante: string;
  modelo: string;
  acessorio: string;
  foto_produto: string[];
  foto_conexao: string[];
  observacoes: string;
  created_at?: string;
  updated_at?: string;
}

export function useSupabaseCompatibility() {
  const [records, setRecords] = useState<CompatibilityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all compatibility records via direct Supabase access
  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("compatibility")
        .select("*")
        .order("created_at", { ascending: false });

      if (supabaseError) {
        console.error("[useSupabaseCompatibility] Supabase error details:", {
          message: supabaseError.message,
          status: supabaseError.status,
          code: supabaseError.code,
          details: supabaseError.details,
          hint: supabaseError.hint,
        });
        throw new Error(supabaseError.message);
      }

      const transformed = (data || []).map((record: any) => ({
        id: record.id,
        equipamento: record.equipamento,
        parametro: record.parametro,
        fabricante: record.fabricante,
        modelo: record.modelo,
        acessorio: record.acessorio,
        foto_produto: Array.isArray(record.foto_produto) ? record.foto_produto : [],
        foto_conexao: Array.isArray(record.foto_conexao) ? record.foto_conexao : [],
        observacoes: record.observacoes,
        created_at: record.created_at,
        updated_at: record.updated_at,
      }));

      setRecords(transformed);
      console.log(`[useSupabaseCompatibility] Loaded ${transformed.length} records via direct access`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dados";
      setError(message);
      console.error("[useSupabaseCompatibility] Error fetching records:", err);
      toast.error("Erro ao carregar dados do Supabase: " + message);
    } finally {
      setLoading(false);
    }
  };

  // Search compatibility records via direct Supabase access
  const searchRecords = async (query: string) => {
    try {
      setLoading(true);
      setError(null);

      let supabaseQuery = supabase.from("compatibility").select("*");

      if (query && query.trim() !== "") {
        supabaseQuery = supabaseQuery.or(
          `equipamento.ilike.%${query}%,fabricante.ilike.%${query}%,modelo.ilike.%${query}%,acessorio.ilike.%${query}%`
        );
      }

      const { data, error: supabaseError } = await supabaseQuery.order("created_at", { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const filtered = (data || []).map((record: any) => ({
        id: record.id,
        equipamento: record.equipamento,
        parametro: record.parametro,
        fabricante: record.fabricante,
        modelo: record.modelo,
        acessorio: record.acessorio,
        foto_produto: Array.isArray(record.foto_produto) ? record.foto_produto : [],
        foto_conexao: Array.isArray(record.foto_conexao) ? record.foto_conexao : [],
        observacoes: record.observacoes,
        created_at: record.created_at,
        updated_at: record.updated_at,
      }));

      setRecords(filtered);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro na pesquisa";
      setError(message);
      console.error("[useSupabaseCompatibility] Error searching records:", err);
      toast.error("Erro ao pesquisar no Supabase.");
    } finally {
      setLoading(false);
    }
  };

  // Create a new record via direct Supabase access
  const createRecord = async (data: Omit<CompatibilityRecord, "id" | "created_at" | "updated_at">) => {
    try {
      setLoading(true);
      setError(null);

      // Ensure arrays are properly formatted for Postgres text[]
      const foto_produto = Array.isArray(data.foto_produto) ? data.foto_produto : [];
      const foto_conexao = Array.isArray(data.foto_conexao) ? data.foto_conexao : [];

      const { data: newRecord, error: supabaseError } = await supabase
        .from("compatibility")
        .insert([{
          equipamento: data.equipamento,
          parametro: data.parametro || "",
          fabricante: data.fabricante,
          modelo: data.modelo,
          acessorio: data.acessorio,
          foto_produto,
          foto_conexao,
          observacoes: data.observacoes || "",
        }])
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Refresh records
      await fetchRecords();
      return newRecord;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar registro";
      setError(message);
      console.error("[useSupabaseCompatibility] Error creating record:", err);
      toast.error("Erro ao criar registro. Verifique se você tem permissão.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing record via direct Supabase access
  const updateRecord = async (id: string, data: Partial<Omit<CompatibilityRecord, "id" | "created_at" | "updated_at">>) => {
    try {
      setLoading(true);
      setError(null);

      const payload: any = {};
      if (data.equipamento !== undefined) payload.equipamento = data.equipamento;
      if (data.parametro !== undefined) payload.parametro = data.parametro;
      if (data.fabricante !== undefined) payload.fabricante = data.fabricante;
      if (data.modelo !== undefined) payload.modelo = data.modelo;
      if (data.acessorio !== undefined) payload.acessorio = data.acessorio;
      if (data.observacoes !== undefined) payload.observacoes = data.observacoes;

      // Ensure arrays are properly formatted for Postgres text[]
      if (data.foto_produto !== undefined) {
        payload.foto_produto = Array.isArray(data.foto_produto) ? data.foto_produto : [];
      }
      if (data.foto_conexao !== undefined) {
        payload.foto_conexao = Array.isArray(data.foto_conexao) ? data.foto_conexao : [];
      }

      const { data: updatedData, error: supabaseError } = await supabase
        .from("compatibility")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Refresh records
      await fetchRecords();
      return updatedData;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar registro";
      setError(message);
      console.error("[useSupabaseCompatibility] Error updating record:", err);
      toast.error("Erro ao atualizar registro. Verifique permissões.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a record
  const deleteRecord = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from("compatibility")
        .delete()
        .eq("id", id);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Refresh records
      await fetchRecords();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[useSupabaseCompatibility] Error deleting record:", err);
      toast.error("Erro ao deletar registro no servidor.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Import compatibility records from CSV
  const importRecords = async (csvData: Record<string, string>[], autoDetectImages: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      console.log("[useSupabaseCompatibility] Importing", csvData.length, "records...");

      const newRecords = csvData.map((row) => ({
        equipamento: row.equipamento || "",
        parametro: row.parametro || "",
        fabricante: row.fabricante || "",
        modelo: row.modelo || "",
        acessorio: row.acessorio || "",
        foto_produto: row.foto_produto ? JSON.parse(row.foto_produto) : [],
        foto_conexao: row.foto_conexao ? JSON.parse(row.foto_conexao) : [],
        observacoes: row.observacoes || "",
      }));

      // Insert all records into Supabase
      const { error: supabaseError } = await supabase
        .from("compatibility")
        .insert(newRecords);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Refresh records
      await fetchRecords();

      return {
        successCount: newRecords.length,
        errorCount: 0,
        results: newRecords.map((r, index) => ({
          acessorio: r.acessorio,
          success: true,
          id: csvData[index].acessorio,
        })),
        message: `${newRecords.length} registros importados com sucesso`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[useSupabaseCompatibility] Error importing records:", err);
      toast.error("Erro ao importar registros no servidor.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    records,
    loading,
    error,
    fetchRecords,
    searchRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    importRecords,
  };
}
