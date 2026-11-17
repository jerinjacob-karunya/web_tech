const items = document.querySelectorAll(".item");
const overlay = document.getElementById("overlay");
const bigImage = document.getElementById("bigImage");
const caption = document.getElementById("caption");
const closeBtn = document.getElementById("closeBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let current = 0;

function showImage(index) {
	current = index;	const img = items[index].querySelector("img");	bigImage.src = img.src;	bigImage.alt = img.alt;	caption.textContent = items[index].dataset.caption;}

function openOverlay(index) {
	showImage(index);	overlay.classList.add("show");	closeBtn.focus();}

function closeOverlay() {
	overlay.classList.remove("show");	items[current].focus();}

function nextImage() {
	showImage((current + 1) % items.length);}

function prevImage() {
	showImage((current - 1 + items.length) % items.length);}

items.forEach(function (item, index) {
	item.addEventListener("click", function () {		openOverlay(index);	});});

closeBtn.addEventListener("click", closeOverlay);
nextBtn.addEventListener("click", nextImage);
prevBtn.addEventListener("click", prevImage);

overlay.addEventListener("click", function (event) {
	if (event.target === overlay) {		closeOverlay();	}});

document.addEventListener("keydown", function (event) {
	if (!overlay.classList.contains("show")) return;
	if (event.key === "Escape") closeOverlay();	if (event.key === "ArrowRight") nextImage();	if (event.key === "ArrowLeft") prevImage();});
