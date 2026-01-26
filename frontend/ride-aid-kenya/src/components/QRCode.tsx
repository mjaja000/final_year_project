interface QRCodeProps {
  value: string;
  size?: number;
}

// Simple SVG QR code placeholder - in production, use a proper QR library
const QRCode = ({ value, size = 120 }: QRCodeProps) => {
  // Generate a deterministic pattern based on the value
  const hash = value.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);

  const pattern: boolean[][] = [];
  const gridSize = 21;
  
  for (let i = 0; i < gridSize; i++) {
    pattern[i] = [];
    for (let j = 0; j < gridSize; j++) {
      // Create position detection patterns (corners)
      const isCorner = (
        (i < 7 && j < 7) || 
        (i < 7 && j >= gridSize - 7) || 
        (i >= gridSize - 7 && j < 7)
      );
      
      const isInnerCorner = (
        (i >= 2 && i < 5 && j >= 2 && j < 5) ||
        (i >= 2 && i < 5 && j >= gridSize - 5 && j < gridSize - 2) ||
        (i >= gridSize - 5 && i < gridSize - 2 && j >= 2 && j < 5)
      );

      const isBorder = (
        (i < 7 && j < 7 && (i === 0 || i === 6 || j === 0 || j === 6)) ||
        (i < 7 && j >= gridSize - 7 && (i === 0 || i === 6 || j === gridSize - 1 || j === gridSize - 7)) ||
        (i >= gridSize - 7 && j < 7 && (i === gridSize - 1 || i === gridSize - 7 || j === 0 || j === 6))
      );

      if (isCorner) {
        pattern[i][j] = isBorder || isInnerCorner;
      } else {
        // Pseudo-random data pattern based on hash
        pattern[i][j] = ((hash * (i + 1) * (j + 1)) % 3) === 0;
      }
    }
  }

  const moduleSize = size / gridSize;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="bg-card"
      role="img"
      aria-label={`QR Code for transaction ${value}`}
    >
      <rect width={size} height={size} fill="white" />
      {pattern.map((row, i) =>
        row.map((cell, j) =>
          cell ? (
            <rect
              key={`${i}-${j}`}
              x={j * moduleSize}
              y={i * moduleSize}
              width={moduleSize}
              height={moduleSize}
              fill="hsl(210 11% 15%)"
            />
          ) : null
        )
      )}
    </svg>
  );
};

export default QRCode;
