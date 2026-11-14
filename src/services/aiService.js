import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/data';
import { dateKey, daysRemaining } from '../utils/dateUtils';
import { analyzeCategoryStats, resolveItemCategory } from '../utils/categoryUtils';
import { fetchWithTimeout } from '../utils/fetchUtils';

const DAILY_LIMIT_PRO = 100;
const DAILY_LIMIT_FREE = 25;
const REQUEST_TIMEOUT_MS = 6500;
const DIRECT_GEMINI_MODELS = [
  'models/gemini-2.5-flash',
  'models/gemini-2.0-flash',
  'models/gemini-1.5-flash',
  'models/gemini-3.1-flash-lite',
  'models/gemini-3.5-flash-lite',
];

let lastWorkingGeminiModel = null;
const retiredGeminiModels = new Set();
const memoryQuotaCache = new Map();
const memoryBriefingCache = new Map();
const memoryInsightsCache = new Map();

/**
 * Kiểm tra lượt gọi AI live trong ngày (có cache RAM để tránh đọc lại AsyncStorage)
 */
async function getDailyQuotaStatus(accountKey = 'guest', isProUser = false) {
  const today = dateKey(new Date());
  const storageKey = `mylife_ai_quota_v2_${accountKey}_${today}`;
  const limit = isProUser ? DAILY_LIMIT_PRO : DAILY_LIMIT_FREE;

  if (memoryQuotaCache.has(storageKey)) {
    const used = memoryQuotaCache.get(storageKey);
    return { allowed: used < limit, used, limit, storageKey };
  }

  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const used = raw ? Number(raw) || 0 : 0;
    memoryQuotaCache.set(storageKey, used);
    return { allowed: used < limit, used, limit, storageKey };
  } catch (e) {
    return { allowed: true, used: 0, limit, storageKey };
  }
}

function incrementDailyQuota(storageKey, currentUsed) {
  const next = (Number(currentUsed) || 0) + 1;
  memoryQuotaCache.set(storageKey, next);
  AsyncStorage.setItem(storageKey, String(next)).catch(() => {});
}

/**
 * Gọi trực tiếp Gemini API từ thiết bị (khi điền GEMINI_API_KEY trong data.js)
 * hoặc gọi qua AI_PROXY_URL nếu có.
 */
async function callAiProxy(task, lang, sanitizedData) {
  const directKey = (CONFIG.GEMINI_API_KEY || '').trim();
  const proxyUrl = (CONFIG.AI_PROXY_URL || '').trim();

  if (!directKey && !proxyUrl) return null;

  try {
    // 1. Ưu tiên gọi trực tiếp tới Google Gemini từ điện thoại tại Việt Nam
    if (directKey) {
      const languageRule =
        lang === 'en'
          ? 'Respond strictly in natural, warm, concise English.'
          : 'Trả lời hoàn toàn bằng tiếng Việt tự nhiên, ấm áp, dễ thương và ngắn gọn.';

      const safetyRule =
        'You are the friendly AI companion built exclusively for the MyLife planner app. NEVER give medical, psychiatric, or diagnostic advice. Keep suggestions practical, gentle, and encouraging with 1-2 pastel emojis.';

      let taskPrompt = '';
      if (task === 'daily_briefing') {
        taskPrompt = `Dữ liệu ngày hôm nay (gồm thời tiết, lịch trình, to-do đã gán nhãn work/study/health/personal/other): ${JSON.stringify(sanitizedData)}. Hãy viết lời chào/gợi ý mới mẻ theo đúng tình hình từng nhãn công việc hôm nay và trả về JSON đúng mẫu: {"message": "2-3 câu ngắn tóm tắt thời tiết, tiến độ lịch trình/to-do theo nhãn và lời khuyên cân bằng nhẹ nhàng", "highlightTag": "1 cụm rất ngắn dưới 28 ký tự"}`;
      } else if (task === 'weekly_insights') {
        taskPrompt = `Dữ liệu thống kê tổng hợp theo nhãn (work=Công việc, study=Học tập, health=Sức khỏe, personal=Cá nhân, other=Khác) từ lịch trình, việc cần làm và thói quen đã hoàn thành cùng tâm trạng 7 ngày qua: ${JSON.stringify(sanitizedData)}. Hãy phân tích kỹ tỷ lệ hoàn thành & cân bằng giữa các nhãn để đưa ra lời khuyên tốt nhất cho người dùng, trả về JSON đúng mẫu: {"brightSpot": "1 câu ngắn tổng kết điểm sáng từ các công việc gắn nhãn đã hoàn thành", "pattern": "1 câu ngắn phân tích sự phân bổ và cân bằng giữa các nhãn (công việc, học tập, sức khỏe...) với tâm trạng", "suggestion": "1-2 câu lời khuyên tốt nhất, cụ thể nhất dựa trên kết quả thống kê các nhãn", "bestLabel": "work|study|personal|health|other", "focusLabel": "work|study|personal|health|other", "labelAdvice": {"work": "1 câu khuyên ngắn cho nhãn Công việc nếu có dữ liệu hoặc chuỗi rỗng", "study": "1 câu khuyên ngắn cho nhãn Học tập nếu có dữ liệu hoặc chuỗi rỗng", "health": "1 câu khuyên ngắn cho nhãn Sức khỏe", "personal": "1 câu khuyên ngắn cho nhãn Cá nhân nếu có dữ liệu hoặc chuỗi rỗng"}, "recommendedAction": {"title": "1 hành động cụ thể nên làm ngay (<=35 ký tự) hoặc chuỗi rỗng", "category": "health|study|work|personal|other", "sticker": "🌿"}}`;
      } else if (task === 'mood_companion') {
        taskPrompt = `Người dùng vừa chọn tâm trạng và viết ghi chú: ${JSON.stringify(sanitizedData)}. Hãy trả về JSON đúng mẫu: {"reply": "2-3 câu đồng cảm ấm áp, không phán xét, không tư vấn y tế", "suggestedAction": {"title": "Tên 1 hoạt động thư giãn ngắn nếu phù hợp (VD: Nghỉ ngơi 30p, Đi dạo 15p) hoặc chuỗi rỗng nếu không cần", "category": "health", "sticker": "🌿"}}`;
      } else {
        return null;
      }

      const payloadBody = JSON.stringify({
        systemInstruction: {
          parts: [{ text: `${safetyRule} ${languageRule}` }],
        },
        contents: [{ role: 'user', parts: [{ text: taskPrompt }] }],
        generationConfig: {
          temperature: 0.85,
          responseMimeType: 'application/json',
        },
      });

      const candidateModels = [
        ...(lastWorkingGeminiModel ? [lastWorkingGeminiModel] : []),
        ...DIRECT_GEMINI_MODELS.filter((m) => m !== lastWorkingGeminiModel && !retiredGeminiModels.has(m)),
      ];

      for (const modelName of candidateModels) {
        try {
          const geminiRes = await fetchWithTimeout(
            `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': directKey,
              },
              body: payloadBody,
            },
            REQUEST_TIMEOUT_MS
          );

          if (!geminiRes.ok) {
            if (geminiRes.status === 404) {
              retiredGeminiModels.add(modelName);
            }
            const errText = await geminiRes.text().catch(() => '');
            console.warn(`[Gemini Direct ${modelName}] HTTP ${geminiRes.status}:`, errText);
            continue;
          }

          const geminiJson = await geminiRes.json();
          const rawText = (geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || '{}')
            .replace(/^```json\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
          const parsed = JSON.parse(rawText);
          if (parsed && typeof parsed === 'object') {
            lastWorkingGeminiModel = modelName;
            return parsed;
          }
        } catch (modelErr) {
          console.warn(`[Gemini Direct ${modelName}] Error:`, modelErr.message);
        }
      }
      return null;
    }

    // 2. Gọi qua Proxy URL nếu không điền GEMINI_API_KEY trực tiếp
    const headers = { 'Content-Type': 'application/json' };
    if (CONFIG.AI_CLIENT_KEY) {
      headers['x-mylife-key'] = CONFIG.AI_CLIENT_KEY;
    }

    const res = await fetchWithTimeout(proxyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        task,
        lang: lang === 'en' ? 'en' : 'vi',
        data: sanitizedData,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[AI Proxy] HTTP ${res.status}:`, errText);
      return null;
    }

    const json = await res.json();
    if (json?.ok && json?.result && typeof json.result === 'object') {
      return json.result;
    }
    return null;
  } catch (err) {
    console.warn('[AI Service] Request failed, using local fallback:', err.message);
    return null;
  }
}

/* =========================================================================
   LOCAL SMART FALLBACK ENGINE (Hoạt động cả khi mất mạng / hết quota)
   ========================================================================= */

function buildLocalDailyBriefing({ weather, dayEvents = [], dayTodos = [], countdowns = [], habits = [], dateStr, lang }) {
  const temp = weather?.temp ?? '--';
  const cond = String((lang === 'en' ? weather?.descEn : weather?.descVi) || weather?.condition || '').toLowerCase();
  const pendingEvents = dayEvents.filter((e) => !e.completed);
  const pendingTodos = dayTodos.filter((td) => !td.completed);
  const completedTodayCount =
    dayEvents.filter((e) => e.completed).length + dayTodos.filter((td) => td.completed).length;
  const pendingHabits = habits.filter((h) => !(h.history && h.history[dateStr]));

  // Tìm nhãn nổi bật trong ngày hôm nay
  const todayStats = analyzeCategoryStats({ events: dayEvents, todos: dayTodos, habits: [], days: 0 });
  const pendingCatCounts = {};
  [...pendingEvents, ...pendingTodos].forEach((item) => {
    const c = resolveItemCategory(item);
    pendingCatCounts[c] = (pendingCatCounts[c] || 0) + 1;
  });
  const topPendingCat = Object.entries(pendingCatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const catLabelsVi = { work: 'Công việc', study: 'Học tập', personal: 'Cá nhân', health: 'Sức khỏe', other: 'Khác' };
  const catLabelsEn = { work: 'Work', study: 'Study', personal: 'Personal', health: 'Health', other: 'Other' };

  // Tìm D-Day gần nhất trong tương lai
  let nearestDDay = null;
  let minDays = Infinity;
  countdowns.forEach((cd) => {
    const diff = daysRemaining(cd.targetDate);
    if (diff >= 0 && diff < minDays) {
      minDays = diff;
      nearestDDay = { title: cd.title, daysLeft: diff };
    }
  });

  const isRainy = cond.includes('rain') || cond.includes('mưa') || cond.includes('dông') || cond.includes('bão');
  const isHot = Number(temp) >= 34;

  if (lang === 'en') {
    const weatherPart = isRainy
      ? `It looks rainy (${temp}°C) today — remember an umbrella if heading out.`
      : isHot
      ? `It's quite warm (${temp}°C) today — stay hydrated.`
      : `Today's weather is ${temp}°C.`;

    const focusHint =
      topPendingCat && (topPendingCat === 'work' || topPendingCat === 'study') && todayStats.categoriesMap.health.totalCompleted === 0
        ? ` Remember a quick Health break too!`
        : '';

    const agendaPart =
      pendingEvents.length > 0
        ? `You have ${pendingEvents.length} upcoming schedule(s)${pendingTodos.length ? ` and ${pendingTodos.length} to-do(s)` : ''}${topPendingCat ? ` (mostly ${catLabelsEn[topPendingCat]})` : ''}.${focusHint}`
        : pendingTodos.length > 0
        ? `Your calendar is open today with ${pendingTodos.length} quick to-do(s)${topPendingCat ? ` in ${catLabelsEn[topPendingCat]}` : ''}.${focusHint}`
        : completedTodayCount > 0
        ? `Awesome! You've finished ${completedTodayCount} task(s) today — enjoy a gentle rest or finish your ${pendingHabits.length || 'daily'} habits.`
        : `Your schedule is completely clear today! Enjoy some quiet time or nurture your ${pendingHabits.length || 'daily'} habits.`;

    return {
      message: `${weatherPart} ${agendaPart} 🌸`,
      highlightTag: nearestDDay
        ? nearestDDay.daysLeft === 0
          ? `Today: ${nearestDDay.title}`
          : `${nearestDDay.daysLeft}d left: ${nearestDDay.title}`
        : topPendingCat
        ? `Focus: ${catLabelsEn[topPendingCat]}`
        : pendingEvents.length > 0
        ? `${pendingEvents.length} plans today`
        : 'Light & calm day',
      source: 'local',
    };
  }

  const weatherPart = isRainy
    ? `Hôm nay trời có mưa (${temp}°C), nếu ra ngoài bạn nhớ mang theo ô nhé.`
    : isHot
    ? `Hôm nay thời tiết hơi oi (${temp}°C), nhớ uống đủ nước nha.`
    : `Thời tiết hôm nay khá dễ chịu (${temp}°C).`;

  const focusHintVi =
    topPendingCat && (topPendingCat === 'work' || topPendingCat === 'study') && todayStats.categoriesMap.health.totalCompleted === 0
      ? ' Đừng quên chèn thêm 1 khoảng nghỉ Sức khỏe nhé!'
      : '';

  const agendaPart =
    pendingEvents.length >= 3
      ? `Bạn có ${pendingEvents.length} lịch trình${pendingTodos.length ? ` và ${pendingTodos.length} việc cần làm` : ''}${topPendingCat ? ` (nhiều nhất là ${catLabelsVi[topPendingCat]})` : ''} — ưu tiên từng việc trước trưa nha!${focusHintVi}`
      : pendingEvents.length > 0
      ? `Hôm nay bạn có ${pendingEvents.length} lịch trình${pendingTodos.length ? ` và ${pendingTodos.length} việc vặt` : ''}${topPendingCat ? ` nhóm ${catLabelsVi[topPendingCat]}` : ''}.${focusHintVi}`
      : pendingTodos.length > 0
      ? `Hôm nay lịch trống khá thoải mái, bạn chỉ cần xử lý ${pendingTodos.length} việc${topPendingCat ? ` (${catLabelsVi[topPendingCat]})` : ''} trong checklist thôi!${focusHintVi}`
      : completedTodayCount > 0
      ? `Tuyệt vời! Hôm nay bạn đã hoàn thành ${completedTodayCount} mục rồi — hãy thư giãn nhẹ và hoàn thành nốt ${pendingHabits.length || 'các'} thói quen nhé!`
      : `Hôm nay bạn không có lịch hẹn bận rộn nào cả — rất hợp để thư giãn và hoàn thành ${pendingHabits.length || 'các'} thói quen tốt mỗi ngày!`;

  return {
    message: `${weatherPart} ${agendaPart} 🌸`,
    highlightTag: nearestDDay
      ? nearestDDay.daysLeft === 0
        ? `Hôm nay: ${nearestDDay.title}`
        : `Còn ${nearestDDay.daysLeft} ngày tới ${nearestDDay.title}`
      : topPendingCat
      ? `Ưu tiên: ${catLabelsVi[topPendingCat]}`
      : pendingEvents.length > 0
      ? `${pendingEvents.length} lịch trình hôm nay`
      : 'Ngày nhẹ nhàng & thư thái',
    source: 'local',
  };
}

function buildLocalWeeklyInsights({ events = [], todos = [], moodsMap = {}, habits = [], lang = 'vi' }) {
  const now = new Date();
  const recentKeys = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    recentKeys.push(dateKey(d));
  }

  const positiveMoods = new Set(['ecstatic', 'happy', 'peaceful', 'motivated']);
  let loggedMoodDays = 0;
  let positiveDays = 0;
  let tiredOrSadDays = 0;

  recentKeys.forEach((k) => {
    const m = moodsMap[k];
    if (m?.key) {
      loggedMoodDays++;
      if (positiveMoods.has(m.key)) positiveDays++;
      if (m.key === 'tired' || m.key === 'sad') tiredOrSadDays++;
    }
  });

  // Thống kê tổng hợp theo nhãn trong 7 ngày qua (nếu trống hoàn toàn thì lấy tổng thể)
  let stats = analyzeCategoryStats({ events, todos, habits, days: 7 });
  if (stats.grandTotalCompleted === 0 && stats.grandTotalTasks === 0) {
    const allTimeStats = analyzeCategoryStats({ events, todos, habits, days: 0 });
    if (allTimeStats.grandTotalCompleted > 0 || allTimeStats.grandTotalTasks > 0) {
      stats = allTimeStats;
    }
  }

  const { categoriesMap, bestLabel, focusLabel, grandTotalCompleted, grandCompletedTasks, grandTotalTasks, overallCompletionRate } = stats;

  // Tìm thói quen được tick nhiều nhất trong 7 ngày qua
  let bestHabit = null;
  let bestHabitDays = 0;
  habits.forEach((h) => {
    const count = recentKeys.filter((k) => h.history && h.history[k]).length;
    if (count > bestHabitDays) {
      bestHabitDays = count;
      bestHabit = h.title;
    }
  });

  const catLabelsVi = { work: 'Công việc', study: 'Học tập', personal: 'Cá nhân', health: 'Sức khỏe', other: 'Khác' };
  const catLabelsEn = { work: 'Work', study: 'Study', personal: 'Personal', health: 'Health', other: 'Other' };

  const workStat = categoriesMap.work;
  const studyStat = categoriesMap.study;
  const healthStat = categoriesMap.health;
  const personalStat = categoriesMap.personal;
  const otherStat = categoriesMap.other;

  const isEn = lang === 'en';
  const labelsMap = isEn ? catLabelsEn : catLabelsVi;

  // Xây dựng lời khuyên riêng cho từng nhãn dựa trên số lượng hoàn thành & tỉ lệ hoàn thành
  const labelAdvice = {};

  if (workStat.totalCompleted > 0 || workStat.totalTasks > 0) {
    if (workStat.totalTasks > 0 && workStat.completionRate < 50) {
      labelAdvice.work = isEn
        ? `Work completion is ${workStat.completionRate}% (${workStat.completedTasks}/${workStat.totalTasks}). Split large work items into 25-min focus blocks.`
        : `Nhãn Công việc đạt ${workStat.completionRate}% (${workStat.completedTasks}/${workStat.totalTasks} mục). Hãy chia nhỏ đầu việc và chốt 1-2 việc quan trọng nhất trước trưa.`;
    } else if (workStat.sharePercent >= 45 && healthStat.totalCompleted === 0) {
      labelAdvice.work = isEn
        ? `You finished ${workStat.totalCompleted} Work item(s) (${workStat.sharePercent}% of output) — strong drive! Pair it with short breaks to avoid burnout.`
        : `Bạn hoàn thành ${workStat.totalCompleted} mục Công việc (${workStat.sharePercent}% tổng thành quả) — hiệu suất rất tốt, nhưng nhớ đứng dậy thư giãn mỗi 60 phút nhé.`;
    } else {
      labelAdvice.work = isEn
        ? `Steady Work progress (${workStat.totalCompleted} completed). Keep prioritizing high-impact tasks early in the day.`
        : `Tiến độ Công việc ổn định (${workStat.totalCompleted} mục hoàn thành). Tiếp tục giữ nhịp xử lý việc ưu tiên vào buổi sáng nhé.`;
    }
  }

  if (studyStat.totalCompleted > 0 || studyStat.totalTasks > 0) {
    if (studyStat.totalTasks > 0 && studyStat.completionRate >= 75) {
      labelAdvice.study = isEn
        ? `Great Study consistency (${studyStat.completionRate}% done)! Review notes for 10 mins to lock in what you learned.`
        : `Nhãn Học tập đạt ${studyStat.completionRate}% rất ấn tượng (${studyStat.totalCompleted} mục xong)! Hãy dành 10 phút ôn lại ý chính để nhớ lâu hơn.`;
    } else if (studyStat.totalTasks > studyStat.completedTasks) {
      labelAdvice.study = isEn
        ? `${studyStat.totalTasks - studyStat.completedTasks} Study task(s) still pending. Try a short 20-minute distraction-free study sprint.`
        : `Còn ${studyStat.totalTasks - studyStat.completedTasks} mục Học tập chưa xong. Thử đặt hẹn giờ 20 phút học sâu không điện thoại xem sao nhé!`;
    } else {
      labelAdvice.study = isEn
        ? `You completed ${studyStat.totalCompleted} Study session(s) — steady learning builds big momentum!`
        : `Bạn đã hoàn thành ${studyStat.totalCompleted} hoạt động Học tập — duy trì đều đặn mỗi ngày sẽ tiến bộ rất nhanh!`;
    }
  }

  if (healthStat.totalCompleted > 0 || healthStat.totalTasks > 0) {
    if (healthStat.totalCompleted >= 3) {
      labelAdvice.health = isEn
        ? `Awesome Health care (${healthStat.totalCompleted} completed)! This energy keeps your work and study sharper.`
        : `Tuyệt vời! Bạn đã hoàn thành ${healthStat.totalCompleted} hoạt động Sức khỏe — nền tảng thể chất tốt giúp học tập & làm việc hiệu quả hơn hẳn.`;
    } else {
      labelAdvice.health = isEn
        ? `You checked off ${healthStat.totalCompleted} Health activity(s). Try adding one more walk or early bedtime this week.`
        : `Bạn đã hoàn thành ${healthStat.totalCompleted} mục Sức khỏe. Hãy duy trì uống đủ nước và vận động nhẹ thêm nhé.`;
    }
  } else if (workStat.totalCompleted + studyStat.totalCompleted >= 2) {
    labelAdvice.health = isEn
      ? `No Health activities completed yet while Work/Study is busy — schedule a 15-min stretch or walk!`
      : `Bạn đang dồn sức cho Công việc/Học tập nhưng chưa hoàn thành mục Sức khỏe nào. Nhớ dành 15-20 phút đi dạo, giãn cơ hoặc ngủ sớm nhé!`;
  }

  if (personalStat.totalCompleted > 0 || personalStat.totalTasks > 0) {
    labelAdvice.personal = isEn
      ? `${personalStat.totalCompleted} Personal moment(s) completed — nurturing your own joy keeps life balanced.`
      : `Bạn đã hoàn thành ${personalStat.totalCompleted} hoạt động Cá nhân — cân bằng thời gian cho bản thân giúp tinh thần nhẹ nhàng hơn.`;
  }

  if (otherStat.totalCompleted > 0) {
    labelAdvice.other = isEn
      ? `${otherStat.totalCompleted} miscellaneous task(s) wrapped up cleanly.`
      : `Đã hoàn thành gọn gàng ${otherStat.totalCompleted} mục khác.`;
  }

  // Gợi ý hành động 1 chạm phù hợp nhất
  let recommendedAction = null;
  if (focusLabel === 'health') {
    recommendedAction = {
      title: isEn ? 'Walk & Stretch 20m' : 'Đi dạo & giãn cơ 20p',
      category: 'health',
      sticker: '🌿',
    };
  } else if (focusLabel === 'study') {
    recommendedAction = {
      title: isEn ? '25m Focus Study Sprint' : 'Học tập trung 25 phút',
      category: 'study',
      sticker: '📚',
    };
  } else if (focusLabel === 'work') {
    recommendedAction = {
      title: isEn ? 'Finish 1 Priority Work Task' : 'Chốt 1 đầu việc ưu tiên',
      category: 'work',
      sticker: '💼',
    };
  } else if (focusLabel === 'personal') {
    recommendedAction = {
      title: isEn ? 'Unwind & Tidy Space 15m' : 'Thư giãn & nghe nhạc 15p',
      category: 'personal',
      sticker: '🌸',
    };
  }

  if (isEn) {
    let brightSpot = '';
    if (grandTotalCompleted > 0 && bestLabel) {
      brightSpot = `You completed ${grandTotalCompleted} tagged item(s) across your planner${grandTotalTasks > 0 ? ` (${overallCompletionRate}% task rate)` : ''}, led by ${labelsMap[bestLabel]} (${categoriesMap[bestLabel].totalCompleted} done) 🌟.`;
    } else if (loggedMoodDays > 0) {
      brightSpot = `You logged ${positiveDays}/${loggedMoodDays} positive or peaceful days this week 🌸.`;
    } else {
      brightSpot = `A fresh week awaits! Tag your tasks as Work, Study, or Health and check them off so AI can synthesize your best advice 🌸.`;
    }

    let pattern = '';
    if (grandTotalCompleted > 0) {
      const activeSummary = ['work', 'study', 'health', 'personal', 'other']
        .filter((k) => categoriesMap[k].totalCompleted > 0 || categoriesMap[k].totalTasks > 0)
        .map((k) => `${labelsMap[k]}: ${categoriesMap[k].totalCompleted}`)
        .join(' · ');
      pattern = `Label mix (${activeSummary})${bestHabit && bestHabitDays >= 2 ? `, anchored by "${bestHabit}" (${bestHabitDays}/7d)` : ''}${loggedMoodDays > 0 ? ` across ${loggedMoodDays} mood log(s)` : ''}.`;
    } else if (bestHabit && habitDaysOrZero(bestHabitDays) >= 2) {
      pattern = `Your "${bestHabit}" habit (${bestHabitDays}/7 days) is your strongest anchor.`;
    } else {
      pattern = `Add and complete tagged Work, Study, or Health tasks so AI can measure your life balance accurately.`;
    }

    let suggestion = '';
    if (tiredOrSadDays >= 3 && workStat.totalCompleted + studyStat.totalCompleted > healthStat.totalCompleted) {
      suggestion = `You logged ${tiredOrSadDays} low-energy days while pushing Work/Study. Prioritize a Health recharge tonight and trim non-urgent tasks 🧸.`;
    } else if (focusLabel && labelAdvice[focusLabel]) {
      suggestion = labelAdvice[focusLabel];
    } else if (bestLabel && labelAdvice[bestLabel]) {
      suggestion = labelAdvice[bestLabel];
    } else {
      suggestion = `Balance your day with 1 Study or Work goal plus 1 Health habit like drinking water or a 15-min walk ✨.`;
    }

    return {
      brightSpot,
      pattern,
      suggestion,
      bestLabel,
      focusLabel,
      labelAdvice,
      recommendedAction,
      categoryStats: stats,
      source: 'local',
    };
  }

  // Tiếng Việt
  let brightSpot = '';
  if (grandTotalCompleted > 0 && bestLabel) {
    brightSpot = `Bạn đã hoàn thành ${grandTotalCompleted} mục được gắn nhãn${grandTotalTasks > 0 ? ` (đạt ${overallCompletionRate}% kế hoạch)` : ''}, nổi bật nhất là nhóm ${labelsMap[bestLabel]} với ${categoriesMap[bestLabel].totalCompleted} mục hoàn thành 🌟.`;
  } else if (loggedMoodDays > 0) {
    brightSpot = `Tuần qua bạn có ${positiveDays}/${loggedMoodDays} ngày tâm trạng tích cực/bình yên 🌸.`;
  } else {
    brightSpot = `Tuần mới đã sẵn sàng! Hãy gắn nhãn Công việc, Học tập, Sức khỏe cho lịch/to-do và hoàn thành để AI tổng hợp lời khuyên chuẩn xác nhất nhé 🌸.`;
  }

  let pattern = '';
  if (grandTotalCompleted > 0) {
    const activeSummary = ['work', 'study', 'health', 'personal', 'other']
      .filter((k) => categoriesMap[k].totalCompleted > 0 || categoriesMap[k].totalTasks > 0)
      .map((k) => `${labelsMap[k]}: ${categoriesMap[k].totalCompleted}`)
      .join(' · ');
    pattern = `Phân bổ hoàn thành theo nhãn (${activeSummary})${bestHabit && bestHabitDays >= 2 ? `, kết hợp thói quen "${bestHabit}" (${bestHabitDays}/7 ngày)` : ''}.`;
  } else {
    pattern = `Hãy thêm và tick hoàn thành các công việc gắn nhãn Công việc, Học tập, Sức khỏe để AI phân tích sự cân bằng của bạn nhé!`;
  }

  let suggestion = '';
  if (tiredOrSadDays >= 3 && workStat.totalCompleted + studyStat.totalCompleted > healthStat.totalCompleted) {
    suggestion = `Bạn có ${tiredOrSadDays} ngày hơi mệt khi tập trung nhiều vào Công việc/Học tập. Lời khuyên tốt nhất lúc này là ưu tiên nhãn Sức khỏe: nghỉ ngơi 30 phút và ngủ sớm hơn tối nay 🧸.`;
  } else if (focusLabel && labelAdvice[focusLabel]) {
    suggestion = labelAdvice[focusLabel];
  } else if (bestLabel && labelAdvice[bestLabel]) {
    suggestion = labelAdvice[bestLabel];
  } else {
    suggestion = `Hãy giữ cân bằng mỗi ngày với ít nhất 1 mục Công việc/Học tập và 1 hoạt động Sức khỏe như uống đủ nước hoặc đi dạo 15 phút nha ✨.`;
  }

  return {
    brightSpot,
    pattern,
    suggestion,
    bestLabel,
    focusLabel,
    labelAdvice,
    recommendedAction,
    categoryStats: stats,
    source: 'local',
  };
}

function habitDaysOrZero(val) {
  return Number(val) || 0;
}

function buildLocalMoodCompanion({ moodKey = 'happy', note = '', lang = 'vi' }) {
  const cleanNote = String(note || '').toLowerCase();
  const isStudyOrExam = /(thi|học|bài|exam|study|test|deadline|làm việc|họp|công việc)/.test(cleanNote);
  const isExhausted = /(mệt|đau|ngủ|kiệt|áp lực|stress|tired|exhaust|sleep|headache)/.test(cleanNote);

  if (lang === 'en') {
    if (moodKey === 'tired' || isExhausted) {
      return {
        reply: isStudyOrExam
          ? `You've been pushing hard with work and study today. Give yourself permission to pause, drink warm water, and rest early tonight 🌙✨.`
          : `Feeling drained is completely okay after a long day. Put down the phone for a bit and recharge slowly tonight 🧸🌙.`,
        suggestedAction: { title: 'Rest & Unwind 30m', category: 'health', sticker: '🌙' },
        source: 'local',
      };
    }
    if (moodKey === 'sad') {
      return {
        reply: `Sending you a gentle virtual hug 🐰. Whatever felt heavy today doesn't define tomorrow — take a quiet breath and do one tiny comforting thing for yourself.`,
        suggestedAction: { title: 'Short Walk / Cozy Music', category: 'personal', sticker: '🎵' },
        source: 'local',
      };
    }
    if (moodKey === 'ecstatic' || moodKey === 'motivated') {
      return {
        reply: `Love this bright energy! 🎉 Capture this feeling and treat yourself to something sweet after finishing your goals today.`,
        suggestedAction: null,
        source: 'local',
      };
    }
    return {
      reply: `A calm, steady day is always something worth cherishing ☕🌿. Hope the rest of your evening stays gentle and cozy.`,
      suggestedAction: null,
      source: 'local',
    };
  }

  if (moodKey === 'tired' || isExhausted) {
    return {
      reply: isStudyOrExam
        ? `Bạn đã cố gắng học tập và làm việc cả ngày rồi đó. Tối nay đừng ép bản thân thêm nữa, uống ngụm nước ấm rồi đi ngủ sớm một chút nha 🌙✨.`
        : `Cơ thể lên tiếng mệt mỏi là lúc bạn cần được vỗ về rồi. Tối nay cất điện thoại sớm, nghe chút nhạc nhẹ để hồi phục năng lượng nhé 🧸🌙.`,
      suggestedAction: { title: 'Nghỉ ngơi thư giãn 30p', category: 'health', sticker: '🌙' },
      source: 'local',
    };
  }
  if (moodKey === 'sad') {
    return {
      reply: `MyLife ôm bạn một cái thật nhẹ 🐰💖. Hôm nay có điều gì làm bạn chùng lòng thì cứ để nó trôi qua từ từ, ra ngoài hít thở hoặc nghe bài nhạc bạn thích một chút nhé.`,
      suggestedAction: { title: 'Đi dạo & Nghe nhạc 20p', category: 'personal', sticker: '🎵' },
      source: 'local',
    };
  }
  if (moodKey === 'ecstatic' || moodKey === 'motivated') {
    return {
      reply: `Năng lượng hôm nay tuyệt vời quá! 🎉 Giữ tinh thần rực rỡ này và nhớ tự thưởng cho bản thân một ly đồ uống ngon hoặc chút thời gian vui vẻ nha 🧋💖.`,
      suggestedAction: null,
      source: 'local',
    };
  }
  return {
    reply: `Một ngày nhẹ nhàng và bình yên luôn là món quà rất đáng trân trọng ☕🌿. Chúc phần thời gian còn lại trong ngày của bạn thật êm ả nhé!`,
    suggestedAction: null,
    source: 'local',
  };
}

/* =========================================================================
   PUBLIC API FUNCTIONS (Dùng cho #2 HomeScreen, #3 InsightsScreen, #4 MoodModal)
   ========================================================================= */

export async function getCachedDailyBriefing(accountKey = 'guest', dateStr) {
  const memKey = `${accountKey}_${dateStr}`;
  if (memoryBriefingCache.has(memKey)) {
    return memoryBriefingCache.get(memKey);
  }
  try {
    const raw = await AsyncStorage.getItem(`mylife_ai_briefing_${memKey}`);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed) memoryBriefingCache.set(memKey, parsed);
    return parsed;
  } catch (e) {
    return null;
  }
}

export async function fetchDailyBriefing({
  accountKey = 'guest',
  isProUser = false,
  lang = 'vi',
  weather,
  dayEvents = [],
  dayTodos = [],
  countdowns = [],
  habits = [],
  selectedDateMood = null,
  dateStr,
  forceRefresh = false,
}) {
  const memKey = `${accountKey}_${dateStr}`;
  if (!forceRefresh) {
    const cached = await getCachedDailyBriefing(accountKey, dateStr);
    if (cached && cached.source === 'gemini' && (!cached.lang || cached.lang === lang)) {
      return cached;
    }
  }

  // Tuyệt đối không gửi SĐT, email hay thông tin cá nhân lên AI
  const sanitizedPayload = {
    date: dateStr,
    weather: {
      temp: weather?.temp ?? null,
      condition: (lang === 'en' ? weather?.descEn : weather?.descVi) || weather?.condition || '',
    },
    moodToday: selectedDateMood?.key || null,
    events: dayEvents.slice(0, 8).map((e) => ({
      title: e.title,
      time: e.time,
      category: resolveItemCategory(e),
      completed: !!e.completed,
    })),
    todos: dayTodos.slice(0, 8).map((td) => ({
      title: td.title,
      category: resolveItemCategory(td),
      completed: !!td.completed,
    })),
    upcomingDDays: countdowns
      .map((cd) => ({ title: cd.title, daysLeft: daysRemaining(cd.targetDate) }))
      .filter((cd) => cd.daysLeft >= 0 && cd.daysLeft <= 30)
      .slice(0, 3),
    pendingHabitsCount: habits.filter((h) => !(h.history && h.history[dateStr])).length,
  };

  let result = null;
  const quota = await getDailyQuotaStatus(accountKey, isProUser);
  if (quota.allowed) {
    const live = await callAiProxy('daily_briefing', lang, sanitizedPayload);
    if (live?.message) {
      incrementDailyQuota(quota.storageKey, quota.used);
      result = {
        message: String(live.message).trim(),
        highlightTag: live.highlightTag ? String(live.highlightTag).trim() : '',
        lang,
        source: 'gemini',
        updatedAt: Date.now(),
      };
    }
  }

  if (!result) {
    result = {
      ...buildLocalDailyBriefing({ weather, dayEvents, dayTodos, countdowns, habits, dateStr, lang }),
      updatedAt: Date.now(),
    };
  } else {
    memoryBriefingCache.set(memKey, result);
    AsyncStorage.setItem(`mylife_ai_briefing_${memKey}`, JSON.stringify(result)).catch(() => {});
  }

  return result;
}

export async function getCachedWeeklyInsights(accountKey = 'guest') {
  if (memoryInsightsCache.has(accountKey)) {
    return memoryInsightsCache.get(accountKey);
  }
  try {
    const raw = await AsyncStorage.getItem(`mylife_ai_insights_${accountKey}`);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed) memoryInsightsCache.set(accountKey, parsed);
    return parsed;
  } catch (e) {
    return null;
  }
}

export async function fetchWeeklyInsights({
  accountKey = 'guest',
  isProUser = false,
  lang = 'vi',
  events = [],
  todos = [],
  moodsMap = {},
  habits = [],
  forceRefresh = false,
}) {
  // Tính thống kê theo nhãn thời gian thực
  let liveStats = analyzeCategoryStats({ events, todos, habits, days: 7 });
  if (liveStats.grandTotalCompleted === 0 && liveStats.grandTotalTasks === 0) {
    const allTimeStats = analyzeCategoryStats({ events, todos, habits, days: 0 });
    if (allTimeStats.grandTotalCompleted > 0 || allTimeStats.grandTotalTasks > 0) {
      liveStats = allTimeStats;
    }
  }
  const statsFingerprint = `${lang}_${liveStats.grandTotalCompleted}_${liveStats.grandTotalTasks}`;

  if (!forceRefresh) {
    const cached = await getCachedWeeklyInsights(accountKey);
    // Dùng cache Gemini trong vòng 12 giờ nếu ngôn ngữ & số liệu chưa thay đổi
    if (
      cached &&
      cached.source === 'gemini' &&
      cached.updatedAt &&
      cached.statsFingerprint === statsFingerprint &&
      Date.now() - cached.updatedAt < 12 * 60 * 60 * 1000
    ) {
      return { ...cached, categoryStats: liveStats };
    }
  }

  const now = new Date();
  const recentKeys = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    recentKeys.push(dateKey(d));
  }

  const sanitizedPayload = {
    periodDays: liveStats.periodDays,
    overallCompletionRate: liveStats.overallCompletionRate,
    grandTotalCompleted: liveStats.grandTotalCompleted,
    grandTotalTasks: liveStats.grandTotalTasks,
    bestLabel: liveStats.bestLabel,
    focusLabel: liveStats.focusLabel,
    categoryBreakdown: liveStats.byCategory.map((c) => ({
      category: c.key,
      completedTotal: c.totalCompleted,
      completedTasks: c.completedTasks,
      plannedTasks: c.totalTasks,
      habitCheckins: c.habitCheckins,
      completionRatePercent: c.completionRate,
      sharePercent: c.sharePercent,
      completedSamples: c.completedTitles,
      pendingSamples: c.pendingTitles,
    })),
    recentMoods: recentKeys
      .filter((k) => moodsMap[k]?.key)
      .map((k) => ({
        date: k,
        mood: moodsMap[k].key,
        note: String(moodsMap[k].note || '').slice(0, 80),
      })),
    habitsSummary: habits.slice(0, 8).map((h) => ({
      title: h.title,
      category: resolveItemCategory(h),
      doneDaysLast7: recentKeys.filter((k) => h.history && h.history[k]).length,
    })),
  };

  let result = null;
  const quota = await getDailyQuotaStatus(accountKey, isProUser);
  if (quota.allowed) {
    const live = await callAiProxy('weekly_insights', lang, sanitizedPayload);
    if (live?.brightSpot || live?.pattern || live?.suggestion) {
      await incrementDailyQuota(quota.storageKey, quota.used);
      const validCats = new Set(['work', 'study', 'personal', 'health', 'other']);
      const cleanAdvice = {};
      if (live.labelAdvice && typeof live.labelAdvice === 'object') {
        Object.entries(live.labelAdvice).forEach(([k, v]) => {
          if (validCats.has(k) && v && String(v).trim()) {
            cleanAdvice[k] = String(v).trim();
          }
        });
      }
      const action = live.recommendedAction;
      result = {
        brightSpot: String(live.brightSpot || '').trim(),
        pattern: String(live.pattern || '').trim(),
        suggestion: String(live.suggestion || '').trim(),
        bestLabel: validCats.has(live.bestLabel) ? live.bestLabel : liveStats.bestLabel,
        focusLabel: validCats.has(live.focusLabel) ? live.focusLabel : liveStats.focusLabel,
        labelAdvice: cleanAdvice,
        recommendedAction:
          action && action.title && String(action.title).trim().length > 0
            ? {
                title: String(action.title).trim().slice(0, 45),
                category: validCats.has(action.category) ? action.category : 'health',
                sticker: action.sticker || '🌿',
              }
            : null,
        categoryStats: liveStats,
        statsFingerprint,
        source: 'gemini',
        updatedAt: Date.now(),
      };
    }
  }

  if (!result) {
    result = {
      ...buildLocalWeeklyInsights({ events, todos, moodsMap, habits, lang }),
      statsFingerprint,
      updatedAt: Date.now(),
    };
  } else {
    memoryInsightsCache.set(accountKey, result);
    AsyncStorage.setItem(`mylife_ai_insights_${accountKey}`, JSON.stringify(result)).catch(() => {});
  }

  return result;
}

export async function fetchMoodCompanion({
  accountKey = 'guest',
  isProUser = false,
  lang = 'vi',
  moodKey,
  note = '',
  useLiveAi = true,
}) {
  if (useLiveAi) {
    const quota = await getDailyQuotaStatus(accountKey, isProUser);
    if (quota.allowed) {
      const live = await callAiProxy('mood_companion', lang, {
        mood: moodKey,
        note: String(note || '').slice(0, 150),
      });
      if (live?.reply) {
        await incrementDailyQuota(quota.storageKey, quota.used);
        const action = live.suggestedAction;
        return {
          reply: String(live.reply).trim(),
          suggestedAction:
            action && action.title && String(action.title).trim().length > 0
              ? {
                  title: String(action.title).trim(),
                  category: action.category || 'health',
                  sticker: action.sticker || '🌿',
                }
              : null,
          source: 'gemini',
        };
      }
    }
  }

  return buildLocalMoodCompanion({ moodKey, note, lang });
}

export function getInstantDailyBriefing(params) {
  return buildLocalDailyBriefing(params || {});
}

export function getInstantWeeklyInsights(params) {
  return buildLocalWeeklyInsights(params || {});
}

export function getInstantMoodPreview({ moodKey, note = '', lang = 'vi' }) {
  return buildLocalMoodCompanion({ moodKey, note, lang });
}

/**
 * Lưu báo cáo nội dung AI chưa phù hợp (tuân thủ chính sách Google Play AI-Generated Content)
 */
export async function reportAiContent({ task, content }) {
  try {
    const raw = await AsyncStorage.getItem('mylife_ai_reports');
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({
      id: String(Date.now()),
      task,
      content: String(content || '').slice(0, 200),
      reportedAt: new Date().toISOString(),
    });
    await AsyncStorage.setItem('mylife_ai_reports', JSON.stringify(list.slice(0, 20)));
  } catch (e) {}
}
