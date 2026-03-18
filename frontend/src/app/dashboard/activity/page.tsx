"use client";

import { useEffect, useState } from "react";
import { auditApi } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { Activity, Clock } from "lucide-react";

interface AuditLog {
  id: string;
  tenantId: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await auditApi.list();
      setLogs(res.data?.data || []);
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").toLowerCase();
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "text-green-400";
    if (action.includes("UPDATE")) return "text-blue-400";
    if (action.includes("DELETE")) return "text-red-400";
    if (action.includes("LOGIN")) return "text-purple-400";
    return "text-indigo-400";
  };

  return (
    <div className="max-w-5xl mx-auto py-6 animate-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track recent actions and changes across your workspace
          </p>
        </div>
      </div>

      <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No activity logs found.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                    {log.actorName?.charAt(0).toUpperCase() || "?"}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-base justify-between gap-2">
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold text-white">{log.actorName}</span>{" "}
                      <span className={getActionColor(log.action)}>
                        {formatAction(log.action)}
                      </span>{" "}
                      {log.entityType && (
                        <span>
                          <span className="text-gray-500">on</span>{" "}
                          <span className="font-medium text-gray-300">
                            {log.entityType.toLowerCase()}
                          </span>
                        </span>
                      )}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {timeAgo(log.createdAt)}
                    </span>
                  </div>
                  {log.details && (
                    <div className="mt-2 text-xs text-gray-400 bg-black/20 p-2 rounded border border-white/5 inline-block">
                      {log.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
