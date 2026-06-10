/**
 * Google Calendar Mastering Academy - Core Logic (SPA Controller)
 * Handles View Routing, Custom Audio/Video Players, Slideshow Carousel, Quiz, Checklist, Zoom, and Progress tracking.
 */

// Application State Variables
let currentView = "home";
let activeSlideDeck = "mastering";
let currentSlideIndex = 0;
let fontScaleSize = 16; // Default font scale size in pixels

const slideDecks = {
  mastering: {
    title: "Mastering Google Calendar",
    total: 13,
    prefix: "slides_mastering/slide_",
    ext: "png"
  },
  architect: {
    title: "The Time Architect",
    total: 14,
    prefix: "slides_architect/slide_",
    ext: "png"
  }
};

// Course Progress Tracker (10 items)
let userProgress = {
  video: false,
  audio: false,
  slidesMastering: false,
  slidesArchitect: false,
  mindmap: false,
  infographic: false,
  docs: false,
  shortcuts: false,
  checklist: 0, // 0 to 100%
  quiz: false
};

// Quiz State
let currentQuestionIndex = 0;
let quizScore = 0;
let answeredQuestions = [];

// Zoom Image Drag & Pan State
let isDragging = false;
let startX = 0, startY = 0;
let translateX = 0, translateY = 0;
let scale = 1;

// Initialize Web App
document.addEventListener("DOMContentLoaded", () => {
  loadUserSettings();
  loadProgressData();
  renderDocsAccordion();
  renderKeyboardShortcuts();
  renderChecklist();
  renderThumbnails();
  updateSlideViewer();
  setupEventListeners();
  updateNavigationIndicator();
  updateProgressUI();
});

// Load Settings from LocalStorage
function loadUserSettings() {
  // Theme
  const theme = localStorage.getItem("app-theme") || "light";
  document.documentElement.setAttribute("data-theme", theme);
  
  // Font Size
  fontScaleSize = parseInt(localStorage.getItem("app-font-scale")) || 16;
  document.getElementById("bangla-fs-val").innerText = fontScaleSize;
  document.documentElement.style.setProperty("--app-font-scale", fontScaleSize + "px");
  document.querySelector(".view-container").style.fontSize = (fontScaleSize / 16) + "rem";
}

// Load Progress from LocalStorage
function loadProgressData() {
  const storedProgress = localStorage.getItem("app-progress");
  if (storedProgress) {
    try {
      userProgress = JSON.parse(storedProgress);
    } catch (e) {
      console.error("Error loading progress", e);
    }
  }
}

// Save Progress to LocalStorage
function saveProgressData() {
  localStorage.setItem("app-progress", JSON.stringify(userProgress));
  updateProgressUI();
}

// Update the General Progress UI on Hero Card
function updateProgressUI() {
  let completedItems = 0;
  
  if (userProgress.video) completedItems++;
  if (userProgress.audio) completedItems++;
  if (userProgress.slidesMastering) completedItems++;
  if (userProgress.slidesArchitect) completedItems++;
  if (userProgress.mindmap) completedItems++;
  if (userProgress.infographic) completedItems++;
  if (userProgress.docs) completedItems++;
  if (userProgress.shortcuts) completedItems++;
  if (userProgress.checklist >= 100) completedItems++;
  if (userProgress.quiz) completedItems++;
  
  const progressPercent = Math.round((completedItems / 10) * 100);
  
  // Update UI Elements
  const bar = document.getElementById("dashboard-progress-fill");
  const text = document.getElementById("dashboard-progress-pct");
  
  if (bar) bar.style.width = `${progressPercent}%`;
  if (text) text.innerText = `${convertEnglishToBanglaNumbers(progressPercent)}% সম্পন্ন`;
}

// Helper to convert Numbers to Bangla String
function convertEnglishToBanglaNumbers(num) {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num.toString().replace(/[0-9]/g, (digit) => banglaDigits[digit]);
}

// Routing Logic (SPA View Switcher)
function navigateToView(viewId, params = {}) {
  // Pause media elements if navigating away from media view
  if (currentView === "media" && viewId !== "media") {
    pauseAllMedia();
  }

  // Deactivate all views, activate the target one
  document.querySelectorAll(".app-view").forEach(view => {
    view.classList.remove("active");
  });
  
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add("active");
    currentView = viewId;
  }
  
  // Update Bottom Nav active state
  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");
  });
  
  // Map specific views back to their main tabs
  let activeTabId = viewId;
  if (viewId === "docs") activeTabId = "home"; // Docs belongs to home/dashboard
  
  const activeTabBtn = document.getElementById(`btn-nav-${activeTabId}`);
  if (activeTabBtn) {
    activeTabBtn.classList.add("active");
  }
  
  // Handle parameters
  if (viewId === "media" && params.focus) {
    switchMediaTab(params.focus);
  } else if (viewId === "slides" && params.deck) {
    switchSlideDeck(params.deck);
  } else if (viewId === "interactive" && params.focus) {
    switchInteractiveTab(params.focus);
  }

  // Track progress on view openings
  if (viewId === "docs") {
    userProgress.docs = true;
    saveProgressData();
  }

  // Update navigation slider
  updateNavigationIndicator();
  
  // Scroll view container back to top
  document.querySelector(".view-container").scrollTop = 0;
}

// Custom Navigation Bar Slide Indicator Positioning
function updateNavigationIndicator() {
  const activeBtn = document.querySelector(".nav-item.active");
  const indicator = document.getElementById("nav-indicator");
  if (activeBtn && indicator) {
    const parentRect = activeBtn.parentElement.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const offset = btnRect.left - parentRect.left + (btnRect.width - indicator.offsetWidth) / 2;
    indicator.style.transform = `translateX(${offset}px)`;
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Theme Toggle Button
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("app-theme", newTheme);
  });
  
  // Custom Video Player Controls
  const video = document.getElementById("main-video");
  const videoPlayBtn = document.getElementById("video-play-toggle");
  const videoMuteBtn = document.getElementById("video-mute-toggle");
  const videoProgressBar = document.getElementById("video-progress");
  
  if (video) {
    videoPlayBtn.addEventListener("click", toggleVideoPlay);
    video.addEventListener("click", toggleVideoPlay);
    videoMuteBtn.addEventListener("click", toggleVideoMute);
    video.addEventListener("timeupdate", updateVideoProgress);
    
    // Progress bar click-to-seek
    videoProgressBar.parentElement.addEventListener("click", (e) => {
      const rect = videoProgressBar.parentElement.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      video.currentTime = clickPosition * video.duration;
    });
  }

  // Custom Audio Player Controls
  const audio = document.getElementById("main-audio");
  const audioPlayBtn = document.getElementById("audio-play-toggle");
  const audioMuteBtn = document.getElementById("audio-mute-toggle");
  const audioScrubber = document.getElementById("audio-scrubber");
  const speedBtn = document.getElementById("audio-speed-btn");
  
  if (audio) {
    audioPlayBtn.addEventListener("click", toggleAudioPlay);
    audioMuteBtn.addEventListener("click", toggleAudioMute);
    audio.addEventListener("timeupdate", updateAudioProgress);
    audio.addEventListener("loadedmetadata", () => {
      document.getElementById("audio-time-total").innerText = formatTime(audio.duration);
    });
    
    // Scrubber drag-to-seek
    audioScrubber.addEventListener("input", () => {
      const seekValue = audioScrubber.value;
      audio.currentTime = (seekValue / 100) * audio.duration;
    });
    
    // Playback Speed Toggle (1x -> 1.25x -> 1.5x -> 2x -> 0.75x -> 1x)
    speedBtn.addEventListener("click", () => {
      const speeds = [1, 1.25, 1.5, 2, 0.75];
      let currentIdx = speeds.indexOf(audio.playbackRate);
      let nextIdx = (currentIdx + 1) % speeds.length;
      let newSpeed = speeds[nextIdx];
      audio.playbackRate = newSpeed;
      speedBtn.innerText = `${newSpeed}x`;
    });
  }

  // Image Zoom Pan Listeners
  const zoomContainer = document.querySelector(".zoom-content-container");
  const zoomImg = document.getElementById("zoom-img");
  
  if (zoomContainer && zoomImg) {
    zoomContainer.addEventListener("mousedown", dragStart);
    window.addEventListener("mousemove", dragMove);
    window.addEventListener("mouseup", dragEnd);
    
    zoomContainer.addEventListener("touchstart", dragStart, { passive: true });
    window.addEventListener("touchmove", dragMove, { passive: false });
    window.addEventListener("touchend", dragEnd);
    
    // Wheel Zoom support
    zoomContainer.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.01;
      scale = Math.min(Math.max(0.5, scale + delta), 4);
      applyZoomTransform();
    }, { passive: false });
  }

  // Screen Resize Navigation Indicator calibration
  window.addEventListener("resize", updateNavigationIndicator);
}

// -------------------------------------------------------------
// MEDIA PLAYERS CONTROL FUNCTIONS
// -------------------------------------------------------------
function pauseAllMedia() {
  const video = document.getElementById("main-video");
  const audio = document.getElementById("main-audio");
  
  if (video && !video.paused) {
    video.pause();
    updateVideoPlayButton(false);
  }
  
  if (audio && !audio.paused) {
    audio.pause();
    updateAudioPlayButton(false);
  }
}

// Video Player functions
function toggleVideoPlay() {
  const video = document.getElementById("main-video");
  if (video.paused) {
    pauseAllMedia();
    video.play();
    updateVideoPlayButton(true);
    userProgress.video = true;
    saveProgressData();
  } else {
    video.pause();
    updateVideoPlayButton(false);
  }
}

function updateVideoPlayButton(isPlaying) {
  const playBtn = document.getElementById("video-play-toggle");
  const playSvg = playBtn.querySelector(".play-svg");
  const pauseSvg = playBtn.querySelector(".pause-svg");
  
  if (isPlaying) {
    playSvg.classList.add("hidden");
    pauseSvg.classList.remove("hidden");
  } else {
    playSvg.classList.remove("hidden");
    pauseSvg.classList.add("hidden");
  }
}

function toggleVideoMute() {
  const video = document.getElementById("main-video");
  const muteBtn = document.getElementById("video-mute-toggle");
  const volUpSvg = muteBtn.querySelector(".volume-up-svg");
  const volMuteSvg = muteBtn.querySelector(".volume-mute-svg");
  
  video.muted = !video.muted;
  
  if (video.muted) {
    volUpSvg.classList.add("hidden");
    volMuteSvg.classList.remove("hidden");
  } else {
    volUpSvg.classList.remove("hidden");
    volMuteSvg.classList.add("hidden");
  }
}

function updateVideoProgress() {
  const video = document.getElementById("main-video");
  const progressBar = document.getElementById("video-progress");
  const timeText = document.getElementById("video-time-text");
  
  if (video.duration) {
    const percent = (video.currentTime / video.duration) * 100;
    progressBar.style.width = `${percent}%`;
    timeText.innerText = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  }
}

// Audio Player functions
function toggleAudioPlay() {
  const audio = document.getElementById("main-audio");
  const card = document.querySelector(".audio-player-card");
  
  if (audio.paused) {
    pauseAllMedia();
    audio.play();
    updateAudioPlayButton(true);
    card.classList.add("playing");
    userProgress.audio = true;
    saveProgressData();
  } else {
    audio.pause();
    updateAudioPlayButton(false);
    card.classList.remove("playing");
  }
}

function updateAudioPlayButton(isPlaying) {
  const playBtn = document.getElementById("audio-play-toggle");
  const playSvg = playBtn.querySelector(".play-svg");
  const pauseSvg = playBtn.querySelector(".pause-svg");
  
  if (isPlaying) {
    playBtn.classList.add("playing");
    playSvg.classList.add("hidden");
    pauseSvg.classList.remove("hidden");
  } else {
    playBtn.classList.remove("playing");
    playSvg.classList.remove("hidden");
    pauseSvg.classList.add("hidden");
  }
}

function toggleAudioMute() {
  const audio = document.getElementById("main-audio");
  audio.muted = !audio.muted;
  
  const muteBtn = document.getElementById("audio-mute-toggle");
  muteBtn.style.color = audio.muted ? "#ef4444" : "var(--text-secondary)";
}

function skipAudio(seconds) {
  const audio = document.getElementById("main-audio");
  audio.currentTime = Math.min(Math.max(0, audio.currentTime + seconds), audio.duration);
}

function updateAudioProgress() {
  const audio = document.getElementById("main-audio");
  const scrubber = document.getElementById("audio-scrubber");
  const currTimeText = document.getElementById("audio-time-curr");
  
  if (audio.duration) {
    const percent = (audio.currentTime / audio.duration) * 100;
    scrubber.value = percent;
    currTimeText.innerText = formatTime(audio.currentTime);
  }
}

// Format seconds to MM:SS format
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Switch tabs inside Media page
function switchMediaTab(tab) {
  document.getElementById("tab-video").classList.remove("active");
  document.getElementById("tab-audio").classList.remove("active");
  document.getElementById("block-video").classList.add("hidden");
  document.getElementById("block-audio").classList.add("hidden");
  
  if (tab === "video") {
    document.getElementById("tab-video").classList.add("active");
    document.getElementById("block-video").classList.remove("hidden");
  } else {
    document.getElementById("tab-audio").classList.add("active");
    document.getElementById("block-audio").classList.remove("hidden");
  }
}

// -------------------------------------------------------------
// SLIDESHOW PRESENTATION CAROUSEL
// -------------------------------------------------------------
function switchSlideDeck(deckId) {
  activeSlideDeck = deckId;
  currentSlideIndex = 0;
  
  document.getElementById("tab-mastering").classList.remove("active");
  document.getElementById("tab-architect").classList.remove("active");
  
  if (deckId === "mastering") {
    document.getElementById("tab-mastering").classList.add("active");
  } else {
    document.getElementById("tab-architect").classList.add("active");
  }
  
  renderThumbnails();
  updateSlideViewer();
}

function updateSlideViewer() {
  const deck = slideDecks[activeSlideDeck];
  const slideNum = currentSlideIndex + 1;
  const imgPath = `${deck.prefix}${slideNum.toString().padStart(2, '0')}.${deck.ext}`;
  
  document.getElementById("current-slide-img").src = imgPath;
  document.getElementById("slide-counter-text").innerText = `${convertEnglishToBanglaNumbers(slideNum)} / ${convertEnglishToBanglaNumbers(deck.total)}`;
  
  // Highlight active thumbnail
  document.querySelectorAll(".slide-thumb").forEach((thumb, idx) => {
    if (idx === currentSlideIndex) {
      thumb.classList.add("active");
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      thumb.classList.remove("active");
    }
  });

  // Track progress if student has read all slides in a deck
  if (slideNum === deck.total) {
    if (activeSlideDeck === "mastering") {
      userProgress.slidesMastering = true;
    } else {
      userProgress.slidesArchitect = true;
    }
    saveProgressData();
  }
}

function prevSlide() {
  if (currentSlideIndex > 0) {
    currentSlideIndex--;
    updateSlideViewer();
  }
}

function nextSlide() {
  const deck = slideDecks[activeSlideDeck];
  if (currentSlideIndex < deck.total - 1) {
    currentSlideIndex++;
    updateSlideViewer();
  }
}

function selectSlide(idx) {
  currentSlideIndex = idx;
  updateSlideViewer();
}

function renderThumbnails() {
  const container = document.getElementById("thumbnails-container");
  container.innerHTML = "";
  
  const deck = slideDecks[activeSlideDeck];
  for (let i = 0; i < deck.total; i++) {
    const thumbImg = document.createElement("img");
    const slideNum = i + 1;
    thumbImg.src = `${deck.prefix}${slideNum.toString().padStart(2, '0')}.${deck.ext}`;
    thumbImg.alt = `Slide ${slideNum}`;
    thumbImg.classList.add("slide-thumb");
    thumbImg.addEventListener("click", () => selectSlide(i));
    container.appendChild(thumbImg);
  }
}

function zoomCurrentSlide() {
  const deck = slideDecks[activeSlideDeck];
  const slideNum = currentSlideIndex + 1;
  const imgPath = `${deck.prefix}${slideNum.toString().padStart(2, '0')}.${deck.ext}`;
  openZoomImage(imgPath);
}

// -------------------------------------------------------------
// IMAGE ZOOM MODAL (WITH DRAG & PINCH PANNING)
// -------------------------------------------------------------
function openZoomImage(src) {
  // Pause any audio/video
  pauseAllMedia();
  
  const modal = document.getElementById("image-zoom-modal");
  const img = document.getElementById("zoom-img");
  
  img.src = src;
  modal.classList.remove("hidden");
  
  // Reset zoom state values
  translateX = 0;
  translateY = 0;
  scale = 1;
  applyZoomTransform();

  // Track Progress
  if (src.includes("Mind Map")) {
    userProgress.mindmap = true;
  } else if (src.includes("guide")) {
    userProgress.infographic = true;
  }
  saveProgressData();
}

function closeZoomImage() {
  document.getElementById("image-zoom-modal").classList.add("hidden");
}

function applyZoomTransform() {
  const img = document.getElementById("zoom-img");
  img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function dragStart(e) {
  isDragging = true;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  startX = clientX - translateX;
  startY = clientY - translateY;
}

function dragMove(e) {
  if (!isDragging) return;
  if (e.cancelable) e.preventDefault(); // Stop mobile scrolling
  
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  translateX = clientX - startX;
  translateY = clientY - startY;
  applyZoomTransform();
}

function dragEnd() {
  isDragging = false;
}

// -------------------------------------------------------------
// STUDY DOCS ACCORDION RENDERER
// -------------------------------------------------------------
function renderDocsAccordion() {
  const container = document.getElementById("docs-accordion-container");
  container.innerHTML = "";
  
  ACADEMY_DATA.studyGuide.forEach((guide, index) => {
    const item = document.createElement("div");
    item.classList.add("accordion-item");
    if (index === 0) item.classList.add("open"); // open first item by default
    
    // Header
    const header = document.createElement("div");
    header.classList.add("accordion-header");
    header.innerHTML = `
      <h3>${guide.title}</h3>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    `;
    
    // Content body
    const content = document.createElement("div");
    content.classList.add("accordion-content");
    
    const desc = document.createElement("p");
    desc.classList.add("accordion-desc");
    desc.innerText = guide.description;
    
    const pointsList = document.createElement("ul");
    pointsList.classList.add("accordion-points");
    guide.points.forEach(point => {
      const li = document.createElement("li");
      li.innerText = point;
      pointsList.appendChild(li);
    });
    
    content.appendChild(desc);
    content.appendChild(pointsList);
    
    header.addEventListener("click", () => {
      // Toggle current accordion item
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".accordion-item").forEach(acc => acc.classList.remove("open"));
      if (!isOpen) {
        item.classList.add("open");
      }
    });
    
    item.appendChild(header);
    item.appendChild(content);
    container.appendChild(item);
  });
}

// -------------------------------------------------------------
// INTERACTIVE TOOLS (KEYBOARD SHORTCUTS, CHECKLIST, QUIZ)
// -------------------------------------------------------------
function switchInteractiveTab(tab) {
  document.getElementById("tab-shortcuts").classList.remove("active");
  document.getElementById("tab-checklist").classList.remove("active");
  document.getElementById("tab-quiz").classList.remove("active");
  
  document.getElementById("block-shortcuts").classList.add("hidden");
  document.getElementById("block-checklist").classList.add("hidden");
  document.getElementById("block-quiz").classList.add("hidden");
  
  if (tab === "shortcuts") {
    document.getElementById("tab-shortcuts").classList.add("active");
    document.getElementById("block-shortcuts").classList.remove("hidden");
    
    // Track shortcut viewed
    userProgress.shortcuts = true;
    saveProgressData();
  } else if (tab === "checklist") {
    document.getElementById("tab-checklist").classList.add("active");
    document.getElementById("block-checklist").classList.remove("hidden");
  } else {
    document.getElementById("tab-quiz").classList.add("active");
    document.getElementById("block-quiz").classList.remove("hidden");
  }
}

// Shortcuts renderer
function renderKeyboardShortcuts() {
  const container = document.getElementById("shortcuts-container");
  container.innerHTML = "";
  
  ACADEMY_DATA.shortcuts.forEach(sc => {
    const row = document.createElement("div");
    row.classList.add("shortcut-row");
    row.innerHTML = `
      <span class="shortcut-action">${sc.action}</span>
      <kbd class="shortcut-key">${sc.key}</kbd>
    `;
    container.appendChild(row);
  });
}

// Checklist renderer
function renderChecklist() {
  const container = document.getElementById("checklist-container");
  container.innerHTML = "";
  
  // Load saved checklist status
  const checkedItems = JSON.parse(localStorage.getItem("app-checklist-items")) || [];
  
  ACADEMY_DATA.checklist.forEach(item => {
    const card = document.createElement("div");
    card.classList.add("checklist-item");
    
    const isChecked = checkedItems.includes(item.id);
    if (isChecked) card.classList.add("checked");
    
    card.innerHTML = `
      <div class="chk-box">
        <svg class="check-svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="4">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <span class="chk-text">${item.text}</span>
    `;
    
    card.addEventListener("click", () => {
      const activeChecked = JSON.parse(localStorage.getItem("app-checklist-items")) || [];
      const idx = activeChecked.indexOf(item.id);
      
      if (idx === -1) {
        activeChecked.push(item.id);
        card.classList.add("checked");
      } else {
        activeChecked.splice(idx, 1);
        card.classList.remove("checked");
      }
      
      localStorage.setItem("app-checklist-items", JSON.stringify(activeChecked));
      calculateChecklistProgress(activeChecked.length);
    });
    
    container.appendChild(card);
  });
  
  calculateChecklistProgress(checkedItems.length);
}

function calculateChecklistProgress(checkedCount) {
  const total = ACADEMY_DATA.checklist.length;
  const pct = Math.round((checkedCount / total) * 100);
  
  document.getElementById("checklist-progress-fill").style.width = `${pct}%`;
  document.getElementById("checklist-progress-text").innerText = `${convertEnglishToBanglaNumbers(checkedCount)} / ${convertEnglishToBanglaNumbers(total)} সম্পূর্ণ`;
  
  userProgress.checklist = pct;
  saveProgressData();
}

// Interactive Quiz System
function startQuiz() {
  currentQuestionIndex = 0;
  quizScore = 0;
  answeredQuestions = [];
  
  document.getElementById("quiz-intro-screen").classList.add("hidden");
  document.getElementById("quiz-result-screen").classList.add("hidden");
  document.getElementById("quiz-question-screen").classList.remove("hidden");
  
  loadQuizQuestion();
}

function loadQuizQuestion() {
  const qData = ACADEMY_DATA.quiz[currentQuestionIndex];
  
  document.getElementById("quiz-question-number").innerText = `প্রশ্ন ${convertEnglishToBanglaNumbers(currentQuestionIndex + 1)} / ${convertEnglishToBanglaNumbers(ACADEMY_DATA.quiz.length)}`;
  document.getElementById("quiz-current-score").innerText = convertEnglishToBanglaNumbers(quizScore);
  document.getElementById("quiz-question-text").innerText = qData.question;
  
  const optionsContainer = document.getElementById("quiz-options-container");
  optionsContainer.innerHTML = "";
  
  // Hide explanation initially
  document.getElementById("quiz-explanation-box").classList.add("hidden");
  
  qData.options.forEach((opt, index) => {
    const btn = document.createElement("button");
    btn.classList.add("quiz-opt");
    btn.innerText = opt;
    btn.addEventListener("click", () => handleQuizAnswer(index, btn));
    optionsContainer.appendChild(btn);
  });
}

function handleQuizAnswer(selectedIndex, selectedBtn) {
  const qData = ACADEMY_DATA.quiz[currentQuestionIndex];
  const optionsContainer = document.getElementById("quiz-options-container");
  
  // Disable all options
  optionsContainer.querySelectorAll(".quiz-opt").forEach(btn => {
    btn.classList.add("disabled");
  });
  
  if (selectedIndex === qData.answer) {
    selectedBtn.classList.add("correct");
    quizScore++;
  } else {
    selectedBtn.classList.add("incorrect");
    // Show correct answer in green
    optionsContainer.querySelectorAll(".quiz-opt")[qData.answer].classList.add("correct");
  }
  
  // Update live score
  document.getElementById("quiz-current-score").innerText = convertEnglishToBanglaNumbers(quizScore);
  
  // Show explanation
  document.getElementById("quiz-explanation-text").innerText = qData.explanation;
  document.getElementById("quiz-explanation-box").classList.remove("hidden");
}

function nextQuizQuestion() {
  currentQuestionIndex++;
  
  if (currentQuestionIndex < ACADEMY_DATA.quiz.length) {
    loadQuizQuestion();
  } else {
    showQuizResults();
  }
}

function showQuizResults() {
  document.getElementById("quiz-question-screen").classList.add("hidden");
  const resultScreen = document.getElementById("quiz-result-screen");
  resultScreen.classList.remove("hidden");
  
  const totalQuestions = ACADEMY_DATA.quiz.length;
  document.getElementById("result-final-score").innerText = `${convertEnglishToBanglaNumbers(quizScore)} / ${convertEnglishToBanglaNumbers(totalQuestions)}`;
  
  const greeting = document.getElementById("result-greeting");
  const feedback = document.getElementById("result-feedback-text");
  const emoji = document.getElementById("result-badge-emoji");
  
  if (quizScore === totalQuestions) {
    greeting.innerText = "অসাধারণ!";
    emoji.innerText = "🏆";
    feedback.innerText = "আপনি গুগল ক্যালেন্ডারে একজন প্রো 'টাইম আর্কিটেক্ট'। প্রতিটি উত্তরই সঠিক হয়েছে।";
  } else if (quizScore >= 3) {
    greeting.innerText = "চমৎকার!";
    emoji.innerText = "🎉";
    feedback.innerText = "আপনি গুগল ক্যালেন্ডার সম্পর্কে যথেষ্ট ভালো জ্ঞান অর্জন করেছেন। আপনার প্রস্তুতি চমৎকার।";
  } else {
    greeting.innerText = "আবার চেষ্টা করুন!";
    emoji.innerText = "📖";
    feedback.innerText = "স্লাইড ও ভিডিও লেকচারগুলো আরও একবার রিভিশন দিয়ে আবার কুইজটি দিন।";
  }
  
  // Mark quiz as completed in progress tracker
  userProgress.quiz = true;
  saveProgressData();
}

function resetQuiz() {
  document.getElementById("quiz-result-screen").classList.add("hidden");
  document.getElementById("quiz-intro-screen").classList.remove("hidden");
}

// -------------------------------------------------------------
// PORTAL SETTINGS (FONT SCALING & DATA RESET)
// -------------------------------------------------------------
function adjustFontSize(dir) {
  // Limit font size between 13px and 22px
  fontScaleSize = Math.min(Math.max(13, fontScaleSize + dir), 22);
  
  document.getElementById("bangla-fs-val").innerText = fontScaleSize;
  document.documentElement.style.setProperty("--app-font-scale", fontScaleSize + "px");
  document.querySelector(".view-container").style.fontSize = (fontScaleSize / 16) + "rem";
  
  localStorage.setItem("app-font-scale", fontScaleSize);
}

function resetAllProgress() {
  if (confirm("আপনি কি নিশ্চিতভাবে আপনার কোর্স অগ্রগতি এবং কুইজের তথ্য রিসেট করতে চান?")) {
    userProgress = {
      video: false,
      audio: false,
      slidesMastering: false,
      slidesArchitect: false,
      mindmap: false,
      infographic: false,
      docs: false,
      shortcuts: false,
      checklist: 0,
      quiz: false
    };
    
    localStorage.removeItem("app-checklist-items");
    saveProgressData();
    renderChecklist();
    resetQuiz();
    
    alert("রিসেট সম্পন্ন হয়েছে!");
    navigateToView("home");
  }
}
