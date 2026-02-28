import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileJson, CheckCircle, XCircle, Cpu, Sparkles, Download } from 'lucide-react';
import { validateModel } from '../../lib/mlInference';
import { SAMPLE_MODELS } from '../../lib/sampleModels';

const SLOT_META = [
  { label: 'BNB Bull Agent', accent: '#f0b90b' },
  { label: 'BNB Bear Agent', accent: '#ef4444' },
  { label: 'BNB Diamond Hands', accent: '#627eea' },
];

export const ModelUploader = ({ onModelsReady }) => {
  const [slots, setSlots] = useState([null, null, null]);       // loaded model objects
  const [errors, setErrors] = useState([null, null, null]);
  const [dragging, setDragging] = useState([false, false, false]);
  const fileRefs = [useRef(null), useRef(null), useRef(null)];

  /* ── handle file read ─────────────────────────────────────────── */
  const handleFile = (file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const model = JSON.parse(e.target.result);
        const check = validateModel(model);
        if (!check.valid) {
          setErrors(prev => { const n = [...prev]; n[idx] = check.error; return n; });
          setSlots(prev =>  { const n = [...prev]; n[idx] = null; return n; });
          return;
        }
        // Assign the slot colour if not already set
        if (!model.color) model.color = SLOT_META[idx].accent;
        setSlots(prev =>  { const n = [...prev]; n[idx] = model; return n; });
        setErrors(prev => { const n = [...prev]; n[idx] = null; return n; });
      } catch {
        setErrors(prev => { const n = [...prev]; n[idx] = 'Invalid JSON file'; return n; });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    setDragging(prev => { const n = [...prev]; n[idx] = false; return n; });
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, idx);
  };

  /* ── load built-in sample models ──────────────────────────────── */
  const loadDefaults = () => {
    setSlots([...SAMPLE_MODELS]);
    setErrors([null, null, null]);
  };

  /* ── load real trained models from /sample-models/ ────────────── */
  const [loadingTrained, setLoadingTrained] = useState(false);
  const loadTrainedModels = async () => {
    setLoadingTrained(true);
    try {
      const urls = [
        '/sample-models/model1.json',
        '/sample-models/model2.json',
        '/sample-models/model3.json',
      ];
      const models = await Promise.all(
        urls.map(async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch ${url}`);
          return res.json();
        })
      );
      models.forEach((m, i) => {
        if (!m.color) m.color = SLOT_META[i].accent;
        validateModel(m); // auto-assigns name if missing
      });
      setSlots(models);
      setErrors([null, null, null]);
    } catch (e) {
      console.error('Failed to load trained models:', e);
      setErrors(['Failed to load', 'Failed to load', 'Failed to load']);
    } finally {
      setLoadingTrained(false);
    }
  };

  /* ── fire callback when all 3 ready ───────────────────────────── */
  const allReady = slots.every(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Cpu size={22} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Upload Model Weights</h3>
            <p className="text-sm text-gray-400">
              Drop 3 JSON weight files — or use built-in sample models
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadTrainedModels}
            disabled={loadingTrained}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 text-yellow-300 hover:from-yellow-500/30 hover:to-orange-500/30 transition cursor-pointer text-sm font-bold"
          >
            <Download size={16} /> {loadingTrained ? 'Loading…' : 'Load Trained Models'}
          </button>
          <button
            type="button"
            onClick={loadDefaults}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition cursor-pointer text-sm font-medium"
          >
            <Sparkles size={16} /> Load Demo Models
          </button>
        </div>
      </div>

      {/* 3 Upload Slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SLOT_META.map((meta, idx) => {
          const model = slots[idx];
          const err   = errors[idx];
          const isDragging = dragging[idx];

          return (
            <div key={idx}>
              <p className="text-xs font-semibold mb-2" style={{ color: meta.accent }}>
                {meta.label}
              </p>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(prev => { const n=[...prev]; n[idx]=true; return n; }); }}
                onDragLeave={() => setDragging(prev => { const n=[...prev]; n[idx]=false; return n; })}
                onDrop={(e) => handleDrop(e, idx)}
                onClick={() => fileRefs[idx].current?.click()}
                className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer min-h-[140px] flex flex-col items-center justify-center gap-2 ${
                  model
                    ? 'border-green-500/50 bg-green-500/5'
                    : isDragging
                    ? 'border-purple-400 bg-purple-500/10'
                    : 'border-gray-600 bg-dark/30 hover:border-gray-500'
                }`}
              >
                <input
                  ref={fileRefs[idx]}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleFile(e.target.files[0], idx)}
                />

                {model ? (
                  <>
                    <CheckCircle size={28} className="text-green-400" />
                    <p className="text-white font-semibold text-sm truncate max-w-full">{model.name}</p>
                    <p className="text-gray-400 text-xs">
                      {model.layers.length} layers · window {model.inputWindow || 10}
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={28} className="text-gray-500" />
                    <p className="text-gray-400 text-sm">Drop <code className="text-xs">.json</code> weights</p>
                  </>
                )}
              </div>

              {/* Error */}
              <AnimatePresence>
                {err && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-400 text-xs mt-1 flex items-center gap-1"
                  >
                    <XCircle size={12} /> {err}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Start Button */}
      <div className="flex justify-center pt-2">
        <motion.button
          type="button"
          disabled={!allReady}
          whileHover={allReady ? { scale: 1.04 } : {}}
          whileTap={allReady ? { scale: 0.96 } : {}}
          onClick={() => allReady && onModelsReady(slots)}
          className={`px-8 py-3 rounded-xl font-bold text-lg transition cursor-pointer ${
            allReady
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          ⚔️ Start Arena Battle
        </motion.button>
      </div>

      {/* Format hint */}
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer hover:text-gray-300 transition">
          Weight file format reference
        </summary>
        <pre className="mt-2 p-3 bg-dark/50 rounded-lg overflow-x-auto text-gray-400 leading-relaxed">
{`{
  "name": "My Model",
  "description": "...",
  "inputWindow": 10,
  "layers": [
    {
      "weights": [[w, ...], ...],   // shape [inputDim, outputDim]
      "bias": [b, ...],             // shape [outputDim]
      "activation": "relu"          // relu | sigmoid | tanh | softmax | linear
    },
    ...
    {
      "weights": [[...]], "bias": [b1, b2, b3],
      "activation": "softmax"       // last layer → 3 outputs: [buy, sell, hold]
    }
  ]
}`}
        </pre>
      </details>
    </motion.div>
  );
};
