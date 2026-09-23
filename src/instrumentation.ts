/** Executado uma vez quando o servidor inicia: prepara o banco de dados. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/startup");
  }
}
