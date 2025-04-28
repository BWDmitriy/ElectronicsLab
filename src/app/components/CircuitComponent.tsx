'use client';

import { Component, ComponentType } from '../lib/circuitEngine';
import { useState } from 'react';

interface CircuitComponentProps {
  component: Component;
  selected: boolean;
  onClick: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}

export default function CircuitComponent({ component, selected, onClick, onMove }: CircuitComponentProps) {
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getComponentSymbol = (type: ComponentType) => {
    switch (type) {
      case 'resistor':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <rect x={component.position.x - 20} y={component.position.y - 10} width="40" height="20" fill="white" stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y + 5} textAnchor="middle" fontSize="12">{component.value}Ω</text>
          </g>
        );
      case 'capacitor':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 10} y2={component.position.y} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 10} y1={component.position.y - 15} x2={component.position.x - 10} y2={component.position.y + 15} stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 10} y1={component.position.y - 15} x2={component.position.x + 10} y2={component.position.y + 15} stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 10} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 20} textAnchor="middle" fontSize="12">{component.value}F</text>
          </g>
        );
      case 'inductor':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <path d={`M${component.position.x - 20},${component.position.y} 
                      A5,5 0 0 1 ${component.position.x - 10},${component.position.y} 
                      A5,5 0 0 1 ${component.position.x},${component.position.y} 
                      A5,5 0 0 1 ${component.position.x + 10},${component.position.y} 
                      A5,5 0 0 1 ${component.position.x + 20},${component.position.y}`} 
                  fill="none" stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 15} textAnchor="middle" fontSize="12">{component.value}H</text>
          </g>
        );
      case 'voltageSource':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <circle cx={component.position.x} cy={component.position.y} r="20" fill="white" stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 10} y1={component.position.y} x2={component.position.x + 10} y2={component.position.y} stroke="black" strokeWidth="2" />
            <line x1={component.position.x} y1={component.position.y - 10} x2={component.position.x} y2={component.position.y + 10} stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{component.value}V</text>
          </g>
        );
      case 'diode':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 15} y2={component.position.y} stroke="black" strokeWidth="2" />
            <polygon points={`${component.position.x - 15},${component.position.y - 10} ${component.position.x - 15},${component.position.y + 10} ${component.position.x + 15},${component.position.y}`} 
                     fill="white" stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 15} y1={component.position.y - 10} x2={component.position.x + 15} y2={component.position.y + 10} stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 15} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
          </g>
        );
      default:
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <rect x={component.position.x - 20} y={component.position.y - 20} width="40" height="40" fill="white" stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y + 5} textAnchor="middle" fontSize="12">{component.type}</text>
          </g>
        );
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(component.id);
    setDragging(true);
    setDragOffset({
      x: e.clientX - component.position.x,
      y: e.clientY - component.position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging) {
      onMove(
        component.id,
        e.clientX - dragOffset.x,
        e.clientY - dragOffset.y
      );
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // Add event listeners for mouse move and up
  if (dragging) {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  } else {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  return (
    <g 
      className={`circuit-component ${selected ? 'selected' : ''}`} 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={handleMouseDown}
      style={{ cursor: 'move' }}
    >
      {getComponentSymbol(component.type)}
      {selected && (
        <rect 
          x={component.position.x - 45} 
          y={component.position.y - 45} 
          width="90" 
          height="90" 
          fill="none" 
          stroke="blue" 
          strokeWidth="2" 
          strokeDasharray="5,5" 
        />
      )}
    </g>
  );
} 