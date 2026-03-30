/**
 * VitaBot — Configuração de Administrador Permanente
 *
 * Este arquivo centraliza as credenciais e permissões do administrador master.
 * Para alterar as credenciais, edite apenas este arquivo.
 *
 * IMPORTANTE: Em produção, substitua por variáveis de ambiente seguras.
 */

export interface AdminCredential {
  email: string;
  /** Hash SHA-256 da senha (nunca armazene a senha em texto puro em produção) */
  passwordHash: string;
  name: string;
  role: "superadmin" | "admin";
  permanent: boolean;
}

/**
 * Lista de administradores permanentes do sistema.
 * O primeiro da lista é o superadmin (dono do sistema).
 */
export const ADMIN_CREDENTIALS: AdminCredential[] = [
  {
    // ── SUPERADMIN / DONO DO SISTEMA ──────────────────────────────────────────
    // Credenciais do proprietário — acesso total e permanente
    email: process.env.EXPO_PUBLIC_ADMIN_EMAIL ?? "admin@vitasaude.com.br",
    passwordHash: process.env.EXPO_PUBLIC_ADMIN_PASSWORD_HASH ?? "vitabot@2025#admin",
    name: process.env.EXPO_PUBLIC_OWNER_NAME ?? "Administrador VitaBot",
    role: "superadmin",
    permanent: true,
  },
];

/**
 * Verifica se um e-mail/senha corresponde a um administrador permanente.
 * Retorna o objeto AdminCredential se válido, ou null caso contrário.
 */
export function verifyAdminCredentials(
  email: string,
  password: string
): AdminCredential | null {
  const normalized = email.trim().toLowerCase();
  const found = ADMIN_CREDENTIALS.find(
    (cred) =>
      cred.email.toLowerCase() === normalized &&
      cred.passwordHash === password
  );
  return found ?? null;
}

/**
 * Verifica se um e-mail pertence a um administrador permanente.
 */
export function isPermanentAdmin(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return ADMIN_CREDENTIALS.some(
    (cred) => cred.email.toLowerCase() === normalized && cred.permanent
  );
}

/**
 * Retorna o nome do admin pelo e-mail.
 */
export function getAdminName(email: string): string {
  const normalized = email.trim().toLowerCase();
  const found = ADMIN_CREDENTIALS.find(
    (cred) => cred.email.toLowerCase() === normalized
  );
  return found?.name ?? "Administrador";
}

/**
 * Retorna o papel (role) do admin pelo e-mail.
 */
export function getAdminRole(email: string): "superadmin" | "admin" | null {
  const normalized = email.trim().toLowerCase();
  const found = ADMIN_CREDENTIALS.find(
    (cred) => cred.email.toLowerCase() === normalized
  );
  return found?.role ?? null;
}
