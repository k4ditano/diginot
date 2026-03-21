// ═══════════════════════════════════════════
// DigiNot — AI Integration (Minimax M2.7)
// ═══════════════════════════════════════════

const API_URL = 'https://api.minimax.io/v1/chat/completions';
const MODEL = 'MiniMax-M2.7';

// API key stored in localStorage (never hardcoded)
function getAPIKey() {
  return localStorage.getItem('diginot_ai_key') || '';
}

export function setAPIKey(key) {
  localStorage.setItem('diginot_ai_key', key);
}

export function hasAPIKey() {
  return !!getAPIKey();
}

// ─── Core API call ───
async function aiCall(systemPrompt, userPrompt, maxTokens = 400) {
  const key = getAPIKey();
  if (!key) return null;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) { console.warn('AI call failed:', res.status); return null; }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';
    // Strip <think> reasoning tags
    const clean = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    return clean;
  } catch (e) {
    console.warn('AI call error:', e);
    return null;
  }
}

// Parse JSON from AI response (handles markdown code blocks)
function parseJSON(text) {
  if (!text) return null;
  try {
    // Try direct parse
    return JSON.parse(text);
  } catch {
    // Extract JSON from response
    const m = text.match(/\{[\s\S]*\}/);
    if (m) try { return JSON.parse(m[0]); } catch {}
    // Try array
    const a = text.match(/\[[\s\S]*\]/);
    if (a) try { return JSON.parse(a[0]); } catch {}
    return null;
  }
}

// ═══════════════════════════════════════════
// AI GENERATORS
// ═══════════════════════════════════════════

const SYS = `You are a game designer for DigiNot, a digital creature roguelike card-battler. Theme: digital/cyber creatures in a virtual world. Respond ONLY with valid JSON. No markdown. No explanation. No code blocks.`;

// ─── Generate unique event ───
export async function aiGenerateEvent(zoneId, floor) {
  const raw = await aiCall(SYS,
    `Generate a unique roguelike event for zone "${zoneId}" floor ${floor}. ` +
    `JSON: {"title":"emoji + Title","text":"2-3 sentence narrative","choices":[` +
    `{"label":"choice text","effect":"hp:-10 or gold:50 or card:random or relic:random or heal:20 or none"}` +
    `]} Include 3 choices. Make it creative and thematic.`
  );
  const parsed = parseJSON(raw);
  if (parsed?.title && parsed?.choices?.length) return parsed;
  return null;
}

// ─── Generate unique card ───
export async function aiGenerateCard(notType) {
  const raw = await aiCall(SYS,
    `Generate 1 unique card for "${notType}" type creature. ` +
    `JSON: {"id":"snake_case_unique","name":"Card Name","type":"${notType}","cat":"attack|block|skill|power",` +
    `"cost":1-3,"damage":0-25,"block":0-15,` +
    `"effect":"burn|poison|vulnerable|weak|heal|draw|energy|drain|strength|thorns|regen|cleanse|null",` +
    `"effectVal":0-5,"desc":"Short 8 words max description"}. ` +
    `Be creative! Unique name and balanced stats.`
  );
  const parsed = parseJSON(raw);
  if (parsed?.id && parsed?.name && parsed?.cat) return parsed;
  return null;
}

// ─── Generate boss dialogue ───
export async function aiGenerateBossDialogue(bossName, bossType, floor) {
  const raw = await aiCall(SYS,
    `Generate a short intimidating entrance line for boss "${bossName}" (${bossType} type) on floor ${floor}. ` +
    `JSON: {"entrance":"1 sentence taunt","defeat":"1 sentence when defeated"}. ` +
    `Keep it dramatic and short (under 15 words each).`,
    200
  );
  return parseJSON(raw);
}

// ─── Generate card reward set (3 cards) ───
export async function aiGenerateCardReward(notType, floor) {
  const raw = await aiCall(SYS,
    `Generate 3 unique cards for a "${notType}" type creature at floor ${floor}/15 of a roguelike run. ` +
    `Higher floors = stronger cards. ` +
    `JSON array: [{"id":"snake_case","name":"Name","type":"${notType}","cat":"attack|block|skill|power",` +
    `"cost":1-3,"damage":0-30,"block":0-20,` +
    `"effect":"burn|poison|vulnerable|weak|heal|draw|energy|drain|strength|thorns|regen|cleanse|null",` +
    `"effectVal":0-5,"desc":"Short description"}]. ` +
    `All 3 must be different categories. Be creative!`,
    600
  );
  const parsed = parseJSON(raw);
  if (Array.isArray(parsed) && parsed.length >= 2) return parsed.slice(0, 3);
  return null;
}

// ─── Batch pre-generate content for a run ───
export async function aiPregenerate(notType, zoneId) {
  // Generate 3 events + 3 bonus cards in parallel
  const [ev1, ev2, ev3, card1, card2, card3] = await Promise.allSettled([
    aiGenerateEvent(zoneId, 3),
    aiGenerateEvent(zoneId, 8),
    aiGenerateEvent(zoneId, 12),
    aiGenerateCard(notType),
    aiGenerateCard(notType),
    aiGenerateCard(notType),
  ]);

  return {
    events: [ev1, ev2, ev3].map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean),
    cards: [card1, card2, card3].map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean),
  };
}
