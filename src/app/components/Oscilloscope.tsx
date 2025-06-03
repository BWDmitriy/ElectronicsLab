'use client';

import { useState, useEffect, useRef } from 'react';
import { SimulationResult } from '../lib/circuitSimulator';

type TimeUnit = 'ns' | 'µs' | 'ms' | 's';
type VoltageUnit = 'µV' | 'mV' | 'V' | 'kV';

interface TimeScale {
  value: number;
  unit: TimeUnit;
  label: string;
}

interface VoltageScale {
  value: number;
  unit: VoltageUnit;
  label: string;
}

interface OscilloscopeProps {
  simulationResult: SimulationResult | null;
  nodeIds: string[];
  colors?: string[];
  width?: number;
  height?: number;
  availableProbes?: Array<{id: string, label: string}>;
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

// Available time scales
const TIME_SCALES: TimeScale[] = [
  { value: 1, unit: 's', label: '1 s' },
  { value: 0.5, unit: 's', label: '0.5 s' },
  { value: 0.2, unit: 's', label: '0.2 s' },
  { value: 0.1, unit: 's', label: '0.1 s' },
  { value: 0.05, unit: 's', label: '0.05 s' },
  { value: 0.02, unit: 's', label: '0.02 s' },
  { value: 0.01, unit: 's', label: '0.01 s' },
  { value: 5, unit: 'ms', label: '5 ms' },
  { value: 2, unit: 'ms', label: '2 ms' },
  { value: 1, unit: 'ms', label: '1 ms' },
  { value: 0.5, unit: 'ms', label: '0.5 ms' },
  { value: 0.2, unit: 'ms', label: '0.2 ms' },
  { value: 0.1, unit: 'ms', label: '0.1 ms' },
  { value: 0.05, unit: 'ms', label: '0.05 ms' },
  { value: 0.02, unit: 'ms', label: '0.02 ms' },
  { value: 0.01, unit: 'ms', label: '0.01 ms' },
  { value: 5, unit: 'µs', label: '5 µs' },
  { value: 2, unit: 'µs', label: '2 µs' },
  { value: 1, unit: 'µs', label: '1 µs' },
  { value: 0.5, unit: 'µs', label: '0.5 µs' },
  { value: 0.2, unit: 'µs', label: '0.2 µs' },
  { value: 0.1, unit: 'µs', label: '0.1 µs' },
  { value: 0.05, unit: 'µs', label: '0.05 µs' },
  { value: 0.02, unit: 'µs', label: '0.02 µs' },
  { value: 0.01, unit: 'µs', label: '0.01 µs' },
  { value: 5, unit: 'ns', label: '5 ns' },
  { value: 2, unit: 'ns', label: '2 ns' },
  { value: 1, unit: 'ns', label: '1 ns' },
  { value: 0.5, unit: 'ns', label: '0.5 ns' },
  { value: 0.2, unit: 'ns', label: '0.2 ns' },
  { value: 0.1, unit: 'ns', label: '0.1 ns' }
];

// Available voltage scales
const VOLTAGE_SCALES: VoltageScale[] = [
  { value: 5, unit: 'kV', label: '5 kV' },
  { value: 2, unit: 'kV', label: '2 kV' },
  { value: 1, unit: 'kV', label: '1 kV' },
  { value: 500, unit: 'V', label: '500 V' },
  { value: 200, unit: 'V', label: '200 V' },
  { value: 100, unit: 'V', label: '100 V' },
  { value: 50, unit: 'V', label: '50 V' },
  { value: 20, unit: 'V', label: '20 V' },
  { value: 10, unit: 'V', label: '10 V' },
  { value: 5, unit: 'V', label: '5 V' },
  { value: 2, unit: 'V', label: '2 V' },
  { value: 1, unit: 'V', label: '1 V' },
  { value: 500, unit: 'mV', label: '500 mV' },
  { value: 200, unit: 'mV', label: '200 mV' },
  { value: 100, unit: 'mV', label: '100 mV' },
  { value: 50, unit: 'mV', label: '50 mV' },
  { value: 20, unit: 'mV', label: '20 mV' },
  { value: 10, unit: 'mV', label: '10 mV' },
  { value: 5, unit: 'mV', label: '5 mV' },
  { value: 2, unit: 'mV', label: '2 mV' },
  { value: 1, unit: 'mV', label: '1 mV' },
  { value: 500, unit: 'µV', label: '500 µV' },
  { value: 200, unit: 'µV', label: '200 µV' },
  { value: 100, unit: 'µV', label: '100 µV' },
  { value: 50, unit: 'µV', label: '50 µV' },
  { value: 20, unit: 'µV', label: '20 µV' },
  { value: 10, unit: 'µV', label: '10 µV' }
];

export default function Oscilloscope({ 
  simulationResult, 
  nodeIds,
  colors = DEFAULT_COLORS,
  width = 800,
  height = 400,
  availableProbes = []
}: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Updated scale states
  const [selectedTimeScale, setSelectedTimeScale] = useState<TimeScale>(TIME_SCALES[10]); // Default to 1ms
  const [selectedVoltageScale, setSelectedVoltageScale] = useState<VoltageScale>(VOLTAGE_SCALES[9]); // Default to 5V
  const [offsetTime, setOffsetTime] = useState(0);
  const [offsetVoltage, setOffsetVoltage] = useState(0);

  // Time unit conversion factors
  const timeUnitFactors: Record<TimeUnit, number> = {
    'ns': 1e-9,
    'µs': 1e-6,
    'ms': 1e-3,
    's': 1
  };

  // Voltage unit conversion factors
  const voltageUnitFactors: Record<VoltageUnit, number> = {
    'µV': 1e-6,
    'mV': 1e-3,
    'V': 1,
    'kV': 1e3
  };
  
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
                selectedTimeScale, selectedVoltageScale, offsetTime, offsetVoltage);
    
    // Draw frame
    drawFrame(ctx, canvas.width, canvas.height);
    
  }, [simulationResult, nodeIds, colors, width, height, selectedTimeScale, selectedVoltageScale, offsetTime, offsetVoltage]);
  
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
  
  // Updated drawSignals function
  const drawSignals = (
    ctx: CanvasRenderingContext2D,
    result: SimulationResult,
    nodeIds: string[],
    colors: string[],
    width: number,
    height: number,
    timeScale: TimeScale,
    voltageScale: VoltageScale,
    offsetTime: number,
    offsetVoltage: number
  ) => {
    if (!result.time.length) return;
    
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
    
    if (maxVoltage === 0) return;
    
    // Scale for value to pixel conversion with unit factors
    const timeToX = (t: number) => {
      const normalizedTime = (t - result.time[0]) / (result.time[result.time.length - 1] - result.time[0]);
      const scaledTime = normalizedTime * timeScale.value * timeUnitFactors[timeScale.unit];
      return (scaledTime * width) + (width/2) * (1 - timeScale.value) - (offsetTime * width);
    };
    
    const valueToY = (value: number) => {
      const scaledValue = value * voltageScale.value * voltageUnitFactors[voltageScale.unit];
      return centerY - (scaledValue * (height/2) / maxVoltage) - (offsetVoltage * height);
    };
    
    // Draw each signal
    nodeIds.forEach((nodeId, index) => {
      const signal = result.signals[nodeId];
      if (!signal) return;
      
      ctx.save();
      ctx.strokeStyle = colors[index % colors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      
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
      
      {simulationResult && (
        <div className="mb-4 px-3 py-2 bg-gray-800 rounded text-xs text-gray-300">
          <div className="mb-1">
            <span className="font-bold">Circuit Analysis:</span> {
              simulationResult.analysisResults.hasConnectivity 
                ? `${simulationResult.analysisResults.connectedComponents.size} connected components` 
                : 'No connected components detected'
            }
          </div>
          {simulationResult.analysisResults.analyzedCircuit.groundNodeId && (
            <div>
              <span className="font-bold">Ground Reference:</span> Found
            </div>
          )}
        </div>
      )}
      
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
        
        {simulationResult && nodeIds.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            No probes selected. Select components to view waveforms.
          </div>
        )}
        
        {simulationResult && !simulationResult.analysisResults.hasConnectivity && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-500 bg-black bg-opacity-80 p-4">
            <span className="text-xl mb-2">⚠️ No connected circuit detected</span>
            <p className="text-center max-w-md text-sm">
              Components need to be connected to form a complete circuit.
              Connect components by placing their terminals close together or adding wires.
            </p>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 mt-4">
        <div className="flex flex-col">
          <label className="text-sm text-gray-300">Time Scale</label>
          <select 
            value={TIME_SCALES.indexOf(selectedTimeScale)}
            onChange={(e) => setSelectedTimeScale(TIME_SCALES[parseInt(e.target.value)])}
            className="bg-gray-700 text-gray-200 rounded px-2 py-1"
          >
            {TIME_SCALES.map((scale, index) => (
              <option key={scale.label} value={index}>
                {scale.label}/div
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-gray-300">Voltage Scale</label>
          <select 
            value={VOLTAGE_SCALES.indexOf(selectedVoltageScale)}
            onChange={(e) => setSelectedVoltageScale(VOLTAGE_SCALES[parseInt(e.target.value)])}
            className="bg-gray-700 text-gray-200 rounded px-2 py-1"
          >
            {VOLTAGE_SCALES.map((scale, index) => (
              <option key={scale.label} value={index}>
                {scale.label}/div
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-gray-300">Time Position</label>
          <input 
            type="range" 
            min="-5" 
            max="5" 
            step="0.1"
            value={offsetTime}
            onChange={(e) => setOffsetTime(parseFloat(e.target.value))}
            className="w-32"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="text-sm text-gray-300">Voltage Position</label>
          <input 
            type="range" 
            min="-5" 
            max="5" 
            step="0.1"
            value={offsetVoltage}
            onChange={(e) => setOffsetVoltage(parseFloat(e.target.value))}
            className="w-32"
          />
        </div>
      </div>
      
      {/* Signal legend */}
      {nodeIds.length > 0 && simulationResult && (
        <div className="mt-4">
          <h3 className="text-sm font-bold mb-2 text-gray-300">Channels</h3>
          <div className="flex flex-wrap gap-4">
            {nodeIds.map((nodeId, index) => {
              const isConnected = simulationResult.analysisResults.connectedComponents.has(nodeId);
              const probe = availableProbes.find(p => p.id === nodeId);
              const label = probe?.label || `Channel ${index + 1}`;
              
              return (
                <div key={nodeId} className="flex items-center">
                  <div 
                    className="w-4 h-4 mr-2" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className={`text-sm ${isConnected ? 'text-gray-300' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 