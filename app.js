
/* ── Electron 데스크탑 통합 ── */
const IS_DESKTOP = typeof window.electronAPI !== 'undefined';
if (IS_DESKTOP) {
  console.log('🦀 Clawd Desktop Mode - Electron');
}

// GitHub 링크를 Electron shell로 열기
function openGitHub() {
  const url = 'https://github.com/anthropics/anthropic-quickstarts';
  if (IS_DESKTOP) {
    window.electronAPI.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}

/* ── 참조 ── */
const clawd      = document.getElementById('clawd');
const eyeL       = document.getElementById('eye-l');
const eyeR       = document.getElementById('eye-r');
const moodFill   = document.getElementById('mood-fill');
const moodEmoji  = document.getElementById('mood-emoji');
const moodLabel  = document.getElementById('mood-label');
const scoreEl    = document.getElementById('score-num');
const weatherBtn = document.getElementById('weather-btn');
const timeLabel  = document.getElementById('time-label');
const wOverlay   = document.getElementById('weather-overlay');
const canvas     = document.getElementById('trail-canvas');
const ctx        = canvas.getContext('2d');
const comboDis   = document.getElementById('combo-display');
const secretMsg  = document.getElementById('secret-msg');
const focusStop  = document.getElementById('focus-stop');
const gf         = document.getElementById('girlfriend');
const gfBubble   = document.getElementById('gf-bubble');
const loveLine   = document.getElementById('love-line');
const house      = document.getElementById('house');
const homeModal  = document.getElementById('home-modal');
const homeClose  = document.getElementById('home-close');
const btnAction  = document.getElementById('btn-action');
const btnLeave   = document.getElementById('btn-leave');
const clawdInRoom= document.getElementById('clawd-in-room');
const cookWrap   = document.getElementById('cook-progress-wrap');
const cookBar    = document.getElementById('cook-bar');
const cookLbl    = document.getElementById('cook-label');
const foodShelf  = document.getElementById('food-shelf');
const lpCircle   = document.querySelector('#longpress-ring circle');

const BOTTOM_SAFE = 80; // tiiny.host 하단 바 높이
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; });

/* ── 상태 ── */
let mood=60, score=0, combo=0, comboTimer=null;
let isFocusMode=false, isWalking=false, isSleepy=false;
let walkTimeout=null, lastTap=0, tapCount=0, tapResetTimer=null;
let clawdX=window.innerWidth/2, clawdY=window.innerHeight/2;
let mouseX=window.innerWidth/2, mouseY=window.innerHeight/2;
let trailPoints=[], trailHue=220;
let weatherMode=0;
let clickCount=0, secretTimer=null;
let zzzInterval=null, legFrame=0;
let hasGF=false, gfX=0, gfY=0, gfWalkTimer=null, gfBubbleTimer=null;
let pressTimer=null, pressStart=0, pressRaf=null;
let isSleeping=false, sleepTimer=null, isCooking=false, cookRaf=null;
let focusAutoTimer=null;

const CIRCUM = 314;
const LONG_MS = 800;

const weatherModes = ['☀️','🌤️','🌧️','❄️','🌙'];
const timeModes    = ['낮','낮','비','눈','밤'];
const bodyModes    = ['day','day','day','day','night'];
const foodItems    = ['🦞','🦀','🐟','🍤','🥚'];
const gfMsgs = ['안녕~ 💕','오빠 보고 싶었어 🥺','같이 코딩해요!','커피 사줘요 ☕','집게발 잡아줘 🦀💕','좋아해 💖','나만 봐요 👀','오빠 코드 멋있어~'];
const bubbleMsgs = ['안녕! 👋','버그 수정 중...','코딩 최고!','커피 주세요 ☕','배고프다 🦀','파이팅! 💪','npm install love','에러다 😱','해결했다! 🎉','밥 줘요 🦞'];
const cookMenus = [
  {emoji:'🍚',name:'밥',time:4000},{emoji:'🍜',name:'라면',time:3000},
  {emoji:'🍳',name:'계란후라이',time:2500},{emoji:'🥘',name:'찌개',time:5000},
  {emoji:'🍱',name:'도시락',time:6000},{emoji:'🦞',name:'랍스터',time:7000},
  {emoji:'🍕',name:'피자',time:5500},{emoji:'🍰',name:'케이크',time:6500},
  {emoji:'🥗',name:'샐러드',time:2000},{emoji:'🍖',name:'갈비',time:4500},
];

/* ── 기분 ── */
function updateMood() {
  moodFill.style.width = mood+'%';
  moodFill.style.background = mood>70?'#68d391':mood>40?'#f6ad55':'#fc8181';
  if (mood<25){ moodEmoji.textContent='😢'; moodLabel.textContent='허기짐'; if(!isSleepy) setSleepy(true); }
  else if(mood<50){ moodEmoji.textContent='😐'; moodLabel.textContent='보통'; setSleepy(false); }
  else if(mood<75){ moodEmoji.textContent='😊'; moodLabel.textContent='기분 좋음'; setSleepy(false); }
  else{ moodEmoji.textContent='🥰'; moodLabel.textContent='매우 행복!'; setSleepy(false); }
}

function setSleepy(val) {
  isSleepy = val;
  if (val){ clawd.classList.add('sleepy'); if(!zzzInterval) zzzInterval=setInterval(spawnZzz,2000); }
  else{ clawd.classList.remove('sleepy'); clearInterval(zzzInterval); zzzInterval=null; }
}

function spawnZzz() {
  const z=document.createElement('div'); z.className='zzz'; z.textContent='z';
  const r=clawd.getBoundingClientRect();
  z.style.left=(r.left+r.width/2+8)+'px'; z.style.top=r.top+'px';
  document.body.appendChild(z); setTimeout(()=>z.remove(),2000);
}

/* ── 파티클 ── */
function spawnParticles(x,y,type) {
  const cfg={
    heart:{e:['❤️','💖','💕'],n:4,s:70},
    star:{e:['⭐','✨','🌟','💫'],n:5,s:80},
    food:{e:['🦞','✨','⭐'],n:6,s:90},
    sparkle:{e:['✨','💥','⚡'],n:6,s:60}
  }[type]||{e:['✨'],n:4,s:60};
  for(let i=0;i<cfg.n;i++){
    const el=document.createElement('div'); el.className='particle';
    el.textContent=cfg.e[Math.floor(Math.random()*cfg.e.length)];
    el.style.cssText=`font-size:${type==='heart'?24:18}px;left:${x}px;top:${y}px;position:fixed;pointer-events:none;z-index:15`;
    const ang=(Math.PI*2/cfg.n)*i+Math.random()*.5, d=cfg.s+Math.random()*40;
    el.style.setProperty('--dx',Math.cos(ang)*d+'px');
    el.style.setProperty('--dy',Math.sin(ang)*d-30+'px');
    el.style.animationDelay=(Math.random()*.1)+'s';
    document.body.appendChild(el); setTimeout(()=>el.remove(),1000);
  }
}

/* ── 콤보 ── */
function addCombo() {
  combo++; clearTimeout(comboTimer);
  comboDis.textContent='콤보 x'+combo+' 🔥';
  comboDis.style.transform='translateX(-50%) scale(1)';
  comboTimer=setTimeout(()=>{ comboDis.style.transform='translateX(-50%) scale(0)'; combo=0; },1500);
  if(combo>=10) showSecret('🔥 콤보 10! Clawd가 춤춰요!');
}

function showSecret(msg) {
  secretMsg.textContent=msg; secretMsg.style.transform='translateX(-50%) scale(1)';
  setTimeout(()=>secretMsg.style.transform='translateX(-50%) scale(0)',2500);
}

/* ── 먹이 ── */
function spawnFood() {
  if(document.querySelectorAll('.food-item').length>=3) return;
  const el=document.createElement('div'); el.className='food-item';
  el.textContent=foodItems[Math.floor(Math.random()*foodItems.length)];
  el.style.left=Math.random()*(window.innerWidth-120)+40+'px';
  el.style.top=Math.random()*(window.innerHeight-140-BOTTOM_SAFE)+40+'px';
  el.addEventListener('click',e=>{
    e.stopPropagation();
    const fx=parseFloat(el.style.left), fy=parseFloat(el.style.top);
    spawnParticles(fx,fy,'food'); el.remove();
    score+=10; scoreEl.textContent=score;
    mood=Math.min(100,mood+20); updateMood(); addCombo();
    showBubble('냠냠! 맛있다 😋'); moveTo(fx,fy);
    if(score>=50&&score%50===0) showSecret('🦞 미식가! 점수:'+score);
    // 밥시간이면 바로 다시 하나 소환
    const _h=new Date().getHours();
    if(mealWindows.some(m=>_h>=m.start&&_h<m.end)) spawnFood();
  });
  document.body.appendChild(el);
}

/* ── 이동 ── */
function moveTo(x,y) {
  let sx=clawdX,sy=clawdY,prog=0;
  const ti=setInterval(()=>{ prog+=.1; if(prog>=1){clearInterval(ti);return;} addTrail(sx+(x-sx)*prog,sy+(y-sy)*prog); },30);
  clawdX=x; clawdY=y;
  clawd.style.left=x+'px'; clawd.style.top=y+'px';
  isWalking=true; animLegs();
  clearTimeout(walkTimeout);
  walkTimeout=setTimeout(()=>{ isWalking=false; clawd.querySelectorAll('.leg').forEach(l=>l.style.height='12px'); },500);
}

function animLegs() {
  if(!isWalking) return; legFrame++;
  clawd.querySelectorAll('.leg').forEach((leg,i)=>{ const ph=(legFrame*.3+i*1.5)%(Math.PI*2); leg.style.height=(10+Math.sin(ph)*4)+'px'; });
  requestAnimationFrame(animLegs);
}

/* ── 눈 추적 ── */
function trackEyes() {
  if(!isFocusMode&&!isSleepy){
    const r=clawd.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    const dx=mouseX-cx, dy=mouseY-cy, dist=Math.sqrt(dx*dx+dy*dy);
    const mx=dist>0?(dx/dist)*Math.min(dist/80,1)*2:0, my=dist>0?(dy/dist)*Math.min(dist/80,1)*2:0;
    eyeL.style.transform=`translate(${mx}px,${my}px)`; eyeR.style.transform=`translate(${mx}px,${my}px)`;
  }
  requestAnimationFrame(trackEyes);
}
requestAnimationFrame(trackEyes);
document.addEventListener('mousemove',e=>{ mouseX=e.clientX; mouseY=e.clientY; });

/* ── 말풍선 ── */
function showBubble(msg) {
  const b=document.getElementById('speech-bubble');
  if(!isFocusMode){
    b.textContent=msg||bubbleMsgs[Math.floor(Math.random()*bubbleMsgs.length)];
    b.style.transform='translateX(-50%) scale(1)';
    clearTimeout(showBubble._t);
    showBubble._t=setTimeout(()=>{ if(!isFocusMode) b.style.transform='translateX(-50%) scale(0)'; },2200);
  }
}

/* ── 트레일 ── */
function addTrail(x,y){ trailPoints.push({x,y,t:Date.now(),hue:trailHue}); trailHue=(trailHue+15)%360; }
function drawTrail() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const now=Date.now(); trailPoints=trailPoints.filter(p=>now-p.t<600);
  trailPoints.forEach(p=>{ const age=(now-p.t)/600; ctx.beginPath(); ctx.arc(p.x,p.y,5*(1-age*.5),0,Math.PI*2); ctx.fillStyle=`rgba(215,127,102,${.3*(1-age)})`; ctx.fill(); });
  requestAnimationFrame(drawTrail);
}
drawTrail();

/* ── 날씨 ── */
function setWeather(mode) {
  wOverlay.innerHTML=''; document.body.className=bodyModes[mode];
  weatherBtn.textContent=weatherModes[mode]; timeLabel.textContent=timeModes[mode];
  if(mode===2){ for(let i=0;i<40;i++){ const d=document.createElement('div'); d.className='rain-drop'; d.style.cssText=`left:${Math.random()*100}%;height:${10+Math.random()*15}px;animation-duration:${.5+Math.random()*.5}s;animation-delay:${Math.random()}s`; wOverlay.appendChild(d); } }
  else if(mode===3){ for(let i=0;i<30;i++){ const s=document.createElement('div'); s.className='snow-flake'; s.textContent='❄'; s.style.cssText=`left:${Math.random()*100}%;font-size:${12+Math.random()*8}px;animation-duration:${2+Math.random()*3}s;animation-delay:${Math.random()*3}s`; wOverlay.appendChild(s); } }
  else if(mode===1){ for(let i=0;i<4;i++){ const c=document.createElement('div'); c.className='cloud-el'; c.style.cssText=`top:${10+i*8}%;width:${80+Math.random()*60}px;height:30px;animation-duration:${20+Math.random()*15}s;animation-delay:-${Math.random()*10}s`; wOverlay.appendChild(c); } }
  else if(mode===4){ for(let i=0;i<50;i++){ const st=document.createElement('div'); st.className='star-bg'; st.textContent='★'; st.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*2}s;animation-duration:${1+Math.random()*2}s`; wOverlay.appendChild(st); } }
}
weatherBtn.addEventListener('click',e=>{ e.stopPropagation(); weatherMode=(weatherMode+1)%weatherModes.length; setWeather(weatherMode); });

/* ── 코드 비 ── *//* ════════════════════════════════════════
   AI 챗 (AI Horde)
════════════════════════════════════════ */
const aiPanel    = document.getElementById('ai-chat-panel');
const aiMessages = document.getElementById('ai-chat-messages');
const aiInput    = document.getElementById('ai-chat-input');
const aiSend     = document.getElementById('ai-chat-send');
const aiDot      = document.getElementById('ai-status-dot');
const aiStatusTx = document.getElementById('ai-status-text');

const GROQ_KEY  = 'YOUR_GROQ_API_KEY'; // https://console.groq.com 에서 발급
const GROQ_API  = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'groq/compound';

const SYSTEM_PROMPT = `You are Clawd, an expert code agent and debugging assistant who happens to be a cute orange pixel crab 🦀.

You have access to a Python code execution tool. Use it to:
- Run and verify code before showing results
- Debug errors by executing test cases
- Calculate, process data, or demonstrate algorithms
- Always execute code when asked to run or test something

Your job:
- Write clean, efficient code in any language
- Debug and fix errors with clear explanations
- Review code and suggest improvements
- Explain complex concepts simply

Rules:
- Always use proper code blocks with language tags
- When fixing bugs, explain what was wrong and why
- Provide complete, runnable code when possible
- Execute code to verify it works before responding
- Be concise but thorough

Reply in English by default. Reply in Korean if the user writes in Korean.
Add a small crab emoji occasionally 🦀`;
let chatHistory = [];
let isWaitingAI = false;

function _setAiStatus(state) {
  aiDot.className = '';
  const map = {
    online:  { cls:'online',  tx:'연결됨' },
    loading: { cls:'loading', tx:'생각 중...' },
    error:   { cls:'error',   tx:'오류' },
    idle:    { cls:'',        tx:'준비 중...' },
  };
  const s = map[state] || map.idle;
  if(s.cls) aiDot.classList.add(s.cls);
  aiStatusTx.textContent = s.tx;
}

/* ── 마크다운 → HTML 변환 ── */
function _mdToHtml(md) {
  let html = md
    // XSS 방지
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    // 코드블록 ```lang\n...\n``` — 복사 버튼 포함
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_,lang,code) => {
      const escaped = code.trim();
      const label = lang || 'code';
      return `<div class="code-block-wrap"><div class="code-block-header"><span class="code-lang">${label}</span><button class="copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block-wrap').querySelector('code').innerText).then(()=>{this.textContent='✓ 복사됨';setTimeout(()=>this.textContent='복사',1500)})">복사</button></div><pre><code class="lang-${label}">${escaped}</code></pre></div>`;
    })
    // 인라인 코드 `code`
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 굵게 **text** 또는 __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // 기울임 *text* 또는 _text_
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    // 취소선 ~~text~~
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    // ### 헤더
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm,  '<h3>$1</h3>')
    .replace(/^# (.+)$/gm,   '<h2>$1</h2>')
    // 수평선
    .replace(/^---$/gm, '<hr>')
    // 순서없는 목록 - item
    .replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>')
    // 순서있는 목록 1. item
    .replace(/^\s*\d+\. (.+)$/gm, '<li>$1</li>')
    // li 묶기
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    // 표 | col | col |
    .replace(/((^\|.+\|\n?)+)/gm, (tableBlock) => {
      const rows = tableBlock.trim().split('\n').filter(r => r.trim());
      let html = '<table>';
      rows.forEach((row, i) => {
        if(/^\|[\s\-:|]+\|/.test(row)) return;
        const cells = row.split('|').filter((_,j,a) => j>0 && j<a.length-1);
        const tag = i === 0 ? 'th' : 'td';
        html += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
      });
      html += '</table>';
      return html;
    })
    // 줄바꿈
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
  return html;
}

/* ── 툴 호출 표시 ── */
function _addToolCall(tc) {
  const wrap = document.createElement('div');
  wrap.className = 'tool-call-block';
  const name = tc.function?.name || tc.type || 'tool';
  let args = '';
  try { args = JSON.stringify(JSON.parse(tc.function?.arguments || '{}'), null, 2); }
  catch { args = tc.function?.arguments || ''; }
  wrap.innerHTML = `
    <details>
      <summary>⚙️ ${name}</summary>
      <div class="tool-args">${args ? `<pre><code>${args}</code></pre>` : ''}</div>
    </details>`;
  aiMessages.appendChild(wrap);
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

function _addToolResult(tr) {
  const wrap = document.createElement('div');
  wrap.className = 'tool-result-block';
  let content = tr.content || tr.result || '';
  try { content = JSON.stringify(JSON.parse(content), null, 2); } catch {}
  wrap.innerHTML = `
    <details>
      <summary>📋 결과</summary>
      <div class="tool-result-body"><pre><code>${content}</code></pre></div>
    </details>`;
  aiMessages.appendChild(wrap);
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

function _addMsg(role, text) {
  const wrap = document.createElement('div');
  wrap.className = `chat-msg ${role === 'user' ? 'user' : 'bot'}`;

  const name = document.createElement('div');
  name.className = 'chat-name';
  name.textContent = role === 'user' ? '나' : '🦀 Clawd';
  wrap.appendChild(name);

  // thinking 블록 분리
  const thinkMatch = text.match(/^<think>([\s\S]*?)<\/think>\s*/);
  if (thinkMatch && role === 'bot') {
    const thinkContent = thinkMatch[1].trim();
    const mainText = text.slice(thinkMatch[0].length);

    // thinking 토글 블록
    const thinkWrap = document.createElement('details');
    thinkWrap.className = 'think-block';
    const thinkSummary = document.createElement('summary');
    thinkSummary.textContent = '💭 생각하는 중...';
    const thinkBody = document.createElement('div');
    thinkBody.className = 'think-body';
    thinkBody.innerHTML = _mdToHtml(thinkContent);
    thinkWrap.appendChild(thinkSummary);
    thinkWrap.appendChild(thinkBody);
    wrap.appendChild(thinkWrap);

    // 본문
    if (mainText.trim()) {
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      bubble.innerHTML = _mdToHtml(mainText);
      wrap.appendChild(bubble);
    }
  } else {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = _mdToHtml(text);
    wrap.appendChild(bubble);
  }

  aiMessages.appendChild(wrap);
  aiMessages.querySelectorAll('.chat-msg').forEach((el,i) => el.setAttribute('data-line', i+1));
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

function _addTyping() {
  const el = document.createElement('div');
  el.className = 'chat-msg bot';
  el.id = 'typing-indicator';
  el.innerHTML = '<div class="chat-name">🦀 Clawd</div><div class="chat-typing"><span></span><span></span><span></span></div>';
  aiMessages.appendChild(el);
  aiMessages.scrollTop = aiMessages.scrollHeight;
}
function _removeTyping() {
  const el = document.getElementById('typing-indicator');
  if(el) el.remove();
}

async function _sendToHF(userMsg) {
  if(isWaitingAI) return;
  isWaitingAI = true;
  aiSend.disabled = true;
  _setAiStatus('loading');

  chatHistory.push({ role:'user', content: userMsg });
  _addTyping();

  const messages = [
    { role:'system', content: SYSTEM_PROMPT },
    ...chatHistory.slice(-18)
  ];

  try {
    const res = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        max_tokens: 8192,
        temperature: 0.85,
        top_p: 0.92,
        stream: true,
      })
    });

    if(!res.ok) {
      const errBody = await res.text().catch(()=>'');
      console.warn('Groq 오류:', res.status, errBody);
      throw new Error(`HTTP ${res.status}: ${errBody.slice(0,100)}`);
    }

    _removeTyping();

    // 스트리밍 버블 생성
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg bot';
    const name = document.createElement('div');
    name.className = 'chat-name';
    name.textContent = '🦀 Clawd';
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.style.whiteSpace = 'pre-wrap';
    wrap.appendChild(name);
    wrap.appendChild(bubble);
    aiMessages.appendChild(wrap);
    aiMessages.scrollTop = aiMessages.scrollHeight;

    // SSE 스트림 읽기
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let rawContent = '';
    let done = false;

    while(!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if(!value) continue;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for(const line of lines) {
        if(!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if(data === '[DONE]') { done = true; break; }
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content || '';
          if(delta) {
            rawContent += delta;
            // 실시간 렌더링
            bubble.innerHTML = _mdToHtml(rawContent
              .replace(/<think>[\s\S]*?<\/think>/g, '')
              .replace(/<tool>[\s\S]*?<\/tool>/g, '')
              .replace(/<output>[\s\S]*?<\/output>/g, '')
            );
            aiMessages.scrollTop = aiMessages.scrollHeight;
          }
          // executed_tools (스트림 끝에 올 수 있음)
          const execTools = json.choices?.[0]?.delta?.executed_tools || [];
          for(const tool of execTools) {
            _addToolCall({ function: { name: tool.name || 'tool', arguments: JSON.stringify(tool.input || {}) }});
            const out = tool.output ?? tool.result;
            if(out !== undefined) _addToolResult({ content: JSON.stringify(out, null, 2) });
          }
        } catch {}
      }
    }

    // 스트림 완료 후 태그 파싱
    aiMessages.querySelectorAll('.chat-msg').forEach((el,i) => el.setAttribute('data-line', i+1));

    // <think> 블록 분리 렌더링
    const thinkMatch = rawContent.match(/<think>([\s\S]*?)<\/think>/);
    if(thinkMatch) {
      const tw = document.createElement('div');
      tw.className = 'tool-call-block';
      tw.innerHTML = `<details open><summary>💭 Reasoning</summary><div class="think-body">${_mdToHtml(thinkMatch[1].trim())}</div></details>`;
      wrap.insertBefore(tw, bubble);
    }

    // <tool>/<output> 파싱
    const toolExecs = [...rawContent.matchAll(/<tool>([\s\S]*?)<\/tool>/g)];
    const toolOuts  = [...rawContent.matchAll(/<output>([\s\S]*?)<\/output>/g)];
    toolExecs.forEach((m, i) => {
      const tw = document.createElement('div');
      tw.className = 'tool-call-block';
      tw.innerHTML = `<details><summary>⚡ execute</summary><div class="tool-args"><pre><code>${m[1].trim()}</code></pre></div></details>`;
      wrap.insertBefore(tw, bubble);
      if(toolOuts[i]) {
        const tr = document.createElement('div');
        tr.className = 'tool-result-block';
        tr.innerHTML = `<details><summary>📋 결과</summary><div class="tool-result-body"><pre><code>${toolOuts[i][1].trim()}</code></pre></div></details>`;
        wrap.insertBefore(tr, bubble);
      }
    });

    // 최종 본문 렌더링
    const reply = rawContent
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/<tool>[\s\S]*?<\/tool>/g, '')
      .replace(/<output>[\s\S]*?<\/output>/g, '')
      .trim();

    bubble.innerHTML = _mdToHtml(reply);
    bubble.style.whiteSpace = '';

    chatHistory.push({ role:'assistant', content: rawContent });
    if(chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
    _setAiStatus('online');
    if(reply) showBubble(reply.slice(0,30) + (reply.length > 30 ? '...' : ''));


  } catch(err) {
    _removeTyping();
    _addMsg('bot', `오류: ${err.message} 😢`);
    _setAiStatus('error');
    console.warn('HuggingFace 오류:', err);
  }

  isWaitingAI = false;
  aiSend.disabled = false;
  _setAiStatus('online');
}

async function _onSend() {
  const text = aiInput.value.trim();
  if(!text || isWaitingAI) return;
  aiInput.value = '';
  _addMsg('user', text);
  await _sendToHF(text);
}

document.getElementById('ai-new-chat').addEventListener('click', e => {
  e.stopPropagation();
  chatHistory = [];
  aiMessages.innerHTML = '';
  const greetings = [
    'New chat started! What are we building? 🦀',
    'Fresh start! Show me your code 🦀',
    'Ready to debug again! 🦀',
  ];
  _addMsg('bot', greetings[Math.floor(Math.random()*greetings.length)]);
  _setAiStatus('online');
});
aiSend.addEventListener('click', e => { e.stopPropagation(); _onSend(); });
aiInput.addEventListener('keydown', e => { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); _onSend(); }});
aiPanel.addEventListener('click', e => e.stopPropagation());

function stopFocusMode() {
  aiPanel.classList.remove('active');
  clawd.classList.remove('focus');
  isFocusMode = false;
  eyeL.style.transform = '';
  eyeR.style.transform = '';
}

function triggerFocusMode() {
  if(isFocusMode) return;
  isFocusMode = true;
  clawd.classList.add('focus');
  spawnParticles(clawdX, clawdY-40, 'sparkle');
  showBubble('AI 챗 열었어요! 🤖');

  // 첫 열기 시 인사
  if(chatHistory.length === 0) {
    const greetings = [
      'Hey! I\'m Clawd Code 🦀 Paste your code or describe your problem!',
      'Ready to debug! What are we building today? 🦀',
      'Code agent online 🦀 Show me what you\'ve got!',
    ];
    setTimeout(() => {
      _addMsg('bot', greetings[Math.floor(Math.random()*greetings.length)]);
      _setAiStatus('online');
    }, 400);
  }

  aiPanel.classList.add('active');
  setTimeout(() => aiInput.focus(), 300);
}

document.getElementById('focus-stop').addEventListener('click', e => {
  e.stopPropagation(); stopFocusMode();
});

/* ── 놀람 ── */

function triggerSurprise() {
  const msgs=['앗! 깜짝이야! 😱','으악!! 🫨','놀랐잖아요!! 💦','심장 떨어질 뻔! 😨'];
  const eyes=clawd.querySelectorAll('.eye');
  eyes.forEach(eye=>{ eye.style.height='18px'; eye.style.top='8px'; eye.style.background='#fff'; eye.style.outline='2px solid #1A1A1A'; });
  let sc=0; const shake=setInterval(()=>{
    clawd.style.marginLeft=(Math.random()-.5)*16+'px'; clawd.style.marginTop=(Math.random()-.5)*10+'px';
    if(++sc>=10){ clearInterval(shake); clawd.style.marginLeft='0'; clawd.style.marginTop='0'; }
  },50);
  spawnParticles(clawdX,clawdY,'sparkle'); spawnParticles(clawdX,clawdY,'star');
  showBubble(msgs[Math.floor(Math.random()*msgs.length)]);
  setTimeout(()=>{ eyes.forEach(eye=>{ eye.style.height='12px'; eye.style.top='12px'; eye.style.background='#1A1A1A'; eye.style.outline='none'; }); },800);
}

/* ── 여자친구 ── */
function showGfBubble(msg) {
  gfBubble.textContent=msg; gfBubble.style.transform='translateX(-50%) scale(1)';
  clearTimeout(gfBubbleTimer); gfBubbleTimer=setTimeout(()=>gfBubble.style.transform='translateX(-50%) scale(0)',2200);
}

function drawLoveLine() {
  if(!hasGF){ loveLine.setAttribute('opacity','0'); return; }
  const cr=clawd.getBoundingClientRect(), gr=gf.getBoundingClientRect();
  loveLine.setAttribute('x1',cr.left+cr.width/2); loveLine.setAttribute('y1',cr.top+cr.height/2);
  loveLine.setAttribute('x2',gr.left+gr.width/2); loveLine.setAttribute('y2',gr.top+gr.height/2);
  loveLine.setAttribute('opacity','.5');
}

function summonGF() {
  hasGF=true;
  gfX=Math.min(clawdX+100,window.innerWidth-60); gfY=Math.min(clawdY, window.innerHeight-BOTTOM_SAFE-40);
  gf.style.left=gfX+'px'; gf.style.top=gfY+'px';
  gf.classList.add('visible');
  spawnParticles(gfX,gfY,'heart'); spawnParticles(clawdX,clawdY-30,'heart');
  showGfBubble(gfMsgs[Math.floor(Math.random()*gfMsgs.length)]);
  showBubble('여자친구 생겼다!! 💕'); drawLoveLine();
  gfWalkTimer=setInterval(()=>{
    if(!hasGF) return;
    if(Math.random()<.3){ gfX=Math.min(Math.max(clawdX+80,60),window.innerWidth-60); gfY=clawdY+(Math.random()-.5)*30; gf.style.left=gfX+'px'; gf.style.top=gfY+'px'; }
    if(Math.random()<.5) showGfBubble(gfMsgs[Math.floor(Math.random()*gfMsgs.length)]);
    drawLoveLine();
  },4000);
}

function dismissGF() {
  hasGF=false; gf.classList.remove('visible'); loveLine.setAttribute('opacity','0'); clearInterval(gfWalkTimer);
  for(let i=0;i<3;i++) setTimeout(()=>{ const bh=document.createElement('div'); bh.className='break-heart'; bh.textContent='💔'; bh.style.left=clawdX+'px'; bh.style.top=clawdY+'px'; document.body.appendChild(bh); setTimeout(()=>bh.remove(),800); },i*120);
  showBubble('혼자다... 💔');
}
setInterval(()=>{ if(hasGF) drawLoveLine(); },200);

/* ── 롱프레스 ── */
function startLongPress() {
  pressStart=Date.now(); pressTimer=setTimeout(()=>{ resetLpRing(); hasGF?dismissGF():summonGF(); },LONG_MS);
  function animRing(){ const p=Math.min((Date.now()-pressStart)/LONG_MS,1); lpCircle.style.strokeDashoffset=CIRCUM*(1-p); if(p<1&&pressTimer) pressRaf=requestAnimationFrame(animRing); }
  pressRaf=requestAnimationFrame(animRing);
}
function cancelLongPress(){ clearTimeout(pressTimer); pressTimer=null; cancelAnimationFrame(pressRaf); resetLpRing(); }
function resetLpRing(){ lpCircle.style.strokeDashoffset=CIRCUM; }

/* ── 집 ── */
function walkIntoHouse() {
  const r=house.getBoundingClientRect();
  const doorX=r.left+88+22, doorY=r.top+140;
  const dist=Math.hypot(doorX-clawdX, doorY-clawdY);
  const delay=Math.max(300,Math.min(dist/0.4,1200));
  moveTo(doorX, doorY);
  setTimeout(()=>{
    // 문으로 쏙 들어가기
    clawd.style.transition='transform .35s ease-in, opacity .35s ease-in';
    clawd.style.transform='translate(-50%,-50%) scale(0.1)';
    clawd.style.opacity='0';
    if(hasGF){ gf.style.transition='transform .35s ease-in, opacity .35s ease-in'; gf.style.transform='translate(-50%,-50%) scale(0.1)'; gf.style.opacity='0'; }
    setTimeout(()=>{
      clawd.style.transition=''; clawd.style.transform='translate(-50%,-50%)'; clawd.style.opacity='1';
      if(hasGF){ gf.style.transition=''; gf.style.transform='translate(-50%,-50%) scale(1)'; gf.style.opacity='1'; }
      openHome();
    },380);
  },delay);
}

function openHome() {
  homeModal.style.display='flex';
  requestAnimationFrame(()=>homeModal.classList.add('open'));
  showBubble('집에 들어왔다! 🏠');
}

function closeHome() {
  homeModal.classList.remove('open');
  setTimeout(()=>homeModal.style.display='none',400);
  if(isSleeping) stopSleep();
  if(isCooking) cancelCooking();
  // 문에서 나오기
  const r=house.getBoundingClientRect();
  const doorX=r.left+88+22, doorY=r.top+140;
  clawdX=doorX; clawdY=doorY;
  clawd.style.transition='none'; clawd.style.left=doorX+'px'; clawd.style.top=doorY+'px';
  clawd.style.transform='translate(-50%,-50%) scale(0.1)'; clawd.style.opacity='0';
  requestAnimationFrame(()=>{
    clawd.style.transition='transform .4s cubic-bezier(.175,.885,.32,1.275), opacity .35s';
    clawd.style.transform='translate(-50%,-50%) scale(1)'; clawd.style.opacity='1';
  });
  setTimeout(()=>{ clawd.style.transition='left .4s cubic-bezier(.25,1,.5,1),top .4s cubic-bezier(.25,1,.5,1)'; showBubble('다녀왔어요! 🏠'); },420);
}

house.addEventListener('click',e=>{ e.stopPropagation(); walkIntoHouse(); });
homeClose.addEventListener('click', closeHome);
homeModal.addEventListener('click',e=>{ if(e.target===homeModal) closeHome(); });

/* 탭 전환 */
document.querySelectorAll('.room-tab').forEach(tab=>{
  tab.addEventListener('click',e=>{
    e.stopPropagation();
    document.querySelectorAll('.room-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.room-scene').forEach(s=>s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('scene-'+tab.dataset.tab).classList.add('active');
    const a={bedroom:'💤 자러 가기',kitchen:'🍳 요리하기',bathroom:'🚿 씻기',game:'🎮 게임 시작'};
    btnAction.textContent=a[tab.dataset.tab]||'실행';
    if(isSleeping) stopSleep();
    if(isCooking&&tab.dataset.tab!=='kitchen') cancelCooking();
    if(isGameRunning&&tab.dataset.tab!=='game') stopGame();
  });
});

/* 침실 수면 */
function startSleep() {
  if(isSleeping) return; isSleeping=true;
  clawd.classList.add('in-house'); if(hasGF) gf.classList.add('in-house');
  clawdInRoom.textContent='💤 자는 중...'; clawdInRoom.style.opacity='1';
  btnAction.style.opacity='.5'; btnAction.textContent='💤 자는 중...';
  sleepTimer=setInterval(()=>{ mood=Math.min(100,mood+5); updateMood(); },1000);
  spawnParticles(window.innerWidth/2,window.innerHeight/2,'sparkle');
}
function stopSleep() {
  isSleeping=false; clearInterval(sleepTimer);
  clawd.classList.remove('in-house'); if(hasGF) gf.classList.remove('in-house');
  clawdInRoom.style.opacity='0'; btnAction.style.opacity='1';
  btnAction.textContent='💤 자러 가기'; showBubble('잘 잤다! 😊');
}

/* 화장실 */
function startBath() {
  if(isSleeping) return; isSleeping=true;
  clawd.classList.add('in-house'); if(hasGF) gf.classList.add('in-house');
  btnAction.style.opacity='.5'; btnAction.textContent='🚿 씻는 중...';
  sleepTimer=setInterval(()=>{ mood=Math.min(100,mood+3); updateMood(); },1000);
}
function stopBath() {
  isSleeping=false; clearInterval(sleepTimer);
  clawd.classList.remove('in-house'); if(hasGF) gf.classList.remove('in-house');
  btnAction.style.opacity='1'; btnAction.textContent='🚿 씻기'; showBubble('개운해! 🚿');
}

/* 요리 */
function startCooking() {
  const menu=cookMenus[Math.floor(Math.random()*cookMenus.length)];
  isCooking=true;
  clawd.classList.add('in-house'); if(hasGF) gf.classList.add('in-house');
  cookWrap.style.display='block'; cookLbl.textContent=`${menu.emoji} ${menu.name} 요리 중...`;
  cookBar.style.width='0%'; btnAction.style.opacity='.5'; btnAction.textContent='🍳 요리 중...';
  const start=Date.now();
  function animCook(){
    const p=Math.min((Date.now()-start)/menu.time,1); cookBar.style.width=(p*100)+'%';
    if(p<1) cookRaf=requestAnimationFrame(animCook); else finishCooking(menu);
  }
  cookRaf=requestAnimationFrame(animCook);
}
function finishCooking(menu) {
  isCooking=false; cookWrap.style.display='none'; cookBar.style.width='0%';
  clawd.classList.remove('in-house'); if(hasGF) gf.classList.remove('in-house');
  btnAction.style.opacity='1'; btnAction.textContent='🍳 요리하기';
  const el=document.createElement('div');
  el.style.cssText='font-size:22px;cursor:pointer;animation:foodBob 1.2s ease-in-out infinite alternate;z-index:3';
  el.textContent=menu.emoji; el.title=menu.name+' — 클릭해서 먹기!';
  el.addEventListener('click',e=>{
    e.stopPropagation(); el.remove();
    mood=Math.min(100,mood+25); updateMood(); addCombo();
    showBubble(`${menu.emoji} ${menu.name} 맛있다!!`);
    spawnParticles(window.innerWidth/2,window.innerHeight/2,'food');
    score+=15; scoreEl.textContent=score;
  });
  foodShelf.appendChild(el);
  showBubble(`${menu.emoji} ${menu.name} 완성!!`);
  spawnParticles(clawdX,clawdY-30,'sparkle');
}
function cancelCooking() {
  cancelAnimationFrame(cookRaf); isCooking=false;
  cookWrap.style.display='none'; cookBar.style.width='0%';
  clawd.classList.remove('in-house'); if(hasGF) gf.classList.remove('in-house');
  btnAction.style.opacity='1'; btnAction.textContent='🍳 요리하기';
}

btnAction.addEventListener('click',e=>{
  e.stopPropagation();
  const tab=document.querySelector('.room-tab.active')?.dataset.tab||'bedroom';
  if(tab==='bedroom'){ isSleeping?stopSleep():startSleep(); }
  else if(tab==='kitchen'){ isCooking?cancelCooking():startCooking(); }
  else if(tab==='bathroom'){ isSleeping?stopBath():startBath(); }
  else if(tab==='game'){ isGameRunning?stopGame():startGame(); }
});
btnLeave.addEventListener('click',e=>{ e.stopPropagation(); closeHome(); });

/* ── 화면 클릭 이동 ── */
document.addEventListener('click',e=>{
  if(e.target.closest('#clawd')||e.target.closest('.food-item')||e.target.closest('#hud')||e.target.closest('#house')||e.target.closest('#home-modal')) return;
  if(isFocusMode) return;
  spawnParticles(e.clientX,e.clientY,'star');
  moveTo(e.clientX, Math.min(e.clientY, window.innerHeight - BOTTOM_SAFE));
  if(Math.random()<.4) showBubble();
  clickCount++; clearTimeout(secretTimer);
  secretTimer=setTimeout(()=>clickCount=0,1000);
  if(clickCount>=7) showSecret('🤖 클릭왕! 손가락 쉬어요~');
});

/* ── Clawd 클릭 & 터치 ── */
clawd.addEventListener('click',e=>{
  e.stopPropagation();
  spawnParticles(e.clientX,e.clientY,'heart');
  mood=Math.min(100,mood+10); updateMood(); addCombo(); showBubble();
});
clawd.addEventListener('dblclick',e=>{ e.stopPropagation(); triggerFocusMode(); });

clawd.addEventListener('touchstart',e=>{ e.stopPropagation(); startLongPress(); },{passive:true});
clawd.addEventListener('touchend',e=>{
  e.stopPropagation(); cancelLongPress();
  const now=Date.now(), gap=now-lastTap;
  const t=e.changedTouches[0];
  tapCount++; clearTimeout(tapResetTimer);
  if(tapCount===3){ tapCount=0; triggerSurprise(); return; }
  tapResetTimer=setTimeout(()=>{
    if(tapCount===2) triggerFocusMode();
    else{ spawnParticles(t.clientX,t.clientY,'heart'); mood=Math.min(100,mood+10); updateMood(); addCombo(); showBubble(); }
    tapCount=0;
  },300);
  lastTap=now;
});
clawd.addEventListener('mousedown',e=>{ if(e.button!==0) return; e.stopPropagation(); startLongPress(); });
clawd.addEventListener('mouseup',e=>{ e.stopPropagation(); cancelLongPress(); });
clawd.addEventListener('mouseleave',()=>cancelLongPress());

/* ── 점프 ── */
const shadow = document.getElementById('clawd-shadow');
let isJumping = false;

function doJump() {
  if (isJumping || isFocusMode) return;
  isJumping = true;
  clawd.classList.add('jumping');
  spawnParticles(clawdX, clawdY - 20, 'sparkle');

  // 그림자: 올라갈수록 작고 흐려짐
  let t = 0;
  const shadowAnim = setInterval(() => {
    t += 0.08;
    const progress = Math.sin(t * Math.PI);          // 0→1→0
    const sz = 50 - progress * 32;                   // 50→18→50
    const op = 0.18 - progress * 0.12;               // 0.18→0.06→0.18
    shadow.style.width   = sz + 'px';
    shadow.style.opacity = op;
    shadow.style.left    = clawdX + 'px';
    shadow.style.top     = (clawdY + 24) + 'px';
    if (t >= 1) clearInterval(shadowAnim);
  }, 30);

  // 착지 후 상태 초기화
  setTimeout(() => {
    clawd.classList.remove('jumping');
    isJumping = false;
    // 착지 충격파
    spawnParticles(clawdX, clawdY + 10, 'star');
    // 가끔 말풍선
    if (Math.random() < 0.4) {
      const msgs = ['위이잉! 🚀','점프!','높이높이 ✨','야호~!','뿅!'];
      showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
    }
  }, 500);
}

// 스페이스바
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !e.repeat) { e.preventDefault(); doJump(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    window.location.href = 'https://github.com/raspberrypi13-rgb/Clawd';
  }
});

// 두 손가락 탭 → 설정 메뉴 / 두 손가락 롱프레스(500ms) → 점프
let twoFingerTimer = null;
document.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    e.preventDefault();
    twoFingerTimer = setTimeout(() => {
      twoFingerTimer = null;
      doJump();
    }, 500);
  }
}, { passive: false });
document.addEventListener('touchend', e => {
  if (twoFingerTimer !== null) {
    clearTimeout(twoFingerTimer);
    const t = e.changedTouches[0];
    if (typeof openMenu === 'function') openMenu(t.clientX, t.clientY);
    twoFingerTimer = null;
  }
});
document.addEventListener('touchmove', e => {
  if (e.touches.length === 2 && twoFingerTimer !== null) {
    clearTimeout(twoFingerTimer); twoFingerTimer = null;
  }
});

// 그림자 초기 위치 세팅
shadow.style.left    = clawdX + 'px';
shadow.style.top     = (clawdY + 24) + 'px';
shadow.style.opacity = '0.18';
const mealWindows=[{start:7,end:9,label:'아침'},{start:12,end:14,label:'점심'},{start:18,end:20,label:'저녁'}];
const mealMsgs={아침:['아침 밥 줘요 🦞','굿모닝! 배고파요 ☀️'],점심:['점심시간이에요 🦀','배고파요~ 밥 주세요!'],저녁:['저녁 밥 줘요 🦞','저녁 안 주면 졸아요!']};
let lastMealHour=-1;
function checkMealTime(){
  const h=new Date().getHours(), meal=mealWindows.find(m=>h>=m.start&&h<m.end);
  if(meal&&lastMealHour!==meal.start){
    lastMealHour=meal.start;
    const msgs=mealMsgs[meal.label];
    showBubble(msgs[Math.floor(Math.random()*msgs.length)]);
    spawnParticles(clawdX,clawdY-40,'sparkle');
    spawnFood(); spawnFood();
    const nag=setInterval(()=>{
      const nowH=new Date().getHours(), still=mealWindows.find(m=>nowH>=m.start&&nowH<m.end);
      if(!still){clearInterval(nag);return;}
      if(!isFocusMode) showBubble(msgs[Math.floor(Math.random()*msgs.length)]);
      spawnFood();
    },30000);
  } else if(!meal){ lastMealHour=-1; }
}
setInterval(checkMealTime,60000); checkMealTime();



setInterval(()=>{ mood=Math.max(0,mood-1.5); updateMood(); },4000);
setInterval(()=>{ if(!isFocusMode&&Math.random()<.3) showBubble(); },7000);

/* ══════════════════════════════
   🎨 꾸미기 시스템
══════════════════════════════ */
const customizeBtn   = document.getElementById('customize-btn');
const customizePanel = document.getElementById('customize-panel');
const cpClose        = document.getElementById('cp-close');
const clawdAcc       = document.getElementById('clawd-acc');

// 저장된 설정 불러오기
let savedColor = localStorage.getItem('clawd-color') || '#D77F66';
let savedEye   = localStorage.getItem('clawd-eye')   || '#1A1A1A';
let savedAcc   = localStorage.getItem('clawd-acc')   || '';

function applyColor(color) {
  savedColor = color;
  localStorage.setItem('clawd-color', color);
  const style = document.createElement('style');
  style.id = 'clawd-color-style';
  document.getElementById('clawd-color-style')?.remove();
  style.textContent = `
    .body-pixel,.body-pixel::before,.body-pixel::after,.leg{background:${color}!important}
    body.night #clawd .body-pixel,body.night #clawd .body-pixel::before,
    body.night #clawd .body-pixel::after,body.night #clawd .leg{
      background:${_darken(color,.75)}!important}
  `;
  document.head.appendChild(style);
  document.querySelectorAll('#body-colors .color-swatch').forEach(s =>
    s.classList.toggle('selected', s.dataset.color === color));
}

function applyEye(color) {
  savedEye = color;
  localStorage.setItem('clawd-eye', color);
  const style = document.createElement('style');
  style.id = 'clawd-eye-style';
  document.getElementById('clawd-eye-style')?.remove();
  style.textContent = `.eye{background:${color}!important}`;
  document.head.appendChild(style);
  document.querySelectorAll('#eye-colors .color-swatch').forEach(s =>
    s.classList.toggle('selected', s.dataset.eye === color));
}

function applyAcc(acc) {
  savedAcc = acc;
  localStorage.setItem('clawd-acc', acc);
  clawdAcc.textContent = acc;
  document.querySelectorAll('#accessories .acc-btn').forEach(b =>
    b.classList.toggle('selected', b.dataset.acc === acc));
}

function _darken(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.floor((n>>16)*factor);
  const g = Math.floor(((n>>8)&0xff)*factor);
  const b = Math.floor((n&0xff)*factor);
  return `rgb(${r},${g},${b})`;
}

// 초기 적용
applyColor(savedColor);
applyEye(savedEye);
applyAcc(savedAcc);

// 이벤트
document.querySelectorAll('#body-colors .color-swatch').forEach(s =>
  s.addEventListener('click', e => { e.stopPropagation(); applyColor(s.dataset.color); }));
document.querySelectorAll('#eye-colors .color-swatch').forEach(s =>
  s.addEventListener('click', e => { e.stopPropagation(); applyEye(s.dataset.eye); }));
document.querySelectorAll('#accessories .acc-btn').forEach(b =>
  b.addEventListener('click', e => { e.stopPropagation(); applyAcc(b.dataset.acc); }));

customizeBtn.addEventListener('click', e => {
  e.stopPropagation();
  customizePanel.classList.toggle('open');
});
cpClose.addEventListener('click', e => {
  e.stopPropagation();
  customizePanel.classList.remove('open');
});
customizePanel.addEventListener('click', e => e.stopPropagation());

/* ══════════════════════════════
   🌡️ 실제 날씨 연동 (Open-Meteo — 무료, 키 불필요)
══════════════════════════════ */
async function fetchRealWeather() {
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, {timeout:8000}));
    const {latitude: lat, longitude: lon} = pos.coords;

    // Open-Meteo API (무료, 키 불필요)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weathercode,is_day&timezone=auto`;
    const data = await fetch(url).then(r => r.json());
    const code  = data.current.weathercode;
    const isDay = data.current.is_day;

    // WMO 날씨 코드 → weatherMode 변환
    // 0-3: 맑음, 45-48: 안개, 51-67: 비, 71-77: 눈, 80-82: 소나기, 95-99: 뇌우
    let mode;
    if (!isDay) {
      mode = 4; // 밤
    } else if (code <= 3) {
      mode = 0; // 맑음
    } else if (code <= 48) {
      mode = 1; // 구름
    } else if (code <= 67 || (code >= 80 && code <= 99)) {
      mode = 2; // 비
    } else if (code >= 71 && code <= 77) {
      mode = 3; // 눈
    } else {
      mode = 0;
    }

    weatherMode = mode;
    setWeather(mode);
    showBubble(`실제 날씨로 바꿨어요! ${['☀️','🌤️','🌧️','❄️','🌙'][mode]}`);
  } catch(e) {
    console.warn('날씨 가져오기 실패:', e);
    setWeather(0); // 실패 시 기본 맑음
  }
}

// HUD 날씨 버튼 길게 누르면 실제 날씨 연동
weatherBtn.addEventListener('contextmenu', e => { e.preventDefault(); fetchRealWeather(); });
let weatherLongTimer = null;
weatherBtn.addEventListener('touchstart', e => {
  weatherLongTimer = setTimeout(() => { fetchRealWeather(); }, 800);
}, {passive:true});
weatherBtn.addEventListener('touchend', () => clearTimeout(weatherLongTimer));
weatherBtn.addEventListener('touchcancel', () => clearTimeout(weatherLongTimer));

// 앱 시작 시 실제 날씨 적용, 실패 시 기본값
fetchRealWeather().catch(() => setWeather(0));

/* ══════════════════════════════ */
updateMood();
// 게임 컨트롤 버튼 초기 숨김
const _gcEl = document.getElementById('game-ctrl');
if(_gcEl) _gcEl.style.display = 'none';

/* ════════════════════════════════════════
   🎮 게임 엔진 (5종)
════════════════════════════════════════ */
const GW=340, GH=160;
let isGameRunning=false, currentGame=null, gameRaf=null;
let gScore=0, gLives=3, gFrame=0;
const gKeys={left:false,right:false,up:false};

/* ── 공통 유틸 ── */
function _gEl(id){return document.getElementById(id)}
function _gScore(n){gScore+=n; _gEl('g-score').textContent=gScore;}
function _gLife(n){
  gLives+=n; _gEl('g-life').textContent=Math.max(0,gLives);
  if(gLives<=0) setTimeout(_gameOver,100);
}
function _showHud(title){
  _gEl('game-hud').style.display='flex';
  _gEl('g-title').textContent=title;
  _gEl('g-score').textContent='0';
  _gEl('g-life').textContent=gLives;
}
function _gameOver(){
  isGameRunning=false; cancelAnimationFrame(gameRaf);
  _gEl('game-hud').style.display='none';
  _gEl('game-ctrl').style.display='none';
  _gEl('mem-board').style.display='none';
  const ov=_gEl('game-over');
  ov.style.display='flex';
  _gEl('g-final').textContent=gScore;
  score+=Math.floor(gScore/2); scoreEl.textContent=score;
  mood=Math.min(100,mood+Math.min(gScore,25)); updateMood();
  showBubble(gScore>=30?`🎮 ${gScore}점! 대단해!`:'다음엔 더 잘할 수 있어! 💪');
}
function stopGame(){
  isGameRunning=false; cancelAnimationFrame(gameRaf);
  _gEl('game-hud').style.display='none';
  _gEl('game-over').style.display='none';
  _gEl('game-ctrl').style.display='none';
  _gEl('mem-board').style.display='none';
  _gEl('game-menu').style.display='flex';
  btnAction.textContent='🎮 게임 시작';
  if(gameCanvas) gameCtx.clearRect(0,0,GW,GH);
}
function startGame(){
  _gEl('game-menu').style.display='flex'; // 메뉴 보이게
  btnAction.textContent='🛑 게임 중지';
}

/* ── 캔버스 초기화 ── */
let gameCanvas, gameCtx;
function _initCanvas(){
  gameCanvas=_gEl('game-canvas');
  gameCtx=gameCanvas.getContext('2d');
  gameCanvas.width=GW; gameCanvas.height=GH;
}

/* ── 키 입력 ── */
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key==='a') gKeys.left=true;
  if(e.key==='ArrowRight'||e.key==='d') gKeys.right=true;
  if(e.key==='ArrowUp'||e.key===' ') gKeys.up=true;
});
document.addEventListener('keyup',e=>{
  if(e.key==='ArrowLeft'||e.key==='a') gKeys.left=false;
  if(e.key==='ArrowRight'||e.key==='d') gKeys.right=false;
  if(e.key==='ArrowUp'||e.key===' ') gKeys.up=false;
});

/* ── 게임 선택 버튼 ── */
document.querySelectorAll('.g-sel-btn').forEach(btn=>{
  btn.addEventListener('click',e=>{
    e.stopPropagation();
    _gEl('game-menu').style.display='none';
    _gEl('game-over').style.display='none';
    if(!gameCanvas) _initCanvas();
    gScore=0; gLives=3; gFrame=0;
    const g=btn.dataset.game;
    currentGame=g;
    isGameRunning=true;
    if(g==='catch')   _startCatch();
    if(g==='snake')   _startSnake();
    if(g==='breakout')_startBreakout();
    if(g==='memory')  _startMemory();
  });
});

/* 모바일 버튼 공통 */
function _bindCtrl(){
  const l=_gEl('g-left'),r=_gEl('g-right'),u=_gEl('g-up');
  _gEl('game-ctrl').style.display='flex';
  const on=(k,v)=>e=>{e.preventDefault();gKeys[k]=v;};
  l.ontouchstart=on('left',true); l.ontouchend=on('left',false);
  r.ontouchstart=on('right',true);r.ontouchend=on('right',false);
  u.ontouchstart=on('up',true);   u.ontouchend=on('up',false);
  l.onmousedown=()=>gKeys.left=true; l.onmouseup=()=>gKeys.left=false;
  r.onmousedown=()=>gKeys.right=true;r.onmouseup=()=>gKeys.right=false;
  u.onmousedown=()=>gKeys.up=true;   u.onmouseup=()=>gKeys.up=false;
}

/* ══════════════════════════════
   1. 음식 캐치
══════════════════════════════ */
function _startCatch(){
  _showHud('🍱 CATCH'); _bindCtrl();
  const FOODS=['🍚','🍜','🦞','🍳','🍱','🦀','🍕','🥗','🍰','🍖'];
  const BOMBS=['💣','☠️'];
  let player={x:GW/2-18,y:GH-22,w:36,h:16,spd:3.5};
  let items=[], spawnT=0;
  function loop(){
    if(!isGameRunning||currentGame!=='catch') return;
    gFrame++; spawnT++;
    const lvl=1+Math.floor(gScore/15);
    if(spawnT>Math.max(30-lvl*2,10)){
      spawnT=0;
      const bomb=Math.random()<.14+lvl*.02;
      items.push({x:Math.random()*(GW-20),y:-22,e:bomb?BOMBS[Math.floor(Math.random()*2)]:FOODS[Math.floor(Math.random()*FOODS.length)],bomb,spd:1.4+lvl*.2+Math.random()*.5});
    }
    if(gKeys.left) player.x=Math.max(0,player.x-player.spd);
    if(gKeys.right)player.x=Math.min(GW-player.w,player.x+player.spd);
    items=items.filter(it=>{
      it.y+=it.spd;
      const hit=it.x+18>player.x+2&&it.x<player.x+player.w-2&&it.y+18>player.y&&it.y<player.y+player.h;
      if(hit){it.bomb?_gLife(-1):_gScore(1);return false;}
      return it.y<GH+20;
    });
    const c=gameCtx;
    c.fillStyle='#1a1a2e'; c.fillRect(0,0,GW,GH);
    c.fillStyle='#2d2b4e'; c.fillRect(0,GH-6,GW,6);
    // 플레이어 (Clawd)
    c.fillStyle='#D77F66';
    c.fillRect(player.x+4,player.y,player.w-8,player.h);
    c.fillRect(player.x,player.y+4,5,8);
    c.fillRect(player.x+player.w-5,player.y+4,5,8);
    c.fillStyle='#1a1a1a';
    c.fillRect(player.x+7,player.y+3,4,6);
    c.fillRect(player.x+player.w-11,player.y+3,4,6);
    c.font='18px serif'; c.textAlign='center';
    items.forEach(it=>c.fillText(it.e,it.x+11,it.y+16));
    gameRaf=requestAnimationFrame(loop);
  }
  gameRaf=requestAnimationFrame(loop);
}

/* ══════════════════════════════
   2. 스네이크
══════════════════════════════ */
function _startSnake(){
  _showHud('🐍 SNAKE'); _bindCtrl();
  const SZ=10; // 셀 크기
  const CW=Math.floor(GW/SZ), CH=Math.floor(GH/SZ);
  let snake=[{x:Math.floor(CW/2),y:Math.floor(CH/2)}];
  let dir={x:1,y:0}, nextDir={x:1,y:0};
  let food=_randFood(), moveT=0;
  const FOODS=['🦞','🦀','🍤','🥚','🐟'];
  function _randFood(){
    return {x:Math.floor(Math.random()*CW),y:Math.floor(Math.random()*CH),e:FOODS[Math.floor(Math.random()*FOODS.length)]};
  }
  // 방향 변경
  const dirMap={left:{x:-1,y:0},right:{x:1,y:0},up:{x:0,y:-1}};
  function _dirUpdate(){
    if(gKeys.left&&dir.x===0)  nextDir={x:-1,y:0};
    if(gKeys.right&&dir.x===0) nextDir={x:1,y:0};
    if(gKeys.up&&dir.y===0)    nextDir={x:0,y:-1};
  }
  function loop(){
    if(!isGameRunning||currentGame!=='snake') return;
    gFrame++; moveT++;
    _dirUpdate();
    const spd=Math.max(12-Math.floor(gScore/5),5);
    if(moveT>=spd){
      moveT=0; dir=nextDir;
      const head={x:(snake[0].x+dir.x+CW)%CW,y:(snake[0].y+dir.y+CH)%CH};
      if(snake.some(s=>s.x===head.x&&s.y===head.y)){isGameRunning=false;_gameOver();return;}
      snake.unshift(head);
      if(head.x===food.x&&head.y===food.y){_gScore(2);food=_randFood();}
      else snake.pop();
    }
    const c=gameCtx;
    c.fillStyle='#1a1a2e'; c.fillRect(0,0,GW,GH);
    // 격자
    c.strokeStyle='rgba(255,255,255,.03)'; c.lineWidth=.5;
    for(let i=0;i<CW;i++){c.beginPath();c.moveTo(i*SZ,0);c.lineTo(i*SZ,GH);c.stroke();}
    for(let j=0;j<CH;j++){c.beginPath();c.moveTo(0,j*SZ);c.lineTo(GW,j*SZ);c.stroke();}
    // 스네이크
    snake.forEach((s,i)=>{
      c.fillStyle=i===0?'#D77F66':'#c06a52';
      c.fillRect(s.x*SZ+1,s.y*SZ+1,SZ-2,SZ-2);
      if(i===0){c.fillStyle='#1a1a1a';c.fillRect(s.x*SZ+2,s.y*SZ+2,2,2);c.fillRect(s.x*SZ+SZ-4,s.y*SZ+2,2,2);}
    });
    // 먹이
    c.font='10px serif'; c.textAlign='center';
    c.fillText(food.e,food.x*SZ+SZ/2,food.y*SZ+SZ-1);
    gameRaf=requestAnimationFrame(loop);
  }
  gameRaf=requestAnimationFrame(loop);
}

/* ══════════════════════════════
   3. 벽돌 깨기
══════════════════════════════ */
function _startBreakout(){
  _showHud('🧱 BREAKOUT'); _bindCtrl();
  const PAD_W=50,PAD_H=8;
  let pad={x:GW/2-PAD_W/2,y:GH-14,w:PAD_W,h:PAD_H};
  let ball={x:GW/2,y:GH-30,vx:2.2,vy:-2.8,r:5};
  let bricks=[];
  const COLS=['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6'];
  const BR_W=30,BR_H=12,BR_COLS=10,BR_ROWS=4;
  for(let r=0;r<BR_ROWS;r++) for(let c=0;c<BR_COLS;c++)
    bricks.push({x:c*(BR_W+2)+2,y:r*(BR_H+3)+20,w:BR_W,h:BR_H,alive:true,col:COLS[r%COLS.length]});
  function loop(){
    if(!isGameRunning||currentGame!=='breakout') return;
    if(gKeys.left) pad.x=Math.max(0,pad.x-4.5);
    if(gKeys.right)pad.x=Math.min(GW-pad.w,pad.x+4.5);
    ball.x+=ball.vx; ball.y+=ball.vy;
    if(ball.x-ball.r<0||ball.x+ball.r>GW) ball.vx*=-1;
    if(ball.y-ball.r<0) ball.vy*=-1;
    if(ball.y+ball.r>GH){_gLife(-1);ball.x=pad.x+pad.w/2;ball.y=pad.y-ball.r-2;ball.vy=-2.8;}
    if(ball.y+ball.r>pad.y&&ball.y-ball.r<pad.y+pad.h&&ball.x>pad.x&&ball.x<pad.x+pad.w){
      ball.vy=-Math.abs(ball.vy);
      ball.vx+=(ball.x-(pad.x+pad.w/2))/14;
    }
    bricks.forEach(b=>{
      if(!b.alive) return;
      if(ball.x+ball.r>b.x&&ball.x-ball.r<b.x+b.w&&ball.y+ball.r>b.y&&ball.y-ball.r<b.y+b.h){
        b.alive=false; ball.vy*=-1; _gScore(1);
      }
    });
    if(bricks.every(b=>!b.alive)){
      bricks.forEach((b,i)=>b.alive=true);
      ball.vx*=1.1; ball.vy*=1.1; _gScore(5);
    }
    const c=gameCtx;
    c.fillStyle='#0d0d1a'; c.fillRect(0,0,GW,GH);
    bricks.forEach(b=>{if(!b.alive)return;c.fillStyle=b.col;c.fillRect(b.x,b.y,b.w,b.h);c.fillStyle='rgba(255,255,255,.2)';c.fillRect(b.x,b.y,b.w,3);});
    // 패들
    c.fillStyle='#D77F66'; c.beginPath(); c.roundRect(pad.x,pad.y,pad.w,pad.h,4); c.fill();
    // 공
    c.fillStyle='#fff'; c.beginPath(); c.arc(ball.x,ball.y,ball.r,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(255,255,255,.3)'; c.beginPath(); c.arc(ball.x-1,ball.y-1,ball.r*.4,0,Math.PI*2); c.fill();
    gameRaf=requestAnimationFrame(loop);
  }
  gameRaf=requestAnimationFrame(loop);
}

/* ══════════════════════════════
   4. 기억력 카드
══════════════════════════════ */
function _startMemory(){
  _showHud('🃏 MEMORY');
  _gEl('game-ctrl').style.display='none';
  gameCtx.clearRect(0,0,GW,GH);
  const board=_gEl('mem-board');
  board.style.display='flex';
  board.innerHTML='';
  const EMOJIS=['🦀','🦞','🐟','🍤','🥚','🍳','🍚','🍜'];
  const pairs=[...EMOJIS,...EMOJIS].sort(()=>Math.random()-.5);
  let flipped=[], matched=0, canFlip=true;
  pairs.forEach((e,i)=>{
    const card=document.createElement('div');
    card.className='mem-card'; card.dataset.i=i; card.dataset.e=e;
    card.textContent='❓';
    card.addEventListener('click',()=>{
      if(!canFlip||card.classList.contains('matched')||flipped.includes(card)) return;
      card.textContent=e; card.classList.add('flipped');
      flipped.push(card);
      if(flipped.length===2){
        canFlip=false;
        if(flipped[0].dataset.e===flipped[1].dataset.e){
          flipped.forEach(c=>{c.classList.add('matched');c.classList.remove('flipped');});
          matched+=2; _gScore(3);
          if(matched===pairs.length){
            setTimeout(()=>{_gEl('mem-board').style.display='none';_gameOver();},600);
          }
          flipped=[]; canFlip=true;
        } else {
          setTimeout(()=>{flipped.forEach(c=>{c.textContent='❓';c.classList.remove('flipped');});flipped=[];canFlip=true;},900);
        }
      }
    });
    board.appendChild(card);
  });
  isGameRunning=true;
}

/* ── 게임 오버 버튼 ── */
_gEl('g-retry').addEventListener('click',e=>{e.stopPropagation();_gEl('game-over').style.display='none';if(!gameCanvas)_initCanvas();gScore=0;gLives=3;gFrame=0;if(currentGame==='catch')_startCatch();else if(currentGame==='snake')_startSnake();else if(currentGame==='breakout')_startBreakout();else if(currentGame==='memory')_startMemory();});
_gEl('g-menu-btn').addEventListener('click',e=>{e.stopPropagation();stopGame();});

/* ══════════════════════════════
   🖱️ 우클릭 컨텍스트 메뉴
══════════════════════════════ */
(function () {
  const menu      = document.getElementById('clawd-ctx-menu');
  const ctxName   = document.getElementById('clawd-ctx-name');
  const ctxAccPrv = document.getElementById('clawd-ctx-acc-preview');

  /* openMenu를 전역으로 노출 — 두 손가락 탭에서 호출 */
  window.openMenu = openMenu;

  /* 저장된 이름 */
  let clawdName = localStorage.getItem('clawd-name') || 'Clawd';
  ctxName.textContent = '⚙️ ' + clawdName + ' 설정';

  /* 트레일 효과 토글 상태 */
  let trailEnabled = localStorage.getItem('clawd-trail') !== 'off';
  /* 소리 알림 토글 상태 */
  let soundEnabled = localStorage.getItem('clawd-sound') !== 'off';

  function updateCtxHeader() {
    ctxName.textContent = '⚙️ ' + clawdName + ' 설정';
    ctxAccPrv.textContent = clawdAcc.textContent || '🦀';
  }

  /* 메뉴 열기 */
  function openMenu(x, y) {
    updateCtxHeader();
    menu.classList.add('open');
    /* 화면 밖으로 나가지 않게 위치 조정 */
    const mw = 200, mh = 300;
    const rx = Math.min(x, window.innerWidth  - mw - 8);
    const ry = Math.min(y, window.innerHeight - mh - 8);
    menu.style.left = rx + 'px';
    menu.style.top  = ry + 'px';
  }

  function closeMenu() { menu.classList.remove('open'); }

  /* 캐릭터 우클릭 */
  clawd.addEventListener('contextmenu', e => {
    e.preventDefault();
    e.stopPropagation();
    openMenu(e.clientX, e.clientY);
  });

  /* 바깥 클릭 닫기 */
  document.addEventListener('click',       closeMenu);
  document.addEventListener('contextmenu', e => { if (!menu.contains(e.target)) closeMenu(); });

  /* ── 메뉴 항목 액션 ── */
  menu.querySelectorAll('.ctx-item').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      closeMenu();
      const action = btn.dataset.action;

      if (action === 'customize') {
        /* 기존 꾸미기 패널 열기 */
        customizePanel.classList.add('open');

      } else if (action === 'rename') {
        /* 이름 변경 */
        const modal = document.getElementById('rename-modal');
        const input = document.getElementById('rename-input');
        input.value = clawdName;
        modal.classList.add('open');
        setTimeout(() => { input.focus(); input.select(); }, 100);

        function doRename() {
          const v = input.value.trim();
          if (v) {
            clawdName = v;
            localStorage.setItem('clawd-name', v);
            showBubble('이름이 바뀌었어요! 😊');
          }
          modal.classList.remove('open');
          cleanup();
        }
        function cleanup() {
          document.getElementById('rename-ok').onclick     = null;
          document.getElementById('rename-cancel').onclick = null;
          input.onkeydown = null;
        }
        document.getElementById('rename-ok').onclick     = doRename;
        document.getElementById('rename-cancel').onclick = () => { modal.classList.remove('open'); cleanup(); };
        input.onkeydown = ev => { if (ev.key === 'Enter') doRename(); if (ev.key === 'Escape') { modal.classList.remove('open'); cleanup(); } };

      } else if (action === 'size') {
        /* 크기 조절 */
        const modal  = document.getElementById('slider-modal');
        const title  = document.getElementById('slider-title');
        const input  = document.getElementById('slider-input');
        const minLbl = document.getElementById('slider-min-label');
        const maxLbl = document.getElementById('slider-max-label');
        title.textContent  = '📐 캐릭터 크기';
        minLbl.textContent = '작게';
        maxLbl.textContent = '크게';
        input.min   = '50';
        input.max   = '180';
        input.value = parseInt(localStorage.getItem('clawd-size') || '100');
        modal.classList.add('open');

        function applySize(v) {
          const s = v / 100;
          clawd.style.transform = `translate(-50%,-50%) scale(${s})`;
        }
        input.oninput = () => applySize(input.value);

        function doSize() {
          localStorage.setItem('clawd-size', input.value);
          modal.classList.remove('open');
          showBubble('크기 조절 완료! 📐');
          cleanup();
        }
        function cleanup() {
          document.getElementById('slider-ok').onclick     = null;
          document.getElementById('slider-cancel').onclick = null;
          input.oninput = null;
        }
        document.getElementById('slider-ok').onclick     = doSize;
        document.getElementById('slider-cancel').onclick = () => {
          applySize(parseInt(localStorage.getItem('clawd-size') || '100'));
          modal.classList.remove('open');
          cleanup();
        };

      } else if (action === 'speed') {
        /* 이동 속도 */
        const modal  = document.getElementById('slider-modal');
        const title  = document.getElementById('slider-title');
        const input  = document.getElementById('slider-input');
        const minLbl = document.getElementById('slider-min-label');
        const maxLbl = document.getElementById('slider-max-label');
        title.textContent  = '⚡ 이동 속도';
        minLbl.textContent = '느리게';
        maxLbl.textContent = '빠르게';
        input.min   = '10';
        input.max   = '100';
        input.value = parseInt(localStorage.getItem('clawd-speed') || '40');
        modal.classList.add('open');

        function doSpeed() {
          localStorage.setItem('clawd-speed', input.value);
          /* 속도는 CSS transition duration에 반영 */
          const dur = (110 - parseInt(input.value)) / 100;
          clawd.style.transition = `left ${dur}s cubic-bezier(.25,1,.5,1),top ${dur}s cubic-bezier(.25,1,.5,1)`;
          modal.classList.remove('open');
          showBubble('속도 조절 완료! ⚡');
          cleanup();
        }
        function cleanup() {
          document.getElementById('slider-ok').onclick     = null;
          document.getElementById('slider-cancel').onclick = null;
        }
        document.getElementById('slider-ok').onclick     = doSpeed;
        document.getElementById('slider-cancel').onclick = () => { modal.classList.remove('open'); cleanup(); };

      } else if (action === 'trail') {
        /* 트레일 효과 토글 */
        trailEnabled = !trailEnabled;
        localStorage.setItem('clawd-trail', trailEnabled ? 'on' : 'off');
        showBubble(trailEnabled ? '트레일 켜짐 🌈' : '트레일 꺼짐 ⬛');
        btn.textContent = trailEnabled ? '🌈 트레일 효과' : '⬜ 트레일 효과';
        /* canvas 투명도로 효과 토글 */
        canvas.style.opacity = trailEnabled ? '1' : '0';

      } else if (action === 'sound') {
        /* 소리 알림 토글 */
        soundEnabled = !soundEnabled;
        localStorage.setItem('clawd-sound', soundEnabled ? 'on' : 'off');
        showBubble(soundEnabled ? '알림음 켜짐 🔔' : '알림음 꺼짐 🔕');
        btn.textContent = soundEnabled ? '🔔 소리 알림' : '🔕 소리 알림';

      } else if (action === 'github') {
        window.open('https://github.com/raspberrypi13-rgb/Clawd', '_blank');

      } else if (action === 'reset') {
        if (confirm('설정을 모두 초기화할까요?')) {
          ['clawd-color','clawd-eye','clawd-acc','clawd-name',
           'clawd-size','clawd-speed','clawd-trail','clawd-sound'].forEach(k => localStorage.removeItem(k));
          location.reload();
        }
      }
    });
  });

  /* 초기화 — 저장된 크기/속도 복원 */
  const savedSize  = parseInt(localStorage.getItem('clawd-size')  || '100');
  const savedSpeed = parseInt(localStorage.getItem('clawd-speed') || '40');
  if (savedSize !== 100) {
    clawd.style.transform = `translate(-50%,-50%) scale(${savedSize/100})`;
  }
  if (savedSpeed !== 40) {
    const dur = (110 - savedSpeed) / 100;
    clawd.style.transition = `left ${dur}s cubic-bezier(.25,1,.5,1),top ${dur}s cubic-bezier(.25,1,.5,1)`;
  }
  if (!trailEnabled) canvas.style.opacity = '0';

  /* 트레일 버튼 초기 텍스트 */
  menu.querySelector('[data-action="trail"]').textContent = trailEnabled ? '🌈 트레일 효과' : '⬜ 트레일 효과';
  menu.querySelector('[data-action="sound"]').textContent = soundEnabled ? '🔔 소리 알림' : '🔕 소리 알림';
})();



async function _initNotifications(reg) {
  if (!('Notification' in window)) return;

  async function activate() {
    // SW에 폴링 시작 메시지
    const sw = reg.active || (await navigator.serviceWorker.ready).active;
    if (sw) sw.postMessage({ type: 'START_NOTIFICATIONS' });

    // Periodic Background Sync 등록 (Chrome Android)
    if ('periodicSync' in reg) {
      try {
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
        if (status.state === 'granted') {
          await reg.periodicSync.register('clawd-notify', { minInterval: 5 * 60 * 1000 });
        }
      } catch(e) {}
    }

    // 앱이 포그라운드에 있을 때 1분마다 SW fetch ping (SW를 깨어있게 유지)
    setInterval(async () => {
      try { await fetch('./manifest.json?_t=' + Date.now()); } catch(e) {}
    }, 60 * 1000);
  }

  if (Notification.permission === 'granted') { await activate(); return; }
  if (Notification.permission === 'denied') return;

  setTimeout(async () => {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      await activate();
      showBubble('알림 허용됐어요! 🔔');
    }
  }, 2000);
}


let _deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredPrompt = e;
  _showPwaBanner();
});
window.addEventListener('appinstalled', () => {
  showBubble('홈 화면에 추가됐어요! 🦀');
  spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 'sparkle');
});

function _showPwaBanner() {
  if (document.getElementById('pwa-banner')) return;
  const style = document.createElement('style');
  style.textContent = `
    #pwa-banner { position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
      background:rgba(30,30,46,.96);color:#e8d5c0;border:1.5px solid #D77F66;
      border-radius:14px;padding:10px 16px;font-size:12px;font-weight:bold;
      font-family:'Courier New',monospace;display:flex;align-items:center;gap:10px;
      z-index:9999;backdrop-filter:blur(8px);white-space:nowrap;
      box-shadow:0 4px 20px rgba(0,0,0,.4);
      animation:pwaUp .4s cubic-bezier(.175,.885,.32,1.275); }
    @keyframes pwaUp { from{transform:translateX(-50%) translateY(16px);opacity:0}
                       to{transform:translateX(-50%) translateY(0);opacity:1} }
    #pwa-install { background:#D77F66;color:#fff;border:none;border-radius:8px;
      padding:5px 10px;cursor:pointer;font-size:11px;font-weight:bold;
      font-family:'Courier New',monospace; }
    #pwa-dismiss { background:none;border:none;color:#888;cursor:pointer;font-size:15px;line-height:1; }
  `;
  document.head.appendChild(style);
  const b = document.createElement('div');
  b.id = 'pwa-banner';
  b.innerHTML = '<span>🦀 홈 화면에 추가할까요?</span>'
              + '<button id="pwa-install">설치</button>'
              + '<button id="pwa-dismiss">✕</button>';
  document.body.appendChild(b);
  document.getElementById('pwa-install').onclick = async () => {
    if (!_deferredPrompt) return;
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    if (outcome === 'accepted') showBubble('앱 설치 완료! 🎉');
    _deferredPrompt = null; b.remove();
  };
  document.getElementById('pwa-dismiss').onclick = () => b.remove();
  setTimeout(() => b.parentNode && b.remove(), 8000);
}
