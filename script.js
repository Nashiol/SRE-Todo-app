(function () {
  // ======= Simple Persistent Auth + Per-User Storage =======
  const LS_KEYS = {
    USERS: "clspa_users",
    CURRENT: "clspa_current_user",
    DATA: "clspa_user_data" // { [email]: { tasks: [{text,color}] } }
  };

  // Helpers to read/write localStorage JSON safely
  const readJSON = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
    catch { return fallback; }
  };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const getUsers = () => readJSON(LS_KEYS.USERS, {});
  const saveUsers = (obj) => writeJSON(LS_KEYS.USERS, obj);
  const getData = () => readJSON(LS_KEYS.DATA, {});
  const saveData = (obj) => writeJSON(LS_KEYS.DATA, obj);

  const getCurrentUser = () => localStorage.getItem(LS_KEYS.CURRENT);
  const setCurrentUser = (email) => {
    if (email) localStorage.setItem(LS_KEYS.CURRENT, email);
    else localStorage.removeItem(LS_KEYS.CURRENT);
  };

  // ======= DOM =======
  const colors = ["#4FC3F7", "#E57373", "#81C784", "#FFD54F", "#BA68C8"];
  const pages = {
    signup: document.getElementById("signup-page"),
    login: document.getElementById("login-page"),
    tasks: document.getElementById("tasks-page"),
    account: document.getElementById("account-page")
  };

  const taskList = document.getElementById("task-list");
  const addBtn = document.getElementById("add-btn");
  const newTaskInput = document.getElementById("new-task");

  // ======= Routing =======
  function showPage(id) {
    Object.values(pages).forEach(p => p && p.classList.add("hidden"));
    if (pages[id]) pages[id].classList.remove("hidden");
  }
  window.showPage = showPage;

  function requireAuthThen(pageId) {
    if (getCurrentUser()) {
      showPage(pageId);
      if (pageId === "tasks") loadTasks();
      return;
    }
    showPage("login");
  }

  // ======= Auth =======
  window.register = function () {
    const email = document.getElementById("signup-email").value.trim().toLowerCase();
    const pass = document.getElementById("signup-pass").value;

    if (!email || !pass) return alert("Please enter email and password.");
    const users = getUsers();
    if (users[email]) return alert("An account with this email already exists. Please log in.");

    users[email] = { email, pass, createdAt: Date.now() };
    saveUsers(users);

    // Initialize blank data for this user
    const data = getData();
    if (!data[email]) data[email] = { tasks: [] };
    saveData(data);

    // Require login after signup as requested
    alert("Sign up successful. Please log in.");
    showPage("login");
  };

  window.login = function () {
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const pass = document.getElementById("login-pass").value;
    const users = getUsers();
    if (!users[email]) return alert("No account found. Please sign up.");
    if (users[email].pass !== pass) return alert("Incorrect password.");
    setCurrentUser(email);
    showPage("tasks");
    loadTasks();
  };

  window.logout = function () {
    setCurrentUser(null);
    showPage("login");
    taskList.innerHTML = "";
    newTaskInput.value = "";
  };

  // ======= Account management =======
  window.changeEmail = function () {
    const cur = getCurrentUser();
    if (!cur) return requireAuthThen("account");
    const newEmail = document.getElementById("newEmail").value.trim().toLowerCase();
    if (!newEmail) return alert("Enter a new email.");
    const users = getUsers();
    if (users[newEmail] && newEmail !== cur) return alert("That email is already taken.");

    // move user
    users[newEmail] = { ...users[cur], email: newEmail };
    delete users[cur];
    saveUsers(users);

    // move data
    const data = getData();
    if (data[cur]) {
      data[newEmail] = data[cur];
      delete data[cur];
      saveData(data);
    }
    setCurrentUser(newEmail);
    alert("Email updated.");
  };

  window.changePassword = function () {
    const cur = getCurrentUser();
    if (!cur) return requireAuthThen("account");
    const p1 = document.getElementById("newPass").value;
    const p2 = document.getElementById("repeatPass").value;
    if (!p1) return alert("Enter a new password.");
    if (p1 !== p2) return alert("Passwords do not match.");
    const users = getUsers();
    users[cur].pass = p1;
    saveUsers(users);
    alert("Password updated.");
  };

  window.deleteAccount = function () {
    const cur = getCurrentUser();
    if (!cur) return requireAuthThen("account");
    if (!confirm("Delete your account and all your tasks? This cannot be undone.")) return;
    const users = getUsers();
    delete users[cur];
    saveUsers(users);
    const data = getData();
    delete data[cur];
    saveData(data);
    setCurrentUser(null);
    showPage("signup");
    taskList.innerHTML = "";
    alert("Account deleted.");
  };

  // ======= Tasks =======
  function loadTasks() {
    const cur = getCurrentUser();
    if (!cur) return;
    taskList.innerHTML = "";
    const data = getData();
    const tasks = (data[cur] && data[cur].tasks) ? data[cur].tasks : [];
    tasks.forEach(t => addTask(t.text, t.color));
    enableDragAndDrop(); // re-enable after rebuild
  }

  function saveTasks() {
    const cur = getCurrentUser();
    if (!cur) return;
    const tasks = Array.from(taskList.querySelectorAll(".task")).map(li => ({
      text: li.querySelector(".text").textContent,
      color: li.style.background || colors[0]
    }));
    const data = getData();
    if (!data[cur]) data[cur] = { tasks: [] };
    data[cur].tasks = tasks;
    saveData(data);
  }

  addBtn?.addEventListener("click", () => {
    if (newTaskInput.value.trim() !== "") {
      addTask(newTaskInput.value.trim());
      newTaskInput.value = "";
      saveTasks();
    }
  });

  function addTask(text, color) {
    const li = document.createElement("li");
    li.className = "task";
    li.draggable = true;
    li.style.background = color || colors[Math.floor(Math.random() * colors.length)];

    const dragBtn = document.createElement("button");
    dragBtn.textContent = "DRAG";
    dragBtn.className = "btn drag-btn";

    const span = document.createElement("span");
    span.className = "text";
    span.textContent = text;

    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.className = "btn delete-btn";
    delBtn.addEventListener("click", () => {
      li.remove();
      saveTasks();
    });

    li.appendChild(dragBtn);
    li.appendChild(span);
    li.appendChild(delBtn);
    taskList.appendChild(li);
  }

  // Drag & drop reordering
  function enableDragAndDrop() {
    const tasks = taskList.querySelectorAll(".task");
    tasks.forEach(task => {
      task.addEventListener("dragstart", () => task.classList.add("dragging"));
      task.addEventListener("dragend", () => {
        task.classList.remove("dragging");
        saveTasks();
      });
    });

    taskList.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(taskList, e.clientY);
      const draggable = document.querySelector(".task.dragging");
      if (!draggable) return;
      if (afterElement == null) {
        taskList.appendChild(draggable);
      } else {
        taskList.insertBefore(draggable, afterElement);
      }
    });
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".task:not(.dragging)")];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // ======= Initial load =======
  window.addEventListener("load", () => {
    // Decide start page: if users exist, show login, else show signup
    const hasAnyUser = Object.keys(getUsers()).length > 0;
    const cur = getCurrentUser();
    if (cur) {
      showPage("tasks");
      loadTasks();
    } else {
      showPage(hasAnyUser ? "login" : "signup");
    }
  });
})();