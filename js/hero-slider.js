'use strict';

(() => {
  const slider = document.querySelector('#heroSlider');
  if (!slider) return;

  const slides = [...slider.querySelectorAll('.hero-slide')];
  const dots = [...slider.querySelectorAll('[data-slide-to]')];
  const previous = slider.querySelector('[data-slide-prev]');
  const next = slider.querySelector('[data-slide-next]');
  if (slides.length < 2) return;

  let activeIndex = Math.max(0, slides.findIndex(slide => slide.classList.contains('is-active')));
  let timer = null;
  // Preload all five images so each transition is ready when the timer fires.
  slides.forEach((slide) => {
    const image = slide.dataset.image;
    if (image) slide.style.backgroundImage = `url("${image}")`;
  });

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === activeIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      if (active && slide.dataset.image && !slide.style.backgroundImage) {
        slide.style.backgroundImage = `url("${slide.dataset.image}")`;
      }
    });
    dots.forEach((dot, i) => {
      const active = i === activeIndex;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function start() {
    stop();
    if (!document.hidden) {
      timer = window.setInterval(() => showSlide(activeIndex + 1), 5000);
    }
  }

  previous?.addEventListener('click', () => { showSlide(activeIndex - 1); start(); });
  next?.addEventListener('click', () => { showSlide(activeIndex + 1); start(); });
  dots.forEach(dot => dot.addEventListener('click', () => {
    const index = Number(dot.dataset.slideTo);
    if (Number.isInteger(index)) showSlide(index);
    start();
  }));
  // Do not pause on hover: the slider occupies the entire hero, so this
  // previously prevented autoplay while the pointer rested over the banner.
  slider.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

  showSlide(activeIndex);
  start();
})();
