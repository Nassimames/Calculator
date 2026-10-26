

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // =========================================
  // DOM ELEMENTS
  // =========================================

  const expressionElement = document.getElementById("expression");
  const resultElement = document.getElementById("result");
  const messageElement = document.getElementById("message");
  const keypad = document.getElementById("keypad");
  const copyButton = document.getElementById("copy-result");
  const themeToggle = document.getElementById("theme-toggle");
  const toast = document.getElementById("toast");

  if (
    !expressionElement ||
    !resultElement ||
    !messageElement ||
    !keypad
  ) {
    console.error(
      "Calculator initialization failed: required HTML elements are missing."
    );
    return;
  }

  // =========================================
  // CALCULATOR STATE
  // =========================================

  let currentInput = "0";
  let firstOperand = null;
  let operator = null;
  let waitingForSecondOperand = false;
  let lastResult = null;
  let expressionText = "";
  let hasError = false;
  let justCalculated = false;
  let toastTimeout = null;

  const MAX_INPUT_LENGTH = 15;

  // =========================================
  // LUNA INTEGRATION
  // =========================================

  /**
   * Safely asks mascot.js to update Luna.
   * If mascot.js is missing, the calculator still works.
   */
  function reactToLuna(state) {
    if (typeof window.setLunaExpression === "function") {
      window.setLunaExpression(state);
    } else {
      console.warn(
        `Luna reaction "${state}" unavailable. Check js/mascot.js.`
      );
    }
  }

  // =========================================
  // DISPLAY HELPERS
  // =========================================

  function formatNumber(value) {
    if (!Number.isFinite(value)) {
      return "Error";
    }

    if (Object.is(value, -0)) {
      value = 0;
    }

    const rounded = Number.parseFloat(value.toPrecision(12));

    return String(rounded);
  }

  function updateDisplay() {
    expressionElement.textContent = expressionText || "\u00A0";

    resultElement.textContent = currentInput;

    resultElement.classList.toggle("is-error", hasError);
    messageElement.classList.toggle("is-error", hasError);

    updateOperatorHighlight();
  }

  function updateOperatorHighlight() {
    document.querySelectorAll("[data-operator]").forEach((button) => {
      button.classList.toggle(
        "is-selected",
        button.dataset.operator === operator
      );
    });
  }

  function setMessage(text, isError = false) {
    messageElement.textContent = text;
    messageElement.classList.toggle("is-error", isError);
  }

  // =========================================
  // TOAST NOTIFICATIONS
  // =========================================

  function showToast(text) {
    if (!toast) {
      return;
    }

    toast.textContent = text;
    toast.classList.add("is-visible");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  // =========================================
  // ERROR HANDLING
  // =========================================

  function showError(text = "Something went wrong.") {
    hasError = true;
    currentInput = "Error";
    lastResult = null;
    waitingForSecondOperand = false;
    justCalculated = false;

    updateDisplay();
    setMessage(text, true);
    reactToLuna("error");
  }

  // =========================================
  // RESET CALCULATOR
  // =========================================

  function clearCalculator() {
    currentInput = "0";
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
    lastResult = null;
    expressionText = "";
    hasError = false;
    justCalculated = false;

    updateDisplay();
    setMessage("Fresh start. Ready when you are.");

    reactToLuna("clear");
  }

  // =========================================
  // INPUT DIGITS
  // =========================================

  function inputDigit(digit) {
    if (!/^\d$/.test(digit)) {
      return;
    }

    if (hasError) {
      clearCalculator();
    }

    if (justCalculated && !operator) {
      currentInput = digit;
      expressionText = "";
      lastResult = null;
      justCalculated = false;
    } else if (waitingForSecondOperand) {
      currentInput = digit;
      waitingForSecondOperand = false;
      justCalculated = false;
    } else {
      if (currentInput.replace("-", "").length >= MAX_INPUT_LENGTH) {
        return;
      }

      currentInput =
        currentInput === "0" ? digit : currentInput + digit;
    }

    setMessage("Ooh, what are we calculating?");
    updateDisplay();

    reactToLuna("typing");
  }

  // =========================================
  // DECIMAL POINT
  // =========================================

  function inputDecimal() {
    if (hasError) {
      clearCalculator();
    }

    if (justCalculated && !operator) {
      currentInput = "0.";
      expressionText = "";
      justCalculated = false;
    } else if (waitingForSecondOperand) {
      currentInput = "0.";
      waitingForSecondOperand = false;
    } else if (!currentInput.includes(".")) {
      currentInput += ".";
    } else {
      return;
    }

    setMessage("A little precision!");
    updateDisplay();

    reactToLuna("typing");
  }

  // =========================================
  // ARITHMETIC OPERATIONS
  // =========================================

  function calculate(a, b, operation) {
    switch (operation) {
      case "+":
        return a + b;

      case "-":
        return a - b;

      case "*":
        return a * b;

      case "/":
        if (b === 0) {
          return null;
        }

        return a / b;

      default:
        return null;
    }
  }

  function operatorSymbol(operation) {
    const symbols = {
      "+": "+",
      "-": "−",
      "*": "×",
      "/": "÷"
    };

    return symbols[operation] || operation;
  }

  function inputOperator(nextOperator) {
    if (!["+", "-", "*", "/"].includes(nextOperator)) {
      return;
    }

    if (hasError) {
      clearCalculator();
    }

    const inputValue = Number(currentInput);

    if (!Number.isFinite(inputValue)) {
      showError("Please enter a valid number.");
      return;
    }

    // If an operator was already selected, evaluate the previous pair.
    if (operator && !waitingForSecondOperand) {
      const result = calculate(
        firstOperand,
        inputValue,
        operator
      );

      if (result === null || !Number.isFinite(result)) {
        showError(
          operator === "/" && inputValue === 0
            ? "Oops! You can't divide by zero."
            : "This calculation is not valid."
        );
        return;
      }

      currentInput = formatNumber(result);
      firstOperand = result;
    } else {
      firstOperand = inputValue;
    }

    operator = nextOperator;
    waitingForSecondOperand = true;
    justCalculated = false;
    lastResult = null;

    expressionText =
      `${formatNumber(firstOperand)} ${operatorSymbol(operator)}`;

    updateDisplay();
    setMessage("Choose the next number.");

    reactToLuna("thinking");
  }

  // =========================================
  // CALCULATE RESULT
  // =========================================

  function performCalculation() {
    if (hasError) {
      return;
    }

    // Nothing to calculate.
    if (!operator || firstOperand === null) {
      if (currentInput.includes(".")) {
        currentInput = formatNumber(Number(currentInput));
        updateDisplay();
      }

      setMessage("Ready for your next calculation.");
      reactToLuna("idle");
      return;
    }

    // Avoid calculating before the second operand exists.
    if (waitingForSecondOperand) {
      setMessage("Enter another number first.");
      reactToLuna("thinking");
      return;
    }

    const secondOperand = Number(currentInput);
    const operation = operator;
    const first = firstOperand;

    const result = calculate(first, secondOperand, operation);

    if (result === null || !Number.isFinite(result)) {
      showError(
        operation === "/" && secondOperand === 0
          ? "Oops! You can't divide by zero."
          : "This calculation is not valid."
      );
      return;
    }

    const formattedFirst = formatNumber(first);
    const formattedSecond = formatNumber(secondOperand);
    const formattedResult = formatNumber(result);

    expressionText =
      `${formattedFirst} ${operatorSymbol(operation)} ${formattedSecond}`;

    currentInput = formattedResult;
    lastResult = result;

    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
    justCalculated = true;

    updateDisplay();
    setMessage("Yay! We did it!");

    reactToLuna(
      Math.abs(result) >= 1000000 ? "surprised" : "happy"
    );
  }

  // =========================================
  // DELETE LAST CHARACTER
  // =========================================

  function deleteLastCharacter() {
    if (hasError) {
      clearCalculator();
      return;
    }

    if (justCalculated) {
      currentInput = "0";
      expressionText = "";
      firstOperand = null;
      operator = null;
      justCalculated = false;
      lastResult = null;

      updateDisplay();
      setMessage("Let's try another calculation.");
      reactToLuna("typing");
      return;
    }

    if (waitingForSecondOperand) {
      setMessage("Choose the next number.");
      reactToLuna("thinking");
      return;
    }

    if (currentInput.length <= 1 ||
        (currentInput.length === 2 && currentInput.startsWith("-"))) {
      currentInput = "0";
    } else {
      currentInput = currentInput.slice(0, -1);
    }

    updateDisplay();
    setMessage("No worries, take your time.");
    reactToLuna("typing");
  }

  // =========================================
  // CHANGE SIGN
  // =========================================

  function toggleSign() {
    if (hasError) {
      clearCalculator();
    }

    if (Number(currentInput) === 0) {
      return;
    }

    currentInput = currentInput.startsWith("-")
      ? currentInput.slice(1)
      : `-${currentInput}`;

    updateDisplay();
    setMessage("Negative or positive? Your choice!");
    reactToLuna("thinking");
  }

  // =========================================
  // PERCENTAGE
  // =========================================

  function calculatePercent() {
    if (hasError) {
      clearCalculator();
    }

    const value = Number(currentInput);

    if (!Number.isFinite(value)) {
      showError("Please enter a valid number.");
      return;
    }

    currentInput = formatNumber(value / 100);
    justCalculated = false;

    updateDisplay();
    setMessage("Percentage calculated!");
    reactToLuna("happy");
  }

  // =========================================
  // BUTTON ACTIONS
  // =========================================

  function handleAction(action) {
    switch (action) {
      case "clear":
        clearCalculator();
        break;

      case "delete":
        deleteLastCharacter();
        break;

      case "decimal":
        inputDecimal();
        break;

      case "equals":
        performCalculation();
        break;

      case "sign":
        toggleSign();
        break;

      case "percent":
        calculatePercent();
        break;

      default:
        console.warn("Unknown calculator action:", action);
    }
  }

  // =========================================
  // KEYPAD CLICK EVENTS
  // =========================================

  keypad.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button || !keypad.contains(button)) {
      return;
    }

    button.classList.remove("is-pressed");
    void button.offsetWidth;
    button.classList.add("is-pressed");

    setTimeout(() => {
      button.classList.remove("is-pressed");
    }, 140);

    if (button.dataset.digit !== undefined) {
      inputDigit(button.dataset.digit);
      return;
    }

    if (button.dataset.operator !== undefined) {
      inputOperator(button.dataset.operator);
      return;
    }

    if (button.dataset.action !== undefined) {
      handleAction(button.dataset.action);
    }
  });

  // =========================================
  // KEYBOARD SUPPORT
  // =========================================

  document.addEventListener("keydown", (event) => {
    // Don't hijack keyboard input in text fields.
    const target = event.target;

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target?.isContentEditable
    ) {
      return;
    }

    const key = event.key;

    if (/^\d$/.test(key)) {
      event.preventDefault();
      inputDigit(key);
      return;
    }

    if (["+", "-", "*", "/"].includes(key)) {
      event.preventDefault();
      inputOperator(key);
      return;
    }

    if (key === "." || key === ",") {
      event.preventDefault();
      inputDecimal();
      return;
    }

    if (key === "Enter" || key === "=") {
      event.preventDefault();
      performCalculation();
      return;
    }

    if (key === "Backspace") {
      event.preventDefault();
      deleteLastCharacter();
      return;
    }

    if (key === "Escape" || key === "Delete") {
      event.preventDefault();
      clearCalculator();
      return;
    }

    if (key === "%") {
      event.preventDefault();
      calculatePercent();
    }
  });

  // =========================================
  // COPY RESULT
  // =========================================

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      if (hasError) {
        showToast("There is no valid result to copy.");
        reactToLuna("error");
        return;
      }

      try {
        await navigator.clipboard.writeText(currentInput);
        showToast(`Copied: ${currentInput}`);
        setMessage("Copied! Nice and easy.");
        reactToLuna("love");
      } catch (error) {
        console.error("Clipboard error:", error);
        showToast("Unable to copy. Check your browser permissions.");
      }
    });
  }

  // =========================================
  // LIGHT / DARK THEME
  // =========================================

  function applyTheme(theme) {
    const normalizedTheme = theme === "light" ? "light" : "dark";

    document.documentElement.dataset.theme = normalizedTheme;

    if (themeToggle) {
      const nextTheme =
        normalizedTheme === "dark" ? "light" : "dark";

      themeToggle.setAttribute(
        "aria-label",
        `Switch to ${nextTheme} theme`
      );

      themeToggle.setAttribute(
        "title",
        `Switch to ${nextTheme} theme`
      );
    }

    try {
      localStorage.setItem("luna-calculator-theme", normalizedTheme);
    } catch (error) {
      console.warn("Theme preference could not be saved.", error);
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme =
        document.documentElement.dataset.theme || "dark";

      applyTheme(currentTheme === "dark" ? "light" : "dark");

      reactToLuna("happy");
    });
  }

  try {
    const savedTheme = localStorage.getItem("luna-calculator-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      applyTheme(savedTheme);
    } else {
      applyTheme("dark");
    }
  } catch {
    applyTheme("dark");
  }

  // =========================================
  // INITIALIZATION
  // =========================================

  updateDisplay();
  setMessage("Ready when you are.");

  // Set Luna's initial expression after mascot.js loads.
  reactToLuna("idle");

  console.info("Luna Calculator initialized successfully.");
});

