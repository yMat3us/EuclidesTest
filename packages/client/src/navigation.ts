export type AppView =
  | "home"
  | "grupo"
  | "login"
  | "arena"
  | "ranking";

const PANELS: Record<AppView, string> = {
  home: "home-panel",
  grupo: "grupo-panel",
  login: "login-panel",
  arena: "arena-panel",
  ranking: "ranking-panel",
};

export function showView(view: AppView) {
  for (const [key, id] of Object.entries(PANELS)) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle("hidden", key !== view);
    }
  }
  
  const gameContainer = document.getElementById("game-container");
  if (gameContainer) gameContainer.classList.add("hidden");
  
  const viewHub = document.getElementById("view-hub");
  if (viewHub) viewHub.classList.remove("hidden");

  // Atualiza classe active nos botões da barra de navegação superior
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    const targetView = (btn as HTMLElement).dataset.view;
    const active =
      targetView === view ||
      (view === "arena" && targetView === "login") ||
      (view === "login" && targetView === "login");
    btn.classList.toggle("active", active);
  });
}