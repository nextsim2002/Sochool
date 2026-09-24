import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Palette, 
  Image as ImageIcon, 
  Megaphone, 
  Tag, 
  Check, 
  Upload, 
  Layout, 
  Eye
} from 'lucide-react';
import { Course } from '../../types';

interface ClassPageCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onSaveTheme?: (courseId: string, updates: Partial<Course>) => Promise<void> | void;
  onSave?: (updates: Partial<Course>) => Promise<void> | void;
}

export const ClassPageCustomizeModal: React.FC<ClassPageCustomizeModalProps> = ({
  isOpen,
  onClose,
  course,
  onSaveTheme,
  onSave
}) => {
  const [bannerImage, setBannerImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('from-blue-600 to-indigo-700');
  const [welcomeAnnouncement, setWelcomeAnnouncement] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !course) return;
    setBannerImage(course.bannerImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&auto=format&fit=crop&q=80');
    setSelectedColor(course.color || 'from-blue-600 to-indigo-700');
    setWelcomeAnnouncement(course.welcomeAnnouncement || '');
    setTagsInput((course.tags || ['Core Subject', 'Lab Included', 'Fall 2024']).join(', '));
    setDescription(course.description || '');
  }, [course?.id, isOpen]);

  if (!isOpen || !course) return null;

  const colorThemes = [
    { label: 'Deep Blue & Indigo', value: 'from-blue-600 to-indigo-700', bg: 'bg-linear-to-r from-blue-600 to-indigo-700' },
    { label: 'Emerald Forest', value: 'from-emerald-600 to-teal-700', bg: 'bg-linear-to-r from-emerald-600 to-teal-700' },
    { label: 'Royal Violet', value: 'from-purple-600 to-indigo-800', bg: 'bg-linear-to-r from-purple-600 to-indigo-800' },
    { label: 'Sunset Amber', value: 'from-amber-600 to-rose-600', bg: 'bg-linear-to-r from-amber-600 to-rose-600' },
    { label: 'Crimson Rose', value: 'from-rose-600 to-pink-700', bg: 'bg-linear-to-r from-rose-600 to-pink-700' },
    { label: 'Modern Slate', value: 'from-slate-700 to-slate-900', bg: 'bg-linear-to-r from-slate-700 to-slate-900' },
    { label: 'Cyan Ocean', value: 'from-cyan-600 to-blue-700', bg: 'bg-linear-to-r from-cyan-600 to-blue-700' }
  ];

  const bannerPresets = [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80'
  ];

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setBannerImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const updates = {
        bannerImage,
        color: selectedColor,
        welcomeAnnouncement: welcomeAnnouncement.trim(),
        tags,
        description: description.trim()
      };
      if (onSaveTheme) {
        await onSaveTheme(course.id, updates);
      }
      if (onSave) {
        await onSave(updates);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl flex flex-col gap-5 text-left my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">ตกแต่งหน้าเพจคลาสเรียน (Decorate Class Page)</h3>
              <p className="text-xs text-slate-500">สำหรับวิชา {course.code} - {course.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs relative">
          <div className={`h-24 sm:h-28 ${colorThemes.find(c => c.value === selectedColor)?.bg || 'bg-blue-600'} relative overflow-hidden flex items-end p-4`}>
            {bannerImage && (
              <img src={bannerImage} alt="Banner Preview" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80" />
            )}
            <div className="relative z-10 text-white">
              <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-xs">
                {course.code}
              </span>
              <h4 className="font-bold text-sm sm:text-base leading-tight mt-1">{course.title}</h4>
            </div>
          </div>
          {welcomeAnnouncement && (
            <div className="p-2.5 bg-amber-50 border-t border-amber-200/60 text-xs text-amber-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium truncate">{welcomeAnnouncement}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Color Gradient Themes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span>ชุดสีธีมของคลาสเรียน (Color Gradient Theme)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {colorThemes.map((theme, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedColor(theme.value)}
                  className={`p-2 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-all ${
                    selectedColor === theme.value ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg ${theme.bg} shrink-0`}></div>
                  <span className="text-[11px] font-bold text-slate-800 truncate">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Banner Image */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>ภาพแบนเนอร์ส่วนหัว (Header Banner Image)</span>
            </label>
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              {bannerPresets.map((preset, idx) => (
                <img
                  key={idx}
                  src={preset}
                  alt={`Banner preset ${idx}`}
                  onClick={() => setBannerImage(preset)}
                  className={`h-12 w-20 rounded-xl object-cover cursor-pointer border-2 hover:scale-105 transition-all shrink-0 ${
                    bannerImage === preset ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="หรือใส่ลิงก์รูปภาพ URL..."
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>อัปโหลด</span>
                <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Welcome Announcement Pin */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
              <span>ข้อความประกาศปักหมุดประจำวิชา (Pinned Announcement)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. ยินดีต้อนรับนักศึกษาทุกคน! อย่าลืมเช็คการบ้าน Module 1 ในแท็บ Assignments"
              value={welcomeAnnouncement}
              onChange={(e) => setWelcomeAnnouncement(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {/* Custom Badges & Tags */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              <span>ป้ายกำกับ / Tags (คั่นด้วยจุลภาค ,)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Core Course, Lab Intensive, Project-Based, Accredited"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการตกแต่ง'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
