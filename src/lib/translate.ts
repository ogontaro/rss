const DEEPL_KEY = process.env.DEEPL_API_KEY;
const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL;

type Engine = (texts: string[]) => Promise<string[]>;

const passthrough: Engine = async (texts) => texts;

const deepl: Engine = async (texts) => {
  const key = DEEPL_KEY as string;
  const endpoint = key.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: texts, source_lang: "EN", target_lang: "JA" }),
  });
  if (!res.ok) throw new Error(`DeepL ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { translations: { text: string }[] };
  return data.translations.map((t) => t.text);
};

/** MyMemory: one string per GET. Anonymous ~5k words/day, more with an email. */
const myMemory: Engine = async (texts) => {
  const out: string[] = [];
  for (const text of texts) {
    const u = new URL("https://api.mymemory.translated.net/get");
    u.searchParams.set("q", text.slice(0, 500));
    u.searchParams.set("langpair", "en|ja");
    if (MYMEMORY_EMAIL) u.searchParams.set("de", MYMEMORY_EMAIL);
    const res = await fetch(u);
    if (!res.ok) throw new Error(`MyMemory ${res.status}`);
    const data = (await res.json()) as { responseData: { translatedText: string } };
    out.push(data.responseData.translatedText || text);
  }
  return out;
};

function pickEngine(): Engine {
  if (DEEPL_KEY) return deepl;
  if (process.env.USE_MYMEMORY) return myMemory;
  console.warn(
    "[translate] no engine configured (DEEPL_API_KEY unset) — passing text through untranslated",
  );
  return passthrough;
}

const engine = pickEngine();

/** Translate short EN strings to JA. Order preserved; blank strings skipped. */
export async function translateBatch(texts: string[]): Promise<string[]> {
  const nonEmpty = texts.map((t, i) => [i, t] as const).filter(([, t]) => t.trim() !== "");
  if (nonEmpty.length === 0) return [...texts];
  const translated = await engine(nonEmpty.map(([, t]) => t));
  const result = [...texts];
  nonEmpty.forEach(([idx], k) => {
    result[idx] = translated[k] ?? texts[idx];
  });
  return result;
}
