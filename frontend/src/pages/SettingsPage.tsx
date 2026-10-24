import React, { useState } from 'react';
import { Settings, Save, Shield, Sliders } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [riskWeight, setRiskWeight] = useState(70);
  const [randomWeight, setRandomWeight] = useState(30);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          System Configuration & AI Model Hyperparameters
        </h1>
        <p className="text-sm text-slate-500">Configure surprise dispatch weights, compliance thresholds, and integration gateways.</p>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6 text-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-1">Surprise Engine Tuning</h2>
          <p className="text-slate-500">Balance deterministic risk weighting against non-predictable sampling.</p>
          
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Risk Factor Influence ({riskWeight}%)</span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                value={riskWeight}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRiskWeight(val);
                  setRandomWeight(100 - val);
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Randomization Factor ({randomWeight}%)</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                value={randomWeight}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRandomWeight(val);
                  setRiskWeight(100 - val);
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => alert('Configuration saved to runtime environment.')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Persist Hyperparameters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
