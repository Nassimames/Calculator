# Calc. — Modern Calculator

A polished, responsive calculator built with **HTML, CSS and vanilla JavaScript**. Designed with a dark glass-inspired interface, warm gradient operators, keyboard support and live result previews.

## Features

- Addition, subtraction, multiplication and division
- Live result preview while entering an expression
- Decimal numbers and operator precedence
- Clear (`AC`) and delete (`DEL`) controls
- Percentage and positive/negative toggle
- Keyboard support
- Light/dark theme toggle (preference is saved locally)
- Copy result to clipboard
- Responsive layout and visible keyboard focus
- Error handling for invalid expressions and division by zero
- Safe, small recursive-descent parser instead of `eval()`

## Run locally

No build step or dependencies are required.

1. Clone or download this repository.
2. Open `index.html` in your browser.

For a local development server, you can use the VS Code **Live Server** extension.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `0`–`9` | Enter a digit |
| `+`, `-`, `*`, `/` | Arithmetic operators |
| `.` | Decimal point |
| `Enter` or `=` | Calculate |
| `Backspace` | Delete last character |
| `Escape` or `Delete` | Clear |
| `%` | Convert the last number to a percentage |

## Project structure

```text
codealpha-calculator/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
├── README.md
└── .gitignore
```

## Tech stack

- HTML5
- CSS3 (Grid, custom properties, responsive media queries)
- JavaScript (DOM events, state management, recursive-descent expression parser)

## Author

Nassima Mesbah
