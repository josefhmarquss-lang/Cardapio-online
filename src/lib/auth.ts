import "server-only";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { HttpError } from "./http";
import { storeIsOperational } from "./repo/billing";
import type { SessionUser } from "./types";

export const SESSION_COOKIE = "cardapio_session";
const SESSION_DAYS = 14;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// hash fixo usado quando o e-mail não existe, para o tempo de resposta não revelar contas
let dummyHash: string | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("senha-inexistente", 12));

export async function verifyCredentials(email: string, password: string): Promise<SessionUser | null> {
  const row = db()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.store_id, u.password_hash, s.is_active AS store_active
         FROM users u LEFT JOIN stores s ON s.id = u.store_id
        WHERE u.email = ?`,
    )
    .get(email.trim()) as (SessionUser & { password_hash: string; store_active: number | null }) | undefined;
  const ok = await bcrypt.compare(password, row?.password_hash ?? getDummyHash());
  if (!row || !ok) return null;
  if (row.role === "owner" && !row.store_active) throw new HttpError(403, "Este estabelecimento está desativado. Fale com o suporte.");
  return { id: row.id, email: row.email, name: row.name, role: row.role, store_id: row.store_id };
}

function sha256(v: string) {
  return crypto.createHash("sha256").update(v).digest("hex");
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  const expires = now + SESSION_DAYS * 86400_000;
  const d = db();
  d.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
  d.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
    sha256(token),
    userId,
    expires,
    now,
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
  jar.delete(SESSION_COOKIE);
}

/** Usuário da sessão atual, validado no banco a cada requisição. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.store_id, s.is_active AS store_active
         FROM sessions ss
         JOIN users u ON u.id = ss.user_id
         LEFT JOIN stores s ON s.id = u.store_id
        WHERE ss.token_hash = ? AND ss.expires_at > ?`,
    )
    .get(sha256(token), Date.now()) as (SessionUser & { store_active: number | null }) | undefined;
  if (!row) return null;
  if (row.role === "owner" && !row.store_active) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role, store_id: row.store_id };
}

/**
 * Para APIs do painel: exige dono de loja autenticado e devolve o ID da loja
 * vinculado à conta. O ID nunca vem da URL ou do corpo da requisição.
 */
export async function requireOwner(opts: { allowLocked?: boolean } = {}): Promise<{ user: SessionUser; storeId: number }> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Sessão expirada. Entre novamente.");
  if (user.role !== "owner" || !user.store_id) throw new HttpError(403, "Acesso negado.");
  if (!opts.allowLocked && !(await storeIsOperational(user.store_id)))
    throw new HttpError(402, "Sua assinatura está vencida. Regularize em Assinatura para voltar a usar o painel.");
  return { user, storeId: user.store_id };
}

export async function requireSuperadmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Sessão expirada. Entre novamente.");
  if (user.role !== "superadmin") throw new HttpError(403, "Acesso negado.");
  return user;
}

/** Para páginas (server components): redireciona ao login quando necessário. */
export async function requireOwnerPage(): Promise<{ user: SessionUser; storeId: number }> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role === "superadmin") redirect("/super");
  return { user, storeId: user.store_id! };
}

export async function requireSuperadminPage(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "superadmin") redirect("/admin");
  return user;
}

export async function changePassword(userId: number, current: string, next: string) {
  const row = db().prepare("SELECT password_hash FROM users WHERE id = ?").get(userId) as { password_hash: string } | undefined;
  if (!row || !(await bcrypt.compare(current, row.password_hash))) throw new HttpError(400, "Senha atual incorreta.");
  const hash = await hashPassword(next);
  const d = db();
  d.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, userId);
  // encerra as outras sessões e mantém a atual
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  d.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?").run(userId, token ? sha256(token) : "");
}
