'use client';

import { Wire } from '../lib/circuitEngine';

interface WireComponentProps {
  wire: Wire;
  selected: boolean;
  onClick: (id: string) => void;
}

export default function WireComponent({ wire, selected, onClick }: WireComponentProps) {
  // Generate path for the wire
  const generatePath = () => {
    if (wire.points.length === 0) {
      return '';
    }

    let path = `M ${wire.points[0].x} ${wire.points[0].y}`;
    
    for (let i = 1; i < wire.points.length; i++) {
      path += ` L ${wire.points[i].x} ${wire.points[i].y}`;
    }
    
    return path;
  };

  return (
    <g 
      className={`wire ${selected ? 'selected' : ''}`} 
      onClick={(e) => {
        e.stopPropagation();
        onClick(wire.id);
      }}
    >
      <path 
        d={generatePath()} 
        stroke={selected ? 'blue' : 'black'} 
        strokeWidth="2" 
        fill="none" 
        strokeLinecap="round"
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
} 