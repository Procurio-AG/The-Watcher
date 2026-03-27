"use client";
import { AlertTriangle, CheckCircle, AlertCircle, Link as LinkIcon, Calendar, Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  systemState?: string;
  showDateRange?: boolean;
}

const stateConfig: Record<string, { icon: React.ElementType; color: string }> = {
  healthy: { icon: CheckCircle, color: "text-green-500" },
  degraded: { icon: AlertCircle, color: "text-amber-500" },
  critical: { icon: AlertTriangle, color: "text-red-500" },
};

export default function PageHeader({ title, systemState = "healthy", showDateRange = true }: PageHeaderProps) {
  const config = stateConfig[systemState] || stateConfig.healthy;
  const Icon = config.icon;

  return (
    <div className="flex items-end justify-between mb-3">
      <div className="flex items-center gap-3">
        {systemState !== "healthy" && <Icon className={`w-8 h-8 ${config.color}`} />}
        <h1 className="text-display text-gray-900">{title}</h1>
        <button className="w-8 h-8 rounded-full bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors mt-1">
          <LinkIcon className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {showDateRange && (
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm text-gray-700 hover:border-surface-300 transition-colors shadow-pill">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">Last 15 min</span>
          </button>
          <span className="text-xs text-gray-400 font-medium">compared to</span>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm text-gray-700 hover:border-surface-300 transition-colors shadow-pill">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">Previous 15 min</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm text-gray-700 hover:border-surface-300 transition-colors shadow-pill">
            <span className="font-medium">Auto</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-xl text-sm text-gray-700 hover:border-surface-300 transition-colors shadow-pill">
            <span className="font-medium">Add widget</span>
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
