(() => {
  "use strict";

  const expressionEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");
  const messageEl = document.getElementById("message");
  const keypad = document.getElementById("keypad");
  const themeToggle = document.getElementById("theme-toggle");
  const copyButton = document.getElementById("copy-result");
  const toast = document.getElementById("toast");

  const state = {
    expression: "",
    result: "0",
    justCalculated: false,
    error: false,
    lastAnswer: 0
  };

  let toastTimer;
  const operators = ["+", "-", "*", "/"];
  const prettyOperators = { "*": "×", "/": "÷", "-": "−", "+": "+" };

  function prettyExpression(expression) {
    return expression.replace(/[+\-*/]/g, (operator) => ` ${prettyOperators[operator]} `);
  }

  function formatNumber(number) {
    if (!Number.isFinite(number)) throw new Error("Result is out of range");
    if (Object.is(number, -0)) number = 0;
    // Round display noise without pretending floating-point math is infinitely precise.
    const rounded = Number.parseFloat(number.toPrecision(12));
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 10,
      useGrouping: true
    }).format(rounded);
  }

  function rawNumber(number) {
    if (!Number.isFinite(number)) throw new Error("Result is out of range");
    return String(Number.parseFloat(number.toPrecision(12)));
  }

  function setMessage(message = "Ready when you are.", isError = false) {
    messageEl.textContent = message;
    messageEl.classList.toggle("is-error", isError);
  }

  function render() {
    expressionEl.textContent = state.expression ? prettyExpression(state.expression) : "\u00a0";
    resultEl.textContent = state.result;
    resultEl.classList.toggle("is-error", state.error);
    if (state.expression.length > 28) expressionEl.style.fontSize = "14px";
    else expressionEl.style.fontSize = "";
    updateSelectedOperator();
  }

  function updateSelectedOperator() {
    keypad.querySelectorAll("[data-operator]").forEach((button) => {
      const isSelected = state.expression && operators.includes(state.expression.at(-1)) &&
        button.dataset.operator === state.expression.at(-1);
      button.classList.toggle("is-selected", Boolean(isSelected));
    });
  }

  // A small recursive-descent parser: only numbers and the four operators are accepted.
  // This deliberately avoids eval() and Function(), so user input is never executed as code.
  function evaluateExpression(source) {
    const input = source.replace(/\s+/g, "");
    if (!input) throw new Error("Enter an expression");
    let index = 0;

    function parseExpression() {
      let value = parseTerm();
      while (input[index] === "+" || input[index] === "-") {
        const operator = input[index++];
        const right = parseTerm();
        value = operator === "+" ? value + right : value - right;
      }
      return value;
    }

    function parseTerm() {
      let value = parseUnary();
      while (input[index] === "*" || input[index] === "/") {
        const operator = input[index++];
        const right = parseUnary();
        if (operator === "/" && right === 0) throw new Error("Cannot divide by zero");
        value = operator === "*" ? value * right : value / right;
      }
      return value;
    }

    function parseUnary() {
      if (input[index] === "+") { index++; return parseUnary(); }
      if (input[index] === "-") { index++; return -parseUnary(); }
      return parseNumber();
    }

    function parseNumber() {
      const start = index;
      let dots = 0;
      while (index < input.length && /[0-9.]/.test(input[index])) {
        if (input[index] === ".") dots++;
        if (dots > 1) throw new Error("Invalid decimal number");
        index++;
      }
      if (start === index || input.slice(start, index) === ".") {
        throw new Error("Incomplete expression");
      }
      const value = Number(input.slice(start, index));
      if (!Number.isFinite(value)) throw new Error("Invalid number");
      return value;
    }

    const result = parseExpression();
    if (index !== input.length) throw new Error("Check your expression");
    if (!Number.isFinite(result)) throw new Error("Result is out of range");
    return result;
  }

  function calculatePreview() {
    if (!state.expression || operators.includes(state.expression.at(-1)) || state.expression.at(-1) === ".") {
      state.result = state.expression ? "…" : "0";
      state.error = false;
      setMessage(state.expression ? "Keep going…" : "Ready when you are.");
      return;
    }
    try {
      const value = evaluateExpression(state.expression);
      state.result = formatNumber(value);
      state.error = false;
      setMessage("Live result");
    } catch (error) {
      state.result = "—";
      state.error = true;
      setMessage(error.message || "Invalid expression", true);
    }
  }

  function resetForNewInput() {
    if (state.justCalculated || state.error) {
      state.expression = "";
      state.result = "0";
      state.error = false;
      state.justCalculated = false;
    }
  }

  function inputDigit(digit) {
    resetForNewInput();
    const lastNumber = state.expression.split(/[+\-*/]/).at(-1);
    if (lastNumber === "0") {
      state.expression = state.expression.slice(0, -1) + digit;
    } else {
      state.expression += digit;
    }
    calculatePreview();
    render();
  }

  function inputDecimal() {
    resetForNewInput();
    const lastNumber = state.expression.split(/[+\-*/]/).at(-1);
    if (lastNumber.includes(".")) return;
    if (!lastNumber || operators.includes(state.expression.at(-1))) state.expression += "0";
    state.expression += ".";
    calculatePreview();
    render();
  }

  function inputOperator(operator) {
    if (!operators.includes(operator)) return;
    if (state.error) {
      state.expression = "";
      state.result = "0";
      state.error = false;
    }
    if (!state.expression) {
      if (operator === "-") state.expression = "-";
      else return;
    } else if (operators.includes(state.expression.at(-1))) {
      if (operator === "-" && state.expression.at(-1) !== "-") {
        state.expression += operator; // permit a negative right-hand operand, e.g. 8 × -2
      } else {
        state.expression = state.expression.slice(0, -1) + operator;
      }
    } else if (state.expression.at(-1) === ".") {
      state.expression += "0" + operator;
    } else {
      state.expression += operator;
    }
    state.justCalculated = false;
    calculatePreview();
    render();
  }

  function clearCalculator() {
    state.expression = "";
    state.result = "0";
    state.justCalculated = false;
    state.error = false;
    setMessage("Ready when you are.");
    render();
  }

  function deleteLastCharacter() {
    if (state.justCalculated || state.error) {
      clearCalculator();
      return;
    }
    state.expression = state.expression.slice(0, -1);
    calculatePreview();
    render();
  }

  function calculateResult() {
    if (!state.expression) {
      setMessage("Enter an expression first.");
      return;
    }
    try {
      const value = evaluateExpression(state.expression);
      state.lastAnswer = value;
      state.result = formatNumber(value);
      state.expression = rawNumber(value);
      state.justCalculated = true;
      state.error = false;
      setMessage("Calculation complete");
    } catch (error) {
      state.result = error.message === "Cannot divide by zero" ? "Not defined" : "Error";
      state.error = true;
      state.justCalculated = false;
      setMessage(error.message || "Invalid expression", true);
    }
    render();
  }

  function currentValue() {
    if (state.expression && !operators.includes(state.expression.at(-1)) && state.expression.at(-1) !== ".") {
      try { return evaluateExpression(state.expression); } catch (_) { /* use visible result below */ }
    }
    return state.lastAnswer;
  }

  function applyPercent() {
    if (!state.expression || state.error) return;
    const match = state.expression.match(/(-?(?:\d+\.?\d*|\.\d+))$/);
    if (!match) return;
    const number = Number(match[1]);
    const percentValue = rawNumber(number / 100);
    state.expression = state.expression.slice(0, -match[1].length) + percentValue;
    state.justCalculated = false;
    calculatePreview();
    render();
  }

  function toggleSign() {
    if (!state.expression) {
      state.expression = "-";
      render();
      return;
    }
    if (state.justCalculated) {
      state.expression = rawNumber(-currentValue());
      state.justCalculated = false;
    } else {
      const match = state.expression.match(/(-?(?:\d+\.?\d*|\.\d+))$/);
      if (!match) {
        if (operators.includes(state.expression.at(-1))) state.expression += "-";
        else return;
      } else {
        const number = match[1];
        const replacement = number.startsWith("-") ? number.slice(1) : `-${number}`;
        state.expression = state.expression.slice(0, -number.length) + replacement;
      }
    }
    calculatePreview();
    render();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  async function copyResult() {
    if (state.error || state.result === "…" || state.result === "—") {
      showToast("No result to copy yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(state.result.replace(/,/g, ""));
      showToast("Result copied to clipboard");
    } catch (_) {
      showToast(`Result: ${state.result}`);
    }
  }

  function handleAction(action) {
    switch (action) {
      case "clear": clearCalculator(); break;
      case "delete": deleteLastCharacter(); break;
      case "decimal": inputDecimal(); break;
      case "equals": calculateResult(); break;
      case "percent": applyPercent(); break;
      case "sign": toggleSign(); break;
    }
  }

  keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.digit !== undefined) inputDigit(button.dataset.digit);
    else if (button.dataset.operator) inputOperator(button.dataset.operator);
    else if (button.dataset.action) handleAction(button.dataset.action);
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const { key } = event;
    if (/^\d$/.test(key)) { event.preventDefault(); inputDigit(key); return; }
    if (operators.includes(key)) { event.preventDefault(); inputOperator(key); return; }
    if (key === ".") { event.preventDefault(); inputDecimal(); return; }
    if (key === "Enter" || key === "=") { event.preventDefault(); calculateResult(); return; }
    if (key === "Backspace") { event.preventDefault(); deleteLastCharacter(); return; }
    if (key === "Escape" || key === "Delete") { event.preventDefault(); clearCalculator(); return; }
    if (key === "%") { event.preventDefault(); applyPercent(); }
  });

  themeToggle.addEventListener("click", () => {
    const isLight = document.documentElement.dataset.theme !== "light";
    document.documentElement.dataset.theme = isLight ? "light" : "dark";
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
    try { localStorage.setItem("calc-theme", isLight ? "light" : "dark"); } catch (_) {}
  });

  copyButton.addEventListener("click", copyResult);

  try {
    const savedTheme = localStorage.getItem("calc-theme");
    if (savedTheme === "light") {
      document.documentElement.dataset.theme = "light";
      themeToggle.setAttribute("aria-label", "Switch to dark theme");
    }
  } catch (_) {}

  render();
})();
