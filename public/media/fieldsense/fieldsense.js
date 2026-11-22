(function () {
  'use strict';
  const data = typeof window !== 'undefined' ? window.FIELDSENSE_DATA : null;
  const fmt = (value, digits = 0) => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
  const escape = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function summarize(result, policy, day) {
    if (!result.feasible) return null;
    return result.allocations.reduce((sum, field) => {
      const events = field.simulation[policy].events.slice(0, day);
      sum.water += events.reduce((v, e) => v + e.irrigation_mm, 0) * field.area_ha * 10;
      sum.unmet += events.reduce((v, e) => v + e.unmet_demand_mm, 0) * field.area_ha * 10;
      return sum;
    }, { water: 0, unmet: 0 });
  }
  function cumulative(result, policy) {
    return Array.from({ length: 8 }, (_, day) => summarize(result, policy, day).water);
  }
  function potentialYield(scenario) {
    const predictions = scenario.result.feasible ? scenario.result.allocations : scenario.result.predictions;
    const totalArea = scenario.input.fields.reduce((sum, f) => sum + f.area_ha, 0);
    return scenario.input.fields.reduce((sum, field, i) => sum + field.area_ha * predictions[i].predicted_yield_t_ha, 0) / totalArea;
  }
  const model = { summarize, cumulative, potentialYield };
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  if (typeof document === 'undefined') return;
  const root = document.getElementById('fieldsense-app');
  if (!root) return;
  const $ = id => root.querySelector('#' + id);
  if (!data || data.schema_version !== 1) {
    $('fs-scenario-description').textContent = 'The recorded scenario data could not be loaded. Reload this page to try again.';
    root.querySelectorAll('button, select, input').forEach(control => { control.disabled = true; });
    return;
  }
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = { scenario: 'balanced', policy: 'mdp', day: 1, field: 0, model: 'irrigate', playing: false, timer: null };
  const scenario = () => data.scenarios[state.scenario];
  const result = () => scenario().result;
  const stageCopy = {
    predict: 'The Random Forest maps synthetic crop, soil and seasonal weather inputs to yield potential. Its predictions become the optimizer’s harvest objective.',
    allocate: 'The optimizer chooses one resource bundle per field within shared water, fertilizer, labor and equipment limits. Each water allocation becomes a hard irrigation cap.',
    irrigate: 'The controller weighs expected crop-water deficits against irrigation use over the remaining days. It chooses before today’s rainfall is revealed.'
  };
  const iso = (u, v, z = 0) => [430 + (u - v) * 1.85, 76 + (u + v) * .9 - z];
  const points = corners => corners.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
  const rect = (u, v, w, h, z = 0) => [iso(u, v, z), iso(u + w, v, z), iso(u + w, v + h, z), iso(u, v + h, z)];
  const shapes = [{ u: 10, v: 13, w: 73, h: 70 }, { u: 106, v: 13, w: 73, h: 151 }, { u: 10, v: 104, w: 73, h: 71 }];
  // The parcel plan and the replay share the same three schematic field footprints.
  const labelPositions = [
    { x: 180, y: 12, end: [350, 71] }, { x: 640, y: 356, end: [660, 356] },
    { x: 19, y: 363, end: [170, 363] }
  ];

  function crops(s, index) {
    const symbols = ['wheat', 'corn', 'soy'];
    let rows = '';
    for (let u = s.u + 8; u < s.u + s.w - 4; u += 9) {
      const start = iso(u, s.v + 4, 4), end = iso(u, s.v + s.h - 4, 4);
      rows += `<path d="M${start}L${end}" stroke="#293d2b" stroke-width="3" opacity=".7"/>`;
      for (let v = s.v + 8; v < s.v + s.h - 4; v += 10) {
        const [x, y] = iso(u, v, 4);
        rows += `<use href="#fs-${symbols[index]}" x="${x}" y="${y}"/>`;
      }
    }
    return rows;
  }

  function terrainFace(top, edge, fill) {
    const a = top[edge], b = top[2];
    const band = (depth, thickness, color) =>
      `<polygon fill="${color}" points="${points([[a[0], a[1]+depth], [b[0], b[1]+depth], [b[0], b[1]+depth+thickness], [a[0], a[1]+depth+thickness]])}"/>`;
    return band(0, 29, fill) + band(0, 4, '#657653') + band(8, 2, '#92785c') + band(16, 3, '#82664d');
  }

  function drawFarm() {
    const r = result();
    if (!r.feasible) return;
    const terrain = rect(0, 0, 192, 192);
    const defs = `<defs>
      <linearGradient id="fs-ground" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#899474"/><stop offset="1" stop-color="#50644f"/></linearGradient>
      <linearGradient id="fs-tank"><stop stop-color="#375f60"/><stop offset=".33" stop-color="#a4c4b1"/><stop offset=".65" stop-color="#719492"/><stop offset="1" stop-color="#365955"/></linearGradient>
      <pattern id="fs-loam" width="13" height="9" patternUnits="userSpaceOnUse"><path d="m1 2 3 1m4 4 2-1" stroke="#e4d5ae" opacity=".34" stroke-width=".9"/></pattern>
      <g id="fs-wheat" fill="#d3b770" stroke="#f2dc94" stroke-width=".8"><path d="M0 0 1-10M1-6-2-9M1-8 4-11"/><path d="m1-6-3-2-1-3 3 2zm0-2 4-5-1 4z"/></g>
      <g id="fs-corn" fill="#95b281" stroke="#c3ce8b" stroke-width=".8"><path d="M0 0V-12M0-3Q-7-5-6-10Q-1-9 0-3ZM0-5Q2-13 7-12Q6-7 0-5Z"/></g>
      <g id="fs-soy" fill="#a9c6a0" stroke="#314c38" stroke-width=".75"><path d="M0 0v-6"/><ellipse cx="-2.4" cy="-4" rx="3.6" ry="2"/><ellipse cx="2.3" cy="-6" rx="3" ry="2.4"/></g>
    </defs>`;
    let svg = `<title id="fs-farm-title">Three-field irrigation replay</title>
      <desc id="fs-farm-desc">The schematic shows the three plots and their water supply. The field inspector reports irrigation, rain, soil-water storage and remaining allocation.</desc>
      ${defs}<ellipse cx="432" cy="367" rx="306" ry="83" fill="#051812" opacity=".55"/>
      ${terrainFace(terrain, 3, '#705c46')}${terrainFace(terrain, 1, '#584d3f')}
      <polygon points="${points(terrain)}" fill="url(#fs-ground)" stroke="#bbc39a"/>
      <polygon points="${points(terrain)}" fill="url(#fs-loam)"/>
      <polygon points="${points(rect(88, 0, 12, 192))}" fill="#baad8d"/>
      <polygon points="${points(rect(0, 85, 97, 12))}" fill="#baad8d"/>`;
    let labels = '';
    shapes.forEach((s, index) => {
      const f = r.allocations[index];
      const center = iso(s.u + s.w / 2, s.v + s.h / 2, 4);
      const pipe = `M${iso(102,183,6)}L${iso(94,183,6)}L${iso(94,s.v+s.h/2,5)}L${center}`;
      // Chamfer the turning space at each corner and keep the whole plot selectable.
      const footprint = [[4,0],[s.w-4,0],[s.w,4],[s.w,s.h-4],[s.w-4,s.h],[4,s.h],[0,s.h-4],[0,4]];
      const outline = points(footprint.map(([u,v]) => iso(s.u+u,s.v+v,3)));
      const rain = Array.from({ length: 16 }, (_, j) => {
        const [x, y] = iso(s.u+12+(j%4)*14, s.v+12+Math.floor(j/4)*(s.h-24)/4, 17);
        return `<path class="fs-rain-drop" d="M${x} ${y-18}v11" style="animation-delay:-${j%7*.13}s"/>`;
      }).join('');
      svg += `<g id="fs-zone-${index}" data-field="${index}" class="fs-zone">
        <polygon points="${outline}" transform="translate(0 4)" fill="#314334"/>
        <polygon id="fs-soil-${index}" class="fs-field-shape" points="${outline}" stroke="#a4ad84"/>
        <polygon points="${outline}" fill="url(#fs-loam)"/>
        <g class="fs-crop-rows">${crops(s, index)}</g>
        <polygon class="fs-selection-ring" points="${outline}"/>
        <g pointer-events="none"><path class="fs-pipe" d="${pipe}"/><path class="fs-pipe-flow" d="${pipe}"/>
        <g transform="translate(${center})"><ellipse rx="8" ry="4" fill="#15392f"/>
          <path d="M0 0v-13m-5 0h10" fill="none" stroke="#dde2c6" stroke-width="3"/>
          <g class="fs-spray" fill="none" stroke="#b5eee1" stroke-width="1.7">
            <ellipse rx="45" ry="15" fill="#b1ecd9" opacity=".18" stroke="none"/>
            <path d="M0-13Q-22-44-44-1M0-13Q22-44 44-1M0-13Q-11-34-22-8M0-13Q11-34 22-8" stroke-dasharray="3 3"/>
          </g>
        </g><g class="fs-rain-mark" stroke="#b3dfff" stroke-linecap="round">${rain}</g></g>
      </g>`;
      const p = labelPositions[index];
      labels += `<g class="fs-plot-note" pointer-events="none">
        <path class="fs-label-leader" d="M${center}L${p.end}"/>
        <g transform="translate(${p.x} ${p.y})"><rect class="fs-label-bg" width="202" height="65" rx="2"/>
          <text class="fs-map-name" x="10" y="20">${escape(f.name)}</text>
          <text class="fs-map-info" x="10" y="39">${escape(f.crop)} · ${fmt(f.area_ha,1)} ha</text>
          <text class="fs-map-action" id="fs-map-action-${index}" x="10" y="56"></text>
        </g></g>
        <g class="fs-plot-initial" data-field="${index}" transform="translate(${iso(s.u+13,s.v+10,8)})">
          <circle r="19"/><text y="8" text-anchor="middle">${escape(f.name[0])}</text></g>`;
    });
    const tank = iso(122, 183, 8);
    svg += `<g transform="translate(${tank.join(' ')})"><ellipse rx="36" ry="17" cy="14" fill="#193a29"/><path d="M-26 -17v32a26 12 0 0 0 52 0v-32Z" fill="url(#fs-tank)" stroke="#aac7b5"/><ellipse rx="26" ry="12" cy="-17" fill="#c1d2b5" stroke="#a7c5ae"/><ellipse rx="20" ry="8" cy="-17" fill="#284e49"/><rect x="-3" y="-13" width="7" height="27" rx="2" fill="#203e34"/><rect id="fs-tank-level" class="fs-water-level" x="-2" y="-12" width="5" height="25" rx="1"/><path d="M-26 14h-18" stroke="#a6c9be" stroke-width="5"/></g>`;
    $('fs-farm').innerHTML = svg + labels;
  }

  function renderModelContext() {
    root.querySelectorAll('[data-model]').forEach(button => {
      const selected = button.dataset.model === state.model;
      button.classList.toggle('fs-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('fs-model-context').textContent = stageCopy[state.model];
  }

  function renderScenario() {
    const s = scenario(); const r = s.result;
    $('fs-scenario').value = state.scenario;
    $('fs-scenario-description').textContent = s.description;
    $('fs-seed').textContent = 'Weather seed ' + s.input.seed;
    $('fs-predict-value').textContent = fmt(potentialYield(s), 2) + ' t/ha';
    $('fs-allocate-value').textContent = r.feasible ? fmt(r.totals.water_m3) + ' m³' : 'Infeasible';
    $('fs-irrigate-value').textContent = r.feasible ? '7 days' : 'Stopped';
    $('fs-lab').hidden = !r.feasible;
    $('fs-outcomes').hidden = !r.feasible;
    $('fs-infeasible').hidden = r.feasible;
    for (const id of ['fs-play','fs-prev','fs-next','fs-day','fs-speed']) $(id).disabled = !r.feasible;
    if (!r.feasible) {
      $('fs-infeasible-reason').textContent = r.reason;
      const fullWater = s.input.fields.reduce((sum, f) => sum + 30 * f.area_ha * 10, 0);
      $('fs-infeasible-detail').textContent = `Full service alone needs ${fmt(fullWater)} m³ of water; this scenario permits ${fmt(s.input.resources.water_m3)} m³. Other shared limits also remain enforced.`;
      $('fs-announcement').textContent = 'Strict constraints: allocation is infeasible. Irrigation replay is stopped.';
    }
    const resources = [ ['water_m3', 'Water', 'm³'], ['fertilizer_kg', 'Fertilizer', 'kg'], ['labor_h', 'Labor', 'h'], ['equipment_h', 'Equipment', 'h'] ];
    const fullFactors = [300,50,4.3,1.5];
    const totalArea = s.input.fields.reduce((sum, f) => sum + f.area_ha, 0);
    $('fs-allocation-note').textContent = r.feasible ? 'Assigned / available' : 'Required for full service / available';
    $('fs-resource-grid').innerHTML = resources.map(([key, name, unit], i) => {
      const use = r.feasible ? r.totals[key] : totalArea * fullFactors[i];
      const cap = s.input.resources[key];
      const fraction = cap ? Math.min(1, use / cap) : 1;
      return `<div class="fs-resource${use > cap + .0001 ? ' fs-over' : ''}"><span class="fs-resource-name">${name}</span><div class="fs-resource-value"><strong>${fmt(use,1)} <small>${unit}</small></strong><span>/ ${fmt(cap,1)} ${unit}</span></div><div class="fs-resource-bar" aria-hidden="true"><span style="width:${fraction*100}%"></span></div></div>`;
    }).join('');
    const rows = r.feasible ? r.allocations : s.input.fields.map((f,i) => ({...f, predicted_yield_t_ha:r.predictions[i].predicted_yield_t_ha}));
    $('fs-allocation-body').innerHTML = rows.map((f,i) => `<tr data-allocation-field="${i}" class="${r.feasible && i===state.field ? 'fs-selected' : ''}"><td>${escape(f.name)}</td><td>${fmt(f.predicted_yield_t_ha,2)} t/ha</td><td>${r.feasible ? `<span class="fs-bundle">${escape(f.bundle)}</span>` : 'Not assigned'}</td><td>${r.feasible ? `${fmt(f.water_m3)} m³ · ${f.water_mm} mm` : '—'}</td><td>${r.feasible ? fmt(f.expected_harvest_t,2)+' t' : '—'}</td></tr>`).join('');
    const m = data.evaluation;
    $('fs-records').textContent = fmt(m.training_rows) + ' / ' + fmt(m.held_out_rows);
    $('fs-mae').textContent = fmt(m.mae_t_ha,4)+' t/ha';
    $('fs-baseline').textContent = fmt(m.baseline_mae_t_ha,4)+' t/ha';
    $('fs-seeds').textContent = m.seed + ' / ' + s.input.seed;
    renderModelContext();
    if (r.feasible) { drawFarm(); renderDay(); }
  }

  function renderDay(announce = true) {
    const r = result(); if (!r.feasible) return;
    const f = r.allocations[state.field];
    const e = f.simulation[state.policy].events[state.day-1];
    const mdp = summarize(r,'mdp',state.day), rule = summarize(r,'rule',state.day);
    $('fs-day').value = String(state.day);
    $('fs-day').setAttribute('aria-valuetext', 'Day '+state.day+' of 7');
    $('fs-day-label').textContent = state.day;
    $('fs-day-chip').textContent = 'Day '+state.day+' / 7';
    if (!state.playing) {
      $('fs-play').textContent = state.day === 7 ? 'Replay week' : 'Play week';
      $('fs-play').setAttribute('aria-label', state.day === 7 ? 'Replay the seven-day week' : 'Play the seven-day replay');
    }
    $('fs-prev').disabled = state.day===1;
    $('fs-next').disabled = state.day===7;
    root.querySelectorAll('[data-policy]').forEach(b => { const active = b.dataset.policy===state.policy; b.classList.toggle('fs-active',active); b.setAttribute('aria-pressed',String(active)); });
    root.querySelectorAll('button[data-field]').forEach(b => { const active = Number(b.dataset.field)===state.field; b.classList.toggle('fs-active',active); b.setAttribute('aria-pressed',String(active)); });
    root.querySelectorAll('[data-allocation-field]').forEach(tr => tr.classList.toggle('fs-selected',Number(tr.dataset.allocationField)===state.field));
    let waterRemaining = 0;
    r.allocations.forEach((field,i) => {
      const event = field.simulation[state.policy].events[state.day-1];
      const zone = $('fs-zone-'+i);
      zone.classList.toggle('fs-selected',i===state.field);
      zone.classList.toggle('fs-watering',event.irrigation_mm>0);
      zone.classList.toggle('fs-raining',event.rain_mm>0);
      const moisture = Math.max(0,Math.min(40,event.ending_moisture_mm));
      const light = 29+moisture/40*10;
      $('fs-soil-'+i).setAttribute('fill',`hsl(${85+i*10} 27% ${light}%)`);
      $('fs-map-action-'+i).textContent = `${event.irrigation_mm} mm water · ${event.rain_mm} mm rain`;
      waterRemaining += event.water_remaining_mm*field.area_ha*10;
    });
    const fillHeight = 25*waterRemaining/r.totals.water_m3;
    $('fs-tank-level').setAttribute('height',fillHeight.toFixed(2));
    $('fs-tank-level').setAttribute('y',(13-fillHeight).toFixed(2));
    $('fs-tank-label').textContent=fmt(waterRemaining)+' m³ left';
    $('fs-field-name').textContent = f.name;
    $('fs-field-subtitle').textContent = f.crop+' · '+fmt(f.area_ha,1)+' ha · '+f.bundle+' bundle';
    $('fs-action-label').textContent = state.policy==='mdp' ? 'MDP irrigation today' : 'Threshold-rule irrigation today';
    $('fs-action-value').innerHTML = `${e.irrigation_mm} <small>mm</small>`;
    $('fs-action-volume').textContent = fmt(e.irrigation_mm*f.area_ha*10)+' m³ over this field';
    $('fs-moisture-value').textContent = fmt(e.ending_moisture_mm,2)+' mm';
    $('fs-moisture-fill').style.width = Math.min(100,e.ending_moisture_mm/40*100)+'%';
    const values = { 'fs-start':fmt(e.starting_moisture_mm,2)+' mm', 'fs-rain':fmt(e.rain_mm,0)+' mm', 'fs-demand':fmt(f.simulation.crop_demand_mm_day,2)+' mm', 'fs-unmet':fmt(e.unmet_demand_mm,2)+' mm', 'fs-cap':f.water_mm+' mm', 'fs-remaining':e.water_remaining_mm+' mm' };
    Object.entries(values).forEach(([id,value]) => { $(id).textContent=value; });
    if (state.policy==='mdp') {
      $('fs-decision-copy').textContent = `With a ${fmt(f.rain_probability*100)}% rain probability and ${fmt(f.simulation.crop_demand_mm_day,2)} mm daily demand, the policy selects ${e.irrigation_mm} mm from the actions allowed by the remaining budget.`;
      $('fs-action-scores').innerHTML = Object.entries(e.q_values).map(([a,q]) => `<div class="fs-score${Number(a)===e.irrigation_mm?' fs-best':''}"><span>${a} mm${Number(a)===e.irrigation_mm?' · chosen':''}</span><strong>${fmt(q,3)}</strong></div>`).join('');
      $('fs-score-note').textContent = `Expected reward through day 7; higher is preferred. Soil state is rounded to a 5 mm bin. Ties favor less water.`;
    } else {
      const beforeBudget = e.water_remaining_mm+e.irrigation_mm;
      $('fs-decision-copy').textContent = `The rule applies 5 mm when starting soil-water storage is below 10 mm and at least 5 mm remains. Today starts at ${fmt(e.starting_moisture_mm,2)} mm with ${beforeBudget} mm available, so it applies ${e.irrigation_mm} mm.`;
      $('fs-action-scores').innerHTML = '';
      $('fs-score-note').textContent = 'The threshold rule has the same water cap and weather path as the MDP.';
    }
    $('fs-through-day').textContent = state.day===7 ? 'Full seven-day outcome' : 'Through day '+state.day;
    $('fs-mdp-water').textContent = fmt(mdp.water,1)+' m³';
    $('fs-rule-water').textContent = fmt(rule.water,1)+' m³';
    $('fs-mdp-unmet').textContent = fmt(mdp.unmet,2)+' m³';
    $('fs-rule-unmet').textContent = fmt(rule.unmet,2)+' m³';
    const diff = rule.water-mdp.water, deficit = mdp.unmet-rule.unmet;
    const waterText = Math.abs(diff)<.001 ? 'The policies have used the same amount of water' : `The MDP has used ${fmt(Math.abs(diff),1)} m³ ${diff>0?'less':'more'} water`;
    const deficitText = Math.abs(deficit)<.001 ? 'the same unmet demand' : `${fmt(Math.abs(deficit),2)} m³ ${deficit>0?'more':'less'} unmet demand`;
    $('fs-tradeoff').textContent = `${waterText}, with ${deficitText}${state.day===7?' over the full week':' so far'}.`;
    renderChart();
    if (announce) $('fs-announcement').textContent = `Day ${state.day}. ${f.name}, ${state.policy==='mdp'?'MDP policy':'threshold rule'}: ${e.irrigation_mm} millimetres irrigation, ${e.rain_mm} millimetres rain, ${e.ending_moisture_mm} millimetres ending soil-water storage.`;
  }

  function renderChart() {
    const r = result(); if (!r.feasible) return;
    const svg = $('fs-water-chart');
    const width = Math.max(280,svg.parentElement.clientWidth-50), height=230;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const margin={left:48,right:15,top:24,bottom:38};
    const x = day => margin.left+day/7*(width-margin.left-margin.right);
    const mdp = cumulative(r,'mdp'), rule=cumulative(r,'rule');
    const max = Math.ceil(Math.max(1,...mdp,...rule)/200)*200;
    const y = val => height-margin.bottom-val/max*(height-margin.bottom-margin.top);
    let content=`<title id="fs-chart-title">Cumulative irrigation by policy</title><desc id="fs-chart-desc">Through day ${state.day}: MDP ${fmt(mdp[state.day])} cubic metres, threshold rule ${fmt(rule[state.day])} cubic metres. Full-week MDP ${fmt(mdp[7])}, rule ${fmt(rule[7])}.</desc>`;
    for (let i=0;i<=3;i++) { const val=max*i/3; content+=`<line class="fs-plot-grid" x1="${margin.left}" y1="${y(val)}" x2="${width-margin.right}" y2="${y(val)}"/><text x="${margin.left-8}" y="${y(val)+4}" text-anchor="end">${fmt(val)}</text>`; }
    const ticks = width<380?[0,2,4,7]:[0,1,2,3,4,5,6,7];
    ticks.forEach(day=>{content+=`<text x="${x(day)}" y="${height-19}" text-anchor="middle">${day}</text>`;});
    content+=`<text class="fs-chart-unit" x="4" y="13">m³</text><text class="fs-chart-unit" x="${width-margin.right}" y="${height-2}" text-anchor="end">Day</text>`;
    const path=values=>values.slice(0,state.day+1).map((v,i)=>`${i?'L':'M'}${x(i)} ${y(v)}`).join(' ');
    content+=`<path class="fs-plot-mdp" d="${path(mdp)}"/><path class="fs-plot-rule" d="${path(rule)}"/><line class="fs-chart-cursor" x1="${x(state.day)}" x2="${x(state.day)}" y1="${margin.top}" y2="${height-margin.bottom}"/><circle cx="${x(state.day)}" cy="${y(rule[state.day])}" r="6" class="fs-rule-point"/><circle cx="${x(state.day)}" cy="${y(mdp[state.day])}" r="3" class="fs-mdp-point"/>`;
    svg.innerHTML=content;
  }

  function stop() {
    clearTimeout(state.timer); state.timer=null;state.playing=false;
    root.classList.remove('fs-is-playing');
    $('fs-play').textContent=state.day===7?'Replay week':'Play week';
    $('fs-play').setAttribute('aria-label',state.day===7?'Replay the seven-day week':'Play the seven-day replay');
  }
  function tick() {
    if (!state.playing) return;
    state.timer=setTimeout(()=>{
      if (state.day<7) {state.day++;renderDay();}
      if (state.day===7) stop(); else tick();
    },Number($('fs-speed').value));
  }
  function play() {
    if (!result().feasible || motion.matches) return;
    if (state.playing) { stop();return; }
    if (state.day===7) {state.day=1;renderDay();}
    state.playing=true;root.classList.add('fs-is-playing');
    $('fs-play').textContent='Pause';$('fs-play').setAttribute('aria-label','Pause the replay');tick();
  }
  function updateMotion() {if(motion.matches)stop();$('fs-motion-note').hidden=!motion.matches;$('fs-play').disabled=motion.matches||!result().feasible;}
  root.addEventListener('click',event=>{
    const target=event.target.closest('[data-field],[data-policy],[data-model]');
    if (!target || !root.contains(target)) return;
    if (target.dataset.model) {state.model=target.dataset.model;renderModelContext();return;}
    if (!result().feasible) return;
    if (target.dataset.field!==undefined) state.field=Number(target.dataset.field);
    if (target.dataset.policy) state.policy=target.dataset.policy;
    renderDay();
  });
  $('fs-scenario').addEventListener('change',()=>{stop();state.scenario=$('fs-scenario').value;state.day=1;renderScenario();updateMotion();});
  $('fs-play').addEventListener('click',play);
  $('fs-prev').addEventListener('click',()=>{stop();state.day=Math.max(1,state.day-1);renderDay();});
  $('fs-next').addEventListener('click',()=>{stop();state.day=Math.min(7,state.day+1);renderDay();if(state.day===7)stop();});
  $('fs-day').addEventListener('input',()=>{stop();state.day=Number($('fs-day').value);renderDay();if(state.day===7)stop();});
  $('fs-speed').addEventListener('change',()=>{if(state.playing){clearTimeout(state.timer);tick();}});
  $('fs-download').addEventListener('click',()=>{
    const exported={schema_version:data.schema_version,provenance:data.provenance,evaluation:data.evaluation,scenario:scenario()};
    const blob=new Blob([JSON.stringify(exported,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='fieldsense-'+state.scenario+'.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),0);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  motion.addEventListener('change',updateMotion);
  const resize=new ResizeObserver(()=>{if(result().feasible)renderChart();});resize.observe($('fs-water-chart').parentElement);
  renderScenario();updateMotion();
  root.dataset.ready='true';
})();
