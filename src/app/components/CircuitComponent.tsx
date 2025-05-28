'use client';

import { Component, ComponentType } from '../lib/circuitEngine';
import { useState, useEffect, useCallback } from 'react';

interface CircuitComponentProps {
  component: Component;
  selected: boolean;
  onClick: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onTerminalClick?: (componentId: string, terminalIndex: number) => void;
  isConnected?: boolean;
  wireMode?: boolean;
  wireStartTerminal?: {componentId: string, terminalIndex: number} | null;
}

export default function CircuitComponent({ 
  component, 
  selected, 
  onClick, 
  onMove,
  onTerminalClick,
  isConnected = false,
  wireMode = false,
  wireStartTerminal = null
}: CircuitComponentProps) {
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getComponentSymbol = (type: ComponentType) => {
    // Helper function to format values with appropriate units
    const formatValue = (value: number, type: ComponentType): string => {
      switch (type) {
        case 'resistor':
          return value >= 1000000 ? `${(value/1000000).toFixed(1)}MΩ` :
                 value >= 1000 ? `${(value/1000).toFixed(1)}kΩ` :
                 `${value.toFixed(1)}Ω`;
        case 'capacitor':
          return value >= 0.000001 ? `${(value*1000000).toFixed(1)}µF` :
                 value >= 0.000000001 ? `${(value*1000000000).toFixed(1)}nF` :
                 `${(value*1000000000000).toFixed(1)}pF`;
        case 'inductor':
          return value >= 1 ? `${value.toFixed(1)}H` :
                 value >= 0.001 ? `${(value*1000).toFixed(1)}mH` :
                 `${(value*1000000).toFixed(1)}µH`;
        case 'voltageSource':
        case 'battery':
        case 'acVoltageSource':
          return `${value.toFixed(1)}V`;
        case 'currentSource':
        case 'dcCurrentSource':
        case 'acCurrentSource':
          return value >= 1 ? `${value.toFixed(1)}A` :
                 value >= 0.001 ? `${(value*1000).toFixed(1)}mA` :
                 `${(value*1000000).toFixed(1)}µA`;
        case 'squareWaveSource':
          return value >= 1000000 ? `${(value/1000000).toFixed(1)}MHz` :
                 value >= 1000 ? `${(value/1000).toFixed(1)}kHz` :
                 `${value.toFixed(1)}Hz`;
        default:
          return `${value}`;
      }
    };

    switch (type) {
      case 'resistor':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <rect x={component.position.x - 20} y={component.position.y - 10} width="40" height="20" fill="white" stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y + 5} textAnchor="middle" fontSize="12">{formatValue(component.value, 'resistor')}</text>
          </g>
        );
      case 'capacitor':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 10} y2={component.position.y} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 10} y1={component.position.y - 15} x2={component.position.x - 10} y2={component.position.y + 15} stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 10} y1={component.position.y - 15} x2={component.position.x + 10} y2={component.position.y + 15} stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 10} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 20} textAnchor="middle" fontSize="12">{formatValue(component.value, 'capacitor')}</text>
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
            <text x={component.position.x} y={component.position.y - 15} textAnchor="middle" fontSize="12">{formatValue(component.value, 'inductor')}</text>
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
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{formatValue(component.value, 'voltageSource')}</text>
          </g>
        );
      case 'ground':
        return (
          <g>
            <line x1={component.position.x} y1={component.position.y - 20} x2={component.position.x} y2={component.position.y + 10} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 15} y1={component.position.y + 10} x2={component.position.x + 15} y2={component.position.y + 10} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 10} y1={component.position.y + 15} x2={component.position.x + 10} y2={component.position.y + 15} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 5} y1={component.position.y + 20} x2={component.position.x + 5} y2={component.position.y + 20} stroke="black" strokeWidth="2" />
          </g>
        );
      case 'battery':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 10} y2={component.position.y} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 10} y1={component.position.y - 15} x2={component.position.x - 10} y2={component.position.y + 15} stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 5} y1={component.position.y - 7} x2={component.position.x - 5} y2={component.position.y + 7} stroke="black" strokeWidth="3" />
            <line x1={component.position.x + 5} y1={component.position.y - 15} x2={component.position.x + 5} y2={component.position.y + 15} stroke="black" strokeWidth="1" />
            <line x1={component.position.x + 5} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{formatValue(component.value, 'battery')}</text>
          </g>
        );
      case 'dcCurrentSource':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <circle cx={component.position.x} cy={component.position.y} r="20" fill="white" stroke="black" strokeWidth="2" />
            <line x1={component.position.x - 10} y1={component.position.y} x2={component.position.x + 10} y2={component.position.y} stroke="black" strokeWidth="2" />
            <polygon points={`${component.position.x},${component.position.y - 10} ${component.position.x + 10},${component.position.y} ${component.position.x},${component.position.y + 10}`} fill="black" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{formatValue(component.value, 'dcCurrentSource')}</text>
          </g>
        );
      case 'acVoltageSource':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <circle cx={component.position.x} cy={component.position.y} r="20" fill="white" stroke="black" strokeWidth="2" />
            <path d={`M${component.position.x - 10},${component.position.y} 
                      Q${component.position.x - 5},${component.position.y - 10} ${component.position.x},${component.position.y}
                      Q${component.position.x + 5},${component.position.y + 10} ${component.position.x + 10},${component.position.y}`} 
                  fill="none" stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{formatValue(component.value, 'acVoltageSource')}</text>
          </g>
        );
      case 'acCurrentSource':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <circle cx={component.position.x} cy={component.position.y} r="20" fill="white" stroke="black" strokeWidth="2" />
            <path d={`M${component.position.x - 10},${component.position.y} 
                      Q${component.position.x - 5},${component.position.y - 10} ${component.position.x},${component.position.y}
                      Q${component.position.x + 5},${component.position.y + 10} ${component.position.x + 10},${component.position.y}`} 
                  fill="none" stroke="black" strokeWidth="2" />
            <polygon points={`${component.position.x + 5},${component.position.y - 10} ${component.position.x + 15},${component.position.y} ${component.position.x + 5},${component.position.y + 10}`} fill="black" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{formatValue(component.value, 'acCurrentSource')}</text>
          </g>
        );
      case 'squareWaveSource':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 20} y2={component.position.y} stroke="black" strokeWidth="2" />
            <circle cx={component.position.x} cy={component.position.y} r="20" fill="white" stroke="black" strokeWidth="2" />
            <path d={`M${component.position.x - 10},${component.position.y - 5} 
                      L${component.position.x - 10},${component.position.y - 10} 
                      L${component.position.x},${component.position.y - 10} 
                      L${component.position.x},${component.position.y + 10} 
                      L${component.position.x + 10},${component.position.y + 10} 
                      L${component.position.x + 10},${component.position.y + 5}`} 
                  fill="none" stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 20} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            <text x={component.position.x} y={component.position.y - 25} textAnchor="middle" fontSize="12">{formatValue(component.value, 'squareWaveSource')}</text>
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
      case 'oscilloscope':
        return (
          <g>
            {/* Main oscilloscope body - wider rectangular shape */}
            <rect x={component.position.x - 60} y={component.position.y - 40} width="120" height="80" fill="lightgray" stroke="black" strokeWidth="2" />
            
            {/* Graph/Screen area on the left side */}
            <rect x={component.position.x - 55} y={component.position.y - 35} width="70" height="70" fill="darkgreen" stroke="black" strokeWidth="1" />
            
            {/* Grid lines on screen */}
            <line x1={component.position.x - 45} y1={component.position.y - 35} x2={component.position.x - 45} y2={component.position.y + 35} stroke="green" strokeWidth="0.5" />
            <line x1={component.position.x - 35} y1={component.position.y - 35} x2={component.position.x - 35} y2={component.position.y + 35} stroke="green" strokeWidth="0.5" />
            <line x1={component.position.x - 25} y1={component.position.y - 35} x2={component.position.x - 25} y2={component.position.y + 35} stroke="green" strokeWidth="0.5" />
            <line x1={component.position.x - 15} y1={component.position.y - 35} x2={component.position.x - 15} y2={component.position.y + 35} stroke="green" strokeWidth="0.5" />
            <line x1={component.position.x - 5} y1={component.position.y - 35} x2={component.position.x - 5} y2={component.position.y + 35} stroke="green" strokeWidth="0.5" />
            <line x1={component.position.x + 5} y1={component.position.y - 35} x2={component.position.x + 5} y2={component.position.y + 35} stroke="green" strokeWidth="0.5" />
            
            <line x1={component.position.x - 55} y1={component.position.y - 25} x2={component.position.x + 15} y2={component.position.y - 25} stroke="green" strokeWidth="0.5" />
            <line x1={component.position.x - 55} y1={component.position.y - 15} x2={component.position.x + 15} y2={component.position.y - 15} stroke="green" strokeWidth="0.5" />
            <line x1={component.position.x - 55} y1={component.position.y - 5} x2={component.position.x + 15} y2={component.position.y - 5} stroke="green" strokeWidth="0.5" />
            <line x1={component.position.x - 55} y1={component.position.y + 5} x2={component.position.x + 15} y2={component.position.y + 5} stroke="green" strokeWidth="0.5" />
            <line x1={component.position.x - 55} y1={component.position.y + 15} x2={component.position.x + 15} y2={component.position.y + 15} stroke="green" strokeWidth="0.5" />
            <line x1={component.position.x - 55} y1={component.position.y + 25} x2={component.position.x + 15} y2={component.position.y + 25} stroke="green" strokeWidth="0.5" />
            
            {/* Center crosshair */}
            <line x1={component.position.x - 55} y1={component.position.y} x2={component.position.x + 15} y2={component.position.y} stroke="green" strokeWidth="1" />
            <line x1={component.position.x - 20} y1={component.position.y - 35} x2={component.position.x - 20} y2={component.position.y + 35} stroke="green" strokeWidth="1" />
            
            {/* Sample waveform */}
            <path d={`M${component.position.x - 50},${component.position.y} 
                      Q${component.position.x - 45},${component.position.y - 12} ${component.position.x - 40},${component.position.y}
                      Q${component.position.x - 35},${component.position.y + 12} ${component.position.x - 30},${component.position.y}
                      Q${component.position.x - 25},${component.position.y - 12} ${component.position.x - 20},${component.position.y}
                      Q${component.position.x - 15},${component.position.y + 12} ${component.position.x - 10},${component.position.y}
                      Q${component.position.x - 5},${component.position.y - 12} ${component.position.x},${component.position.y}
                      Q${component.position.x + 5},${component.position.y + 12} ${component.position.x + 10},${component.position.y}`} 
                  fill="none" stroke="yellow" strokeWidth="1.5" />
            
            {/* Control panel area on the right */}
            <rect x={component.position.x + 20} y={component.position.y - 35} width="35" height="70" fill="#f0f0f0" stroke="black" strokeWidth="1" />
            
            {/* Terminal labels */}
            <text x={component.position.x + 25} y={component.position.y - 20} textAnchor="start" fontSize="8" fill="black">GND</text>
            <text x={component.position.x + 25} y={component.position.y + 10} textAnchor="start" fontSize="8" fill="black">CH A</text>
            <text x={component.position.x + 25} y={component.position.y + 25} textAnchor="start" fontSize="8" fill="black">CH B</text>
            <text x={component.position.x + 45} y={component.position.y + 5} textAnchor="middle" fontSize="8" fill="black">IN</text>
            
            {/* Main label */}
            <text x={component.position.x - 20} y={component.position.y + 55} textAnchor="middle" fontSize="12" fill="black">Oscilloscope</text>
          </g>
        );
      case 'ammeter':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            {/* Ammeter body - circular */}
            <circle cx={component.position.x} cy={component.position.y} r="25" fill="white" stroke="black" strokeWidth="2" />
            
            {/* Connection lines */}
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 25} y2={component.position.y} stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 25} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            
            {/* Ammeter symbol - A */}
            <text x={component.position.x} y={component.position.y + 5} textAnchor="middle" fontSize="16" fontWeight="bold" fill="black">A</text>
            
            {/* Current reading display */}
            <text x={component.position.x} y={component.position.y - 35} textAnchor="middle" fontSize="10" fill="blue">
              {(component.value * 1000).toFixed(1)}mA
            </text>
            
            {/* Label */}
            <text x={component.position.x} y={component.position.y + 45} textAnchor="middle" fontSize="12">Ammeter</text>
          </g>
        );
      case 'voltmeter':
        return (
          <g transform={`rotate(${component.rotation}, ${component.position.x}, ${component.position.y})`}>
            {/* Voltmeter body - circular */}
            <circle cx={component.position.x} cy={component.position.y} r="25" fill="white" stroke="black" strokeWidth="2" />
            
            {/* Connection lines */}
            <line x1={component.position.x - 40} y1={component.position.y} x2={component.position.x - 25} y2={component.position.y} stroke="black" strokeWidth="2" />
            <line x1={component.position.x + 25} y1={component.position.y} x2={component.position.x + 40} y2={component.position.y} stroke="black" strokeWidth="2" />
            
            {/* Voltmeter symbol - V */}
            <text x={component.position.x} y={component.position.y + 5} textAnchor="middle" fontSize="16" fontWeight="bold" fill="black">V</text>
            
            {/* Voltage reading display */}
            <text x={component.position.x} y={component.position.y - 35} textAnchor="middle" fontSize="10" fill="red">
              {component.value.toFixed(2)}V
            </text>
            
            {/* Label */}
            <text x={component.position.x} y={component.position.y + 45} textAnchor="middle" fontSize="12">Voltmeter</text>
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

  // Handle component selection - use useCallback to prevent recreating function
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(component.id);
    
    // Only start dragging if component is selected
    if (selected) {
      setDragging(true);
      setDragOffset({
        x: e.clientX - component.position.x,
        y: e.clientY - component.position.y
      });
    }
  }, [component.id, component.position.x, component.position.y, onClick, selected]);

  // Move component while dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragging) {
      onMove(
        component.id,
        e.clientX - dragOffset.x,
        e.clientY - dragOffset.y
      );
    }
  }, [component.id, dragOffset.x, dragOffset.y, dragging, onMove]);

  // End dragging
  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Add and remove event listeners with proper cleanup
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      // Cleanup function to remove event listeners
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Draw terminal connection points
  const renderTerminals = () => {
    return component.terminals.map((terminal, index) => {
      // Special handling for oscilloscope terminals - make them more visible
      if (component.type === 'oscilloscope') {
        // Terminal colors for Electronics Workbench layout:
        // 0: Ground (black), 1: Channel A (red), 2: Channel B (blue), 3: Input (green)
        const colors = ['black', 'red', 'blue', 'green'];
        const isWireStart = wireMode && wireStartTerminal?.componentId === component.id && wireStartTerminal?.terminalIndex === index;
        
        return (
          <circle
            key={`terminal-${index}`}
            cx={terminal.x}
            cy={terminal.y}
            r={8}
            fill={colors[index] || '#999'}
            stroke={isWireStart ? 'yellow' : 'white'}
            strokeWidth={isWireStart ? 3 : 2}
            opacity={wireMode ? 1 : 0.8}
            style={{ cursor: wireMode ? 'crosshair' : 'default' }}
            onClick={(e) => {
              e.stopPropagation();
              if (onTerminalClick) {
                onTerminalClick(component.id, index);
              }
            }}
          />
        );
      }
      
      // Default terminal rendering for other components
      const isWireStart = wireMode && wireStartTerminal?.componentId === component.id && wireStartTerminal?.terminalIndex === index;
      
      return (
        <circle
          key={`terminal-${index}`}
          cx={terminal.x}
          cy={terminal.y}
          r={wireMode ? 7 : 5}
          fill={isWireStart ? 'yellow' : (isConnected ? "#4CAF50" : "#999")}
          stroke={isWireStart ? 'orange' : 'black'}
          strokeWidth={isWireStart ? 2 : 1}
          style={{ cursor: wireMode ? 'crosshair' : 'default' }}
          onClick={(e) => {
            e.stopPropagation();
            if (onTerminalClick) {
              onTerminalClick(component.id, index);
            }
          }}
        />
      );
    });
  };

  return (
    <g 
      className={`circuit-component ${selected ? 'selected' : ''} ${isConnected ? 'connected' : 'disconnected'}`} 
      onClick={(e) => e.stopPropagation()}
      onMouseDown={handleMouseDown}
      style={{ cursor: selected ? 'move' : 'pointer', opacity: isConnected ? 1 : 0.7 }}
    >
      {getComponentSymbol(component.type)}
      {renderTerminals()}
      {selected && (
        <rect 
          x={component.type === 'oscilloscope' ? component.position.x - 65 : component.position.x - 45} 
          y={component.type === 'oscilloscope' ? component.position.y - 45 : component.position.y - 45} 
          width={component.type === 'oscilloscope' ? 130 : 90} 
          height={component.type === 'oscilloscope' ? 90 : 90} 
          fill="none" 
          stroke="blue" 
          strokeWidth="2" 
          strokeDasharray="5,5" 
        />
      )}
    </g>
  );
}