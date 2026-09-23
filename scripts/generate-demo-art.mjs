// Gera as ilustrações (SVG) da pizzaria de demonstração em public/demo/.
// Uso: node scripts/generate-demo-art.mjs
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "demo");
fs.mkdirSync(OUT, { recursive: true });

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const f = (n) => Number(n.toFixed(1));

// ---------- fundos ----------
function boardBg(id, dark = "#1d1410", mid = "#3a281d") {
  return `
  <defs>
    <radialGradient id="${id}bg" cx="50%" cy="40%" r="75%">
      <stop offset="0" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/>
    </radialGradient>
    <radialGradient id="${id}board" cx="45%" cy="40%" r="60%">
      <stop offset="0" stop-color="#b98252"/><stop offset="1" stop-color="#8a5a33"/>
    </radialGradient>
    <filter id="${id}shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="${id}soft"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <rect width="640" height="640" fill="url(#${id}bg)"/>`;
}

function flour(r, n, cx = 320, cy = 320, spread = 320) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = spread * (0.75 + r() * 0.35);
    s += `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="${f(0.8 + r() * 2.2)}" fill="#fff" opacity="${f(0.15 + r() * 0.35)}"/>`;
  }
  return s;
}

// ---------- coberturas ----------
const T = {
  pepperoni: (x, y, r, k = 1) => {
    const R = 25 * k;
    let s = `<circle cx="${x}" cy="${y}" r="${R + 2}" fill="#7d1d12" opacity=".55"/><circle cx="${x}" cy="${y}" r="${R}" fill="#b8321f"/><circle cx="${x - R * 0.2}" cy="${y - R * 0.25}" r="${R * 0.55}" fill="#c9442c" opacity=".7"/>`;
    for (let i = 0; i < 5; i++) s += `<circle cx="${f(x + (r() - 0.5) * R * 1.3)}" cy="${f(y + (r() - 0.5) * R * 1.3)}" r="${f(1.5 + r() * 2)}" fill="#e98b6c" opacity=".8"/>`;
    return s;
  },
  calabresa: (x, y, r) => {
    let s = `<circle cx="${x}" cy="${y}" r="24" fill="#6e2419" opacity=".5"/><circle cx="${x}" cy="${y}" r="22" fill="#a4412c"/><circle cx="${x}" cy="${y}" r="22" fill="none" stroke="#7a2a1b" stroke-width="3"/>`;
    for (let i = 0; i < 8; i++) s += `<circle cx="${f(x + (r() - 0.5) * 30)}" cy="${f(y + (r() - 0.5) * 30)}" r="${f(1.6 + r() * 2.2)}" fill="#f0c7a8" opacity=".85"/>`;
    return s;
  },
  basil: (x, y, r) => {
    const a = f(r() * 360);
    return `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-26 0 C-12 -16 12 -16 26 0 C12 16 -12 16 -26 0Z" fill="#2f7a35"/><path d="M-24 0 C-8 -9 8 -9 24 0" fill="#3f9645" opacity=".8"/><path d="M-22 0 L22 0" stroke="#1f5a25" stroke-width="1.6"/></g>`;
  },
  arugula: (x, y, r) => {
    const a = f(r() * 360);
    return `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-30 0 L-22 -8 L-16 -2 L-10 -12 L-3 -4 L4 -13 L10 -4 L18 -11 L22 -2 L30 0 L22 4 L18 11 L10 5 L4 13 L-3 5 L-10 12 L-16 3 L-22 8Z" fill="#4c8c2b"/><path d="M-28 0 L28 0" stroke="#2f5e19" stroke-width="1.5"/></g>`;
  },
  tomato: (x, y, r) => {
    let s = `<circle cx="${x}" cy="${y}" r="27" fill="#a8261b"/><circle cx="${x}" cy="${y}" r="24" fill="#e0473a"/><circle cx="${x}" cy="${y}" r="9" fill="#f07a62"/>`;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      s += `<ellipse cx="${f(x + Math.cos(a) * 15)}" cy="${f(y + Math.sin(a) * 15)}" rx="5" ry="3.2" transform="rotate(${f((a * 180) / Math.PI)} ${f(x + Math.cos(a) * 15)} ${f(y + Math.sin(a) * 15)})" fill="#f6b04e" opacity=".9"/>`;
    }
    return s;
  },
  driedTomato: (x, y, r) => {
    const a = f(r() * 360);
    return `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-16 -8 C-6 -16 12 -14 17 -3 C20 8 6 15 -6 12 C-18 9 -22 0 -16 -8Z" fill="#8e1f16"/><path d="M-10 -4 C-2 -9 8 -8 11 -1" stroke="#c0462f" stroke-width="3" fill="none"/></g>`;
  },
  olive: (x, y) => `<circle cx="${x}" cy="${y}" r="10" fill="#1b1b1b"/><circle cx="${x}" cy="${y}" r="4" fill="#5a4a2a"/><circle cx="${x - 3}" cy="${y - 4}" r="2" fill="#666" opacity=".7"/>`,
  greenOlive: (x, y) => `<circle cx="${x}" cy="${y}" r="10" fill="#6f7f24"/><circle cx="${x}" cy="${y}" r="4" fill="#c7452d"/>`,
  onion: (x, y, r) => {
    const a = f(r() * 180);
    return `<g transform="rotate(${a} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="22" ry="15" fill="none" stroke="#a2528f" stroke-width="4" opacity=".9"/><ellipse cx="${x}" cy="${y}" rx="15" ry="9" fill="none" stroke="#e7c7e0" stroke-width="3" opacity=".9"/></g>`;
  },
  ham: (x, y, r) => {
    const a = f(r() * 360);
    return `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-22 -14 Q0 -20 22 -14 Q26 0 22 14 Q0 20 -22 14 Q-26 0 -22 -14Z" fill="#e79c98"/><path d="M-16 -8 Q0 -12 16 -8" stroke="#f6c9c3" stroke-width="3" fill="none"/></g>`;
  },
  parma: (x, y, r) => {
    const a = f(r() * 360);
    return `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-34 -6 C-20 -22 0 -8 12 -18 C24 -26 36 -12 32 2 C28 18 8 8 -4 18 C-18 28 -38 12 -34 -6Z" fill="#c9575a"/><path d="M-26 -2 C-12 -12 4 -2 20 -10" stroke="#f3d6cf" stroke-width="4" fill="none" opacity=".9"/><path d="M-22 10 C-8 4 6 12 22 4" stroke="#b04347" stroke-width="3" fill="none"/></g>`;
  },
  mushroom: (x, y, r) => {
    const a = f(r() * 360);
    return `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-20 2 C-20 -16 20 -16 20 2 L8 2 L8 16 C8 20 -8 20 -8 16 L-8 2Z" fill="#dcc6a4" stroke="#8a6a45" stroke-width="2.5"/><path d="M-14 -2 C-12 -10 12 -10 14 -2" stroke="#b39271" stroke-width="2" fill="none"/></g>`;
  },
  corn: (x, y, r) => {
    let s = "";
    for (let i = 0; i < 3; i++) s += `<ellipse cx="${f(x + (r() - 0.5) * 18)}" cy="${f(y + (r() - 0.5) * 18)}" rx="5.5" ry="4.5" fill="#f7c540" stroke="#d99a1e" stroke-width="1.4"/>`;
    return s;
  },
  chicken: (x, y, r) => {
    let s = "";
    for (let i = 0; i < 4; i++) {
      const a = f(r() * 180);
      const cx = f(x + (r() - 0.5) * 26), cy = f(y + (r() - 0.5) * 26);
      s += `<rect x="${f(cx - 11)}" y="${f(cy - 3)}" width="22" height="6" rx="3" fill="#e9cc9c" stroke="#c9a06a" stroke-width="1.2" transform="rotate(${a} ${cx} ${cy})"/>`;
    }
    return s;
  },
  catupiry: (x, y, r) => {
    const a = f(r() * 360);
    return `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-30 0 C-20 -14 -10 14 0 0 C10 -14 20 14 30 0" stroke="#fffaf0" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M-30 -2 C-20 -16 -10 12 0 -2" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".8"/></g>`;
  },
  bacon: (x, y, r) => {
    const a = f(r() * 360);
    return `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-28 -6 C-18 -12 -8 0 2 -6 C12 -12 22 0 30 -6 L30 6 C22 12 12 0 2 6 C-8 12 -18 0 -28 6Z" fill="#9a3a26"/><path d="M-26 0 C-18 -5 -8 5 2 0 C12 -5 22 5 28 0" stroke="#f0c8a8" stroke-width="3" fill="none"/></g>`;
  },
  egg: (x, y, r) => `<ellipse cx="${x}" cy="${y}" rx="18" ry="14" fill="#fffdf6" stroke="#e8e0cc" stroke-width="1.5" transform="rotate(${f(r() * 180)} ${x} ${y})"/><circle cx="${x}" cy="${y}" r="7.5" fill="#f5b52e"/>`,
  peas: (x, y, r) => {
    let s = "";
    for (let i = 0; i < 3; i++) s += `<circle cx="${f(x + (r() - 0.5) * 16)}" cy="${f(y + (r() - 0.5) * 16)}" r="4.2" fill="#7fb241" stroke="#4f7f22" stroke-width="1"/>`;
    return s;
  },
  parmesan: (x, y, r) => {
    const a = f(r() * 360);
    return `<path d="M${x - 12} ${y - 4} L${x + 8} ${y - 9} L${x + 13} ${y + 3} L${x - 6} ${y + 8}Z" fill="#fbeec1" stroke="#e2cc8a" stroke-width="1.2" transform="rotate(${a} ${x} ${y})"/>`;
  },
  gorgonzola: (x, y, r) => {
    let s = `<circle cx="${x}" cy="${y}" r="13" fill="#f3efe2"/>`;
    for (let i = 0; i < 4; i++) s += `<circle cx="${f(x + (r() - 0.5) * 16)}" cy="${f(y + (r() - 0.5) * 16)}" r="${f(1.5 + r() * 1.5)}" fill="#6a8a8a"/>`;
    return s;
  },
  strawberry: (x, y, r) => {
    const a = f(r() * 360);
    let s = `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 -20 C16 -22 24 -6 16 8 C10 18 4 22 0 24 C-4 22 -10 18 -16 8 C-24 -6 -16 -22 0 -20Z" fill="#d7263d"/><path d="M0 -20 C10 -20 14 -12 12 -4" stroke="#f36b7f" stroke-width="3" fill="none" opacity=".7"/>`;
    for (let i = 0; i < 7; i++) s += `<ellipse cx="${f((r() - 0.5) * 22)}" cy="${f((r() - 0.3) * 30)}" rx="1.3" ry="2" fill="#ffe08a"/>`;
    return s + `<path d="M-8 -20 L0 -26 L8 -20 L0 -17Z" fill="#3f8c2a"/></g>`;
  },
  banana: (x, y, r) => `<circle cx="${x}" cy="${y}" r="17" fill="#f8e7a6" stroke="#e2c46c" stroke-width="2"/><circle cx="${x}" cy="${y}" r="5" fill="#d9bf73" opacity=".7"/><circle cx="${f(x + 6)}" cy="${f(y - 5)}" r="2" fill="#8b5a2b" opacity=".6"/>`,
  goiabada: (x, y, r) => {
    const a = f(r() * 90);
    return `<rect x="${x - 12}" y="${y - 12}" width="24" height="24" rx="4" fill="#9b1d2a" transform="rotate(${a} ${x} ${y})"/><rect x="${x - 8}" y="${y - 9}" width="10" height="5" rx="2" fill="#c64352" opacity=".7" transform="rotate(${a} ${x} ${y})"/>`;
  },
  chocolateChip: (x, y) => `<path d="M${x - 7} ${y + 5} L${x} ${y - 8} L${x + 7} ${y + 5}Z" fill="#3a2016"/>`,
};

function scatter(r, n, radius, minDist, existing = []) {
  const pts = [];
  let tries = 0;
  while (pts.length < n && tries < 4000) {
    tries++;
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * radius;
    const p = [320 + Math.cos(a) * d, 320 + Math.sin(a) * d];
    if ([...pts, ...existing].every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > minDist)) pts.push(p);
  }
  existing.push(...pts);
  return pts;
}

function pizzaBody(seed, { base = "cheese", toppings = [], cuts = true }) {
  const r = rng(seed);
  const id = `p${seed}`;
  let s = `
  <defs>
    <radialGradient id="${id}crust" cx="50%" cy="45%" r="55%">
      <stop offset=".78" stop-color="#e7b36f"/><stop offset=".9" stop-color="#d49549"/><stop offset="1" stop-color="#a86a2c"/>
    </radialGradient>
    <radialGradient id="${id}cheese" cx="45%" cy="40%" r="60%">
      <stop offset="0" stop-color="#fbe3a0"/><stop offset=".7" stop-color="#f3cb6c"/><stop offset="1" stop-color="#e7ad4a"/>
    </radialGradient>
    <radialGradient id="${id}choc" cx="45%" cy="40%" r="60%">
      <stop offset="0" stop-color="#6d4331"/><stop offset="1" stop-color="#3e2418"/>
    </radialGradient>
    <radialGradient id="${id}sauce" cx="45%" cy="40%" r="60%">
      <stop offset="0" stop-color="#d9442f"/><stop offset="1" stop-color="#a92a1b"/>
    </radialGradient>
  </defs>
  <ellipse cx="330" cy="345" rx="262" ry="258" fill="#000" opacity=".45" filter="url(#bshadow)"/>
  <circle cx="320" cy="320" r="252" fill="url(#${id}crust)"/>`;
  // manchas de forno a lenha na borda
  for (let i = 0; i < 42; i++) {
    const a = r() * Math.PI * 2;
    const d = 222 + r() * 26;
    s += `<ellipse cx="${f(320 + Math.cos(a) * d)}" cy="${f(320 + Math.sin(a) * d)}" rx="${f(3 + r() * 8)}" ry="${f(2 + r() * 5)}" fill="#5a2e12" opacity="${f(0.25 + r() * 0.45)}" transform="rotate(${f((a * 180) / Math.PI)} ${f(320 + Math.cos(a) * d)} ${f(320 + Math.sin(a) * d)})"/>`;
  }
  s += `<circle cx="320" cy="320" r="252" fill="none" stroke="#f3d29c" stroke-width="3" opacity=".35"/>`;
  if (base.startsWith("chocolate")) {
    s += `<circle cx="320" cy="320" r="214" fill="url(#${id}choc)"/>`;
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 195;
      s += `<ellipse cx="${f(320 + Math.cos(a) * d)}" cy="${f(320 + Math.sin(a) * d)}" rx="${f(10 + r() * 22)}" ry="${f(6 + r() * 12)}" fill="#8a5a40" opacity=".35"/>`;
    }
  } else {
    s += `<circle cx="320" cy="320" r="216" fill="url(#${id}sauce)"/>`;
    // queijo derretido em "gotas"
    s += `<circle cx="320" cy="320" r="200" fill="url(#${id}cheese)"/>`;
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, d = 185 + r() * 25;
      s += `<circle cx="${f(320 + Math.cos(a) * d)}" cy="${f(320 + Math.sin(a) * d)}" r="${f(14 + r() * 14)}" fill="#f1c461"/>`;
    }
    for (let i = 0; i < 40; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 190;
      s += `<ellipse cx="${f(320 + Math.cos(a) * d)}" cy="${f(320 + Math.sin(a) * d)}" rx="${f(8 + r() * 20)}" ry="${f(6 + r() * 12)}" fill="#fff1c4" opacity="${f(0.35 + r() * 0.4)}"/>`;
    }
    for (let i = 0; i < 34; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 200;
      s += `<circle cx="${f(320 + Math.cos(a) * d)}" cy="${f(320 + Math.sin(a) * d)}" r="${f(2 + r() * 6)}" fill="#c9802c" opacity="${f(0.35 + r() * 0.4)}"/>`;
    }
    if (base === "margherita") {
      for (let i = 0; i < 9; i++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 180;
        s += `<ellipse cx="${f(320 + Math.cos(a) * d)}" cy="${f(320 + Math.sin(a) * d)}" rx="${f(14 + r() * 16)}" ry="${f(10 + r() * 10)}" fill="#c93a26" opacity=".85"/>`;
      }
    }
  }
  const taken = [];
  for (const [kind, n, dist] of toppings) {
    for (const [x, y] of scatter(r, n, 180, dist, taken)) s += T[kind](f(x), f(y), r);
  }
  if (base === "chocolate-white") {
    // fios de chocolate branco
    for (let i = 0; i < 5; i++) {
      const y0 = 190 + i * 62;
      s += `<path d="M150 ${y0} C230 ${y0 - 40} 300 ${y0 + 40} 380 ${y0} S 470 ${y0 - 30} 500 ${y0 + 10}" stroke="#fff6e8" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>`;
    }
  }
  if (cuts) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI + 0.25;
      s += `<line x1="${f(320 + Math.cos(a) * 250)}" y1="${f(320 + Math.sin(a) * 250)}" x2="${f(320 - Math.cos(a) * 250)}" y2="${f(320 - Math.sin(a) * 250)}" stroke="#7a3f14" stroke-width="3" opacity=".28"/>`;
    }
  }
  // brilho
  s += `<ellipse cx="260" cy="230" rx="120" ry="70" fill="#fff" opacity=".07" transform="rotate(-30 260 230)"/>`;
  return s;
}

function pizzaSvg(seed, spec, extra = "") {
  const r = rng(seed + 99);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">${boardBg("b")}
  <circle cx="320" cy="325" r="300" fill="#000" opacity=".35" filter="url(#bshadow)"/>
  <circle cx="320" cy="320" r="296" fill="url(#bboard)"/>
  ${Array.from({ length: 7 }, (_, i) => `<circle cx="320" cy="320" r="${280 - i * 3}" fill="none" stroke="#6f4424" stroke-width="1" opacity="${f(0.12 + r() * 0.1)}"/>`).join("")}
  ${flour(r, 60)}
  ${pizzaBody(seed, spec)}
  ${extra}
</svg>`;
}

const pizzas = {
  "pizza-margherita": [11, { base: "margherita", toppings: [["tomato", 5, 70], ["basil", 9, 40], ["gorgonzola", 0, 0]] }],
  "pizza-calabresa": [23, { toppings: [["calabresa", 14, 50], ["onion", 8, 30], ["olive", 6, 30]] }],
  "pizza-mucarela": [37, { toppings: [["tomato", 6, 70], ["olive", 9, 30]] }],
  "pizza-portuguesa": [41, { toppings: [["ham", 9, 48], ["egg", 6, 45], ["onion", 6, 30], ["peas", 8, 22], ["olive", 6, 26]] }],
  "pizza-frango-catupiry": [53, { toppings: [["chicken", 16, 36], ["catupiry", 6, 50], ["olive", 5, 28]] }],
  "pizza-quatro-queijos": [67, { toppings: [["gorgonzola", 12, 40], ["parmesan", 18, 22]] }],
  "pizza-pepperoni": [79, { toppings: [["pepperoni", 17, 52]] }],
  "pizza-parma-rucula": [83, { toppings: [["parma", 7, 70], ["arugula", 12, 34], ["driedTomato", 7, 34], ["parmesan", 10, 20]] }],
  "pizza-caipira": [97, { toppings: [["chicken", 10, 36], ["corn", 16, 26], ["bacon", 7, 50], ["catupiry", 4, 50]] }],
  "pizza-funghi": [101, { toppings: [["mushroom", 16, 42], ["arugula", 4, 40], ["parmesan", 8, 20]] }],
  "pizza-chocolate-morango": [113, { base: "chocolate-white", toppings: [["strawberry", 13, 50], ["chocolateChip", 10, 18]] }],
  "pizza-banana-canela": [127, { base: "chocolate", toppings: [["banana", 22, 36]] }],
  "pizza-romeu-julieta": [131, { toppings: [["goiabada", 18, 40]] }],
};

for (const [name, [seed, spec]] of Object.entries(pizzas)) {
  let extra = "";
  if (name === "pizza-banana-canela") {
    const r = rng(7);
    for (let i = 0; i < 160; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 200;
      extra += `<circle cx="${f(320 + Math.cos(a) * d)}" cy="${f(320 + Math.sin(a) * d)}" r="${f(0.8 + r() * 1.8)}" fill="#7a3f14" opacity=".7"/>`;
    }
  }
  fs.writeFileSync(path.join(OUT, `${name}.svg`), pizzaSvg(seed, spec, extra));
}

// ---------- bebidas ----------
function drinkBg(c1, c2) {
  return `<defs><radialGradient id="dbg" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>
  <filter id="dsh"><feGaussianBlur stdDeviation="10"/></filter></defs><rect width="640" height="640" fill="url(#dbg)"/>`;
}

function can(x, color, band, label) {
  return `<g transform="translate(${x} 0)">
  <ellipse cx="0" cy="560" rx="95" ry="18" fill="#000" opacity=".35" filter="url(#dsh)"/>
  <defs><linearGradient id="can${label}" x1="0" x2="1"><stop offset="0" stop-color="${color}" stop-opacity=".75"/><stop offset=".35" stop-color="${color}"/><stop offset=".55" stop-color="#fff" stop-opacity=".35"/><stop offset=".7" stop-color="${color}"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
  <linearGradient id="lid${label}" x1="0" x2="1"><stop offset="0" stop-color="#9aa0a6"/><stop offset=".5" stop-color="#f1f3f4"/><stop offset="1" stop-color="#80868b"/></linearGradient></defs>
  <path d="M-80 150 Q-80 130 -70 122 L70 122 Q80 130 80 150 L80 520 Q80 548 60 552 L-60 552 Q-80 548 -80 520Z" fill="url(#can${label})"/>
  <ellipse cx="0" cy="124" rx="70" ry="14" fill="url(#lid${label})"/><ellipse cx="0" cy="124" rx="56" ry="10" fill="#c7cbd0"/>
  <rect x="-80" y="300" width="160" height="70" fill="${band}" opacity=".95"/>
  <text x="0" y="346" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="30" fill="#fff" letter-spacing="2">${label}</text>
  <path d="M-80 520 Q-80 548 -60 552 L60 552 Q80 548 80 520" fill="none" stroke="#bfc4c9" stroke-width="6"/>
  </g>`;
}

const bubbles = (r, n) =>
  Array.from({ length: n }, () => `<circle cx="${f(r() * 640)}" cy="${f(r() * 640)}" r="${f(2 + r() * 7)}" fill="#fff" opacity="${f(0.06 + r() * 0.12)}"/>`).join("");

fs.writeFileSync(
  path.join(OUT, "bebida-lata.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">${drinkBg("#34495e", "#10161d")}${bubbles(rng(3), 40)}
  ${can(200, "#b3261e", "#7a1a14", "COLA")}${can(440, "#1e7a3c", "#0f4d24", "GUARANÁ")}</svg>`,
);

fs.writeFileSync(
  path.join(OUT, "bebida-2l.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">${drinkBg("#3d2a22", "#140d0a")}${bubbles(rng(5), 40)}
  <defs><linearGradient id="bt" x1="0" x2="1"><stop offset="0" stop-color="#2a0f08" stop-opacity=".9"/><stop offset=".4" stop-color="#4a1d10"/><stop offset=".55" stop-color="#fff" stop-opacity=".25"/><stop offset=".7" stop-color="#3a160b"/><stop offset="1" stop-color="#000"/></linearGradient></defs>
  <ellipse cx="320" cy="585" rx="120" ry="18" fill="#000" opacity=".4" filter="url(#dsh)"/>
  <rect x="292" y="40" width="56" height="40" rx="6" fill="#c62828"/><rect x="288" y="74" width="64" height="10" rx="3" fill="#a31f1f"/>
  <path d="M300 84 L340 84 L346 130 Q420 170 420 250 L420 540 Q420 580 380 582 L260 582 Q220 580 220 540 L220 250 Q220 170 294 130Z" fill="url(#bt)"/>
  <rect x="220" y="300" width="200" height="120" fill="#c62828"/><rect x="220" y="300" width="200" height="10" fill="#f5f5f5" opacity=".7"/><rect x="220" y="410" width="200" height="10" fill="#f5f5f5" opacity=".7"/>
  <text x="320" y="372" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="40" fill="#fff" letter-spacing="3">2 L</text>
  <path d="M240 200 Q250 180 270 170" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".25" fill="none"/></svg>`,
);

fs.writeFileSync(
  path.join(OUT, "bebida-suco.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">${drinkBg("#f6b64a", "#b86410")}${bubbles(rng(9), 30)}
  <defs><linearGradient id="juice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb62e"/><stop offset="1" stop-color="#f07f0a"/></linearGradient></defs>
  <ellipse cx="320" cy="590" rx="130" ry="18" fill="#000" opacity=".3" filter="url(#dsh)"/>
  <path d="M200 130 L440 130 L410 575 Q408 588 395 588 L245 588 Q232 588 230 575Z" fill="#fff" opacity=".25"/>
  <path d="M212 200 L428 200 L408 570 Q406 580 395 580 L245 580 Q234 580 232 570Z" fill="url(#juice)"/>
  <ellipse cx="320" cy="200" rx="108" ry="14" fill="#ffd27a"/>
  <path d="M230 150 L250 560" stroke="#fff" stroke-width="10" opacity=".35" stroke-linecap="round"/>
  <g transform="translate(420 170) rotate(20)"><circle r="78" fill="#f7a21b"/><circle r="68" fill="#ffd166"/>${Array.from({ length: 10 }, (_, i) => `<path d="M0 0 L${f(Math.cos((i / 10) * 6.283) * 64)} ${f(Math.sin((i / 10) * 6.283) * 64)} L${f(Math.cos(((i + 1) / 10) * 6.283) * 64)} ${f(Math.sin(((i + 1) / 10) * 6.283) * 64)}Z" fill="#ffb627" stroke="#fff3c4" stroke-width="3"/>`).join("")}<circle r="8" fill="#fff3c4"/></g>
  <rect x="330" y="60" width="14" height="300" rx="7" fill="#fff" transform="rotate(12 337 210)"/><rect x="330" y="60" width="14" height="40" fill="#e63946" transform="rotate(12 337 210)"/>
  </svg>`,
);

fs.writeFileSync(
  path.join(OUT, "bebida-agua.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">${drinkBg("#5fb3d9", "#1c5b7a")}${bubbles(rng(11), 50)}
  <defs><linearGradient id="w" x1="0" x2="1"><stop offset="0" stop-color="#bfe6f7" stop-opacity=".6"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#8ccbe6" stop-opacity=".6"/></linearGradient></defs>
  <ellipse cx="320" cy="585" rx="100" ry="16" fill="#000" opacity=".3" filter="url(#dsh)"/>
  <rect x="296" y="70" width="48" height="36" rx="6" fill="#1565c0"/>
  <path d="M302 106 L338 106 L344 150 Q400 180 400 240 L400 550 Q400 582 370 584 L270 584 Q240 582 240 550 L240 240 Q240 180 296 150Z" fill="url(#w)"/>
  <rect x="240" y="320" width="160" height="100" fill="#1976d2"/><text x="320" y="380" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="30" fill="#fff" letter-spacing="3">ÁGUA</text>
  </svg>`,
);

// ---------- sobremesas ----------
function plate(extra, bg1 = "#3a2a24", bg2 = "#120b08") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">${drinkBg(bg1, bg2)}
  <ellipse cx="320" cy="360" rx="270" ry="200" fill="#000" opacity=".4" filter="url(#dsh)"/>
  <ellipse cx="320" cy="345" rx="265" ry="195" fill="#f4f1ea"/><ellipse cx="320" cy="345" rx="200" ry="145" fill="#fbf9f4" stroke="#e5e0d4" stroke-width="3"/>
  ${extra}</svg>`;
}

fs.writeFileSync(
  path.join(OUT, "sobremesa-petit-gateau.svg"),
  plate(`<path d="M150 300 C200 260 260 330 330 300 C400 270 460 330 500 300" stroke="#4a2415" stroke-width="10" fill="none" stroke-linecap="round" opacity=".85"/>
  <ellipse cx="290" cy="380" rx="105" ry="36" fill="#2d160c"/>
  <path d="M185 380 Q185 260 290 250 Q395 260 395 380Z" fill="#4a2415"/><path d="M200 330 Q230 270 290 262" stroke="#7a4a33" stroke-width="10" fill="none" opacity=".5" stroke-linecap="round"/>
  <path d="M250 300 Q240 340 260 390 Q280 400 300 392 Q330 360 320 300Z" fill="#2a1209"/>
  <ellipse cx="420" cy="300" rx="62" ry="54" fill="#fff8e7"/><ellipse cx="410" cy="286" rx="30" ry="18" fill="#fff" opacity=".9"/>
  <circle cx="395" cy="300" r="3" fill="#2b1a10"/><circle cx="430" cy="315" r="3" fill="#2b1a10"/><circle cx="420" cy="290" r="2.5" fill="#2b1a10"/>
  <path d="M430 250 L445 232 L452 248Z" fill="#3f8c2a"/><path d="M440 252 L462 240 L456 258Z" fill="#4ea536"/>
  <circle cx="160" cy="380" r="4" fill="#d7263d"/><circle cx="178" cy="398" r="3" fill="#d7263d"/><circle cx="480" cy="400" r="4" fill="#d7263d"/>`),
);

fs.writeFileSync(
  path.join(OUT, "sobremesa-brownie.svg"),
  plate(`<path d="M190 290 L400 260 L470 330 L260 368Z" fill="#3b1f13"/><path d="M260 368 L470 330 L470 395 L260 440Z" fill="#2a150c"/><path d="M190 290 L260 368 L260 440 L190 360Z" fill="#331a0f"/>
  <path d="M215 300 L390 276 L440 326 L270 352Z" fill="#4c2a1a"/>
  <path d="M230 290 C260 320 290 280 320 310 C350 340 380 300 410 320" stroke="#6b3a24" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M300 300 C300 340 290 380 296 420" stroke="#5a2e1a" stroke-width="9" fill="none" stroke-linecap="round"/>
  <ellipse cx="330" cy="255" rx="58" ry="45" fill="#fff8e7"/><ellipse cx="318" cy="243" rx="26" ry="14" fill="#fff"/>
  <path d="M300 230 C320 250 340 220 360 240" stroke="#5a2e1a" stroke-width="6" fill="none" stroke-linecap="round"/>
  ${Array.from({ length: 10 }, (_, i) => `<rect x="${200 + i * 26}" y="${410 + (i % 3) * 10}" width="7" height="7" fill="#e3c08e" transform="rotate(${i * 17} ${204 + i * 26} ${414 + (i % 3) * 10})"/>`).join("")}`),
);

fs.writeFileSync(
  path.join(OUT, "sobremesa-pudim.svg"),
  plate(`<ellipse cx="320" cy="400" rx="170" ry="40" fill="#8a3b0d" opacity=".85"/>
  <path d="M190 390 L220 260 Q320 235 420 260 L450 390 Q320 425 190 390Z" fill="#f2c36b"/>
  <path d="M190 390 Q320 425 450 390" stroke="#d99a3c" stroke-width="6" fill="none"/>
  <ellipse cx="320" cy="258" rx="100" ry="24" fill="#a4480f"/>
  <path d="M222 262 Q230 300 238 290 Q250 330 262 300 Q280 318 296 286 M340 286 Q360 330 372 296 Q390 318 402 290 Q410 306 418 262" stroke="#a4480f" stroke-width="10" fill="none" stroke-linecap="round"/>
  <ellipse cx="300" cy="252" rx="40" ry="8" fill="#d4782f" opacity=".7"/>
  <circle cx="250" cy="340" r="3" fill="#fff" opacity=".6"/><circle cx="380" cy="350" r="2.5" fill="#fff" opacity=".6"/>`),
);

// ---------- banner (1600x600) ----------
const pb = (seed, spec) => pizzaBody(seed, spec);
const banner = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="bn" cx="75%" cy="45%" r="80%"><stop offset="0" stop-color="#5a3322"/><stop offset=".55" stop-color="#2a1810"/><stop offset="1" stop-color="#120a06"/></radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>
    <radialGradient id="bboard" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#b98252"/><stop offset="1" stop-color="#8a5a33"/></radialGradient>
    <filter id="bshadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>
  <rect width="1600" height="600" fill="url(#bn)"/>
  <circle cx="1250" cy="280" r="480" fill="url(#glow)"/>
  ${flour(rng(21), 220, 1100, 300, 520)}
  <g transform="translate(900 20) scale(0.95)"><circle cx="320" cy="325" r="300" fill="#000" opacity=".35" filter="url(#bshadow)"/><circle cx="320" cy="320" r="296" fill="url(#bboard)"/>${pb(79, { toppings: [["pepperoni", 17, 52]] })}</g>
  <g transform="translate(1330 280) scale(0.62)">${pb(11, { base: "margherita", toppings: [["tomato", 5, 70], ["basil", 9, 40]] })}</g>
  <g transform="translate(640 330) scale(0.5)">${pb(83, { toppings: [["parma", 7, 70], ["arugula", 12, 34], ["driedTomato", 7, 34]] })}</g>
  <g transform="translate(1520 40) scale(.9)">${T.basil(0, 0, rng(1))}</g><g transform="translate(860 80) scale(1.2)">${T.basil(0, 0, rng(2))}</g>
  <g transform="translate(820 540)">${T.tomato(0, 0, rng(3))}</g><g transform="translate(1560 560)">${T.tomato(0, 0, rng(4))}</g>
  <g transform="translate(610 90) scale(1.3)">${T.basil(0, 0, rng(6))}</g>
</svg>`;
fs.writeFileSync(path.join(OUT, "banner-pizzaria.svg"), banner);

// ---------- logotipo ----------
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="lg" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#d23a26"/><stop offset="1" stop-color="#8f1d12"/></radialGradient>
    <linearGradient id="fl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#f2b138"/><stop offset="1" stop-color="#ffe29a"/></linearGradient>
    <path id="arcTop" d="M70 200 A130 130 0 0 1 330 200"/>
    <path id="arcBottom" d="M58 200 A142 142 0 0 0 342 200"/>
  </defs>
  <circle cx="200" cy="200" r="196" fill="#fbf6ee"/>
  <circle cx="200" cy="200" r="184" fill="url(#lg)"/>
  <circle cx="200" cy="200" r="172" fill="none" stroke="#fbf6ee" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>
  <text font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="40" fill="#fbf6ee" letter-spacing="6"><textPath href="#arcTop" startOffset="50%" text-anchor="middle">BRASA &amp; MASSA</textPath></text>
  <text font-family="Georgia, 'Times New Roman', serif" font-size="21" fill="#f2b138" letter-spacing="7"><textPath href="#arcBottom" startOffset="50%" text-anchor="middle">• PIZZARIA ARTESANAL •</textPath></text>
  <!-- fatia de pizza -->
  <g transform="translate(200 212)">
    <path d="M-62 -40 Q0 -64 62 -40 L0 86Z" fill="#f3cb6c"/>
    <path d="M-66 -44 Q0 -70 66 -44 L62 -32 Q0 -56 -62 -32Z" fill="#d49549"/>
    <circle cx="-18" cy="-18" r="11" fill="#b8321f"/><circle cx="20" cy="-14" r="10" fill="#b8321f"/><circle cx="0" cy="22" r="10" fill="#b8321f"/>
    <path d="M18 18 C24 10 34 12 36 18 C30 24 22 24 18 18Z" fill="#2f7a35"/>
  </g>
  <!-- chama -->
  <path d="M200 88 C214 110 236 118 226 146 C222 158 212 164 200 166 C188 164 178 158 174 146 C168 128 180 120 184 104 C190 114 194 118 200 88Z" fill="url(#fl)"/>
  <path d="M200 124 C206 134 214 140 210 152 C206 160 194 160 190 152 C188 144 196 138 200 124Z" fill="#d23a26" opacity=".6"/>
</svg>`;
fs.writeFileSync(path.join(OUT, "logo-pizzaria.svg"), logo);

// ---------- QR Code de exemplo (não é um Pix válido) ----------
{
  const r = rng(2024);
  let cells = "";
  const N = 29, S = 10;
  const finder = (x, y) => `<rect x="${x * S}" y="${y * S}" width="${7 * S}" height="${7 * S}" fill="#111"/><rect x="${(x + 1) * S}" y="${(y + 1) * S}" width="${5 * S}" height="${5 * S}" fill="#fff"/><rect x="${(x + 2) * S}" y="${(y + 2) * S}" width="${3 * S}" height="${3 * S}" fill="#111"/>`;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const inFinder = (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
      const center = x > 9 && x < 19 && y > 11 && y < 17;
      if (!inFinder && !center && r() > 0.52) cells += `<rect x="${x * S}" y="${y * S}" width="${S}" height="${S}" fill="#111"/>`;
    }
  const qr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -20 330 330"><rect x="-20" y="-20" width="330" height="330" fill="#fff"/>${cells}${finder(0, 0)}${finder(N - 7, 0)}${finder(0, N - 7)}
  <rect x="100" y="120" width="90" height="50" rx="8" fill="#fff" stroke="#b7291c" stroke-width="4"/><text x="145" y="153" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#b7291c">DEMO</text></svg>`;
  fs.writeFileSync(path.join(OUT, "qrcode-exemplo.svg"), qr);
}

console.log("Arte de demonstração gerada em", OUT);
