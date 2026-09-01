const FUNCTION_URL =
  "https://aeqfirqtgfbngvihpccv.supabase.co/functions/v1/available-task-monitor";
const TOKEN_KEY = "hai-dashboard-pairing-code";

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
  monitorDetail: document.querySelector("#monitor-detail"),
  checkedAt: document.querySelector("#checked-at"),
  attentionTotal: document.querySelector("#attention-total"),
  reviewTotal: document.querySelector("#review-total"),
  paidTotal: document.querySelector("#paid-total"),
  missingTotal: document.querySelector("#missing-total"),
  queueTotal: document.querySelector("#queue-total"),
  projectList: document.querySelector("#project-list"),
};

let status = null;

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(value) {
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

async function api(action, payload = {}) {
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

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function relativeTime(value) {
  const timestamp = new Date(value || "").getTime();
  if (!Number.isFinite(timestamp)) return "Not checked yet";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "Checked just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Checked ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Checked ${hours}h ago`;
}

function renderMonitor(data) {
  const session = data.sessionStatus;
  elements.monitorDot.className = "monitor-dot";
  elements.sessionAlert.hidden = session !== "expired";

  if (session === "valid") {
    elements.monitorDot.classList.add("ok");
    elements.monitorTitle.textContent = "Cloud monitor is running";
    elements.monitorDetail.textContent = "Ivy, Roadhouse, and your active projects are checked every minute.";
  } else if (session === "expired") {
    elements.monitorDot.classList.add("error");
    elements.monitorTitle.textContent = "Cloud checks are paused";
    elements.monitorDetail.textContent = "Your HAI login needs to be refreshed on your Mac.";
  } else if (session === "missing") {
    elements.monitorTitle.textContent = "Waiting for your HAI login";
    elements.monitorDetail.textContent = "Sign in from Task Dashboard on your Mac.";
  } else if (data.lastPollStatus === "error") {
    elements.monitorDot.classList.add("error");
    elements.monitorTitle.textContent = "Cloud check will retry";
    elements.monitorDetail.textContent = data.lastError || "The latest check did not finish.";
  } else {
    elements.monitorTitle.textContent = "Cloud monitor is checking";
    elements.monitorDetail.textContent = "The first result will appear shortly.";
  }
  elements.checkedAt.textContent = relativeTime(data.lastPollAt);
}

function renderSummary(summary = {}) {
  elements.attentionTotal.textContent = String(summary.needsAttention || 0);
  elements.reviewTotal.textContent = String(summary.inReview || 0);
  elements.paidTotal.textContent = money(summary.paidOutEstimate);
  elements.missingTotal.textContent = String(summary.missingTasks || 0);
}

function renderProjects(projects = []) {
  const visible = projects.filter((project) => project.check_status !== "hidden");
  const total = visible.reduce(
    (sum, project) => sum + (Number(project.available_count) || 0),
    0
  );
  elements.queueTotal.textContent = `${total} available`;
  elements.projectList.innerHTML = visible
    .map((project) => {
      const count = Number(project.available_count) || 0;
      const state =
        project.check_status === "error" ? "error" : count > 0 ? "available" : "";
      const detail =
        project.check_status === "error"
          ? "Check will retry"
          : count > 0
            ? "Ready to claim"
            : "Nothing available";
      return `<a class="project-row" href="${project.project_url}" target="_blank" rel="noreferrer">
        <span class="project-copy">
          <span class="project-dot ${state}" aria-hidden="true"></span>
          <span><strong>${project.project_name}</strong><span>${detail}</span></span>
        </span>
        <span class="project-count">${count}</span>
      </a>`;
    })
    .join("");
}

async function currentSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
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
  const subscription = await currentSubscription().catch(() => null);
  if (subscription && Notification.permission === "granted") {
    elements.notificationTitle.textContent = "Phone alerts are on";
    elements.notificationDetail.textContent = "You will be notified about new tasks and an expired HAI login.";
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
    await renderNotifications(status || {});
    return;
  }
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(status.vapidPublicKey),
    });
  }
  await api("subscribe", { subscription: subscription.toJSON() });
  status = await api("status");
  await renderNotifications(status);
}

async function loadStatus() {
  if (!getToken()) {
    elements.pairingView.hidden = false;
    elements.dashboard.hidden = true;
    return;
  }

  elements.refreshButton.disabled = true;
  try {
    status = await api("status");
    elements.pairingView.hidden = true;
    elements.dashboard.hidden = false;
    renderMonitor(status);
    renderSummary(status.summary);
    renderProjects(status.projects);
    await renderNotifications(status);
  } catch (error) {
    setToken("");
    elements.pairingView.hidden = false;
    elements.dashboard.hidden = true;
    elements.pairingError.textContent = error.message;
    elements.pairingError.hidden = false;
  } finally {
    elements.refreshButton.disabled = false;
  }
}

elements.pairingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.pairingError.hidden = true;
  setToken(elements.pairingCode.value.trim());
  await loadStatus();
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
  if (subscription) {
    await api("unsubscribe", { endpoint: subscription.endpoint }).catch(() => {});
    await subscription.unsubscribe().catch(() => {});
  }
  setToken("");
  location.reload();
});

elements.refreshButton.addEventListener("click", loadStatus);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
}

loadStatus();
setInterval(() => {
  if (getToken() && !document.hidden) loadStatus();
}, 60_000);
