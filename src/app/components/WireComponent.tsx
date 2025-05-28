'use client';

import { Wire } from '../lib/circuitEngine';

interface WireComponentProps {
  wire: Wire;
  selected: boolean;
  onClick: (id: string) => void;
}

export default function WireComponent({ wire, selected, onClick }: WireComponentProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(wire.id);
  };

  // Create path from wire points
  const pathData = wire.points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    } else {
      return `${path} L ${point.x} ${point.y}`;
    }
  }, '');

  return (
    <g onClick={handleClick} style={{ cursor: 'pointer' }}>
      {/* Main wire line */}
      <path
        d={pathData}
        stroke={selected ? '#ff0000' : '#000000'}
        strokeWidth={selected ? '3' : '2'}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Connection points */}
      {wire.points.map((point, index) => (
        <circle
          key={`point-${index}`}
          cx={point.x}
          cy={point.y}
          r="3"
          fill={selected ? '#ff0000' : '#666666'}
          stroke="#000000"
          strokeWidth="1"
        />
      ))}
      
      {/* Selection indicator */}
      {selected && (
        <path
          d={pathData}
          stroke="#ff0000"
          strokeWidth="6"
          fill="none"
          strokeDasharray="5,5"
          opacity="0.5"
        />
      )}
    </g>
  );
} 