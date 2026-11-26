// Meal photo → itemised grams + calories using Claude vision.
import * as ImageManipulator from 'expo-image-manipulator';

// Gemini has a free tier (Google AI Studio key, no card). Claude is the paid option.
export const PROVIDERS = {
  gemini: {
    label: 'Google Gemini (free tier)',
    defaultModel: 'gemini-flash-latest',
    keyUrl: 'aistudio.google.com/apikey',
    call: callGemini,
  },
  anthropic: {
    label: 'Anthropic Claude (paid)',
    defaultModel: 'claude-sonnet-5-5',
    keyUrl: 'console.anthropic.com',
    call: callClaude,
  },
};
export const DEFAULT_PROVIDER = 'gemini';
export const DEFAULT_MODEL = PROVIDERS.gemini.defaultModel;

// Thinking makes Gemini slow (often 20–60 s). Keep it low; fall back if a model rejects the setting.
const THINKING_OPTIONS = [{ thinkingLevel: 'low' }, { thinkingBudget: 512 }, null];
let thinkingIdx = 0; // remembered for the session once a setting works

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// When the main model is overloaded (503) or its free quota is used up (429),
// fall back to Google's lighter model, which has its own separate free quota.
const GEMINI_FALLBACK = 'gemini-flash-lite-latest';

async function callGemini({ images, text, apiKey, model, system, signal, onStatus }) {
  const parts = images.map((b64) => ({ inline_data: { mime_type: 'image/jpeg', data: b64 } }));
  parts.push({ text });
  const models = model === GEMINI_FALLBACK ? [model] : [model, GEMINI_FALLBACK];
  let lastMsg = '';
  let quotaHit = false;
  for (let m = 0; m < models.length; m++) {
    if (m > 0) onStatus?.('Main model busy, using backup…');
    for (let attempt = 0; attempt < 2; attempt++) {
      const thinking = THINKING_OPTIONS[thinkingIdx];
      const generationConfig = { temperature: 0, responseMimeType: 'application/json', maxOutputTokens: 2048 };
      if (thinking) generationConfig.thinkingConfig = thinking;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(models[m])}:generateContent`,
        {
          method: 'POST',
          signal,
          headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts }],
            generationConfig,
          }),
        }
      );
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        return (j.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
      }
      lastMsg = j?.error?.message || `Gemini error ${res.status}`;
      if (res.status === 400 && /think/i.test(lastMsg) && thinkingIdx < THINKING_OPTIONS.length - 1) {
        thinkingIdx++; // model rejects this thinking setting; try the next one
        attempt--;
        continue;
      }
      if (res.status === 429) {
        quotaHit = true;
        break; // this model's quota is used up, go straight to the backup
      }
      if (res.status === 503 || res.status === 500) {
        if (attempt === 0) await sleep(2000);
        continue;
      }
      throw new Error(lastMsg); // a real error (bad key, bad request): don't retry
    }
  }
  if (quotaHit) throw new Error('Free limit reached on both models for now. Try again in a minute (or tomorrow), or log by search/weight.');
  throw new Error("Google's free AI servers are overloaded right now. Try again in a few minutes, or log this meal by search/weight.");
}

async function callClaude({ images, text, apiKey, model, system, signal }) {
  const content = images.map((b64) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } }));
  content.push({ type: 'text', text });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 1500, temperature: 0, system, messages: [{ role: 'user', content }] }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error?.message || `API error ${res.status}`);
  return (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
}

export async function prepareImage(uri) {
  // Resize to ~1280px: plenty of detail for portion estimation, small enough to upload fast.
  try {
    if (ImageManipulator.ImageManipulator?.manipulate) {
      const ctx = ImageManipulator.ImageManipulator.manipulate(uri).resize({ width: 1024 });
      const img = await ctx.renderAsync();
      const out = await img.saveAsync({ base64: true, compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
      return out.base64;
    }
  } catch (e) {
    // fall through to the older API
  }
  const out = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1024 } }], {
    base64: true,
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return out.base64;
}

function systemPrompt(plateCm) {
  return `You are a registered dietitian doing portion estimation from meal photos for a user in the Philippines.
Your job is to estimate the GRAMS of each food item as accurately as possible and give typical nutrition per 100 g.

Method (follow it):
1. Identify every separate item, including sauces, sabaw/broth, oil sheen, dips, drinks and toppings. Recognise Filipino dishes by name (e.g. adobo, sinigang, tapsilog components, pancit, lumpia).
2. Estimate size using references: the plate is about ${plateCm} cm across unless the user says otherwise; also use spoons, forks, cups, hands, rice-cooker cups (1 cup cooked rice ≈ 160 g) and packaging.
3. Estimate volume → grams with realistic density. State a low and high gram range.
4. Account for hidden calories: frying oil absorbed, fatty cuts, sugar in sauces, gata/coconut milk. Put these inside the item's per-100 g values (not as separate guesses) unless oil/sauce is clearly visible as its own item.
5. If something cannot be seen (filling, what's under rice, cooking method) ask a short clarifying question. Ask at most 3 questions and only if the answer would change calories by >10%.

Reply with ONLY minified JSON, no prose, in exactly this shape:
{"items":[{"name":string,"grams":number,"grams_low":number,"grams_high":number,"per100":{"kcal":number,"protein":number,"carbs":number,"fat":number},"confidence":"high"|"medium"|"low","note":string}],"questions":[string],"photo_tip":string}
"note" = one short phrase on how you sized it. "photo_tip" = how a better photo would improve accuracy, or "" if the photo was good.
If the photo has no food, return {"items":[],"questions":[],"photo_tip":"No food detected."}`;
}

function extractJson(text) {
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b < 0) throw new Error('The AI did not return a result. Try again.');
  return JSON.parse(text.slice(a, b + 1));
}

/**
 * @param {object} opts
 * @param {string[]} opts.images base64 JPEGs (1–3 angles)
 * @param {string} opts.apiKey
 * @param {string} [opts.model]
 * @param {number} [opts.plateCm]
 * @param {string} [opts.context] user's own description ("2 cups rice, fried in lard")
 * @param {{q:string,a:string}[]} [opts.answers] answers to earlier clarifying questions
 * @param {object[]} [opts.previous] previous item list, for a refinement pass
 */
export async function analyzeMeal({ images, apiKey, provider = 'gemini', model, plateCm = 25, context = '', answers = [], previous, myFoods = [], signal: outerSignal, onStatus }) {
  const P = PROVIDERS[provider] || PROVIDERS.gemini;
  if (!apiKey) throw new Error(`Add your ${P.label} API key in Settings to use photo scanning.`);
  let text = images.length > 1 ? `These are ${images.length} angles of the same meal.` : 'Estimate this meal.';
  if (myFoods.length) {
    text +=
      '\nThe user has measured these home recipes exactly. If a dish in the photo matches one, use its name and per100 values exactly and only estimate the grams:\n' +
      JSON.stringify(myFoods.slice(0, 40).map((f) => ({ name: f.name, per100: f.per100 })));
  }
  if (context.trim()) text += `\nUser's description: ${context.trim()}`;
  if (answers.length) {
    text += '\nAnswers to your questions:\n' + answers.map((x) => `- ${x.q} → ${x.a}`).join('\n');
  }
  if (previous && previous.length) {
    text +=
      '\nYour previous estimate was: ' +
      JSON.stringify(previous.map((i) => ({ name: i.name, grams: i.grams }))) +
      '\nRevise it using the new information. Only ask new questions if still needed.';
  }
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, 60000);
  const onOuter = () => ctrl.abort();
  outerSignal?.addEventListener?.('abort', onOuter);
  let out;
  try {
    out = await P.call({ images, text, apiKey, model: model || P.defaultModel, system: systemPrompt(plateCm), signal: ctrl.signal, onStatus });
  } catch (e) {
    if (timedOut) throw new Error('The AI took over 60 s (slow connection or busy free tier). Try again, or use 1 photo instead of several.');
    if (outerSignal?.aborted) throw new Error('CANCELLED');
    throw e;
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener?.('abort', onOuter);
  }
  const data = extractJson(out);
  data.items = (data.items || []).map((it, idx) => ({
    key: String(Date.now()) + idx,
    name: String(it.name || 'Food'),
    grams: Math.max(1, Math.round(Number(it.grams) || 100)),
    low: Math.round(Number(it.grams_low) || 0),
    high: Math.round(Number(it.grams_high) || 0),
    per100: {
      kcal: Number(it.per100?.kcal) || 0,
      protein: Number(it.per100?.protein) || 0,
      carbs: Number(it.per100?.carbs) || 0,
      fat: Number(it.per100?.fat) || 0,
    },
    confidence: it.confidence || 'medium',
    note: it.note || '',
    source: 'ai',
  }));
  data.questions = (data.questions || []).slice(0, 3);
  return data;
}
