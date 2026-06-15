export function initCredits() {
  const dialog = document.getElementById("credits-dialog") as HTMLDialogElement;
  const openBtn = document.getElementById("btn-credits")!;
  const closeBtn = document.getElementById("btn-close-credits")!;
  const brandHome = document.getElementById("brand-home")!;

  openBtn.addEventListener("click", () => dialog.showModal());
  closeBtn.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  brandHome.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}