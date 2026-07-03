document.addEventListener('DOMContentLoaded', function () {
  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', function () {
      var isOpen = q.parentElement.classList.toggle('open');
      q.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  });

  // ヒーローのURL入力 → CTAフォームに値を引き継いでスクロール送客
  var heroForm = document.getElementById('hero-diagnose');
  if (heroForm) {
    heroForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = (heroForm.querySelector('input[name="url"]') || {}).value || '';
      var ctaUrl = document.querySelector('.cta form input[name="url"]');
      if (ctaUrl && val) ctaUrl.value = val;
      var cta = document.getElementById('cta');
      if (cta) cta.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Floating CTA
  var floatCta = document.querySelector('.float-cta');
  var hero = document.querySelector('.hero');
  if (floatCta && hero) {
    window.addEventListener('scroll', function () {
      floatCta.classList.toggle('show', window.scrollY > hero.offsetHeight * 0.8);
    }, { passive: true });
  }

  // Scroll reveal — fade/slide up as elements enter the viewport (with stagger per group)
  var groups = ['.hero-badges', '.media-row', '.cards', '.steps', '.eq', '.promise-grid', '.compare', '.profile', '.faq', '.guarantee', '.eyebrow', '.sec-title', '.sec-lead'];
  var stagger = ['cards', 'steps', 'hero-badges', 'eq', 'promise-grid'];
  var targets = [];
  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.children.length && stagger.some(function (c) { return el.classList.contains(c); })) {
        // stagger children
        Array.prototype.forEach.call(el.children, function (child, i) {
          child.classList.add('reveal', 'd' + Math.min(i, 3));
          targets.push(child);
        });
      } else {
        el.classList.add('reveal');
        targets.push(el);
      }
    });
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 数字カウントアップ
  function countUp(el) {
    var to = parseInt(el.getAttribute('data-to'), 10);
    var prefix = el.getAttribute('data-prefix') || '';
    if (reduce) { el.textContent = prefix + to.toLocaleString(); return; }
    var dur = 1300, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.floor(to * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    document.querySelectorAll('.cnt').forEach(function (c) { cio.observe(c); });
  } else {
    document.querySelectorAll('.cnt').forEach(countUp);
  }

  // 強化パララックス（FV：スクロール多層 + マウス追従の深度 + デバイス3Dフロート）
  hero = document.querySelector('.hero');
  var layers = hero ? Array.prototype.slice.call(hero.querySelectorAll('[data-px],[data-sy],[data-tilt]')) : [];
  // パララックスはデスクトップのみ（モバイルでは無効化＝レイアウトのズレ/余白を防ぐ）
  if (hero && layers.length && !reduce && window.matchMedia('(min-width:821px)').matches) {
    var canHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    var mx = 0, my = 0, tmx = 0, tmy = 0, sy = window.scrollY || 0;
    if (canHover) {
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        tmx = (e.clientX - r.left) / r.width - 0.5;
        tmy = (e.clientY - r.top) / r.height - 0.5;
      });
      hero.addEventListener('mouseleave', function () { tmx = 0; tmy = 0; });
    }
    window.addEventListener('scroll', function () { sy = window.scrollY; }, { passive: true });
    var visible = true, ticking = false;
    function frame() {
      mx += (tmx - mx) * 0.09; my += (tmy - my) * 0.09;
      for (var i = 0; i < layers.length; i++) {
        var el = layers[i], d = el.dataset;
        var px = parseFloat(d.px || 0), py = parseFloat(d.py || d.px || 0);
        var s = parseFloat(d.sy || 0), tilt = parseFloat(d.tilt || 0);
        var tx = mx * px, ty = my * py + sy * s;
        var t = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0)';
        if (tilt) t += ' rotateX(' + (-my * tilt).toFixed(2) + 'deg) rotateY(' + (mx * tilt).toFixed(2) + 'deg)';
        if (d.rot) t += ' rotate(' + d.rot + 'deg)';
        el.style.transform = t;
      }
      if (visible) requestAnimationFrame(frame); else ticking = false;
    }
    function startFrame() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    // ヒーローが画面外なら rAF を止めて CPU/電池を節約
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) startFrame(); }, { threshold: 0 }).observe(hero);
    }
    startFrame();
  }

  // 3Dチルト（奥行き・立体・クリック感）
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.card, .badge').forEach(function (el) {
      el.classList.add('tilt');
      el.addEventListener('mousemove', function (ev) {
        var r = el.getBoundingClientRect();
        var rx = ((ev.clientY - r.top) / r.height - 0.5) * -6;
        var ry = ((ev.clientX - r.left) / r.width - 0.5) * 6;
        el.style.transform = 'translateY(-6px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

});
