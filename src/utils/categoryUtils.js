import { CATEGORY_KEYS } from '../constants/data';
import { dateKey } from './dateUtils';

const VALID_CATEGORY_SET = new Set(CATEGORY_KEYS.map((c) => c.key));
const CATEGORY_META_MAP = Object.fromEntries(CATEGORY_KEYS.map((c) => [c.key, c]));
const inferredCategoryCache = new Map();

/**
 * Lấy metadata (icon, color, emoji) cho 1 nhãn danh mục (O(1))
 */
export function getCategoryMeta(key) {
  return CATEGORY_META_MAP[key] || CATEGORY_KEYS[CATEGORY_KEYS.length - 1];
}

/**
 * Suy luận nhãn tự động từ tiêu đề (có cache RAM để tránh chạy lại regex)
 */
export function inferCategoryFromText(text = '') {
  const lower = String(text || '').toLowerCase().trim();
  if (!lower) return 'other';

  const cached = inferredCategoryCache.get(lower);
  if (cached) return cached;

  let result = 'other';
  if (/(học|ôn tập|bài tập|từ vựng|đọc sách|sách|thi|tiếng anh|study|read|book|exam|course|lecture|homework|research)/.test(lower)) {
    result = 'study';
  } else if (/(nước|ngủ|đi dạo|thể dục|tập|gym|chạy|thiền|thuốc|khám|sức khỏe|yoga|ăn|bữa|health|water|sleep|walk|run|workout|meditate|drink)/.test(lower)) {
    result = 'health';
  } else if (/(họp|công việc|dự án|báo cáo|email|làm việc|deadline|khách hàng|code|slide|work|meeting|project|report|client|office|task)/.test(lower)) {
    result = 'work';
  } else if (/(hoa|trang trí|mua|gia đình|bạn|sinh nhật|dọn|nhà|xem phim|du lịch|cá nhân|personal|family|friend|clean|shop|hobby|music)/.test(lower)) {
    result = 'personal';
  }

  if (inferredCategoryCache.size >= 500) {
    inferredCategoryCache.clear();
  }
  inferredCategoryCache.set(lower, result);
  return result;
}

/**
 * Trả về nhãn hợp lệ của 1 event / todo / habit (ưu tiên nhãn người dùng đã chọn)
 */
export function resolveItemCategory(item) {
  if (item?.category && VALID_CATEGORY_SET.has(item.category)) {
    return item.category;
  }
  return inferCategoryFromText(item?.title || '');
}

/**
 * Thống kê tổng hợp công việc đã hoàn thành & đang chờ theo từng nhãn (work, study, personal, health, other)
 * Kết hợp cả Lịch trình (events), Việc cần làm (todos) và Thói quen (habits).
 */
export function analyzeCategoryStats({ events = [], todos = [], habits = [], days = 7 } = {}) {
  let recentKeySet = null;
  if (days > 0) {
    const now = new Date();
    recentKeySet = new Set();
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      recentKeySet.add(dateKey(d));
    }
  }

  const categoriesMap = {};
  CATEGORY_KEYS.forEach((cat) => {
    categoriesMap[cat.key] = {
      key: cat.key,
      icon: cat.icon,
      color: cat.color,
      emoji: cat.emoji,
      eventsTotal: 0,
      eventsCompleted: 0,
      todosTotal: 0,
      todosCompleted: 0,
      habitsCount: 0,
      habitCheckins: 0,
      completedTasks: 0,
      totalTasks: 0,
      totalCompleted: 0,
      completionRate: 0,
      sharePercent: 0,
      completedTitles: [],
      pendingTitles: [],
    };
  });

  // 1. Thống kê Lịch trình (Events)
  (events || []).forEach((e) => {
    if (recentKeySet && !recentKeySet.has(e.date)) return;
    const catKey = resolveItemCategory(e);
    const bucket = categoriesMap[catKey];
    bucket.eventsTotal += 1;
    bucket.totalTasks += 1;
    if (e.completed) {
      bucket.eventsCompleted += 1;
      bucket.completedTasks += 1;
      bucket.totalCompleted += 1;
      if (bucket.completedTitles.length < 5 && e.title) {
        bucket.completedTitles.push(String(e.title).slice(0, 40));
      }
    } else if (bucket.pendingTitles.length < 5 && e.title) {
      bucket.pendingTitles.push(String(e.title).slice(0, 40));
    }
  });

  // 2. Thống kê Việc cần làm (To-Do)
  (todos || []).forEach((td) => {
    if (recentKeySet && td.date && !recentKeySet.has(td.date)) return;
    const catKey = resolveItemCategory(td);
    const bucket = categoriesMap[catKey];
    bucket.todosTotal += 1;
    bucket.totalTasks += 1;
    if (td.completed) {
      bucket.todosCompleted += 1;
      bucket.completedTasks += 1;
      bucket.totalCompleted += 1;
      if (bucket.completedTitles.length < 5 && td.title) {
        bucket.completedTitles.push(String(td.title).slice(0, 40));
      }
    } else if (bucket.pendingTitles.length < 5 && td.title) {
      bucket.pendingTitles.push(String(td.title).slice(0, 40));
    }
  });

  // 3. Thống kê Thói quen (Habits)
  (habits || []).forEach((h) => {
    const catKey = resolveItemCategory(h);
    const bucket = categoriesMap[catKey];
    bucket.habitsCount += 1;

    const historyKeys = Object.keys(h.history || {}).filter((k) => h.history[k]);
    const checkins = recentKeySet
      ? historyKeys.filter((k) => recentKeySet.has(k)).length
      : historyKeys.length;

    bucket.habitCheckins += checkins;
    bucket.totalCompleted += checkins;
    if (checkins > 0 && bucket.completedTitles.length < 5 && h.title) {
      bucket.completedTitles.push(`${String(h.title).slice(0, 32)} (${checkins}d)`);
    }
  });

  let grandTotalCompleted = 0;
  let grandCompletedTasks = 0;
  let grandTotalTasks = 0;
  let grandHabitCheckins = 0;

  Object.values(categoriesMap).forEach((b) => {
    grandTotalCompleted += b.totalCompleted;
    grandCompletedTasks += b.completedTasks;
    grandTotalTasks += b.totalTasks;
    grandHabitCheckins += b.habitCheckins;
    if (b.totalTasks > 0) {
      b.completionRate = Math.round((b.completedTasks / b.totalTasks) * 100);
    } else if (b.habitCheckins > 0) {
      b.completionRate = 100;
    }
  });

  const byCategory = CATEGORY_KEYS.map((cat) => {
    const b = categoriesMap[cat.key];
    b.sharePercent = grandTotalCompleted > 0
      ? Math.round((b.totalCompleted / grandTotalCompleted) * 100)
      : 0;
    return b;
  });

  // Tìm nhãn hoạt động nổi bật nhất (nhiều mục hoàn thành nhất)
  const sortedByCompleted = [...byCategory]
    .filter((b) => b.totalCompleted > 0)
    .sort((a, b) => b.totalCompleted - a.totalCompleted || b.completionRate - a.completionRate);
  const bestLabel = sortedByCompleted[0]?.key || null;

  // Tìm nhãn cần chú ý / cân bằng nhất
  let focusLabel = null;
  const workDone = categoriesMap.work.totalCompleted;
  const studyDone = categoriesMap.study.totalCompleted;
  const healthDone = categoriesMap.health.totalCompleted;

  // Nếu làm việc/học tập nhiều nhưng sức khỏe bị bỏ quên -> ưu tiên nhắc Sức khỏe
  if (workDone + studyDone >= 2 && healthDone === 0) {
    focusLabel = 'health';
  } else {
    // Hoặc chọn nhãn có việc đang chờ / tỉ lệ hoàn thành thấp nhất
    const needAttention = [...byCategory]
      .filter((b) => b.totalTasks > 0 && b.completionRate < 100)
      .sort((a, b) => a.completionRate - b.completionRate || (b.totalTasks - b.completedTasks) - (a.totalTasks - a.completedTasks));
    if (needAttention[0]) {
      focusLabel = needAttention[0].key;
    } else if (grandTotalCompleted > 0 && healthDone === 0) {
      focusLabel = 'health';
    } else if (grandTotalCompleted > 0 && studyDone === 0) {
      focusLabel = 'study';
    }
  }

  const overallCompletionRate = grandTotalTasks > 0
    ? Math.round((grandCompletedTasks / grandTotalTasks) * 100)
    : grandHabitCheckins > 0
    ? 100
    : 0;

  return {
    byCategory,
    categoriesMap,
    grandTotalCompleted,
    grandCompletedTasks,
    grandTotalTasks,
    grandHabitCheckins,
    overallCompletionRate,
    bestLabel,
    focusLabel,
    periodDays: days,
  };
}
