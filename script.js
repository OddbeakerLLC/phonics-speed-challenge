const letters = "abcdefghijklmnopqrstuvwxyz".split("");
let upcomingQuestions = [...letters];
let wrongCount = 0;
let totalTime = 0;
let consecutiveTimeouts = 0;
let currentLetter = "";
let timer;
let questionStartTime;
let isRoundActive = false;
let isAudioPlaying = false;
let currentStreak = 0; // Track current streak
let bestStreak = 0; // Track best streak

const isTouchDevice = "ontouchstart" in window;

const startBtn = document.getElementById("start-btn");
const progressFill = document.getElementById("progress-fill");
const wrongCountSpan = document.getElementById("wrong-count");
const gameOverDiv = document.getElementById("game-over");
const playAgainBtn = document.getElementById("play-again");
const currentStreakSpan = document.getElementById("current-streak"); // New
const bestStreakSpan = document.getElementById("best-streak"); // New
const optionDivs = [
  document.getElementById("option1"),
  document.getElementById("option2"),
  document.getElementById("option3"),
  document.getElementById("option4"),
];

let fireworks = null;
const fireworksContainer = document.querySelector(".fireworks");

const similarSoundGroups = {
  c: ["k"],
  k: ["c"],
  m: ["n"],
  n: ["m"],
  b: ["v"],
  v: ["b"],
};

const vowels = ["a", "e", "i", "o", "u"];

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

if (isMobileDevice() && screen.orientation && screen.orientation.lock) {
  screen.orientation
    .lock("portrait-primary")
    .then(() => console.log("Orientation locked to portrait on mobile"))
    .catch((err) => console.error("Orientation lock failed:", err));
}
const sounds = {
  whichLetterSays: new Audio("whichLetterSays.mp3"),
  wrong: new Audio("buzzer.mp3"),
  says: new Audio("says.mp3"),
  awww: new Audio("awww.mp3"),
  victory2: new Audio("victory2.mp3"),
  victory1: new Audio("victory1.mp3"),
  letterNames: {},
  letterSounds: {},
};
letters.forEach((letter) => {
  sounds.letterNames[letter] = new Audio(`${letter}-name.mp3`);
  sounds.letterSounds[letter] = new Audio(`${letter}-sound.mp3`);
});

function addHighlightListeners(div) {
  if (isTouchDevice) {
    div.addEventListener("touchstart", () => div.classList.add("highlighted"));
    div.addEventListener("touchend", () => div.classList.remove("highlighted"));
  } else {
    div.addEventListener("mouseover", () => div.classList.add("highlighted"));
    div.addEventListener("mouseout", () => div.classList.remove("highlighted"));
  }
}

function setupOption(div, letter) {
  div.textContent = letter.toUpperCase();
  div.setAttribute("data-letter", letter);
  div.removeEventListener("click", div.clickHandler);
  div.removeEventListener("touchend", div.touchHandler);

  if (isTouchDevice) {
    div.touchHandler = (e) => {
      e.preventDefault();
      checkAnswer(letter);
    };
    div.addEventListener("touchend", div.touchHandler);
  } else {
    div.clickHandler = () => checkAnswer(letter);
    div.addEventListener("click", div.clickHandler);
  }
}

optionDivs.forEach(addHighlightListeners);

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function playSequentialAudio(audioArray, callback) {
  isAudioPlaying = true;
  let i = 0;
  function playNext() {
    if (i < audioArray.length) {
      const audio = audioArray[i];
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.error("Audio playback failed:", err);
        audio.onended = null;
        i++;
        playNext();
      });
      audio.onended = () => {
        audio.onended = null;
        i++;
        playNext();
      };
    } else {
      isAudioPlaying = false;
      if (callback) callback();
    }
  }
  playNext();
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return minutes > 0
    ? `${minutes} minute${
        minutes !== 1 ? "s" : ""
      } and ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`
    : `${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
}

function showGameOver() {
  document.getElementById(
    "wrong-count-display"
  ).textContent = `Wrong Answers: ${wrongCount}`;
  document.getElementById(
    "best-streak-display"
  ).textContent = `Best Streak: ${bestStreak}`;
  document.getElementById(
    "total-time-display"
  ).textContent = `Total Response Time: ${formatTime(totalTime)}`;
  gameOverDiv.style.display = "block";
  isRoundActive = false;
  optionDivs.forEach((div) => {
    div.textContent = "";
    div.classList.remove("correct");
  });

  // New ending logic
  if (consecutiveTimeouts >= 3) {
    playSequentialAudio([sounds.awww], () => {});
  } else if (wrongCount === 0) {
    if (fireworks) {
      fireworks.start();
      playSequentialAudio([sounds.victory1], () => {
        fireworks.stop();
      });
    } else {
      console.error("Fireworks not initialized");
      playSequentialAudio([sounds.victory1], () => {});
    }
  } else {
    // wrongCount > 0 but no 3 consecutive timeouts
    playSequentialAudio([sounds.victory2], () => {});
  }
}

function stopAllSounds() {
  sounds.whichLetterSays.pause();
  sounds.wrong.pause();
  sounds.says.pause();
  sounds.awww.pause();
  sounds.victory2.pause();
  sounds.victory1.pause();
  for (let letter in sounds.letterNames) {
    sounds.letterNames[letter].pause();
    sounds.letterNames[letter].currentTime = 0;
  }
  for (let letter in sounds.letterSounds) {
    sounds.letterSounds[letter].pause();
    sounds.letterSounds[letter].currentTime = 0;
  }
}

function showCorrectAnswer() {
  optionDivs.forEach((div) => {
    if (div.getAttribute("data-letter") === currentLetter) {
      div.textContent = currentLetter.toUpperCase();
      div.classList.add("correct");
    } else {
      div.textContent = "";
    }
  });
}

function hideCorrectAnswer() {
  optionDivs.forEach((div) => {
    div.classList.remove("correct");
  });
}

function startRound() {
  if (isRoundActive) return;
  isRoundActive = true;
  clearTimeout(timer);
  progressFill.style.width = "100%";
  progressFill.style.transition = "none";
  if (upcomingQuestions.length === 0) {
    showGameOver();
    return;
  }
  currentLetter = upcomingQuestions.shift();
  optionDivs.forEach((div) => {
    div.textContent = "";
    div.removeEventListener("click", div.clickHandler);
    div.removeEventListener("touchend", div.touchHandler);
  });
  playSequentialAudio(
    [sounds.whichLetterSays, sounds.letterSounds[currentLetter]],
    () => {
      questionStartTime = Date.now();
      let options = [currentLetter];
      let excludedLetters = [];

      // Add letters that shouldn't appear with currentLetter
      if (similarSoundGroups[currentLetter]) {
        excludedLetters = excludedLetters.concat(
          similarSoundGroups[currentLetter]
        );
      }

      // If currentLetter is a vowel, exclude all other vowels
      if (vowels.includes(currentLetter)) {
        excludedLetters = excludedLetters.concat(
          vowels.filter((v) => v !== currentLetter)
        );
      }

      // Filter available letters excluding the current letter and similar sounds
      let availableLetters = letters.filter(
        (letter) =>
          letter !== currentLetter && !excludedLetters.includes(letter)
      );

      // Add 3 more options
      while (options.length < 4) {
        if (availableLetters.length === 0) {
          // If we run out of options, use any remaining letter
          availableLetters = letters.filter(
            (letter) => !options.includes(letter)
          );
        }
        const randomIndex = Math.floor(Math.random() * availableLetters.length);
        const selectedLetter = availableLetters[randomIndex];
        options.push(selectedLetter);
        // Remove the selected letter from available options
        availableLetters.splice(randomIndex, 1);
      }

      shuffle(options);
      optionDivs.forEach((div, index) => {
        setupOption(div, options[index]);
      });
      progressFill.style.transition = "width 4s linear";
      progressFill.style.width = "0%";
      timer = setTimeout(() => handleWrongAnswer(true), 4000);
    }
  );
}

function checkAnswer(selected) {
  if (!isRoundActive || isAudioPlaying) return;
  consecutiveTimeouts = 0;
  clearTimeout(timer);
  const timeTaken = Math.min((Date.now() - questionStartTime) / 1000, 4);
  totalTime += timeTaken;
  if (selected === currentLetter) {
    currentStreak++;
    bestStreak = Math.max(bestStreak, currentStreak);
    currentStreakSpan.textContent = currentStreak;
    bestStreakSpan.textContent = bestStreak;
    showCorrectAnswer();
    playSequentialAudio([sounds.letterNames[selected]], () => {
      hideCorrectAnswer();
      isRoundActive = false;
      startRound();
    });
  } else {
    wrongCount++;
    currentStreak = 0;
    currentStreakSpan.textContent = currentStreak;
    wrongCountSpan.textContent = wrongCount;
    showCorrectAnswer();
    playSequentialAudio(
      [
        sounds.wrong,
        sounds.letterNames[currentLetter],
        sounds.says,
        sounds.letterSounds[currentLetter],
      ],
      () => {
        hideCorrectAnswer();
        if (upcomingQuestions.length > 0) {
          upcomingQuestions.splice(1, 0, currentLetter);
        } else {
          upcomingQuestions.push(currentLetter);
        }
        isRoundActive = false;
        startRound();
      }
    );
  }
}

function handleWrongAnswer(isTimeout = false) {
  if (!isRoundActive) return;
  if (isTimeout) {
    consecutiveTimeouts++;
    if (consecutiveTimeouts >= 3) {
      showGameOver();
      return;
    }
  }
  const timeTaken = isTimeout
    ? 4
    : Math.min((Date.now() - questionStartTime) / 1000, 4);
  totalTime += timeTaken;
  if (!isTimeout) wrongCount++;
  currentStreak = 0;
  currentStreakSpan.textContent = currentStreak;
  wrongCountSpan.textContent = wrongCount;
  showCorrectAnswer();
  playSequentialAudio(
    [
      sounds.wrong,
      sounds.letterNames[currentLetter],
      sounds.says,
      sounds.letterSounds[currentLetter],
    ],
    () => {
      hideCorrectAnswer();
      if (upcomingQuestions.length > 0) {
        upcomingQuestions.splice(1, 0, currentLetter);
      } else {
        upcomingQuestions.push(currentLetter);
      }
      isRoundActive = false;
      startRound();
    }
  );
}

startBtn.onclick = () => {
  console.log("Start Game clicked, hiding button");
  startBtn.classList.add("d-none");
  shuffle(upcomingQuestions);
  startRound();
};

playAgainBtn.onclick = () => {
  if (fireworks) fireworks.stop();
  gameOverDiv.style.display = "none";
  upcomingQuestions = [...letters];
  wrongCount = 0;
  totalTime = 0;
  consecutiveTimeouts = 0;
  currentStreak = 0;
  bestStreak = 0;
  wrongCountSpan.textContent = wrongCount;
  currentStreakSpan.textContent = currentStreak;
  bestStreakSpan.textContent = bestStreak;
  console.log("Play Again clicked, showing Start Game");
  startBtn.classList.remove("d-none");
  stopAllSounds();
  shuffle(upcomingQuestions);
};

window.addEventListener("load", () => {
  if (typeof Fireworks !== "undefined") {
    fireworks = new Fireworks.default(fireworksContainer, {
      autoresize: true,
      opacity: 0.5,
      acceleration: 1.05,
      friction: 0.97,
      gravity: 1.5,
      particles: 50,
      traceLength: 3,
      traceSpeed: 10,
      explosion: 5,
      intensity: 30,
      flickering: 50,
      lineStyle: "round",
      hue: { min: 0, max: 360 },
      delay: { min: 30, max: 60 },
      brightness: { min: 50, max: 80 },
      decay: { min: 0.015, max: 0.03 },
    });
  } else {
    console.error("Fireworks-js library not loaded");
  }

  // PWA Install Prompt Functionality
  let deferredPrompt;
  const installBanner = document.getElementById('install-banner');
  const installBtn = document.getElementById('install-btn');
  const dismissBtn = document.getElementById('dismiss-install');

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('beforeinstallprompt event fired');
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show the install banner
    showInstallBanner();
  });

  // Show install banner
  function showInstallBanner() {
    // Check if user has previously dismissed the banner
    if (localStorage.getItem('pwa-install-dismissed') === 'true') {
      return;
    }
    installBanner.style.display = 'block';
  }

  // Handle install button click
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear the deferredPrompt variable
    deferredPrompt = null;
    
    // Hide the install banner
    hideInstallBanner();
  });

  // Handle dismiss button click
  dismissBtn.addEventListener('click', () => {
    hideInstallBanner();
    // Remember that user dismissed the banner
    localStorage.setItem('pwa-install-dismissed', 'true');
  });

  // Hide install banner
  function hideInstallBanner() {
    installBanner.style.display = 'none';
  }

  // Listen for the app being installed
  window.addEventListener('appinstalled', (e) => {
    console.log('PWA was installed');
    hideInstallBanner();
    // Clear the dismissed flag since app is now installed
    localStorage.removeItem('pwa-install-dismissed');
  });

  // Check if app is already installed (running in standalone mode)
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App is running in standalone mode (already installed)');
    hideInstallBanner();
  }

  if ("serviceWorker" in navigator) {
    console.log("Attempting to register Service Worker");
    navigator.serviceWorker
      .register("./service-worker.js", { scope: "." })
      .then((reg) => {
        console.log("Service Worker registered successfully:", reg);
        console.log("Scope:", reg.scope);
        if (reg.installing) {
          console.log("Service Worker installing");
        } else if (reg.waiting) {
          console.log("Service Worker installed, waiting");
        } else if (reg.active) {
          console.log("Service Worker active");
        }
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  } else {
    console.log("Service Worker not supported in this browser");
  }
});
