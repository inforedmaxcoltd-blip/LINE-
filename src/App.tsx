import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Image as ImageIcon, X, Heart, AlertCircle, CheckCircle2, MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import { analyzeLineChat, AnalysisResult } from './services/gemini';

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/') || file.type === 'text/plain' || file.name.endsWith('.txt')
    );
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeLineChat(files);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      setError("分析中にエラーが発生しました。もう一度お試しください。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F7F6] text-slate-800 font-sans selection:bg-[#06C755] selection:text-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#06C755] rounded-xl flex items-center justify-center text-white">
              <MessageCircle size={20} className="fill-current" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">LINE相性診断</h1>
          </div>
          {result && (
            <button onClick={reset} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              最初からやり直す
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                  7日間のトークで<br className="md:hidden" />二人の相性を分析
                </h2>
                <p className="text-slate-500 max-w-lg mx-auto">
                  LINEのトーク履歴（テキストファイル）またはスクリーンショット画像をアップロードしてください。AIが二人のコミュニケーションを分析し、相性スコアを算出します。
                </p>
              </div>

              {/* Upload Area */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200
                    ${isDragging ? 'border-[#06C755] bg-[#06C755]/5' : 'border-slate-200 hover:border-[#06C755]/50 hover:bg-slate-50'}
                  `}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInput}
                    className="hidden"
                    multiple
                    accept="image/*,.txt,text/plain"
                  />
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                      <Upload size={28} />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-700">
                        ファイルを選択するか、ドラッグ＆ドロップ
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        テキストファイル (.txt) または画像 (.jpg, .png)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden">
                  <h3 className="font-medium text-slate-700 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#06C755]" />
                    アップロードされたファイル ({files.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {files.map((file, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 relative group">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                          {file.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                          <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex justify-center">
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full md:w-auto bg-[#06C755] hover:bg-[#05b34c] text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-[#06C755]/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 size={24} className="animate-spin" />
                          AIが分析中...
                        </>
                      ) : (
                        <>
                          <Sparkles size={24} />
                          相性を診断する
                        </>
                      )}
                    </button>
                  </div>
                  {error && (
                    <p className="text-red-500 text-center text-sm mt-2">{error}</p>
                  )}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Score Card */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#06C755]/20 to-transparent"></div>
                <div className="p-6 md:p-12 relative flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-6 relative z-10">
                    <Heart size={40} className={result.score >= 80 ? "text-pink-500 fill-pink-500" : "text-[#06C755] fill-[#06C755]"} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-500 mb-2">総合相性スコア</h2>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-6xl md:text-7xl font-black tracking-tighter text-slate-900">{result.score}</span>
                    <span className="text-2xl font-bold text-slate-400">/100</span>
                  </div>
                  <p className="text-lg text-slate-700 max-w-xl leading-relaxed">
                    {result.summary}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">二人の強み</h3>
                  </div>
                  <ul className="space-y-4">
                    {result.strengths.map((strength, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-700">
                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for improvement */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <AlertCircle size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">気をつけること</h3>
                  </div>
                  <ul className="space-y-4">
                    {result.areasForImprovement.map((area, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2.5" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Communication Style */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-10 shadow-lg">
                <h3 className="text-xl font-bold mb-6 md:mb-8 flex items-center gap-3">
                  <MessageCircle size={24} className="text-[#06C755]" />
                  コミュニケーションスタイル
                </h3>
                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                  {result.communicationStyle.map((style, idx) => (
                    <div key={idx} className="bg-white/10 rounded-2xl p-6 border border-white/5">
                      <div className="text-sm font-medium text-[#06C755] mb-2 tracking-wider">PERSON {idx + 1}</div>
                      <p className="text-slate-200 leading-relaxed">{style}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice */}
              <div className="bg-gradient-to-r from-[#06C755] to-emerald-400 rounded-3xl p-6 md:p-10 text-white shadow-lg text-center">
                <h3 className="text-xl font-bold mb-4">AIからのアドバイス</h3>
                <p className="text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                  「{result.advice}」
                </p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
