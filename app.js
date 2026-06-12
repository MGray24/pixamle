// Get HTML elements from the page
const canvas = document.getElementById("animalCanvas");
const ctx = canvas.getContext("2d");

const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");

const message = document.getElementById("message");
const wrongGuessesText = document.getElementById("wrongGuesses");

// Game variables
let animals = [];
let currentAnimal = null;
let animalImage = new Image();

let wrongGuesses = 0;

// Start very blurry/pixelated.
// This means the image is first drawn as 4x4 pixels.
let pixelResolution = 4;

/*
  Load the animals from data/animals.json.
  This file tells the game what animals exist and where their images are.
*/
async function loadAnimals() {
  const response = await fetch("data/animals.json");
  animals = await response.json();

  currentAnimal = chooseTodaysAnimal();

  animalImage.src = currentAnimal.image;

  animalImage.onload = function () {
    /*
      Make the canvas internally match the real image size.

      This is important because it prevents unnecessary blurriness.
      If your processed images are 512x512, the canvas becomes 512x512.
    */
    canvas.width = animalImage.naturalWidth;
    canvas.height = animalImage.naturalHeight;

    drawAnimal();
    updateWrongGuessesText();
  };
}

/*
  Choose the same animal for everyone on the same day.

  This is not random.
  It uses the current date to pick an index from the animals array.
*/
function chooseTodaysAnimal() {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const dateString = `${year}-${month}-${day}`;

  let total = 0;

  for (let i = 0; i < dateString.length; i++) {
    total += dateString.charCodeAt(i);
  }

  const index = total % animals.length;

  return animals[index];
}

/*
  Draw the animal onto the canvas.

  If pixelResolution is small, like 4, the image looks very blocky.
  If pixelResolution is larger, like 128, the image is clearer.
  If pixelResolution reaches the real image size, we draw the original image.
*/
function drawAnimal() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /*
    Once the resolution is high enough, draw the original image directly.
    This avoids the final image looking blurry.
  */
  if (pixelResolution >= canvas.width) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(animalImage, 0, 0);
    return;
  }

  /*
    Create a tiny hidden canvas.

    Example:
    If pixelResolution is 4, this canvas is 4x4.
    We draw the full animal into that tiny canvas.
  */
  const tinyCanvas = document.createElement("canvas");
  const tinyCtx = tinyCanvas.getContext("2d");

  tinyCanvas.width = pixelResolution;
  tinyCanvas.height = pixelResolution;

  /*
    This drawImage shrinks the real animal down to 4x4, 8x8, etc.
  */
  tinyCtx.drawImage(
    animalImage,
    0,
    0,
    pixelResolution,
    pixelResolution
  );

  /*
    Turn smoothing off before stretching the tiny image.

    This is what creates the pixel-art look.
  */
  ctx.imageSmoothingEnabled = false;

  /*
    Draw the tiny image back onto the real canvas.

    Example:
    4x4 gets stretched up to 512x512.
  */
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

/*
  Handle the user submitting a guess.
*/
guessForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const guess = guessInput.value.trim().toLowerCase();

  if (guess === "") {
    return;
  }

  /*
    Build a list of acceptable answers.

    Example:
    name: "Cat"
    aliases: ["cat", "kitty"]

    correctAnswers becomes:
    ["cat", "cat", "kitty"]
  */
  const correctAnswers = [
    currentAnimal.name.toLowerCase(),
    ...currentAnimal.aliases.map(alias => alias.toLowerCase())
  ];

  if (correctAnswers.includes(guess)) {
    message.textContent = `Correct! It was ${currentAnimal.name}.`;

    // Fully reveal the original image
    pixelResolution = canvas.width;
    drawAnimal();

    // Stop more guesses
    guessInput.disabled = true;
  } else {
    wrongGuesses++;
    message.textContent = "Wrong guess. The image is clearer now.";

    /*
      Double the resolution.

      4 -> 8 -> 16 -> 32 -> 64 -> 128 -> 256 -> 512
    */
    pixelResolution *= 2;

    if (pixelResolution > canvas.width) {
      pixelResolution = canvas.width;
    }

    drawAnimal();
    updateWrongGuessesText();
  }

  guessInput.value = "";
});

/*
  Show how many wrong guesses the user has made.
*/
function updateWrongGuessesText() {
  wrongGuessesText.textContent = `Wrong guesses: ${wrongGuesses}`;
}

// Start the game
loadAnimals();