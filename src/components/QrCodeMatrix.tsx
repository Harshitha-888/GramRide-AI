import React, { useMemo } from "react";

interface QrCodeMatrixProps {
  token: string;
  size?: number;
  label?: string;
}

function isFinderCell(r: number, c: number, gridSize: number): boolean | null {
  const corners = [
    [0, 0],
    [0, gridSize - 7],
    [gridSize - 7, 0],
  ];
  for (const [cr, cc] of corners) {
    if (r >= cr && r < cr + 7 && c >= cc && c < cc + 7) {
      const lr = r - cr;
      const lc = c - cc;
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    }
  }
  return null;
}

export const QrCodeMatrix: React.FC<QrCodeMatrixProps> = ({
  token,
  size = 96,
  label = "Student trip boarding QR code",
}) => {
  const gridSize = 21;

  const cells = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < token.length; i += 1) {
      hash ^= token.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const matrix: boolean[] = [];
    for (let r = 0; r < gridSize; r += 1) {
      for (let c = 0; c < gridSize; c += 1) {
        const finder = isFinderCell(r, c, gridSize);
        if (finder !== null) {
          matrix.push(finder);
          continue;
        }
        // Timing bands
        if (r === 6 || c === 6) {
          matrix.push((r + c) % 2 === 0);
          continue;
        }
        hash ^= (r * 31 + c * 17) & 0xff;
        hash = Math.imul(hash, 16777619);
        matrix.push((Math.abs(hash) % 100) < 48);
      }
    }
    return matrix;
  }, [token]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${gridSize + 2} ${gridSize + 2}`}
      className="bg-white border border-slate-300 rounded-lg shrink-0"
      role="img"
      aria-label={label}
    >
      <rect width={gridSize + 2} height={gridSize + 2} fill="#FFFFFF" />
      {cells.map((filled, idx) => {
        if (!filled) return null;
        const r = Math.floor(idx / gridSize);
        const c = idx % gridSize;
        return <rect key={idx} x={c + 1} y={r + 1} width={1} height={1} fill="#0F172A" />;
      })}
    </svg>
  );
};
