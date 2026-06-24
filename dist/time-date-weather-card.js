/**
 * Time Date Weather Card
 * A Lovelace custom card showing time, date, animated weather, and temperature.
 * https://github.com/YOUR_USERNAME/time-date-weather-card
 */
(() => {

// ─── UTILS ──────────────────────────────────────────────────────────────────

function getTimeOfDay() {
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  if (totalMinutes >= 360 && totalMinutes < 480) return { type: 'sunrise', progress: (totalMinutes - 360) / 120 };
  if (totalMinutes >= 480 && totalMinutes < 1080) return { type: 'day',     progress: (totalMinutes - 480) / 600 };
  if (totalMinutes >= 1080 && totalMinutes < 1200) return { type: 'sunset', progress: (totalMinutes - 1080) / 120 };
  return { type: 'night', progress: 0 };
}

function getSunPosition(timeOfDay, width, height) {
  if (timeOfDay.type === 'sunrise') {
    const p = timeOfDay.progress;
    return { x: width * (0.3 + p * 0.4), y: height * (0.85 - p * 0.55) };
  } else if (timeOfDay.type === 'sunset') {
    const p = timeOfDay.progress;
    return { x: width * (0.5 + p * 0.3), y: height * (0.3 + p * 0.55) };
  } else if (timeOfDay.type === 'day') {
    const p = timeOfDay.progress;
    const angle = p * Math.PI;
    return { x: width * (0.5 + Math.sin(angle) * 0.25), y: height * (0.25 - Math.sin(angle) * 0.1) };
  } else {
    return { x: width * 0.75, y: height * 0.3 };
  }
}

function getBackgroundGradient(timeOfDay) {
  if (timeOfDay.type === 'sunrise') {
    const p = timeOfDay.progress;
    const nightStart = { r: 26, g: 26, b: 46 };
    const dayStart   = { r: 255, g: 160, b: 122 };
    const dayEnd     = { r: 255, g: 215, b: 0 };
    return {
      start: {
        r: Math.round(nightStart.r + (dayStart.r - nightStart.r) * p),
        g: Math.round(nightStart.g + (dayStart.g - nightStart.g) * p),
        b: Math.round(nightStart.b + (dayStart.b - nightStart.b) * p)
      },
      end: {
        r: Math.round(nightStart.r + (dayEnd.r - nightStart.r) * p),
        g: Math.round(nightStart.g + (dayEnd.g - nightStart.g) * p),
        b: Math.round(nightStart.b + (dayEnd.b - nightStart.b) * p)
      }
    };
  } else if (timeOfDay.type === 'sunset') {
    const p = timeOfDay.progress;
    const dayStart   = { r: 255, g: 107, b: 107 };
    const dayEnd     = { r: 255, g: 160, b: 122 };
    const nightStart = { r: 26, g: 26, b: 46 };
    return {
      start: {
        r: Math.round(dayStart.r + (nightStart.r - dayStart.r) * p),
        g: Math.round(dayStart.g + (nightStart.g - dayStart.g) * p),
        b: Math.round(dayStart.b + (nightStart.b - dayStart.b) * p)
      },
      end: {
        r: Math.round(dayEnd.r + (nightStart.r - dayEnd.r) * p),
        g: Math.round(dayEnd.g + (nightStart.g - dayEnd.g) * p),
        b: Math.round(dayEnd.b + (nightStart.b - dayEnd.b) * p)
      }
    };
  }
  return null;
}

function getTimeOfDayWithSunData(sunData) {
  const now = new Date();
  if (sunData.hasSunData && sunData.sunrise && sunData.sunset) {
    const currentTime = now.getTime();
    let sunriseTime = sunData.sunrise.getTime();
    let sunsetTime  = sunData.sunset.getTime();

    // Subtract 24h if more than 12h in future (tomorrow's values from some integrations)
    if (sunriseTime - currentTime > 12 * 60 * 60 * 1000) sunriseTime -= 24 * 60 * 60 * 1000;
    if (sunsetTime  - currentTime > 12 * 60 * 60 * 1000) sunsetTime  -= 24 * 60 * 60 * 1000;

    const sunriseStart = sunriseTime - 60 * 60 * 1000;
    const sunriseEnd   = sunriseTime + 60 * 60 * 1000;
    const sunsetStart  = sunsetTime  - 60 * 60 * 1000;
    const sunsetEnd    = sunsetTime  + 60 * 60 * 1000;

    if (currentTime >= sunriseStart && currentTime < sunriseEnd) {
      return { type: 'sunrise', progress: (currentTime - sunriseStart) / (sunriseEnd - sunriseStart) };
    }
    if (currentTime >= sunriseEnd && currentTime < sunsetStart) {
      return { type: 'day', progress: (currentTime - sunriseEnd) / (sunsetStart - sunriseEnd) };
    }
    if (currentTime >= sunsetStart && currentTime < sunsetEnd) {
      return { type: 'sunset', progress: (currentTime - sunsetStart) / (sunsetEnd - sunsetStart) };
    }
    return { type: 'night', progress: 0 };
  }
  return getTimeOfDay();
}

// ─── BASE ANIMATION ──────────────────────────────────────────────────────────

class BaseAnimation {
  constructor(ctx) {
    this.ctx = ctx;
  }

  drawCloud(x, y, size, opacity) {
    const savedShadowBlur  = this.ctx.shadowBlur;
    const savedShadowColor = this.ctx.shadowColor;
    const savedGlobalAlpha = this.ctx.globalAlpha;

    this.ctx.shadowBlur  = size * 0.25;
    this.ctx.shadowColor = `rgba(255, 255, 255, ${opacity * 0.4})`;
    this.ctx.globalAlpha = opacity * 0.85;
    this.ctx.fillStyle   = 'rgba(255, 255, 255, 1)';

    const parts = [
      { x: x,                y: y,                r: size * 0.4  },
      { x: x + size * 0.35,  y: y,                r: size * 0.5  },
      { x: x + size * 0.65,  y: y,                r: size * 0.48 },
      { x: x + size * 0.92,  y: y,                r: size * 0.38 },
      { x: x + size * 0.18,  y: y - size * 0.28,  r: size * 0.38 },
      { x: x + size * 0.52,  y: y - size * 0.32,  r: size * 0.42 },
      { x: x + size * 0.78,  y: y - size * 0.28,  r: size * 0.38 },
      { x: x + size * 0.32,  y: y - size * 0.42,  r: size * 0.32 },
      { x: x + size * 0.62,  y: y - size * 0.48,  r: size * 0.36 },
      { x: x + size * 0.82,  y: y - size * 0.42,  r: size * 0.32 }
    ];

    parts.forEach(part => {
      this.ctx.beginPath();
      this.ctx.arc(part.x, part.y, part.r, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.shadowBlur  = savedShadowBlur;
    this.ctx.shadowColor = savedShadowColor;
    this.ctx.globalAlpha = savedGlobalAlpha;
  }

  drawClouds(time, width, height, density = 0.5) {
    const cloudCount = Math.max(2, Math.floor(width / 150 * density));
    for (let i = 0; i < cloudCount; i++) {
      const baseX   = ((time * 3 + i * 150) % (width + 200)) - 100;
      const baseY   = height * (0.2 + (i % 3) * 0.15) + Math.sin(time * 0.2 + i) * 8;
      const size    = 40 + (i % 3) * 15;
      const opacity = 0.6 + (i % 2) * 0.2;
      this.drawCloud(baseX, baseY, size, opacity);
    }
  }
}

// ─── SUNNY ANIMATION ─────────────────────────────────────────────────────────

class SunnyAnimation extends BaseAnimation {
  draw(time, width, height, timeOfDay) {
    const t = Date.now() * 0.001;
    const sunPos = getSunPosition(timeOfDay, width, height);
    const sunX = sunPos.x, sunY = sunPos.y;

    if (timeOfDay.type === 'day' || timeOfDay.type === 'sunrise' || timeOfDay.type === 'sunset') {
      this._drawSun(sunX, sunY, t);
      if (timeOfDay.type === 'sunrise' || timeOfDay.type === 'sunset') {
        this._drawHorizonReflection(sunX, sunY, height, t);
      }
    } else if (timeOfDay.type === 'night') {
      this._drawNightSky(width, height, t);
    }

    this.drawClouds(t, width, height, 0.3);
  }

  _drawSun(sunX, sunY, time) {
    const sunRadius = 48 + Math.sin(time * 0.15) * 1.5;

    const outerHalo = this.ctx.createRadialGradient(sunX, sunY, sunRadius * 0.3, sunX, sunY, sunRadius * 3.5);
    outerHalo.addColorStop(0,    'rgba(255, 248, 230, 0.25)');
    outerHalo.addColorStop(0.15, 'rgba(255, 240, 200, 0.2)');
    outerHalo.addColorStop(0.3,  'rgba(255, 230, 170, 0.15)');
    outerHalo.addColorStop(0.5,  'rgba(255, 220, 140, 0.1)');
    outerHalo.addColorStop(0.7,  'rgba(255, 210, 120, 0.06)');
    outerHalo.addColorStop(0.85, 'rgba(255, 200, 100, 0.03)');
    outerHalo.addColorStop(1,    'rgba(255, 190, 90, 0)');
    this.ctx.fillStyle = outerHalo;
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, sunRadius * 3.5, 0, Math.PI * 2);
    this.ctx.fill();

    const midHalo = this.ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 2.2);
    midHalo.addColorStop(0,    'rgba(255, 250, 220, 0.35)');
    midHalo.addColorStop(0.3,  'rgba(255, 240, 190, 0.25)');
    midHalo.addColorStop(0.6,  'rgba(255, 230, 160, 0.15)');
    midHalo.addColorStop(0.85, 'rgba(255, 220, 140, 0.08)');
    midHalo.addColorStop(1,    'rgba(255, 210, 120, 0)');
    this.ctx.fillStyle = midHalo;
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, sunRadius * 2.2, 0, Math.PI * 2);
    this.ctx.fill();

    const innerHalo = this.ctx.createRadialGradient(sunX, sunY, sunRadius * 0.6, sunX, sunY, sunRadius * 1.6);
    innerHalo.addColorStop(0,   'rgba(255, 252, 240, 0.5)');
    innerHalo.addColorStop(0.4, 'rgba(255, 245, 210, 0.35)');
    innerHalo.addColorStop(0.7, 'rgba(255, 235, 180, 0.2)');
    innerHalo.addColorStop(1,   'rgba(255, 225, 150, 0)');
    this.ctx.fillStyle = innerHalo;
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, sunRadius * 1.6, 0, Math.PI * 2);
    this.ctx.fill();

    const sunGradient = this.ctx.createRadialGradient(
      sunX - sunRadius * 0.1, sunY - sunRadius * 0.1, 0,
      sunX, sunY, sunRadius
    );
    sunGradient.addColorStop(0,    '#FFFEF5');
    sunGradient.addColorStop(0.15, '#FFF9E6');
    sunGradient.addColorStop(0.3,  '#FFF4D6');
    sunGradient.addColorStop(0.5,  '#FFEDC0');
    sunGradient.addColorStop(0.7,  '#FFE4A8');
    sunGradient.addColorStop(0.85, '#FFDC95');
    sunGradient.addColorStop(1,    '#FFD37F');
    this.ctx.fillStyle = sunGradient;
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  _drawHorizonReflection(sunX, sunY, height, time) {
    const sunRadius = 48 + Math.sin(time * 0.15) * 1.5;
    const horizonY  = height * 0.85;
    if (sunY >= horizonY - 50) {
      const reflectionAlpha = Math.max(0, (horizonY - sunY) / 50) * 0.3;
      this.ctx.fillStyle = `rgba(255, 140, 0, ${reflectionAlpha})`;
      this.ctx.beginPath();
      this.ctx.ellipse(sunX, horizonY, sunRadius * 1.5, sunRadius * 0.5, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  _drawNightSky(width, height, time) {
    this.ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 20; i++) {
      const x = (width * 0.2 + i * 47) % width;
      const y = (height * 0.2 + i * 23) % (height * 0.6);
      const twinkle = Math.sin(time * 0.8 + i) * 0.5 + 0.5;
      this.ctx.globalAlpha = twinkle * 0.8;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    const moonX = width * 0.75, moonY = height * 0.3;
    this.ctx.globalAlpha = 0.9;
    this.ctx.fillStyle = '#F0F0F0';
    this.ctx.beginPath();
    this.ctx.arc(moonX, moonY, 25, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.beginPath();
    this.ctx.arc(moonX - 8, moonY - 5, 22, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }
}

// ─── CLOUDY ANIMATION ────────────────────────────────────────────────────────

class CloudyAnimation extends BaseAnimation {
  draw(time, width, height, _timeOfDay) {
    const t = Date.now() * 0.001;
    this.drawClouds(t, width, height, 0.7);
  }
}

// ─── FOGGY ANIMATION ─────────────────────────────────────────────────────────

class FoggyAnimation extends BaseAnimation {
  draw(time, width, height, _timeOfDay) {
    const t = Date.now() * 0.0003;
    this.ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
    for (let i = 0; i < 3; i++) {
      const y      = height * (0.4 + i * 0.2);
      const offset = Math.sin(t + i) * 20;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      for (let x = 0; x <= width; x += 5) {
        const wave = Math.sin((x / width + t) * Math.PI * 4 + i) * 15;
        this.ctx.lineTo(x, y + wave + offset);
      }
      this.ctx.lineTo(width, height);
      this.ctx.lineTo(0, height);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }
}

// ─── RAINY ANIMATION ─────────────────────────────────────────────────────────

class RainyAnimation extends BaseAnimation {
  constructor(ctx) {
    super(ctx);
    this.rainDrops = [];
    this.lastTime  = 0;
    this.heavy     = false;
  }

  draw(time, width, height, timeOfDay, heavy = false) {
    const isHeavy = heavy || this.heavy;
    const t = Date.now() * 0.001;
    this.drawClouds(t, width, height, isHeavy ? 1.0 : 0.8);
    this._drawRain(width, height, isHeavy);
  }

  _drawRain(width, height, heavy) {
    const dropCount = heavy ? 130 : 90;
    if (this.rainDrops.length !== dropCount) {
      this.rainDrops = [];
      for (let i = 0; i < dropCount; i++) {
        this.rainDrops.push({
          x: Math.random() * width,
          y: Math.random() * height - Math.random() * 200,
          speed: heavy ? (80 + Math.random() * 100) : (60 + Math.random() * 80),
          windOffset: (Math.random() - 0.5) * 30,
          width: heavy ? (1.2 + Math.random() * 1.0) : (0.8 + Math.random() * 0.7),
          length: heavy ? (8 + Math.random() * 10) : (6 + Math.random() * 8),
          alpha: heavy ? (0.75 + Math.random() * 0.15) : (0.65 + Math.random() * 0.2),
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    const currentTime = Date.now() * 0.001;
    const deltaTime   = this.lastTime > 0 ? Math.min(currentTime - this.lastTime, 0.1) : 1 / 60;
    this.lastTime     = currentTime;

    for (let i = 0; i < this.rainDrops.length; i++) {
      const drop = this.rainDrops[i];
      drop.y += drop.speed * deltaTime;
      if (drop.y > height + 50) {
        drop.y = -50 - Math.random() * 100;
        drop.x = Math.random() * width;
      }
      const wind = drop.windOffset * (1 + Math.sin(currentTime * 0.5 + drop.phase) * 0.2);
      const dropX = drop.x + wind;
      if (dropX < -10)        drop.x = width + 10;
      else if (dropX > width + 10) drop.x = -10;
      this._drawRainDrop(dropX, drop.y, drop);
    }
  }

  _drawRainDrop(dropX, dropY, drop) {
    this.ctx.save();
    this.ctx.globalAlpha  = drop.alpha;
    const topY            = dropY - drop.length * 0.5;
    const bottomY         = dropY + drop.length * 0.5;
    this.ctx.fillStyle    = `rgba(220, 240, 255, ${drop.alpha})`;
    this.ctx.strokeStyle  = `rgba(240, 250, 255, ${drop.alpha * 0.5})`;
    this.ctx.lineWidth    = 0.4;
    this.ctx.beginPath();
    this.ctx.moveTo(dropX, topY);
    this.ctx.quadraticCurveTo(dropX - drop.width * 0.3, dropY, dropX - drop.width, bottomY - drop.width * 0.3);
    this.ctx.arc(dropX, bottomY, drop.width, Math.PI, 0, false);
    this.ctx.quadraticCurveTo(dropX + drop.width * 0.3, dropY, dropX, topY);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }
}

// ─── SNOWY ANIMATION ─────────────────────────────────────────────────────────

class SnowyAnimation extends BaseAnimation {
  constructor(ctx) {
    super(ctx);
    this.snowflakes = [];
    this.lastTime   = 0;
  }

  draw(time, width, height, _timeOfDay) {
    const t = Date.now() * 0.001;
    this.drawClouds(t, width, height, 0.7);
    this._drawSnowflakes(width, height);
  }

  _drawSnowflakes(width, height) {
    const targetCount = Math.max(30, Math.min(Math.floor((width * height) / 5000), 80));
    if (this.snowflakes.length !== targetCount) {
      this.snowflakes = [];
      for (let i = 0; i < targetCount; i++) {
        this.snowflakes.push({
          x: Math.random() * width,
          y: Math.random() * height - Math.random() * 100,
          speedY: 15 + Math.random() * 10,
          speedX: (Math.random() - 0.5) * 8,
          size: 1.5 + Math.random() * 1.5,
          alpha: 0.6 + Math.random() * 0.3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: 0.5 + Math.random() * 0.5
        });
      }
    }

    const currentTime = Date.now() * 0.001;
    const deltaTime   = this.lastTime > 0 ? Math.min(currentTime - this.lastTime, 0.1) : 1 / 60;
    this.lastTime     = currentTime;

    this.ctx.lineCap = 'round';

    for (let i = 0; i < this.snowflakes.length; i++) {
      const flake = this.snowflakes[i];
      const sway  = Math.sin(currentTime * flake.swaySpeed + flake.swayPhase) * 2;
      flake.y        += flake.speedY * deltaTime;
      flake.x        += (flake.speedX + sway) * deltaTime;
      flake.rotation += flake.rotationSpeed * deltaTime;

      if (flake.y > height + 20) { flake.y = -20 - Math.random() * 50; flake.x = Math.random() * width; }
      if (flake.x < -10)          flake.x = width + 10;
      else if (flake.x > width + 10) flake.x = -10;

      this._drawSnowflake(flake.x, flake.y, flake.size, flake.alpha, flake.rotation);
    }
  }

  _drawSnowflake(x, y, size, alpha, rotation) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let j = 0; j < 6; j++) {
      const angle = (Math.PI / 3) * j;
      const cos   = Math.cos(angle), sin = Math.sin(angle);
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(sin * size * 2.5, cos * size * 2.5);
      const b1x = sin * size * 1.5 + cos * size * 0.5, b1y = cos * size * 1.5 - sin * size * 0.5;
      this.ctx.moveTo(b1x, b1y);
      this.ctx.lineTo(sin * size * 1.8 + cos * size * 1.2, cos * size * 1.8 - sin * size * 1.2);
      const b2x = sin * size * 1.5 - cos * size * 0.5, b2y = cos * size * 1.5 + sin * size * 0.5;
      this.ctx.moveTo(b2x, b2y);
      this.ctx.lineTo(sin * size * 1.8 - cos * size * 1.2, cos * size * 1.8 + sin * size * 1.2);
    }
    this.ctx.stroke();
    this.ctx.restore();
  }
}

// ─── THUNDERSTORM ANIMATION ──────────────────────────────────────────────────

class ThunderstormAnimation extends BaseAnimation {
  constructor(ctx) {
    super(ctx);
    this.rainyAnimation = new RainyAnimation(ctx);
  }

  draw(time, width, height, timeOfDay, withRain = true) {
    const t = Date.now() * 0.001;
    this.drawClouds(t, width, height, 1.0);
    if (withRain) this.rainyAnimation.draw(time, width, height, timeOfDay, false);
    this._drawLightning(width, height, t);
  }

  _drawLightning(width, height, time) {
    const flashPattern   = Math.sin(time * 2.5) * Math.sin(time * 5.3) * Math.sin(time * 7.1);
    const flashIntensity = Math.max(0, flashPattern);
    if (flashIntensity > 0.4) {
      const normalizedIntensity = (flashIntensity - 0.4) / 0.6;
      const alpha     = normalizedIntensity * 0.6;
      const fadeAlpha = Math.min(alpha, Math.sin(normalizedIntensity * Math.PI) * 0.6);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${fadeAlpha})`;
      this.ctx.fillRect(0, 0, width, height);
    }
  }
}

// ─── HAIL ANIMATION ──────────────────────────────────────────────────────────

class HailAnimation extends BaseAnimation {
  constructor(ctx) {
    super(ctx);
    this.hailStones = [];
  }

  draw(time, width, height, _timeOfDay) {
    const t = Date.now() * 0.001;
    this.drawClouds(t, width, height, 1.0);
    this._drawHailStones(width, height);
  }

  _drawHailStones(width, height) {
    const stoneCount = 60;
    if (this.hailStones.length !== stoneCount) {
      this.hailStones = [];
      for (let i = 0; i < stoneCount; i++) {
        this.hailStones.push({
          startX: Math.random() * width,
          startY: Math.random() * (height + 150) - 75,
          speed: 120 + Math.random() * 80,
          windOffset: (Math.random() - 0.5) * 20,
          size: 2 + Math.random() * 3,
          alpha: 0.8 + Math.random() * 0.15,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    const time = Date.now() * 0.002;
    this.ctx.fillStyle   = 'rgba(240, 250, 255, 1)';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.lineWidth   = 0.5;

    for (let i = 0; i < this.hailStones.length; i++) {
      const hail  = this.hailStones[i];
      const hailY = (hail.startY + time * hail.speed) % (height + 150);
      if (hailY > height + 30) {
        hail.startY = -30 - Math.random() * 30;
        hail.startX = Math.random() * width;
      }
      const wind  = hail.windOffset * (1 + Math.sin(time * 0.6 + hail.phase) * 0.15);
      const hailX = (hail.startX + wind + (time * 20) % width) % width;
      if (hailX < -5)       hail.startX = width + 5;
      else if (hailX > width + 5) hail.startX = -5;
      this._drawHailStone(hailX, hailY, hail);
    }
  }

  _drawHailStone(hailX, hailY, hail) {
    this.ctx.save();
    this.ctx.globalAlpha = hail.alpha;
    this.ctx.beginPath();
    this.ctx.ellipse(hailX, hailY, hail.size, hail.size * 0.9, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.beginPath();
    this.ctx.ellipse(hailX - hail.size * 0.3, hailY - hail.size * 0.3, hail.size * 0.3, hail.size * 0.25, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = 'rgba(240, 250, 255, 1)';
    this.ctx.restore();
  }
}

// ─── ANIMATION MANAGER ───────────────────────────────────────────────────────

const WX_GRADIENTS = {
  'sunny':               ['#87CEEB', '#c8e8f8'],
  'clear-night':         ['#0d1b4b', '#1a2f6b'],
  'partlycloudy':        ['#6fa8c9', '#9dc5d8'],
  'partlycloudy-night':  ['#1a2a50', '#2a3f70'],
  'cloudy':              ['#7a8fa6', '#9bafc0'],
  'overcast':            ['#637080', '#808fa0'],
  'fog':                 ['#9ca3af', '#b0bfc8'],
  'rainy':               ['#4a5568', '#5a6a80'],
  'pouring':             ['#374151', '#4b5563'],
  'drizzle':             ['#4a5568', '#5a7080'],
  'snowy':               ['#6b7a8d', '#7f8fa0'],
  'snowy-rainy':         ['#5a6878', '#6a7888'],
  'hail':                ['#4a5060', '#5a6070'],
  'lightning':           ['#1f2937', '#374151'],
  'lightning-rainy':     ['#1a2430', '#2a3440'],
  'windy':               ['#5a7090', '#7a90a8'],
  'exceptional':         ['#2d1b4b', '#4a2d6b'],
  'default':             ['#4a5568', '#637080'],
};

class WxAnimationManager {
  constructor() {
    this._instances = new Map();
  }

  _getInstance(key, Cls, ctx) {
    if (!this._instances.has(key)) {
      this._instances.set(key, new Cls(ctx));
    }
    const inst = this._instances.get(key);
    inst.ctx = ctx;
    return inst;
  }

  drawFrame(canvas, condition, timeOfDay, time) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w   = canvas.width  / dpr;
    const h   = canvas.height / dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky gradient — dynamic at sunrise/sunset, static otherwise
    const dynGrad = getBackgroundGradient(timeOfDay);
    let gradTop, gradBot;
    if (dynGrad) {
      gradTop = `rgb(${dynGrad.start.r},${dynGrad.start.g},${dynGrad.start.b})`;
      gradBot = `rgb(${dynGrad.end.r},${dynGrad.end.g},${dynGrad.end.b})`;
    } else {
      let gk = condition || 'default';
      if (!WX_GRADIENTS[gk]) gk = 'default';
      if (timeOfDay.type === 'night' && gk === 'partlycloudy') gk = 'partlycloudy-night';
      [gradTop, gradBot] = WX_GRADIENTS[gk];
    }

    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, gradTop);
    g.addColorStop(1, gradBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);

    let anim;
    switch (condition) {
      case 'sunny':
      case 'clear-night':
        anim = this._getInstance('sunny', SunnyAnimation, ctx); break;

      case 'partlycloudy':
      case 'cloudy':
      case 'overcast':
      case 'windy':
      case 'windy-variant':
        anim = this._getInstance('cloudy', CloudyAnimation, ctx); break;

      case 'fog':
      case 'haze':
        anim = this._getInstance('foggy', FoggyAnimation, ctx); break;

      case 'rainy':
      case 'drizzle':
        anim = this._getInstance('rainy', RainyAnimation, ctx); break;

      case 'pouring': {
        const inst = this._getInstance('pouring', RainyAnimation, ctx);
        inst.heavy = true;
        anim = inst; break;
      }

      case 'snowy':
      case 'snowy-rainy':
        anim = this._getInstance('snowy', SnowyAnimation, ctx); break;

      case 'hail':
        anim = this._getInstance('hail', HailAnimation, ctx); break;

      case 'lightning':
      case 'lightning-rainy':
      case 'exceptional':
        anim = this._getInstance('thunderstorm', ThunderstormAnimation, ctx); break;

      default:
        anim = this._getInstance('cloudy', CloudyAnimation, ctx);
    }

    anim.draw(time, w, h, timeOfDay);
    ctx.restore();
  }
}

const wxAnimMgr = new WxAnimationManager();

// ─── CARD ────────────────────────────────────────────────────────────────────

class TimeDateWeatherCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._interval  = null;
    this._raf       = null;
    this._animStart = Date.now();
    this._ro        = null;
  }

  setConfig(config) {
    if (!config.entity) throw new Error('You must define a weather entity');
    this._config = config;
    this.render();
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (config.use_animated_bg) this._startAnimation();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateWeather();
  }

  connectedCallback() {
    this._interval = setInterval(() => this.updateClock(), 1000);
    this.updateClock();
    this._startAnimation();
    this._setupResizeObserver();
  }

  disconnectedCallback() {
    clearInterval(this._interval);
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (this._ro)  { this._ro.disconnect(); this._ro = null; }
  }

  _setupResizeObserver() {
    if (!window.ResizeObserver) return;
    this._ro = new ResizeObserver(() => {
      const canvas = this.shadowRoot && this.shadowRoot.getElementById('wx-anim-canvas');
      if (!canvas) return;
      const dpr  = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
    });
    this._ro.observe(this);
  }

  _startAnimation() {
    if (this._config && this._config.use_animated_bg) {
      this._animLoop();
    }
  }

  _animLoop() {
    if (!this._config || !this._config.use_animated_bg) return;
    const canvas = this.shadowRoot && this.shadowRoot.getElementById('wx-anim-canvas');
    if (!canvas) return;

    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (canvas.width  !== rect.width  * dpr) canvas.width  = rect.width  * dpr;
    if (canvas.height !== rect.height * dpr) canvas.height = rect.height * dpr;

    const timeOfDay = getTimeOfDayWithSunData(this._getSunData());
    const time      = (Date.now() - this._animStart) * 0.001;
    wxAnimMgr.drawFrame(canvas, this._currentCondition || 'cloudy', timeOfDay, time);
    this._raf = requestAnimationFrame(() => this._animLoop());
  }

  _getSunData() {
    if (!this._hass) return { sunrise: null, sunset: null, hasSunData: false };
    const sun = this._hass.states['sun.sun'];
    if (!sun) return { sunrise: null, sunset: null, hasSunData: false };
    const rising  = sun.attributes.next_rising;
    const setting = sun.attributes.next_setting;
    return {
      sunrise:    rising  ? new Date(rising)  : null,
      sunset:     setting ? new Date(setting) : null,
      hasSunData: !!(rising && setting)
    };
  }

  updateClock() {
    const timeEl = this.shadowRoot && this.shadowRoot.getElementById('time');
    const dateEl = this.shadowRoot && this.shadowRoot.getElementById('date');
    if (!timeEl || !dateEl) return;

    const now   = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins  = String(now.getMinutes()).padStart(2, '0');
    timeEl.textContent = `${hours}:${mins}`;

    const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    dateEl.querySelector('.day-name').textContent = days[now.getDay()];
    dateEl.querySelector('.day-num').textContent  = now.getDate();
    dateEl.querySelector('.month').textContent    = months[now.getMonth()];
  }

  updateWeather() {
    if (!this._hass || !this._config) return;
    const state = this._hass.states[this._config.entity];
    if (!state) return;

    const condition = state.state;
    const temp      = state.attributes.temperature;
    const unit      = this._hass.config.unit_system.temperature;

    this._currentCondition = condition;

    const iconEl = this.shadowRoot.getElementById('weather-icon');
    const condEl = this.shadowRoot.getElementById('condition');
    const tempEl = this.shadowRoot.getElementById('temperature');

    if (condEl) condEl.textContent = this._formatCondition(condition);
    if (tempEl) tempEl.textContent = `${Math.round(temp)}${unit}`;
    if (iconEl) iconEl.innerHTML   = this._getIconHtml(condition);
  }

  _formatCondition(condition) {
    const map = {
      'clear-night':     'Clear Night',
      'cloudy':          'Cloudy',
      'exceptional':     'Exceptional',
      'fog':             'Foggy',
      'hail':            'Hail',
      'lightning':       'Lightning',
      'lightning-rainy': 'Thunderstorms',
      'partlycloudy':    'Partly Cloudy',
      'pouring':         'Pouring Rain',
      'rainy':           'Rainy',
      'snowy':           'Snowy',
      'snowy-rainy':     'Sleet',
      'sunny':           'Sunny',
      'windy':           'Windy',
      'windy-variant':   'Windy',
    };
    return map[condition] || condition.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  _isDay() {
    if (this._hass) {
      const sun = this._hass.states['sun.sun'];
      if (sun) return sun.state === 'above_horizon';
    }
    const h = new Date().getHours();
    return h >= 6 && h < 20;
  }

  _getIconName(condition) {
    const dn = this._isDay() ? 'day' : 'night';
    const map = {
      'sunny':           'clear-day',
      'clear-night':     'clear-night',
      'partlycloudy':    `partly-cloudy-${dn}`,
      'cloudy':          'cloudy',
      'overcast':        `overcast-${dn}`,
      'fog':             `fog-${dn}`,
      'haze':            `haze-${dn}`,
      'rainy':           `partly-cloudy-${dn}-rain`,
      'pouring':         'rain',
      'drizzle':         `overcast-${dn}-drizzle`,
      'snowy':           'snow',
      'snowy-rainy':     'sleet',
      'hail':            'hail',
      'lightning':       `thunderstorms-${dn}-rain`,
      'lightning-rainy': `thunderstorms-${dn}-rain`,
      'windy':           'windsock',
      'windy-variant':   'windsock',
      'exceptional':     'hurricane',
    };
    return map[condition] || 'not-available';
  }

  _getIconHtml(condition) {
    const name = this._getIconName(condition);
    const base = this._config.icons_path || '/local/icons/weather_icons/svg';
    return `<img src="${base}/${name}.svg" style="width:100%;height:100%;" alt="${condition}" loading="lazy">`;
  }

  _getWeatherBgImage() {
    if (!this._hass || !this._config) return '';
    const state = this._hass.states[this._config.entity];
    if (!state) return '';
    const condition = state.state;
    const dn   = this._isDay() ? 'day' : 'night';
    const base = this._config.bg_image_path || '/local/icons/weather_backgrounds';
    const map  = {
      'sunny':           `${base}/sunny.gif`,
      'clear-night':     `${base}/clear-night.gif`,
      'partlycloudy':    `${base}/partly-cloudy-${dn}.gif`,
      'cloudy':          `${base}/cloudy.gif`,
      'overcast':        `${base}/overcast.gif`,
      'fog':             `${base}/fog.gif`,
      'rainy':           `${base}/rainy.gif`,
      'pouring':         `${base}/pouring.gif`,
      'drizzle':         `${base}/drizzle.gif`,
      'snowy':           `${base}/snowy.gif`,
      'snowy-rainy':     `${base}/sleet.gif`,
      'hail':            `${base}/hail.gif`,
      'lightning':       `${base}/lightning.gif`,
      'lightning-rainy': `${base}/lightning-rainy.gif`,
      'windy':           `${base}/windy.gif`,
      'exceptional':     `${base}/exceptional.gif`,
    };
    return map[condition] || '';
  }

  render() {
    const cfg            = this._config;
    const reverseLayout  = cfg.reverse_layout   || false;
    const weatherBottom  = cfg.weather_bottom   !== undefined ? cfg.weather_bottom : 25;
    const dateColor      = cfg.date_color       || '#f97316';
    const timeSize       = cfg.time_size        || 'clamp(1.4rem, 7cqw, 3.6rem)';
    const dateSize       = cfg.date_size        || 'clamp(0.65rem, 1.8cqw, 1.1rem)';
    const conditionSize  = cfg.weather_size     || 'clamp(0.65rem, 1.8cqw, 1.1rem)';
    const tempSize       = cfg.temp_size        || 'clamp(0.8rem, 2.2cqw, 1.3rem)';
    const iconSize       = cfg.icon_size        || 'clamp(28px, 7cqw, 56px)';
    const letterSpacing  = cfg.letter_spacing   !== undefined ? cfg.letter_spacing : 0.15;
    const useAnimBg      = cfg.use_animated_bg  || false;
    const bgColor        = cfg.background_color || 'var(--ha-card-background, var(--card-background-color, #1e293b))';
    const bgImage        = (!useAnimBg && cfg.use_weather_bg) ? this._getWeatherBgImage() : (cfg.background_image || '');
    const bgOverlay      = cfg.bg_overlay       !== undefined ? cfg.bg_overlay : 0.4;
    const hasActiveBg    = useAnimBg || !!bgImage;
    const textShadow     = hasActiveBg ? '0 1px 4px rgba(0,0,0,0.8)' : 'none';

    const cardBg = bgImage
      ? `background: url('${bgImage}') center/cover no-repeat; background-color: ${bgColor};`
      : `background: ${bgColor};`;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .card {
          ${cardBg}
          border-radius: var(--ha-card-border-radius, 12px);
          font-family: var(--primary-font-family, sans-serif);
          color: var(--primary-text-color, #e2e8f0);
          box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.3));
          overflow: hidden;
          position: relative;
          container-type: inline-size;
          min-height: 140px;
        }
        #wx-anim-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: ${useAnimBg ? 'block' : 'none'};
          pointer-events: none;
        }
        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,${hasActiveBg ? bgOverlay : 0});
          border-radius: inherit;
          pointer-events: none;
        }
        .content {
          position: relative;
          padding: 16px 20px;
        }
        .layout {
          display: flex;
          align-items: stretch;
          flex-direction: ${reverseLayout ? 'row-reverse' : 'row'};
        }
        .left {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          position: relative;
          flex: 0 0 75%;
          min-width: 0;
        }
        .time {
          font-size: ${timeSize};
          font-weight: 600;
          line-height: 1;
          text-align: center;
          letter-spacing: ${letterSpacing}em;
          color: var(--primary-text-color, #e2e8f0);
          text-shadow: ${textShadow};
        }
        .weather-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: absolute;
          bottom: ${weatherBottom}%;
          left: 0;
          right: 0;
          box-sizing: border-box;
        }
        .icon-wrap {
          width: ${iconSize};
          height: ${iconSize};
          flex-shrink: 0;
        }
        .icon-wrap img { width: 100%; height: 100%; }
        .condition {
          font-size: ${conditionSize};
          color: var(--secondary-text-color, #94a3b8);
          white-space: nowrap;
          text-align: center;
          flex: 1;
          text-shadow: ${textShadow};
        }
        .temperature {
          font-size: ${tempSize};
          font-weight: 600;
          color: var(--primary-text-color, #e2e8f0);
          white-space: nowrap;
          text-align: right;
          text-shadow: ${textShadow};
        }
        .date {
          flex: 0 0 25%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: ${reverseLayout ? 'flex-start' : 'flex-end'};
          text-align: ${reverseLayout ? 'left' : 'right'};
          font-size: ${dateSize};
          font-weight: 500;
          letter-spacing: ${letterSpacing}em;
          color: ${dateColor};
          padding-top: 2px;
          padding-bottom: 2px;
          text-shadow: ${textShadow};
        }
        .date .day-name { font-weight: 600; }
        .date .day-num  { font-size: 1.6em; font-weight: 700; line-height: 1; }
        .date .month    { opacity: 0.85; }
      </style>
      <ha-card class="card">
        <canvas id="wx-anim-canvas"></canvas>
        <div class="overlay"></div>
        <div class="content">
          <div class="layout">
            <div class="left">
              <div class="time" id="time">--:--</div>
              <div class="weather-row">
                <div class="icon-wrap" id="weather-icon"></div>
                <span class="condition" id="condition">Loading...</span>
                <span class="temperature" id="temperature">--</span>
              </div>
            </div>
            <div class="date" id="date">
              <span class="day-name"></span>
              <span class="day-num"></span>
              <span class="month"></span>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement('time-date-weather-card-editor');
  }

  static getStubConfig() {
    return { entity: 'weather.home', time_size: 'clamp(1.8rem, 6vw, 3.2rem)' };
  }
}

// ─── EDITOR ──────────────────────────────────────────────────────────────────

class TimeDateWeatherCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass   = null;
  }

  set hass(hass) {
    this._hass = hass;
    this._renderWeatherOptions();
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  _fields() {
    return [
      { key: 'entity',           label: 'Weather Entity',              type: 'select-weather' },
      { section: 'Layout' },
      { key: 'reverse_layout',   label: 'Reverse date / weather positions', type: 'toggle', hint: 'Puts the date on the left and clock+weather on the right' },
      { key: 'weather_bottom',   label: 'Weather row position (% from bottom)', type: 'number', placeholder: '25', min: 0, max: 100, step: 1 },
      { section: 'Text & Size' },
      { key: 'time_size',        label: 'Time font size',              type: 'text',   placeholder: 'clamp(1.4rem, 7cqw, 3.6rem)' },
      { key: 'date_size',        label: 'Date font size',              type: 'text',   placeholder: 'clamp(0.65rem, 1.8cqw, 1.1rem)' },
      { key: 'date_color',       label: 'Date colour',                 type: 'color',  placeholder: '#f97316' },
      { key: 'weather_size',     label: 'Condition font size',         type: 'text',   placeholder: 'clamp(0.65rem, 1.8cqw, 1.1rem)' },
      { key: 'temp_size',        label: 'Temperature font size',       type: 'text',   placeholder: 'clamp(0.8rem, 2.2cqw, 1.3rem)' },
      { key: 'icon_size',        label: 'Icon size',                   type: 'text',   placeholder: 'clamp(28px, 7cqw, 56px)' },
      { key: 'letter_spacing',   label: 'Letter spacing (em)',         type: 'number', placeholder: '0.15', min: 0, max: 1, step: 0.01 },
      { section: 'Background' },
      { key: 'background_color', label: 'Background colour',           type: 'color-or-transparent', placeholder: '#1e293b' },
      { key: 'background_image', label: 'Background image URL',        type: 'text',   placeholder: '/local/my-image.gif' },
      { key: 'use_weather_bg',   label: 'Auto weather background',     type: 'toggle', hint: 'Uses weather state to pick a background image automatically' },
      { key: 'use_animated_bg',  label: 'Animated canvas background',  type: 'toggle', hint: 'Canvas animation driven by weather state (overrides image background)' },
      { key: 'bg_image_path',    label: 'Weather backgrounds folder',  type: 'text',   placeholder: '/local/icons/weather_backgrounds' },
      { key: 'bg_overlay',       label: 'Overlay darkness (0–1)',      type: 'number', placeholder: '0.4', min: 0, max: 1, step: 0.05 },
      { section: 'Advanced' },
      { key: 'icons_path',       label: 'Icons folder path',           type: 'text',   placeholder: '/local/icons/weather_icons/svg' },
    ];
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        .editor { padding: 8px 0; display: flex; flex-direction: column; gap: 12px; }
        .section-heading {
          font-size: 0.7em; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--primary-color, #38bdf8);
          padding: 8px 0 2px; border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.1));
          margin-top: 4px;
        }
        .field { display: flex; flex-direction: column; gap: 4px; }
        label {
          font-size: 0.8em; font-weight: 500;
          color: var(--secondary-text-color, #94a3b8);
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        input, select {
          width: 100%; padding: 8px 10px; border-radius: 6px;
          border: 1px solid var(--divider-color, rgba(255,255,255,0.12));
          background: var(--card-background-color, #1e293b);
          color: var(--primary-text-color, #e2e8f0);
          font-size: 0.95em; box-sizing: border-box; outline: none;
        }
        input:focus, select:focus { border-color: var(--primary-color, #38bdf8); }
        input[type="color"] { padding: 2px 4px; height: 38px; cursor: pointer; }
        .color-row { display: flex; gap: 8px; align-items: center; }
        .color-row input[type="color"] { flex: 0 0 48px; }
        .color-row input[type="text"]  { flex: 1; }
        .toggle-row { display: flex; align-items: center; gap: 10px; }
        .toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute; inset: 0; border-radius: 24px; cursor: pointer;
          background: var(--divider-color, #334155); transition: background 0.2s;
        }
        .slider:before {
          content: ""; position: absolute;
          width: 18px; height: 18px; left: 3px; bottom: 3px;
          border-radius: 50%; background: white; transition: transform 0.2s;
        }
        input:checked + .slider { background: var(--primary-color, #38bdf8); }
        input:checked + .slider:before { transform: translateX(20px); }
        .hint { font-size: 0.75em; color: var(--disabled-text-color, #64748b); }
      </style>
      <div class="editor">
        ${this._fields().map(f => this._fieldHtml(f)).join('')}
      </div>
    `;

    this._fields().filter(f => f.key).forEach(f => {
      if (f.type === 'toggle') {
        const el = this.shadowRoot.getElementById(`field-${f.key}`);
        if (el) el.addEventListener('change', e => this._valueChanged(f.key, e.target.checked));
        return;
      }
      if (f.type === 'color-or-transparent') {
        const picker = this.shadowRoot.getElementById(`field-${f.key}-picker`);
        const text   = this.shadowRoot.getElementById(`field-${f.key}`);
        if (picker) picker.addEventListener('input',  e => { if (text) text.value = e.target.value; this._valueChanged(f.key, e.target.value); });
        if (text)   text.addEventListener('change', e => this._valueChanged(f.key, e.target.value));
        return;
      }
      if (f.type === 'color') {
        const picker = this.shadowRoot.getElementById(`field-${f.key}-picker`);
        const text   = this.shadowRoot.getElementById(`field-${f.key}`);
        if (picker) picker.addEventListener('input',  e => { if (text) text.value = e.target.value; this._valueChanged(f.key, e.target.value); });
        if (text)   text.addEventListener('change', e => this._valueChanged(f.key, e.target.value));
        return;
      }
      const el = this.shadowRoot.getElementById(`field-${f.key}`);
      if (!el) return;
      el.addEventListener('change', e => this._valueChanged(f.key, e.target.value));
      if (f.type === 'number') {
        el.addEventListener('input', e => this._valueChanged(f.key, parseFloat(e.target.value)));
      }
    });

    this._renderWeatherOptions();
  }

  _fieldHtml(f) {
    if (f.section) return `<div class="section-heading">${f.section}</div>`;

    const val = this._config[f.key] !== undefined ? this._config[f.key] : '';

    if (f.type === 'select-weather') {
      return `
        <div class="field">
          <label>${f.label}</label>
          <select id="field-${f.key}"><option value="">— select entity —</option></select>
        </div>`;
    }

    if (f.type === 'color') {
      const colVal = val || f.placeholder || '#ffffff';
      return `
        <div class="field">
          <label>${f.label}</label>
          <div class="color-row">
            <input type="color" id="field-${f.key}-picker" value="${colVal}">
            <input type="text"  id="field-${f.key}" value="${colVal}" placeholder="${f.placeholder}">
          </div>
        </div>`;
    }

    if (f.type === 'color-or-transparent') {
      const colVal = val || f.placeholder || '#1e293b';
      return `
        <div class="field">
          <label>${f.label}</label>
          <div class="color-row">
            <input type="color" id="field-${f.key}-picker" value="${colVal === 'transparent' ? '#1e293b' : colVal}">
            <input type="text"  id="field-${f.key}" value="${colVal}" placeholder='e.g. #1e293b or "transparent"'>
          </div>
          <span class="hint">Type "transparent" or pick a colour</span>
        </div>`;
    }

    if (f.type === 'toggle') {
      const checked = val === true || val === 'true';
      return `
        <div class="field">
          <div class="toggle-row">
            <label class="toggle">
              <input type="checkbox" id="field-${f.key}" ${checked ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
            <span style="font-size:0.9em">${f.label}</span>
          </div>
          ${f.hint ? `<span class="hint">${f.hint}</span>` : ''}
        </div>`;
    }

    if (f.type === 'number') {
      return `
        <div class="field">
          <label>${f.label}</label>
          <input type="number" id="field-${f.key}"
            value="${val !== '' ? val : f.placeholder}"
            min="${f.min}" max="${f.max}" step="${f.step}"
            placeholder="${f.placeholder}">
          <span class="hint">Default: ${f.placeholder}</span>
        </div>`;
    }

    return `
      <div class="field">
        <label>${f.label}</label>
        <input type="text" id="field-${f.key}" value="${val}" placeholder="${f.placeholder || ''}">
        ${f.placeholder ? `<span class="hint">e.g. ${f.placeholder}</span>` : ''}
      </div>`;
  }

  _renderWeatherOptions() {
    if (!this._hass) return;
    const sel = this.shadowRoot.getElementById('field-entity');
    if (!sel) return;

    const entities = Object.keys(this._hass.states)
      .filter(e => e.startsWith('weather.'))
      .sort();

    const current = this._config.entity || '';
    sel.innerHTML = `<option value="">— select entity —</option>` +
      entities.map(e => `<option value="${e}" ${e === current ? 'selected' : ''}>${e}</option>`).join('');

    sel.addEventListener('change', e => this._valueChanged('entity', e.target.value));
  }

  _valueChanged(key, value) {
    if (value === '' || value === undefined) return;
    const newConfig = { ...this._config, [key]: value };
    this._config    = newConfig;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    }));
  }
}

// ─── REGISTER ────────────────────────────────────────────────────────────────

customElements.define('time-date-weather-card-editor', TimeDateWeatherCardEditor);
customElements.define('time-date-weather-card', TimeDateWeatherCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type:        'time-date-weather-card',
  name:        'Time Date Weather Card',
  description: 'Clock, date and animated weather with temperature. Requires a weather entity.',
  preview:     true,
  documentationURL: 'https://github.com/YOUR_USERNAME/time-date-weather-card',
});

})();
