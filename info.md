# Time Date Weather Card

A Home Assistant Lovelace card that displays the current **time**, **date**, **animated weather icon**, **condition**, and **temperature** in a clean side-by-side layout.

## Features

- Large clock on the left, date column on the right
- Animated SVG weather icons (bundled — no separate download needed)
- Condition text and temperature in a single weather row
- Optional **canvas animation** background driven by real weather state and `sun.sun` sunrise/sunset times
- Responsive layout using `clamp()` — scales cleanly from narrow to wide cards
- Full GUI editor — no YAML required

## Requirements

- A `weather.*` entity
- `sun.sun` entity (for accurate day/night and sunrise/sunset transitions in canvas mode)

## Credits

- Icons: [pkissling/clock-weather-card](https://github.com/pkissling/clock-weather-card)
- Animations: [teuchezh/dynamic-weather-card](https://github.com/teuchezh/dynamic-weather-card)
