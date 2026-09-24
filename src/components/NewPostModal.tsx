import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Paperclip, Sparkles, Send, Trash2, FileText, UploadCloud, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PostAttachment } from '../types';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { addPost, courses } = useData();
  const [content, setContent] = useState('');
  const [courseTag, setCourseTag] = useState('General');
  const [imageUrl, setImageUrl] = useState('');
  const [attachment, setAttachment] = useState<PostAttachment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachmentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType: PostAttachment['type'] = 'other';
        if (['pdf'].includes(ext)) fileType = 'pdf';
        else if (['doc', 'docx'].includes(ext)) fileType = 'doc';
        else if (['zip', 'rar', '7z'].includes(ext)) fileType = 'zip';
        else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) fileType = 'image';

        setAttachment({
          name: file.name,
          size: file.size < 1024 * 1024 
            ? `${(file.size / 1024).toFixed(1)} KB` 
            : `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: fileType,
          dataUrl: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl && !attachment) return;

    setIsSubmitting(true);
    try {
      await addPost(
        content.trim() || (imageUrl ? 'แชร์รูปภาพ' : 'แชร์ไฟล์แนบ'), 
        courseTag, 
        imageUrl || undefined, 
        attachment || undefined
      );
      setContent('');
      setImageUrl('');
      setAttachment(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 text-left font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>สร้างโพสต์ใหม่ (Create Post)</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden inputs for local files */}
        <input 
          type="file" 
          accept="image/*" 
          ref={imageInputRef} 
          onChange={handleImageFileChange} 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleAttachmentFileChange} 
          className="hidden" 
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">{user?.name || 'Campus Member'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={courseTag}
                  onChange={(e) => setCourseTag(e.target.value)}
                  className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border-0 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="General">General Campus (กระดานรวม)</option>
                  <option value="All Sections">All Sections (ทุกกลุ่มเรียน)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.code}>{c.code} - {c.title}</option>
                  ))}
                </select>
                {user?.role === 'instructor' && (
                  <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                    FACULTY
                  </span>
                )}
              </div>
            </div>
          </div>

          <textarea
            rows={4}
            placeholder="คุณกำลังคิดอะไรอยู่? แชร์ประกาศ คำถาม หรือเอกสารประกอบการเรียน..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full text-slate-800 text-sm placeholder:text-slate-400 resize-none border-0 focus:ring-0 p-1 focus:outline-none"
            autoFocus
          />

          {/* Image Preview Box if selected */}
          {imageUrl && (
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-60 flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt="Upload preview" 
                className="w-full max-h-60 object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewModalImage(imageUrl)}
                  className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-xs transition-colors"
                  title="ดูรูปภาพขนาดเต็ม"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg backdrop-blur-xs transition-colors"
                  title="ลบรูปภาพ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Attachment Preview Box if selected */}
          {attachment && (
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{attachment.name}</p>
                  <p className="text-[10px] text-slate-500">{attachment.size}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white"
                title="ลบไฟล์แนบ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-slate-200/80 bg-slate-50"
              >
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>รูปภาพจากเครื่อง</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-slate-200/80 bg-slate-50"
              >
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span>แนบไฟล์เอกสาร</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={(!content.trim() && !imageUrl && !attachment) || isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'กำลังโพสต์...' : 'โพสต์'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Preview Full Image Modal */}
      {previewModalImage && (
        <div 
          onClick={() => setPreviewModalImage(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewModalImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewModalImage} 
              alt="Preview" 
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
