"use client";

import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  BackgroundVariant,
  addEdge,
  Connection,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Plus, Download, X, Save, FileCode } from "lucide-react";
import BlueprintNode from "./BlueprintNode";

const nodeTypes = {
  blueprintNode: BlueprintNode,
};

interface RawBlueprintNode {
  id: string;
  step: number;
  title: string;
  icon: string;
  description: string;
  badge: string;
}

export default function BlueprintCanvas({
  rawNodes,
}: {
  rawNodes: RawBlueprintNode[];
}) {
  const flowRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [isExporting, setIsExporting] = useState(false);

  // Edit Modal State
  const [editingNode, setEditingNode] = useState<{
    id: string;
    step: number;
    title: string;
    icon: string;
    description: string;
    badge: string;
  } | null>(null);

  // Initial nodes
  const initialNodes: Node[] = useMemo(() => {
    return rawNodes.map((n, index) => {
      let xPos = index * 360 + 20;
      let yPos = 120;

      if (isMobile) {
        xPos = 20;
        yPos = index * 220 + 20;
      } else {
        if (index >= 3) {
          yPos = index % 2 === 1 ? 240 : 80;
        }
      }

      const nodeId = n.id || String(index + 1);

      return {
        id: nodeId,
        type: "blueprintNode",
        position: { x: xPos, y: yPos },
        data: {
          step: n.step || index + 1,
          title: n.title,
          icon: n.icon || "💡",
          description: n.description,
          badge: n.badge || `STEP 0${index + 1}`,
        },
      };
    });
  }, [rawNodes, isMobile]);

  // Initial edges
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    for (let i = 0; i < rawNodes.length - 1; i++) {
      const sourceId = rawNodes[i].id || String(i + 1);
      const targetId = rawNodes[i + 1].id || String(i + 2);
      edges.push({
        id: `e-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#f59e0b", strokeWidth: 2.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#f59e0b",
          width: 18,
          height: 18,
        },
      });
    }
    return edges;
  }, [rawNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Node Deletion Handler
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!confirm("Delete this execution step from the blueprint?")) return;
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  // Node Edit Handler
  const handleEditNode = useCallback((nodeId: string, currentData: Record<string, unknown>) => {
    setEditingNode({
      id: nodeId,
      step: (currentData.step as number) || 1,
      title: (currentData.title as string) || "",
      icon: (currentData.icon as string) || "💡",
      description: (currentData.description as string) || "",
      badge: (currentData.badge as string) || `STEP 0${(currentData.step as number) || 1}`,
    });
  }, []);

  // Update node handlers whenever state changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
        },
      }))
    );
  }, [handleEditNode, handleDeleteNode, setNodes]);

  useEffect(() => {
    setNodes(
      initialNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onEdit: handleEditNode,
          onDelete: handleDeleteNode,
        },
      }))
    );
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges, handleEditNode, handleDeleteNode]);

  // Interactive Connect Handler
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            animated: true,
            style: { stroke: "#f59e0b", strokeWidth: 2.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#f59e0b",
              width: 18,
              height: 18,
            },
          },
          eds
        )
      ),
    [setEdges]
  );

  // Add Custom Node
  const handleAddNode = () => {
    const newStepNum = nodes.length + 1;
    const newId = `step-${Date.now()}`;
    const xOffset = (nodes.length % 4) * 360 + 40;
    const yOffset = Math.floor(nodes.length / 4) * 220 + 140;

    const newNode: Node = {
      id: newId,
      type: "blueprintNode",
      position: { x: xOffset, y: yOffset },
      data: {
        step: newStepNum,
        title: `Custom Step ${newStepNum}`,
        icon: "🚀",
        description: "Click edit to describe your execution strategy for this milestone.",
        badge: `STEP 0${newStepNum}`,
        onEdit: handleEditNode,
        onDelete: handleDeleteNode,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  // Export Flow to PNG Image with tight auto-cropping and crisp SVG arrow edges
  const handleExportPng = async () => {
    if (!flowRef.current || nodes.length === 0) return;
    setIsExporting(true);

    try {
      // Calculate exact node bounds to crop empty black space
      const nodesBounds = getNodesBounds(nodes);
      const width = Math.max(900, Math.min(2400, nodesBounds.width + 200));
      const height = Math.max(500, Math.min(1600, nodesBounds.height + 200));
      const viewport = getViewportForBounds(nodesBounds, width, height, 0.1, 2, 0.1);

      // Ensure SVG edges container has explicit inline styling & definitions
      const svgEdges = flowRef.current.querySelector(".react-flow__edges") as SVGElement | null;
      if (svgEdges) {
        if (!svgEdges.querySelector("#png-amber-arrow")) {
          const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
          defs.innerHTML = `<marker id="png-amber-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" /></marker>`;
          svgEdges.appendChild(defs);
        }
      }

      // Inject explicit presentation attributes directly on SVG path elements
      const edgePaths = flowRef.current.querySelectorAll(".react-flow__edge-path, path");
      edgePaths.forEach((p) => {
        const el = p as SVGElement;
        el.setAttribute("stroke", "#f59e0b");
        el.setAttribute("stroke-width", "4");
        el.setAttribute("fill", "none");
        el.setAttribute("marker-end", "url(#png-amber-arrow)");
        el.style.stroke = "#f59e0b";
        el.style.strokeWidth = "4px";
        el.style.fill = "none";
        el.style.opacity = "1";
      });

      const dataUrl = await toPng(flowRef.current, {
        backgroundColor: "#0a0a0a",
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
        quality: 0.98,
        pixelRatio: 2,
        skipFonts: true,
        cacheBust: true,
        filter: (node) => {
          const className = typeof node.className === "string" ? node.className : "";
          return !className.includes("studio-toolbar") && !className.includes("react-flow__controls");
        },
      });

      if (!dataUrl || !dataUrl.startsWith("data:image/png")) {
        throw new Error("Invalid PNG Data URL");
      }

      const link = document.createElement("a");
      const fileName = `execution_blueprint_roadmap_${Date.now()}.png`;
      link.download = fileName;
      link.setAttribute("download", fileName);
      link.setAttribute("href", dataUrl);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 500);
    } catch (err) {
      console.error("Failed to export blueprint canvas:", err);
      alert("Failed to capture blueprint PNG. Please try Export HTML option.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export Flow to Interactive Standalone HTML Document WITH CONTINUOUS MOVING ANIMATED SVG ARROWS
  const handleExportHtml = () => {
    const fileName = `execution_blueprint_roadmap_${Date.now()}.html`;

    const formattedCardsHtml = nodes
      .map((n, i) => {
        const d = n.data as { badge?: string; icon?: string; title?: string; description?: string };
        return `
        <div class="node-card" id="card-${i}">
          <div class="card-header">
            <span class="badge">${d.badge || `STEP 0${i + 1}`}</span>
            <span class="icon">${d.icon || "💡"}</span>
          </div>
          <div class="title">${d.title || "Step"}</div>
          <div class="desc">${d.description || ""}</div>
          ${
            i < nodes.length - 1
              ? `<div class="flow-arrow-mobile">↓</div>`
              : ""
          }
        </div>`;
      })
      .join("");

    // Generate dynamic SVG connecting paths between horizontal cards
    const cardWidth = 320;
    const cardGap = 50;
    const totalWidth = nodes.length * cardWidth + (nodes.length - 1) * cardGap + 80;

    const svgPathsHtml = nodes
      .slice(0, nodes.length - 1)
      .map((_, i) => {
        const x1 = i * (cardWidth + cardGap) + cardWidth + 40;
        const y1 = 180;
        const x2 = (i + 1) * (cardWidth + cardGap) + 40;
        const y2 = 180;
        const cx1 = x1 + 25;
        const cx2 = x2 - 25;

        return `<path d="M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}" class="animated-edge" marker-end="url(#amber-arrow)" />`;
      })
      .join("");

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Execution Blueprint Studio Roadmap</title>
  <style>
    * { box-sizing: border-box; }
    body {
      background-color: #0a0a0a;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 40px 20px;
      margin: 0;
      min-height: 100vh;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 28px;
      letter-spacing: 2px;
      color: #f59e0b;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .header p {
      color: rgba(255,255,255,0.6);
      font-size: 14px;
    }
    .flowchart-wrapper {
      position: relative;
      width: 100%;
      overflow-x: auto;
      padding-bottom: 40px;
    }
    .flowchart-canvas {
      position: relative;
      min-width: ${totalWidth}px;
      margin: 0 auto;
      padding: 60px 40px;
    }
    .cards-row {
      display: flex;
      gap: ${cardGap}px;
      position: relative;
      z-index: 2;
    }
    .node-card {
      background: rgba(18, 18, 18, 0.95);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 16px;
      padding: 24px;
      width: ${cardWidth}px;
      flex-shrink: 0;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 20px rgba(245,158,11,0.15);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .node-card:hover {
      transform: translateY(-4px);
      border-color: #f59e0b;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 10px;
    }
    .badge {
      font-family: monospace;
      font-weight: bold;
      font-size: 11px;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      padding: 4px 10px;
      border-radius: 99px;
      text-transform: uppercase;
    }
    .icon {
      font-size: 22px;
    }
    .title {
      font-size: 16px;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .desc {
      font-size: 13px;
      color: rgba(255,255,255,0.8);
      line-height: 1.6;
    }
    .flow-arrow-mobile {
      display: none;
      text-align: center;
      color: #f59e0b;
      font-size: 20px;
      margin-top: 10px;
    }
    .connections-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }
    .animated-edge {
      stroke: #f59e0b;
      stroke-width: 3.5px;
      fill: none;
      stroke-dasharray: 8 6;
      animation: flowDash 1.2s linear infinite;
    }
    @keyframes flowDash {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -28; }
    }
    @media (max-width: 768px) {
      .flowchart-wrapper { overflow-x: hidden; }
      .flowchart-canvas { min-width: 100%; padding: 10px; }
      .cards-row { flex-direction: column; gap: 20px; }
      .node-card { width: 100%; }
      .connections-svg { display: none; }
      .flow-arrow-mobile { display: block; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🗺 Execution Blueprint Studio Roadmap</h1>
    <p>Generated by Startup Scraper Pro • Autonomous Cloud Engine</p>
  </div>
  <div class="flowchart-wrapper">
    <div class="flowchart-canvas">
      <svg class="connections-svg">
        <defs>
          <marker id="amber-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
          </marker>
        </defs>
        ${svgPathsHtml}
      </svg>
      <div class="cards-row">
        ${formattedCardsHtml}
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = fileName;
    link.setAttribute("download", fileName);
    link.setAttribute("href", url);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 500);
  };

  // Save Modal Edits
  const saveNodeEdits = () => {
    if (!editingNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === editingNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              title: editingNode.title,
              icon: editingNode.icon,
              description: editingNode.description,
              badge: editingNode.badge,
            },
          };
        }
        return node;
      })
    );
    setEditingNode(null);
  };

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* Studio Action Toolbar */}
      <div className="studio-toolbar absolute top-4 left-4 z-40 flex items-center gap-2 bg-black/80 backdrop-blur-xl p-2 rounded-2xl border border-white/15 shadow-2xl">
        <button
          onClick={handleAddNode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 hover:border-amber-400 text-xs font-semibold uppercase tracking-wider transition-all shadow-md"
        >
          <Plus size={14} />
          Add Custom Step
        </button>

        <button
          onClick={handleExportPng}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs font-semibold uppercase tracking-wider transition-all shadow-md"
        >
          <Download size={14} />
          {isExporting ? "Exporting..." : "Export PNG"}
        </button>

        <button
          onClick={handleExportHtml}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-400 text-xs font-semibold uppercase tracking-wider transition-all shadow-md"
        >
          <FileCode size={14} />
          Export HTML
        </button>
      </div>

      {/* ReactFlow Canvas Viewport */}
      <div
        ref={flowRef}
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative bg-black/60 shadow-inner"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color="rgba(245, 158, 11, 0.25)"
          />
          <Controls className="!bg-black/80 !border !border-white/15 !rounded-xl !shadow-xl text-amber-400 fill-amber-400" />
        </ReactFlow>
      </div>

      {/* Edit Node Modal Overlay */}
      {editingNode && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-black/90 border border-amber-500/40 p-6 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white tracking-wide">Edit Execution Step</h3>
              <button
                onClick={() => setEditingNode(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-3">
              <div className="w-1/3">
                <label className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-1">Badge</label>
                <input
                  type="text"
                  value={editingNode.badge}
                  onChange={(e) => setEditingNode({ ...editingNode, badge: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div className="w-2/3">
                <label className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-1">Emoji Icon</label>
                <input
                  type="text"
                  value={editingNode.icon}
                  onChange={(e) => setEditingNode({ ...editingNode, icon: e.target.value })}
                  className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-1">Step Title</label>
              <input
                type="text"
                value={editingNode.title}
                onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-semibold focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block mb-1">Execution Details</label>
              <textarea
                rows={4}
                value={editingNode.description}
                onChange={(e) => setEditingNode({ ...editingNode, description: e.target.value })}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-white text-xs leading-relaxed focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setEditingNode(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold uppercase tracking-wider hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveNodeEdits}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-md"
              >
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
