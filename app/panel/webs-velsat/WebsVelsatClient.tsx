"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Globe, 
  Search, 
  Plus, 
  ExternalLink, 
  Copy, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Github, 
  MoreVertical,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  EyeOff
} from "lucide-react";
import ButtonBase from "@/app/components/ui/ButtonBase";
import ModalBase from "@/app/components/modal/ModalBase";
import ModalEliminar from "@/app/components/modal/ModalEliminar";
import InputBase1 from "@/app/components/ui/InputBase1";
import ImputBuscar from "@/app/components/ui/ImputBuscar";
import toast from "react-hot-toast";

type ProjectCategory = 'Facturación' | 'GPS' | 'Gestión' | 'Reportes' | 'Otro';
type ProjectStatus = 'Activo' | 'En mantenimiento' | 'En desarrollo' | 'Inactivo';

interface WebProject {
  id: string;
  name: string;
  category: ProjectCategory;
  url: string;
  repoUrl?: string;
  user: string;
  pass: string;
  status: ProjectStatus;
  notes: string;
  lastModified: number;
  previewImage?: string; // URL pública o data URL local
}

export default function WebsVelsatClient() {
  const [projects, setProjects] = useState<WebProject[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("Todas");
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  
  // Modals
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [editingProject, setEditingProject] = useState<WebProject | null>(null);
  const [viewingProject, setViewingProject] = useState<WebProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<WebProject | null>(null);
  
  // Form State
  const [form, setForm] = useState<Partial<WebProject>>({});
  const [submitAttempt, setSubmitAttempt] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("velsat_projects");
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading projects", e);
      }
    }
  }, []);

  // Save to LocalStorage
  const saveToLocal = (data: WebProject[]) => {
    localStorage.setItem("velsat_projects", JSON.stringify(data));
    setProjects(data);
  };

  // Dashboard Stats
  const stats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'Activo').length,
      maintenance: projects.filter(p => p.status === 'En mantenimiento').length,
      development: projects.filter(p => p.status === 'En desarrollo').length
    };
  }, [projects]);

  // Filtering
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            p.url.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === "Todas" || p.category === filterCategory;
      const matchesStatus = filterStatus === "Todos" || p.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    }).sort((a, b) => b.lastModified - a.lastModified);
  }, [projects, search, filterCategory, filterStatus]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingProject(null);
    setForm({
      category: 'Gestión',
      status: 'Activo',
      notes: ''
    });
    setSubmitAttempt(false);
    setOpenFormModal(true);
  };

  const handleOpenEdit = (p: WebProject) => {
    setEditingProject(p);
    setForm(p);
    setSubmitAttempt(false);
    setOpenFormModal(true);
  };

  const handleSave = () => {
    setSubmitAttempt(true);
    if (!form.name || !form.url || !form.user || !form.pass) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    let newProjects;
    if (editingProject) {
      newProjects = projects.map(p => p.id === editingProject.id ? { 
        ...p, 
        ...form, 
        lastModified: Date.now() 
      } as WebProject : p);
      toast.success("Proyecto actualizado");
    } else {
      const newProject: WebProject = {
        ...(form as WebProject),
        id: crypto.randomUUID(),
        lastModified: Date.now()
      };
      newProjects = [newProject, ...projects];
      toast.success("Proyecto registrado");
    }

    saveToLocal(newProjects);
    setOpenFormModal(false);
  };

  const handleDelete = () => {
    if (!projectToDelete) return;
    const newProjects = projects.filter(p => p.id !== projectToDelete.id);
    saveToLocal(newProjects);
    setOpenDeleteModal(false);
    toast.success("Proyecto eliminado");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(projects, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `velsat_webs_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success("Backup exportado correctamente");
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          saveToLocal(data);
          toast.success("Backup importado correctamente");
        }
      } catch (err) {
        toast.error("Error al importar el archivo");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Activo': return '#2ECC71';
      case 'En mantenimiento': return '#F1C40F';
      case 'En desarrollo': return '#3498DB';
      case 'Inactivo': return '#E74C3C';
      default: return '#ADB5BD';
    }
  };

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'Activo': return <CheckCircle2 size={14} />;
      case 'En mantenimiento': return <Clock size={14} />;
      case 'En desarrollo': return <Clock size={14} />;
      case 'Inactivo': return <XCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ---------- HEADER ---------- */}
      <section
        style={{
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#F4F5F7",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Webs <span style={{ color: "#E85D2F" }}>Velsat</span>
          </h1>
          <p style={{ fontSize: 12, color: "#8A9099", margin: "4px 0 0" }}>
            Administración de proyectos web y portales de la empresa
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <label className="cursor-pointer">
            <input type="file" className="hidden" accept=".json" onChange={importData} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontSize: 12,
                color: "#ADB5BD",
              }}
            >
              <Upload size={14} />
              <span>Importar</span>
            </div>
          </label>
          <button
            onClick={exportData}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: 12,
              color: "#ADB5BD",
            }}
          >
            <Download size={14} />
            <span>Exportar</span>
          </button>
        </div>
      </section>



      {/* ---------- FILTERS ---------- */}
      <div 
        style={{ 
          background: "#1C1F26", 
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <ImputBuscar 
            placeholder="Buscar por nombre o URL..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            background: "#0A0C0F",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#F4F5F7",
            padding: "8px 12px",
            fontSize: 13,
            outline: "none"
          }}
        >
          <option value="Todas">Todas las Categorías</option>
          <option value="Facturación">Facturación</option>
          <option value="GPS">GPS</option>
          <option value="Gestión">Gestión</option>
          <option value="Reportes">Reportes</option>
          <option value="Otro">Otro</option>
        </select>

        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            background: "#0A0C0F",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#F4F5F7",
            padding: "8px 12px",
            fontSize: 13,
            outline: "none"
          }}
        >
          <option value="Todos">Todos los Estados</option>
          <option value="Activo">Activo</option>
          <option value="En mantenimiento">En mantenimiento</option>
          <option value="En desarrollo">En desarrollo</option>
          <option value="Inactivo">Inactivo</option>
        </select>

        <ButtonBase onClick={handleOpenAdd}>
          Registrar Proyecto +
        </ButtonBase>
      </div>

      {/* ---------- CONTENT GRID ---------- */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: "auto", 
          paddingRight: 4,
          minHeight: 0
        }}
        className="custom-scrollbar"
      >
        {filteredProjects.length === 0 ? (
          <div style={{ 
            height: "100%", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center",
            background: "#1C1F26",
            borderRadius: 16,
            border: "2px dashed rgba(255,255,255,0.05)",
            padding: 40,
            textAlign: "center"
          }}>
            <Globe size={48} style={{ color: "rgba(255,255,255,0.05)", marginBottom: 16 }} />
            <p style={{ color: "#8A9099", fontSize: 14 }}>No se encontraron proyectos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                style={{
                  background: "#1C1F26",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 16,
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                  display: "flex",
                  flexDirection: "column",
                }}
                className="hover:border-[#E85D2F]/30 group"
              >
                {/* Preview Image or Status Banner */}
                {project.previewImage ? (
                  <div style={{ position: "relative", height: 140, overflow: "hidden", background: "#0A0C0F" }}>
                    <img
                      src={project.previewImage}
                      alt={project.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {(project.status === 'En mantenimiento' || project.status === 'En desarrollo') && (
                      <div style={{
                        position: "absolute", inset: 0,
                        background: project.status === 'En mantenimiento' ? 'rgba(241,196,15,0.82)' : 'rgba(52,152,219,0.82)',
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        backdropFilter: "blur(2px)"
                      }}>
                        <span style={{ fontSize: 28 }}>{project.status === 'En mantenimiento' ? '🔧' : '🚧'}</span>
                        <span style={{ color: "#000", fontWeight: 800, fontSize: 12, marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>{project.status}</span>
                      </div>
                    )}
                    <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
                      <button onClick={() => handleOpenEdit(project)} style={{ background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 6, padding: "5px", color: "#fff", cursor: "pointer", display: "flex" }}><Edit size={13} /></button>
                      <button onClick={() => { setProjectToDelete(project); setOpenDeleteModal(true); }} style={{ background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 6, padding: "5px", color: "#ff6b6b", cursor: "pointer", display: "flex" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    height: (project.status === 'En mantenimiento' || project.status === 'En desarrollo') ? 44 : 0,
                    background: project.status === 'En mantenimiento' ? 'rgba(241,196,15,0.12)' : project.status === 'En desarrollo' ? 'rgba(52,152,219,0.12)' : 'transparent',
                    borderBottom: (project.status === 'En mantenimiento' || project.status === 'En desarrollo') ? `1px solid ${getStatusColor(project.status)}30` : 'none',
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    color: getStatusColor(project.status), fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em"
                  }}>
                    {(project.status === 'En mantenimiento' || project.status === 'En desarrollo') && (<>{project.status === 'En mantenimiento' ? '🔧' : '🚧'} {project.status}</>)}
                  </div>
                )}

                {/* Card Content */}
                <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(232,93,47,0.1)", color: "#E85D2F", padding: "2px 7px", borderRadius: 4, display: "inline-block", marginBottom: 6 }}>{project.category}</span>
                      <h3 style={{ color: "#F4F5F7", fontSize: 16, fontWeight: 700, margin: 0 }}>{project.name}</h3>
                      <a href={project.url} target="_blank" rel="noopener noreferrer" style={{ color: "#8A9099", fontSize: 11, display: "flex", alignItems: "center", gap: 3, textDecoration: "none", marginTop: 2 }} className="hover:text-[#E85D2F]">
                        {project.url.replace(/^https?:\/\//, '').slice(0, 35)}{project.url.length > 40 ? '…' : ''} <ExternalLink size={9} />
                      </a>
                    </div>
                    {!project.previewImage && (
                      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                        <button onClick={() => handleOpenEdit(project)} style={{ color: "#ADB5BD", padding: 4 }} className="hover:text-white transition-colors"><Edit size={15} /></button>
                        <button onClick={() => { setProjectToDelete(project); setOpenDeleteModal(true); }} style={{ color: "#ADB5BD", padding: 4 }} className="hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </div>

                  {/* Status pill (only when no banner above) */}
                  {!project.previewImage && project.status !== 'En mantenimiento' && project.status !== 'En desarrollo' && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: getStatusColor(project.status) }}>
                      {getStatusIcon(project.status)} {project.status}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <button
                      onClick={() => { setViewingProject(project); setOpenViewModal(true); }}
                      style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F4F5F7", borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer" }}
                      className="hover:bg-white/10 transition-all"
                    >
                      <Eye size={13} /> Detalles
                    </button>
                    <a
                      href={project.url} target="_blank" rel="noopener noreferrer"
                      style={{ background: "#E85D2F", color: "white", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}
                      className="hover:bg-[#ff6b3d] transition-all"
                    >
                      Abrir <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "8px 16px", background: "rgba(0,0,0,0.15)", borderTop: "1px solid rgba(255,255,255,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "rgba(138,144,153,0.5)" }}>Modificado: {new Date(project.lastModified).toLocaleDateString()}</span>
                  {project.repoUrl && (<a href={project.repoUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#ADB5BD" }} className="hover:text-white"><Github size={13} /></a>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- FORM MODAL ---------- */}
      <ModalBase
        open={openFormModal}
        title={editingProject ? "Editar Proyecto" : "Registrar Proyecto"}
        onClose={() => setOpenFormModal(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputBase1 
            label="NOMBRE DEL PROYECTO"
            placeholder="ej: Facturación RRHH"
            required
            submitAttempt={submitAttempt}
            defaultValue={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
          />
          
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 11, fontWeight: 700, color: "#8A9099", textTransform: "uppercase", letterSpacing: "0.05em" }}>Categoría</label>
            <select 
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value as ProjectCategory})}
              style={{
                width: "100%",
                background: "#0A0C0F",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#F4F5F7",
                padding: "11px 12px",
                fontSize: 13,
                outline: "none"
              }}
            >
              <option value="Facturación">Facturación</option>
              <option value="GPS">GPS</option>
              <option value="Gestión">Gestión</option>
              <option value="Reportes">Reportes</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <InputBase1 
            label="URL DEL SITIO"
            placeholder="https://app.velsat.pe"
            required
            submitAttempt={submitAttempt}
            defaultValue={form.url}
            onChange={e => setForm({...form, url: e.target.value})}
          />

          <InputBase1 
            label="REPOSITORIO (OPCIONAL)"
            placeholder="https://github.com/..."
            defaultValue={form.repoUrl}
            onChange={e => setForm({...form, repoUrl: e.target.value})}
          />

          <InputBase1 
            label="USUARIO / CORREO"
            placeholder="admin"
            required
            submitAttempt={submitAttempt}
            defaultValue={form.user}
            onChange={e => setForm({...form, user: e.target.value})}
          />

          <InputBase1 
            label="CONTRASEÑA"
            type="password"
            placeholder="******"
            required
            submitAttempt={submitAttempt}
            defaultValue={form.pass}
            onChange={e => setForm({...form, pass: e.target.value})}
          />

          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: 11, fontWeight: 700, color: "#8A9099", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado Actual</label>
            <select 
              value={form.status}
              onChange={e => setForm({...form, status: e.target.value as ProjectStatus})}
              style={{
                width: "100%",
                background: "#0A0C0F",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#F4F5F7",
                padding: "11px 12px",
                fontSize: 13,
                outline: "none"
              }}
            >
              <option value="Activo">Activo</option>
              <option value="En mantenimiento">En mantenimiento</option>
              <option value="En desarrollo">En desarrollo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label style={{ fontSize: 11, fontWeight: 700, color: "#8A9099", textTransform: "uppercase", letterSpacing: "0.05em" }}>Imagen de Previsualización del Sistema</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="https://... (URL pública) o sube una imagen local →"
                value={form.previewImage?.startsWith('data:') ? '📁 Imagen local cargada' : (form.previewImage || '')}
                readOnly={form.previewImage?.startsWith('data:')}
                onChange={e => setForm({...form, previewImage: e.target.value})}
                style={{ flex: 1, background: "#0A0C0F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: form.previewImage?.startsWith('data:') ? "#2ECC71" : "#F4F5F7", padding: "11px 12px", fontSize: 13, outline: "none" }}
              />
              <label style={{ cursor: "pointer", flexShrink: 0 }}>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 1.5 * 1024 * 1024) {
                      toast.error("La imagen no debe superar 1.5MB");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setForm({ ...form, previewImage: ev.target?.result as string });
                      toast.success("Imagen cargada correctamente");
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
                <div style={{ height: "100%", display: "flex", alignItems: "center", gap: 6, padding: "0 14px", background: "rgba(232,93,47,0.15)", border: "1px solid rgba(232,93,47,0.3)", borderRadius: 8, color: "#E85D2F", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                  <Upload size={14} /> Subir local
                </div>
              </label>
              {form.previewImage && (
                <button
                  onClick={() => setForm({ ...form, previewImage: '' })}
                  title="Quitar imagen"
                  style={{ padding: "0 12px", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.2)", borderRadius: 8, color: "#E74C3C", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                >✕</button>
              )}
            </div>
            {form.previewImage && (
              <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", height: 110, position: "relative" }}>
                <img src={form.previewImage} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 8px", background: "rgba(0,0,0,0.6)", fontSize: 10, color: "#8A9099" }}>
                  {form.previewImage.startsWith('data:') ? '📁 Imagen local (guardada en localStorage)' : '🔗 Imagen desde URL'}
                </div>
              </div>
            )}
          </div>


          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label style={{ fontSize: 11, fontWeight: 700, color: "#8A9099", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notas Libres</label>
            <textarea
              placeholder="Instrucciones, problemas conocidos..."
              value={form.notes}
              onChange={e => setForm({...form, notes: e.target.value})}
              style={{ width: "100%", background: "#0A0C0F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#F4F5F7", padding: "12px", fontSize: 13, outline: "none", minHeight: 80, resize: "vertical" }}
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <ButtonBase variant="secondary" onClick={() => setOpenFormModal(false)}>
              Cancelar
            </ButtonBase>
            <ButtonBase onClick={handleSave}>
              {editingProject ? "Guardar Cambios" : "Registrar Proyecto"}
            </ButtonBase>
          </div>
        </div>
      </ModalBase>

      {/* ---------- VIEW MODAL ---------- */}
      <ModalBase
        open={openViewModal}
        title="Detalle del Proyecto"
        onClose={() => setOpenViewModal(false)}
      >
        {viewingProject && (
          <div className="flex flex-col gap-6">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#F4F5F7", margin: 0 }}>{viewingProject.name}</h2>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                   <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: "rgba(232,93,47,0.1)", color: "#E85D2F", padding: "4px 8px", borderRadius: 4 }}>
                    {viewingProject.category}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: getStatusColor(viewingProject.status) }}>
                    {getStatusIcon(viewingProject.status)}
                    {viewingProject.status.toUpperCase()}
                  </div>
                </div>
              </div>
              {viewingProject.repoUrl && (
                <a 
                  href={viewingProject.repoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F4F5F7" }}
                  className="hover:bg-white/10"
                >
                  <Github size={20} />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* URL */}
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.03)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#8A9099", textTransform: "uppercase", marginBottom: 8 }}>URL de Acceso</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#3498DB", fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{viewingProject.url}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => copyToClipboard(viewingProject.url, 'URL')} style={{ color: "#ADB5BD" }} className="hover:text-white p-2"><Copy size={16} /></button>
                    <a href={viewingProject.url} target="_blank" rel="noopener noreferrer" style={{ color: "#ADB5BD" }} className="hover:text-white p-2"><ExternalLink size={16} /></a>
                  </div>
                </div>
              </div>

              {/* User */}
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.03)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#8A9099", textTransform: "uppercase", marginBottom: 8 }}>Usuario / Credencial</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#F4F5F7", fontSize: 14, fontWeight: 600 }}>{viewingProject.user}</span>
                  <button onClick={() => copyToClipboard(viewingProject.user, 'Usuario')} style={{ color: "#ADB5BD" }} className="hover:text-white p-2"><Copy size={16} /></button>
                </div>
              </div>

              {/* Password */}
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.03)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#8A9099", textTransform: "uppercase", marginBottom: 8 }}>Contraseña</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#F4F5F7", fontSize: 14, fontWeight: 600, letterSpacing: showPass ? "normal" : "0.3em" }}>
                    {showPass ? viewingProject.pass : "••••••••"}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setShowPass(!showPass)} style={{ color: "#ADB5BD" }} className="hover:text-white p-2">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => copyToClipboard(viewingProject.pass, 'Contraseña')} style={{ color: "#ADB5BD" }} className="hover:text-white p-2"><Copy size={16} /></button>
                  </div>
                </div>
              </div>

              {/* Modified */}
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.03)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#8A9099", textTransform: "uppercase", marginBottom: 8 }}>Última Modificación</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ADB5BD", fontSize: 14 }}>
                  <Clock size={16} />
                  {new Date(viewingProject.lastModified).toLocaleString()}
                </div>
              </div>
            </div>

            {viewingProject.notes && (
              <div style={{ background: "rgba(232,93,47,0.03)", borderRadius: 12, padding: 16, border: "1px solid rgba(232,93,47,0.1)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#E85D2F", textTransform: "uppercase", marginBottom: 8 }}>Notas e Instrucciones</p>
                <p style={{ color: "#ADB5BD", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{viewingProject.notes}</p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 3, marginTop: 8 }}>
              <ButtonBase variant="secondary" onClick={() => setOpenViewModal(false)}>Cerrar</ButtonBase>
              <ButtonBase onClick={() => { setOpenViewModal(false); handleOpenEdit(viewingProject); }}>Editar</ButtonBase>
            </div>
          </div>
        )}
      </ModalBase>

      {/* ---------- DELETE MODAL ---------- */}
      <ModalEliminar
        open={openDeleteModal}
        title="Eliminar Proyecto"
        onClose={() => setOpenDeleteModal(false)}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ 
            width: 56, height: 56, borderRadius: "50%", 
            background: "rgba(231,76,60,0.1)", 
            border: "1px solid rgba(231,76,60,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            color: "#E74C3C"
          }}>
            <Trash2 size={24} />
          </div>
          <h3 style={{ color: "#F4F5F7", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>¿Estás seguro?</h3>
          <p style={{ color: "#8A9099", fontSize: 14, margin: "0 0 24px" }}>
            Se eliminará permanentemente el registro de <strong>{projectToDelete?.name}</strong>. Esta acción no se puede deshacer.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <ButtonBase variant="secondary" onClick={() => setOpenDeleteModal(false)}>Cancelar</ButtonBase>
            <ButtonBase variant="danger" onClick={handleDelete}>Eliminar Definitivamente</ButtonBase>
          </div>
        </div>
      </ModalEliminar>
    </div>
  );
}
