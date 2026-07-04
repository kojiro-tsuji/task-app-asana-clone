'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  List, 
  Kanban, 
  CheckCircle2, 
  Clock, 
  User as UserIcon, 
  Folder, 
  X, 
  ChevronRight, 
  ChevronDown, 
  UserPlus, 
  FolderPlus,
  Trash2,
  Calendar,
  Layers,
  Check
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
}

interface Project {
  id: string
  name: string
  _count?: {
    tasks: number
  }
}

interface Task {
  id: string
  title: string
  description: string | null
  status: string // "TODO", "IN_PROGRESS", "DONE"
  dueDate: string | null
  projectId: string
  project: Project
  assigneeId: string | null
  assignee: User | null
  createdAt: string
  updatedAt: string
}

export default function AsanaClone() {
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)

  // Navigation / Filter states
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board')
  
  // Selected Task for Slide-over
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  // Add dialog states
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')

  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskStatus, setNewTaskStatus] = useState('TODO')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [newTaskProjId, setNewTaskProjId] = useState('')

  // Inline Quick Add state
  const [inlineTaskTitles, setInlineTaskTitles] = useState<{ [key: string]: string }>({})

  // Fetch initial data
  useEffect(() => {
    async function initData() {
      try {
        const [usersRes, projectsRes, tasksRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/projects'),
          fetch('/api/tasks')
        ])

        const usersData = await usersRes.json()
        const projectsData = await projectsRes.json()
        const tasksData = await tasksRes.json()

        setUsers(usersData)
        setProjects(projectsData)
        setTasks(tasksData)

        if (projectsData.length > 0) {
          setActiveProject(projectsData[0])
        }
      } catch (error) {
        console.error('Failed to load data', error)
      } finally {
        setLoading(false)
      }
    }
    initData()
  }, [])

  // Refresh tasks function
  const refreshTasks = async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setTasks(data)
      
      // Update selected task reference if open
      if (selectedTask) {
        const updated = data.find((t: Task) => t.id === selectedTask.id)
        if (updated) setSelectedTask(updated)
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Refresh projects function
  const refreshProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data)
    } catch (error) {
      console.error(error)
    }
  }

  // Handle Project Creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName })
      })
      if (res.ok) {
        const newProj = await res.json()
        setNewProjectName('')
        setIsAddingProject(false)
        await refreshProjects()
        setActiveProject(newProj)
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Handle User Creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserEmail.trim()) return

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail, name: newUserName })
      })
      if (res.ok) {
        setNewUserEmail('')
        setNewUserName('')
        setIsAddingUser(false)
        // Refresh users list
        const usersRes = await fetch('/api/users')
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Handle Task Creation (Modal)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetProjId = newTaskProjId || activeProject?.id
    if (!newTaskTitle.trim() || !targetProjId) return

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          status: newTaskStatus,
          dueDate: newTaskDueDate || null,
          projectId: targetProjId,
          assigneeId: newTaskAssignee || null
        })
      })
      if (res.ok) {
        setNewTaskTitle('')
        setNewTaskDesc('')
        setNewTaskDueDate('')
        setNewTaskAssignee('')
        setIsAddingTask(false)
        await refreshTasks()
        await refreshProjects()
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Handle Task Creation (Inline Quick Add)
  const handleCreateTaskInline = async (status: string, projectId: string) => {
    const title = inlineTaskTitles[status] || ''
    if (!title.trim()) return

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          status,
          projectId
        })
      })
      if (res.ok) {
        setInlineTaskTitles(prev => ({ ...prev, [status]: '' }))
        await refreshTasks()
        await refreshProjects()
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Handle Task Update (e.g. description, status, project, assignee)
  const handleUpdateTask = async (taskId: string, fields: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      })
      if (res.ok) {
        await refreshTasks()
        await refreshProjects()
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Handle Task Delete
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('このタスクを削除してもよろしいですか？')) return
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setSelectedTask(null)
        await refreshTasks()
        await refreshProjects()
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    setDraggingTaskId(taskId)
  }

  const handleDragEnd = () => {
    setDraggingTaskId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    setDraggingTaskId(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return

    // Optimistically update status in UI first
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t))
    
    // Save to DB
    await handleUpdateTask(taskId, { status: targetStatus })
  }

  // Filter tasks based on active project selection
  const filteredTasks = activeProject 
    ? tasks.filter(t => t.projectId === activeProject.id)
    : tasks

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500 font-medium">Asana Clone ロード中...</p>
        </div>
      </div>
    )
  }

  const columns = [
    { id: 'TODO', title: '未着手', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'IN_PROGRESS', title: '進行中', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'DONE', title: '完了', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1e1f21] text-slate-300 flex flex-col h-full shrink-0 border-r border-slate-800">
        {/* Brand Header */}
        <div className="h-14 flex items-center px-6 border-b border-slate-800 gap-2 shrink-0">
          <Layers className="h-6 w-6 text-indigo-400" />
          <span className="text-white font-semibold text-lg tracking-wider">Asana Clone</span>
        </div>

        {/* Sidebar Nav Actions */}
        <div className="px-4 py-4 flex flex-col gap-2 shrink-0">
          <button 
            onClick={() => setIsAddingTask(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            新規タスク作成
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2 text-xs font-bold text-slate-500 tracking-wider uppercase">
              <span>プロジェクト</span>
              <button 
                onClick={() => setIsAddingProject(true)}
                className="hover:text-white p-0.5 rounded transition-colors"
                title="プロジェクトの追加"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveProject(null)}
                  className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 ${!activeProject ? 'bg-slate-800 text-white font-medium shadow-inner' : 'hover:bg-slate-800/50 hover:text-white'}`}
                >
                  <Folder className="h-4 w-4 text-slate-400" />
                  <span className="truncate">すべてのタスク</span>
                  <span className="ml-auto text-xs py-0.5 px-1.5 bg-slate-800 rounded-full text-slate-400">
                    {tasks.length}
                  </span>
                </button>
              </li>
              {projects.map(proj => (
                <li key={proj.id}>
                  <button
                    onClick={() => setActiveProject(proj)}
                    className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-all duration-150 ${activeProject?.id === proj.id ? 'bg-slate-800 text-white font-medium shadow-inner' : 'hover:bg-slate-800/50 hover:text-white'}`}
                  >
                    <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0"></div>
                    <span className="truncate">{proj.name}</span>
                    {proj._count && (
                      <span className="ml-auto text-xs py-0.5 px-1.5 bg-slate-850 rounded-full text-slate-400">
                        {proj._count.tasks}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Team Members Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2 text-xs font-bold text-slate-500 tracking-wider uppercase">
              <span>メンバー</span>
              <button 
                onClick={() => setIsAddingUser(true)}
                className="hover:text-white p-0.5 rounded transition-colors"
                title="メンバーの追加"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-1">
              {users.map(user => (
                <li key={user.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {user.name ? user.name[0] : user.email[0].toUpperCase()}
                  </div>
                  <span className="truncate">{user.name || user.email}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 shrink-0 text-center">
          <p>Asana Clone v1.0.0</p>
          <p className="mt-1 font-mono text-[10px]">Supabase & Prisma Fullstack</p>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        
        {/* HEADER */}
        <header className="h-14 border-b border-slate-200 flex items-center justify-between px-8 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {activeProject ? activeProject.name : 'すべてのタスク'}
            </h1>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            {/* View Selectors */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'}`}
              >
                <List className="h-3.5 w-3.5" />
                リスト
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${viewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'}`}
              >
                <Kanban className="h-3.5 w-3.5" />
                ボード
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="text-xs text-slate-500 mr-2 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {filteredTasks.filter(t => t.status === 'DONE').length} 完了
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                {filteredTasks.filter(t => t.status !== 'DONE').length} 未完了
              </span>
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <div className="flex-1 overflow-auto bg-slate-50/50 p-8">
          
          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {columns.map(col => {
                const colTasks = filteredTasks.filter(t => t.status === col.id)
                return (
                  <div key={col.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Section Header */}
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-semibold py-1 px-2.5 rounded-full ${col.color}`}>
                          {col.title}
                        </span>
                        <span className="text-xs font-medium text-slate-400">({colTasks.length})</span>
                      </div>
                    </div>

                    {/* Task Rows */}
                    <div className="divide-y divide-slate-100">
                      {colTasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="flex items-center px-5 py-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors group"
                        >
                          {/* Checkbox Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateTask(task.id, { 
                                status: task.status === 'DONE' ? 'TODO' : 'DONE' 
                              })
                            }}
                            className={`h-5 w-5 rounded-full border flex items-center justify-center mr-3.5 shrink-0 transition-colors ${task.status === 'DONE' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30'}`}
                          >
                            {task.status === 'DONE' && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                          </button>

                          {/* Title */}
                          <span className={`text-sm font-medium text-slate-800 truncate flex-1 ${task.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>
                            {task.title}
                          </span>

                          {/* Project Name (Only on "All Tasks" view) */}
                          {!activeProject && (
                            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mr-4 truncate max-w-[150px]">
                              {task.project.name}
                            </span>
                          )}

                          {/* Due Date */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-6 min-w-[90px]">
                            <Calendar className="h-3.5 w-3.5" />
                            {task.dueDate ? (
                              <span className={new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-rose-500 font-semibold' : ''}>
                                {new Date(task.dueDate).toLocaleDateString('ja-JP')}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </div>

                          {/* Assignee */}
                          <div className="flex items-center gap-2 w-32 shrink-0">
                            {task.assignee ? (
                              <>
                                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                  {task.assignee.name ? task.assignee.name[0] : task.assignee.email[0].toUpperCase()}
                                </div>
                                <span className="text-xs font-medium text-slate-600 truncate">{task.assignee.name || task.assignee.email}</span>
                              </>
                            ) : (
                              <>
                                <div className="h-6 w-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                  <UserIcon className="h-3 w-3" />
                                </div>
                                <span className="text-xs text-slate-400">担当なし</span>
                              </>
                            )}
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTask(task.id)
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      {/* Quick Inline Task Creator */}
                      {activeProject && (
                        <div className="flex items-center px-5 py-2.5 bg-slate-50/20">
                          <Plus className="h-4 w-4 text-slate-400 mr-3" />
                          <input 
                            type="text" 
                            placeholder="新規タスクを入力してEnter..."
                            value={inlineTaskTitles[col.id] || ''}
                            onChange={(e) => setInlineTaskTitles({ ...inlineTaskTitles, [col.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateTaskInline(col.id, activeProject.id)
                              }
                            }}
                            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* BOARD VIEW */}
          {viewMode === 'board' && (
            <div className="flex gap-6 h-full items-start overflow-x-auto pb-4">
              {columns.map(col => {
                const colTasks = filteredTasks.filter(t => t.status === col.id)
                return (
                  <div 
                    key={col.id} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className="w-80 shrink-0 bg-slate-100/70 border border-slate-200/50 rounded-xl p-4 flex flex-col max-h-full"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 px-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-700 text-sm">{col.title}</h3>
                        <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-full text-slate-500 font-medium">
                          {colTasks.length}
                        </span>
                      </div>
                    </div>

                    {/* Cards Container */}
                    <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar min-h-[150px]">
                      {colTasks.map(task => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedTask(task)}
                          className={`bg-white p-4 border border-slate-200 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group relative border-l-4 border-l-indigo-500/35 ${
                            draggingTaskId === task.id ? 'opacity-40 border-dashed border-indigo-400 bg-indigo-50/10' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-sm font-medium text-slate-800 line-clamp-2 leading-snug">
                              {task.title}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="mt-4 flex items-center justify-between text-[11px] border-t border-slate-100 pt-3">
                            {/* Project tag (Only on All Tasks view) */}
                            {!activeProject && (
                              <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-medium max-w-[100px] truncate">
                                {task.project.name}
                              </span>
                            )}

                            {/* Due Date */}
                            <span className={`flex items-center gap-1 text-slate-500 font-medium ${task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-rose-500 font-semibold' : ''}`}>
                              <Calendar className="h-3 w-3" />
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ja-JP', {month: 'numeric', day: 'numeric'}) : '-'}
                            </span>

                            {/* Assignee icon */}
                            {task.assignee ? (
                              <div 
                                className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700"
                                title={task.assignee.name || task.assignee.email}
                              >
                                {task.assignee.name ? task.assignee.name[0] : task.assignee.email[0].toUpperCase()}
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                <UserIcon className="h-3 w-3" />
                              </div>
                            )}
                          </div>

                          {/* Hover Delete Action */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTask(task.id)
                            }}
                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Inline Quick Add Button */}
                    {activeProject && (
                      <div className="mt-3 pt-2 border-t border-slate-200/50">
                        <input 
                          type="text" 
                          placeholder="+ タスクを追加してEnter..."
                          value={inlineTaskTitles[col.id] || ''}
                          onChange={(e) => setInlineTaskTitles({ ...inlineTaskTitles, [col.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCreateTaskInline(col.id, activeProject.id)
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs outline-none focus:border-indigo-500 placeholder-slate-400"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </main>

      {/* SLIDE-OVER (TASK DETAIL PANEL) */}
      <div className={`fixed inset-y-0 right-0 w-[460px] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${selectedTask ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedTask && (
          <>
            {/* Header */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">タスク詳細</span>
              <button 
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg hover:bg-slate-250 text-slate-450 hover:text-slate-700 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Task Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">タスク名</label>
                <input 
                  type="text"
                  value={selectedTask.title}
                  onChange={(e) => {
                    const title = e.target.value
                    setSelectedTask({ ...selectedTask, title })
                    handleUpdateTask(selectedTask.id, { title })
                  }}
                  className="w-full text-lg font-bold text-slate-800 border-none outline-none p-1.5 hover:bg-slate-50 focus:bg-slate-50 focus:ring-2 focus:ring-indigo-500 rounded-lg transition-all"
                />
              </div>

              {/* Grid Properties */}
              <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-6">
                {/* Status selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ステータス</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => {
                      const status = e.target.value
                      setSelectedTask({ ...selectedTask, status })
                      handleUpdateTask(selectedTask.id, { status })
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-medium rounded-lg p-2 outline-none focus:border-indigo-600"
                  >
                    <option value="TODO">未着手</option>
                    <option value="IN_PROGRESS">進行中</option>
                    <option value="DONE">完了</option>
                  </select>
                </div>

                {/* Due Date selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">期限</label>
                  <input
                    type="date"
                    value={selectedTask.dueDate ? selectedTask.dueDate.substring(0, 10) : ''}
                    onChange={(e) => {
                      const val = e.target.value
                      const dueDate = val ? new Date(val).toISOString() : null
                      setSelectedTask({ ...selectedTask, dueDate })
                      handleUpdateTask(selectedTask.id, { dueDate })
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-medium rounded-lg p-2 outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Project selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">プロジェクト</label>
                  <select
                    value={selectedTask.projectId}
                    onChange={(e) => {
                      const projectId = e.target.value
                      setSelectedTask({ ...selectedTask, projectId })
                      handleUpdateTask(selectedTask.id, { projectId })
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-medium rounded-lg p-2 outline-none focus:border-indigo-600"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Assignee selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">担当者</label>
                  <select
                    value={selectedTask.assigneeId || ''}
                    onChange={(e) => {
                      const assigneeId = e.target.value || null
                      setSelectedTask({ ...selectedTask, assigneeId })
                      handleUpdateTask(selectedTask.id, { assigneeId })
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-medium rounded-lg p-2 outline-none focus:border-indigo-600"
                  >
                    <option value="">担当なし</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">説明</label>
                <textarea
                  placeholder="説明を入力してください..."
                  value={selectedTask.description || ''}
                  onChange={(e) => {
                    const description = e.target.value
                    setSelectedTask({ ...selectedTask, description })
                  }}
                  onBlur={() => {
                    // Update on blur to avoid excessive API requests
                    handleUpdateTask(selectedTask.id, { description: selectedTask.description })
                  }}
                  className="w-full h-36 bg-slate-50/50 border border-slate-200 rounded-lg p-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all placeholder-slate-400"
                />
              </div>

            </div>

            {/* Footer Panel */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button 
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                タスク削除
              </button>
            </div>
          </>
        )}
      </div>

      {/* MODAL: ADD TASK */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">新規タスクの作成</h2>
              <button onClick={() => setIsAddingTask(false)} className="text-slate-450 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">タスクタイトル</label>
                <input 
                  type="text" 
                  required
                  placeholder="何をしますか？"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">説明</label>
                <textarea 
                  placeholder="詳細な説明を書く..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full h-24 border border-slate-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">期限</label>
                  <input 
                    type="date" 
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">ステータス</label>
                  <select 
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="TODO">未着手</option>
                    <option value="IN_PROGRESS">進行中</option>
                    <option value="DONE">完了</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">プロジェクト</label>
                  <select 
                    value={newTaskProjId}
                    onChange={(e) => setNewTaskProjId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="">プロジェクトを選択...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">担当者</label>
                  <select 
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="">担当者を選択...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-4.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-650"
                >
                  キャンセル
                </button>
                <button 
                  type="submit"
                  className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/10"
                >
                  タスクを作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PROJECT */}
      {isAddingProject && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">新規プロジェクト</h2>
              <button onClick={() => setIsAddingProject(false)} className="text-slate-450 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">プロジェクト名</label>
                <input 
                  type="text" 
                  required
                  placeholder="例: 新規LP立ち上げ"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setIsAddingProject(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-650"
                >
                  キャンセル
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/10"
                >
                  プロジェクトを作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD USER */}
      {isAddingUser && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">新規メンバー追加</h2>
              <button onClick={() => setIsAddingUser(false)} className="text-slate-450 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">お名前</label>
                <input 
                  type="text" 
                  placeholder="例: 佐藤 健太"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">メールアドレス</label>
                <input 
                  type="email" 
                  required
                  placeholder="sato@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-650"
                >
                  キャンセル
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/10"
                >
                  メンバーを追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
