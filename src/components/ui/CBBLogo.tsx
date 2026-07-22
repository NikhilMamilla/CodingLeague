interface CBBLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export default function CBBLogo({ size = 40, className = '', glow = false }: CBBLogoProps) {
  return (
    <img
      src="/cbb.png"
      alt="Coding Brigade BVRIT"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: glow
          ? 'drop-shadow(0 0 4px #00E5FF22) drop-shadow(0 0 8px #00E5FF11)'
          : 'none',
      }}
    />
  );
}
