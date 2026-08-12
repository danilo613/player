import React, { useState, useEffect } from 'react';
import ScorePlayer, { SCORE_ID_TO_NAME, SCORE_SECTIONS, SCORE_DEFAULT_BPM } from './ScorePlayerReal.jsx';

const C = {
  choco: "#4b3621", moss: "#708238", label: "#8a7a5a", olive: "#7a8a3a",
  border: "rgba(0,0,0,0.1)",
};

const PORTAL_API = "https://gudadrum-portal.vercel.app/api/gas";

// 体験版で公開する3曲。それぞれの曲が実際に使っている音階を、そのまま表示する。
const DEMO_SONGS = [
  { scoreId: "iridescence", section: "amelo", sectionLabel: "Aメロ", scale: "enigma", scaleLabel: "秘ノ音（enigma）", altScale: "arcane", altScaleLabel: "響ノ音（arcane）" },
  { scoreId: "dreamy",      section: "intro", sectionLabel: "イントロ", scale: "default", scaleLabel: "風ノ音（tonus）" },
  { scoreId: "holychild",   section: "intro", sectionLabel: "イントロ", scale: "equinox", scaleLabel: "光ノ音（equinox）" },
];

function DemoScoreCard({ demo, open, onToggle }) {
  const [patternData, setPatternData] = useState(null);
  const [showAlt, setShowAlt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [sharedBpm, setSharedBpm] = useState(SCORE_DEFAULT_BPM[demo.scoreId] || 100);
  const [sharedMetroOn, setSharedMetroOn] = useState(false);
  const [sharedMetroMode, setSharedMetroMode] = useState("normal");
  const [sharedHeadBell, setSharedHeadBell] = useState(true);
  const [floatPos, setFloatPos] = useState({ x: 20, y: 120 });

  useEffect(() => {
    if (!open || patternData) return;
    setLoading(true);
    fetch(PORTAL_API + "?action=getscores&score_id=" + demo.scoreId)
      .then(r => r.json())
      .then(data => {
        const patterns = {};
        (data.rows || []).forEach(r => {
          if (!patterns[r.section]) patterns[r.section] = { left: {}, right: {}, meta: {} };
          if (!patterns[r.section][r.hand]) patterns[r.section][r.hand] = {};
          if (r.hand === "meta") patterns[r.section].meta[r.color] = r.pattern;
          else { try { patterns[r.section][r.hand][r.color] = JSON.parse(r.pattern || "[]"); } catch(e) {} }
        });
        const sec = patterns[demo.section] || { left: {}, right: {}, meta: {} };
        setPatternData(sec);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [open]);

  // 譜面（グリッド・配置）自体はどちらの音階でも共通。音源（scale）だけが切り替わる。
  const currentScale = (showAlt && demo.altScale) ? demo.altScale : demo.scale;
  const currentScaleLabel = (showAlt && demo.altScaleLabel) ? demo.altScaleLabel : demo.scaleLabel;

  const sections = SCORE_SECTIONS[demo.scoreId] || [];

  return (
    <div style={{ background: "#F0EBDB", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 18, marginBottom: 16, overflow: "hidden" }}>
      <div onClick={onToggle} style={{ padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <span style={{ fontSize: 22, marginRight: 12 }}>🎼</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.choco }}>{SCORE_ID_TO_NAME[demo.scoreId]}</div>
            <div style={{ fontSize: 10, color: "#8a7a5a", marginTop: 2, marginBottom: 6 }}>譜面プレイヤー体験版</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span style={{ fontSize: 13, background: "rgba(112,130,56,0.14)", color: C.moss, padding: "5px 12px", borderRadius: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
                音階：{demo.altScaleLabel ? (demo.scaleLabel + " or " + demo.altScaleLabel) : currentScaleLabel}
              </span>
            </div>
          </div>
        </div>
        <span style={{ fontSize: 14, color: C.moss, transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0, marginLeft: 8 }}>▼</span>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "12px 20px 0" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              {sections.map(s => (
                <span key={s[0]} style={{
                  fontSize: 10, padding: "4px 10px", borderRadius: 12,
                  background: s[0] === demo.section ? "#2a7a5a" : "#f2f2f2",
                  color: s[0] === demo.section ? "#fff" : "#bbb",
                  fontWeight: s[0] === demo.section ? 700 : 400,
                }}>
                  {s[1]}{s[0] !== demo.section ? " 🔒" : ""}
                </span>
              ))}
            </div>
          </div>

          {demo.altScale && (
            <div style={{ padding: "0 20px 12px", display: "flex", gap: 8 }}>
              <button onClick={() => setShowAlt(false)}
                style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: !showAlt ? "2px solid "+C.moss : "1px solid rgba(0,0,0,0.1)", background: !showAlt ? "rgba(112,130,56,0.14)" : "#fff", color: !showAlt ? C.moss : "#999", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {demo.scaleLabel}
              </button>
              <button onClick={() => setShowAlt(true)}
                style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: showAlt ? "2px solid #8a4a6a" : "1px solid rgba(0,0,0,0.1)", background: showAlt ? "rgba(138,74,106,0.14)" : "#fff", color: showAlt ? "#8a4a6a" : "#999", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {demo.altScaleLabel}
              </button>
            </div>
          )}

          {loading && <p style={{ fontSize: 12, color: C.label, textAlign: "center", padding: 30 }}>読込中…</p>}
          {error && <p style={{ fontSize: 12, color: "#a04030", textAlign: "center", padding: 30 }}>読み込みに失敗しました</p>}
          {!loading && !error && patternData && (
            <ScorePlayer
              key={showAlt ? "alt" : "main"}
              scoreId={demo.scoreId} sectionKey={demo.section} sectionLabel={demo.sectionLabel}
              patternData={patternData}
              canEdit={false} onSave={() => {}}
              startTime="" onStartTimeChange={() => {}}
              scale={currentScale} subdivProp={(sections.find(s=>s[0]===demo.section)||[])[2] || "16th"} scoreLoading={false}
              onSectionEnd={() => {}} onQueueStart={() => {}} isQueuePlaying={false}
              sharedBpm={sharedBpm} onBpmChange={setSharedBpm}
              sharedMetroOn={sharedMetroOn} sharedMetroMode={sharedMetroMode}
              onMetroChange={(on, mode) => { setSharedMetroOn(on); setSharedMetroMode(mode); }}
              onPrintAll={() => {}} onPrintThis={() => {}} onLoopComplete={() => {}}
              autoPlay={false} instrument2={null} patternData2={null}
              sharedHeadBell={sharedHeadBell} floatPosInit={floatPos} onFloatPosChange={setFloatPos} swapLR={false}
            />
          )}

          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ fontSize: 10.5, color: "#9a7a4a", background: "rgba(245,166,35,0.1)", borderLeft: "3px solid #f5a623", padding: "8px 10px", borderRadius: 6, lineHeight: 1.6 }}>
              グーダドラム／譜面プレイヤーのご購入はこちら → <a href="https://www.gudadrumjapan.com/product-page/player" style={{ color: C.moss }}>gudadrumjapan.com</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [openScoreId, setOpenScoreId] = useState(null);
  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: "url(https://gudadrum-portal.vercel.app/back.png)",
      backgroundSize: "cover", backgroundPosition: "top left", backgroundAttachment: "fixed",
      fontFamily: "'Noto Sans JP', sans-serif", paddingBottom: 60,
    }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Noto+Serif+JP:wght@300;400;500;700&display=swap');"}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 16px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 6, filter: "drop-shadow(0 0 12px rgba(255,255,255,0.95))" }}>🌿</div>
          <div style={{ fontFamily: "'Noto Serif JP',serif", fontSize: 20, fontWeight: 700, letterSpacing: "0.1em", color: C.choco, textShadow: "0 0 20px rgba(255,255,255,0.9), 0 0 40px rgba(255,255,255,0.7)" }}>GUDADRUM ORCHESTRA</div>
          <div style={{ display: "inline-block", fontSize: 19, fontWeight: 700, color: C.moss, letterSpacing: "0.14em", marginTop: 8, padding: "8px 22px", background: "rgba(255,255,255,0.9)", border: "2px solid #fff", borderRadius: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>譜面プレイヤー体験版</div>
          <div style={{ fontSize: 14, color: "#5a4a34", marginTop: 14, lineHeight: 1.9, background: "rgba(255,255,255,0.75)", borderRadius: 10, padding: "14px 16px" }}>
            グーダドラムの世界を、<br/>
            ここで少しだけ体験できます。<br/>
            3曲、それぞれ異なる「音階」を使った<br/>
            譜面プレイヤーをお試しいただけます。<br/>
            <span style={{ display: "block", marginTop: 10, fontSize: 13, color: "#4b3a28", fontWeight: 600 }}>
              譜面プレイヤーを使用するには、<br/>
              グーダドラムオーケストラ専用のポータルサイトを<br/>
              開設する必要があります（無料）。<br/>
              詳しくは <a href="https://www.gudadrumjapan.com/cmmnt" target="_blank" rel="noreferrer" style={{ color: C.moss, fontWeight: 700 }}>こちら</a>
            </span>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.08)", textAlign: "left" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.choco, marginBottom: 8 }}>【購入可能な楽曲の譜面（それぞれの音階）】</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#5a4a34", lineHeight: 1.7 }}>
                <li>⭐️蒼〜aoi〜<br/>　（響ノ音 or 秘ノ音：旧アーケインorエニグマ）</li>
                <li>⭐️iridescence<br/>　（響ノ音 or 秘ノ音：旧アーケインorエニグマ）</li>
                <li>⭐️dreamy EYES<br/>　（風ノ音：旧トーナス）</li>
                <li>⭐️めぐみの空<br/>　（響ノ音＆風ノ音：旧アーケイン＆トーナス）</li>
                <li>⭐️Re:Grace<br/>　（風ノ音＆響ノ音：旧アーケイン＆トーナス）</li>
                <li>⭐️water lily<br/>　（風ノ音：旧トーナス）</li>
                <li>⭐️holy child<br/>　（光ノ音：旧イークィノックス）</li>
              </ul>
              <p style={{ fontSize: 12, marginTop: 12, marginBottom: 4 }}>
                🔻譜面の購入はこちら🔻<br/>
                <a href="https://www.gudadrumjapan.com/product-page/player" target="_blank" rel="noreferrer" style={{ color: C.moss, fontWeight: 700, wordBreak: "break-all" }}>https://www.gudadrumjapan.com/product-page/player</a>
              </p>
              <p style={{ fontSize: 12, marginTop: 12 }}>
                🔻譜面プレイヤーの解説動画はこちら🔻<br/>
                <a href="https://youtu.be/TYQXDJzd1_4?si=zV_XpHEAhFEavAoQ" target="_blank" rel="noreferrer" style={{ color: C.moss, fontWeight: 700, wordBreak: "break-all" }}>https://youtu.be/TYQXDJzd1_4?si=zV_XpHEAhFEavAoQ</a>
              </p>
            </div>
          </div>
        </div>

        {DEMO_SONGS.map(demo => (
          <DemoScoreCard key={demo.scoreId} demo={demo}
            open={openScoreId === demo.scoreId}
            onToggle={() => setOpenScoreId(openScoreId === demo.scoreId ? null : demo.scoreId)}
          />
        ))}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a href="https://www.gudadrumjapan.com/cmmnt" target="_blank" rel="noreferrer"
            style={{ display: "inline-block", background: "linear-gradient(135deg,#7a9a4a,#5a7a2a)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "12px 30px", borderRadius: 24, textDecoration: "none" }}>
            気になったら、こちらから 🌿
          </a>
          <div style={{ marginTop: 10 }}>
            <a href="https://www.gudadrumjapan.com/" target="_blank" rel="noreferrer"
              style={{ display: "inline-block", background: "linear-gradient(135deg,#7a9a4a,#5a7a2a)", color: "#fff", fontSize: 13, fontWeight: 700, padding: "12px 30px", borderRadius: 24, textDecoration: "none" }}>
              グーダドラムの購入はこちら 🌿
            </a>
          </div>
          <div style={{ fontSize: 10, color: "#6a5a44", marginTop: 8, textShadow: "0 0 10px rgba(255,255,255,0.8)" }}>GUDAdrum Orchestra への参加案内・お問い合わせ</div>
          <div style={{ fontSize: 11, color: C.moss, marginTop: 4, fontWeight: 700, textShadow: "0 0 10px rgba(255,255,255,0.8)" }}>
            <a href="mailto:danilo@starseeds.me" style={{ color: C.moss, textDecoration: "none" }}>danilo@starseeds.me</a>
          </div>
        </div>
      </div>
    </div>
  );
}
