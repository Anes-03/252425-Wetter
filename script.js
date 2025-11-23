// --- Global Error Catcher for Debugging ---
window.onerror = function(message, source, lineno, colno, error) {
    try {
        const errorDisplay = document.getElementById('error-message');
        const loader = document.getElementById('loader');
        const mainContent = document.getElementById('main-content');

        if (errorDisplay) {
            const sourceFile = source ? source.split('/').pop() : 'unknown file';
            errorDisplay.innerHTML = `<strong>JavaScript Error:</strong><br>${message}<br>at ${sourceFile}:${lineno}`;
            errorDisplay.classList.remove('hidden');
        }
        if (loader) loader.classList.add('hidden');
        if (mainContent) mainContent.classList.add('hidden');

    } catch (e) {
        // If the error handler itself fails, alert the user.
        alert('A critical error occurred, and the error display failed. Message: ' + message);
    }
    
    return true; // Prevents the default browser error console.
};

// --- DOM Element References ---
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const mainContent = document.getElementById('main-content');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');

const locationEl = document.getElementById('location');
const currentTempEl = document.getElementById('current-temp');
const mainWeatherIconEl = document.getElementById('main-weather-icon');
const conditionLabelEl = document.getElementById('condition-label');
const tempMaxEl = document.getElementById('temp-max');
const tempMinEl = document.getElementById('temp-min');

const windSpeedEl = document.getElementById('wind-speed');
const humidityEl = document.getElementById('humidity');
const precipProbMiniEl = document.getElementById('precip-prob-mini');
const pressureEl = document.getElementById('pressure');
const apparentTempEl = document.getElementById('apparent-temp');
const cloudCoverEl = document.getElementById('cloud-cover');
const windGustEl = document.getElementById('wind-gust');
const visibilityEl = document.getElementById('visibility');
const uvIndexEl = document.getElementById('uv-index');
const snowAmountEl = document.getElementById('snow-amount');
const aqiEuEl = document.getElementById('aqi-eu');
const pm25El = document.getElementById('pm25');

const weatherChartContainer = document.getElementById('weather-chart-container');
const forecastList = document.getElementById('forecast-list');

const sunriseTimeEl = document.getElementById('sunrise-time');
const sunsetTimeEl = document.getElementById('sunset-time');
const dayStatusEl = document.getElementById('day-status');


// --- Helpers & Icon Logic ---

const getWeatherInfo = (code) => {
  if (code === 0) return { label: 'Klar', icon: 'sun' };
  if (code === 1) return { label: 'Überwiegend klar', icon: 'sun' };
  if (code === 2) return { label: 'Teils bewölkt', icon: 'cloud-sun' };
  if (code === 3) return { label: 'Bedeckt', icon: 'cloud' };
  if (code >= 45 && code <= 48) return { label: 'Nebel', icon: 'cloudy' };
  if (code >= 51 && code <= 55) return { label: 'Nieselregen', icon: 'cloud-drizzle' };
  if (code >= 56 && code <= 57) return { label: 'Eisregen', icon: 'cloud-snow' };
  if (code >= 61 && code <= 65) return { label: 'Regen', icon: 'cloud-rain' };
  if (code >= 66 && code <= 67) return { label: 'Gefrierender Regen', icon: 'cloud-snow' };
  if (code >= 71 && code <= 77) return { label: 'Schneefall', icon: 'cloud-snow' };
  if (code >= 80 && code <= 82) return { label: 'Schauer', icon: 'cloud-rain' };
  if (code >= 85 && code <= 86) return { label: 'Schneeschauer', icon: 'cloud-snow' };
  if (code >= 95) return { label: 'Gewitter', icon: 'cloud-lightning' };
  return { label: 'Unbekannt', icon: 'sun' };
};

const isSnowCode = (code) => {
  return (code >= 56 && code <= 57) || (code >= 66 && code <= 67) || (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
};

// Creates a Lucide icon SVG STRING
const createWeatherIcon = (code, isDay = true, options = {}) => {
  const { icon } = getWeatherInfo(code);
  let specificIcon = icon;

  // Adjust icon for nighttime
  if (icon === 'sun' && !isDay) {
      specificIcon = 'moon';
  } else if (icon === 'cloud-sun' && !isDay) {
      specificIcon = 'cloud-moon';
  }
  if (!window.lucide || typeof lucide.createIcon !== 'function') {
    return '';
  }
  const iconName = lucide.icons && lucide.icons[specificIcon] ? specificIcon : 'cloud';
  
  // lucide.createIcon returns an SVGSVGElement DOM node
  const iconNode = lucide.createIcon(iconName);

  // Set attributes on the node before getting its HTML
  iconNode.setAttribute('width', options.width || 24);
  iconNode.setAttribute('height', options.height || 24);
  
  // Set color as an inline style. This is simple and effective for this use case.
  let color;
  switch(specificIcon) {
    case 'sun': color = '#fcd34d'; break;
    case 'moon': color = '#e2e8f0'; break;
    case 'cloud-sun': color = '#cbd5e1'; break;
    case 'cloud-moon': color = '#cbd5e1'; break;
    case 'cloud': color = '#cbd5e1'; break;
    case 'cloudy': color = '#94a3b8'; break;
    case 'cloud-drizzle': color = '#93c5fd'; break;
    case 'cloud-rain': color = '#93c5fd'; break;
    case 'cloud-snow': color = '#a5f3fc'; break;
    case 'cloud-lightning': color = '#c4b5fd'; break;
    default: color = 'currentColor';
  }
  iconNode.style.color = color;
  
  // Return the HTML string of the configured node
  return iconNode.outerHTML;
};

// --- Weather Chart Generation ---

const createWeatherChart = (hourlyData) => {
    // Clear previous chart
    weatherChartContainer.innerHTML = '';

    if (!Array.isArray(hourlyData) || hourlyData.length === 0) {
        weatherChartContainer.textContent = 'Keine Diagrammdaten verfügbar.';
        return;
    }

    const data = hourlyData.filter((_, i) => i % 3 === 0).slice(0, 8);
    if (data.length < 2) {
        weatherChartContainer.textContent = 'Zu wenige Daten für ein Diagramm.';
        return;
    }
    
    const temps = data.map(d => d.temp);
    const minTemp = Math.min(...temps) - 3;
    const maxTemp = Math.max(...temps) + 3;
    const tempRange = Math.max(1, maxTemp - minTemp);

    // SVG dimensions
    const width = 1000;
    const height = 350;
    const paddingX = 70;
    const paddingY = 70;

    const getX = (index) => paddingX + (index * ((width - paddingX * 2) / (data.length - 1)));
    const getY = (temp) => height - paddingY - ((temp - minTemp) / tempRange) * (height - paddingY * 2);

    const generateLinePath = () => {
        let path = `M ${getX(0)} ${getY(data[0].temp)}`;
        for (let i = 0; i < data.length - 1; i++) {
            const x_mid = (getX(i) + getX(i + 1)) / 2;
            const y_curr = getY(data[i].temp);
            const y_next = getY(data[i+1].temp);
            path += ` C ${x_mid} ${y_curr}, ${x_mid} ${y_next}, ${getX(i + 1)} ${y_next}`;
        }
        return path;
    };
    
    const generateAreaPath = () => {
        let path = generateLinePath();
        path += ` L ${getX(data.length - 1)} ${height - paddingY}`;
        path += ` L ${getX(0)} ${height - paddingY} Z`;
        return path;
    };

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.overflow = "visible";

    // Create definitions (gradients, filters)
    const defs = `
        <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#60a5fa" />
                <stop offset="100%" stop-color="#38bdf8" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3" />
                <stop offset="90%" stop-color="#3b82f6" stop-opacity="0" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                   <feMergeNode in="coloredBlur"/>
                   <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>`;
    svg.innerHTML = defs;
    
    // Grid Lines & Precip bars
    const staticGroup = document.createElementNS(svgNS, "g");
    let staticHTML = `
        <line x1="${paddingX}" y1="${height-paddingY}" x2="${width-paddingX}" y2="${height-paddingY}" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
        <line x1="${paddingX}" y1="${(height-paddingY)/2 + 20}" x2="${width-paddingX}" y2="${(height-paddingY)/2 + 20}" stroke="rgba(255,255,255,0.03)" stroke-width="1" stroke-dasharray="6 6" />
    `;

    data.forEach((d, i) => {
        const maxBarHeight = height - paddingY;
        const barHeight = (d.precip / 100) * maxBarHeight * 0.8;
        const fillColor = d.isSnow ? '#cffafe' : '#3b82f6';
        
        staticHTML += `
          <g>
            <rect x="${getX(i) - 18}" y="0" width="36" height="${height - paddingY}" fill="rgba(255,255,255,0.01)" rx="4" />
            ${d.precip > 0 ? `
              <rect 
                x="${getX(i) - 12}" 
                y="${height - paddingY - barHeight}" 
                width="24" 
                height="${barHeight}" 
                fill="${fillColor}"
                opacity="0.4"
                rx="3"
              />` : `
               <rect x="${getX(i) - 8}" y="${height - paddingY - 2}" width="16" height="2" fill="white" opacity="0.05" rx="1" />
            `}
            ${d.precip >= 15 ? `
               <text x="${getX(i)}" y="${height - paddingY - barHeight - 12}" text-anchor="middle" style="font-size: 14px; font-weight: bold; fill: ${d.isSnow ? '#a5f3fc' : '#93c5fd'};">
                  ${d.precip}%
               </text>` : ''}
          </g>
        `;
    });
    staticGroup.innerHTML = staticHTML;
    svg.appendChild(staticGroup);

    // Area and Line Path
    const pathGroup = document.createElementNS(svgNS, "g");
    pathGroup.innerHTML = `
        <path d="${generateAreaPath()}" fill="url(#areaGradient)" />
        <path d="${generateLinePath()}" fill="none" stroke="url(#lineGradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#softGlow)" />
    `;
    svg.appendChild(pathGroup);
    
    // Data Points and Labels
    const pointsGroup = document.createElementNS(svgNS, "g");
    let pointsHTML = '';
    data.forEach((d, i) => {
        pointsHTML += `
            <g class="chart-point">
                <circle cx="${getX(i)}" cy="${getY(d.temp)}" r="6" fill="#0f172a" stroke="#60a5fa" stroke-width="3" />
                <text x="${getX(i)}" y="${getY(d.temp) - 20}" text-anchor="middle" style="fill: #f1f5f9; font-size: 20px; font-weight: bold;">
                    ${d.temp}°
                </text>
                <text x="${getX(i)}" y="${height - 20}" text-anchor="middle" style="fill: #64748b; font-size: 14px; font-weight: 500;">
                    ${d.time}
                </text>
            </g>
        `;
    });
    pointsGroup.innerHTML = pointsHTML;
    svg.appendChild(pointsGroup);

    weatherChartContainer.appendChild(svg);
};


// --- Data Fetching & Transformation ---

const fetchWeatherData = async (city) => {
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`);
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    if (!geoData.results?.length) return null;
    
    const { latitude, longitude, name, country } = geoData.results[0];
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,precipitation_probability,weather_code,visibility,snowfall,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,snowfall_sum,uv_index_max&timezone=auto`
    );
    if (!weatherRes.ok) return null;
    const data = await weatherRes.json();

    if (!data?.current || !data?.hourly || !data?.daily) return null;

    // Air quality fetch (best-effort)
    let airQuality = null;
    try {
      const airRes = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=pm2_5,european_aqi&timezone=auto`
      );
      if (airRes.ok) {
        airQuality = await airRes.json();
      }
    } catch (err) {
      console.warn('Air quality fetch failed', err);
    }

    // Transform data for our UI
    const current = data.current;
    const daily = data.daily;
    let currentHourIndex = data.hourly.time.findIndex((t) => t === data.current.time);
    if (currentHourIndex === -1) {
      const now = Date.now();
      currentHourIndex = data.hourly.time.findIndex((t) => new Date(t).getTime() >= now);
    }
    if (currentHourIndex === -1) currentHourIndex = 0;
    
    const hourlyData = data.hourly.time.slice(currentHourIndex, currentHourIndex + 24).map((t, i) => {
      const code = data.hourly.weather_code[currentHourIndex + i];
      const temp = data.hourly.temperature_2m[currentHourIndex + i];
      const precipProb = data.hourly.precipitation_probability[currentHourIndex + i];
      const safePrecipProb = Number.isFinite(precipProb) ? precipProb : 0;
      return {
        time: new Date(t).toLocaleTimeString('de-DE', { hour: '2-digit' }),
        temp: Math.round(temp),
        precip: safePrecipProb,
        code: code,
        isSnow: isSnowCode(code) || (temp <= 1 && safePrecipProb > 0)
      };
    });

    const visibilityMeter = data.hourly.visibility?.[currentHourIndex];
    const visibilityKm = Number.isFinite(visibilityMeter) ? Math.round(visibilityMeter / 1000) : null;

    // Air quality alignment with the same hour
    let aqiEU = null;
    let pm25 = null;
    if (airQuality?.hourly?.time) {
      let aqiHourIndex = airQuality.hourly.time.findIndex((t) => t === data.current.time);
      if (aqiHourIndex === -1) {
        const now = Date.now();
        aqiHourIndex = airQuality.hourly.time.findIndex((t) => new Date(t).getTime() >= now);
      }
      if (aqiHourIndex === -1) aqiHourIndex = 0;
      const aqiVal = airQuality.hourly.european_aqi?.[aqiHourIndex];
      const pmVal = airQuality.hourly.pm2_5?.[aqiHourIndex];
      aqiEU = Number.isFinite(aqiVal) ? Math.round(aqiVal) : null;
      pm25 = Number.isFinite(pmVal) ? Math.round(pmVal) : null;
    }

    const dailyData = data.daily.time.map((t, i) => {
      const precipProb = daily.precipitation_probability_max[i];
      return {
        day: new Date(t).toLocaleDateString('de-DE', { weekday: 'short' }),
        date: new Date(t).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        tempMin: Math.round(daily.temperature_2m_min[i]),
        tempMax: Math.round(daily.temperature_2m_max[i]),
        code: daily.weather_code[i],
        precipProb: Number.isFinite(precipProb) ? precipProb : 0,
        isSnow: isSnowCode(daily.weather_code[i]) || daily.snowfall_sum[i] > 0
      };
    });

    return {
      city: name,
      country: country,
      temp: Math.round(current.temperature_2m),
      tempMin: Math.round(daily.temperature_2m_min[0]),
      tempMax: Math.round(daily.temperature_2m_max[0]),
      conditionCode: current.weather_code,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      pressure: Math.round(current.pressure_msl || current.surface_pressure),
      apparentTemp: Math.round(current.apparent_temperature),
      cloudCover: Math.round(current.cloud_cover),
      windGust: Math.round(current.wind_gusts_10m),
      visibility: visibilityKm,
      uvIndex: Number.isFinite(current.uv_index) ? Math.round(current.uv_index) : (Number.isFinite(data.daily.uv_index_max?.[0]) ? Math.round(data.daily.uv_index_max[0]) : null),
      snowAmount: Number.isFinite(daily.snowfall_sum?.[0]) ? Math.round(daily.snowfall_sum[0]) : null,
      aqiEU,
      pm25,
      sunrise: new Date(daily.sunrise[0]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      sunset: new Date(daily.sunset[0]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      precipProb: daily.precipitation_probability_max[0],
      hourly: hourlyData,
      daily: dailyData,
      isDay: current.is_day === 1
    };
  } catch (e) {
    console.error("Failed to fetch weather data:", e);
    return null;
  }
};


// --- UI Update Logic ---

const updateUI = (weather) => {
    locationEl.textContent = `${weather.city}, ${weather.country}`;
    currentTempEl.textContent = `${weather.temp}°`;
    conditionLabelEl.textContent = getWeatherInfo(weather.conditionCode).label;
    tempMaxEl.textContent = `${weather.tempMax}°`;
    tempMinEl.textContent = `${weather.tempMin}°`;
    
    mainWeatherIconEl.innerHTML = createWeatherIcon(weather.conditionCode, weather.isDay, { width: 48, height: 48 });

    windSpeedEl.textContent = weather.windSpeed;
    humidityEl.textContent = weather.humidity;
    precipProbMiniEl.textContent = weather.precipProb;
    pressureEl.textContent = weather.pressure;
    apparentTempEl.textContent = Number.isFinite(weather.apparentTemp) ? weather.apparentTemp : '--';
    cloudCoverEl.textContent = Number.isFinite(weather.cloudCover) ? weather.cloudCover : '--';
    windGustEl.textContent = Number.isFinite(weather.windGust) ? weather.windGust : '--';
    visibilityEl.textContent = Number.isFinite(weather.visibility) ? weather.visibility : '--';
    uvIndexEl.textContent = Number.isFinite(weather.uvIndex) ? weather.uvIndex : '--';
    snowAmountEl.textContent = Number.isFinite(weather.snowAmount) ? weather.snowAmount : '--';
    aqiEuEl.textContent = Number.isFinite(weather.aqiEU) ? weather.aqiEU : '--';
    pm25El.textContent = Number.isFinite(weather.pm25) ? weather.pm25 : '--';

    sunriseTimeEl.textContent = weather.sunrise;
    sunsetTimeEl.textContent = weather.sunset;
    dayStatusEl.textContent = weather.isDay ? 'Der Tag ist aktiv. Genieße das Licht.' : 'Die Nacht ist hereingebrochen.';
    
    // Update daily forecast
    forecastList.innerHTML = ''; // Clear old forecast
    weather.daily.forEach((day, i) => {
        const item = document.createElement('div');
        item.className = 'forecast-item';
        
        let precipBadge = `<span class="text-muted">-</span>`;
        if (day.precipProb > 10) {
            const icon = day.isSnow ? createWeatherIcon(85, true, {width: 12, height: 12}) : createWeatherIcon(61, true, {width: 12, height: 12});
            precipBadge = `<div class="precip-badge ${day.isSnow ? 'snow' : 'rain'}">${icon} ${day.precipProb}%</div>`;
        }

        item.innerHTML = `
            <div class="forecast-day">
                <div class="day ${i === 0 ? 'today' : ''}">${i === 0 ? 'Heute' : day.day}</div>
                <div class="date">${day.date}</div>
            </div>
            <div class="forecast-icon">
                ${createWeatherIcon(day.code, true, { width: 20, height: 20 })}
            </div>
            <div class="forecast-precip">${precipBadge}</div>
            <div class="forecast-temps">
                <span class="min-temp">${day.tempMin}°</span>
                <span class="max-temp">${day.tempMax}°</span>
            </div>
        `;
        forecastList.appendChild(item);
    });
    
    // Create the weather chart
    createWeatherChart(weather.hourly);
};

// --- Main Application Logic ---

const loadWeather = async (city) => {
    mainContent.classList.add('hidden');
    loader.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    
    const data = await fetchWeatherData(city);

    loader.classList.add('hidden');
    
    if (data) {
        updateUI(data);
        mainContent.classList.remove('hidden');
    } else {
        errorMessage.textContent = 'Stadt nicht gefunden oder Fehler beim Laden der Daten.';
        errorMessage.classList.remove('hidden');
    }
};

// --- Event Listeners & Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial call to render all icons from data-lucide attributes
    lucide.createIcons();

    // Load initial weather
    loadWeather('Zürich');
});

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        loadWeather(query);
    }
});
