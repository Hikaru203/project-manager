"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderKanban, Users, X } from "lucide-react";
import Link from "next/link";
import { projectApi } from "@/lib/api";
import { PROJECT_COLORS } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string;
  key: string;
  color: string;
  memberCount: number;
  ownerName: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", key: "", color: "#6366f1" });
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const res = await projectApi.list();
      setProjects(res.data?.data || []);
    } catch {}
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await projectApi.create(form);
      setShowCreate(false);
      setForm({ name: "", description: "", key: "", color: "#6366f1" });
      loadProjects();
    } catch {}
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-10 w-36 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> New Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Link href={`/dashboard/projects/board?id=${project.id}`} className="block glass-card p-5 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold text-white"
                  style={{ background: project.color || "#6366f1" }}
                >
                  {project.key?.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{project.name}</h3>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    {project.key}
                  </p>
                </div>
              </div>
              {project.description && (
                <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                <span className="flex items-center gap-1">
                  <Users size={14} /> {project.memberCount || 1}
                </span>
                <span>by {project.ownerName}</span>
              </div>
            </Link>
          </motion.div>
        ))}

        {projects.length === 0 && (
          <div className="glass-card p-12 col-span-full text-center">
            <FolderKanban size={56} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Create your first project to get started
            </p>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={18} className="inline mr-2" /> Create Project
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Create Project</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Project Name
                  </label>
                  <input
                    className="input-field"
                    placeholder="My Awesome Project"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Project Key
                  </label>
                  <input
                    className="input-field"
                    placeholder="PRJ"
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
                    maxLength={10}
                    required
                  />
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    2-10 uppercase letters/numbers
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Description
                  </label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="What is this project about?"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Color
                  </label>
                  <div className="flex gap-2">
                    {PROJECT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="w-8 h-8 rounded-lg transition-transform"
                        style={{
                          background: c,
                          transform: form.color === c ? "scale(1.2)" : "scale(1)",
                          outline: form.color === c ? "2px solid white" : "none",
                          outlineOffset: "2px",
                        }}
                        onClick={() => setForm({ ...form, color: c })}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={creating}>
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
