import { useState, useMemo, useEffect, Fragment } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useImages } from "@/hooks/useImages";
import { useSupabaseCompatibility } from "@/hooks/useSupabaseCompatibility";
import { useCompatibilityGoogleDrive } from "@/hooks/useCompatibilityGoogleDrive";
import {
  Search,
  Plus,
  Trash2,
  Download,
  Image as ImageIcon,
  ChevronDown,
  X,
  Edit,
  Upload,
  Check,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface CompatibilityRecord {
  id: string;
  equipamento: string;
  parametro: string;
  fabricante: string;
  modelo: string;
  acessorio: string;
  foto_produto: string[];
  foto_conexao: string[];
  observacoes: string;
}

export default function Compatibility() {
  const { records, loading, fetchRecords, searchRecords, createRecord, updateRecord, deleteRecord, importRecords } = useSupabaseCompatibility();
  const { fetchGoogleDriveImages, refreshGoogleDriveImages, getGoogleDriveImages, isLoadingForCode } = useCompatibilityGoogleDrive();
  const [data, setData] = useState<CompatibilityRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<CompatibilityRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"compact" | "expandable">("compact");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    equipamento: "",
    parametro: "",
    fabricante: "",
    modelo: "",
    acessorio: "",
  });
  const [newRecord, setNewRecord] = useState<CompatibilityRecord>({
    id: "",
    equipamento: "",
    parametro: "",
    fabricante: "",
    modelo: "",
    acessorio: "",
    foto_produto: [],
    foto_conexao: [],
    observacoes: "",
  });
  const [showImageSelector, setShowImageSelector] = useState<
    "foto_produto" | "foto_conexao" | null
  >(null);
  const [imageSelectorContext, setImageSelectorContext] = useState<"new" | "edit" | null>(null);
  const [selectedImageToZoom, setSelectedImageToZoom] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [autoDetectImages, setAutoDetectImages] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const { images: availableImages, loading: loadingImages, findImages, getImageUrl } = useImages();

  // Load data from Supabase on mount
  useEffect(() => {
    fetchRecords().then(() => {
      // Data will be updated via records state
    });
  }, []);

  // Update local data when records from Supabase change
  useEffect(() => {
    setData(records);
    // Automatically fetch Google Drive images for all records
    records.forEach((record) => {
      if (record.acessorio && record.acessorio.trim()) {
        fetchGoogleDriveImages(record.acessorio).catch(err => {
          console.error(`Failed to fetch Google Drive images for ${record.acessorio}:`, err);
        });
      }
    });
  }, [records, fetchGoogleDriveImages]);

  // Handle ESC key to close zoom modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedImageToZoom) {
        setSelectedImageToZoom(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageToZoom]);

  const handleOpenImageSelector = async (
    type: "foto_produto" | "foto_conexao"
  ) => {
    if (!newRecord.acessorio.trim()) {
      toast.error(
        "Preencha o código do produto antes de selecionar fotos"
      );
      return;
    }

    setShowImageSelector(type);
    setImageSelectorContext("new");
    await findImages(newRecord.acessorio);
  };

  const filteredData = useMemo(() => {
    let result = data;

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (record) =>
          record.equipamento.toLowerCase().includes(term) ||
          record.fabricante.toLowerCase().includes(term) ||
          record.modelo.toLowerCase().includes(term) ||
          record.acessorio.toLowerCase().includes(term) ||
          record.parametro.toLowerCase().includes(term)
      );
    }

    // Apply specific field filters
    if (filters.equipamento) {
      const term = filters.equipamento.toLowerCase();
      result = result.filter((record) =>
        record.equipamento.toLowerCase().includes(term)
      );
    }
    if (filters.parametro) {
      const term = filters.parametro.toLowerCase();
      result = result.filter((record) =>
        record.parametro.toLowerCase().includes(term)
      );
    }
    if (filters.fabricante) {
      const term = filters.fabricante.toLowerCase();
      result = result.filter((record) =>
        record.fabricante.toLowerCase().includes(term)
      );
    }
    if (filters.modelo) {
      const term = filters.modelo.toLowerCase();
      result = result.filter((record) =>
        record.modelo.toLowerCase().includes(term)
      );
    }
    if (filters.acessorio) {
      const term = filters.acessorio.toLowerCase();
      result = result.filter((record) =>
        record.acessorio.toLowerCase().includes(term)
      );
    }

    return result;
  }, [data, searchTerm, filters]);

  const handleAddRecord = async () => {
    if (
      !newRecord.equipamento ||
      !newRecord.fabricante ||
      !newRecord.modelo ||
      !newRecord.acessorio
    ) {
      toast.error("Preencha todos os campos obrigatórios (equipamento, fabricante, modelo e código do produto)");
      return;
    }

    try {
      console.log("[handleAddRecord] Creating record with data:", {
        equipamento: newRecord.equipamento,
        acessorio: newRecord.acessorio,
        foto_produto: newRecord.foto_produto,
        foto_conexao: newRecord.foto_conexao,
      });

      const createdRecord = await createRecord({
        equipamento: newRecord.equipamento,
        parametro: newRecord.parametro,
        fabricante: newRecord.fabricante,
        modelo: newRecord.modelo,
        acessorio: newRecord.acessorio,
        foto_produto: newRecord.foto_produto,
        foto_conexao: newRecord.foto_conexao,
        observacoes: newRecord.observacoes,
      });

      console.log("[handleAddRecord] Record created successfully:", createdRecord);

      setNewRecord({
        id: "",
        equipamento: "",
        parametro: "",
        fabricante: "",
        modelo: "",
        acessorio: "",
        foto_produto: [],
        foto_conexao: [],
        observacoes: "",
      });
      setIsAdding(false);
      toast.success("Produto adicionado com sucesso!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Error adding record:", error);
      toast.error(`Erro ao adicionar produto: ${errorMessage}`);
    }
  };

  const handleOpenEditModal = (record: CompatibilityRecord) => {
    setEditingRecord({
      ...record,
      equipamento: record.equipamento || "",
      parametro: record.parametro || "",
      fabricante: record.fabricante || "",
      modelo: record.modelo || "",
      acessorio: record.acessorio || "",
      observacoes: record.observacoes || "",
    });
    setEditingId(record.id);
    setIsEditModalOpen(true);
  };

  const handleSaveEditRecord = async () => {
    if (!editingRecord) return;

    if (
      !editingRecord.equipamento ||
      !editingRecord.fabricante ||
      !editingRecord.modelo ||
      !editingRecord.acessorio
    ) {
      toast.error("Preencha todos os campos obrigatórios (equipamento, fabricante, modelo e código do produto)");
      return;
    }

    try {
      await updateRecord(editingRecord.id, {
        equipamento: editingRecord.equipamento,
        parametro: editingRecord.parametro,
        fabricante: editingRecord.fabricante,
        modelo: editingRecord.modelo,
        acessorio: editingRecord.acessorio,
        foto_produto: editingRecord.foto_produto,
        foto_conexao: editingRecord.foto_conexao,
        observacoes: editingRecord.observacoes,
      });

      setIsEditModalOpen(false);
      setEditingRecord(null);
      setEditingId(null);
      toast.success("Produto atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating record:", error);
    }
  };

  const handleOpenImageSelectorForEdit = async (
    type: "foto_produto" | "foto_conexao"
  ) => {
    if (!editingRecord?.acessorio.trim()) {
      toast.error(
        "Preencha o código do produto antes de selecionar fotos"
      );
      return;
    }

    setShowImageSelector(type);
    setImageSelectorContext("edit");
    await findImages(editingRecord.acessorio);
  };

  const handleAddImageToEdit = (
    imageFile: string,
    type: "foto_produto" | "foto_conexao"
  ) => {
    if (!editingRecord) return;

    if (type === "foto_produto") {
      setEditingRecord({
        ...editingRecord,
        foto_produto: [...editingRecord.foto_produto, imageFile],
      });
    } else {
      setEditingRecord({
        ...editingRecord,
        foto_conexao: [...editingRecord.foto_conexao, imageFile],
      });
    }
    toast.success("Foto adicionada!");
  };

  const handleRemoveImageFromEdit = (
    imageFile: string,
    type: "foto_produto" | "foto_conexao"
  ) => {
    if (!editingRecord) return;

    if (type === "foto_produto") {
      setEditingRecord({
        ...editingRecord,
        foto_produto: editingRecord.foto_produto.filter((img) => img !== imageFile),
      });
    } else {
      setEditingRecord({
        ...editingRecord,
        foto_conexao: editingRecord.foto_conexao.filter((img) => img !== imageFile),
      });
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteRecord(id);
      toast.success("Produto removido com sucesso!");
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const handleAddImage = (
    imageFile: string,
    type: "foto_produto" | "foto_conexao"
  ) => {
    if (type === "foto_produto") {
      setNewRecord({
        ...newRecord,
        foto_produto: [...newRecord.foto_produto, imageFile],
      });
    } else {
      setNewRecord({
        ...newRecord,
        foto_conexao: [...newRecord.foto_conexao, imageFile],
      });
    }
    toast.success("Foto adicionada!");
  };

  const handleRemoveImage = (
    imageFile: string,
    type: "foto_produto" | "foto_conexao"
  ) => {
    if (type === "foto_produto") {
      setNewRecord({
        ...newRecord,
        foto_produto: newRecord.foto_produto.filter((img) => img !== imageFile),
      });
    } else {
      setNewRecord({
        ...newRecord,
        foto_conexao: newRecord.foto_conexao.filter((img) => img !== imageFile),
      });
    }
  };

  const handleExport = () => {
    const csv = [
      [
        "EQUIPAMENTO",
        "PARAMETRO",
        "FABRICANTE",
        "MODELO",
        "CÓDIGO DO PRODUTO",
        "FOTO PRODUTO",
        "FOTO CONEXÃO",
        "OBSERVAÇÕES",
      ],
      ...filteredData.map((record) => [
        record.equipamento,
        record.parametro,
        record.fabricante,
        record.modelo,
        record.acessorio,
        record.foto_produto.join("; "),
        record.foto_conexao.join("; "),
        record.observacoes,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "compatibilidade.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Compatibilidade exportada em CSV!");
  };

  // Parse CSV file - handles quoted fields and proper CSV formatting
  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().split("\n");
    if (lines.length === 0) return [];

    // Helper function to parse CSV line properly
    const parseCSVLine = (line: string): string[] => {
      const cells: string[] = [];
      let currentCell = "";
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            // Escaped quote
            currentCell += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            insideQuotes = !insideQuotes;
          }
        } else if (char === "," && !insideQuotes) {
          // End of cell
          cells.push(currentCell.trim());
          currentCell = "";
        } else {
          currentCell += char;
        }
      }

      // Add last cell
      cells.push(currentCell.trim());

      return cells;
    };

    // Parse header
    const headers = parseCSVLine(lines[0]);

    // Parse rows
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // Skip empty lines

      const cells = parseCSVLine(line);
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = cells[index] || "";
      });

      rows.push(row);
    }

    return rows;
  };

  const handleImportCSV = async () => {
    if (!csvFile) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    try {
      setImportLoading(true);
      const fileContent = await csvFile.text();
      const csvData = parseCSV(fileContent);

      if (csvData.length === 0) {
        toast.error("Arquivo CSV está vazio");
        return;
      }

      const results = await importRecords(csvData, autoDetectImages);
      setImportResults(results);
      toast.success(results.message);

      // Reset file input
      setCsvFile(null);
      const fileInput = document.getElementById("csv-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Reload data after import
      await fetchRecords();
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error("Erro ao importar CSV");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Catálogo de Compatibilidade
              </h1>
              <p className="text-muted-foreground mt-2">
                Gerencie a compatibilidade entre equipamentos e acessórios
              </p>
            </div>
            <Button
              onClick={() => setIsAdding(!isAdding)}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              {isAdding ? "Cancelar" : "Adicionar"}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por equipamento, fabricante, modelo ou acessório..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Advanced Filters */}
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-600 text-sm">Filtros Avançados</h3>
              </div>
              <div className="flex gap-2">
                {(filters.equipamento ||
                  filters.parametro ||
                  filters.fabricante ||
                  filters.modelo ||
                  filters.acessorio) && (
                  <Button
                    onClick={() =>
                      setFilters({
                        equipamento: "",
                        parametro: "",
                        fabricante: "",
                        modelo: "",
                        acessorio: "",
                      })
                    }
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    Limpar Filtros
                  </Button>
                )}
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                >
                  {showFilters ? "Fechar" : "Abrir"}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="text-xs font-500 text-muted-foreground mb-1 block">
                    Equipamento
                  </label>
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.equipamento}
                    onChange={(e) =>
                      setFilters({ ...filters, equipamento: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-500 text-muted-foreground mb-1 block">
                    Parâmetro
                  </label>
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.parametro}
                    onChange={(e) =>
                      setFilters({ ...filters, parametro: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-500 text-muted-foreground mb-1 block">
                    Fabricante
                  </label>
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.fabricante}
                    onChange={(e) =>
                      setFilters({ ...filters, fabricante: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-500 text-muted-foreground mb-1 block">
                    Modelo
                  </label>
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.modelo}
                    onChange={(e) =>
                      setFilters({ ...filters, modelo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-500 text-muted-foreground mb-1 block">
                    Código do Acessório
                  </label>
                  <input
                    type="text"
                    placeholder="Filtrar..."
                    value={filters.acessorio}
                    onChange={(e) =>
                      setFilters({ ...filters, acessorio: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {filteredData.length} registro(s) encontrado(s)
              </p>
              <div className="flex items-center gap-1 bg-background rounded border border-border p-1">
                <button
                  onClick={() => setViewMode("compact")}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    viewMode === "compact"
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-muted"
                  }`}
                  title="Visualizar com imagens inline"
                >
                  Compacto
                </button>
                <button
                  onClick={() => setViewMode("expandable")}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    viewMode === "expandable"
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-muted"
                  }`}
                  title="Visualizar com opção de expandir"
                >
                  ▼ Expansível
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowImportModal(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Importar CSV
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Add New Record Form */}
        {isAdding && (
          <Card className="p-6 border-primary/50">
            <h3 className="text-lg font-bold mb-4">Novo Produto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  EQUIPAMENTO *
                </label>
                <input
                  type="text"
                  value={newRecord.equipamento}
                  onChange={(e) =>
                    setNewRecord({
                      ...newRecord,
                      equipamento: e.target.value,
                    })
                  }
                  placeholder="Ex: Monitor de Pressão"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  PARAMETRO
                </label>
                <input
                  type="text"
                  value={newRecord.parametro}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, parametro: e.target.value })
                  }
                  placeholder="Ex: Pressão Arterial"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  FABRICANTE *
                </label>
                <input
                  type="text"
                  value={newRecord.fabricante}
                  onChange={(e) =>
                    setNewRecord({
                      ...newRecord,
                      fabricante: e.target.value,
                    })
                  }
                  placeholder="Ex: OEM-Y1976A"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  MODELO *
                </label>
                <input
                  type="text"
                  value={newRecord.modelo}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, modelo: e.target.value })
                  }
                  placeholder="Ex: PA100"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground">
                ACESSÓRIO (CÓDIGO DO PRODUTO) *
              </label>
              <input
                type="text"
                value={newRecord.acessorio}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, acessorio: e.target.value.toUpperCase() })
                }
                placeholder="Ex: PA100-MANGUITO-L ou SKU-12345"
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Código único do acessório/produto (ex: SKU, modelo ou identificador do fabricante)
              </p>
            </div>

            {/* Images Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    FOTO PRODUTO
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenImageSelector("foto_produto")}
                    className="gap-1"
                  >
                    <ImageIcon className="w-3 h-3" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {newRecord.foto_produto.map((img) => (
                    <div
                      key={img}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <span className="text-sm text-foreground">{img}</span>
                      <button
                        onClick={() => handleRemoveImage(img, "foto_produto")}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-muted-foreground">
                    FOTO CONEXÃO
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenImageSelector("foto_conexao")}
                    className="gap-1"
                  >
                    <ImageIcon className="w-3 h-3" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {newRecord.foto_conexao.map((img) => (
                    <div
                      key={img}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <span className="text-sm text-foreground">{img}</span>
                      <button
                        onClick={() => handleRemoveImage(img, "foto_conexao")}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground">
                OBSERVAÇÕES
              </label>
              <textarea
                value={newRecord.observacoes}
                onChange={(e) =>
                  setNewRecord({
                    ...newRecord,
                    observacoes: e.target.value,
                  })
                }
                placeholder="Adicione observações ou notas importantes..."
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>

            <Button onClick={handleAddRecord} className="w-full bg-primary">
              Adicionar Produto
            </Button>
          </Card>
        )}

        {/* Image Selector Modal */}
        {showImageSelector && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-4xl p-6 border-secondary/50 my-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  Selecionar{" "}
                  {showImageSelector === "foto_produto"
                    ? "Foto do Produto"
                    : "Foto da Conexão"}
                </h3>
                <button
                  onClick={() => {
                    setShowImageSelector(null);
                    setImageSelectorContext(null);
                  }}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted rounded">
                Buscando imagens para: <span className="font-mono font-semibold text-foreground">
                  {imageSelectorContext === "edit" ? editingRecord?.acessorio : newRecord.acessorio}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                {loadingImages ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">Carregando imagens...</p>
                  </div>
                ) : availableImages.length > 0 ? (
                  availableImages.map((img) => (
                    <div
                      key={img}
                      className="relative group rounded-lg overflow-hidden border border-border bg-muted"
                    >
                      <img
                        src={img}
                        alt={img}
                        className="w-full h-28 object-cover"
                        onError={(e) => {
                          console.error("Image failed to load:", img);
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedImageToZoom(img)}
                          className="p-2 bg-white/90 hover:bg-white rounded-lg text-sm font-medium transition"
                          title="Ampliar imagem"
                        >
                          🔍
                        </button>
                        <button
                          onClick={() => {
                            if (imageSelectorContext === "edit") {
                              handleAddImageToEdit(img, showImageSelector);
                            } else {
                              handleAddImage(img, showImageSelector);
                            }
                            setShowImageSelector(null);
                            setImageSelectorContext(null);
                          }}
                          className="p-2 bg-primary hover:bg-primary/90 rounded-lg text-white text-sm font-medium transition"
                          title="Selecionar esta imagem"
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhuma imagem encontrada para "{newRecord.acessorio}"
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Table View */}
        <div className="space-y-3">
          {filteredData.length === 0 ? (
            <Card className="p-8 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum resultado encontrado</p>
              <p className="text-sm text-muted-foreground mt-2">
                Tente ajustar os filtros ou adicione um novo produto
              </p>
            </Card>
          ) : viewMode === "compact" ? (
            // COMPACT VIEW - Shows images inline without expand
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredData.map((record) => (
                <Card key={record.id} className="p-4 hover:shadow-lg transition">
                  <div className="space-y-3">
                    {/* Header */}
                    <div>
                      <h3 className="font-bold text-lg text-primary">
                        {record.equipamento}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {record.fabricante} • {record.modelo}
                      </p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">
                          PARÂMETRO
                        </p>
                        <p className="font-medium">{record.parametro || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">
                          CÓDIGO
                        </p>
                        <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {record.acessorio}
                        </p>
                      </div>
                    </div>

                    {/* Observações */}
                    {record.observacoes && (
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground font-semibold mb-1">
                          OBSERVAÇÕES
                        </p>
                        <p className="text-sm text-foreground line-clamp-2">
                          {record.observacoes}
                        </p>
                      </div>
                    )}

                    {/* Images - Produto */}
                    {record.foto_produto.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-2">
                          FOTO PRODUTO ({record.foto_produto.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {record.foto_produto.map((img) => (
                            <div
                              key={img}
                              className="relative group rounded-lg overflow-hidden border border-border bg-muted cursor-pointer aspect-square"
                              onClick={() => setSelectedImageToZoom(img)}
                            >
                              <img
                                src={getImageUrl(img)}
                                alt={img}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-medium text-sm bg-black/50 px-3 py-1 rounded">
                                  EXPANDIR
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Images - Conexão */}
                    {record.foto_conexao.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-2">
                          FOTO CONEXÃO ({record.foto_conexao.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {record.foto_conexao.map((img) => (
                            <div
                              key={img}
                              className="relative group rounded-lg overflow-hidden border border-border bg-muted cursor-pointer aspect-square"
                              onClick={() => setSelectedImageToZoom(img)}
                            >
                              <img
                                src={getImageUrl(img)}
                                alt={img}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-medium text-sm bg-black/50 px-3 py-1 rounded">
                                  EXPANDIR
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Google Drive Images */}
                    {(() => {
                      const gdImages = getGoogleDriveImages(record.acessorio);
                      const isLoading = isLoadingForCode(record.acessorio);
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground font-semibold">
                              FOTOS GOOGLE DRIVE ({gdImages.length})
                            </p>
                            <button
                              onClick={() => refreshGoogleDriveImages(record.acessorio)}
                              disabled={isLoading}
                              className="p-1 hover:bg-primary/10 text-primary rounded transition disabled:opacity-50"
                              title="Atualizar imagens do Google Drive"
                            >
                              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                          {gdImages.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                              {gdImages.map((img) => (
                                <div
                                  key={img}
                                  className="relative group rounded-lg overflow-hidden border border-primary/30 bg-muted cursor-pointer aspect-square"
                                  onClick={() => setSelectedImageToZoom(img)}
                                >
                                  <img
                                    src={img}
                                    alt="Google Drive"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white font-medium text-sm bg-black/50 px-3 py-1 rounded">
                                      EXPANDIR
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              {isLoading ? 'Carregando...' : 'Nenhuma imagem encontrada no Google Drive'}
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => handleOpenEditModal(record)}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-950 text-blue-600 rounded transition"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-950 text-red-600 rounded transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // EXPANDABLE VIEW - Original table view with expand/collapse
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      EQUIPAMENTO
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      PARAMETRO
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      FABRICANTE
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      MODELO
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      CÓDIGO DO PRODUTO
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      FOTOS
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      AÇÕES
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredData.map((record) => (
                    <Fragment key={record.id}>
                      <tr className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">
                          {record.equipamento}
                        </td>
                        <td className="px-4 py-3">{record.parametro}</td>
                        <td className="px-4 py-3 font-mono text-xs bg-muted/30 px-2 py-1 rounded">
                          {record.fabricante}
                        </td>
                        <td className="px-4 py-3">{record.modelo}</td>
                        <td className="px-4 py-3">{record.acessorio}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                              {record.foto_produto.length}
                            </span>
                            <span className="text-xs bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                              {record.foto_conexao.length}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() =>
                                setExpandedId(
                                  expandedId === record.id ? null : record.id
                                )
                              }
                              className="p-1 hover:bg-muted rounded transition"
                              title="Ver detalhes"
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                  expandedId === record.id
                                    ? "transform rotate-180"
                                    : ""
                                }`}
                              />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(record)}
                              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-950 text-blue-600 rounded transition"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-950 text-red-600 rounded transition"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === record.id && (
                        <tr key={`${record.id}-details`} className="bg-muted/30">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">
                                  Observações
                                </h4>
                                <p className="text-sm text-foreground">
                                  {record.observacoes || "Nenhuma observação"}
                                </p>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-3">
                                    Foto Produto ({record.foto_produto.length})
                                  </h4>
                                  {record.foto_produto.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {record.foto_produto.map((img) => (
                                        <div
                                          key={img}
                                          className="relative group rounded-lg overflow-hidden border border-border bg-muted cursor-pointer"
                                        >
                                          <img
                                            src={getImageUrl(img)}
                                            alt={img}
                                            className="w-full h-32 object-cover"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => setSelectedImageToZoom(img)}
                                              className="p-2 bg-white/90 hover:bg-white rounded-lg text-lg font-medium transition"
                                              title="Ampliar imagem"
                                            >
                                              🔍
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                      Nenhuma foto
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-3">
                                    Foto Conexão ({record.foto_conexao.length})
                                  </h4>
                                  {record.foto_conexao.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {record.foto_conexao.map((img) => (
                                        <div
                                          key={img}
                                          className="relative group rounded-lg overflow-hidden border border-border bg-muted cursor-pointer"
                                        >
                                          <img
                                            src={getImageUrl(img)}
                                            alt={img}
                                            className="w-full h-32 object-cover"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => setSelectedImageToZoom(img)}
                                              className="p-2 bg-white/90 hover:bg-white rounded-lg text-lg font-medium transition"
                                              title="Ampliar imagem"
                                            >
                                              🔍
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                      Nenhuma foto
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div>
                                {(() => {
                                  const gdImages = getGoogleDriveImages(record.acessorio);
                                  const isLoading = isLoadingForCode(record.acessorio);
                                  return (
                                    <>
                                      <div className="flex items-center justify-between mb-3 mt-4">
                                        <h4 className="font-semibold">
                                          Fotos Google Drive ({gdImages.length})
                                        </h4>
                                        <button
                                          onClick={() => refreshGoogleDriveImages(record.acessorio)}
                                          disabled={isLoading}
                                          className="p-1 hover:bg-primary/10 text-primary rounded transition disabled:opacity-50"
                                          title="Atualizar imagens do Google Drive"
                                        >
                                          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                        </button>
                                      </div>
                                      {gdImages.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                          {gdImages.map((img) => (
                                            <div
                                              key={img}
                                              className="relative group rounded-lg overflow-hidden border border-primary/30 bg-muted cursor-pointer"
                                            >
                                              <img
                                                src={img}
                                                alt="Google Drive"
                                                className="w-full h-32 object-cover"
                                              />
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                  onClick={() => setSelectedImageToZoom(img)}
                                                  className="p-2 bg-white/90 hover:bg-white rounded-lg text-lg font-medium transition"
                                                  title="Ampliar imagem"
                                                >
                                                  🔍
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                          {isLoading ? 'Carregando...' : 'Nenhuma imagem encontrada no Google Drive'}
                                        </p>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Record Modal */}
        {isEditModalOpen && editingRecord && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <Card className="w-full max-w-sm sm:max-w-2xl lg:max-w-4xl my-4 sm:my-8 border-primary/50 max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold">Editar Produto</h3>
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingRecord(null);
                      setEditingId(null);
                    }}
                    className="p-1 hover:bg-muted rounded flex-shrink-0"
                  >
                    <X className="w-4 sm:w-5 h-4 sm:h-5" />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                      EQUIPAMENTO *
                    </label>
                    <input
                      type="text"
                      value={editingRecord.equipamento}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          equipamento: e.target.value,
                        })
                      }
                      placeholder="Ex: Monitor"
                      className="w-full mt-1 px-2 sm:px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                      PARAMETRO
                    </label>
                    <input
                      type="text"
                      value={editingRecord.parametro}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          parametro: e.target.value,
                        })
                      }
                      placeholder="Ex: Pressão"
                      className="w-full mt-1 px-2 sm:px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                      FABRICANTE *
                    </label>
                    <input
                      type="text"
                      value={editingRecord.fabricante}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          fabricante: e.target.value,
                        })
                      }
                      placeholder="Ex: OEM"
                      className="w-full mt-1 px-2 sm:px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                      MODELO *
                    </label>
                    <input
                      type="text"
                      value={editingRecord.modelo}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          modelo: e.target.value,
                        })
                      }
                      placeholder="Ex: PA100"
                      className="w-full mt-1 px-2 sm:px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                    ACESSÓRIO (CÓDIGO) *
                  </label>
                  <input
                    type="text"
                    value={editingRecord.acessorio}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        acessorio: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Ex: PA100-MANGUITO"
                    className="w-full mt-1 px-2 sm:px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    SKU ou código único do produto
                  </p>
                </div>

                {/* Images Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                        FOTO PRODUTO
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenImageSelectorForEdit("foto_produto")}
                        className="gap-1 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">Adicionar</span>
                        <span className="sm:hidden">+</span>
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {editingRecord.foto_produto.map((img) => (
                        <div
                          key={img}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg gap-2"
                        >
                          <span className="text-xs sm:text-sm text-foreground truncate">{img}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveImageFromEdit(img, "foto_produto")}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0 p-1 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                        FOTO CONEXÃO
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenImageSelectorForEdit("foto_conexao")}
                        className="gap-1 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">Adicionar</span>
                        <span className="sm:hidden">+</span>
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {editingRecord.foto_conexao.map((img) => (
                        <div
                          key={img}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg gap-2"
                        >
                          <span className="text-xs sm:text-sm text-foreground truncate">{img}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveImageFromEdit(img, "foto_conexao")}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0 p-1 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                    OBSERVAÇÕES
                  </label>
                  <textarea
                    value={editingRecord.observacoes}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        observacoes: e.target.value,
                      })
                    }
                    placeholder="Notas importantes..."
                    className="w-full mt-1 px-2 sm:px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingRecord(null);
                      setEditingId(null);
                    }}
                    variant="outline"
                    className="flex-1 text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveEditRecord}
                    className="flex-1 bg-primary text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span className="ml-1 hidden sm:inline">Salvar</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Image Zoom Modal */}
        {selectedImageToZoom && (
          <div
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
            onClick={() => setSelectedImageToZoom(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImageToZoom(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition text-2xl"
                title="Fechar (ESC)"
              >
                ✕
              </button>
              <img
                src={selectedImageToZoom}
                alt="Imagem ampliada"
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              <div className="mt-3 bg-black/60 text-white p-3 rounded-lg text-center text-sm">
                {selectedImageToZoom}
              </div>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Importar CSV</h2>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportResults(null);
                      setCsvFile(null);
                    }}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!importResults ? (
                  <>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-2">
                          Selecionar Arquivo CSV
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="csv-file-input"
                            type="file"
                            accept=".csv"
                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                            className="block w-full text-sm text-muted-foreground
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-lg file:border-0
                              file:text-sm file:font-semibold
                              file:bg-primary file:text-white
                              hover:file:bg-primary/90"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Formato esperado: EQUIPAMENTO, PARAMETRO, FABRICANTE, MODELO, CÓDIGO DO PRODUTO, FOTO PRODUTO, FOTO CONEXÃO, OBSERVAÇÕES
                        </p>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <input
                          type="checkbox"
                          id="auto-detect-images"
                          checked={autoDetectImages}
                          onChange={(e) => setAutoDetectImages(e.target.checked)}
                          className="w-4 h-4 rounded border-border"
                        />
                        <label
                          htmlFor="auto-detect-images"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Detectar automaticamente fotos de cada produto
                        </label>
                      </div>

                      {csvFile && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-900 dark:text-blue-300">
                            ✓ Arquivo selecionado: {csvFile.name}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => {
                          setShowImportModal(false);
                          setCsvFile(null);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleImportCSV}
                        disabled={!csvFile || importLoading}
                        className="flex-1 bg-primary"
                      >
                        {importLoading ? (
                          <>
                            <span className="inline-block animate-spin mr-2">⏳</span>
                            Importando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Importar
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">
                          ✓ Importação Concluída
                        </p>
                        <p className="text-xs text-green-800 dark:text-green-400">
                          {importResults.message}
                        </p>
                      </div>

                      {importResults.errorCount > 0 && (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          <p className="text-sm font-medium text-muted-foreground">
                            Erros encontrados:
                          </p>
                          {importResults.results
                            .filter((r: any) => !r.success)
                            .map((result: any, index: number) => (
                              <div
                                key={index}
                                className="text-xs p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-300"
                              >
                                <p className="font-medium">{result.acessorio}</p>
                                <p className="text-red-700 dark:text-red-400">{result.error}</p>
                              </div>
                            ))}
                        </div>
                      )}

                      {importResults.successCount > 0 && (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          <p className="text-sm font-medium text-muted-foreground">
                            Registros importados com sucesso:
                          </p>
                          {importResults.results
                            .filter((r: any) => r.success)
                            .slice(0, 10)
                            .map((result: any, index: number) => (
                              <div
                                key={index}
                                className="text-xs p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-300"
                              >
                                <p className="font-medium">{result.acessorio}</p>
                                {result.imagesFound > 0 && (
                                  <p className="text-green-700 dark:text-green-400">
                                    🖼️ {result.imagesFound} imagem(ns) encontrada(s)
                                  </p>
                                )}
                              </div>
                            ))}
                          {importResults.successCount > 10 && (
                            <p className="text-xs text-muted-foreground text-center">
                              ... e mais {importResults.successCount - 10} registros
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => {
                        setShowImportModal(false);
                        setImportResults(null);
                        setCsvFile(null);
                      }}
                      className="w-full bg-primary"
                    >
                      Fechar
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
