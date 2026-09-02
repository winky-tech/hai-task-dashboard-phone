const FUNCTION_URL =
  "https://aeqfirqtgfbngvihpccv.supabase.co/functions/v1/available-task-monitor";
const TOKEN_KEY = "hai-dashboard-pairing-code";
const DEFAULT_CHECK_INTERVAL_MS = 5 * 60_000;
const PREVIEW_MODE =
  ["localhost", "127.0.0.1"].includes(location.hostname) &&
  new URLSearchParams(location.search).get("preview") === "1";

const elements = {
  pairingView: document.querySelector("#pairing-view"),
  pairingForm: document.querySelector("#pairing-form"),
  pairingCode: document.querySelector("#pairing-code"),
  pairingError: document.querySelector("#pairing-error"),
  dashboard: document.querySelector("#dashboard"),
  refreshButton: document.querySelector("#refresh-button"),
  disconnectButton: document.querySelector("#disconnect-button"),
  notificationButton: document.querySelector("#notification-button"),
  notificationTitle: document.querySelector("#notification-title"),
  notificationDetail: document.querySelector("#notification-detail"),
  sessionAlert: document.querySelector("#session-alert"),
  monitorDot: document.querySelector("#monitor-dot"),
  monitorTitle: document.querySelector("#monitor-title"),
  checkedAt: document.querySelector("#checked-at"),
  nextCheck: document.querySelector("#next-check"),
  projectTabs: document.querySelector("#project-tabs"),
  availabilityTitle: document.querySelector("#availability-title"),
  availabilitySummary: document.querySelector("#availability-summary"),
  availabilityProjects: document.querySelector("#availability-projects"),
  availabilityNote: document.querySelector("#availability-note"),
  historyAlert: document.querySelector("#history-alert"),
  historyAlertSummary: document.querySelector("#history-alert-summary"),
  overviewContent: document.querySelector("#overview-content"),
  summaryGrid: document.querySelector("#summary-grid"),
  attentionCount: document.querySelector("#attention-count"),
  attentionList: document.querySelector("#attention-list"),
  projectOverviewList: document.querySelector("#project-overview-list"),
  recentList: document.querySelector("#recent-list"),
  projectContent: document.querySelector("#project-content"),
  projectViewTitle: document.querySelector("#project-view-title"),
  projectViewDescription: document.querySelector("#project-view-description"),
  projectHandshakeLink: document.querySelector("#project-handshake-link"),
  projectSummaryGrid: document.querySelector("#project-summary-grid"),
  projectTaskCount: document.querySelector("#project-task-count"),
  projectTaskList: document.querySelector("#project-task-list"),
};

let dashboardStatus = null;
let activeView = "overview";
let checkInProgress = false;

const previewTasks = [
  {
    taskId: "ivy-preview-104",
    projectKey: "ivy",
    projectName: "Ivy",
    title: "Ranking task",
    taskUrl: "https://ai.joinhandshake.com/fellow/projects",
    stage: "Needs Fixing",
    buildStatus: "Passing",
    paymentAmount: 0,
    paymentEligible: false,
    isMissing: false,
    lastSeenAt: new Date(Date.now() - 8 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
  },
  {
    taskId: "ivy-preview-103",
    projectKey: "ivy",
    projectName: "Ivy",
    title: "Model evaluation",
    taskUrl: "https://ai.joinhandshake.com/fellow/projects",
    stage: "Review 2",
    buildStatus: "Passing",
    paymentAmount: 0,
    paymentEligible: false,
    isMissing: false,
    lastSeenAt: new Date(Date.now() - 22 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 22 * 60_000).toISOString(),
  },
  {
    taskId: "ivy-preview-102",
    projectKey: "ivy",
    projectName: "Ivy",
    title: "Code review task",
    taskUrl: "https://ai.joinhandshake.com/fellow/projects",
    stage: "Delivered",
    buildStatus: "Passing",
    paymentAmount: 225,
    paymentEligible: true,
    isMissing: false,
    lastSeenAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60_000).toISOString(),
  },
  {
    taskId: "roadhouse-preview-32",
    projectKey: "roadhouse",
    projectName: "Roadhouse",
    title: "Repository task",
    taskUrl: "https://ai.joinhandshake.com/fellow/projects",
    stage: "Awaiting Review",
    buildStatus: null,
    paymentAmount: 0,
    paymentEligible: false,
    isMissing: false,
    lastSeenAt: new Date(Date.now() - 70 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 70 * 60_000).toISOString(),
  },
  {
    taskId: "roadhouse-preview-31",
    projectKey: "roadhouse",
    projectName: "Roadhouse",
    title: "Delivered task",
    taskUrl: "https://ai.joinhandshake.com/fellow/projects",
    stage: "Ready to Deliver",
    buildStatus: "Passing",
    paymentAmount: 225,
    paymentEligible: true,
    isMissing: false,
    lastSeenAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
  {
    taskId: "jet-preview-18",
    projectKey: "jet",
    projectName: "Jet",
    title: "Hourly task",
    taskUrl: "https://ai.joinhandshake.com/fellow/projects",
    stage: "Delivered",
    buildStatus: "Passing",
    paymentAmount: 238.5,
    paymentEligible: true,
    isMissing: false,
    lastSeenAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60_000).toISOString(),
  },
  {
    taskId: "ivy-preview-099",
    projectKey: "ivy",
    projectName: "Ivy",
    title: "Saved task",
    taskUrl: "https://ai.joinhandshake.com/fellow/projects",
    stage: "Delivered",
    buildStatus: "Passing",
    paymentAmount: 225,
    paymentEligible: true,
    isMissing: true,
    lastSeenAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
  },
];

const previewStatus = {
  status: "ok",
  pollIntervalMs: DEFAULT_CHECK_INTERVAL_MS,
  sessionStatus: "valid",
  lastPollAt: new Date(Date.now() - 18_000).toISOString(),
  lastPollStatus: "ok",
  lastError: null,
  subscriptionCount: 1,
  vapidPublicKey: null,
  summary: {
    totalTasks: 7,
    visibleTasks: 6,
    missingTasks: 1,
    needsAttention: 1,
    inReview: 2,
    earnedEstimate: 913.5,
    paidOutEstimate: 913.5,
  },
  projects: [
    { project_key: "ivy", project_name: "Ivy", project_url: "https://ai.joinhandshake.com/fellow/projects", available_count: 0, check_status: "ok" },
    { project_key: "roadhouse", project_name: "Roadhouse", project_url: "https://ai.joinhandshake.com/fellow/projects", available_count: 2, check_status: "ok" },
    { project_key: "jet", project_name: "Jet", project_url: "https://ai.joinhandshake.com/fellow/projects", available_count: 0, check_status: "ok" },
  ],
  projectSummaries: [
    { key: "ivy", name: "Ivy", projectUrl: "https://ai.joinhandshake.com/fellow/projects", total: 4, needsAttention: 1, inReview: 1, earnedEstimate: 450, paidOutEstimate: 450, availableCount: 0, availabilityStatus: "ok" },
    { key: "roadhouse", name: "Roadhouse", projectUrl: "https://ai.joinhandshake.com/fellow/projects", total: 2, needsAttention: 0, inReview: 1, earnedEstimate: 225, paidOutEstimate: 225, availableCount: 2, availabilityStatus: "ok" },
    { key: "jet", name: "Jet", projectUrl: "https://ai.joinhandshake.com/fellow/projects", total: 1, needsAttention: 0, inReview: 0, earnedEstimate: 238.5, paidOutEstimate: 238.5, availableCount: 0, availabilityStatus: "ok" },
  ],
  tasks: previewTasks,
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(value) {
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

async function api(action, payload = {}) {
  if (PREVIEW_MODE) {
    if (action === "poll") {
      await new Promise((resolve) => setTimeout(resolve, 700));
      previewStatus.lastPollAt = new Date().toISOString();
    }
    return previewStatus;
  }
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-dashboard-token": getToken(),
    },
    body: JSON.stringify({ action, instanceId: "primary", ...payload }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || "Cloud dashboard is unavailable.");
  }
  return body;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : "#";
  } catch {
    return "#";
  }
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function relativeTime(value, prefix = "Checked") {
  const timestamp = new Date(value || "").getTime();
  if (!Number.isFinite(timestamp)) return "Not checked yet";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 10) return `${prefix} just now`;
  if (seconds < 60) return `${prefix} ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${prefix} ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${prefix} ${hours}h ago`;
}

function taskNeedsAttention(task = {}) {
  const stage = String(task.stage || "").toLowerCase();
  const build = String(task.buildStatus || "").toLowerCase();
  return (
    ["needs fixing", "fix in progress", "rejected"].some((value) =>
      stage.includes(value)
    ) ||
    build === "failing" ||
    build.includes("failed")
  );
}

function stageTone(task = {}) {
  if (task.isMissing || taskNeedsAttention(task)) return "attention";
  if (String(task.stage || "").toLowerCase().includes("review")) return "review";
  if (["ready to deliver", "delivered"].includes(String(task.stage || "").toLowerCase())) {
    return "paid";
  }
  return "neutral";
}

function setRefreshState(state) {
  const label = elements.refreshButton.querySelector("span:last-child");
  elements.refreshButton.classList.toggle("is-checking", state === "checking");
  elements.refreshButton.disabled = state === "checking";
  if (label) label.textContent = state === "checking" ? "Checking" : "Refresh";
}

function updateCountdown() {
  if (!dashboardStatus || elements.dashboard.hidden) return;
  if (checkInProgress) {
    elements.nextCheck.textContent = "Checking HAI now";
    return;
  }
  if (dashboardStatus.sessionStatus !== "valid") {
    elements.nextCheck.textContent = "Automatic checks paused";
    return;
  }
  const lastPoll = new Date(dashboardStatus.lastPollAt || "").getTime();
  if (!Number.isFinite(lastPoll)) {
    elements.nextCheck.textContent = "First check is starting";
    return;
  }
  const intervalMs = Number(dashboardStatus.pollIntervalMs) || DEFAULT_CHECK_INTERVAL_MS;
  const remaining = Math.max(0, lastPoll + intervalMs - Date.now());
  const seconds = Math.ceil(remaining / 1000);
  const minutesPart = Math.floor(seconds / 60);
  const secondsPart = String(seconds % 60).padStart(2, "0");
  elements.nextCheck.textContent =
    seconds === 0 ? "Next automatic check is due" : `Next check in ${minutesPart}:${secondsPart}`;
  elements.checkedAt.textContent = relativeTime(dashboardStatus.lastPollAt);
}

function renderMonitor(data) {
  const session = data.sessionStatus;
  elements.monitorDot.className = "monitor-dot";
  elements.sessionAlert.hidden = session !== "expired";

  if (checkInProgress) {
    elements.monitorDot.classList.add("checking");
    elements.monitorTitle.textContent = "Checking HAI now";
  } else if (session === "valid" && data.lastPollStatus === "ok") {
    elements.monitorDot.classList.add("ok");
    elements.monitorTitle.textContent = "Cloud monitor is running";
  } else if (session === "valid") {
    elements.monitorDot.classList.add(data.lastPollStatus === "error" ? "error" : "checking");
    elements.monitorTitle.textContent =
      data.lastPollStatus === "error" ? "Cloud check will retry" : "Cloud check partially completed";
  } else if (session === "expired") {
    elements.monitorDot.classList.add("error");
    elements.monitorTitle.textContent = "Cloud checks are paused";
  } else if (session === "missing") {
    elements.monitorTitle.textContent = "Waiting for your HAI login";
  } else {
    elements.monitorDot.classList.add("error");
    elements.monitorTitle.textContent = "Cloud check will retry";
  }
  elements.checkedAt.textContent = relativeTime(data.lastPollAt);
  updateCountdown();
}

function renderTabs(projects = []) {
  const tabs = [{ key: "overview", name: "Overview" }, ...projects];
  elements.projectTabs.innerHTML = tabs
    .map(
      (project) => `<button class="project-tab${activeView === project.key ? " active" : ""}" type="button" role="tab" aria-selected="${activeView === project.key}" data-view="${escapeHtml(project.key)}">${escapeHtml(project.name)}</button>`
    )
    .join("");
}

function renderAvailability(projects = [], pollIntervalMs = DEFAULT_CHECK_INTERVAL_MS) {
  const visible = projects.filter((project) => project.check_status !== "hidden");
  const total = visible.reduce(
    (sum, project) => sum + (Number(project.available_count) || 0),
    0
  );
  const failures = visible.filter((project) => project.check_status === "error").length;
  const intervalMinutes = Math.max(1, Math.round(pollIntervalMs / 60_000));
  const intervalLabel =
    intervalMinutes === 1 ? "every minute" : `every ${intervalMinutes} minutes`;
  elements.availabilityTitle.textContent =
    total > 0 ? `${total} task${total === 1 ? " is" : "s are"} available` : "Watching available tasks";
  elements.availabilitySummary.textContent =
    failures > 0
      ? `${failures} project check${failures === 1 ? "" : "s"} will retry automatically.`
      : `Ivy, Roadhouse, and your active projects are checked ${intervalLabel}.`;
  elements.availabilityNote.textContent = `${total} available`;
  elements.availabilityProjects.innerHTML = visible
    .map((project) => {
      const count = Number(project.available_count) || 0;
      const tone = project.check_status === "error" ? "error" : count > 0 ? "available" : "";
      return `<a class="availability-chip ${tone}" href="${safeUrl(project.project_url)}" target="_blank" rel="noreferrer"><span>${escapeHtml(project.project_name)}</span><strong>${count}</strong></a>`;
    })
    .join("");
}

function summaryCard(label, value, tone, detail) {
  return `<article class="summary-item ${tone}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`;
}

function renderOverviewSummary(summary = {}) {
  elements.summaryGrid.innerHTML = [
    summaryCard("Needs attention", String(summary.needsAttention || 0), "attention", "Fix these first"),
    summaryCard("In review", String(summary.inReview || 0), "review", "Still moving through review"),
    summaryCard("Earned estimate", money(summary.earnedEstimate), "earned", `${summary.totalTasks || 0} tracked tasks`),
    summaryCard("Paid out estimate", money(summary.paidOutEstimate), "paid", "RTD and Delivered"),
  ].join("");
}

function taskRow(task, options = {}) {
  const title = task.title || task.taskId || "Task";
  const taskId = task.taskId || "Unknown task";
  const project = options.showProject ? `${task.projectName || "Project"} · ` : "";
  const missing = task.isMissing ? " · Missing from current HAI list" : "";
  const amount = Number(task.paymentAmount) > 0 ? money(task.paymentAmount) : "";
  const tag = task.isMissing ? "Saved" : task.stage || "Unknown";
  return `<li class="task-row ${task.isMissing ? "missing" : ""}">
    <a href="${safeUrl(task.taskUrl)}" target="_blank" rel="noreferrer">
      <span class="task-main"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(project + taskId + missing)}</small></span>
      <span class="task-side"><span class="stage-pill ${stageTone(task)}">${escapeHtml(tag)}</span>${amount ? `<strong>${escapeHtml(amount)}</strong>` : ""}<small>${escapeHtml(relativeTime(task.updatedAt || task.lastSeenAt, "Updated"))}</small></span>
    </a>
  </li>`;
}

function emptyRow(message) {
  return `<li class="empty-row">${escapeHtml(message)}</li>`;
}

function renderAttention(tasks = []) {
  const attention = tasks.filter((task) => !task.isMissing && taskNeedsAttention(task));
  elements.attentionCount.textContent = String(attention.length);
  elements.attentionList.innerHTML = attention.length
    ? attention.map((task) => taskRow(task, { showProject: true })).join("")
    : emptyRow("Nothing needs your attention right now.");
}

function renderProjectOverview(projects = []) {
  elements.projectOverviewList.innerHTML = projects
    .map(
      (project) => `<button class="project-overview-row" type="button" data-view="${escapeHtml(project.key)}">
        <span><strong>${escapeHtml(project.name)}</strong><small>${project.total} tracked · ${project.inReview} in review</small></span>
        <span class="project-overview-pay"><strong>${escapeHtml(money(project.paidOutEstimate))}</strong><small>paid out est.</small></span>
        <span class="row-arrow" aria-hidden="true">&#8250;</span>
      </button>`
    )
    .join("");
}

function renderRecent(tasks = []) {
  const recent = [...tasks]
    .filter((task) => !task.isMissing)
    .sort(
      (left, right) =>
        new Date(right.updatedAt || right.lastSeenAt || 0).getTime() -
        new Date(left.updatedAt || left.lastSeenAt || 0).getTime()
    )
    .slice(0, 6);
  elements.recentList.innerHTML = recent.length
    ? recent.map((task) => taskRow(task, { showProject: true })).join("")
    : emptyRow("No task activity has been saved yet.");
}

function renderHistory(summary = {}) {
  const count = Number(summary.missingTasks) || 0;
  elements.historyAlert.hidden = count === 0;
  elements.historyAlertSummary.textContent =
    count === 0
      ? ""
      : `${count} saved task${count === 1 ? " is" : "s are"} missing from the current HAI task list. The dashboard kept ${count === 1 ? "it" : "them"} in your history and pay totals.`;
}

function renderProjectView(project, tasks = []) {
  if (!project) return;
  const projectTasks = tasks.filter((task) => task.projectKey === project.key);
  const missingCount = projectTasks.filter((task) => task.isMissing).length;
  elements.projectViewTitle.textContent = project.name;
  elements.projectViewDescription.textContent = `${project.total} tracked task${project.total === 1 ? "" : "s"}${missingCount ? `, including ${missingCount} saved task${missingCount === 1 ? "" : "s"} missing from HAI` : ""}.`;
  elements.projectHandshakeLink.href = safeUrl(project.projectUrl);
  elements.projectSummaryGrid.innerHTML = [
    summaryCard("Total tasks", String(project.total || 0), "neutral", `${missingCount} missing from HAI`),
    summaryCard("Needs attention", String(project.needsAttention || 0), "attention", "Fix these first"),
    summaryCard("In review", String(project.inReview || 0), "review", "Still in review"),
    summaryCard("Paid out estimate", money(project.paidOutEstimate), "paid", `${project.availableCount || 0} available now`),
  ].join("");
  elements.projectTaskCount.textContent = String(projectTasks.length);
  elements.projectTaskList.innerHTML = projectTasks.length
    ? projectTasks.map((task) => taskRow(task)).join("")
    : emptyRow("No tasks have been saved for this project yet.");
}

function renderView({ scroll = false } = {}) {
  const projects = dashboardStatus?.projectSummaries || [];
  if (activeView !== "overview" && !projects.some((project) => project.key === activeView)) {
    activeView = "overview";
  }
  renderTabs(projects);
  elements.overviewContent.hidden = activeView !== "overview";
  elements.projectContent.hidden = activeView === "overview";
  if (activeView !== "overview") {
    renderProjectView(
      projects.find((project) => project.key === activeView),
      dashboardStatus?.tasks || []
    );
  }
  if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

async function currentSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
}

async function renderNotifications(data) {
  if (PREVIEW_MODE) {
    elements.notificationTitle.textContent = "Phone alerts are on";
    elements.notificationDetail.textContent = "New tasks, stage changes, payout stages, and expired-login alerts will appear on this device.";
    elements.notificationButton.textContent = "Alerts enabled";
    elements.notificationButton.disabled = true;
    return;
  }
  const subscription = await currentSubscription().catch(() => null);
  if (subscription && Notification.permission === "granted") {
    elements.notificationTitle.textContent = "Phone alerts are on";
    elements.notificationDetail.textContent = "You will be notified about new tasks, stage changes, payout stages, and an expired HAI login.";
    elements.notificationButton.textContent = "Alerts enabled";
    elements.notificationButton.disabled = true;
    return;
  }

  elements.notificationButton.disabled = false;
  elements.notificationButton.textContent = "Enable alerts";
  if (isIos() && !isStandalone()) {
    elements.notificationTitle.textContent = "Add this dashboard to your Home Screen";
    elements.notificationDetail.textContent = "Open Safari's Share menu, choose Add to Home Screen, then enable alerts from the app.";
    elements.notificationButton.textContent = "Open after adding";
    elements.notificationButton.disabled = true;
  } else if (!("Notification" in window) || !("PushManager" in window)) {
    elements.notificationTitle.textContent = "Notifications are not supported here";
    elements.notificationDetail.textContent = "Use the Home Screen app on a current iPhone or a supported desktop browser.";
    elements.notificationButton.disabled = true;
  } else if (Notification.permission === "denied") {
    elements.notificationTitle.textContent = "Notifications are blocked";
    elements.notificationDetail.textContent = "Allow notifications for Task Dashboard in your device settings.";
    elements.notificationButton.disabled = true;
  } else if (!data.vapidPublicKey) {
    elements.notificationTitle.textContent = "Alerts are still being set up";
    elements.notificationDetail.textContent = "Refresh in a moment.";
    elements.notificationButton.disabled = true;
  }
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function enableNotifications() {
  elements.notificationButton.disabled = true;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    await renderNotifications(dashboardStatus || {});
    return;
  }
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(dashboardStatus.vapidPublicKey),
    });
  }
  await api("subscribe", { subscription: subscription.toJSON() });
  dashboardStatus = await api("status");
  await renderNotifications(dashboardStatus);
}

async function renderDashboard(data) {
  dashboardStatus = data;
  elements.pairingView.hidden = true;
  elements.dashboard.hidden = false;
  renderMonitor(data);
  renderAvailability(data.projects || [], data.pollIntervalMs);
  renderOverviewSummary(data.summary || {});
  renderAttention(data.tasks || []);
  renderProjectOverview(data.projectSummaries || []);
  renderRecent(data.tasks || []);
  renderHistory(data.summary || {});
  renderView();
  await renderNotifications(data);
}

async function loadStatus({ keepPairingError = false } = {}) {
  if (!PREVIEW_MODE && !getToken()) {
    elements.pairingView.hidden = false;
    elements.dashboard.hidden = true;
    return;
  }

  try {
    await renderDashboard(await api("status"));
  } catch (error) {
    if (!PREVIEW_MODE && /pairing code|invalid/i.test(error.message)) setToken("");
    elements.pairingView.hidden = false;
    elements.dashboard.hidden = true;
    elements.pairingError.textContent = error.message;
    elements.pairingError.hidden = false;
    if (!keepPairingError) elements.pairingCode.value = "";
  }
}

async function checkNow() {
  if (checkInProgress) return;
  checkInProgress = true;
  setRefreshState("checking");
  if (dashboardStatus) renderMonitor(dashboardStatus);
  try {
    const result = await api("poll");
    await renderDashboard(await api("status"));
    if (result.status === "error") {
      elements.availabilitySummary.textContent = result.error || "The check will retry automatically.";
    }
  } catch (error) {
    elements.monitorDot.className = "monitor-dot error";
    elements.monitorTitle.textContent = "Could not refresh right now";
    elements.nextCheck.textContent = error.message;
  } finally {
    checkInProgress = false;
    setRefreshState("idle");
    if (dashboardStatus) renderMonitor(dashboardStatus);
  }
}

elements.pairingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.pairingError.hidden = true;
  setToken(elements.pairingCode.value.trim());
  await loadStatus({ keepPairingError: true });
});

elements.projectTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  activeView = button.dataset.view;
  renderView({ scroll: true });
});

elements.projectOverviewList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  activeView = button.dataset.view;
  renderView({ scroll: true });
});

elements.notificationButton.addEventListener("click", () => {
  enableNotifications().catch((error) => {
    elements.notificationTitle.textContent = "Could not enable alerts";
    elements.notificationDetail.textContent = error.message;
    elements.notificationButton.disabled = false;
  });
});

elements.disconnectButton.addEventListener("click", async () => {
  const subscription = await currentSubscription().catch(() => null);
  if (subscription && !PREVIEW_MODE) {
    await api("unsubscribe", { endpoint: subscription.endpoint }).catch(() => {});
    await subscription.unsubscribe().catch(() => {});
  }
  setToken("");
  location.reload();
});

elements.refreshButton.addEventListener("click", checkNow);

if ("serviceWorker" in navigator && !PREVIEW_MODE) {
  navigator.serviceWorker.register("./service-worker.js?v=20260901-3", { scope: "./" });
}

loadStatus();
setInterval(updateCountdown, 1_000);
setInterval(() => {
  if ((PREVIEW_MODE || getToken()) && !document.hidden && !checkInProgress) {
    loadStatus();
  }
}, 15_000);
