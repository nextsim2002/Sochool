import React, { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Paperclip, Sparkles, Send, Trash2, FileText, Check, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PostItem, PostAttachment } from '../types';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostItem | null;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({ isOpen, onClose, post }) => {
  const { user } = useAuth();
  const { editPost, courses } = useData();
  const [content, setContent] = useState('');
  const [courseTag, setCourseTag] = useState('General');
  const [imageUrl, setImageUrl] = useState<string | undefined>('');
  const [attachment, setAttachment] = useState<PostAttachment | null | undefined>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post) {
      setContent(post.content || '');
      setCourseTag(post.courseTag || 'General');
      setImageUrl(post.imageUrl || '');
      setAttachment(post.attachment || null);
      setErrorMessage('');
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const isOwner = user && (user.uid === post.authorId || user.name === post.authorName);

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
    setErrorMessage('');
    try {
      const result = await editPost(
        post.id,
        content.trim() || (imageUrl ? 'แชร์รูปภาพ' : 'แชร์ไฟล์แนบ'),
        courseTag,
        imageUrl || undefined,
        attachment || null
      );

      if (result.success) {
        onClose();
      } else {
        setErrorMessage(result.message || 'ไม่สามารถแก้ไขโพสต์ได้');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 text-left font-sans max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>แก้ไขโพสต์ (Edit Post)</span>
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
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {!isOwner && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-medium">
              ⚠️ เฉพาะเจ้าของโพสต์ ({post.authorName}) เท่านั้นที่สามารถแก้ไขโพสต์นี้ได้
            </div>
          )}

          <div className="flex items-center gap-3">
            <img
              src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={post.authorName}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">{post.authorName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={courseTag}
                  onChange={(e) => setCourseTag(e.target.value)}
                  disabled={!isOwner}
                  className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-60"
                >
                  <option value="General">General Campus (กระดานรวม)</option>
                  <option value="All Sections">All Sections (ทุกกลุ่มเรียน)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.code}>{c.code} - {c.title}</option>
                  ))}
                </select>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                  เจ้าของโพสต์
                </span>
              </div>
            </div>
          </div>

          <textarea
            rows={4}
            placeholder="ข้อความโพสต์..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!isOwner}
            className="w-full text-slate-800 text-sm placeholder:text-slate-400 resize-none border border-slate-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50"
            autoFocus
          />

          {/* Image Preview Box */}
          {imageUrl && (
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-56 flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt="Post preview" 
                className="w-full max-h-56 object-cover"
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
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg backdrop-blur-xs transition-colors"
                    title="ลบรูปภาพ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Attachment Preview Box */}
          {attachment && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{attachment.name}</p>
                  <p className="text-[10px] text-slate-500">{attachment.size}</p>
                </div>
              </div>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white"
                  title="ลบไฟล์แนบ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-slate-200/80 bg-slate-50"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>เปลี่ยนรูปภาพ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-slate-200/80 bg-slate-50"
                  >
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    <span>เปลี่ยนไฟล์แนบ</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={(!content.trim() && !imageUrl && !attachment) || isSubmitting || !isOwner}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
              </button>
            </div>
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
