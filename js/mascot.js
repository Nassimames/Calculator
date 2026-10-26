const Luna = (() => {
    const character = document.getElementById("luna-character");
    const message = document.getElementById("luna-message");

    if (!character || !message) {
        return {
            react: () => {}
        };
    }

    let messageTimeout;

    const reactions = {
        idle: "Hi! I'm Luna. Let's calculate together! 🐾",
        typing: "I'm watching those numbers!",
        thinking: "Hmm... let me think!",
        happy: "Yay! We got the answer! ✨",
        surprised: "Whoa! That's a big number!",
        error: "Oopsie! Something went wrong!",
        clear: "Fresh start! Ready for more?",
        division: "Careful! We can't divide by zero!"
    };

    function react(state) {
        character.classList.remove(
            "is-happy",
            "is-surprised",
            "is-thinking"
        );

        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }

        message.textContent = reactions[state] || reactions.idle;

        if (state === "happy") {
            character.classList.add("is-happy");
        }

        if (state === "surprised") {
            character.classList.add("is-surprised");
        }

        if (state === "thinking") {
            character.classList.add("is-thinking");
        }

        // Return to Luna's normal expression after a short moment.
        if (state !== "idle" && state !== "typing") {
            messageTimeout = setTimeout(() => {
                character.classList.remove(
                    "is-happy",
                    "is-surprised",
                    "is-thinking"
                );

                message.textContent = reactions.idle;
            }, 2200);
        }
    }

    return { react };
})();