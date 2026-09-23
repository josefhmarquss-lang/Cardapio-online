import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSessionUser } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: `Entrar — ${BRAND.name}`, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(user.role === "superadmin" ? "/super" : "/admin");
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-stone-950 lg:block">
        { }
        <img src="/demo/banner-pizzaria.svg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-tr from-stone-950 via-stone-950/70 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <a href="/" className="flex items-center gap-2.5 text-lg font-extrabold">
            <span className="grid size-9 place-items-center rounded-xl bg-orange-600 text-sm">{BRAND.short}</span>
            {BRAND.name}
          </a>
          <div className="max-w-md">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight">Seu cardápio, seus pedidos, tudo em um só lugar.</h2>
            <p className="mt-4 text-stone-300">Atualize produtos, preços e fotos em segundos e acompanhe cada pedido que chega.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-stone-50 px-5 py-12">
        <div className="w-full max-w-sm">
          <a href="/" className="mb-10 flex items-center gap-2.5 text-lg font-extrabold lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-orange-600 text-sm text-white">{BRAND.short}</span>
            {BRAND.name}
          </a>
          <h1 className="text-3xl font-extrabold tracking-tight">Entrar no painel</h1>
          <p className="mt-2 text-sm text-stone-500">Use o e-mail e a senha que você recebeu ao contratar o serviço.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
