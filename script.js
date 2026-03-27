const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const taskCount = document.getElementById('taskCount');
const completedCount = document.getElementById('completedCount');
const aiHint = document.getElementById('aiHint');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const polishBtn = document.getElementById('polishBtn');

function updateEmptyState() {
  emptyState.style.display = taskList.children.length === 0 ? 'block' : 'none';
}

function updateTaskStats() {
  const all = taskList.children.length;
  const done = [...taskList.children].filter((item) => item.querySelector('input[type="checkbox"]').checked).length;
  taskCount.textContent = `Tasks: ${all}`;
  completedCount.textContent = `Completed: ${done}`;
  aiHint.textContent = done === all && all > 0 ? 'AI: Good progress, keep momentum!' : 'AI: Suggestions ready';
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }

  const li = document.createElement('li');
  li.className = 'task-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.addEventListener('change', () => toggleTask(li, checkbox));

  const span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = text;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => deleteTask(li));

  li.append(checkbox, span, deleteBtn);
  taskList.appendChild(li);

  taskInput.value = '';
  taskInput.focus();

  saveTasks();
  updateEmptyState();
  updateTaskStats();
}

function deleteTask(taskElement) {
  taskElement.style.animation = 'slide-out 220ms ease forwards';
  taskElement.addEventListener('animationend', () => {
    taskElement.remove();
    saveTasks();
    updateEmptyState();
    updateTaskStats();
  }, { once: true });
}

function toggleTask(taskElement, checkbox) {
  const textNode = taskElement.querySelector('.task-text');
  if (checkbox.checked) {
    textNode.classList.add('completed');
  } else {
    textNode.classList.remove('completed');
  }
  saveTasks();
  updateTaskStats();
}

function saveTasks() {
  const taskData = [];
  for (const item of taskList.children) {
    const text = item.querySelector('.task-text').textContent;
    const completed = item.querySelector('input[type="checkbox"]').checked;
    taskData.push({ text, completed });
  }
  localStorage.setItem('tasks', JSON.stringify(taskData));
}

function clearCompletedTasks() {
  const completed = [...taskList.children].filter((item) => item.querySelector('input[type="checkbox"]').checked);
  if (completed.length === 0) {
    setStatus('No completed tasks to clear.', 'error');
    return;
  }
  completed.forEach((item) => item.remove());
  saveTasks();
  updateEmptyState();
  updateTaskStats();
  setStatus(`${completed.length} completed task(s) cleared.`, 'success');
}

function clearAllTasks() {
  if (taskList.children.length === 0) {
    setStatus('No tasks to clear right now.', 'error');
    return;
  }
  taskList.innerHTML = '';
  saveTasks();
  updateEmptyState();
  updateTaskStats();
  setStatus('All tasks cleared. Fresh slate!', 'success');
}

function loadTasks() {
  const saved = localStorage.getItem('tasks');
  if (!saved) return;

  try {
    const taskData = JSON.parse(saved);
    taskData.forEach(({ text, completed }) => {
      taskInput.value = text;
      addTask();
      if (completed) {
        const newest = taskList.lastElementChild;
        const cb = newest.querySelector('input[type="checkbox"]');
        cb.checked = true;
        toggleTask(newest, cb);
      }
    });
  } catch (e) {
    console.error('Could not parse tasks', e);
  }
}

const statusMessage = document.getElementById('statusMessage');

const setStatus = (text, type = 'loading') => {
  if (!statusMessage) return;
  statusMessage.textContent = text;
  statusMessage.className = `status-message ${type}`;
};

const clearStatus = () => {
  if (!statusMessage) return;
  statusMessage.textContent = '';
  statusMessage.className = 'status-message';
};

const setLoading = (isLoading) => {
  document.getElementById('suggestBtn').disabled = isLoading;
  document.getElementById('summarizeBtn').disabled = isLoading;
  document.getElementById('addTaskBtn').disabled = isLoading;
};

const actionVerbs = ['Finish', 'Implement', 'Design', 'Refactor', 'Validate', 'Prepare', 'Review', 'Research', 'Finalize'];

const extractCore = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const cleaned = trimmed.replace(/[.,!?]/g, '').replace(/\s+/g, ' ');
  const words = cleaned.split(' ');

  if (words.length <= 6) return cleaned;

  const anchor = words.findIndex((w) => /^(create|build|finish|fix|update|implement|design|review|ship|test)/i.test(w));
  if (anchor >= 0) {
    return words.slice(anchor).join(' ');
  }

  return words.slice(0, 6).join(' ');
};

const buildSuggestion = (input) => {
  const trimmed = input.trim();
  if (!trimmed) return 'Set a clear, achievable goal before asking for a suggestion.';

  const core = extractCore(trimmed);
  const verb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
  const timeframe = ['today', 'by end of day', 'this week', 'by Friday'][Math.floor(Math.random() * 4)];

  let suggestion = `${verb.toLowerCase()} ${core}`;
  if (!/\b(by|during|with|for|to)\b/i.test(suggestion)) {
    suggestion += ` with measurable progress ${timeframe}`;
  }

  return `${suggestion}. Set a success criterion and a clear next step.`;
};

const buildSummary = (task) => {
  const trimmed = task.trim();
  if (!trimmed) return 'Provide a task text to summarize.';

  const sentences = trimmed.split(/(?<=[.?!])\s+/);
  const keySentence = sentences.find((s) => s.length > 15) || sentences[0] || trimmed;
  const main = keySentence.length <= 80 ? keySentence : `${keySentence.slice(0, 78).trim()}...`;

  const core = extractCore(trimmed);
  if (trimmed.length < 70) {
    return `Summary: ${main}`;
  }

  return `Summary: ${main}. Key focus: ${core || 'define main goal'}.`;
};

const enhanceText = (text) => {
  const input = text.trim();
  if (!input) return 'Add a concise task before polishing.';

  const sanitized = input.replace(/\s+/g, ' ').trim();
  const hasAction = /\b(create|build|fix|design|review|test|deploy|document|plan)\b/i.test(sanitized);
  const prefix = hasAction ? 'Refine: ' : 'Action: ';
  const nextStep = hasAction ? 'Next, break it into a subtask and estimate time.' : 'Start by adding a clear verb and measurable outcome.';

  return `${prefix}${sanitized.charAt(0).toUpperCase() + sanitized.slice(1)}. ${nextStep}`;
};

async function polishTask() {
  const inputValue = taskInput.value.trim();
  if (!inputValue) {
    setStatus('Enter a task to polish first.', 'error');
    return;
  }

  setLoading(true);
  setStatus('Polishing task with AI...', 'loading');

  try {
    const res = await fetch('http://localhost:3000/polish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: inputValue }),
    });

    if (!res.ok) throw new Error(`status ${res.status}`);

    const data = await res.json();
    taskInput.value = data?.result || enhanceText(inputValue);
    setStatus('AI polish applied. Nice!', 'success');
  } catch (error) {
    console.warn('AI polish failed, using local fallback', error);
    taskInput.value = enhanceText(inputValue);
    setStatus('AI polish unavailable, local polish now set.', 'error');
  } finally {
    setLoading(false);
    setTimeout(clearStatus, 3200);
  }
}

async function getSuggestion() {
  const inputValue = taskInput.value.trim();
  if (!inputValue) {
    setStatus('Please enter a task before requesting a suggestion.', 'error');
    return;
  }

  setLoading(true);
  setStatus('Generating suggestion from AI...', 'loading');

  try {
    const res = await fetch('http://localhost:3000/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: inputValue }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);

    const data = await res.json();
    taskInput.value = data?.result || buildSuggestion(inputValue);
    setStatus('AI suggestion applied! Try adding or editing it.', 'success');
  } catch (error) {
    console.warn('AI suggest failed, using local fallback', error);
    taskInput.value = buildSuggestion(inputValue);
    setStatus('AI suggestion service unavailable—local suggestion applied.', 'error');
  } finally {
    setLoading(false);
    setTimeout(clearStatus, 3200);
  }
}

async function summarizeTask() {
  const inputValue = taskInput.value.trim();
  if (!inputValue) {
    setStatus('Please enter a task before requesting summary.', 'error');
    return;
  }

  setLoading(true);
  setStatus('Generating summary from AI...', 'loading');

  try {
    const res = await fetch('http://localhost:3000/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: inputValue }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);

    const data = await res.json();
    taskInput.value = data?.result || buildSummary(inputValue);
    setStatus('AI summarization applied successfully.', 'success');
  } catch (error) {
    console.warn('AI summarize failed, using local fallback', error);
    taskInput.value = buildSummary(inputValue);
    setStatus('AI summarization failed—local summary used.', 'error');
  } finally {
    setLoading(false);
    setTimeout(clearStatus, 3200);
  }
}

window.onload = () => {
  loadTasks();
  updateEmptyState();
  updateTaskStats();

  document.getElementById('addTaskBtn').addEventListener('click', addTask);
  document.getElementById('suggestBtn').addEventListener('click', getSuggestion);
  document.getElementById('summarizeBtn').addEventListener('click', summarizeTask);
  document.getElementById('polishBtn').addEventListener('click', polishTask);
  document.getElementById('clearCompletedBtn').addEventListener('click', clearCompletedTasks);
  document.getElementById('clearAllBtn').addEventListener('click', clearAllTasks);

  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });
};