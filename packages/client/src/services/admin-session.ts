const KEY = "ddm_admin_token";

export function salvarTokenAdmin(token: string) {
  sessionStorage.setItem(KEY, token);
}

export function carregarTokenAdmin(): string | null {
  return sessionStorage.getItem(KEY);
}

export function limparTokenAdmin() {
  sessionStorage.removeItem(KEY);
}