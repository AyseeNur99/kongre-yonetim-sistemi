import React, { useState, useEffect, useCallback } from "react";
import { FileText, LogOut, Upload, Users, Building2, CheckCircle2, XCircle, Clock, Plus, ChevronRight } from "lucide-react";

const API = "http://localhost:5000/api";
const FILES_BASE = "http://localhost:5000/uploads";

// ---------- Tasarım tokenları ----------
const C = {
  paper: "#F5F6F3",
  surface: "#FFFFFF",
  ink: "#16241F",
  inkSoft: "#4B5A54",
  primary: "#1F5F52",
  primaryDark: "#153F37",
  accent: "#B8722C",
  success: "#2F7A4D",
  danger: "#A23B2E",
  line: "#E1E4DF",
};

const serif = { fontFamily: "'Source Serif 4', Georgia, 'Times New Roman', serif" };

// ---------- Küçük yardımcı bileşenler ----------
function StatusBadge({ status }) {
  const map = {
    pending: { label: "Bekliyor", bg: "#F1E7D8", fg: C.accent, Icon: Clock },
    accepted: { label: "Kabul Edildi", bg: "#E3EFE6", fg: C.success, Icon: CheckCircle2 },
    rejected: { label: "Reddedildi", bg: "#F3E4E1", fg: C.danger, Icon: XCircle },
  };
  const m = map[status] || map.pending;
  const I = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: m.bg, color: m.fg }}
    >
      <I size={13} strokeWidth={2.5} />
      {m.label}
    </span>
  );
}

// Bu bileşen, projenin çekirdek mekaniğini (10 hakemin oyu) görselleştiren imza öğesi
function VoteMeter({ approved = 0, rejected = 0, total = 0 }) {
  const pending = Math.max(total - approved - rejected, 0);
  const seg = (n) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex h-2 flex-1 overflow-hidden rounded-full" style={{ background: C.line }}>
        <div style={{ width: `${seg(approved)}%`, background: C.success }} />
        <div style={{ width: `${seg(rejected)}%`, background: C.danger }} />
      </div>
      <span className="text-xs whitespace-nowrap" style={{ color: C.inkSoft }}>
        {approved + rejected}/{total} oy
      </span>
    </div>
  );
}

function Button({ children, variant = "primary", ...props }) {
  const styles = {
    primary: { background: C.primary, color: "#fff" },
    accent: { background: C.accent, color: "#fff" },
    success: { background: C.success, color: "#fff" },
    danger: { background: C.danger, color: "#fff" },
    ghost: { background: "transparent", color: C.primary, border: `1px solid ${C.line}` },
  };
  return (
    <button
      {...props}
      style={styles[variant]}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 ${props.className || ""}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1.5" style={{ color: C.inkSoft }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  border: `1px solid ${C.line}`,
  color: C.ink,
};
const inputClass = "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2";

// ---------- Kimlik Doğrulama Ekranı ----------
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", institution: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login" ? { email: form.email, password: form.password } : form;
      const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bir hata oluştu.");

      if (mode === "register") {
        setMode("login");
        setError("");
        setForm({ ...form, password: "" });
      } else {
        onAuth(data.token, data.user);
      }
    } catch (err) {
      setError(err.message || "Sunucuya bağlanılamadı. Backend'in çalıştığından emin ol.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.paper }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4"
            style={{ background: C.primary }}
          >
            <FileText color="#fff" size={22} />
          </div>
          <h1 style={serif} className="text-3xl font-semibold" >
            Kongre Bildiri Sistemi
          </h1>
          <p className="text-sm mt-2" style={{ color: C.inkSoft }}>
            Sağlık kongreleri için bildiri gönderme ve hakem değerlendirme platformu
          </p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <div className="flex mb-6 rounded-lg overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2 text-sm font-semibold transition-colors"
                style={{
                  background: mode === m ? C.primary : "transparent",
                  color: mode === m ? "#fff" : C.inkSoft,
                }}
              >
                {m === "login" ? "Giriş Yap" : "Kayıt Ol"}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === "register" && (
              <Field label="Ad Soyad">
                <input
                  required
                  className={inputClass}
                  style={inputStyle}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </Field>
            )}
            <Field label="E-posta">
              <input
                required
                type="email"
                className={inputClass}
                style={inputStyle}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Şifre">
              <input
                required
                type="password"
                className={inputClass}
                style={inputStyle}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
            {mode === "register" && (
              <Field label="Kurum (isteğe bağlı)">
                <input
                  className={inputClass}
                  style={inputStyle}
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                />
              </Field>
            )}

            {error && (
              <p className="text-sm mb-4 rounded-lg px-3 py-2" style={{ background: "#F3E4E1", color: C.danger }}>
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "İşleniyor..." : mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---------- Ana Panel ----------
function Dashboard({ token, user, onLogout }) {
  const [tab, setTab] = useState(user.role === "reviewer" ? "assigned" : "congresses");
  const [congresses, setCongresses] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [notice, setNotice] = useState("");

  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadAll = useCallback(async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        fetch(`${API}/congresses`, { headers: authHeaders }),
        fetch(`${API}/submissions/mine`, { headers: authHeaders }),
      ]);
      setCongresses(await cRes.json());
      setMySubmissions(await sRes.json());
      if (user.role === "reviewer" || user.role === "admin") {
        const aRes = await fetch(`${API}/submissions/assigned`, { headers: authHeaders });
        if (aRes.ok) setAssigned(await aRes.json());
      }
    } catch (e) {
      setNotice("Backend'e bağlanılamadı. localhost:5000 çalışıyor mu kontrol et.");
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const tabs = [
    { id: "congresses", label: "Kongreler", icon: Building2 },
    { id: "mine", label: "Bildirilerim", icon: FileText },
    { id: "submit", label: "Yeni Bildiri", icon: Upload },
  ];
  if (user.role === "reviewer" || user.role === "admin") {
    tabs.push({ id: "assigned", label: "Değerlendirmelerim", icon: Users });
  }
  if (user.role === "admin") {
    tabs.push({ id: "admin", label: "Yönetim", icon: Plus });
  }

  return (
    <div className="min-h-screen" style={{ background: C.paper }}>
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: C.primary }}>
            <FileText color="#fff" size={16} />
          </div>
          <span style={serif} className="font-semibold text-lg">Kongre Bildiri Sistemi</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold">{user.full_name}</div>
            <div className="text-xs capitalize" style={{ color: C.inkSoft }}>
              {{ author: "Yazar", reviewer: "Hakem", admin: "Yönetici" }[user.role]}
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg" style={{ border: `1px solid ${C.line}` }}>
            <LogOut size={16} color={C.inkSoft} />
          </button>
        </div>
      </header>

      <nav className="flex gap-1 px-6 pt-4 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-semibold whitespace-nowrap"
              style={{
                background: active ? C.surface : "transparent",
                color: active ? C.primary : C.inkSoft,
                border: active ? `1px solid ${C.line}` : "1px solid transparent",
                borderBottom: active ? `1px solid ${C.surface}` : "1px solid transparent",
                marginBottom: -1,
              }}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </nav>

      <main className="p-6 max-w-4xl mx-auto" style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, marginTop: 0 }}>
        {notice && (
          <p className="text-sm mb-4 rounded-lg px-3 py-2" style={{ background: "#F3E4E1", color: C.danger }}>
            {notice}
          </p>
        )}

        {tab === "congresses" && <CongressList congresses={congresses} />}
        {tab === "mine" && <MySubmissions items={mySubmissions} />}
        {tab === "submit" && (
          <SubmitForm token={token} congresses={congresses} onDone={() => { loadAll(); setTab("mine"); }} />
        )}
        {tab === "assigned" && (
          <AssignedReviews token={token} items={assigned} onReviewed={loadAll} />
        )}
        {tab === "admin" && <AdminPanel token={token} onCreated={loadAll} />}
      </main>
    </div>
  );
}

function CongressList({ congresses }) {
  if (congresses.length === 0)
    return <Empty text="Henüz bir kongre oluşturulmamış. Admin panelinden ekleyebilirsin." />;
  return (
    <div className="space-y-4">
      <h2 style={serif} className="text-xl font-semibold mb-2">Kongreler</h2>
      {congresses.map((c) => (
        <div key={c.id} className="rounded-xl p-5" style={{ border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between">
            <div className="font-semibold">{c.title}</div>
            <span className="text-xs" style={{ color: C.inkSoft }}>ID: {c.id}</span>
          </div>
          <p className="text-sm mt-1" style={{ color: C.inkSoft }}>{c.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {c.themes.map((t) => (
              <span
                key={t.id}
                className="text-xs rounded-full px-3 py-1"
                style={{ background: C.paper, color: C.primaryDark, border: `1px solid ${C.line}` }}
              >
                {t.name}
              </span>
            ))}
            {c.themes.length === 0 && (
              <span className="text-xs" style={{ color: C.inkSoft }}>Henüz tema eklenmemiş</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MySubmissions({ items }) {
  if (items.length === 0) return <Empty text="Henüz bildiri göndermedin. 'Yeni Bildiri' sekmesinden başlayabilirsin." />;
  return (
    <div className="space-y-3">
      <h2 style={serif} className="text-xl font-semibold mb-2">Bildirilerim</h2>
      {items.map((s) => (
        <div key={s.id} className="rounded-xl p-5 flex items-center justify-between gap-4" style={{ border: `1px solid ${C.line}` }}>
          <div>
            <div className="font-semibold">{s.title}</div>
            <div className="text-xs mt-1" style={{ color: C.inkSoft }}>
              {s.congress_title} · {s.theme_name}
            </div>
            <FileLink fileName={s.file_name} />
          </div>
          <StatusBadge status={s.status} />
        </div>
      ))}
    </div>
  );
}

function SubmitForm({ token, congresses, onDone }) {
  const [themeId, setThemeId] = useState("");
  const [title, setTitle] = useState("");
  const [abstractText, setAbstractText] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allThemes = congresses.flatMap((c) => c.themes.map((t) => ({ ...t, congressTitle: c.title })));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!file) return setError("Lütfen bir dosya (PDF/Word) seç.");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("theme_id", themeId);
      fd.append("title", title);
      fd.append("abstract", abstractText);
      fd.append("file", file);
      const res = await fetch(`${API}/submissions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yükleme başarısız.");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={serif} className="text-xl font-semibold mb-4">Yeni Bildiri Gönder</h2>
      <form onSubmit={submit} className="max-w-lg">
        <Field label="Tema">
          <select required className={inputClass} style={inputStyle} value={themeId} onChange={(e) => setThemeId(e.target.value)}>
            <option value="">Seç...</option>
            {allThemes.map((t) => (
              <option key={t.id} value={t.id}>{t.congressTitle} — {t.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Başlık">
          <input required className={inputClass} style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Özet">
          <textarea required rows={4} className={inputClass} style={inputStyle} value={abstractText} onChange={(e) => setAbstractText(e.target.value)} />
        </Field>
        <Field label="Dosya (PDF/Word)">
          <input required type="file" accept=".pdf,.doc,.docx" className="text-sm" onChange={(e) => setFile(e.target.files[0])} />
        </Field>
        {error && (
          <p className="text-sm mb-4 rounded-lg px-3 py-2" style={{ background: "#F3E4E1", color: C.danger }}>{error}</p>
        )}
        <Button type="submit" disabled={loading}>{loading ? "Gönderiliyor..." : "Bildiriyi Gönder"}</Button>
      </form>
    </div>
  );
}

function AssignedReviews({ token, items, onReviewed }) {
  const [busyId, setBusyId] = useState(null);
  const [comment, setComment] = useState({});

  const vote = async (submission_id, decision) => {
    setBusyId(submission_id);
    try {
      await fetch(`${API}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ submission_id, decision, comment: comment[submission_id] || "" }),
      });
      onReviewed();
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) return <Empty text="Henüz sana atanmış bir bildiri yok." />;

  return (
    <div className="space-y-4">
      <h2 style={serif} className="text-xl font-semibold mb-2">Değerlendirmelerim</h2>
      {items.map((s) => (
        <div key={s.id} className="rounded-xl p-5" style={{ border: `1px solid ${C.line}` }}>
          <div className="flex items-center justify-between">
            <div className="font-semibold">{s.title}</div>
            <StatusBadge status={s.status} />
          </div>
          <div className="text-xs mt-1" style={{ color: C.inkSoft }}>Yazar: {s.author_name}</div>
          <FileLink fileName={s.file_name} />

          {s.already_reviewed ? (
            <p className="text-sm mt-3" style={{ color: C.inkSoft }}>Bu bildiriye oyunuzu zaten verdiniz.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2 max-w-md">
              <input
                placeholder="Yorum (isteğe bağlı)"
                className={inputClass}
                style={inputStyle}
                value={comment[s.id] || ""}
                onChange={(e) => setComment({ ...comment, [s.id]: e.target.value })}
              />
              <div className="flex gap-2">
                <Button variant="success" disabled={busyId === s.id} onClick={() => vote(s.id, "approved")}>
                  <span className="inline-flex items-center gap-1"><CheckCircle2 size={14}/> Onayla</span>
                </Button>
                <Button variant="danger" disabled={busyId === s.id} onClick={() => vote(s.id, "rejected")}>
                  <span className="inline-flex items-center gap-1"><XCircle size={14}/> Reddet</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AdminPanel({ token, onCreated }) {
  const [congress, setCongress] = useState({ title: "", description: "", start_date: "", end_date: "", submission_deadline: "" });
  const [theme, setTheme] = useState({ congress_id: "", name: "", description: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [submissions, setSubmissions] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [picks, setPicks] = useState({}); // { [submissionId]: reviewerIdSeçili }

  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadAssignmentData = useCallback(async () => {
    try {
      const [sRes, rRes] = await Promise.all([
        fetch(`${API}/submissions/all`, { headers: authHeaders }),
        fetch(`${API}/users/reviewers`, { headers: authHeaders }),
      ]);
      setSubmissions(await sRes.json());
      setReviewers(await rRes.json());
    } catch (e) {
      setErr("Hakem atama verileri yüklenemedi.");
    }
  }, [token]);

  useEffect(() => {
    loadAssignmentData();
  }, [loadAssignmentData]);

  const assign = async (submissionId) => {
    const reviewerId = picks[submissionId];
    if (!reviewerId) return;
    setErr("");
    try {
      const res = await fetch(`${API}/submissions/${submissionId}/reviewers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ reviewer_id: reviewerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Atama başarısız.");
      loadAssignmentData();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const unassign = async (submissionId, reviewerId) => {
    setErr("");
    try {
      const res = await fetch(`${API}/submissions/${submissionId}/reviewers/${reviewerId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kaldırma başarısız.");
      loadAssignmentData();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const createCongress = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const res = await fetch(`${API}/congresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(congress),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Sunucu hatası (${res.status})`);
      setMsg(`Kongre oluşturuldu (id: ${data.id}).`);
      setCongress({ title: "", description: "", start_date: "", end_date: "", submission_deadline: "" });
      onCreated();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const createTheme = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const res = await fetch(`${API}/congresses/${theme.congress_id}/themes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: theme.name, description: theme.description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Sunucu hatası (${res.status})`);
      setMsg("Tema eklendi.");
      setTheme({ congress_id: "", name: "", description: "" });
      onCreated();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 style={serif} className="text-lg font-semibold mb-3">Yeni Kongre</h2>
        <form onSubmit={createCongress}>
          <Field label="Başlık">
            <input required className={inputClass} style={inputStyle} value={congress.title} onChange={(e) => setCongress({ ...congress, title: e.target.value })} />
          </Field>
          <Field label="Açıklama">
            <input className={inputClass} style={inputStyle} value={congress.description} onChange={(e) => setCongress({ ...congress, description: e.target.value })} />
          </Field>
          <Field label="Başlangıç Tarihi">
            <input type="date" className={inputClass} style={inputStyle} value={congress.start_date} onChange={(e) => setCongress({ ...congress, start_date: e.target.value })} />
          </Field>
          <Button type="submit" variant="accent">Kongre Oluştur</Button>
        </form>
      </div>
      <div>
        <h2 style={serif} className="text-lg font-semibold mb-3">Yeni Tema</h2>
        <form onSubmit={createTheme}>
          <Field label="Kongre ID">
            <input required type="number" className={inputClass} style={inputStyle} value={theme.congress_id} onChange={(e) => setTheme({ ...theme, congress_id: e.target.value })} />
          </Field>
          <Field label="Tema Adı">
            <input required className={inputClass} style={inputStyle} value={theme.name} onChange={(e) => setTheme({ ...theme, name: e.target.value })} />
          </Field>
          <Field label="Açıklama">
            <input className={inputClass} style={inputStyle} value={theme.description} onChange={(e) => setTheme({ ...theme, description: e.target.value })} />
          </Field>
          <Button type="submit" variant="accent">Tema Ekle</Button>
        </form>
      </div>
      {msg && <p className="text-sm md:col-span-2" style={{ color: C.success }}>{msg}</p>}
      {err && (
        <p className="text-sm md:col-span-2 rounded-lg px-3 py-2" style={{ background: "#F3E4E1", color: C.danger }}>
          {err}
        </p>
      )}

      <div className="md:col-span-2 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <h2 style={serif} className="text-lg font-semibold mb-3 mt-4">Hakem Atama</h2>
        {submissions.length === 0 ? (
          <p className="text-sm" style={{ color: C.inkSoft }}>Henüz bir bildiri yok.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((s) => {
              const assignedIds = s.reviewers.map((r) => r.reviewer_id);
              const available = reviewers.filter((r) => !assignedIds.includes(r.id));
              return (
                <div key={s.id} className="rounded-xl p-4" style={{ border: `1px solid ${C.line}` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{s.title}</div>
                      <div className="text-xs" style={{ color: C.inkSoft }}>
                        {s.author_name} · {s.congress_title} — {s.theme_name}
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {s.reviewers.length === 0 && (
                      <span className="text-xs" style={{ color: C.inkSoft }}>Henüz hakem atanmamış.</span>
                    )}
                    {s.reviewers.map((r) => (
                      <span
                        key={r.reviewer_id}
                        className="inline-flex items-center gap-2 rounded-full pl-3 pr-1.5 py-1 text-xs"
                        style={{ background: C.paper, border: `1px solid ${C.line}` }}
                      >
                        {r.reviewer_name}
                        {r.decision && (
                          <span style={{ color: r.decision === "approved" ? C.success : C.danger }}>
                            ({r.decision === "approved" ? "onay" : "red"})
                          </span>
                        )}
                        {!r.decision && (
                          <button
                            onClick={() => unassign(s.id, r.reviewer_id)}
                            title="Atamayı kaldır"
                            className="rounded-full h-4 w-4 flex items-center justify-center"
                            style={{ background: C.danger, color: "#fff" }}
                          >
                            <XCircle size={11} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  {available.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      <select
                        className={inputClass}
                        style={{ ...inputStyle, maxWidth: 240 }}
                        value={picks[s.id] || ""}
                        onChange={(e) => setPicks({ ...picks, [s.id]: e.target.value })}
                      >
                        <option value="">Hakem seç...</option>
                        {available.map((r) => (
                          <option key={r.id} value={r.id}>{r.full_name}</option>
                        ))}
                      </select>
                      <Button variant="ghost" onClick={() => assign(s.id)} disabled={!picks[s.id]}>
                        Ata
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FileLink({ fileName }) {
  if (!fileName) return null;
  return (
    <a
      href={`${FILES_BASE}/${fileName}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-semibold mt-2"
      style={{ color: C.primary }}
    >
      <FileText size={13} /> Dosyayı Görüntüle
    </a>
  );
}

function Empty({ text }) {
  return (
    <div className="text-center py-16">
      <ChevronRight className="mx-auto mb-2" color={C.inkSoft} />
      <p className="text-sm" style={{ color: C.inkSoft }}>{text}</p>
    </div>
  );
}

// ---------- Kök bileşen ----------
export default function App() {
  const [session, setSession] = useState(null); // { token, user }

  if (!session) {
    return <AuthScreen onAuth={(token, user) => setSession({ token, user })} />;
  }

  return <Dashboard token={session.token} user={session.user} onLogout={() => setSession(null)} />;
}
