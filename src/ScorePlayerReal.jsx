import React, { useState, useEffect, useRef } from 'react';


    


const STORAGE_KEY = "guda_config_v3";
const ADMIN_PASS = "1919";
const GUEST_PASS = "1017";
const INSTRUCTOR_PASS = "2525";
const INSTRUCTORS = ["Yamashita Noriko", "hiroko", "灯音(to•o•n)"];
const SONGS = ["蒼〜aoi〜","iridescence","艶麗〜enrei〜","NoStAlGiE","heart beat of L**E","dreamy EYES","春ノ舞","秋霖〜shuhrin〜","water lily〜水面〜","めぐみの空","holy child","water lily","Re:Grace","添音〜embrace〜","祈音〜Inorion〜","fare well"];
const WEEKDAYS2 = ["日","月","火","水","木","金","土"];
const CSV_URL = "/api/gas";

const BADGE_IMAGES = {
  "種": "https://gudadrum-portal.vercel.app/badge_種.png",
  "蕾": "https://gudadrum-portal.vercel.app/badge_蕾.png",
  "若幹": "https://gudadrum-portal.vercel.app/badge_若幹.png",
  "主幹": "https://gudadrum-portal.vercel.app/badge_主幹.png",
  "若柱": "https://gudadrum-portal.vercel.app/badge_若柱.png",
  "主柱": "https://gudadrum-portal.vercel.app/badge_主柱.png",
  "大黒柱": "https://gudadrum-portal.vercel.app/badge_大黒柱.png",
  "幹": "https://gudadrum-portal.vercel.app/badge_幹.png",
  "柱": "https://gudadrum-portal.vercel.app/badge_柱.png",
};

const LEVEL_COLOR = "#f0e0a0";
const LEVEL_ORDER = ["大黒柱","主柱","若柱","主幹","若幹","蕾","種"];

const CURRICULUM = [
  { title:"グーダドラムの基礎「響かせる」", url:"https://www.gudadrumjapan.com/kyzkmtm", password:"gdrmtd26" },
  { title:"リズムの基礎⑴「リズムを知る」", links:[{label:"座学編動画のまとめ",url:"https://www.gudadrumjapan.com/kyzrhmtm",password:"rhtmgdrm#mtm26"},{label:"実践編動画のまとめ",url:"https://www.gudadrumjapan.com/kyzrhmtmjs",password:"rhtmgdrm#mtm26"}] },
  { title:"リズムの基礎⑵「リズムを感じる」", url:"", password:"" },
  { title:"楽曲の基礎⑴「フレーズを覚える」", url:"", password:"" },
  { title:"楽曲の基礎⑵「フレーズを繋げる」", url:"", password:"" },
  { title:"楽曲の応用⑴「リズムを整える」", url:"", password:"" },
  { title:"楽曲の応用⑵「楽曲をブラッシュアップ」", url:"", password:"" },
];

const C = {
  olive:"#708238", sand:"#E2C5A0", choco:"#4B3621", moss:"#8A9A5B",
  label:"#6b4c30", bg:"#f0ebe0", bgLight:"#faf7f2", border:"rgba(112,130,56,0.2)",
};

const BTN_STYLE = {
  display:"block", textAlign:"center", padding:"13px", borderRadius:12,
  background:"linear-gradient(135deg,#b8c86a,#8a9a3a)", color:"#fff",
  fontSize:13, fontWeight:700, textDecoration:"none", letterSpacing:"0.05em",
  boxShadow:"0 4px 12px rgba(112,130,56,0.4)", cursor:"pointer",
};
const ROW_BTN = (accentColor) => ({
  display:"flex", alignItems:"center", gap:12, padding:"13px 16px",
  background:"rgba(255,255,255,0.9)", border:"0.5px solid rgba(0,0,0,0.08)",
  borderLeft:"3px solid "+accentColor, borderRadius:"0 10px 10px 0",
  textDecoration:"none", cursor:"pointer", width:"100%", boxSizing:"border-box",
  color:"#2a3a2a",
});

function splitItems(str) {
  return String(str || "").split(/[|｜;；,，]/).map(s => s.trim()).filter(Boolean);
}

function parseCsvLine(line) {
  const result = [];
  let cur = "", inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i+1] === '"') { cur += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === ',' && !inQuote) {
      result.push(cur.trim()); cur = "";
    } else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function parseCsv(text) {
  const lines = text.trim().split("\n");
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
}

// 初回表示を速くするためのキャッシュ読み込み。前回取得したデータがあれば
// 通信を待たずに即座に画面に反映し（stale-while-revalidate）、その裏で最新データを取りに行く
function cachedInit(key, fallback) {
  try {
    const raw = localStorage.getItem("cache_" + key);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return fallback;
}
function cacheSave(key, value) {
  try { localStorage.setItem("cache_" + key, JSON.stringify(value)); } catch(e) {}
}

function rowToMember(r) {
  return {
    name: String(r["名前"] || r["name"] || ""),
    password: String(r["パスワード"] || r["password"] || ""),
    level: String(r["段階"] || r["レベル"] || r["level"] || ""),
    strengths: String(r["強み"] || r["strengths"] || ""),
    challenge: String(r["課題"] || r["challenge"] || ""),
    goal: String(r["目標"] || r["goal"] || ""),
    history: splitItems(r["履歴"] || r["history"] || ""),
    scales: String(r["マイ音階"] || ""),
    sheets: String(r["持っている楽譜"] || ""),
    songs: String(r["演奏できる楽曲"] || ""),
    completedLevels: parseInt(r["受講済み段階"] || "0"),
    openness: parseInt(r["音の開放度"] || "0"),
    quality: parseInt(r["音質調整"] || "0"),
    tempo: parseInt(r["テンポキープ"] || "0"),
    ghost: parseInt(r["ゴースト"] || r["ゴーストクオリティ"] || "0"),
    groove: parseInt(r["グルーヴ"] || "0"),
    diagnosisDate: String(r["診断日"] || "").split("T")[0],
    diagnosisResult: String(r["診断結果"] || ""),
    diagnosisSong: String(r["診断楽曲"] || ""),
    commentNoriko: String(r["Yamashita Norikoコメント"] || ""),
    commentHiroko: String(r["hirokoコメント"] || ""),
    commentToon: String(r["灯音コメント"] || ""),
    strengthNoriko: String(r["Yamashita Noriko強み"] || ""),
    strengthHiroko: String(r["hiroko強み"] || ""),
    strengthToon: String(r["灯音強み"] || ""),
    region: String(r["居住地域"] || ""),
    points: parseInt(r["ポイント"] || "0"),
    subscType: String(r["サブスク種別"] || ""),
    subscNextDate: String(r["次回更新日"] || "").split("T")[0],
  };
}

const DEMO_MEMBERS = [
  { name:"田中花子", password:"1234", level:"主柱", strengths:"リズム感|安定したビート", challenge:"表現の幅を広げる", history:["2024春合宿","定期演奏会"], scales:"Cマイナー", sheets:"楽譜A|楽譜B", songs:"曲1|曲2", completedLevels:5, openness:4, quality:3, tempo:5, ghost:3, groove:4, diagnosisDate:"2024-10-01", diagnosisResult:"リズムが非常に安定しています", points:320 },
  { name:"鈴木太郎", password:"5678", level:"若幹", strengths:"音の粒立ち|集中力", challenge:"テンポキープ", history:["2024夏練習会"], scales:"Gメジャー", sheets:"楽譜C", songs:"曲3", completedLevels:3, openness:3, quality:4, tempo:2, ghost:2, groove:3, diagnosisDate:"2024-09-15", diagnosisResult:"音質が繊細で素晴らしい", points:180 },
  { name:"山田梅子", password:"0000", level:"種", strengths:"情熱|向上心", challenge:"基礎リズム", history:[], scales:"", sheets:"", songs:"", completedLevels:0, openness:1, quality:1, tempo:1, ghost:1, groove:1, diagnosisDate:"", diagnosisResult:"", points:50 },
];

function loadSavedMembers() {
  try {
    const cfg = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (cfg && cfg.jsonData) {
      const rows = JSON.parse(cfg.jsonData);
      const parsed = rows.map(rowToMember).filter(m => m.name);
      if (parsed.length > 0) return parsed;
    }
  } catch(e) {}
  return null;
}

function BadgeImage({ level, size = 56 }) {
  const src = BADGE_IMAGES[level];
  if (!src) return <div style={{width:size,height:size,borderRadius:"50%",background:"rgba(112,130,56,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.4,color:C.olive}}>?</div>;
  return <img src={src} alt={level} style={{width:size,height:size,objectFit:"contain",filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.3))"}}/>;
}

function RadarChart({ m }) {
  const labels = ["音の開放度","音質調整","テンポキープ","ゴースト","グルーヴ"];
  const values = [m.openness, m.quality, m.tempo, m.ghost, m.groove];
  const n=5, W=240, H=210, cx=W/2, cy=H/2, r=60, ao=-Math.PI/2;
  const angle = i => ao+(2*Math.PI*i)/n;
  const pt = (i,v) => [cx+r*(v/100)*Math.cos(angle(i)), cy+r*(v/100)*Math.sin(angle(i))];
  const tip = i => [cx+r*Math.cos(angle(i)), cy+r*Math.sin(angle(i))];
  const grid = lv => Array.from({length:n},(_,i)=>pt(i,lv).join(",")).join(" ");
  const poly = values.map((v,i)=>pt(i,v).join(",")).join(" ");
  const li = [{i:0,dx:0,dy:-14,a:"middle"},{i:1,dx:14,dy:4,a:"start"},{i:2,dx:14,dy:-4,a:"start"},{i:3,dx:-14,dy:-4,a:"end"},{i:4,dx:-14,dy:4,a:"end"}];
  return (
    <svg width={W} height={H} viewBox={"0 0 "+W+" "+H}>
      {[20,40,60,80,100].map(l=><polygon key={l} points={grid(l)} fill="none" stroke="rgba(112,130,56,0.2)" strokeWidth="0.5"/>)}
      {Array.from({length:n},(_,i)=>{ const [x,y]=tip(i); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(112,130,56,0.3)" strokeWidth="0.5"/>; })}
      <polygon points={poly} fill="rgba(112,130,56,0.2)" stroke="#708238" strokeWidth="1.5"/>
      {values.map((v,i)=>{ const [x,y]=pt(i,v); return <circle key={i} cx={x} cy={y} r="2.5" fill="#708238"/>; })}
      {li.map(({i,dx,dy,a})=>{ const [tx,ty]=tip(i); return <text key={i} x={tx+dx} y={ty+dy} textAnchor={a} fontSize="9" fill="#6b4c30">{labels[i]}</text>; })}
      {values.map((v,i)=>{ const [x,y]=pt(i,v); return <text key={i} x={x} y={y-6} textAnchor="middle" fontSize="9" fontWeight="700" fill="#4B3621">{v}</text>; })}
    </svg>
  );
}

function MiniRadar({ m, size=48 }) {
  const values = [m.openness,m.quality,m.tempo,m.ghost,m.groove];
  const n=5, cx=size/2, cy=size/2, r=size*0.38, ao=-Math.PI/2;
  const pt = (i,v) => { const a=ao+(2*Math.PI*i)/n; return [cx+r*(v/100)*Math.cos(a),cy+r*(v/100)*Math.sin(a)]; };
  const tip = i => { const a=ao+(2*Math.PI*i)/n; return [cx+r*Math.cos(a),cy+r*Math.sin(a)]; };
  const grid = lv => Array.from({length:n},(_,i)=>pt(i,lv).join(",")).join(" ");
  const poly = values.map((v,i)=>pt(i,v).join(",")).join(" ");
  return (
    <svg width={size} height={size} viewBox={"0 0 "+size+" "+size}>
      {[20,40,60,80,100].map(l=><polygon key={l} points={grid(l)} fill="none" stroke="rgba(112,130,56,0.3)" strokeWidth="0.5"/>)}
      {Array.from({length:n},(_,i)=>{ const [x,y]=tip(i); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(112,130,56,0.2)" strokeWidth="0.5"/>; })}
      {m.diagnosisDate
        ? <polygon points={poly} fill="rgba(112,130,56,0.25)" stroke="#708238" strokeWidth="1.5"/>
        : <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={size*0.22} fill="#a09080">未</text>
      }
    </svg>
  );
}

// メトロノーム音源（base64埋め込み）
// リズムトレーニング成長キャラクター：ランク0〜9の名称（画像は /character/stageNN.png を想定）
const CHARACTER_STAGE_NAMES = [
  "光のオーブ", "めざめ", "まなざし", "まんまる", "はじめの芽",
  "ふたばの耳", "神秘の瞳", "さざなみ", "内なる輝き", "守護の姿"
];

// ランクごとの、律ちゃんからのひとことメッセージ（開くたびにランダムで1つ表示）。{name}は表示時にメンバー名へ置換される
const CHARACTER_MESSAGES = [
  [
    "……ここは、どこ……？", "なにか、あたたかい……", "ふわふわ……ねむいな……",
    "地球って、どんなところなんだろう？", "何かが動き出してきたのかな…？", "未知の世界…ワクワク…"
  ],
  [
    "これが身体……？", "だれか、いる……？", "まだうまく喋れないみたい……",
    "これが脈動…？", "これがドキドキ…？", "何かが動き出してる…？"
  ],
  [
    "きみの音、聞こえてるよ", "毎日、リズムを感じてる", "少しずつ、形になってきた気がする",
    "芽が覚めたっぽい？", "君が僕を産んでくれたの？", "目が見えるって、オモシロイ…",
    "鼓動の音が聴こえる…", "{name}さん、起こしてくれてありがとう♪"
  ],
  [
    "よく聴こえる…音って楽しいね！", "きみのリズム、ここまで伝わってきたよ！素敵だね！", "今日も一緒に練習…する？",
    "みてみて、お耳が大きくなってきた", "音がよく聴こえるようになってきたね！", "リズムって、やればやるほど脈打つんだね！",
    "{name}さん、今日も脈打ってる？", "ここまでの努力が少しずつ実ってきたね♪"
  ],
  [
    "みてみて、歩けるようになってきたよ♪", "ちょっとずつ育ってる実感が湧いてきた？", "きみのおかげで、ここまで大きくなったよ！",
    "{name}さんが打てば打つほど、僕が元気になるよ！", "{name}さん、ここまで頑張って練習してくれてありがとう♪", "自分の足で歩くって、こんなに楽しいの？",
    "今日もチッタチッタ♪心が動くね！", "バランスが取れるようになってきたよ！ありがとう♪"
  ],
  [
    "ねぇねぇ、どんどん聴こえるよ♡", "リズムが、体に染み込んでいくみたいだね", "変化してるの、自分でも分かるでしょ？僕もそうなんだ♪",
    "僕の鼓動と{name}さんのリズムが響き合ってるね♪", "耳をすませば、音の間合いが聴こえる…", "目に見えるものだけではないこの世界、なんてオモシロイの？",
    "{name}さん、今日もタカシタカシ？", "表だけではリズムは完成しないね。裏があるから表がある。",
    "わーーい！体がどんどん脈打つよ？リズムって神秘！", "瞳の奥に、何か視える……ふしぎな模様でしょ？"
  ],
  [
    "リズムってさ、宇宙なの？宇宙がリズムなの？", "音の裏側にある何かが、どんどん見えてきた！", "きみと過ごした時間が、ここに宿ってる気がする",
    "スキップすると身体中でリズムを感じるよ？一緒にスキップしよ？", "{name}さん、タカシさんが喜んでるよ！", "間合いって、どうしてこんなに神秘的なの？見えない音が見えてきた。",
    "手先だけでは本当のリズムが完成しないね。{name}さんの頑張りを見ていてそう感じたよ！", "{name}さんが刻んでくれる優しいリズム、好きだなぁ♡", "{name}さん、僕にも上達の方法を教えてくれる？"
  ],
  [
    "見てみて、なんか生えてきたよ？", "揺らぎも、リズムの一部なんだね", "静けさの中にも、ちゃんと拍があるっぽい",
    "{name}さん、最近調子どう？", "タカシタカシは、なぜツヨシツヨシじゃないの？", "ねね、最近リズムの芯が太くなってない？",
    "{name}さんが頑張ってくれるから、僕も毎日が楽しい！", "裏と表が仲良くし始めてない？空気感が変わってきた気がするよ？",
    "最近、{name}さんがリズムを奏でると、僕の頭の芽が踊るのよ？なんで？", "タカシタカシ…カの部分を抜くと、お祭りになるんだ？",
    "わっしょいわっしょーい！", "僕の新しい髪型…いけてる？"
  ],
  [
    "何か、不思議な力が僕の背中を押してくれてる。{name}さんの刻んできた旋律かな？", "内側から、何かが満ちてきた。ヤヴァイ…",
    "この世界に新しい光が生まれてきた！どれだけ練習しても、次の世界が待ってるんだね…", "最近思うんだけど、DANiLOって天才じゃない？いや、それを超えて奇人だね。うむ。",
    "みてみて、この光。iridescence みたいだね♪", "{name}さんが脈打つたびに、僕の周りに光が生まれる！",
    "{name}さんのリズム、急に芯を持ち始めてない？今までと明らかに違うよ？", "最近、頭の上がザワザワする。ザワザワザワーーーって。伝わる？"
  ],
  [
    "ここまで、一緒に来られてうれしいよ。", "{name}さんのリズムは、もう自分の一部になってきてない？", "これからも、隣で聴いてるからね？",
    "この姿になれたのは、きみのおかげ。この世界はなんて美しいんだろう？", "身体がリズムを捉えてる。音が間合いを持って踊ってる♪",
    "キラキラ♪{name}さんと一緒なら、どこまでも羽ばたける気がする！", "最近、宇宙を身近に感じる。{name}さんが奏でてくれる旋律が僕を目覚めさせてくれる。",
    "みてみて！翼！！！{name}さんも、翼が生えてきたってことだね！", "ねね、もっともっと間合いと音の奥の世界を感じようね！"
  ]
];

const METRO_SOUNDS_B64 = {
  click: "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qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+5LEOQPAAAGkAAAAIAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  accent: "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qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uSxDkDwAABpAAAACAAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==",
};

// 音源はVercelのpublic/soundsから読み込む
const SCORE_HIBIKI_COLORS = {
  turquoise: "#00C8C0",
  steelgray: "#A0A8B8",
  salmon:    "#FF6B6B",
  royalblue: "#2050C0",
  gold:      "#D4A020",
  emerald:   "#50B080",
  charcoal:  "#2C2A28",
  sage:      "#244E2E",
  plum:      "#5845C0",
};
const SCORE_HIBIKI_PALE_COLORS = {
  turquoise: "#B0F0EE",
  steelgray: "#E0E4EC",
  salmon:    "#FFD0D0",
  royalblue: "#B0C0E8",
  gold:      "#F0DCA0",
  emerald:   "#B0DCC8",
  charcoal:  "#A0A0A0",
  sage:      "#A8C4A8",
  plum:      "#C8C0F0",
};
const SCORE_HIBIKI_COLORS_ORDER = ["turquoise","steelgray","salmon","royalblue","gold","emerald","charcoal","sage","plum"];

const SCORE_SOUND_URLS = {
  default: {
    yellow:"https://gudadrum-portal.vercel.app/sounds/yellow.mp3",
    red:"https://gudadrum-portal.vercel.app/sounds/red.mp3",
    purple:"https://gudadrum-portal.vercel.app/sounds/purple.mp3",
    green:"https://gudadrum-portal.vercel.app/sounds/green.mp3",
    brown:"https://gudadrum-portal.vercel.app/sounds/brown.mp3",
    cyan:"https://gudadrum-portal.vercel.app/sounds/cyan.mp3",
    orange:"https://gudadrum-portal.vercel.app/sounds/orange.mp3",
    pink:"https://gudadrum-portal.vercel.app/sounds/pink.mp3",
    lime:"https://gudadrum-portal.vercel.app/sounds/lime.mp3",
    attack:"https://gudadrum-portal.vercel.app/sounds/attack.mp3",
  },
  african: {
    // 和ノ音（african）：音源データは追って追加予定。ファイル名の対応関係だけ先に用意しておく。
    yellow:"https://gudadrum-portal.vercel.app/sounds/african_yellow.mp3",
    red:"https://gudadrum-portal.vercel.app/sounds/african_red.mp3",
    purple:"https://gudadrum-portal.vercel.app/sounds/african_purple.mp3",
    green:"https://gudadrum-portal.vercel.app/sounds/african_green.mp3",
    brown:"https://gudadrum-portal.vercel.app/sounds/african_brown.mp3",
    cyan:"https://gudadrum-portal.vercel.app/sounds/african_cyan.mp3",
    orange:"https://gudadrum-portal.vercel.app/sounds/african_orange.mp3",
    pink:"https://gudadrum-portal.vercel.app/sounds/african_pink.mp3",
    lime:"https://gudadrum-portal.vercel.app/sounds/african_lime.mp3",
    attack:"https://gudadrum-portal.vercel.app/sounds/african_attack.mp3",
  },
  enigma: {
    yellow:"https://gudadrum-portal.vercel.app/sounds/enigma_yellow.mp3",
    red:"https://gudadrum-portal.vercel.app/sounds/enigma_red.mp3",
    purple:"https://gudadrum-portal.vercel.app/sounds/enigma_purple.mp3",
    green:"https://gudadrum-portal.vercel.app/sounds/enigma_green.mp3",
    brown:"https://gudadrum-portal.vercel.app/sounds/enigma_brown.mp3",
    cyan:"https://gudadrum-portal.vercel.app/sounds/enigma_cyan.mp3",
    orange:"https://gudadrum-portal.vercel.app/sounds/enigma_orange.mp3",
    pink:"https://gudadrum-portal.vercel.app/sounds/enigma_pink.mp3",
    lime:"https://gudadrum-portal.vercel.app/sounds/enigma_lime.mp3",
    attack:"https://gudadrum-portal.vercel.app/sounds/arcane_attack.mp3",
  },
  equinox: {
    orange:"https://gudadrum-portal.vercel.app/sounds/EQ1.mp3",
    lime:  "https://gudadrum-portal.vercel.app/sounds/EQ2.mp3",
    green: "https://gudadrum-portal.vercel.app/sounds/EQ3.mp3",
    red:   "https://gudadrum-portal.vercel.app/sounds/EQ4.mp3",
    purple:"https://gudadrum-portal.vercel.app/sounds/EQ5.mp3",
    brown: "https://gudadrum-portal.vercel.app/sounds/EQ6.mp3",
    yellow:"https://gudadrum-portal.vercel.app/sounds/EQ7.mp3",
    cyan:  "https://gudadrum-portal.vercel.app/sounds/EQ8.mp3",
    pink:  "https://gudadrum-portal.vercel.app/sounds/EQ1.mp3",
  },
  arcane: {
    turquoise:"https://gudadrum-portal.vercel.app/sounds/arcane_turquoise.mp3",
    steelgray:"https://gudadrum-portal.vercel.app/sounds/arcane_steelgray.mp3",
    salmon:"https://gudadrum-portal.vercel.app/sounds/arcane_salmon.mp3",
    royalblue:"https://gudadrum-portal.vercel.app/sounds/arcane_royalblue.mp3",
    gold:"https://gudadrum-portal.vercel.app/sounds/arcane_gold.mp3",
    emerald:"https://gudadrum-portal.vercel.app/sounds/arcane_emerald.mp3",
    charcoal:"https://gudadrum-portal.vercel.app/sounds/arcane_charcoal.mp3",
    sage:"https://gudadrum-portal.vercel.app/sounds/arcane_sage.mp3",
    plum:"https://gudadrum-portal.vercel.app/sounds/arcane_plum.mp3",
    // 風ノ音の色名でも使えるようにマッピング（蒼〜aoi〜用）
    orange:"https://gudadrum-portal.vercel.app/sounds/arcane_turquoise.mp3",
    lime:"https://gudadrum-portal.vercel.app/sounds/arcane_steelgray.mp3",
    red:"https://gudadrum-portal.vercel.app/sounds/arcane_salmon.mp3",
    brown:"https://gudadrum-portal.vercel.app/sounds/arcane_royalblue.mp3",
    cyan:"https://gudadrum-portal.vercel.app/sounds/arcane_gold.mp3",
    yellow:"https://gudadrum-portal.vercel.app/sounds/arcane_emerald.mp3",
    purple:"https://gudadrum-portal.vercel.app/sounds/arcane_charcoal.mp3",
    green:"https://gudadrum-portal.vercel.app/sounds/arcane_sage.mp3",
    pink:"https://gudadrum-portal.vercel.app/sounds/arcane_plum.mp3",
    attack:"https://gudadrum-portal.vercel.app/sounds/arcane_attack.mp3",
  },
};
// 新曲マスターから登録された曲（起動時に読み込んでここに格納する）
var CUSTOM_SONGS = {}; // scoreId -> {title, scale, rotation, sections}

function getSoundUrls(scoreId, soundType) {
  if(soundType==="arcane") return SCORE_SOUND_URLS.arcane;
  if(soundType==="enigma") return SCORE_SOUND_URLS.enigma;
  if(soundType==="equinox") return SCORE_SOUND_URLS.equinox;
  if(scoreId==="iridescence") return SCORE_SOUND_URLS.enigma;
  if(scoreId==="aoi") return SCORE_SOUND_URLS.arcane;
  if(scoreId==="nostalgic"||scoreId==="holychild") return SCORE_SOUND_URLS.equinox;
  if(CUSTOM_SONGS[scoreId]) return SCORE_SOUND_URLS[CUSTOM_SONGS[scoreId].scale] || SCORE_SOUND_URLS.default;
  return SCORE_SOUND_URLS.default;
}
// SCORE_SHEET_MAP は廃止（GAS側で曲IDから自動的にシート名を決めるようになったため、手動登録は不要になった）

const SCORE_DEFAULT_BPM = {
  waterlily: 97,
  waterlily2: 129,
  nostalgic: 88,
  holychild: 126,
  dreamy: 99,
  aoi: 140,
  iridescence: 100,
  megumi: 113,
  regrace: 119,
  inori: 113,
  kigaru: 80,
};

const SCORE_ID_TO_NAME = {
  waterlily: "water lily〜水面〜",
  waterlily2: "water lily",
  nostalgic: "NoStAlGiE",
  holychild: "holy child",
  dreamy: "dreamy EYES",
  aoi: "蒼〜aoi〜",
  iridescence: "iridescence",
  megumi: "めぐみの空",
  regrace: "Re:Grace",
  inori: "祈音〜Inorion〜",
  kigaru: "気軽サブスク譜面",
};

const SCORE_SECTIONS = {
  waterlily: [["intro","イントロ","triplet"],["amelo","Aメロ","triplet"],["bmelo","Bメロ","triplet"],["between","間","triplet"],["introPrime","イントロ'","triplet"]],
  holychild: [
    ["intro","イントロ","16th"],
    ["sabi","サビ","16th"],
    ["bmelo","Bメロ","triplet"],
    ["sabi2","サビ","16th"],
    ["interlude_a","間奏：前半","triplet"],
    ["interlude_b","間奏：後半","triplet"],
    ["bmelo2","Bメロ","triplet"],
    ["tsunagi","ツナギ","16th"],
    ["sabi3","サビ","16th"],
    ["intro2","アウトロ","16th"],
  ],
  nostalgic: [
    ["intro","イントロ","16th"],
    ["amelo","Aメロ","16th"],
    ["bmelo1","Bメロ①","16th"],
    ["amelo_p","Aメロ'","16th"],
    ["bmelo1b","Bメロ①","16th"],
    ["bmelo2","Bメロ②","16th"],
    ["bmelo1p","Bメロ①'","16th"],
    ["bmelo2p","Bメロ②'","16th"],
    ["intro2","アウトロ","16th"],
    ["sabi","サビ","16th"],
    ["intro3","イントロ","16th"],
    ["bmelo1c","Bメロ①","16th"],
    ["bmelo2pb","Bメロ②'","16th"],
    ["sabi_p","サビ'","16th"],
  ],
  waterlily2: [
    ["intro","イントロ","triplet"],
    ["amelo_a","Aメロ","triplet"],
    ["bmelo","Bメロ","triplet"],
    ["amelo2","Aメロ②","triplet"],
    ["bmelo2","Bメロ②","triplet"],
    ["sabi","サビ","triplet"],
    ["bmelo3","Bメロ③","triplet"],
    ["sabi2","サビ","triplet"],
    ["cmelo","Cメロ","triplet"],
    ["bmelo4","Bメロ","triplet"],
    ["tsunagi","繋ぎ","triplet"],
    ["sabi3","サビ","triplet"],
    ["cmelo2","Cメロ","triplet"],
    ["outro","アウトロ","triplet"],
    ["amelo3","Aメロ","triplet"],
  ],
  dreamy: [["intro","イントロ","16th"],["amelo","Aメロ","16th"],["ameloPrime","Aメロ'","16th"],["bmelo","Bメロ","16th"],["ameloPrime2","Aメロ'","16th"],["bmelo2","Bメロ","16th"],["cmelo","Cメロ","16th"],["cmeloPrime","Cメロ'","16th"],["sabi","サビ","16th"],["interlude1","間奏①","triplet"],["interlude1p","間奏①'","triplet"],["interlude2","間奏②","triplet"],["interlude2p","間奏②'","triplet"],["outro","アウトロ","16th"]],
  aoi: [
    ["intro","イントロ","triplet"],
    ["amelo1","Aメロ","triplet"],
    ["bmelo1","Bメロ","triplet"],
    ["ameloPrime1","Aメロ'","triplet"],
    ["sabiPrelude","サビ序章","triplet"],
    ["cmelo1","Cメロ","triplet"],
    ["ameloPrime2","Aメロ'","triplet"],
    ["sabi1a","サビ①","triplet"],
    ["sabiPrime1","サビ'","triplet"],
    ["interlude1a","間奏①","triplet"],
    ["cmelo2","Cメロ","triplet"],
    ["cmeloPrime","Cメロ'","triplet"],
    ["sabi1b","サビ①","triplet"],
    ["sabi2a","間奏②前半","triplet"],
    ["sabi3a","間奏②後半","triplet"],
    ["sabi1c","サビ①","triplet"],
    ["sabiPrime2","サビ'","triplet"],
    ["interlude1b","間奏①","triplet"],
    ["outro","締め","triplet"]
  ],
  iridescence: [["intro","イントロ","16th"],["amelo","Aメロ","16th"],["bmelo","Bメロ","16th"],["amelo2","Aメロ","16th"],["bmelo2","Bメロ","16th"],["introPrime","イントロ'","16th"],["sabi","サビ","16th"],["sabiPrime","サビ'","16th"],["maai","間合い","16th"],["intro2","イントロ","16th"],["amelo3","Aメロ","16th"],["bmelo3","Bメロ","16th"],["outro","アウトロ","16th"]],
  regrace: [
    ["intro","イントロ","16th"],
    ["sabi","サビ","16th"],
    ["amelo","Aメロ","16th"],
    ["bmelo","Bメロ","16th"],
    ["amelo2","Aメロ","16th"],
    ["bmelo2","Bメロ","16th"],
    ["sabi2","サビ'","16th"],
    ["sabi2b","サビ②","16th"],
    ["interlude1","間奏①","16th"],
    ["interlude2","間奏②","16th"],
    ["interlude3","間奏③","16th"],
    ["sabi3","サビ","16th"],
    ["interlude4","間奏④","16th"],
    ["interlude5","間奏⑤","16th"],
    ["ma","間","16th"],
    ["tsunagi","ツナギ","16th"],
    ["sabi4","サビ②'","16th"],
    ["sabi5","サビ②","16th"],
    ["outro","アウトロ","16th"],
  ],
  megumi: [
    ["intro","イントロ","16th"],
    ["amelo","Aメロ","16th"],
    ["introPrime","イントロ'","16th"],
    ["amelo2","Aメロ②","16th"],
    ["sabi","サビ","16th"],
    ["amelo3","Aメロ③前半","16th"],
    ["amelo3b","Aメロ③後半","16th"],
    ["sabi2","サビ","16th"],
    ["interlude","間奏","16th"],
    ["sabi3","サビ","16th"],
    ["sabi4","サビ②","16th"],
    ["outro","アウトロ","16th"],
    ["outro2","アウトロ②","16th"],
    ["outro3","アウトロ③前半","16th"],
    ["outro3b","アウトロ③後半","16th"],
    ["outro4","アウトロ④前半","16th"],
    ["outro4b","アウトロ④後半","16th"],
    ["sabiF","サビ","16th"],
  ],
  inori: [
    ["intro","イントロ","16th"],
    ["amelo","Aメロ","16th"],
    ["sabiprelude","サビ序章","16th"],
    ["amelo2","Aメロ","16th"],
    ["sabi","サビ","16th"],
    ["interlude1a","間奏①前半","16th"],
    ["interlude1b","間奏①後半","16th"],
    ["interlude2a","間奏②-1","16th"],
    ["interlude2b","間奏②-2","16th"],
    ["interlude2c","間奏②-3","16th"],
    ["interlude2d","間奏②-4","16th"],
    ["sabiPrime1","サビ'前半","16th"],
    ["sabiPrime2","サビ'後半","16th"],
    ["sabi2a","サビ②前半","16th"],
    ["sabi2b","サビ②後半","16th"],
    ["outro","アウトロ","16th"],
  ],
  kigaru: [
    ["section1","セクション1","16th"],
    ["section2","セクション2","16th"],
    ["section3","セクション3","16th"],
    ["section4","セクション4","16th"],
    ["section5","セクション5","16th"],
    ["section6","セクション6","16th"],
    ["section7","セクション7","16th"],
    ["section8","セクション8","16th"],
    ["section9","セクション9","16th"],
    ["section10","セクション10","16th"],
  ],
};

// 楽曲マスターから読み込んだ新曲を、既存の仕組み（SCORE_SECTIONS等）に動的に追加する
// 管理画面カードの共通スタイル（白背景固定＋左に太めの色帯。属性ごとに色分けする）
function adminCardStyle(groupColor) {
  return {
    width:"100%", padding:"10px 12px", borderRadius:10,
    background:"#fff",
    border:"1px solid #e8e8e8",
    borderLeft:"5px solid "+groupColor,
    color:"#4a4a4a",
    fontSize:12, fontWeight:600, cursor:"pointer", marginBottom:8,
    textAlign:"left"
  };
}
const INORION_TICKET_TYPES = ["スペシャル席","一般席","遠目席","ライブ配信","招待席","スポンサー"];
const INORION_TICKET_PRICES = {
  "スペシャル席": 11000,
  "一般席": 4500,
  "遠目席": 3800,
  "ライブ配信": 3300,
  "招待席": 0,
};
function inorionParticipantAmount(p) {
  if (p.ticketType === "スポンサー") return p.supportAmount || 0;
  return (INORION_TICKET_PRICES[p.ticketType] || 0) * (p.count || 1);
}
const ADMIN_GROUP_COLORS = {
  score:"#00B8D9",      // 🎼 譜面・楽曲（少し落ち着かせた水色）
  hpt:"#FF9900",        // 🎯 HPT・貢献度
  subs:"#D4C400",       // 💳 サブスク・課金（純色の黄色は白背景で見えにくいため少し濃く）
  member:"#22C93A",     // 📊 メンバー状況・記録
  collect:"#3355FF",    // 📈 データー収集
  standalone:"#C400E0"  // 独立カード
};
// グループの見出しボタン（属性ごとの色で塗りつぶし、押すと配下のカードが開閉する）
function adminGroupHeaderStyle(groupColor) {
  return {
    width:"100%", gridColumn:"1 / -1", padding:"16px 18px", borderRadius:14,
    background:"#fff", border:"1px solid #eee", borderLeft:"5px solid "+groupColor,
    cursor:"pointer", marginBottom:10,
    textAlign:"left", display:"flex", alignItems:"center", gap:14
  };
}
// グループ見出しカードの中身（アイコン丸・タイトル・説明文・色付き矢印）
function renderAdminGroupHeader(icon, title, desc, groupColor, isOpen, onClick) {
  return (
    <button onClick={onClick} style={adminGroupHeaderStyle(groupColor)}>
      <div style={{width:44,height:44,borderRadius:"50%",background:groupColor+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:20}}>{icon}</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:15,fontWeight:700,color:"#333",marginBottom:2}}>{title}</p>
        <p style={{fontSize:11,color:"#999"}}>{desc}</p>
      </div>
      <span style={{fontSize:16,color:groupColor,flexShrink:0}}>{isOpen?"⌃":"⌄"}</span>
    </button>
  );
}
function registerCustomSongs(songs) {
  songs.forEach(function(song) {
    SCORE_SECTIONS[song.scoreId] = song.sections.map(function(s){ return [s.key, s.label, s.subdivision]; });
    SCORE_ID_TO_NAME[song.scoreId] = song.title;
    CUSTOM_SONGS[song.scoreId] = song;
    if (song.bpm > 0) SCORE_DEFAULT_BPM[song.scoreId] = song.bpm;
  });
}

const SCORE_DOT_COLORS = {"yellow":"#F5E642","red":"#E83020","purple":"#8844CC","green":"#1A8A40","brown":"#C4A882","cyan":"#00BFEF","orange":"#F07020","pink":"#F020B0","lime":"#8CC830","attack":"#3A3A3A"};
const SCORE_PALE_COLORS = {"yellow":"#FBF6B0","red":"#F8C0BC","purple":"#D4C0F4","green":"#A8E8C0","brown":"#ECD8C0","cyan":"#B0ECFC","orange":"#FAD8A8","pink":"#F4B0E0","lime":"#C4ECA8","attack":"#D8D8D8"};


const SCORE_COLOR_ORDER = ["orange","red","lime","green","yellow","purple","cyan","pink","brown"];
const SCORE_COLOR_NAMES = {orange:"橙",red:"赤",lime:"黄緑",green:"緑",yellow:"黄",purple:"紫",cyan:"水色",pink:"ピンク",brown:"茶",attack:"アタック"};
const SPB = 12;
const TOTAL_STEPS = 96;
const SCORE_DOTS_FUNENONE = {
  orange: {cx:70.0,  cy:131.0},  // 下（180度回転）
  lime:   {cx:36.1,  cy:116.9},  // 左下
  red:    {cx:22.0,  cy:83.0},   // 左
  brown:  {cx:36.1,  cy:49.1},   // 左上
  cyan:   {cx:70.0,  cy:35.0},   // 上
  yellow: {cx:103.9, cy:49.1},   // 右上
  purple: {cx:118.0, cy:83.0},   // 右
  green:  {cx:103.9, cy:116.9},  // 右下
  pink:   {cx:70.0,  cy:83.0},   // 中央
};

// dreamy EYES: 正しい配置（8音、中央なし）
const SCORE_DOTS_DREAMY = {
  orange: {cx:70.0,  cy:35.0},   // 上
  lime:   {cx:103.9, cy:49.1},   // 右上
  red:    {cx:118.0, cy:83.0},   // 右
  brown:  {cx:103.9, cy:116.9},  // 右下
  cyan:   {cx:70.0,  cy:131.0},  // 下
  yellow: {cx:36.1,  cy:116.9},  // 左下
  purple: {cx:22.0,  cy:83.0},   // 左
  green:  {cx:36.1,  cy:49.1},   // 左上
  pink:   {cx:70.0,  cy:83.0},   // 中央
};

const SCORE_DOTS_HIBIKI = {
  turquoise: {cx:70.0,  cy:35.0},   // 上
  steelgray: {cx:103.9, cy:49.1},   // 右上
  salmon:    {cx:118.0, cy:83.0},   // 右
  royalblue: {cx:103.9, cy:116.9},  // 右下
  gold:      {cx:70.0,  cy:131.0},  // 下
  emerald:   {cx:36.1,  cy:116.9},  // 左下
  charcoal:  {cx:22.0,  cy:83.0},   // 左
  sage:      {cx:36.1,  cy:49.1},   // 左上
  plum:      {cx:70.0,  cy:83.0},   // 中央
};

// NoStAlGiE: 左=高音、右=低音（FUNENONEを時計回り90度回転）
const SCORE_DOTS_NOSTALGIC = {
  cyan:   {cx:22.0,  cy:83.0},   // 左（高音）
  yellow: {cx:36.1,  cy:49.1},   // 左上
  purple: {cx:70.0,  cy:35.0},   // 上
  green:  {cx:103.9, cy:49.1},   // 右上
  orange: {cx:118.0, cy:83.0},   // 右（低音）
  lime:   {cx:103.9, cy:116.9},  // 右下
  red:    {cx:70.0,  cy:131.0},  // 下
  brown:  {cx:36.1,  cy:116.9},  // 左下
  pink:   {cx:70.0,  cy:83.0},   // 中央
};

const SCORE_DOTS = SCORE_DOTS_FUNENONE;
// 新曲用：回転オフセット(0-7)から自動でイラスト配置を生成する仕組み
// FUNENONE配置＝回転0、DREAMY配置＝回転4、という関係になっている
const SCORE_RING_POSITIONS = [
  {cx:70.0,cy:35.0}, {cx:103.9,cy:49.1}, {cx:118.0,cy:83.0}, {cx:103.9,cy:116.9},
  {cx:70.0,cy:131.0}, {cx:36.1,cy:116.9}, {cx:22.0,cy:83.0}, {cx:36.1,cy:49.1}
];
const SCORE_COLOR_RING = ["cyan","yellow","purple","green","orange","lime","red","brown"];
function buildRotatedDots(rotation) {
  var r = ((parseInt(rotation)||0) % 8 + 8) % 8;
  var dots = {};
  for (var i=0;i<8;i++) {
    var color = SCORE_COLOR_RING[(i+r)%8];
    dots[color] = SCORE_RING_POSITIONS[i];
  }
  dots.pink = {cx:70.0,cy:83.0};
  return dots;
}
// 高音（cyanの位置）・低音（orangeの位置＝cyanの真反対）が、回転と一緒に動くようにする
const SCORE_LABEL_POSITIONS = [
  {cx:70.0, cy:15.0}, {cx:120.1, cy:32.9}, {cx:138.0, cy:83.0}, {cx:120.1, cy:133.1},
  {cx:70.0, cy:151.0}, {cx:19.9, cy:133.1}, {cx:2.0, cy:83.0}, {cx:19.9, cy:32.9}
];
function getRotatedPitchLabelPos(rotation) {
  var r = ((parseInt(rotation)||0) % 8 + 8) % 8;
  var cyanIdx = SCORE_COLOR_RING.indexOf("cyan"); // 高音の基準色
  var orangeIdx = SCORE_COLOR_RING.indexOf("orange"); // 低音の基準色（cyanの真反対）
  var highI = ((cyanIdx - r) % 8 + 8) % 8;
  var lowI = ((orangeIdx - r) % 8 + 8) % 8;
  return { high: SCORE_LABEL_POSITIONS[highI], low: SCORE_LABEL_POSITIONS[lowI] };
}

// kigaruのセクション番号からDOTS配置を判定
function getKigaruDots(sectionKey) {
  // section1〜5: 低音上（DREAMY配置）, section6〜10: 高音上（FUNENONE配置）
  var m = String(sectionKey||"").match(/^section(\d+)$/);
  if (!m) return null;
  var n = parseInt(m[1]);
  if (n >= 1 && n <= 5) return SCORE_DOTS_DREAMY;
  if (n >= 6 && n <= 10) return SCORE_DOTS_FUNENONE;
  return null;
}
// 風ノ音用のDOTS（楽器1）
function getEffectiveDots(scoreId, sectionKey, scale, instrument2) {
  if (scoreId==="kigaru") {
    var d = getKigaruDots(sectionKey);
    if (d) return d;
  }
  if (CUSTOM_SONGS[scoreId]) return buildRotatedDots(CUSTOM_SONGS[scoreId].rotation);
  if (scale==="nostalgic") return SCORE_DOTS_NOSTALGIC;
  if (scale==="dreamy"||scale==="arcane"||scale==="enigma") return SCORE_DOTS_DREAMY;
  return SCORE_DOTS_FUNENONE;
}
// 響ノ音用のDOTS2（楽器2、arcane時のみ呼ばれる）
function getEffectiveDots2(scoreId, sectionKey, scale, instrument2) {
  if (instrument2==="arcane") return SCORE_DOTS_HIBIKI;
  if (scoreId==="kigaru") {
    var d = getKigaruDots(sectionKey);
    if (d) return d;
  }
  if (scale==="nostalgic") return SCORE_DOTS_NOSTALGIC;
  if (scale==="dreamy"||scale==="arcane"||scale==="enigma") return SCORE_DOTS_DREAMY;
  return SCORE_DOTS_FUNENONE;
}

function makeEmptyPat() {
  const p = {};
  SCORE_COLOR_ORDER.forEach(c => { p[c] = Array(TOTAL_STEPS).fill(0); });
  return p;
}

// 上下ラベルのヘルパー（kigaru section1〜5は表記を逆にする）
function getDrumLabels(scoreId, sectionKey, scale) {
  if (scoreId === "kigaru") {
    var m = String(sectionKey||"").match(/^section(\d+)$/);
    if (m) {
      var n = parseInt(m[1]);
      if (n >= 1 && n <= 5) return {top: "低音", bottom: "高音"};
      if (n >= 6 && n <= 10) return {top: "高音", bottom: "低音"};
    }
  }
  if (scale === "dreamy" || scale === "arcane" || scale === "enigma") return {top: "低音", bottom: "高音"};
  return {top: "高音", bottom: "低音"};
}

function ScorePlayer({ scoreId, sectionKey, sectionLabel, patternData, canEdit, onSave, startTime, onStartTimeChange, scale, subdivProp, scoreLoading, onSectionEnd, onQueueStart, isQueuePlaying, sharedBpm, onBpmChange, sharedMetroOn, sharedMetroMode, onMetroChange, onPrintAll, onPrintThis, onLoopComplete, autoPlay, instrument2, patternData2, sharedHeadBell, floatPosInit, onFloatPosChange, swapLR }) {
  var COLORS = ["orange","red","lime","green","yellow","purple","cyan","pink","brown"];
  // アタック（ボディー打面）は今のところ「蒼〜aoi〜」と「気軽サブスク（kigaru）」のみ対応
  var isAttackEnabled = scoreId==="aoi"||scoreId==="kigaru";
  // 左手グリッドは末尾（茶色の右）、右手グリッドは先頭（オレンジの左）に追加
  var COLORS_LEFT = isAttackEnabled ? COLORS.concat(["attack"]) : COLORS;
  var COLORS_RIGHT = isAttackEnabled ? ["attack"].concat(COLORS) : COLORS;
  var COLORS_ALL = isAttackEnabled ? COLORS.concat(["attack"]) : COLORS; // パターンデータの初期化・再生判定など、左右を区別しない場面で使う
  var COLORS2 = instrument2==="arcane"?SCORE_HIBIKI_COLORS_ORDER:COLORS;
  var DOT_COLORS2 = instrument2==="arcane"?SCORE_HIBIKI_COLORS:SCORE_DOT_COLORS;
  var PALE_COLORS2 = instrument2==="arcane"?SCORE_HIBIKI_PALE_COLORS:SCORE_PALE_COLORS;
  var DOTS2 = getEffectiveDots2(scoreId, sectionKey, scale, instrument2);
  // noteTypeはpropから受け取る（楽曲ごとに固定）
  var subdiv = subdivProp||"triplet";
  var SPB = subdiv==="16th" ? 16 : 12;
  // TOTALはnumBarsから計算（下で再定義）
  var TOTAL = SPB * 8;
  var CELL = 18, GAP = 1;
  console.log("ScorePlayer:", scoreId, sectionKey, "subdivProp=", subdivProp, "SPB=", SPB);

  function emptyPat(total) {
    var t = total || (SPB * 8); // SPBに基づいたサイズ
    var p = {};
    COLORS_ALL.forEach(function(c){ p[c] = new Array(t).fill(0); });
    return p;
  }
  function initPat(side) {
    var total = SPB * 8;
    var p = emptyPat(total);
    if (patternData && patternData[side]) {
      COLORS_ALL.forEach(function(c){
        if (patternData[side][c]) {
          var src = patternData[side][c];
          for(var i=0;i<total;i++) p[c][i] = src[i]||0;
        }
      });
    }
    return p;
  }

  var leftS=useState(function(){return initPat("left");}); var left=leftS[0]; var setLeft=leftS[1];
  // 2台目のstate
  function initPat2(side){
    var total=Math.max(2,Math.min(parseInt(bars)||8,32))*SPB; var p={};
    COLORS2.forEach(function(c){p[c]=new Array(total).fill(0);});
    if(patternData2&&patternData2[side]){
      COLORS2.forEach(function(c){
        if(patternData2[side][c]){for(var i=0;i<Math.min(patternData2[side][c].length,total);i++)p[c][i]=patternData2[side][c][i]||0;}
      });
    }
    return p;
  }
  var left2S=useState(function(){return instrument2?initPat2("left"):{};}); var left2=left2S[0]; var setLeft2=left2S[1];
  var right2S=useState(function(){return instrument2?initPat2("right"):{};}); var right2=right2S[0]; var setRight2=right2S[1];
  var rightS=useState(function(){return initPat("right");}); var right=rightS[0]; var setRight=rightS[1];
  var playingS=useState(false); var playing=playingS[0]; var setPlaying=playingS[1];
  var bpmS=useState(sharedBpm||80);
  var copiedBarS=useState(null); var copiedBar=copiedBarS[0]; var setCopiedBar=copiedBarS[1];
  var selectedBarS=useState(null); var selectedBar=selectedBarS[0]; var setSelectedBar=selectedBarS[1];
  // setSelectedBarをラップしてRefも同時更新
  var setSelectedBarSync=function(b){ console.log("setSelectedBarSync called:", b); selectedBarRef.current=b; setSelectedBar(b); };
  var copiedBar2S=useState(null); var copiedBar2=copiedBar2S[0]; var setCopiedBar2=copiedBar2S[1];
  var copiedBarRef=React.useRef(null); var copiedBar2Ref=React.useRef(null); var selectedBarRef=React.useRef(null);
  var floatPosS=useState(floatPosInit||{x:Math.max(300,window.innerWidth-340),y:60}); var floatPos=floatPosS[0]; var _setFloatPos=floatPosS[1];
  var setFloatPos=function(pos){_setFloatPos(pos);if(onFloatPosChange)onFloatPosChange(pos);};
  var isDraggingRef=React.useRef(false); var dragOffRef=React.useRef({x:0,y:0});
  var soundTypeS=useState("enigma"); var soundType=soundTypeS[0]; var setSoundType=soundTypeS[1];
  var highlightColorS=useState(null); var highlightColor=highlightColorS[0]; var setHighlightColor=highlightColorS[1];
  var highlightColor2S=useState(null); var highlightColor2=highlightColor2S[0]; var setHighlightColor2=highlightColor2S[1];
  var isHL2=function(color){ return Array.isArray(highlightColor2)?highlightColor2.indexOf(color)!==-1:color===highlightColor2; };
  var startBarS=useState(0); var startBar=startBarS[0]; var setStartBar=startBarS[1]; var bpm=bpmS[0]; var setBpmLocal=bpmS[1];
  var setBpm=function(v){ setBpmLocal(typeof v==="function"?v(bpmS[0]):v); if(onBpmChange) onBpmChange(typeof v==="function"?v(bpmS[0]):v); };
  var curStepS=useState(-1); var curStep=curStepS[0]; var setCurStep=curStepS[1];
  var metroOnS=useState(sharedMetroOn||false); var metroOn=metroOnS[0]; var setMetroOnLocal=metroOnS[1];
  var setMetroOn=function(v){ var val=typeof v==="function"?v(metroOnS[0]):v; setMetroOnLocal(val); if(onMetroChange) onMetroChange({metroOn:val}); };
  var metroModeS=useState(sharedMetroMode||4); var metroMode=metroModeS[0]; var setMetroModeLocal=metroModeS[1];
  var setMetroMode=function(v){ var val=typeof v==="function"?v(metroModeS[0]):v; setMetroModeLocal(val); metroModeRef.current=val; if(onMetroChange) onMetroChange(metroOnS[0],val); };
  var metroVolS=useState(0.3); var metroVol=metroVolS[0]; var setMetroVol=metroVolS[1];
  var metroAccentS=useState(true); var metroAccent=metroAccentS[0]; var setMetroAccent=metroAccentS[1];
  var lrOnS=useState(true); var lrOn=lrOnS[0]; var setLrOn=lrOnS[1];
  var dotFillsS=useState(function(){var d={};Object.keys(SCORE_DOTS).forEach(function(c){d[c]=SCORE_PALE_COLORS[c];});return d;}); var dotFills=dotFillsS[0]; var setDotFills=dotFillsS[1];
  var dotLabelS=useState({}); var dotLabel=dotLabelS[0]; var setDotLabel=dotLabelS[1];
  var dotLabel2S=useState({}); var dotLabel2=dotLabel2S[0]; var setDotLabel2=dotLabel2S[1];
  var savingS=useState(false); var saving=savingS[0]; var setSaving=savingS[1];
  var saveMsgS=useState(""); var saveMsg=saveMsgS[0]; var setSaveMsg=saveMsgS[1];
  var secTimeS=useState(startTime||""); var secTime=secTimeS[0]; var setSecTime=secTimeS[1];
  var subdivS=useState(subdivProp||"triplet"); var subdiv=subdivS[0]; var setSubdiv=subdivS[1];
  var barsS=useState("8"); var bars=barsS[0]; var setBars=barsS[1];
  var repeatS=useState("1"); var repeat=repeatS[0]; var setRepeat=repeatS[1];
  var barLengthsS=useState(null); var barLengths=barLengthsS[0]; var setBarLengths=barLengthsS[1];

  var startStepRef=useRef(0);
  var iidRef=useRef(null); var stepRef=useRef(0); var dimRef=useRef(null);
  var lastTickMsRef = useRef(0); // tick間隔の追跡（subdiv変更時の再作成用）
  var actxRef=useRef(null); var bufsRef=useRef({});
  var bufs2Ref=useRef({}); // 2台目の音源バッファ
  var leftRef=useRef(left); var rightRef=useRef(right);
  var left2Ref=useRef(left2); var right2Ref=useRef(right2);
  var bpmRef=useRef(bpm); var metroOnRef=useRef(metroOn);
  var metroModeRef=useRef(metroMode); var metroVolRef=useRef(metroVol);
  var metroAccentRef=useRef(metroAccent); var lrOnRef=useRef(lrOn);
  var subdivRef=useRef(subdiv); var setSPB=function(){}; var setSubdiv=function(){};
  var subdivPropRef = useRef(subdivProp); // 最新のsubdivPropを追跡
  subdivPropRef.current = subdivProp; // レンダリング毎に更新
  var onSectionEndRef=useRef(onSectionEnd);
  var barsRef=useRef(parseInt(bars)||8);
  var repeatRef=useRef(parseInt(repeat)||1);
  var passesCompletedRef=useRef(0); // このセクション内で、今何周（バー分）再生し終えたか
  var barLengthsRef=useRef(null); // 各小節のステップ数配列（nullなら全小節SPBで統一）


  useEffect(function(){leftRef.current=left;},[left]);
  useEffect(function(){if(left2Ref)left2Ref.current=left2;},[left2]);
  useEffect(function(){if(right2Ref)right2Ref.current=right2;},[right2]);
  useEffect(function(){rightRef.current=right;},[right]);
  useEffect(function(){bpmRef.current=bpm;},[bpm]);
  useEffect(function(){metroOnRef.current=metroOn;},[metroOn]);
  useEffect(function(){metroModeRef.current=metroMode;},[metroMode]);
  useEffect(function(){metroVolRef.current=metroVol;},[metroVol]);
  useEffect(function(){setMetroAccent(sharedHeadBell); metroAccentRef.current=sharedHeadBell;},[sharedHeadBell]);
  useEffect(function(){metroAccentRef.current=metroAccent;},[metroAccent]);
  useEffect(function(){lrOnRef.current=lrOn;},[lrOn]);

  // scaleが変わった時にsoundTypeをリセット（iridescence/kigaru/aoi用）
  useEffect(function(){
    if(scoreId==="iridescence"){
      var newType = scale==="arcane"?"arcane":"enigma";
      setSoundType(newType);
      actxRef.current=null;
      bufsRef.current={};
      initAudio(function(){},newType);
    }
    if(scoreId==="kigaru"){
      // kigaruはscale自体がsoundType（default/arcane/enigma/equinox）
      var newType2 = scale||"default";
      setSoundType(newType2);
      actxRef.current=null;
      bufsRef.current={};
      initAudio(function(){},newType2);
    }
    if(scoreId==="aoi"){
      // 蒼〜aoi〜は響ノ音（arcane）がデフォルト。秘ノ音を選んでる場合のみenigmaに
      var newType3 = scale==="enigma"?"enigma":"arcane";
      setSoundType(newType3);
      actxRef.current=null;
      bufsRef.current={};
      initAudio(function(){},newType3);
    }
  },[scale]);
  useEffect(function(){
    if(sharedBpm && sharedBpm !== bpm){ setBpmLocal(sharedBpm); bpmRef.current=sharedBpm; }
  },[sharedBpm]);
  useEffect(function(){
    if(sharedMetroOn!==undefined){ setMetroOnLocal(sharedMetroOn); metroOnRef.current=sharedMetroOn; }
  },[sharedMetroOn]);
  useEffect(function(){
    if(sharedMetroMode){ setMetroModeLocal(sharedMetroMode); metroModeRef.current=sharedMetroMode; }
  },[sharedMetroMode]);
  useEffect(function(){
    // 音源を先読みして間をなくす
    initAudio(function(){});
    return function(){};
  },[]);
  useEffect(function(){barsRef.current=Math.max(2,Math.min(parseInt(bars)||8,32));},[bars]);
  useEffect(function(){repeatRef.current=parseInt(repeat)||1;},[repeat]);
  useEffect(function(){onSectionEndRef.current=onSectionEnd;},[onSectionEnd]);
  // Cmd+C/V でコピペ
  useEffect(function(){
    if(!canEdit) return;
    function onKey(e){
      var sb=selectedBarRef.current;
      var cb=copiedBarRef.current;
      console.log("key:", e.key, "meta:", e.metaKey, "selectedBarRef:", sb, "copiedBarRef:", cb);
      if(!(e.metaKey||e.ctrlKey)) return;
      if(e.key==='c'||e.key==='C'){
        if(sb===null) return;
        var cBarStart=getBarStart(sb); var cBarSpb=getBarSpb(sb);
        var barLeft={}, barRight={};
        COLORS_ALL.forEach(function(c){
          barLeft[c]=(leftRef.current[c]||[]).slice(cBarStart,cBarStart+cBarSpb);
          barRight[c]=(rightRef.current[c]||[]).slice(cBarStart,cBarStart+cBarSpb);
        });
        var newCopied={left:barLeft,right:barRight,spb:cBarSpb};
        copiedBarRef.current=newCopied;
        setCopiedBar(newCopied);
        if(instrument2){
          var barLeft2={}, barRight2={};
          COLORS2.forEach(function(c){
            barLeft2[c]=(left2Ref.current[c]||[]).slice(cBarStart,cBarStart+cBarSpb);
            barRight2[c]=(right2Ref.current[c]||[]).slice(cBarStart,cBarStart+cBarSpb);
          });
          var newCopied2={left:barLeft2,right:barRight2,spb:cBarSpb};
          copiedBar2Ref.current=newCopied2;
          setCopiedBar2(newCopied2);
        }
        e.preventDefault();
      }
      if(e.key==='v'||e.key==='V'){
        if(sb===null||cb===null) return;
        var sb2=sb; var cb2ref=copiedBar2Ref.current;
        var pBarStart=getBarStart(sb2); var pBarSpb=getBarSpb(sb2);
        var cbSpb=cb.spb||SPB;
        var copyLen=Math.min(cbSpb,pBarSpb);
        setLeft(function(prev){
          var p=Object.assign({},prev);
          COLORS_ALL.forEach(function(c){
            p[c]=(prev[c]||[]).slice();
            for(var i=0;i<pBarSpb;i++) p[c][pBarStart+i]=i<copyLen?(cb.left[c]?cb.left[c][i]||0:0):0;
          });
          return p;
        });
        setRight(function(prev){
          var p=Object.assign({},prev);
          COLORS_ALL.forEach(function(c){
            p[c]=(prev[c]||[]).slice();
            for(var i=0;i<pBarSpb;i++) p[c][pBarStart+i]=i<copyLen?(cb.right[c]?cb.right[c][i]||0:0):0;
          });
          return p;
        });
        var cb2=cb2ref;
        if(instrument2&&cb2){
          var cb2Spb=cb2.spb||SPB;
          var copyLen2=Math.min(cb2Spb,pBarSpb);
          setLeft2(function(prev){
            var p=Object.assign({},prev);
            COLORS2.forEach(function(c){
              p[c]=prev[c]?prev[c].slice():new Array(numBars*SPB).fill(0);
              for(var i=0;i<pBarSpb;i++) p[c][pBarStart+i]=i<copyLen2?(cb2.left[c]?cb2.left[c][i]||0:0):0;
            });
            return p;
          });
          setRight2(function(prev){
            var p=Object.assign({},prev);
            COLORS2.forEach(function(c){
              p[c]=prev[c]?prev[c].slice():new Array(numBars*SPB).fill(0);
              for(var i=0;i<pBarSpb;i++) p[c][pBarStart+i]=i<copyLen2?(cb2.right[c]?cb2.right[c][i]||0:0):0;
            });
            return p;
          });
        }
        e.preventDefault();
      }
    }
    window.addEventListener('keydown', onKey);
    return function(){ window.removeEventListener('keydown', onKey); };
  },[canEdit]);

  // コピペ用Ref同期
  useEffect(function(){copiedBarRef.current=copiedBar;},[copiedBar]);
  useEffect(function(){copiedBar2Ref.current=copiedBar2;},[copiedBar2]);
  useEffect(function(){selectedBarRef.current=selectedBar;},[selectedBar]);

  // onLoopCompleteをRefで管理
  var onLoopCompleteRef=React.useRef(onLoopComplete);
  useEffect(function(){onLoopCompleteRef.current=onLoopComplete;},[onLoopComplete]);

  // sectionKeyが変わった時、autoPlayならば自動再生
  var prevKeyRef=React.useRef(sectionKey);
  useEffect(function(){
    if(prevKeyRef.current !== sectionKey){
      prevKeyRef.current = sectionKey;
      hasLoadedRef.current=false; // セクション切り替え時にリセット
      // 新しいセクションのsubdivを確実に反映
      subdivRef.current = subdiv;
      console.log("sectionKey変更:", sectionKey, "subdiv同期=", subdiv);
      if(autoPlay){
        initAudio(function(){
          stepRef.current=0;
          setPlaying(true);
          doStart();
        });
      }
    }
  },[sectionKey,subdiv]);





  useEffect(function(){
    console.log("subdiv useEffect発火:", scoreId, sectionKey, "subdiv=", subdiv, "subdivRef.current=", subdivRef.current, "iidRef.current=", !!iidRef.current);
    subdivRef.current=subdiv;
    // 再生中にsubdivが変わったらintervalを強制再作成（テンポずれ防止）
    if(iidRef.current){
      clearInterval(iidRef.current);
      var newMs = Math.round((60/bpmRef.current/(subdiv==="16th"?4:3))*1000);
      lastTickMsRef.current = newMs;
      console.log("subdiv useEffect: 強制interval再作成", newMs, "subdiv=", subdiv);
      iidRef.current = setInterval(tick, newMs);
    }
    // 編集中はsubdivが変わってもデータをリセットしない
    if(canEdit) return;
    // subdivPropが変わった時にleft/rightを正しいサイズで再構築
    var total = SPB * 8;
    var lp={}, rp={};
    COLORS_ALL.forEach(function(c){
      lp[c]=new Array(total).fill(0);
      rp[c]=new Array(total).fill(0);
      if(patternData&&patternData.left&&patternData.left[c]){
        for(var i=0;i<Math.min(patternData.left[c].length,total);i++) lp[c][i]=patternData.left[c][i]||0;
      }
      if(patternData&&patternData.right&&patternData.right[c]){
        for(var i=0;i<Math.min(patternData.right[c].length,total);i++) rp[c][i]=patternData.right[c][i]||0;
      }
    });
    setLeft(lp); setRight(rp);
    leftRef.current=lp; rightRef.current=rp;
  },[subdiv]);

  var justSavedRef=useRef(false);
  var hasLoadedRef=useRef(false); // 初回ロード完了フラグ
  useEffect(function(){
    // 保存直後はスキップ（justSavedRefフラグ）
    if(canEdit && justSavedRef.current){ justSavedRef.current=false; return; }
    // 編集モードで、データありで一度ロード済みならスキップ（autoFetchによる上書き防止）
    var pdHasData=patternData&&(patternData.meta||patternData.left);
    if(canEdit && hasLoadedRef.current && pdHasData) return;
    if(pdHasData) hasLoadedRef.current=true;
    // meta.barsが存在する時だけその値を使う。なければ常に8（デフォルト）
    var metaBars = (patternData&&patternData.meta&&patternData.meta.bars)?parseInt(patternData.meta.bars)||8:8;
    var nb = Math.max(2, Math.min(metaBars, 32));
    var spb = subdivRef.current==="16th"?16:12;
    var total = nb * spb;
    barsRef.current = nb;
    var lp={}, rp={};
    COLORS_ALL.forEach(function(c){
      lp[c]=new Array(total).fill(0);
      rp[c]=new Array(total).fill(0);
      if(patternData&&patternData.left&&patternData.left[c]){
        for(var i=0;i<Math.min(patternData.left[c].length,total);i++) lp[c][i]=patternData.left[c][i]||0;
      }
      if(patternData&&patternData.right&&patternData.right[c]){
        for(var i=0;i<Math.min(patternData.right[c].length,total);i++) rp[c][i]=patternData.right[c][i]||0;
      }
    });
    if(patternData&&patternData.meta){
      if(patternData.meta.bars){
        setBars(String(patternData.meta.bars));
        barsRef.current=Math.max(2,Math.min(parseInt(patternData.meta.bars)||8,32));
      } else {
        setBars("8");
        barsRef.current=8;
      }
      if(patternData.meta.repeat){
        setRepeat(String(patternData.meta.repeat));
        repeatRef.current=parseInt(patternData.meta.repeat)||1;
      } else {
        setRepeat("1");
        repeatRef.current=1;
      }
      passesCompletedRef.current=0;
      if(patternData.meta.startTime){
        var st=patternData.meta.startTime;
        if(typeof st==="string"&&st.includes("GMT")){var d=new Date(st);if(!isNaN(d)){var h=d.getHours();var m=d.getMinutes();var s2=d.getSeconds();st=h+":"+(m<10?"0"+m:m)+(s2>0?":"+(s2<10?"0"+s2:s2):"");} else{st="";}}
        setSecTime(st);
      }
      if(patternData.meta.barLengths){
        var bl=JSON.parse(patternData.meta.barLengths);
        setBarLengths(bl); barLengthsRef.current=bl;
      } else {
        setBarLengths(null); barLengthsRef.current=null;
      }
    }
    setLeft(lp); setRight(rp);
    leftRef.current=lp; rightRef.current=rp;
    if(startTime){
      var st2=startTime;
      if(typeof st2==="string"&&st2.includes("GMT")){var d2=new Date(st2);if(!isNaN(d2)){var h2=d2.getHours();var m2=d2.getMinutes();var s22=d2.getSeconds();st2=h2+":"+(m2<10?"0"+m2:m2)+(s22>0?":"+(s22<10?"0"+s22:s22):"");} else{st2="";}}
      setSecTime(st2);
    }
    // patternData2（響ノ音）も再読込
    if(instrument2 && patternData2){
      var total2=nb*spb;
      var lp2={}, rp2={};
      COLORS2.forEach(function(c){
        lp2[c]=new Array(total2).fill(0);
        rp2[c]=new Array(total2).fill(0);
        if(patternData2.left&&patternData2.left[c]){for(var i=0;i<Math.min(patternData2.left[c].length,total2);i++)lp2[c][i]=patternData2.left[c][i]||0;}
        if(patternData2.right&&patternData2.right[c]){for(var i=0;i<Math.min(patternData2.right[c].length,total2);i++)rp2[c][i]=patternData2.right[c][i]||0;}
      });
      setLeft2(lp2); setRight2(rp2);
      left2Ref.current=lp2; right2Ref.current=rp2;
    }
  },[patternData,patternData2,startTime,subdivProp,sectionKey]);

  // autoPlay＆patternData読み込み後に自動再生（patternData useEffectの後に定義）
  useEffect(function(){
    if(!autoPlay) return;
    var cancelled=false;
    // patternDataが読み込まれるまで少し待つ
    var timer=setTimeout(function(){
      if(cancelled) return;
      initAudio(function(){
        if(cancelled) return;
        stepRef.current=0;
        setPlaying(true);
        doStart();
      });
    }, 0);
    return function(){
      cancelled=true;
      clearTimeout(timer);
      if(iidRef.current){clearInterval(iidRef.current);iidRef.current=null;}
    };
  },[patternData]);

  // patternData2専用useEffect（非同期読み込み後に反映）
  useEffect(function(){
    if(!instrument2 || !patternData2) return;
    // 編集モード中は上書きしない（保存後の誤上書き防止）
    if(canEdit) return;
    var nb2=Math.max(2,Math.min(parseInt(bars)||8,32));
    var spb2=subdivRef.current==="16th"?16:12;
    var total2=nb2*spb2;
    var lp2={}, rp2={};
    COLORS2.forEach(function(c){
      lp2[c]=new Array(total2).fill(0);
      rp2[c]=new Array(total2).fill(0);
      if(patternData2.left&&patternData2.left[c]){for(var i=0;i<Math.min(patternData2.left[c].length,total2);i++)lp2[c][i]=patternData2.left[c][i]||0;}
      if(patternData2.right&&patternData2.right[c]){for(var i=0;i<Math.min(patternData2.right[c].length,total2);i++)rp2[c][i]=patternData2.right[c][i]||0;}
    });
    setLeft2(lp2); setRight2(rp2);
    left2Ref.current=lp2; right2Ref.current=rp2;
  },[patternData2]);

  useEffect(function(){return function(){doStop();};},[]);

  // スペースキーで再生/停止
  useEffect(function(){
    function onKey(e){
      if(e.code==="Space"&&e.target.tagName!=="INPUT"&&e.target.tagName!=="TEXTAREA"){
        e.preventDefault();
        handlePlay();
      }
    }
    window.addEventListener("keydown",onKey);
    return function(){window.removeEventListener("keydown",onKey);};
  },[playing]);

  function initAudio(cb,overrideSoundType){
    if(actxRef.current){if(cb)cb();return;}
    var Ctx=window.AudioContext||window.webkitAudioContext;
    actxRef.current=new Ctx();
    var effectiveSoundType=overrideSoundType||soundType;
    var keys=Object.keys(METRO_SOUNDS_B64);var done=0;
    keys.forEach(function(k){
      var bin=atob(METRO_SOUNDS_B64[k]),arr=new Uint8Array(bin.length);
      for(var i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      actxRef.current.decodeAudioData(arr.buffer,function(buf){
        bufsRef.current['metro_'+k]=buf;done++;
        if(done===keys.length){
          // 1台目の音源
          var soundUrls=getSoundUrls(scoreId, (scoreId==="iridescence"||scoreId==="kigaru"||scoreId==="aoi")?effectiveSoundType:null);
          var skeys=Object.keys(soundUrls);
          // 2台目の音源
          var soundUrls2=instrument2?getSoundUrls(scoreId,instrument2):{};
          var skeys2=Object.keys(soundUrls2);
          var total=skeys.length+skeys2.length;
          if(total===0){if(cb)cb();return;}
          var loaded=0;
          function onLoad(){loaded++;if(loaded===total&&cb)cb();}
          skeys.forEach(function(sk){
            fetch(soundUrls[sk]).then(function(r){return r.arrayBuffer();})
              .then(function(b){return actxRef.current.decodeAudioData(b);})
              .then(function(ab){bufsRef.current[sk]=ab;onLoad();})
              .catch(function(){onLoad();});
          });
          skeys2.forEach(function(sk2){
            fetch(soundUrls2[sk2]).then(function(r){return r.arrayBuffer();})
              .then(function(b){return actxRef.current.decodeAudioData(b);})
              .then(function(ab){bufs2Ref.current[sk2]=ab;onLoad();})
              .catch(function(){onLoad();});
          });
        }
      },function(){done++;if(done===keys.length&&cb)cb();});
    });
  }

  function playSound(c){
    var actx=actxRef.current,bufs=bufsRef.current;
    if(!actx||!bufs[c])return;
    if(actx.state==="suspended"){ try { actx.resume(); } catch(e){} }
    var s=actx.createBufferSource();s.buffer=bufs[c];
    var g=actx.createGain();g.gain.value=scoreId==="nostalgic"?1.0:0.492;
    s.connect(g);g.connect(actx.destination);s.start(0);
  }
  function playSound2(c){
    var actx=actxRef.current,bufs2=bufs2Ref.current;
    if(!actx||!bufs2[c])return;
    if(actx.state==="suspended"){ try { actx.resume(); } catch(e){} }
    var s=actx.createBufferSource();s.buffer=bufs2[c];
    var g=actx.createGain();g.gain.value=0.492;
    s.connect(g);g.connect(actx.destination);s.start(0);
  }

  function woodClick(accent, atTime){
    var actx=actxRef.current,bufs=bufsRef.current;if(!actx)return;
    if(actx.state==="suspended"){ try { actx.resume(); } catch(e){} }
    var key=(accent&&bufs['metro_accent'])?'metro_accent':'metro_click';
    if(!bufs[key])return;
    var s=actx.createBufferSource();s.buffer=bufs[key];
    var g=actx.createGain();g.gain.value=metroVolRef.current;
    s.connect(g);g.connect(actx.destination);
    s.start(atTime||actx.currentTime);
  }

  function dimAll(){
    var f={};Object.keys(SCORE_DOTS).forEach(function(c){f[c]=SCORE_PALE_COLORS[c];});
    setDotFills(f);setDotLabel({});setDotLabel2({});setHighlightColor2(null);
  }

  function flashDot(color,hand){
    setDotFills(function(p){var n=Object.assign({},p);n[color]=SCORE_DOT_COLORS[color];return n;});
    if(lrOnRef.current)setDotLabel(function(p){var n=Object.assign({},p);n[color]=hand;return n;});
  }

  function getBarLengthsTotal(){
    var bl=barLengthsRef.current;
    var spb=subdivRef.current==="16th"?16:12;
    var nb=barsRef.current;
    if(!bl||bl.length!==nb) return nb*spb;
    return bl.reduce(function(a,b){return a+b;},0);
  }
  function getBarStart(barIdx){
    var bl=barLengthsRef.current;
    var spb=subdivRef.current==="16th"?16:12;
    var nb=barsRef.current;
    if(!bl||bl.length!==nb) return barIdx*spb;
    var start=0;
    for(var i=0;i<barIdx;i++) start+=bl[i];
    return start;
  }
  function getBarSpb(barIdx){
    var bl=barLengthsRef.current;
    var spb=subdivRef.current==="16th"?16:12;
    var nb=barsRef.current;
    if(!bl||bl.length!==nb) return spb;
    return bl[barIdx]||spb;
  }
  function stepToBar(s){
    var bl=barLengthsRef.current;
    var spb=subdivRef.current==="16th"?16:12;
    var nb=barsRef.current;
    if(!bl||bl.length!==nb) return Math.floor(s/spb);
    var acc=0;
    for(var i=0;i<nb;i++){acc+=bl[i];if(s<acc)return i;}
    return nb-1;
  }

  function tick(){
    var s=stepRef.current,L=leftRef.current,R=rightRef.current;
    // subdivPropRefから最新値を取得（クロージャstaleを回避）
    var currentSubdiv = subdivPropRef.current || "triplet";
    subdivRef.current = currentSubdiv; // ここで最新に同期
    var spbNow2=currentSubdiv==="16th"?16:12;
    var totalNow2=getBarLengthsTotal();
    var curBar=stepToBar(s);
    var barSpb=getBarSpb(curBar);
    var barStart=getBarStart(curBar);
    var s12=s-barStart; // 小節内のステップ位置
    if(s===0) console.log("tick start:", scoreId, sectionKey, "bars=",barsRef.current,"spb=",spbNow2,"total=",totalNow2);
    if(s >= totalNow2-2) console.log("tick near end: s=",s,"total=",totalNow2);
    var ms=Math.round((60/bpmRef.current/(currentSubdiv==="16th"?4:3))*1000);
    // intervalの間隔が現状のBPM/subdivと合っていない場合、interval再作成
    if(lastTickMsRef.current !== ms){
      console.log("tick interval再作成", lastTickMsRef.current, "→", ms, "subdiv=", currentSubdiv);
      lastTickMsRef.current = ms;
      if(iidRef.current){
        clearInterval(iidRef.current);
        iidRef.current = setInterval(tick, ms);
      }
    }
    if(dimRef.current)clearTimeout(dimRef.current);
    dimRef.current=setTimeout(dimAll,Math.round(ms*0.75));
    setCurStep(s);
    var totalNow = totalNow2;
    var nextStep = (s+1) % totalNow;
    stepRef.current = nextStep;
    // 1パス（barsで指定した小節数）完了。リピート回数に達するまでは、次のパスへそのまま続ける
    if(nextStep === 0) {
      passesCompletedRef.current += 1;
      var repeatCountNow = repeatRef.current || 1;
      if(passesCompletedRef.current >= repeatCountNow) {
        passesCompletedRef.current = 0;
        if(onLoopCompleteRef.current) {
          var cont=onLoopCompleteRef.current();
          if(!cont){ doStop(); return; }

        } else if(onSectionEndRef.current) {
          onSectionEndRef.current();
        }
      }
    }
    var fired={};
    // 2台目の音を鳴らす
    if(instrument2){
      var L2=left2Ref?left2Ref.current:{}; var R2=right2Ref?right2Ref.current:{};
      var hl2=null, dl2L=[], dl2R=[];
      COLORS2.forEach(function(c){
        if(L2[c]&&L2[c][s]&&bufs2Ref.current[c]){
          var src=actxRef.current.createBufferSource(); src.buffer=bufs2Ref.current[c];
          var g=actxRef.current.createGain(); g.gain.value=0.492;
          src.connect(g); g.connect(actxRef.current.destination); src.start(0);
          hl2=c; dl2L.push(c);
        }
        if(R2[c]&&R2[c][s]&&bufs2Ref.current[c]){
          var src2=actxRef.current.createBufferSource(); src2.buffer=bufs2Ref.current[c];
          var g2=actxRef.current.createGain(); g2.gain.value=0.6;
          src2.connect(g2); g2.connect(actxRef.current.destination); src2.start(0);
          hl2=c; dl2R.push(c);
        }
      });
      var allFired2=dl2L.concat(dl2R);
      if(allFired2.length>0){
        setTimeout(function(arr,lArr,rArr){return function(){
          setHighlightColor2(arr.slice());
          if(lrOnRef.current) setDotLabel2(function(p){
            var n=Object.assign({},p);
            lArr.forEach(function(c){n[c]="左";});
            rArr.forEach(function(c){n[c]=n[c]==="左"?"両":"右";});
            return n;
          });
        };}(allFired2,dl2L,dl2R),0);
      }
    }
    // メトロノームを最優先で鳴らす
    if(metroOnRef.current){
      var m=metroModeRef.current;
      var doAcc=s12===0&&metroAccentRef.current;
      if(currentSubdiv==="16th"){
        if(m===4&&s12%4===0)woodClick(doAcc);
        else if(m==="4u"&&s12%4===2)woodClick(doAcc);
        else if(m===8&&s12%2===0)woodClick(doAcc);
        else if(m==="8u"&&s12%2!==0)woodClick(doAcc);
      } else {
        if(m===4&&s12%3===0)woodClick(doAcc);
        else if(m==="4u"&&s12%3===1)woodClick(doAcc);
        else if(m===8)woodClick(doAcc);
        else if(m===3)woodClick(doAcc);
      }
    }
    // 音再生（WebAudio）は同期、state更新は非同期
    var firedL={},firedR={};
    COLORS_ALL.forEach(function(c){if(L[c]&&L[c][s]){playSound(c);firedL[c]=true;}});
    COLORS_ALL.forEach(function(c){if(R[c]&&R[c][s]){playSound(c);firedR[c]=true;}});
    setTimeout(function(){
      var fd={};
      Object.keys(firedL).forEach(function(c){flashDot(c,"左");fd[c]=true;});
      Object.keys(firedR).forEach(function(c){flashDot(c,fd[c]?"両":"右");});
    },0);
  }

  function doStart(){
    if(iidRef.current)clearInterval(iidRef.current);
    if(dimRef.current){clearTimeout(dimRef.current);dimRef.current=null;}
    // subdivPropから直接計算（クロージャのsubdiv変数はstaleの可能性）
    var currentSubdiv = subdivProp || "triplet";
    subdivRef.current = currentSubdiv;
    var ms = Math.round((60/bpmRef.current/(currentSubdiv==="16th"?4:3))*1000);
    lastTickMsRef.current = ms;
    iidRef.current=setInterval(tick, ms);
    console.log("doStart:", scoreId, sectionKey, "subdiv=", currentSubdiv, "ms=", ms);
  }

  function doStop(){
    if(iidRef.current){clearInterval(iidRef.current);iidRef.current=null;}
    if(dimRef.current){clearTimeout(dimRef.current);dimRef.current=null;}
    dimAll();stepRef.current=startStepRef.current;setCurStep(-1);setPlaying(false);
    passesCompletedRef.current = 0; // 停止時はリピート周回数もリセット
    if(onLoopComplete){}
  }

  function handlePlay(){
    if(playing){doStop();return;}
    // iOS: タップ操作内でAudioContextをresumeする
    if(actxRef.current&&actxRef.current.state==="suspended"){
      actxRef.current.resume();
    }
    initAudio(function(){
      stepRef.current=startStepRef.current;
      setPlaying(true);doStart();
    });
  }

  function handlePrint(){
    var DOTS=getEffectiveDots(scoreId, sectionKey, scale, instrument2);
    var nb=Math.max(2,Math.min(parseInt(bars)||8,32));
    var spb=subdiv==="16th"?16:12;
    var CELL_P=20, GAP_P=1;
    var stepH=CELL_P+GAP_P;
    var usedColors={};
    COLORS_ALL.forEach(function(c){
      for(var i=0;i<nb*spb;i++){
        if((left[c]&&left[c][i])||(right[c]&&right[c][i])){ usedColors[c]=true; break; }
      }
    });
    var displayTime=secTime||"";
    if(displayTime&&displayTime.includes("GMT")){
      var d=new Date(displayTime);
      if(!isNaN(d)){var h=d.getHours();var m=d.getMinutes();displayTime=h+":"+(m<10?"0"+m:m);}
      else displayTime="";
    }
    function barHtml(barIdx){
      var barSpb=getBarSpb(barIdx);
      var barStart=getBarStart(barIdx);
      var rows="";
      for(var i=0;i<barSpb;i++){
        var s=barStart+i;
        var ibs=i===0;
        var ib=subdiv==="16th"?i%4===0:i%3===0;
        var i8=subdiv==="16th"&&i%2===0&&i%4!==0;
        var lColor=null, rColor=null;
        COLORS_ALL.forEach(function(c){
          if(left[c]&&left[c][s]) lColor=c;
          if(right[c]&&right[c][s]) rColor=c;
        });
        var bg=ibs?"rgba(0,0,0,0.1)":ib?"rgba(0,0,0,0.05)":"transparent";
        var lBg=lColor?SCORE_DOT_COLORS[lColor]:"#e8e8e8";
        var rBg=rColor?SCORE_DOT_COLORS[rColor]:"#e8e8e8";
        rows+='<div style="display:flex;height:'+stepH+'px;align-items:center;background:'+bg+'">'
          +'<div style="width:'+CELL_P+'px;height:'+(CELL_P-1)+'px;background:'+lBg+';border-radius:3px;margin-right:'+GAP_P+'px"></div>'
          +'<div style="width:8px;height:4px;display:flex;align-items:center;justify-content:center">'+(i8?'<div style="width:3px;height:3px;border-radius:50%;background:#ccc"></div>':'')+'</div>'
          +'<div style="width:'+CELL_P+'px;height:'+(CELL_P-1)+'px;background:'+rBg+';border-radius:3px;margin-left:'+GAP_P+'px"></div>'
          +'</div>';
      }
      return '<div style="display:inline-block;margin:3px;background:#fff;border-radius:6px;padding:5px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">'
        +'<div style="font-size:9px;font-weight:700;color:#888;margin-bottom:2px;text-align:center">'+(barIdx+1)+'</div>'
        +rows+'</div>';
    }
    var barsHtml=[];
    for(var bi=0;bi<nb;bi++) barsHtml.push(barHtml(bi));
    var svgDots="";
    var _lbls=getDrumLabels(scoreId, sectionKey, scale);var highLabel=scale==="nostalgic"?"高音":_lbls.top;var lowLabel=scale==="nostalgic"?"低音":_lbls.bottom;
    Object.keys(DOTS).forEach(function(color){
      if(scale==="nostalgic"&&color==="pink") return;
      var pos=DOTS[color];
      var fill=usedColors[color]?SCORE_DOT_COLORS[color]:SCORE_PALE_COLORS[color];
      svgDots+='<circle cx="'+pos.cx+'" cy="'+pos.cy+'" r="12" fill="'+fill+'" stroke="white" stroke-width="1.5"/>';
    });
    var svgHtml='<svg viewBox="0 0 140 166" width="110" height="130" style="flex-shrink:0">'
      +'<circle cx="70" cy="83" r="67" fill="transparent" stroke="#a09890" stroke-width="0.4"/>'
      +'<text x="70" y="10" text-anchor="middle" font-size="10" font-family="sans-serif" fill="#999">'+highLabel+'</text>'
      +'<text x="70" y="162" text-anchor="middle" font-size="10" font-family="sans-serif" fill="#999">'+lowLabel+'</text>'
      +svgDots+'</svg>';
    var sections=SCORE_SECTIONS[scoreId]||[];
    var secListHtml=sections.map(function(s){
      var isCurrent=s[0]===sectionKey;
      return '<span style="font-size:9px;color:'+(isCurrent?"#1a3a2a":"#aaa")+';font-weight:'+(isCurrent?"700":"400")+';margin-right:6px">'+(isCurrent?"▶ ":"")+s[1]+'</span>';
    }).join("");
    var gridHtml=(function(){
      var rowsHtml="";
      for(var rr=0;rr<Math.ceil(nb/8);rr++){
        rowsHtml+='<div style="display:flex;flex-wrap:nowrap;gap:1px;margin-bottom:4px">';
        for(var bb=rr*8;bb<Math.min((rr+1)*8,nb);bb++) rowsHtml+=barsHtml[bb]||"";
        rowsHtml+='</div>';
      }
      return rowsHtml;
    })();
    var songTitle=SCORE_ID_TO_NAME[scoreId]||scoreId;
    var win=window.open("","_blank");
    win.document.write('<!DOCTYPE html><html><head><meta charset="utf-8">'
      +'<title>'+songTitle+' - '+sectionLabel+'</title>'
      +'<style>@page{size:A4 landscape;margin:8mm}body{font-family:sans-serif;margin:0}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>'
      +'<div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e0e0e0">'
        +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:18px;font-weight:700;color:#1a3a2a;margin-bottom:2px">'+songTitle+'</div>'
          +'<div style="font-size:11px;color:#666;margin-bottom:6px">Composed by DANiLO</div>'
          +'<div style="margin-bottom:8px;line-height:1.8">'+secListHtml+'</div>'
          +'<div style="font-size:14px;font-weight:700;color:#333;margin-bottom:2px">'+sectionLabel+'</div>'
          +'<div style="font-size:11px;color:#888">'+nb+'小節'+(displayTime?' ／ '+displayTime+'〜':'')+'</div>'
        +'</div>'
        +svgHtml
      +'</div>'
      +'<div>'+gridHtml+'</div>'
      +'<div style="margin-top:8px;font-size:8px;color:#bbb;text-align:center">© DANiLO / グーダドラムオーケストラ 響合〜hibikiai〜 All Rights Reserved.</div>'
      +'</body></html>');
    win.document.close();
    setTimeout(function(){win.print();},300);
  }

  function handleBpm(v){setBpm(v);bpmRef.current=v;if(playing)doStart();}

  function toggleCell2(side,color,idx){
    if(!canEdit)return;
    hasLoadedRef.current=true; // 編集開始フラグ
    var setter=side==="left"?setLeft2:setRight2;
    var willBeOn;
    var totalSteps2=Math.max(2,Math.min(parseInt(bars)||8,32))*SPB;
    setter(function(prev){
      var p=Object.assign({},prev);
      if(!p[color]) p[color]=new Array(totalSteps2).fill(0);
      else p[color]=prev[color].slice();
      p[color][idx]^=1;
      willBeOn=p[color][idx]===1;
      return p;
    });
    setTimeout(function(){
      if(willBeOn){
        setHighlightColor2(color);
        setTimeout(function(){setHighlightColor2(null);},300);
        initAudio(function(){ playSound2(color); });
      }
    },0);
  }

  function toggleCell(side,color,idx){
    if(!canEdit)return;
    hasLoadedRef.current=true; // 編集開始フラグ
    var setter=side==="left"?setLeft:setRight;
    var willBeOn;
    setter(function(prev){
      var p=Object.assign({},prev);p[color]=prev[color].slice();
      p[color][idx]^=1;
      willBeOn=p[color][idx]===1;
      return p;
    });
    // ONになった時だけ音を鳴らす
    setTimeout(function(){
      if(willBeOn) {
        setHighlightColor(color);
        setTimeout(function(){ setHighlightColor(null); }, 300);
        initAudio(function(){ playSound(color); });
      }
    }, 0);
  }

  function handleSave(){ justSavedRef.current=true;
    setSaving(true);setSaveMsg("");
    var p=onSave(scoreId,sectionKey,left,right,{bars:bars,repeat:repeat,startTime:secTime,barLengths:barLengths},instrument2?left2:null,instrument2?right2:null);
    if(p&&p.then){
      p.then(function(){setSaveMsg("✅ 保存しました");setSaving(false);setTimeout(function(){setSaveMsg("");},3000);})
       .catch(function(){setSaveMsg("❌ 失敗しました");setSaving(false);});
    }else{setSaveMsg("✅ 保存しました");setSaving(false);setTimeout(function(){setSaveMsg("");},3000);}
  }

  function Sw(on){
    return <div style={{position:"relative",width:28,height:16,background:on?"#27AE60":"#d0cec8",borderRadius:8,flexShrink:0,transition:"background .2s"}}>
      <div style={{position:"absolute",top:2,left:2,width:12,height:12,background:"#fff",borderRadius:"50%",transition:"transform .2s",transform:on?"translateX(12px)":"none"}}/>
    </div>;
  }

  // 中央の拍目印カラム（左右の間）
  // 小節頭・4分音符の位置に横帯を表示、クリックで再生開始位置を設定
  function renderBeatCol(barIdx){
    var stepH = CELL+GAP;
    var barSPB=(barLengths&&barLengths.length>barIdx)?barLengths[barIdx]:SPB;
    var barOffset=(function(){if(!barLengths||barLengths.length!==parseInt(bars))return barIdx*SPB;var o=0;for(var ii=0;ii<barIdx;ii++)o+=barLengths[ii];return o;})();
    var rows = [];
    for(var i=0;i<barSPB;i++){
      var s=barOffset+i;
      var ibs=i===0, ib=(subdiv==="16th"?i%4===0:i%3===0)&&i!==0;
      var cur=s===curStep;
      var isStart=s===startStepRef.current;
      // 帯の色とサイズ
      var band=null;
      if(ibs){
        // 小節頭: 濃いグレーの太い横帯
        band=<div style={{position:"absolute",top:0,left:0,right:0,height:"100%",background:isStart?"#E74C3C":cur?"#505050":"#909090",borderRadius:2}}/>;
      } else if(ib){
        // 4分音符: 薄いグレーの細い横帯（中央寄り）
        band=<div style={{position:"absolute",top:"30%",left:0,right:0,height:"40%",background:isStart?"rgba(231,76,60,0.6)":cur?"#808080":"#bbbbbb",borderRadius:1}}/>;
      } else {
        // 三連の細分: 小さいドット
        band=<div style={{position:"absolute",top:"50%",left:"50%",width:3,height:3,borderRadius:"50%",background:cur?"#888":"#d0d0d0",transform:"translate(-50%,-50%)"}}/>;
      }
      rows.push(
        <div key={i}
          onClick={function(ss){return function(e){e.stopPropagation();startStepRef.current=ss;setCurStep(-1);};}(s)}
          style={{
            position:"relative",
            width:14, height:stepH-GAP,
            marginBottom:GAP,
            cursor:"pointer",
            overflow:"visible",
          }}>
          {band}
        </div>
      );
    }
    return <div style={{display:"flex",flexDirection:"column",width:12,flexShrink:0}}>{rows}</div>;
  }

  // 片側（左手or右手）のグリッド
  // canEdit=true: 9色列、各色薄い色ベース、クリックでON/OFF
  // canEdit=false: 1列、設定色を表示、なければ薄いグレー
  function renderSideGrid(barIdx, side){
    var pat=side==="left"?left:right;
    var sideColors=side==="left"?COLORS_LEFT:COLORS_RIGHT;
    var barSPB=(barLengths&&barLengths.length>barIdx)?barLengths[barIdx]:SPB;
    var barOffset=(function(){if(!barLengths||barLengths.length!==parseInt(bars))return barIdx*SPB;var o=0;for(var ii=0;ii<barIdx;ii++)o+=barLengths[ii];return o;})();

    if(canEdit){
      // 編集モード: 9色列
      return (
        <div style={{display:"flex",flexDirection:"row"}}>
          {sideColors.map(function(color){
            var cells=[];
            for(var i=0;i<barSPB;i++){
              var s=barOffset+i;
              var on=pat[color]&&pat[color][s];
              var cur=s===curStep;
              var ibs=i===0;
              var ib=(subdiv==="16th"?i%4===0:i%3===0)&&i!==0;
              cells.push(
                <div key={i}
                  onClick={function(ss,co,si){return function(e){
                    e.stopPropagation();
                    toggleCell(si,co,ss);
                  };}(s,color,side)}
                  style={{
                    width:CELL,height:CELL,
                    marginBottom:GAP,
                    borderRadius:2,
                    background:on
                      ? SCORE_DOT_COLORS[color]
                      : (ibs||ib)
                        ? SCORE_PALE_COLORS[color]
                        : "#e8e8e8",
                    opacity: on ? 1 : (ibs||ib) ? 0.6 : 1,
                    cursor:"pointer",
                    outline:cur?"2px solid #555":"none",
                    outlineOffset:"-1px",
                    position:"relative",zIndex:2,
                  }}
                />
              );
            }
            return <div key={color} style={{display:"flex",flexDirection:"column",marginRight:GAP}}>{cells}</div>;
          })}
        </div>
      );
     } else {
      // 閲覧モード: 1列のみ
      var cells=[];
      var pat2side=instrument2?(side==="left"?left2:right2):null;
      for(var i=0;i<barSPB;i++){
        var s=barOffset+i;
        var cur=s===curStep;
        var isStart=s===startStepRef.current;
        // 風ノ音の色を探す（最大2色）
        var foundColors=[];
        for(var ci=0;ci<sideColors.length;ci++){
          if(pat[sideColors[ci]]&&pat[sideColors[ci]][s]) foundColors.push(sideColors[ci]);
          if(foundColors.length>=2) break;
        }
        // 響ノ音の色を探す（instrument2がある時のみ、最大2色）
        var foundColors2=[];
        if(pat2side){
          for(var ci2=0;ci2<COLORS2.length;ci2++){
            if(pat2side[COLORS2[ci2]]&&pat2side[COLORS2[ci2]][s]) foundColors2.push(COLORS2[ci2]);
            if(foundColors2.length>=2) break;
          }
        }
        var haFu=foundColors.length>0;
        var haHi=foundColors2.length>0;
        var bg;
        if(cur) bg="rgba(0,0,0,0.2)";
        else if(haHi&&haFu) bg="linear-gradient(to bottom, "+DOT_COLORS2[foundColors2[0]]+" 50%, "+SCORE_DOT_COLORS[foundColors[0]]+" 50%)";
        else if(haHi) bg=foundColors2.length>=2?"linear-gradient(to bottom, "+DOT_COLORS2[foundColors2[0]]+" 50%, "+DOT_COLORS2[foundColors2[1]]+" 50%)":DOT_COLORS2[foundColors2[0]];
        else if(haFu) bg=foundColors.length>=2?"linear-gradient(to bottom, "+SCORE_DOT_COLORS[foundColors[0]]+" 50%, "+SCORE_DOT_COLORS[foundColors[1]]+" 50%)":SCORE_DOT_COLORS[foundColors[0]];
        else bg="#e8e6e2";
        cells.push(
          <div key={i}
            onClick={function(ss){return function(e){e.stopPropagation();startStepRef.current=ss;setCurStep(-1);};}(s)}
            style={{
              width:CELL,height:CELL,
              marginBottom:GAP,
              borderRadius:2,
              background:bg,
              cursor:"pointer",
              outline:cur?"2px solid #555":isStart?"2px solid #E74C3C":"none",
              outlineOffset:"-1px",
              position:"relative",zIndex:2,
            }}
          />
        );
      }
      return <div style={{display:"flex",flexDirection:"column"}}>{cells}</div>;
    }
  }

  // 1小節ブロック
function renderSideGrid2(barIdx, side){
    var pat=side==="left"?left2:right2;
    var barSPB=(barLengths&&barLengths.length>barIdx)?barLengths[barIdx]:SPB;
    var barOffset=(function(){if(!barLengths||barLengths.length!==parseInt(bars))return barIdx*SPB;var o=0;for(var ii=0;ii<barIdx;ii++)o+=barLengths[ii];return o;})();

    if(canEdit){
      // 編集モード: 9色列
      return (
        <div style={{display:"flex",flexDirection:"row"}}>
          {COLORS2.map(function(color){
            var cells=[];
            for(var i=0;i<barSPB;i++){
              var s=barOffset+i;
              var on=pat[color]&&pat[color][s];
              var cur=s===curStep;
              var ibs=i===0;
              var ib=(subdiv==="16th"?i%4===0:i%3===0)&&i!==0;
              cells.push(
                <div key={i}
                  onClick={function(ss,co,si){return function(e){
                    e.stopPropagation();
                    toggleCell2(si,co,ss);
                  };}(s,color,side)}
                  style={{
                    width:CELL,height:CELL,
                    marginBottom:GAP,
                    borderRadius:2,
                    background:on
                      ? SCORE_HIBIKI_COLORS[color]
                      : (ibs||ib)
                        ? SCORE_HIBIKI_PALE_COLORS[color]
                        : "#e8e8e8",
                    opacity: on ? 1 : (ibs||ib) ? 0.6 : 1,
                    cursor:"pointer",
                    outline:cur?"2px solid #555":"none",
                    outlineOffset:"-1px",
                    position:"relative",zIndex:2,
                  }}
                />
              );
            }
            return <div key={color} style={{display:"flex",flexDirection:"column",marginRight:GAP}}>{cells}</div>;
          })}
        </div>
      );
    } else {
      // 閲覧モード: 1列のみ
      var cells=[];
      for(var i=0;i<barSPB;i++){
        var s=barOffset+i;
        var cur=s===curStep;
        var isStart=s===startStepRef.current;
        // その行に設定されてる色を探す（最大2色）
        var foundColors=[];
        for(var ci=0;ci<COLORS2.length;ci++){
          if(pat[COLORS2[ci]]&&pat[COLORS2[ci]][s]) foundColors.push(COLORS2[ci]);
          if(foundColors.length>=2) break;
        }
        var foundColor=foundColors[0]||null;
        cells.push(
          <div key={i}
            onClick={function(ss){return function(e){e.stopPropagation();startStepRef.current=ss;setCurStep(-1);};}(s)}
            style={{
              width:CELL,height:CELL,
              marginBottom:GAP,
              borderRadius:2,
              background:cur?"rgba(0,0,0,0.2)":foundColors.length===0?"#e8e6e2":foundColors.length===1?DOT_COLORS2[foundColors[0]]:"linear-gradient(to bottom, "+DOT_COLORS2[foundColors[0]]+" 50%, "+DOT_COLORS2[foundColors[1]]+" 50%)",
              cursor:"pointer",
              outline:cur?"2px solid #555":isStart?"2px solid #E74C3C":"none",
              outlineOffset:"-1px",
              position:"relative",zIndex:2,
            }}
          />
        );
      }
      return <div style={{display:"flex",flexDirection:"column"}}>{cells}</div>;
    }
  }

  // 1小節ブロック
  function renderBar(barIdx){
    var isStart=startBar===barIdx;
    var stepH=CELL+GAP;
    var nCols=canEdit?(isAttackEnabled?COLORS.length+1:COLORS.length):1; // アタック対応曲のみ+1列
    var sideW=nCols*(CELL+GAP);
    var beatW=14;
    var totalW=sideW+beatW+sideW;
    // barLengths対応：この小節のSPBと開始オフセットを計算
    var barSPB=(barLengths&&barLengths.length>barIdx)?barLengths[barIdx]:SPB;
    var barOffset=(function(){if(!barLengths||barLengths.length!==parseInt(bars))return barIdx*SPB;var o=0;for(var ii=0;ii<barIdx;ii++)o+=barLengths[ii];return o;})();

    // 帯リスト（後ろに配置）
    var bands=[];
    for(var i=0;i<barSPB;i++){
      var s=barOffset+i;
      var ibs_b=i===0;
      var ib_b=(subdiv==="16th"?i%4===0:i%3===0)&&i!==0;
      var i8_b=subdiv==="16th"&&i%2===0&&i%4!==0;
      var cur_b=s===curStep;
      var isRowStart=s===startStepRef.current;
      if(ibs_b){
        bands.push(<div key={"b"+i} style={{
          position:"absolute",left:0,right:0,
          top:i*stepH,height:stepH-GAP,
          background:isRowStart?"rgba(231,76,60,0.25)":cur_b?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.12)",
          borderRadius:2,pointerEvents:"none",zIndex:0,
        }}/>);
      } else if(ib_b){
        bands.push(<div key={"b"+i} style={{
          position:"absolute",left:0,right:0,
          top:i*stepH+Math.floor(stepH*0.3),height:Math.floor(stepH*0.4),
          background:isRowStart?"rgba(231,76,60,0.15)":cur_b?"rgba(0,0,0,0.15)":"rgba(0,0,0,0.07)",
          borderRadius:1,pointerEvents:"none",zIndex:0,
        }}/>);
      } else if(i8_b){
        bands.push(<div key={"b"+i} style={{
          position:"absolute",left:"50%",transform:"translateX(-50%)",
          top:i*stepH+Math.floor(stepH*0.35),
          width:4,height:4,borderRadius:"50%",
          background:cur_b?"rgba(0,0,0,0.4)":"rgba(0,0,0,0.15)",
          pointerEvents:"none",zIndex:0,
        }}/>);
      } else if(cur_b){
        bands.push(<div key={"b"+i} style={{
          position:"absolute",left:0,right:0,
          top:i*stepH,height:stepH-GAP,
          background:"rgba(0,0,0,0.15)",
          borderRadius:2,pointerEvents:"none",zIndex:0,
        }}/>);
      }
    }
    // 中央クリック列（拍区切り目印）
    var beatCells=[];
    for(var j=0;j<barSPB;j++){
      var ss=barOffset+j;
      var jbs=j===0;
      var jb=(subdiv==="16th"?j%4===0:j%3===0)&&j!==0;
      var j8=subdiv==="16th"&&j%2===0&&j%4!==0;
      var dot=null;
      if(!jbs&&!jb&&!j8){
        // 三連の細分 or 16分の細分: 小さいドット
        dot=<div style={{width:2,height:2,borderRadius:"50%",background:"#ccc",margin:"0 auto"}}/>;
      } else if(j8){
        // 8分音符位置（16分モード）: 中くらいのドット
        dot=<div style={{width:3,height:3,borderRadius:"50%",background:"#bbb",margin:"0 auto"}}/>;
      }
      beatCells.push(
        <div key={j}
          onClick={function(s2){return function(e){e.stopPropagation();startStepRef.current=s2;setCurStep(-1);};}(ss)}
          style={{height:stepH-GAP,marginBottom:GAP,width:beatW,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:1}}>
          {dot}
        </div>
      );
    }

    return (
      <div key={barIdx} onClick={function(b){return function(){startStepRef.current=barOffset;setStartBar(b);setCurStep(-1);setSelectedBarSync(b);};}(barIdx)} style={{flexShrink:0,marginRight:6,background:"#fff",borderRadius:10,padding:"8px",cursor:"pointer",boxShadow:isStart?"0 4px 16px rgba(0,0,0,0.25)":"0 1px 4px rgba(0,0,0,0.08)",border:"1px solid #e8e8e8"}}>
        {/* 小節番号 */}
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
          <div onClick={function(b){return function(){startStepRef.current=barOffset;setStartBar(b);setCurStep(-1);setSelectedBarSync(b);};}(barIdx)}
            onMouseDown={function(b){return function(e){e.stopPropagation();setSelectedBarSync(b);};}(barIdx)}
            style={{width:18,height:18,borderRadius:"50%",flexShrink:0,
              background:isStart?"#E74C3C":"#a8a5a0",
              color:"#fff",fontSize:10,fontWeight:700,
              display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            {barIdx+1}
          </div>
          <div style={{fontSize:8,color:"#888"}}>小節</div>
          {canEdit&&(
            <div onClick={function(b){return function(e){e.stopPropagation();
              setBarLengths(function(prev){
                var nb=Math.max(2,Math.min(parseInt(bars)||8,32));
                var defaultSPB=subdivRef.current==="16th"?16:12;
                var spb34=subdivRef.current==="16th"?12:9;
                var spb24=subdivRef.current==="16th"?8:6;
                var arr=prev?prev.slice():new Array(nb).fill(defaultSPB);
                if(arr.length!==nb) arr=new Array(nb).fill(defaultSPB);
                var cur=arr[b]||defaultSPB;
                arr[b]=cur===defaultSPB?spb34:cur===spb34?spb24:defaultSPB;
                var next=arr.slice();
                barLengthsRef.current=next;
                return next;
              });
            };}(barIdx)}
              style={{fontSize:9,padding:"1px 5px",borderRadius:4,border:"0.5px solid #d0cec8",
                background:(subdiv==="16th"?barSPB===12:barSPB===9)?"#708238":(subdiv==="16th"?barSPB===8:barSPB===6)?"#c87020":"#fff",
                color:((subdiv==="16th"?barSPB===12:barSPB===9)||(subdiv==="16th"?barSPB===8:barSPB===6))?"#fff":"#a0a0a0",
                cursor:"pointer",userSelect:"none",flexShrink:0}}>
              {(subdiv==="16th"?barSPB===12:barSPB===9)?"3/4":(subdiv==="16th"?barSPB===8:barSPB===6)?"2/4":"4/4"}
            </div>
          )}
        </div>
        {/* 色見本（編集モードのみ） */}
        {canEdit&&(
          <div style={{display:"flex",gap:0,marginBottom:2}}>
            <div style={{display:"flex"}}>
              {COLORS_LEFT.map(function(c){return <div key={c} style={{width:CELL,height:5,background:SCORE_DOT_COLORS[c],borderRadius:1,marginRight:GAP}}/>;  })}
            </div>
            <div style={{width:beatW,flexShrink:0}}/>
            <div style={{display:"flex"}}>
              {COLORS_RIGHT.map(function(c){return <div key={c+"r"} style={{width:CELL,height:5,background:SCORE_DOT_COLORS[c],borderRadius:1,marginRight:GAP}}/>;  })}
            </div>
          </div>
        )}
        {/* グリッド本体: position:relativeで帯を後ろに */}
        <div style={{position:"relative",width:totalW,height:barSPB*stepH}}>
          {/* 帯（後ろ） */}
          {bands}
          {/* 左手 */}
          <div style={{position:"absolute",left:0,top:0,zIndex:1}}>
            {renderSideGrid(barIdx,"left")}
          </div>
          {/* 中央クリック列 */}
          <div style={{position:"absolute",left:sideW,top:0,width:beatW,zIndex:1}}>
            {beatCells}
          </div>
          {/* 右手 */}
          <div style={{position:"absolute",left:sideW+beatW,top:0,zIndex:1}}>
            {renderSideGrid(barIdx,"right")}
          </div>
        </div>
      </div>
    );
  }

  var numBars = Math.max(2, Math.min(parseInt(bars)||8, 32));
  var TOTAL = SPB * numBars;
  // 上段: 奇数インデックス(0,2,4...) 下段: 偶数インデックス(1,3,5...)
  var topBars=[], botBars=[];
  for(var bi=0;bi<numBars;bi++){
    if(bi%2===0) topBars.push(bi);
    else botBars.push(bi);
  }
  var gridH=SPB*(CELL+GAP);
  var headerH=18+2+5+2; // 小節番号+margin+色見本+margin




  function initAudio(cb,overrideSoundType){
    if(actxRef.current){if(cb)cb();return;}
    var Ctx=window.AudioContext||window.webkitAudioContext;
    actxRef.current=new Ctx();
    var effectiveSoundType=overrideSoundType||soundType;
    var keys=Object.keys(METRO_SOUNDS_B64);var done=0;
    keys.forEach(function(k){
      var bin=atob(METRO_SOUNDS_B64[k]),arr=new Uint8Array(bin.length);
      for(var i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);
      actxRef.current.decodeAudioData(arr.buffer,function(buf){
        bufsRef.current['metro_'+k]=buf;done++;
        if(done===keys.length){
          // 1台目の音源
          var soundUrls=getSoundUrls(scoreId, (scoreId==="iridescence"||scoreId==="kigaru"||scoreId==="aoi")?effectiveSoundType:null);
          var skeys=Object.keys(soundUrls);
          // 2台目の音源
          var soundUrls2=instrument2?getSoundUrls(scoreId,instrument2):{};
          var skeys2=Object.keys(soundUrls2);
          var total=skeys.length+skeys2.length;
          if(total===0){if(cb)cb();return;}
          var loaded=0;
          function onLoad(){loaded++;if(loaded===total&&cb)cb();}
          skeys.forEach(function(sk){
            fetch(soundUrls[sk]).then(function(r){return r.arrayBuffer();})
              .then(function(b){return actxRef.current.decodeAudioData(b);})
              .then(function(ab){bufsRef.current[sk]=ab;onLoad();})
              .catch(function(){onLoad();});
          });
          skeys2.forEach(function(sk2){
            fetch(soundUrls2[sk2]).then(function(r){return r.arrayBuffer();})
              .then(function(b){return actxRef.current.decodeAudioData(b);})
              .then(function(ab){bufs2Ref.current[sk2]=ab;onLoad();})
              .catch(function(){onLoad();});
          });
        }
      },function(){done++;if(done===keys.length&&cb)cb();});
    });
  }

  function playSound(c){
    var actx=actxRef.current,bufs=bufsRef.current;
    if(!actx||!bufs[c])return;
    if(actx.state==="suspended"){ try { actx.resume(); } catch(e){} }
    var s=actx.createBufferSource();s.buffer=bufs[c];
    var g=actx.createGain();g.gain.value=scoreId==="nostalgic"?1.0:0.492;
    s.connect(g);g.connect(actx.destination);s.start(0);
  }
  function playSound2(c){
    var actx=actxRef.current,bufs2=bufs2Ref.current;
    if(!actx||!bufs2[c])return;
    if(actx.state==="suspended"){ try { actx.resume(); } catch(e){} }
    var s=actx.createBufferSource();s.buffer=bufs2[c];
    var g=actx.createGain();g.gain.value=0.492;
    s.connect(g);g.connect(actx.destination);s.start(0);
  }

  function woodClick(accent, atTime){
    var actx=actxRef.current,bufs=bufsRef.current;if(!actx)return;
    if(actx.state==="suspended"){ try { actx.resume(); } catch(e){} }
    var key=(accent&&bufs['metro_accent'])?'metro_accent':'metro_click';
    if(!bufs[key])return;
    var s=actx.createBufferSource();s.buffer=bufs[key];
    var g=actx.createGain();g.gain.value=metroVolRef.current;
    s.connect(g);g.connect(actx.destination);
    s.start(atTime||actx.currentTime);
  }

  function dimAll(){
    var f={};Object.keys(SCORE_DOTS).forEach(function(c){f[c]=SCORE_PALE_COLORS[c];});
    setDotFills(f);setDotLabel({});setDotLabel2({});setHighlightColor2(null);
  }

  function flashDot(color,hand){
    setDotFills(function(p){var n=Object.assign({},p);n[color]=SCORE_DOT_COLORS[color];return n;});
    if(lrOnRef.current)setDotLabel(function(p){var n=Object.assign({},p);n[color]=hand;return n;});
  }

  function getBarLengthsTotal(){
    var bl=barLengthsRef.current;
    var spb=subdivRef.current==="16th"?16:12;
    var nb=barsRef.current;
    if(!bl||bl.length!==nb) return nb*spb;
    return bl.reduce(function(a,b){return a+b;},0);
  }
  function getBarStart(barIdx){
    var bl=barLengthsRef.current;
    var spb=subdivRef.current==="16th"?16:12;
    var nb=barsRef.current;
    if(!bl||bl.length!==nb) return barIdx*spb;
    var start=0;
    for(var i=0;i<barIdx;i++) start+=bl[i];
    return start;
  }
  function getBarSpb(barIdx){
    var bl=barLengthsRef.current;
    var spb=subdivRef.current==="16th"?16:12;
    var nb=barsRef.current;
    if(!bl||bl.length!==nb) return spb;
    return bl[barIdx]||spb;
  }
  function stepToBar(s){
    var bl=barLengthsRef.current;
    var spb=subdivRef.current==="16th"?16:12;
    var nb=barsRef.current;
    if(!bl||bl.length!==nb) return Math.floor(s/spb);
    var acc=0;
    for(var i=0;i<nb;i++){acc+=bl[i];if(s<acc)return i;}
    return nb-1;
  }

  function tick(){
    var s=stepRef.current,L=leftRef.current,R=rightRef.current;
    // subdivPropRefから最新値を取得（クロージャstaleを回避）
    var currentSubdiv = subdivPropRef.current || "triplet";
    subdivRef.current = currentSubdiv; // ここで最新に同期
    var spbNow2=currentSubdiv==="16th"?16:12;
    var totalNow2=getBarLengthsTotal();
    var curBar=stepToBar(s);
    var barSpb=getBarSpb(curBar);
    var barStart=getBarStart(curBar);
    var s12=s-barStart; // 小節内のステップ位置
    if(s===0) console.log("tick start:", scoreId, sectionKey, "bars=",barsRef.current,"spb=",spbNow2,"total=",totalNow2);
    if(s >= totalNow2-2) console.log("tick near end: s=",s,"total=",totalNow2);
    var ms=Math.round((60/bpmRef.current/(currentSubdiv==="16th"?4:3))*1000);
    // intervalの間隔が現状のBPM/subdivと合っていない場合、interval再作成
    if(lastTickMsRef.current !== ms){
      console.log("tick interval再作成", lastTickMsRef.current, "→", ms, "subdiv=", currentSubdiv);
      lastTickMsRef.current = ms;
      if(iidRef.current){
        clearInterval(iidRef.current);
        iidRef.current = setInterval(tick, ms);
      }
    }
    if(dimRef.current)clearTimeout(dimRef.current);
    dimRef.current=setTimeout(dimAll,Math.round(ms*0.75));
    setCurStep(s);
    var totalNow = totalNow2;
    var nextStep = (s+1) % totalNow;
    stepRef.current = nextStep;
    // 1パス（barsで指定した小節数）完了。リピート回数に達するまでは、次のパスへそのまま続ける
    if(nextStep === 0) {
      passesCompletedRef.current += 1;
      var repeatCountNow = repeatRef.current || 1;
      if(passesCompletedRef.current >= repeatCountNow) {
        passesCompletedRef.current = 0;
        if(onLoopCompleteRef.current) {
          var cont=onLoopCompleteRef.current();
          if(!cont){ doStop(); return; }

        } else if(onSectionEndRef.current) {
          onSectionEndRef.current();
        }
      }
    }
    var fired={};
    // 2台目の音を鳴らす
    if(instrument2){
      var L2=left2Ref?left2Ref.current:{}; var R2=right2Ref?right2Ref.current:{};
      var hl2=null, dl2L=[], dl2R=[];
      COLORS2.forEach(function(c){
        if(L2[c]&&L2[c][s]&&bufs2Ref.current[c]){
          var src=actxRef.current.createBufferSource(); src.buffer=bufs2Ref.current[c];
          var g=actxRef.current.createGain(); g.gain.value=0.492;
          src.connect(g); g.connect(actxRef.current.destination); src.start(0);
          hl2=c; dl2L.push(c);
        }
        if(R2[c]&&R2[c][s]&&bufs2Ref.current[c]){
          var src2=actxRef.current.createBufferSource(); src2.buffer=bufs2Ref.current[c];
          var g2=actxRef.current.createGain(); g2.gain.value=0.6;
          src2.connect(g2); g2.connect(actxRef.current.destination); src2.start(0);
          hl2=c; dl2R.push(c);
        }
      });
      var allFired2=dl2L.concat(dl2R);
      if(allFired2.length>0){
        setTimeout(function(arr,lArr,rArr){return function(){
          setHighlightColor2(arr.slice());
          if(lrOnRef.current) setDotLabel2(function(p){
            var n=Object.assign({},p);
            lArr.forEach(function(c){n[c]="左";});
            rArr.forEach(function(c){n[c]=n[c]==="左"?"両":"右";});
            return n;
          });
        };}(allFired2,dl2L,dl2R),0);
      }
    }
    // メトロノームを最優先で鳴らす
    if(metroOnRef.current){
      var m=metroModeRef.current;
      var doAcc=s12===0&&metroAccentRef.current;
      if(currentSubdiv==="16th"){
        if(m===4&&s12%4===0)woodClick(doAcc);
        else if(m==="4u"&&s12%4===2)woodClick(doAcc);
        else if(m===8&&s12%2===0)woodClick(doAcc);
        else if(m==="8u"&&s12%2!==0)woodClick(doAcc);
      } else {
        if(m===4&&s12%3===0)woodClick(doAcc);
        else if(m==="4u"&&s12%3===1)woodClick(doAcc);
        else if(m===8)woodClick(doAcc);
        else if(m===3)woodClick(doAcc);
      }
    }
    // 音再生（WebAudio）は同期、state更新は非同期
    var firedL={},firedR={};
    COLORS_ALL.forEach(function(c){if(L[c]&&L[c][s]){playSound(c);firedL[c]=true;}});
    COLORS_ALL.forEach(function(c){if(R[c]&&R[c][s]){playSound(c);firedR[c]=true;}});
    setTimeout(function(){
      var fd={};
      Object.keys(firedL).forEach(function(c){flashDot(c,"左");fd[c]=true;});
      Object.keys(firedR).forEach(function(c){flashDot(c,fd[c]?"両":"右");});
    },0);
  }

  function doStart(){
    if(iidRef.current)clearInterval(iidRef.current);
    if(dimRef.current){clearTimeout(dimRef.current);dimRef.current=null;}
    // subdivPropから直接計算（クロージャのsubdiv変数はstaleの可能性）
    var currentSubdiv = subdivProp || "triplet";
    subdivRef.current = currentSubdiv;
    var ms = Math.round((60/bpmRef.current/(currentSubdiv==="16th"?4:3))*1000);
    lastTickMsRef.current = ms;
    iidRef.current=setInterval(tick, ms);
    console.log("doStart:", scoreId, sectionKey, "subdiv=", currentSubdiv, "ms=", ms);
  }

  function doStop(){
    if(iidRef.current){clearInterval(iidRef.current);iidRef.current=null;}
    if(dimRef.current){clearTimeout(dimRef.current);dimRef.current=null;}
    dimAll();stepRef.current=startStepRef.current;setCurStep(-1);setPlaying(false);
    passesCompletedRef.current = 0; // 停止時はリピート周回数もリセット
    if(onLoopComplete){}
  }



  function handlePrint(){
    var DOTS=getEffectiveDots(scoreId, sectionKey, scale, instrument2);
    var nb=Math.max(2,Math.min(parseInt(bars)||8,32));
    var spb=subdiv==="16th"?16:12;
    var CELL_P=20, GAP_P=1;
    var stepH=CELL_P+GAP_P;
    var usedColors={};
    COLORS_ALL.forEach(function(c){
      for(var i=0;i<nb*spb;i++){
        if((left[c]&&left[c][i])||(right[c]&&right[c][i])){ usedColors[c]=true; break; }
      }
    });
    var displayTime=secTime||"";
    if(displayTime&&displayTime.includes("GMT")){
      var d=new Date(displayTime);
      if(!isNaN(d)){var h=d.getHours();var m=d.getMinutes();displayTime=h+":"+(m<10?"0"+m:m);}
      else displayTime="";
    }
    function barHtml(barIdx){
      var barSpb=getBarSpb(barIdx);
      var barStart=getBarStart(barIdx);
      var rows="";
      for(var i=0;i<barSpb;i++){
        var s=barStart+i;
        var ibs=i===0;
        var ib=subdiv==="16th"?i%4===0:i%3===0;
        var i8=subdiv==="16th"&&i%2===0&&i%4!==0;
        var lColor=null, rColor=null;
        COLORS_ALL.forEach(function(c){
          if(left[c]&&left[c][s]) lColor=c;
          if(right[c]&&right[c][s]) rColor=c;
        });
        var bg=ibs?"rgba(0,0,0,0.1)":ib?"rgba(0,0,0,0.05)":"transparent";
        var lBg=lColor?SCORE_DOT_COLORS[lColor]:"#e8e8e8";
        var rBg=rColor?SCORE_DOT_COLORS[rColor]:"#e8e8e8";
        rows+='<div style="display:flex;height:'+stepH+'px;align-items:center;background:'+bg+'">'
          +'<div style="width:'+CELL_P+'px;height:'+(CELL_P-1)+'px;background:'+lBg+';border-radius:3px;margin-right:'+GAP_P+'px"></div>'
          +'<div style="width:8px;height:4px;display:flex;align-items:center;justify-content:center">'+(i8?'<div style="width:3px;height:3px;border-radius:50%;background:#ccc"></div>':'')+'</div>'
          +'<div style="width:'+CELL_P+'px;height:'+(CELL_P-1)+'px;background:'+rBg+';border-radius:3px;margin-left:'+GAP_P+'px"></div>'
          +'</div>';
      }
      return '<div style="display:inline-block;margin:3px;background:#fff;border-radius:6px;padding:5px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">'
        +'<div style="font-size:9px;font-weight:700;color:#888;margin-bottom:2px;text-align:center">'+(barIdx+1)+'</div>'
        +rows+'</div>';
    }
    var barsHtml=[];
    for(var bi=0;bi<nb;bi++) barsHtml.push(barHtml(bi));
    var svgDots="";
    var _lbls=getDrumLabels(scoreId, sectionKey, scale);var highLabel=scale==="nostalgic"?"高音":_lbls.top;var lowLabel=scale==="nostalgic"?"低音":_lbls.bottom;
    Object.keys(DOTS).forEach(function(color){
      if(scale==="nostalgic"&&color==="pink") return;
      var pos=DOTS[color];
      var fill=usedColors[color]?SCORE_DOT_COLORS[color]:SCORE_PALE_COLORS[color];
      svgDots+='<circle cx="'+pos.cx+'" cy="'+pos.cy+'" r="12" fill="'+fill+'" stroke="white" stroke-width="1.5"/>';
    });
    var svgHtml='<svg viewBox="0 0 140 166" width="110" height="130" style="flex-shrink:0">'
      +'<circle cx="70" cy="83" r="67" fill="transparent" stroke="#a09890" stroke-width="0.4"/>'
      +'<text x="70" y="10" text-anchor="middle" font-size="10" font-family="sans-serif" fill="#999">'+highLabel+'</text>'
      +'<text x="70" y="162" text-anchor="middle" font-size="10" font-family="sans-serif" fill="#999">'+lowLabel+'</text>'
      +svgDots+'</svg>';
    var sections=SCORE_SECTIONS[scoreId]||[];
    var secListHtml=sections.map(function(s){
      var isCurrent=s[0]===sectionKey;
      return '<span style="font-size:9px;color:'+(isCurrent?"#1a3a2a":"#aaa")+';font-weight:'+(isCurrent?"700":"400")+';margin-right:6px">'+(isCurrent?"▶ ":"")+s[1]+'</span>';
    }).join("");
    var gridHtml=(function(){
      var rowsHtml="";
      for(var rr=0;rr<Math.ceil(nb/8);rr++){
        rowsHtml+='<div style="display:flex;flex-wrap:nowrap;gap:1px;margin-bottom:4px">';
        for(var bb=rr*8;bb<Math.min((rr+1)*8,nb);bb++) rowsHtml+=barsHtml[bb]||"";
        rowsHtml+='</div>';
      }
      return rowsHtml;
    })();
    var songTitle=SCORE_ID_TO_NAME[scoreId]||scoreId;
    var win=window.open("","_blank");
    win.document.write('<!DOCTYPE html><html><head><meta charset="utf-8">'
      +'<title>'+songTitle+' - '+sectionLabel+'</title>'
      +'<style>@page{size:A4 landscape;margin:8mm}body{font-family:sans-serif;margin:0}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>'
      +'<div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #e0e0e0">'
        +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:18px;font-weight:700;color:#1a3a2a;margin-bottom:2px">'+songTitle+'</div>'
          +'<div style="font-size:11px;color:#666;margin-bottom:6px">Composed by DANiLO</div>'
          +'<div style="margin-bottom:8px;line-height:1.8">'+secListHtml+'</div>'
          +'<div style="font-size:14px;font-weight:700;color:#333;margin-bottom:2px">'+sectionLabel+'</div>'
          +'<div style="font-size:11px;color:#888">'+nb+'小節'+(displayTime?' ／ '+displayTime+'〜':'')+'</div>'
        +'</div>'
        +svgHtml
      +'</div>'
      +'<div>'+gridHtml+'</div>'
      +'<div style="margin-top:8px;font-size:8px;color:#bbb;text-align:center">© DANiLO / グーダドラムオーケストラ 響合〜hibikiai〜 All Rights Reserved.</div>'
      +'</body></html>');
    win.document.close();
    setTimeout(function(){win.print();},300);
  }

  function handleBpm(v){setBpm(v);bpmRef.current=v;if(playing)doStart();}

  function toggleCell2(side,color,idx){
    if(!canEdit)return;
    hasLoadedRef.current=true; // 編集開始フラグ
    var setter=side==="left"?setLeft2:setRight2;
    var willBeOn;
    var totalSteps2=Math.max(2,Math.min(parseInt(bars)||8,32))*SPB;
    setter(function(prev){
      var p=Object.assign({},prev);
      if(!p[color]) p[color]=new Array(totalSteps2).fill(0);
      else p[color]=prev[color].slice();
      p[color][idx]^=1;
      willBeOn=p[color][idx]===1;
      return p;
    });
    setTimeout(function(){
      if(willBeOn){
        setHighlightColor2(color);
        setTimeout(function(){setHighlightColor2(null);},300);
        initAudio(function(){ playSound2(color); });
      }
    },0);
  }

  function toggleCell(side,color,idx){
    if(!canEdit)return;
    hasLoadedRef.current=true; // 編集開始フラグ
    var setter=side==="left"?setLeft:setRight;
    var willBeOn;
    setter(function(prev){
      var p=Object.assign({},prev);p[color]=prev[color].slice();
      p[color][idx]^=1;
      willBeOn=p[color][idx]===1;
      return p;
    });
    // ONになった時だけ音を鳴らす
    setTimeout(function(){
      if(willBeOn) {
        setHighlightColor(color);
        setTimeout(function(){ setHighlightColor(null); }, 300);
        initAudio(function(){ playSound(color); });
      }
    }, 0);
  }

  function handleSave(){ justSavedRef.current=true;
    setSaving(true);setSaveMsg("");
    var p=onSave(scoreId,sectionKey,left,right,{bars:bars,repeat:repeat,startTime:secTime,barLengths:barLengths},instrument2?left2:null,instrument2?right2:null);
    if(p&&p.then){
      p.then(function(){setSaveMsg("✅ 保存しました");setSaving(false);setTimeout(function(){setSaveMsg("");},3000);})
       .catch(function(){setSaveMsg("❌ 失敗しました");setSaving(false);});
    }else{setSaveMsg("✅ 保存しました");setSaving(false);setTimeout(function(){setSaveMsg("");},3000);}
  }

  function Sw(on){
    return <div style={{position:"relative",width:28,height:16,background:on?"#27AE60":"#d0cec8",borderRadius:8,flexShrink:0,transition:"background .2s"}}>
      <div style={{position:"absolute",top:2,left:2,width:12,height:12,background:"#fff",borderRadius:"50%",transition:"transform .2s",transform:on?"translateX(12px)":"none"}}/>
    </div>;
  }

  // 中央の拍目印カラム（左右の間）
  // 小節頭・4分音符の位置に横帯を表示、クリックで再生開始位置を設定
  function renderBeatCol(barIdx){
    var stepH = CELL+GAP;
    var barSPB=(barLengths&&barLengths.length>barIdx)?barLengths[barIdx]:SPB;
    var barOffset=(function(){if(!barLengths||barLengths.length!==parseInt(bars))return barIdx*SPB;var o=0;for(var ii=0;ii<barIdx;ii++)o+=barLengths[ii];return o;})();
    var rows = [];
    for(var i=0;i<barSPB;i++){
      var s=barOffset+i;
      var ibs=i===0, ib=(subdiv==="16th"?i%4===0:i%3===0)&&i!==0;
      var cur=s===curStep;
      var isStart=s===startStepRef.current;
      // 帯の色とサイズ
      var band=null;
      if(ibs){
        // 小節頭: 濃いグレーの太い横帯
        band=<div style={{position:"absolute",top:0,left:0,right:0,height:"100%",background:isStart?"#E74C3C":cur?"#505050":"#909090",borderRadius:2}}/>;
      } else if(ib){
        // 4分音符: 薄いグレーの細い横帯（中央寄り）
        band=<div style={{position:"absolute",top:"30%",left:0,right:0,height:"40%",background:isStart?"rgba(231,76,60,0.6)":cur?"#808080":"#bbbbbb",borderRadius:1}}/>;
      } else {
        // 三連の細分: 小さいドット
        band=<div style={{position:"absolute",top:"50%",left:"50%",width:3,height:3,borderRadius:"50%",background:cur?"#888":"#d0d0d0",transform:"translate(-50%,-50%)"}}/>;
      }
      rows.push(
        <div key={i}
          onClick={function(ss){return function(e){e.stopPropagation();startStepRef.current=ss;setCurStep(-1);};}(s)}
          style={{
            position:"relative",
            width:14, height:stepH-GAP,
            marginBottom:GAP,
            cursor:"pointer",
            overflow:"visible",
          }}>
          {band}
        </div>
      );
    }
    return <div style={{display:"flex",flexDirection:"column",width:12,flexShrink:0}}>{rows}</div>;
  }

  // 片側（左手or右手）のグリッド
  // canEdit=true: 9色列、各色薄い色ベース、クリックでON/OFF
  // canEdit=false: 1列、設定色を表示、なければ薄いグレー
  function renderSideGrid(barIdx, side){
    var pat=side==="left"?left:right;
    var sideColors=side==="left"?COLORS_LEFT:COLORS_RIGHT;
    var barSPB=(barLengths&&barLengths.length>barIdx)?barLengths[barIdx]:SPB;
    var barOffset=(function(){if(!barLengths||barLengths.length!==parseInt(bars))return barIdx*SPB;var o=0;for(var ii=0;ii<barIdx;ii++)o+=barLengths[ii];return o;})();

    if(canEdit){
      // 編集モード: 9色列
      return (
        <div style={{display:"flex",flexDirection:"row"}}>
          {sideColors.map(function(color){
            var cells=[];
            for(var i=0;i<barSPB;i++){
              var s=barOffset+i;
              var on=pat[color]&&pat[color][s];
              var cur=s===curStep;
              var ibs=i===0;
              var ib=(subdiv==="16th"?i%4===0:i%3===0)&&i!==0;
              cells.push(
                <div key={i}
                  onClick={function(ss,co,si){return function(e){
                    e.stopPropagation();
                    toggleCell(si,co,ss);
                  };}(s,color,side)}
                  style={{
                    width:CELL,height:CELL,
                    marginBottom:GAP,
                    borderRadius:2,
                    background:on
                      ? SCORE_DOT_COLORS[color]
                      : (ibs||ib)
                        ? SCORE_PALE_COLORS[color]
                        : "#e8e8e8",
                    opacity: on ? 1 : (ibs||ib) ? 0.6 : 1,
                    cursor:"pointer",
                    outline:cur?"2px solid #555":"none",
                    outlineOffset:"-1px",
                    position:"relative",zIndex:2,
                  }}
                />
              );
            }
            return <div key={color} style={{display:"flex",flexDirection:"column",marginRight:GAP}}>{cells}</div>;
          })}
        </div>
      );
     } else {
      // 閲覧モード: 1列のみ
      var cells=[];
      var pat2side=instrument2?(side==="left"?left2:right2):null;
      for(var i=0;i<barSPB;i++){
        var s=barOffset+i;
        var cur=s===curStep;
        var isStart=s===startStepRef.current;
        // 風ノ音の色を探す（最大2色）
        var foundColors=[];
        for(var ci=0;ci<sideColors.length;ci++){
          if(pat[sideColors[ci]]&&pat[sideColors[ci]][s]) foundColors.push(sideColors[ci]);
          if(foundColors.length>=2) break;
        }
        // 響ノ音の色を探す（instrument2がある時のみ、最大2色）
        var foundColors2=[];
        if(pat2side){
          for(var ci2=0;ci2<COLORS2.length;ci2++){
            if(pat2side[COLORS2[ci2]]&&pat2side[COLORS2[ci2]][s]) foundColors2.push(COLORS2[ci2]);
            if(foundColors2.length>=2) break;
          }
        }
        var haFu=foundColors.length>0;
        var haHi=foundColors2.length>0;
        var bg;
        if(cur) bg="rgba(0,0,0,0.2)";
        else if(haHi&&haFu) bg="linear-gradient(to bottom, "+DOT_COLORS2[foundColors2[0]]+" 50%, "+SCORE_DOT_COLORS[foundColors[0]]+" 50%)";
        else if(haHi) bg=foundColors2.length>=2?"linear-gradient(to bottom, "+DOT_COLORS2[foundColors2[0]]+" 50%, "+DOT_COLORS2[foundColors2[1]]+" 50%)":DOT_COLORS2[foundColors2[0]];
        else if(haFu) bg=foundColors.length>=2?"linear-gradient(to bottom, "+SCORE_DOT_COLORS[foundColors[0]]+" 50%, "+SCORE_DOT_COLORS[foundColors[1]]+" 50%)":SCORE_DOT_COLORS[foundColors[0]];
        else bg="#e8e6e2";
        cells.push(
          <div key={i}
            onClick={function(ss){return function(e){e.stopPropagation();startStepRef.current=ss;setCurStep(-1);};}(s)}
            style={{
              width:CELL,height:CELL,
              marginBottom:GAP,
              borderRadius:2,
              background:bg,
              cursor:"pointer",
              outline:cur?"2px solid #555":isStart?"2px solid #E74C3C":"none",
              outlineOffset:"-1px",
              position:"relative",zIndex:2,
            }}
          />
        );
      }
      return <div style={{display:"flex",flexDirection:"column"}}>{cells}</div>;
    }
  }

  // 1小節ブロック
function renderSideGrid2(barIdx, side){
    var pat=side==="left"?left2:right2;
    var barSPB=(barLengths&&barLengths.length>barIdx)?barLengths[barIdx]:SPB;
    var barOffset=(function(){if(!barLengths||barLengths.length!==parseInt(bars))return barIdx*SPB;var o=0;for(var ii=0;ii<barIdx;ii++)o+=barLengths[ii];return o;})();

    if(canEdit){
      // 編集モード: 9色列
      return (
        <div style={{display:"flex",flexDirection:"row"}}>
          {COLORS2.map(function(color){
            var cells=[];
            for(var i=0;i<barSPB;i++){
              var s=barOffset+i;
              var on=pat[color]&&pat[color][s];
              var cur=s===curStep;
              var ibs=i===0;
              var ib=(subdiv==="16th"?i%4===0:i%3===0)&&i!==0;
              cells.push(
                <div key={i}
                  onClick={function(ss,co,si){return function(e){
                    e.stopPropagation();
                    toggleCell2(si,co,ss);
                  };}(s,color,side)}
                  style={{
                    width:CELL,height:CELL,
                    marginBottom:GAP,
                    borderRadius:2,
                    background:on
                      ? SCORE_HIBIKI_COLORS[color]
                      : (ibs||ib)
                        ? SCORE_HIBIKI_PALE_COLORS[color]
                        : "#e8e8e8",
                    opacity: on ? 1 : (ibs||ib) ? 0.6 : 1,
                    cursor:"pointer",
                    outline:cur?"2px solid #555":"none",
                    outlineOffset:"-1px",
                    position:"relative",zIndex:2,
                  }}
                />
              );
            }
            return <div key={color} style={{display:"flex",flexDirection:"column",marginRight:GAP}}>{cells}</div>;
          })}
        </div>
      );
    } else {
      // 閲覧モード: 1列のみ
      var cells=[];
      for(var i=0;i<barSPB;i++){
        var s=barOffset+i;
        var cur=s===curStep;
        var isStart=s===startStepRef.current;
        // その行に設定されてる色を探す（最大2色）
        var foundColors=[];
        for(var ci=0;ci<COLORS.length;ci++){
          if(pat[COLORS[ci]]&&pat[COLORS[ci]][s]) foundColors.push(COLORS[ci]);
          if(foundColors.length>=2) break;
        }
        var foundColor=foundColors[0]||null;
        cells.push(
          <div key={i}
            onClick={function(ss){return function(e){e.stopPropagation();startStepRef.current=ss;setCurStep(-1);};}(s)}
            style={{
              width:CELL,height:CELL,
              marginBottom:GAP,
              borderRadius:2,
              background:cur?"rgba(0,0,0,0.2)":foundColors.length===0?"#e8e6e2":foundColors.length===1?SCORE_DOT_COLORS[foundColors[0]]:"linear-gradient(to bottom, "+SCORE_DOT_COLORS[foundColors[0]]+" 50%, "+SCORE_DOT_COLORS[foundColors[1]]+" 50%)",
              cursor:"pointer",
              outline:cur?"2px solid #555":isStart?"2px solid #E74C3C":"none",
              outlineOffset:"-1px",
              position:"relative",zIndex:2,
            }}
          />
        );
      }
      return <div style={{display:"flex",flexDirection:"column"}}>{cells}</div>;
    }
  }

  // 1小節ブロック
  function renderBar(barIdx){
    var isStart=startBar===barIdx;
    var stepH=CELL+GAP;
    var nCols=canEdit?(isAttackEnabled?COLORS.length+1:COLORS.length):1; // アタック対応曲のみ+1列
    var sideW=nCols*(CELL+GAP);
    var beatW=14;
    var totalW=sideW+beatW+sideW;
    // barLengths対応：この小節のSPBと開始オフセットを計算
    var barSPB=(barLengths&&barLengths.length>barIdx)?barLengths[barIdx]:SPB;
    var barOffset=(function(){if(!barLengths||barLengths.length!==parseInt(bars))return barIdx*SPB;var o=0;for(var ii=0;ii<barIdx;ii++)o+=barLengths[ii];return o;})();

    // 帯リスト（後ろに配置）
    var bands=[];
    for(var i=0;i<barSPB;i++){
      var s=barOffset+i;
      var ibs_b=i===0;
      var ib_b=(subdiv==="16th"?i%4===0:i%3===0)&&i!==0;
      var i8_b=subdiv==="16th"&&i%2===0&&i%4!==0;
      var cur_b=s===curStep;
      var isRowStart=s===startStepRef.current;
      if(ibs_b){
        bands.push(<div key={"b"+i} style={{
          position:"absolute",left:0,right:0,
          top:i*stepH,height:stepH-GAP,
          background:isRowStart?"rgba(231,76,60,0.25)":cur_b?"rgba(0,0,0,0.2)":"rgba(0,0,0,0.12)",
          borderRadius:2,pointerEvents:"none",zIndex:0,
        }}/>);
      } else if(ib_b){
        bands.push(<div key={"b"+i} style={{
          position:"absolute",left:0,right:0,
          top:i*stepH+Math.floor(stepH*0.3),height:Math.floor(stepH*0.4),
          background:isRowStart?"rgba(231,76,60,0.15)":cur_b?"rgba(0,0,0,0.15)":"rgba(0,0,0,0.07)",
          borderRadius:1,pointerEvents:"none",zIndex:0,
        }}/>);
      } else if(i8_b){
        bands.push(<div key={"b"+i} style={{
          position:"absolute",left:"50%",transform:"translateX(-50%)",
          top:i*stepH+Math.floor(stepH*0.35),
          width:4,height:4,borderRadius:"50%",
          background:cur_b?"rgba(0,0,0,0.4)":"rgba(0,0,0,0.15)",
          pointerEvents:"none",zIndex:0,
        }}/>);
      } else if(cur_b){
        bands.push(<div key={"b"+i} style={{
          position:"absolute",left:0,right:0,
          top:i*stepH,height:stepH-GAP,
          background:"rgba(0,0,0,0.15)",
          borderRadius:2,pointerEvents:"none",zIndex:0,
        }}/>);
      }
    }
    // 中央クリック列（拍区切り目印）
    var beatCells=[];
    for(var j=0;j<barSPB;j++){
      var ss=barOffset+j;
      var jbs=j===0;
      var jb=(subdiv==="16th"?j%4===0:j%3===0)&&j!==0;
      var j8=subdiv==="16th"&&j%2===0&&j%4!==0;
      var dot=null;
      if(!jbs&&!jb&&!j8){
        // 三連の細分 or 16分の細分: 小さいドット
        dot=<div style={{width:2,height:2,borderRadius:"50%",background:"#ccc",margin:"0 auto"}}/>;
      } else if(j8){
        // 8分音符位置（16分モード）: 中くらいのドット
        dot=<div style={{width:3,height:3,borderRadius:"50%",background:"#bbb",margin:"0 auto"}}/>;
      }
      beatCells.push(
        <div key={j}
          onClick={function(s2){return function(e){e.stopPropagation();startStepRef.current=s2;setCurStep(-1);};}(ss)}
          style={{height:stepH-GAP,marginBottom:GAP,width:beatW,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:1}}>
          {dot}
        </div>
      );
    }

    return (
      <div key={barIdx} onClick={function(b){return function(){startStepRef.current=barOffset;setStartBar(b);setCurStep(-1);setSelectedBarSync(b);};}(barIdx)} style={{flexShrink:0,marginRight:6,background:"#fff",borderRadius:10,padding:"8px",cursor:"pointer",boxShadow:isStart?"0 4px 16px rgba(0,0,0,0.25)":"0 1px 4px rgba(0,0,0,0.08)",border:"1px solid #e8e8e8"}}>
        {/* 小節番号 */}
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
          <div onClick={function(b){return function(){startStepRef.current=barOffset;setStartBar(b);setCurStep(-1);setSelectedBarSync(b);};}(barIdx)}
            onMouseDown={function(b){return function(e){e.stopPropagation();setSelectedBarSync(b);};}(barIdx)}
            style={{width:18,height:18,borderRadius:"50%",flexShrink:0,
              background:isStart?"#E74C3C":"#a8a5a0",
              color:"#fff",fontSize:10,fontWeight:700,
              display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            {barIdx+1}
          </div>
          <div style={{fontSize:8,color:"#888"}}>小節</div>
          {canEdit&&(
            <div onClick={function(b){return function(e){e.stopPropagation();
              setBarLengths(function(prev){
                var nb=Math.max(2,Math.min(parseInt(bars)||8,32));
                var defaultSPB=subdivRef.current==="16th"?16:12;
                var spb34=subdivRef.current==="16th"?12:9;
                var spb24=subdivRef.current==="16th"?8:6;
                var arr=prev?prev.slice():new Array(nb).fill(defaultSPB);
                if(arr.length!==nb) arr=new Array(nb).fill(defaultSPB);
                var cur=arr[b]||defaultSPB;
                arr[b]=cur===defaultSPB?spb34:cur===spb34?spb24:defaultSPB;
                var next=arr.slice();
                barLengthsRef.current=next;
                return next;
              });
            };}(barIdx)}
              style={{fontSize:9,padding:"1px 5px",borderRadius:4,border:"0.5px solid #d0cec8",
                background:(subdiv==="16th"?barSPB===12:barSPB===9)?"#708238":(subdiv==="16th"?barSPB===8:barSPB===6)?"#c87020":"#fff",
                color:((subdiv==="16th"?barSPB===12:barSPB===9)||(subdiv==="16th"?barSPB===8:barSPB===6))?"#fff":"#a0a0a0",
                cursor:"pointer",userSelect:"none",flexShrink:0}}>
              {(subdiv==="16th"?barSPB===12:barSPB===9)?"3/4":(subdiv==="16th"?barSPB===8:barSPB===6)?"2/4":"4/4"}
            </div>
          )}
        </div>
        {/* 色見本（編集モードのみ） */}
        {canEdit&&(
          <div style={{display:"flex",gap:0,marginBottom:2}}>
            <div style={{display:"flex"}}>
              {COLORS_LEFT.map(function(c){return <div key={c} style={{width:CELL,height:5,background:SCORE_DOT_COLORS[c],borderRadius:1,marginRight:GAP}}/>;  })}
            </div>
            <div style={{width:beatW,flexShrink:0}}/>
            <div style={{display:"flex"}}>
              {COLORS_RIGHT.map(function(c){return <div key={c+"r"} style={{width:CELL,height:5,background:SCORE_DOT_COLORS[c],borderRadius:1,marginRight:GAP}}/>;  })}
            </div>
          </div>
        )}
        {/* グリッド本体: position:relativeで帯を後ろに */}
        <div style={{position:"relative",width:totalW,height:barSPB*stepH}}>
          {/* 帯（後ろ） */}
          {bands}
          {/* 左手 */}
          <div style={{position:"absolute",left:0,top:0,zIndex:1}}>
            {renderSideGrid(barIdx,"left")}
          </div>
          {/* 中央クリック列 */}
          <div style={{position:"absolute",left:sideW,top:0,width:beatW,zIndex:1}}>
            {beatCells}
          </div>
          {/* 右手 */}
          <div style={{position:"absolute",left:sideW+beatW,top:0,zIndex:1}}>
            {renderSideGrid(barIdx,"right")}
          </div>
        </div>
      </div>
    );
  }

  var numBars = Math.max(2, Math.min(parseInt(bars)||8, 32));
  var TOTAL = SPB * numBars;
  // 上段: 奇数インデックス(0,2,4...) 下段: 偶数インデックス(1,3,5...)
  var topBars=[], botBars=[];
  for(var bi=0;bi<numBars;bi++){
    if(bi%2===0) topBars.push(bi);
    else botBars.push(bi);
  }
  var gridH=SPB*(CELL+GAP);
  var headerH=18+2+5+2; // 小節番号+margin+色見本+margin

  // 2台目グリッドの計算（instrument2がある時）
  var grid2Element = null;
  var grid2EditElement = null;
  var renderBar2Edit = null;
  if(instrument2) {
    var DOTS_2=getEffectiveDots2(scoreId, sectionKey, scale, instrument2);
    var pat2={left:left2,right:right2};
    var numBars2=Math.max(2,Math.min(parseInt(bars)||8,32));
    var topBars2=[],botBars2=[];
    for(var bi2=0;bi2<numBars2;bi2++){if(bi2%2===0)topBars2.push(bi2);else botBars2.push(bi2);}
    var renderBar2=function(barIdx){
      var barSPB=(barLengths&&barLengths.length>barIdx)?barLengths[barIdx]:SPB;
      var barOffset=(function(){if(!barLengths||barLengths.length!==parseInt(bars))return barIdx*SPB;var o=0;for(var ii=0;ii<barIdx;ii++)o+=barLengths[ii];return o;})();
      var cells2=[];
      for(var i2=0;i2<barSPB;i2++){
        var s2=barOffset+i2;
        var fc2=[],fc2R=[];
        for(var ci=0;ci<COLORS2.length;ci++){
          if(pat2.left[COLORS2[ci]]&&pat2.left[COLORS2[ci]][s2]) fc2.push(COLORS2[ci]);
          if(pat2.right[COLORS2[ci]]&&pat2.right[COLORS2[ci]][s2]) fc2R.push(COLORS2[ci]);
        }
        var ibs2=i2===0,ib2=subdiv==="16th"?i2%4===0:i2%3===0,i8b=subdiv==="16th"&&i2%2===0&&i2%4!==0;
        var bg2=ibs2?"rgba(0,0,0,0.1)":ib2?"rgba(0,0,0,0.05)":"transparent";
        var lBg2=fc2.length===0?"#e8e6e2":fc2.length===1?DOT_COLORS2[fc2[0]]:"linear-gradient(to bottom,"+DOT_COLORS2[fc2[0]]+" 50%,"+DOT_COLORS2[fc2[1]]+" 50%)";
        var rBg2=fc2R.length===0?"#e8e6e2":fc2R.length===1?DOT_COLORS2[fc2R[0]]:"linear-gradient(to bottom,"+DOT_COLORS2[fc2R[0]]+" 50%,"+DOT_COLORS2[fc2R[1]]+" 50%)";
        cells2.push(
          <div key={i2} style={{display:"flex",height:(CELL+GAP)+"px",alignItems:"center",background:bg2}}>
            <div style={{width:CELL,height:CELL-1,background:lBg2,borderRadius:2}}/>
            <div style={{width:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{i8b&&<div style={{width:3,height:3,borderRadius:"50%",background:"#ccc"}}/>}</div>
            <div style={{width:CELL,height:CELL-1,background:rBg2,borderRadius:2}}/>
          </div>
        );
      }
      return (
        <div key={barIdx} onClick={function(b){return function(){startStepRef.current=barOffset;setStartBar(b);setCurStep(-1);};}(barIdx)}
          style={{flexShrink:0,marginRight:6,background:"#fff",borderRadius:10,padding:"8px",cursor:"pointer",
            boxShadow:startBar===barIdx?"0 4px 16px rgba(0,0,0,0.25)":"0 1px 4px rgba(0,0,0,0.08)",border:"1px solid #e8e8e8"}}>
          <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
            <div onMouseDown={function(b){return function(e){e.stopPropagation();setSelectedBarSync(b);};}(barIdx)}
              style={{width:18,height:18,borderRadius:"50%",background:startBar===barIdx?"#E74C3C":"#a8a5a0",color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{barIdx+1}</div>
          </div>
          {cells2}
        </div>
      );
    };
    grid2Element = (
      <div>
        <div style={{display:"flex",gap:2,marginBottom:10}}>{topBars2.map(function(b){return renderBar2(b);})}</div>
        <div style={{display:"flex",gap:2}}>{botBars2.map(function(b){return renderBar2(b);})}</div>
      </div>
    );
    // 編集用2台目グリッド
    var renderBar2Edit=function(barIdx){
      var barSPB=(barLengths&&barLengths.length>barIdx)?barLengths[barIdx]:SPB;
      var barOffset=(function(){if(!barLengths||barLengths.length!==parseInt(bars))return barIdx*SPB;var o=0;for(var ii=0;ii<barIdx;ii++)o+=barLengths[ii];return o;})();
      var nCols2=COLORS2.length;
      var sideW2=nCols2*(CELL+GAP);
      var beatW2=14;
      var totalW2=sideW2+beatW2+sideW2;
      var stepH2=CELL+GAP;
      // 拍子帯
      var bands2=[];
      for(var i2b=0;i2b<barSPB;i2b++){
        var ibs2b=i2b===0;
        var ib2b=(subdiv==="16th"?i2b%4===0:i2b%3===0)&&i2b!==0;
        if(ibs2b||ib2b){
          bands2.push(<div key={"b2"+i2b} style={{position:"absolute",left:0,right:0,top:i2b*stepH2,height:stepH2-GAP,
            background:ibs2b?"rgba(0,0,0,0.12)":"rgba(0,0,0,0.05)",borderRadius:2,pointerEvents:"none"}}/>);
        }
      }
      // 拍子点
      var beatCells2=[];
      for(var i2c=0;i2c<barSPB;i2c++){
        var i8_2=subdiv==="16th"&&i2c%2===0&&i2c%4!==0;
        beatCells2.push(<div key={i2c} style={{width:beatW2,height:stepH2,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {i8_2&&<div style={{width:3,height:3,borderRadius:"50%",background:"#ccc"}}/>}
        </div>);
      }
      return (
        <div key={barIdx} onClick={function(b){return function(){startStepRef.current=barOffset;setStartBar(b);setCurStep(-1);};}(barIdx)}
          style={{flexShrink:0,background:"#fff",borderRadius:10,padding:"8px",cursor:"pointer",
          boxShadow:startBar===barIdx?"0 4px 16px rgba(0,0,0,0.25)":"0 1px 4px rgba(0,0,0,0.08)",
          border:"1px solid #e8e8e8"}}>
          <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
            <div style={{width:18,height:18,borderRadius:"50%",
              background:startBar===barIdx?"#E74C3C":"#a8a5a0",
              color:"#fff",fontSize:10,fontWeight:700,
              display:"flex",alignItems:"center",justifyContent:"center"}}>{barIdx+1}</div>
          </div>
          {/* 色見本（風ノ音と高さを合わせる） */}
          <div style={{display:"flex",gap:0,marginBottom:2}}>
            <div style={{display:"flex"}}>
              {COLORS2.map(function(c){return <div key={c} style={{width:CELL,height:5,background:SCORE_HIBIKI_COLORS[c],borderRadius:1,marginRight:GAP}}/>;  })}
            </div>
            <div style={{width:beatW2,flexShrink:0}}/>
            <div style={{display:"flex"}}>
              {COLORS2.map(function(c){return <div key={c+"r"} style={{width:CELL,height:5,background:SCORE_HIBIKI_COLORS[c],borderRadius:1,marginRight:GAP}}/>;  })}
            </div>
          </div>
          <div style={{position:"relative",width:totalW2,height:barSPB*stepH2}}>
            {bands2}
            <div style={{position:"absolute",left:0,top:0,zIndex:1}}>
              {renderSideGrid2(barIdx,"left")}
            </div>
            <div style={{position:"absolute",left:sideW2,top:0,width:beatW2,zIndex:1}}>
              <div style={{display:"flex",flexDirection:"column"}}>{beatCells2}</div>
            </div>
            <div style={{position:"absolute",left:sideW2+beatW2,top:0,zIndex:1}}>
              {renderSideGrid2(barIdx,"right")}
            </div>
          </div>
        </div>
      );
    };
    grid2EditElement = (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        {Array.from({length:numBars2},function(_,bi){
          return (
            <div key={bi} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
              {renderBar2Edit&&renderBar2Edit(bi)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",padding:"0 0 16px",overflow:"visible"}}>

      {/* セクション情報 + 開始時間 */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:8,gap:2}}>
        <p style={{fontSize:16,fontWeight:700,color:C.label,margin:0}}>{sectionLabel}</p>
        {!canEdit&&(()=>{
          var totalBars=parseInt(bars||8)*parseInt(repeat||1);
          var displayTime = secTime;
          if(secTime&&secTime.includes("GMT")){
            var d=new Date(secTime);
            if(!isNaN(d)){
              var h=d.getHours();var m=d.getMinutes();var s2=d.getSeconds();
              displayTime=h+":"+(m<10?"0"+m:m)+(s2>0?":"+(s2<10?"0"+s2:s2):"");
            } else { displayTime=""; }
          }
          return <p style={{fontSize:10,color:C.label,margin:0,opacity:0.7}}>{totalBars}小節{displayTime?" / "+displayTime+"〜":""}</p>;
        })()}
        {canEdit&&(
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:10,color:C.label}}>開始時間</span>
            <input type="text" placeholder="0:05〜" value={secTime}
              onChange={function(e){setSecTime(e.target.value);if(onStartTimeChange)onStartTimeChange(e.target.value);}}
              style={{width:60,padding:"2px 6px",borderRadius:6,border:"0.5px solid #d0cec8",fontSize:11,fontFamily:"inherit",color:C.choco}}/>
          </div>
        )}
      </div>

      {/* 再生コントロール（ドラッグ可能） */}
      <div style={{
        position:"fixed",left:Math.max(0,floatPos.x),top:floatPos.y,zIndex:500,
        background:"rgba(248,246,242,0.97)",backdropFilter:"blur(4px)",
        border:"1px solid #d0cec8",borderRadius:12,
        padding:"8px 12px",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
        minWidth:0,maxWidth:"calc(100vw - "+Math.max(0,floatPos.x)+"px)",
        cursor:"move",userSelect:"none",overflow:"hidden"
      }}
        onMouseDown={function(e){
          if(e.target.tagName==="BUTTON"||e.target.tagName==="INPUT"||e.target.tagName==="SELECT") return;
          isDraggingRef.current=true;
          dragOffRef.current={x:e.clientX-floatPos.x,y:e.clientY-floatPos.y};
          var mm=function(ev){
            if(!isDraggingRef.current)return;
            setFloatPos({x:ev.clientX-dragOffRef.current.x,y:ev.clientY-dragOffRef.current.y});
          };
          var mu=function(){isDraggingRef.current=false;window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu);};
          window.addEventListener("mousemove",mm);window.addEventListener("mouseup",mu);
        }}
        onTouchStart={function(e){
          if(e.target.tagName==="BUTTON"||e.target.tagName==="INPUT"||e.target.tagName==="SELECT") return;
          e.preventDefault();
          isDraggingRef.current=true;
          var t=e.touches[0];
          dragOffRef.current={x:t.clientX-floatPos.x,y:t.clientY-floatPos.y};
          var tm=function(ev){
            if(!isDraggingRef.current)return;
            ev.preventDefault();
            var tt=ev.touches[0];
            setFloatPos({x:tt.clientX-dragOffRef.current.x,y:tt.clientY-dragOffRef.current.y});
          };
          var tu=function(){isDraggingRef.current=false;window.removeEventListener("touchmove",tm);window.removeEventListener("touchend",tu);};
          window.addEventListener("touchmove",tm,{passive:false});
          window.addEventListener("touchend",tu);
        }}
      >
      <div style={{fontSize:9,color:"#bbb",textAlign:"center",marginBottom:2,letterSpacing:2}}>⠿ DRAG</div>
      {instrument2&&(
        <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:6}}>
          {!swapLR&&<div style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:"#888",marginBottom:2}}>響ノ音</div>
            <svg viewBox="0 0 140 166" width="100" height="118">
              <circle cx="70" cy="83" r="67" fill="transparent" stroke="#a09890" strokeWidth="0.4"/>
              {Object.keys(SCORE_DOTS_HIBIKI).map(function(color){
                var pos=SCORE_DOTS_HIBIKI[color];
                return <circle key={color} cx={pos.cx} cy={pos.cy} r="13"
                  fill={isHL2(color)?SCORE_HIBIKI_COLORS[color]:SCORE_HIBIKI_PALE_COLORS[color]}
                  stroke="white" strokeWidth="1.5" style={{transition:"all 0.15s"}}/>;
              })}
            </svg>
          </div>}
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:"#888",marginBottom:2}}>風ノ音</div>
            <svg viewBox="0 0 140 166" width="100" height="118">
              <circle cx="70" cy="83" r="67" fill="transparent" stroke="#a09890" strokeWidth="0.4"/>
              {(function(){
                var activeDots=getEffectiveDots(scoreId, sectionKey, scale, instrument2);
                if(isAttackEnabled){
                  var _pinkPos=activeDots.pink||{cx:70,cy:83};
                  var _brownPos=activeDots.brown||{cx:103.9,cy:116.9};
                  activeDots=Object.assign({},activeDots,{attack:{cx:(_pinkPos.cx+_brownPos.cx)/2, cy:(_pinkPos.cy+_brownPos.cy)/2}});
                }
                return Object.keys(activeDots).filter(function(color){return !(scale==="nostalgic"&&color==="pink");}).map(function(color){
                  var pos=activeDots[color];
                  return <React.Fragment key={color}><circle cx={pos.cx} cy={pos.cy} r={color==="attack"?7:13}
                    fill={color===highlightColor?SCORE_DOT_COLORS[color]:(dotFills[color]||SCORE_PALE_COLORS[color])}
                    stroke="white" strokeWidth="1.5" style={{transition:"all 0.15s"}}/>
                    {color==="attack"&&<text x={pos.cx} y={pos.cy+3} textAnchor="middle" fontSize="7" fontWeight="700" fill={color===highlightColor?"#fff":"#999"} style={{pointerEvents:"none"}}>✕</text>}</React.Fragment>;
                });
              })()}
            </svg>
          </div>
          {swapLR&&<div style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:"#888",marginBottom:2}}>響ノ音</div>
            <svg viewBox="0 0 140 166" width="100" height="118">
              <circle cx="70" cy="83" r="67" fill="transparent" stroke="#a09890" strokeWidth="0.4"/>
              {Object.keys(SCORE_DOTS_HIBIKI).map(function(color){
                var pos=SCORE_DOTS_HIBIKI[color];
                return <circle key={color} cx={pos.cx} cy={pos.cy} r="13"
                  fill={isHL2(color)?SCORE_HIBIKI_COLORS[color]:SCORE_HIBIKI_PALE_COLORS[color]}
                  stroke="white" strokeWidth="1.5" style={{transition:"all 0.15s"}}/>;
              })}
            </svg>
          </div>}
        </div>
      )}
      {canEdit&&!instrument2&&(
        <div style={{display:"flex",justifyContent:"center",marginBottom:6}}>
          <svg viewBox="0 0 140 166" width="100" height="118">
            <circle cx="70" cy="83" r="67" fill="transparent" stroke="#a09890" strokeWidth="0.4"/>
            {(function(){
              var activeDots=getEffectiveDots(scoreId, sectionKey, scale, instrument2);
                if(isAttackEnabled){
                  var _pinkPos=activeDots.pink||{cx:70,cy:83};
                  var _brownPos=activeDots.brown||{cx:103.9,cy:116.9};
                  activeDots=Object.assign({},activeDots,{attack:{cx:(_pinkPos.cx+_brownPos.cx)/2, cy:(_pinkPos.cy+_brownPos.cy)/2}});
                }
              return Object.keys(activeDots).filter(function(color){return !(scale==="nostalgic"&&color==="pink");}).map(function(color){
                var pos=activeDots[color];
                return <React.Fragment key={color}><circle cx={pos.cx} cy={pos.cy} r={color==="attack"?7:13}
                  fill={color===highlightColor?SCORE_DOT_COLORS[color]:(dotFills[color]||SCORE_PALE_COLORS[color])}
                  stroke="white" strokeWidth="1.5" style={{transition:"all 0.15s"}}/>
                  {color==="attack"&&<text x={pos.cx} y={pos.cy+3} textAnchor="middle" fontSize="7" fontWeight="700" fill={color===highlightColor?"#fff":"#999"} style={{pointerEvents:"none"}}>✕</text>}</React.Fragment>;
              });
            })()}
          </svg>
        </div>
      )}
      {canEdit&&selectedBar!==null&&<div style={{fontSize:10,color:"#708238",textAlign:"center",marginBottom:4}}>
        {selectedBar+1}小節選択中{copiedBar?" ✅コピー済":""}　⌘C コピー　⌘V ペースト
      </div>}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
        <button onClick={function(){ if(!playing&&onQueueStart) onQueueStart(); handlePlay(); }}
          style={{width:36,height:36,borderRadius:"50%",border:"0.5px solid #d0cec8",background:"#fff",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {playing?"⏸":"▶"}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:120}}>
          <span style={{fontSize:10,color:C.label,whiteSpace:"nowrap"}}>BPM</span>
          <input type="range" min="40" max="200" value={bpm} onChange={function(e){handleBpm(parseInt(e.target.value));}}
            style={{flex:1,accentColor:"#708238"}}/>
          <span style={{fontSize:12,fontWeight:700,color:C.label,minWidth:28,textAlign:"right"}}>{bpm}</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"5px 8px",border:"0.5px solid #d0cec8",borderRadius:8,background:"#f5f5f3",flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:C.label}}>METRO</span>
        <div onClick={function(){onMetroChange&&onMetroChange(!sharedMetroOn,sharedMetroMode);}} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",userSelect:"none"}}>
          {Sw(sharedMetroOn)}<span style={{fontSize:10,color:C.label}}>{sharedMetroOn?"ON":"OFF"}</span>
        </div>
        {["4分","4分裏","8分","8分裏"].map(function(label,i){
          var mode=[4,"4u",8,"8u"][i];
          var noteIcon={"4分":"♩","4分裏":"♩","8分":"♪","8分裏":"♪"}[label]||"♩";
          return <button key={mode} onClick={function(){metroModeRef.current=mode;setMetroModeLocal(mode);metroOnRef.current=true;setMetroOnLocal(true);if(onMetroChange)onMetroChange(true,mode);}}
            style={{padding:"2px 8px",borderRadius:6,border:"0.5px solid #d0cec8",
              background:sharedMetroOn&&sharedMetroMode===mode?"#2C2A28":"#fff",
              color:sharedMetroOn&&sharedMetroMode===mode?"#fff":C.label,fontSize:10,cursor:"pointer"}}>
            {noteIcon} {label}
          </button>;
        })}
        <span style={{width:1,height:16,background:"#d0cec8",display:"inline-block",margin:"0 2px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:10,color:C.label}}>頭チーン</span>
          <div onClick={function(){onMetroChange&&onMetroChange(sharedMetroOn,sharedMetroMode,!sharedHeadBell);}} style={{cursor:"pointer"}}>{Sw(sharedHeadBell)}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:10,color:C.label}}>音量</span>
          <input type="range" min="0" max="1" step="0.05" value={metroVol}
            onChange={function(e){setMetroVol(parseFloat(e.target.value));}}
            style={{width:60,accentColor:"#708238"}}/>
        </div>
        {!canEdit&&(scoreId==="iridescence"||scoreId==="aoi")&&(
          <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:8}}>
            <span style={{fontSize:10,color:C.label,fontWeight:600}}>音階</span>
            <button onClick={function(){setSoundType("enigma");actxRef.current=null;bufsRef.current={};}}
              style={{padding:"2px 8px",borderRadius:6,border:"0.5px solid #d0cec8",
                background:soundType==="enigma"?"#708238":"#fff",color:soundType==="enigma"?"#fff":C.label,
                fontSize:10,cursor:"pointer"}}>秘ノ音</button>
            <button onClick={function(){setSoundType("arcane");actxRef.current=null;bufsRef.current={};}}
              style={{padding:"2px 8px",borderRadius:6,border:"0.5px solid #d0cec8",
                background:soundType==="arcane"?"#708238":"#fff",color:soundType==="arcane"?"#fff":C.label,
                fontSize:10,cursor:"pointer"}}>響ノ音</button>
          </div>
        )}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:4,background:"#f5f5f3",borderRadius:8}}>
          
        </div>
        {isQueuePlaying&&<span style={{fontSize:10,color:"#708238",fontWeight:600}}>通し再生中</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"5px 8px",border:"0.5px solid #d0cec8",borderRadius:8,background:"#f5f5f3"}}>
        {canEdit&&<span style={{fontSize:10,fontWeight:700,color:C.label}}>小節</span>}
        {canEdit&&<select value={bars} onChange={function(e){
            var v=e.target.value;
            setBars(v);
            barsRef.current=Math.max(2,Math.min(parseInt(v)||8,32));
            setBarLengths(function(prev){
              var nb=Math.max(2,Math.min(parseInt(v)||8,32));
              if(!prev) return null;
              var arr=prev.slice();
              while(arr.length<nb) arr.push(SPB);
              arr=arr.slice(0,nb);
              barLengthsRef.current=arr;
              return arr;
            });
          }}
          style={{fontSize:11,padding:"2px 4px",borderRadius:4,border:"0.5px solid #d0cec8",background:"#fff",color:C.label}}>
          {[2,4,6,8,10,12,14,16].map(function(n){return <option key={n} value={String(n)}>{n}</option>;})}
        </select>}
        {canEdit&&<span style={{fontSize:10,fontWeight:700,color:C.label}}>繰返</span>}
        {canEdit&&<select value={repeat} onChange={function(e){setRepeat(e.target.value);}}
          style={{fontSize:11,padding:"2px 4px",borderRadius:4,border:"0.5px solid #d0cec8",background:"#fff",color:C.label}}>
          {[1,2,3,4].map(function(n){return <option key={n} value={String(n)}>{n}回</option>;})}
        </select>}
        <span style={{fontSize:10,fontWeight:700,color:C.label}}>左右表示</span>
        <div onClick={function(){setLrOn(function(v){return !v;});}} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",userSelect:"none"}}>
          {Sw(lrOn)}<span style={{fontSize:10,color:C.label}}>{lrOn?"ON":"OFF"}</span>
        </div>
        {canEdit&&(
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {saveMsg&&<span style={{fontSize:10,color:saveMsg.includes("✅")?"#708238":"#e74c3c",fontWeight:700}}>{saveMsg}</span>}
            <button onClick={handleSave} disabled={saving}
              style={{padding:"3px 12px",borderRadius:8,border:"none",
                background:saving?"#aaa":"linear-gradient(135deg,#b8c26a,#8a9a3a)",
                color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              {saving?"保存中…":"💾 保存"}
            </button>
          </div>
        )}
        {!canEdit&&(onPrintThis||onPrintAll)&&(
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {onPrintThis&&<button onClick={onPrintThis}
              style={{padding:"3px 10px",borderRadius:8,border:"0.5px solid #d0cec8",background:"#f5f5f3",color:"#555",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              🖨 このセクション
            </button>}
            {onPrintAll&&<button onClick={onPrintAll}
              style={{padding:"3px 10px",borderRadius:8,border:"0.5px solid #d0cec8",background:"#f5f5f3",color:"#555",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              🖨 全セクション
            </button>}
          </div>
        )}
      </div>
      </div>

      {/* 小節数・繰り返し・拍子 */}
      {canEdit ? (
        <div style={{display:"flex",flexDirection:"column",gap:8,height:"100vh",overflow:"auto"}}>
          {/* イラスト横並び（sticky固定） */}
          <div style={{display:"flex",justifyContent:"center",gap:32,alignItems:"flex-start",marginBottom:8,position:"sticky",top:0,zIndex:10,background:"transparent",paddingBottom:4}}>
            {/* 響ノ音イラスト（instrument2がある時） */}
            {instrument2&&!swapLR&&(
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:11,color:C.label,marginBottom:4,fontWeight:600}}>響ノ音</div>
                <svg viewBox={scale==="nostalgic"?"-32 0 204 166":"0 0 140 166"} width={scale==="nostalgic"?204:140} height="166">
                  <circle cx="70" cy="83" r="67" fill="transparent" stroke="#a09890" strokeWidth="0.4"/>
                  {scale==="nostalgic" ? <><text x="-26" y="86" textAnchor="start" fontSize="10" fontFamily="sans-serif" fill="#999">高音</text><text x="166" y="86" textAnchor="end" fontSize="10" fontFamily="sans-serif" fill="#999">低音</text></> : <text x="70" y="10" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#999">低音</text>}
                  {scale!=="nostalgic" && <text x="70" y="162" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#999">高音</text>}
                  {Object.keys(SCORE_DOTS_HIBIKI).map(function(color){
                      var pos=SCORE_DOTS_HIBIKI[color];
                      return (
                        <g key={color}>
                          <circle cx={pos.cx} cy={pos.cy}
                            r={isHL2(color)?17:15}
                            fill={isHL2(color)?SCORE_HIBIKI_COLORS[color]:SCORE_HIBIKI_PALE_COLORS[color]}
                            stroke="white" strokeWidth={isHL2(color)?"3":"1.5"}
                            style={{transition:"all 0.15s"}}/>
                          {lrOn&&dotLabel2[color]&&(
                            <text x={pos.cx} y={pos.cy+1} textAnchor="middle" dominantBaseline="middle"
                              fontSize="13" fontWeight="900" fill="#2C2A28" fontFamily="sans-serif" pointerEvents="none"
                              stroke="#fff" strokeWidth="2" paintOrder="stroke">
                              {dotLabel2[color]}
                            </text>
                          )}
                        </g>
                      );
                    })}
                </svg>
              </div>
            )}
            {/* 風ノ音イラスト */}
            <div style={{textAlign:"center"}}>
              {instrument2&&<div style={{fontSize:11,color:C.label,marginBottom:4,fontWeight:600}}>風ノ音</div>}
              <div style={{width:140}}>
              <svg viewBox={scale==="nostalgic"?"-32 0 204 166":"0 0 140 166"} width={scale==="nostalgic"?204:140} height="166">
              <circle cx="70" cy="83" r="67" fill="transparent" stroke="#a09890" strokeWidth="0.4"/>
              {scale==="nostalgic" ? (
                <>
                  <text x="-26" y="86" textAnchor="start" fontSize="10" fontFamily="sans-serif" fill="#999">高音</text>
                  <text x="166" y="86" textAnchor="end" fontSize="10" fontFamily="sans-serif" fill="#999">低音</text>
                </>
              ) : (
                <>
                  <text x="70" y="10" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#999">{getDrumLabels(scoreId, sectionKey, scale).top}</text>
                  <text x="70" y="162" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#999">{getDrumLabels(scoreId, sectionKey, scale).bottom}</text>
                </>
              )}
              {(function(){
                var activeDots=getEffectiveDots(scoreId, sectionKey, scale, instrument2);
                if(isAttackEnabled){
                  var _pinkPos=activeDots.pink||{cx:70,cy:83};
                  var _brownPos=activeDots.brown||{cx:103.9,cy:116.9};
                  activeDots=Object.assign({},activeDots,{attack:{cx:(_pinkPos.cx+_brownPos.cx)/2, cy:(_pinkPos.cy+_brownPos.cy)/2}});
                }
                return Object.keys(activeDots).filter(function(c){return !(scale==="nostalgic"&&c==="pink");}).map(function(color){
                  var pos=activeDots[color];
                  return (
                    <g key={color}>
                      <circle cx={pos.cx} cy={pos.cy}
                        r={color==="attack"?(color===highlightColor?9:8):(color===highlightColor?17:15)}
                        fill={color===highlightColor?SCORE_DOT_COLORS[color]:(dotFills[color]||SCORE_PALE_COLORS[color])}
                        stroke="white" strokeWidth={color===highlightColor?"3":"1.5"}
                        style={{transition:"all 0.15s"}}/>
                      {lrOn&&dotLabel[color]&&(
                        <text x={pos.cx} y={pos.cy+1} textAnchor="middle" dominantBaseline="middle"
                          fontSize="13" fontWeight="900" fill="#2C2A28" fontFamily="sans-serif" pointerEvents="none"
                          stroke="#fff" strokeWidth="2" paintOrder="stroke">
                          {dotLabel[color]}
                        </text>
                      )}
                      {color==="attack"&&(
                        <text x={pos.cx} y={pos.cy+1} textAnchor="middle" dominantBaseline="middle"
                          fontSize="7" fontWeight="900" fill={color===highlightColor?"#fff":"#999"} fontFamily="sans-serif" pointerEvents="none">
                          ✕
                        </text>
                      )}
                    </g>
                  );
                });
              })()}
              </svg>
              </div>
            </div>
          {instrument2&&swapLR&&(
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:11,color:C.label,marginBottom:4,fontWeight:600}}>響ノ音</div>
              <svg viewBox={scale==="nostalgic"?"-32 0 204 166":"0 0 140 166"} width={scale==="nostalgic"?204:140} height="166">
                <circle cx="70" cy="83" r="67" fill="transparent" stroke="#a09890" strokeWidth="0.4"/>
                {scale==="nostalgic" ? <><text x="-26" y="86" textAnchor="start" fontSize="10" fontFamily="sans-serif" fill="#999">高音</text><text x="166" y="86" textAnchor="end" fontSize="10" fontFamily="sans-serif" fill="#999">低音</text></> : <text x="70" y="10" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#999">低音</text>}
                {scale!=="nostalgic" && <text x="70" y="162" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#999">高音</text>}
                {Object.keys(SCORE_DOTS_HIBIKI).map(function(color){
                  var pos=SCORE_DOTS_HIBIKI[color];
                  return (
                    <g key={color}>
                      <circle cx={pos.cx} cy={pos.cy}
                        r={isHL2(color)?17:15}
                        fill={isHL2(color)?SCORE_HIBIKI_COLORS[color]:SCORE_HIBIKI_PALE_COLORS[color]}
                        stroke="white" strokeWidth={isHL2(color)?"3":"1.5"}
                        style={{transition:"all 0.15s"}}/>
                      {lrOn&&dotLabel2[color]&&(
                        <text x={pos.cx} y={pos.cy+1} textAnchor="middle" dominantBaseline="middle"
                          fontSize="13" fontWeight="900" fill="#2C2A28" fontFamily="sans-serif" pointerEvents="none"
                          stroke="#fff" strokeWidth="2" paintOrder="stroke">
                          {dotLabel2[color]}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
          </div>
          {/* グリッド */}
          <div style={{overflowX:"auto",width:"100%"}}>
            {instrument2?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                {Array.from({length:numBars},function(_,bi){
                  return (
                    <div key={bi} onClick={function(b){return function(){setSelectedBarSync(b);};}(bi)} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
                      {swapLR?renderBar(bi):(renderBar2Edit&&renderBar2Edit(bi))}
                      {swapLR?(renderBar2Edit&&renderBar2Edit(bi)):renderBar(bi)}
                    </div>
                  );
                })}
              </div>
            ):(
              <div>
                <div style={{display:"inline-flex",gap:4,marginBottom:10}}>
                  {topBars.map(function(b){return renderBar(b);})}
                </div>
                <br/>
                <div style={{display:"inline-flex",gap:4}}>
                  {botBars.map(function(b){return renderBar(b);})}
                </div>
              </div>
            )}
          </div>
        </div>) : (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          {/* イラスト横並び（上、sticky固定） */}
          <div style={{display:"flex",gap:instrument2?48:0,justifyContent:"center",marginBottom:8,flexWrap:"wrap",position:"sticky",top:0,zIndex:10,background:"#f0ebdc",paddingBottom:4,paddingTop:4}}>
            {/* 1台目イラスト（instrument2がある時は響ノ音を先に。swapLRの時は風ノ音を先に） */}
            {instrument2&&!swapLR&&(function(){
              var DOTS_I=instrument2==="arcane"?SCORE_DOTS_HIBIKI:SCORE_DOTS_DREAMY;
              return (
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:11,color:C.label,marginBottom:4,fontWeight:600}}>響ノ音</div>
                  <svg viewBox={scale==="nostalgic"?"-32 0 204 166":"0 0 140 166"} width={scale==="nostalgic"?175:120} height="142">
                    <circle cx="70" cy="83" r="67" fill="transparent" stroke="#a09890" strokeWidth="0.4"/>
                    {scale==="nostalgic" ? <><text x="-26" y="86" textAnchor="start" fontSize="10" fontFamily="sans-serif" fill="#999">高音</text><text x="166" y="86" textAnchor="end" fontSize="10" fontFamily="sans-serif" fill="#999">低音</text></> : <text x="70" y="10" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#999">低音</text>}
                    {scale!=="nostalgic" && <text x="70" y="162" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#999">高音</text>}
                    {(function(){
                      var used2={};
                      COLORS2.forEach(function(c){
                        for(var i=0;i<numBars*SPB;i++){
                          if((left2[c]&&left2[c][i])||(right2[c]&&right2[c][i])){ used2[c]=true; break; }
                        }
                      });
                      return Object.keys(DOTS_I).map(function(color){
                        var pos=DOTS_I[color];
                        return (
                          <g key={color}>
                            <circle cx={pos.cx} cy={pos.cy}
                              r={isHL2(color)?17:15}
                              fill={isHL2(color)?SCORE_HIBIKI_COLORS[color]:SCORE_HIBIKI_PALE_COLORS[color]}
                              stroke="white" strokeWidth={isHL2(color)?"3":"1.5"}
                              style={{transition:"all 0.15s"}}/>
                            {lrOn&&dotLabel2[color]&&(
                              <text x={pos.cx} y={pos.cy+1} textAnchor="middle" dominantBaseline="middle"
                                fontSize="13" fontWeight="900" fill="#2C2A28" fontFamily="sans-serif" pointerEvents="none"
                                stroke="#fff" strokeWidth="2" paintOrder="stroke">
                                {dotLabel2[color]}
                              </text>
                            )}
                          </g>
                        );
                      });
                    })()}
                  </svg>
                </div>
              );
            })()}
            <div style={{textAlign:"center"}}>
              {instrument2&&<div style={{fontSize:11,color:C.label,marginBottom:4,fontWeight:600}}>風ノ音</div>}
              <svg viewBox={scale==="nostalgic"?"-32 0 204 166":"0 0 140 166"} width={scale==="nostalgic"?175:120} height="142">
              <circle cx="70" cy="83" r="67" fill="transparent" stroke="#a09890" strokeWidth="0.4"/>
              {scale==="nostalgic" ? (
                <>
                  <text x="-26" y="86" textAnchor="start" fontSize="9" fontWeight="500" fill="#999" fontFamily="sans-serif">高音</text>
                  <text x="166" y="86" textAnchor="end" fontSize="9" fontWeight="500" fill="#999" fontFamily="sans-serif">低音</text>
                </>
              ) : (
                <>
                  <text x="70" y="8" textAnchor="middle" fontSize="9" fontWeight="500" fill="#999" fontFamily="sans-serif">{getDrumLabels(scoreId, sectionKey, scale).top}</text>
                  <text x="70" y="160" textAnchor="middle" fontSize="9" fontWeight="500" fill="#999" fontFamily="sans-serif">{getDrumLabels(scoreId, sectionKey, scale).bottom}</text>
                </>
              )}
              {(function(){
                var activeDots=getEffectiveDots(scoreId, sectionKey, scale, instrument2);
                if(isAttackEnabled){
                  var _pinkPos=activeDots.pink||{cx:70,cy:83};
                  var _brownPos=activeDots.brown||{cx:103.9,cy:116.9};
                  activeDots=Object.assign({},activeDots,{attack:{cx:(_pinkPos.cx+_brownPos.cx)/2, cy:(_pinkPos.cy+_brownPos.cy)/2}});
                }
                return Object.keys(activeDots).filter(function(color){return !(scale==="nostalgic"&&color==="pink");}).map(function(color){
                  var pos=activeDots[color];
                  return (
                    <g key={color}>
                      <circle cx={pos.cx} cy={pos.cy}
                        r={color==="attack"?(color===highlightColor?9:8):(color===highlightColor?17:15)}
                        fill={color===highlightColor?SCORE_DOT_COLORS[color]:(dotFills[color]||SCORE_PALE_COLORS[color])}
                        stroke="white" strokeWidth={color===highlightColor?"3":"1.5"}
                        style={{transition:"all 0.15s"}}/>
                      {lrOn&&dotLabel[color]&&(
                        <text x={pos.cx} y={pos.cy+1} textAnchor="middle" dominantBaseline="middle"
                          fontSize="13" fontWeight="900" fill="#2C2A28" fontFamily="sans-serif" pointerEvents="none"
                          stroke="#fff" strokeWidth="2" paintOrder="stroke">
                          {dotLabel[color]}
                        </text>
                      )}
                      {color==="attack"&&(
                        <text x={pos.cx} y={pos.cy+1} textAnchor="middle" dominantBaseline="middle"
                          fontSize="7" fontWeight="900" fill={color===highlightColor?"#fff":"#999"} fontFamily="sans-serif" pointerEvents="none">
                          ✕
                        </text>
                      )}
                    </g>
                  );
                });
              })()}
              </svg>
            </div>
            {/* swapLRの時：響ノ音を風ノ音の後（右）に表示 */}
            {instrument2&&swapLR&&(function(){
              var DOTS_I=instrument2==="arcane"?SCORE_DOTS_HIBIKI:SCORE_DOTS_DREAMY;
              return (
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:11,color:C.label,marginBottom:4,fontWeight:600}}>響ノ音</div>
                  <svg viewBox={scale==="nostalgic"?"-32 0 204 166":"0 0 140 166"} width={scale==="nostalgic"?175:120} height="142">
                    <circle cx="70" cy="83" r="67" fill="transparent" stroke="#a09890" strokeWidth="0.4"/>
                    {scale==="nostalgic" ? <><text x="-26" y="86" textAnchor="start" fontSize="10" fontFamily="sans-serif" fill="#999">高音</text><text x="166" y="86" textAnchor="end" fontSize="10" fontFamily="sans-serif" fill="#999">低音</text></> : <text x="70" y="10" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#999">低音</text>}
                    {scale!=="nostalgic" && <text x="70" y="162" textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#999">高音</text>}
                    {Object.keys(DOTS_I).map(function(color){
                      var pos=DOTS_I[color];
                      return (
                        <g key={color}>
                          <circle cx={pos.cx} cy={pos.cy}
                            r={isHL2(color)?17:15}
                            fill={isHL2(color)?SCORE_HIBIKI_COLORS[color]:SCORE_HIBIKI_PALE_COLORS[color]}
                            stroke="white" strokeWidth={isHL2(color)?"3":"1.5"}
                            style={{transition:"all 0.15s"}}/>
                          {lrOn&&dotLabel2[color]&&(
                            <text x={pos.cx} y={pos.cy+1} textAnchor="middle" dominantBaseline="middle"
                              fontSize="13" fontWeight="900" fill="#2C2A28" fontFamily="sans-serif" pointerEvents="none"
                              stroke="#fff" strokeWidth="2" paintOrder="stroke">
                              {dotLabel2[color]}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              );
            })()}
          </div>
          <div style={{display:"flex",gap:0,justifyContent:"center",alignItems:"flex-start",width:"100%"}}>
            {/* 1台目グリッド */}
            <div style={{maxWidth:"100%",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
              <div style={{display:"flex",gap:2,marginBottom:10,flexWrap:"nowrap"}}>
                {topBars.map(function(b){return renderBar(b);})}
              </div>
              <div style={{display:"flex",gap:2,flexWrap:"nowrap"}}>
                {botBars.map(function(b){return renderBar(b);})}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 下部余白でスクロール領域を確保 */}
      <div style={{height:"30vh"}}/>
    </div>
  );
}



export default ScorePlayer;
export { SCORE_ID_TO_NAME, SCORE_SECTIONS, SCORE_DEFAULT_BPM, getSoundUrls };
