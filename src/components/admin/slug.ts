export function slugifyClient(s: string, keepTrailingDash = false): string {
  const out = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 48);
  return keepTrailingDash ? out : out.replace(/-+$/, "");
}
