// ============================================================
// STATE
let A=[[1,2],[3,4]], B=[[5,6],[7,8]];
let steps=[], curStep=-1, playing=false, timer=null;
let speed=1.0, counters={mult:0,add:0,naiveMult:8,saved:0};

const PRESETS=[
  {a:[[1,0],[0,1]],b:[[7,3],[2,9]],name:'Identity×Random'},
  {a:[[0,0],[0,0]],b:[[5,6],[7,8]],name:'Zero Matrix'},
  {a:[[100,200],[300,400]],b:[[500,600],[700,800]],name:'Large Values'},
  {a:[[3,1],[1,3]],b:[[3,1],[1,3]],name:'Symmetric'},
];

// ============================================================
// PSEUDOCODE
// ============================================================
const PSEUDO=[
  {line:'STRASSEN(A, B):',tip:'Entry point for Strassen multiplication of two 2×2 matrices.'},
  {line:'  // Divide into submatrices',tip:'We label quadrants: top-left, top-right, bottom-left, bottom-right.'},
  {line:'  a11,a12,a21,a22 ← quadrants of A',tip:'Split A into 4 scalar elements (for 2×2 base case).'},
  {line:'  b11,b12,b21,b22 ← quadrants of B',tip:'Split B into 4 scalar elements (for 2×2 base case).'},
  {line:'  // 7 Strassen products (Conquer)',tip:'Compute 7 products instead of the 8 needed by naive.'},
  {line:'  P1 ← (a11+a22)·(b11+b22)',tip:'P1 used in all four quadrants of C.'},
  {line:'  P2 ← (a21+a22)·b11',tip:'P2 used in C21 and C22.'},
  {line:'  P3 ← a11·(b12−b22)',tip:'P3 used in C12 and C22.'},
  {line:'  P4 ← a22·(b21−b11)',tip:'P4 used in C11 and C21.'},
  {line:'  P5 ← (a11+a12)·b22',tip:'P5 used in C11 and C12.'},
  {line:'  P6 ← (a21−a11)·(b11+b12)',tip:'P6 used only in C22.'},
  {line:'  P7 ← (a12−a22)·(b21+b22)',tip:'P7 used only in C11.'},
  {line:'  // Combine',tip:'Assemble the four quadrants of C from P1–P7.'},
  {line:'  C11 ← P1+P4−P5+P7',tip:'Top-left of result.'},
  {line:'  C12 ← P3+P5',tip:'Top-right of result.'},
  {line:'  C21 ← P2+P4',tip:'Bottom-left of result.'},
  {line:'  C22 ← P1−P2+P3+P6',tip:'Bottom-right of result.'},
  {line:'  return C',tip:'Return assembled result matrix.'},
];

function buildPseudo(){
  const div=document.getElementById('pseudocode');
  div.innerHTML=PSEUDO.map((p,i)=>`<div class="pline" id="pl${i}" data-tip="${p.tip}">${String(i+1).padStart(2,' ')}: ${p.line}</div>`).join('');
}

function hlLine(n){
  PSEUDO.forEach((_,i)=>document.getElementById('pl'+i).classList.toggle('active',i===n));
  if(n>=0){const el=document.getElementById('pl'+n);if(el)el.scrollIntoView({block:'nearest'});}
}

// ============================================================
// STEP GENERATION
// ============================================================
function parseMatrix(id){
  const txt=document.getElementById(id).value.trim();
  const rows = txt.split('\n').map(r=>r.trim().split(/\s+/).map(Number));

  if(rows.some(row => row.some(v => isNaN(v)))){
    alert("Invalid matrix input. Use numbers only.");
    throw new Error("Invalid input");
  }

  return rows;
}
function buildSteps(){
  A=parseMatrix('matA'); B=parseMatrix('matB');
  if(A.length!==2||A[0].length!==2||B.length!==2||B[0].length!==2){
    alert('Please enter 2×2 matrices for step-by-step mode.');return;
  }
  steps=generateSteps(A,B);
  curStep=-1;
  counters={mult:0,add:0,naiveMult:8,saved:0};
  updateCounters();
  renderHistTable();
  setStatus('ready');
  document.getElementById('btn-step').disabled=false;
  document.getElementById('btn-play').disabled=false;
  document.getElementById('btn-pause').disabled=true;
  stepFwd();
}

function generateSteps(A,B){
  const s=[];
  const [a11,a12]=A[0],[a21,a22]=A[1];
  const [b11,b12]=B[0],[b21,b22]=B[1];
  s.push({line:0,phase:'Start',desc:'Starting Strassen algorithm.',mult:0,add:0,highlight:[]});
  s.push({line:2,phase:'Divide A',desc:`Divide A: a11=${a11}, a12=${a12}, a21=${a21}, a22=${a22}`,mult:0,add:0,highlight:['A']});
  s.push({line:3,phase:'Divide B',desc:`Divide B: b11=${b11}, b12=${b12}, b21=${b21}, b22=${b22}`,mult:0,add:0,highlight:['B']});
  const P1=(a11+a22)*(b11+b22);
  s.push({line:5,phase:'Compute P1',desc:`P1 = (${a11}+${a22})×(${b11}+${b22}) = ${a11+a22}×${b11+b22} = ${P1}`,mult:1,add:2,highlight:['P1'],pval:{P1},color:'p1c'});
  const P2=(a21+a22)*b11;
  s.push({line:6,phase:'Compute P2',desc:`P2 = (${a21}+${a22})×${b11} = ${a21+a22}×${b11} = ${P2}`,mult:1,add:1,highlight:['P2'],pval:{P1,P2},color:'p2c'});
  const P3=a11*(b12-b22);
  s.push({line:7,phase:'Compute P3',desc:`P3 = ${a11}×(${b12}−${b22}) = ${a11}×${b12-b22} = ${P3}`,mult:1,add:1,highlight:['P3'],pval:{P1,P2,P3},color:'p3c'});
  const P4=a22*(b21-b11);
  s.push({line:8,phase:'Compute P4',desc:`P4 = ${a22}×(${b21}−${b11}) = ${a22}×${b21-b11} = ${P4}`,mult:1,add:1,highlight:['P4'],pval:{P1,P2,P3,P4},color:'p4c'});
  const P5=(a11+a12)*b22;
  s.push({line:9,phase:'Compute P5',desc:`P5 = (${a11}+${a12})×${b22} = ${a11+a12}×${b22} = ${P5}`,mult:1,add:1,highlight:['P5'],pval:{P1,P2,P3,P4,P5},color:'p5c'});
  const P6=(a21-a11)*(b11+b12);
  s.push({line:10,phase:'Compute P6',desc:`P6 = (${a21}−${a11})×(${b11}+${b12}) = ${a21-a11}×${b11+b12} = ${P6}`,mult:1,add:2,highlight:['P6'],pval:{P1,P2,P3,P4,P5,P6},color:'p6c'});
  const P7=(a12-a22)*(b21+b22);
  s.push({line:11,phase:'Compute P7',desc:`P7 = (${a12}−${a22})×(${b21}+${b22}) = ${a12-a22}×${b21+b22} = ${P7}`,mult:1,add:2,highlight:['P7'],pval:{P1,P2,P3,P4,P5,P6,P7},color:'p7c'});
  const C11=P1+P4-P5+P7, C12=P3+P5, C21=P2+P4, C22=P1-P2+P3+P6;
  s.push({line:13,phase:'Combine C11',desc:`C11 = P1+P4−P5+P7 = ${P1}+${P4}−${P5}+${P7} = ${C11}`,mult:0,add:3,highlight:['C11'],pval:{P1,P2,P3,P4,P5,P6,P7},result:{C11},color:'p1c'});
  s.push({line:14,phase:'Combine C12',desc:`C12 = P3+P5 = ${P3}+${P5} = ${C12}`,mult:0,add:1,highlight:['C12'],pval:{P1,P2,P3,P4,P5,P6,P7},result:{C11,C12},color:'p3c'});
  s.push({line:15,phase:'Combine C21',desc:`C21 = P2+P4 = ${P2}+${P4} = ${C21}`,mult:0,add:1,highlight:['C21'],pval:{P1,P2,P3,P4,P5,P6,P7},result:{C11,C12,C21},color:'p2c'});
  s.push({line:16,phase:'Combine C22',desc:`C22 = P1−P2+P3+P6 = ${P1}−${P2}+${P3}+${P6} = ${C22}`,mult:0,add:3,highlight:['C22'],pval:{P1,P2,P3,P4,P5,P6,P7},result:{C11,C12,C21,C22},color:'p5c'});
  s.push({line:17,phase:'Done',desc:`✅ Result C = [[${C11},${C12}],[${C21},${C22}]]. Used 7 multiplications and 18 add/subtracts (vs 8 mults naive).`,mult:0,add:0,highlight:['C'],pval:{P1,P2,P3,P4,P5,P6,P7},result:{C11,C12,C21,C22}});
  return s;
}

// ============================================================
// PLAYBACK
// ============================================================
function applyStep(idx){
  if(idx<0||idx>=steps.length)return;
  const st=steps[idx];
  hlLine(st.line);
  counters.mult+=st.mult||0; counters.add+=st.add||0;
  counters.saved=counters.naiveMult-counters.mult;
  updateCounters();
  document.getElementById('stepbox').innerHTML=st.desc;
  document.getElementById('stepcounter').textContent=`Step ${idx+1} / ${steps.length}`;
  renderViz(st);
  updateHistRow(idx);
}

function stepFwd(){
  if(curStep<steps.length-1){curStep++;applyStep(curStep);}
  if(curStep>=steps.length-1){pause();setStatus('done');}
  else setStatus('paused');
}

function play(){
  if(curStep>=steps.length-1)return;
  setStatus('playing');
  document.getElementById('btn-pause').disabled=false;
  document.getElementById('btn-play').disabled=true;
  playing=true;
  function tick(){
    if(!playing)return;
    stepFwd();
    if(curStep<steps.length-1)timer=setTimeout(tick,800/speed);
    else{playing=false;setStatus('done');}
  }
  timer=setTimeout(tick,0);
}

function pause(){
  playing=false;clearTimeout(timer);
  setStatus('paused');
  document.getElementById('btn-pause').disabled=true;
  document.getElementById('btn-play').disabled=false;
}

function reset(){
  pause();curStep=-1;steps=[];
  counters={mult:0,add:0,naiveMult:8,saved:0};
  updateCounters();
  hlLine(-1);
  document.getElementById('stepbox').innerHTML='Press <strong>Build Steps</strong> to begin.';
  document.getElementById('stepcounter').textContent='Step 0 / 0';
  document.getElementById('histbody').innerHTML='';
  setStatus('idle');
  document.getElementById('btn-step').disabled=true;
  document.getElementById('btn-play').disabled=true;
  document.getElementById('btn-pause').disabled=true;
  clearViz();
}

function updateSpeed(){
  const v=parseFloat(document.getElementById('speedslider').value);
  const map=[0.25,0.5,1,2,3,4,6,8];
  speed = map[v-1] || 1;
  document.getElementById('speedlabel').textContent=speed+'x';
}

function setStatus(s){
  const b=document.getElementById('statusbadge');
  b.className='status-badge s-'+s;
  b.textContent={idle:'Idle',ready:'Ready',playing:'Playing',paused:'Paused',done:'Done'}[s]||s;
}

function updateCounters(){
  document.getElementById('c-mult').textContent=counters.mult;
  document.getElementById('c-add').textContent=counters.add;
  document.getElementById('c-naive-mult').textContent=counters.naiveMult;
  document.getElementById('c-saved').textContent=Math.max(0,counters.saved);
}

// ============================================================
// VISUALIZATION
// ============================================================
const PCOLORS=['#ff6b6b','#ffd166','#06d6a0','#118ab2','#e040fb','#ff9800','#00bcd4'];
const PNAMES=['P1','P2','P3','P4','P5','P6','P7'];

function buildLegend(){
  const div=document.getElementById('legend');
  div.innerHTML='<span style="font-size:11px;color:var(--muted);margin-right:4px">Legend:</span>'+
    PNAMES.map((p,i)=>`<div class="legend-item"><div class="legend-dot" style="background:${PCOLORS[i]}"></div><span>${p}</span></div>`).join('')+
    `<div class="legend-item"><div class="legend-dot" style="background:#30363d;border:1px solid #8b949e"></div><span>Pending</span></div>`;
}

function clearViz(){
  const svg=document.getElementById('vizsvg');
  svg.innerHTML='';
}

function renderViz(st){
  const svg=document.getElementById('vizsvg');
  // Use a fixed wide viewBox so nothing ever clips
  const VW=680, VH=400;
  svg.setAttribute('viewBox',`0 0 ${VW} ${VH}`);
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.innerHTML='';

  const cs=56, gap=8;

  // ---- Row 1: Matrix A and B side by side ----
  const matRowY=50;
  drawLabel(svg,40,28,'Matrix A');
  drawMatrix(svg,A,40,matRowY,cs,gap,'#30363d',st.highlight.includes('A')?'#58a6ff':null,'a');

  drawLabel(svg,200,28,'Matrix B');
  drawMatrix(svg,B,200,matRowY,cs,gap,'#30363d',st.highlight.includes('B')?'#58a6ff':null,'b');

  // ---- Row 2: Products P1-P7 (evenly spaced across full width) ----
  const pv=st.pval||{};
  const pRowY=190;
  const pW=72, pGap=Math.floor((VW-40-pW)/(7)); // auto-space across width
  drawLabel(svg,40,pRowY-16,'Products:');
  PNAMES.forEach((p,i)=>{
    const x=40+i*pGap;
    const known=pv[p]!==undefined;
    const col=known?PCOLORS[i]:'#21262d';
    const textCol=known?'#000':'#8b949e';
    drawRoundRect(svg,x,pRowY,pW,38,col,st.highlight.includes(p)?4:1);
    svgText(svg,x+pW/2,pRowY+12,p,{fill:textCol,fontWeight:700,fontSize:13});
    svgText(svg,x+pW/2,pRowY+27,known?String(pv[p]):'?',{fill:textCol,fontSize:11});
  });

  // ---- Row 3: Result C matrix ----
  const res=st.result||{};
  const ry=280;
  drawLabel(svg,40,ry-16,'C (Result):');
  const cKeys=[['C11','C12'],['C21','C22']];
  const cCols=[['#ff6b6b','#06d6a0'],['#ffd166','#118ab2']];
  for(let r=0;r<2;r++) for(let c=0;c<2;c++){
    const x=40+c*(cs+gap), y=ry+r*(cs+gap);
    const known=res[cKeys[r][c]]!==undefined;
    const hl=st.highlight.includes(cKeys[r][c]);
    drawRoundRect(svg,x,y,cs,cs,known?cCols[r][c]:'#21262d',hl?4:1);
    if(known)svgText(svg,x+cs/2,y+cs/2,String(res[cKeys[r][c]]),{fill:'#000',fontWeight:700,fontSize:14});
    else svgText(svg,x+cs/2,y+cs/2,'?',{fill:'#8b949e',fontSize:14});
    svgText(svg,x+cs/2,y+cs-8,cKeys[r][c],{fill:known?'#0006':'#30363d',fontSize:9});
  }

  // ---- Naive comparison (to the right of result) ----
  const nr=A[0][0]*B[0][0]+A[0][1]*B[1][0];
  const nx=220;
  drawLabel(svg,nx,ry-16,'Naive C11 = '+nr);
  drawRoundRect(svg,nx,ry,cs,cs,'#1a1a2e',1);
  svgText(svg,nx+cs/2,ry+cs/2,String(nr),{fill:'#8b949e',fontSize:13});
}

function drawMatrix(svg,mat,x0,y0,cs,gap,border,hl,prefix){
  for(let r=0;r<mat.length;r++) for(let c=0;c<mat[r].length;c++){
    const x=x0+c*(cs+gap), y=y0+r*(cs+gap);
    drawRoundRect(svg,x,y,cs,cs,hl||'#21262d',hl?3:1);
    svgText(svg,x+cs/2,y+cs/2,String(mat[r][c]),{fill:hl?'#000':'#e6edf3',fontWeight:600,fontSize:15});
    svgText(svg,x+cs/2,y+cs-9,`${prefix}${r+1}${c+1}`,{fill:hl?'#0008':'#8b949e',fontSize:9});
  }
}

function drawLabel(svg,x,y,txt){
  const t=document.createElementNS('http://www.w3.org/2000/svg','text');
  t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('fill','#8b949e');
  t.setAttribute('font-size','11');t.setAttribute('dominant-baseline','auto');
  t.setAttribute('text-anchor','start');t.textContent=txt;svg.appendChild(t);
}

function drawRoundRect(svg,x,y,w,h,fill,sw=1){
  const r=document.createElementNS('http://www.w3.org/2000/svg','rect');
  r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',w);r.setAttribute('height',h);
  r.setAttribute('rx',6);r.setAttribute('fill',fill);
  r.setAttribute('stroke',sw>1?'#fff':'#30363d');r.setAttribute('stroke-width',sw);
  svg.appendChild(r);return r;
}

function svgText(svg,x,y,txt,opts={}){
  const t=document.createElementNS('http://www.w3.org/2000/svg','text');
  t.setAttribute('x',x);t.setAttribute('y',y);
  t.setAttribute('fill',opts.fill||'#e6edf3');
  t.setAttribute('font-size',opts.fontSize||12);
  t.setAttribute('font-weight',opts.fontWeight||'normal');
  t.setAttribute('dominant-baseline','middle');
  t.setAttribute('text-anchor',opts.textAnchor||'middle');
  if(opts.fontFamily)t.setAttribute('font-family',opts.fontFamily);
  t.textContent=txt;svg.appendChild(t);return t;
}

// ============================================================
// HISTORY TABLE
// ============================================================
function renderHistTable(){
  const tb=document.getElementById('histbody');
  const ss = steps;
  tb.innerHTML=ss.map((s,i)=>`<tr onclick="jumpTo(${i})"><td>${i+1}</td><td>${s.phase}</td><td>${s.desc.substring(0,60)}…</td></tr>`).join('');
}
function updateHistRow(idx){
  document.querySelectorAll('#histbody tr').forEach((r,i)=>r.classList.toggle('cur',i===idx));
  const row=document.querySelector(`#histbody tr:nth-child(${idx+1})`);
  if(row)row.scrollIntoView({block:'nearest'});
}
function jumpTo(idx){
  pause();
  counters={mult:0,add:0,naiveMult:8,saved:0};
  for(let i=0;i<=idx;i++){
    const st=steps[i];
    counters.mult+=st.mult||0;counters.add+=st.add||0;
    counters.saved=counters.naiveMult-counters.mult;
  }
  curStep=idx;applyStep(idx);
  updateCounters();
  setStatus('paused');
}

// ============================================================
// PRESETS
// ============================================================
function loadPreset(i){
  const p=PRESETS[i];
  document.getElementById('matA').value=p.a.map(r=>r.join(' ')).join('\n');
  document.getElementById('matB').value=p.b.map(r=>r.join(' ')).join('\n');
  reset();
}

// ============================================================
// CLO-1: CHARTS
// ============================================================
function showChart(tab){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('chart-'+tab).classList.add('active');

  document.querySelectorAll('#charttabs button').forEach(b=>b.classList.remove('active'));

  const btn = Array.from(document.querySelectorAll('#charttabs button'))
    .find(b => b.getAttribute('onclick').includes(tab));

  if(btn) btn.classList.add('active');

  if(tab==='growth')drawGrowthChart();
  if(tab==='crossover')drawCrossover();
  if(tab==='complexity')drawComplexityTable();
}

function updateCharts(){
  const n=parseInt(document.getElementById('nslider').value);
  document.getElementById('nlabel').textContent=n;
  drawGrowthChart();drawCrossover();drawComplexityTable();
}

function drawGrowthChart(){
  const canvas=document.getElementById('canvas-growth');
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const nMax=parseInt(document.getElementById('nslider').value)||64;
  const ns=[],naive=[],str=[];
  for(let n=1;n<=nMax;n++){ns.push(n);naive.push(Math.pow(n,3));str.push(Math.pow(n,2.807));}
  const maxY=Math.max(...naive,1);
  const px=(n)=>40+(n/nMax)*(W-60);
  const py=(v)=>H-30-(v/maxY)*(H-50);
  // Grid
  ctx.strokeStyle='#21262d';ctx.lineWidth=1;
  for(let i=0;i<=5;i++){ctx.beginPath();ctx.moveTo(40,py(maxY*i/5));ctx.lineTo(W-20,py(maxY*i/5));ctx.stroke();}
  // Axes
  ctx.strokeStyle='#8b949e';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(40,H-30);ctx.lineTo(W-20,H-30);ctx.stroke();
  ctx.beginPath();ctx.moveTo(40,10);ctx.lineTo(40,H-30);ctx.stroke();
  // Naive
  ctx.strokeStyle='#f85149';ctx.lineWidth=2.5;ctx.beginPath();
  ns.forEach((n,i)=>i===0?ctx.moveTo(px(n),py(naive[i])):ctx.lineTo(px(n),py(naive[i])));ctx.stroke();
  // Strassen
  ctx.strokeStyle='#3fb950';ctx.lineWidth=2.5;ctx.beginPath();
  ns.forEach((n,i)=>i===0?ctx.moveTo(px(n),py(str[i])):ctx.lineTo(px(n),py(str[i])));ctx.stroke();
  // Labels
  ctx.fillStyle='#f85149';ctx.font='bold 11px sans-serif';ctx.fillText('Naive O(n³)',px(nMax)-90,py(naive[naive.length-1])-8);
  ctx.fillStyle='#3fb950';ctx.fillText("Strassen O(n^2.807)",px(nMax)-120,py(str[str.length-1])+14);
  ctx.fillStyle='#8b949e';ctx.font='11px sans-serif';ctx.fillText('n',W-15,H-28);ctx.fillText('Ops',42,8);
}

function drawCrossover(){
  const canvas=document.getElementById('canvas-crossover');
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const nMax=200;
  const ns=[],naive=[],str=[];
  for(let n=2;n<=nMax;n++){ns.push(n);naive.push(Math.pow(n,3));str.push(Math.pow(n,2.807)*2);}// *2 for constant factor
  const maxY=Math.max(...naive.slice(0,80));
  const px=(n)=>40+((n-2)/(nMax-2))*(W-60);
  const py=(v)=>H-30-Math.min(v/maxY,1)*(H-50);
  ctx.strokeStyle='#21262d';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){ctx.beginPath();ctx.moveTo(40,py(maxY*i/4));ctx.lineTo(W-20,py(maxY*i/4));ctx.stroke();}
  ctx.strokeStyle='#8b949e';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(40,H-30);ctx.lineTo(W-20,H-30);ctx.stroke();
  ctx.beginPath();ctx.moveTo(40,10);ctx.lineTo(40,H-30);ctx.stroke();
  ctx.strokeStyle='#f85149';ctx.lineWidth=2;ctx.beginPath();
  ns.forEach((n,i)=>i===0?ctx.moveTo(px(n),py(naive[i])):ctx.lineTo(px(n),py(naive[i])));ctx.stroke();
  ctx.strokeStyle='#3fb950';ctx.lineWidth=2;ctx.beginPath();
  ns.forEach((n,i)=>i===0?ctx.moveTo(px(n),py(str[i])):ctx.lineTo(px(n),py(str[i])));ctx.stroke();
  // Crossover marker
  ctx.strokeStyle='#d29922';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);
  ctx.beginPath();ctx.moveTo(px(40),0);ctx.lineTo(px(40),H-30);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#d29922';ctx.font='bold 11px sans-serif';ctx.fillText('Crossover ~n=40',px(40)+4,20);
  ctx.fillStyle='#f85149';ctx.font='bold 11px sans-serif';ctx.fillText('Naive O(n³)',px(nMax)-80,py(naive[nMax-4])-6);
  ctx.fillStyle='#3fb950';ctx.fillText('Strassen (w/ constants)',px(80),py(str[78])-8);
  ctx.fillStyle='#8b949e';ctx.font='11px sans-serif';ctx.fillText('n',W-15,H-28);
}

function drawComplexityTable(){
  const tb=document.getElementById('cxbody');
  const rows=[2,4,8,16,32,64,128,256,512,1024];
  tb.innerHTML=rows.map(n=>{
    const naive=Math.round(Math.pow(n,3));
    const str=Math.round(Math.pow(n,2.807));
    const ratio=(naive/str).toFixed(2);
    const saved=naive-str;
    return `<tr style="border-bottom:1px solid #30363d">
      <td style="padding:5px 12px;font-weight:600">${n}</td>
      <td style="padding:5px 12px;color:#f85149">${naive.toLocaleString()}</td>
      <td style="padding:5px 12px;color:#3fb950">${str.toLocaleString()}</td>
      <td style="padding:5px 12px;color:#d29922">${ratio}×</td>
      <td style="padding:5px 12px;color:#8b949e">${saved.toLocaleString()}</td>
    </tr>`;
  }).join('');
}

// ============================================================
// CLO-2: ACCESS PATTERNS
// ============================================================
let accessStep=0, accessMax=8;
const NAIVE_ACCESS=[
  {desc:'C11: a11×b11',A:[[1,0],[0,0]],B:[[1,0],[0,0]],C:'C11'},
  {desc:'C11: +a12×b21',A:[[0,1],[0,0]],B:[[0,0],[1,0]],C:'C11'},
  {desc:'C12: a11×b12',A:[[1,0],[0,0]],B:[[0,1],[0,0]],C:'C12'},
  {desc:'C12: +a12×b22',A:[[0,1],[0,0]],B:[[0,0],[0,1]],C:'C12'},
  {desc:'C21: a21×b11',A:[[0,0],[1,0]],B:[[1,0],[0,0]],C:'C21'},
  {desc:'C21: +a22×b21',A:[[0,0],[0,1]],B:[[0,0],[1,0]],C:'C21'},
  {desc:'C22: a21×b12',A:[[0,0],[1,0]],B:[[0,1],[0,0]],C:'C22'},
  {desc:'C22: +a22×b22',A:[[0,0],[0,1]],B:[[0,0],[0,1]],C:'C22'},
];
const STRASSEN_ACCESS=[
  {desc:'P1=(a11+a22)(b11+b22)',A:[[1,0],[0,1]],B:[[1,0],[0,1]],P:'P1'},
  {desc:'P2=(a21+a22)b11',A:[[0,0],[1,1]],B:[[1,0],[0,0]],P:'P2'},
  {desc:'P3=a11(b12−b22)',A:[[1,0],[0,0]],B:[[0,1],[0,-1]],P:'P3'},
  {desc:'P4=a22(b21−b11)',A:[[0,0],[0,1]],B:[[-1,0],[1,0]],P:'P4'},
  {desc:'P5=(a11+a12)b22',A:[[1,1],[0,0]],B:[[0,0],[0,1]],P:'P5'},
  {desc:'P6=(a21−a11)(b11+b12)',A:[[-1,0],[1,0]],B:[[1,1],[0,0]],P:'P6'},
  {desc:'P7=(a12−a22)(b21+b22)',A:[[0,1],[0,-1]],B:[[0,0],[1,1]],P:'P7'},
];

function drawAccessMatrix(svgId,mat,x0,y0,label){
  const svg=document.getElementById(svgId);
  const cs=44,gap=6;
  const highlight=[[0,0],[0,1],[1,0],[1,1]].filter(([r,c])=>mat[r][c]!==0);
  const labels=[['a11','a12'],['a21','a22']];
  for(let r=0;r<2;r++) for(let c=0;c<2;c++){
    const x=x0+c*(cs+gap),y=y0+r*(cs+gap);
    const hl=mat[r][c]!==0;
    drawRoundRect(svg,x,y,cs,cs,hl?'#0e2a4a':'#161b22',hl?2:1);
    svgText(svg,x+cs/2,y+cs/2,labels[r][c],{fill:hl?'#58a6ff':'#30363d',fontWeight:hl?700:'normal',fontSize:12});
  }
  svgText(svg,x0+cs,y0-12,label,{fill:'#8b949e',fontSize:11});
}

function renderAccessStep(step){
  const naiveSvg=document.getElementById('naive-svg');
  const strSvg=document.getElementById('strassen-svg');
  naiveSvg.innerHTML=''; strSvg.innerHTML='';
  const W=250;
  naiveSvg.setAttribute('viewBox',`0 0 ${W} 260`);
  strSvg.setAttribute('viewBox',`0 0 ${W} 260`);
  // draw all naive steps
  NAIVE_ACCESS.forEach((acc,i)=>{
    const y=10+i*28;
    const active=i===step&&step<8;
    const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('x',5);rect.setAttribute('y',y-8);rect.setAttribute('width',W-10);rect.setAttribute('height',22);
    rect.setAttribute('rx',4);rect.setAttribute('fill',active?'#0e2a4a':'#161b22');
    naiveSvg.appendChild(rect);
    svgText(naiveSvg,W/2,y+2,acc.desc,{fill:active?'#58a6ff':'#8b949e',fontSize:10,textAnchor:'middle'});
  });
  // draw all strassen steps
  STRASSEN_ACCESS.forEach((acc,i)=>{
    const y=10+i*34;
    const active=i===step&&step>=8;
    const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('x',5);rect.setAttribute('y',y-10);rect.setAttribute('width',W-10);rect.setAttribute('height',26);
    rect.setAttribute('rx',4);rect.setAttribute('fill',active?'#0d2f1a':'#161b22');
    strSvg.appendChild(rect);
    svgText(strSvg,W/2,y+2,acc.desc,{fill:active?'#3fb950':'#8b949e',fontSize:10,textAnchor:'middle'});
    if(active){
      svgText(strSvg,W/2,y+16,`← Product ${acc.P}`,{fill:'#3fb950',fontSize:9});
    }
  });
  // Explain
  let explain='';
  if(step<8){const a=NAIVE_ACCESS[step];explain=`Naive step ${step+1}/8: ${a.desc} — accessing specific cells.`;}
  else{const a=STRASSEN_ACCESS[step-8];explain=`Strassen step ${step-7}/7: ${a.desc} — computes ${a.P} using sums/diffs.`;}
  document.getElementById('access-explain').textContent=explain;
  document.getElementById('acc-prev').disabled=step<=0;
  document.getElementById('acc-next').disabled=step>=14;
}

let accessTimer=null;
function startAccess(){
  accessStep=0;renderAccessStep(0);
  clearInterval(accessTimer);
  accessTimer=setInterval(()=>{
    accessStep++;
    if(accessStep>14){clearInterval(accessTimer);return;}
    renderAccessStep(accessStep);
  },900);
  document.getElementById('acc-prev').disabled=false;
  document.getElementById('acc-next').disabled=false;
}
function animateAccess(dir){
  accessStep=Math.max(0,Math.min(14,accessStep+dir));
  renderAccessStep(accessStep);
}

// Impact canvas
function drawImpact(){
  const canvas=document.getElementById('canvas-impact');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const depths=[0,1,2,3,4,5,6,7,8];
  const naive=depths.map(d=>Math.pow(8,d));
  const str=depths.map(d=>Math.pow(7,d));
  const maxY=naive[8];
  const px=d=>50+d*(W-70)/8;
  const py=v=>H-30-Math.min(v/maxY,1)*(H-50);
  ctx.strokeStyle='#21262d';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){ctx.beginPath();ctx.moveTo(50,py(maxY*i/4));ctx.lineTo(W-10,py(maxY*i/4));ctx.stroke();}
  ctx.strokeStyle='#8b949e';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(50,H-30);ctx.lineTo(W-10,H-30);ctx.stroke();
  ctx.beginPath();ctx.moveTo(50,10);ctx.lineTo(50,H-30);ctx.stroke();
  ctx.strokeStyle='#f85149';ctx.lineWidth=2;ctx.beginPath();
  depths.forEach((d,i)=>i===0?ctx.moveTo(px(d),py(naive[i])):ctx.lineTo(px(d),py(naive[i])));ctx.stroke();
  ctx.strokeStyle='#3fb950';ctx.lineWidth=2;ctx.beginPath();
  depths.forEach((d,i)=>i===0?ctx.moveTo(px(d),py(str[i])):ctx.lineTo(px(d),py(str[i])));ctx.stroke();
  ctx.fillStyle='#f85149';ctx.font='bold 11px sans-serif';ctx.fillText('Naive 8ᵈ',W-70,30);
  ctx.fillStyle='#3fb950';ctx.fillText('Strassen 7ᵈ',W-80,50);
  ctx.fillStyle='#8b949e';ctx.font='11px sans-serif';
  depths.forEach(d=>{ctx.fillText(d,px(d)-3,H-12);});
  ctx.fillText('Recursion Depth',W/2-40,H-2);
}

// ============================================================
// CLO-3: RECURSION TREE
// ============================================================
function drawRecTree(){
  const depth=parseInt(document.getElementById('depthslider').value);
  document.getElementById('depthlabel').textContent=depth;
  const wrap=document.getElementById('recursion-svg-wrap');
  const svg=document.getElementById('rec-svg');

  // Compute needed dimensions based on depth
  const nodeW=56, nodeH=28, levelH=70;
  const nodesAtBottom=Math.pow(7,depth);
  const VW=Math.max(700, nodesAtBottom*(nodeW+10));
  const VH=60+depth*levelH+40;

  svg.setAttribute('viewBox',`0 0 ${VW} ${VH}`);
  svg.setAttribute('width',VW);
  svg.setAttribute('height',VH);
  svg.innerHTML='';

  function drawNode(x,y,label,color,d){
    // Clamp node to viewBox bounds
    const nx=Math.max(nodeW/2+2, Math.min(VW-nodeW/2-2, x));
    drawRoundRect(svg,nx-nodeW/2,y-nodeH/2,nodeW,nodeH,color,2);
    svgText(svg,nx,y,label,{fill:'#000',fontWeight:700,fontSize:11});
    if(d<depth){
      const childY=y+levelH;
      // Total spread at this level fills available width proportionally
      const levelNodes=Math.pow(7,d+1);
      const cellW=VW/levelNodes;
      for(let i=0;i<7;i++){
        const parentBlock=VW/Math.pow(7,d);
        const parentStart=nx-parentBlock/2;
        const cx=parentStart+(i+0.5)*parentBlock/7;
        const line=document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1',nx);line.setAttribute('y1',y+nodeH/2);
        line.setAttribute('x2',cx);line.setAttribute('y2',childY-nodeH/2);
        line.setAttribute('stroke','#30363d');line.setAttribute('stroke-width',1);
        svg.appendChild(line);
        drawNode(cx,childY,`7^${d+1}`,PCOLORS[i%7],d+1);
      }
    }
  }

  svgText(svg,VW/2,16,'Each node spawns 7 sub-calls (vs 8 naive)',{fill:'#8b949e',fontSize:11});
  drawNode(VW/2,50,'n×n','#58a6ff',0);

  const naiveNodes=Math.pow(8,depth);const strNodes=Math.pow(7,depth);
  svgText(svg,VW/2,VH-10,`Depth ${depth}: Strassen=${strNodes} calls  |  Naive would be=${naiveNodes}  |  Saved=${naiveNodes-strNodes}`,{fill:'#d29922',fontSize:11});
}

// ============================================================
// FORMULA SVG
// ============================================================
function drawFormula(){
  const svg=document.getElementById('formula-svg');
  const VW=660, VH=240;
  svg.setAttribute('viewBox',`0 0 ${VW} ${VH}`);
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.innerHTML='';

  const formulas=[
    {label:'P1',formula:'(A11+A22) · (B11+B22)',color:PCOLORS[0]},
    {label:'P2',formula:'(A21+A22) · B11',color:PCOLORS[1]},
    {label:'P3',formula:'A11 · (B12−B22)',color:PCOLORS[2]},
    {label:'P4',formula:'A22 · (B21−B11)',color:PCOLORS[3]},
    {label:'P5',formula:'(A11+A12) · B22',color:PCOLORS[4]},
    {label:'P6',formula:'(A21−A11) · (B11+B12)',color:PCOLORS[5]},
    {label:'P7',formula:'(A12−A22) · (B21+B22)',color:PCOLORS[6]},
  ];

  const colW=VW/2-10;

  formulas.forEach((f,i)=>{
    const col=i<4?0:1;
    const row=i<4?i:i-4;
    const x=col*(VW/2)+5, y=8+row*50;

    // background
    drawRoundRect(svg,x,y,colW,38,f.color+'22',1);

    // pill
    const pillWidth = 28;
    const pillX = x + 6;

    drawRoundRect(svg,pillX,y+5,pillWidth,28,f.color,0);
    svgText(svg,pillX + pillWidth/2,y+19,f.label,{
      fill:'#000',fontWeight:700,fontSize:12
    });

    // "=" symbol
    const eqX = pillX + pillWidth + 6;
    svgText(svg,eqX,y+19,'=',{
      fill:'#8b949e',fontSize:12,textAnchor:'start'
    });

    
    const fo = document.createElementNS("http://www.w3.org/2000/svg","foreignObject");

    const textX = eqX + 12;
    const textWidth = colW - (textX - x) - 8; // remaining safe width

    fo.setAttribute("x", textX);
    fo.setAttribute("y", y + 6);
    fo.setAttribute("width", textWidth);
    fo.setAttribute("height", 28);

    const div = document.createElement("div");
    div.style.color = "#e6edf3";
    div.style.fontSize = "12px";
    div.style.fontFamily = "Segoe UI, sans-serif";
    div.style.whiteSpace = "nowrap";
    div.style.overflow = "hidden";
    div.style.textOverflow = "ellipsis";

    div.innerText = f.formula;

    fo.appendChild(div);
    svg.appendChild(fo);
  });

  // Result row
  drawRoundRect(svg,5,VH-34,VW-10,28,'#0d2137',1);

  svgText(
    svg,
    VW/2,
    VH-20,
    'C11 = P1 + P4 − P5 + P7    C12 = P3 + P5    C21 = P2 + P4    C22 = P1 − P2 + P3 + P6',
    {fill:'#58a6ff',fontSize:11}
  );
}

// ============================================================
// WORKED EXAMPLE
// ============================================================
function buildWorkedExample(){
  const a=[[1,2],[3,4]], b=[[5,6],[7,8]];
  const [a11,a12]=[1,2],[a21,a22]=[3,4],[b11,b12]=[5,6],[b21,b22]=[7,8];
  const P1=(a11+a22)*(b11+b22);const P2=(a21+a22)*b11;const P3=a11*(b12-b22);
  const P4=a22*(b21-b11);const P5=(a11+a12)*b22;const P6=(a21-a11)*(b11+b12);
  const P7=(a12-a22)*(b21+b22);
  const C11=P1+P4-P5+P7,C12=P3+P5,C21=P2+P4,C22=P1-P2+P3+P6;
  const div=document.getElementById('worked-example');
  div.innerHTML=`<p><strong>A = [[1,2],[3,4]] &nbsp; B = [[5,6],[7,8]]</strong></p>
  <p style="margin-top:8px"><strong>Step 1 – Divide:</strong> Identify scalar elements a11=1, a12=2, a21=3, a22=4, b11=5, b12=6, b21=7, b22=8.</p>
  <p style="margin-top:8px"><strong>Step 2 – 7 Products:</strong></p>
  <ul style="padding-left:20px;line-height:2">
    <li style="color:${PCOLORS[0]}">P1 = (1+4)(5+8) = 5×13 = <strong>65</strong></li>
    <li style="color:${PCOLORS[1]}">P2 = (3+4)×5 = 7×5 = <strong>35</strong></li>
    <li style="color:${PCOLORS[2]}">P3 = 1×(6−8) = 1×(−2) = <strong>−2</strong></li>
    <li style="color:${PCOLORS[3]}">P4 = 4×(7−5) = 4×2 = <strong>8</strong></li>
    <li style="color:${PCOLORS[4]}">P5 = (1+2)×8 = 3×8 = <strong>24</strong></li>
    <li style="color:${PCOLORS[5]}">P6 = (3−1)×(5+6) = 2×11 = <strong>22</strong></li>
    <li style="color:${PCOLORS[6]}">P7 = (2−4)×(7+8) = (−2)×15 = <strong>−30</strong></li>
  </ul>
  <p style="margin-top:8px"><strong>Step 3 – Combine:</strong></p>
  <ul style="padding-left:20px;line-height:2">
    <li>C11 = 65+8−24+(−30) = <strong>19</strong></li>
    <li>C12 = −2+24 = <strong>22</strong></li>
    <li>C21 = 35+8 = <strong>43</strong></li>
    <li>C22 = 65−35+(−2)+22 = <strong>50</strong></li>
  </ul>
  <p style="margin-top:8px"><strong>Result: C = [[19,22],[43,50]]</strong></p>
  <div class="concept-box" style="margin-top:8px">Verify: Naive C11 = 1×5+2×7 = 5+14 = 19 ✓ &nbsp; C12 = 1×6+2×8 = 6+16 = 22 ✓</div>`;
}

// ============================================================
// SECTION TABS
// ============================================================
function showSection(id){
  document.querySelectorAll('.section-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('sec-'+id).classList.add('active');
  document.querySelectorAll('#section-tabs button').forEach((b,i)=>{
    b.classList.toggle('active',b.getAttribute('onclick').includes("'"+id+"'"));
  });
  if(id==='clo1'){setTimeout(()=>{drawGrowthChart();drawCrossover();drawComplexityTable();},50);}
  if(id==='clo2'){setTimeout(()=>{renderAccessStep(0);drawImpact();},50);}
  if(id==='clo3'){setTimeout(()=>{drawRecTree();drawFormula();},50);}
  if(id==='edu'){buildWorkedExample();}
}

// ============================================================
// INIT
// ============================================================
window.onload=function(){
  buildPseudo();
  buildLegend();
  drawGrowthChart();
  updateSpeed();
  // Pre-render tabs on idle
  setTimeout(()=>{drawImpact();drawComplexityTable();drawCrossover();},400);
  setTimeout(()=>{drawRecTree();drawFormula();},600);
  setTimeout(()=>{buildWorkedExample();},800);
};
