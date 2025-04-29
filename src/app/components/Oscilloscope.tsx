'use client';

import { useState, useEffect, useRef } from 'react';
import { SimulationResult } from '../lib/circuitSimulator';

interface OscilloscopeProps {
  simulationResult: SimulationResult | null;
  nodeIds: string[];
  colors?: string[];
  width?: number;
  height?: number;
}

// Default colors for oscilloscope channels
const DEFAULT_COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
];

export default function Oscilloscope({ 
  simulationResult, 
  nodeIds,
  colors = DEFAULT_COLORS,
  width = 800,
  height = 400
}: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timeScale, setTimeScale] = useState(1.0);
  const [voltageScale, setVoltageScale] = useState(1.0);
  const [offsetTime, setOffsetTime] = useState(0);
  const [offsetVoltage, setOffsetVoltage] = useState(0);
  
  // Draw the oscilloscope display
  useEffect(() => {
    if (!canvasRef.current || !simulationResult) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);
    
    // Draw signals
    drawSignals(ctx, simulationResult, nodeIds, colors, canvas.width, canvas.height, 
                timeScale, voltageScale, offsetTime, offsetVoltage);
    
    // Draw frame
    drawFrame(ctx, canvas.width, canvas.height);
    
  }, [simulationResult, nodeIds, colors, width, height, timeScale, voltageScale, offsetTime, offsetVoltage]);
  
  // Draw the grid on the oscilloscope
  const drawGrid = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number
  ) => {
    ctx.save();
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 0.5;
    
    // Draw horizontal grid lines
    const horizontalLines = 10;
    for (let i = 0; i <= horizontalLines; i++) {
      const y = i * (height / horizontalLines);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw vertical grid lines
    const verticalLines = 10;
    for (let i = 0; i <= verticalLines; i++) {
      const x = i * (width / verticalLines);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw center lines
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    
    ctx.restore();
  };
  
  // Draw the signals on the oscilloscope
  const drawSignals = (
    ctx: CanvasRenderingContext2D,
    result: SimulationResult,
    nodeIds: string[],
    colors: string[],
    width: number,
    height: number,
    timeScale: number,
    voltageScale: number,
    offsetTime: number,
    offsetVoltage: number
  ) => {
    if (!result.time.length) return;
    
    // Center of the oscilloscope
    const centerY = height / 2;
    
    // Find max voltage for scaling
    let maxVoltage = 0;
    for (const nodeId of nodeIds) {
      const signal = result.signals[nodeId];
      if (signal) {
        const signalMax = Math.max(...signal.map(Math.abs));
        maxVoltage = Math.max(maxVoltage, signalMax);
      }
    }
    
    // If no signal, don't try to draw
    if (maxVoltage === 0) return;
    
    // Scale for value to pixel conversion
    const timeToX = (t: number) => {
      const normalizedTime = (t - result.time[0]) / (result.time[result.time.length - 1] - result.time[0]);
      return (normalizedTime * width * timeScale) + (width/2) * (1 - timeScale) - (offsetTime * width);
    };
    
    const valueToY = (value: number) => {
      // Normalize and scale the value, and invert Y (canvas Y grows downward)
      return centerY - (value * (height/2) / maxVoltage * voltageScale) - (offsetVoltage * height);
    };
    
    // Draw each signal
    nodeIds.forEach((nodeId, index) => {
      const signal = result.signals[nodeId];
      if (!signal) return;
      
      ctx.save();
      ctx.strokeStyle = colors[index % colors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Plot the signal
      for (let i = 0; i < result.time.length; i++) {
        const x = timeToX(result.time[i]);
        const y = valueToY(signal[i]);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      ctx.restore();
    });
  };
  
  // Draw the frame around the oscilloscope
  const drawFrame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = '#AAAAAA';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
    ctx.restore();
  };
  
  // Render the oscilloscope controls and display
  return (
    <div className="flex flex-col p-4 border rounded-lg bg-gray-900 shadow-lg w-full max-w-full overflow-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-200">Oscilloscope</h2>
      
      <div className="relative">
        <canvas 
          ref={canvasRef}
          width={width} 
          height={height}
          className="bg-black rounded-md"
        />
        
        {!simulationResult && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            Run simulation to see signals
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 mt-4">
        <div className="flex flex-col">
          <label htmlFor="timeScale" className="text-sm text-gray-300">Time Scale</label>
          <input 
            id="timeScale"
            type="range" 
            min="0.1" 
            max="3" 
            step="0.1"
            value={timeScale}
            onChange={(e) => setTimeScale(parseFloat(e.target.value))}
            className="w-32"
          />
        </div>
        
        <div className="flex flex-col">
          <label htmlFor="voltageScale" className="text-sm text-gray-300">Voltage Scale</label>
          <input 
            id="voltageScale"
            type="range" 
            min="0.1" 
            max="3" 
            step="0.1"
            value={voltageScale}
            onChange={(e) => setVoltageScale(parseFloat(e.target.value))}
            className="w-32"
          />
        </div>
        
        <div className="flex flex-col">
          <label htmlFor="offsetTime" className="text-sm text-gray-300">Time Position</label>
          <input 
            id="offsetTime"
            type="range" 
            min="-0.5" 
            max="0.5" 
            step="0.01"
            value={offsetTime}
            onChange={(e) => setOffsetTime(parseFloat(e.target.value))}
            className="w-32"
          />
        </div>
        
        <div className="flex flex-col">
          <label htmlFor="offsetVoltage" className="text-sm text-gray-300">Voltage Position</label>
          <input 
            id="offsetVoltage"
            type="range" 
            min="-0.5" 
            max="0.5" 
            step="0.01"
            value={offsetVoltage}
            onChange={(e) => setOffsetVoltage(parseFloat(e.target.value))}
            className="w-32"
          />
        </div>
      </div>
      
      {/* Signal legend */}
      {nodeIds.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold mb-2 text-gray-300">Channels</h3>
          <div className="flex flex-wrap gap-4">
            {nodeIds.map((nodeId, index) => (
              <div key={nodeId} className="flex items-center">
                <div 
                  className="w-4 h-4 mr-2" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm text-gray-300">Channel {index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 