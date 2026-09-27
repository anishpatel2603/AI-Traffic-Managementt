import React, { useState } from 'react';
import { PYTHON_PROJECT_FILES, PythonFileItem } from '../utils/pythonProjectFiles';
import { X, Code2, Download, Copy, Check, Terminal, FileCode, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<PythonFileItem>(PYTHON_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Add each file to zip
      for (const f of PYTHON_PROJECT_FILES) {
        zip.file(f.path, f.content);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ai_smart_traffic_signal_project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Complete Python & Streamlit Source Code
              </h2>
              <p className="text-xs text-slate-400">
                Standalone runnable code for student laptop (YOLOv8 + OpenCV + Streamlit)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Download className="w-3.5 h-3.5" />
              {isZipping ? 'Generating ZIP...' : 'Download Project (.zip)'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area: Sidebar files list + Code viewer */}
        <div className="flex-1 flex overflow-hidden">
          {/* File selector sidebar */}
          <div className="w-64 border-r border-slate-800 bg-slate-950/40 p-3 space-y-1 overflow-y-auto">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Project Files
            </div>
            {PYTHON_PROJECT_FILES.map((file) => (
              <button
                key={file.path}
                onClick={() => {
                  setSelectedFile(file);
                  setCopied(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                  selectedFile.path === file.path
                    ? 'bg-slate-800 text-sky-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <FileCode className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}

            {/* Quick terminal instructions box */}
            <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Terminal className="w-3.5 h-3.5" />
                Quick Local Run:
              </div>
              <div className="bg-slate-950 p-1.5 rounded font-mono-numbers text-[10px] text-slate-300 select-all">
                pip install -r requirements.txt
              </div>
              <div className="bg-slate-950 p-1.5 rounded font-mono-numbers text-[10px] text-slate-300 select-all">
                streamlit run app.py
              </div>
            </div>
          </div>

          {/* Main Code View */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            {/* File info bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800">
              <div className="text-xs text-slate-300">
                <strong className="text-slate-100 font-mono-numbers">{selectedFile.path}</strong>
                <span className="text-slate-500 mx-2">·</span>
                <span className="text-slate-400">{selectedFile.description}</span>
              </div>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            {/* Code container */}
            <pre className="flex-1 p-4 overflow-auto text-xs font-mono-numbers text-slate-200 leading-relaxed bg-[#0b0f19]">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
