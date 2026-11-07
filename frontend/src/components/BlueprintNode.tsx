"use client";

import { Handle, Position } from "@xyflow/react";
import { memo } from "react";
import { Edit3, Trash2 } from "lucide-react";

interface NodeData {
  id?: string;
  step: number;
  title: string;
  icon: string;
  description: string;
  badge: string;
  onEdit?: (nodeId: string, currentData: NodeData) => void;
  onDelete?: (nodeId: string) => void;
}

function BlueprintNode({ id, data }: { id: string; data: NodeData }) {
  return (
    <div className="relative group w-[280px] sm:w-[320px] bg-black/85 border border-amber-500/35 hover:border-amber-400 backdrop-blur-xl p-5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]">
      {/* Target Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-black hover:!scale-125 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-black hover:!scale-125 transition-transform"
      />

      {/* Header Badge & Action Icons */}
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {data.badge || `STEP 0${data.step}`}
          </span>
          <span className="text-xl">{data.icon || "💡"}</span>
        </div>

        {/* Action Controls on Node Hover */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {data.onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onEdit?.(id, data);
              }}
              title="Edit step details"
              className="p-1 rounded-md text-white/50 hover:text-amber-400 hover:bg-white/10 transition-colors"
            >
              <Edit3 size={13} />
            </button>
          )}
          {data.onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete?.(id);
              }}
              title="Delete step"
              className="p-1 rounded-md text-white/50 hover:text-red-400 hover:bg-white/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm sm:text-base font-bold text-white mb-2 leading-snug group-hover:text-amber-400 transition-colors">
        {data.title}
      </h4>

      {/* Description */}
      <p className="text-xs text-white/75 leading-relaxed">
        {data.description}
      </p>

      {/* Source Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-black hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-black hover:!scale-125 transition-transform"
      />
    </div>
  );
}

export default memo(BlueprintNode);
