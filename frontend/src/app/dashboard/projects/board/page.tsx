"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult, DragStart } from "@hello-pangea/dnd";
import { Plus, MoreHorizontal, Calendar, AlertCircle, ArrowLeft, UserPlus, Search, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { projectApi, taskApi, userApi } from "@/lib/api";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeIds?: string[];
  deadline?: string;
  position: number;
  labels: { id: string; name: string; color: string }[];
}

interface ProjectMember {
  id: string;
  userId: string;
  username: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  key: string;
  members: ProjectMember[];
}

interface UserSearchResult {
  id: string;
  username: string;
  email: string;
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
  
  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({ 
    title: "", 
    description: "", 
    priority: "MEDIUM", 
    status: "BACKLOG",
    assigneeIds: [] as string[]
  });

  // User Search
  const [userQuery, setUserQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (userQuery) searchUsers();
      else setSearchResults([]);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [userQuery]);

  const loadData = async () => {
    if (!projectId) return;
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectApi.get(projectId),
        taskApi.list(projectId)
      ]);
      setProject(projRes.data?.data);
      
      const allTasks = tasksRes.data?.data || [];
      const grouped: { [key: string]: Task[] } = { BACKLOG: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] };
      allTasks.forEach((t: Task) => {
        let col = t.status;
        if (col === 'TODO') col = 'BACKLOG';
        if (col === 'RE_OPEN') col = 'IN_PROGRESS';
        
        if (grouped[col]) {
          grouped[col].push(t);
        }
      });
      
      Object.keys(grouped).forEach(k => {
        grouped[k].sort((a, b) => a.position - b.position);
      });
      
      setTasks(grouped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    setSearching(true);
    try {
      const res = await userApi.search(userQuery);
      // For direct Auth API, results are in .content
      // For former Proxy API, it was in .data.data
      setSearchResults(res.data?.content || res.data?.data || []);
    } catch {} finally { setSearching(false); }
  };

  const handleAddMember = async (user: UserSearchResult) => {
    if (!projectId) return;
    try {
      await projectApi.addMember(projectId, { 
        userId: user.id, 
        username: user.username,
        role: "MEMBER" 
      });
      loadData();
      setUserQuery("");
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!projectId) return;
    if (!confirm("Are you sure?")) return;
    try {
      await projectApi.removeMember(projectId, userId);
      loadData();
    } catch {}
  };

  const handleDragEnd = async (result: DropResult) => {
    setDraggingTaskStatus(null);
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceStatus = tasks[source.droppableId][source.index].status;
    let targetColId = destination.droppableId;
    let newStatus = targetColId;

    let isValid = false;
    
    if (source.droppableId === destination.droppableId) {
       isValid = true;
       newStatus = sourceStatus;
    } else {
       if ((sourceStatus === 'BACKLOG' || sourceStatus === 'TODO') && targetColId === 'IN_PROGRESS') isValid = true;
       if ((sourceStatus === 'IN_PROGRESS' || sourceStatus === 'RE_OPEN') && targetColId === 'IN_REVIEW') isValid = true;
       if (sourceStatus === 'IN_REVIEW' && targetColId === 'DONE') isValid = true;
       
       if ((sourceStatus === 'IN_REVIEW' || sourceStatus === 'DONE' || sourceStatus === 'IN_PROGRESS') && targetColId === 'IN_PROGRESS') {
           isValid = true;
           newStatus = 'RE_OPEN';
       }
    }

    if (!isValid) return;

    const sourceColumn = [...tasks[source.droppableId]];
    const destColumn = source.droppableId === destination.droppableId 
      ? sourceColumn 
      : [...tasks[destination.droppableId]];
      
    const [movedTask] = sourceColumn.splice(source.index, 1);
    movedTask.status = newStatus;
    movedTask.position = destination.index;
    
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
      loadData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      await taskApi.create({ ...createForm, projectId });
      setShowCreate(false);
      setCreateForm({ title: "", description: "", priority: "MEDIUM", status: "BACKLOG", assigneeIds: [] });
      loadData();
    } catch {}
  };

  const toggleAssignee = (userId: string, isCreate: boolean = true) => {
    if (isCreate) {
      setCreateForm(prev => {
        const ids = prev.assigneeIds.includes(userId) 
          ? prev.assigneeIds.filter(id => id !== userId) 
          : [...prev.assigneeIds, userId];
        return { ...prev, assigneeIds: ids };
      });
    } else if (selectedTask) {
      const currentIds = selectedTask.assigneeIds || [];
      const newIds = currentIds.includes(userId)
        ? currentIds.filter(id => id !== userId)
        : [...currentIds, userId];
      setSelectedTask({ ...selectedTask, assigneeIds: newIds });
      taskApi.update(selectedTask.id, { assigneeIds: newIds }).then(() => loadData());
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading board...</div>;
  if (!project) return <div className="p-8 text-center text-red-400 font-medium">Project not found</div>;

  const columns = ["BACKLOG", "IN_PROGRESS", "IN_REVIEW", "DONE"];

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
                {project.members?.slice(0, 5).map(m => (
                  <div key={m.id} className="w-6 h-6 rounded-full border border-[var(--bg-primary)] flex items-center justify-center text-[10px] bg-slate-700 text-white font-bold" title={m.username}>
                    {m.username.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowMembers(true)}
                className="flex items-center gap-1 text-xs hover:underline" 
                style={{ color: "var(--text-secondary)" }}
              >
                {project.members?.length} members <Plus size={12} />
              </button>
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
          <div className="flex gap-6 h-full items-start overflow-x-auto pb-4">
            {columns.map(colId => {
              const isInvalidDrop = draggingTaskStatus && !isValidTransition(draggingTaskStatus, colId);
              return (
              <div key={colId} className={`kanban-column min-w-[300px] flex flex-col max-h-[calc(100vh-180px)] transition-all duration-300 ${isInvalidDrop ? 'opacity-30 grayscale' : ''}`}>
                <div className="p-4 flex flex-col sticky top-0 z-10" style={{ borderBottom: "1px solid var(--border)", background: "rgba(15,15,35,0.9)", backdropFilter: "blur(8px)", borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border-2" style={{ borderColor: STATUS_CONFIG[colId as keyof typeof STATUS_CONFIG]?.color || '#ffffff' }} />
                      <h3 className="font-semibold text-sm">{STATUS_CONFIG[colId as keyof typeof STATUS_CONFIG]?.label || colId}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-xl bg-white/10 text-gray-400">
                        {tasks[colId]?.length || 0}
                      </span>
                    </div>
                    <button className="p-1 hover:bg-white/10 rounded" onClick={() => { setCreateForm(f => ({...f, status: colId})); setShowCreate(true); }}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <Droppable droppableId={colId}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 p-3 overflow-y-auto space-y-3" style={{ background: snapshot.isDraggingOver ? "rgba(99,102,241,0.05)" : "transparent" }}>
                      {tasks[colId]?.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="task-card" onClick={() => setSelectedTask(task)}>
                              <div className="flex gap-2 mb-2">
                                <div className="flex gap-1">
                                  {task.labels?.map(l => (
                                    <span key={l.id} className="w-8 h-1.5 rounded-full" style={{ background: l.color }} />
                                  ))}
                                </div>
                              </div>
                              <h4 className="font-medium text-sm leading-tight mb-2">{task.title}</h4>
                              <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span style={{ color: PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG].color }}>
                                    <AlertCircle size={14} />
                                  </span>
                                  {task.deadline && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                                </div>
                                <div className="flex -space-x-1.5">
                                  {task.assigneeIds?.map(id => {
                                    const m = project.members.find(member => member.userId === id);
                                    return (
                                      <div key={id} className="w-5 h-5 rounded-full bg-indigo-500 border border-slate-900 flex items-center justify-center text-[8px] text-white font-bold" title={m?.username}>
                                        {m?.username.charAt(0).toUpperCase()}
                                      </div>
                                    );
                                  })}
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

      {/* Members Modal */}
      <AnimatePresence>
        {showMembers && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMembers(false)}>
            <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Project Members</h2>
                <button onClick={() => setShowMembers(false)}><X size={20} /></button>
              </div>
              
              <div className="relative mb-6">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                <input 
                  className="input-field pl-10" 
                  placeholder="Invite user by username or email..." 
                  value={userQuery} 
                  onChange={e => setUserQuery(e.target.value)}
                />
                <AnimatePresence>
                  {userQuery && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 p-2 overflow-hidden">
                      {searching ? <div className="p-4 text-center text-sm text-gray-400">Searching...</div> : 
                       searchResults.length === 0 ? <div className="p-4 text-center text-sm text-gray-400">No users found</div> :
                       searchResults.map(u => (
                         <button key={u.id} className="w-full text-left p-3 hover:bg-white/5 rounded flex justify-between items-center group" onClick={() => handleAddMember(u)}>
                           <div>
                             <div className="font-medium">{u.username}</div>
                             <div className="text-xs text-gray-500">{u.email}</div>
                           </div>
                           <UserPlus className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                         </button>
                       ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {project.members.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold">{m.username.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="text-sm font-medium">{m.username}</div>
                        <div className="text-xs text-gray-500">{m.role}</div>
                      </div>
                    </div>
                    {m.role !== 'OWNER' && (
                       <button onClick={() => handleRemoveMember(m.userId)} className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors"><X size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Create Task Modal */}
        {showCreate && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)}>
            <div className="modal-content max-w-xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">Create New Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <input required className="input-field" placeholder="Task Title" value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} />
                <textarea className="input-field" placeholder="Description" rows={3} value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})} />
                
                <div>
                  <label className="text-xs font-semibold mb-2 block text-gray-400">Assign Members</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {createForm.assigneeIds.map(id => {
                      const m = project.members.find(member => member.userId === id);
                      return (
                        <div key={id} className="bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 px-2 py-1 rounded-md flex items-center gap-2 text-xs">
                          {m?.username} <button type="button" onClick={() => toggleAssignee(id, true)}><X size={12}/></button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-black/20 rounded-lg">
                    {project.members.map(m => (
                      <button key={m.userId} type="button" onClick={() => toggleAssignee(m.userId, true)} className={`flex items-center gap-2 p-2 rounded text-xs transition-colors ${createForm.assigneeIds.includes(m.userId) ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'}`}>
                        <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[8px]">{m.username.charAt(0).toUpperCase()}</div>
                        {m.username}
                        {createForm.assigneeIds.includes(m.userId) && <Check size={12} className="ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs mb-1 block text-gray-400">Priority</label>
                    <select className="input-field w-full" value={createForm.priority} onChange={e => setCreateForm({...createForm, priority: e.target.value})}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs mb-1 block text-gray-400">Status</label>
                    <select className="input-field w-full" value={createForm.status} onChange={e => setCreateForm({...createForm, status: e.target.value})}>
                      <option value="BACKLOG">Backlog</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="IN_REVIEW">In review</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Create Task</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
        
        {/* Task Details Modal */}
        {selectedTask && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTask(null)}>
            <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between mb-6">
                <div className="flex gap-2">
                   <span className="text-xs pt-1 text-gray-500">{project.key}-{selectedTask.id.substring(0,4)}</span>
                   <h2 className="text-xl font-bold">{selectedTask.title}</h2>
                </div>
                <button onClick={() => setSelectedTask(null)}><X size={20}/></button>
              </div>
              <div className="flex gap-8">
                <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider text-gray-500">Description</h3>
                    <p className="text-sm bg-black/20 p-4 rounded-lg min-h-[120px] whitespace-pre-wrap leading-relaxed">
                      {selectedTask.description || "No description provided."}
                    </p>
                  </div>
                </div>
                <div className="w-56 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Status</span>
                      <select 
                        className="w-full text-sm font-medium bg-slate-800 border border-white/10 rounded-md px-3 py-2 outline-none focus:border-indigo-500 transition-colors" 
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
                        <option value="RE_OPEN">Re-open</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="IN_REVIEW">In review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Priority</span>
                      <div className="flex items-center gap-2 font-medium" style={{ color: PRIORITY_CONFIG[selectedTask.priority as keyof typeof PRIORITY_CONFIG].color }}>
                        <AlertCircle size={16} />
                        {PRIORITY_CONFIG[selectedTask.priority as keyof typeof PRIORITY_CONFIG].label}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold text-gray-500 block mb-2">Assignees</span>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {project.members.map(m => (
                          <button key={m.userId} type="button" onClick={() => toggleAssignee(m.userId, false)} className={`w-full flex items-center gap-2 p-2 rounded text-xs transition-colors ${selectedTask.assigneeIds?.includes(m.userId) ? 'bg-indigo-600/30 border border-indigo-500/50' : 'hover:bg-white/5 border border-transparent'}`}>
                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[8px]">{m.username.charAt(0).toUpperCase()}</div>
                            {m.username}
                            {selectedTask.assigneeIds?.includes(m.userId) && <Check size={12} className="ml-auto text-indigo-400" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
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
