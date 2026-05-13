import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSupabaseCompatibility } from "@/hooks/useSupabaseCompatibility";
import { Search, Trash2, Edit, Plus, ChevronDown, X, Check, Filter, Copy } from "lucide-react";
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

export default function CompatibilityMini() {
  const { records, deleteRecord, createRecord, updateRecord, fetchRecords } = useSupabaseCompatibility();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<CompatibilityRecord | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    parametro: "",
    fabricante: "",
    modelo: "",
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

  // Load records on component mount
  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredData = useMemo(() => {
    let result = records;

    // Apply search term filter
    if (searchTerm.trim()) {
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

    return result;
  }, [records, searchTerm, filters]);

  const handleDeleteRecord = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este registro?")) {
      try {
        await deleteRecord(id);
        toast.success("Produto removido com sucesso!");
      } catch (error) {
        console.error("Error deleting record:", error);
        toast.error("Erro ao remover produto");
      }
    }
  };

  const handleAddRecord = async () => {
    if (
      !newRecord.equipamento ||
      !newRecord.fabricante ||
      !newRecord.modelo ||
      !newRecord.acessorio
    ) {
      toast.error("Preencha os campos obrigatórios (equipamento, fabricante, modelo e código)");
      return;
    }

    try {
      await createRecord({
        equipamento: newRecord.equipamento,
        parametro: newRecord.parametro,
        fabricante: newRecord.fabricante,
        modelo: newRecord.modelo,
        acessorio: newRecord.acessorio,
        foto_produto: newRecord.foto_produto,
        foto_conexao: newRecord.foto_conexao,
        observacoes: newRecord.observacoes,
      });

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
      console.error("Error adding record:", error);
      toast.error("Erro ao adicionar produto");
    }
  };

  const handleOpenEdit = (record: CompatibilityRecord) => {
    setEditingRecord({ ...record });
    setEditingId(record.id);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    if (
      !editingRecord.equipamento ||
      !editingRecord.fabricante ||
      !editingRecord.modelo ||
      !editingRecord.acessorio
    ) {
      toast.error("Preencha os campos obrigatórios (equipamento, fabricante, modelo e código)");
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

      setEditingId(null);
      setEditingRecord(null);
      toast.success("Produto atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Erro ao atualizar produto");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingRecord(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Código "${code}" copiado!`);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-600">Compatibilidade</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie compatibilidades de produtos nesta página
            </p>
          </div>
          {!isAdding && (
            <Button
              onClick={() => setIsAdding(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por equipamento, fabricante, modelo ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Advanced Filters */}
        <div className="bg-muted/50 border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-500 text-sm">Filtros</h4>
            </div>
            <div className="flex gap-2">
              {(filters.parametro || filters.fabricante || filters.modelo) && (
                <Button
                  onClick={() =>
                    setFilters({
                      parametro: "",
                      fabricante: "",
                      modelo: "",
                    })
                  }
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                >
                  Limpar
                </Button>
              )}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
                variant="ghost"
                className="text-xs h-7"
              >
                {showFilters ? "Fechar" : "Abrir"}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="filter-parametro" className="text-xs font-500 mb-1 block">
                  Parâmetro
                </Label>
                <Input
                  id="filter-parametro"
                  type="text"
                  placeholder="Filtrar..."
                  value={filters.parametro}
                  onChange={(e) =>
                    setFilters({ ...filters, parametro: e.target.value })
                  }
                  className="text-sm h-8"
                />
              </div>
              <div>
                <Label htmlFor="filter-fabricante" className="text-xs font-500 mb-1 block">
                  Fabricante
                </Label>
                <Input
                  id="filter-fabricante"
                  type="text"
                  placeholder="Filtrar..."
                  value={filters.fabricante}
                  onChange={(e) =>
                    setFilters({ ...filters, fabricante: e.target.value })
                  }
                  className="text-sm h-8"
                />
              </div>
              <div>
                <Label htmlFor="filter-modelo" className="text-xs font-500 mb-1 block">
                  Modelo
                </Label>
                <Input
                  id="filter-modelo"
                  type="text"
                  placeholder="Filtrar..."
                  value={filters.modelo}
                  onChange={(e) =>
                    setFilters({ ...filters, modelo: e.target.value })
                  }
                  className="text-sm h-8"
                />
              </div>
            </div>
          )}
        </div>

        {/* Add New Record Form */}
        {isAdding && (
          <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-3">
            <h4 className="font-500 text-sm">Novo Registro</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-equipamento" className="text-xs font-500 mb-1 block">
                  Equipamento *
                </Label>
                <Input
                  id="new-equipamento"
                  placeholder="Ex: MONITOR"
                  value={newRecord.equipamento}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, equipamento: e.target.value })
                  }
                  className="text-sm h-8"
                />
              </div>
              <div>
                <Label htmlFor="new-parametro" className="text-xs font-500 mb-1 block">
                  Parâmetro
                </Label>
                <Input
                  id="new-parametro"
                  placeholder="Ex: ECG, FREQUÊNCIA"
                  value={newRecord.parametro}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, parametro: e.target.value })
                  }
                  className="text-sm h-8"
                />
              </div>
              <div>
                <Label htmlFor="new-fabricante" className="text-xs font-500 mb-1 block">
                  Fabricante *
                </Label>
                <Input
                  id="new-fabricante"
                  placeholder="Ex: ALFAMED"
                  value={newRecord.fabricante}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, fabricante: e.target.value })
                  }
                  className="text-sm h-8"
                />
              </div>
              <div>
                <Label htmlFor="new-modelo" className="text-xs font-500 mb-1 block">
                  Modelo *
                </Label>
                <Input
                  id="new-modelo"
                  placeholder="Ex: VITA 1100A"
                  value={newRecord.modelo}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, modelo: e.target.value })
                  }
                  className="text-sm h-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="new-acessorio" className="text-xs font-500 mb-1 block">
                Código do Produto *
              </Label>
              <Input
                id="new-acessorio"
                placeholder="Ex: CONECTOR PNI"
                value={newRecord.acessorio}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, acessorio: e.target.value })
                }
                className="text-sm h-8"
              />
            </div>

            <div>
              <Label htmlFor="new-observacoes" className="text-xs font-500 mb-1 block">
                Observações
              </Label>
              <Textarea
                id="new-observacoes"
                placeholder="Adicione observações..."
                value={newRecord.observacoes}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, observacoes: e.target.value })
                }
                className="text-sm h-16"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddRecord}
                size="sm"
                className="flex-1 gap-2"
              >
                <Check className="w-4 h-4" />
                Salvar
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
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
                }}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-2 max-h-96 overflow-y-auto border border-border rounded-lg p-3">
          {filteredData.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                {records.length === 0
                  ? "Nenhum registro de compatibilidade cadastrado"
                  : "Nenhum resultado encontrado"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredData.map((record) => (
                <div key={record.id} className="border border-border rounded-lg overflow-hidden">
                  {editingId === record.id && editingRecord ? (
                    // Edit Mode
                    <div className="p-3 space-y-3 bg-muted/50">
                      <h4 className="font-500 text-sm">Editando</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`edit-equipamento-${record.id}`} className="text-xs font-500 mb-1 block">
                            Equipamento *
                          </Label>
                          <Input
                            id={`edit-equipamento-${record.id}`}
                            value={editingRecord.equipamento}
                            onChange={(e) =>
                              setEditingRecord({
                                ...editingRecord,
                                equipamento: e.target.value,
                              })
                            }
                            className="text-sm h-8"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-parametro-${record.id}`} className="text-xs font-500 mb-1 block">
                            Parâmetro
                          </Label>
                          <Input
                            id={`edit-parametro-${record.id}`}
                            value={editingRecord.parametro}
                            onChange={(e) =>
                              setEditingRecord({
                                ...editingRecord,
                                parametro: e.target.value,
                              })
                            }
                            className="text-sm h-8"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-fabricante-${record.id}`} className="text-xs font-500 mb-1 block">
                            Fabricante *
                          </Label>
                          <Input
                            id={`edit-fabricante-${record.id}`}
                            value={editingRecord.fabricante}
                            onChange={(e) =>
                              setEditingRecord({
                                ...editingRecord,
                                fabricante: e.target.value,
                              })
                            }
                            className="text-sm h-8"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-modelo-${record.id}`} className="text-xs font-500 mb-1 block">
                            Modelo *
                          </Label>
                          <Input
                            id={`edit-modelo-${record.id}`}
                            value={editingRecord.modelo}
                            onChange={(e) =>
                              setEditingRecord({
                                ...editingRecord,
                                modelo: e.target.value,
                              })
                            }
                            className="text-sm h-8"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`edit-acessorio-${record.id}`} className="text-xs font-500 mb-1 block">
                          Código do Produto *
                        </Label>
                        <Input
                          id={`edit-acessorio-${record.id}`}
                          value={editingRecord.acessorio}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              acessorio: e.target.value,
                            })
                          }
                          className="text-sm h-8"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`edit-observacoes-${record.id}`} className="text-xs font-500 mb-1 block">
                          Observações
                        </Label>
                        <Textarea
                          id={`edit-observacoes-${record.id}`}
                          value={editingRecord.observacoes}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              observacoes: e.target.value,
                            })
                          }
                          className="text-sm h-16"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleSaveEdit}
                          size="sm"
                          className="flex-1 gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Salvar
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="p-3 hover:bg-muted/50 transition flex items-start justify-between gap-3">
                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === record.id ? null : record.id
                            )
                          }
                          className="flex-1 text-left"
                        >
                          <div className="font-500 text-sm">{record.equipamento}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {record.fabricante} {record.modelo}
                          </div>
                          <div className="text-xs font-mono text-primary mt-0.5">
                            {record.acessorio}
                          </div>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCode(record.acessorio);
                            }}
                            className="h-6 w-6 p-0"
                            title="Copiar código"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition ${
                              expandedId === record.id ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedId === record.id && (
                        <div className="px-3 pb-3 border-t border-border space-y-3 bg-muted/30 pt-3">
                          {record.parametro && (
                            <div>
                              <div className="text-xs font-500 text-muted-foreground">
                                Parâmetro
                              </div>
                              <div className="text-sm">{record.parametro}</div>
                            </div>
                          )}

                          {record.observacoes && (
                            <div>
                              <div className="text-xs font-500 text-muted-foreground">
                                Observações
                              </div>
                              <div className="text-sm">{record.observacoes}</div>
                            </div>
                          )}

                          {record.foto_produto.length > 0 && (
                            <div>
                              <div className="text-xs font-500 text-muted-foreground mb-2">
                                Fotos do Produto
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {record.foto_produto.map((foto) => (
                                  <div
                                    key={foto}
                                    className="text-xs bg-primary/20 text-primary px-2 py-1 rounded"
                                  >
                                    {foto}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {record.foto_conexao.length > 0 && (
                            <div>
                              <div className="text-xs font-500 text-muted-foreground mb-2">
                                Fotos de Conexão
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {record.foto_conexao.map((foto) => (
                                  <div
                                    key={foto}
                                    className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded"
                                  >
                                    {foto}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(record)}
                              className="flex-1 text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRecord(record.id)}
                              className="flex-1 text-xs text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="text-xs text-muted-foreground text-center">
          {filteredData.length} de {records.length} registro(s)
        </div>
      </div>
    </Card>
  );
}
