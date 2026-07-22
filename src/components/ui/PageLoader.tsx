
export default function PageLoader() {
  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinning ring */}
        <div className="w-12 h-12 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
        <span className="font-heading text-xs text-neon-cyan tracking-widest uppercase">Loading</span>
      </div>
    </div>
  );
}
