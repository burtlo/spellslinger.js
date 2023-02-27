(function(t,u){typeof exports=="object"&&typeof module<"u"?u(exports,require("axios")):typeof define=="function"&&define.amd?define(["exports","axios"],u):(t=typeof globalThis<"u"?globalThis:t||self,u(t.Scryfall={},t.Axios))})(this,function(t,u){"use strict";class j{static byId(e){return{id:e}}static byIllustrationId(e){return{illustration_id:e}}static byMtgoId(e){return{mtgo_id:e}}static byMultiverseId(e){return{multiverse_id:e}}static byName(e,a){return a?{name:e,set:a}:{name:e}}static byOracleId(e){return{oracle_id:e}}static bySet(e,a){return{collector_number:`${a}`,set:e}}}class A{constructor(e,a,n,i){this.q=e,this.apiPath=a,this.query=n,this.post=i,this._hasMore=!0,this._count=0}_count;_hasMore;get count(){return this._count}get hasMore(){return this._hasMore}async all(){const e=[];for(;this._hasMore;){const a=await this.next();e.push(...a)}return e}async get(e){const a=[];for(;this._hasMore;){const n=await this.next();if(a.push(...n),a.length===e)return a;if(a.length>e)return a.slice(0,e)}return a}async next(){const e=await this.q.query(this.apiPath,this.query,this.post);return this._hasMore=e?.has_more??!1,this._count=Number.parseInt(`${e?.total_cards??0}`,10),this._hasMore&&this.setNextPage(),e?.data??[]}async page(e){return this.query.page=e,this.next()}setNextPage(){this.query.page=this.query.page+1}}class h extends Error{constructor(e){super(typeof e=="string"?e:e?.details),this.data=e,Object.setPrototypeOf(this,h.prototype)}}class r{static retry={attempts:1};static endpoint="https://api.scryfall.com";static lastQuery=100;static rateLimit=100;static canRetry(e){return typeof e=="string"||e?.code==="not_found"||e?.code==="bad_request"?!1:!r.retry.canRetry||r.retry.canRetry(e)}static async debounce(){const e=Date.now(),a=e-r.lastQuery;if(a>=r.rateLimit)r.lastQuery=e;else{const n=r.rateLimit-a;r.lastQuery+=n,await r.sleep(n)}}static async sleep(e=0){return new Promise(a=>{setTimeout(a,e)})}static async tryQuery(e,a,n,i){await r.debounce();const c={data:n,method:n?"POST":"GET",params:a,url:`${r.endpoint}/${e}`,headers:{"Accept-Encoding":"gzip,deflate,compress"},...i};try{return await u.request(c)}catch(l){if(l.isAxiosError){const d=l;throw new h(d.response?.data??d.message)}else throw l}}async query(e,a,n,i){let c="";typeof e=="number"||typeof e=="string"?c=e:e&&(c=e.join("/"));let l,d;for(l=0;l<r.retry.attempts;l++){let z;try{d=await r.tryQuery(`${c}`,a,n,i)}catch(g){if(g instanceof h)z=g.data;else throw g}if(d||!r.canRetry(z))break;await r.sleep(r.retry.timeout)}return d?.data}}class O extends r{async autoCompleteName(e){return(await this.query("cards/autocomplete",{q:e}))?.data??[]}async byArenaId(e){return this.query(["cards/arena",e])}async byId(e){return this.query(["cards",e])}async byMtgoId(e){return this.query(["cards/mtgo",e])}async byMultiverseId(e){return this.query(["cards/multiverse",e])}async byName(e,a,n=!1){let i=n,c=a;return typeof a=="boolean"&&(i=a,c=void 0),this.query("cards/named",{[i?"fuzzy":"exact"]:e,set:c})}async bySet(e,a,n){const i=["cards",e,a];return n&&i.push(n),this.query(i)}async byTcgPlayerId(e){return this.query(["cards/tcgplayer",e])}async collection(...e){const a=[];for(let n=0;n<e.length;n+=75){const i={identifiers:e.slice(n,n+75)},c=await this.query("cards/collection",void 0,i);a.push(...c?.data??[])}return a}async random(){return this.query("cards/random")}search(e,a){return new A(this,"cards/search",{q:e,...typeof a=="number"?{page:a}:{page:1,...a}})}}const M=new O;class p extends r{async artifactTypes(){return(await this.query("catalog/artifact-types"))?.data??[]}async artistNames(){return(await this.query("catalog/artist-names"))?.data??[]}async cardNames(){return(await this.query("catalog/card-names"))?.data??[]}async creatureTypes(){return(await this.query("catalog/creature-types"))?.data??[]}async enchantmentTypes(){return(await this.query("catalog/enchantment-types"))?.data??[]}async landTypes(){return(await this.query("catalog/land-types"))?.data??[]}async loyalties(){return(await this.query("catalog/loyalties"))?.data??[]}async planeswalkerTypes(){return(await this.query("catalog/planeswalker-types"))?.data??[]}async powers(){return(await this.query("catalog/powers"))?.data??[]}async spellTypes(){return(await this.query("catalog/spell-types"))?.data??[]}async toughnesses(){return(await this.query("catalog/toughnesses"))?.data??[]}async watermarks(){return(await this.query("catalog/watermarks"))?.data??[]}async wordBank(){return(await this.query("catalog/word-bank"))?.data??[]}}const H=new p;class J extends r{async byArenaId(e){return(await this.query(["cards/arena",e,"rulings"]))?.data??[]}async byId(e){return(await this.query(["cards",e,"rulings"]))?.data??[]}async byMtgoId(e){return(await this.query(["cards/mtgo",e,"rulings"]))?.data??[]}async byMultiverseId(e){return(await this.query(["cards/multiverse",e,"rulings"]))?.data??[]}async bySet(e,a){return(await this.query(["cards",e,`${a}`,"rulings"]))?.data??[]}}const K=new J;class V extends r{async all(){return(await this.query("sets"))?.data??[]}async byCode(e){return await this.query(["sets",e])}async byId(e){return this.query(["sets",e])}async byTcgPlayerId(e){return this.query(["sets/tcgplayer",e])}}const W=new V;class X extends r{async all(){return(await this.query("symbology"))?.data??[]}async parseMana(e){return await this.query("symbology/parse-mana",{cost:e})}}const Y=new X;var w=(s=>(s[s.black=0]="black",s[s.borderless=1]="borderless",s[s.gold=2]="gold",s[s.silver=3]="silver",s[s.white=4]="white",s))(w||{}),o=(s=>(s[s.oracle_cards=0]="oracle_cards",s[s.unique_artwork=1]="unique_artwork",s[s.default_cards=2]="default_cards",s[s.all_cards=3]="all_cards",s[s.rulings=4]="rulings",s))(o||{}),b=(s=>(s[s.standard=0]="standard",s[s.future=1]="future",s[s.historic=2]="historic",s[s.pioneer=3]="pioneer",s[s.modern=4]="modern",s[s.legacy=5]="legacy",s[s.pauper=6]="pauper",s[s.vintage=7]="vintage",s[s.penny=8]="penny",s[s.commander=9]="commander",s[s.brawl=10]="brawl",s[s.duel=11]="duel",s[s.oldschool=12]="oldschool",s))(b||{}),v=(s=>(s[s.legendary=0]="legendary",s[s.miracle=1]="miracle",s[s.nyxtouched=2]="nyxtouched",s[s.draft=3]="draft",s[s.devoid=4]="devoid",s[s.tombstone=5]="tombstone",s[s.colorshifted=6]="colorshifted",s[s.inverted=7]="inverted",s[s.sunmoondfc=8]="sunmoondfc",s[s.compasslanddfc=9]="compasslanddfc",s[s.originpwdfc=10]="originpwdfc",s[s.mooneldrazidfc=11]="mooneldrazidfc",s[s.moonreversemoondfc=12]="moonreversemoondfc",s[s.showcase=13]="showcase",s[s.extendedart=14]="extendedart",s))(v||{}),q=(s=>(s[s.paper=0]="paper",s[s.arena=1]="arena",s[s.mtgo=2]="mtgo",s))(q||{}),_=(s=>(s[s.normal=0]="normal",s[s.split=1]="split",s[s.flip=2]="flip",s[s.transform=3]="transform",s[s.modal_dfc=4]="modal_dfc",s[s.meld=5]="meld",s[s.leveler=6]="leveler",s[s.class=7]="class",s[s.saga=8]="saga",s[s.adventure=9]="adventure",s[s.planar=10]="planar",s[s.scheme=11]="scheme",s[s.vanguard=12]="vanguard",s[s.token=13]="token",s[s.double_faced_token=14]="double_faced_token",s[s.emblem=15]="emblem",s[s.augment=16]="augment",s[s.host=17]="host",s[s.art_series=18]="art_series",s[s.reversible_card=19]="reversible_card",s))(_||{}),f=(s=>(s[s.legal=0]="legal",s[s.not_legal=1]="not_legal",s[s.restricted=2]="restricted",s[s.banned=3]="banned",s))(f||{}),y=(s=>(s[s.tourney=0]="tourney",s[s.prerelease=1]="prerelease",s[s.datestamped=2]="datestamped",s[s.planeswalkerdeck=3]="planeswalkerdeck",s[s.buyabox=4]="buyabox",s[s.judgegift=5]="judgegift",s[s.event=6]="event",s[s.convention=7]="convention",s[s.starterdeck=8]="starterdeck",s[s.instore=9]="instore",s[s.setpromo=10]="setpromo",s[s.fnm=11]="fnm",s[s.openhouse=12]="openhouse",s[s.league=13]="league",s[s.draftweekend=14]="draftweekend",s[s.gameday=15]="gameday",s[s.release=16]="release",s[s.intropack=17]="intropack",s[s.giftbox=18]="giftbox",s[s.duels=19]="duels",s[s.wizardsplaynetwork=20]="wizardsplaynetwork",s[s.premiereshop=21]="premiereshop",s[s.playerrewards=22]="playerrewards",s[s.gateway=23]="gateway",s[s.arenaleague=24]="arenaleague",s))(y||{}),m=(s=>(s[s.common=0]="common",s[s.uncommon=1]="uncommon",s[s.rare=2]="rare",s[s.mythic=3]="mythic",s))(m||{}),k=(s=>(s[s.token=0]="token",s[s.meld_part=1]="meld_part",s[s.meld_result=2]="meld_result",s[s.combo_piece=3]="combo_piece",s))(k||{}),I=(s=>(s[s.core=0]="core",s[s.expansion=1]="expansion",s[s.masters=2]="masters",s[s.masterpiece=3]="masterpiece",s[s.from_the_vault=4]="from_the_vault",s[s.spellbook=5]="spellbook",s[s.premium_deck=6]="premium_deck",s[s.duel_deck=7]="duel_deck",s[s.draft_innovation=8]="draft_innovation",s[s.treasure_chest=9]="treasure_chest",s[s.commander=10]="commander",s[s.planechase=11]="planechase",s[s.archenemy=12]="archenemy",s[s.vanguard=13]="vanguard",s[s.funny=14]="funny",s[s.starter=15]="starter",s[s.box=16]="box",s[s.promo=17]="promo",s[s.token=18]="token",s[s.memorabilia=19]="memorabilia",s[s.alchemy=20]="alchemy",s[s.arsenal=21]="arsenal",s))(I||{}),x=(s=>(s[s.name=0]="name",s[s.set=1]="set",s[s.released=2]="released",s[s.rarity=3]="rarity",s[s.color=4]="color",s[s.usd=5]="usd",s[s.tix=6]="tix",s[s.eur=7]="eur",s[s.cmc=8]="cmc",s[s.power=9]="power",s[s.toughness=10]="toughness",s[s.edhrec=11]="edhrec",s[s.artist=12]="artist",s))(x||{}),$=(s=>(s[s.auto=0]="auto",s[s.asc=1]="asc",s[s.desc=2]="desc",s))($||{}),N=(s=>(s[s.cards=0]="cards",s[s.art=1]="art",s[s.prints=2]="prints",s))(N||{});t.Border=w,t.BulkDataTypes=o,t.CardIdentifierBuilder=j,t.Cards=M,t.Catalog=H,t.Format=b,t.FrameEffect=v,t.Game=q,t.Layout=_,t.Legality=f,t.MagicQueryError=h,t.PromoType=y,t.Rarity=m,t.RelatedCardComponent=k,t.Rulings=K,t.SetType=I,t.Sets=W,t.Sort=x,t.SortDirection=$,t.Symbology=Y,t.UniqueStrategy=N,Object.defineProperty(t,Symbol.toStringTag,{value:"Module"})});