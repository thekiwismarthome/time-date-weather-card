# Time Date Weather Card

A Home Assistant Lovelace custom card showing time, date, animated weather icon, condition text, and temperature.

![Preview](preview.png)

## Installation

### HACS (recommended)

1. Open HACS → Frontend → Custom repositories
2. Add `https://github.com/YOUR_USERNAME/time-date-weather-card` with category **Lovelace**
3. Install **Time Date Weather Card**
4. Reload your browser

The card registers its resource automatically via HACS — no manual resource entry needed.

### Manual

1. Download `dist/time-date-weather-card.js` from the [latest release](https://github.com/YOUR_USERNAME/time-date-weather-card/releases/latest)
2. Copy it to `config/www/time-date-weather-card/time-date-weather-card.js`
3. In HA go to **Settings → Dashboards → Resources** and add:
   ```
   URL: /local/time-date-weather-card/time-date-weather-card.js
   Type: JavaScript module
   ```
4. If you want to use the bundled icons from a manual install, also copy the `dist/icons/` folder to `config/www/time-date-weather-card/icons/` and set `icons_path: /local/time-date-weather-card/icons` in your card config.

## Configuration

Add the card via the GUI editor, or use YAML:

```yaml
type: custom:time-date-weather-card
entity: weather.home
```

### Options

| Option | Default | Description |
|---|---|---|
| `entity` | **required** | Weather entity (`weather.*`) |
| `time_size` | `clamp(1.8rem, 6vw, 3.2rem)` | Font size for the clock |
| `date_size` | `clamp(0.7rem, 1.8vw, 1rem)` | Font size for the date column |
| `date_color` | `#f97316` | Colour for date text |
| `weather_size` | `clamp(0.7rem, 1.8vw, 1rem)` | Font size for condition text |
| `temp_size` | `clamp(0.9rem, 2.2vw, 1.2rem)` | Font size for temperature |
| `icon_size` | `48px` | Size of the weather icon |
| `letter_spacing` | `0.15` | Letter spacing in `em` units |
| `background_color` | HA card default | Card background colour or `transparent` |
| `background_image` | — | URL to a static background image |
| `use_weather_bg` | `false` | Auto-select a background image by weather condition |
| `use_animated_bg` | `false` | Enable canvas animation background |
| `bg_image_path` | `/local/icons/weather_backgrounds` | Folder for weather background images |
| `bg_overlay` | `0.4` | Darkness of the overlay when a background is active (0–1) |
| `icons_path` | `/hacsfiles/time-date-weather-card/icons` | Folder containing the SVG icons |

### Animated canvas background

Set `use_animated_bg: true` to enable the canvas animation. It reads `sun.sun` from Home Assistant to determine sunrise/sunset times and renders the appropriate animation (sunny with sun arc, night sky with moon and stars, rain, snow, fog, thunderstorm, hail).

## Credits

- Animated SVG icons by [pkissling/clock-weather-card](https://github.com/pkissling/clock-weather-card) (MIT)
- Canvas weather animations ported from [teuchezh/dynamic-weather-card](https://github.com/teuchezh/dynamic-weather-card) (MIT)
