(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  var toggle = document.getElementById('themeToggle');
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  function syncMeta() {
    if (metaTheme) metaTheme.setAttribute('content', root.getAttribute('data-theme') === 'light' ? '#eef1fb' : '#0b0d1a');
  }
  syncMeta();
  toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncMeta();
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');
  function closeMenu() {
    navLinks.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  menuBtn.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  navLinks.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Typed role text ---------- */
  var typedEl = document.getElementById('typed');
  var words = ['insights.', 'dashboards.', 'predictions.', 'decisions.'];
  if (reduce) {
    typedEl.textContent = words[0];
  } else {
    var w = 0, c = 0, del = false;
    (function tick() {
      var word = words[w];
      typedEl.textContent = word.slice(0, c);
      var delay = del ? 45 : 95;
      if (!del && c === word.length) { del = true; delay = 1400; }
      else if (del && c === 0) { del = false; w = (w + 1) % words.length; delay = 350; }
      else c += del ? -1 : 1;
      setTimeout(tick, delay);
    })();
  }

  /* ---------- Scroll reveal (staggered per parent) ---------- */
  var reveals = document.querySelectorAll('.reveal');
  reveals.forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (n) { return n.classList.contains('reveal'); });
    el.style.setProperty('--d', (sibs.indexOf(el) * 0.09) + 's');
  });
  var counted = false;
  function runCounters() {
    if (counted) return;
    counted = true;
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      var dec = parseInt(el.dataset.decimals || '0', 10);
      var suffix = el.dataset.suffix || '';
      if (reduce) { el.textContent = target.toFixed(dec) + suffix; return; }
      var start = performance.now(), dur = 1600;
      (function step(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(start);
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          if (en.target.querySelector('[data-count]')) runCounters();
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
    runCounters();
  }

  /* ---------- Scroll progress + active nav link ---------- */
  var bar = document.getElementById('progress');
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var ticking = false;
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    var pos = window.scrollY + window.innerHeight * 0.35, active = -1;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= pos) active = i; });
    links.forEach(function (a, i) { a.classList.toggle('active', i === active); });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Card tilt + cursor glow (pointer devices only) ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
        var rx = ((y / r.height) - 0.5) * -7, ry = ((x / r.width) - 0.5) * 7;
        card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- Contact form (opens the visitor's mail app) ---------- */
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    Array.prototype.forEach.call(form.elements, function (f) {
      if (!f.name) return;
      var valid = f.checkValidity() && f.value.trim() !== '';
      f.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) { note.style.color = '#f87171'; note.textContent = 'Please fill in all fields with a valid email.'; return; }
    var d = new FormData(form);
    var subject = encodeURIComponent('Portfolio enquiry from ' + d.get('name'));
    var body = encodeURIComponent(d.get('message') + '\n\n— ' + d.get('name') + ' (' + d.get('email') + ')');
    note.style.color = '';
    note.textContent = 'Opening your email app…';
    window.location.href = 'mailto:sainaidusaragadam@gmail.com?subject=' + subject + '&body=' + body;
    form.reset();
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
