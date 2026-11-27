// Product screens are rendered in the correct locale at build time; no download is needed to choose them.
document.querySelectorAll(".ux-about-cards .screen-image").forEach((image) => {
  image.loading = "lazy";
  image.decoding = "async";
});
