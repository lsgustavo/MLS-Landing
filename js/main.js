/* MLS — main.js */

/* ---- Nav: torna-se sólido após sair do hero ---- */
const nav  = document.getElementById('nav');
const hero = document.getElementById('hero');

const onScroll = () => {
  const threshold = hero ? hero.offsetHeight - 72 : 80;
  nav.classList.toggle('is-scrolled', window.scrollY > threshold);
};

window.addEventListener('scroll', onScroll, { passive: true });

/* ---- Hamburger (mobile) ---- */
const hamburger = document.querySelector('.nav__hamburger');
const navLinks  = document.querySelector('.nav__links');
const navCta    = document.querySelector('.nav__cta');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
    navLinks?.classList.toggle('nav__links--open', !isOpen);
    navCta?.classList.toggle('nav__cta--open', !isOpen);
  });

  /* fecha o menu ao clicar em um link */
  navLinks?.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('nav__links--open');
      navCta?.classList.remove('nav__cta--open');
    });
  });
}

/* ---- Reveal ao rolar — fade + leve elevação, com stagger em grupos ---- */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const revealTargets = [
    ...document.querySelectorAll('.section-header'),
    ...document.querySelectorAll('.compare-row'),
    ...document.querySelectorAll('.results__highlight'),
    ...document.querySelectorAll('.results__col'),
    ...document.querySelectorAll('.process-step'),
    ...document.querySelectorAll('.faq-item'),
    ...document.querySelectorAll('.cta-final__inner'),
  ];

  revealTargets.forEach(el => el.classList.add('reveal'));

  document.querySelector('.about__image-wrap')?.classList.add('reveal', 'reveal--left');
  document.querySelector('.about__content')?.classList.add('reveal', 'reveal--right');

  /* Stagger — pequeno atraso incremental para itens de um mesmo grupo */
  const staggerGroups = [
    '.compare-grid',
    '.results__highlights',
    '.results__grid',
    '.process__steps',
    '.faq__list',
  ];

  staggerGroups.forEach(selector => {
    document.querySelectorAll(selector).forEach(group => {
      Array.from(group.children).forEach((child, i) => {
        if (child.classList.contains('reveal')) {
          child.style.transitionDelay = `${Math.min(i * 90, 360)}ms`;
        }
      });
    });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealTargets.forEach(el => observer.observe(el));
    document.querySelectorAll('.about__image-wrap, .about__content').forEach(el => observer.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }
}
