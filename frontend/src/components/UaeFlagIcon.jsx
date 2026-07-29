export default function UaeFlagIcon({ size = 20 }) {
  const width = size * 1.5;
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: 3, display: 'block' }}
      aria-label="UAE flag"
      role="img"
    >
      <rect x="6" y="0" width="24" height="6.67" fill="#00732F" />
      <rect x="6" y="6.67" width="24" height="6.67" fill="#FFFFFF" />
      <rect x="6" y="13.33" width="24" height="6.67" fill="#000000" />
      <rect x="0" y="0" width="6" height="20" fill="#FF0000" />
    </svg>
  );
}
