import React, { useEffect, useState } from "react";
import api, { errMsg } from "../api";

const DEFAULT_HTML = "<h1>Salom, dunyo!</h1>\n<p>Bu yerda HTML yozing.</p>";
const DEFAULT_CSS = "body {\n  font-family: sans-serif;\n  color: #222;\n  padding: 20px;\n}\nh1 {\n  color: #22c55e;\n}";
const DEFAULT_JS = "console.log('Salom, JS!');";
const DEFAULT_PY = "print('Salom, Python!')\nfor i in range(3):\n    print(i)";
const DEFAULT_SQL = "CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);\nINSERT INTO students (name, age) VALUES ('Ali', 20);\nSELECT * FROM students;";

export default function CodePlayground() {
  const [mode, setMode] = useState("web"); // 'web' | 'python' | 'sql'
  const [activeFile, setActiveFile] = useState("html");
  const [expanded, setExpanded] = useState(false);

  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  const [srcDoc, setSrcDoc] = useState("");

  const [pyCode, setPyCode] = useState(DEFAULT_PY);
  const [pyOutput, setPyOutput] = useState("");
  const [pyError, setPyError] = useState("");
  const [running, setRunning] = useState(false);

  const [sqlCode, setSqlCode] = useState(DEFAULT_SQL);
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlError, setSqlError] = useState("");
  const [sqlRunning, setSqlRunning] = useState(false);
  const [tables, setTables] = useState([]);

  const [snippets, setSnippets] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function loadSnippets() {
    api.get("/snippets").then((res) => setSnippets(res.data));
  }
  function loadTables() {
    api.get("/sql-tables").then((res) => setTables(res.data)).catch(() => {});
  }

  useEffect(() => {
    loadSnippets();
    loadTables();
  }, []);

  function runWeb() {
    setSrcDoc(`<html><head><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`);
  }

  useEffect(() => {
    const t = setTimeout(runWeb, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, css, js]);

  async function runPython() {
    setRunning(true);
    setPyOutput("");
    setPyError("");
    try {
      const res = await api.post("/run-python", { code: pyCode });
      setPyOutput(res.data.output);
      setPyError(res.data.error);
    } catch (err) {
      setPyError(errMsg(err, "Ishga tushirishda xatolik"));
    } finally {
      setRunning(false);
    }
  }

  async function runSql() {
    setSqlRunning(true);
    setSqlResult(null);
    setSqlError("");
    try {
      const res = await api.post("/run-sql", { sql: sqlCode });
      setSqlResult(res.data);
      loadTables();
    } catch (err) {
      setSqlError(errMsg(err, "So'rovni bajarishda xatolik"));
    } finally {
      setSqlRunning(false);
    }
  }

  async function resetSql() {
    if (!confirm("Ma'lumotlar bazangizni butunlay tozalamoqchimisiz? Bu amalni qaytarib bo'lmaydi.")) return;
    await api.post("/sql-reset");
    setSqlResult(null);
    loadTables();
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/snippets", {
        title: saveTitle || "Nomsiz kod",
        language: mode,
        html, css, js,
        python_code: pyCode,
      });
      setSaveModalOpen(false);
      setSaveTitle("");
      loadSnippets();
    } catch (err) {
      alert(errMsg(err, "Saqlashda xatolik"));
    } finally {
      setSaving(false);
    }
  }

  function handleLoad(snippet) {
    setMode(snippet.language === "python" ? "python" : "web");
    setHtml(snippet.html || DEFAULT_HTML);
    setCss(snippet.css || DEFAULT_CSS);
    setJs(snippet.js || DEFAULT_JS);
    setPyCode(snippet.python_code || DEFAULT_PY);
    setShowSaved(false);
  }

  async function handleDelete(id) {
    if (!confirm("Bu kodni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/snippets/${id}`);
      loadSnippets();
    } catch {
      alert("O'chirishda xatolik");
    }
  }

  return (
    <div className="container section">
      <div className="section-head">
        <div>
          <h2>Kod muharriri</h2>
          <p>HTML/CSS/JS, Python yoki SQL yozing va to'g'ridan-to'g'ri natijasini ko'ring.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setShowSaved(true)}>
            📁 Saqlanganlar {snippets.length > 0 && `(${snippets.length})`}
          </button>
        </div>
      </div>

      <div className="playground-tabs">
        <button className={mode === "web" ? "active" : ""} onClick={() => setMode("web")}>
          🌐 HTML / CSS / JS
        </button>
        <button className={mode === "python" ? "active" : ""} onClick={() => setMode("python")}>
          🐍 Python
        </button>
        <button className={mode === "sql" ? "active" : ""} onClick={() => setMode("sql")}>
          🗄️ Ma'lumotlar bazasi (SQL)
        </button>
      </div>

      {mode === "web" && (
        <div className={`code-editor-shell ${expanded ? "expanded" : ""}`}>
          <div className="code-editor-pane">
            <div className="file-tabs">
              <button className={activeFile === "html" ? "active" : ""} onClick={() => setActiveFile("html")}>
                <span className="dot dot-html" /> index.html
              </button>
              <button className={activeFile === "css" ? "active" : ""} onClick={() => setActiveFile("css")}>
                <span className="dot dot-css" /> style.css
              </button>
              <button className={activeFile === "js" ? "active" : ""} onClick={() => setActiveFile("js")}>
                <span className="dot dot-js" /> script.js
              </button>
              <button className="expand-btn" onClick={() => setExpanded((v) => !v)} title="Kattalashtirish">
                {expanded ? "⤡ Kichraytirish" : "⤢ Kattalashtirish"}
              </button>
            </div>

            {activeFile === "html" && (
              <textarea className="code-textarea code-textarea-full" value={html} onChange={(e) => setHtml(e.target.value)} spellCheck={false} />
            )}
            {activeFile === "css" && (
              <textarea className="code-textarea code-textarea-full" value={css} onChange={(e) => setCss(e.target.value)} spellCheck={false} />
            )}
            {activeFile === "js" && (
              <textarea className="code-textarea code-textarea-full" value={js} onChange={(e) => setJs(e.target.value)} spellCheck={false} />
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="btn btn-primary" onClick={runWeb}>
                ▶️ Ishga tushirish
              </button>
              <button className="btn btn-outline" onClick={() => setSaveModalOpen(true)}>
                💾 Saqlash
              </button>
            </div>
          </div>

          <div className="code-preview-pane">
            <div className="preview-bar">🌐 Natija</div>
            <iframe title="preview" srcDoc={srcDoc} className="preview-frame" />
          </div>
        </div>
      )}

      {mode === "python" && (
        <div className={expanded ? "expanded-single" : ""}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: "0.82rem", color: "var(--ink-dim)" }}>Python kod</label>
            <button className="expand-btn" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "⤡ Kichraytirish" : "⤢ Kattalashtirish"}
            </button>
          </div>
          <textarea className="code-textarea code-textarea-xl" value={pyCode} onChange={(e) => setPyCode(e.target.value)} spellCheck={false} />

          <div style={{ display: "flex", gap: 10, margin: "14px 0" }}>
            <button className="btn btn-primary" onClick={runPython} disabled={running}>
              {running ? "Ishlamoqda..." : "▶️ Ishga tushirish"}
            </button>
            <button className="btn btn-outline" onClick={() => setSaveModalOpen(true)}>
              💾 Saqlash
            </button>
          </div>

          <label style={{ display: "block", marginBottom: 6, fontSize: "0.82rem", color: "var(--ink-dim)" }}>Natija</label>
          <div className="code-output code-output-xl">
            {pyOutput}
            {pyError && <span style={{ color: "var(--danger)" }}>{pyError}</span>}
            {!pyOutput && !pyError && "Natija shu yerda chiqadi..."}
          </div>
        </div>
      )}

      {mode === "sql" && (
        <div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ flex: 2, minWidth: 280 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: "0.82rem", color: "var(--ink-dim)" }}>SQL so'rovi</label>
                <button className="expand-btn" onClick={() => setExpanded((v) => !v)}>
                  {expanded ? "⤡ Kichraytirish" : "⤢ Kattalashtirish"}
                </button>
              </div>
              <textarea
                className={`code-textarea ${expanded ? "code-textarea-xl" : "code-textarea-full"}`}
                value={sqlCode}
                onChange={(e) => setSqlCode(e.target.value)}
                spellCheck={false}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button className="btn btn-primary" onClick={runSql} disabled={sqlRunning}>
                  {sqlRunning ? "Ishlamoqda..." : "▶️ Ishga tushirish"}
                </button>
                <button className="btn btn-danger" onClick={resetSql}>
                  🗑️ Bazani tozalash
                </button>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.82rem", color: "var(--ink-dim)" }}>
                Jadvallar
              </label>
              <div className="admin-panel" style={{ padding: 14 }}>
                {tables.length === 0 ? (
                  <p style={{ color: "var(--ink-dim)", fontSize: "0.85rem", margin: 0 }}>Hali jadval yo'q.</p>
                ) : (
                  tables.map((t) => (
                    <div key={t} style={{ fontFamily: "monospace", fontSize: "0.85rem", padding: "4px 0" }}>
                      🗂️ {t}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <label style={{ display: "block", marginBottom: 6, fontSize: "0.82rem", color: "var(--ink-dim)" }}>Natija</label>
          {sqlError ? (
            <div className="code-output" style={{ color: "var(--danger)" }}>{sqlError}</div>
          ) : sqlResult ? (
            sqlResult.columns.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      {sqlResult.columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sqlResult.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{String(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="code-output">{sqlResult.message}</div>
            )
          ) : (
            <div className="code-output">Natija shu yerda chiqadi...</div>
          )}
        </div>
      )}

      {saveModalOpen && (
        <div className="modal-backdrop" onClick={() => setSaveModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Kodni saqlash</h3>
            <form onSubmit={handleSave}>
              <div className="field">
                <label>Nomi</label>
                <input
                  autoFocus
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Masalan: Mening birinchi loyiham"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline btn-block" onClick={() => setSaveModalOpen(false)}>
                  Chiqish
                </button>
                <button className="btn btn-primary btn-block" disabled={saving}>
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSaved && (
        <div className="modal-backdrop" onClick={() => setShowSaved(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <h3>Saqlangan kodlar</h3>
            {snippets.length === 0 ? (
              <p style={{ color: "var(--ink-dim)" }}>Hali saqlangan kod yo'q.</p>
            ) : (
              snippets.map((s) => (
                <div className="snippet-row" key={s.id}>
                  <div>
                    <b style={{ fontSize: "0.9rem" }}>{s.title}</b>
                    <div style={{ color: "var(--ink-dim)", fontSize: "0.78rem" }}>
                      {s.language === "python" ? "🐍 Python" : "🌐 Web"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => handleLoad(s)}>
                      Ochish
                    </button>
                    <button className="btn btn-danger" style={{ padding: "6px 12px", fontSize: "0.8rem" }} onClick={() => handleDelete(s.id)}>
                      O'chirish
                    </button>
                  </div>
                </div>
              ))
            )}
            <button className="btn btn-outline btn-block" style={{ marginTop: 10 }} onClick={() => setShowSaved(false)}>
              Chiqish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
