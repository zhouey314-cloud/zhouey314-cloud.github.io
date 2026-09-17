const opportunities = [
  { title: "Demo Opportunity 01", account: "Sample Account 01", stage: "Qualified", action: "Confirm solution scope", updated: "Today" },
  { title: "Demo Opportunity 02", account: "Sample Account 02", stage: "Qualified", action: "Discovery follow-up", updated: "Today" },
  { title: "Demo Opportunity 03", account: "Sample Account 03", stage: "Solution fit", action: "Confirm user roles", updated: "Yesterday" },
  { title: "Demo Opportunity 04", account: "Sample Account 04", stage: "Solution fit", action: "Verify integration scope", updated: "Sep 13" },
  { title: "Demo Opportunity 05", account: "Sample Account 05", stage: "Proposal", action: "Quotation review", updated: "Sep 12" },
  { title: "Demo Opportunity 06", account: "Sample Account 06", stage: "Negotiation", action: "Contract redline", updated: "Sep 11" },
];

const labels = {
  dashboard: ["Dashboard", "OVERVIEW"], pipeline: ["Pipeline", "WORKFLOW"], opportunity: ["Opportunity", "RECORDS"],
  quotation: ["Quotation", "REVIEW"], contract: ["Contract", "ACCEPTANCE"], delivery: ["Delivery", "HANDOFF"],
  analytics: ["Analytics", "EVIDENCE"], assistant: ["AI Assistant", "HUMAN-IN-THE-LOOP"],
};

const body = document.body;
const sidebar = document.querySelector("[data-sidebar]");
const menuButton = document.querySelector("[data-menu]");
const drawer = document.querySelector("[data-drawer]");

function switchView(name, updateHash = true) {
  if (!labels[name]) name = "dashboard";
  document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === name));
  document.querySelectorAll("[data-view]").forEach((item) => item.classList.toggle("active", item.dataset.view === name));
  document.querySelector("[data-title]").textContent = labels[name][0];
  document.querySelector("[data-crumb]").textContent = labels[name][1];
  if (updateHash) history.replaceState(null, "", `#${name}`);
  sidebar.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function openOpportunity(index) {
  const item = opportunities[index] || opportunities[0];
  document.querySelector("[data-drawer-title]").textContent = item.title;
  document.querySelector("[data-drawer-account]").textContent = item.account;
  document.querySelector("[data-drawer-stage]").textContent = item.stage;
  document.querySelector("[data-drawer-action]").textContent = item.action;
  drawer.showModal();
  body.style.overflow = "hidden";
}

document.querySelector("[data-opportunity-rows]").innerHTML = opportunities.map((item, index) => `
  <tr tabindex="0" data-open-opportunity="${index}"><td><b>${item.title}</b></td><td>${item.account}</td><td><span class="status ${item.stage === "Negotiation" ? "amber" : item.stage === "Proposal" ? "green" : "gray"}">${item.stage.toUpperCase()}</span></td><td>Ethan</td><td>${item.action}</td><td>${item.updated}</td></tr>
`).join("");

document.addEventListener("click", (event) => {
  const navTarget = event.target.closest("[data-view], [data-view-link]");
  if (navTarget) switchView(navTarget.dataset.view || navTarget.dataset.viewLink);
  const opportunityTarget = event.target.closest("[data-open-opportunity]");
  if (opportunityTarget) openOpportunity(Number(opportunityTarget.dataset.openOpportunity));
  if (event.target.closest("[data-open-first]")) openOpportunity(0);
});

document.querySelectorAll("[data-opportunity-rows] tr").forEach((row) => row.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openOpportunity(Number(row.dataset.openOpportunity)); }
}));

menuButton.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll("[data-drawer-close]").forEach((button) => button.addEventListener("click", () => drawer.close()));
drawer.addEventListener("click", (event) => { if (event.target === drawer) drawer.close(); });
drawer.addEventListener("close", () => { body.style.overflow = ""; });

document.querySelector("[data-assistant-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector(".ai-message>p").textContent = "这是一条界面交互示例：建议先检查需求范围、验收方式和责任人，再由人工决定是否写入记录或对外发送。";
});

document.querySelectorAll("[data-prompt]").forEach((button) => button.addEventListener("click", () => {
  document.querySelector("#assistant-input").value = button.textContent.trim();
}));

switchView(location.hash.slice(1), false);
