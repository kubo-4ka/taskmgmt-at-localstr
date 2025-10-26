// === 設定 ===
const LS_KEY = 'ls-tasks-v1';

// === 状態 ===
let tasks = []; // {id, title, done, createdAt}
let currentFilter = 'all'; // 'all' | 'active' | 'done'

// === 要素参照 ===
const inputEl = document.getElementById('newTaskInput');
const addBtn = document.getElementById('addBtn');
const taskListEl = document.getElementById('taskList');
const clearDoneBtn = document.getElementById('clearDoneBtn');
const leftCountEl = document.getElementById('leftCount');
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));

// === ユーティリティ ===
function uid() {
    // Date.now + ランダム 4桁
    return `${Date.now().toString(36)}-${Math.floor(Math.random()*1e4).toString(36)}`;
}
function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(tasks));
}
function load() {
    try{
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }catch(e){
        console.warn('localStorage parse error:', e);
        return [];
    }
}
function applyFilter(list, filter) {
    switch(filter){
        case 'active': return list.filter(t => !t.done);
        case 'done':   return list.filter(t =>  t.done);
        default:       return list;
    }
}
function updateLeftCount() {
    const left = tasks.filter(t => !t.done).length;
    leftCountEl.textContent = String(left);
}

// === 描画 ===
function render() {
    taskListEl.innerHTML = '';
    const visible = applyFilter(tasks, currentFilter);

    for (const t of visible) {
        const li = document.createElement('li');
        li.className = `task-item${t.done ? ' done' : ''}`;
        li.dataset.id = t.id;

        // 左: 完了トグル
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = t.done;
        toggle.ariaLabel = '完了';
        toggle.addEventListener('change', () => {
            t.done = toggle.checked;
            save();
            render();
        });
        const left = document.createElement('div');
        left.className = 'task-left';
        left.appendChild(toggle);

        // 中央: タイトル（ダブルクリックで編集）
        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = t.title;
        title.title = t.title;
        title.addEventListener('dblclick', () => inlineEdit(t.id, title));

        // 右: アクション
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'icon-btn';
        editBtn.title = '編集';
        editBtn.textContent = '🖊';
        editBtn.addEventListener('click', () => inlineEdit(t.id, title));

        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn';
        delBtn.title = '削除';
        delBtn.textContent = '🗑';
        delBtn.addEventListener('click', () => {
            tasks = tasks.filter(x => x.id !== t.id);
            save();
            render();
        });

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        li.appendChild(left);
        li.appendChild(title);
        li.appendChild(actions);

        taskListEl.appendChild(li);
    }

    updateLeftCount();
}

function inlineEdit(id, titleEl){
    const current = tasks.find(t => t.id === id);
    if(!current) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = current.title;
    input.className = 'edit-input';
    input.style.width = '100%';
    input.addEventListener('keydown', (e) => {
        if(e.key === 'Enter'){
            commit();
        } else if(e.key === 'Escape'){
            cancel();
        }
    });
    input.addEventListener('blur', commit);

    function commit(){
        const v = input.value.trim();
        if(v){
            current.title = v;
            save();
        }
        render();
    }
    function cancel(){
        render();
    }

    titleEl.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
}

// === イベント ===
addBtn.addEventListener('click', onAdd);
inputEl.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') onAdd();
});
function onAdd(){
    const v = inputEl.value.trim();
    if(!v) return;
    tasks.unshift({
        id: uid(),
        title: v,
        done: false,
        createdAt: Date.now()
    });
    inputEl.value = '';
    save();
    render();
}

clearDoneBtn.addEventListener('click', () => {
    if(!tasks.some(t => t.done)) return;
    if(!confirm('完了タスクをすべて削除します。よろしいですか？')) return;
    tasks = tasks.filter(t => !t.done);
    save();
    render();
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => {
            b.classList.toggle('active', b === btn);
            b.setAttribute('aria-selected', String(b === btn));
        });
        currentFilter = btn.dataset.filter;
        render();
    });
});

// === 初期化 ===
(function init(){
    tasks = load();
    render();
    // PWA 風に入力へフォーカス（スマホは避ける）
    if(window.matchMedia('(pointer: fine)').matches){
        inputEl.focus();
    }
})();
