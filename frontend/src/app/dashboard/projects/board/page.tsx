"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult, DragStart } from "@hello-pangea/dnd";
import { Plus, MoreHorizontal, Calendar, Clock, MessageSquare, AlertCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { projectApi, taskApi, commentApi } from "@/lib/api";
import { STATUS_CONFIG, PRIORITY_CONFIG, timeAgo } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeName?: string;
  deadline?: string;
  position: number;
  labels: { id: string; name: string; color: string }[];
}

interface Project {
  id: string;
  name: string;
  key: string;
  members: { id: string; userId: string; username: string }[];
}

function ProjectBoardContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<{ [key: string]: Task[] }>({
    BACKLOG: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    DONE: [],
  });
  const [loading, setLoading] = useState(true);
  
  // task creation modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", description: "", priority: "MEDIUM", status: "BACKLOG" });
  
  // task detail modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // drag state for visual highlights
  const [draggingTaskStatus, setDraggingTaskStatus] = useState<string | null>(null);

  const isValidTransition = (sourceStatus: string, targetColId: string) => {
    if (sourceStatus === targetColId) return true;
    if ((sourceStatus === 'BACKLOG' || sourceStatus === 'TODO') && targetColId === 'IN_PROGRESS') return true;
    if ((sourceStatus === 'IN_PROGRESS' || sourceStatus === 'RE_OPEN') && targetColId === 'IN_REVIEW') return true;
    if (sourceStatus === 'IN_REVIEW' && targetColId === 'DONE') return true;
    if ((sourceStatus === 'IN_REVIEW' || sourceStatus === 'DONE' || sourceStatus === 'IN_PROGRESS') && targetColId === 'IN_PROGRESS') return true;
    if (sourceStatus === 'RE_OPEN' && targetColId === 'IN_PROGRESS') return true;
    return false;
  };

  const handleDragStart = (start: DragStart) => {
    const colTasks = tasks[start.source.droppableId];
    if (colTasks && colTasks[start.source.index]) {
      setDraggingTaskStatus(colTasks[start.source.index].status);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    if (!projectId) return;
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectApi.get(projectId),
        taskApi.list(projectId)
      ]);
      setProject(projRes.data?.data);
      
      const allTasks = tasksRes.data?.data || [];
      const grouped = { BACKLOG: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] };
      allTasks.forEach((t: Task) => {
        let col = t.status;
        if (col === 'TODO') col = 'BACKLOG';
        if (col === 'RE_OPEN') col = 'IN_PROGRESS';
        
        if (grouped[col as keyof typeof grouped]) {
          // @ts-ignore
          grouped[col as keyof typeof grouped].push(t);
        }
      });
      
      // sort by position
      Object.keys(grouped).forEach(k => {
        // @ts-ignore
        grouped[k].sort((a, b) => a.position - b.position);
      });
      
      setTasks(grouped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    setDraggingTaskStatus(null);
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceStatus = tasks[source.droppableId][source.index].status;
    let targetColId = destination.droppableId;
    let newStatus = targetColId;

    // Frontend validation rules based on backend requirements
    let isValid = false;
    
    // Allow dragging within the same column (just reordering)
    if (source.droppableId === destination.droppableId) {
       isValid = true;
       newStatus = sourceStatus; // keep original status
    } else {
       if ((sourceStatus === 'BACKLOG' || sourceStatus === 'TODO') && targetColId === 'IN_PROGRESS') isValid = true;
       if ((sourceStatus === 'IN_PROGRESS' || sourceStatus === 'RE_OPEN') && targetColId === 'IN_REVIEW') isValid = true;
       if (sourceStatus === 'IN_REVIEW' && targetColId === 'DONE') isValid = true;
       
       // Handle backwards flow (moving to IN_PROGRESS column implies RE_OPEN)
       if ((sourceStatus === 'IN_REVIEW' || sourceStatus === 'DONE' || sourceStatus === 'IN_PROGRESS') && targetColId === 'IN_PROGRESS') {
           isValid = true;
           newStatus = 'RE_OPEN';
       }
    }

    if (!isValid) return; // Discard drop, optimistic UI does not change (snaps back)

    // Optimistic UI update
    const sourceColumn = [...tasks[source.droppableId]];
    const destColumn = source.droppableId === destination.droppableId 
      ? sourceColumn 
      : [...tasks[destination.droppableId]];
      
    const [movedTask] = sourceColumn.splice(source.index, 1);
    movedTask.status = newStatus;
    movedTask.position = destination.index; // simplified position for demo
    
    destColumn.splice(destination.index, 0, movedTask);
    
    setTasks(prev => ({
      ...prev,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn
    }));

    try {
      await taskApi.update(draggableId, { 
        status: newStatus,
        position: destination.index
      });
    } catch (e) {
      // Revert on error
      loadData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      await taskApi.create({ ...createForm, projectId });
      setShowCreate(false);
      setCreateForm({ title: "", description: "", priority: "MEDIUM", status: "BACKLOG" });
      loadData();
    } catch {}
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading board...</div>;
  if (!project) return <div className="p-8 text-center text-red-400 font-medium">Project not found</div>;

  const columns = ["BACKLOG", "IN_PROGRESS", "IN_REVIEW", "DONE"];

  const COLUMN_LIMITS: Record<string, number | null> = {
    BACKLOG: 5,
    RE_OPEN: null,
    IN_PROGRESS: 3,
    IN_REVIEW: 5,
    DONE: null,
  };

  const COLUMN_SUBTITLES: Record<string, string> = {
    BACKLOG: "This item hasn't been started",
    RE_OPEN: "",
    IN_PROGRESS: "This is actively being worked on",
    IN_REVIEW: "This item is in review",
    DONE: "This has been completed",
  };

  return (
    <div className="h-full flex flex-col pt-2 animate-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
                {project.key}
              </span>
              <h1 className="text-2xl font-bold">{project.name}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1 -ml-1">
              <div className="flex -space-x-2 pl-1">
                {project.members?.slice(0, 3).map(m => (
                  <div key={m.id} className="w-6 h-6 rounded-full border border-[var(--bg-primary)] flex items-center justify-center text-[10px] bg-slate-700 text-white font-bold" title={m.username}>
                    {m.username.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {project.members?.length} members
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreate(true)}>
            <Plus size={18} /> Add Task
          </button>
        </div>
      </div>

      <div className="flex-1 pb-4 -mx-6 px-6">
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full items-start">
            {columns.map(colId => {
              const isInvalidDrop = draggingTaskStatus && !isValidTransition(draggingTaskStatus, colId);
              return (
              <div key={colId} className={`kanban-column flex flex-col max-h-[calc(100vh-180px)] transition-all duration-300 ${isInvalidDrop ? 'opacity-30 grayscale' : ''}`}>
                <div className="p-4 flex flex-col sticky top-0 z-10" style={{ borderBottom: "1px solid var(--border)", background: "rgba(15,15,35,0.9)", backdropFilter: "blur(8px)", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full border-2" 
                        style={{ borderColor: STATUS_CONFIG[colId as keyof typeof STATUS_CONFIG]?.color || '#ffffff' }}
                      />
                      <h3 className="font-semibold text-sm">{STATUS_CONFIG[colId as keyof typeof STATUS_CONFIG]?.label || colId}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-xl ${COLUMN_LIMITS[colId] && (tasks[colId]?.length || 0) > COLUMN_LIMITS[colId]! ? 'bg-red-500/20 text-red-500 font-bold' : 'bg-white/10 text-gray-400'}`}>
                        {COLUMN_LIMITS[colId] ? `${tasks[colId]?.length || 0} / ${COLUMN_LIMITS[colId]}` : (tasks[colId]?.length || 0)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-xl border border-white/10 text-gray-400">
                        Estimate: 0
                      </span>
                    </div>
                    <div className="flex text-gray-500">
                      <button className="p-1 hover:bg-white/10 rounded"><MoreHorizontal size={16} /></button>
                      <button className="p-1 hover:bg-white/10 rounded" onClick={() => { setCreateForm(f => ({...f, status: colId})); setShowCreate(true); }}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  {COLUMN_SUBTITLES[colId] && (
                    <span className="text-xs text-gray-400 mt-2">{COLUMN_SUBTITLES[colId]}</span>
                  )}
                </div>

                <Droppable droppableId={colId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 p-3 overflow-y-auto space-y-3"
                      style={{ 
                        background: snapshot.isDraggingOver ? "rgba(99,102,241,0.05)" : "transparent",
                        transition: "background 0.2s"
                      }}
                    >
                      {tasks[colId]?.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="task-card"
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.9 : 1,
                                boxShadow: snapshot.isDragging ? "0 12px 24px rgba(0,0,0,0.5)" : undefined,
                              }}
                              onClick={() => setSelectedTask(task)}
                            >
                              <div className="flex gap-2 mb-2 items-center">
                                {task.status === 'RE_OPEN' && (
                                  <span className="px-1.5 py-0.5 text-[9px] bg-red-500/20 border border-red-500/50 text-red-500 font-bold rounded uppercase">Re-Opened</span>
                                )}
                                <div className="flex gap-1">
                                  {task.labels?.map(l => (
                                    <span key={l.id} className="w-8 h-1.5 rounded-full" style={{ background: l.color }} title={l.name} />
                                  ))}
                                </div>
                              </div>
                              <h4 className="font-medium text-sm leading-tight mb-2">{task.title}</h4>
                              <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                                  <span title={PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG].label} style={{ color: PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG].color }}>
                                    <AlertCircle size={14} />
                                  </span>
                                  {task.deadline && (
                                    <span className="flex items-center gap-1">
                                      <Calendar size={12} /> {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {task.assigneeName && (
                                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] text-white font-bold" title={task.assigneeName}>
                                      {task.assigneeName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )})}
          </div>
        </DragDropContext>
      </div>

      {/* Basic Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Create Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <input required className="input-field" placeholder="Task Title" value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} />
                <textarea className="input-field" placeholder="Description" rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} />
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Priority</label>
                    <select className="input-field w-full h-10" value={createForm.priority} onChange={e => setCreateForm({...createForm, priority: e.target.value})}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs mb-1 block" style={{ color: "var(--text-secondary)" }}>Status</label>
                    <select className="input-field w-full h-10" value={createForm.status} onChange={e => setCreateForm({...createForm, status: e.target.value})}>
                      <option value="BACKLOG">Backlog</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="IN_REVIEW">In review</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Create</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
        
        {selectedTask && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTask(null)}>
            <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                   <span className="text-xs pt-1" style={{ color: "var(--text-secondary)" }}>{project.key}-{selectedTask.id.substring(0,4)}</span>
                   <h2 className="text-xl font-bold">{selectedTask.title}</h2>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Description</h3>
                    <p className="text-sm bg-black/20 p-3 rounded-lg min-h-[100px] whitespace-pre-wrap">
                      {selectedTask.description || "No description provided."}
                    </p>
                  </div>
                </div>
                <div className="w-48 space-y-4">
                  <div className="p-3 bg-black/20 rounded-lg space-y-3">
                    <div>
                      <span className="text-xs block mb-1" style={{ color: "var(--text-secondary)" }}>Status</span>
                      <select 
                        className="w-full text-sm font-medium bg-black/40 border border-white/10 rounded px-2 py-1 outline-none" 
                        value={selectedTask.status} 
                        onChange={async (e) => {
                          const newSt = e.target.value;
                          try {
                            await taskApi.update(selectedTask.id, { status: newSt });
                            setSelectedTask({ ...selectedTask, status: newSt });
                            loadData();
                          } catch {}
                        }}
                      >
                        <option value="BACKLOG">Backlog</option>
                        {selectedTask.status === 'RE_OPEN' && <option value="RE_OPEN">Re-Open</option>}
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="IN_REVIEW">In review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-xs block mb-1" style={{ color: "var(--text-secondary)" }}>Priority</span>
                      <span className="text-sm font-medium" style={{ color: PRIORITY_CONFIG[selectedTask.priority as keyof typeof PRIORITY_CONFIG].color }}>
                        {PRIORITY_CONFIG[selectedTask.priority as keyof typeof PRIORITY_CONFIG].label}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs block mb-1" style={{ color: "var(--text-secondary)" }}>Assignee</span>
                      <span className="text-sm">{selectedTask.assigneeName || "Unassigned"}</span>
                    </div>
                  </div>
                  <button className="btn-secondary w-full" onClick={() => setSelectedTask(null)}>Close</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProjectBoardPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading board...</div>}>
      <ProjectBoardContent />
    </Suspense>
  );
}
