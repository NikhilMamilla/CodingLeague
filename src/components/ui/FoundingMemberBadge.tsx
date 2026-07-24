import { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';
import toast from 'react-hot-toast';

const BADGE_IMAGE_SRC = '/FoundingMemberBadge.png';

interface FoundingMemberBadgeProps {
  participantId?: string;
  seasonLabel?: string;
  size?: number;
  downloadable?: boolean;
}

function fetchBadgeBlob(): Promise<Blob> {
  return fetch(BADGE_IMAGE_SRC).then(res => {
    if (!res.ok) throw new Error('Badge image not available');
    return res.blob();
  });
}

export function downloadFoundingBadge(
  participantId = '',
  _seasonLabel = '2026–27'
): void {
  const label = participantId ? `_${participantId}` : '';
  fetchBadgeBlob()
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FoundingMember${label}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Badge downloaded!');
    })
    .catch(() => {
      toast.error('Could not download badge. Please try again.');
    });
}

export default function FoundingMemberBadge({
  size = 240,
  downloadable = false,
}: FoundingMemberBadgeProps) {
  const [loaded, setLoaded] = useState(false);

  // Ensure the image is cached/rendered before showing download interactions
  useEffect(() => {
    const img = new Image();
    img.src = BADGE_IMAGE_SRC;
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(true);
  }, []);

  const displaySize = size > 0 ? size : 240;

  return (
    <div className={`flex flex-col items-center ${downloadable ? 'gap-3' : ''}`}>
      <div
        className="relative flex items-center justify-center max-w-full"
        style={{ width: displaySize, height: 'auto' }}
      >
        <img
          src={BADGE_IMAGE_SRC}
          alt="Founding Member Badge"
          className="w-full h-auto object-contain drop-shadow-[0_0_12px_rgba(255,215,0,0.35)]"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 300ms ease' }}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Crown className="text-gold/40 animate-pulse" size={displaySize * 0.25} />
          </div>
        )}
      </div>
      {downloadable && (
        <button
          onClick={() => downloadFoundingBadge()}
          className="text-xs flex items-center gap-1 text-gold hover:text-white transition-colors"
        >
          <Crown size={12} /> Download Badge
        </button>
      )}
    </div>
  );
}
