import { ChevronLeft, Upload, Plus, Minus, Play, Pause, RotateCcw, FileText, Send, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface Note {
  id: string;
  content: string;
  timestamp: string;
}

interface ProjectDetailPageProps {
  project: {
    id: string;
    title: string;
    description: string;
    progress: number;
    imageUrl: string;
    lastUpdate: string;
    yarnColors: string[];
    totalRows?: number;
    currentRow?: number;
  };
  onBack: () => void;
}

export function ProjectDetailPage({ project, onBack }: ProjectDetailPageProps) {
  const [currentRow, setCurrentRow] = useState(project.currentRow || 0);
  const [totalRows, setTotalRows] = useState(project.totalRows || 100);
  const [stitchCount, setStitchCount] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [noteInput, setNoteInput] = useState("");
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      content: "第一次尝试这个花样，记得在第15行换线",
      timestamp: "2024-02-10 14:30",
    },
  ]);

  // 计时器逻辑
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const progress = totalRows > 0 ? Math.round((currentRow / totalRows) * 100) : 0;

  const handleRowIncrement = () => {
    if (currentRow < totalRows) {
      setCurrentRow(currentRow + 1);
    }
  };

  const handleRowDecrement = () => {
    if (currentRow > 0) {
      setCurrentRow(currentRow - 1);
    }
  };

  const handleStitchIncrement = () => {
    setStitchCount(stitchCount + 1);
  };

  const handleStitchDecrement = () => {
    if (stitchCount > 0) {
      setStitchCount(stitchCount - 1);
    }
  };

  const handleStitchReset = () => {
    setStitchCount(0);
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddNote = () => {
    if (noteInput.trim()) {
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      
      const newNote: Note = {
        id: Date.now().toString(),
        content: noteInput.trim(),
        timestamp,
      };
      
      setNotes([newNote, ...notes]);
      setNoteInput("");
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
  };

  return (
    <div className="h-full flex flex-col bg-[#FAF9F6]">
      {/* 顶部导航栏 */}
      <div className="h-14 bg-white border-b border-[#E0E0E0] flex items-center px-4 gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full hover:bg-[#F8E5C8] flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-[#6C8EA4]" />
        </button>
        <h1 className="flex-1 text-[#3A3A3A] truncate">{project.title}</h1>
      </div>

      {/* 内容区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto">
        {/* 项目概览 */}
        <div className="bg-white p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            {project.yarnColors.map((color, index) => (
              <div
                key={index}
                className="w-7 h-7 rounded-full border-2 border-[#E0E0E0]"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="text-sm text-[#666666] mb-4">{project.description}</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#666666]">总进度</span>
            <span className="text-[#6C8EA4]">{progress}%</span>
          </div>
          <div className="h-2 bg-[#FAF9F6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5BB98A] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 图解展示区 */}
        <div className="bg-white p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#3A3A3A]">编织图解</h3>
            <button className="text-sm text-[#6C8EA4] hover:underline">
              更换
            </button>
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#FAF9F6] border-2 border-dashed border-[#E0E0E0]">
            <ImageWithFallback
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover"
            />
            {/* 进度标记叠加层 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-center pb-4">
              <div className="bg-white/95 backdrop-blur-md rounded-full px-5 py-2.5 shadow-lg">
                <span className="text-lg text-[#6C8EA4]">{currentRow}</span>
                <span className="text-[#999999] mx-1.5">/</span>
                <span className="text-[#666666]">{totalRows} 行</span>
              </div>
            </div>
          </div>
          <button className="w-full mt-3 h-12 rounded-xl border-2 border-dashed border-[#6C8EA4] text-[#6C8EA4] flex items-center justify-center gap-2 hover:bg-[#F8E5C8]/30 transition-colors">
            <Upload className="w-5 h-5" />
            <span>导入图解（PDF/图片）</span>
          </button>
        </div>

        {/* 行数计数器 */}
        <div className="bg-white p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#666666]">当前行数</span>
            <span className="text-xs text-[#999999]">目标 {totalRows} 行</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRowDecrement}
              className="w-16 h-16 rounded-full bg-[#FAF9F6] border-2 border-[#E0E0E0] flex items-center justify-center hover:bg-[#F8E5C8] hover:border-[#F8E5C8] transition-all active:scale-95"
            >
              <Minus className="w-7 h-7 text-[#6C8EA4]" />
            </button>
            <div className="flex-1 text-center">
              <div className="text-5xl text-[#6C8EA4] tabular-nums font-medium">{currentRow}</div>
              <div className="text-xs text-[#999999] mt-1">行</div>
            </div>
            <button
              onClick={handleRowIncrement}
              className="w-16 h-16 rounded-full bg-[#6C8EA4] flex items-center justify-center hover:bg-[#5A7A91] transition-all active:scale-95 shadow-md"
            >
              <Plus className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>

        {/* 针数计数器和计时器 */}
        <div className="bg-white p-4 mb-3">
          <h3 className="text-[#3A3A3A] mb-3">辅助工具</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* 针数计数器 */}
            <div className="bg-[#FAF9F6] rounded-xl p-4 border border-[#E0E0E0]">
              <div className="text-xs text-[#999999] mb-3 text-center">针数计数</div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <button
                  onClick={handleStitchDecrement}
                  className="w-10 h-10 rounded-full bg-white border border-[#E0E0E0] flex items-center justify-center hover:bg-[#F8E5C8] transition-colors active:scale-95"
                >
                  <Minus className="w-5 h-5 text-[#666666]" />
                </button>
                <div className="text-2xl text-[#6C8EA4] tabular-nums font-medium">{stitchCount}</div>
                <button
                  onClick={handleStitchIncrement}
                  className="w-10 h-10 rounded-full bg-[#6C8EA4] flex items-center justify-center hover:bg-[#5A7A91] transition-colors active:scale-95"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>
              <button
                onClick={handleStitchReset}
                className="w-full text-xs text-[#999999] hover:text-[#6C8EA4] transition-colors flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                重置
              </button>
            </div>

            {/* 计时器 */}
            <div className="bg-[#FAF9F6] rounded-xl p-4 border border-[#E0E0E0]">
              <div className="text-xs text-[#999999] mb-3 text-center">编织计时</div>
              <div className="text-xl text-[#6C8EA4] text-center mb-3 font-mono tabular-nums">
                {formatTime(timerSeconds)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleTimer}
                  className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                    isTimerRunning
                      ? "bg-[#FF8C82] hover:bg-[#FF7A6E]"
                      : "bg-[#5BB98A] hover:bg-[#4AA879]"
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-4 h-4 text-white" />
                      <span className="text-xs text-white">暂停</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-white" />
                      <span className="text-xs text-white">开始</span>
                    </>
                  )}
                </button>
                <button
                  onClick={resetTimer}
                  className="w-9 h-9 rounded-lg bg-white border border-[#E0E0E0] flex items-center justify-center hover:bg-[#FAF9F6] transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-[#999999]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 笔记区域 - 最底部 */}
        <div className="bg-white p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#3A3A3A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#6C8EA4]" />
              项目笔记
              {notes.length > 0 && (
                <span className="text-xs text-white bg-[#6C8EA4] px-2 py-0.5 rounded-full">
                  {notes.length}
                </span>
              )}
            </h3>
          </div>

          {/* 笔记输入框 */}
          <div className="mb-4">
            <div className="relative">
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="记录编织心得、花样调整、材料变更..."
                className="w-full h-24 px-4 py-3 pr-14 rounded-xl border border-[#E0E0E0] text-[#3A3A3A] focus:outline-none focus:border-[#6C8EA4] focus:ring-2 focus:ring-[#6C8EA4]/20 resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleAddNote();
                  }
                }}
              />
              <button
                onClick={handleAddNote}
                disabled={!noteInput.trim()}
                className={`absolute right-3 bottom-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  noteInput.trim()
                    ? "bg-[#6C8EA4] hover:bg-[#5A7A91] text-white active:scale-95"
                    : "bg-[#E0E0E0] text-[#999999]"
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-[#999999] mt-2">
              提示：按 Cmd/Ctrl + Enter 快速发送
            </div>
          </div>

          {/* 笔记列表 */}
          {notes.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs text-[#999999] mb-2">
                共 {notes.length} 条笔记
              </div>
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-[#FAF9F6] rounded-xl p-4 border border-[#E0E0E0] hover:border-[#6C8EA4]/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs text-[#999999]">{note.timestamp}</span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-xs text-[#FF8C82] hover:text-[#FF7A6E] flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      删除
                    </button>
                  </div>
                  <p className="text-sm text-[#3A3A3A] leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-[#999999] bg-[#FAF9F6] rounded-xl border border-[#E0E0E0]">
              <FileText className="w-12 h-12 text-[#E0E0E0] mx-auto mb-2" />
              还没有笔记，开始记录你的编织心得吧
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
