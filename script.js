document.getElementById("addBtn").addEventListener("click", addTask);

function addTask() {
  const input = document.getElementById("taskInput");
  const priority = document.getElementById("prioritySelect").value;
  const taskText = input.value.trim();

  if (!taskText) {
    alert("Please write a task first! 🐣");
    return;
  }

  const li = document.createElement("li");

  li.innerHTML = `
    <div>
      <input type="checkbox" onchange="toggleDone(this)" />
      <span class="task-text">${taskText}</span>
      <span class="priority ${priority}">${priority}</span>
    </div>
    <button class="delete" onclick="deleteTask(this)">🗑</button>
  `;

  document.getElementById("taskList").appendChild(li);
  input.value = "";
}

function toggleDone(checkbox) {
  const li = checkbox.closest("li");
  li.classList.toggle("done");
}

function deleteTask(button) {
  const li = button.closest("li");
  li.remove();
}

