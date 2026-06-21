const canvas = document.getElementById("animalCanvas");
const ctx = canvas.getContext("2d");

const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");
const skipButton = document.getElementById("skipButton");
const suggestions = document.getElementById("suggestions");

const playArea = document.getElementById("playArea");
const message = document.getElementById("message");
const guessSlots = document.getElementById("guessSlots");

const resultPanel = document.getElementById("resultPanel");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");

// DEV ONLY - uncomment if you bring back the dev answer in HTML
// const devAnswer = document.getElementById("devAnswer");

const MAX_WRONG_GUESSES = 6;
const MAX_SUGGESTIONS = 3;

let animals = [];
let validGuesses = [];
let validGuessSet = new Set();

let currentAnimal = null;
let animalImage = new Image();

let wrongGuesses = 0;
let pixelResolution = 4;
let gameOver = false;

async function loadGame() {
  await loadAnimals();
  await loadChoices();

  currentAnimal = chooseTodaysAnimal();

  animalImage.src = currentAnimal.image;

  animalImage.onload = () => {
    canvas.width = animalImage.naturalWidth;
    canvas.height = animalImage.naturalHeight;

    createGuessSlots();
    drawAnimal();

    message.textContent = "Make your first guess";

    // DEV ONLY
    // devAnswer.textContent = `Answer: ${currentAnimal.name}`;
  };
}

async function loadAnimals() {
  const response = await fetch("data/animals.json");
  animals = await response.json();
}

async function loadChoices() {
  const response = await fetch("data/choices.txt");
  const text = await response.text();

  validGuesses = text
    .split("\n")
    .map(line => normalizeGuess(line))
    .filter(line => line.length > 0);

  validGuessSet = new Set(validGuesses);
}

function normalizeGuess(text) {
  return text.trim().toLowerCase();
}

function chooseTodaysAnimal() {
  const startDate = new Date("2026-06-12T00:00:00Z");

  const today = new Date();

  const todayUTC = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );

  const daysSinceStart = Math.floor(
    (todayUTC - startDate.getTime()) / 86400000
  );

  const index = daysSinceStart % animals.length;

  return animals[index];
}

function createGuessSlots() {
  guessSlots.innerHTML = "";

  for (let i = 0; i < MAX_WRONG_GUESSES; i++) {
    const slot = document.createElement("div");
    slot.classList.add("guess-slot");
    guessSlots.appendChild(slot);
  }
}

function updateGuessSlots() {
  const slots = document.querySelectorAll(".guess-slot");

  for (let i = 0; i < slots.length; i++) {
    if (i < wrongGuesses) {
      slots[i].classList.add("filled");
    } else {
      slots[i].classList.remove("filled");
    }
  }
}

function drawAnimal() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (pixelResolution >= canvas.width) {
    drawOriginalImage();
    return;
  }

  const tinyCanvas = document.createElement("canvas");
  const tinyCtx = tinyCanvas.getContext("2d");

  tinyCanvas.width = pixelResolution;
  tinyCanvas.height = pixelResolution;

  tinyCtx.drawImage(
    animalImage,
    0,
    0,
    pixelResolution,
    pixelResolution
  );

  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    tinyCanvas,
    0,
    0,
    pixelResolution,
    pixelResolution,
    0,
    0,
    canvas.width,
    canvas.height
  );
}

function drawOriginalImage() {
  ctx.imageSmoothingEnabled = true;

  ctx.drawImage(
    animalImage,
    0,
    0,
    animalImage.naturalWidth,
    animalImage.naturalHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );
}

guessInput.addEventListener("input", () => {
  guessInput.classList.remove("invalid-guess");

  const input = normalizeGuess(guessInput.value);

  if (input === "") {
    hideSuggestions();
    return;
  }

  const matches = getClosestGuesses(input);
  showSuggestions(matches);
});

guessInput.addEventListener("blur", () => {
  /*
    Small delay so clicking a suggestion works before the menu disappears.
  */
  setTimeout(hideSuggestions, 120);
});

guessForm.addEventListener("submit", event => {
  event.preventDefault();

  if (gameOver) {
    return;
  }

  const guess = normalizeGuess(guessInput.value);

  if (guess === "") {
    return;
  }

  if (!validGuessSet.has(guess)) {
    message.textContent = "That animal isn't recognized, try another.";
    guessInput.classList.add("invalid-guess");
    return;
  }

  submitGuess(guess);
});

skipButton.addEventListener("click", () => {
  if (gameOver) {
    return;
  }

  hideSuggestions();
  guessInput.value = "";

  handleWrongGuess("Skipped. The image is clearer now.");
});

function submitGuess(guess) {
  const correctAnswers = [
    currentAnimal.name,
    ...currentAnimal.aliases
  ].map(answer => normalizeGuess(answer));

  if (correctAnswers.includes(guess)) {
    winGame();
  } else {
    handleWrongGuess("Not quite. The image is clearer now.");
  }

  guessInput.value = "";
  hideSuggestions();
}

function handleWrongGuess(newMessage) {
  wrongGuesses++;

  pixelResolution *= 2;

  if (pixelResolution > canvas.width) {
    pixelResolution = canvas.width;
  }

  updateGuessSlots();
  drawAnimal();

  if (wrongGuesses >= MAX_WRONG_GUESSES) {
    loseGame();
  } else {
    message.textContent = newMessage;
  }
}

function winGame() {
  gameOver = true;

  pixelResolution = canvas.width;
  drawAnimal();

  const totalGuesses = wrongGuesses + 1;

  playArea.classList.add("hidden");
  resultPanel.classList.remove("hidden");

  resultTitle.textContent = "You got it!";
  resultText.textContent =
    `It was ${currentAnimal.name}. You solved it in ${totalGuesses} guesses!`;
}

function loseGame() {
  gameOver = true;

  pixelResolution = canvas.width;
  drawAnimal();

  playArea.classList.add("hidden");
  resultPanel.classList.remove("hidden");

  resultTitle.textContent = "Out of guesses!";
  resultText.textContent =
    `The animal was ${currentAnimal.name}. Try again tomorrow.`;
}

function getClosestGuesses(input) {
  /*
    First priority:
    guesses that start with what the user typed.
  */
  const startsWithMatches = validGuesses.filter(choice =>
    choice.startsWith(input)
  );

  /*
    Second priority:
    guesses that contain what the user typed somewhere.
  */
  const containsMatches = validGuesses.filter(choice =>
    !choice.startsWith(input) && choice.includes(input)
  );

  const directMatches = [
    ...startsWithMatches,
    ...containsMatches
  ];

  if (directMatches.length >= MAX_SUGGESTIONS) {
    return directMatches.slice(0, MAX_SUGGESTIONS);
  }

  /*
    If there are not enough direct matches, use edit distance.
    This catches typos like "giraf" -> "giraffe".
  */
  const fuzzyMatches = validGuesses
    .filter(choice => !directMatches.includes(choice))
    .map(choice => ({
      choice: choice,
      distance: levenshteinDistance(input, choice)
    }))
    .sort((a, b) => a.distance - b.distance)
    .map(item => item.choice);

  return [
    ...directMatches,
    ...fuzzyMatches
  ].slice(0, MAX_SUGGESTIONS);
}

function showSuggestions(matches) {
  suggestions.innerHTML = "";

  if (matches.length === 0) {
    hideSuggestions();
    return;
  }

  for (const match of matches) {
    const button = document.createElement("button");

    button.type = "button";
    button.classList.add("suggestion-button");
    button.textContent = toTitleCase(match);

    button.addEventListener("mousedown", () => {
      guessInput.value = match;
      hideSuggestions();
    });

    suggestions.appendChild(button);
  }

  suggestions.classList.remove("hidden");
}

function hideSuggestions() {
  suggestions.classList.add("hidden");
}

function toTitleCase(text) {
  return text
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function levenshteinDistance(a, b) {
  const table = [];

  for (let row = 0; row <= a.length; row++) {
    table[row] = [];
    table[row][0] = row;
  }

  for (let col = 0; col <= b.length; col++) {
    table[0][col] = col;
  }

  for (let row = 1; row <= a.length; row++) {
    for (let col = 1; col <= b.length; col++) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;

      table[row][col] = Math.min(
        table[row - 1][col] + 1,
        table[row][col - 1] + 1,
        table[row - 1][col - 1] + cost
      );
    }
  }

  return table[a.length][b.length];
}

// demo image handling
function loadDemoImages() {
  const demoImage = new Image();

  demoImage.src = "assets/ui/demo-animal.webp";

  demoImage.onload = () => {
    const demoCanvases = document.querySelectorAll(".demo-canvas");

    for (const demoCanvas of demoCanvases) {
      const resolution = Number(demoCanvas.dataset.resolution);

      drawPixelatedDemoImage(demoCanvas, demoImage, resolution);
    }
  };
}

function drawPixelatedDemoImage(demoCanvas, demoImage, resolution) {
  const demoCtx = demoCanvas.getContext("2d");

  demoCanvas.width = 58;
  demoCanvas.height = 58;

  const tinyCanvas = document.createElement("canvas");
  const tinyCtx = tinyCanvas.getContext("2d");

  tinyCanvas.width = resolution;
  tinyCanvas.height = resolution;

  tinyCtx.drawImage(
    demoImage,
    0,
    0,
    resolution,
    resolution
  );

  demoCtx.imageSmoothingEnabled = false;

  demoCtx.drawImage(
    tinyCanvas,
    0,
    0,
    resolution,
    resolution,
    0,
    0,
    demoCanvas.width,
    demoCanvas.height
  );
}

loadGame();
loadDemoImages();