import React, { useState, useEffect, useCallback } from "react";
import { FileText, LogOut, Upload, Users, Building2, CheckCircle2, XCircle, Clock, Plus, ChevronRight, Trash2, Pencil, Save, X, User as UserIcon } from "lucide-react";

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

    if (mode === "register" && form.password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

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
    { id: "profile", label: "Profilim", icon: UserIcon },
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

        {tab === "profile" && <ProfilePage token={token} user={user} mySubmissions={mySubmissions} />}
        {tab === "congresses" && <CongressList congresses={congresses} />}
        {tab === "mine" && <MySubmissions items={mySubmissions} token={token} onChanged={loadAll} />}
        {tab === "submit" && (
          <SubmitForm token={token} congresses={congresses} onDone={() => { loadAll(); setTab("mine"); }} />
        )}
        {tab === "assigned" && (
          <AssignedReviews token={token} items={assigned} onReviewed={loadAll} />
        )}
        {tab === "admin" && <AdminPanel token={token} onCreated={loadAll} congresses={congresses} />}
      </main>
    </div>
  );
}

function ProfilePage({ token, user, mySubmissions }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: "", institution: "" });
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProfile(data);
      setForm({ full_name: data.full_name, institution: data.institution || "" });
    } catch (e) {
      setErr("Profil yüklenemedi.");
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const res = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncelleme başarısız.");
      setProfile(data);
      setEditing(false);
      setMsg("Profil güncellendi.");
    } catch (e2) {
      setErr(e2.message);
    }
  };

  // Sadece KABUL EDİLEN bildiriler burada gösterilir — bir çeşit "yayın listesi" / başarı özeti.
  // Reddedilenler ve beklemede olanlar bilinçli olarak gösterilmez, bu sayfa herkese
  // açık bir profil/portfolyo gibi düşünülüyor.
  const acceptedSubmissions = mySubmissions.filter((s) => s.status === "accepted");

  const roleLabel = { author: "Yazar", reviewer: "Hakem", admin: "Yönetici" };

  if (!profile) return <p className="text-sm" style={{ color: C.inkSoft }}>Yükleniyor...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 style={serif} className="text-xl font-semibold mb-3">Profilim</h2>
        {msg && <p className="text-sm mb-3" style={{ color: C.success }}>{msg}</p>}
        {err && (
          <p className="text-sm mb-3 rounded-lg px-3 py-2" style={{ background: "#F3E4E1", color: C.danger }}>{err}</p>
        )}

        <div className="rounded-xl p-5" style={{ border: `1px solid ${C.line}` }}>
          {editing ? (
            <form onSubmit={save} className="max-w-sm space-y-3">
              <Field label="Ad Soyad">
                <input
                  className={inputClass}
                  style={inputStyle}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </Field>
              <Field label="Kurum">
                <input
                  className={inputClass}
                  style={inputStyle}
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  placeholder="örn: Ankara Üniversitesi Tıp Fakültesi"
                />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" variant="success">Kaydet</Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Vazgeç</Button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-lg">{profile.full_name}</div>
                <div className="text-sm mt-1" style={{ color: C.inkSoft }}>{profile.email}</div>
                <div className="text-sm mt-1" style={{ color: C.inkSoft }}>
                  {profile.institution || "Kurum belirtilmemiş"}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span
                    className="text-xs rounded-full px-3 py-1 font-semibold"
                    style={{ background: C.paper, color: C.primaryDark, border: `1px solid ${C.line}` }}
                  >
                    {roleLabel[profile.role]}
                  </span>
                  <span className="text-xs" style={{ color: C.inkSoft }}>
                    Üyelik: {new Date(profile.created_at).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg"
                style={{ border: `1px solid ${C.line}`, color: C.primary }}
                title="Profili düzenle"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 style={serif} className="text-lg font-semibold mb-3">Kabul Edilen Bildirilerim</h3>
        {acceptedSubmissions.length === 0 ? (
          <p className="text-sm" style={{ color: C.inkSoft }}>
            Henüz kabul edilmiş bir bildirin yok.
          </p>
        ) : (
          <div className="space-y-2">
            {acceptedSubmissions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ border: `1px solid ${C.line}` }}
              >
                <div>
                  <div className="font-semibold text-sm">{s.title}</div>
                  <div className="text-xs mt-1" style={{ color: C.inkSoft }}>
                    {s.congress_title} · {s.theme_name}
                  </div>
                </div>
                <CheckCircle2 size={18} color={C.success} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CongressList({ congresses }) {
  if (congresses.length === 0)
    return <Empty text="Henüz bir kongre oluşturulmamış. Admin panelinden ekleyebilirsin." />;

  const isPast = (dateStr) => dateStr && new Date() > new Date(dateStr);

  return (
    <div className="space-y-4">
      <h2 style={serif} className="text-xl font-semibold mb-2">Kongreler</h2>
      {congresses.map((c) => {
        const deadlinePassed = isPast(c.submission_deadline);
        return (
          <div key={c.id} className="rounded-xl p-5" style={{ border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between">
              <div className="font-semibold">{c.title}</div>
              <span className="text-xs" style={{ color: C.inkSoft }}>ID: {c.id}</span>
            </div>
            <p className="text-sm mt-1" style={{ color: C.inkSoft }}>{c.description}</p>

            {c.submission_deadline && (
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mt-2"
                style={{
                  background: deadlinePassed ? "#F3E4E1" : "#F1E7D8",
                  color: deadlinePassed ? C.danger : C.accent,
                }}
              >
                <Clock size={12} />
                Son başvuru: {new Date(c.submission_deadline).toLocaleDateString("tr-TR")}
                {deadlinePassed && " (Süre doldu)"}
              </div>
            )}

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
        );
      })}
    </div>
  );
}

function MySubmissions({ items, token, onChanged }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", abstract: "", file: null });
  const [openReviewsId, setOpenReviewsId] = useState(null);
  const [reviewsById, setReviewsById] = useState({});

  const toggleReviews = async (id) => {
    if (openReviewsId === id) {
      setOpenReviewsId(null);
      return;
    }
    setOpenReviewsId(id);
    if (!reviewsById[id]) {
      try {
        const res = await fetch(`${API}/submissions/${id}/reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setReviewsById((prev) => ({ ...prev, [id]: data }));
      } catch (e) {
        setError("Yorumlar yüklenemedi.");
      }
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Bu bildiriyi silmek istediğine emin misin? Bu işlem geri alınamaz.")) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`${API}/submissions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silme başarısız.");
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditForm({ title: s.title, abstract: s.abstract || "", file: null });
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", abstract: "", file: null });
  };

  const saveEdit = async (id) => {
    setBusyId(id);
    setError("");
    try {
      const fd = new FormData();
      fd.append("title", editForm.title);
      fd.append("abstract", editForm.abstract);
      if (editForm.file) fd.append("file", editForm.file);
      const res = await fetch(`${API}/submissions/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncelleme başarısız.");
      setEditingId(null);
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) return <Empty text="Henüz bildiri göndermedin. 'Yeni Bildiri' sekmesinden başlayabilirsin." />;
  return (
    <div className="space-y-3">
      <h2 style={serif} className="text-xl font-semibold mb-2">Bildirilerim</h2>
      {error && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ background: "#F3E4E1", color: C.danger }}>{error}</p>
      )}
      {items.map((s) => {
        const voteStarted = s.approved_count > 0 || s.rejected_count > 0;
        const isEditing = editingId === s.id;
        return (
          <div key={s.id} className="rounded-xl p-5" style={{ border: `1px solid ${C.line}` }}>
            {isEditing ? (
              <div className="space-y-3">
                <Field label="Başlık">
                  <input
                    className={inputClass}
                    style={inputStyle}
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </Field>
                <Field label="Özet">
                  <textarea
                    rows={3}
                    className={inputClass}
                    style={inputStyle}
                    value={editForm.abstract}
                    onChange={(e) => setEditForm({ ...editForm, abstract: e.target.value })}
                  />
                </Field>
                <Field label="Yeni dosya (isteğe bağlı, mevcut dosyanın yerine geçer)">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="text-sm"
                    onChange={(e) => setEditForm({ ...editForm, file: e.target.files[0] })}
                  />
                </Field>
                <div className="flex gap-2">
                  <Button variant="success" disabled={busyId === s.id} onClick={() => saveEdit(s.id)}>
                    <span className="inline-flex items-center gap-1"><Save size={14} /> Kaydet</span>
                  </Button>
                  <Button variant="ghost" onClick={cancelEdit}>
                    <span className="inline-flex items-center gap-1"><X size={14} /> Vazgeç</span>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="text-xs mt-1" style={{ color: C.inkSoft }}>
                      {s.congress_title} · {s.theme_name}
                    </div>
                    <FileLink fileName={s.file_name} />
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.status} />
                    {!voteStarted && (
                      <>
                        <button
                          onClick={() => startEdit(s)}
                          title="Bildiriyi düzenle"
                          className="p-2 rounded-lg"
                          style={{ border: `1px solid ${C.line}`, color: C.primary }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => remove(s.id)}
                          disabled={busyId === s.id}
                          title="Bildiriyi sil"
                          className="p-2 rounded-lg"
                          style={{ border: `1px solid ${C.line}`, color: C.danger }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                  {s.total_reviewers > 0 ? (
                    <VoteMeter approved={s.approved_count} rejected={s.rejected_count} total={s.total_reviewers} />
                  ) : (
                    <span className="text-xs" style={{ color: C.inkSoft }}>Henüz hakem atanmamış.</span>
                  )}
                </div>

                {voteStarted && (
                  <>
                    <button
                      onClick={() => toggleReviews(s.id)}
                      className="text-xs font-semibold mt-2"
                      style={{ color: C.primary }}
                    >
                      {openReviewsId === s.id ? "Yorumları Gizle ▲" : "Hakem Yorumlarını Gör ▼"}
                    </button>
                    {openReviewsId === s.id && (
                      <div className="mt-2 space-y-2">
                        {!reviewsById[s.id] ? (
                          <span className="text-xs" style={{ color: C.inkSoft }}>Yükleniyor...</span>
                        ) : (
                          reviewsById[s.id].map((r, i) => (
                            <div
                              key={i}
                              className="rounded-lg p-3 text-xs"
                              style={{ background: C.paper, border: `1px solid ${C.line}` }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold">{r.reviewer_label}</span>
                                <span style={{ color: r.decision === "approved" ? C.success : C.danger }}>
                                  {r.decision === "approved" ? "Onayladı" : "Reddetti"}
                                </span>
                              </div>
                              {r.comment ? (
                                <p style={{ color: C.inkSoft }}>{r.comment}</p>
                              ) : (
                                <p style={{ color: C.inkSoft, fontStyle: "italic" }}>Yorum yazılmamış.</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}

                {!voteStarted && (
                  <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                    Henüz oy verilmedi, bu bildiriyi düzenleyebilir ya da silebilirsin.
                  </p>
                )}
              </>
            )}
          </div>
        );
      })}
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

  const allThemes = congresses.flatMap((c) =>
    c.themes.map((t) => ({ ...t, congressTitle: c.title, deadline: c.submission_deadline }))
  );
  const isPast = (dateStr) => dateStr && new Date() > new Date(dateStr);

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
              <option key={t.id} value={t.id} disabled={isPast(t.deadline)}>
                {t.congressTitle} — {t.name}
                {isPast(t.deadline) ? " (Süre doldu)" : ""}
              </option>
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

function AdminPanel({ token, onCreated, congresses }) {
  const [congress, setCongress] = useState({ title: "", description: "", start_date: "", end_date: "", submission_deadline: "" });
  const [theme, setTheme] = useState({ congress_id: "", name: "", description: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [submissions, setSubmissions] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [picks, setPicks] = useState({}); // { [submissionId]: reviewerIdSeçili }
  const [allUsers, setAllUsers] = useState([]);

  const [editingCongressId, setEditingCongressId] = useState(null);
  const [editCongressForm, setEditCongressForm] = useState({});
  const [editingThemeId, setEditingThemeId] = useState(null);
  const [editThemeForm, setEditThemeForm] = useState({});

  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadAssignmentData = useCallback(async () => {
    try {
      const [sRes, rRes, uRes] = await Promise.all([
        fetch(`${API}/submissions/all`, { headers: authHeaders }),
        fetch(`${API}/users/reviewers`, { headers: authHeaders }),
        fetch(`${API}/users`, { headers: authHeaders }),
      ]);
      setSubmissions(await sRes.json());
      setReviewers(await rRes.json());
      setAllUsers(await uRes.json());
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

  const startEditCongress = (c) => {
    setEditingCongressId(c.id);
    setEditCongressForm({
      title: c.title,
      description: c.description || "",
      start_date: c.start_date ? c.start_date.slice(0, 10) : "",
      end_date: c.end_date ? c.end_date.slice(0, 10) : "",
      submission_deadline: c.submission_deadline ? c.submission_deadline.slice(0, 10) : "",
    });
  };

  const saveCongress = async (id) => {
    setErr("");
    try {
      const res = await fetch(`${API}/congresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(editCongressForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncelleme başarısız.");
      setEditingCongressId(null);
      onCreated();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const deleteCongress = async (id) => {
    setErr("");
    try {
      const impactRes = await fetch(`${API}/congresses/${id}/delete-impact`, { headers: authHeaders });
      const impact = await impactRes.json();
      const warn =
        impact.submissionCount > 0
          ? `Bu kongrenin altında ${impact.themeCount} tema ve ${impact.submissionCount} bildiri var. Silersen HEPSİ kalıcı olarak silinecek. Emin misin?`
          : `Bu kongreyi silmek istediğine emin misin? (${impact.themeCount} tema silinecek)`;
      if (!window.confirm(warn)) return;

      const res = await fetch(`${API}/congresses/${id}`, { method: "DELETE", headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silme başarısız.");
      onCreated();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const startEditTheme = (t) => {
    setEditingThemeId(t.id);
    setEditThemeForm({ name: t.name, description: t.description || "" });
  };

  const saveTheme = async (congressId, themeId) => {
    setErr("");
    try {
      const res = await fetch(`${API}/congresses/${congressId}/themes/${themeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(editThemeForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Güncelleme başarısız.");
      setEditingThemeId(null);
      onCreated();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const deleteTheme = async (congressId, themeId) => {
    setErr("");
    try {
      const impactRes = await fetch(`${API}/congresses/${congressId}/themes/${themeId}/delete-impact`, {
        headers: authHeaders,
      });
      const impact = await impactRes.json();
      const warn =
        impact.submissionCount > 0
          ? `Bu temanın altında ${impact.submissionCount} bildiri var. Silersen HEPSİ kalıcı olarak silinecek. Emin misin?`
          : "Bu temayı silmek istediğine emin misin?";
      if (!window.confirm(warn)) return;

      const res = await fetch(`${API}/congresses/${congressId}/themes/${themeId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Silme başarısız.");
      onCreated();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const changeRole = async (userId, newRole) => {
    setErr("");
    try {
      const res = await fetch(`${API}/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rol güncellenemedi.");
      loadAssignmentData();
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
          <Field label="Bitiş Tarihi">
            <input type="date" className={inputClass} style={inputStyle} value={congress.end_date} onChange={(e) => setCongress({ ...congress, end_date: e.target.value })} />
          </Field>
          <Field label="Son Başvuru Tarihi">
            <input type="date" className={inputClass} style={inputStyle} value={congress.submission_deadline} onChange={(e) => setCongress({ ...congress, submission_deadline: e.target.value })} />
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
        <h2 style={serif} className="text-lg font-semibold mb-3 mt-4">Kullanıcı Yönetimi</h2>
        <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
          Yeni kayıt olan herkes varsayılan olarak "Yazar" rolüyle başlar. Birini hakem veya
          admin yapmak için aşağıdan rolünü değiştir.
        </p>
        {allUsers.length === 0 ? (
          <p className="text-sm" style={{ color: C.inkSoft }}>Henüz kullanıcı yok.</p>
        ) : (
          <div className="space-y-2">
            {allUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-xl p-3"
                style={{ border: `1px solid ${C.line}` }}
              >
                <div>
                  <div className="text-sm font-semibold">{u.full_name}</div>
                  <div className="text-xs" style={{ color: C.inkSoft }}>{u.email}</div>
                </div>
                <select
                  className={inputClass}
                  style={{ ...inputStyle, maxWidth: 160 }}
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                >
                  <option value="author">Yazar</option>
                  <option value="reviewer">Hakem</option>
                  <option value="admin">Yönetici</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="md:col-span-2 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <h2 style={serif} className="text-lg font-semibold mb-3 mt-4">Kongre / Tema Yönetimi</h2>
        {congresses.length === 0 ? (
          <p className="text-sm" style={{ color: C.inkSoft }}>Henüz kongre yok.</p>
        ) : (
          <div className="space-y-4">
            {congresses.map((c) => (
              <div key={c.id} className="rounded-xl p-4" style={{ border: `1px solid ${C.line}` }}>
                {editingCongressId === c.id ? (
                  <div className="space-y-2">
                    <input
                      className={inputClass}
                      style={inputStyle}
                      value={editCongressForm.title}
                      onChange={(e) => setEditCongressForm({ ...editCongressForm, title: e.target.value })}
                    />
                    <input
                      className={inputClass}
                      style={inputStyle}
                      value={editCongressForm.description}
                      onChange={(e) => setEditCongressForm({ ...editCongressForm, description: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className={inputClass}
                        style={inputStyle}
                        value={editCongressForm.start_date}
                        onChange={(e) => setEditCongressForm({ ...editCongressForm, start_date: e.target.value })}
                      />
                      <input
                        type="date"
                        className={inputClass}
                        style={inputStyle}
                        value={editCongressForm.end_date}
                        onChange={(e) => setEditCongressForm({ ...editCongressForm, end_date: e.target.value })}
                      />
                      <input
                        type="date"
                        className={inputClass}
                        style={inputStyle}
                        value={editCongressForm.submission_deadline}
                        onChange={(e) => setEditCongressForm({ ...editCongressForm, submission_deadline: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="success" onClick={() => saveCongress(c.id)}>Kaydet</Button>
                      <Button variant="ghost" onClick={() => setEditingCongressId(null)}>Vazgeç</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm">{c.title}</div>
                      <div className="text-xs" style={{ color: C.inkSoft }}>{c.description}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditCongress(c)} className="p-2 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.primary }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteCongress(c.id)} className="p-2 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.danger }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3 pl-3 space-y-2" style={{ borderLeft: `2px solid ${C.line}` }}>
                  {c.themes.map((t) => (
                    <div key={t.id}>
                      {editingThemeId === t.id ? (
                        <div className="flex flex-wrap gap-2 items-center">
                          <input
                            className={inputClass}
                            style={{ ...inputStyle, maxWidth: 160 }}
                            value={editThemeForm.name}
                            onChange={(e) => setEditThemeForm({ ...editThemeForm, name: e.target.value })}
                          />
                          <input
                            className={inputClass}
                            style={{ ...inputStyle, maxWidth: 200 }}
                            value={editThemeForm.description}
                            onChange={(e) => setEditThemeForm({ ...editThemeForm, description: e.target.value })}
                          />
                          <Button variant="success" onClick={() => saveTheme(c.id, t.id)}>Kaydet</Button>
                          <Button variant="ghost" onClick={() => setEditingThemeId(null)}>Vazgeç</Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-sm">
                          <span>{t.name} <span style={{ color: C.inkSoft }}>— {t.description}</span></span>
                          <div className="flex gap-1">
                            <button onClick={() => startEditTheme(t)} className="p-1.5 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.primary }}>
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => deleteTheme(c.id, t.id)} className="p-1.5 rounded-lg" style={{ border: `1px solid ${C.line}`, color: C.danger }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {c.themes.length === 0 && (
                    <span className="text-xs" style={{ color: C.inkSoft }}>Bu kongrede tema yok.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="md:col-span-2 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <h2 style={serif} className="text-lg font-semibold mb-3 mt-4">Hakem Atama</h2>
        {submissions.length === 0 ? (
          <p className="text-sm" style={{ color: C.inkSoft }}>Henüz bir bildiri yok.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((s) => {
              const assignedIds = s.reviewers.map((r) => r.reviewer_id);
              const available = reviewers.filter((r) => !assignedIds.includes(r.id) && r.id !== s.author_id);
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
