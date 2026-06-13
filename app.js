const canvas = document.getElementById("animalCanvas");
const ctx = canvas.getContext("2d");

const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");

const playArea = document.getElementById("playArea");
const message = document.getElementById("message");
const guessSlots = document.getElementById("guessSlots");

const resultPanel = document.getElementById("resultPanel");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");

// DEV ONLY - uncomment if you bring back the dev answer in HTML
// const devAnswer = document.getElementById("devAnswer");

const MAX_WRONG_GUESSES = 6;

let animals = [];
let currentAnimal = null;
let animalImage = new Image();

let wrongGuesses = 0;
let pixelResolution = 4;
let gameOver = false;

async function loadAnimals() {
  const response = await fetch("data/animals.json");
  animals = await response.json();

  currentAnimal = chooseTodaysAnimal();

  animalImage.src = currentAnimal.image;

  animalImage.onload = () => {
    canvas.width = animalImage.naturalWidth;
    canvas.height = animalImage.naturalHeight;

    createGuessSlots();
    drawAnimal();

    message.textContent = "Make your first guess.";

    // DEV ONLY
    // devAnswer.textContent = `Answer: ${currentAnimal.name}`;
  };
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

guessForm.addEventListener("submit", event => {
  event.preventDefault();

  if (gameOver) {
    return;
  }

  const guess = guessInput.value.trim().toLowerCase();

  if (guess === "") {
    return;
  }

  const validAnswers = [
    currentAnimal.name.toLowerCase(),
    ...currentAnimal.aliases.map(alias => alias.toLowerCase())
  ];

  if (validAnswers.includes(guess)) {
    winGame();
  } else {
    handleWrongGuess();
  }

  guessInput.value = "";
});

function handleWrongGuess() {
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
    message.textContent = "Incorrect. The image is clearer now.";
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
    `It was ${currentAnimal.name}. You solved it in ${totalGuesses} guesses.`;
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

//demo image handling
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

loadAnimals();
loadDemoImages();