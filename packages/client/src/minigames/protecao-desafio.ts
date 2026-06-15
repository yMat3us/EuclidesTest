/** Bloqueia trapaça: trocar aba, minimizar ou recarregar durante o desafio */
export function iniciarProtecaoDesafio() {
  let violou = false;
  let ativo = true;

  const marcarViolacao = () => {
    if (ativo) violou = true;
  };

  const onVisibility = () => {
    if (document.hidden) marcarViolacao();
  };

  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    marcarViolacao();
    e.preventDefault();
  };

  const onPageHide = () => marcarViolacao();

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("beforeunload", onBeforeUnload);
  window.addEventListener("pagehide", onPageHide);

  return {
    foiAnulado: () => violou,
    encerrar: () => {
      ativo = false;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    },
  };
}