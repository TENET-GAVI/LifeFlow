(() => {
  const CURRENT_USER_KEY = "lifeflow.currentUser.v1";
  const USER_PREFIX = "lifeflow.user.";
  const today = dateKey();

  const habitMeta = {
    sleep: { label: "作息", color: "var(--mint)", icon: "i-moon" },
    study: { label: "学习", color: "var(--sky)", icon: "i-book" },
    body: { label: "身体", color: "var(--coral)", icon: "i-dumbbell" },
    mind: { label: "情绪", color: "var(--gold)", icon: "i-pen" },
    space: { label: "环境", color: "var(--leaf)", icon: "i-check" },
  };

  const defaultHabits = [
    { id: "sleep", title: "固定睡眠窗口", category: "sleep", target: "23:30", time: "晚上", streak: 0, stability: 0, done: false },
    { id: "english", title: "英语输入", category: "study", target: "45 分钟", time: "上午", streak: 0, stability: 0, done: false },
    { id: "move", title: "身体唤醒", category: "body", target: "20 分钟", time: "傍晚", streak: 0, stability: 0, done: false },
    { id: "journal", title: "晚间复盘", category: "mind", target: "3 分钟", time: "睡前", streak: 0, stability: 0, done: false },
    { id: "room", title: "环境归位", category: "space", target: "10 分钟", time: "晚上", streak: 0, stability: 0, done: false },
  ];

  let currentUser = loadCurrentUser();
  let state = loadState();

  function dateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateLabel(key) {
    const [, month, day] = key.split("-");
    return `${Number(month)}/${Number(day)}`;
  }

  function weekdayLabel(date = new Date()) {
    return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
  }

  function normalizeUserName(name) {
    return name.trim().replace(/\s+/g, "-").slice(0, 24);
  }

  function userStorageKey(user = currentUser) {
    const slug = (user?.name || "guest").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5_-]/g, "-");
    return `${USER_PREFIX}${slug}`;
  }

  function loadCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
    } catch {
      return null;
    }
  }

  function defaultState() {
    return {
      activeDate: today,
      habits: defaultHabits.map((habit) => ({ ...habit })),
      reviewByDate: {},
      records: {},
    };
  }

  function loadState() {
    if (!currentUser) return defaultState();
    try {
      const loaded = JSON.parse(localStorage.getItem(userStorageKey()) || "null") || defaultState();
      const next = {
        ...defaultState(),
        ...loaded,
        habits: Array.isArray(loaded.habits) ? loaded.habits : defaultState().habits,
        reviewByDate: loaded.reviewByDate || {},
        records: loaded.records || {},
      };
      if (next.activeDate !== today) {
        next.activeDate = today;
        next.habits = next.habits.map((habit) => ({ ...habit, done: false }));
      }
      return next;
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    if (!currentUser) return;
    state.records[today] = buildDailyRecord();
    localStorage.setItem(userStorageKey(), JSON.stringify(state));
  }

  function icon(name) {
    return `<svg><use href="#${name}"></use></svg>`;
  }

  function getHabitMeta(habit) {
    return habitMeta[habit.category] || habitMeta.study;
  }

  function getTodayReview() {
    if (!state.reviewByDate[today]) {
      state.reviewByDate[today] = {
        mood: "平稳",
        events: "",
        study: "",
        improvements: "",
        tomorrow: "",
      };
    }
    return state.reviewByDate[today];
  }

  function buildDailyRecord() {
    const review = getTodayReview();
    const done = state.habits.filter((habit) => habit.done).length;
    const total = state.habits.length;
    return {
      date: today,
      done,
      total,
      percent: total ? Math.round((done / total) * 100) : 0,
      mood: review.mood,
      events: review.events,
      study: review.study,
      improvements: review.improvements,
      tomorrow: review.tomorrow,
      reviewSaved: Boolean(review.events || review.study || review.improvements || review.tomorrow),
      habits: state.habits.map((habit) => ({ id: habit.id, title: habit.title, done: habit.done })),
      updatedAt: new Date().toISOString(),
    };
  }

  function recordList() {
    return Object.values(state.records || {}).sort((a, b) => a.date.localeCompare(b.date));
  }

  function updateHeader() {
    const dateNode = document.querySelector(".date");
    if (dateNode) {
      const now = new Date();
      dateNode.textContent = `${now.getMonth() + 1} 月 ${now.getDate()} 日 ${weekdayLabel(now)}`;
    }
    const userButton = document.getElementById("currentUserButton");
    if (userButton) userButton.textContent = currentUser ? currentUser.name : "未登录";
  }

  function updateProgress() {
    const done = state.habits.filter((habit) => habit.done).length;
    const value = state.habits.length ? Math.round((done / state.habits.length) * 100) : 0;
    document.getElementById("progressText").textContent = `${value}%`;
    document.getElementById("progressHint").textContent = `${done} / ${state.habits.length} 个习惯已完成`;
    document.getElementById("ringText").textContent = value;
    document.getElementById("progressRing").style.setProperty("--angle", `${value * 3.6}deg`);
  }

  function toggleHabit(id) {
    state.habits = state.habits.map((habit) => (habit.id === id ? { ...habit, done: !habit.done } : habit));
    saveState();
    renderAll();
  }

  function renderHabits() {
    const todayContainer = document.getElementById("todayHabits");
    todayContainer.querySelectorAll(".habit-row").forEach((node) => node.remove());
    state.habits.slice(0, 4).forEach((habit) => {
      const meta = getHabitMeta(habit);
      const row = document.createElement("button");
      row.className = `habit-row ${habit.done ? "done" : ""}`;
      row.innerHTML = `
        <span class="habit-icon" style="background:${meta.color}">${icon(meta.icon)}</span>
        <span class="habit-copy"><strong>${habit.title}</strong><small>${habit.time} · ${habit.target}</small></span>
        <span class="check">${icon(habit.done ? "i-check" : "i-circle")}</span>
      `;
      row.addEventListener("click", () => toggleHabit(habit.id));
      todayContainer.appendChild(row);
    });

    const cards = document.getElementById("habitCards");
    cards.innerHTML = "";
    state.habits.forEach((habit) => {
      const meta = getHabitMeta(habit);
      const card = document.createElement("article");
      card.className = "habit-card";
      card.innerHTML = `
        <div class="habit-card-top">
          <span class="habit-icon" style="background:${meta.color}">${icon(meta.icon)}</span>
          <button class="check ${habit.done ? "done" : ""}" aria-label="切换${habit.title}">${icon(habit.done ? "i-check" : "i-circle")}</button>
        </div>
        <strong>${habit.title}</strong>
        <p>${habit.time} · 目标 ${habit.target}</p>
        <div class="stability"><div style="width:${habit.stability || 0}%;background:${meta.color}"></div></div>
        <small>${habit.stability || 0}% 稳定度 · 今日${habit.done ? "已完成" : "未完成"}</small>
      `;
      card.querySelector("button").addEventListener("click", () => toggleHabit(habit.id));
      cards.appendChild(card);
    });
  }

  function renderReview() {
    const review = getTodayReview();
    const reviewView = document.querySelector('[data-view="review"]');
    reviewView.innerHTML = `
      <article class="review-card">
        <p class="eyebrow">每日总结 · ${today}</p>
        <h3>今天整体状态如何？</h3>
        <div class="mood-grid">
          ${["疲惫", "平稳", "专注", "松弛"].map((mood) => `<button class="mood-button ${review.mood === mood ? "active" : ""}" data-mood="${mood}">${mood}</button>`).join("")}
        </div>
      </article>
      <article class="review-card">
        <h3>今天发生的事情</h3>
        <textarea data-review-field="events" placeholder="把今天发生的关键事情说出来。">${review.events || ""}</textarea>
      </article>
      <article class="review-card">
        <h3>学习进度</h3>
        <textarea data-review-field="study" placeholder="例如：英语听力 30 分钟，完成第 2 章复述。">${review.study || ""}</textarea>
      </article>
      <article class="review-card">
        <h3>需要改进的地方</h3>
        <textarea data-review-field="improvements" placeholder="例如：下午刷手机太久，运动时间被挤掉。">${review.improvements || ""}</textarea>
      </article>
      <article class="review-card">
        <h3>明天如何调整</h3>
        <textarea data-review-field="tomorrow" placeholder="例如：先学习再娱乐，晚饭后立刻运动。">${review.tomorrow || ""}</textarea>
      </article>
      <button class="primary-action" id="saveReviewPage">保存今日总结</button>
    `;

    reviewView.querySelectorAll(".mood-button").forEach((button) => {
      button.addEventListener("click", () => {
        review.mood = button.dataset.mood;
        saveState();
        renderReview();
        renderTrends();
      });
    });
    reviewView.querySelectorAll("[data-review-field]").forEach((textarea) => {
      textarea.addEventListener("input", () => {
        review[textarea.dataset.reviewField] = textarea.value;
        saveState();
      });
    });
    reviewView.querySelector("#saveReviewPage").addEventListener("click", () => {
      saveState();
      activateTab("trends");
    });
  }

  function renderReviewSheet() {
    const review = getTodayReview();
    const panel = document.querySelector("#sheet .sheet-panel");
    panel.innerHTML = `
      <div class="handle"></div>
      <article class="review-card">
        <p class="eyebrow">快速总结 · ${today}</p>
        <h3>今天发生的事情</h3>
        <textarea data-review-field="events" placeholder="先记录今天最重要的事。">${review.events || ""}</textarea>
      </article>
      <article class="review-card" style="margin-top:10px">
        <h3>学习进度</h3>
        <textarea data-review-field="study" placeholder="今天学了什么，进度到哪里。">${review.study || ""}</textarea>
      </article>
      <article class="review-card" style="margin-top:10px">
        <h3>明天如何调整</h3>
        <textarea data-review-field="tomorrow" placeholder="基于今天的总结，明天怎么改。">${review.tomorrow || ""}</textarea>
      </article>
      <button class="primary-action" id="saveReview">保存今天</button>
    `;
    panel.querySelectorAll("[data-review-field]").forEach((textarea) => {
      textarea.addEventListener("input", () => {
        review[textarea.dataset.reviewField] = textarea.value;
        saveState();
      });
    });
    panel.querySelector("#saveReview").addEventListener("click", () => {
      saveState();
      closeSheet("sheet");
      activateTab("trends");
    });
  }

  function renderTrends() {
    const records = recordList();
    const recent = records.slice(-7);
    const average = recent.length ? Math.round(recent.reduce((sum, record) => sum + record.percent, 0) / recent.length) : 0;
    const reviewed = recent.filter((record) => record.reviewSaved).length;
    const latest = recent[recent.length - 1];
    const trendView = document.querySelector('[data-view="trends"]');
    trendView.innerHTML = `
      <article class="trend-summary">
        <div>
          <p class="eyebrow">真实记录 · ${records.length} 天</p>
          <h3>${records.length ? "按你的总结调整" : "还没有记录"}</h3>
          <span>${latest ? `${latest.date} 完成率 ${latest.percent}%，${latest.reviewSaved ? "已写总结" : "未写总结"}。` : "保存一次今日总结后，这里会开始生成趋势。"}</span>
        </div>
        ${icon("i-spark")}
      </article>
      <article class="chart-card">
        <div class="section-title">
          <div>${icon("i-line")}<h3>最近 7 天完成率</h3></div>
          <button>真实</button>
        </div>
        ${recent.length ? `<div class="bar-chart">${recent.map((record) => `
          <div class="bar-col"><div style="height:${Math.max(record.percent, 6)}%"></div><span>${dateLabel(record.date)}</span></div>
        `).join("")}</div>` : `<div class="empty-state">暂无趋势数据。每天保存总结后，会按日期生成一条记录。</div>`}
      </article>
      <div class="metric-grid">
        <article class="metric-card"><span>记录天数</span><strong>${records.length}</strong><small>按日期保存</small></article>
        <article class="metric-card"><span>7 日均值</span><strong>${average}</strong><small>真实完成率</small></article>
        <article class="metric-card"><span>总结天数</span><strong>${reviewed}</strong><small>最近 7 天</small></article>
        <article class="metric-card"><span>今日完成</span><strong>${latest && latest.date === today ? latest.done : state.habits.filter((h) => h.done).length}</strong><small>${state.habits.length} 个任务</small></article>
      </div>
      <article class="chart-card">
        <div class="section-title">
          <div>${icon("i-pen")}<h3>每日总结记录</h3></div>
          <button>${today}</button>
        </div>
        <div class="record-list">
          ${records.length ? records.slice().reverse().map((record) => `
            <div class="record-row">
              <div><strong>${record.date}</strong><br><span>${record.mood || "未选择状态"} · ${record.done}/${record.total} 完成 · ${record.reviewSaved ? "已总结" : "未总结"}</span></div>
              <span>${record.percent}%</span>
            </div>
          `).join("") : `<div class="empty-state">今天先去复盘页保存一次总结。</div>`}
        </div>
      </article>
    `;
  }

  function addHabit() {
    const title = document.getElementById("newHabitTitle").value.trim();
    if (!title) return;
    const category = document.getElementById("newHabitCategory").value;
    const target = document.getElementById("newHabitTarget").value.trim() || "1 次";
    const time = document.getElementById("newHabitTime").value.trim() || "今天";
    state.habits.push({
      id: `habit-${Date.now()}`,
      title,
      category,
      target,
      time,
      streak: 0,
      stability: 0,
      done: false,
    });
    document.getElementById("newHabitTitle").value = "";
    document.getElementById("newHabitTarget").value = "";
    document.getElementById("newHabitTime").value = "";
    saveState();
    closeSheet("newHabitSheet");
    renderAll();
    activateTab("habits");
  }

  function openSheet(id) {
    if (id === "sheet") renderReviewSheet();
    document.getElementById(id).classList.add("open");
  }

  function closeSheet(id) {
    document.getElementById(id).classList.remove("open");
  }

  function activateTab(tab) {
    document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.dataset.view === tab));
    document.querySelectorAll(".tab-bar button").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
    document.querySelector(".content").scrollTo({ top: 0 });
    if (tab === "review") renderReview();
    if (tab === "trends") renderTrends();
  }

  function renderAll() {
    updateHeader();
    updateProgress();
    renderHabits();
    renderReview();
    renderTrends();
  }

  function showLogin() {
    document.getElementById("loginScreen").classList.add("open");
  }

  function hideLogin() {
    document.getElementById("loginScreen").classList.remove("open");
  }

  function bindEvents() {
    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.onclick = () => activateTab(button.dataset.tab);
    });
    document.querySelectorAll("[data-tab-target]").forEach((button) => {
      button.onclick = () => activateTab(button.dataset.tabTarget);
    });
    document.getElementById("openSheet").onclick = () => openSheet("sheet");
    document.getElementById("closeSheet").onclick = () => closeSheet("sheet");
    document.getElementById("openNewHabit").onclick = () => openSheet("newHabitSheet");
    document.getElementById("closeNewHabit").onclick = () => closeSheet("newHabitSheet");
    document.getElementById("saveNewHabit").onclick = addHabit;
    document.getElementById("currentUserButton").onclick = showLogin;
    document.getElementById("loginForm").onsubmit = (event) => {
      event.preventDefault();
      const name = normalizeUserName(document.getElementById("loginName").value);
      if (!name) return;
      currentUser = { name, signedInAt: new Date().toISOString() };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      state = loadState();
      hideLogin();
      renderAll();
    };
  }

  bindEvents();
  if (!currentUser) {
    showLogin();
  } else {
    renderAll();
  }

  window.renderTrends = renderTrends;
})();
