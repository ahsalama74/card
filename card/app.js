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
  var QUIET = 4; // quiet zone in modules (QR specification minimum)
  var qr;
  try {
    qr = qrcode(0, "M");
    qr.addData(cardUrl());
    qr.make();
  } catch (e) {
    $("qr").textContent = "QR code unavailable.";
  }

  function qrSvg(size) {
    var n = qr.getModuleCount(), total = n + QUIET * 2, d = [];
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) d.push("M" + (c + QUIET) + " " + (r + QUIET) + "h1v1h-1z");
      }
    }
    var dim = size ? ' width="' + size + '" height="' + size + '"' : "";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + " " + total + '"' + dim +
      ' shape-rendering="crispEdges"><rect width="' + total + '" height="' + total + '" fill="#FFFFFF"/>' +
      '<path fill="#000940" d="' + d.join("") + '"/></svg>';
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  if (qr) {
    $("qr").innerHTML = qrSvg();

    $("qr-svg").addEventListener("click", function () {
      download(new Blob([qrSvg(1200)], { type: "image/svg+xml" }), "Ahmed-Salama-Talin-QR.svg");
    });

    $("qr-png").addEventListener("click", function () {
      var n = qr.getModuleCount() + QUIET * 2;
      var scale = Math.max(1, Math.floor(1600 / n)); // whole pixels per module keeps edges sharp
      var px = n * scale;
      var cv = document.createElement("canvas");
      cv.width = cv.height = px;
      var ctx = cv.getContext("2d");
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, px, px);
      ctx.fillStyle = "#000940";
      for (var r = 0; r < qr.getModuleCount(); r++) {
        for (var c = 0; c < qr.getModuleCount(); c++) {
          if (qr.isDark(r, c)) ctx.fillRect((c + QUIET) * scale, (r + QUIET) * scale, scale, scale);
        }
      }
      if (cv.toBlob) {
        cv.toBlob(function (b) { download(b, "Ahmed-Salama-Talin-QR.png"); }, "image/png");
      } else {
        var a = document.createElement("a");
        a.href = cv.toDataURL("image/png"); a.download = "Ahmed-Salama-Talin-QR.png";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    });
  }
})();
