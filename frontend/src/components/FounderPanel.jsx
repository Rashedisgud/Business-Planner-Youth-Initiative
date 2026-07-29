import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { useAdminAuth } from '../state/useAdminAuth.js';
import AdminUnlock from './AdminUnlock.jsx';
import Spinner from './Spinner.jsx';

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="76" height="76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.5" />
      <path
        d="M4 20c0-4.2 3.6-7 8-7s8 2.8 8 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export default function FounderPanel({
  editable = false,
  person = 1,
  heading = 'Meet the founder',
  emptyLabel = "This section hasn't been filled in yet.",
}) {
  const { password, isUnlocked, verify, forget } = useAdminAuth();

  const [founder, setFounder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [mode, setMode] = useState('view'); // 'view' | 'password' | 'edit'
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.getFounder();
        if (cancelled) return;
        // `people` arrives from the current backend; fall back to `founder` so a
        // browser that loads this before the backend redeploys still renders.
        const mine = data.people?.find((p) => p.id === person) ?? (person === 1 ? data.founder : null);
        setFounder(mine);
        setName(mine?.name || '');
        setBio(mine?.bio || '');
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [person]);

  function startEdit() {
    setMode(isUnlocked ? 'edit' : 'password');
  }

  async function handleUnlock(candidate) {
    await verify(candidate);
    setMode('edit');
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleForget() {
    forget();
    setMode('view');
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const { founder: updated } = await api.updateFounder({ name, bio }, password, person);
      let latest = updated;
      if (photoFile) {
        const { founder: withPhoto } = await api.uploadFounderPhoto(photoFile, password, person);
        latest = withPhoto;
      }
      setFounder(latest);
      setPhotoFile(null);
      setPhotoPreview(null);
      setMode('view');
    } catch (err) {
      if (err.message?.toLowerCase().includes('incorrect admin password')) {
        forget();
        setMode('password');
        setSaveError('Your saved password was rejected - please re-enter it.');
      } else {
        setSaveError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  const displayPhoto = photoPreview || founder?.photo_url;

  if (loading) return <Spinner />;
  if (loadError) return <p className="error-text">{loadError}</p>;

  if (mode === 'edit') {
    return (
      <form className="founder-edit-form" onSubmit={handleSave}>
        <div className="founder-photo founder-photo--editable" onClick={() => fileInputRef.current?.click()}>
          {displayPhoto ? <img src={displayPhoto} alt="Preview" /> : <PersonIcon />}
          <div className="founder-photo-overlay">Change photo</div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} hidden />

        <div className="founder-text">
          <label htmlFor="founder-name">Name</label>
          <input id="founder-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Founder's name" />

          <label htmlFor="founder-bio">Bio</label>
          <textarea
            id="founder-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={5}
            placeholder="A short founder story..."
          />

          {saveError && <p className="error-text">{saveError}</p>}

          <div className="modal-actions modal-actions--split">
            <button type="button" className="link-button" onClick={handleForget}>
              Not you? Clear saved password
            </button>
            <div>
              <button type="button" className="btn-secondary" onClick={() => setMode('view')} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="founder-view">
      <div className="founder-photo">
        {displayPhoto ? <img src={displayPhoto} alt={founder?.name || 'Founder'} /> : <PersonIcon />}
      </div>
      <div className="founder-text">
        <h3>{founder?.name || heading}</h3>
        <p className="founder-bio">{founder?.bio || emptyLabel}</p>

        {editable && mode === 'view' && (
          <button className="btn-secondary btn-edit" onClick={startEdit}>
            ✎ Edit
          </button>
        )}

        {mode === 'password' && (
          <AdminUnlock onUnlock={handleUnlock} onCancel={() => setMode('view')} />
        )}
      </div>
    </div>
  );
}
