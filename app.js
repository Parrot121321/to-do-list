const STORAGE_KEY = "todo.tasks.v1";
const THEME_KEY = "todo.theme";

let state = {
  tasks: loadTasks(),
  filter: "all",
  search: ""
};

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; }
  catch { return []; }
}
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];
const $$ = {
  list: qs("#taskList"),
  empty: qs("#emptyState"),
  count: qs("#count"),
  filters: qsa(".filter"),
  search: qs("#search"),
  form: qs("#taskForm"),
  title: qs("#taskTitle"),
  due: qs("#taskDue"),
  priority: qs("#taskPriority"),
  completeAll: qs("#completeAll"),
  clearCompleted: qs("#clearCompleted"),
  deleteAll: qs("#deleteAll"),
  themeToggle: qs("#themeToggle")
};

(function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light") document.body.classList.add("light");
  $$.themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem(THEME_KEY, document.body.classList.contains("light") ? "light" : "dark");
  });
})();

function render() {
  const { tasks, filter, search } = state;

  const view = tasks
    .filter(t => filter === "all" ? true : filter === "active" ? !t.completed : t.completed)
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if (a.completed !== b.completed) return a.completed - b.completed;
      const ad = a.due ? new Date(a.due).getTime() : Infinity;
      const bd = b.due ? new Date(b.due).getTime() : Infinity;
      if (ad !== bd) return ad - bd;
      const pr = { high: 0, normal: 1, low: 2 };
      if (pr[a.priority] !== pr[b.priority]) return pr[a.priority] - pr[b.priority];
      return a.createdAt - b.createdAt;
    });

  $$.list.innerHTML = "";
  view.forEach(task => $$.list.appendChild(taskItem(task)));

  $$.empty.style.display = view.length ? "none" : "block";
  $$.count.textContent = `${view.length} item${view.length !== 1 ? "s" : ""}`;
  enableDragAndDrop();
}

function taskItem(task){
  const li = document.createElement("li");
  li.className = `task${task.completed ? " completed" : ""}`;
  li.draggable = true;
  li.dataset.id = task.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "checkbox";
  checkbox.checked = task.completed;
  checkbox.addEventListener("change", () => toggleComplete(task.id, checkbox.checked));

  const titleWrap = document.createElement("div");
  titleWrap.className = "title-wrap";

  const title = document.createElement("div");
  title.className = "title";
  title.textContent = task.title;
  title.tabIndex = 0;
  title.setAttribute("role","textbox");
  title.setAttribute("aria-label","Edit task");
  title.addEventListener("dblclick", () => makeEditable(title, task.id));
  title.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); title.blur(); }
  });
  title.addEventListener("blur", () => {
    if (title.isContentEditable) {
      title.contentEditable = "false";
      const newTitle = title.textContent.trim();
      if (newTitle) updateTitle(task.id, newTitle); else title.textContent = task.title;
    }
  });

  const meta = document.createElement("div");
  meta.className = "meta";
  if (task.due){
    const due = document.createElement("span");
    const d = new Date(task.due);
    const today = new Date(); today.setHours(0,0,0,0);
    const badge = document.createElement("span");
    badge.className = "badge";
    if (d - today <= 2*24*3600*1000 && d >= today) badge.classList.add("dueSoon");
    badge.textContent = `Due: ${d.toLocaleDateString()}`;
    meta.appendChild(badge);
  }
  if (task.priority){
    const p = document.createElement("span");
    p.className = `badge ${task.priority === "high" ? "high" : task.priority === "low" ? "low" : ""}`;
    p.textContent = `Priority: ${task.priority}`;
    meta.appendChild(p);
  }

  titleWrap.appendChild(title);
  titleWrap.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "actions";
  const editBtn = btn("✏️", "icon-btn", () => makeEditable(title, task.id), "Edit");
  const delBtn = btn("🗑️", "icon-btn danger", () => removeTask(task.id), "Delete");
  const dupBtn = btn("📄", "icon-btn", () => duplicateTask(task.id), "Duplicate");
  actions.append(editBtn, dupBtn, delBtn);

  li.append(checkbox, titleWrap, actions);
  return li;
}

function btn(txt, cls, onClick, title){
  const b = document.createElement("button");
  b.className = cls; b.textContent = txt; b.title = title; b.addEventListener("click", onClick);
  return b;
}
function makeEditable(el){ el.contentEditable = "true"; el.focus(); placeCaretAtEnd(el); }
function placeCaretAtEnd(el){
  const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
}

function addTask({ title, due=null, priority="normal" }){
  state.tasks.push({
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
    createdAt: Date.now(),
    due: due || null,
    priority
  });
  saveTasks(); render();
}

function toggleComplete(id, val){
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  t.completed = val;
  saveTasks(); render();
}

function updateTitle(id, newTitle){
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  t.title = newTitle;
  saveTasks(); render();
}

function removeTask(id){
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveTasks(); render();
}

function duplicateTask(id){
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  addTask({ title: t.title, due: t.due, priority: t.priority });
}

function completeAll(){ state.tasks.forEach(t => t.completed = true); saveTasks(); render(); }
function clearCompleted(){ state.tasks = state.tasks.filter(t => !t.completed); saveTasks(); render(); }
function deleteAll(){ if (confirm("Delete all tasks?")) { state.tasks = []; saveTasks(); render(); } }

function enableDragAndDrop(){
  qsa(".task").forEach(el => {
    el.addEventListener("dragstart", () => el.classList.add("dragging"));
    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      const ids = qsa(".task").map(x => x.dataset.id);
      state.tasks.sort((a,b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      saveTasks();
    });
  });

  $$.list.addEventListener("dragover", (e) => {
    e.preventDefault();
    const after = getDragAfterElement($$.list, e.clientY);
    const dragging = qs(".task.dragging");
    if (!dragging) return;
    if (after == null) $$.list.appendChild(dragging);
    else $$.list.insertBefore(dragging, after);
  });
}
function getDragAfterElement(container, y){
  const els = [...container.querySelectorAll(".task:not(.dragging)")];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

$$.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $$.title.value.trim();
  if (!title) return;
  addTask({ title, due: $$.due.value || null, priority: $$.priority.value });
  $$.form.reset();
  $$.title.focus();
});

$$.filters.forEach(btn => btn.addEventListener("click", () => {
  $$.filters.forEach(b => { b.classList.remove("is-active"); b.setAttribute("aria-selected","false"); });
  btn.classList.add("is-active"); btn.setAttribute("aria-selected","true");
  state.filter = btn.dataset.filter; render();
}));

$$.search.addEventListener("input", () => { state.search = $$.search.value; render(); });

$$.completeAll.addEventListener("click", completeAll);
$$.clearCompleted.addEventListener("click", clearCompleted);
$$.deleteAll.addEventListener("click", deleteAll);

window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); $$.search.focus(); }
  if (e.key.toLowerCase() === "n"){ e.preventDefault(); $$.title.focus(); }
});

render();
