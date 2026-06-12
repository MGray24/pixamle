const canvas = document.getElementById("animalCanvas");
const ctx = canvas.getContext("2d");

const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");

const message = document.getElementById("message");
const wrongGuessesText = document.getElementById("wrongGuesses");
const devAnswer = document.getElementById("devAnswer");

let animals = [];
let currentAnimal = null;
let animalImage = new Image();

let wrongGuesses = 0;
let pixelResolution = 4;

async function loadAnimals() {
  const response = await fetch("data/animals.json");
  animals = await response.json();

  currentAnimal = chooseTodaysAnimal();

  animalImage.src = currentAnimal.image;

  animalImage.onload = () => {
    canvas.width = animalImage.naturalWidth;
    canvas.height = animalImage.naturalHeight;

    drawAnimal();
    updateWrongGuessText();

    // DEV ONLY
    devAnswer.textContent = `Answer: ${currentAnimal.name}`;
  };
}

function chooseTodaysAnimal() {
  const today = new Date();

  const dateString =
    today.getFullYear() +
    "-" +
    (today.getMonth() + 1) +
    "-" +
    today.getDate();

  let total = 0;

  for (let i = 0; i < dateString.length; i++) {
    total += dateString.charCodeAt(i);
  }

  const index = total % animals.length;

  return animals[index];
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

  const guess = guessInput.value.trim().toLowerCase();

  if (guess === "") {
    return;
  }

  const validAnswers = [
    currentAnimal.name.toLowerCase(),
    ...currentAnimal.aliases.map(alias => alias.toLowerCase())
  ];

  if (validAnswers.includes(guess)) {
    message.textContent = `Correct! It was ${currentAnimal.name}.`;

    pixelResolution = canvas.width;

    drawAnimal();

    guessInput.disabled = true;
  }
  else {
    wrongGuesses++;

    pixelResolution *= 2;

    if (pixelResolution > canvas.width) {
      pixelResolution = canvas.width;
    }

    message.textContent = "Incorrect.";

    drawAnimal();
    updateWrongGuessText();
  }

  guessInput.value = "";
});

function updateWrongGuessText() {
  wrongGuessesText.textContent =
    `Wrong guesses: ${wrongGuesses}`;
}

loadAnimals();