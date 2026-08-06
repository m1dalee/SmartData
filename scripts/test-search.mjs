async function test(label) {
  const q = label + " enseigne activité";
  const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" },
  });
  const html = await r.text();
  console.log("---", label);
  console.log("status", r.status, "len", html.length);
  console.log("result__snippet", html.includes("result__snippet"));
  console.log("result-snippet", html.includes("result-snippet"));

  const patterns = [
    /class="result__snippet"[^>]*>([\s\S]*?)<\//g,
    /class="result-snippet"[^>]*>([\s\S]*?)<\//g,
    /<a class="result__a"[^>]*>([\s\S]*?)<\//g,
  ];
  for (const p of patterns) {
    const m = p.exec(html);
    if (m) console.log("match", p.source.slice(0, 30), m[1].replace(/<[^>]+>/g, "").slice(0, 100));
  }
}

for (const l of ["PAYPAL UBER EATS", "AMAZON PAYMENTS", "SPOTIFY FRANCE", "BOULANGERIE MARIE"]) {
  await test(l);
}
