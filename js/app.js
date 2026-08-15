const inpWord = document.querySelector("#inp-word");
const searchBtn = document.querySelector("#search-btn");
const resultContainer = document.querySelector("#result");
const errorToast = document.querySelector("#errorToast");
const alertResult = document.querySelector("#alert_result");
const sound = document.querySelector("#sound");

const themeBtn = document.querySelector("#theme-btn");
const clearBtn = document.querySelector("#clear-btn");

const API = "https://englishdictionaryapi.com/api/v1/words";

let currentAudio = "";
let typingCancelled = false;

/* =========================================================
   SEARCH
========================================================= */

async function translateHandeler() {
  const searchInput = inpWord.value.trim().toLowerCase();

  if (!searchInput) {
    alertResult.textContent = "Please enter something";

    showError();
    return;
  }

  try {
    setLoading(true);

    /*
      Cancel previous typing animation
    */
    typingCancelled = true;

    /*
      Fade old result
    */
    resultContainer.classList.add("fade-out");

    await wait(350);

    resultContainer.innerHTML = "";
    resultContainer.classList.remove("fade-out");

    typingCancelled = false;

    /*
      API
    */
    const response = await fetch(`${API}/${encodeURIComponent(searchInput)}`);

    if (!response.ok) {
      throw new Error("Word not found");
    }

    const wordInfo = await response.json();

    /*
      Render everything
    */
    await renderWord(wordInfo);
  } catch (error) {
    console.error(error);

    resultContainer.innerHTML = "";

    alertResult.textContent = "The word was not found";

    showError();
  } finally {

    setLoading(false);
  }
}

/* =========================================================
   RENDER WORD
========================================================= */

async function renderWord(wordInfo) {
  currentAudio = wordInfo.pronunciation?.audioUrl || "";

  if (currentAudio) {
    sound.src = currentAudio;
    sound.load();
  } else {
    sound.removeAttribute("src");
  }

  /*
    WORD CARD
  */

  const wordCard = document.createElement("div");

  wordCard.className = "result-card word-card";

  wordCard.innerHTML = `
    <div class="card-title">
      <i class="fas fa-book"></i>
      Word
    </div>

    <div class="word">

      <div class="word-main">

        <h3 class="typing-text"></h3>

        ${wordInfo.headlineExpansion ? `<small class="headline"></small>` : ""}

      </div>

      ${
        currentAudio
          ? `
            <button
              class="audio-button"
              id="audio-button"
              onclick="playSound()"
              aria-label="Play pronunciation"
            >
              <i class="fas fa-volume-up"></i>
            </button>
          `
          : ""
      }

    </div>
  `;

  resultContainer.appendChild(wordCard);

  await wait(100);

  /*
    Type word
  */

  const wordElement = wordCard.querySelector(".typing-text");

  await typeText(wordElement, wordInfo.word || "", 45);

  /*
    Headline
  */

  if (wordInfo.headlineExpansion) {
    const headline = wordCard.querySelector(".headline");

    await typeText(headline, wordInfo.headlineExpansion, 12);
  }

  /*
    Pronunciation
  */

  if (wordInfo.pronunciation) {
    const pronunciationCard = document.createElement("div");

    pronunciationCard.className = "result-card";

    pronunciationCard.innerHTML = `
      <div class="card-title">
        <i class="fas fa-microphone"></i>
        Pronunciation
      </div>

      <div class="details">

        ${wordInfo.pronunciation.ipa ? `<p class="ipa"></p>` : ""}

        ${wordInfo.pronunciation.enpr ? `<p class="enpr"></p>` : ""}

        ${wordInfo.pronunciation.rhymes ? `<p class="rhymes"></p>` : ""}

        ${wordInfo.hyphenation ? `<p class="hyphenation"></p>` : ""}

      </div>
    `;

    resultContainer.appendChild(pronunciationCard);

    await wait(100);

    if (wordInfo.pronunciation.ipa) {
      await typeText(
        pronunciationCard.querySelector(".ipa"),
        wordInfo.pronunciation.ipa,
        30,
      );
    }

    if (wordInfo.pronunciation.enpr) {
      await typeText(
        pronunciationCard.querySelector(".enpr"),
        wordInfo.pronunciation.enpr,
        30,
      );
    }

    if (wordInfo.pronunciation.rhymes) {
      await typeText(
        pronunciationCard.querySelector(".rhymes"),
        wordInfo.pronunciation.rhymes,
        30,
      );
    }

    if (wordInfo.hyphenation) {
      await typeText(
        pronunciationCard.querySelector(".hyphenation"),
        wordInfo.hyphenation,
        30,
      );
    }
  }

  /*
    Meanings
  */

  if (Array.isArray(wordInfo.partsOfSpeech) && wordInfo.partsOfSpeech.length) {
    const meaningsCard = document.createElement("div");

    meaningsCard.className = "result-card";

    meaningsCard.innerHTML = `
      <div class="card-title">
        <i class="fas fa-lightbulb"></i>
        Meanings
      </div>

      <div class="meanings"></div>
    `;

    resultContainer.appendChild(meaningsCard);

    const meaningsContainer = meaningsCard.querySelector(".meanings");

    for (const part of wordInfo.partsOfSpeech) {
      if (typingCancelled) return;

      const partTitle = document.createElement("div");

      partTitle.className = "word-section";

      partTitle.innerHTML = `
        <h3>
          ${escapeHTML(part.partOfSpeech || "Meaning")}
        </h3>
      `;

      meaningsContainer.appendChild(partTitle);

      for (let i = 0; i < (part.senses || []).length; i++) {
        if (typingCancelled) return;

        const sense = part.senses[i];

        const definitionItem = document.createElement("div");

        definitionItem.className = "definition-item";

        definitionItem.innerHTML = `
          <p class="typing-text">
            <span class="definition-number">${i + 1}</span>
          </p>

          ${
            sense.example
              ? `
                <p class="example">
                  <span class="example-text"></span>
                </p>
              `
              : ""
          }
        `;

        meaningsContainer.appendChild(definitionItem);

        const definitionText = definitionItem.querySelector(".typing-text");

        /*
          Keep number and type only
        */

        definitionText.innerHTML = `
          <span class="definition-number">${i + 1}</span>
          <span class="definition-content"></span>
        `;

        await typeText(
          definitionText.querySelector(".definition-content"),
          sense.definition || "No definition",
          13,
        );

        /*
          Example
        */

        if (sense.example) {
          await typeText(
            definitionItem.querySelector(".example-text"),
            `"${sense.example}"`,
            10,
          );
        }
      }
    }
  }

  /*
    Word relations
  */

  await createListCard("Synonyms", wordInfo.synonyms, "fa-random");

  await createListCard("Antonyms", wordInfo.antonyms, "fa-exchange-alt");

  await createListCard("Hypernyms", wordInfo.hypernyms, "fa-arrow-up");

  await createListCard("Hyponyms", wordInfo.hyponyms, "fa-arrow-down");

  await createListCard("Meronyms", wordInfo.meronyms, "fa-puzzle-piece");

  await createListCard("Holonyms", wordInfo.holonyms, "fa-layer-group");

  await createListCard("Derived Words", wordInfo.derived, "fa-code-branch");

  await createListCard("Related Words", wordInfo.related, "fa-link");

  await createListCard(
    "Coordinate Terms",
    wordInfo.coordinateTerms,
    "fa-project-diagram",
  );

  /*
    Forms
  */

  if (Array.isArray(wordInfo.forms) && wordInfo.forms.length) {
    await createListCard("Forms", wordInfo.forms, "fa-spell-check");
  }

  /*
    Etymology
  */

  if (wordInfo.etymology) {
    const card = createEmptyCard("Etymology", "fa-history");

    card.innerHTML += `
      <p class="typing-text etymology-text"></p>
    `;

    resultContainer.appendChild(card);

    await wait(100);

    await typeText(
      card.querySelector(".etymology-text"),
      wordInfo.etymology,
      9,
    );
  }
}

/* =========================================================
   LIST CARD
========================================================= */

async function createListCard(title, items, icon) {
  if (!Array.isArray(items) || !items.length) {
    return;
  }

  if (typingCancelled) return;

  const card = createEmptyCard(title, icon);

  const list = document.createElement("div");

  list.className = "word-list";

  card.appendChild(list);

  resultContainer.appendChild(card);

  await wait(100);

  for (const item of items) {
    if (typingCancelled) return;

    const span = document.createElement("span");

    list.appendChild(span);

    await typeText(span, item, 18);
  }
}

/* =========================================================
   CREATE CARD
========================================================= */

function createEmptyCard(title, icon) {
  const card = document.createElement("div");

  card.className = "result-card";

  card.innerHTML = `
    <div class="card-title">
      <i class="fas ${icon}"></i>
      ${escapeHTML(title)}
    </div>
  `;

  return card;
}

/* =========================================================
   TYPING ANIMATION
========================================================= */

function typeText(element, text, speed = 20) {
  return new Promise((resolve) => {
    if (typingCancelled || !element) {
      resolve();
      return;
    }

    element.classList.add("typing");

    element.textContent = "";

    let index = 0;

    const interval = setInterval(() => {
      if (typingCancelled) {
        clearInterval(interval);

        resolve();

        return;
      }

      element.textContent += text.charAt(index);

      index++;

      if (index >= text.length) {
        clearInterval(interval);

        element.classList.remove("typing");

        resolve();
      }
    }, speed);
  });
}

/* =========================================================
   AUDIO
========================================================= */

function playSound() {
  if (!currentAudio) {
    alertResult.textContent = "Audio is not available";

    showError();

    return;
  }

  const audioButton = document.querySelector("#audio-button");

  if (audioButton) {
    audioButton.classList.add("playing");
  }

  sound.currentTime = 0;

  sound.play().catch((error) => {
    console.error("Audio playback error:", error);

    if (audioButton) {
      audioButton.classList.remove("playing");
    }
  });
}

/*
  Remove wave when audio finishes
*/

sound.addEventListener("ended", () => {
  const audioButton = document.querySelector("#audio-button");

  if (audioButton) {
    audioButton.classList.remove("playing");
  }
});

/* =========================================================
   LOADING
========================================================= */

function setLoading(loading) {
  if (loading) {
    searchBtn.disabled = true;

    searchBtn.classList.add("loading");
  } else {
    searchBtn.disabled = false;

    searchBtn.classList.remove("loading");
  }
}

/* =========================================================
   ERROR
========================================================= */

function showError() {
  errorToast.classList.remove("hide");

  errorToast.classList.add("show");

  setTimeout(() => {
    errorToast.classList.remove("show");

    errorToast.classList.add("hide");
  }, 2500);
}

/* =========================================================
   THEME
========================================================= */

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");

  const icon = themeBtn.querySelector("i");

  if (document.body.classList.contains("light")) {
    icon.className = "fas fa-sun";

    localStorage.setItem("dictionary-theme", "light");
  } else {
    icon.className = "fas fa-moon";

    localStorage.setItem("dictionary-theme", "dark");
  }
});

/*
  Load saved theme
*/

if (localStorage.getItem("dictionary-theme") === "light") {
  document.body.classList.add("light");

  themeBtn.querySelector("i").className = "fas fa-sun";
}

/* =========================================================
   CLEAR
========================================================= */

clearBtn.addEventListener("click", () => {
  inpWord.value = "";

  inpWord.focus();

  typingCancelled = true;

  resultContainer.innerHTML = "";
});

/* =========================================================
   ENTER
========================================================= */

inpWord.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    translateHandeler();
  }
});

/* =========================================================
   SEARCH BUTTON
========================================================= */

searchBtn.addEventListener("click", translateHandeler);

/* =========================================================
   HELPERS
========================================================= */

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
