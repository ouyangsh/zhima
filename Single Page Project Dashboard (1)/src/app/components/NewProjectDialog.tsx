import { X, Upload, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: {
    title: string;
    description: string;
    category: string;
  }) => void;
}

export function NewProjectDialog({
  isOpen,
  onClose,
  onSubmit,
}: NewProjectDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("scarf");
  const [totalRows, setTotalRows] = useState("");
  const [currentRow, setCurrentRow] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, category });
    setTitle("");
    setDescription("");
    setCategory("scarf");
    setTotalRows("");
    setCurrentRow("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E0E0E0]">
          <h2 className="text-[#3A3A3A]">新建项目</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F8E5C8] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[#666666]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-sm text-[#666666] mb-2">
                项目名称
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="为你的作品起个名字"
                className="w-full h-11 px-4 rounded-lg border border-[#E0E0E0] text-[#3A3A3A] focus:outline-none focus:border-[#6C8EA4]"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-[#666666] mb-2">
                项目描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述一下这个项目..."
                className="w-full h-24 px-4 py-3 rounded-lg border border-[#E0E0E0] text-[#3A3A3A] focus:outline-none focus:border-[#6C8EA4] resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm text-[#666666] mb-2">
                项目类型
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-[#E0E0E0] text-[#3A3A3A] focus:outline-none focus:border-[#6C8EA4]"
              >
                <option value="scarf">围巾</option>
                <option value="sweater">毛衣</option>
                <option value="blanket">毯子</option>
                <option value="hat">帽子</option>
                <option value="socks">袜子</option>
                <option value="other">其他</option>
              </select>
            </div>

            {/* Row Count */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#666666] mb-2">
                  总行数
                </label>
                <input
                  type="number"
                  value={totalRows}
                  onChange={(e) => setTotalRows(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-11 px-4 rounded-lg border border-[#E0E0E0] text-[#3A3A3A] focus:outline-none focus:border-[#6C8EA4]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#666666] mb-2">
                  当前行数
                </label>
                <input
                  type="number"
                  value={currentRow}
                  onChange={(e) => setCurrentRow(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full h-11 px-4 rounded-lg border border-[#E0E0E0] text-[#3A3A3A] focus:outline-none focus:border-[#6C8EA4]"
                />
              </div>
            </div>

            {/* Import Pattern */}
            <div>
              <label className="block text-sm text-[#666666] mb-2">
                导入图解（可选）
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="h-24 rounded-lg border-2 border-dashed border-[#E0E0E0] flex flex-col items-center justify-center gap-2 hover:border-[#6C8EA4] hover:bg-[#F8E5C8]/20 transition-colors"
                >
                  <Upload className="w-6 h-6 text-[#999999]" />
                  <span className="text-xs text-[#999999]">从文件导入</span>
                </button>
                <button
                  type="button"
                  className="h-24 rounded-lg border-2 border-dashed border-[#E0E0E0] flex flex-col items-center justify-center gap-2 hover:border-[#6C8EA4] hover:bg-[#F8E5C8]/20 transition-colors"
                >
                  <ImageIcon className="w-6 h-6 text-[#999999]" />
                  <span className="text-xs text-[#999999]">从相册导入</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[#E0E0E0] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-[#6C8EA4] text-[#6C8EA4] hover:bg-[#F8E5C8]/20 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 h-11 rounded-full bg-[#6C8EA4] text-white hover:bg-[#5A7A91] transition-colors"
          >
            创建项目
          </button>
        </div>
      </div>
    </div>
  );
}