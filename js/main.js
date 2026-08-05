/* MLS — main.js */

/* ---- Nav: torna-se sólido após sair do hero ---- */
const nav  = document.getElementById('nav');
const hero = document.getElementById('hero');
const themeColor = document.querySelector('meta[name="theme-color"]');

/* A meta theme-color não aceita var(), então os tons são lidos dos próprios
   tokens — assim a barra do navegador no Android acompanha a nav em vez de
   destoar em uma cor fora da paleta. */
const rootStyles = getComputedStyle(document.documentElement);
const navTheme = {
  top: rootStyles.getPropertyValue('--color-deep').trim(),
  scrolled: rootStyles.getPropertyValue('--color-bg').trim(),
};

const onScroll = () => {
  const threshold = hero ? hero.offsetHeight - 72 : 80;
  const isScrolled = window.scrollY > threshold;

  nav.classList.toggle('is-scrolled', isScrolled);

  const tone = isScrolled ? navTheme.scrolled : navTheme.top;
  if (themeColor && tone) {
    themeColor.content = tone;
  }
};

window.addEventListener('scroll', onScroll, { passive: true });

/* Recarregar a página no meio do documento não dispara scroll — sem esta
   chamada a nav abriria no estado errado, escura sobre o conteúdo claro */
onScroll();

/* ---- Hamburger (mobile) ---- */
const hamburger = document.querySelector('.nav__hamburger');
const navMenu   = document.querySelector('.nav__menu');

if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
    navMenu.classList.toggle('nav__menu--open', !isOpen);
  });

  /* fecha o menu ao clicar em um link */
  navMenu.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('nav__menu--open');
    });
  });
}

/* ---- Select customizado ----
   Segue o padrão ARIA de combobox somente-seleção: o foco permanece no
   botão e a opção em destaque é apontada por aria-activedescendant.
   O <select> nativo continua no DOM, invisível, guardando o valor — assim
   o FormData e a validação de campo obrigatório seguem intactos, e o
   formulário permanece utilizável caso este script não seja executado. */
const enhanceSelect = wrapper => {
  const native = wrapper.querySelector('select');
  if (!native) return;

  const id = native.id;
  const field = wrapper.closest('.form-field');
  const label = field?.querySelector('label');

  const button = document.createElement('button');
  button.type = 'button';
  button.id = `${id}-button`;
  button.className = 'select__button';
  button.setAttribute('role', 'combobox');
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', `${id}-listbox`);

  const valueEl = document.createElement('span');
  valueEl.className = 'select__value';
  valueEl.id = `${id}-value`;

  const caret = document.createElement('span');
  caret.className = 'select__caret';
  caret.setAttribute('aria-hidden', 'true');
  button.append(valueEl, caret);

  const list = document.createElement('ul');
  list.id = `${id}-listbox`;
  list.className = 'select__list';
  list.setAttribute('role', 'listbox');

  /* A opção desabilitada do markup é o texto de placeholder, não um valor */
  const placeholder = Array.from(native.options).find(option => option.disabled);
  const options = Array.from(native.options).filter(option => !option.disabled);

  const optionEls = options.map((option, index) => {
    const item = document.createElement('li');
    item.id = `${id}-option-${index}`;
    item.className = 'select__option';
    item.setAttribute('role', 'option');
    item.dataset.value = option.value;
    item.textContent = option.text;
    list.append(item);
    return item;
  });

  if (label) {
    label.id = `${id}-label`;
    /* O for apontaria para o nativo invisível; o clique é redirecionado */
    label.removeAttribute('for');
    label.addEventListener('click', () => button.focus());
    button.setAttribute('aria-labelledby', `${label.id} ${valueEl.id}`);
  }

  wrapper.append(button, list);
  wrapper.classList.add('select--enhanced');
  native.classList.add('select__native');
  native.tabIndex = -1;
  native.setAttribute('aria-hidden', 'true');

  let isOpen = false;
  let activeIndex = -1;
  let typedQuery = '';
  let typedTimer;

  const selectedIndex = () => optionEls.findIndex(item => item.dataset.value === native.value);

  const syncFromNative = () => {
    const current = selectedIndex();
    optionEls.forEach((item, index) => item.setAttribute('aria-selected', String(index === current)));
    valueEl.textContent = current >= 0 ? optionEls[current].textContent : (placeholder?.text ?? '');
    valueEl.classList.toggle('select__value--placeholder', current < 0);
  };

  const setActive = index => {
    activeIndex = index;
    optionEls.forEach((item, i) => item.classList.toggle('is-active', i === index));

    if (index < 0) {
      button.removeAttribute('aria-activedescendant');
      return;
    }

    const item = optionEls[index];
    button.setAttribute('aria-activedescendant', item.id);

    /* Rolagem manual: scrollIntoView arrastaria a página junto */
    const top = item.offsetTop;
    const bottom = top + item.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  };

  const open = () => {
    if (isOpen) return;
    isOpen = true;
    wrapper.classList.add('select--open');
    button.setAttribute('aria-expanded', 'true');
    setActive(Math.max(selectedIndex(), 0));
  };

  const close = ({ refocus = true } = {}) => {
    if (!isOpen) return;
    isOpen = false;
    wrapper.classList.remove('select--open');
    button.setAttribute('aria-expanded', 'false');
    setActive(-1);
    if (refocus) button.focus();
  };

  const choose = (index, closeOptions) => {
    const item = optionEls[index];
    if (item && native.value !== item.dataset.value) {
      native.value = item.dataset.value;
      native.dispatchEvent(new Event('change', { bubbles: true }));
    }
    close(closeOptions);
  };

  const search = char => {
    clearTimeout(typedTimer);
    typedQuery += char.toLowerCase();
    typedTimer = setTimeout(() => { typedQuery = ''; }, 600);

    const match = optionEls.findIndex(item => item.textContent.toLowerCase().startsWith(typedQuery));
    if (match >= 0) {
      if (isOpen) setActive(match);
      else choose(match);
    }
  };

  button.addEventListener('click', () => (isOpen ? close() : open()));

  button.addEventListener('keydown', event => {
    const { key } = event;

    if (!isOpen) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault();
        open();
      } else if (key.length === 1 && key !== ' ') {
        search(key);
      }
      return;
    }

    if (key === 'ArrowDown') {
      event.preventDefault();
      setActive(Math.min(activeIndex + 1, optionEls.length - 1));
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (key === 'End') {
      event.preventDefault();
      setActive(optionEls.length - 1);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      choose(activeIndex);
    } else if (key === 'Tab') {
      /* Confirma a opção em destaque sem interromper a ordem de tabulação */
      choose(activeIndex, { refocus: false });
    } else if (key === 'Escape') {
      event.preventDefault();
      close();
    } else if (key.length === 1) {
      search(key);
    }
  });

  /* Mantém o foco no botão ao clicar numa opção, preservando o padrão ARIA */
  list.addEventListener('mousedown', event => event.preventDefault());

  list.addEventListener('click', event => {
    const item = event.target.closest('.select__option');
    if (item) choose(optionEls.indexOf(item));
  });

  wrapper.addEventListener('focusout', event => {
    if (!wrapper.contains(event.relatedTarget)) close({ refocus: false });
  });

  document.addEventListener('pointerdown', event => {
    if (!wrapper.contains(event.target)) close({ refocus: false });
  });

  native.addEventListener('change', syncFromNative);
  native.form?.addEventListener('reset', () => setTimeout(syncFromNative));

  syncFromNative();
};

document.querySelectorAll('.select').forEach(enhanceSelect);

/* ---- Prévia de orçamento: organiza respostas e abre o WhatsApp ---- */
const estimateForm = document.getElementById('estimate-form');
const estimateStatus = document.getElementById('estimate-status');

if (estimateForm) {
  estimateForm.addEventListener('submit', event => {
    event.preventDefault();

    const data = new FormData(estimateForm);
    const details = String(data.get('detalhes') || '').trim();

    const message = [
      '*SOLICITAÇÃO DE PRÉVIA DE ORÇAMENTO*',
      '',
      `*Nome:* ${String(data.get('nome')).trim()}`,
      `*Área de atuação:* ${String(data.get('negocio')).trim()}`,
      `*Solução procurada:* ${data.get('servico')}`,
      `*Momento do negócio:* ${data.get('momento')}`,
      `*Quantidade de documentos:* ${data.get('volume')}`,
      `*Previsão para começar:* ${data.get('prazo')}`,
      ...(details ? ['', '*Necessidade descrita:*', details] : []),
      '',
      '_Respostas enviadas pelo questionário do site._',
    ].join('\n');

    const whatsappUrl = `https://wa.me/5512982148377?text=${encodeURIComponent(message)}`;
    const whatsappWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    if (estimateStatus) {
      estimateStatus.textContent = whatsappWindow
        ? 'WhatsApp aberto. Revise a mensagem e confirme o envio.'
        : 'Não foi possível abrir uma nova aba. Verifique o bloqueio de pop-ups.';
    }
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
    ...document.querySelectorAll('.estimate__intro'),
    ...document.querySelectorAll('.estimate-form'),
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
