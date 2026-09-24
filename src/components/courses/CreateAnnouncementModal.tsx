import React, { useState } from 'react';
import { X, Megaphone, Globe, Layers, Send } from 'lucide-react';
import { Course } from '../../types';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  currentSec: string;
  availableSections: string[];
  onSubmit: (title: string, content: string, scope: 'SEC' | 'ALL_SEC', secId: string) => Promise<void>;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  course,
  currentSec,
  availableSections,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<'SEC' | 'ALL_SEC'>('ALL_SEC');
  const [selectedSec, setSelectedSec] = useState(
    currentSec && currentSec !== 'ALL_SEC' && currentSec !== 'All Sections'
      ? currentSec
      : (availableSections[0] || 'SEC 1')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(title.trim(), content.trim(), scope, scope === 'ALL_SEC' ? 'ALL_SEC' : selectedSec);
      setTitle('');
      setContent('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl flex flex-col gap-4 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">สร้างประกาศรายวิชา (Announcement)</h3>
              <p className="text-xs text-slate-500">วิชา {course.code} - {course.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Scope Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              กลุ่มเป้าหมายของประกาศ (Scope):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('ALL_SEC')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  scope === 'ALL_SEC'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-blue-950'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <Globe className={`w-4 h-4 mt-0.5 shrink-0 ${scope === 'ALL_SEC' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold">All SEC (ทุกกลุ่ม)</p>
                  <p className="text-[10px] text-slate-500">นักศึกษาทุกกลุ่มเรียนเห็นประกาศนี้</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('SEC')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  scope === 'SEC'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-blue-950'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <Layers className={`w-4 h-4 mt-0.5 shrink-0 ${scope === 'SEC' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold">เฉพาะกลุ่ม (Specific SEC)</p>
                  <p className="text-[10px] text-slate-500">เฉพาะนักศึกษาใน SEC ที่เลือก</p>
                </div>
              </button>
            </div>
          </div>

          {/* If Specific SEC is selected */}
          {scope === 'SEC' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                เลือก SEC ที่ต้องการประกาศ:
              </label>
              <select
                value={selectedSec}
                onChange={(e) => setSelectedSec(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
              >
                {availableSections.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              หัวข้อประกาศ: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น แจ้งกำหนดการส่งงานสัปดาห์นี้, ข้อมูลห้องเรียน..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              เนื้อหาประกาศ: <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เขียนรายละเอียดประกาศที่นี่..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'กำลังประกาศ...' : 'เผยแพร่ประกาศ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
