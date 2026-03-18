"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { projectApi, taskApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface Project {
  id: string;
  name: string;
  key: string;
  color: string;
  memberCount: number;
  status: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({ total: 0, TODO: 0, IN_PROGRESS: 0, DONE: 0 });
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const projRes = await projectApi.list();
      const projectList = projRes.data?.data || [];
      setProjects(projectList);

      // Aggregate stats from all projects
      let totalStats = { total: 0, TODO: 0, IN_PROGRESS: 0, DONE: 0 };
      for (const p of projectList.slice(0, 5)) {
        try {
          const sRes = await taskApi.stats(p.id);
          const s = sRes.data?.data || {};
          totalStats.total += Number(s.total || 0);
          totalStats.TODO += Number(s.TODO || 0);
          totalStats.IN_PROGRESS += Number(s.IN_PROGRESS || 0);
          totalStats.DONE += Number(s.DONE || 0);
        } catch {}
      }
      setStats(totalStats);
    } catch {}
    setLoading(false);
  };

  const statCards = [
    { label: "Total Tasks", value: stats.total, icon: Activity, color: "#6366f1" },
    { label: "To Do", value: stats.TODO, icon: AlertCircle, color: "#94a3b8" },
    { label: "In Progress", value: stats.IN_PROGRESS, icon: Clock, color: "#3b82f6" },
    { label: "Completed", value: stats.DONE, icon: CheckCircle2, color: "#22c55e" },
  ];

  const progressPercent =
    stats.total > 0 ? Math.round((stats.DONE / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.username} 👋
        </h1>
        <p style={{ color: "var(--text-secondary)" }} className="mt-1">
          Here&apos;s what&apos;s happening across your projects
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {card.label}
              </span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${card.color}15` }}
              >
                <card.icon size={16} style={{ color: card.color }} />
              </div>
            </div>
            <div className="text-3xl font-bold">{card.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Overall Progress</h3>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {stats.DONE} of {stats.total} tasks completed
            </p>
          </div>
          <span className="text-2xl font-bold" style={{ color: "#22c55e" }}>
            {progressPercent}%
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #6366f1, #22c55e)",
            }}
          />
        </div>
      </motion.div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Projects</h2>
          <Link href="/dashboard/projects" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length === 0 ? (
            <div className="glass-card p-8 col-span-full text-center">
              <FolderKanban size={48} className="mx-auto mb-4 opacity-30" />
              <p style={{ color: "var(--text-secondary)" }}>
                No projects yet. Create your first project!
              </p>
              <Link href="/dashboard/projects" className="btn-primary inline-flex mt-4">
                Create Project
              </Link>
            </div>
          ) : (
            projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <Link href={`/dashboard/projects/${project.id}`} className="block glass-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: project.color || "#6366f1" }}
                    >
                      {project.key?.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        {project.key}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <Users size={14} />
                    <span>{project.memberCount || 1} members</span>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
