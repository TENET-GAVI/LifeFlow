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
    const reflection = review.aiReflection || generateReflection(review, done, total);
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
      reflection,
      reflectionSource: review.aiReflection ? "ai" : "local",
      reviewSaved: Boolean(review.events || review.study || review.improvements || review.tomorrow),
      habits: state.habits.map((habit) => ({ id: habit.id, title: habit.title, done: habit.done })),
      updatedAt: new Date().toISOString(),
    };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function sentenceFromList(items, fallback) {
    if (!items.length) return fallback;
    if (items.length === 1) return items[0];
    return `${items.slice(0, -1).join("、")}和${items[items.length - 1]}`;
  }

  function extractStudySignal(text) {
    const value = (text || "").trim();
    if (!value) return "今天还没有写学习进度，明天可以把学习内容、时长和卡住的点记录下来。";
    if (/复述|输出|总结|题|练习|背|听力|阅读|英语|单词|课程|章节|分钟|小时/.test(value)) {
      return `你的学习记录里已经出现了具体动作：${value} 这说明学习不是停留在“想学”，而是有可观察的推进。`;
    }
    return `你记录了学习相关内容：${value}。明天可以再补上“学了多久、完成到哪里、哪里卡住”。`;
  }

  function generateReflection(review, done, total) {
    const completed = state.habits.filter((habit) => habit.done).map((habit) => habit.title);
    const missed = state.habits.filter((habit) => !habit.done).map((habit) => habit.title);
    const percent = total ? Math.round((done / total) * 100) : 0;
    const gains = [];
    const better = [];
    const upgrades = [];
    const tomorrowPlan = [];

    if (done > 0) {
      gains.push(`你今天完成了 ${sentenceFromList(completed.slice(0, 3), "一些任务")}，获得的是对自己节奏的掌控感，而不只是打卡数字。`);
    } else {
      gains.push("你今天至少完成了记录这件事，这能帮你看清真实状态，是重建节律的起点。");
    }

    if (percent >= 80) {
      gains.push("今天完成率很高，说明任务强度和时间安排基本匹配，可以继续保持这个节奏。");
    } else if (percent >= 50) {
      gains.push("今天完成了一半以上，说明你已经有可延续的行动基础，下一步是减少中途被打断。");
    } else {
      better.push("今天完成率偏低，明天不要急着加任务，先把最重要的一件事做稳。");
    }

    if (review.events) {
      gains.push(`从你记录的事情看，今天的关键经历是：${review.events}`);
    }

    if (missed.length) {
      better.push(`未完成的 ${sentenceFromList(missed.slice(0, 3), "任务")} 可以作为明天调整的线索，不需要责备，只需要找原因。`);
    } else {
      better.push("今天没有明显未完成项，明天要注意不要因为状态好就过度加码。");
    }

    if (review.improvements) {
      upgrades.push(`你自己提到的改进点是：${review.improvements}`);
    } else {
      upgrades.push("今天还没有写改进点。明天复盘时可以问自己：哪个时间段最容易失控？哪件事最值得提前安排？");
    }

    upgrades.push(extractStudySignal(review.study));

    if (review.tomorrow) {
      tomorrowPlan.push(`优先执行你写下的调整：${review.tomorrow}`);
    } else if (missed.length) {
      tomorrowPlan.push(`明天先处理 ${missed[0]}，把它放到最不容易被打断的时间段。`);
    } else {
      tomorrowPlan.push("明天保持今天的基础节奏，只新增一个很小的优化动作。");
    }

    const studyHabit = state.habits.find((habit) => /学习|英语|阅读|单词|study|english/i.test(habit.title));
    if (studyHabit && !studyHabit.done) {
      tomorrowPlan.push(`学习任务“${studyHabit.title}”明天建议提前到上午或第一个高精力时段。`);
    }

    return { gains, better, upgrades, tomorrowPlan };
  }

  function renderReflectionCard(reflection) {
    const safeReflection = reflection || generateReflection(getTodayReview(), state.habits.filter((habit) => habit.done).length, state.habits.length);
    const sections = [
      ["今天获得了什么", safeReflection.gains || []],
      ["可以做得更好", safeReflection.better || []],
      ["你可以提升的地方", safeReflection.upgrades || []],
      ["明天建议这样做", safeReflection.tomorrowPlan || []],
    ];
    return `
      <article class="review-card">
        <p class="eyebrow">${getTodayReview().aiReflection ? "DeepSeek AI 思考" : "LifeFlow 本地思考"}</p>
        <h3>根据今天的总结给你的建议</h3>
        <div class="record-list">
          ${sections.map(([title, items]) => `
            <div class="record-row" style="grid-template-columns:1fr">
              <div><strong>${title}</strong><br><span>${items.map(escapeHtml).join("<br>")}</span></div>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }

  function normalizeReflection(value) {
    const fallback = generateReflection(getTodayReview(), state.habits.filter((habit) => habit.done).length, state.habits.length);
    return {
      gains: Array.isArray(value?.gains) && value.gains.length ? value.gains : fallback.gains,
      better: Array.isArray(value?.better) && value.better.length ? value.better : fallback.better,
      upgrades: Array.isArray(value?.upgrades) && value.upgrades.length ? value.upgrades : fallback.upgrades,
      tomorrowPlan: Array.isArray(value?.tomorrowPlan) && value.tomorrowPlan.length ? value.tomorrowPlan.slice(0, 3) : fallback.tomorrowPlan.slice(0, 3),
    };
  }

  async function analyzeTodayWithAI() {
    const review = getTodayReview();
    const payload = {
      date: today,
      review,
      habits: state.habits,
      todayRecord: buildDailyRecord(),
      recentRecords: recordList().slice(-7),
    };

    try {
      const response = await fetch("/api/analyze-day", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`AI request failed: ${response.status}`);
      const data = await response.json();
      review.aiReflection = normalizeReflection(data.reflection);
      review.aiModel = data.model || "deepseek";
      review.aiUpdatedAt = new Date().toISOString();
      saveState();
      return true;
    } catch (error) {
      review.aiReflection = normalizeReflection(null);
      review.aiModel = "local-fallback";
      review.aiError = error instanceof Error ? error.message : "AI request failed";
      saveState();
      return false;
    }
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
    const done = state.habits.filter((habit) => habit.done).length;
    const reflection = review.aiReflection || generateReflection(review, done, state.habits.length);
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
      ${renderReflectionCard(reflection)}
      <button class="primary-action" id="aiReviewPage">${review.aiReflection ? "重新生成 AI 建议" : "生成 AI 建议"}</button>
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
    reviewView.querySelector("#aiReviewPage").addEventListener("click", async () => {
      await analyzeTodayWithAI();
      renderReview();
      renderTrends();
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
    const screen = document.getElementById("loginScreen");
    const nameInput = document.getElementById("loginName");
    if (!screen) return;
    if (nameInput && currentUser?.name) nameInput.value = currentUser.name;
    screen.classList.add("open");
  }

  function hideLogin() {
    document.getElementById("loginScreen")?.classList.remove("open");
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
