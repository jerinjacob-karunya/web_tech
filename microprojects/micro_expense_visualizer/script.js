  //  ==========================================================================
  //  Storage: localStorage for users / session / profile / expenses.
  //  subscriptions.json is fetched read-only for Quick-Add presets.
  //  ==========================================================================

(function () {
  "use strict";

  // Constants
  const LS_USERS = "mev_users";
  const LS_SESSION = "mev_session";
  const PROFILE_PREFIX = "mev_profile_";
  const EXPENSES_PREFIX = "mev_expenses_";
  const DAYS_PER_MONTH = 30.44;
  const GROWTH_RATE = 0.07;

  const CATEGORIES = [
    "Subscriptions",
    "Food & Drink",
    "Housing",
    "Entertainment",
    "Software",
    "Lifestyle",
  ];

  const CATEGORY_VAR = {
    "Subscriptions": "--cat-subscriptions",
    "Food & Drink": "--cat-food",
    "Housing": "--cat-housing",
    "Entertainment": "--cat-entertainment",
    "Software": "--cat-software",
    "Lifestyle": "--cat-lifestyle",
  };

  const PROTECTED_NAV = ["dashboard", "add-expense", "analytics", "profile"];

  // Tiny helpers
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const currency = (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
      Number.isFinite(n) ? n : 0
    );

  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // NOTE: this is a lightweight client-side obfuscation, not real
  // cryptographic hashing. Fine for a local-storage demo; do not reuse
  // this pattern for a production auth system.
  function weakHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return "h" + h.toString(36) + btoa(unescape(encodeURIComponent(str))).slice(0, 12);
  }

  function categoryVar(cat) {
    return `var(${CATEGORY_VAR[cat] || "--ink-soft"})`;
  }

  // Storage layer
  const Store = {
    getUsers() {
      try {
        return JSON.parse(localStorage.getItem(LS_USERS)) || [];
      } catch (e) {
        return [];
      }
    },
    saveUsers(users) {
      localStorage.setItem(LS_USERS, JSON.stringify(users));
    },
    getSession() {
      try {
        return JSON.parse(localStorage.getItem(LS_SESSION));
      } catch (e) {
        return null;
      }
    },
    setSession(session) {
      localStorage.setItem(LS_SESSION, JSON.stringify(session));
    },
    clearSession() {
      localStorage.removeItem(LS_SESSION);
    },
    getProfile(userId) {
      try {
        return (
          JSON.parse(localStorage.getItem(PROFILE_PREFIX + userId)) || {
            salary: 0,
            budgetThreshold: 0,
            savingsGoal: 0,
          }
        );
      } catch (e) {
        return { salary: 0, budgetThreshold: 0, savingsGoal: 0 };
      }
    },
    saveProfile(userId, profile) {
      localStorage.setItem(PROFILE_PREFIX + userId, JSON.stringify(profile));
    },
    getExpenses(userId) {
      try {
        return JSON.parse(localStorage.getItem(EXPENSES_PREFIX + userId)) || [];
      } catch (e) {
        return [];
      }
    },
    saveExpenses(userId, expenses) {
      localStorage.setItem(EXPENSES_PREFIX + userId, JSON.stringify(expenses));
    },
  };

  // Finance calculations
  function monthlyCostOf(cost, frequency) {
    const c = Number(cost) || 0;
    return frequency === "daily" ? c * DAYS_PER_MONTH : c;
  }

  // Future value of a level monthly contribution, compounded monthly.
  function futureValueOfMonthly(monthlyPmt, years, annualRate) {
    const r = annualRate / 12;
    const n = years * 12;
    if (r === 0) return monthlyPmt * n;
    return monthlyPmt * ((Math.pow(1 + r, n) - 1) / r);
  }

  // Auth
  const Auth = {
    signup(name, email, password) {
      const users = Store.getUsers();
      const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) return { ok: false, error: "An account with that email already exists." };
      const user = { id: genId(), name, email, passwordHash: weakHash(password) };
      users.push(user);
      Store.saveUsers(users);
      Store.setSession({ userId: user.id, name: user.name, email: user.email });
      return { ok: true, user };
    },
    login(email, password) {
      const users = Store.getUsers();
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user || user.passwordHash !== weakHash(password)) {
        return { ok: false, error: "Incorrect email or password." };
      }
      Store.setSession({ userId: user.id, name: user.name, email: user.email });
      return { ok: true, user };
    },
    logout() {
      Store.clearSession();
      window.location.href = "index.html";
    },
    currentUser() {
      const session = Store.getSession();
      if (!session) return null;
      const users = Store.getUsers();
      return users.find((u) => u.id === session.userId) || null;
    },
  };

  function requireAuth() {
    const session = Store.getSession();
    if (!session) {
      window.location.href = "index.html?authRequired=1";
      return null;
    }
    return session;
  }

  // Shared chrome: header nav + account area + toast
  function renderHeaderChrome() {
    const page = document.body.dataset.page;
    const session = Store.getSession();

    $$(".nav-tabs a").forEach((a) => {
      const nav = a.dataset.nav;
      a.classList.toggle("active", nav === page);
      if (!session && PROTECTED_NAV.includes(nav)) {
        a.setAttribute("data-locked", "true");
      } else {
        a.removeAttribute("data-locked");
      }
    });

    const account = $("#headerAccount");
    if (!account) return;
    if (session) {
      account.innerHTML = "";
      const who = document.createElement("span");
      who.className = "who";
      who.innerHTML = `Signed in as <strong>${escapeHtml(session.name)}</strong>`;
      const btn = document.createElement("button");
      btn.className = "btn-logout";
      btn.type = "button";
      btn.textContent = "Log out";
      btn.addEventListener("click", Auth.logout);
      account.appendChild(who);
      account.appendChild(btn);
    } else {
      account.innerHTML = `<a class="link-signin" href="index.html">Sign in</a>`;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  let toastTimer = null;
  function showToast(message, tone) {
    let toast = $("#toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove("toast-danger");
    if (tone === "danger") toast.classList.add("toast-danger");
    // reflow to restart transition
    void toast.offsetWidth;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  // Field validation helpers
  function setFieldError(fieldEl, message) {
    const wrap = fieldEl.closest(".field");
    if (!wrap) return;
    const msg = wrap.querySelector(".error-msg");
    if (message) {
      wrap.classList.add("has-error");
      if (msg) msg.textContent = message;
      fieldEl.setAttribute("aria-invalid", "true");
    } else {
      wrap.classList.remove("has-error");
      if (msg) msg.textContent = "";
      fieldEl.removeAttribute("aria-invalid");
    }
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // PAGE: landing / auth (index.html)
  function initLanding() {
    const session = Store.getSession();
    if (session) {
      window.location.href = "dashboard.html";
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("authRequired")) {
      const msg = $("#landingMsg");
      if (msg) {
        msg.textContent = "Please sign in or create an account to continue.";
        msg.classList.add("show", "error");
      }
    }

    // tab toggle
    $$(".auth-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".auth-tab-btn").forEach((b) => b.classList.remove("active"));
        $$(".auth-form").forEach((f) => f.classList.remove("active"));
        btn.classList.add("active");
        $("#" + btn.dataset.target).classList.add("active");
      });
    });

    if (params.get("mode") === "login") {
      $('.auth-tab-btn[data-target="loginForm"]').click();
    }

    initSignupForm();
    initLoginForm();
  }

  function initSignupForm() {
    const form = $("#signupForm");
    if (!form) return;
    const name = $("#suName");
    const email = $("#suEmail");
    const password = $("#suPassword");
    const confirm = $("#suConfirm");
    const msg = $("#signupMsg");

    function validate(showErrors) {
      let ok = true;
      if (!name.value.trim()) {
        ok = false;
        if (showErrors) setFieldError(name, "Enter your name.");
      } else setFieldError(name, "");

      if (!EMAIL_RE.test(email.value.trim())) {
        ok = false;
        if (showErrors) setFieldError(email, "Enter a valid email address.");
      } else setFieldError(email, "");

      if (password.value.length < 6) {
        ok = false;
        if (showErrors) setFieldError(password, "Use at least 6 characters.");
      } else setFieldError(password, "");

      if (confirm.value !== password.value || !confirm.value) {
        ok = false;
        if (showErrors) setFieldError(confirm, "Passwords don't match.");
      } else setFieldError(confirm, "");

      return ok;
    }

    [name, email, password, confirm].forEach((el) =>
      el.addEventListener("input", () => validate(true))
    );

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      msg.classList.remove("show", "error", "success");
      if (!validate(true)) return;
      const result = Auth.signup(name.value.trim(), email.value.trim(), password.value);
      if (!result.ok) {
        msg.textContent = result.error;
        msg.classList.add("show", "error");
        setFieldError(email, result.error);
        return;
      }
      window.location.href = "profile.html?welcome=1";
    });
  }

  function initLoginForm() {
    const form = $("#loginForm");
    if (!form) return;
    const email = $("#liEmail");
    const password = $("#liPassword");
    const msg = $("#loginMsg");

    function validate(showErrors) {
      let ok = true;
      if (!EMAIL_RE.test(email.value.trim())) {
        ok = false;
        if (showErrors) setFieldError(email, "Enter a valid email address.");
      } else setFieldError(email, "");
      if (!password.value) {
        ok = false;
        if (showErrors) setFieldError(password, "Enter your password.");
      } else setFieldError(password, "");
      return ok;
    }

    [email, password].forEach((el) => el.addEventListener("input", () => validate(true)));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      msg.classList.remove("show", "error", "success");
      if (!validate(true)) return;
      const result = Auth.login(email.value.trim(), password.value);
      if (!result.ok) {
        msg.textContent = result.error;
        msg.classList.add("show", "error");
        return;
      }
      window.location.href = "dashboard.html";
    });
  }

  /* ------------------------------------------------------------------ *
   *  PAGE: profile.html
   * ------------------------------------------------------------------ */
  function initProfile() {
    const session = requireAuth();
    if (!session) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome")) {
      showToast("Account created. Set up your budget to unlock the dashboard.");
    }

    $("#profileName").textContent = session.name;
    $("#profileEmail").textContent = session.email;

    const profile = Store.getProfile(session.userId);
    $("#salary").value = profile.salary || "";
    $("#budgetThreshold").value = profile.budgetThreshold || "";
    $("#savingsGoal").value = profile.savingsGoal || "";

    const form = $("#profileForm");
    const salary = $("#salary");
    const threshold = $("#budgetThreshold");
    const goal = $("#savingsGoal");

    function validateNonNegative(field, label) {
      const val = field.value;
      if (val === "" || isNaN(val) || Number(val) < 0) {
        setFieldError(field, `Enter a valid ${label} (0 or more).`);
        return false;
      }
      setFieldError(field, "");
      return true;
    }

    [salary, threshold, goal].forEach((el) => {
      el.addEventListener("input", () => {
        validateNonNegative(salary, "income amount");
        validateNonNegative(threshold, "budget threshold");
        validateNonNegative(goal, "savings goal");
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const okS = validateNonNegative(salary, "income amount");
      const okT = validateNonNegative(threshold, "budget threshold");
      const okG = validateNonNegative(goal, "savings goal");
      if (!okS || !okT || !okG) return;

      Store.saveProfile(session.userId, {
        salary: Number(salary.value),
        budgetThreshold: Number(threshold.value),
        savingsGoal: Number(goal.value),
      });
      showToast("Profile saved.");
      renderProfileSummary(session.userId);
    });

    renderProfileSummary(session.userId);
  }

  function renderProfileSummary(userId) {
    const summary = $("#profileSummary");
    if (!summary) return;
    const expenses = Store.getExpenses(userId);
    const monthlyDrain = expenses.reduce(
      (sum, e) => sum + monthlyCostOf(e.cost, e.frequency),
      0
    );
    const profile = Store.getProfile(userId);
    const rows = [
      ["Active expenses", String(expenses.length)],
      ["Current monthly spend", currency(monthlyDrain)],
      ["Monthly income", currency(profile.salary || 0)],
      ["Budget threshold", currency(profile.budgetThreshold || 0)],
      ["Savings goal", currency(profile.savingsGoal || 0)],
    ];
    summary.innerHTML = rows
      .map(
        (r) =>
          `<div class="profile-summary-row"><span class="k">${r[0]}</span><span class="v">${r[1]}</span></div>`
      )
      .join("");
  }

  /* ------------------------------------------------------------------ *
   *  PAGE: dashboard.html
   * ------------------------------------------------------------------ */
  function initDashboard() {
    const session = requireAuth();
    if (!session) return;

    const expenses = Store.getExpenses(session.userId);
    const profile = Store.getProfile(session.userId);

    const monthlyDrain = expenses.reduce(
      (sum, e) => sum + monthlyCostOf(e.cost, e.frequency),
      0
    );
    const annual = monthlyDrain * 12;
    const tenYear = futureValueOfMonthly(monthlyDrain, 10, GROWTH_RATE);

    $("#metricMonthly").textContent = currency(monthlyDrain);
    $("#metricAnnual").textContent = currency(annual);
    $("#metricGrowth").textContent = currency(tenYear);
    $("#metricCount").textContent =
      expenses.length + (expenses.length === 1 ? " active expense" : " active expenses");

    renderBudgetWidget(monthlyDrain, profile);
    renderCategoryBreakdown(expenses, monthlyDrain);

    if (expenses.length === 0) {
      const emptyNote = $("#dashboardEmpty");
      if (emptyNote) emptyNote.style.display = "block";
    }
  }

  function renderBudgetWidget(monthlyDrain, profile) {
    const widget = $("#budgetWidget");
    if (!widget) return;
    const threshold = Number(profile.budgetThreshold) || 0;

    if (threshold <= 0) {
      widget.innerHTML = `
        <p class="muted">Set a monthly budget threshold on your
        <a href="profile.html">profile</a> to see how your recurring spend measures up.</p>`;
      return;
    }

    const pct = (monthlyDrain / threshold) * 100;
    const clamped = Math.min(pct, 100);
    let level = "ok";
    if (pct >= 90) level = "danger";
    else if (pct >= 50) level = "warning";

    widget.innerHTML = `
      <div class="budget-widget-head">
        <h3 style="margin:0">Budget threshold</h3>
        <span class="budget-pct">${pct.toFixed(0)}%</span>
      </div>
      <div class="budget-track">
        <div class="budget-fill" data-level="${level}" style="width:${clamped}%"></div>
      </div>
      <p class="muted" style="margin-top:8px">
        ${currency(monthlyDrain)} of ${currency(threshold)} monthly budget spent on
        recurring micro-expenses.
      </p>
      <div class="budget-legend">
        <span><span class="legend-dot" style="background:var(--green)"></span>Under 50%</span>
        <span><span class="legend-dot" style="background:var(--amber)"></span>50&ndash;89%</span>
        <span><span class="legend-dot" style="background:var(--red)"></span>90%+</span>
      </div>`;
  }

  function renderCategoryBreakdown(expenses, monthlyDrain) {
    const wrap = $("#categoryBreakdown");
    if (!wrap) return;

    if (expenses.length === 0) {
      wrap.innerHTML = `<p class="muted">No expenses yet. <a href="add-expense.html">Add your first one</a> to see a breakdown.</p>`;
      return;
    }

    const totals = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + monthlyCostOf(e.cost, e.frequency);
    });

    const rows = Object.keys(totals)
      .sort((a, b) => totals[b] - totals[a])
      .map((cat) => {
        const amt = totals[cat];
        const pct = monthlyDrain > 0 ? (amt / monthlyDrain) * 100 : 0;
        return `
        <div class="cat-bar-row">
          <span class="cat-bar-name"><span class="cat-swatch" style="background:${categoryVar(
            cat
          )}"></span>${escapeHtml(cat)}</span>
          <span class="cat-bar-track"><span class="cat-bar-fill" style="width:${pct}%;background:${categoryVar(
          cat
        )}"></span></span>
          <span class="cat-bar-amount">${currency(amt)}</span>
        </div>`;
      })
      .join("");

    wrap.innerHTML = `<div class="cat-bars">${rows}</div>`;
  }

  // PAGE: add-expense.html
  function initAddExpense() {
    const session = requireAuth();
    if (!session) return;

    const categorySelect = $("#expCategory");
    CATEGORIES.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });

    updateActiveCount(session.userId);

    const form = $("#addExpenseForm");
    const nameField = $("#expName");
    const costField = $("#expCost");
    const freqField = $("#expFrequency");

    function validate(showErrors) {
      let ok = true;
      if (!categorySelect.value) {
        ok = false;
        if (showErrors) setFieldError(categorySelect, "Choose a category.");
      } else setFieldError(categorySelect, "");

      if (!nameField.value.trim()) {
        ok = false;
        if (showErrors) setFieldError(nameField, "Give this expense a name.");
      } else setFieldError(nameField, "");

      const cost = Number(costField.value);
      if (costField.value === "" || isNaN(cost) || cost <= 0) {
        ok = false;
        if (showErrors) setFieldError(costField, "Enter a cost greater than $0.");
      } else setFieldError(costField, "");

      if (!freqField.value) {
        ok = false;
        if (showErrors) setFieldError(freqField, "Choose how often this repeats.");
      } else setFieldError(freqField, "");

      return ok;
    }

    [categorySelect, nameField, costField, freqField].forEach((el) =>
      el.addEventListener("input", () => validate(true))
    );

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(true)) return;
      addExpense(session.userId, {
        category: categorySelect.value,
        name: nameField.value.trim(),
        cost: Number(costField.value),
        frequency: freqField.value,
      });
      showToast(`Added "${nameField.value.trim()}" to your expenses.`);
      form.reset();
      setFieldError(categorySelect, "");
      setFieldError(nameField, "");
      setFieldError(costField, "");
      setFieldError(freqField, "");
      updateActiveCount(session.userId);
    });

    loadPresets(session.userId);
  }

  function addExpense(userId, data) {
    const expenses = Store.getExpenses(userId);
    expenses.push({
      id: genId(),
      category: data.category,
      name: data.name,
      cost: data.cost,
      frequency: data.frequency,
      dateAdded: new Date().toISOString(),
    });
    Store.saveExpenses(userId, expenses);
  }

  function updateActiveCount(userId) {
    const el = $("#activeExpenseCount");
    if (!el) return;
    const count = Store.getExpenses(userId).length;
    el.textContent = count + (count === 1 ? " active expense" : " active expenses");
  }

  function loadPresets(userId) {
    const grid = $("#presetGrid");
    if (!grid) return;
    fetch("subscriptions.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load presets");
        return res.json();
      })
      .then((presets) => {
        grid.innerHTML = "";
        presets.forEach((preset) => {
          const card = document.createElement("button");
          card.type = "button";
          card.className = "preset-card";
          card.style.borderLeftColor = categoryVar(preset.category);
          card.innerHTML = `
            <span class="preset-cat">${escapeHtml(preset.category)}</span>
            <span class="preset-name">${escapeHtml(preset.name)}</span>
            <span class="preset-cost">${currency(preset.cost)} / ${
            preset.frequency === "daily" ? "day" : "mo"
          }</span>`;
          card.addEventListener("click", () => {
            addExpense(userId, preset);
            showToast(`Added "${preset.name}" from presets.`);
            updateActiveCount(userId);
          });
          grid.appendChild(card);
        });
      })
      .catch(() => {
        grid.innerHTML = `<p class="muted">Presets couldn't be loaded right now.</p>`;
      });
  }

  /* ------------------------------------------------------------------ *
   *  PAGE: analytics.html
   * ------------------------------------------------------------------ */
  let analyticsState = {
    filter: "All",
    search: "",
    editingId: null,
    confirmingId: null,
  };

  function initAnalytics() {
    const session = requireAuth();
    if (!session) return;

    const chipsWrap = $("#filterChips");
    ["All", ...CATEGORIES].forEach((cat) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "filter-chip" + (cat === "All" ? " active" : "");
      chip.textContent = cat;
      chip.addEventListener("click", () => {
        analyticsState.filter = cat;
        analyticsState.editingId = null;
        analyticsState.confirmingId = null;
        $$(".filter-chip", chipsWrap).forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        renderAnalyticsTable(session.userId);
      });
      chipsWrap.appendChild(chip);
    });

    const searchInput = $("#searchExpenses");
    searchInput.addEventListener("input", () => {
      analyticsState.search = searchInput.value.trim().toLowerCase();
      renderAnalyticsTable(session.userId);
    });

    renderAnalyticsTable(session.userId);
  }

  function renderAnalyticsTable(userId) {
    const tbody = $("#analyticsBody");
    const emptyState = $("#analyticsEmpty");
    const table = $("#analyticsTable");
    let expenses = Store.getExpenses(userId);

    if (analyticsState.filter !== "All") {
      expenses = expenses.filter((e) => e.category === analyticsState.filter);
    }
    if (analyticsState.search) {
      expenses = expenses.filter((e) => e.name.toLowerCase().includes(analyticsState.search));
    }
    expenses = expenses.slice().sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

    if (expenses.length === 0) {
      table.style.display = "none";
      emptyState.style.display = "block";
      return;
    }
    table.style.display = "table";
    emptyState.style.display = "none";

    tbody.innerHTML = expenses.map((e) => rowHtml(e)).join("");

    // wire up row controls
    expenses.forEach((e) => {
      const row = tbody.querySelector(`tr[data-id="${e.id}"]`);
      if (!row) return;

      if (analyticsState.editingId === e.id) {
        wireEditRow(row, e, userId);
        return;
      }

      const editBtn = row.querySelector('[data-action="edit"]');
      const delBtn = row.querySelector('[data-action="delete"]');
      if (editBtn)
        editBtn.addEventListener("click", () => {
          analyticsState.editingId = e.id;
          analyticsState.confirmingId = null;
          renderAnalyticsTable(userId);
        });

      if (analyticsState.confirmingId === e.id) {
        const yes = row.querySelector('[data-action="confirm-yes"]');
        const no = row.querySelector('[data-action="confirm-no"]');
        yes.addEventListener("click", () => {
          const remaining = Store.getExpenses(userId).filter((x) => x.id !== e.id);
          Store.saveExpenses(userId, remaining);
          analyticsState.confirmingId = null;
          showToast(`Deleted "${e.name}".`, "danger");
          renderAnalyticsTable(userId);
        });
        no.addEventListener("click", () => {
          analyticsState.confirmingId = null;
          renderAnalyticsTable(userId);
        });
      } else if (delBtn) {
        delBtn.addEventListener("click", () => {
          analyticsState.confirmingId = e.id;
          analyticsState.editingId = null;
          renderAnalyticsTable(userId);
        });
      }
    });
  }

  function rowHtml(e) {
    const monthly = monthlyCostOf(e.cost, e.frequency);
    const dateStr = new Date(e.dateAdded).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const actionsHtml =
      analyticsState.confirmingId === e.id
        ? `<div class="confirm-row">Delete?
             <button type="button" class="btn btn-sm btn-danger" data-action="confirm-yes">Yes</button>
             <button type="button" class="btn btn-sm btn-secondary" data-action="confirm-no">No</button>
           </div>`
        : `<div class="row-actions">
             <button type="button" class="btn btn-sm btn-secondary" data-action="edit">Edit</button>
             <button type="button" class="btn btn-sm btn-danger" data-action="delete">Delete</button>
           </div>`;

    return `
      <tr data-id="${e.id}">
        <td><span class="cat-pill" style="background:${categoryVar(e.category)}">${escapeHtml(
      e.category
    )}</span></td>
        <td>${escapeHtml(e.name)}</td>
        <td class="num">${currency(e.cost)} <span class="muted">/ ${
      e.frequency === "daily" ? "day" : "mo"
    }</span></td>
        <td class="num">${currency(monthly)}</td>
        <td>${dateStr}</td>
        <td>${actionsHtml}</td>
      </tr>`;
  }

  function wireEditRow(row, expense, userId) {
    row.innerHTML = `
      <td>
        <select class="edit-category">
          ${CATEGORIES.map(
            (c) => `<option value="${c}" ${c === expense.category ? "selected" : ""}>${c}</option>`
          ).join("")}
        </select>
      </td>
      <td><input class="edit-name" type="text" value="${escapeHtml(expense.name)}" /></td>
      <td>
        <input class="edit-cost" type="number" min="0.01" step="0.01" value="${expense.cost}" />
        <select class="edit-frequency">
          <option value="daily" ${expense.frequency === "daily" ? "selected" : ""}>per day</option>
          <option value="monthly" ${
            expense.frequency === "monthly" ? "selected" : ""
          }>per month</option>
        </select>
      </td>
      <td class="num muted">&ndash;</td>
      <td class="muted">${new Date(expense.dateAdded).toLocaleDateString()}</td>
      <td>
        <div class="row-actions">
          <button type="button" class="btn btn-sm btn-primary" data-action="save">Save</button>
          <button type="button" class="btn btn-sm btn-secondary" data-action="cancel">Cancel</button>
        </div>
        <div class="error-msg" data-edit-error></div>
      </td>`;

    const nameInput = row.querySelector(".edit-name");
    const costInput = row.querySelector(".edit-cost");
    const freqSelect = row.querySelector(".edit-frequency");
    const catSelect = row.querySelector(".edit-category");
    const errorEl = row.querySelector("[data-edit-error]");

    row.querySelector('[data-action="cancel"]').addEventListener("click", () => {
      analyticsState.editingId = null;
      renderAnalyticsTable(userId);
    });

    row.querySelector('[data-action="save"]').addEventListener("click", () => {
      const cost = Number(costInput.value);
      if (!nameInput.value.trim()) {
        errorEl.textContent = "Name can't be empty.";
        return;
      }
      if (costInput.value === "" || isNaN(cost) || cost <= 0) {
        errorEl.textContent = "Cost must be greater than $0.";
        return;
      }
      const expenses = Store.getExpenses(userId);
      const idx = expenses.findIndex((x) => x.id === expense.id);
      if (idx > -1) {
        expenses[idx] = {
          ...expenses[idx],
          category: catSelect.value,
          name: nameInput.value.trim(),
          cost,
          frequency: freqSelect.value,
        };
        Store.saveExpenses(userId, expenses);
      }
      analyticsState.editingId = null;
      showToast("Expense updated.");
      renderAnalyticsTable(userId);
    });
  }

  // Boot
  document.addEventListener("DOMContentLoaded", () => {
    renderHeaderChrome();

    const page = document.body.dataset.page;
    switch (page) {
      case "landing":
        initLanding();
        break;
      case "profile":
        initProfile();
        break;
      case "dashboard":
        initDashboard();
        break;
      case "add-expense":
        initAddExpense();
        break;
      case "analytics":
        initAnalytics();
        break;
    }
  });
})();
