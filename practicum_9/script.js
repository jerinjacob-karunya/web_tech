const pauseBtn = document.getElementById("pauseBtn");
const slideText = document.getElementById("slideText");

pauseBtn.addEventListener("click", function () {
  slideText.classList.toggle("paused");

  if (slideText.classList.contains("paused")) {
    pauseBtn.textContent = "Play the slider";
  } else {
    pauseBtn.textContent = "Pause the slider";
  }
});
