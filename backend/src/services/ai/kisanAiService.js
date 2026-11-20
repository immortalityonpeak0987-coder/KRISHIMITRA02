import { GoogleGenAI, Type } from '@google/genai';

// Use the direct SDK alias immediately to eliminate any double-request retry delay
const MODEL_NAME = 'gemini-4-hydrogen';

// Fast in-memory LRU cache so identical requests return in <5ms with 0 extra tokens
const responseCache = new Map();
const MAX_CACHE_ENTRIES = 120;

function getCached(key) {
  if (!responseCache.has(key)) return null;
  return responseCache.get(key);
}

function setCached(key, val) {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  responseCache.set(key, val);
}

const LANGUAGE_LABELS = {
  en: 'English',
  bn: 'Bengali (বাংলা)',
  hi: 'Hindi (हिंदी)'
};

let cachedClient = null;
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error('AI API key is not configured in environment variables.');
    err.statusCode = 503;
    throw err;
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return cachedClient;
}

function formatCompactContext(farm = {}) {
  const name = farm.name || 'Plot';
  const dist = farm.district || 'Purba Bardhaman';
  const crop = farm.currentCrop || 'Aman Paddy';
  const area = farm.area ? `${farm.area} ${farm.areaUnit || 'Bigha'}` : '4.5 Bigha';
  const temp = farm.weather?.tempC ?? '24.8°C';
  const rain = farm.weather?.rainfall30d ?? '58mm';
  const ph = farm.soil?.ph ?? '6.4';
  const ec = farm.soil?.ec ?? '0.85 dS/m';
  return `${name} (${dist}, ${area}) | Crop:${crop} | Temp:${temp}, Rain:${rain} | Soil pH:${ph}, EC:${ec}`;
}

export const kisanAiService = {
  async generateSmartAdvisory({ farmContext = {}, pageType = 'overview', language = 'en' }) {
    const cacheKey = `adv:${farmContext.id || 'default'}:${pageType}:${language}:${farmContext.currentCrop || ''}`;
    const hit = getCached(cacheKey);
    if (hit) return hit;

    const ai = getAIClient();
    const lang = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.en;
    const ctx = formatCompactContext(farmContext);

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Plot: ${ctx}. View: ${pageType}. Give a short 3-point farm advisory in ${lang}.`,
      config: {
        systemInstruction: `KRISHI-MITRA Kisan Sahayak. Reply strictly in ${lang}. Keep every string brief (under 18 words).`,
        maxOutputTokens: 420,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            summary: { type: Type.STRING },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  detail: { type: Type.STRING },
                  priority: { type: Type.STRING }
                },
                required: ['title', 'detail', 'priority']
              }
            },
            safetyNote: { type: Type.STRING }
          },
          required: ['headline', 'summary', 'actions', 'safetyNote']
        }
      }
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const result = {
      ...parsed,
      language,
      generatedAt: new Date().toISOString()
    };
    setCached(cacheKey, result);
    return result;
  },

  async diagnoseFieldPhoto({
    farmContext = {},
    imageBase64 = '',
    mimeType = 'image/jpeg',
    symptomNote = '',
    conditionPreset = '',
    language = 'en'
  }) {
    const hasImg = Boolean(imageBase64 && imageBase64.length > 30);
    const cacheKey = !hasImg
      ? `diag:${farmContext.id || 'd'}:${conditionPreset}:${symptomNote}:${language}`
      : null;
    if (cacheKey) {
      const hit = getCached(cacheKey);
      if (hit) return hit;
    }

    const ai = getAIClient();
    const lang = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.en;
    const ctx = formatCompactContext(farmContext);

    const parts = [];
    if (hasImg) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64.replace(/^data:[^;]+;base64,/, '')
        }
      });
    }
    parts.push({
      text: `Plot: ${ctx}. Symptom: ${conditionPreset || 'Field check'}. Note: ${symptomNote || 'None'}. Diagnose crop/soil issue in ${lang}.`
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        systemInstruction: `KRISHI-MITRA Plant & Soil Doctor. Diagnose briefly in ${lang}. Recommend safe non-banned steps.`,
        maxOutputTokens: 450,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            observedCondition: { type: Type.STRING },
            severity: { type: Type.STRING },
            diagnosisSummary: { type: Type.STRING },
            likelyCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            disclaimer: { type: Type.STRING }
          },
          required: ['observedCondition', 'severity', 'diagnosisSummary', 'likelyCauses', 'recommendedSteps', 'disclaimer']
        }
      }
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const result = {
      ...parsed,
      language,
      generatedAt: new Date().toISOString()
    };
    if (cacheKey) setCached(cacheKey, result);
    return result;
  },

  async generateActionPlan({
    farmContext = {},
    planType = 'crop-planner',
    scenarioParams = {},
    language = 'en'
  }) {
    const scenStr = JSON.stringify(scenarioParams || {});
    const cacheKey = `plan:${farmContext.id || 'd'}:${planType}:${scenStr}:${language}`;
    const hit = getCached(cacheKey);
    if (hit) return hit;

    const ai = getAIClient();
    const lang = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.en;
    const ctx = formatCompactContext(farmContext);

    const prompt =
      planType === 'recovery'
        ? `Plot: ${ctx}. Context: ${scenStr}. Create a brief 3-stage 14-day farm recovery plan in ${lang}.`
        : `Plot: ${ctx}. Scenario: ${scenStr}. Create a brief 3-stage sowing & variety plan in ${lang}.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: `KRISHI-MITRA Farm Planner. Reply briefly in ${lang}.`,
        maxOutputTokens: 450,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            verdict: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING },
                  action: { type: Type.STRING },
                  benefit: { type: Type.STRING }
                },
                required: ['phase', 'action', 'benefit']
              }
            },
            recommendedVarieties: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['planTitle', 'verdict', 'steps', 'recommendedVarieties']
        }
      }
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const result = {
      ...parsed,
      language,
      generatedAt: new Date().toISOString()
    };
    setCached(cacheKey, result);
    return result;
  },

  async chatWithKisanSahayak({
    farmContext = {},
    message = '',
    history = [],
    language = 'en'
  }) {
    const ai = getAIClient();
    const lang = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.en;
    const ctx = formatCompactContext(farmContext);

    const recentHistory = Array.isArray(history)
      ? history
          .slice(-3)
          .map((h) => `${h.role === 'user' ? 'Q' : 'A'}: ${h.text}`)
          .join('\n')
      : '';

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Plot: ${ctx}\n${recentHistory ? `${recentHistory}\n` : ''}Farmer Q: ${message}\nReply in ${lang} in 3 short bullet points (max 80 words).`,
      config: {
        systemInstruction: `You are KRISHI-MITRA Kisan Sahayak. Reply in ${lang} concisely (under 80 words).`,
        maxOutputTokens: 280
      }
    });

    return {
      reply: (response.text ?? '').trim(),
      language,
      generatedAt: new Date().toISOString()
    };
  },

  async analyzeSimulation({
    farmContext = {},
    simulationType = 'climate',
    simulationInputs = {},
    language = 'en'
  }) {
    const inStr = JSON.stringify(simulationInputs || {});
    const cacheKey = `sim:${farmContext.id || 'd'}:${simulationType}:${inStr}:${language}`;
    const hit = getCached(cacheKey);
    if (hit) return hit;

    const ai = getAIClient();
    const lang = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.en;
    const ctx = formatCompactContext(farmContext);
    const coords = farmContext.coordinates
      ? `${farmContext.coordinates.latitude}°N, ${farmContext.coordinates.longitude}°E`
      : '23.23°N, 87.86°E';

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Plot (${coords}): ${ctx}. Sim: ${simulationType} = ${inStr}. Give brief location report & 3 actions in ${lang}.`,
      config: {
        systemInstruction: `KRISHI-MITRA Simulation Analyst. Reply concisely in ${lang}.`,
        maxOutputTokens: 380,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reportTitle: { type: Type.STRING },
            locationContext: { type: Type.STRING },
            impactSummary: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['reportTitle', 'locationContext', 'impactSummary', 'riskLevel', 'recommendations']
        }
      }
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const result = {
      ...parsed,
      language,
      generatedAt: new Date().toISOString()
    };
    setCached(cacheKey, result);
    return result;
  },

  async generateCropRotationPlan({
    farmContext = {},
    language = 'en'
  }) {
    const cacheKey = `rot:${farmContext.id || 'd'}:${farmContext.district || ''}:${language}`;
    const hit = getCached(cacheKey);
    if (hit) return hit;

    const ai = getAIClient();
    const lang = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.en;
    const ctx = formatCompactContext(farmContext);
    const coords = farmContext.coordinates
      ? `${farmContext.coordinates.latitude}°N, ${farmContext.coordinates.longitude}°E`
      : '23.23°N, 87.86°E';

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Plot (${coords}): ${ctx}. Design a 3-season (Kharif, Rabi, Summer) crop rotation plan in ${lang}.`,
      config: {
        systemInstruction: `KRISHI-MITRA Crop Rotation Advisor. Reply concisely in ${lang}.`,
        maxOutputTokens: 460,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            sequence: { type: Type.STRING },
            locationRationale: { type: Type.STRING },
            timing: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  window: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  crop: { type: Type.STRING },
                  type: { type: Type.STRING }
                },
                required: ['window', 'duration', 'crop', 'type']
              }
            },
            waterSavings: { type: Type.STRING },
            nitrogenContribution: { type: Type.STRING },
            pestCycleBreak: { type: Type.STRING }
          },
          required: [
            'title',
            'sequence',
            'locationRationale',
            'timing',
            'waterSavings',
            'nitrogenContribution',
            'pestCycleBreak'
          ]
        }
      }
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    const result = {
      id: `smart-rotation-${Date.now()}`,
      isSmartPlan: true,
      ...parsed,
      waterBalance: { estimatedSavings: parsed.waterSavings },
      soilBenefit: { nitrogenContribution: parsed.nitrogenContribution },
      language,
      generatedAt: new Date().toISOString()
    };
    setCached(cacheKey, result);
    return result;
  }
};
