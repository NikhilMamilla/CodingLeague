import React, { useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyProfile() {
  const { participant, user } = useAuth();
  const [bio,        setBio]    = useState(participant?.bio ?? '');
  const [github,     setGithub] = useState(participant?.github ?? '');
  const [linkedin,   setLinkIn] = useState(participant?.linkedin ?? '');
  const [cfHandle,   setCF]     = useState(participant?.codeforcesHandle ?? '');
  const [lcUser,     setLC]     = useState(participant?.leetcodeUsername ?? '');
  const [uploading,  setUploading] = useState(false);
  const [saving,     setSaving]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!participant || !user) return null;

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return; }
    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user!.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'participants', user!.uid), { photoURL: url });
      toast.success('Photo updated!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'participants', user!.uid), {
        bio, github, linkedin,
        codeforcesHandle: cfHandle,
        leetcodeUsername:  lcUser,
      });
      toast.success('Profile updated!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  }

  const TIER_CLASS: Record<string, string> = {
    Beginner: 'tier-beginner', Explorer: 'tier-explorer', Coder: 'tier-coder',
    Expert: 'tier-expert', Master: 'tier-master', Grandmaster: 'tier-grandmaster',
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="heading-md mb-1">My Profile</h1>
        <p className="text-text-secondary text-xs">Update your public profile information.</p>
      </div>

      {/* Avatar */}
      <div className="card flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan/30 overflow-hidden flex items-center justify-center">
            {participant.photoURL
              ? <img src={participant.photoURL} alt="" className="w-full h-full object-cover" />
              : <span className="font-heading text-3xl text-neon-cyan font-bold">{participant.fullName.charAt(0)}</span>
            }
          </div>
          <button onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-neon-cyan text-midnight flex items-center justify-center hover:bg-neon-cyan/80 transition-colors">
            <Camera size={12} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-heading text-white text-sm font-bold">{participant.fullName}</span>
            <span className={TIER_CLASS[participant.tier]}>{participant.tier}</span>
          </div>
          <div className="text-text-secondary text-[10px] font-numbers">{participant.participantId}</div>
          <div className="text-text-secondary text-[10px] mt-0.5">{participant.college} · {participant.branch}</div>
        </div>
      </div>

      {/* Read-only info */}
      <div className="card space-y-4">
        <h2 className="heading-sm">Account Details</h2>
        <div className="grid grid-cols-2 gap-4 text-xs">
          {[
            { label: 'Full Name', value: participant.fullName   },
            { label: 'Email',     value: participant.email      },
            { label: 'Phone',     value: participant.phone      },
            { label: 'College',   value: participant.college    },
            { label: 'University',value: participant.university },
            { label: 'Year',      value: participant.year       },
            { label: 'Branch',    value: participant.branch     },
            { label: 'City',      value: participant.city       },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-text-secondary/70 text-[10px] uppercase tracking-wider mb-0.5">{label}</div>
              <div className="text-white">{value}</div>
            </div>
          ))}
        </div>
        <p className="text-text-secondary/60 text-[10px]">Contact support to update account details.</p>
      </div>

      {/* Editable fields */}
      <div className="card space-y-4">
        <h2 className="heading-sm">Edit Profile</h2>

        <div>
          <label className="input-label">Bio</label>
          <textarea className="input-field resize-none h-24" placeholder="Tell others about yourself…"
            value={bio} onChange={e => setBio(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Codeforces Handle</label>
            <input className="input-field" value={cfHandle} onChange={e => setCF(e.target.value)} />
          </div>
          <div>
            <label className="input-label">LeetCode Username</label>
            <input className="input-field" value={lcUser} onChange={e => setLC(e.target.value)} />
          </div>
          <div>
            <label className="input-label">GitHub URL</label>
            <input className="input-field" placeholder="https://github.com/you" value={github} onChange={e => setGithub(e.target.value)} />
          </div>
          <div>
            <label className="input-label">LinkedIn URL</label>
            <input className="input-field" placeholder="https://linkedin.com/in/you" value={linkedin} onChange={e => setLinkIn(e.target.value)} />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save size={14} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
