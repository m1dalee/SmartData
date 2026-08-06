async function testWiki(q) {
  const r = await fetch(
    `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*`,
  );
  const j = await r.json();
  console.log("Wiki search", q, "->", j.query?.search?.slice(0, 2).map((s) => s.title + ": " + s.snippet.replace(/<[^>]+>/g, "")));
}

async function testBing(q) {
  const r = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(q)}&format=rss`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const t = await r.text();
  console.log("Bing RSS", q, "status", r.status, "len", t.length, "sample", t.slice(0, 300));
}

await testWiki("Carrefour supermarché");
await testWiki("Netflix streaming");
await testBing("CARREFOUR MARKET enseigne");
