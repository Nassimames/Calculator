const lunaImage = document.getElementById("luna-image");
const lunaCharacter = document.getElementById("luna-character");
const lunaMessage = document.getElementById("luna-message");

const lunaExpressions = {
  idle: "luna-idle.png",
  typing: "luna-typing.png",
  thinking: "luna-thinking.png",
  happy: "luna-happy.png",
  surprised: "luna-surprised.png",
  error: "luna-error.png",
  love: "luna-love.png",
  sleepy: "luna-sleepy.png",
  clear: "luna-clear.png"
};

const lunaMessages = {
  idle: "Hi! I'm Luna. Let's calculate together!",
  typing: "Ooh, what are we calculating?",
  thinking: "Hmm... let me think!",
  happy: "Yay! We did it!",
  surprised: "Whoa! That's a big number!",
  error: "Oops! Something went wrong.",
  love: "You're doing purr-fectly!",
  sleepy: "Mrr... just one more calculation...",
  clear: "Fresh start! Let's go!"
};

window.setLunaExpression = function (expression) {
  if (!lunaExpressions[expression]) {
    console.error("Expression inconnue :", expression);
    return;
  }

  const imagePath = `./assets/mascot/${lunaExpressions[expression]}`;

  lunaImage.onerror = function () {
    console.error("Image introuvable :", imagePath);
    const status = document.getElementById("luna-test-status");

    if (status) {
      status.textContent = `Image introuvable : ${imagePath}`;
    }
  };

  lunaImage.src = imagePath;
  lunaCharacter.dataset.state = expression;
  lunaMessage.textContent = lunaMessages[expression];
};