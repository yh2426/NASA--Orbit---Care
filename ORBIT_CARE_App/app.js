'use strict';
const app = document.getElementById('app');
const header = document.getElementById('app-header');
const navigation = document.getElementById('app-nav');
const STORAGE_KEY = 'orbit-care-demo-v1';
const groups = [
  {name:'Bright & energized', color:'joyful', mark:'✧', words:['Joyful','Excited','Hopeful','Inspired','Proud','Energized']},
  {name:'Calm & grounded', color:'peaceful', mark:'≈', words:['Peaceful','Grateful','Content','Connected','Relaxed','Okay']},
  {name:'Low & quiet', color:'low', mark:'–', words:['Sad','Lonely','Tired','Homesick','Drained','Disappointed']},
  {name:'Tense & unsettled', color:'stressed', mark:'~', words:['Stressed','Anxious','Frustrated','Overwhelmed','Restless','Irritated']}
];
const reasons = ['Workload','Sleep','Crew','Missing home','Health','A small win','Personal','Not sure'];
const samplePosts = [
  {id:'alex',author:'Alex',initials:'AL',text:'Anyone up for a shared music break after the shift?',time:'Sample · 09:10'},
  {id:'sam',author:'Sam',initials:'SA',text:'Count me in. A little company sounds good today.',time:'Sample · 09:18'}
];
const blankState = () => ({entries:[],posts:[],likes:[],reflections:[],messages:[],dismissed:false});
let storageAvailable = true;
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return blankState();
    if (!['entries','posts','likes','reflections','messages'].every(key => Array.isArray(saved[key]))) return blankState();
    return saved;
  } catch { storageAvailable = false; return blankState(); }
}
let state = loadState();
let draft = {mood:'',reasons:[],notes:''};
let lastSavedId = '';
let timer = null;
let breath = {running:false,elapsed:0,complete:false};
let toastTimeout;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const moodGroup = mood => groups.find(group => group.words.includes(mood)) || groups[1];
const colorStyle = mood => `--emotion-color:var(--color-emotion-${moodGroup(mood).color})`;
const dateLabel = time => new Date(time).toLocaleDateString('en-US',{month:'short',day:'numeric'});
const timeLabel = time => new Date(time).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; toast('Browser storage is unavailable. Changes stay in this tab only.'); }
}
function toast(text) {
  const node = document.getElementById('toast');
  clearTimeout(toastTimeout); node.textContent = text; node.hidden = false;
  toastTimeout = setTimeout(() => {node.hidden = true;}, 4200);
}

function emotionShape(mood) {
  const shapes={
    joyful:'<path d="M50 3 61 20 81 12 80 33 99 42 83 56 91 77 69 77 59 97 44 81 23 91 23 69 3 59 20 44 12 23 33 23Z"/>',
    peaceful:'<path d="M50 29C26-9 5 20 29 40-13 34-5 73 30 62 7 98 47 112 51 76 68 116 103 89 76 64 118 68 111 29 77 40 103 5 63-9 50 29Z"/>',
    low:'<path d="M12 54C12 29 29 12 50 12S88 29 88 54V67H74V81H59V90H41V81H26V67H12Z"/>',
    stressed:'<path d="m50 4 13 14 18-3 3 19 14 16-15 14-3 20-20-2-10 15-14-15-20 2-2-20L2 50l15-15 1-20 20 3Z"/>'
  };
  return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">'+shapes[moodGroup(mood).color]+'</svg>';
}
function portrait(person) {
  const styles={alex:['#d4b89b','#b77e59','#302c2b','#8099aa','short'],sam:['#b6c8bd','#e3b38d','#473429','#b28e7e','long'],jamie:['#b7bed4','#c38a68','#242a30','#8cae9b','curly'],family:['#c8bca8','#dfac88','#64534a','#8c9bba','family'],you:['#a8c1b7','#e8b88d','#35302d','#667e91','short']};
  const [bg,skin,hair,shirt,kind]=styles[person]||styles.you;
  const head=(x,y,r)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+skin+'"/>';
  let art;
  if(kind==='family')art='<path d="M5 92V77C5 55 47 55 47 77V94M49 94V77C49 55 93 55 93 77V94" fill="'+shirt+'"/>'+head(28,41,17)+head(71,41,17)+'<path d="M11 41C7 13 51 14 45 40L36 28 14 33M54 40C49 12 93 14 88 43L80 30 58 33" fill="'+hair+'"/><path d="M23 45h1m9 0h1m31 0h1m9 0h1" stroke="#302c2b" stroke-width="2.5" stroke-linecap="round"/>';
  else art=(kind==='long'?'<path d="M23 70V35C23 0 79 0 79 35V72Z" fill="'+hair+'"/>':'')+'<path d="M10 100V88C10 55 90 55 90 88V100" fill="'+shirt+'"/><path d="M42 59V72Q50 80 58 72V59" fill="'+skin+'"/>'+head(50,42,24)+(kind==='curly'?'<path d="M25 45C6 31 21 15 31 18 26 1 47 0 51 12 66-4 82 7 76 22 94 22 87 47 75 44L69 30 57 27 43 30 32 29Z" fill="'+hair+'"/>':'<path d="M26 43C16 7 80 3 75 43L64 27Q42 38 30 30Z" fill="'+hair+'"/>')+'<path d="M40 45h1m18 0h1" stroke="#302c2b" stroke-width="3" stroke-linecap="round"/><path d="M44 56q6 5 12 0" fill="none" stroke="#8d5847" stroke-width="2" stroke-linecap="round"/>';
  return '<span class="avatar illustrated-avatar" role="img" aria-label="'+({alex:'Alex',sam:'Sam',jamie:'Jamie',family:'Family',you:'You'}[person]||'You')+'"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="'+bg+'"/>'+art+'</svg></span>';
}

function orb(mood) { return `<div class="mood-orb" style="${colorStyle(mood)}" aria-hidden="true">${emotionShape(mood)}</div>`; }
function intro(eyebrow,title,description) { return `<div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="lead">${description}</p>`; }
function button(text,href,secondary=false) { return `<a class="${secondary?'secondary':'primary'}" href="#${href}">${text}</a>`; }
function steps(current) {return `<div class="step">YOUR CHECK-IN · ${current} OF 3</div><div class="progress-dots" aria-hidden="true">${[1,2,3].map(i=>`<span class="${i<=current?'done':''}"></span>`).join('')}</div>`;}
function icon(name) {
  const paths={home:'<path d="m3 10 7-6 7 6v7H6v-7"/><path d="M9 17v-5h3v5"/>',checkin:'<circle cx="10" cy="10" r="7"/><path d="M10 6v8M6 10h8"/>',history:'<path d="M3 16V9M8 16V5M13 16v-7M18 16V3"/>',support:'<path d="M10 17S2 12 2 7a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-8 10-8 10Z"/>'};
  return `<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 20 20">${paths[name]}</svg></span>`;
}
function shell(title,back,active) {
  header.innerHTML = back ? `<a class="back-link" href="#${back[1]}">← ${back[0]}</a><span class="page-name">${title}</span>` : `<a class="wordmark" href="#home">ORBIT CARE</a>${portrait("you")}`;
  navigation.innerHTML = [['home','Home'],['checkin','Check-in'],['history','History'],['support','Support']].map(([route,label])=>`<a href="#${route}" ${active===route?'aria-current="page"':''}>${icon(route)}${label}</a>`).join('');
}
function weekMarkup() {
  return `<div class="week" aria-label="Your last seven days of check-ins">${Array.from({length:7},(_,i)=>{
    const date=new Date();date.setDate(date.getDate()-(6-i));const key=date.toDateString();
    const entry=state.entries.find(item=>new Date(item.time).toDateString()===key);
    return `<div class="week-day">${i===6?'Today':date.toLocaleDateString('en-US',{weekday:'short'}).slice(0,1)}${entry?`<a href="#entry/${entry.id}" aria-label="${esc(dateLabel(entry.time)+' — '+entry.mood)}" class="mini-orb" style="${colorStyle(entry.mood)}">${emotionShape(entry.mood)}</a>`:'<div class="mini-orb empty" aria-label="No entry">·</div>'}</div>`;
  }).join('')}</div>`;
}
function homePage() {
  const latest=state.entries[0];
  return `${intro('YOUR DAILY MOMENT','A little space<br>for you.','How are you feeling today? Everything else can wait.')}
  <div class="panel"><div class="mood-row">${orb(latest?.mood||'Peaceful')}<div><p class="tiny">${latest?'Latest check-in · '+dateLabel(latest.time):'A fresh start'}</p><div class="mood-name">${latest?esc(latest.mood):'Make room for you.'}</div><p class="small">${latest?'Thank you for noticing.':'Your first check-in starts here.'}</p></div></div><button class="primary" data-action="new-checkin">Check in with yourself</button></div>
  <div class="section-heading"><h3>Your week, one moment at a time</h3></div>${weekMarkup()}<a class="text-button" href="#history">View check-in history →</a>
  ${!state.dismissed?'<a class="health-prompt" href="#health"><div class="row"><h3>A change in your rhythm</h3></div><p>Less sleep than usual. How are you feeling?</p><span class="prompt-link">Review the wellbeing prompt →</span></a>':'<div class="notice">Wellbeing prompt dismissed. <a class="text-button" href="#health">Review readings →</a></div>'}
  <a class="support-link" href="#support"><span>You don’t have to do it alone.</span><span>→</span></a>`;
}
function checkinPage() {
  return `${steps(1)}<div class="space">${intro('PAUSE / NOTICE / NAME','How are you<br>feeling?','Choose the word that feels closest.')}</div>
  <div class="emotion-bubbles" aria-label="Choose your emotion">${groups.flatMap(group=>group.words.map(word=>`<button class="emotion-choice emotion-bubble" style="--emotion-color:var(--color-emotion-${group.color})" data-mood="${word}" aria-pressed="${draft.mood===word}"><span>${word}</span></button>`)).join('')}</div>
  <div class="selected-line" role="status" id="selected-mood">${draft.mood?'Selected: '+esc(draft.mood):'No pressure. Take your time.'}</div><button class="primary sticky-action" id="mood-continue" data-action="continue-mood" ${draft.mood?'':'disabled'}>Continue →</button>`;
}
function reflectionPage() {
  if(!draft.mood) return `${intro('YOUR CHECK-IN','Start with a feeling.','Choose an emotion before adding a reflection.')}<div class="space">${button('Choose a feeling','checkin')}</div>`;
  return `${steps(2)}<div class="space">${intro('A LITTLE CONTEXT','What’s behind<br>the feeling?','A reason, a small win, or something on your mind. All optional.')}</div><div class="panel"><div class="row"><div class="row">${orb(draft.mood)}<h2>${esc(draft.mood)}</h2></div><a class="text-button" href="#checkin">Change</a></div></div>
  <form id="reflection-form"><fieldset><legend>What might be contributing?</legend><div class="chips">${reasons.map(reason=>`<button type="button" class="chip" data-reason="${reason}" aria-pressed="${draft.reasons.includes(reason)}">${reason}</button>`).join('')}</div></fieldset><label class="field-label" for="checkin-note">Anything else? <span class="muted small">Optional</span></label><textarea id="checkin-note" maxlength="500" placeholder="One thing I noticed today…">${esc(draft.notes)}</textarea><div class="counter" id="note-count">${draft.notes.length} / 500</div><button class="primary space" type="submit">Review check-in →</button></form><a class="text-button" href="#home">Leave for now</a>`;
}
function reviewPage() {
  if(!draft.mood) return `${intro('YOUR CHECK-IN','A moment to begin.','There is no check-in to review yet.')}<div class="space">${button('Start a check-in','checkin')}</div>`;
  return `${steps(3)}<div class="space">${intro('YOUR REFLECTION','Ready when<br>you are.','Take one last look. This moment belongs to you.')}</div><div class="panel"><div class="mood-row">${orb(draft.mood)}<div><p class="small">Today’s feeling</p><div class="mood-name">${esc(draft.mood)}</div></div></div><hr class="divider"><p class="small">What’s on your mind</p><p class="note-body">${esc(draft.reasons.join(' · ')||'No reason selected')}</p><hr class="divider"><p class="small">Your note</p><p class="note-body">${esc(draft.notes||'No note added. That’s okay, too.')}</p></div><button class="primary space" data-action="save-checkin">Save check-in</button><a class="secondary space-sm" href="#reflection">Edit reflection</a>`;
}
function savedPage() {
  const entry=state.entries.find(item=>item.id===lastSavedId)||state.entries[0];
  if(!entry) return `${intro('YOUR SPACE','Nothing saved yet.','Begin with a quick check-in.')}<div class="space">${button('Check in','checkin')}</div>`;
  return `<div class="success-orb" aria-hidden="true">✓</div>${intro('CHECK-IN SAVED','You made space<br>for you.','Noticing how you feel is a small thing that matters.')}<div class="panel"><div class="row">${orb(entry.mood)}<div style="flex:1"><h2>${esc(entry.mood)}</h2><p class="small">${dateLabel(entry.time)} · ${timeLabel(entry.time)}</p></div><a class="text-button" href="#entry/${entry.id}">View</a></div></div><div class="stack space">${button('See suggestions for you','suggestions/'+entry.id)}${button('Return Home','home',true)}</div>`;
}
function historyPage() {
  return `${intro('YOUR PATTERNS / YOUR PACE','Every feeling<br>has a story.','Your check-ins, collected one moment at a time.')}${state.entries.length?`<div class="section-heading"><h3>${state.entries.length} check-in${state.entries.length===1?'':'s'}</h3><span class="tiny muted">Newest first</span></div>${state.entries.map(entry=>`<a class="entry-row" href="#entry/${entry.id}">${orb(entry.mood)}<div class="entry-main"><h3>${esc(entry.mood)}</h3><p class="entry-reason">${esc(entry.reasons.join(' · ')||'A moment for yourself')}</p><p class="tiny muted">${dateLabel(entry.time)} · ${timeLabel(entry.time)}</p></div><span class="muted">→</span></a>`).join('')}`:`<div class="empty-state"><h2>A story waiting to begin.</h2><p class="small">Your saved feelings will appear here.</p><button class="primary space" data-action="new-checkin">Make your first check-in</button></div>`}`;
}
function entryPage(id) {
  const entry=state.entries.find(item=>item.id===id);
  if(!entry) return `${intro('YOUR HISTORY','Entry not found.','This entry may belong to another browser.')}<div class="space">${button('Return to history','history')}</div>`;
  return `${intro('A MOMENT YOU NOTICED',esc(entry.mood),`${dateLabel(entry.time)} · ${timeLabel(entry.time)}`)}<div class="panel">${orb(entry.mood)}<hr class="divider"><p class="small">What was on your mind</p><p class="note-body">${esc(entry.reasons.join(' · ')||'No reason selected')}</p><hr class="divider"><p class="small">Your reflection</p><p class="note-body">${esc(entry.notes||'No note added.')}</p></div><div class="stack space">${button('See suggestions for you','suggestions/'+entry.id)}${button('Back to history','history',true)}</div>`;
}
function healthPage() {
  return `${intro('AN OPTIONAL CHECK-IN','A change in<br>your rhythm.','Your sleep and heart-rate readings have changed. Let’s start with how you feel.')}<div class="metrics"><div class="metric"><p class="small">Last night’s sleep</p><strong>5.5 <span>hrs</span></strong><p class="tiny">Usual: 7.0 hrs</p><div class="delta">↓ 1.5 hrs</div></div><div class="metric"><p class="small">Resting heart rate</p><strong>78 <span>bpm</span></strong><p class="tiny">Usual: 68 bpm</p><div class="delta">↑ 10 bpm</div></div></div><div class="panel"><h3>Your feelings come first.</h3><p class="small space-sm">There are many possible reasons for a change. Reflect now, or leave it for another time.</p></div><div class="stack space"><button class="primary" data-action="health-checkin">Check in now</button><button class="secondary" data-action="dismiss-health">Dismiss for now</button></div>`;
}
function supportPage() {
  const spaces=[['common','○○','Common Room','A little company.','Share a moment with your crew. Small conversations can make a long day feel lighter.','Join the crew'],['haven','≈','Haven','A little quiet.','A breathing break or a private reflection. Make space at your own pace.','Find your calm'],['tether','↔','Tether','A little closer to home.','Leave a message for family or friends, across the distance.','Reach home']];
  return `${intro('CONNECTION / CALM / HOME','What would<br>help right now?','You choose the kind of support you need.')}${spaces.map(([route,symbol,title,sub,copy,link])=>`<a class="support-card" href="#${route}"><div class="support-top"><div><h2>${title}</h2><p class="small">${sub}</p></div><span class="support-graphic" aria-hidden="true">${symbol}</span></div><p>${copy}</p><span class="card-link">${link} →</span></a>`).join('')}`;
}
function commonPage() {
  return `${intro('TOGETHER ON THE JOURNEY','A place for<br>your crew.','A hello, a shared song, a moment of company.')}<div class="space">${[...samplePosts,...state.posts].map(post=>`<article class="post"><div class="post-head">${portrait(post.id==='alex'?'alex':post.id==='sam'?'sam':'you')}<div><h3>${esc(post.author)}</h3><p class="tiny">${esc(post.time)}</p></div></div><p>${esc(post.text)}</p><button class="post-like" data-like="${post.id}" aria-pressed="${state.likes.includes(post.id)}">${state.likes.includes(post.id)?'♥ You’re with them':'♡ Send a little support'}</button></article>`).join('')}</div><form id="crew-form" class="compose"><label class="field-label" for="crew-note">Share a moment</label><textarea id="crew-note" maxlength="500" required placeholder="A small win, an invitation, a hello…"></textarea><button class="primary space-sm" type="submit">Post to lounge</button></form>`;
}
function havenPage() {
  return `${intro('A QUIET MOMENT / JUST FOR YOU','Come back<br>to yourself.','No task to finish. Just a little room to breathe.')}<a class="support-card" href="#breathe"><div class="support-top"><div><h2>A breathing break</h2><p class="small">1 minute · At your own pace</p></div><span class="support-graphic" aria-hidden="true">≈</span></div><p>Let the circle guide a gentle rhythm. You can stop whenever you like.</p><span class="card-link">Begin a quiet moment →</span></a><a class="support-card" href="#journal"><div class="support-top"><div><h2>Private reflection</h2><p class="small">A few words, just for you</p></div><span class="support-graphic" aria-hidden="true">✎</span></div><p>What do you need today? Sometimes putting it into words is enough.</p><span class="card-link">Write a thought →</span></a>${state.reflections.length?`<div class="section-heading"><h3>Your reflections</h3><span class="tiny muted">${state.reflections.length} saved</span></div>${state.reflections.map(note=>`<div class="post"><p class="tiny muted">${dateLabel(note.time)} · ${timeLabel(note.time)}</p><p>${esc(note.text)}</p></div>`).join('')}`:''}`;
}
function breathePage() {
  return `${intro('ONE MINUTE / NO PRESSURE','A softer rhythm.','Follow only if it feels comfortable. You can breathe naturally or stop at any time.')}<div class="breath-view"><div class="breath-orbit"><div class="breath-circle" id="breath-circle"><strong id="breath-label">Ready?</strong><span id="breath-count">At your pace</span></div></div><p class="session-info" id="breath-status" role="status">Breathe in gently for 4 seconds, out for 6.</p><button class="primary" data-action="toggle-breath" id="breath-toggle">Begin breathing break</button><a class="text-button" href="#haven">Return to Haven</a></div>`;
}
function journalPage() {
  return `${intro('PRIVATE REFLECTION','What do you<br>need today?','A thought, a small win, something you want to let go of.')}<form class="space" id="journal-form"><label class="field-label" for="journal-note">One thing I noticed…</label><textarea id="journal-note" required maxlength="1000" style="height:220px" placeholder="There is no right way to begin."></textarea><button class="primary space" type="submit">Save reflection</button></form><a class="text-button" href="#haven">Back to Haven</a>`;
}
const contacts={family:{name:'Family',initials:'FA',description:'Your home circle',sample:'Thinking of you today. We saved you a seat at dinner, as always.'},jamie:{name:'Jamie',initials:'JA',description:'A familiar friend',sample:'Saw the moon on my walk home and thought of you. Tell me something from your day when you can.'}};
function tetherPage() {
  return `${intro('ACROSS THE DISTANCE','Still part of<br>each other’s day.','A message doesn’t have to arrive right away to mean something.')}<div class="space">${Object.entries(contacts).map(([id,person])=>{const count=state.messages.filter(m=>m.recipient===id).length;return `<a class="contact-link" href="#conversation/${id}">${portrait(id)}<div><h3>${person.name}</h3><p class="small">${person.description}</p><p class="tiny muted">${count?count+' queued':'A message from home'}</p></div><span class="muted">→</span></a>`;}).join('')}</div><div class="panel"><h3>Connection, without urgency.</h3><p class="small space-sm">Share a little of your day. The people you care about can be part of your story, even across the distance.</p></div>`;
}
function conversationPage(id) {
  const person=contacts[id];
  if(!person) return `${intro('TETHER','Choose a connection.','Select a contact to begin.')}<div class="space">${button('Return to Tether','tether')}</div>`;
  return `<div class="chat-person">${portrait(id)}</div>${intro('TETHER / '+person.description.toUpperCase(),person.name,'A little of your day, whenever you’re ready.')}<div class="bubble">${person.sample}</div><p class="message-meta">Yesterday</p>${state.messages.filter(m=>m.recipient===id).map(m=>`<div class="bubble out">${esc(m.text)}</div><p class="message-meta out">${dateLabel(m.time)} · ${timeLabel(m.time)} · Queued</p>`).join('')}<form id="message-form" class="compose" data-recipient="${id}"><label class="field-label" for="message-note">Something to share</label><textarea id="message-note" maxlength="1000" required placeholder="Something from my day…"></textarea><button class="primary space-sm" type="submit">Queue message</button></form>`;
}
function aboutPage() {
  return `${intro('ABOUT THIS CONCEPT','Care, within<br>your orbit.','A mobile-first wellbeing demo for people living and working away from Earth.')}<ul class="privacy-list"><li>Health readings, crew profiles, contacts, and incoming messages are fictional.</li><li>Entries, reflections, and outgoing messages are saved in this browser’s local storage. They are not uploaded.</li><li>Suggestions are a rule-based demonstration using selected emotions and reasons. No AI API is connected, and notes are not analyzed.</li><li>This is a single-device demo, without authentication, encryption, or real message delivery.</li><li>Clearing browser data removes your saved entries. Different browsers and URLs have separate storage.</li></ul><p class="notice">${storageAvailable?'Browser storage is available.':'Storage is blocked. Entries stay in this tab only.'}</p><div class="space">${button('Back to Home','home',true)}</div>`;
}

function suggestionsPage(id) {
  const entry = id ? state.entries.find(item=>item.id===id) : state.entries[0];
  if(!entry) return intro('YOUR NEXT MOMENT','Let’s start<br>with you.','Check in to find suggestions that fit how you feel.')+'<div class="space">'+button('Choose a feeling','checkin')+'</div>';
  const suggestions=[];
  const tense=moodGroup(entry.mood).color==='stressed';
  const missingHome=entry.mood==='Homesick'||entry.reasons.includes('Missing home');
  const lonely=entry.mood==='Lonely'||entry.reasons.includes('Crew');
  const tired=['Tired','Drained'].includes(entry.mood)||entry.reasons.includes('Sleep');
  if(tense) suggestions.push({title:'A softer rhythm',why:'You chose '+entry.mood.toLowerCase()+'. A quiet pause might be a helpful place to begin.',copy:'Try a gentle one-minute breathing break, only if it feels comfortable.',route:'breathe',action:'Start a breathing break',symbol:'≈'});
  if(missingHome) suggestions.push({title:'A little closer to home',why:'You mentioned missing home.',copy:'Share one small moment from your day with someone familiar. There’s no need for an immediate reply.',route:'tether',action:'Open Tether',symbol:'↔'});
  if(lonely) suggestions.push({title:'A little company',why:entry.mood==='Lonely'?'You chose lonely.':'Your crew is on your mind.',copy:'Drop into the Common Room. A hello or a shared moment can be a small next step.',route:'common',action:'Visit Common Room',symbol:'○○'});
  if(tired) suggestions.push({title:'Make space for what you need',why:entry.reasons.includes('Sleep')?'You mentioned sleep.':'You chose '+entry.mood.toLowerCase()+'.',copy:'Take a quiet moment to reflect on what would feel supportive today.',route:'journal',action:'Reflect in Haven',symbol:'✎'});
  if(!suggestions.length) suggestions.push({title:moodGroup(entry.mood).color==='joyful'?'Keep a small good thing':'Notice this moment',why:'You chose '+entry.mood.toLowerCase()+'.',copy:'Write down what is helping, or something you want to remember from today.',route:'journal',action:'Write a reflection',symbol:'✎'});
  if(suggestions.length===1) suggestions.push({title:'Choose your own space',why:'You know what feels right for you.',copy:'Explore connection, quiet, or a familiar voice. You can also leave this for later.',route:'support',action:'Explore Support',symbol:'○'});
  return intro('SUGGESTED FOR YOU','One small<br>next step.','Based on what you shared, here are a few options. You choose what comes next.')+
    '<div class="panel"><div class="mood-row" style="margin-bottom:0">'+orb(entry.mood)+'<div><p class="tiny">Your check-in</p><h2>'+esc(entry.mood)+'</h2><p class="small">'+esc(entry.reasons.join(' · ')||'A moment for yourself')+'</p></div></div>'+(entry.source==='health'?'<hr class="divider"><p class="small">You checked in after a change in sleep and heart-rate readings. Those changes alone don’t tell us how you feel.</p>':'')+'</div>'+
    suggestions.map(item=>'<div class="support-card"><div class="support-top"><h2>'+item.title+'</h2><span class="support-graphic" aria-hidden="true">'+item.symbol+'</span></div><p>'+esc(item.why)+'</p><p>'+item.copy+'</p><a class="primary space" href="#'+item.route+'">'+item.action+' →</a></div>').join('')+
    '<a class="secondary space" href="#home">Not now · Return Home</a>';
}

const routes={suggestions:['Suggestions',['Your check-in','saved'],'support',suggestionsPage],home:['Home',null,'home',homePage],checkin:['Emotion Check-in',['Home','home'],'checkin',checkinPage],reflection:['Your reflection',['Feelings','checkin'],'checkin',reflectionPage],review:['Review check-in',['Edit','reflection'],'checkin',reviewPage],saved:['Check-in saved',null,'checkin',savedPage],history:['Your history',['Home','home'],'history',historyPage],entry:['Your check-in',['History','history'],'history',entryPage],health:['Wellbeing prompt',['Home','home'],'home',healthPage],support:['Support Hub',null,'support',supportPage],common:['Common Room',['Support','support'],'support',commonPage],haven:['Haven',['Support','support'],'support',havenPage],breathe:['Breathing break',['Haven','haven'],'support',breathePage],journal:['Private reflection',['Haven','haven'],'support',journalPage],tether:['Tether',['Support','support'],'support',tetherPage],conversation:['Your connection',['Tether','tether'],'support',conversationPage],about:['About',['Home','home'],'home',aboutPage]};
function navigate(route) { if(location.hash==='#'+route) render(); else location.hash=route; }
function stopBreathing() {clearInterval(timer);timer=null;breath.running=false;}
function render() {
  stopBreathing();
  const [name,id]=(location.hash.slice(1)||'home').split('/');
  const route=routes[name]||routes.home;
  shell(route[0],route[1],route[2]); app.innerHTML=route[3](id);app.dataset.page=routes[name]?name:'home';document.title=route[0]+' · ORBIT CARE';
  if(name==='breathe') breath={running:false,elapsed:0,complete:false};
  window.scrollTo({top:0,behavior:'instant'});app.focus({preventScroll:true});
}
function updateBreathing() {
  const circle=document.getElementById('breath-circle'); if(!circle)return;
  const position=breath.elapsed%10;const inhale=position<4;
  circle.className='breath-circle '+(breath.running?(inhale?'inhale':'exhale'):'');
  document.getElementById('breath-label').textContent=breath.complete?'Well done.':(breath.running?(inhale?'Breathe in':'Breathe out'):'Paused');
  document.getElementById('breath-count').textContent=breath.complete?'A moment for you':(breath.running?String(inhale?4-position:10-position):'Take your time');
  document.getElementById('breath-status').textContent=breath.complete?'One minute of space. Return whenever you need.':`${breath.elapsed} / 60 seconds · ${breath.running?'A gentle rhythm.':'Continue when you’re ready.'}`;
  document.getElementById('breath-toggle').textContent=breath.complete?'Begin again':(breath.running?'Pause breathing break':(breath.elapsed?'Continue breathing break':'Begin breathing break'));
}
app.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.dataset.mood){draft.mood=target.dataset.mood;app.querySelectorAll('[data-mood]').forEach(el=>el.setAttribute('aria-pressed',String(el===target)));document.getElementById('selected-mood').textContent='Selected: '+draft.mood;document.getElementById('mood-continue').disabled=false;}
  if(target.dataset.reason){const reason=target.dataset.reason;draft.reasons=draft.reasons.includes(reason)?draft.reasons.filter(r=>r!==reason):[...draft.reasons,reason];target.setAttribute('aria-pressed',String(draft.reasons.includes(reason)));}
  if(target.dataset.like){const id=target.dataset.like;state.likes=state.likes.includes(id)?state.likes.filter(item=>item!==id):[...state.likes,id];persist();target.setAttribute('aria-pressed',String(state.likes.includes(id)));target.textContent=state.likes.includes(id)?'♥ You’re with them':'♡ Send a little support';}
  switch(target.dataset.action){
    case 'new-checkin':draft={mood:'',reasons:[],notes:'',source:'manual'};navigate('checkin');break;
    case 'health-checkin':draft={mood:'',reasons:[],notes:'',source:'health'};navigate('checkin');break;
    case 'continue-mood':if(draft.mood)navigate('reflection');break;
    case 'save-checkin':if(draft.mood){target.disabled=true;const entry={...draft,reasons:[...draft.reasons],time:Date.now(),id:uid()};state.entries.unshift(entry);lastSavedId=entry.id;draft={mood:'',reasons:[],notes:''};persist();navigate('saved');}break;
    case 'dismiss-health':state.dismissed=true;persist();navigate('home');toast('Prompt dismissed. You can revisit it anytime.');break;
    case 'toggle-breath':if(breath.running){stopBreathing();updateBreathing();}else{if(breath.complete)breath={running:false,elapsed:0,complete:false};breath.running=true;updateBreathing();timer=setInterval(()=>{breath.elapsed++;if(breath.elapsed>=60){stopBreathing();breath.complete=true;}updateBreathing();},1000);}break;
  }
});
app.addEventListener('input',event=>{if(event.target.id==='checkin-note'){draft.notes=event.target.value;document.getElementById('note-count').textContent=draft.notes.length+' / 500';}});
app.addEventListener('submit',event=>{
  event.preventDefault();const form=event.target;
  if(form.id==='reflection-form'){draft.notes=document.getElementById('checkin-note').value.trim();navigate('review');}
  if(form.id==='crew-form'){const text=document.getElementById('crew-note').value.trim();if(!text){toast('Add a few words first.');return;}state.posts.push({id:uid(),author:'You',initials:'YOU',text,time:dateLabel(Date.now())+' · '+timeLabel(Date.now())});persist();render();toast('Posted to the lounge.');}
  if(form.id==='journal-form'){const text=document.getElementById('journal-note').value.trim();if(!text){toast('Add a thought before saving.');return;}state.reflections.unshift({id:uid(),time:Date.now(),text});persist();navigate('haven');toast('Reflection saved on this browser.');}
  if(form.id==='message-form'){const text=document.getElementById('message-note').value.trim();if(!text){toast('Add a message first.');return;}state.messages.push({id:uid(),recipient:form.dataset.recipient,time:Date.now(),text});persist();render();toast('Message queued.');}
});
window.addEventListener('hashchange',render);
render();

