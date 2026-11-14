const themeToggle = document.getElementById("theme-toggle");

themeToggle.addEventListener("click", function (event) {
	event.preventDefault();

	document.body.classList.toggle("dark-theme");

	if (document.body.classList.contains("dark-theme")) {
		themeToggle.textContent = "Light Mode";
	} else {
		themeToggle.textContent = "Dark Mode";
	}
});
