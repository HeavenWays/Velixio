    // Pricing tabs
    function switchPricingTab(tab, btn) {
      document.querySelectorAll('.ptab2').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.pricing-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + tab).classList.add('active');
    }

    // Progress bar (rAF throttled)
    (function () {
      if (window.__velixioProgressBound) return;
      window.__velixioProgressBound = true;
      let scheduled = false;
      function update() {
        scheduled = false;
        const d = document.documentElement;
        const denom = (d.scrollHeight - d.clientHeight) || 1;
        const pct = (d.scrollTop / denom) * 100;
        const progress = document.getElementById('progress');
        if (progress) progress.style.width = pct + '%';
        const nav = document.getElementById('navbar');
        if (nav) nav.classList.toggle('scrolled', d.scrollTop > 50);
      }
      window.addEventListener('scroll', function () {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(update);
      }, { passive: true });
      requestAnimationFrame(update);
    })();

    // FAQ — accordéon fluide
    function toggleFaq(el) {
      const item = el.parentElement;
      const isOpen = item.classList.contains('open');
      // Ferme tous les autres
      document.querySelectorAll('.faq-item.open').forEach(function(i) {
        i.classList.remove('open');
        var arrow = i.querySelector('.faq-arrow');
        if (arrow) arrow.textContent = '+';
      });
      // Ouvre ou ferme l'item cliqué
      if (!isOpen) {
        item.classList.add('open');
        var arrow = el.querySelector('.faq-arrow');
        if (arrow) arrow.textContent = '×';
      }
    }
    
    // Initialisation FAQ au chargement DOM
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.faq-q').forEach(function(q) {
        q.style.cursor = 'pointer';
      });
    });

    // Portfolio tabs
    document.querySelectorAll('.ptab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

    // Pricing toggle
    let isMonthly = false;
    const prices = { p1: [3900, 2925], p2: [7900, 5925], p3: [14900, 11175] };
    function togglePrice() {
      isMonthly = !isMonthly;
      document.getElementById('ptog').classList.toggle('on', isMonthly);
      for (const [id, vals] of Object.entries(prices)) {
        const el = document.getElementById(id);
        if (el) el.textContent = vals[isMonthly ? 1 : 0].toLocaleString('fr-FR');
      }
    }

    // Clocks
    function updateClocks() {
      try {
        var now = new Date();
        var fmt = function (tz) { return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(now); };
        var mk = document.getElementById('clk-mk');
        var fr = document.getElementById('clk-fr');
        var ca = document.getElementById('clk-ca');
        if (mk) mk.textContent = fmt('Africa/Casablanca');
        if (fr) fr.textContent = fmt('Europe/Paris');
        if (ca) ca.textContent = fmt('America/Montreal');
      } catch (e) { }
    }
    updateClocks();
    setInterval(updateClocks, 30000);

    // ✦.✦✦.✦✦.✦ ENHANCED ANIMATIONS & INTERACTIONS ✦.✦✦.✦✦.✦


    // Staggered reveal for grid children
    const staggerObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const children = entry.target.children;
          Array.from(children).forEach((child, i) => {
            child.style.transition = 'opacity .55s cubic-bezier(.4,0,.2,1) ' + (i * 0.08) + 's, transform .55s cubic-bezier(.4,0,.2,1) ' + (i * 0.08) + 's';
            child.style.opacity = '1';
            child.style.transform = 'translateY(0)';
          });
          staggerObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.services-grid, .how-steps, .pricing-grid, .maint-grid, .testi-grid, .faq-grid, .footer-grid, .metrics-grid, .hero-stats, .clocks').forEach(grid => {
      staggerObs.observe(grid);
    });


    // ✦.✦✦.✦✦.✦ FORMULAIRE CONTACT — Firebase Firestore ✦.✦✦.✦✦.✦
    async function sendForm(e) {
      e.preventDefault();
      var btn = document.getElementById('cf-btn');
      var ok  = document.getElementById('cf-ok');
      var err = document.getElementById('cf-err');

      // ── Vérification honeypot anti-bot ──
      var honeypot = document.getElementById('cf-website');
      if (honeypot && honeypot.value) return; // Bot détecté, on ignore silencieusement

      // ── Rate limiting ──
      var rl = checkRateLimit();
      if (!rl.allowed) {
        err.textContent = '⚠️ Trop de tentatives. Réessayez dans ' + rl.remaining + ' minute(s).';
        err.style.display = 'block'; ok.style.display = 'none'; return;
      }

      var prenom  = sanitizeInput((document.getElementById('cf-prenom')  || { value: '' }).value, 50);
      var nom     = sanitizeInput((document.getElementById('cf-nom')     || { value: '' }).value, 50);
      var email   = ((document.getElementById('cf-email')   || { value: '' }).value).trim().slice(0,200);
      var tel     = sanitizeInput((document.getElementById('cf-tel')     || { value: '' }).value, 30);
      var projet  = sanitizeInput((document.getElementById('cf-projet')  || { value: '' }).value, 80);
      var plan    = sanitizeInput((document.getElementById('cf-plan')    || { value: '' }).value, 40);
      var msg     = sanitizeInput((document.getElementById('cf-msg')     || { value: '' }).value, 2000);

      // ── Validations ──
      if (!email || !msg) {
        err.textContent = '⚠️ Merci de renseigner au minimum votre email et votre message.';
        err.style.display = 'block'; ok.style.display = 'none'; return;
      }

      var emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRx.test(email)) {
        err.textContent = '⚠️ Adresse email invalide.';
        err.style.display = 'block'; ok.style.display = 'none'; return;
      }

      if (msg.length < 10) {
        err.textContent = '⚠️ Votre message est trop court (minimum 10 caractères).';
        err.style.display = 'block'; ok.style.display = 'none'; return;
      }

      btn.textContent = 'Envoi en cours…'; btn.disabled = true;
      ok.style.display = 'none'; err.style.display = 'none';

      try {
        // ── Envoi vers Firestore ──
        await db.collection(CONTACTS_COL).add({
          name:       (prenom + ' ' + nom).trim() || '—',
          email:      email,
          phone:      tel || null,
          subject:    projet || 'Demande de devis',
          message:    msg,
          plan:       plan || null,
          status:     'new',
          source:     'site_contact',
          created_at: firebase.firestore.FieldValue.serverTimestamp(),
          created_at_iso: new Date().toISOString()
        });

        btn.textContent = 'Envoyé ✓'; btn.disabled = false;
        ok.style.display = 'block';

        // Réinitialiser le formulaire
        ['cf-prenom','cf-nom','cf-email','cf-tel','cf-msg'].forEach(function(id) {
          var el = document.getElementById(id); if (el) el.value = '';
        });
        if (document.getElementById('cf-projet')) document.getElementById('cf-projet').selectedIndex = 0;
        if (document.getElementById('cf-plan'))   document.getElementById('cf-plan').selectedIndex = 0;

        setTimeout(function () {
          btn.textContent = 'Envoyer ma demande →';
          ok.style.display = 'none';
        }, 5000);

      } catch (ex) {
        console.error('Erreur Firestore:', ex);
        btn.textContent = 'Envoyer ma demande →'; btn.disabled = false;
        err.innerHTML = 'Erreur réseau — <a href="https://wa.me/212674323871" style="color:#f87171">contactez-nous sur WhatsApp ↗</a>';
        err.style.display = 'block';
      }
    }


    /* ✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦
       ANIMATIONS JS — VELIXIO PREMIUM
       ✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦✦.✦ */

    //  1. PAGE LOADER 
    (function () {
      var loader = document.getElementById('vx-loader');
      if (!loader) return;
      function hide() {
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        loader.style.pointerEvents = 'none';
        setTimeout(function () { loader.style.display = 'none'; }, 650);
      }
      // Se cache dans tous les cas : load OU timeout 1.8s
      var hidden = false;
      function safeHide() { if (!hidden) { hidden = true; hide(); } }
      window.addEventListener('load', function () { setTimeout(safeHide, 1200); });
      setTimeout(safeHide, 1800); // fallback absolu
      // Fallback ultime si tout plante
      setTimeout(function () { if (loader) loader.style.display = 'none'; }, 3000);
    })();

    //  2. CURSOR GLOW 
    (function () {
      var glow = document.getElementById('cursor-glow');
      if (!glow) return;
      var mx = 0, my = 0, cx = 0, cy = 0, visible = false;
      document.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        if (!visible) { glow.style.opacity = '1'; visible = true; }
      });
      document.addEventListener('mouseleave', function () { glow.style.opacity = '0'; visible = false; });
      function loop() {
        cx += (mx - cx) * 0.12; cy += (my - cy) * 0.12;
        // transform-only to avoid layout thrash
        glow.style.transform = 'translate3d(' + (cx - 170) + 'px,' + (cy - 170) + 'px,0)';
        requestAnimationFrame(loop);
      }
      loop();
    })();

    //  3. SCROLL REVEAL 
    (function () {
      var rvObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); rvObs.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.rv,.rv-left,.rv-right,.rv-scale').forEach(function (el) { rvObs.observe(el); });

      var stObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); stObs.unobserve(e.target); }
        });
      }, { threshold: 0.08 });
      document.querySelectorAll('.rv-stagger').forEach(function (g) { stObs.observe(g); });
    })();


    //  5. COUNTER ANIMATION 
    (function () {
      try {
        var statsEl = document.querySelector('.hero-stats');
        if (!statsEl) return;
        var fired = false;
        var cObs = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting && !fired) {
            fired = true;
            document.querySelectorAll('.stat-num').forEach(function (el) {
              try {
                var span = el.querySelector('span');
                var suffix = span ? span.textContent : '';
                // Retirer le span pour lire le nombre proprement
                var clone = el.cloneNode(true);
                var sp = clone.querySelector('span');
                if (sp) sp.remove();
                var raw = clone.textContent.trim();
                var match = raw.match(/([0-9.]+)/);
                if (!match) return;
                var target = parseFloat(match[1]);
                var isFloat = match[1].includes('.');
                var dur = 2000; var start = performance.now();
                function tick(now) {
                  var p = Math.min((now - start) / dur, 1);
                  var ease = 1 - Math.pow(1 - p, 3);
                  var val = isFloat ? (target * ease).toFixed(1) : Math.floor(target * ease);
                  el.innerHTML = val + (suffix ? '<span>' + suffix + '</span>' : '');
                  if (p < 1) requestAnimationFrame(tick);
                }
                requestAnimationFrame(tick);
              } catch (e) { }
            });
          }
        }, { threshold: 0.5 });
        cObs.observe(statsEl);
      } catch (e) { }
    })();

    //  6. PARALLAX HERO ORBS 
    (function () {
      var orb1 = document.querySelector('.hero-orb1');
      var orb2 = document.querySelector('.hero-orb2');
      if (!orb1 || !orb2) return;
      var scheduled = false;
      function update() {
        scheduled = false;
        var y = window.scrollY || 0;
        if (y > 700) return;
        orb1.style.transform = 'translate3d(0,' + (y * 0.18) + 'px,0)';
        orb2.style.transform = 'translate3d(0,' + (-y * 0.12) + 'px,0)';
      }
      window.addEventListener('scroll', function () {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(update);
      }, { passive: true });
      requestAnimationFrame(update);
    })();

    //  7. TILT 3D sur les cartes — version précise sans décalage 
    (function () {
      // Tilt subtil uniquement sur les grandes cartes isolées
      document.querySelectorAll('.metric-card, .testi-card, .price-card').forEach(function (card) {
        var isHover = false;
        card.addEventListener('mouseenter', function () { isHover = true; });
        card.addEventListener('mousemove', function (e) {
          if (!isHover) return;
          var r = this.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          // Très faible angle, combiné avec le scale CSS
          this.style.transform = 'perspective(900px) rotateY(' + (x * 4) + 'deg) rotateX(' + (-y * 4) + 'deg) translateZ(14px) scale(1.04)';
        });
        card.addEventListener('mouseleave', function () {
          isHover = false;
          this.style.transition = 'transform .5s cubic-bezier(.175,.885,.32,1.275)';
          this.style.transform = '';
          var self = this; setTimeout(function () { self.style.transition = ''; }, 500);
        });
      });
    })();

    //  8. SMOOTH SCROLL 
    (function () {
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var target = document.querySelector(this.getAttribute('href'));
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    })();

    //  9. NAV scroll effect (handled by class toggle above)

    //  10. MAGNETIC HOVER CTA — subtle, 0.10 strength 
    (function () {
      document.querySelectorAll('.nav-cta,.btn-primary').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
          var r = this.getBoundingClientRect();
          var x = (e.clientX - r.left - r.width / 2) * 0.10;
          var y = (e.clientY - r.top - r.height / 2) * 0.10;
          this.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        });
        btn.addEventListener('mouseleave', function () {
          this.style.transition = 'transform .5s cubic-bezier(.175,.885,.32,1.275)';
          this.style.transform = '';
          var self = this; setTimeout(function () { self.style.transition = ''; }, 500);
        });
      });
    })();

    // 11. (floating CTA supprimé)

    // 12. SPARKLE au clic sur les CTAs principaux
    (function () {
      function spawnSparkles(e) {
        var colors = ['#E8BF45','#C8A020','#fff','#F5D876'];
        for (var i = 0; i < 8; i++) {
          var s = document.createElement('div');
          s.className = 'vx-sparkle';
          var angle = (Math.PI * 2 / 8) * i;
          var dist = 28 + Math.random() * 20;
          s.style.left = (e.clientX - 3) + 'px';
          s.style.top  = (e.clientY - 3) + 'px';
          s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
          s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
          s.style.background = colors[i % colors.length];
          s.style.animationDelay = (Math.random() * .08) + 's';
          document.body.appendChild(s);
          setTimeout(function (el) { el.remove(); }, 700, s);
        }
      }
      document.querySelectorAll('.btn-primary,.plan-cta,.gold-cta').forEach(function (btn) {
        btn.addEventListener('click', spawnSparkles);
      });
    })();

    // 13. PLAN CARDS HOVER — classe .vx-hovered injectée par JS, contourne tous conflits CSS
    (function () {
      document.querySelectorAll('.plan-card, .price-card').forEach(function (card) {
        card.addEventListener('mouseenter', function () {
          this.classList.add('vx-hovered');
        });
        card.addEventListener('mouseleave', function () {
          this.classList.remove('vx-hovered');
        });
      });
    })();

    // 14. VS SECTION — animation staggered des items au scroll
    (function () {
      function animateVS() {
        // Cartes
        document.querySelectorAll('.vs-card').forEach(function (card, i) {
          setTimeout(function () { card.classList.add('vx-in'); }, i * 200);
        });
        // Badge VS
        var badge = document.querySelector('.vs-vs-badge');
        if (badge) setTimeout(function () { badge.classList.add('vx-in'); }, 100);
        // Items avec stagger
        document.querySelectorAll('.vs-item').forEach(function (item, i) {
          setTimeout(function () { item.classList.add('vx-in'); }, 300 + i * 80);
        });
        // Proof items
        document.querySelectorAll('.vs-proof-item').forEach(function (item, i) {
          setTimeout(function () { item.classList.add('vx-in'); }, 200 + i * 90);
        });
      }
      var vsSection = document.getElementById('vs');
      if (!vsSection) return;
      var fired = false;
      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !fired) {
          fired = true;
          animateVS();
        }
      }, { threshold: 0.08 });
      obs.observe(vsSection);
    })();

    // 15. CANVAS PARTICULES — points dorés ambiants flottants
    (function () {
      var canvas = document.getElementById('vx-particles');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var W, H, pts = [];
      var N = 55;

      function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize, { passive: true });

      function rand(a, b) { return a + Math.random() * (b - a); }

      for (var i = 0; i < N; i++) {
        pts.push({
          x: rand(0, window.innerWidth),
          y: rand(0, window.innerHeight),
          r: rand(.6, 2.2),
          vx: rand(-.18, .18),
          vy: rand(-.18, .18),
          a: rand(.08, .32),
          da: rand(.0004, .0008) * (Math.random() > .5 ? 1 : -1)
        });
      }

      function draw() {
        ctx.clearRect(0, 0, W, H);
        pts.forEach(function (p) {
          p.x += p.vx; p.y += p.vy; p.a += p.da;
          if (p.a > .32 || p.a < .04) p.da = -p.da;
          if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(200,160,32,' + p.a + ')';
          ctx.fill();
        });
        // Connexions courtes
        for (var i = 0; i < pts.length; i++) {
          for (var j = i + 1; j < pts.length; j++) {
            var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110) {
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(200,160,32,' + (.06 * (1 - dist / 110)) + ')';
              ctx.lineWidth = .5;
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.lineTo(pts[j].x, pts[j].y);
              ctx.stroke();
            }
          }
        }
        requestAnimationFrame(draw);
      }
      draw();
    })();

    // 16. TILT 3D subtil sur eng-cards, why-items
    (function () {
      document.querySelectorAll('.eng-card, .why-item').forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var r = this.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width  - 0.5;
          var y = (e.clientY - r.top)  / r.height - 0.5;
          this.style.transform = 'perspective(700px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateZ(8px)';
        });
        el.addEventListener('mouseleave', function () {
          this.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
          this.style.transform = '';
          var self = this;
          setTimeout(function () { self.style.transition = ''; }, 500);
        });
      });
    })();

    // 18. HOW-IT-WORKS — barre de progression animée au scroll
    (function () {
      var bar = document.getElementById('howProgressBar');
      if (!bar) return;
      var fired = false;
      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !fired) {
          fired = true;
          var steps = [
            { dot: 'hwp1', line: 'hwl1', delay: 0 },
            { dot: 'hwp2', line: 'hwl2', delay: 600 },
            { dot: 'hwp3', line: null,   delay: 1200 }
          ];
          steps.forEach(function (s) {
            setTimeout(function () {
              var dot = document.getElementById(s.dot);

              if (dot) dot.classList.add('active');
              if (s.line) {
                var line = document.getElementById(s.line);
                if (line) line.classList.add('active');
              }
            }, s.delay);
          });
        }
      }, { threshold: 0.2 });
      obs.observe(bar);
    })();

    // 17. HERO STATS — hover effet compteur flash + shimmer
    (function () {
      document.querySelectorAll('.stat-item').forEach(function(item) {
        var numEl = item.querySelector('.stat-num');
        if (!numEl) return;
        
        item.addEventListener('mouseenter', function() {
          // Flash doré
          numEl.style.transition = 'color .15s ease, transform .35s cubic-bezier(.175,.885,.32,1.275)';
          numEl.style.color = 'var(--gold2)';
          numEl.style.transform = 'scale(1.08)';
          // Particule burst subtile
          var rect = item.getBoundingClientRect();
          for (var i = 0; i < 4; i++) {
            var dot = document.createElement('div');
            dot.style.cssText = 'position:fixed;width:4px;height:4px;border-radius:50%;background:var(--gold);pointer-events:none;z-index:9999;transition:all .5s ease;opacity:.8;';
            var angle = (Math.PI * 2 / 4) * i;
            var cx = rect.left + rect.width/2;
            var cy = rect.top + rect.height/2;
            dot.style.left = cx + 'px';
            dot.style.top  = cy + 'px';
            document.body.appendChild(dot);
            setTimeout(function(d, a) {
              d.style.transform = 'translate(' + (Math.cos(a)*22) + 'px,' + (Math.sin(a)*22) + 'px)';
              d.style.opacity = '0';
              setTimeout(function() { d.remove(); }, 500);
            }, 10, dot, angle);
          }
        });
        
        item.addEventListener('mouseleave', function() {
          numEl.style.color = '';
          numEl.style.transform = '';
        });
      });
    })();

    // 19. SECTION ENTRÉE — animation légère au scroll
    (function() {
      var sections = document.querySelectorAll('section');
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) {
            e.target.style.opacity = '1';
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.04 });
      sections.forEach(function(s) {
        if (!s.style.opacity) s.style.opacity = '1'; // sections already visible = fine
        obs.observe(s);
      });
    })();

    // 20. SMOOTH HOVER sur les liens footer
    (function() {
      document.querySelectorAll('.footer-links a').forEach(function(link) {
        link.addEventListener('mouseenter', function() {
          this.style.transition = 'color .25s ease, padding-left .25s ease';
          this.style.color = 'var(--gold2)';
          this.style.paddingLeft = '4px';
        });
        link.addEventListener('mouseleave', function() {
          this.style.color = '';
          this.style.paddingLeft = '';
        });
      });
    })();

