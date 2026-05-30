import { useState, useEffect } from "react";
import { Users, Zap, Settings, Plus, X, RefreshCw, Shuffle, Save, Trash2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// DATA LAYER
// ─────────────────────────────────────────────────────────────────

// The "type" tag is the bridge between orientations and actions.
// Every orientation gets one type; every action lists which types it's compatible with.
const TYPES = {
  "dyadic-face":  "Face to Face",
  "dyadic-side":  "Side by Side",
  "dyadic-back":  "Back to Back",
  "triangular":   "Triangle",
  "linear":       "In a Line",
  "one-vs-group": "One vs. Group",
  "circular":     "Circle",
  "quad-corners": "Four Corners",
  "split":        "Split Groups",
};

const ORIENTATIONS0 = [
  { id:"o1",  name:"Face to Face",   desc:"Directly opposite — the full presence of another person",               minP:2, maxP:2, type:"dyadic-face",  isDefault:true },
  { id:"o2",  name:"Side by Side",   desc:"Shoulder to shoulder, both facing the same world",                      minP:2, maxP:2, type:"dyadic-side",  isDefault:true },
  { id:"o3",  name:"Back to Back",   desc:"Unable to see the other — only sense them",                             minP:2, maxP:2, type:"dyadic-back",  isDefault:true },
  { id:"o4",  name:"Triangle",       desc:"Three equal points — no one can hide",                                  minP:3, maxP:3, type:"triangular",   isDefault:true },
  { id:"o5",  name:"The Line",       desc:"In a row — the center caught between two worlds",                       minP:3, maxP:4, type:"linear",       isDefault:true },
  { id:"o6",  name:"Three and One",  desc:"Three together, one apart — facing each other across a divide",         minP:3, maxP:4, type:"one-vs-group", isDefault:true },
  { id:"o7",  name:"Four Corners",   desc:"At the four corners of an imaginary square",                            minP:4, maxP:4, type:"quad-corners", isDefault:true },
  { id:"o8",  name:"The Circle",     desc:"Everyone in a ring — all can see all others",                           minP:3, maxP:5, type:"circular",     isDefault:true },
  { id:"o9",  name:"Four and One",   desc:"Four together as a group, one player stands alone facing them",         minP:5, maxP:5, type:"one-vs-group", isDefault:true },
  { id:"o10", name:"Two and Three",  desc:"A pair on one side, a trio on the other",                              minP:5, maxP:5, type:"split",        isDefault:true },
];

const ACTIONS0 = [
  { id:"a1",  name:"Mirror Without Words",       desc:"One leads with movement; the other follows as a perfect reflection",             compat:["dyadic-face"],               isDefault:true },
  { id:"a2",  name:"React to the Face",          desc:"Respond emotionally to what you see — without speaking",                        compat:["dyadic-face"],               isDefault:true },
  { id:"a3",  name:"The Object Between You",     desc:"Something exists between you. Discover what it is — together.",                 compat:["dyadic-face"],               isDefault:true },
  { id:"a4",  name:"Address the Unseen",         desc:"Both speak to an imaginary audience — saying completely opposite things",        compat:["dyadic-side"],               isDefault:true },
  { id:"a5",  name:"The Same Shock",             desc:"Something just happened in front of you. React — without agreeing on what it was.", compat:["dyadic-side"],            isDefault:true },
  { id:"a6",  name:"Describe Without Looking",   desc:"Each describes what the other is doing — without turning around",               compat:["dyadic-back"],               isDefault:true },
  { id:"a7",  name:"Reach Without Turning",      desc:"Try to make contact with the other — without facing them",                      compat:["dyadic-back"],               isDefault:true },
  { id:"a8",  name:"Exclude the Third",          desc:"Two form a silent alliance. The third must break in — without asking.",         compat:["triangular","linear"],       isDefault:true },
  { id:"a9",  name:"The Translator",             desc:"The middle player translates between two who cannot speak to each other",       compat:["triangular","linear"],       isDefault:true },
  { id:"a10", name:"Pass the Emotion",           desc:"An emotion travels down the line — each player transforms it slightly",         compat:["linear"],                    isDefault:true },
  { id:"a11", name:"Convince the Crowd",         desc:"The solo player must win over the group on the most absurd premise possible",   compat:["one-vs-group"],              isDefault:true },
  { id:"a12", name:"The Group Reacts",           desc:"The solo player makes a declaration — the group reacts as one organism",        compat:["one-vs-group","split"],      isDefault:true },
  { id:"a13", name:"One Word Story",             desc:"Build a story one word at a time, going around the circle",                    compat:["circular"],                  isDefault:true },
  { id:"a14", name:"Chain of Gestures",          desc:"Each player transforms the previous player's final pose into something new",    compat:["circular","quad-corners"],   isDefault:true },
  { id:"a15", name:"Speak Across the Distance",  desc:"Each opposite pair is mid-conversation — simultaneously and separately",        compat:["quad-corners"],              isDefault:true },
  { id:"a16", name:"Two Worlds Collide",         desc:"Each group establishes a silent reality in secret. Now they must merge.",       compat:["split"],                     isDefault:true },
];

// ─────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────

const uid       = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const pLabel    = (name, i) => name?.trim() || `Player ${i + 1}`;
const filterO   = (all, n) => all.filter(o => n >= o.minP && n <= o.maxP);
const filterA   = (all, type) => all.filter(a => a.compat.includes(type));
const pick      = arr => arr[Math.floor(Math.random() * arr.length)];

// ─────────────────────────────────────────────────────────────────
// GLOBAL STYLES (injected once on mount)
// ─────────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700;12..96,800&family=DM+Mono&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:    #0C0C11;
  --surf:  #141419;
  --surf2: #1D1D26;
  --bdr:   #27273C;
  --txt:   #EDEAD9;
  --mut:   #5E5C75;
  --amt:   #F4B800;
  --cor:   #FF4F38;
  --mnt:   #2EF5AF;
  --r:     14px;
  --font:  'Bricolage Grotesque', system-ui, sans-serif;
  --mono:  'DM Mono', monospace;
}

html, body, #root {
  height: 100%;
  background: var(--bg);
  color: var(--txt);
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
}

input, button, select { font-family: var(--font); outline: none; }
button { cursor: pointer; border: none; background: none; }

input {
  background: var(--surf2);
  border: 1px solid var(--bdr);
  border-radius: 10px;
  color: var(--txt);
  padding: 11px 13px;
  font-size: 15px;
  width: 100%;
  transition: border-color .15s;
}
input:focus { border-color: var(--amt); }
input::placeholder { color: var(--mut); }

select {
  background: var(--surf2);
  border: 1px solid var(--bdr);
  border-radius: 10px;
  color: var(--txt);
  padding: 10px 13px;
  font-size: 14px;
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
}

.scroll {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.scroll::-webkit-scrollbar { display: none; }

@keyframes flicker { 0%,100%{opacity:1} 50%{opacity:.6} }
@keyframes rise    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes pop     { 0%{transform:scale(.95)} 60%{transform:scale(1.02)} 100%{transform:scale(1)} }

.spinning { animation: flicker .1s ease infinite; font-family: var(--mono) !important; letter-spacing:.02em; }
.revealed { animation: rise .3s ease both, pop .3s ease both; }
`;

// ─────────────────────────────────────────────────────────────────
// PLAY TAB
// ─────────────────────────────────────────────────────────────────

function PlayTab({ players, orientations, actions }) {
  const [phase, setPhase]   = useState("idle"); // idle | spin-o | pause | spin-a | done
  const [oItem, setOItem]   = useState(null);   // currently displayed orientation
  const [aItem, setAItem]   = useState(null);   // currently displayed action
  const [selO,  setSelO]    = useState(null);   // locked-in orientation result
  const [selA,  setSelA]    = useState(null);   // locked-in action result

  const count  = players.length;
  const validO = filterO(orientations, count);
  const canSpin = count >= 2 && validO.length > 0;

  // Scramble animation: cycles rapidly through options, then slows to land
  const scramble = (pool, setter, onLand) => {
    if (!pool.length) { setter(null); onLand(null); return; }
    const result = pick(pool);
    const delays = [50,50,55,60,65,72,82,95,115,142,180,230,295];
    let i = 0;
    const step = () => {
      if (i < delays.length) {
        setter(pick(pool));
        setTimeout(step, delays[i++]);
      } else {
        setter(result);
        onLand(result);
      }
    };
    step();
  };

  const handleSpin = () => {
    if (!canSpin || (phase !== "idle" && phase !== "done")) return;
    setSelO(null); setSelA(null); setOItem(null); setAItem(null);
    setPhase("spin-o");

    scramble(validO, setOItem, (o) => {
      setSelO(o);
      setPhase("pause");
      setTimeout(() => {
        setPhase("spin-a");
        const pool = o ? filterA(actions, o.type) : [];
        scramble(pool, setAItem, (a) => {
          setSelA(a);
          setPhase("done");
        });
      }, 550);
    });
  };

  const reset = () => {
    setPhase("idle"); setSelO(null); setSelA(null); setOItem(null); setAItem(null);
  };

  const spinningO = phase === "spin-o";
  const spinningA = phase === "spin-a";
  const isSpinning = spinningO || spinningA;
  const oDone = selO && !spinningO;
  const aDone = selA && !spinningA;

  // Card style variants
  const card = (accent, active) => ({
    background: active ? `rgba(${accent},0.05)` : "var(--surf)",
    border: `1px solid ${active ? `rgba(${accent},0.28)` : "var(--bdr)"}`,
    borderTop: active ? `3px solid rgba(${accent},0.7)` : "1px solid var(--bdr)",
    borderRadius: "var(--r)",
    padding: "18px 20px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    transition: "border .3s, background .3s",
    minHeight: 110,
  });

  const dash = { color: "var(--mut)", fontSize: 18, fontWeight: 500 };

  const ResultText = ({ item, isSpinning, isDone, color }) => (
    <>
      <div
        className={isSpinning ? "spinning" : isDone ? "revealed" : ""}
        style={{
          fontSize: isSpinning ? 17 : 20,
          fontWeight: 800,
          color: isDone ? color : "var(--txt)",
          lineHeight: 1.2,
          marginBottom: isDone && item?.desc ? 8 : 0,
          transition: "font-size .2s",
        }}
      >
        {item?.name ?? "—"}
      </div>
      {isDone && item?.desc && (
        <div className="revealed" style={{ fontSize: 13, color: "var(--mut)", lineHeight: 1.55 }}>
          {item.desc}
        </div>
      )}
    </>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"20px 18px 18px", gap:14 }}>
      {/* Players */}
      <div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", color:"var(--mut)", marginBottom:9, textTransform:"uppercase" }}>
          On Stage
        </div>
        <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
          {players.map((p, i) => (
            <div key={i} style={{
              background:"var(--surf2)", border:"1px solid var(--bdr)", borderRadius:100,
              padding:"5px 13px", fontSize:14, fontWeight:600,
            }}>
              {pLabel(p, i)}
            </div>
          ))}
        </div>
      </div>

      {/* Orientation card */}
      <div style={card("245,184,0", oDone)}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", color:"var(--mut)", marginBottom:10, textTransform:"uppercase" }}>
          Spatial Orientation
        </div>
        {phase === "idle"
          ? <div style={dash}>—</div>
          : <ResultText item={oItem} isSpinning={spinningO} isDone={oDone} color="var(--amt)" />
        }
      </div>

      {/* Action card */}
      <div style={{
        ...card("255,79,56", aDone),
        opacity: phase === "idle" || spinningO || phase === "pause" ? 0.38 : 1,
        transition: "opacity .3s, border .3s, background .3s",
      }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", color:"var(--mut)", marginBottom:10, textTransform:"uppercase" }}>
          The Action
        </div>
        {phase === "idle" || spinningO || phase === "pause"
          ? <div style={dash}>—</div>
          : <ResultText item={aItem} isSpinning={spinningA} isDone={aDone} color="var(--cor)" />
        }
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:10, marginTop:4 }}>
        {phase === "done" && (
          <button
            onClick={reset}
            style={{
              background:"var(--surf2)", border:"1px solid var(--bdr)", borderRadius:"var(--r)",
              padding:"14px 16px", color:"var(--mut)", fontSize:14, fontWeight:600,
              display:"flex", alignItems:"center", gap:5, flexShrink:0,
            }}
          >
            <RefreshCw size={14} /> Reset
          </button>
        )}
        <button
          onClick={handleSpin}
          disabled={!canSpin || isSpinning}
          style={{
            flex:1, border:"none", borderRadius:"var(--r)", padding:"15px",
            background: canSpin && !isSpinning ? "var(--amt)" : "var(--surf2)",
            color: canSpin && !isSpinning ? "#000" : "var(--mut)",
            fontSize:15, fontWeight:800, letterSpacing:".05em", textTransform:"uppercase",
            display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            transition:"all .2s",
          }}
        >
          <Shuffle size={16} />
          {phase === "done" ? "Spin Again" : isSpinning ? "Spinning…" : "Spin the Scene"}
        </button>
      </div>

      {!canSpin && (
        <div style={{ textAlign:"center", color:"var(--mut)", fontSize:13, marginTop:-4 }}>
          {count < 2 ? "Add at least 2 players to begin" : "No valid orientations for this group size"}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PLAYERS TAB
// ─────────────────────────────────────────────────────────────────

function PlayersTab({ players, setPlayers, groups, setGroups }) {
  const [saving, setSaving] = useState(false);
  const [gName,  setGName]  = useState("");

  const update = (i, v) => { const p = [...players]; p[i] = v; setPlayers(p); };
  const add    = ()    => { if (players.length < 5) setPlayers([...players, ""]); };
  const remove = (i)   => { if (players.length > 2) setPlayers(players.filter((_, j) => j !== i)); };

  const saveGroup = () => {
    if (!gName.trim()) return;
    setGroups([...groups, { id:uid(), name:gName.trim(), players:[...players] }]);
    setGName(""); setSaving(false);
  };

  const loadGroup   = g  => setPlayers([...g.players]);
  const deleteGroup = id => setGroups(groups.filter(g => g.id !== id));

  return (
    <div className="scroll" style={{ height:"100%", padding:"20px 18px 24px" }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", color:"var(--mut)", marginBottom:14, textTransform:"uppercase" }}>
        Players — {players.length} of 5
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
        {players.map((p, i) => (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{
              width:28, height:28, borderRadius:"50%", background:"var(--surf2)", border:"1px solid var(--bdr)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:800, color:"var(--amt)", flexShrink:0,
            }}>{i + 1}</div>
            <input value={p} onChange={e => update(i, e.target.value)} placeholder={`Player ${i + 1}`} />
            {players.length > 2 && (
              <button onClick={() => remove(i)} style={{ color:"var(--mut)", padding:4, flexShrink:0, display:"flex", alignItems:"center" }}>
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {players.length < 5 && (
        <button
          onClick={add}
          style={{
            width:"100%", padding:"11px", borderRadius:"var(--r)",
            background:"none", border:"1px dashed var(--bdr)", color:"var(--mut)",
            fontSize:14, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            marginBottom:28,
          }}
        >
          <Plus size={15} /> Add Player
        </button>
      )}

      <div style={{ borderTop:"1px solid var(--bdr)", paddingTop:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", color:"var(--mut)", textTransform:"uppercase" }}>Saved Groups</div>
          <button
            onClick={() => setSaving(!saving)}
            style={{
              background:"var(--surf2)", border:"1px solid var(--bdr)", borderRadius:8,
              padding:"6px 11px", color:"var(--txt)", fontSize:12, fontWeight:600,
              display:"flex", alignItems:"center", gap:4,
            }}
          >
            <Save size={11} /> Save Current
          </button>
        </div>

        {saving && (
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <input
              value={gName}
              onChange={e => setGName(e.target.value)}
              placeholder="Group name…"
              onKeyDown={e => e.key === "Enter" && saveGroup()}
            />
            <button
              onClick={saveGroup}
              style={{ background:"var(--amt)", borderRadius:10, padding:"0 16px", color:"#000", fontWeight:800, fontSize:14, flexShrink:0 }}
            >Save</button>
          </div>
        )}

        {groups.length === 0
          ? <div style={{ color:"var(--mut)", fontSize:14 }}>No saved groups yet.</div>
          : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {groups.map(g => (
                <div key={g.id} style={{
                  background:"var(--surf)", border:"1px solid var(--bdr)", borderRadius:"var(--r)",
                  padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center",
                }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{g.name}</div>
                    <div style={{ fontSize:12, color:"var(--mut)", marginTop:2 }}>
                      {g.players.map((p, i) => pLabel(p, i)).join(" · ")}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, marginLeft:12 }}>
                    <button
                      onClick={() => loadGroup(g)}
                      style={{
                        background:"var(--surf2)", border:"1px solid var(--bdr)", borderRadius:8,
                        padding:"6px 10px", color:"var(--amt)", fontSize:12, fontWeight:700,
                      }}
                    >Load</button>
                    <button onClick={() => deleteGroup(g.id)} style={{ color:"var(--mut)", padding:4, display:"flex", alignItems:"center" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SETUP TAB
// ─────────────────────────────────────────────────────────────────

function SetupTab({ orientations, setOrientations, actions, setActions, playerCount }) {
  const [section, setSection] = useState("orientations");
  const [addingO, setAddingO] = useState(false);
  const [addingA, setAddingA] = useState(false);
  const [newO, setNewO] = useState({ name:"", desc:"", minP:"2", maxP:"2", type:"dyadic-face" });
  const [newA, setNewA] = useState({ name:"", desc:"", compat:[] });

  const addO = () => {
    if (!newO.name.trim()) return;
    setOrientations([...orientations, { ...newO, id:uid(), minP:+newO.minP, maxP:+newO.maxP, isDefault:false }]);
    setNewO({ name:"", desc:"", minP:"2", maxP:"2", type:"dyadic-face" });
    setAddingO(false);
  };

  const addA = () => {
    if (!newA.name.trim() || !newA.compat.length) return;
    setActions([...actions, { ...newA, id:uid(), isDefault:false }]);
    setNewA({ name:"", desc:"", compat:[] });
    setAddingA(false);
  };

  const toggleCompat = t => setNewA(p => ({
    ...p, compat: p.compat.includes(t) ? p.compat.filter(x => x !== t) : [...p.compat, t]
  }));

  const selSt = {
    background:"var(--surf2)", border:"1px solid var(--bdr)", borderRadius:10,
    color:"var(--txt)", padding:"10px 13px", fontSize:14, width:"100%", fontFamily:"var(--font)",
  };

  const customBadge = (
    <span style={{
      background:"rgba(46,245,175,.1)", color:"var(--mnt)",
      fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, letterSpacing:".06em", textTransform:"uppercase",
    }}>Custom</span>
  );

  const addBtn = (active, onClick) => (
    <button
      onClick={onClick}
      style={{
        background: active ? "var(--surf2)" : "var(--amt)", border:"none", borderRadius:8,
        padding:"6px 12px", color: active ? "var(--mut)" : "#000", fontSize:12, fontWeight:700,
        display:"flex", alignItems:"center", gap:4,
      }}
    >
      <Plus size={12} /> {active ? "Cancel" : "Add Custom"}
    </button>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      {/* Segment control */}
      <div style={{ padding:"16px 18px 0", flexShrink:0 }}>
        <div style={{ display:"flex", background:"var(--surf)", borderRadius:10, padding:3, border:"1px solid var(--bdr)", gap:3 }}>
          {["orientations","actions"].map(s => (
            <button
              key={s} onClick={() => setSection(s)}
              style={{
                flex:1, padding:"8px 0", borderRadius:8, border:"none",
                background: section === s ? "var(--surf2)" : "none",
                color: section === s ? "var(--txt)" : "var(--mut)",
                fontWeight: section === s ? 700 : 500, fontSize:14, transition:"all .15s",
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll" style={{ flex:1, padding:"16px 18px 24px" }}>

        {/* ── ORIENTATIONS ── */}
        {section === "orientations" && (<>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", color:"var(--mut)", textTransform:"uppercase" }}>
              {orientations.length} Orientations
            </div>
            {addBtn(addingO, () => setAddingO(!addingO))}
          </div>

          {addingO && (
            <div style={{ background:"var(--surf)", border:"1px solid var(--bdr)", borderRadius:"var(--r)", padding:16, marginBottom:14, display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--amt)", letterSpacing:".08em", textTransform:"uppercase" }}>New Orientation</div>
              <input value={newO.name} onChange={e=>setNewO({...newO,name:e.target.value})} placeholder="Name" />
              <input value={newO.desc} onChange={e=>setNewO({...newO,desc:e.target.value})} placeholder="Description (optional)" />
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"var(--mut)", marginBottom:4 }}>Min players</div>
                  <select style={selSt} value={newO.minP} onChange={e=>setNewO({...newO,minP:e.target.value})}>
                    {[2,3,4,5].map(n=><option key={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"var(--mut)", marginBottom:4 }}>Max players</div>
                  <select style={selSt} value={newO.maxP} onChange={e=>setNewO({...newO,maxP:e.target.value})}>
                    {[2,3,4,5].map(n=><option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={{ fontSize:11, color:"var(--mut)", marginBottom:4 }}>Type — links this orientation to compatible actions</div>
                <select style={selSt} value={newO.type} onChange={e=>setNewO({...newO,type:e.target.value})}>
                  {Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <button
                onClick={addO}
                style={{ background:"var(--amt)", border:"none", borderRadius:10, padding:12, color:"#000", fontWeight:800, fontSize:14 }}
              >Add Orientation</button>
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {orientations.map(o => (
              <div key={o.id} style={{
                background:"var(--surf)", border:"1px solid var(--bdr)", borderRadius:"var(--r)",
                padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                opacity: playerCount >= o.minP && playerCount <= o.maxP ? 1 : 0.33,
                transition:"opacity .2s",
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>{o.name}</span>
                    {!o.isDefault && customBadge}
                  </div>
                  <div style={{ fontSize:12, color:"var(--mut)" }}>
                    {o.minP === o.maxP ? o.minP : `${o.minP}–${o.maxP}`} players · {TYPES[o.type] || o.type}
                  </div>
                  {o.desc && <div style={{ fontSize:12, color:"var(--mut)", marginTop:3, fontStyle:"italic" }}>{o.desc}</div>}
                </div>
                {!o.isDefault && (
                  <button
                    onClick={() => setOrientations(all => all.filter(x => x.id !== o.id))}
                    style={{ color:"var(--mut)", padding:4, marginLeft:8, flexShrink:0, display:"flex", alignItems:"center" }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>)}

        {/* ── ACTIONS ── */}
        {section === "actions" && (<>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", color:"var(--mut)", textTransform:"uppercase" }}>
              {actions.length} Actions
            </div>
            {addBtn(addingA, () => setAddingA(!addingA))}
          </div>

          {addingA && (
            <div style={{ background:"var(--surf)", border:"1px solid var(--bdr)", borderRadius:"var(--r)", padding:16, marginBottom:14, display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--amt)", letterSpacing:".08em", textTransform:"uppercase" }}>New Action</div>
              <input value={newA.name} onChange={e=>setNewA({...newA,name:e.target.value})} placeholder="Name" />
              <input value={newA.desc} onChange={e=>setNewA({...newA,desc:e.target.value})} placeholder="Description (optional)" />
              <div>
                <div style={{ fontSize:11, color:"var(--mut)", marginBottom:8 }}>Works with these orientation types — select all that apply</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {Object.entries(TYPES).map(([k,v]) => (
                    <button
                      key={k} onClick={() => toggleCompat(k)}
                      style={{
                        background: newA.compat.includes(k) ? "rgba(46,245,175,.12)" : "var(--surf2)",
                        border: `1px solid ${newA.compat.includes(k) ? "var(--mnt)" : "var(--bdr)"}`,
                        borderRadius:7, padding:"5px 10px",
                        color: newA.compat.includes(k) ? "var(--mnt)" : "var(--mut)",
                        fontSize:12, fontWeight:600, transition:"all .15s",
                      }}
                    >{v}</button>
                  ))}
                </div>
              </div>
              <button
                onClick={addA}
                style={{ background:"var(--amt)", border:"none", borderRadius:10, padding:12, color:"#000", fontWeight:800, fontSize:14 }}
              >Add Action</button>
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {actions.map(a => (
              <div key={a.id} style={{
                background:"var(--surf)", border:"1px solid var(--bdr)", borderRadius:"var(--r)",
                padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"flex-start",
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>{a.name}</span>
                    {!a.isDefault && customBadge}
                  </div>
                  <div style={{ fontSize:11, color:"var(--mut)", marginTop:1 }}>
                    {a.compat.map(t => TYPES[t] || t).join(" · ")}
                  </div>
                  {a.desc && <div style={{ fontSize:12, color:"var(--mut)", marginTop:3, fontStyle:"italic" }}>{a.desc}</div>}
                </div>
                {!a.isDefault && (
                  <button
                    onClick={() => setActions(all => all.filter(x => x.id !== a.id))}
                    style={{ color:"var(--mut)", padding:4, marginLeft:8, flexShrink:0, display:"flex", alignItems:"center" }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// BOTTOM NAVIGATION
// ─────────────────────────────────────────────────────────────────

function BottomNav({ tab, setTab }) {
  const items = [
    { id:"play",    label:"Play",    Icon:Zap },
    { id:"players", label:"Players", Icon:Users },
    { id:"setup",   label:"Setup",   Icon:Settings },
  ];
  return (
    <nav style={{
      display:"flex", borderTop:"1px solid var(--bdr)",
      background:"rgba(12,12,17,.96)", backdropFilter:"blur(12px)",
      flexShrink:0,
    }}>
      {items.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id} onClick={() => setTab(id)}
            style={{
              flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              padding:"10px 0 13px", background:"none",
              color: active ? "var(--amt)" : "var(--mut)",
              transition:"color .15s",
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
            <span style={{ fontSize:10, fontWeight: active ? 700 : 400, letterSpacing:".05em" }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab,          setTab]          = useState("play");
  const [players,      setPlayers]      = useState(["", ""]);
  const [groups,       setGroups]       = useState([]);
  const [orientations, setOrientations] = useState(ORIENTATIONS0);
  const [actions,      setActions]      = useState(ACTIONS0);
  const [ready,        setReady]        = useState(false);

  // Inject global CSS + Google Font
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => { try { document.head.removeChild(el); } catch(e) {} };
  }, []);

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("scene:state");
        if (res?.value) {
          const d = JSON.parse(res.value);
          if (Array.isArray(d.players) && d.players.length >= 2) setPlayers(d.players);
          if (Array.isArray(d.groups))       setGroups(d.groups);
          if (Array.isArray(d.customO) && d.customO.length) setOrientations([...ORIENTATIONS0, ...d.customO]);
          if (Array.isArray(d.customA) && d.customA.length) setActions([...ACTIONS0, ...d.customA]);
        }
      } catch(e) { /* first run — no saved state yet */ }
      setReady(true);
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        await window.storage.set("scene:state", JSON.stringify({
          players,
          groups,
          customO: orientations.filter(o => !o.isDefault),
          customA: actions.filter(a => !a.isDefault),
        }));
      } catch(e) {}
    })();
  }, [players, groups, orientations, actions, ready]);

  // Outer shell: provides the dark background and constrains to phone width
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", justifyContent:"center" }}>
      <div style={{
        width:"100%", maxWidth:430,
        display:"flex", flexDirection:"column",
        minHeight:"100vh",
        borderLeft:"1px solid var(--bdr)", borderRight:"1px solid var(--bdr)",
      }}>
        {/* Header */}
        <header style={{
          padding:"17px 18px 13px",
          borderBottom:"1px solid var(--bdr)",
          display:"flex", alignItems:"center", gap:10,
          flexShrink:0,
        }}>
          <div style={{ fontSize:22, fontWeight:800, letterSpacing:"-.02em", lineHeight:1 }}>
            SCENE<span style={{ color:"var(--amt)" }}>.</span>
          </div>
          <div style={{ fontSize:10, color:"var(--mut)", fontWeight:600, letterSpacing:".12em", textTransform:"uppercase" }}>
            Improv Engine
          </div>
          <div style={{
            marginLeft:"auto", background:"var(--surf2)", border:"1px solid var(--bdr)",
            borderRadius:100, padding:"3px 11px", fontSize:12, fontWeight:700,
            color: players.length >= 2 ? "var(--amt)" : "var(--mut)",
          }}>
            {players.length}P
          </div>
        </header>

        {/* Tab content */}
        {!ready
          ? <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--mut)", fontSize:14 }}>
              Loading…
            </div>
          : <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
              {tab === "play"    && <PlayTab players={players} orientations={orientations} actions={actions} />}
              {tab === "players" && <PlayersTab players={players} setPlayers={setPlayers} groups={groups} setGroups={setGroups} />}
              {tab === "setup"   && <SetupTab orientations={orientations} setOrientations={setOrientations} actions={actions} setActions={setActions} playerCount={players.length} />}
            </div>
        }

        <BottomNav tab={tab} setTab={setTab} />
      </div>
    </div>
  );
}
