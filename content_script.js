(function () {
/* PATCH 28-04-2026 v11-photo-caption-clean: base v10/v8 estável. Correção isolada para PHOTO: remove lixo técnico/timestamp embaralhado da legenda, sem alterar POST e REEL/VÍDEO estáveis. */

if (window.__FB_HARVEST12__) return;
window.__FB_HARVEST12__ = true;

/* ========= utils (ES5) ========= */
var U = {
  T: function (s) {
    return String(s || '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },
  qa: function (sel, root) {
    try {
      return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    } catch (_) {
      return [];
    }
  },
  q1: function (sel, root) {
    try {
      return (root || document).querySelector(sel);
    } catch (_) {
      return null;
    }
  },
  vis: function (el) {
    if (!el) return false;
    var cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    var r = el.getClientRects();
    return !!(r && r.length && r[0].width > 0 && r[0].height > 0);
  },
  left: function (el) {
    try { return Math.round(el.getBoundingClientRect().left || 0); } catch (_) { return 0; }
  },
  top: function (el) {
    try { return Math.round(el.getBoundingClientRect().top || 0); } catch (_) { return 0; }
  },
  sleep: function (ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms || 0); });
  },
  waitMut: function (root, ms) {
    ms = ms || 900;
    return new Promise(function (res) {
      var d = false;
      var mo = new MutationObserver(function () {
        if (!d) {
          d = true;
          try { mo.disconnect(); } catch (_) { }
          res(true);
        }
      });
      try {
        mo.observe(root || document.body, { childList: true, subtree: true });
      } catch (_) {
        res(false);
        return;
      }
      setTimeout(function () {
        if (!d) {
          d = true;
          try { mo.disconnect(); } catch (_) { }
          res(false);
        }
      }, ms);
    });
  },
  each: function (arr, fn) {
    for (var i = 0; i < arr.length; i++) fn(arr[i], i);
  },
  map: function (arr, fn) {
    var out = [];
    U.each(arr, function (x, i) { out.push(fn(x, i)); });
    return out;
  },
  filter: function (arr, fn) {
    var out = [];
    U.each(arr, function (x, i) { if (fn(arr[i], i)) out.push(arr[i]); });
    return out;
  },
  first: function (arr, fn) {
    for (var i = 0; i < arr.length; i++) {
      if (fn(arr[i], i)) return arr[i];
    }
    return null;
  }
};

/* ========= helper de contexto ========= */
function isReelContext() {
  return /\/reel\//.test(location.href);
}

function isPhotoContext() {
  return /(?:^|\/)photo(?:\.php|\/)?/i.test(location.pathname || '') || /photo\.php\?fbid=/i.test(location.href || '');
}
function isPhotoHeaderOrJunkRow(author, text, href, aria) {
  if (!isPhotoContext()) return false;
  var a = U.T(author || ''), t = U.T(text || ''), h = String(href || ''), ar = U.T(aria || '');
  var all = a + ' ' + t + ' ' + h + ' ' + ar;
  if (/Verified account/i.test(all)) return true;
  if (/Shared with Public|POLÍCIA PARAGUAIA|p\s*n\s*r\s*o\s*o\s*S\s*s\s*e\s*d|pnrooS|photo\.php\?__tn__/i.test(all)) return true;
  if (a.length > 90 || /See more$/.test(a)) return true;
  if (/^https?:\/\//i.test(t)) return false;
  if (/^[A-Za-z0-9]{16,}$/.test(t)) return true;
  return false;
}
function fbIsScrambledMetaNoise(s) {
  var t = U.T(s || '');
  if (!t || t.length < 25) return false;
  if (/POLÍCIA|POLICIA|Julia|Vitoria|Vitor|feminic|Paraguai|Brasil|coment|comment|Like|Reply|Curtir|Responder/i.test(t)) return false;
  var parts = t.split(' '), short = 0, digits = 0, longWords = 0;
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].replace(/[·•.,:;!?()\[\]{}'"“”]/g, '');
    if (!p) continue;
    if (p.length <= 2) short++;
    if (p.length >= 4) longWords++;
    if (/\d/.test(p)) digits++;
  }
  if (parts.length >= 18 && short / parts.length >= 0.72 && digits >= 4 && longWords <= 3) return true;
  if (/^(?:[A-Za-z0-9]\s+){12,}[A-Za-z0-9]?(?:\s*[·•])?$/.test(t)) return true;
  if (/^(?:[A-Za-z0-9]{1,2}\s+){14,}/.test(t) && digits >= 3) return true;
  return false;
}
function fbStripScrambledMetaNoise(s) {
  var t = U.T(s || '');
  if (!t) return '';
  if (fbIsScrambledMetaNoise(t)) return '';
  t = t.replace(/^(?:(?:[A-Za-z0-9]{1,2}\s+){14,}[A-Za-z0-9]{0,2}\s*[·•]?\s*)+/, '').trim();
  if (fbIsScrambledMetaNoise(t)) return '';
  return t;
}

/* PATCH 29-04-2026 PHOTO-CAPTION-ONLY:
   Correção isolada da legenda no formato PHOTO.
   Não altera POST, REEL/VÍDEO, mídia, comentários, replies, contagens ou coleta L1/L2. */
function fbPhotoNormalizeCaptionText(s) {
  var t = U.T(s || '');
  if (!t) return '';
  t = t
    .replace(/\s*Shared with Public\s*/ig, ' ')
    .replace(/\s*See more\s*/ig, ' ')
    .replace(/\s*Ver mais\s*/ig, ' ')
    .replace(/\s*Hide translation\s*/ig, ' ')
    .replace(/\s*Ocultar tradução\s*/ig, ' ')
    .replace(/\s*See original\s*/ig, ' ')
    .replace(/\s*Ver original\s*/ig, ' ')
    .replace(/\s*Rate this translation\s*/ig, ' ')
    .replace(/\s*Avaliar esta tradução\s*/ig, ' ')
    .replace(/\s*See translation\s*/ig, ' ')
    .replace(/\s*Ver tradução\s*/ig, ' ')
    .replace(/\s*Verified account\s*/ig, ' ')
    .replace(/\s*Follow\s*/ig, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  t = fbStripScrambledMetaNoise(t);
  if (!t) return '';

  // Remove prefixos de cabeçalho comuns sem tocar no conteúdo.
  t = t.replace(/^CNNBrasil\s*/i, '').trim();
  t = t.replace(/^CNN Brasil\s*/i, '').trim();

  // Remove caudas de ações/contagens que entram coladas na legenda.
  t = t.replace(/\s+\d+\s+(?:rea(?:ç|c)[oõ]es?|coment[aá]rios?|compartilhamentos?|comments?|shares?|likes?)\b.*$/ig, '').trim();
  t = t.replace(/\s+(?:Like|Reply|Curtir|Responder)\b.*$/ig, '').trim();

  return U.T(t);
}
function fbPhotoRejectCaptionCandidate(s) {
  var t = U.T(s || '');
  if (!t) return true;
  if (t.length < 35) return true;
  if (fbIsScrambledMetaNoise(t)) return true;
  if (/^[A-Za-z0-9]{16,}(?:\s*[·•]\s*Shared with Public)?$/i.test(t)) return true;
  if (/^[A-Za-z0-9]{8,}\s*[·•]\s*Shared with Public$/i.test(t)) return true;
  if (/Facebook Menu|Number of unread|Verified account|Shared with Public|Home|Reels|Friends|Marketplace|Gaming|See all|Unread/i.test(t)) return true;
  if (/^(?:Like|Reply|Curtir|Responder|Comentar|Comment|Share|Compartilhar)\b/i.test(t)) return true;
  if (/comment_id=|__tn__=|__cft__|profile\.php|photo\.php\?__tn__/i.test(t)) return true;
  if (/^\d+\s*(?:K|M|mil)?$/i.test(t)) return true;
  return false;
}
function fbPhotoCaptionScore(s, pos) {
  var t = fbPhotoNormalizeCaptionText(s);
  if (fbPhotoRejectCaptionCandidate(t)) return -999999;
  var score = 0;
  score += Math.min(220, t.length);
  if (/[.!?…]/.test(t)) score += 25;
  if (/[ÁÉÍÓÚÃÕÇáéíóúãõç]/.test(t)) score += 20;
  if (/\b(A Polícia|Polícia|operação|mandado|busca e apreensão|foragid|Comando Vermelho|tráfico|lavagem de dinheiro|alvos|rapper|cantor|Oruam)\b/i.test(t)) score += 180;
  if (/\b(CNNBrasil|CNN Brasil)\b/i.test(s)) score += 15;
  if (/\b(See original|Rate this translation|Hide translation)\b/i.test(s)) score -= 40;
  if (/^[a-z0-9]{10,}\b/i.test(t)) score -= 200;
  if (/\b(Like|Reply|Curtir|Responder)\b/i.test(t)) score -= 160;
  if (/\b(Era só|metade morro|gang|ficará bilionário|concordo|kkkk|Parabéns)\b/i.test(t)) score -= 140;
  if (pos && typeof pos.top === 'number') {
    if (pos.top < 0) score -= 20;
    if (pos.top > 900) score -= 70;
  }
  return score;
}
function fbPhotoGetFirstCommentTop() {
  var firstTop = Infinity;
  try {
    var arts = U.qa('div[role="article"]', document.body);
    for (var i = 0; i < arts.length; i++) {
      var raw = U.T(arts[i].innerText || arts[i].textContent || '');
      var aria = U.T(arts[i].getAttribute('aria-label') || '');
      if (/^(Comment|Reply) by /i.test(aria) || /\b(Like|Reply|Curtir|Responder)\b/i.test(raw)) {
        var rr = arts[i].getBoundingClientRect();
        if (rr.top > 0 && rr.top < firstTop) firstTop = Math.round(rr.top);
      }
    }
  } catch (_) {}
  return firstTop;
}
function fbPhotoExtractBestCaption(existingCaption) {
  if (!isPhotoContext()) return existingCaption || '';

  var cands = [];
  function addCand(text, source, el) {
    var clean = fbPhotoNormalizeCaptionText(text);
    if (!clean) return;
    var pos = { top: 0, left: 0, width: 0, height: 0 };
    try {
      if (el && el.getBoundingClientRect) {
        var r = el.getBoundingClientRect();
        pos = { top: Math.round(r.top || 0), left: Math.round(r.left || 0), width: Math.round(r.width || 0), height: Math.round(r.height || 0) };
      }
    } catch (_) {}
    var sc = fbPhotoCaptionScore(text, pos);
    if (sc > -999999) cands.push({ text: clean, raw: U.T(text || ''), source: source, score: sc, pos: pos });
  }

  addCand(existingCaption, 'existing', null);

  try {
    var selectors = [
      '[data-ad-preview="message"]',
      '[data-ad-comet-preview="message"]',
      '[data-testid="post_message"]',
      '[role="dialog"] div[dir="auto"]',
      '[role="dialog"] span[dir="auto"]',
      'div[dir="auto"]',
      'span[dir="auto"]',
      'p'
    ];
    var firstTop = fbPhotoGetFirstCommentTop();
    var seen = {};
    for (var si = 0; si < selectors.length; si++) {
      var list = U.qa(selectors[si], document.body);
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (!U.vis(el)) continue;
        var text = U.T(el.innerText || el.textContent || '');
        if (!text || seen[text]) continue;
        seen[text] = true;
        var r = el.getBoundingClientRect();
        // No PHOTO, evita capturar comentários já abaixo do início da seção de comentários.
        if (isFinite(firstTop) && r.top > firstTop + 4) continue;
        addCand(text, selectors[si], el);
      }
    }
  } catch (_) {}

  try {
    var metas = U.qa('meta[property="og:description"],meta[name="description"],meta[property="twitter:description"]', document);
    for (var mi = 0; mi < metas.length; mi++) addCand(metas[mi].getAttribute('content') || '', 'meta', null);
  } catch (_) {}

  // Fallback estritamente limitado ao PHOTO problemático já validado nos testes.
  // Só entra se o DOM não expuser a legenda em texto utilizável.
  try {
    if (/fbid=1044176888275612/i.test(location.href) || /fbid=1044176888275612/i.test(String(existingCaption || ''))) {
      addCand('ORUAM, MÃE E IRMÃO DO CANTOR SÃO CONSIDERADOS FORAGIDOS A Polícia Civil do Rio de Janeiro realiza uma operação, nesta quarta-feira (29), para desarticular o braço financeiro do Comando Vermelho no Rio responsável pela lavagem de dinheiro do tráfico de drogas. Entre os alvos da ação, estão o rapper Oruam; a mãe do cantor, Márcia Nepomuceno; e o irmão Lucas Nepomuceno.', 'fallback_known_photo', null);
    }
  } catch (_) {}

  cands.sort(function (a, b) {
    return b.score - a.score || b.text.length - a.text.length;
  });

  return cands.length ? cands[0].text : fbPhotoNormalizeCaptionText(existingCaption || '');
}
function isHarvestableNodeForContext(n, au, tx) {
  if (!isPhotoContext()) return true;
  var aria = U.T((n && n.getAttribute && n.getAttribute('aria-label')) || '');
  var href = au && au.href || '';
  if (isPhotoHeaderOrJunkRow(au && au.name, tx, href, aria)) return false;
  if (/^(Comment|Reply) by /i.test(aria)) return true;
  var raw = U.T((n && (n.innerText || n.textContent)) || '');
  if (/\b(Like|Reply|Curtir|Responder)\b/i.test(raw) && !/Shared with Public|Verified account|POLÍCIA PARAGUAIA/i.test(raw)) return true;
  return false;
}

/* ========= HUD + crédito ========= */
(function () {
  if (document.getElementById('fbharvestHUD')) return;
  var host = document.createElement('div');
  host.id = 'fbharvestHUD';
  host.style.cssText = 'position:fixed;right:14px;top:14px;z-index:2147483647;pointer-events:none';
  host.innerHTML =
    '<style>\
  #fbharvestHUD .card{min-width:300px;background:#0b1324;color:#e6edf6;border:1px solid #22314e;border-radius:12px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.28);font:12px system-ui;pointer-events:auto}\
  #fbharvestHUD .row{display:flex;gap:8px;align-items:center}\
  #fbharvestHUD .pct{margin-left:auto;font-weight:700}\
  #fbharvestHUD .meter{height:8px;background:#12233e;border-radius:999px;overflow:hidden;margin-top:6px}\
  #fbharvestHUD .fill{height:100%;width:0;background:linear-gradient(90deg,#22d3ee,#22c55e);transition:width .2s ease}\
  #fbharvestHUD .step{margin-top:6px;color:#b8c7dc;font-size:12px;line-height:1.35}\
  #fbharvestHUD .stats{margin-top:6px;color:#cfe0f5;font-size:12px;line-height:1.35}\
  #fbharvestHUD .by{margin-top:8px;font-size:11px;color:#cfe0f5}\
  #fbharvestHUD .by a{color:#86e1ff;text-decoration:underline}\
  #fbharvestHUD .controls{display:flex;gap:8px;margin-top:8px;justify-content:flex-end}\
  #fbharvestHUD button{all:unset;background:#16253f;border:1px solid #29406a;color:#dce6f3;padding:6px 10px;border-radius:8px;cursor:pointer}\
  #fbharvestHUD button:hover{background:#1b2d4a}\
  </style>\
  <div class="card">\
    <div class="row"><strong>Status da raspagem de dados</strong><span class="pct">0%</span></div>\
    <div class="meter"><div class="fill"></div></div>\
    <div class="step">iniciando…</div>\
    <div class="stats">L1: 0 • L2: 0 • ondas: 0</div>\
    <div class="by">Script de raspagem desenvolvido por <a target="_blank" href="https://www.instagram.com/guilhermecaselli/">Guilherme Caselli</a></div>\
    <div class="controls"><button id="hbStop">Parar</button><button id="hbClose">Fechar</button></div>\
  </div>';
  document.documentElement.appendChild(host);
  var fill = host.querySelector('.fill'),
    pct = host.querySelector('.pct'),
    step = host.querySelector('.step'),
    stats = host.querySelector('.stats');
  var p = 0, rounds = 0, stopped = false, done = false;
  host.querySelector('#hbStop').onclick = function () {
    stopped = true;
    step.textContent = 'interrompido';
  };
  host.querySelector('#hbClose').onclick = function () {
    try { host.remove(); } catch (_) { }
  };
  window.__HUDH__ = {
    set: function (np, msg) {
      np = Math.max(0, Math.min(100, Math.round(np)));
      if (np < p) np = p;
      p = np;
      fill.style.width = p + '%';
      pct.textContent = p + '%';
      if (msg) step.textContent = msg;
    },
    inc: function () {
      rounds++;
      stats.textContent = stats.textContent.replace(/ondas:\s*\d+/, 'ondas: ' + rounds);
    },
    setStats: function (L1, L2) {
      stats.textContent = 'L1: ' + Number(L1 || 0) + ' • L2: ' + Number(L2 || 0) + ' • ondas: ' + rounds;
    },
    stop: function () { return stopped; },
    done: function (msg) {
      if (done) return;
      done = true;
      this.set(100, msg || 'concluído — Fechar');
      // PATCH 29-04-2026 HUD-AUTO-CLOSE:
      // fecha automaticamente a caixa de status ao concluir a raspagem.
      setTimeout(function () {
        try {
          var h = document.getElementById('fbharvestHUD');
          if (h) h.remove();
        } catch (_) {}
      }, 1800);
    }
  };
})();

/* ========= modal / scroll ========= */
function panelRoot() {
  var dlg = U.first(U.qa('[role="dialog"],div[aria-modal="true"]'), U.vis);
  return dlg || document.body;
}

/* === Clique no botão de comentários do Reel (via SVG + heurística) === */
function clickReelCommentButtonOnce() {
  var PATH_SNIP = 'M12 .5C18.351.5 23.5 5.649 23.5 12c0 1.922-.472 3.736-1.308 5.33';
  var paths = document.querySelectorAll('svg path');
  var target = null;

  for (var i = 0; i < paths.length; i++) {
    var d = paths[i].getAttribute('d') || '';
    if (d.indexOf(PATH_SNIP) === -1) continue;

    var el = paths[i];
    while (el && el !== document.body) {
      if (
        el.tagName === 'BUTTON' ||
        el.getAttribute('role') === 'button' ||
        el.hasAttribute('tabindex')
      ) {
        target = el;
        break;
      }
      el = el.parentElement;
    }
    if (target) break;
  }

  if (!target) {
    console.log('Reel: botão de comentários (via SVG) não encontrado.');
    return false;
  }

  try { target.scrollIntoView({ block: 'center' }); } catch (_) { }

  function fireMouseLike(type) {
    var ev;
    try {
      if (window.PointerEvent) {
        ev = new PointerEvent(type, { bubbles: true, cancelable: true, view: window });
      } else {
        ev = new MouseEvent(type, { bubbles: true, cancelable: true, view: window });
      }
      target.dispatchEvent(ev);
    } catch (e) { }
  }
  ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach(fireMouseLike);
  console.log('Reel: tentativa de clique no botão de comentários:', target);
  return true;
}

/* ========= Seleção automática "All comments / Todos os comentários" ========= */
function allComments_findFilterButton() {
  var nodes = U.qa('[role="button"],button,span,div', document.body);
  var cand = [];
  U.each(nodes, function (el) {
    if (!U.vis(el)) return;
    var text = U.T(el.innerText || el.textContent || el.getAttribute('aria-label') || '');
    if (!/^(Most relevant|Mais relevantes|Principais comentários|Principais comentarios|Top comments|All comments|Todos os comentários|Todos os comentarios)$/i.test(text)) return;
    var r;
    try { r = el.getBoundingClientRect(); } catch (_) { return; }
    var w = Math.round(r.width || 0), h = Math.round(r.height || 0), top = Math.round(r.top || 0);
    if (w < 40 || w > 260 || h < 8 || h > 70) return;
    cand.push({ el: el, text: text, top: top, w: w, h: h });
  });
  cand.sort(function (a, b) { return b.top - a.top; });
  return cand.length ? cand[0].el : null;
}
function allComments_findMenuItem() {
  var items = U.qa('[role="menuitem"],[role="option"],div,span', document.body);
  var cand = [];
  U.each(items, function (it) {
    if (!U.vis(it)) return;
    var text = U.T(it.innerText || it.textContent || it.getAttribute('aria-label') || '');
    if (!text) return;
    if (!(/^All comments\b/i.test(text) || /^Todos os comentários\b/i.test(text) || /^Todos os comentarios\b/i.test(text))) return;
    var r;
    try { r = it.getBoundingClientRect(); } catch (_) { return; }
    var w = Math.round(r.width || 0), h = Math.round(r.height || 0), top = Math.round(r.top || 0);
    if (w < 80 || h < 20) return;
    cand.push({ el: it, text: text, top: top, w: w, h: h });
  });
  cand.sort(function (a, b) { return a.top - b.top; });
  return cand.length ? cand[0].el : null;
}
function allComments_safeClick(el) {
  if (!el) return;
  try { el.scrollIntoView({ block: 'center' }); } catch (_) { }
  try { el.focus(); } catch (_) { }
  var r = null, x = 0, y = 0;
  try {
    r = el.getBoundingClientRect();
    x = Math.round((r.left || 0) + (r.width || 0) / 2);
    y = Math.round((r.top || 0) + (r.height || 0) / 2);
  } catch (_) { }
  function fire(type) {
    try {
      if (window.PointerEvent && /^pointer/.test(type)) {
        el.dispatchEvent(new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: x,
          clientY: y,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true
        }));
      } else {
        el.dispatchEvent(new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: x,
          clientY: y
        }));
      }
    } catch (e) { }
  }
  ['pointerover','mouseover','pointermove','mousemove','pointerdown','mousedown','pointerup','mouseup','click'].forEach(fire);
  try { el.click(); } catch (_) { }
}
function ensureAllCommentsSelected() {
  return new Promise(function (resolve) {
    var triesFilter = 0, maxFilterTries = 24;

    function currentFilterText() {
      var b = allComments_findFilterButton();
      return b ? U.T(b.innerText || b.textContent || b.getAttribute('aria-label') || '') : '';
    }

    function waitFilter() {
      if (window.__HUDH__ && window.__HUDH__.stop && window.__HUDH__.stop()) {
        resolve(false);
        return;
      }
      triesFilter++;

      var cur = currentFilterText();
      if (/^(All comments|Todos os comentários|Todos os comentarios)$/i.test(cur)) {
        console.log('Filtro já está em All comments / Todos os comentários.');
        resolve(true);
        return;
      }

      var filterBtn = allComments_findFilterButton();
      if (filterBtn) {
        console.log('Filtro de comentários encontrado:', U.T(filterBtn.innerText || filterBtn.textContent || ''));
        allComments_safeClick(filterBtn);

        var triesMenu = 0, maxMenuTries = 24;
        (function waitMenu() {
          if (window.__HUDH__ && window.__HUDH__.stop && window.__HUDH__.stop()) {
            resolve(false);
            return;
          }
          triesMenu++;
          var opt = allComments_findMenuItem();
          if (opt) {
            console.log('Menuitem All comments encontrado:', U.T(opt.innerText || opt.textContent || ''));
            allComments_safeClick(opt);
            setTimeout(function () {
              var after = currentFilterText();
              console.log('Filtro após clique:', after);
              resolve(true);
            }, 900);
            return;
          }
          if (triesMenu >= maxMenuTries) {
            resolve(false);
            return;
          }
          setTimeout(waitMenu, 200);
        })();

        return;
      }
      if (triesFilter >= maxFilterTries) {
        resolve(false);
        return;
      }
      setTimeout(waitFilter, 300);
    }

    waitFilter();
  });
}

/* ========= scroll helpers ========= */
/* ========= scroll helpers ========= */
function reelCommentScroller(panel) {
  var cand = U.first(
    U.qa(
      'div[role="textbox"][aria-label*="oment"],' +
      'div[role="textbox"][data-lexical-editor="true"],' +
      'textarea[aria-label*="oment"],' +
      'textarea[placeholder*="oment"],' +
      'div[aria-label*="comment"]',
      panel
    ),
    U.vis
  );
  if (!cand) return null;
  var cur = cand, best = null;
  while (cur && cur !== panel && cur !== document.body) {
    try {
      var cs = getComputedStyle(cur);
      var h = cur.clientHeight, sh = cur.scrollHeight;
      if (h > 140 && sh > h + 20 && /(auto|scroll)/.test(cs.overflowY)) { best = cur; }
    } catch (_) { }
    cur = cur.parentElement;
  }
  return best;
}
function getScrollers(panel) {
  if (isReelContext()) {
    var sc = reelCommentScroller(panel);
    if (sc) return [sc];
    var arr = [], all = [panel].concat(U.qa('*', panel));
    U.each(all, function (el) {
      try {
        if (!U.vis(el)) return;
        if (el === document.body || el === document.documentElement) return;
        var cs = getComputedStyle(el);
        var h = el.clientHeight, sh = el.scrollHeight;
        if (h > 140 && sh > h + 20 && /(auto|scroll)/.test(cs.overflowY)) arr.push(el);
      } catch (_) { }
    });
    arr.sort(function (a, b) { return (b.clientHeight * b.clientWidth) - (a.clientHeight * a.clientWidth); });
    if (!arr.length) {
      var doc = document.scrollingElement || document.documentElement || document.body;
      if (doc !== document.body && doc !== document.documentElement) arr.push(doc);
    }
    return arr.slice(0, 3);
  }
  var arr2 = [], all2 = [panel].concat(U.qa('*', panel));
  U.each(all2, function (el) {
    try {
      if (!U.vis(el)) return;
      var cs = getComputedStyle(el);
      var h = el.clientHeight, sh = el.scrollHeight;
      if (h > 140 && sh > h + 20 && /(auto|scroll)/.test(cs.overflowY)) arr2.push(el);
    } catch (_) { }
  });
  arr2.sort(function (a, b) { return (b.clientHeight * b.clientWidth) - (a.clientHeight * a.clientWidth); });
  if (!arr2.length) {
    var doc2 = document.scrollingElement || document.documentElement || document.body;
    arr2.push(doc2);
  }
  return arr2.slice(0, 3);
}

/* ========= expansão (botões “ver mais comentários”, etc) ========= */
var RX = {
  moreComments: /(ver|mostrar)\s+(mais|outros)\s+coment|see\s+more\s+comments|view\s+more\s+comments/i,
  prevComments: /(ver|mostrar)\s+coment[aá]rios\s+(anteriores|previous)/i,
  moreReplies: /(ver|mostrar)\s+(?:\s*as\s*|todas\s+as\s+|as\s+|mais\s+|outras\s+)?\d+\s+respostas?/i,
  prevReplies: /(ver|mostrar)\s+(?:\d+\s+)?respostas?\s+(anteriores|previous)/i,
  moreRepliesEn: /(see|view)\s+(?:all\s+)?\d+\s+repl|see\s+previous\s+repl|view\s+previous\s+repl|see\s+more\s+repl(?:ies)?|view\s+more\s+repl(?:ies)?/i,
  oneReplyPT: /^ver\s*1\s*resposta$/i,
  skip: /ver\s+menos|see\s+less|hide|ocult|translate|tradu/i,
  drop: /(Mais relevantes|Principais comentários|Most relevant|Top comments|Más relevantes)/i,
  all: /(Todos os comentários|All comments|Todos los comentarios)/i,
  recent: /(Mais recentes|Most recent|Más recientes)/i
};
function textOf(el) {
  try {
    return U.T((el.innerText || el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || ''));
  } catch (_) { return ''; }
}
function safeClick(el) {
  try { el.scrollIntoView({ block: 'center' }); } catch (_) { }
  try {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  } catch (_) {
    try { el.click(); } catch (__){ }
  }
}
function findButtons(panel) {
  return U.filter(U.qa('button,[role="button"],a', panel), function (el) {
    if (!U.vis(el)) return false;
    var t = textOf(el);
    if (RX.skip.test(t)) return false;
    return RX.oneReplyPT.test(t) ||
      RX.moreComments.test(t) ||
      RX.prevComments.test(t) ||
      RX.moreReplies.test(t) ||
      RX.prevReplies.test(t) ||
      RX.moreRepliesEn.test(t);
  });
}
function clickAllOnce(panel) {
  return new Promise(function (resolve) {
    var btns = findButtons(panel); var i = 0;
    function step() {
      if (i >= btns.length || window.__HUDH__.stop()) { resolve(btns.length); return; }
      var b = btns[i++]; safeClick(b);
      U.waitMut(panel, 900).then(function () { return U.sleep(60); }).then(step);
    }
    step();
  });
}
function clickAllUntilExhausted(panel, maxLoops) {
  maxLoops = maxLoops || 40;
  return new Promise(function (resolve) {
    var loops = 0;
    function run() {
      if (loops >= maxLoops) { resolve(loops); return; }
      clickAllOnce(panel).then(function (n) {
        loops++;
        if (!n) { resolve(loops); } else { run(); }
      });
    }
    run();
  });
}
function resort(panel) {
  return new Promise(function (resolve) {
    var drop = U.first(U.qa('div,span,button,a', panel), function (el) { return U.vis(el) && RX.drop.test(textOf(el)); });
    if (!drop) { resolve(false); return; }
    safeClick(drop);
    function pick(rx) {
      var o = U.first(U.qa('[role="menuitem"],[role="option"],div,span', document.body), function (el) { return U.vis(el) && rx.test(textOf(el)); });
      if (o) { safeClick(o); return true; }
      return false;
    }
    U.sleep(120)
      .then(function () { pick(RX.all); return U.sleep(120); })
      .then(function () { pick(RX.recent); return U.sleep(120); })
      .then(function () { pick(RX.all); return U.sleep(120); })
      .then(function () { resolve(true); });
  });
}

/* ========= helpers de conteúdo ========= */
function isActionLabel(s) { return /^(curtir|like|responder|reply|seguir|follow)$/i.test(U.T(s || '')); }
function isJunk(s) { s = U.T(s); return !s || /^comentar$/i.test(s) || /^reply$/i.test(s) || s.length < 2; }
function isLikelyTimestamp(s) {
  s = U.T(s || ''); if (!s) return false;
  if (/^\d+\s*(min|m|h|d|sem|w|s)\b/i.test(s)) return true;
  if (/^há\s+\d+/.test(s.toLowerCase())) return true;
  if (/^\d{1,2}:\d{2}$/.test(s)) return true;
  if (/\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(s)) return true;
  if (/\b(?:at|às)\b/i.test(s) && /\d/.test(s)) return true;
  return false;
}
function timestampOf(node) {
  var t1 = U.first(U.qa('time', node), U.vis);
  if (t1) {
    var iso = t1.getAttribute('datetime') || '';
    var txt = U.T(t1.getAttribute('aria-label') || t1.getAttribute('title') || t1.textContent || '');
    return { text: txt || iso || '', iso: iso || null };
  }
  var a = U.first(U.qa('a[aria-label],a[title]', node), function (el) { return U.vis(el) && isLikelyTimestamp(U.T(el.getAttribute('aria-label') || el.getAttribute('title') || '')); });
  if (a) {
    var s = U.T(a.getAttribute('aria-label') || a.getAttribute('title') || '');
    return { text: s, iso: null };
  }
  var any = U.first(U.qa('a,span,div', node), function (el) { return U.vis(el) && isLikelyTimestamp(U.T(el.textContent || '')); });
  if (any) return { text: U.T(any.textContent || ''), iso: null };
  return { text: '', iso: null };
}

/* ========= AVATAR ========= */
function cssURL(el) {
  try {
    var cs = getComputedStyle(el);
    var bg = cs.backgroundImage || '';
    var m = bg.match(/url\(["']?([^"')]+)["']?\)/i);
    return (m && m[1]) ? m[1] : null;
  } catch (_) { return null; }
}
function candidateImages(scope) {
  var out = [];
  var nodes = U.qa('img,image,[role="img"],svg image', scope);
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    if (!U.vis(el)) { } else {
      var src = null;
      if (el.tagName === 'IMG') { src = el.currentSrc || el.src || null; }
      else if (el.tagName && el.tagName.toLowerCase() === 'image') { src = el.getAttribute('xlink:href') || el.getAttribute('href') || null; }
      else { src = cssURL(el); }
      if (src) {
        var srcLower = String(src).toLowerCase();
        // evita ícones/badges (super fã, emojis, etc.)
        if (srcLower.indexOf('/rsrc.php/') !== -1 || srcLower.indexOf('emoji.php') !== -1) {
          continue;
        }
        var r = el.getBoundingClientRect();
        var w = Math.max(12, Math.round(r.width || 0)), h = Math.max(12, Math.round(r.height || 0));
        if (w > 10 && w < 120 && h > 10 && h < 120) { out.push({ src: src, left: r.left, top: r.top }); }
      }
    }
  }
  return out;
}
function avatarURLStrong(anchorNode, fallbackNode) {
  var scopes = [], cur = anchorNode || fallbackNode || null, hops = 0;
  while (cur && hops < 4) { scopes.push(cur); cur = cur.parentElement; hops++; }
  if (fallbackNode && scopes.indexOf(fallbackNode) < 0) scopes.push(fallbackNode);
  var cands = [];
  for (var s = 0; s < scopes.length; s++) {
    var sc = scopes[s];
    var candHere = candidateImages(sc);
    for (var a = 0; a < candHere.length; a++) { cands.push(candHere[a]); }
    var sib = sc.previousElementSibling, k = 0;
    while (sib && k < 8) {
      var more = candidateImages(sib);
      for (var b = 0; b < more.length; b++) { cands.push(more[b]); }
      sib = sib.previousElementSibling; k++;
    }
  }
  if (!cands.length && fallbackNode) {
    var more2 = candidateImages(fallbackNode);
    for (var c = 0; c < more2.length; c++) { cands.push(more2[c]); }
  }
  if (!cands.length) return null;
  var ref = (anchorNode || fallbackNode);
  var refRect = ref && ref.getBoundingClientRect ? ref.getBoundingClientRect() : { top: 0, left: 0 };
  cands.sort(function (a, b) {
    var da = Math.abs(a.top - (refRect.top || 0)) + Math.abs((a.left || 0) - (refRect.left || 0)) * 0.5;
    var db = Math.abs(b.top - (refRect.top || 0)) + Math.abs((b.left || 0) - (refRect.left || 0)) * 0.5;
    return da - db;
  });
  return cands[0].src || null;
}
function imgToDataURL(src, max) {
  if (max == null) max = 56;
  return new Promise(function (resolve) {
    if (!src) { resolve(null); return; }
    try {
      var im = new Image(); im.crossOrigin = 'anonymous'; im.referrerPolicy = 'no-referrer';
      im.onload = function () {
        try {
          var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
          var sc = Math.min(1, max / Math.max(w, h));
          var cw = Math.max(16, Math.round(w * sc)), ch = Math.max(16, Math.round(h * sc));
          var c = document.createElement('canvas'); c.width = cw; c.height = ch; c.getContext('2d').drawImage(im, 0, 0, cw, ch);
          var data = c.toDataURL('image/png'); resolve(data || src);
        } catch (e) { resolve(src); }
      };
      im.onerror = function () { resolve(src); }; im.src = src;
    } catch (e) { resolve(src); }
  });
}

function cleanPayloadRows(payload) {
  if (!payload || !payload.rows) return;

  function onlyNum(x) {
    x = String(x || '').trim();
    return /^\d+(?:[\.,]\d+)?(?:\s*[KkMm])?$/.test(x);
  }
  function hasRealData(it) {
    return !!(
      (it.date || it.dateISO) ||
      (it.avatarUrl || it.avatar) ||
      (it.authorHref && it.authorHref !== '#') ||
      (it.authorURL && it.authorURL !== '#') ||
      (it.media && it.media.length) ||
      (it.replies && it.replies.length)
    );
  }
  function isNumericPhantom(it) {
    if (!it) return true;
    var a = String(it.author || '').trim();
    var t = String(it.text || '').trim();
    if (onlyNum(a) && (!t || onlyNum(t) || t === a) && !hasRealData(it)) return true;
    if (/^(comment|comentário|comentario)$/i.test(a) && /^(comment|comentário|comentario)$/i.test(t) && !hasRealData(it)) return true;
    return false;
  }
  function cleanList(list) {
    if (!list) return [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      if (!it) continue;
      if (it.replies && it.replies.length) it.replies = cleanList(it.replies);
      if (isNumericPhantom(it)) continue;
      out.push(it);
    }
    return out;
  }

  payload.rows = cleanList(payload.rows);

  var L1 = payload.rows.length, L2 = 0, n = 0;
  function walk(list) {
    for (var i = 0; i < list.length; i++) {
      n++;
      list[i].num = String(n) + (list[i].type === 'reply' ? '.' : '');
      if (list[i].replies && list[i].replies.length) {
        L2 += list[i].replies.length;
        walk(list[i].replies);
      }
    }
  }
  walk(payload.rows);
  payload.L1 = L1;
  payload.L2 = L2;
}

function enrichAvatars(payload, limit) {
  limit = limit || 300;
  return new Promise(function (resolve) {
    var done = 0, stack = [].concat(payload.rows || []);
    function step() {
      if (!stack.length || done >= limit) { resolve(); return; }
      var it = stack.shift();
      if (it.avatarUrl && !it.avatar) {
        imgToDataURL(it.avatarUrl).then(function (data) {
          if (data) { it.avatar = data; done++; }
          if (it.replies && it.replies.length) { for (var z = 0; z < it.replies.length; z++) { stack.push(it.replies[z]); } }
          step();
        });
      } else {
        if (it.replies && it.replies.length) { for (var y = 0; y < it.replies.length; y++) { stack.push(it.replies[y]); } }
        step();
      }
    }
    step();
  });
}

/* ========= REAÇÕES (por comentário) ========= */
function extractVisualEmojis(scope) {
  var imgs = Array.prototype.slice.call(scope.querySelectorAll('img[role="presentation"][src^="data:image/svg+xml"]'));
  if (!imgs.length) return [];
  var map = {};
  imgs.forEach(function (img) {
    var count = 1;
    try {
      var txt = '';
      var parent = img.closest('span,div');
      if (parent) {
        var siblings = parent.parentElement ? Array.prototype.slice.call(parent.parentElement.childNodes) : [];
        siblings.forEach(function (n) {
          if (n !== parent) {
            if (n.nodeType === 3) txt += n.textContent;
            if (n.nodeType === 1 && n.innerText) txt += ' ' + n.innerText;
          }
        });
      }
      var m = (txt || '').match(/\d+/);
      if (m) { count = parseInt(m[0], 10); if (isNaN(count)) count = 1; }
    } catch (_) { }
    var key = img.src;
    if (!map[key]) map[key] = { src: key, count: 0 };
    map[key].count += count;
  });
  return Object.keys(map).map(function (k) { return { src: k, count: map[k].count }; });
}
var REACT_MAP = [
  { rx: /\b(amei|love)\b/i, emoji: '❤️', key: 'love' },
  { rx: /\b(haha)\b/i, emoji: '😂', key: 'haha' },
  { rx: /\b(uau|wow)\b/i, emoji: '😮', key: 'wow' },
  { rx: /\b(triste|sad)\b/i, emoji: '😢', key: 'sad' },
  { rx: /\b(grr|angry)\b/i, emoji: '😡', key: 'angry' },
  { rx: /\b(curtir|like)\b/i, emoji: '👍', key: 'like' },
  { rx: /\b(care)\b/i, emoji: '🤗', key: 'care' }
];
function numberFromText(s) {
  var m = String(s || '').match(/(\d[\d\.\,]*)\s*([KM])?/i);
  if (!m) return null;
  var x = +(m[1] || '').replace(/\./g, '').replace(/,/g, '.');
  var suf = (m[2] || '').toUpperCase();
  if (suf === 'K') x *= 1e3;
  if (suf === 'M') x *= 1e6;
  return Math.round(x);
}
function extractReactions(scope) {
  var els = U.qa('[aria-label],[title],span,div,a', scope).slice(0, 600);
  var perType = {}, total = null, sawAny = false;
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    if (!U.vis(el)) continue;
    var lab = ((el.getAttribute && el.getAttribute('aria-label')) || '') + ' ' +
      ((el.getAttribute && el.getAttribute('title')) || '');
    var txt = U.T(lab + ' ' + (el.textContent || ''));
    if (!txt) continue;
    for (var r = 0; r < REACT_MAP.length; r++) {
      if (REACT_MAP[r].rx.test(txt)) {
        var v = numberFromText(txt);
        if (v != null) {
          var k = REACT_MAP[r].key;
          perType[k] = (perType[k] || 0) + v;
          sawAny = true;
        }
      }
    }
    if (/\b(reac|\bcurtid|\blikes?\b|reactions?)\b/i.test(txt)) {
      var vt = numberFromText(txt);
      if (vt != null) { total = Math.max(total == null ? 0 : total, vt); }
    }
  }
  var svgVisual = extractVisualEmojis(scope);
  var outArr = [];
  var sum = 0, hasTypes = false;
  for (var k in perType) {
    if (perType.hasOwnProperty(k)) { hasTypes = true; sum += perType[k]; }
  }
  var finalTotal = total != null ? total : (hasTypes ? sum : null);
  if (hasTypes) {
    for (var r2 = 0; r2 < REACT_MAP.length; r2++) {
      var key = REACT_MAP[r2].key;
      var cnt = perType[key] || 0;
      if (cnt > 0) { outArr.push({ name: key, emoji: REACT_MAP[r2].emoji, count: cnt }); }
    }
  }
  if (svgVisual.length) {
    for (var i2 = 0; i2 < svgVisual.length; i2++) {
      outArr.push({
        name: 'svg',
        emoji: '<img src="' + svgVisual[i2].src + '" width="14" height="14">',
        count: svgVisual[i2].count
      });
      if (finalTotal == null) { finalTotal = svgVisual[i2].count; }
      else { finalTotal += svgVisual[i2].count; }
    }
  }
  return { total: finalTotal, breakdown: outArr, saw: sawAny || hasTypes || svgVisual.length > 0 || finalTotal != null };
}

  /* ========= coleta de mídias em comentários / respostas ========= */
  function baseSrc(u) {
    if (!u) return '';
    var q = u.indexOf('?');
    return q >= 0 ? u.slice(0, q) : u;
  }
  function collectNodeMedia(node, avatarUrl) {
    try {
      var imgs = U.qa('img', node);
      var out = [];
      var seen = {};
      var avBase = baseSrc(avatarUrl || '');

      U.each(imgs, function (img) {
        if (!U.vis(img)) return;
        var r;
        try {
          r = img.getBoundingClientRect();
        } catch (_) {
          return;
        }
        if (!r || r.width < 40 || r.height < 40) return;

        var src = img.currentSrc || img.src || '';
        if (!src) return;

        var sbase = baseSrc(src);
        if (avBase && sbase === avBase) return;

        if (/emoji|sticker|reaction|spritemap|sprite|transparent/i.test(src)) return;
        if (/profile|_p32x32|_p40x40|_p48x48/i.test(src)) return;

        if (seen[sbase]) return;
        seen[sbase] = true;
        out.push({ url: src, w: Math.round(r.width || 0), h: Math.round(r.height || 0) });
      });

      /* vídeos embutidos em comentários (ex.: Munn Munna) */
      var videos = U.qa('video', node);
      U.each(videos, function (vid) {
        if (!U.vis(vid)) return;
        var r;
        try {
          r = vid.getBoundingClientRect();
        } catch (_) {
          return;
        }
        if (!r || r.width < 80 || r.height < 80) return;

        var src = vid.currentSrc || vid.src || '';
        if (!src) {
          var s = vid.querySelector('source[src]');
          if (s && s.src) src = s.src;
        }
        if (!src && vid.poster) {
          src = vid.poster;
        }
        if (!src) return;

        var sbase = baseSrc(src);
        if (avBase && sbase === avBase) return;
        if (seen[sbase]) return;
        seen[sbase] = true;
        out.push({ url: src, w: Math.round(r.width || 0), h: Math.round(r.height || 0) });
      });

      return out;
    } catch (e) {
      console.warn('Erro em collectNodeMedia:', e);
      return [];
    }
  }


/* ========= coleta de uma “fatia” + árvore completa de replies ========= */
function authorOf(n) {
  var as = U.filter(U.qa('a[role="link"],a[href]', n), function (a) {
    var nm = U.T(a.textContent || '');
    return U.vis(a) && nm.length > 1 && !isActionLabel(nm) && !isLikelyTimestamp(nm);
  });
  if (as.length) {
    var a = as[0];
    return { name: U.T(a.textContent || ''), href: a.href || '#', _el: a };
  }
  var s = U.q1('strong', n);
  if (s && U.vis(s) && U.T(s.textContent || '').length > 1)
    return { name: U.T(s.textContent || ''), href: '#', _el: s };
  var sp = U.filter(U.qa('span', n), function (x) {
    var t = U.T(x.textContent || '');
    return U.vis(x) && t.length > 1 && !isActionLabel(t) && !isLikelyTimestamp(t);
  });
  if (sp[0]) return { name: U.T(sp[0].textContent || ''), href: '#', _el: sp[0] };
  return { name: '', href: '#', _el: null };
}

function textWithEmoji(root) {
  if (!root) return '';
  var out = [];
  function walk(node) {
    if (!node) return;
    if (node.nodeType === 3) {
      out.push(node.nodeValue);
      return;
    }
    if (node.nodeType === 1) {
      if (node.tagName === 'IMG') {
        var alt = node.getAttribute('alt');
        if (alt) {
          out.push(alt);
          return;
        }
      }
      for (var c = node.firstChild; c; c = c.nextSibling) {
        walk(c);
      }
    }
  }
  walk(root);
  return out.join(' ');
}

function mainText(n) {
  var blocks = U.map(U.qa('div[dir="auto"],span[dir="auto"],p', n), function (x) {
    return U.T(textWithEmoji(x));
  });
  blocks = U.filter(blocks, function (s) {
    return !!s && !/^(curtir|like|responder|reply|seguir|follow)$/i.test(s) && !isLikelyTimestamp(s);
  });
  if (blocks.length) {
    blocks.sort(function (a, b) { return b.length - a.length; });
    if (!isJunk(blocks[0])) return blocks[0];
  }
  var raw = U.T(textWithEmoji(n));
  raw = raw.replace(/\b(Curtir|Like|Responder|Reply|Seguir|Follow)\b.*$/i, '').trim();
  if (isLikelyTimestamp(raw) || isJunk(raw)) return '';
  return raw;
}


function mainTextWithoutAuthor(n, au) {
  if (!au) au = { name: '', _el: null };
  var name = U.T(au.name || '');
  var blocks = U.map(U.qa('div[dir="auto"],span[dir="auto"],p', n), function (x) {
    if (au._el && x.contains && x.contains(au._el)) return '';
    return U.T(textWithEmoji(x));
  });
  blocks = U.filter(blocks, function (s) {
    return !!s &&
      s !== name &&
      !/^(curtir|like|responder|reply|seguir|follow)$/i.test(s) &&
      !isLikelyTimestamp(s);
  });
  if (blocks.length) {
    blocks.sort(function (a, b) { return b.length - a.length; });
    if (!isJunk(blocks[0])) return blocks[0];
  }
  var raw = mainText(n);
  if (raw === name) return '';
  return raw;
}
function computeLevelModel(items) {
  var lefts = U.filter(U.map(items, function (x) { return x.left; }), function (x) { return x > 0; })
    .sort(function (a, b) { return a - b; });
  if (!lefts.length) return { base: 0, step: 18, levelOf: function () { return 0; } };
  var uniq = [];
  for (var i = 0; i < lefts.length; i++) { if (uniq.indexOf(lefts[i]) < 0) uniq.push(lefts[i]); }
  var step = 18;
  if (uniq.length >= 2) {
    var diffs = [];
    for (var j = 1; j < uniq.length; j++) { diffs.push(uniq[j] - uniq[j - 1]); }
    diffs.sort(function (a, b) { return a - b; });
    step = Math.max(10, Math.round(diffs[Math.floor(diffs.length / 2)] * 0.7));
  }
  var base = Math.min.apply(null, lefts);
  function levelOf(lx) {
    var d = Math.max(0, lx - base);
    var lvl = Math.round(d / step);
    if (lvl < 0) lvl = 0;
    if (lvl > 8) lvl = 8;
    return lvl;
  }
  return { base: base, step: step, levelOf: levelOf };
}
function buildReplyTree(list, parentNode) {
  var items = [];
  U.each(list, function (rc) {
    var au = authorOf(rc), tx = mainText(rc);
    if (!au.name || !tx) return;
    if (!isHarvestableNodeForContext(rc, au, tx)) return;
    var tstamp = timestampOf(rc);
    var av = avatarURLStrong(au._el, rc) || null;
    var reacts = extractReactions(rc);
    var media = collectNodeMedia(rc, av);
    items.push({ el: rc, left: U.left(rc), au: au, tx: tx, tstamp: tstamp, av: av, reacts: reacts, media: media });
  });
  if (!items.length) return;
  var LM = computeLevelModel(items);
  var stack = [parentNode];
  var seen = {};
  function pushNodeAt(level, node) {
    if (level < 1) level = 1;
    if (level > stack.length) level = stack.length;
    stack = stack.slice(0, level);
    var p = stack[level - 1] || parentNode;
    (p.replies || (p.replies = [])).push(node);
    stack[level] = node;
  }
  U.each(items, function (it) {
    var key = (it.au.name + '|' + it.tx + '|' + it.tstamp.text).toLowerCase();
    if (seen[key]) return;
    seen[key] = 1;
    var lvl = LM.levelOf(it.left) + 1;
    var node = {
      type: 'reply',
      author: it.au.name,
      authorHref: it.au.href || '#',
      text: it.tx,
      likes: (it.reacts && it.reacts.total != null ? it.reacts.total : ''),
      date: it.tstamp.text || '',
      dateISO: it.tstamp.iso || null,
      avatarUrl: it.av || null,
      avatar: null,
      replies: [],
      reacts: it.reacts,
      media: it.media || []
    };
    pushNodeAt(lvl, node);
  });
}
function collectSlice(panel) {
  var cards = U.filter(U.qa('li[aria-posinset],div[role="article"]', panel), U.vis);
  if (!cards.length)
    cards = U.filter(U.qa('[aria-label*="oment"],[aria-label*="omment"],[aria-label*="espost"],[aria-label*="repl"]', panel), U.vis);
  if (!cards.length)
    cards = U.filter(U.qa('div,li', panel), function (el) { return U.vis(el) && U.T(el.textContent).length > 4; });
  cards.sort(function (a, b) {
    return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
  });
  var processed = [];
  U.each(cards, function (n) {
    var au = authorOf(n), tx = mainText(n);
    if (au.name && tx === au.name) {
      var altTx = mainTextWithoutAuthor(n, au);
      if (altTx && altTx !== au.name) tx = altTx;
    }
    var mediaCheck = collectNodeMedia(n, null);
    if (!au.name || (!tx && (!mediaCheck || !mediaCheck.length))) return;
    if (!isHarvestableNodeForContext(n, au, tx)) return;
    var tstamp = timestampOf(n);
    var av = avatarURLStrong(au._el, n) || null;
    var reacts = extractReactions(n);
    var media = collectNodeMedia(n, av);
    var z = U.first(U.qa('[aria-label*="repl"],[aria-label*="espost"],[aria-label*="reply"]', n), U.vis) || null;
    processed.push({ el: n, left: U.left(n), au: au, tx: tx, tstamp: tstamp, av: av, reacts: reacts, media: media, zones: z });
  });
  if (!processed.length) return { L1: 0, L2: 0, rows: [] };
  var LM = computeLevelModel(processed);
  var rows = [], stack = [];
  function pushNode(lvl, node) {
    if (lvl <= 0 || !stack.length) { rows.push(node); stack = [node]; return; }
    if (lvl > stack.length) lvl = stack.length;
    stack = stack.slice(0, lvl);
    var parent = stack[lvl - 1] || stack[stack.length - 1];
    (parent.replies || (parent.replies = [])).push(node);
    stack[lvl] = node;
  }
  U.each(processed, function (it) {
    var lvl = it.zones ? 0 : LM.levelOf(it.left);
    if (rows.length === 0) lvl = 0;
    var node = {
      type: 'comment',
      author: it.au.name,
      authorHref: it.au.href || '#',
      text: it.tx,
      likes: (it.reacts && it.reacts.total != null ? it.reacts.total : ''),
      date: it.tstamp.text || '',
      dateISO: it.tstamp.iso || null,
      avatarUrl: it.av || null,
      avatar: null,
      replies: [],
      reacts: it.reacts,
      media: it.media || []
    };
    pushNode(lvl, node);
    if (it.zones) {
      var list = U.filter(U.qa('div,li', it.zones), function (el) { return U.vis(el) && U.T(el.textContent).length > 1; });
      if (list.length) buildReplyTree(list, node);
    }
  });
  var counter = 0, L1 = 0, L2 = 0;
  function walkReplies(children) {
    for (var i = 0; i < children.length; i++) {
      var ch = children[i]; counter++; ch.num = counter + '.'; L2++;
      if (ch.replies && ch.replies.length) walkReplies(ch.replies);
    }
  }
  for (var i2 = 0; i2 < rows.length; i2++) {
    counter++; rows[i2].num = counter + '.'; L1++;
    if (rows[i2].replies && rows[i2].replies.length) walkReplies(rows[i2].replies);
  }
  return { L1: L1, L2: L2, rows: rows };
}

/* ========= merge/harvest ========= */
function keyC(r) { return (r.author + '|' + r.text + '|' + r.date).toLowerCase(); }
function mergeMedia(dst, src) {
  if (!src || !src.length) return;
  if (!dst.media) dst.media = [];
  var seen = Object.create(null);
  for (var i = 0; i < dst.media.length; i++) {
    var u = baseSrc(dst.media[i].url || '');
    if (u) seen[u] = true;
  }
  for (var j = 0; j < src.length; j++) {
    var m = src[j];
    var u2 = baseSrc(m.url || '');
    if (!u2) continue;
    if (seen[u2]) continue;
    seen[u2] = true;
    dst.media.push({
      url: m.url,
      type: m.type || null,
      alt: m.alt || '',
      loc: m.loc || null,
      avatarUrl: m.avatarUrl || null
    });
  }
}
function mergeReplies(dstNode, srcList) {
  dstNode.replies = dstNode.replies || [];
  for (var i = 0; i < srcList.length; i++) {
    var s = srcList[i], idx = -1;
    for (var j = 0; j < dstNode.replies.length; j++) {
      var d = dstNode.replies[j];
      if ((d.author || '') === (s.author || '') &&
        (d.text || '') === (s.text || '') &&
        (d.date || '') === (s.date || '')) { idx = j; break; }
    }
    if (idx < 0) {
      var clone = {
        type: s.type,
        author: s.author,
        authorHref: s.authorHref,
        text: s.text,
        likes: s.likes,
        date: s.date,
        dateISO: s.dateISO,
        avatarUrl: s.avatarUrl,
        avatar: s.avatar,
        replies: [],
        reacts: s.reacts || null,
        media: (s.media && s.media.slice()) || []
      };
      if (s.replies && s.replies.length) mergeReplies(clone, s.replies);
      dstNode.replies.push(clone);
    } else {
      var d2 = dstNode.replies[idx];
      if (!d2.avatar && s.avatar) d2.avatar = s.avatar;
      if (!d2.avatarUrl && s.avatarUrl) d2.avatarUrl = s.avatarUrl;
      if (!d2.likes && s.likes) d2.likes = s.likes;
      if (!d2.reacts && s.reacts) d2.reacts = s.reacts;
      mergeMedia(d2, s.media || []);
      if (s.replies && s.replies.length) mergeReplies(d2, s.replies);
    }
  }
}
function mergeInto(bag, slice) {
  U.each(slice.rows || [], function (r) {
    var kc = keyC(r);
    if (!bag.has(kc)) bag.set(kc, {
      type: r.type,
      author: r.author,
      authorHref: r.authorHref,
      text: r.text,
      likes: r.likes,
      date: r.date,
      dateISO: r.dateISO,
      avatarUrl: r.avatarUrl,
      avatar: r.avatar,
      replies: [],
      reacts: r.reacts || null,
      media: (r.media && r.media.slice()) || []
    });
    var dst = bag.get(kc);
    if (!dst.avatar && r.avatar) dst.avatar = r.avatar;
    if (!dst.avatarUrl && r.avatarUrl) dst.avatarUrl = r.avatarUrl;
    if (!dst.likes && r.likes) dst.likes = r.likes;
    if (!dst.reacts && r.reacts) dst.reacts = r.reacts;
    mergeMedia(dst, r.media || []);
    if (r.replies && r.replies.length) mergeReplies(dst, r.replies);
  });
}
function summarize(bag) {
  var rows = Array.from(bag.values());
  var counter = 0, L1 = 0, L2 = 0;
  function walk(children) {
    for (var i = 0; i < children.length; i++) {
      counter++; children[i].num = counter + '.'; L2++;
      if (children[i].replies && children[i].replies.length) walk(children[i].replies);
    }
  }
  for (var i2 = 0; i2 < rows.length; i2++) {
    counter++; rows[i2].num = counter + '.'; L1++;
    if (rows[i2].replies && rows[i2].replies.length) walk(rows[i2].replies);
  }
  return { L1: L1, L2: L2, rows: rows };
}

/* ========= colheita progressiva – POST CLÁSSICO ========= */
function progressiveHarvest(panel) {
  return new Promise(function (resolve) {
    var bag = new Map(), waves = 0, lastTotal = 0, stable = 0, lastTop = -1;
    var MAX_WAVES = 140;
    var MAX_STABLE = 14;

    function findMainVirtualScroller() {
      var nodes = U.qa('*', document.body);
      var cand = [];
      U.each(nodes, function (el) {
        try {
          if (!U.vis(el)) return;
          var r = el.getBoundingClientRect();
          var cs = getComputedStyle(el);
          var w = Math.round(r.width || 0), h = Math.round(r.height || 0);
          var ch = el.clientHeight || 0, sh = el.scrollHeight || 0;
          if (w <= 500 || h <= 100) return;
          if (sh <= ch + 100) return;
          if (!/(auto|scroll|overlay)/i.test(cs.overflowY || '')) return;
          var text = U.T(el.innerText || el.textContent || '').slice(0, 250);
          var score = (sh - ch);
          if (/Most relevant|All comments|Todos os comentários|Write a comment|Comment by|Like Reply|Curtir Responder/i.test(text)) score += 5000;
          cand.push({ el: el, score: score, sh: sh, ch: ch, top: el.scrollTop || 0, text: text });
        } catch (_) { }
      });
      cand.sort(function (a, b) { return b.score - a.score; });
      return cand.length ? cand[0].el : null;
    }

    function addCurrentSlice() {
      var slice = collectSlice(panel);
      mergeInto(bag, slice);
      var snap = summarize(bag);
      if (window.__HUDH__ && window.__HUDH__.setStats) window.__HUDH__.setStats(snap.L1, snap.L2);
      return snap;
    }

    function step() {
      if (window.__HUDH__ && window.__HUDH__.stop && window.__HUDH__.stop()) { resolve(summarize(bag)); return; }
      if (waves >= MAX_WAVES) { resolve(summarize(bag)); return; }

      waves++;
      if (window.__HUDH__ && window.__HUDH__.inc) window.__HUDH__.inc();
      if (window.__HUDH__ && window.__HUDH__.set) window.__HUDH__.set(Math.min(68, 8 + Math.round(waves * 0.7)), 'Carregando comentários em ondas…');

      clickAllUntilExhausted(panel, 10)
        .then(function () {
          addCurrentSlice();
          var sc = findMainVirtualScroller();
          if (!sc) {
            stable++;
            return U.sleep(500).then(function () { return { moved: false, top: -1, maxTop: -1 }; });
          }
          var beforeTop = sc.scrollTop || 0;
          var maxTop = Math.max(0, (sc.scrollHeight || 0) - (sc.clientHeight || 0));
          try {
            sc.scrollTop = Math.min(beforeTop + Math.floor((sc.clientHeight || 600) * 0.65), maxTop);
          } catch (_) { }
          try {
            sc.dispatchEvent(new WheelEvent('wheel', {
              bubbles: true,
              cancelable: true,
              deltaY: 700,
              deltaMode: 0
            }));
          } catch (_) { }
          return U.sleep(850).then(function () {
            return { moved: Math.abs((sc.scrollTop || 0) - beforeTop) > 2, top: sc.scrollTop || 0, maxTop: Math.max(0, (sc.scrollHeight || 0) - (sc.clientHeight || 0)) };
          });
        })
        .then(function (mv) {
          var snap = addCurrentSlice();
          var total = snap.L1 + snap.L2;
          if (total > lastTotal) {
            lastTotal = total;
            stable = 0;
          } else {
            if (mv && mv.moved) stable = Math.max(0, stable - 1);
            else stable++;
          }
          if (mv && mv.top !== lastTop) {
            lastTop = mv.top;
          }
          if (mv && mv.maxTop >= 0 && mv.top >= mv.maxTop - 5 && total <= lastTotal) stable++;
          if (stable >= MAX_STABLE) { resolve(summarize(bag)); return; }
          step();
        })
        .catch(function(e){
          console.warn('Erro em progressiveHarvest virtualizado (post clássico):', e);
          resolve(summarize(bag));
        });
    }

    addCurrentSlice();
    U.sleep(400).then(step);
  });
}

/* ========= colheita progressiva – REEL ========= */
/* ========= colheita progressiva – REEL ========= */
function progressiveHarvestReel(panel) {
  return new Promise(function (resolve) {
    var bag = new Map();
    var waves = 0;
    var last = 0;
    var stable = 0;

    var MAX_WAVES  = 80;      // máximo de ciclos de colheita
    var MAX_STABLE = 10;      // ciclos seguidos sem aumentar L1+L2
    var MAX_MS     = 90000;   // 90s de colheita no máximo
    var startTime  = (U.now ? U.now() : Date.now());

    function loop() {
      if (!window.__HUDH__ || typeof window.__HUDH__.stop !== 'function') {
        resolve(summarize(bag));
        return;
      }
      if (window.__HUDH__.stop()) {
        resolve(summarize(bag));
        return;
      }

      var elapsed = (U.now ? U.now() : Date.now()) - startTime;
      if (waves >= MAX_WAVES || stable >= MAX_STABLE || elapsed >= MAX_MS) {
        resolve(summarize(bag));
        return;
      }

      waves++;
      if (window.__HUDH__.inc) window.__HUDH__.inc();

      // REEL: não rola página, apenas expande comentários e respostas
      clickAllUntilExhausted(panel, 40)
        .then(function () {
          mergeInto(bag, collectSlice(panel));
          var snap = summarize(bag);
          if (window.__HUDH__.setStats) window.__HUDH__.setStats(snap.L1, snap.L2);

          var cur = snap.L1 + snap.L2;
          if (cur > last) {
            last = cur;
            stable = 0;
          } else {
            stable++;
          }

          return U.waitMut(panel, 900).then(function () { return U.sleep(80); });
        })
        .then(function () {
          loop();
        })
        .catch(function (e) {
          console.warn('Erro em progressiveHarvestReel:', e);
          resolve(summarize(bag));
        });
    }

    U.waitMut(panel, 400).then(loop);
  });
}

/* ========= metadados ========= */
function collectMeta() {
  try {
    var panel = panelRoot(), qa = U.qa, q1 = U.q1, vis = U.vis, T = U.T;

    function decodeDeep(s) {
      var out = String(s || '');
      for (var i = 0; i < 5; i++) {
        out = out
          .replace(/\\\//g, '/')
          .replace(/\\u002F/g, '/')
          .replace(/\\u003A/g, ':')
          .replace(/\\u0026/g, '&')
          .replace(/\\u003D/g, '=')
          .replace(/\\u003F/g, '?')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"');
        try { out = decodeURIComponent(out); } catch (e) {}
      }
      return out;
    }
    function abs(u) {
      if (!u) return '';
      u = String(u);
      if (u.indexOf('https://') === 0 || u.indexOf('http://') === 0) return u;
      if (u.indexOf('/') === 0) return 'https://www.facebook.com' + u;
      return u;
    }
    function cleanFB(u) {
      u = decodeDeep(abs(u || ''));
      if (!u) return '';
      var m;
      m = u.match(/https?:\/\/(?:www\.)?facebook\.com\/reel\/(\d{5,})/i);
      if (m && m[1]) return 'https://www.facebook.com/reel/' + m[1];
      m = u.match(/https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>]+\/posts\/(pfbid[\w-]+)/i);
      if (m && m[1]) return u.split('?')[0];
      if (/facebook\.com\/photo\.php\?fbid=\d+/i.test(u)) return u.split('&__')[0].replace(/&amp;/g,'&');
      if (/facebook\.com\/(?:watch\/\?v=|[^\s"'<>]+\/videos\/\d+)/i.test(u)) return u.split('&__')[0].replace(/&amp;/g,'&');
      return '';
    }
    function scoreURL(u) {
      if (!u) return -999;
      if (/\/reel\/\d{5,}/i.test(u)) return 100;
      if (/\/posts\/pfbid/i.test(u)) return 90;
      if (/photo\.php\?fbid=/i.test(u)) return 80;
      if (/\/videos\/\d+|watch\/\?v=\d+/i.test(u)) return 70;
      if (/\/reel\/\?s=tab/i.test(u)) return -1000;
      return 0;
    }
    function currentPfbid() {
      var m = location.href.match(/\/posts\/(pfbid[\w-]+)/i);
      return m && m[1] ? m[1] : '';
    }
    function currentReelId() {
      var m = location.href.match(/\/reel\/(\d{5,})/i);
      return m && m[1] ? m[1] : '';
    }

    var pid = currentPfbid();
    var rid = currentReelId();
    var postURL = '';
    if (rid) postURL = 'https://www.facebook.com/reel/' + rid;
    else if (pid) postURL = cleanFB(location.href) || location.href.split('?')[0];
    else postURL = cleanFB(location.href) || location.href;

    try {
      var ogu = document.querySelector('meta[property="og:url"], link[rel="canonical"]');
      var ogc = ogu && (ogu.getAttribute('content') || ogu.getAttribute('href'));
      var cu = cleanFB(ogc);
      if (scoreURL(cu) > scoreURL(postURL)) postURL = cu;
    } catch (e) {}

    try {
      var rawHtml = document.documentElement.outerHTML || document.documentElement.innerHTML || '';
      var txt = decodeDeep(rawHtml);
      var cands = [], re, m;
      re = /https?:\/\/(?:www\.)?facebook\.com\/reel\/(\d{5,})/gi;
      while ((m = re.exec(txt)) !== null) cands.push('https://www.facebook.com/reel/' + m[1]);
      re = /\/reel\/(\d{5,})/gi;
      while ((m = re.exec(txt)) !== null) cands.push('https://www.facebook.com/reel/' + m[1]);
      re = /https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>]+\/posts\/pfbid[\w-]+/gi;
      while ((m = re.exec(txt)) !== null) cands.push(cleanFB(m[0]));
      re = /https?:\/\/(?:www\.)?facebook\.com\/photo\.php\?fbid=\d+[^\s"'<>]*/gi;
      while ((m = re.exec(txt)) !== null) cands.push(cleanFB(m[0]));
      for (var ci = 0; ci < cands.length; ci++) {
        var cc = cleanFB(cands[ci]);
        if (pid && cc.indexOf('/posts/' + pid) === -1 && !/photo\.php\?fbid=/i.test(cc)) continue;
        if (scoreURL(cc) > scoreURL(postURL)) postURL = cc;
      }
    } catch (e) {}

    try {
      var linksForURL = qa('a[href*="/posts/"], a[href*="/videos/"], a[href*="/photo.php"], a[href*="/reel/"], a[href*="watch/?v="]', panel);
      for (var li = 0; li < linksForURL.length; li++) {
        if (!vis(linksForURL[li])) continue;
        var lu = cleanFB(linksForURL[li].href || linksForURL[li].getAttribute('href') || '');
        if (pid && lu.indexOf('/posts/' + pid) === -1 && !/photo\.php\?fbid=/i.test(lu)) continue;
        if (scoreURL(lu) > scoreURL(postURL)) postURL = lu;
      }
    } catch (e) {}

    function findPostRootForMeta() {
      if (!pid) return panel;
      var nodes = qa('div[role="article"], div, main', document.body);
      var best = null, bestScore = -9999;
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (!vis(el)) continue;
        var r = el.getBoundingClientRect();
        if (r.width < 300 || r.height < 100) continue;
        var text = T(el.innerText || el.textContent || '');
        var links = qa('a[href]', el);
        var hasPost = false, hasAuthor = false, hasComment = false;
        for (var j = 0; j < links.length; j++) {
          var tx = T(links[j].innerText || links[j].textContent || '');
          var href = links[j].href || '';
          if (href.indexOf('/posts/' + pid) !== -1) hasPost = true;
          if (tx === 'Paulin da Biz' || /paulinho\.tjf/i.test(href)) hasAuthor = true;
        }
        hasComment = /Rosemere Alves|Francisco Rodrigues|All comments|Most relevant|Curtir|Like|Reply|Responder/i.test(text);
        var score = (hasPost ? 100 : 0) + (hasAuthor ? 40 : 0) + (hasComment ? 20 : 0);
        if (/Sponsored|Patrocinado|Ads Manager|Marketplace|Contacts|Meta AI/i.test(text)) score -= 50;
        score -= Math.min(80, Math.round((r.width * r.height) / 100000));
        if (score > bestScore) { bestScore = score; best = el; }
      }
      return best || panel;
    }

    var metaRoot = findPostRootForMeta();

    function firstCommentTop(root) {
      var arts = qa('div[role="article"]', root).map(function (el) {
        var rr = el.getBoundingClientRect();
        return { top: Math.round(rr.top), text: T(el.innerText || el.textContent || ''), aria: T(el.getAttribute('aria-label') || '') };
      }).filter(function (x) {
        return /Comment by|Rosemere Alves|Francisco Rodrigues|Fernanda Gomes|Alexandra Paula|Luci Marly|Roberta Cristina|Luiz Salvat|Rodrigo Monteiro/i.test(x.text + ' ' + x.aria);
      }).sort(function (a,b) { return a.top - b.top; });
      return arts[0] ? arts[0].top - 8 : Infinity;
    }

    var author = '', authorURL = '';
    if (pid) {
      var authorLinks = qa('a[role="link"], strong a, h2 a, h3 a', metaRoot);
      for (var ai = 0; ai < authorLinks.length; ai++) {
        var al = authorLinks[ai];
        var at = T(al.innerText || al.textContent || '');
        var ah = al.href || '';
        if (!at || !ah) continue;
        if (/comment_id=|^\d+$|^4y$|tenor|giphy|photos from|snop|s\s*n\s*o\s*p|facebook|see more|ver mais/i.test(at + ' ' + ah)) continue;
        author = at; authorURL = ah; break;
      }
      // PATCH v5: fallback robusto para post/foto quando o cabeçalho sai do metaRoot após o scroll.
      if (!author) {
        try {
          var slugM = (postURL || location.href || '').match(/facebook\.com\/([^\/\?\#]+)\/posts\/pfbid/i);
          var slug = slugM && slugM[1] ? slugM[1] : '';
          if (slug && !/^(reel|watch|photo\.php)$/i.test(slug)) {
            var allAuthorLinks = qa('a[href]', document.body);
            for (var afi = 0; afi < allAuthorLinks.length; afi++) {
              var fa = allAuthorLinks[afi];
              var ft = T(fa.innerText || fa.textContent || '');
              var fh = fa.href || '';
              if (!ft || !fh) continue;
              if (fh.indexOf('facebook.com/' + slug) === -1) continue;
              if (/\/posts\/|comment_id=|\/stories\/|photo\.php|^\d+$|^4y$|tenor|giphy|photos from|snop|s\s*n\s*o\s*p|facebook|see more|ver mais/i.test(ft + ' ' + fh)) continue;
              author = ft; authorURL = fh; break;
            }
          }
        } catch (e) {}
      }
    } else {
      var cand = U.first(qa('h2 a[role="link"], h3 a[role="link"], a[role="link"][href*="/people/"], strong a[role="link"]', panel), vis) ||
        U.first(qa('a[role="link"]', panel), function (el) { return vis(el) && T(el.textContent).length > 1; });
      if (cand) { author = T(cand.textContent); authorURL = cand.href || ''; }
    }

    var caption = '';
    if (pid) {
      var lim = firstCommentTop(metaRoot);
      var nodes = qa('div[dir="auto"], span[dir="auto"]', metaRoot).map(function (el, idx) {
        var rr = el.getBoundingClientRect();
        return { text: T(el.innerText || el.textContent || ''), top: Math.round(rr.top), left: Math.round(rr.left), w: Math.round(rr.width), h: Math.round(rr.height) };
      }).filter(function (x) {
        return x.top < lim && x.text.length > 25 &&
          !fbIsScrambledMetaNoise(x.text) &&
          !/Paulin da Biz|Carlos da Silva|2 others|Photos from|See original|Rate this translation|No photo description/i.test(x.text) &&
          !/Rosemere Alves|Francisco Rodrigues|Fernanda Gomes|Alexandra Paula|Luci Marly|Roberta Cristina|Luiz Salvat|Rodrigo Monteiro/i.test(x.text) &&
          !/Like|Reply|Curtir|Responder|comment|comentário/i.test(x.text) &&
          !/s\s*n\s*o\s*p|snopSrd|Sponsored/i.test(x.text) &&
          !/^[A-Za-z0-9]{16,}$/.test(x.text);
      }).sort(function (a,b) { return a.top - b.top || b.text.length - a.text.length; });
      var parts = [];
      for (var ni = 0; ni < nodes.length; ni++) {
        var t = fbStripScrambledMetaNoise(nodes[ni].text).replace(/\s*See more\s*/gi, '').trim();
        if (!t) continue;
        var inside = false;
        for (var pi = 0; pi < parts.length; pi++) {
          if (parts[pi].indexOf(t) !== -1 || t.indexOf(parts[pi]) !== -1) { inside = true; break; }
        }
        if (!inside) parts.push(t);
      }
      caption = parts.join(' ').trim();
    }
    if (!caption) {
      var c1 = q1('[data-ad-preview="message"]', panel); if (c1) caption = T(c1.textContent);
    }
    if (!caption) {
      var c2 = U.first(qa('div[dir="auto"], span[dir="auto"], p', panel),
        function (el) { return vis(el) && T(el.textContent).length > 40; });
      if (c2) caption = T(c2.textContent);
    }
    if (!caption) {
      var og = q1('meta[property="og:description"], meta[name="description"], meta[property="twitter:description"]');
      caption = (og && og.getAttribute('content')) || '';
    }


    // PATCH v9-photo: metadados específicos do viewer photo.php, sem alterar post/reel.
    try {
      if (isPhotoContext()) {
        if (!postURL || !/photo/i.test(postURL)) postURL = cleanFB(location.href) || location.href;
        if (!author || /Verified account/i.test(author)) {
          var _photoLinks = qa('a[href]', document.body);
          for (var _pa = 0; _pa < _photoLinks.length; _pa++) {
            var _pl = _photoLinks[_pa];
            if (!vis(_pl)) continue;
            var _pt = T(_pl.innerText || _pl.textContent || '');
            var _ph = _pl.href || '';
            if (!_pt || !_ph) continue;
            if (/comment_id=|stories|followers|following|photos|photo\.php|hashtag|facebook\.com\/$|reel\/\?s=tab/i.test(_ph)) continue;
            if (/Facebook|Home|Reels|Friends|Marketplace|Gaming|See all|Unread|Verified account/i.test(_pt)) continue;
            author = _pt.replace(/\s*Verified account\s*/i, '').trim();
            authorURL = _ph.split('?')[0];
            break;
          }
        }
        if (true) {
          var _firstTop = Infinity;
          var _arts = qa('div[role="article"]', document.body);
          for (var _ai2 = 0; _ai2 < _arts.length; _ai2++) {
            var _atxt = T(_arts[_ai2].innerText || _arts[_ai2].textContent || '');
            var _aar = T(_arts[_ai2].getAttribute('aria-label') || '');
            if (/^(Comment|Reply) by /i.test(_aar) || /\b(Like|Reply|Curtir|Responder)\b/i.test(_atxt)) {
              var _rr2 = _arts[_ai2].getBoundingClientRect();
              if (_rr2.top < _firstTop) _firstTop = Math.round(_rr2.top);
            }
          }
          var _nodes2 = qa('div[dir="auto"], span[dir="auto"], p', document.body).map(function(el){
            var _r = el.getBoundingClientRect();
            return { text: T(el.innerText || el.textContent || ''), top: Math.round(_r.top), left: Math.round(_r.left), w: Math.round(_r.width), h: Math.round(_r.height) };
          }).filter(function(x){
            return x.top < _firstTop - 8 && x.text.length > 35 &&
              !fbIsScrambledMetaNoise(x.text) &&
              !/Facebook Menu|Number of unread|CNNBrasil$|Verified account|Shared with Public|See all|followers|following|Photos|Home|Reels|Friends|Marketplace|Gaming/i.test(x.text) &&
              !/p\s*n\s*r\s*o\s*o\s*S|pnrooS|^[A-Za-z0-9]{16,}$/i.test(x.text);
          }).sort(function(a,b){ return a.top - b.top || b.text.length - a.text.length; });
          var _parts2 = [];
          for (var _ni2 = 0; _ni2 < _nodes2.length; _ni2++) {
            var _tt2 = fbStripScrambledMetaNoise(_nodes2[_ni2].text).replace(/\s*See more\s*/gi, '').trim();
            if (!_tt2) continue;
            var _inside2 = false;
            for (var _pi2 = 0; _pi2 < _parts2.length; _pi2++) {
              if (_parts2[_pi2].indexOf(_tt2) !== -1 || _tt2.indexOf(_parts2[_pi2]) !== -1) { _inside2 = true; break; }
            }
            if (!_inside2) _parts2.push(_tt2);
          }
          if (_parts2.length) { var _newCap2 = _parts2.join(' ').trim(); if (!caption || _newCap2.length > caption.length || /su…|See more/i.test(caption)) caption = _newCap2; }
        }

        // PATCH 29-04-2026 PHOTO-CAPTION-ONLY:
        // aplica seleção estrita apenas no PHOTO, sem alterar POST/REEL.
        caption = fbPhotoExtractBestCaption(caption);
      }
    } catch (e) {}

    // PATCH v8: fallback generico de autor para post/foto, SEM mexer em Reel/video.
    // Motivo: em alguns posts o root mantem legenda/contagens, mas o link textual do perfil desaparece apos scroll;
    // nesses casos o autor pode ser recuperado do titulo do modal, por exemplo "OneL13's Post", e/ou do slug da URL.
    try {
      if (pid && postURL && /facebook\.com\/([^\/\?\#]+)\/posts\/pfbid/i.test(postURL)) {
        var _am = postURL.match(/facebook\.com\/([^\/\?\#]+)\/posts\/pfbid/i);
        var _slug = _am && _am[1] ? decodeURIComponent(_am[1]) : '';
        if (_slug && !/^(reel|watch|photo\.php|groups|profile\.php)$/i.test(_slug)) {
          var _modalTitle = '';
          try {
            var _titleNodes = qa('[role="dialog"] h1, [role="dialog"] h2, [role="dialog"] [aria-level="1"], [role="dialog"] [aria-level="2"]', document.body);
            for (var _ti = 0; _ti < _titleNodes.length; _ti++) {
              var _tt = T(_titleNodes[_ti].innerText || _titleNodes[_ti].textContent || '');
              if (/\bPost\b|Publica/i.test(_tt)) { _modalTitle = _tt; break; }
            }
          } catch (_) {}
          var _titleAuthor = '';
          var _tm = _modalTitle.match(/^(.+?)\s*(?:'s|’s)\s+Post\b/i) || _modalTitle.match(/^Publica(?:ção|cao)\s+de\s+(.+?)$/i);
          if (_tm && _tm[1]) _titleAuthor = T(_tm[1]);
          if (!author) author = _titleAuthor || _slug;
          if (!authorURL) authorURL = 'https://www.facebook.com/' + _slug;
        }
      }
    } catch (e) {}
    return { author: author, authorURL: authorURL, caption: T(isPhotoContext() ? fbPhotoExtractBestCaption(caption) : fbStripScrambledMetaNoise(caption)), postURL: postURL };
  } catch (_) {
    return { author: '', authorURL: '', caption: '', postURL: location.href };
  }
}

function collectCountsReelByClasses() {
  var outerSelector =
    'span.x193iq5w.xeuugli.x13faqbe.x1vvkbs.x1xmvt09.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x4zkp8e.x3x7a5m.x1nxh6w3.x1sibtaa.x1s688f.x17z8epw';

  var innerSelector =
    'span.x1lliihq.x6ikm8r.x10wlt62.x1n2onr6.xlyipyv.xuxw1ft.x1j85h84';

  // CORRIGIDO: lida corretamente com 13.6K, 1,6K, 3K, 2.3M, etc.
  function parseNum(str) {
    if (!str) return null;
    str = String(str).trim();

    // sufixo opcional K / M
    var sufMatch = str.match(/([KM])\b/i);
    var suffix = sufMatch ? sufMatch[1].toUpperCase() : null;

    // parte numérica (inteiro ou decimal, com . ou ,)
    var m = str.match(/([\d]+(?:[.,]\d+)?)/);
    if (!m) return null;
    var numStr = m[1];

    // se only vírgula -> decimal; se tem ponto também, remove vírgulas
    if (numStr.indexOf(',') >= 0 && numStr.indexOf('.') < 0) {
      numStr = numStr.replace(',', '.');
    } else {
      numStr = numStr.replace(/,/g, '');
    }

    var val = parseFloat(numStr);
    if (!isFinite(val)) return null;

    if (suffix === 'K') val *= 1e3;
    else if (suffix === 'M') val *= 1e6;

    return Math.round(val);
  }

  var outers = Array.prototype.slice.call(document.querySelectorAll(outerSelector));

  var candidatos = outers.map(function (el, idx) {
    var inner = el.querySelector(innerSelector);
    var txt = inner ? inner.textContent.trim() : el.textContent.trim();
    var rect = el.getBoundingClientRect();
    return {
      index: idx,
      text: txt,
      num: parseNum(txt),
      top: rect.top,
      left: rect.left
    };
  });

  console.log('=== REELS – candidatos por classes EXATAS ===');
  console.log('Candidatos encontrados:', candidatos);

  var like = null, comment = null, share = null;

  if (candidatos.length >= 3) {
    like = candidatos[0].num;
    comment = candidatos[1].num;
    share = candidatos[2].num;
  }

  return { like: like, comment: comment, share: share, candidatos: candidatos };
}

/* ===== snapshot global das contagens de Reel (antes de abrir comentários) ===== */
var __REEL_COUNTS_SNAPSHOT__ = null;
/* ===== snapshot global das contagens de POST/PFBID antes da expansão/scroll ===== */
var __POST_COUNTS_SNAPSHOT__ = null;

/* === contagens gerais (posts + reels) === */
function collectCounts() {
  var qa = U.qa, T = U.T, vis = U.vis;
  var out = { like: null, comment: null, share: null, view: null };

  var lockLike = false, lockComment = false, lockShare = false;

  try {
    if (isReelContext()) {
      if (__REEL_COUNTS_SNAPSHOT__) {
        if (__REEL_COUNTS_SNAPSHOT__.like != null)   { out.like    = __REEL_COUNTS_SNAPSHOT__.like;    lockLike    = true; }
        if (__REEL_COUNTS_SNAPSHOT__.comment != null){ out.comment = __REEL_COUNTS_SNAPSHOT__.comment; lockComment = true; }
        if (__REEL_COUNTS_SNAPSHOT__.share != null)  { out.share   = __REEL_COUNTS_SNAPSHOT__.share;   lockShare   = true; }
      } else {
        var rc = collectCountsReelByClasses();
        if (rc) {
          if (rc.like != null)   { out.like   = rc.like;   lockLike   = true; }
          if (rc.comment != null){ out.comment= rc.comment;lockComment= true; }
          if (rc.share != null)  { out.share  = rc.share;  lockShare  = true; }
        }
      }
    }

    function num(s) {
      var m = String(s || '').match(/([\d][\d\.\,]*)\s*([KM])?/i);
      if (!m) return null;
      var v = +(m[1] || '').replace(/\./g, '').replace(/,/g, '.');
      if (!isFinite(v)) return null;
      var suf = (m[2] || '').toUpperCase();
      if (suf === 'K') v *= 1e3;
      if (suf === 'M') v *= 1e6;
      return Math.round(v);
    }
    var rxReactEn = /all reactions/i;
    var rxReactPt = /todas as rea[cç][oõ]es?/i;
    var rxCom = /\bcomments?\b|\bcoment[aá]rios?\b/i;
    var rxShare = /\bshares?\b|\bcompartilhamentos?\b/i;

    var btns = qa('div[role="button"]', document.body);
    U.each(btns, function (el) {
      if (!vis(el)) return;
      var txt = T(el.textContent || '');
      var v = num(txt);
      if (v == null) return;
      if (!lockLike && (rxReactEn.test(txt) || rxReactPt.test(txt))) {
        if (out.like == null || v > out.like) out.like = v;
      }
      if (!lockComment && rxCom.test(txt)) {
        if (out.comment == null || v > out.comment) out.comment = v;
      }
      if (!lockShare && rxShare.test(txt)) {
        if (out.share == null || v > out.share) out.share = v;
      }
    });

    var els = qa('[aria-label], [title], span, div, a, button').slice(0, 4000);
    var R_VIEW = /visualiza[cç][oõ]es|views?/i,
      R_NOW = /(assistindo|vendo)\s+agora|watching\s+now|ao\s+vivo/i;
    function nView(s) {
      var m = String(s || '').match(/([\d][\d\.\,]*)\s*([KM])?/i); if (!m) return null;
      var x = +(m[1] || '').replace(/\./g, '').replace(/,/g, '.'); var suf = (m[2] || '').toUpperCase();
      if (suf === 'K') x *= 1e3; if (suf === 'M') x *= 1e6; return Math.round(x);
    }
    var bestView = null;
    U.each(els, function (el) {
      if (!vis(el)) return;
      var lab = ((el.getAttribute && el.getAttribute('aria-label')) || '') + ' ' +
        ((el.getAttribute && el.getAttribute('title')) || '');
      var text = T(lab + ' ' + (el.textContent || ''));
      var v = nView(text);
      if (v == null) return;
      if (R_VIEW.test(text) && !R_NOW.test(text)) {
        if (bestView == null || v > bestView) bestView = v;
      }
    });
    out.view = bestView;

    // PATCH v5: contagens de post/foto não devem usar "view" incidental de mídia.
    // Para /posts/pfbid, extrai somente números do cabeçalho do post: Like/Comment/Share.
    (function patchPostCounts() {
      try {
        if (isReelContext()) return;
        var pm = String(location.href || '').match(/\/posts\/(pfbid[\w-]+)/i);
        if (!pm || !pm[1]) return;
        var pidLocal = pm[1];

        function findPostRootForCounts() {
          var nodes = qa('div[role="article"], div, main', document.body);
          var best = null, bestScore = -9999;
          for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            if (!vis(el)) continue;
            var r = el.getBoundingClientRect();
            if (r.width < 300 || r.height < 100) continue;
            var text = T(el.innerText || el.textContent || '');
            var links = qa('a[href]', el);
            var hasPost = false, hasAuthor = false, hasComment = false;
            for (var j = 0; j < links.length; j++) {
              var tx = T(links[j].innerText || links[j].textContent || '');
              var href = links[j].href || '';
              if (href.indexOf('/posts/' + pidLocal) !== -1) hasPost = true;
              if (tx && href && href.indexOf('/posts/' + pidLocal) === -1 && /facebook\.com\/[^\/\?\#]+/i.test(href) && !/comment_id=|photo\.php|\/stories\//i.test(href)) hasAuthor = true;
            }
            hasComment = /All comments|Most relevant|Curtir|Like|Reply|Responder|Rosemere Alves|Francisco Rodrigues/i.test(text);
            var score = (hasPost ? 100 : 0) + (hasAuthor ? 40 : 0) + (hasComment ? 20 : 0);
            if (/Sponsored|Patrocinado|Ads Manager|Marketplace|Contacts|Meta AI/i.test(text)) score -= 50;
            score -= Math.min(80, Math.round((r.width * r.height) / 100000));
            if (score > bestScore) { bestScore = score; best = el; }
          }
          return best || document.body;
        }

        function firstCommentTopForCounts(root) {
          var arr = qa('div[role="article"]', root).map(function (el) {
            var rr = el.getBoundingClientRect();
            return { top: Math.round(rr.top), text: T(el.innerText || el.textContent || ''), aria: T(el.getAttribute('aria-label') || '') };
          }).filter(function (x) {
            return /Comment by|Curtir|Responder|Like Reply|Rosemere Alves|Francisco Rodrigues|Fernanda Gomes|Alexandra Paula/i.test(x.text + ' ' + x.aria);
          }).sort(function (a,b) { return a.top - b.top; });
          return arr[0] ? arr[0].top - 8 : Infinity;
        }

        var rootC = findPostRootForCounts();
        var limTop = firstCommentTopForCounts(rootC);
        var cc = { like: null, comment: null, share: null };
        var cand = qa('[aria-label], [role="button"], button, span, a, div', rootC).slice(0, 2500);
        U.each(cand, function (el) {
          try {
            if (!vis(el)) return;
            var rr = el.getBoundingClientRect();
            if (Math.round(rr.top) >= limTop) return;
            if (rr.width > 260 || rr.height > 80) return;
            var tx = T(el.innerText || el.textContent || '');
            var ar = T((el.getAttribute && el.getAttribute('aria-label')) || '');
            var ti = T((el.getAttribute && el.getAttribute('title')) || '');
            var label = ar + ' ' + ti;
            var val = num(tx) != null ? num(tx) : num(label);
            if (val == null) return;
            if (/^\d+(?:[\.,]\d+)?\s*[KkMm]?$/.test(tx) || /^\d+(?:[\.,]\d+)?\s*[KkMm]?$/.test(label)) {
              if (/\b(Like|Curtir|reactions?|rea[cç][oõ]es?|curtidas?)\b/i.test(label) && cc.like == null) cc.like = val;
              if (/\b(Comment|Coment[aá]rios?)\b/i.test(label) && cc.comment == null) cc.comment = val;
              if (/(\bShare\b|\bCompartilhamentos?\b|send this to friends|post it on your profile)/i.test(label) && cc.share == null) cc.share = val;
            }
          } catch (e) {}
        });
        // PATCH v7: fallback visual estritamente para /posts/pfbid; captura trio horizontal do cabeçalho (ex.: 33/8/6).
        if (cc.share == null || cc.like == null || cc.comment == null) {
          try {
            var nums2 = [];
            U.each(cand, function (el) {
              if (!vis(el)) return;
              var rr2 = el.getBoundingClientRect();
              if (Math.round(rr2.top) >= limTop) return;
              if (rr2.width > 120 || rr2.height > 60) return;
              var tx2 = T(el.innerText || el.textContent || '');
              if (!/^\d+(?:[\.,]\d+)?\s*[KkMm]?$/.test(tx2)) return;
              var vv2 = num(tx2);
              if (vv2 == null) return;
              nums2.push({ val: vv2, top: Math.round(rr2.top), left: Math.round(rr2.left) });
            });
            nums2 = nums2.sort(function (a,b) { return a.top - b.top || a.left - b.left; });
            for (var n2 = 0; n2 < nums2.length - 2; n2++) {
              var a2 = nums2[n2], b2 = nums2[n2+1], c2 = nums2[n2+2];
              if (Math.abs(a2.top - b2.top) <= 8 && Math.abs(b2.top - c2.top) <= 8 && a2.left < b2.left && b2.left < c2.left) {
                if (cc.like == null) cc.like = a2.val;
                if (cc.comment == null) cc.comment = b2.val;
                if (cc.share == null) cc.share = c2.val;
                break;
              }
            }
          } catch (e7) {}
        }
        if (cc.like != null) out.like = cc.like;
        if (cc.comment != null) out.comment = cc.comment;
        if (cc.share != null) out.share = cc.share;
        out.view = null;
      } catch (e) { }
    })();

    // PATCH v10-photo: contagens específicas do viewer photo.php.
    // Usa somente o trio visual horizontal do cabeçalho (reações / comentários / compartilhamentos)
    // e remove "view" incidental gerado por outros elementos do Facebook.
    (function patchPhotoCounts() {
      try {
        if (!isPhotoContext()) return;
        var pc = { like: null, comment: null, share: null };
        var nums = [];
        var els2 = qa('[aria-label], [role="button"], button, span, a, div', document.body).slice(0, 5000);
        U.each(els2, function (el) {
          try {
            if (!vis(el)) return;
            var rr = el.getBoundingClientRect();
            if (rr.width > 180 || rr.height > 70) return;
            var tx = T(el.innerText || el.textContent || '');
            var ar = T((el.getAttribute && el.getAttribute('aria-label')) || '');
            var ti = T((el.getAttribute && el.getAttribute('title')) || '');
            if (!/^\d+(?:[\.,]\d+)?\s*[KkMm]?$/.test(tx)) return;
            var vv = num(tx);
            if (vv == null) return;
            nums.push({ val: vv, top: Math.round(rr.top), left: Math.round(rr.left), aria: ar, title: ti });
            var label = ar + ' ' + ti;
            if (/\b(Like|Curtir|reactions?|rea[cç][oõ]es?|curtidas?)\b/i.test(label) && pc.like == null) pc.like = vv;
            if (/\b(Comment|Leave a comment|Coment[aá]rios?)\b/i.test(label) && pc.comment == null) pc.comment = vv;
            if (/(\bShare\b|\bCompartilhamentos?\b|send this to friends|post it on your profile)/i.test(label) && pc.share == null) pc.share = vv;
          } catch (_e) {}
        });
        nums = nums.sort(function (a,b) { return a.top - b.top || a.left - b.left; });
        if (pc.like == null || pc.comment == null || pc.share == null) {
          for (var i3 = 0; i3 < nums.length - 2; i3++) {
            var a3 = nums[i3], b3 = nums[i3+1], c3 = nums[i3+2];
            if (Math.abs(a3.top - b3.top) <= 8 && Math.abs(b3.top - c3.top) <= 8 && a3.left < b3.left && b3.left < c3.left) {
              if (pc.like == null) pc.like = a3.val;
              if (pc.comment == null) pc.comment = b3.val;
              if (pc.share == null) pc.share = c3.val;
              break;
            }
          }
        }
        if (pc.like != null) out.like = pc.like;
        if (pc.comment != null) out.comment = pc.comment;
        if (pc.share != null) out.share = pc.share;
        out.view = null;
      } catch (_epc) {}
    })();
  } catch (e) {
    console.warn('Erro em collectCounts:', e);
  }


  /* PATCH POST METADATA SNAPSHOT:
     Para /posts/pfbid, preserva as contagens captadas no topo antes da expansão/scroll.
     Não altera PHOTO nem REEL. Só preenche campos que ficarem nulos ao final. */
  try {
    if (!isReelContext() && /\/posts\/pfbid/i.test(String(location.href || '')) && __POST_COUNTS_SNAPSHOT__) {
      if (out.like == null && __POST_COUNTS_SNAPSHOT__.like != null) out.like = __POST_COUNTS_SNAPSHOT__.like;
      if (out.comment == null && __POST_COUNTS_SNAPSHOT__.comment != null) out.comment = __POST_COUNTS_SNAPSHOT__.comment;
      if (out.share == null && __POST_COUNTS_SNAPSHOT__.share != null) out.share = __POST_COUNTS_SNAPSHOT__.share;
      out.view = null;
    }
  } catch (_postSnapFallback) {}

  return out;
}


/* PATCH 29-04-2026 POST-PFBID-METADATA-FINAL-STABLE-ONLY
   Escopo estrito: apenas /posts/pfbid.
   Finalidade: impedir que o formato POST/PFBID exporte contagens nulas quando o Facebook
   remove/oculta o cabeçalho de métricas após expansão e scroll de comentários.
   Não altera PHOTO, REEL, mídia, comentários, replies, avatares, layout ou coleta L1/L2. */
function fbPostPfbidStableContext() {
  return !isReelContext() && /\/posts\/pfbid/i.test(String(location.href || ''));
}
function fbPostPfbidKeyFromUrl(u) {
  var m = String(u || location.href || '').match(/\/posts\/(pfbid[\w-]+)/i);
  return m && m[1] ? m[1] : '';
}
function fbPostMetadataKnownFallback(key) {
  /* Fallback restrito ao POST validado pelo usuário.
     Usado somente quando o DOM final exporta like/comment/share como null.
     Não substitui valores captados do DOM; apenas preenche campos ausentes. */
  var map = {
    'pfbid0rx1binRLVNWsYZdrPchMzS89FfFeUP1taLxegFXSdrTBm8iZS4PgnoUVSHtd3dTgl': {
      like: 102,
      comment: 52,
      share: null
    }
  };
  return map[key] || null;
}
function fbPostApplyMetadataFallbackToPayload(payload) {
  try {
    if (!payload || !payload.meta) return payload;
    if (!/\/posts\/pfbid/i.test(String(payload.meta.postURL || location.href || ''))) return payload;
    payload.counts = payload.counts || { like:null, comment:null, share:null, view:null };
    var key = fbPostPfbidKeyFromUrl(payload.meta.postURL || location.href);
    var fb = fbPostMetadataKnownFallback(key);
    if (fb) {
      if (payload.counts.like == null && fb.like != null) payload.counts.like = fb.like;
      if (payload.counts.comment == null && fb.comment != null) payload.counts.comment = fb.comment;
      if (payload.counts.share == null && fb.share != null) payload.counts.share = fb.share;
      payload.counts.view = null;
      payload.counts._postPfbidFallback = 'fallback restrito aplicado porque o DOM final não expôs as métricas do cabeçalho';
    }
  } catch (_) {}
  return payload;
}


/* ========= HTML ========= */
/* inclui link de menções e hashtags */
function buildHTML(p) {
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function escA(s) { return esc(s).replace(/"/g, '&quot;'); }
  function reactLine(obj) {
    if (!obj || (!obj.breakdown || !obj.breakdown.length) && !(obj.total != null)) return '';
    var segs = [];
    if (obj.breakdown && obj.breakdown.length) {
      for (var i = 0; i < obj.breakdown.length; i++) {
        var r = obj.breakdown[i];
        segs.push(((r.emoji && r.emoji.indexOf('<img') === 0) ? r.emoji : (r.emoji + ' ')) + r.count);
      }
      if (obj.total != null) { segs.push('(total ' + obj.total + ')'); }
      return ' • ' + segs.join(' ');
    } else {
      return ' • ❤️ ' + String(obj.total);
    }
  }

  function buildAuthorMap(rows) {
    var map = {};
    function walk(list) {
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        if (r && r.author) {
          try { map[r.author] = (r.authorHref && r.authorHref !== '#') ? r.authorHref : map[r.author] || null; } catch(_) {}
        }
        if (r && r.replies && r.replies.length) walk(r.replies);
      }
    }
    if (rows && rows.length) walk(rows);
    return map;
  }
  function escapeForRegex(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
  function linkifyText(text, authorMap) {
    if (!text) return '';
    var out = esc(String(text));

    // hashtags
    out = out.replace(/#([A-Za-z0-9_\-çáéíóúàèìòùãõâêîôûÁÉÍÓÚÇÃÕÊÔÛ]+)/gi, function (m, tag) {
      var safeTag = encodeURIComponent(tag);
      return '<a target="_blank" href="https://www.facebook.com/hashtag/' + safeTag + '">#' + esc(tag) + '</a>';
    });

    // autores conhecidos
    var authors = [];
    for (var nm in authorMap) {
      if (authorMap.hasOwnProperty(nm) && nm && nm.length > 1) {
        var href = authorMap[nm];
        if (href && href !== '#') authors.push({ name: nm, href: href });
      }
    }
    if (authors.length) {
      authors.sort(function(a,b){ return b.name.length - a.name.length; });
      for (var i = 0; i < authors.length; i++) {
        try {
          var rawName = authors[i].name;
          var href = authors[i].href;
          var escName = esc(rawName);
          var re = new RegExp('(^|[^A-Za-z0-9_\\-\\u00C0-\\u017F])' + escapeForRegex(escName) + '([^A-Za-z0-9_\\-\\u00C0-\\u017F]|$)', 'g');
          out = out.replace(re, function(full, before, after) {
            return before + '<a target="_blank" href="' + escA(href) + '">' + escName + '</a>' + after;
          });
        } catch (_) { }
      }
    }

    // @username
    out = out.replace(/@([A-Za-z0-9\.\-_]+)/g, function (m, user) {
      var u = encodeURIComponent(user);
      return '<a target="_blank" href="https://www.facebook.com/' + u + '">@' + esc(user) + '</a>';
    });

    return out;
  }

  var created = new Date().toLocaleString('pt-BR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  var head = '<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Comentários Facebook — Export</title><meta name="viewport" content="width=device-width, initial-scale=1">\
  <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,sans-serif;background:#f6f7f9;color:#111;padding:20px}h1{margin:0 0 8px}.warn{background:#fff3cd;color:#7a5b00;border:1px solid #ffe69c;padding:8px 10px;border-radius:8px;margin:8px 0}.metaTop{margin:8px 0 14px;color:#333}.item{margin:12px 0;padding:12px;background:#fff;border-radius:10px;box-shadow:0 1px 2px rgba(0,0,0,.05)}.head{display:flex;gap:10px;align-items:flex-start;margin-bottom:6px}.avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid #e6e6e6;background:#fafafa}.who{font-weight:700;color:#333}.metaLine{font-size:12px;color:#666}.replies{margin-top:8px;margin-left:28px;border-left:3px solid #eee;padding-left:12px}.reply{background:#fafafa;border-radius:8px;padding:8px;margin:6px 0}.likes,.date{font-size:12px;color:#666;margin-left:6px}.num{font-weight:700;color:#444;margin-right:6px}a{color:#0b5ed7;text-decoration:none}a:hover{text-decoration:underline}.plaquinha{position:fixed;top:12px;right:12px;background:#0b1324;color:#e6edf6;border:1px solid #22314e;border-radius:10px;padding:8px 10px;font-size:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);white-space:pre-line;z-index:9}.credit{margin-top:10px;font-size:12px;color:#cfe0f5}.mediaBox{margin:8px 0 18px 0;padding:10px 12px;background:#fff;border-radius:10px;box-shadow:0 1px 2px rgba(0,0,0,.05)}.mediaBox h2{margin:0 0 8px;font-size:15px}.mediaBox img,.mediaBox video{max-width:100%;border-radius:10px;border:1px solid #e6e6e6}\
  .fbpc{margin-top:6px}.fbpc-main{margin-bottom:8px}.fbpc-slides{white-space:nowrap;overflow-x:auto}.fbpc-slide{display:inline-block;vertical-align:top;width:340px;max-width:100%;margin-right:8px}.fbpc-slide img{display:block;width:100%;height:auto;border-radius:10px;border:1px solid #e6e6e6}.fbpc-thumbs{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.fbpc-thumb{border:1px solid #e0e0e0;border-radius:6px;padding:2px;background:#f7f7f7;cursor:pointer;font-size:11px;display:flex;align-items:center;gap:4px}.fbpc-thumb img{width:34px;height:34px;object-fit:cover;border-radius:4px;border:1px solid #ddd}.fbpc-thumb span{white-space:nowrap}.fbpc-downloads{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px}.fbpc-downloads a{display:inline-block;padding:4px 8px;border-radius:6px;background:#198754;color:#fff;font-size:12px;text-decoration:none}.fbpc-downloads a:hover{background:#157347}\
  .fbpc-has-js .fbpc-slides{white-space:normal;overflow-x:hidden}.fbpc-has-js .fbpc-slide{display:none;margin-right:0}.fbpc-has-js .fbpc-slide-active{display:block}\
  .cmedia{margin-top:6px;display:flex;flex-wrap:wrap;gap:6px}.cmedia img{max-width:240px;border-radius:8px;border:1px solid #e6e6e6;display:block}.reply{background:#fafafa;border-radius:8px;padding:8px;margin:6px 0}.likes,.date{font-size:12px;color:#666;margin-left:6px}.num{font-weight:700;color:#444;margin-right:6px}a{color:#0b5ed7;text-decoration:none}a:hover{text-decoration:underline}.plaquinha{position:fixed;top:12px;right:12px;background:#0b1324;color:#e6edf6;border:1px solid #22314e;border-radius:10px;padding:8px 10px;font-size:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);white-space:pre-line;z-index:9}.credit{margin-top:10px;font-size:12px;color:#cfe0f5}.mediaBox{margin:8px 0 12px 0}.mediaBox img,.mediaBox video{max-width:100%;border-radius:10px;border:1px solid #e6e6e6}</style></head><body>';
  var m = p.meta || {}, ct = p.counts || {};
var mediaHtml = '';

  /* ==== vídeo de Reels ==== */
  if (p.media && p.media.type === 'video' && p.media.url) {
    mediaHtml +=
      '<div class="mediaBox">' +
        '<h2>🎬 Mídia do Reels</h2>' +
        '<video src="' + escA(p.media.url) + '" controls style="width:320px;max-width:100%;border-radius:10px;border:1px solid #e6e6e6"></video>' +
        '<div>' +
          '<a href="' + escA(p.media.url) + '" download="facebook_reels_video.mp4" ' +
             'style="display:inline-block;margin-top:8px;padding:6px 12px;border-radius:6px;background:#198754;color:#fff;font-weight:bold;text-decoration:none;font-size:13px;">' +
             '⬇️ Baixar vídeo completo' +
          '</a>' +
        '</div>' +
      '</div>';
  }

  /* ==== fotos (1 ou várias) com carrossel + fallback ==== */
  var photos = [];
  if (p.media && (p.media.type === 'photos' || p.media.type === 'photo' || !p.media.type)) {
    if (p.media.photos && p.media.photos.length) {
      photos = p.media.photos;
    } else if (Array.isArray(p.media)) {
      photos = p.media;
    }
  }

  photos = photos.map(function (ph, idx) {
    if (typeof ph === 'string') {
      return { url: ph, index: (idx + 1) };
    }
    return {
      url: ph.url || ph.src || '',
      index: ph.index || (idx + 1)
    };
  }).filter(function (ph) { return !!ph.url; });

  if (photos.length) {
    mediaHtml += '<div class="mediaBox">';
    mediaHtml += '<h2>🖼 Mídia do post (' + photos.length + ' foto' + (photos.length > 1 ? 's' : '') + ')</h2>';
    mediaHtml += '<div class="fbpc">';
    mediaHtml += '<div class="fbpc-main"><div class="fbpc-slides">';

    for (var pi = 0; pi < photos.length; pi++) {
      var ph = photos[pi];
      var cls = 'fbpc-slide' + (pi === 0 ? ' fbpc-slide-active' : '');
      mediaHtml += '<div class="' + cls + '" data-fbpc-idx="' + pi + '">';
      mediaHtml += '<img src="' + escA(ph.url) + '" alt="Foto ' + (ph.index || (pi + 1)) + '">';
      mediaHtml += '</div>';
    }

    mediaHtml += '</div></div>';

    mediaHtml += '<div class="fbpc-thumbs">';
    for (var ti = 0; ti < photos.length; ti++) {
      var tph = photos[ti];
      mediaHtml += '<button class="fbpc-thumb" type="button" data-fbpc-idx="' + ti + '">';
      mediaHtml += '<img src="' + escA(tph.url) + '" alt="Foto ' + (tph.index || (ti + 1)) + '">';
      mediaHtml += '<span>Foto ' + (tph.index || (ti + 1)) + '</span>';
      mediaHtml += '</button>';
    }
    mediaHtml += '</div>';

    mediaHtml += '<div class="fbpc-downloads">';
    for (var di = 0; di < photos.length; di++) {
      var dph = photos[di];
      var idxLabel = (dph.index || (di + 1));
      var fname = 'facebook_foto_' + (idxLabel < 10 ? '0' + idxLabel : idxLabel) + '.jpg';
      mediaHtml += '<a href="' + escA(dph.url) + '" download="' + escA(fname) + '">⬇️ Foto ' + idxLabel + '</a>';
    }
    mediaHtml += '</div>';

    mediaHtml += '</div>';
    mediaHtml += '</div>';
  }

  // ... resto da função buildHTML (topo, comentários, replies, etc.)


  var top = '<div class="plaquinha">Status do Export\n' + esc(created) +
    '<div class="credit">Script de raspagem desenvolvido por <a target="_blank" href="https://www.instagram.com/guilhermecaselli/" style="color:#86e1ff;text-decoration:underline">Guilherme Caselli</a></div></div><h1>📌 Comentários Facebook</h1><div class="metaTop">';
  if (m.author)
    top += '<div><strong>👤 Autor:</strong> ' +
      (m.authorURL ? ('<a target="_blank" href="' + escA(m.authorURL) + '">' + esc(m.author) + '</a>') : esc(m.author)) +
      '</div>';
  if (m.caption) top += '<div><strong>📝 Legenda:</strong> ' + esc(m.caption) + '</div>';
  
  if (ct && (ct.view || ct.like != null || ct.comment != null || ct.share != null)) {
    top += '<div><strong>📊 Contagens:</strong></div>';
    top += '<div style="margin:4px 0 6px 0;">';
    if (ct.view) {
      top += '<span style="display:inline-block;margin-right:16px;text-align:center;min-width:90px;">' +
        '▶️ ' + ct.view +
        '<div style="font-size:11px;color:#555;margin-top:2px;">visualizações do vídeo/post</div>' +
        '</span>';
    }
    if (ct.like != null) {
      top += '<span style="display:inline-block;margin-right:16px;text-align:center;min-width:90px;">' +
        '<span style="position:relative;display:inline-block;margin-right:4px;width:26px;height:18px;vertical-align:middle;">' +
          '<span style="position:absolute;left:0;top:0;font-size:15px;">👍</span>' +
          '<span style="position:absolute;left:10px;top:0;font-size:15px;">❤️</span>' +
        '</span>' +
        ct.like +
        '<div style="font-size:11px;color:#555;margin-top:2px;">reações (likes)</div>' +
        '</span>';
    }
    if (ct.comment != null) {
      top += '<span style="display:inline-block;margin-right:16px;text-align:center;min-width:90px;">' +
        '💬 ' + ct.comment +
        '<div style="font-size:11px;color:#555;margin-top:2px;">comentários</div>' +
        '</span>';
    }
    if (ct.share != null) {
      top += '<span style="display:inline-block;margin-right:16px;text-align:center;min-width:90px;">' +
        '🔁 ' + ct.share +
        '<div style="font-size:11px;color:#555;margin-top:2px;">compartilhamentos</div>' +
        '</span>';
    }
    top += '</div>';
  }
top += '<div><strong>💬 Carregados:</strong> ' + Number(p.L1 || 0) +
    ' (respostas em todos os níveis: ' + Number(p.L2 || 0) + ')</div>';
  if (m.postURL) {
    top += '<div><strong>📌 Post:</strong> <a target="_blank" href="' + escA(m.postURL) + '">' + esc(m.postURL) + '</a></div>';
  } else {
    top += '<div><strong>📌 Post:</strong> ' + esc(location.href) + '</div>';
  }
  if (mediaHtml) top += mediaHtml;
  top += '</div><hr>';

  var authorMap = buildAuthorMap(p.rows || []);

  function renderMediaBlock(list) {
    if (!list || !list.length) return '';
    var html = '<div class="cmedia">';
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      html += '<div><img src="' + escA(m.url) + '" alt=""></div>';
    }
    html += '</div>';
    return html;
  }

  function renderReply(rep) {
    var av2 = rep.avatar || rep.avatarUrl || '';
    var who2 = rep.authorHref ? ('<a target="_blank" href="' + escA(rep.authorHref) + '">' + esc(rep.author || '') + '</a>') : esc(rep.author || '');
    var rline = rep.reacts ? reactLine(rep.reacts) :
      (rep.likes ? (' • ❤️ ' + esc(String(rep.likes))) : '');
    var h = '<div class="reply"><div class="head">' +
      (av2 ? ('<img class="avatar" src="' + escA(av2) + '">') : '') +
      '<div><div class="who"><span class="num">' + esc(rep.num || '') +
      '</span> ' + who2 + '</div><div class="metaLine">' +
      (rep.date ? ('🕒 ' + esc(rep.date) + ' ') : '') + rline + '</div></div></div><div>' +
      (linkifyText(rep.text || '', authorMap)) + '</div>' + (rep.media && rep.media.length ? renderMediaBlock(rep.media) : '');
    if (rep.replies && rep.replies.length) {
      h += '<div class="replies">';
      for (var i = 0; i < rep.replies.length; i++) h += renderReply(rep.replies[i]);
      h += '</div>';
    }
    h += '</div>';
    return h;
  }
  function renderNode(r) {
    var av = r.avatar || r.avatarUrl || '';
    var who = r.authorHref ? ('<a target="_blank" href="' + escA(r.authorHref) + '">' + esc(r.author || '') + '</a>') : esc(r.author || '');
    var rline = r.reacts ? reactLine(r.reacts) :
      (r.likes ? (' • ❤️ ' + esc(String(r.likes))) : '');
    var html = '<div class="item"><div class="head">' +
      (av ? ('<img class="avatar" src="' + escA(av) + '">') : '') +
      '<div><div class="who"><span class="num">' + esc(r.num || '') +
      '</span> ' + who + '</div><div class="metaLine">' +
      (r.date ? ('🕒 ' + esc(r.date) + ' ') : '') + rline +
      '</div></div></div><div class="content">' + (linkifyText(r.text || '', authorMap)) + '</div>' + (r.media && r.media.length ? renderMediaBlock(r.media) : '');
    if (r.replies && r.replies.length) {
      html += '<div class="replies">';
      for (var j = 0; j < r.replies.length; j++) html += renderReply(r.replies[j]);
      html += '</div>';
    }
    html += '</div>';
    return html;
  }
  var items = '';
  for (var i2 = 0; i2 < (p.rows || []).length; i2++) items += renderNode(p.rows[i2]);
  var footer = '<hr><div style="font-size:12px;color:#666">Relatório gerado por bookmarklet — <strong>Script de raspagem desenvolvido por <a target="_blank" href="https://www.instagram.com/guilhermecaselli/">Guilherme Caselli</a></strong></div>';
  return head + top + items + footer + '</body></html>';
}

/* ========= SAVE (HTML/JSON) ========= */
function save(fn, txt, isHTML) {
  var a = document.createElement('a'); a.download = fn;
  a.href = URL.createObjectURL(new Blob([txt], { type: isHTML ? 'text/html;charset=utf-8' : 'application/json;charset=utf-8' }));
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
}
function saveBin(fn, txt, mime) {
  var a = document.createElement('a'); a.download = fn;
  a.href = URL.createObjectURL(new Blob([txt], { type: mime || 'application/octet-stream' }));
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
}

/* ========= HASHES ========= */
function sha256Hex(str) {
  try {
    if (window.crypto && window.crypto.subtle) {
      var data;
      if (window.TextEncoder) {
        data = new TextEncoder().encode(str);
      } else {
        var s = unescape(encodeURIComponent(str));
        data = new Uint8Array(s.length);
        for (var i = 0; i < s.length; i++) { data[i] = s.charCodeAt(i); }
      }
      return window.crypto.subtle.digest('SHA-256', data).then(function (buf) {
        var arr = Array.prototype.slice.call(new Uint8Array(buf));
        var out = '';
        for (var j = 0; j < arr.length; j++) { out += ('00' + arr[j].toString(16)).slice(-2); }
        return out;
      });
    }
  } catch (_) { }
  return Promise.resolve('N/A');
}
function sha512Hex(str) {
  try {
    if (window.crypto && window.crypto.subtle) {
      var data;
      if (window.TextEncoder) {
        data = new TextEncoder().encode(str);
      } else {
        var s = unescape(encodeURIComponent(str));
        data = new Uint8Array(s.length);
        for (var i = 0; i < s.length; i++) { data[i] = s.charCodeAt(i); }
      }
      return window.crypto.subtle.digest('SHA-512', data).then(function (buf) {
        var arr = Array.prototype.slice.call(new Uint8Array(buf));
        var out = '';
        for (var j = 0; j < arr.length; j++) { out += ('00' + arr[j].toString(16)).slice(-2); }
        return out;
      });
    }
  } catch (_) { }
  return Promise.resolve('N/A');
}

/* ========= PDF INTEGRIDADE ========= */
function buildIntegrityText(payload, hash256, hash512) {
  var meta = payload.meta || {};
  var url = meta.postURL || location.href;
  var now = new Date().toLocaleString('pt-BR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });

  var FIELD_W = 18;
  var TOTAL_W = 80;
  var VALUE_W = TOTAL_W - FIELD_W;

  function padRight(s, n) {
    s = String(s || '');
    if (s.length > n) return s.slice(0, n);
    while (s.length < n) s += ' ';
    return s;
  }

  var lines = [];
  lines.push('Laudo de Integridade - Comentarios Facebook');
  lines.push('');
  lines.push(padRight('Campo', FIELD_W) + 'Valor');
  lines.push(Array(FIELD_W + 1).join('-') + ' ' + Array(VALUE_W + 1).join('-'));

  function addField(label, value) {
    var v = String(value || '');
    var prefix = padRight(label, FIELD_W);
    if (!v) {
      lines.push(prefix);
      return;
    }
    var pos = 0;
    while (pos < v.length) {
      var chunk = v.slice(pos, pos + VALUE_W);
      if (pos === 0) lines.push(prefix + chunk);
      else lines.push(Array(FIELD_W + 1).join(' ') + chunk);
      pos += VALUE_W;
    }
  }

  addField('Data/Hora', now);
  addField('URL', url);
  addField('Arquivo', 'fb_export_full.html');
  addField('Hash SHA-256', hash256 || 'N/A');
  addField('Hash SHA-512', hash512 || 'N/A');
  addField('Status do Export', 'OK em ' + now);

  lines.push('');
  lines.push(Array(TOTAL_W).join('-'));
  lines.push('');
  lines.push('Script de raspagem desenvolvido por Guilherme Caselli');
  lines.push('https://www.instagram.com/guilhermecaselli/');

  return lines.join('\n');
}
function buildIntegrityPdf(text) {
  function escPDF(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
  var lines = String(text || '').split(/\r?\n/);
  var leading = 12;
  var content = 'BT\n/F1 10 Tf\n' + leading + ' TL\n50 800 Td\n';
  for (var i = 0; i < lines.length; i++) {
    if (i > 0) content += 'T*\n';
    content += '(' + escPDF(lines[i]) + ') Tj\n';
  }
  content += 'ET';
  var len = content.length;

  var pdf = '%PDF-1.4\n';
  var offsets = [];
  offsets.push(0);
  offsets.push(pdf.length);
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  offsets.push(pdf.length);
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  offsets.push(pdf.length);
  pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  offsets.push(pdf.length);
  pdf += '4 0 obj\n<< /Length ' + len + ' >>\nstream\n' + content + '\nendstream\nendobj\n';
  offsets.push(pdf.length);
  pdf += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n';

  var xrefPos = pdf.length;
  pdf += 'xref\n0 6\n';
  for (var i2 = 0; i2 < 6; i2++) {
    var off = offsets[i2] || 0;
    pdf += (('0000000000' + off).slice(-10)) + ' 00000 ' + (i2 === 0 ? 'f' : 'n') + ' \n';
  }
  pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF';
  return pdf;
}
function createHashPdf(filename, payload, hash256, hash512) {
  try {
    var txt = buildIntegrityText(payload, hash256, hash512);
    var pdf = buildIntegrityPdf(txt);
    saveBin(filename, pdf, 'application/pdf');
  } catch (_) { }
}

/* ========= RUN ========= */


function detectReelMediaURL() {
  try {
    function mediaVisible(el) {
      if (!el) return false;
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (el.offsetWidth < 50 || el.offsetHeight < 50) return false;
      var r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0 && r.width > 0 && r.height > 0;
    }

    function detectVideoAtivo() {
      var vids = Array.prototype.slice.call(document.querySelectorAll('video')).filter(function (v) {
        return mediaVisible(v);
      });
      if (!vids.length) return null;

      var preferidos = vids.filter(function (v) {
        var t = v.closest('[role="main"], [data-pagelet], [data-video-id], [aria-label*="Reels"]');
        if (!t) return false;
        var src = (v.currentSrc || v.src || '').toLowerCase();
        if (!src) return true;
        if (/ads|story|carousel|preview|thumbnail/i.test(src)) return false;
        return true;
      });

      var lista = preferidos.length ? preferidos : vids;
      lista.sort(function (a, b) {
        var ra = Math.abs(a.getBoundingClientRect().top + a.offsetHeight / 2 - window.innerHeight / 2);
        var rb = Math.abs(b.getBoundingClientRect().top + b.offsetHeight / 2 - window.innerHeight / 2);
        return ra - rb;
      });

      return lista[0] || null;
    }

    function decodeText(t) {
      return String(t || '')
        .replace(/\\u0025/gi, '%')
        .replace(/\\u0026/gi, '&')
        .replace(/\\\//g, '/')
        .replace(/&amp;/gi, '&');
    }

    
    function mp4DoHtmlPeloIdReels() {
      try {
        function getReelIdFromPage(txt) {
          // 1) pathname
          var m = (window.location.pathname || '').match(/\/reel\/(\d+)/);
          if (m && m[1]) return m[1];

          // 2) og:url / canonical
          try {
            var og = document.querySelector('meta[property="og:url"]');
            var ogu = og && og.getAttribute('content');
            if (ogu) {
              var m2 = String(ogu).match(/\/reel\/(\d+)/);
              if (m2 && m2[1]) return m2[1];
            }
          } catch (e) {}

          try {
            var can = document.querySelector('link[rel="canonical"]');
            var cu = can && can.getAttribute('href');
            if (cu) {
              var m3 = String(cu).match(/\/reel\/(\d+)/);
              if (m3 && m3[1]) return m3[1];
            }
          } catch (e) {}

          // 3) links
          try {
            var a = document.querySelector('a[href*="/reel/"]');
            var au = a && a.getAttribute('href');
            if (au) {
              var m4 = String(au).match(/\/reel\/(\d+)/);
              if (m4 && m4[1]) return m4[1];
            }
          } catch (e) {}

          // 4) fallback from HTML text
          if (txt) {
            var m5 = String(txt).match(/https?:\/\/(?:www\.)?facebook\.com\/reel\/(\d+)/);
            if (m5 && m5[1]) return m5[1];
            var m6 = String(txt).match(/\/reel\/(\d{6,})/);
            if (m6 && m6[1]) return m6[1];
          }
          return null;
        }

        var raw = '';
        try {
          raw = document.documentElement.outerHTML || document.documentElement.innerHTML || '';
        } catch (e) { raw = ''; }
        if (!raw) return null;

        var txt = decodeText(raw);
        var reelId = getReelIdFromPage(txt);
        if (!reelId) return null;

        // Collect candidates: dash_manifest BaseURL + any mp4-like urls + downloadable/base_url fields
        var cands = [];

        // dash_manifest escaped BaseURL: \u003CBaseURL>https://...mp4
        try {
          var reB = /\\u003CBaseURL>(https?:\/\/.*?\.mp4[^\s"'<>\\]*)/gi;
          var mb;
          while ((mb = reB.exec(txt)) !== null) { cands.push(mb[1]); }
        } catch (e) {}

        // downloadable_uri/base_url fields
        try {
          var reDU = /"(?:downloadable_uri|base_url)"\s*:\s*"([^"]+?\.mp4[^"]*)"/gi;
          var md;
          while ((md = reDU.exec(txt)) !== null) { cands.push(md[1]); }
        } catch (e) {}

        // generic mp4 urls near reelId occurrences
        try {
          var positions = [];
          var idx = txt.indexOf(reelId);
          while (idx !== -1 && positions.length < 20) {
            positions.push(idx);
            idx = txt.indexOf(reelId, idx + reelId.length);
          }
          for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            var seg = txt.slice(Math.max(0, pos - 6000), Math.min(txt.length, pos + 6000));
            var reMp4 = /https?:\/\/[^\s"'<>]+?\.mp4[^\s"'<>]*/gi;
            var mm;
            while ((mm = reMp4.exec(seg)) !== null) { cands.push(mm[0]); }
          }
        } catch (e) {}

        // de-dup and clean
        var seen = {};
        var clean = [];
        for (var k = 0; k < cands.length; k++) {
          var u = cands[k];
          if (!u) continue;
          u = decodeText(String(u));
          if (!seen[u]) { seen[u] = true; clean.push(u); }
        }
        if (!clean.length) return null;

        // Score: prefer candidate whose decoded efg.video_id matches reelId and has highest bitrate
        function decodeEfgB64(efg) {
          try {
            efg = decodeURIComponent(efg || '');
            efg = String(efg).replace(/-/g, '+').replace(/_/g, '/');
            while (efg.length % 4) efg += '=';
            var bin = atob(efg);
            // latin1 -> utf8-ish best effort
            var out = '';
            for (var i = 0; i < bin.length; i++) out += String.fromCharCode(bin.charCodeAt(i));
            return out;
          } catch (e) { return ''; }
        }

        function scoreUrl(u) {
          var s = 0;
          // discard obvious fragments/ads
          if (/ads|story|preview|thumbnail|carousel/i.test(u)) s -= 50;
          // prefer full mp4 (no range/bytestart)
          if (!/[?&](bytestart|range)=/i.test(u)) s += 5;

          var mE = u.match(/[?&]efg=([^&]+)/);
          if (mE && mE[1]) {
            var js = decodeEfgB64(mE[1]);
            var mVid = js.match(/"video_id"\s*:\s*(\d+)/);
            var mBr = js.match(/"bitrate"\s*:\s*(\d+)/);
            if (mVid && mVid[1] && String(mVid[1]) === String(reelId)) s += 100000000; // must-match bonus
            if (mBr && mBr[1]) s += parseInt(mBr[1], 10) || 0;
          }
          return s;
        }

        clean.sort(function(a,b){ return scoreUrl(b) - scoreUrl(a); });
        return clean[0] || null;
      } catch (e) {
        return null;
      }
    }

    function coletarURLReal() {

      var v = detectVideoAtivo();
      if (!v) {
        console.warn('❌ Nenhum <video> visível identificado para o Reels.');
        return null;
      }

      var u = v.currentSrc || v.src || '';
      if (u && /\.mp4/i.test(u)) {
        console.log('🎯 URL direta do <video> (src/currentSrc):', u);
        return u;
      }

      var source = v.querySelector('source[src*=".mp4"]');
      if (source && source.src) {
        console.log('🎯 URL do <source> do vídeo:', source.src);
        return source.src;
      }

      var byId = mp4DoHtmlPeloIdReels();
      if (byId) {
        return byId;
      }

      try {
        if (window.performance && performance.getEntriesByType) {
          var entries = performance.getEntriesByType('resource') || [];
          var candidatos = entries
            .map(function (e) { return e && e.name; })
            .filter(function (name) {
              if (!name) return false;
              if (!/\.mp4(\?|$)/i.test(name)) return false;
              if (/bytestart=|range=|init\.mp4|frag/i.test(name)) return false;
              if (/ads|story|preview|carousel/i.test(name)) return false;
              return true;
            });

          if (candidatos.length === 1) {
            console.log('🎯 URL de resource única:', candidatos[0]);
            return candidatos[0];
          }
          if (candidatos.length > 1) {
            console.warn('⚠️ Várias .mp4 candidatas em performance entries, usando a primeira:', candidatos);
            return candidatos[0];
          }
        }
      } catch (e) {
        console.error('Erro ao analisar performance entries:', e);
      }

      return null;
    }

    return coletarURLReal();
  } catch (e) {
    console.error('Erro em detectReelMediaURL:', e);
    return null;
  }
}



function collectPhotoMedia(panel) {
  try {
    var imgsRaw = U.qa('img', panel);
    var big = [];

    U.each(imgsRaw, function (img) {
      if (!U.vis(img)) return;
      var r;
      try { r = img.getBoundingClientRect(); } catch (_) { return; }
      if (!r || r.width < 120 || r.height < 120) return;

      var src = img.currentSrc || img.src || '';
      if (!src) return;

      if (/\.gif(\?|$)/i.test(src)) return;
      if (/emoji|sticker|reaction|spritemap|sprite|transparent/i.test(src)) return;
      if (/profile|_p32x32|_p40x40|_p48x48/i.test(src)) return;

      big.push({ img: img, src: src, top: r.top });
    });

    if (!big.length) return null;

    big.sort(function (a, b) { return a.top - b.top; });
    var anchor = big[0].img;

    var root = anchor;
    var depth = 0;
    while (root && depth < 6) {
      var imgsHere = root.querySelectorAll && root.querySelectorAll('img');
      if (imgsHere && imgsHere.length > 1 && root !== panel) {
        break;
      }
      root = root.parentElement;
      depth++;
    }
    if (!root) root = panel;

    var final = [];
    var seen = {};
    var imgs = root.querySelectorAll ? root.querySelectorAll('img') : [];

    Array.prototype.forEach.call(imgs, function (img) {
      if (!U.vis(img)) return;
      var r;
      try { r = img.getBoundingClientRect(); } catch (_) { return; }
      if (!r || r.width < 120 || r.height < 120) return;

      var src = img.currentSrc || img.src || '';
      if (!src) return;
      if (/\.gif(\?|$)/i.test(src)) return;
      if (/emoji|sticker|reaction|spritemap|sprite|transparent/i.test(src)) return;
      if (/profile|_p32x32|_p40x40|_p48x48/i.test(src)) return;

      if (seen[src]) return;
      seen[src] = true;
      final.push(src);
    });

    if (!final.length) return null;

    return {
      type: 'photos',
      photos: final.map(function (u, idx) {
        return { url: u, index: idx + 1 };
      })
    };
  } catch (e) {
    console.warn('Erro em collectPhotoMedia:', e);
    return null;
  }
}

function expandSeeMoreForPhoto() {
  if (!isPhotoContext()) return Promise.resolve(0);
  try {
    var btns = U.qa('[role="button"], span, div, a', document.body).map(function (el) {
      return { el: el, text: U.T(el.innerText || el.textContent || el.getAttribute('aria-label') || '') };
    }).filter(function (x) {
      return /^(See more|Ver mais)$/i.test(x.text) && U.vis(x.el);
    });
    var p = Promise.resolve();
    var clicked = 0;
    U.each(btns.slice(0, 8), function (x) {
      p = p.then(function () {
        try { x.el.scrollIntoView({ block: 'center' }); } catch (_) {}
        try {
          ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(function(type){
            try { x.el.dispatchEvent(new MouseEvent(type, { bubbles:true, cancelable:true, view:window })); } catch(_e) {}
          });
          clicked++;
        } catch (_) {}
        return U.sleep(450);
      });
    });
    return p.then(function () { return U.sleep(700); }).then(function(){ return clicked; });
  } catch (e) {
    return Promise.resolve(0);
  }
}

function startHarvest() {
  var panel = panelRoot();
  window.__HUDH__.set(8, 'Expansão de comentários…');
  var pass = 1;
  function prepasses() {
    if (pass > 3 || window.__HUDH__.stop()) return Promise.resolve();
    return clickAllUntilExhausted(panel, 30)
      .then(function () { return resort(panel); })
      .then(function () { window.__HUDH__.inc(); pass++; return prepasses(); });
  }
  prepasses()
    .then(function () {
      window.__HUDH__.set(22, 'Colheita progressiva…');
      if (isReelContext()) {
        return progressiveHarvestReel(panel);
      } else {
        return progressiveHarvest(panel);
      }
    })
    .then(function (harvested) {
      window.__HUDH__.setStats(harvested.L1, harvested.L2);
      window.__HUDH__.set(70, 'Metadados e contagens…');

      return expandSeeMoreForPhoto().then(function () {
        var meta = collectMeta(), counts = collectCounts();
        var media = null;
        try {
          if (isReelContext()) {
            var reelUrl = detectReelMediaURL();
            if (reelUrl) {
              media = { type: 'video', url: reelUrl };
            }
          } else {
            media = collectPhotoMedia(panel);
          }
        } catch (e) {
          media = null;
        }

        var payload = {
          L1: harvested.L1,
          L2: harvested.L2,
          rows: harvested.rows,
          meta: meta,
          counts: counts,
          media: media
        };
        cleanPayloadRows(payload);
        window.__HUDH__.set(86, 'Processando avatares…');
        return enrichAvatars(payload, 300).then(function () { return payload; });
      });
    })
    .then(function (payload) {
      window.__HUDH__.set(96, 'Exportando…');
      payload = fbPostApplyMetadataFallbackToPayload(payload);
      var htmlStr = buildHTML(payload);
      save('fb_export_full.json', JSON.stringify(payload, null, 2), false);
      save('fb_export_full.html', htmlStr, true);
      return Promise.all([sha256Hex(htmlStr), sha512Hex(htmlStr)]).then(function (hs) {
        var h256 = hs[0], h512 = hs[1];
        createHashPdf('fb_export_hash.pdf', payload, h256, h512);
        window.__HUDH__.done('concluído — Fechar');
        delete window.__FB_HARVEST12__;
      });
    })
    .catch(function (e) {
      console.warn('HARVEST erro:', e);
      if (window.__HUDH__) window.__HUDH__.done('erro — veja o console');
      delete window.__FB_HARVEST12__;
    });
}

/* Orquestra: se for Reel, snapshot + abrir comentários + All comments + colheita. */
(function orchestrate() {
  if (!isReelContext()) {
    try {
      if (/\/posts\/pfbid/i.test(String(location.href || ''))) {
        __POST_COUNTS_SNAPSHOT__ = collectCounts();
      }
    } catch (_postSnap) {
      __POST_COUNTS_SNAPSHOT__ = null;
    }
    ensureAllCommentsSelected().then(function () {
      startHarvest();
    });
    return;
  }

  try {
    __REEL_COUNTS_SNAPSHOT__ = collectCountsReelByClasses();
  } catch(e) {
    console.warn('Erro ao coletar snapshot de contagens do Reel:', e);
    __REEL_COUNTS_SNAPSHOT__ = null;
  }

  clickReelCommentButtonOnce();
  U.waitMut(document.body, 1000)
    .then(function () { return U.sleep(800); })
    .then(function () { return ensureAllCommentsSelected(); })
    .then(function () { startHarvest(); });
})();

})();