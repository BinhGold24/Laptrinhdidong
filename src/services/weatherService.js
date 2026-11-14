import { fetchWithTimeout } from '../utils/fetchUtils';

let cachedGeo = null;
let cachedWeather = null;
let cachedWeatherAt = 0;
const WEATHER_TTL_MS = 5 * 60 * 1000;

export async function fetchRealWeather(force = false) {
  if (!force && cachedWeather && Date.now() - cachedWeatherAt < WEATHER_TTL_MS) {
    return cachedWeather;
  }

  try {
    let lat = cachedGeo?.lat ?? 21.0285;
    let lon = cachedGeo?.lon ?? 105.8542;
    let city = cachedGeo?.city ?? 'Hà Nội';

    if (!cachedGeo) {
      try {
        const geoRes = await fetchWithTimeout('https://get.geojs.io/v1/ip/geo.json', {}, 4000);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.latitude && geoData.longitude) {
            lat = Number(geoData.latitude);
            lon = Number(geoData.longitude);
            city = geoData.city || geoData.region || 'Việt Nam';
            cachedGeo = { lat, lon, city };
          }
        }
      } catch (geoErr) {}
    }

    const weatherRes = await fetchWithTimeout(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
      {},
      4500
    );
    if (!weatherRes.ok) return null;

    const weatherData = await weatherRes.json();
    const current = weatherData.current;
    if (!current) return null;

    const temp = Math.round(current.temperature_2m);
    const code = current.weather_code;

    let icon = '🌤️';
    let descVi = 'Nắng nhẹ';
    let descEn = 'Partly sunny';

    if (code === 0) {
      icon = '☀️';
      descVi = 'Trời nắng';
      descEn = 'Sunny';
    } else if (code === 1 || code === 2) {
      icon = '🌤️';
      descVi = 'Nắng nhẹ';
      descEn = 'Partly sunny';
    } else if (code === 3) {
      icon = '☁️';
      descVi = 'Nhiều mây';
      descEn = 'Cloudy';
    } else if (code === 45 || code === 48) {
      icon = '🌫️';
      descVi = 'Sương mù';
      descEn = 'Foggy';
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
      icon = '🌧️';
      descVi = 'Có mưa';
      descEn = 'Rainy';
    } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
      icon = '❄️';
      descVi = 'Tuyết rơi';
      descEn = 'Snowy';
    } else if ([95, 96, 99].includes(code)) {
      icon = '⛈️';
      descVi = 'Giông bão';
      descEn = 'Thunderstorm';
    }

    cachedWeather = {
      temp,
      icon,
      city,
      descVi,
      descEn,
    };
    cachedWeatherAt = Date.now();
    return cachedWeather;
  } catch (err) {
    console.warn('Lỗi lấy thời tiết:', err);
    return null;
  }
}
