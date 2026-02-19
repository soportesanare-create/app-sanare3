const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => Array.from(el.querySelectorAll(q));

const APP_ROLE = (document.body?.dataset?.appRole === "kam") ? "kam" : "medico";
try{ localStorage.setItem("sanare_last_app", APP_ROLE); }catch(e){}

const screens = $$("[data-screen]");
const navBtns = $$("[data-nav]");
const bottomNav = $(".bottomnav");
const btnNavToggle = $("#btnNavToggle");

const topTitle = $("#topTitle");
const rolePill = $("#rolePill");
const navPointsLabel = $("#navPointsLabel");

const globalSearch = $("#globalSearch");

// Home KPIs
const monthLabel = $("#monthLabel");
const kpi1 = $("#kpi1");
const kpi2 = $("#kpi2");
const kpi1l = $("#kpi1l");
const kpi2l = $("#kpi2l");
const kpiHint = $("#kpiHint");

// News
const newsGrid = $("#newsGrid");
const newsCount = $("#newsCount");

// Profile
const inpName = $("#inpName");
const inpEmail = $("#inpEmail");
const btnSaveProfile = $("#btnSaveProfile");
const btnTheme = $("#btnTheme");
const themeLabel = $("#themeLabel");
const accentPalette = $("#accentPalette");

// KAM commissions screen (only exists in KAM page)
const inpGoal = $("#inpGoal");
const inpSales = $("#inpSales");
const btnSaveKam = $("#btnSaveKam");
const kamGoal = $("#kamGoal");
const kamSales = $("#kamSales");
const kamProgress = $("#kamProgress");
const kamMissing = $("#kamMissing");

const LS_PROFILE = "sanare_app_profile_v2";
const LS_THEME = "sanare_app_theme_v1";
const LS_NAV = "sanare_nav_collapsed_v1";

function nowMonthLabel(){
  const d = new Date();
  const m = d.toLocaleDateString("es-MX",{month:"long"});
  const y = d.getFullYear();
  return `${m.charAt(0).toUpperCase()+m.slice(1)} ${y}`;
}
function money(n){
  const v = Number(n || 0);
  return v.toLocaleString("es-MX",{style:"currency", currency:"MXN", maximumFractionDigits:0});
}
function pct(n){
  return `${Math.max(0, Math.min(100, Math.round(n)))}%`;
}

function loadJSON(key){
  try{ return JSON.parse(localStorage.getItem(key) || "{}"); }catch(e){ return {}; }
}
function saveJSON(key, obj){
  try{ localStorage.setItem(key, JSON.stringify(obj)); }catch(e){}
}

function navigate(id){
  screens.forEach(s => s.classList.toggle("active", s.dataset.screen === id));
  navBtns.forEach(b => b.classList.toggle("active", b.dataset.nav === id));

  const titles = {
    home: "SANARÉ",
    quote: "Cotizador",
    wearable: "Pulsera",
    points: (APP_ROLE === "medico" ? "Puntos" : "Comisiones"),
    profile: "Perfil"
  };
  if(topTitle) topTitle.textContent = titles[id] || "SANARÉ";

  if(globalSearch) globalSearch.value = "";
  window.scrollTo({top:0, behavior:"smooth"});

  // ensure iframes fit after nav changes
  requestAnimationFrame(resizeEmbeds);
}

function initNav(){
  navBtns.forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.nav)));
}

function applyHeaderUI(){
  if(rolePill) rolePill.textContent = (APP_ROLE === "medico") ? "Médico" : "KAM";
  if(navPointsLabel) navPointsLabel.textContent = (APP_ROLE === "medico") ? "Puntos" : "Comisiones";
}

function applyHomeKpis(){
  if(monthLabel) monthLabel.textContent = nowMonthLabel();

  if(APP_ROLE === "medico"){
    if(kpi1) kpi1.textContent = "Puntos";
    if(kpi2) kpi2.textContent = "Pulsera";
    if(kpi1l) kpi1l.textContent = "Recompensas";
    if(kpi2l) kpi2l.textContent = "Monitoreo";
    if(kpiHint) kpiHint.textContent = "Entra a Puntos o Pulsera para ver tu panel clínico.";
    return;
  }

  // KAM
  const p = loadJSON(LS_PROFILE);
  const goal = Number(p.kamGoal || 0);
  const sales = Number(p.kamSales || 0);

  if(kpi1) kpi1.textContent = money(goal);
  if(kpi2) kpi2.textContent = money(sales);
  if(kpi1l) kpi1l.textContent = "Meta del mes";
  if(kpi2l) kpi2l.textContent = "Ventas del mes";

  const missing = Math.max(0, goal - sales);
  const progress = goal > 0 ? (sales/goal)*100 : 0;
  if(kpiHint) kpiHint.textContent = goal > 0
    ? `Avance: ${pct(progress)} · Faltante: ${money(missing)}`
    : "Configura tu meta del mes en Comisiones.";
}

function initProfile(){
  const p = loadJSON(LS_PROFILE);
  if(inpName) inpName.value = p.name || "";
  if(inpEmail) inpEmail.value = p.email || "";

  btnSaveProfile?.addEventListener("click", () => {
    const pp = loadJSON(LS_PROFILE);
    pp.name = (inpName?.value || "").trim();
    pp.email = (inpEmail?.value || "").trim();
    saveJSON(LS_PROFILE, pp);
    applyHomeKpis();
    navigate("home");
  });
}

function applyTheme(){
  const t = loadJSON(LS_THEME);
  const theme = (t.theme === "dark") ? "dark" : "light";
  const accent = (typeof t.accent === "string" && t.accent.trim()) ? t.accent.trim() : "#0b1e33";
  document.body.dataset.theme = theme;
  document.documentElement.style.setProperty("--accent", accent);

  if(themeLabel) themeLabel.textContent = theme === "dark" ? "Oscuro" : "Claro";
  if(btnTheme){
    const icon = btnTheme.querySelector("i");
    if(icon) icon.className = (theme === "dark") ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }

  // active swatch
  if(accentPalette){
    $$(".swatch", accentPalette).forEach(b => b.classList.toggle("active", b.dataset.accent === accent));
  }
}

function initThemeControls(){
  // Set defaults once
  const t = loadJSON(LS_THEME);
  if(!t.theme) t.theme = "light";
  if(!t.accent) t.accent = "#0b1e33";
  saveJSON(LS_THEME, t);
  applyTheme();

  btnTheme?.addEventListener("click", () => {
    const cur = loadJSON(LS_THEME);
    cur.theme = (cur.theme === "dark") ? "light" : "dark";
    saveJSON(LS_THEME, cur);
    applyTheme();
    resizeEmbeds();
  });

  if(accentPalette){
    $$(".swatch", accentPalette).forEach(b => {
      b.addEventListener("click", () => {
        const cur = loadJSON(LS_THEME);
        cur.accent = b.dataset.accent;
        saveJSON(LS_THEME, cur);
        applyTheme();
      });
    });
  }
}

function initKamCommissions(){
  if(APP_ROLE !== "kam") return;
  // If the commissions UI is not present, do nothing
  if(!kamGoal || !kamSales) return;

  const p = loadJSON(LS_PROFILE);
  if(inpGoal) inpGoal.value = p.kamGoal ?? "";
  if(inpSales) inpSales.value = p.kamSales ?? "";

  const repaint = () => {
    const pp = loadJSON(LS_PROFILE);
    const goal = Number(pp.kamGoal || 0);
    const sales = Number(pp.kamSales || 0);
    if(kamGoal) kamGoal.textContent = money(goal);
    if(kamSales) kamSales.textContent = money(sales);
    const missing = Math.max(0, goal - sales);
    const progress = goal > 0 ? (sales/goal)*100 : 0;
    if(kamMissing) kamMissing.textContent = money(missing);
    if(kamProgress) kamProgress.textContent = pct(progress);
  };

  btnSaveKam?.addEventListener("click", () => {
    const pp = loadJSON(LS_PROFILE);
    pp.kamGoal = Number(inpGoal?.value || 0);
    pp.kamSales = Number(inpSales?.value || 0);
    saveJSON(LS_PROFILE, pp);
    repaint();
    applyHomeKpis();
  });

  repaint();
}

function initNews(){
  if(!newsGrid || !newsCount) return;

  const items = [
    { img:"assets/img/news/slide1.png?v=7", title:"Noticias Sanaré", sub:"Novedades clínicas, sedes y logística." },
    { img:"assets/img/news/slide2.png?v=7", title:"Disponibilidad de medicamentos", sub:"Inventario y alternativas terapéuticas." },
    { img:"assets/img/news/slide3.png?v=7", title:"Protocolos de infusión", sub:"Seguridad del paciente y operación." },
    { img:"assets/img/news/slide4.png?v=7", title:"Agenda de sedes", sub:"Horarios y coordinación de atención." }
  ];

  newsCount.textContent = String(items.length);

  newsGrid.innerHTML = `
    <div class="carousel" id="newsCarousel">
      <button class="carBtn prev" type="button" aria-label="Anterior">
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <div class="carTrack" id="newsTrack" tabindex="0" aria-label="Carrusel de noticias">
        ${items.map((x, idx) => `
          <div class="news carSlide" role="article" data-idx="${idx}">
            <img src="${x.img}" alt="${x.title}">
            <div class="meta">
              <p class="t">${x.title}</p>
              <p class="s">${x.sub}</p>
            </div>
          </div>
        `).join("")}
      </div>

      <button class="carBtn next" type="button" aria-label="Siguiente">
        <i class="fa-solid fa-chevron-right"></i>
      </button>

      <div class="carDots" id="newsDots" aria-label="Indicadores">
        ${items.map((_, idx) => `<button class="carDot ${idx===0?'active':''}" type="button" aria-label="Ir a noticia ${idx+1}" data-dot="${idx}"></button>`).join("")}
      </div>
    </div>
  `;

  const track = $("#newsTrack");
  const dots = $$("#newsDots .carDot");

  const goTo = (idx) => {
    const slide = track?.querySelector(`.carSlide[data-idx="${idx}"]`);
    if(!slide) return;
    slide.scrollIntoView({behavior:"smooth", inline:"start", block:"nearest"});
    dots.forEach(d => d.classList.toggle("active", Number(d.dataset.dot) === idx));
    currentIdx = idx;
  };

  const nearestIndex = () => {
    if(!track) return 0;
    const slides = $$(".carSlide", track);
    if(!slides.length) return 0;
    const left = track.scrollLeft;
    let best = 0, bestDist = Infinity;
    slides.forEach((s, i) => {
      const dist = Math.abs(s.offsetLeft - left);
      if(dist < bestDist){ bestDist = dist; best = i; }
    });
    return best;
  };

  let currentIdx = 0;
  $(".carBtn.prev")?.addEventListener("click", () => goTo(Math.max(0, currentIdx - 1)));
  $(".carBtn.next")?.addEventListener("click", () => goTo(Math.min(items.length - 1, currentIdx + 1)));
  dots.forEach(d => d.addEventListener("click", () => goTo(Number(d.dataset.dot))));

  let scrollT;
  track?.addEventListener("scroll", () => {
    clearTimeout(scrollT);
    scrollT = setTimeout(() => {
      const idx = nearestIndex();
      dots.forEach(d => d.classList.toggle("active", Number(d.dataset.dot) === idx));
      currentIdx = idx;
    }, 80);
  }, {passive:true});

  // Auto-advance
  let timer = null;
  const start = () => {
    stop();
    timer = setInterval(() => goTo((currentIdx + 1) % items.length), 6500);
  };
  const stop = () => { if(timer){ clearInterval(timer); timer=null; } };

  const carousel = $("#newsCarousel");
  carousel?.addEventListener("mouseenter", stop);
  carousel?.addEventListener("mouseleave", start);
  carousel?.addEventListener("focusin", stop);
  carousel?.addEventListener("focusout", start);

  start();
}

function initSearch(){
  if(!globalSearch) return;
  globalSearch.addEventListener("input", () => {
    const q = globalSearch.value.toLowerCase().trim();
    if(!q){
      $$(".news").forEach(n => n.style.display="");
      return;
    }
    $$(".news").forEach(n => {
      const t = n.innerText.toLowerCase();
      n.style.display = t.includes(q) ? "" : "none";
    });
  });
}

/* ===== Bottom nav collapse + responsive embeds ===== */
function syncNavSpace(){
  if(!bottomNav) return;
  const h = bottomNav.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--nav-space", `${Math.ceil(h)}px`);
}

function setNavCollapsed(collapsed, isUserAction=false){
  if(!bottomNav) return;
  bottomNav.classList.toggle("is-collapsed", !!collapsed);
  if(isUserAction){
    try{ localStorage.setItem(LS_NAV, collapsed ? "1" : "0"); }catch(e){}
    bottomNav.classList.add("user-expanded"); // marker so CSS doesn't fight user choice
  }
  syncNavSpace();
  resizeEmbeds();
}

function initNavCollapse(){
  // default: collapse on landscape, expand on portrait
  let pref = null;
  try{ pref = localStorage.getItem(LS_NAV); }catch(e){}
  if(pref === "1" || pref === "0"){
    setNavCollapsed(pref === "1", false);
  }else{
    setNavCollapsed(window.matchMedia("(orientation: landscape)").matches, false);
  }

  btnNavToggle?.addEventListener("click", () => {
    const collapsed = bottomNav?.classList.contains("is-collapsed");
    setNavCollapsed(!collapsed, true);
  });

  window.addEventListener("resize", () => {
    // If user didn't set pref, auto-collapse by orientation
    let pref2 = null;
    try{ pref2 = localStorage.getItem(LS_NAV); }catch(e){}
    if(pref2 !== "1" && pref2 !== "0"){
      setNavCollapsed(window.matchMedia("(orientation: landscape)").matches, false);
    }else{
      syncNavSpace();
      resizeEmbeds();
    }
  }, {passive:true});
}

function resizeEmbeds(){
  const embeds = $$(".embed");
  if(!embeds.length) return;

  const navH = bottomNav ? bottomNav.getBoundingClientRect().height : 0;
  const safeBottom = Math.ceil(navH) + 18;

  embeds.forEach(el => {
    // Only resize if its section is active (or if element is within active section)
    const screen = el.closest("[data-screen]");
    if(screen && !screen.classList.contains("active")) return;

    const r = el.getBoundingClientRect();
    const available = Math.floor(window.innerHeight - r.top - safeBottom);
    const h = Math.max(320, available);
    el.style.height = `${h}px`;
  });
}

function main(){
  initNav();
  applyHeaderUI();
  initProfile();
  initThemeControls();
  initKamCommissions();
  initNews();
  initSearch();
  initNavCollapse();
  applyHomeKpis();

  // default screen
  navigate("home");
  syncNavSpace();
  resizeEmbeds();

  // resize embeds after iframes load
  $$(".embed").forEach(f => f.addEventListener("load", () => setTimeout(resizeEmbeds, 50)));
}

document.addEventListener("DOMContentLoaded", main);
