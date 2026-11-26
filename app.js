/* Talin digital business card. Vanilla JS, no dependencies except the bundled QR generator. */
(function () {
  "use strict";

  var C = window.CARD_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Helpers ---------- */
  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function telHref(s) { return "tel:+" + digits(s); }
  function cleanUrl(s) { return String(s || "").trim(); }
  function pretty(url) { return cleanUrl(url).replace(/^https?:\/\//i, "").replace(/\/$/, ""); }

  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function cardUrl() {
    if (C.cardUrl) return C.cardUrl;
    var u = location.href.split("#")[0].split("?")[0];
    return u.replace(/index\.html$/, "");
  }

  /* ---------- Fill text from config ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-bind]"), function (el) {
    var v = C[el.getAttribute("data-bind")];
    if (v) el.textContent = v;
  });

  /* ---------- Show or hide rows by data present ---------- */
  var phone = cleanUrl(C.phone);
  var wa = digits(C.whatsapp || C.phone);
  var data = {
    phone: phone,
    whatsapp: wa,
    email: cleanUrl(C.email),
    linkedin: cleanUrl(C.linkedin),
    website: cleanUrl(C.website),
    location: cleanUrl(C.location)
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-field]"), function (el) {
    el.hidden = !data[el.getAttribute("data-field")];
  });

  /* ---------- Links ---------- */
  function set(id, href) { var el = $(id); if (el && href) el.setAttribute("href", href); }
  if (data.phone) {
    set("act-call", telHref(phone));
    set("d-phone", telHref(phone));
    $("d-phone").textContent = phone;
  }
  if (data.whatsapp) {
    var msg = C.whatsappMessage ? "?text=" + encodeURIComponent(C.whatsappMessage) : "";
    set("act-whatsapp", "https://wa.me/" + wa + msg);
  }
  if (data.email) {
    set("act-email", "mailto:" + data.email);
    set("d-email", "mailto:" + data.email);
    $("d-email").textContent = data.email;
  }
  if (data.linkedin) set("act-linkedin", data.linkedin);
  if (data.website) {
    set("act-website", data.website);
    set("d-website", data.website);
    $("d-website").textContent = pretty(data.website);
  }

  /* ---------- Headshot fallback (monogram if the photo file is missing) ---------- */
  var img = $("avatar-img");
  function noPhoto() { $("avatar").classList.add("no-photo"); }
  img.addEventListener("error", noPhoto);
  if (img.complete && img.naturalWidth === 0) noPhoto();

  /* ---------- Share ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }
  $("act-share").addEventListener("click", function () {
    var payload = {
      title: C.name + " | " + C.title + ", " + C.company,
      text: C.name + ", " + C.title + ", " + C.company,
      url: cardUrl()
    };
    if (navigator.share) {
      navigator.share(payload).catch(function (e) {
        if (e && e.name === "AbortError") return;
        copyText(payload.url).then(function () { toast("Link copied"); });
      });
    } else {
      copyText(payload.url).then(
        function () { toast("Link copied"); },
        function () { toast("Copy this address: " + payload.url); }
      );
    }
  });

  /* ---------- QR code ---------- */
  // Talin icon (from the official logo file), drawn in the center of the code.
  var ICON = {
    d: ["M92.64,73.31c-6.5,5.11-14.6,8.76-24.09,10.84l-.38.09c-.46.05-.78.08-1.13.15-.27.05-.49.06-.82.06l-.33.03c-.62.04-1.31.08-2.14.05-.52,0-1.12-.03-1.83-.07h-.29c-.58.03-1.3-.01-1.93-.05-3.27-.23-6.94-.57-10.18-1.76,5.26,10.48,5.07,21.56-.56,32.15-1.47,2.75-3.2,5.41-5.3,8.12l-2.17,2.8v-54.62s53.9.04,53.9.04l-2.76,2.17Z", "M95.4,125.72l-53.91-.04,2.76-2.17c6.5-5.11,14.6-8.76,24.08-10.84l.38-.09c.46-.05.77-.08,1.12-.15.28-.06.5-.06.83-.06l.31-.02c.64-.04,1.33-.09,2.16-.05.47,0,1.02.03,1.65.06l.46.02c.58-.04,1.3,0,1.93.04,3.27.23,6.94.57,10.18,1.76-5.26-10.48-5.07-21.56.56-32.15,1.47-2.76,3.2-5.41,5.3-8.12l2.17-2.8v54.62Z"],
    x: 41.49, y: 71.10, w: 53.91, h: 54.63
  };
  var QUIET = 4;          // quiet zone in modules (QR specification minimum)
  var qr, cut, withIcon = true;

  function oddAtLeast(v, min) { v = Math.round(v); if (v % 2 === 0) v += 1; return Math.max(v, min); }

  function build() {
    try {
      // Error correction H lets the code survive the icon covering its center.
      qr = qrcode(0, withIcon ? "H" : "M");
      qr.addData(cardUrl());
      qr.make();
      var n = qr.getModuleCount();
      var k = oddAtLeast(n * 0.21, 5);          // clear square in the center, in modules
      cut = withIcon ? { k: k, s: (n - k) / 2 } : null;
      return true;
    } catch (e) {
      qr = null;
      $("qr").textContent = "QR code unavailable.";
      return false;
    }
  }
  function inCut(r, c) { return cut && r >= cut.s && r < cut.s + cut.k && c >= cut.s && c < cut.s + cut.k; }

  // Where the icon sits: scale (modules per icon unit) and offsets, in module units.
  function iconBox() {
    var size = cut.k - 2;                       // one module of white padding each side
    var s = size / Math.max(ICON.w, ICON.h);
    return {
      s: s,
      tx: QUIET + cut.s + (cut.k - ICON.w * s) / 2 - ICON.x * s,
      ty: QUIET + cut.s + (cut.k - ICON.h * s) / 2 - ICON.y * s
    };
  }

  function qrSvg(size) {
    var n = qr.getModuleCount(), total = n + QUIET * 2, d = [];
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c) && !inCut(r, c)) d.push("M" + (c + QUIET) + " " + (r + QUIET) + "h1v1h-1z");
      }
    }
    var dim = size ? ' width="' + size + '" height="' + size + '"' : "";
    var icon = "";
    if (cut) {
      var b = iconBox();
      icon = '<g fill="#000940" transform="translate(' + b.tx.toFixed(3) + " " + b.ty.toFixed(3) + ") scale(" + b.s.toFixed(5) + ')">' +
        ICON.d.map(function (p) { return '<path d="' + p + '"/>'; }).join("") + "</g>";
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + " " + total + '"' + dim +
      ' shape-rendering="crispEdges"><rect width="' + total + '" height="' + total + '" fill="#FFFFFF"/>' +
      '<path fill="#000940" d="' + d.join("") + '"/>' + icon + "</svg>";
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  function fileName(ext) { return "Ahmed-Salama-Talin-QR" + (withIcon ? "" : "-plain") + "." + ext; }

  function render() { if (build()) $("qr").innerHTML = qrSvg(); }

  $("qr-icon").addEventListener("change", function (e) { withIcon = e.target.checked; render(); });

  $("qr-svg").addEventListener("click", function () {
    if (!qr) return;
    download(new Blob([qrSvg(1200)], { type: "image/svg+xml" }), fileName("svg"));
  });

  $("qr-png").addEventListener("click", function () {
    if (!qr) return;
    var n = qr.getModuleCount(), total = n + QUIET * 2;
    var scale = Math.max(1, Math.floor(1600 / total)); // whole pixels per module keeps edges sharp
    var px = total * scale;
    var cv = document.createElement("canvas");
    cv.width = cv.height = px;
    var ctx = cv.getContext("2d");
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = "#000940";
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c) && !inCut(r, c)) ctx.fillRect((c + QUIET) * scale, (r + QUIET) * scale, scale, scale);
      }
    }
    if (cut && window.Path2D) {
      var b = iconBox();
      ctx.save();
      ctx.translate(b.tx * scale, b.ty * scale);
      ctx.scale(b.s * scale, b.s * scale);
      ICON.d.forEach(function (p) { ctx.fill(new Path2D(p)); });
      ctx.restore();
    }
    if (cv.toBlob) {
      cv.toBlob(function (blob) { download(blob, fileName("png")); }, "image/png");
    } else {
      var a = document.createElement("a");
      a.href = cv.toDataURL("image/png"); a.download = fileName("png");
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
  });

  render();
})();
