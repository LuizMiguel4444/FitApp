// ============================================================
// Prato do Dia — lógica do app (100% local, sem servidor)
// Todos os dados ficam salvos no localStorage deste navegador.
// ============================================================

const STORAGE_KEY = "pratoDoDiaDB_v1";

let DB = {
  goals: { kcal: 2709, p: 187, c: 321, g: 75 }, // sugestão inicial editável em "Metas"
  customFoods: [],
  log: {},     // { "2026-08-10": [ {id, foodId, name, cat, grams, per100:{kcal,p,c,g}, kcal,p,c,g, meal} ] }
  weight: [],  // [ {id, date, kg} ]
  theme: "light"
};

// ---------- estado de navegação (não persistido) ----------
let currentTab = "hoje";
let addCat = "proteina";
let addSearch = "";
let openFoodId = null;
let pendingMeal = "almoco";
let addDate = todayKey(); // data-alvo da aba Adicionar — padrão: hoje
let histView = "list";
let histDate = null;

// ============ util ============
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function todayKey(){
  const d = new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function fmtDateLong(key){
  const [y,m,d] = key.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  let s = dt.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" });
  return s.charAt(0).toUpperCase()+s.slice(1);
}
function fmtDateShort(key){
  const [y,m,d] = key.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  return dt.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" });
}
function n0(x){ return Math.round(x||0).toString(); }
function n1(x){ return (Math.round((x||0)*10)/10).toFixed(1).replace(".",","); }
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function numVal(id, fallback){
  const el = document.getElementById(id);
  const dflt = fallback===undefined ? 0 : fallback;
  if(!el) return dflt;
  const n = parseFloat(String(el.value).trim().replace(",", "."));
  return isNaN(n) ? dflt : n;
}

function allFoods(){ return FOODS.concat(DB.customFoods); }
function findFood(id){ return allFoods().find(f => f.id === id); }

// ============ persistência ============
function loadDB(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      DB = Object.assign({}, DB, parsed);
      DB.goals = Object.assign({ kcal:2709, p:187, c:321, g:75 }, parsed.goals||{});
      DB.customFoods = parsed.customFoods || [];
      DB.log = parsed.log || {};
      DB.weight = parsed.weight || [];
      DB.theme = parsed.theme || "light";
    }
  }catch(e){ console.warn("Não foi possível carregar dados salvos:", e); }
}
function saveDB(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
    return true;
  }catch(e){
    console.warn("Não foi possível salvar:", e);
    toast("⚠️ Não foi possível salvar os dados neste navegador.");
    return false;
  }
}

// ============ toast ============
let toastTimer = null;
function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.remove("show"), 2200);
}

// ============ modal ============
function openModal(html){
  document.getElementById("modal-sheet").innerHTML = html;
  document.getElementById("modal-overlay").classList.add("show");
}
function closeModal(){
  document.getElementById("modal-overlay").classList.remove("show");
}

// ============ navegação ============
function switchTab(tab){
  currentTab = tab;
  document.querySelectorAll(".tab").forEach(s => s.classList.add("hidden"));
  document.getElementById("tab-"+tab).classList.remove("hidden");
  document.querySelectorAll(".bottomnav button").forEach(b=>{
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  renderCurrentTab();
  window.scrollTo(0,0);
}
function renderCurrentTab(){
  if(currentTab==="hoje") renderHoje();
  else if(currentTab==="adicionar") renderAdicionar();
  else if(currentTab==="historico") renderHistorico();
  else if(currentTab==="peso") renderPeso();
  else if(currentTab==="metas") renderMetas();
}

// ============ TEMA ============
function applyTheme(){
  document.documentElement.setAttribute("data-theme", DB.theme);
  document.getElementById("theme-toggle").textContent = DB.theme==="dark" ? "☀️" : "🌙";
}
function toggleTheme(){
  DB.theme = DB.theme==="dark" ? "light" : "dark";
  saveDB();
  applyTheme();
}

// ============================================================
// TAB: HOJE
// ============================================================
function dayTotals(dateKey){
  const entries = DB.log[dateKey] || [];
  const t = { kcal:0, p:0, c:0, g:0 };
  entries.forEach(e => { t.kcal+=e.kcal; t.p+=e.p; t.c+=e.c; t.g+=e.g; });
  return t;
}

function renderDayCard(dateKey, editable){
  const entries = DB.log[dateKey] || [];
  const totals = dayTotals(dateKey);
  const goals = DB.goals;
  const pct = goals.kcal>0 ? Math.min(100, Math.round((totals.kcal/goals.kcal)*100)) : 0;

  let html = `
  <div class="plate-wrap">
    <div class="plate" style="--pct:${pct}"><div class="rim"></div>
      <div class="plate-num"><b>${n0(totals.kcal)}</b><span>de ${n0(goals.kcal)} kcal</span></div>
    </div>
    <div class="plate-meta">
      <div class="goalline">Faltam <b>${n0(Math.max(0,goals.kcal-totals.kcal))} kcal</b> para a meta de hoje</div>
      ${macroBar("Proteína", totals.p, goals.p, "protein")}
      ${macroBar("Carboidrato", totals.c, goals.c, "carbs")}
      ${macroBar("Gordura", totals.g, goals.g, "fat")}
    </div>
  </div>`;

  Object.keys(MEALS).forEach(mealKey=>{
    const mealEntries = entries.filter(e=>e.meal===mealKey);
    const mealKcal = mealEntries.reduce((s,e)=>s+e.kcal,0);
    html += `<div class="meal-card">
      <div class="meal-head">
        <h3>${MEALS[mealKey]}</h3>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="mkcal">${n0(mealKcal)} kcal</span>
          ${editable ? `<button class="meal-add" data-meal="${mealKey}">+ adicionar</button>` : ``}
        </div>
      </div>`;
    if(mealEntries.length===0){
      html += `<div class="empty-hint">Nenhum alimento registrado ainda.</div>`;
    }else{
      mealEntries.forEach(e=>{
        html += `<div class="entry" data-entry="${e.id}" data-date="${dateKey}">
          <div class="einfo" data-action="edit">
            <div class="ename">${esc(e.name)}</div>
            <div class="esub">${n0(e.grams)} g · P ${n1(e.p)} · C ${n1(e.c)} · G ${n1(e.g)}</div>
          </div>
          <div class="ekcal">${n0(e.kcal)}</div>
          ${editable ? `<button class="edel" data-action="del" title="Remover">✕</button>` : ``}
        </div>`;
      });
    }
    html += `</div>`;
  });
  return html;
}

function macroBar(label, val, goal, cls){
  const pct = goal>0 ? Math.min(100, (val/goal)*100) : 0;
  return `<div class="macrobar">
    <div class="mlabel"><span>${label}</span><b>${n1(val)} / ${n0(goal)} g</b></div>
    <div class="mtrack"><div class="mfill ${cls}" style="width:${pct}%"></div></div>
  </div>`;
}

function renderHoje(){
  document.getElementById("today-label").textContent = fmtDateLong(todayKey());
  const el = document.getElementById("tab-hoje");
  el.innerHTML = renderDayCard(todayKey(), true);

  el.querySelectorAll(".meal-add").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      pendingMeal = btn.dataset.meal;
      addDate = todayKey();
      switchTab("adicionar");
    });
  });
  wireEntryActions(el, todayKey());
}

function wireEntryActions(container, dateKey){
  container.querySelectorAll(".entry").forEach(row=>{
    const entryId = row.dataset.entry;
    const info = row.querySelector('[data-action="edit"]');
    const delBtn = row.querySelector('[data-action="del"]');
    if(info) info.addEventListener("click", ()=> editEntry(dateKey, entryId));
    if(delBtn) delBtn.addEventListener("click", (ev)=>{
      ev.stopPropagation();
      if(confirm("Remover este alimento do registro?")){
        DB.log[dateKey] = (DB.log[dateKey]||[]).filter(e=>e.id!==entryId);
        saveDB();
        renderCurrentTab();
      }
    });
  });
}

function editEntry(dateKey, entryId){
  const list = DB.log[dateKey] || [];
  const entry = list.find(e=>e.id===entryId);
  if(!entry) return;
  const val = prompt(`Nova quantidade (em gramas) de "${entry.name}":`, entry.grams);
  if(val===null) return;
  const grams = parseFloat(val.replace(",","."));
  if(isNaN(grams) || grams<=0){ alert("Informe um número de gramas válido."); return; }
  entry.grams = grams;
  entry.kcal = entry.per100.kcal * grams/100;
  entry.p = entry.per100.p * grams/100;
  entry.c = entry.per100.c * grams/100;
  entry.g = entry.per100.g * grams/100;
  saveDB();
  renderCurrentTab();
  toast("Quantidade atualizada.");
}

// ============================================================
// TAB: ADICIONAR
// ============================================================
function renderAdicionar(){
  const el = document.getElementById("tab-adicionar");
  let chips = "";
  Object.keys(CATS).forEach(catKey=>{
    chips += `<button class="cat-chip ${addCat===catKey && !addSearch ? "active":""}" data-cat="${catKey}">${CATS[catKey].icon} ${CATS[catKey].label}</button>`;
  });

  let listSource;
  if(addSearch.trim()!==""){
    const q = addSearch.trim().toLowerCase();
    listSource = allFoods().filter(f=>f.name.toLowerCase().includes(q));
  }else if(addCat==="custom"){
    // "Meus alimentos" agrega todos os personalizados, independente da categoria real deles
    listSource = DB.customFoods;
  }else{
    listSource = allFoods().filter(f=>f.cat===addCat);
  }

  let listHtml = "";
  if(addCat==="custom" && !addSearch){
    listHtml += `<div class="custom-add-card" id="btn-new-custom">＋ Adicionar novo alimento</div>`;
  }
  if(listSource.length===0){
    listHtml += `<div class="empty-hint">Nenhum alimento encontrado. ${addCat==="custom"?"Toque acima para cadastrar o seu.":"Tente buscar outro termo."}</div>`;
  }
  listSource.forEach(f=>{
    const isCustom = f.id.startsWith("custom_");
    listHtml += `<div class="food-card" data-food="${f.id}">
      <div class="food-row" data-action="toggle">
        <div>
          <div class="fname">${esc(f.name)} ${(addSearch||addCat==="custom") ? `<span style="font-size:11px;color:var(--ink-soft);">${CATS[f.cat].icon}</span>`:""}</div>
          <div class="fmeta">${n0(f.kcal)} kcal · P ${n1(f.p)} · C ${n1(f.c)} · G ${n1(f.g)} <span style="opacity:.7;">/100g</span></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${isCustom ? `<button data-action="delcustom" style="background:none;border:none;color:var(--ink-soft);font-size:15px;">🗑</button>` : ``}
          <span class="fkcal">▾</span>
        </div>
      </div>
      <div class="food-panel ${openFoodId===f.id ? "open":""}" data-panel="${f.id}">
        ${f.porc ? `<div class="hint">💡 ${esc(f.porc)}</div>` : ""}
        <div class="row-inline">
          <div class="field"><label>Quantidade (g)</label><input type="text" inputmode="decimal" value="100" data-grams="${f.id}"></div>
          <div class="field"><label>Refeição</label>
            <select data-meal="${f.id}">
              ${Object.keys(MEALS).map(k=>`<option value="${k}" ${k===pendingMeal?"selected":""}>${MEALS[k]}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="preview-macros" data-preview="${f.id}">
          ${previewInner(f, 100)}
        </div>
        <button class="btn" data-action="confirmadd" data-food="${f.id}">Adicionar ao registro</button>
      </div>
    </div>`;
  });

  el.innerHTML = `
    <div class="date-picker-bar ${addDate!==todayKey() ? "not-today":""}">
      <div class="dpb-label"><span>🗓️ Adicionando para</span><b>${addDate===todayKey() ? "Hoje" : fmtDateLong(addDate)}</b></div>
      <div style="display:flex;align-items:center;gap:8px;">
        ${addDate!==todayKey() ? `<button class="dpb-today-btn" id="add-date-today">Hoje</button>` : ``}
        <input type="date" id="add-date" value="${addDate}" max="${todayKey()}">
      </div>
    </div>
    <div class="search-wrap"><input type="text" placeholder="Buscar alimento..." id="food-search" value="${esc(addSearch)}"></div>
    <div class="cat-tabs">${chips}</div>
    ${listHtml}
  `;

  document.getElementById("add-date").addEventListener("change", (e)=>{
    addDate = e.target.value || todayKey();
    openFoodId = null;
    renderAdicionar();
  });
  const dateOnTodayBtn = document.getElementById("add-date-today");
  if(dateOnTodayBtn) dateOnTodayBtn.addEventListener("click", ()=>{
    addDate = todayKey(); openFoodId = null; renderAdicionar();
  });

  // eventos
  document.getElementById("food-search").addEventListener("input", (e)=>{
    addSearch = e.target.value;
    openFoodId = null;
    renderAdicionar();
    const inp = document.getElementById("food-search");
    inp.focus();
    const pos = inp.value.length;
    inp.setSelectionRange(pos, pos);
  });
  el.querySelectorAll(".cat-chip").forEach(c=>{
    c.addEventListener("click", ()=>{
      addCat = c.dataset.cat; addSearch=""; openFoodId=null; renderAdicionar();
    });
  });
  const newCustomBtn = document.getElementById("btn-new-custom");
  if(newCustomBtn) newCustomBtn.addEventListener("click", openCustomFoodModal);

  el.querySelectorAll('[data-action="toggle"]').forEach(row=>{
    row.addEventListener("click", ()=>{
      const id = row.parentElement.dataset.food;
      openFoodId = (openFoodId===id) ? null : id;
      renderAdicionar();
    });
  });
  el.querySelectorAll('[data-action="delcustom"]').forEach(btn=>{
    btn.addEventListener("click", (ev)=>{
      ev.stopPropagation();
      const id = btn.closest(".food-card").dataset.food;
      if(confirm("Excluir este alimento personalizado? Os registros já feitos com ele não serão afetados.")){
        DB.customFoods = DB.customFoods.filter(f=>f.id!==id);
        saveDB();
        renderAdicionar();
      }
    });
  });
  el.querySelectorAll('[data-grams]').forEach(inp=>{
    inp.addEventListener("input", ()=>{
      const f = findFood(inp.dataset.grams);
      const grams = parseFloat(inp.value.replace(",","."))||0;
      const prevEl = document.querySelector(`[data-preview="${f.id}"]`);
      if(prevEl) prevEl.innerHTML = previewInner(f, grams);
    });
  });
  el.querySelectorAll('[data-action="confirmadd"]').forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const f = findFood(btn.dataset.food);
      const gramsInp = document.querySelector(`[data-grams="${f.id}"]`);
      const mealSel = document.querySelector(`[data-meal="${f.id}"]`);
      const grams = parseFloat(gramsInp.value.replace(",","."));
      if(isNaN(grams) || grams<=0){ alert("Informe uma quantidade válida em gramas."); return; }
      pendingMeal = mealSel.value;
      addEntry(f, grams, mealSel.value);
    });
  });
}

function previewInner(f, grams){
  const k = f.kcal*grams/100, p=f.p*grams/100, c=f.c*grams/100, g=f.g*grams/100;
  return `<div><b>${n0(k)}</b><span>kcal</span></div>
    <div><b>${n1(p)}</b><span>proteína</span></div>
    <div><b>${n1(c)}</b><span>carbo</span></div>
    <div><b>${n1(g)}</b><span>gordura</span></div>`;
}

function addEntry(f, grams, meal){
  const dateKey = addDate;
  if(!DB.log[dateKey]) DB.log[dateKey] = [];
  DB.log[dateKey].push({
    id: uid(),
    foodId: f.id,
    name: f.name,
    cat: f.cat,
    grams: grams,
    per100: { kcal:f.kcal, p:f.p, c:f.c, g:f.g },
    kcal: f.kcal*grams/100,
    p: f.p*grams/100,
    c: f.c*grams/100,
    g: f.g*grams/100,
    meal: meal
  });
  saveDB();
  openFoodId = null;
  renderAdicionar();
  const quando = dateKey===todayKey() ? MEALS[meal].toLowerCase() : `${MEALS[meal].toLowerCase()} de ${fmtDateShort(dateKey)}`;
  toast(`✓ ${f.name} adicionado em ${quando}`);
}

function openCustomFoodModal(){
  openModal(`
    <h3>Novo alimento</h3>
    <div class="field"><label>Nome</label><input type="text" id="cf-name" placeholder="Ex: Bolo de fubá caseiro"></div>
    <div class="field"><label>Categoria</label>
      <select id="cf-cat">
        ${Object.keys(CATS).filter(k=>k!=="custom").map(k=>`<option value="${k}">${CATS[k].icon} ${CATS[k].label}</option>`).join("")}
      </select>
    </div>
    <p class="desc" style="margin-top:6px;">Informe os valores para <b>100 g</b> do alimento.</p>
    <div class="grid2">
      <div class="field"><label>Calorias (kcal)</label><input type="text" id="cf-kcal" inputmode="decimal"></div>
      <div class="field"><label>Proteína (g)</label><input type="text" id="cf-p" inputmode="decimal"></div>
      <div class="field"><label>Carboidrato (g)</label><input type="text" id="cf-c" inputmode="decimal"></div>
      <div class="field"><label>Gordura (g)</label><input type="text" id="cf-g" inputmode="decimal"></div>
    </div>
    <div class="field"><label>Fibra (g) — opcional</label><input type="text" id="cf-f" inputmode="decimal"></div>
    <div style="display:flex;gap:10px;margin-top:8px;">
      <button class="btn secondary" id="cf-cancel" style="width:auto;flex:1;">Cancelar</button>
      <button class="btn" id="cf-save" style="flex:1;">Salvar alimento</button>
    </div>
  `);
  document.getElementById("cf-cancel").addEventListener("click", closeModal);
  document.getElementById("cf-save").addEventListener("click", saveCustomFood);
}

function saveCustomFood(){
  const name = document.getElementById("cf-name").value.trim();
  const cat = document.getElementById("cf-cat").value;
  const kcal = numVal("cf-kcal");
  const p = numVal("cf-p");
  const c = numVal("cf-c");
  const g = numVal("cf-g");
  const f = numVal("cf-f");
  if(!name){ alert("Dê um nome para o alimento."); return; }
  const dup = allFoods().some(x=>x.name.toLowerCase()===name.toLowerCase());
  if(dup){ alert("Já existe um alimento com esse nome. Escolha outro nome, ou use/edite o existente em \"Meus alimentos\"."); return; }
  DB.customFoods.push({ id:"custom_"+uid(), name, cat, kcal, p, c, g, f });
  saveDB();
  closeModal();
  addCat = "custom"; addSearch="";
  renderAdicionar();
  toast("✓ Alimento cadastrado!");
}

// ============================================================
// TAB: HISTÓRICO
// ============================================================
function renderHistorico(){
  const el = document.getElementById("tab-historico");
  if(histView==="detail" && histDate){
    const entries = DB.log[histDate]||[];
    let html = `<button class="back-link" id="hist-back">← Voltar ao histórico</button>
      <h2 style="font-size:19px;margin:4px 0 14px;">${fmtDateLong(histDate)}</h2>`;
    html += renderDayCard(histDate, true);
    el.innerHTML = html;
    document.getElementById("hist-back").addEventListener("click", ()=>{ histView="list"; renderHistorico(); });
    wireEntryActions(el, histDate);
    el.querySelectorAll(".meal-add").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        pendingMeal = btn.dataset.meal;
        addDate = histDate;
        switchTab("adicionar");
      });
    });
    return;
  }

  const dates = Object.keys(DB.log).filter(d=>(DB.log[d]||[]).length>0).sort().reverse();
  let html = `<div class="section-title">Dias registrados</div>`;
  if(dates.length===0){
    html += `<div class="empty-hint">Você ainda não tem dias registrados. Comece adicionando alimentos na aba "Adicionar".</div>`;
  }
  dates.forEach(d=>{
    const t = dayTotals(d);
    const count = (DB.log[d]||[]).length;
    html += `<div class="hist-row" data-date="${d}">
      <div><div class="hdate">${fmtDateShort(d)}${d===todayKey()?" · hoje":""}</div><div class="hsub">${count} ${count===1?"item":"itens"} registrados</div></div>
      <div class="hkcal">${n0(t.kcal)} kcal</div>
    </div>`;
  });
  el.innerHTML = html;
  el.querySelectorAll(".hist-row").forEach(r=>{
    r.addEventListener("click", ()=>{ histDate = r.dataset.date; histView="detail"; renderHistorico(); });
  });
}

// ============================================================
// TAB: PESO
// ============================================================
function renderPeso(){
  const el = document.getElementById("tab-peso");
  const list = (DB.weight||[]).slice().sort((a,b)=> a.date < b.date ? 1 : -1);
  const chartData = (DB.weight||[]).slice().sort((a,b)=> a.date < b.date ? -1:1).slice(-20);

  let html = `<div class="card">
    <h3>Registrar peso</h3>
    <div class="row-inline">
      <div class="field"><label>Data</label><input type="date" id="w-date" value="${todayKey()}"></div>
      <div class="field"><label>Peso (kg)</label><input type="text" id="w-kg" inputmode="decimal" placeholder="Ex: 91,8"></div>
    </div>
    <button class="btn" id="w-save">Salvar peso</button>
  </div>`;

  if(chartData.length>=2){
    html += `<div class="card"><h3>Evolução</h3>${weightSVG(chartData)}</div>`;
  }

  html += `<div class="card"><h3>Histórico de peso</h3>`;
  if(list.length===0){
    html += `<div class="empty-hint">Nenhum registro de peso ainda.</div>`;
  }else{
    list.forEach(w=>{
      html += `<div class="weight-row"><span>${fmtDateShort(w.date)}</span><span>${n1(w.kg)} kg</span><button class="wdel" data-id="${w.id}">✕</button></div>`;
    });
  }
  html += `</div>`;

  el.innerHTML = html;
  document.getElementById("w-save").addEventListener("click", ()=>{
    const date = document.getElementById("w-date").value || todayKey();
    const kg = parseFloat(document.getElementById("w-kg").value.replace(",","."));
    if(isNaN(kg) || kg<=0){ alert("Informe um peso válido."); return; }
    DB.weight = DB.weight.filter(w=>w.date!==date); // um registro por dia
    DB.weight.push({ id:uid(), date, kg });
    saveDB();
    renderPeso();
    toast("✓ Peso registrado!");
  });
  el.querySelectorAll(".wdel").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(confirm("Remover este registro de peso?")){
        DB.weight = DB.weight.filter(w=>w.id!==btn.dataset.id);
        saveDB();
        renderPeso();
      }
    });
  });
}

function weightSVG(data){
  const W=300,H=90,pad=10;
  const weights = data.map(d=>d.kg);
  const min = Math.min(...weights), max = Math.max(...weights);
  const range = (max-min)||1;
  const stepX = data.length>1 ? (W-2*pad)/(data.length-1) : 0;
  const pts = data.map((d,i)=>{
    const x = pad + i*stepX;
    const y = H-pad - ((d.kg-min)/range)*(H-2*pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const first = data[0], last = data[data.length-1];
  const diff = last.kg-first.kg;
  const diffTxt = (diff>=0?"+":"")+n1(diff)+" kg no período";
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">
    <polyline points="${pts}" fill="none" stroke="var(--urucum)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <div style="font-size:12px;color:var(--ink-soft);text-align:center;margin-top:4px;">${diffTxt} · ${n1(min)}–${n1(max)} kg</div>`;
}

// ============================================================
// TAB: METAS
// ============================================================
function renderMetas(){
  const el = document.getElementById("tab-metas");
  const g = DB.goals;
  el.innerHTML = `
    <div class="card">
      <h3>Metas diárias</h3>
      <p class="desc">Defina manualmente ou use a calculadora abaixo para sugerir valores.</p>
      <div class="grid2">
        <div class="field"><label>Calorias (kcal)</label><input type="text" inputmode="decimal" id="g-kcal" value="${g.kcal}"></div>
        <div class="field"><label>Proteína (g)</label><input type="text" inputmode="decimal" id="g-p" value="${g.p}"></div>
        <div class="field"><label>Carboidrato (g)</label><input type="text" inputmode="decimal" id="g-c" value="${g.c}"></div>
        <div class="field"><label>Gordura (g)</label><input type="text" inputmode="decimal" id="g-g" value="${g.g}"></div>
      </div>
      <button class="btn" id="g-save" style="margin-top:4px;">Salvar metas</button>

      <details class="calc">
        <summary>Calculadora de gasto calórico (TDEE)</summary>
        <p class="desc" style="margin-top:10px;">Estimativa pela fórmula de Mifflin-St Jeor. Serve como ponto de partida — ajuste conforme sua resposta ao longo do tempo ou orientação profissional.</p>
        <div class="grid2">
          <div class="field"><label>Peso (kg)</label><input type="text" inputmode="decimal" id="c-peso" value="91,8"></div>
          <div class="field"><label>Altura (cm)</label><input type="text" inputmode="numeric" id="c-altura" value="183"></div>
          <div class="field"><label>Idade (anos)</label><input type="text" inputmode="numeric" id="c-idade" placeholder="Ex: 22"></div>
          <div class="field"><label>Sexo</label>
            <select id="c-sexo">
              <option value="">Selecione</option>
              <option value="m">Masculino</option>
              <option value="f">Feminino</option>
            </select>
          </div>
        </div>
        <div class="field"><label>Nível de atividade</label>
          <select id="c-atividade">
            <option value="1.2">Sedentário (pouco ou nenhum exercício)</option>
            <option value="1.375">Leve (1-3x/semana)</option>
            <option value="1.55">Moderado (3-5x/semana)</option>
            <option value="1.725" selected>Intenso (6-7x/semana)</option>
            <option value="1.9">Muito intenso (2x/dia, trabalho físico)</option>
          </select>
        </div>
        <div class="field"><label>Objetivo</label>
          <select id="c-objetivo">
            <option value="-0.2">Emagrecimento (déficit ~20%)</option>
            <option value="0">Manutenção</option>
            <option value="0.15" selected>Ganho de massa (superávit ~15%)</option>
          </select>
        </div>
        <button class="btn secondary" id="c-calc" style="margin-top:6px;">Calcular</button>
        <div id="c-result"></div>
      </details>
    </div>

    <div class="card">
      <h3>Backup dos dados</h3>
      <p class="desc">Seus dados ficam salvos apenas neste navegador/aparelho. Exporte um backup de vez em quando para não perder o histórico.</p>
      <button class="btn secondary" id="exp-btn" style="margin-bottom:10px;">⬇️ Exportar backup (.json)</button>
      <input type="file" id="imp-file" accept="application/json" style="display:none;">
      <button class="btn ghost" id="imp-btn">⬆️ Importar backup</button>
    </div>

    <div class="card">
      <h3>Sobre os valores nutricionais</h3>
      <p class="desc" style="margin-bottom:0;">Os valores por 100 g usados no app são médias de referência (Tabela TACO/UNICAMP e USDA) e podem variar conforme marca, ponto de cozimento e origem do alimento. Este app não substitui orientação de um nutricionista.</p>
    </div>
  `;

  document.getElementById("g-save").addEventListener("click", ()=>{
    DB.goals = {
      kcal: numVal("g-kcal"),
      p: numVal("g-p"),
      c: numVal("g-c"),
      g: numVal("g-g")
    };
    saveDB();
    toast("✓ Metas salvas!");
  });

  document.getElementById("c-calc").addEventListener("click", ()=>{
    const peso = numVal("c-peso");
    const altura = numVal("c-altura");
    const idade = numVal("c-idade");
    const sexo = document.getElementById("c-sexo").value;
    const atividade = parseFloat(document.getElementById("c-atividade").value);
    const objetivo = parseFloat(document.getElementById("c-objetivo").value);
    if(!peso || !altura || !idade || !sexo){
      alert("Preencha peso, altura, idade e sexo para calcular.");
      return;
    }
    const bmr = sexo==="m" ? (10*peso + 6.25*altura - 5*idade + 5) : (10*peso + 6.25*altura - 5*idade - 161);
    const tdee = bmr*atividade;
    const meta = tdee*(1+objetivo);
    const proteinG = peso*2.0;
    const proteinKcal = proteinG*4;
    const fatKcal = meta*0.25;
    const fatG = fatKcal/9;
    const carbKcal = Math.max(0, meta-proteinKcal-fatKcal);
    const carbG = carbKcal/4;

    window._lastCalc = { kcal:Math.round(meta), p:Math.round(proteinG), c:Math.round(carbG), g:Math.round(fatG) };

    document.getElementById("c-result").innerHTML = `
      <div class="calc-result">
        Gasto basal estimado: <b>${n0(bmr)} kcal</b><br>
        Gasto total estimado (TDEE): <b>${n0(tdee)} kcal</b><br>
        Meta sugerida: <b>${n0(meta)} kcal</b> · P ${n0(proteinG)}g · C ${n0(carbG)}g · G ${n0(fatG)}g
      </div>
      <button class="btn" id="c-apply">Usar estes valores nas metas acima</button>
    `;
    document.getElementById("c-apply").addEventListener("click", ()=>{
      document.getElementById("g-kcal").value = window._lastCalc.kcal;
      document.getElementById("g-p").value = window._lastCalc.p;
      document.getElementById("g-c").value = window._lastCalc.c;
      document.getElementById("g-g").value = window._lastCalc.g;
      toast("Valores preenchidos — toque em \"Salvar metas\" para confirmar.");
    });
  });

  document.getElementById("exp-btn").addEventListener("click", exportBackup);
  document.getElementById("imp-btn").addEventListener("click", ()=> document.getElementById("imp-file").click());
  document.getElementById("imp-file").addEventListener("change", importBackup);
}

function exportBackup(){
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prato-do-dia-backup-"+todayKey()+".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
  toast("Backup exportado para a pasta de downloads.");
}
function importBackup(ev){
  const file = ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(reader.result);
      if(!confirm("Isso vai substituir todos os dados atuais pelo conteúdo do backup. Deseja continuar?")) return;
      DB = Object.assign({ goals:{kcal:2709,p:187,c:321,g:75}, customFoods:[], log:{}, weight:[], theme:"light" }, parsed);
      saveDB();
      applyTheme();
      renderCurrentTab();
      toast("✓ Backup importado!");
    }catch(e){
      alert("Não foi possível ler este arquivo de backup.");
    }
  };
  reader.readAsText(file);
  ev.target.value = "";
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener("DOMContentLoaded", ()=>{
  loadDB();
  applyTheme();
  document.querySelectorAll(".bottomnav button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(btn.dataset.tab === "adicionar") addDate = todayKey();
      switchTab(btn.dataset.tab);
    });
  });
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  renderCurrentTab();

  if("serviceWorker" in navigator && (location.protocol==="https:" || location.hostname==="localhost")){
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }
});
