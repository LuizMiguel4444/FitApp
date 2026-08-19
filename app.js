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
  habits: [],     // [ {id, name, type:'check'|'numeric', target?, unit?, step?} ]
  habitLog: {},   // { "2026-08-10": [ {id, name, type, value?} ] } — value só existe pra hábitos numéricos
  foodUsage: {},  // { foodId: contagem de vezes adicionado } — base dos "mais usados"
  streakGoals: [], // [ "kcal"|"protein"|"carbs"|"fat"|"habit_<id>", ... ] — metas escolhidas p/ sequência
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
function defaultAddCat(){ return Object.keys(DB.foodUsage||{}).length>0 ? "favoritos" : "proteina"; }

function normalizeCustomFood(f){
  if(!f || !f.name) return null;
  return { id:String(f.id||("custom_"+uid())), name:String(f.name), cat:String(f.cat||"outro"), kcal:Number(f.kcal)||0, p:Number(f.p)||0, c:Number(f.c)||0, g:Number(f.g)||0 };
}


// ============ persistência ============
function loadDB(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      DB = Object.assign({}, DB, parsed);
      DB.goals = Object.assign({ kcal:2709, p:187, c:321, g:75 }, parsed.goals||{});
      DB.customFoods = (parsed.customFoods || []).map(normalizeCustomFood).filter(Boolean);
      DB.log = parsed.log || {};
      DB.weight = parsed.weight || [];
      // "habits" é novo: se não existir no save (usuário antigo) OU for a primeira vez
      // (save sem essa chave), semeia dois exemplos de partida — só nesse caso,
      // nunca sobrescrevendo hábitos que o usuário já tenha criado/apagado.
      // .map normaliza hábitos salvos antes do tipo numérico existir (sem "type" -> "check").
      DB.habits = (parsed.habits!==undefined ? parsed.habits : [
        { id:"habit_"+uid(), name:"Tomar creatina", type:"check" },
        { id:"habit_"+uid(), name:"Fazer vacuum", type:"check" }
      ]).map(h=>({ ...h, type: h.type||"check" }));
      DB.habitLog = parsed.habitLog || {};
      DB.foodUsage = parsed.foodUsage || {};
      DB.streakGoals = parsed.streakGoals || [];
      DB.theme = parsed.theme || "light";
    }else{
      // instalação nova (sem nada salvo ainda): também semeia os exemplos
      DB.habits = [
        { id:"habit_"+uid(), name:"Tomar creatina", type:"check" },
        { id:"habit_"+uid(), name:"Fazer vacuum", type:"check" }
      ];
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
  const target = document.getElementById("tab-"+tab);
  if(!target){ currentTab="hoje"; return switchTab("hoje"); }
  target.classList.remove("hidden");
  document.querySelectorAll(".bottomnav button").forEach(b=>{
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  renderCurrentTab();
  window.scrollTo(0,0);
}
function renderCurrentTab(){
  if(currentTab==="hoje") renderHoje();
  else if(currentTab==="adicionar") renderAdicionar();
  else if(currentTab==="dashboard") renderDashboard();
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

// ============ hábitos / metas pessoais ============
// Combina os hábitos ativos (DB.habits) com quaisquer marcações daquele dia
// específico cujo hábito já tenha sido excluído (fica como "legado", só leitura
// de nome — mas ainda pode ser desmarcado), para o histórico nunca perder dado.
function habitsForDay(dateKey){
  const checked = DB.habitLog[dateKey] || [];
  const checkedMap = new Map(checked.map(c=>[c.id, c]));
  const active = DB.habits.map(h=>{
    if(h.type==="numeric"){
      const entry = checkedMap.get(h.id);
      const value = entry ? (entry.value||0) : 0;
      const target = h.target||0;
      return { id:h.id, name:h.name, type:"numeric", target, unit:h.unit||"un.", step:h.step||1, value, done: target>0 && value>=target, legacy:false };
    }
    return { id:h.id, name:h.name, type:"check", done: checkedMap.has(h.id), legacy:false };
  });
  const legacy = checked
    .filter(c=>!DB.habits.some(h=>h.id===c.id))
    .map(c=>{
      if(c.type==="numeric"){
        const target = c.target||0;
        return { id:c.id, name:c.name, type:"numeric", target, unit:c.unit||"un.", step: c.step||Math.max(1,Math.round(target/10))||1, value:c.value||0, done: target>0 && (c.value||0)>=target, legacy:true };
      }
      return { id:c.id, name:c.name, type:"check", done:true, legacy:true };
    });
  return active.concat(legacy);
}
function toggleHabit(dateKey, habitId, habitName){
  if(!DB.habitLog[dateKey]) DB.habitLog[dateKey] = [];
  const idx = DB.habitLog[dateKey].findIndex(c=>c.id===habitId);
  if(idx>=0){ DB.habitLog[dateKey].splice(idx,1); }
  else{ DB.habitLog[dateKey].push({ id:habitId, name:habitName, type:"check" }); }
  if(DB.habitLog[dateKey].length===0) delete DB.habitLog[dateKey];
  saveDB();
}
function setHabitValue(dateKey, habit, newValue){
  const value = Math.max(0, Math.round(newValue*10)/10);
  if(!DB.habitLog[dateKey]) DB.habitLog[dateKey] = [];
  const entry = DB.habitLog[dateKey].find(c=>c.id===habit.id);
  if(value<=0){
    DB.habitLog[dateKey] = DB.habitLog[dateKey].filter(c=>c.id!==habit.id);
  }else if(entry){
    entry.value = value; entry.name = habit.name; entry.type = "numeric"; entry.target = habit.target; entry.unit = habit.unit; entry.step = habit.step;
  }else{
    DB.habitLog[dateKey].push({ id:habit.id, name:habit.name, type:"numeric", value, target:habit.target, unit:habit.unit, step:habit.step });
  }
  if(DB.habitLog[dateKey].length===0) delete DB.habitLog[dateKey];
  saveDB();
}
function addHabit(name, type, opts){
  const clean = String(name||"").trim();
  if(!clean) return { ok:false, msg:"Dê um nome para a meta pessoal." };
  const dup = DB.habits.some(h=>h.name.toLowerCase()===clean.toLowerCase());
  if(dup) return { ok:false, msg:"Você já tem uma meta pessoal com esse nome." };
  const habit = { id:"habit_"+uid(), name:clean, type: type==="numeric" ? "numeric" : "check" };
  if(habit.type==="numeric"){
    const target = Number(opts && opts.target);
    if(!target || target<=0) return { ok:false, msg:"Informe uma meta numérica válida (maior que zero)." };
    habit.target = target;
    habit.unit = String((opts&&opts.unit)||"").trim() || "un.";
    habit.step = (opts&&Number(opts.step)>0) ? Number(opts.step) : Math.max(1, Math.round(target/10));
  }
  DB.habits.push(habit);
  saveDB();
  return { ok:true };
}
function updateHabit(habitId, updates){
  const h = DB.habits.find(x=>x.id===habitId);
  if(!h) return { ok:false, msg:"Meta pessoal não encontrada." };
  const clean = String(updates.name||"").trim();
  if(!clean) return { ok:false, msg:"Dê um nome para a meta pessoal." };
  const dup = DB.habits.some(x=>x.id!==habitId && x.name.toLowerCase()===clean.toLowerCase());
  if(dup) return { ok:false, msg:"Você já tem uma meta pessoal com esse nome." };
  h.name = clean;
  if(h.type==="numeric"){
    const target = Number(updates.target);
    if(!target || target<=0) return { ok:false, msg:"Informe uma meta numérica válida (maior que zero)." };
    h.target = target;
    h.unit = String(updates.unit||"").trim() || "un.";
    h.step = Number(updates.step)>0 ? Number(updates.step) : Math.max(1, Math.round(target/10));
  }
  saveDB();
  return { ok:true };
}
function deleteHabit(habitId){
  DB.habits = DB.habits.filter(h=>h.id!==habitId);
  DB.streakGoals = DB.streakGoals.filter(k=>k!==habitId);
  saveDB();
}

// ============ sequências (streaks) ============
function streakGoalOptions(){
  const opts = [
    { key:"kcal", label:"Calorias" },
    { key:"protein", label:"Proteína" },
    { key:"carbs", label:"Carboidrato" },
    { key:"fat", label:"Gordura" }
  ];
  DB.habits.forEach(h=> opts.push({ key:h.id, label:h.name }));
  return opts;
}
function streakLabel(goalKey){
  const found = streakGoalOptions().find(o=>o.key===goalKey);
  return found ? found.label : goalKey;
}
function isGoalMetOnDate(goalKey, dateKey){
  const nutriField = { kcal:"kcal", protein:"p", carbs:"c", fat:"g" }[goalKey];
  if(nutriField){
    const goalVal = DB.goals[nutriField];
    if(!goalVal || goalVal<=0) return false;
    return dayTotals(dateKey)[nutriField] >= goalVal;
  }
  if(goalKey.startsWith("habit_")){
    const entry = habitsForDay(dateKey).find(h=>h.id===goalKey);
    return entry ? entry.done : false;
  }
  return false;
}
function computeStreak(goalKey){
  const keyOf = (dt)=> dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
  const d = new Date(); d.setHours(0,0,0,0);
  // se hoje ainda não foi cumprido, a sequência não quebra por isso — só ainda
  // não conta hoje, e a contagem passa a olhar a partir de ontem.
  if(!isGoalMetOnDate(goalKey, keyOf(d))) d.setDate(d.getDate()-1);
  let streak = 0;
  while(isGoalMetOnDate(goalKey, keyOf(d))){
    streak++;
    d.setDate(d.getDate()-1);
  }
  return streak;
}

// ============ repetir refeição ============
function findPreviousMealEntries(beforeDate, mealKey){
  const dates = Object.keys(DB.log).filter(d=>d<beforeDate).sort().reverse();
  for(const d of dates){
    const entries = (DB.log[d]||[]).filter(e=>e.meal===mealKey);
    if(entries.length>0) return { date:d, entries };
  }
  return null;
}
function repeatMeal(dateKey, mealKey){
  const found = findPreviousMealEntries(dateKey, mealKey);
  if(!found){ toast("Nenhum registro anterior encontrado para essa refeição."); return; }
  if(!DB.log[dateKey]) DB.log[dateKey] = [];
  found.entries.forEach(e=>{
    DB.log[dateKey].push({
      id: uid(), foodId: e.foodId, name: e.name, cat: e.cat, grams: e.grams,
      per100: { ...e.per100 }, kcal: e.kcal, p: e.p, c: e.c, g: e.g, meal: mealKey
    });
    if(e.foodId) DB.foodUsage[e.foodId] = (DB.foodUsage[e.foodId]||0) + 1;
  });
  saveDB();
  renderCurrentTab();
  toast(`✓ ${found.entries.length} ${found.entries.length===1?"item repetido":"itens repetidos"} de ${fmtDateShort(found.date)}`);
}

function renderHabitManageList(){
  if(DB.habits.length===0) return `<div class="empty-hint" style="padding:10px 0;">Nenhuma meta pessoal cadastrada ainda.</div>`;
  return DB.habits.map(h=>`<div class="habit-manage-row">
    <span>${esc(h.name)}${h.type==="numeric"?` <span style="opacity:.6;font-size:12px;">(meta: ${n0(h.target)} ${esc(h.unit)})</span>`:``}</span>
    <span style="display:flex;gap:4px;">
      <button data-edit-habit="${h.id}" title="Editar">✏️</button>
      <button data-del-habit="${h.id}" title="Excluir">🗑</button>
    </span>
  </div>`).join("");
}
function openHabitModal(editId=null){
  const existing = editId ? DB.habits.find(h=>h.id===editId) : null;
  openModal(`
    <h3>${existing?"Editar":"Nova"} meta pessoal</h3>
    <div class="field"><label>Nome</label><input type="text" id="hm-name" value="${existing?esc(existing.name):""}" placeholder="Ex: Tomar creatina"></div>
    <div class="field"><label>Tipo</label>
      <select id="hm-type" ${existing?"disabled":""}>
        <option value="check" ${(!existing||existing.type==="check")?"selected":""}>Sim/não (marcar quando cumprir)</option>
        <option value="numeric" ${(existing&&existing.type==="numeric")?"selected":""}>Numérica (com meta e progresso)</option>
      </select>
    </div>
    <div id="hm-numeric-fields" style="${(existing&&existing.type==="numeric")?"":"display:none;"}">
      <div class="grid2">
        <div class="field"><label>Meta</label><input type="text" inputmode="decimal" id="hm-target" value="${existing&&existing.target?existing.target:""}" placeholder="Ex: 3000"></div>
        <div class="field"><label>Unidade</label><input type="text" id="hm-unit" value="${existing?esc(existing.unit||""):""}" placeholder="Ex: ml, copos, passos"></div>
      </div>
      <div class="field"><label>Incremento por toque (opcional)</label><input type="text" inputmode="decimal" id="hm-step" value="${existing&&existing.step?existing.step:""}" placeholder="Ex: 250"></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:8px;">
      <button class="btn secondary" id="hm-cancel" style="width:auto;flex:1;">Cancelar</button>
      <button class="btn" id="hm-save" style="flex:1;">Salvar</button>
    </div>
  `);
  document.getElementById("hm-cancel").addEventListener("click", closeModal);
  document.getElementById("hm-type").addEventListener("change", (e)=>{
    document.getElementById("hm-numeric-fields").style.display = e.target.value==="numeric" ? "" : "none";
  });
  document.getElementById("hm-save").addEventListener("click", ()=>{
    const name = document.getElementById("hm-name").value;
    const type = document.getElementById("hm-type").value;
    const opts = { target: numVal("hm-target"), unit: document.getElementById("hm-unit").value, step: numVal("hm-step") };
    const res = existing ? updateHabit(existing.id, { name, ...opts }) : addHabit(name, type, opts);
    if(!res.ok){ alert(res.msg); return; }
    closeModal();
    document.getElementById("habit-manage-list").innerHTML = renderHabitManageList();
    toast(existing ? "✓ Meta pessoal atualizada!" : "✓ Meta pessoal adicionada!");
  });
}
function wireHabitManageActions(){
  document.getElementById("add-habit-btn").addEventListener("click", ()=> openHabitModal());
  // delegação: um único listener no container cobre editar/excluir, mesmo
  // depois do innerHTML da lista ser trocado.
  document.getElementById("habit-manage-list").addEventListener("click", (ev)=>{
    const editBtn = ev.target.closest("[data-edit-habit]");
    if(editBtn){ openHabitModal(editBtn.dataset.editHabit); return; }
    const delBtn = ev.target.closest("[data-del-habit]");
    if(delBtn){
      if(confirm("Excluir esta meta pessoal? Os dias já marcados no histórico continuam registrados.")){
        deleteHabit(delBtn.dataset.delHabit);
        document.getElementById("habit-manage-list").innerHTML = renderHabitManageList();
        toast("Meta pessoal removida.");
      }
    }
  });
  document.querySelectorAll("[data-streak-key]").forEach(cb=>{
    cb.addEventListener("change", ()=>{
      const key = cb.dataset.streakKey;
      if(cb.checked){ if(!DB.streakGoals.includes(key)) DB.streakGoals.push(key); }
      else{ DB.streakGoals = DB.streakGoals.filter(k=>k!==key); }
      saveDB();
      toast(cb.checked ? "🔥 Sequência ativada" : "Sequência desativada");
    });
  });
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

  if(dateKey===todayKey() && DB.streakGoals.length>0){
    html += `<div class="streak-strip">${DB.streakGoals.map(goalKey=>{
      const n = computeStreak(goalKey);
      return `<div class="streak-badge"><span class="sb-fire">🔥</span><b>${n}</b><span class="sb-label">${esc(streakLabel(goalKey))}</span></div>`;
    }).join("")}</div>`;
  }

  const habits = habitsForDay(dateKey);
  const checkHabits = habits.filter(h=>h.type==="check");
  const numHabits = habits.filter(h=>h.type==="numeric");
  if(habits.length>0){
    html += `<div class="habit-card">
      <h3>✅ Metas pessoais</h3>
      ${checkHabits.length>0 ? `<div class="habit-pills">
        ${checkHabits.map(h=>`<button class="habit-pill ${h.done?"done":""}" data-habit-toggle="${h.id}" data-habit-name="${esc(h.name)}" ${!editable?"disabled":""}>
          <span class="hp-check">${h.done?"✓":""}</span>${esc(h.name)}${h.legacy?` <span style="opacity:.6;">(removida)</span>`:``}
        </button>`).join("")}
      </div>` : ``}
      ${numHabits.map(h=>{
        const pct = h.target>0 ? Math.min(100,(h.value/h.target)*100) : 0;
        return `<div class="habit-numeric ${h.done?"done":""}">
          <div class="hn-top">
            <span class="hn-name">${esc(h.name)}${h.legacy?` <span style="opacity:.6;">(removida)</span>`:``}</span>
            <span class="hn-val" ${editable?`data-habit-editval="${h.id}"`:""}>${n1(h.value)} / ${n0(h.target)} ${esc(h.unit)}</span>
          </div>
          <div class="hn-track"><div class="hn-fill" style="width:${pct}%"></div></div>
          ${editable ? `<div class="hn-controls">
            <button data-habit-adjust="${h.id}" data-habit-delta="-1">− ${n1(h.step)} ${esc(h.unit)}</button>
            <button data-habit-adjust="${h.id}" data-habit-delta="1">+ ${n1(h.step)} ${esc(h.unit)}</button>
          </div>` : ``}
        </div>`;
      }).join("")}
    </div>`;
  }

  Object.keys(MEALS).forEach(mealKey=>{
    const mealEntries = entries.filter(e=>e.meal===mealKey);
    const mealKcal = mealEntries.reduce((s,e)=>s+e.kcal,0);
    const prevMeal = editable ? findPreviousMealEntries(dateKey, mealKey) : null;
    html += `<div class="meal-card">
      <div class="meal-head">
        <h3>${MEALS[mealKey]}</h3>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="mkcal">${n0(mealKcal)} kcal</span>
          ${prevMeal ? `<button class="meal-repeat" data-repeat-meal="${mealKey}" title="Repetir de ${fmtDateShort(prevMeal.date)}">🔁</button>` : ``}
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
  wireHabitActions(container, dateKey);
}

function wireHabitActions(container, dateKey){
  container.querySelectorAll("[data-habit-toggle]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      toggleHabit(dateKey, btn.dataset.habitToggle, btn.dataset.habitName);
      renderCurrentTab();
    });
  });
  container.querySelectorAll("[data-habit-adjust]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const h = habitsForDay(dateKey).find(x=>x.id===btn.dataset.habitAdjust);
      if(!h) return;
      const sign = btn.dataset.habitDelta==="-1" ? -1 : 1;
      setHabitValue(dateKey, h, h.value + sign*h.step);
      renderCurrentTab();
    });
  });
  container.querySelectorAll("[data-habit-editval]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const h = habitsForDay(dateKey).find(x=>x.id===el.dataset.habitEditval);
      if(!h) return;
      const val = prompt(`Novo valor de "${h.name}" (${h.unit}):`, h.value);
      if(val===null) return;
      const num = parseFloat(String(val).replace(",","."));
      if(isNaN(num) || num<0){ alert("Informe um número válido."); return; }
      setHabitValue(dateKey, h, num);
      renderCurrentTab();
    });
  });
  container.querySelectorAll("[data-repeat-meal]").forEach(btn=>{
    btn.addEventListener("click", (ev)=>{
      ev.stopPropagation();
      repeatMeal(dateKey, btn.dataset.repeatMeal);
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
  }else if(addCat==="favoritos"){
    listSource = Object.entries(DB.foodUsage||{})
      .sort((a,b)=>b[1]-a[1])
      .map(([id])=>findFood(id))
      .filter(Boolean)
      .slice(0,15);
  }else{
    listSource = allFoods().filter(f=>f.cat===addCat);
  }

  let listHtml = "";
  if(addCat==="custom" && !addSearch){
    listHtml += `<div class="custom-add-card" id="btn-new-custom">＋ Adicionar novo alimento</div>`;
  }
  if(listSource.length===0){
    let hint = "Tente buscar outro termo.";
    if(addCat==="custom") hint = "Toque acima para cadastrar o seu.";
    if(addCat==="favoritos") hint = "Os alimentos que você mais adicionar vão aparecer aqui.";
    listHtml += `<div class="empty-hint">Nenhum alimento encontrado. ${hint}</div>`;
  }
  listSource.forEach(f=>{
    const isCustom = f.id.startsWith("custom_");
    listHtml += `<div class="food-card" data-food="${f.id}">
      <div class="food-row" data-action="toggle">
        <div>
          <div class="fname">${esc(f.name)} ${(addSearch||addCat==="custom"||addCat==="favoritos") ? `<span style="font-size:11px;color:var(--ink-soft);">${CATS[f.cat].icon}</span>`:""}</div>
          <div class="fmeta">${n0(f.kcal)} kcal · P ${n1(f.p)} · C ${n1(f.c)} · G ${n1(f.g)} <span style="opacity:.7;">/100g</span></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${isCustom ? `<button data-action="editcustom" style="background:none;border:none;color:var(--ink-soft);font-size:15px;">✏️</button><button data-action="delcustom" style="background:none;border:none;color:var(--ink-soft);font-size:15px;">🗑</button>` : ``}
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
  if(newCustomBtn) newCustomBtn.addEventListener("click", ()=>openCustomFoodModal());

  el.querySelectorAll('[data-action="toggle"]').forEach(row=>{
    row.addEventListener("click", ()=>{
      const id = row.parentElement.dataset.food;
      openFoodId = (openFoodId===id) ? null : id;
      renderAdicionar();
    });
  });
  el.querySelectorAll('[data-action="editcustom"]').forEach(btn=>{
    btn.addEventListener("click", (ev)=>{
      ev.stopPropagation();
      const id = btn.closest(".food-card").dataset.food;
      openCustomFoodModal(id);
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
  DB.foodUsage[f.id] = (DB.foodUsage[f.id]||0) + 1;
  saveDB();
  openFoodId = null;
  renderAdicionar();
  const quando = dateKey===todayKey() ? MEALS[meal].toLowerCase() : `${MEALS[meal].toLowerCase()} de ${fmtDateShort(dateKey)}`;
  toast(`✓ ${f.name} adicionado em ${quando}`);
}

function openCustomFoodModal(editId=null){
  const existing = editId ? DB.customFoods.find(f=>f.id===editId) : null;
  openModal(`
    <h3>${existing ? "Editar alimento" : "Novo alimento"}</h3>
    <div class="field"><label>Nome</label><input type="text" id="cf-name" value="${existing?esc(existing.name):""}" placeholder="Ex: Lasanha caseira"></div>
    <div class="field"><label>Categoria</label>
      <select id="cf-cat">
        ${Object.keys(CATS).filter(k=>k!=="custom"&&k!=="favoritos").map(k=>`<option value="${k}" ${existing&&existing.cat===k?"selected":""}>${CATS[k].icon} ${CATS[k].label}</option>`).join("")}
      </select>
    </div>
    <p class="desc" style="margin-top:6px;">Informe os valores nutricionais para <b>100 g</b> do alimento.</p>
    <div class="grid2">
      <div class="field"><label>Calorias (kcal)</label><input type="text" id="cf-kcal" inputmode="decimal" value="${existing?existing.kcal:""}"></div>
      <div class="field"><label>Proteína (g)</label><input type="text" id="cf-p" inputmode="decimal" value="${existing?existing.p:""}"></div>
      <div class="field"><label>Carboidrato (g)</label><input type="text" id="cf-c" inputmode="decimal" value="${existing?existing.c:""}"></div>
      <div class="field"><label>Gordura (g)</label><input type="text" id="cf-g" inputmode="decimal" value="${existing?existing.g:""}"></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:8px;">
      <button class="btn secondary" id="cf-cancel" style="width:auto;flex:1;">Cancelar</button>
      <button class="btn" id="cf-save" style="flex:1;">${existing?"Salvar alterações":"Salvar alimento"}</button>
    </div>
  `);
  document.getElementById("cf-cancel").addEventListener("click", closeModal);
  document.getElementById("cf-save").addEventListener("click", ()=>saveCustomFood(editId));
}

function saveCustomFood(editId=null){
  const name = document.getElementById("cf-name").value.trim();
  const cat = document.getElementById("cf-cat").value;
  const kcal = numVal("cf-kcal");
  const p = numVal("cf-p");
  const c = numVal("cf-c");
  const g = numVal("cf-g");
  if(!name){ alert("Dê um nome para o alimento."); return; }
  if([kcal,p,c,g].some(v=>v<0)){ alert("Os valores nutricionais não podem ser negativos."); return; }
  const dup = allFoods().some(x=>x.id!==editId && x.name.toLowerCase()===name.toLowerCase());
  if(dup){ alert("Já existe um alimento com esse nome."); return; }
  const item = normalizeCustomFood({id:editId||("custom_"+uid()),name,cat,kcal,p,c,g});
  if(editId){
    const i=DB.customFoods.findIndex(f=>f.id===editId);
    if(i>=0) DB.customFoods[i]=item;
  }else DB.customFoods.push(item);
  saveDB(); closeModal(); addCat="custom"; addSearch=""; renderAdicionar(); toast(editId ? "✓ Alimento atualizado!" : "✓ Alimento cadastrado!");
}

// ============================================================
// TAB: DASHBOARD
// ============================================================
let dashPeriod = 7;

function dashboardEntries(){
  const keys = Object.keys(DB.log || {}).sort();
  return keys.flatMap(d => (DB.log[d]||[]).map(e => ({...e, date:d})));
}
function periodKeys(days){
  const out=[]; const base=new Date(); base.setHours(0,0,0,0);
  for(let i=days-1;i>=0;i--){ const d=new Date(base); d.setDate(base.getDate()-i); out.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")); }
  return out;
}
function dashboardData(days){
  const keys = periodKeys(days);

  const daily = keys.map(date => ({
    date,
    ...dayTotals(date),
    hasEntries: (DB.log[date] || []).length > 0
  }));

  // Considera somente dias que realmente possuem registros.
  // Dias sem alimentação registrada não entram no denominador
  // e, portanto, não alteram a média ao aumentar o período.
  const activeDays = daily.filter(day => day.hasEntries);

  const totals = activeDays.reduce(
    (acc, day) => ({
      kcal: acc.kcal + day.kcal,
      p: acc.p + day.p,
      c: acc.c + day.c,
      g: acc.g + day.g
    }),
    { kcal: 0, p: 0, c: 0, g: 0 }
  );

  const count = activeDays.length;

  const avg = count > 0
    ? {
        kcal: totals.kcal / count,
        p: totals.p / count,
        c: totals.c / count,
        g: totals.g / count
      }
    : {
        kcal: 0,
        p: 0,
        c: 0,
        g: 0
      };

  // Ranking de alimentos: somente registros existentes
  const top = {};

  activeDays.forEach(day => {
    (DB.log[day.date] || []).forEach(entry => {
      top[entry.name] = (top[entry.name] || 0) + entry.kcal;
    });
  });

  const leaders = Object.entries(top)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return {
    keys,
    daily,
    totals,
    avg,
    active: count,
    activeDays: count,
    leaders
  };
}
function svgLine(values, labels, colorVar="var(--chart-line)"){
  if (!values.length) return "";

  const W = 680;
  const H = 260;

  const left = 56;
  const right = 18;
  const top = 18;
  const bottom = 42;

  const chartW = W - left - right;
  const chartH = H - top - bottom;

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);

  // Evita gráfico "achatado" quando todos os valores são iguais.
  const padding = rawMax === rawMin
    ? Math.max(rawMax * 0.10, 10)
    : (rawMax - rawMin) * 0.10;

  const min = Math.max(0, rawMin - padding);
  const max = rawMax + padding;
  const range = max - min || 1;

  const xStep = values.length > 1
    ? chartW / (values.length - 1)
    : 0;

  const points = values.map((value, index) => {
    const x = left + index * xStep;
    const y = top + chartH - ((value - min) / range) * chartH;
    return { x, y, value };
  });

  // 5 divisões no eixo Y
  const yTicks = 5;

  const grid = Array.from({ length: yTicks + 1 }, (_, i) => {
    const ratio = i / yTicks;
    const y = top + ratio * chartH;
    const value = max - ratio * range;

    return `
      <line
        x1="${left}"
        y1="${y.toFixed(1)}"
        x2="${W - right}"
        y2="${y.toFixed(1)}"
        stroke="var(--line)"
        stroke-width="1"
      />
      <text
        x="${left - 8}"
        y="${(y + 4).toFixed(1)}"
        text-anchor="end"
        font-size="11"
        fill="var(--ink-soft)"
      >${n0(value)}</text>
    `;
  }).join("");

  // Eixo X: no máximo 7 rótulos
  const maxXLabels = 7;
  const xEvery = values.length <= maxXLabels
    ? 1
    : Math.ceil((values.length - 1) / (maxXLabels - 1));

  const xLabels = labels.map((label, index) => {
    const isLast = index === labels.length - 1;

    if (index !== 0 && !isLast && index % xEvery !== 0) {
      return "";
    }

    const p = points[index];

    return `
      <text
        x="${p.x.toFixed(1)}"
        y="${H - 12}"
        text-anchor="middle"
        font-size="10"
        fill="var(--ink-soft)"
      >${label}</text>
    `;
  }).join("");

  const path = points.map((p, index) =>
    `${index === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  ).join(" ");

  const dots = points.map(p => `
    <circle
      cx="${p.x.toFixed(1)}"
      cy="${p.y.toFixed(1)}"
      r="3.5"
      fill="var(--chart-point)"
    />
  `).join("");

  return `
    <svg
      viewBox="0 0 ${W} ${H}"
      style="width:100%;height:auto;display:block;"
      preserveAspectRatio="none"
    >
      ${grid}

      <line
        x1="${left}"
        y1="${top + chartH}"
        x2="${W - right}"
        y2="${top + chartH}"
        stroke="var(--ink-soft)"
        stroke-width="1"
      />

      <line
        x1="${left}"
        y1="${top}"
        x2="${left}"
        y2="${top + chartH}"
        stroke="var(--ink-soft)"
        stroke-width="1"
      />

      <path
        d="${path}"
        fill="none"
        stroke="${colorVar}"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      ${dots}
      ${xLabels}
    </svg>
  `;
}
function renderDashboard(){
  const el=document.getElementById("tab-dashboard");
  const d=dashboardData(dashPeriod), g=DB.goals||{};
  const currentWeight=(DB.weight||[]).slice().sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
  const adherence=d.daily.filter(x=>x.kcal>0 && g.kcal>0 && x.kcal<=g.kcal*1.05).length;
  const kcalMax=Math.max(g.kcal||1,...d.daily.map(x=>x.kcal),1);
  const macroTotal=d.avg.p+d.avg.c+d.avg.g;
  el.innerHTML=`
    <div class="section-title">Dashboard</div>
    <div class="period-tabs">
      ${[7,14,30,90].map(p=>`<button class="period-tab ${p===dashPeriod?"active":""}" data-period="${p}">${p} dias</button>`).join("")}
    </div>
    <div class="dashboard-grid" style="margin-top:12px;">
      <div class="kpi-card"><div class="kpi-label">Média kcal</div><div class="kpi-value">${n0(d.avg.kcal)}</div><div class="kpi-sub">meta ${n0(g.kcal||0)} kcal</div></div>
      <div class="kpi-card"><div class="kpi-label">Proteína</div><div class="kpi-value">${n0(d.avg.p)} g</div><div class="kpi-sub">meta ${n0(g.p||0)} g</div></div>
      <div class="kpi-card"><div class="kpi-label">Peso</div><div class="kpi-value">${currentWeight?n1(currentWeight.kg)+" kg":"—"}</div><div class="kpi-sub">último registro</div></div>
      <div class="kpi-card"><div class="kpi-label">Aderência</div><div class="kpi-value">${adherence}/${d.active}</div><div class="kpi-sub">dias dentro da meta</div></div>
    </div>
    <div class="chart-card">
      <h3>Calorias por dia</h3>
      ${
        d.active
          ? (() => {
              const chartDays = d.daily.filter(x => x.hasEntries);

              return svgLine(
                chartDays.map(x => x.kcal),
                chartDays.map(x => {
                  const [year, month, day] = x.date.split("-");
                  return `${day}/${month}`;
                })
              );
            })()
          : `<div class="empty-hint">Ainda não há registros suficientes para este período. Adicione alimentos na aba Adicionar.</div>`
      }
    </div>
    <div class="chart-card"><h3>Macronutrientes médios</h3>
      ${macroTotal>0?`<div class="bar-row"><span>Proteína</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,(d.avg.p/(g.p||d.avg.p||1))*100)}%"></div></div><b>${n1(d.avg.p)} g</b></div>
      <div class="bar-row"><span>Carboidrato</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,(d.avg.c/(g.c||d.avg.c||1))*100)}%"></div></div><b>${n1(d.avg.c)} g</b></div>
      <div class="bar-row"><span>Gordura</span><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,(d.avg.g/(g.g||d.avg.g||1))*100)}%"></div></div><b>${n1(d.avg.g)} g</b></div>`:`<div class="empty-hint">Sem dados de macronutrientes no período.</div>`}
    </div>
    <div class="chart-card"><h3>Alimentos que mais contribuíram para as calorias</h3>
      ${d.leaders.length?d.leaders.map((x,i)=>`<div class="bar-row"><span>${i+1}. ${esc(x[0])}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(4,Math.min(100,(x[1]/Math.max(d.leaders[0][1],1))*100))}%"></div></div><b>${n0(x[1])} kcal</b></div>`).join(""):`<div class="empty-hint">Ainda não há alimentos registrados.</div>`}
    </div>`;
  el.querySelectorAll('.period-tab').forEach(btn=>btn.addEventListener('click',()=>{dashPeriod=Number(btn.dataset.period);renderDashboard();}));
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

  const dates = Array.from(new Set([
    ...Object.keys(DB.log).filter(d=>(DB.log[d]||[]).length>0),
    ...Object.keys(DB.habitLog).filter(d=>(DB.habitLog[d]||[]).length>0)
  ])).sort().reverse();
  let html = `<div class="section-title">Dias registrados</div>`;
  if(dates.length===0){
    html += `<div class="empty-hint">Você ainda não tem dias registrados. Comece adicionando alimentos na aba "Adicionar".</div>`;
  }
  dates.forEach(d=>{
    const t = dayTotals(d);
    const count = (DB.log[d]||[]).length;
    const habitCount = (DB.habitLog[d]||[]).length;
    const parts = [];
    if(count>0) parts.push(`${count} ${count===1?"item":"itens"}`);
    if(habitCount>0) parts.push(`${habitCount} ${habitCount===1?"meta pessoal":"metas pessoais"}`);
    const sub = parts.length ? parts.join(" · ") : "0 itens registrados";
    html += `<div class="hist-row" data-date="${d}">
      <div><div class="hdate">${fmtDateShort(d)}${d===todayKey()?" · hoje":""}</div><div class="hsub">${sub}</div></div>
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
  if (!data || data.length < 2) return "";

  const W = 680;
  const H = 260;

  const left = 56;
  const right = 18;
  const top = 18;
  const bottom = 42;

  const chartW = W - left - right;
  const chartH = H - top - bottom;

  const weights = data.map(d => d.kg);

  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);

  const padding = rawMax === rawMin
    ? Math.max(rawMax * 0.02, 0.5)
    : (rawMax - rawMin) * 0.10;

  const min = Math.max(0, rawMin - padding);
  const max = rawMax + padding;
  const range = max - min || 1;

  const xStep = chartW / (data.length - 1);

  const points = data.map((item, index) => {
    const x = left + index * xStep;
    const y = top + chartH - ((item.kg - min) / range) * chartH;

    return {
      x,
      y,
      kg: item.kg
    };
  });

  const yTicks = 5;

  const grid = Array.from({ length: yTicks + 1 }, (_, i) => {
    const ratio = i / yTicks;
    const y = top + ratio * chartH;
    const value = max - ratio * range;

    return `
      <line
        x1="${left}"
        y1="${y.toFixed(1)}"
        x2="${W - right}"
        y2="${y.toFixed(1)}"
        stroke="var(--line)"
        stroke-width="1"
      />

      <text
        x="${left - 8}"
        y="${(y + 4).toFixed(1)}"
        text-anchor="end"
        font-size="11"
        fill="var(--ink-soft)"
      >${n1(value)}</text>
    `;
  }).join("");

  const maxXLabels = 7;

  const xEvery = data.length <= maxXLabels
    ? 1
    : Math.ceil((data.length - 1) / (maxXLabels - 1));

  const xLabels = data.map((item, index) => {
    const isLast = index === data.length - 1;

    if (index !== 0 && !isLast && index % xEvery !== 0) {
      return "";
    }

    const [year, month, day] = item.date.split("-");
    const label = `${day}/${month}`;

    const p = points[index];

    return `
      <text
        x="${p.x.toFixed(1)}"
        y="${H - 12}"
        text-anchor="middle"
        font-size="10"
        fill="var(--ink-soft)"
      >${label}</text>
    `;
  }).join("");

  const path = points.map((p, index) =>
    `${index === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  ).join(" ");

  const dots = points.map(p => `
    <circle
      cx="${p.x.toFixed(1)}"
      cy="${p.y.toFixed(1)}"
      r="3.5"
      fill="var(--chart-point)"
    />
  `).join("");

  const first = data[0];
  const last = data[data.length - 1];

  const diff = last.kg - first.kg;

  const diffTxt =
    `${diff >= 0 ? "+" : ""}${n1(diff)} kg no período`;

  return `
    <svg
      viewBox="0 0 ${W} ${H}"
      style="width:100%;height:auto;display:block;"
      preserveAspectRatio="none"
    >
      ${grid}

      <line
        x1="${left}"
        y1="${top + chartH}"
        x2="${W - right}"
        y2="${top + chartH}"
        stroke="var(--ink-soft)"
        stroke-width="1"
      />

      <line
        x1="${left}"
        y1="${top}"
        x2="${left}"
        y2="${top + chartH}"
        stroke="var(--ink-soft)"
        stroke-width="1"
      />

      <path
        d="${path}"
        fill="none"
        stroke="var(--chart-line)"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      ${dots}
      ${xLabels}
    </svg>

    <div
      style="
        font-size:12px;
        color:var(--ink-soft);
        text-align:center;
        margin-top:6px;
      "
    >
      ${diffTxt} · ${n1(rawMin)}–${n1(rawMax)} kg
    </div>
  `;
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
      <h3>Metas pessoais</h3>
      <p class="desc">Hábitos que você quer acompanhar todo dia, além da nutrição — marcáveis (ex: tomar creatina) ou numéricas com meta (ex: beber 3L de água). Aparecem na aba Hoje e ficam registradas no Histórico de cada dia.</p>
      <div id="habit-manage-list">${renderHabitManageList()}</div>
      <button class="btn secondary" id="add-habit-btn">+ Adicionar meta pessoal</button>
    </div>

    <div class="card">
      <h3>🔥 Sequências</h3>
      <p class="desc">Escolha quais metas você quer acompanhar em dias seguidos — viram um contador na aba Hoje. Metas nutricionais contam como cumpridas quando você atinge pelo menos o valor definido.</p>
      <div class="streak-options">
        ${streakGoalOptions().map(o=>`<label class="streak-option">
          <input type="checkbox" data-streak-key="${o.key}" ${DB.streakGoals.includes(o.key)?"checked":""}>
          ${esc(o.label)}
        </label>`).join("")}
      </div>
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
  wireHabitManageActions();
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
      DB.customFoods = (DB.customFoods||[]).map(normalizeCustomFood).filter(Boolean);
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
  addCat = defaultAddCat();
  document.querySelectorAll(".bottomnav button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(btn.dataset.tab === "adicionar"){ addDate = todayKey(); addCat = defaultAddCat(); addSearch=""; }
      if(btn.dataset.tab === "historico") histView = "list";
      switchTab(btn.dataset.tab);
    });
  });
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
  renderCurrentTab();

  if("serviceWorker" in navigator && (location.protocol==="https:" || location.hostname==="localhost")){
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }
});
