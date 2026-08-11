const inpWord = document.querySelector("#inp-word");
const searchBtn = document.querySelector("#search-btn");
const resultContainer = document.querySelector("#result");
const errorToast = document.querySelector("#errorToast");
const alertResult = document.querySelector("#alert_result");
const sound = document.querySelector("#sound");

const API = "https://englishdictionaryapi.com/api/v1/words";

let currentAudio = "";

async function translateHandeler() {
  const searchInput = inpWord.value.trim().toLowerCase();

  if (!searchInput) {
    alertResult.textContent = "Please enter something";
    showError();
    return;
  }

  searchBtn.textContent = "Loading...";
  searchBtn.disabled = true;

  try {
    const response = await fetch(`${API}/${encodeURIComponent(searchInput)}`);

    if (!response.ok) {
      throw new Error("Word not found");
    }

    const wordInfo = await response.json();

    renderWord(wordInfo);
  } catch (error) {
    console.error(error);

    resultContainer.innerHTML = "";
    currentAudio = "";
    sound.removeAttribute("src");

    alertResult.textContent = "The word was not found";
    showError();
  } finally {
    searchBtn.textContent = "Search";
    searchBtn.disabled = false;
  }
}

function renderWord(wordInfo) {
  const pronunciation = wordInfo.pronunciation || {};

  const ipa = pronunciation.ipa || "";
  currentAudio = pronunciation.audioUrl || "";

  if (currentAudio) {
    sound.src = currentAudio;
    sound.load();
  } else {
    sound.removeAttribute("src");
  }

  let meaningsHTML = "";

  if (wordInfo.partsOfSpeech?.length) {
    meaningsHTML = wordInfo.partsOfSpeech
      .map((part) => {
        const sensesHTML = (part.senses || [])
          .map(
            (sense, index) => `
              <div class="sense">
                <p class="definition">
                  <span>${index + 1}.</span>
                  ${escapeHTML(sense.definition || "No definition")}
                </p>

                ${
                  sense.example
                    ? `
                      <p class="example">
                        "${escapeHTML(sense.example)}"
                      </p>
                    `
                    : ""
                }
              </div>
            `,
          )
          .join("");

        return `
          <div class="meaning">
            <h4>${escapeHTML(part.partOfSpeech || "")}</h4>
            ${sensesHTML}
          </div>
        `;
      })
      .join("");
  }

  resultContainer.innerHTML = `
    <div class="word">
      <h3>${escapeHTML(wordInfo.word)}</h3>

      ${
        currentAudio
          ? `
            <button onclick="playSound()" aria-label="Play pronunciation">
              <i class="fas fa-volume-up"></i>
            </button>
          `
          : ""
      }
    </div>

    ${
      ipa || wordInfo.hyphenation
        ? `
          <div class="details">
            ${ipa ? `<p>${escapeHTML(ipa)}</p>` : ""}
            ${
              wordInfo.hyphenation
                ? `<p>${escapeHTML(wordInfo.hyphenation)}</p>`
                : ""
            }
          </div>
        `
        : ""
    }

    ${
      wordInfo.headlineExpansion
        ? `
          <p class="headline-expansion">
            ${escapeHTML(wordInfo.headlineExpansion)}
          </p>
        `
        : ""
    }

    ${
      meaningsHTML
        ? `
          <div class="meanings">
            <h3>Meanings</h3>
            ${meaningsHTML}
          </div>
        `
        : ""
    }

    ${createListSection("Synonyms", wordInfo.synonyms)}
    ${createListSection("Antonyms", wordInfo.antonyms)}
    ${createListSection("Hypernyms", wordInfo.hypernyms)}
    ${createListSection("Hyponyms", wordInfo.hyponyms)}
    ${createListSection("Meronyms", wordInfo.meronyms)}
    ${createListSection("Holonyms", wordInfo.holonyms)}
    ${createListSection("Derived Words", wordInfo.derived)}
    ${createListSection("Related Words", wordInfo.related)}
    ${createListSection("Coordinate Terms", wordInfo.coordinateTerms)}

    ${
      wordInfo.forms?.length
        ? `
          <div class="word-section">
            <h3>Forms</h3>
            <div class="word-list">
              ${wordInfo.forms
                .map((item) => `<span>${escapeHTML(item)}</span>`)
                .join("")}
            </div>
          </div>
        `
        : ""
    }

    ${
      wordInfo.etymology
        ? `
          <div class="word-section">
            <h3>Etymology</h3>
            <p class="etymology">
              ${escapeHTML(wordInfo.etymology)}
            </p>
          </div>
        `
        : ""
    }
  `;
}

function createListSection(title, items) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  return `
    <div class="word-section">
      <h3>${title}</h3>

      <div class="word-list">
        ${items.map((item) => `<span>${escapeHTML(item)}</span>`).join("")}
      </div>
    </div>
  `;
}

function playSound() {
  if (!currentAudio) {
    alertResult.textContent = "Audio is not available";
    showError();
    return;
  }

  sound.currentTime = 0;

  sound.play().catch((error) => {
    console.error("Audio playback error:", error);
  });
}

function showError() {
  errorToast.classList.remove("hide");
  errorToast.classList.add("show");

  setTimeout(() => {
    errorToast.classList.add("hide");
    errorToast.classList.remove("show");
  }, 2000);
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

searchBtn.addEventListener("click", translateHandeler);

inpWord.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    translateHandeler();
  }
});
