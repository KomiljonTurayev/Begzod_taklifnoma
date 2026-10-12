/* ══════════════════════════════════════════════════
   Bekzodjon & Oydinaxon — Interaktiv Taklifnoma Mantiqi
   O'zbek to'y an'analari & zamonaviy yuqori texnologiyalar
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CFG = window.TOY || {};
  var $ = function (id) { return document.getElementById(id); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Toast bildirishnoma ───────────────────────── */
  var toastEl = $('toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-on');
    }, 3200);
  }

  /* ══════════ 1. MUHR (KIRISH EKRANI) ══════════ */
  var seal = $('seal'), sealBtn = $('sealBtn');
  var opened = false;

  // Havolada ism bo'lsa ko'rsatamiz: masalan, ?ism=Akmalbek yoki ?ism=Karimovlar+oilasi
  try {
    var q = new URLSearchParams(location.search);
    var who = (q.get('ism') || q.get('name') || '').trim().slice(0, 60);
    if (who) {
      $('sealTitle').textContent = who;
    }
  } catch (e) {
    /* Eski brauzer bo'lsa standart matn qoladi */
  }

  document.body.classList.add('is-locked');

  function buzz(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {}
  }

  /* Xoreografiya: muhr sinadi → oltin chang portlashi → parda ikki tomonga ochiladi → musiqa boshlanadi */
  function openInvite() {
    if (opened) return;
    opened = true;
    buzz(14);
    askGyro();

    if (reduced) {
      seal.classList.add('is-cracking', 'is-open', 'is-gone');
      document.body.classList.remove('is-locked');
      document.body.classList.add('opened');
      seal.setAttribute('aria-hidden', 'true');
      if (pref() !== 'off') musicOn(false);
      return;
    }

    seal.classList.add('is-cracking');
    var r = sealBtn.getBoundingClientRect();
    dust(r.left + r.width / 2, r.top + r.height / 2, 34, 65, 45);

    setTimeout(function () {
      seal.classList.add('is-open');
      document.body.classList.remove('is-locked');
      document.body.classList.add('opened');
      seal.setAttribute('aria-hidden', 'true');
      if (pref() !== 'off') musicOn(false);
    }, 430);

    setTimeout(function () {
      seal.classList.add('is-gone');
    }, 2600);
  }

  if (sealBtn) {
    sealBtn.addEventListener('click', openInvite);
  }
  window.__toyReady = true;

  /* ══════════ 2. MUSIQA PLEYERI ══════════ */
  var music = $('bgMusic'), musicBtn = $('musicBtn');
  var hasAudio = false, playing = false, fadeTimer = null, toldOnce = false;
  var VOL = 0.45, PREF = 'toy-music-bekzod';

  function pref() {
    try { return localStorage.getItem(PREF); } catch (e) { return null; }
  }
  function setPref(v) {
    try { localStorage.setItem(PREF, v); } catch (e) {}
  }

  var musicWanted = false;
  if (music) {
    music.addEventListener('loadedmetadata', function () {
      hasAudio = true;
      if (musicBtn) musicBtn.hidden = false;
      var hint = document.querySelector('.seal__music');
      if (hint) hint.hidden = false;
      if (musicWanted && pref() !== 'off') musicOn(false);
    });

    music.addEventListener('error', function () {
      hasAudio = false;
      if (musicBtn) musicBtn.hidden = true;
    });

    window.addEventListener('load', function () {
      setTimeout(function () {
        try { music.load(); } catch (e) {}
      }, 500);
    });
  }

  function paint(on) {
    playing = on;
    if (musicBtn) {
      musicBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      musicBtn.setAttribute('aria-label', on ? "Musiqani o'chirish" : 'Musiqani yoqish');
    }
  }

  /* Ovozni muloyim ko'taradi/pasaytiradi */
  function fade(to, after) {
    clearInterval(fadeTimer);
    if (reduced || !music) {
      if (music) music.volume = to;
      if (after) after();
      return;
    }
    var step = (to - music.volume) / 14;
    fadeTimer = setInterval(function () {
      var v = music.volume + step;
      if ((step > 0 && v >= to) || (step < 0 && v <= to) || !step) {
        music.volume = Math.min(1, Math.max(0, to));
        clearInterval(fadeTimer);
        if (after) after();
      } else {
        music.volume = Math.min(1, Math.max(0, v));
      }
    }, 45);
  }

  function musicOn(quiet) {
    if (!music) return;
    if (!hasAudio) {
      musicWanted = true;
      return;
    }
    music.volume = 0;
    music.play().then(function () {
      paint(true);
      setPref('on');
      fade(VOL);
      if (!quiet && !toldOnce) {
        toldOnce = true;
        toast("Musiqa yoqildi — o'chirish uchun yuqoridagi tugmani bosing");
      }
    }).catch(function () {
      paint(false);
    });
  }

  function musicOff() {
    if (!music) return;
    setPref('off');
    paint(false);
    fade(0, function () { music.pause(); });
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', function () {
      if (playing) { musicOff(); } else { musicOn(true); }
    });
  }

  /* Boshqa oynaga o'tganda jim turadi, qaytganda davom etadi */
  document.addEventListener('visibilitychange', function () {
    if (!hasAudio || !playing || !music) return;
    if (document.hidden) {
      music.pause();
    } else {
      music.play().catch(function () {});
    }
  });

  /* ══════════ 3. REVEAL (NAVATMA-NAVBAT OCHILISH) ══════════ */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      var order = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        if (!reduced) {
          el.style.transitionDelay = (order * 110) + 'ms';
          order++;
          el.addEventListener('transitionend', function te() {
            el.style.transitionDelay = '';
            el.removeEventListener('transitionend', te);
          });
        }
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });

    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ══════════ 4. SANOQ TAYMERI ══════════ */
  var target = new Date(CFG.date || '2026-11-04T17:30:00+05:00').getTime();
  var cdD = $('cdD'), cdH = $('cdH'), cdM = $('cdM'), cdS = $('cdS'), cdNote = $('cdNote');
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var cdTimer;

  function setNum(el, val) {
    if (!el || el.textContent === val) return;
    el.textContent = val;
    if (reduced || !el.animate) return;
    el.animate(
      [{ transform: 'translateY(.42em)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
      { duration: 480, easing: 'cubic-bezier(.22,1,.36,1)' }
    );
  }

  function tick() {
    var diff = target - Date.now();
    if (diff <= 0) {
      if (cdD) cdD.textContent = '00';
      if (cdH) cdH.textContent = '00';
      if (cdM) cdM.textContent = '00';
      if (cdS) cdS.textContent = '00';
      if (cdNote) cdNote.innerHTML = 'Baxtli kun keldi <span aria-hidden="true">❤</span>';
      clearInterval(cdTimer);
      return;
    }
    setNum(cdD, pad(Math.floor(diff / 86400000)));
    setNum(cdH, pad(Math.floor(diff / 3600000) % 24));
    setNum(cdM, pad(Math.floor(diff / 60000) % 60));
    setNum(cdS, pad(Math.floor(diff / 1000) % 60));
  }
  tick();
  cdTimer = setInterval(tick, 1000);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      clearInterval(cdTimer);
    } else {
      tick();
      cdTimer = setInterval(tick, 1000);
    }
  });

  /* ══════════ 5. KALENDAR ══════════ */
  (function () {
    var grid = $('calGrid');
    if (!grid) return;
    var d = new Date(target);
    var year = d.getFullYear(), month = d.getMonth(), theDay = d.getDate();

    ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].forEach(function (name) {
      var el = document.createElement('div');
      el.className = 'cal__dow';
      el.textContent = name;
      grid.appendChild(el);
    });

    var first = (new Date(year, month, 1).getDay() + 6) % 7;
    var total = new Date(year, month + 1, 0).getDate();

    for (var i = 0; i < first; i++) {
      var gap = document.createElement('div');
      gap.className = 'cal__day cal__day--empty';
      grid.appendChild(gap);
    }
    for (var day = 1; day <= total; day++) {
      var cell = document.createElement('div');
      cell.className = 'cal__day' + (day === theDay ? ' cal__day--on' : '');
      cell.textContent = day;
      grid.appendChild(cell);
    }
  })();

  /* ══════════ 6. KALENDAR FAYLI (.ICS) ══════════ */
  var icsBtn = $('icsBtn');
  if (icsBtn) {
    icsBtn.addEventListener('click', function () {
      var fmt = function (iso) {
        return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      };
      var uid = 'toy-bekzod-' + Date.now() + '@bekzod-toy.uz';
      var ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Bekzodjon Oydinaxon//Toy Taklifnoma//UZ',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        'UID:' + uid,
        'DTSTAMP:' + fmt(new Date().toISOString()),
        'DTSTART:' + fmt(CFG.date),
        'DTEND:' + fmt(CFG.endDate || CFG.date),
        'SUMMARY:' + (CFG.title || "Bekzodjon & Oydinaxon — Nikoh to'yi"),
        'LOCATION:' + (CFG.place || "«Billur» to'yxonasi, Shahrisabz shahar"),
        "DESCRIPTION:Bekzodjon va Oydinaxonning nikoh to'yi («Visol oqshomi»). Sizni kutamiz!",
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        "DESCRIPTION:Ertaga Bekzodjon va Oydinaxonning to'yi!",
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'bekzodjon-oydinaxon-toy.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast('Kalendar fayli yuklandi (.ics)');
    });
  }

  /* ══════════ 7. XARITA (GEO LOKATSIYA) ══════════ */
  (function () {
    var box = $('map'), loaded = false;
    if (!box) return;
    function load() {
      if (loaded) return;
      loaded = true;
      var f = document.createElement('iframe');
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.title = "«Billur» to'yxonasi joylashuvi";
      f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(CFG.mapQuery || 'Billur to\'yxonasi, Shahrisabz') + '&output=embed';
      f.addEventListener('load', function () {
        var s = box.querySelector('.map__skeleton');
        if (s) s.remove();
      });
      box.appendChild(f);
    }
    if ('IntersectionObserver' in window) {
      var mio = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { load(); mio.disconnect(); }
      }, { rootMargin: '300px' });
      mio.observe(box);
    } else {
      load();
    }
  })();

  /* ── Manzildan nusxa olish ── */
  var copyAddr = $('copyAddr');
  if (copyAddr) {
    copyAddr.addEventListener('click', function () {
      var text = CFG.place || ($('venueAddr') ? $('venueAddr').textContent : "«Billur» to'yxonasi, Shahrisabz");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          toast('Manzil nusxalandi');
        }, function () {
          toast(text);
        });
      } else {
        toast(text);
      }
    });
  }

  /* ══════════ 8. RASMLAR VA MONOGRAMMA MOSLASHUVI ══════════ */
  (function () {
    function whenReady(img, ok, fail) {
      if (!img) return;
      if (img.complete) {
        (img.naturalWidth > 0 ? ok : fail)();
        return;
      }
      img.addEventListener('load', ok);
      img.addEventListener('error', fail);
    }

    var arch = $('couplePhoto');
    if (arch) {
      whenReady(arch,
        function () {
          arch.hidden = false;
          var mono = $('archMono');
          if (mono) mono.hidden = true;
        },
        function () {
          arch.remove();
        }
      );
    }

    var band = $('bandPhoto');
    if (band) {
      whenReady(band,
        function () {
          var b = $('band');
          if (b) b.hidden = false;
          if (!reduced) buildThread();
        },
        function () {
          var b = $('band');
          if (b) b.remove();
        }
      );
    }
  })();

  /* ══════════ 9. RSVP (ISHTIROK TASDIG'I) ══════════ */
  var form = $('rsvpForm'), done = $('rsvpDone');
  var nameEl = $('rsvpName'), errEl = $('rsvpErr');
  var btnYes = $('btnYes'), btnNo = $('btnNo');
  var STORE = 'toy-rsvp-bekzod-v1';
  var chosen = 'yes';

  function visitorId() {
    var k = 'toy-vid-bekzod', v;
    try { v = localStorage.getItem(k); } catch (e) {}
    if (!v) {
      v = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem(k, v); } catch (e) {}
    }
    return v;
  }

  if (btnYes) btnYes.addEventListener('click', function () { chosen = 'yes'; });
  if (btnNo) btnNo.addEventListener('click', function () { chosen = 'no'; });

  function saveLocal(rec) {
    try { localStorage.setItem(STORE, JSON.stringify(rec)); } catch (e) {}
  }
  function readLocal() {
    try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { return null; }
  }

  function showDone(rec, celebrate) {
    if (!form || !done) return;
    form.hidden = true;
    done.hidden = false;
    var yes = rec.answer === 'yes';
    var first = (rec.name || '').split(' ')[0];
    var dtTitle = $('doneTitle');
    if (dtTitle) dtTitle.textContent = first ? 'Rahmat, ' + first + '!' : 'Katta rahmat!';
    var dtText = $('doneText');
    if (dtText) {
      dtText.innerHTML = yes
        ? 'Tashrifingiz yoshlarimiz va biz uchun katta baxt.<br>To\'yda ko\'rishguncha! ❤'
        : 'Samimiy tilak va duolaringiz uchun tashakkur.<br>Rahmat sizga! ❤';
    }
    var rcAns = $('rcAnswer');
    if (rcAns) rcAns.textContent = yes ? 'Albatta, kelamiz' : 'Kela olmaymiz';
    var rcN = $('rcName');
    if (rcN) rcN.textContent = rec.name || '—';
    syncWishUI(rec);
    if (celebrate) buzz(yes ? [12, 50, 16] : 10);
    if (yes && celebrate) goldDust();
  }

  var rsvpEdit = $('rsvpEdit');
  if (rsvpEdit) {
    rsvpEdit.addEventListener('click', function () {
      done.hidden = true;
      form.hidden = false;
      if (nameEl) nameEl.focus();
    });
  }

  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (errEl) errEl.hidden = true;

      var name = (nameEl ? nameEl.value : '').trim().replace(/\s+/g, ' ');
      var field = nameEl ? nameEl.closest('.field') : null;

      if (name.length < 2) {
        if (field) field.classList.add('has-err');
        var nErr = $('nameErr');
        if (nErr) nErr.hidden = false;
        if (nameEl) nameEl.focus();
        return;
      }
      if (field) field.classList.remove('has-err');
      var nameErrEl = $('nameErr');
      if (nameErrEl) nameErrEl.hidden = true;

      var hp = $('hp');
      var rec = {
        vid: visitorId(),
        name: name,
        answer: chosen,
        at: new Date().toISOString(),
        website: hp ? hp.value : ''
      };

      if (btnYes) btnYes.disabled = true;
      if (btnNo) btnNo.disabled = true;

      // Brauzer xotirasiga saqlash
      saveLocal(rec);
      showDone(rec, true);

      if (btnYes) btnYes.disabled = false;
      if (btnNo) btnNo.disabled = false;
    });
  }

  var prev = readLocal();
  if (prev && prev.answer) {
    showDone(prev, false);
    if (nameEl) nameEl.value = prev.name || '';
    chosen = prev.answer;
  }

  /* ══════════ 10. MAKTUBLAR REJIMI ══════════ */
  var UZ_OY = ['yanvar','fevral','mart','aprel','may','iyun',
               'iyul','avgust','sentabr','oktabr','noyabr','dekabr'];

  var lettersEl = $('letters'), letterCard = $('letterCard');
  var lIdx = 0, lOpen = false;

  function lDate(raw) {
    if (!raw) return '';
    var d = new Date(String(raw).replace(' ', 'T') + (String(raw).indexOf('Z') < 0 ? 'Z' : ''));
    if (isNaN(d)) return '';
    return d.getDate() + '-' + UZ_OY[d.getMonth()] + ' ' + d.getFullYear();
  }

  function lRender(dir) {
    var w = ribbonItems[lIdx];
    if (!w) return;
    var paint = function () {
      var lb = $('letterBody'), ln = $('letterName'), ld = $('letterDate'), lc = $('letterCount');
      if (lb) lb.textContent = w.wish || '';
      if (ln) ln.textContent = w.name || '—';
      if (ld) ld.textContent = lDate(w.at || new Date().toISOString());
      if (lc) lc.textContent = (lIdx + 1) + ' / ' + ribbonItems.length;
      var lp = $('letterPrev'), lnext = $('letterNext');
      if (lp) lp.disabled = lIdx === 0;
      if (lnext) lnext.disabled = lIdx === ribbonItems.length - 1;
    };

    if (!dir || reduced || !letterCard) {
      paint();
      return;
    }
    letterCard.classList.add(dir > 0 ? 'is-out-l' : 'is-out-r');
    setTimeout(function () {
      paint();
      letterCard.classList.remove('is-out-l', 'is-out-r');
      letterCard.classList.add(dir > 0 ? 'is-out-r' : 'is-out-l');
      void letterCard.offsetWidth;
      letterCard.classList.remove('is-out-l', 'is-out-r');
    }, 300);
  }

  function lGo(step) {
    var next = lIdx + step;
    if (next < 0 || next >= ribbonItems.length) return;
    lIdx = next;
    lRender(step);
    var hint = $('lettersHint');
    if (hint) hint.style.opacity = '0';
  }

  function lOpenAt(i) {
    if (!ribbonItems.length || !lettersEl) return;
    lIdx = Math.max(0, Math.min(ribbonItems.length - 1, i || 0));
    lettersEl.hidden = false;
    document.body.classList.add('is-locked');
    lOpen = true;
    lRender(0);
    void lettersEl.offsetWidth;
    lettersEl.classList.add('is-on');
  }

  function lClose() {
    if (!lettersEl) return;
    lettersEl.classList.remove('is-on');
    lOpen = false;
    document.body.classList.remove('is-locked');
    setTimeout(function () { lettersEl.hidden = true; }, reduced ? 0 : 380);
  }

  var wishAll = $('wishAll'), lettersX = $('lettersX'), letterPrev = $('letterPrev'), letterNext = $('letterNext');
  if (wishAll) wishAll.addEventListener('click', function () { lOpenAt(0); });
  if (lettersX) lettersX.addEventListener('click', lClose);
  if (letterPrev) letterPrev.addEventListener('click', function () { lGo(-1); });
  if (letterNext) letterNext.addEventListener('click', function () { lGo(1); });

  document.addEventListener('keydown', function (e) {
    if (!lOpen) return;
    if (e.key === 'Escape') lClose();
    else if (e.key === 'ArrowLeft') lGo(-1);
    else if (e.key === 'ArrowRight') lGo(1);
  });

  // Sensor ekranlarda surish (Swipe)
  (function () {
    if (!lettersEl) return;
    var x0 = null, y0 = null;
    lettersEl.addEventListener('touchstart', function (e) {
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, { passive: true });
    lettersEl.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
      lGo(dx < 0 ? 1 : -1);
    }, { passive: true });
  })();

  /* ══════════ 11. OLTIN CHANG VA KONFETTI ══════════ */
  function dust(cx, cy, n, spread, fall) {
    if (reduced || !document.body.animate) return;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('i');
      p.className = 'dust';
      var size = 3 + Math.random() * 5.5;
      p.style.width = p.style.height = size.toFixed(1) + 'px';
      p.style.opacity = (0.35 + Math.random() * 0.55).toFixed(2);
      document.body.appendChild(p);

      var ang = Math.random() * Math.PI * 2;
      var dist = spread + Math.random() * spread * 2.6;
      p.animate([
        { transform: 'translate(' + cx + 'px,' + cy + 'px) scale(.4)', opacity: 1 },
        {
          transform: 'translate(' + (cx + Math.cos(ang) * dist) + 'px,' +
            (cy + Math.sin(ang) * dist + fall) + 'px) scale(1)', opacity: 0
        }
      ], { duration: 1400 + Math.random() * 900, easing: 'cubic-bezier(.2,.7,.4,1)' })
        .onfinish = (function (node) { return function () { node.remove(); }; })(p);
    }
  }

  function goldDust() {
    if (!done) return;
    var rect = done.getBoundingClientRect();
    dust(rect.left + rect.width / 2, rect.top + 60, 30, 75, 140);
  }

  /* ══════════ 12. OLTIN IP (INTERAKTIV BOG'LAMA) ══════════ */
  var threadPath = null, threadRect = null, threadLen = 0;
  var threadNodes = [], threadEnd = null;

  function buildThread() {
    var main = $('main');
    if (!main) return;
    var old = main.querySelector('.thread');
    if (old) old.remove();

    var W = main.clientWidth, H = main.scrollHeight;
    var hero = $('hero');
    if (!hero) return;
    var startY = hero.offsetTop + hero.offsetHeight - 30;
    var secs = ['taklif', 'sanoq', 'kalendar', 'manzil', 'dastur', 'band', 'wishes', 'rsvp']
      .map(function (id) { return $(id); })
      .filter(function (el) { return el && !el.hidden; });

    var pts = [[W / 2, startY]];
    var amp = Math.min(96, W * 0.2);

    var ys = secs
      .map(function (sec) { return sec.offsetTop + Math.min(44, sec.offsetHeight * 0.12); })
      .filter(function (y) { return y > startY + 60; })
      .sort(function (a, b) { return a - b; });

    var side = 1;
    ys.forEach(function (y) {
      var dy = y - pts[pts.length - 1][1];
      if (dy < 90) return;
      var a = Math.min(amp, dy * 0.38);
      pts.push([W / 2 + side * a, y]);
      side = -side;
    });
    pts.push([W / 2, H - 40]);
    if (pts.length < 3) return;

    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      var midY = (pts[i - 1][1] + pts[i][1]) / 2;
      d += ' C ' + pts[i - 1][0] + ' ' + midY + ', ' + pts[i][0] + ' ' + midY +
           ', ' + pts[i][0] + ' ' + pts[i][1];
    }

    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'thread');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('aria-hidden', 'true');
    svg.style.height = H + 'px';

    var clip = document.createElementNS(NS, 'clipPath');
    clip.setAttribute('id', 'threadClip');
    threadRect = document.createElementNS(NS, 'rect');
    threadRect.setAttribute('x', 0);
    threadRect.setAttribute('y', 0);
    threadRect.setAttribute('width', W);
    threadRect.setAttribute('height', 0);
    clip.appendChild(threadRect);

    threadPath = document.createElementNS(NS, 'path');
    threadPath.setAttribute('class', 'thread__line');
    threadPath.setAttribute('d', d);
    threadPath.setAttribute('clip-path', 'url(#threadClip)');

    svg.appendChild(clip);
    svg.appendChild(threadPath);

    function mk(tag, attrs) {
      var el = document.createElementNS(NS, tag);
      for (var a in attrs) el.setAttribute(a, attrs[a]);
      return el;
    }

    threadNodes = [];
    for (var k = 1; k < pts.length - 1; k++) {
      var pos = mk('g', { transform: 'translate(' + pts[k][0] + ',' + pts[k][1] + ')' });
      var node = mk('g', { 'class': 'thread__node' });
      node.appendChild(mk('circle', { r: 10, 'class': 'thread__halo' }));
      node.appendChild(mk('path', { d: 'M0 -5.5 5.5 0 0 5.5 -5.5 0Z', 'class': 'thread__dia' }));
      pos.appendChild(node);
      svg.appendChild(pos);
      node.dataset.y = pts[k][1];
      threadNodes.push(node);
    }

    var last = pts[pts.length - 1];
    var endPos = mk('g', { transform: 'translate(' + last[0] + ',' + last[1] + ')' });
    var end = mk('g', { 'class': 'thread__end' });
    end.appendChild(mk('path', { d: 'M-96 0 H-39 M39 0 H96', 'class': 'thread__end-wing' }));
    end.appendChild(mk('path', { d: 'M-18 0 -27 -6 -27 6Z M18 0 27 -6 27 6Z', 'class': 'thread__end-tip' }));
    end.appendChild(mk('path', { d: 'M0 -9 9 0 0 9 -9 0Z', 'class': 'thread__end-dia' }));
    endPos.appendChild(end);
    svg.appendChild(endPos);
    end.dataset.y = last[1];
    threadEnd = end;

    main.insertBefore(svg, main.firstChild);
    threadLen = H;
    paintThread();
  }

  var lastThread = 0, threadTimer = null;
  function paintThread() {
    if (!threadRect || !threadLen) return;
    var goal = Math.max(0, Math.min(threadLen,
      (window.scrollY || 0) + window.innerHeight * 0.78));
    threadRect.setAttribute('height', goal.toFixed(0));

    for (var i = 0; i < threadNodes.length; i++) {
      var n = threadNodes[i];
      if (!n.__lit && goal >= (+n.dataset.y) - 8) {
        n.__lit = true;
        n.classList.add('is-lit');
      }
    }
    if (threadEnd && !threadEnd.__lit && goal >= (+threadEnd.dataset.y) - 8) {
      threadEnd.__lit = true;
      threadEnd.classList.add('is-lit');
    }
  }

  function queueThread() {
    var now = Date.now();
    if (now - lastThread >= 100) {
      lastThread = now;
      paintThread();
      return;
    }
    if (threadTimer) return;
    threadTimer = setTimeout(function () {
      threadTimer = null;
      lastThread = Date.now();
      paintThread();
    }, 100);
  }

  if (!reduced) {
    window.addEventListener('scroll', queueThread, { passive: true });
    window.addEventListener('load', function () { buildThread(); });
    var rsz;
    window.addEventListener('resize', function () {
      clearTimeout(rsz);
      rsz = setTimeout(function () { buildThread(); }, 250);
    });
  }

  /* ══════════ 13. HERO ZARRALARI ══════════ */
  (function () {
    if (reduced) return;
    var hero = $('hero');
    if (!hero) return;
    for (var i = 0; i < 14; i++) {
      var s = document.createElement('i');
      s.className = 'spark';
      var size = (1.6 + Math.random() * 2.8).toFixed(1);
      s.style.width = s.style.height = size + 'px';
      s.style.left = (3 + Math.random() * 94).toFixed(1) + '%';
      s.style.setProperty('--sd', (9 + Math.random() * 9).toFixed(1) + 's');
      s.style.setProperty('--sdel', (-Math.random() * 14).toFixed(1) + 's');
      s.style.setProperty('--sx', ((Math.random() - 0.5) * 70).toFixed(0) + 'px');
      hero.appendChild(s);
    }
  })();

  /* ══════════ 14. GIROSKOP VA SICHQONCHA PARALLAKSI ══════════ */
  var gyroBase = null;
  function onTilt(ev) {
    if (ev.beta == null || ev.gamma == null) return;
    if (gyroBase === null) gyroBase = { b: ev.beta, g: ev.gamma };
    var dx = Math.max(-10, Math.min(10, (ev.gamma - gyroBase.g) * 0.45));
    var dy = Math.max(-10, Math.min(10, (ev.beta - gyroBase.b) * 0.45));
    var img = $('couplePhoto') || $('archMono');
    if (!img) return;
    img.style.setProperty('--px', dx.toFixed(1) + 'px');
    img.style.setProperty('--py', dy.toFixed(1) + 'px');
  }

  function askGyro() {
    if (reduced) return;
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(function (st) {
          if (st === 'granted') window.addEventListener('deviceorientation', onTilt);
        }).catch(function () {});
      } else if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', onTilt);
      }
    } catch (e) {}
  }

  if (!reduced && window.matchMedia('(hover:hover)').matches) {
    document.addEventListener('mousemove', function (ev) {
      var el = $('couplePhoto') || $('archMono');
      if (!el || el.hidden) return;
      var dx = ((ev.clientX / window.innerWidth) - 0.5) * 16;
      var dy = ((ev.clientY / window.innerHeight) - 0.5) * 16;
      el.style.setProperty('--px', dx.toFixed(1) + 'px');
      el.style.setProperty('--py', dy.toFixed(1) + 'px');
    }, { passive: true });
  }

  /* ══════════ 15. TILAKLAR VA LENTA ══════════ */
  var wishBox = $('wishBox'), wishText = $('wishText'), wishSend = $('wishSend');
  var wishDone = $('wishDone'), wishCount = $('wishCount');

  // Samimiy, go'zal to'y tilaklari
  var defaultWishes = [];

  var WISH_STORE = 'toy-wishes-bekzod-v1';
  function getStoredWishes() {
    try {
      var s = localStorage.getItem(WISH_STORE);
      return s ? JSON.parse(s) : [];
    } catch (e) {
      return [];
    }
  }
  function saveStoredWishes(list) {
    try {
      localStorage.setItem(WISH_STORE, JSON.stringify(list));
    } catch (e) {}
  }

  var ribbonItems = getStoredWishes().concat(defaultWishes);

  function loadWishesFromAPI() {
    if (!CFG.api) return;
    fetch(CFG.api + '/wishes.json')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data) return;
        var arr = [];
        for (var k in data) arr.push(data[k]);
        arr.sort(function(a, b) { return new Date(b.at) - new Date(a.at); });
        ribbonItems = arr.concat(defaultWishes);
        renderRibbon();
      })
      .catch(function(e) { console.error('Baza xatosi:', e); });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function syncWishUI(rec) {
    if (!wishBox) return;
    if (rec && rec.wish) {
      wishBox.hidden = true;
      if (wishDone) wishDone.hidden = false;
    } else {
      wishBox.hidden = false;
      if (wishDone) wishDone.hidden = true;
    }
  }

  if (wishText && wishCount) {
    wishText.addEventListener('input', function () {
      wishCount.textContent = wishText.value.length + ' / 200';
    });
  }

  if (wishSend) {
    wishSend.addEventListener('click', function () {
      var w = (wishText ? wishText.value : '').trim().replace(/[ \t]+/g, ' ');
      if (w.length < 3) {
        if (wishText) wishText.focus();
        return;
      }
      wishSend.disabled = true;

      var rec = readLocal() || {};
      rec.wish = w;
      saveLocal(rec);
      syncWishUI(rec);
      buzz([10, 40, 12]);

      var newWish = {
        name: rec.name || 'Mehmonimiz',
        wish: w,
        at: new Date().toISOString()
      };

      if (CFG.api) {
        fetch(CFG.api + '/wishes.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWish)
        }).catch(function(e) { console.error('Saqlash xatosi:', e); });
      }

      var userWishes = getStoredWishes();
      userWishes.unshift(newWish);
      saveStoredWishes(userWishes);

      addWishCard(newWish, true);
      toast("Samimiy tilagingiz qabul qilindi!");
      wishSend.disabled = false;
    });
  }

  function addWishCard(item, prepend) {
    if (prepend) ribbonItems.unshift(item); else ribbonItems.push(item);
    renderRibbon();
  }

  function card(w) {
    return '<div class="wishcard"><b>' + esc(w.name) + '</b><p>' + esc(w.wish) + '</p></div>';
  }

  function fillRow(rowEl, trackEl, items) {
    if (!rowEl || !trackEl) return;
    if (!items.length) { rowEl.hidden = true; return; }
    rowEl.hidden = false;
    var one = items.map(card).join('');
    var html = one, copies = 1;
    trackEl.innerHTML = html;
    var need = (window.innerWidth || 360) * 2;
    while ((copies < 2 || (trackEl.scrollWidth && trackEl.scrollWidth < need)) && copies < 8) {
      html += one;
      copies++;
      trackEl.innerHTML = html;
    }
    rowEl.dataset.copies = copies;
    rowEl.dataset.unit = trackEl.scrollWidth
      ? Math.round(trackEl.scrollWidth / copies) : 0;
  }

  function renderRibbon() {
    var sec = $('wishes');
    if (!sec || !ribbonItems.length) {
      if (sec) sec.hidden = true;
      return;
    }
    var firstRender = sec.hidden;
    sec.hidden = false;

    var a = [], b = [];
    if (ribbonItems.length <= 5) {
      a = ribbonItems.slice();
    } else {
      ribbonItems.forEach(function (w, i) { (i % 2 ? b : a).push(w); });
    }
    fillRow($('rib1'), $('ribTrack1'), a);
    fillRow($('rib2'), $('ribTrack2'), b);

    var cnt = $('wishAllN');
    if (cnt) cnt.textContent = '· ' + ribbonItems.length;

    if (firstRender || !driftOn) {
      if (io) {
        sec.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
      }
      if (!reduced) buildThread();
      startDrift();
    }
  }

  // Lentadagi kartaga bosilganda to'liq maktub modalini ochish
  ['rib1', 'rib2'].forEach(function (id) {
    var row = $(id);
    if (!row) return;
    row.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('.wishcard');
      if (!c) return;
      var nm = c.querySelector('b');
      var key = nm ? nm.textContent : '';
      for (var i = 0; i < ribbonItems.length; i++) {
        if (ribbonItems[i].name === key) {
          lOpenAt(i);
          return;
        }
      }
      lOpenAt(0);
    });
  });

  var driftOn = false;
  var SPEED = 27;
  function startDrift() {
    if (driftOn || reduced) return;
    driftOn = true;

    var rows = [
      { el: $('rib1'), dir: 1, inited: false },
      { el: $('rib2'), dir: -1, inited: false }
    ];

    var sec = $('wishes');
    function onScreen() {
      if (!sec) return false;
      var r = sec.getBoundingClientRect();
      return r.bottom > -120 && r.top < (window.innerHeight || 0) + 120;
    }

    var last = Date.now();
    setInterval(function () {
      var now = Date.now();
      var dt = Math.min(100, now - last);
      last = now;
      if (!onScreen()) return;

      var step = SPEED * dt / 1000;
      rows.forEach(function (r) {
        if (!r.el || r.el.hidden) return;
        var copies = parseInt(r.el.dataset.copies, 10) || 1;
        var unit = Math.round(r.el.scrollWidth / copies);
        if (!unit || r.el.scrollWidth <= r.el.clientWidth + 4) return;
        if (!r.inited) {
          r.inited = true;
          if (r.dir < 0) r.el.scrollLeft = unit;
        }
        var x = r.el.scrollLeft + r.dir * step;
        if (x >= unit) x -= unit; else if (x <= 0) x += unit;
        r.el.scrollLeft = x;
      });
    }, 30);
  }

  // Dastlabki ishga tushirish
  if (prev && prev.answer) syncWishUI(prev);
  loadWishesFromAPI();
  renderRibbon();
})();

// Rasmlarni yuklab olishdan himoyalash
document.addEventListener('contextmenu', function(e) {
  if (e.target.tagName === 'IMG' || window.getComputedStyle(e.target).backgroundImage !== 'none') {
    e.preventDefault();
  }
});
