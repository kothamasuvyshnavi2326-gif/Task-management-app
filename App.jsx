import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, ClipboardList, ListTodo, LogOut, Plus, Search, Trash2, Pencil, X, CalendarDays, LayoutDashboard } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const emptyTask = { title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '' };

async function request(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('taskflow_token') || '');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('taskflow_user') || 'null'));
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState({ name: '', email: '', password: '' });
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [authError, setAuthError] = useState('');

  async function loadTasks(currentToken = token) {
    try { setTasks(await request('/tasks', currentToken)); }
    catch (err) { setNotice(err.message); }
  }
  useEffect(() => { if (token) loadTasks(token); }, [token]);

  async function submitAuth(e) {
    e.preventDefault(); setBusy(true); setAuthError('');
    try {
      const data = await request(`/auth/${authMode === 'login' ? 'login' : 'register'}`, '', { method: 'POST', body: JSON.stringify(auth) });
      localStorage.setItem('taskflow_token', data.token);
      localStorage.setItem('taskflow_user', JSON.stringify(data.user));
      setToken(data.token); setUser(data.user); setAuth({ name: '', email: '', password: '' });
    } catch (err) { setAuthError(err.message); }
    finally { setBusy(false); }
  }

  function logout() {
    localStorage.removeItem('taskflow_token'); localStorage.removeItem('taskflow_user');
    setToken(''); setUser(null); setTasks([]); setNotice('');
  }

  function startCreate() { setEditing(null); setForm(emptyTask); setShowForm(true); }
  function startEdit(task) {
    setEditing(task._id);
    setForm({ title: task.title, description: task.description || '', status: task.status, priority: task.priority, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '' });
    setShowForm(true);
  }

  async function saveTask(e) {
    e.preventDefault(); setBusy(true); setNotice('');
    try {
      const payload = { ...form, dueDate: form.dueDate || null };
      if (editing) await request(`/tasks/${editing}`, token, { method: 'PATCH', body: JSON.stringify(payload) });
      else await request('/tasks', token, { method: 'POST', body: JSON.stringify(payload) });
      await loadTasks(); setShowForm(false); setForm(emptyTask); setEditing(null); setNotice(editing ? 'Task updated successfully.' : 'Task created successfully.');
    } catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  }

  async function changeStatus(task) {
    const status = task.status === 'Todo' ? 'In Progress' : task.status === 'In Progress' ? 'Done' : 'Todo';
    try { await request(`/tasks/${task._id}`, token, { method: 'PATCH', body: JSON.stringify({ status }) }); await loadTasks(); }
    catch (err) { setNotice(err.message); }
  }

  async function deleteTask(id) {
    if (!window.confirm('Delete this task?')) return;
    try { await request(`/tasks/${id}`, token, { method: 'DELETE' }); await loadTasks(); setNotice('Task deleted.'); }
    catch (err) { setNotice(err.message); }
  }

  const visibleTasks = useMemo(() => tasks.filter(t => (filter === 'All' || t.status === filter) && `${t.title} ${t.description}`.toLowerCase().includes(search.toLowerCase())), [tasks, filter, search]);
  const completed = tasks.filter(t => t.status === 'Done').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;

  if (!token) return <main className="auth-page">
    <section className="auth-card">
      <div className="brand-mark"><ListTodo size={26}/></div>
      <p className="eyebrow">TASKFLOW WORKSPACE</p>
      <h1>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="muted">{authMode === 'login' ? 'Sign in to pick up where you left off.' : 'Organize your day, one task at a time.'}</p>
      <form onSubmit={submitAuth} className="auth-form">
        {authMode === 'register' && <label>Full name<input required value={auth.name} onChange={e => setAuth({...auth, name:e.target.value})} placeholder="Your name" /></label>}
        <label>Email address<input required type="email" value={auth.email} onChange={e => setAuth({...auth, email:e.target.value})} placeholder="you@example.com" /></label>
        <label>Password<input required minLength={8} type="password" value={auth.password} onChange={e => setAuth({...auth, password:e.target.value})} placeholder="At least 8 characters" /></label>
        {authError && <p className="error">{authError}</p>}
        <button className="primary full" disabled={busy}>{busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}</button>
      </form>
      <p className="switch-auth">{authMode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button className="text-button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}>{authMode === 'login' ? 'Sign up' : 'Sign in'}</button></p>
    </section>
    <p className="auth-footer">A calmer way to get things done.</p>
  </main>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark small"><ListTodo size={21}/></span><span>TaskFlow</span></div>
      <p className="nav-label">WORKSPACE</p>
      <div className="nav-item active"><LayoutDashboard size={18}/> Dashboard</div>
      <div className="sidebar-tip"><div className="tip-icon"><CheckCircle2 size={21}/></div><strong>Small steps add up.</strong><p>Keep your focus on what matters today.</p></div>
      <div className="sidebar-user"><div className="avatar">{(user?.name || user?.email || 'U').slice(0,1).toUpperCase()}</div><div className="user-info"><strong>{user?.name || 'Your account'}</strong><span>{user?.email}</span></div><button className="icon-button" title="Sign out" onClick={logout}><LogOut size={17}/></button></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Good work starts here<span className="period">.</span></h1><p className="muted">Plan your day and make progress at your pace.</p></div><button className="primary add-top" onClick={startCreate}><Plus size={18}/> New task</button></header>
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15}/></button></div>}
      <section className="stats-grid">
        <div className="stat-card"><div className="stat-icon lavender"><ClipboardList size={20}/></div><span className="stat-label">Total tasks</span><strong>{tasks.length}</strong><small>Across your workspace</small></div>
        <div className="stat-card"><div className="stat-icon peach"><Circle size={20}/></div><span className="stat-label">In progress</span><strong>{inProgress}</strong><small>Keep the momentum</small></div>
        <div className="stat-card"><div className="stat-icon mint"><CheckCircle2 size={20}/></div><span className="stat-label">Completed</span><strong>{completed}</strong><small>{tasks.length ? Math.round(completed / tasks.length * 100) : 0}% of all tasks</small></div>
      </section>
      <section className="tasks-section">
        <div className="section-heading"><div><h2>Your tasks</h2><p className="muted">Everything you want to get done.</p></div><button className="primary add-mobile" onClick={startCreate}><Plus size={18}/> New task</button></div>
        <div className="toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." /></div><div className="filter-tabs">{['All','Todo','In Progress','Done'].map(f => <button key={f} className={filter === f ? 'filter active-filter' : 'filter'} onClick={() => setFilter(f)}>{f === 'Todo' ? 'To do' : f}</button>)}</div></div>
        {visibleTasks.length === 0 ? <div className="empty-state"><div className="empty-icon"><ClipboardList size={27}/></div><h3>{search || filter !== 'All' ? 'No matching tasks' : 'A fresh start'}</h3><p>{search || filter !== 'All' ? 'Try a different search or filter.' : 'Add your first task and turn your plans into progress.'}</p>{!search && filter === 'All' && <button className="primary" onClick={startCreate}><Plus size={17}/> Create your first task</button>}</div> :
          <div className="task-list">{visibleTasks.map(task => <article className={`task-card ${task.status === 'Done' ? 'is-done' : ''}`} key={task._id}>
            <button className={`check-task ${task.status === 'Done' ? 'checked' : ''}`} onClick={() => changeStatus(task)} title="Advance task status">{task.status === 'Done' ? <CheckCircle2 size={22}/> : <Circle size={22}/>}</button>
            <div className="task-copy"><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}<div className="task-meta"><span className={`status status-${task.status.replace(' ', '-').toLowerCase()}`}>{task.status}</span><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority} priority</span>{task.dueDate && <span className="due-date"><CalendarDays size={13}/>{new Date(task.dueDate).toLocaleDateString()}</span>}</div></div>
            <div className="task-actions"><button className="icon-button" title="Edit task" onClick={() => startEdit(task)}><Pencil size={16}/></button><button className="icon-button danger-hover" title="Delete task" onClick={() => deleteTask(task._id)}><Trash2 size={16}/></button></div>
          </article>)}</div>}
      </section>
      <footer className="main-footer">Made for focus, built for progress <span>•</span> TaskFlow</footer>
    </main>
    {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}><section className="task-modal"><div className="modal-heading"><div><p className="eyebrow">{editing ? 'KEEP IT MOVING' : 'MAKE IT HAPPEN'}</p><h2>{editing ? 'Edit task' : 'Create a task'}</h2></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close"><X size={19}/></button></div>
      <form onSubmit={saveTask} className="task-form"><label>Task title<input autoFocus required maxLength={160} value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="What needs to get done?" /></label><label>Description <span className="optional">Optional</span><textarea rows="3" maxLength={2000} value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Add a few details..." /></label>
      <div className="form-row"><label>Status<select value={form.status} onChange={e => setForm({...form,status:e.target.value})}><option>Todo</option><option>In Progress</option><option>Done</option></select></label><label>Priority<select value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label></div>
      <label>Due date <span className="optional">Optional</span><input type="date" value={form.dueDate} onChange={e => setForm({...form,dueDate:e.target.value})}/></label>
      <div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create task'}</button></div></form>
    </section></div>}
  </div>;
}
