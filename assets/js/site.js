
/* Tema guardado: MUY OSCURO comparte CSS con Oscuro y cambia el lema. */
const themeMode=document.getElementById('theme-mode');
const brandTagline=document.getElementById('brand-tagline');
const veryDarkNote=document.getElementById('very-dark-note');
const DEFAULT_TAGLINE='PEOR QUE EL DESCAMPAO, MEJOR QUE TELECINCO';
const VERY_DARK_TAGLINE='PODCAST RIGUROSAMENTE CENSURADO POR VOX';
function setTheme(mode){
  if(!['light','dark','very-dark'].includes(mode))mode='light';
  document.documentElement.dataset.theme=mode;
  themeMode.value=mode;
  brandTagline.textContent=mode==='very-dark'?VERY_DARK_TAGLINE:DEFAULT_TAGLINE;
  veryDarkNote.hidden=mode!=='very-dark';
  document.querySelector('meta[name="theme-color"]').content=mode==='dark'?'#17191d':'#faf9f7';
  try{localStorage.setItem('hdp-theme-mode',mode)}catch(e){}
}
let savedTheme='light';
try{savedTheme=localStorage.getItem('hdp-theme-mode')||'light'}catch(e){}
setTheme(savedTheme);
themeMode.addEventListener('change',()=>setTheme(themeMode.value));

const menuButton=document.getElementById('menu-toggle'),menuNav=document.getElementById('site-nav');
menuButton.addEventListener('click',()=>{const open=menuNav.classList.toggle('is-open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');menuButton.textContent=open?'✕':'☰'});
menuNav.addEventListener('click',ev=>{if(ev.target.closest('a')){menuNav.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Abrir menú');menuButton.textContent='☰'}});
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let episodes=[],config={},page=1,filtered=[],previousId=null;const PAGE_SIZE=12;
const dateLabel=s=>s?new Date(s).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}):'';
const excerpt=(s,n=250)=>s.length>n?s.slice(0,n).trim()+'…':s;
function effectiveCategories(e){const override=config.categoryOverrides?.[e.id];if(override)return Array.isArray(override)?override:[override];return e.categories||[e.category||'Otros']}
function effectiveCategory(e){return effectiveCategories(e).join(' · ')}
function episodeTags(e){return `<div class="episode-tags">${effectiveCategories(e).map(c=>`<span class="pill" data-category="${esc(c)}">${esc(c)}</span>`).join('')}${e.season?`<span class="pill season-pill">T${esc(e.season)}</span>`:''}</div>`}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
const LOCAL_ICONS={'iVoox':'assets/ivoox.svg','Amazon Music':'assets/amazon-music.svg','Podimo':'assets/podimo.svg'};
const ICONS={'iVoox':'ivoox','YouTube':'youtube','Spotify':'spotify','Amazon Music':'amazonmusic','Apple Podcasts':'applepodcasts','Podimo':'podimo','X':'x','Bluesky':'bluesky'};
function platformIcon(name){const src=LOCAL_ICONS[name]|| (ICONS[name]?`https://cdn.jsdelivr.net/npm/simple-icons@v15/icons/${ICONS[name]}.svg`:null);return src?`<img src="${esc(src)}" alt="" loading="lazy" onerror="this.style.display='none'">`:''}
function platformLink(name,url,label){if(!/^https:\/\//.test(url||''))return '';return `<a class="platform-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(label||name)}">${platformIcon(name)}<span>${esc(name)}</span></a>`}
function socialIconLink(name,url){if(!/^https:\/\//.test(url||''))return '';return `<a class="footer-social-icon" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="Seguir HdP en ${esc(name)}" title="${esc(name)}">${platformIcon(name)}</a>`}
function platforms(e){
 if(!e){return Object.entries(config.platforms||{}).filter(([name,url])=>/^https:\/\//.test(url)).map(([name,url])=>[name,url]);}
 const list=[];
 if(e.ivoox)list.push(['iVoox',e.ivoox]);
 if(e.spotify)list.push(['Spotify',e.spotify]);
 if(Number(e.season)>=4&&e.youtube)list.push(['YouTube',e.youtube]);
 return list;
}
function links(e){return platforms(e).map(([name,url])=>platformLink(name,url,'Escuchar este episodio en '+name)).join('')}
function feature(e){if(!e)return '<p class="status">No hay episodios disponibles.</p>';return `<button type="button" class="episode-image-button" data-open="${esc(e.id)}" aria-label="Ver ficha de ${esc(e.title)}"><img loading="lazy" src="${esc(e.image)}" alt="Portada de ${esc(e.title)}"></button><div class="feature-copy">${episodeTags(e)}<h3>${esc(e.title)}</h3><span class="meta">${dateLabel(e.date)}${e.duration?' · '+esc(e.duration):''}</span><p>${esc(excerpt(e.description,440))}</p><div class="actions"><button class="btn" data-open="${esc(e.id)}">Ver ficha</button></div></div>`}
const classicRecommendationIds = new Set(["https://www.ivoox.com/94015312", "https://www.ivoox.com/94337649", "https://www.ivoox.com/96243046", "https://www.ivoox.com/98861484", "https://www.ivoox.com/99983994", "https://www.ivoox.com/101802831", "https://www.ivoox.com/102896176", "https://www.ivoox.com/104017979", "https://www.ivoox.com/105146677", "https://www.ivoox.com/106138799", "https://www.ivoox.com/110076454", "https://www.ivoox.com/110577811", "https://www.ivoox.com/116839457", "https://www.ivoox.com/118517709", "https://www.ivoox.com/134333967", "https://www.ivoox.com/134334709"]);
function recommendationPool(){const current=episodes.filter(e=>Number.isInteger(e.season)&&e.season>=4&&!config.excludedRecommendationIds?.includes(e.id));const curated=current.filter(e=>config.featuredIds?.includes(e.id));const classics=episodes.filter(e=>classicRecommendationIds.has(e.id)&&!config.excludedRecommendationIds?.includes(e.id));return [...(curated.length?curated:current),...classics].filter(e=>e.id!==episodes[0]?.id)}
const recommendationStorageKey='hdp-recommendation-cycle-v1';
let recommendationState={seen:[],last:null};
function readRecommendationState(){try{const saved=JSON.parse(localStorage.getItem(recommendationStorageKey));if(saved&&Array.isArray(saved.seen))recommendationState={seen:saved.seen.filter(id=>typeof id==='string'),last:typeof saved.last==='string'?saved.last:null}}catch(e){}return recommendationState}
function recommendAnother(){const pool=recommendationPool();if(!pool.length){$('recommended').innerHTML='<p class="status">No hay episodios elegibles.</p>';return}const state=readRecommendationState();const eligible=new Set(pool.map(e=>e.id));let seen=new Set(state.seen.filter(id=>eligible.has(id)));let candidates=pool.filter(e=>!seen.has(e.id));if(!candidates.length){seen=new Set();candidates=pool}if(candidates.length>1)candidates=candidates.filter(e=>e.id!==state.last);const chosen=candidates[Math.floor(Math.random()*candidates.length)];seen.add(chosen.id);previousId=chosen.id;recommendationState={seen:[...seen],last:chosen.id};try{localStorage.setItem(recommendationStorageKey,JSON.stringify(recommendationState))}catch(e){}$('recommended').innerHTML=feature(chosen)}
function renderFeatures(){ $('latest').innerHTML=feature(episodes[0]);recommendAnother()}
function showDetail(e){if(!e)return;$('detail-img').src=e.image;$('detail-img').alt='Portada de '+e.title;$('detail-title').textContent=e.title;$('detail-meta').textContent=[e.season?'Temporada '+e.season:'',e.programType,e.historicalSection?'Sección: '+e.historicalSection:'',dateLabel(e.date),e.duration].filter(Boolean).join(' · ');$('detail-desc').textContent=e.description;$('detail-links').innerHTML=links(e);$('details').showModal()}
const fallbackSections=new Set(['Billy de 40','Recordmendaciones','Macedonia de Legumbres','Recuento de Bajas','Tu Vicio a Juicio','Pulsiones Anuales']);
const isFallback=e=>fallbackSections.has(e.historicalSection)||['Lo mejor del año','Entrevistas'].includes(e.programType);
const sectionAliases=new Map(Object.entries({'billy de 40':'Billy de 40','bili de 40':'Billy de 40','recordmendaciones':'Recordmendaciones','macedonia de legumbres':'Macedonia de Legumbres','recuento de bajas':'Recuento de Bajas','tu vicio a juicio':'Tu Vicio a Juicio','entrevista':'Tu Vicio a Juicio','entrevistas':'Tu Vicio a Juicio','pulsiones anuales':'Pulsiones Anuales','lo mejor del ano':'Lo mejor del año'}));
function searchNormalize(s){return norm(s).replace(/[^a-z0-9]+/g,' ').trim().replace(/\bspider\s*man\b/g,'spiderman').replace(/\bobi\s*wan\b/g,'obiwan').replace(/\b(?:zombies?|zombis?)\b/g,'zombi')}
function searchTokens(s){return searchNormalize(s).split(/\s+/).filter(Boolean)}
function tokenSet(s){return new Set(searchTokens(s))}
function searchMatch(tokens,s){const set=tokenSet(s);return tokens.every(t=>set.has(t))}
function searchRank(e,tokens,q){const title=searchNormalize(e.title),primary=(e.searchKeywords||[]).join(' '),secondary=(e.searchSecondaryKeywords||[]).join(' ');if(!searchMatch(tokens,[title,primary,secondary].join(' ')))return null;const ts=tokenSet(title),ps=tokenSet(primary);const focused=searchMatch(tokens,title+' '+primary);const tier=e.programType==='Monográficos'?0:e.programType==='Plan editorial'?1:focused?2:3;let score=tokens.reduce((n,t)=>n+(ts.has(t)?100:ps.has(t)?60:20),0);if((' '+title+' ').includes(' '+q+' '))score+=80;if((e.searchKeywords||[]).some(k=>searchNormalize(k)===q))score+=30;return {e,tier,score}}
const categoryAliases=new Map(Object.entries({'comic':'Cómic','comics':'Cómic','cine':'Cine','serie':'Series','series':'Series','videojuego':'Videojuegos','videojuegos':'Videojuegos','libro':'Libros','libros':'Libros','otros':'Otros'}));
const archiveTypeOrder=new Map(['Monográficos','Plan editorial','Lo mejor del año','Tertulias','Magazine','Entrevistas'].map((t,i)=>[t,i]));
function recentFirst(a,b){return Number(b.season||0)-Number(a.season||0)||String(b.date).localeCompare(String(a.date))}
function archiveOrder(pool){return [...pool].sort((a,b)=>(archiveTypeOrder.get(a.programType)??99)-(archiveTypeOrder.get(b.programType)??99)||recentFirst(a,b))}
function archiveResults(pool,raw,hasFilters){const category=categoryAliases.get(searchNormalize(raw));if(category)return archiveOrder(pool.filter(e=>effectiveCategories(e).includes(category)));if(!searchTokens(raw).length)return hasFilters?archiveOrder(pool):pool;return searchEpisodes(pool,raw)}
function searchEpisodes(pool,raw){const q=searchNormalize(raw),tokens=searchTokens(raw);if(!tokens.length)return pool;const section=sectionAliases.get(q);if(section)return pool.filter(e=>section==='Lo mejor del año'?e.programType===section:e.historicalSection===section);const ranked=pool.filter(e=>!isFallback(e)).map(e=>searchRank(e,tokens,q)).filter(Boolean).sort((a,b)=>a.tier-b.tier||Number(b.e.season)-Number(a.e.season)||String(b.e.date).localeCompare(String(a.e.date))||b.score-a.score);if(ranked.length)return ranked.map(x=>x.e);return archiveOrder(pool.filter(e=>isFallback(e)&&searchMatch(tokens,[e.title,e.description].join(' '))))}
function renderCards(){const cat=$('category').value,typ=$('program-type').value,season=$('season').value;const pool=episodes.filter(e=>(!cat||effectiveCategories(e).includes(cat))&&(!typ||e.programType===typ)&&(!season||String(e.season)===season));filtered=archiveResults(pool,$('search').value,Boolean(cat||typ||season));const total=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));page=Math.min(page,total);$('count').textContent=`${filtered.length} de ${episodes.length} programas`;$('page').textContent=`Página ${page} de ${total}`;$('prev').disabled=page<=1;$('next').disabled=page>=total;$('empty').hidden=filtered.length>0;$('cards').innerHTML=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE).map(e=>`<article class="card"><button type="button" class="episode-image-button" data-open="${esc(e.id)}" aria-label="Ver ficha de ${esc(e.title)}"><img loading="lazy" src="${esc(e.image)}" alt="Portada de ${esc(e.title)}"></button><div class="info">${episodeTags(e)}<h3>${esc(e.title)}</h3><div class="bottom"><span class="meta">${dateLabel(e.date)}</span><button class="text-link" data-open="${esc(e.id)}">Ver ficha</button></div></div></article>`).join('')}
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-open]');if(b)showDetail(episodes.find(e=>e.id===b.dataset.open))});$('shuffle').addEventListener('click',recommendAnother);$('close').onclick=()=>$('details').close();$('details').addEventListener('click',e=>{if(e.target===$('details'))$('details').close()});for(const id of ['search','category','program-type','season'])$(id).addEventListener(id==='search'?'input':'change',()=>{page=1;renderCards()});$('prev').onclick=()=>{if(page>1){page--;renderCards();$('programas').scrollIntoView()}};$('next').onclick=()=>{if(page*PAGE_SIZE<filtered.length){page++;renderCards();$('programas').scrollIntoView()}};
(async()=>{try{const local=location.protocol==='file:';const fallback=window.HDP_LOCAL_DATA;const load=async(path,key)=>{if(local)return fallback[key];try{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const value=await r.json();if(key==='episodes'&&value.searchRevision!=='1.0.3')throw Error('Revisión de catálogo incompatible');return value}catch(err){console.warn('Se utiliza el catálogo local de respaldo:',path,err);return fallback[key]}};const [data,settings]=await Promise.all([load('episodes.json?v=103','episodes'),load('config.json','config')]);if(data.searchRevision!=='1.0.3')throw Error('Catálogo desactualizado: recarga la página.');episodes=data.episodes||[];config=settings;const seasons=[...new Set(episodes.map(e=>e.season).filter(Number.isInteger))].sort((a,b)=>b-a);for(const s of seasons){const o=document.createElement('option');o.value=s;o.textContent='Temporada '+s;$('season').append(o)};$('listen-links').innerHTML=platforms(null).map(([name,url])=>platformLink(name,url,'Escuchar HdP en '+name)).join('');$('social-links').innerHTML=Object.entries(config.social||{}).filter(([name])=>name==='X'||name==='Bluesky').map(([name,url])=>socialIconLink(name,url)).join('');renderFeatures();renderCards()}catch(e){$('latest').textContent='No se ha podido cargar el catálogo. Abre la web desde un servidor HTTP o GitHub Pages.';$('recommended').textContent='Catálogo no disponible.';$('cards').textContent=e.message;console.error(e)}})();
