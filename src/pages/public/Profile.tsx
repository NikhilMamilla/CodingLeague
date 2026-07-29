import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Globe, ExternalLink, Trophy, Star, Award } from 'lucide-react';
import type { Participant, ContestResult } from '../../types';
import { BADGE_META } from '../../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TIER_CONFIG } from '../../lib/ratingEngine';
import { getCanonicalProfileUrl } from '../../lib/profileVerification';
import { supabase } from '../../lib/supabase';
import { rowToParticipant, rowToResult } from '../../lib/db';

export default function Profile() {
  const { participantId } = useParams<{ participantId: string }>();
  const [profile,  setProfile]  = useState<Participant | null>(null);
  const [results,  setResults]  = useState<ContestResult[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!participantId) return;
    setLoading(true);
    (async () => {
      try {
        const { data } = await supabase.from('participants').select('*').eq('participant_id', participantId).maybeSingle();
        if (!data) { setNotFound(true); setLoading(false); return; }
        setProfile(rowToParticipant(data));
        const { data: rData } = await supabase.from('contest_results').select('*').eq('participant_id', participantId).order('imported_at', { ascending: false }).limit(20);
        setResults((rData ?? []).map(rowToResult));
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [participantId]);

  if (loading) return (
    <div className="min-h-screen bg-midnight flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
    </div>
  );

  if (notFound || !profile) return (
    <div className="min-h-screen bg-midnight pt-24 flex flex-col items-center justify-center gap-4">
      <Trophy size={48} className="text-neon-cyan/20" />
      <h2 className="heading-md">Participant Not Found</h2>
      <Link to="/leaderboard" className="btn-secondary text-xs px-6">View Leaderboard</Link>
    </div>
  );

  const ratingHistory = results.map((r, i) => ({
    contest: `C${results.length - i}`,
    rating: r.ratingAfter,
  })).reverse();

  return (
    <div className="min-h-screen bg-midnight pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Profile Header */}
        <div className="card-glow flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-20 h-20 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan/30 flex items-center justify-center shrink-0 overflow-hidden">
            {profile.photoURL
              ? <img src={profile.photoURL} alt={profile.fullName} className="w-full h-full object-cover" />
              : <span className="font-heading text-3xl text-neon-cyan font-bold">{profile.fullName.charAt(0)}</span>
            }
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="font-heading text-white text-xl font-bold">{profile.fullName}</h1>
              {(() => {
                const cfg = TIER_CONFIG[profile.tier] ?? TIER_CONFIG.Beginner;
                return (
                  <span className={`text-[10px] font-heading font-semibold px-2.5 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    {profile.tier}
                  </span>
                );
              })()}
            </div>
            <p className="text-text-secondary text-xs mb-3">{profile.college} · {profile.branch} · {profile.year}</p>
            {profile.bio && <p className="text-text-secondary text-sm leading-relaxed mb-3">{profile.bio}</p>}
            <div className="flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1 text-text-secondary">
                <span className="text-neon-cyan font-numbers font-bold text-base">{profile.rating}</span> Rating
              </span>
              <span className="flex items-center gap-1 text-text-secondary">
                <span className="text-gold font-numbers font-bold text-base">{profile.peakRating ?? profile.rating}</span> Peak Rating
              </span>
              <span className="flex items-center gap-1 text-text-secondary">
                <span className="font-numbers text-white font-bold">{profile.contestsParticipated}</span> Contests
              </span>
              <span className="flex items-center gap-1 text-text-secondary">
                <span className="font-numbers text-white font-bold">{profile.attendance.toFixed(1)}%</span> Attendance
              </span>
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-text-secondary hover:text-neon-cyan transition-colors text-[10px]">
                  <Globe size={12} /> GitHub
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-text-secondary hover:text-neon-cyan transition-colors text-[10px]">
                  <ExternalLink size={12} /> LinkedIn
                </a>
              )}
              {profile.leetcodeUsername && (
                <a href={getCanonicalProfileUrl('leetcodeUsername', profile.leetcodeUsername)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-text-secondary hover:text-neon-cyan transition-colors text-[10px]">
                  <ExternalLink size={12} /> LeetCode (@{profile.leetcodeUsername})
                </a>
              )}
              {profile.codechefUsername && (
                <a href={getCanonicalProfileUrl('codechefUsername', profile.codechefUsername)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-text-secondary hover:text-neon-cyan transition-colors text-[10px]">
                  <ExternalLink size={12} /> CodeChef (@{profile.codechefUsername})
                </a>
              )}
              {profile.hackerrankUsername && (
                <a href={getCanonicalProfileUrl('hackerrankUsername', profile.hackerrankUsername)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-text-secondary hover:text-neon-cyan transition-colors text-[10px]">
                  <ExternalLink size={12} /> HackerRank (@{profile.hackerrankUsername})
                </a>
              )}
              {profile.codeforcesHandle && (
                <a href={getCanonicalProfileUrl('codeforcesHandle', profile.codeforcesHandle)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-text-secondary hover:text-neon-cyan transition-colors text-[10px]">
                  <ExternalLink size={12} /> Codeforces (@{profile.codeforcesHandle})
                </a>
              )}
              {profile.gfgUsername && (
                <a href={getCanonicalProfileUrl('gfgUsername', profile.gfgUsername)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-text-secondary hover:text-neon-cyan transition-colors text-[10px]">
                  <ExternalLink size={12} /> GeeksforGeeks (@{profile.gfgUsername})
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Rating',    value: profile.rating,                         color: 'text-neon-cyan'  },
            { label: 'Badges',    value: profile.badges.length,                  color: 'text-gold'       },
            { label: 'Attendance',value: `${profile.attendance.toFixed(1)}%`,    color: 'text-success'    },
            { label: 'Contests',  value: profile.contestsParticipated,           color: 'text-white'      },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <div className={`stat-number text-2xl ${color}`}>{value}</div>
              <div className="text-text-secondary text-[10px] uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Rating Chart */}
        {ratingHistory.length > 1 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Star size={14} className="text-neon-cyan" />
              <h2 className="heading-sm">Rating History</h2>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                  <XAxis dataKey="contest" tick={{ fill: '#CBD5E1', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#CBD5E1', fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 8 }}
                    labelStyle={{ color: '#CBD5E1', fontSize: 11 }}
                    itemStyle={{ color: '#00E5FF', fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="rating" stroke="#00E5FF" strokeWidth={2} dot={{ fill: '#00E5FF', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Award size={14} className="text-neon-cyan" />
              <h2 className="heading-sm">Badges</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {profile.badges.map(b => {
                const meta = BADGE_META[b.type];
                return (
                  <div key={b.type} className="flex items-center gap-2 bg-midnight border border-neon-cyan/10 rounded-lg px-3 py-2">
                    <span className="text-lg">{meta.emoji}</span>
                    <div>
                      <div className="text-white text-[10px] font-heading font-bold">{meta.label}</div>
                      <div className="text-text-secondary/60 text-[9px]">{new Date(b.awardedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contest History */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={14} className="text-neon-cyan" />
            <h2 className="heading-sm">Contest History</h2>
          </div>
          {results.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-6">No contest results yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-body">
                <thead>
                  <tr className="text-text-secondary/70 border-b border-neon-cyan/10">
                    <th className="text-left py-2 pr-4 text-[10px] uppercase tracking-wider">Contest</th>
                    <th className="text-center py-2 px-2 text-[10px] uppercase tracking-wider">Rank</th>
                    <th className="text-center py-2 px-2 text-[10px] uppercase tracking-wider">Score</th>
                    <th className="text-center py-2 px-2 text-[10px] uppercase tracking-wider">LP</th>
                    <th className="text-right py-2 pl-2 text-[10px] uppercase tracking-wider">Δ Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neon-cyan/5">
                  {results.map(r => (
                    <tr key={r.id} className="hover:bg-neon-cyan/5 transition-colors">
                      <td className="py-3 pr-4 text-white">{(r as any).contestName ?? r.contestId}</td>
                      <td className="py-3 px-2 text-center font-numbers">
                        <span className={r.rank <= 3 ? ['', 'text-gold', 'text-silver', 'text-bronze'][r.rank] : 'text-text-secondary'}>
                          #{r.rank}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-numbers text-white">{r.score}</td>
                      <td className="py-3 px-2 text-center font-numbers text-neon-cyan">{r.leaguePoints}</td>
                      <td className="py-3 pl-2 text-right font-numbers">
                        <span className={r.ratingAfter >= r.ratingBefore ? 'text-success' : 'text-red-400'}>
                          {r.ratingAfter >= r.ratingBefore ? '+' : ''}{r.ratingAfter - r.ratingBefore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
