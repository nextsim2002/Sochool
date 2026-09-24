import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Lock, 
  Users, 
  Check, 
  FileText, 
  Sparkles, 
  Globe, 
  Tag,
  Palette
} from 'lucide-react';
import { ScheduleEvent, UserProfile, DayOfWeek } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface PersonalEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (event: Omit<ScheduleEvent, 'id'>) => Promise<void>;
  initialDay?: DayOfWeek;
  initialTime?: string;
}

export const PersonalEventModal: React.FC<PersonalEventModalProps> = ({
  isOpen,
  onClose,
  onSaveEvent,
  initialDay = 'MON',
  initialTime = '10:00'
}) => {
  const { user } = useAuth();
  const { allUsers } = useData();

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<'Personal' | 'Task' | 'Exam' | 'Workshop'>('Personal');
  const [day, setDay] = useState<DayOfWeek>(initialDay);
  const [startTime, setStartTime] = useState(initialTime);
  const [endTime, setEndTime] = useState('11:30');
  const [location, setLocation] = useState('Central Library / Study Room');
  const [colorTheme, setColorTheme] = useState<'blue' | 'teal' | 'purple' | 'peach'>('purple');
  const [visibility, setVisibility] = useState<'private' | 'shared_friends' | 'shared_course'>('private');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialDay) setDay(initialDay);
    if (initialTime) {
      setStartTime(initialTime);
      const [h, m] = initialTime.split(':').map(Number);
      const endH = Math.min(23, (h || 10) + 1);
      setEndTime(`${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`);
    }
  }, [initialDay, initialTime, isOpen]);

  if (!isOpen) return null;

  // Filter available friends / classmates to share with
  const availableUsers = allUsers.filter(u => u.uid !== user?.uid);

  const handleToggleFriendShare = (friendUid: string) => {
    setSelectedFriendIds(prev => 
      prev.includes(friendUid) ? prev.filter(id => id !== friendUid) : [...prev, friendUid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const newEvent: Omit<ScheduleEvent, 'id'> = {
        title: title.trim(),
        type: eventType,
        code: eventType === 'Personal' ? 'MY NOTE' : 'TASK',
        day,
        startTime,
        endTime,
        displayTime: `${startTime} - ${endTime}`,
        location: location.trim() || 'Online / Anywhere',
        colorTheme,
        isPersonal: true,
        visibility,
        sharedWithUserIds: visibility === 'shared_friends' ? selectedFriendIds : [],
        createdBy: user?.uid || 'user',
        description: description.trim()
      };

      await onSaveEvent(newEvent);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const themeOptions = [
    { label: 'Royal Purple', value: 'purple', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
    { label: 'Emerald Teal', value: 'teal', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { label: 'Warm Peach', value: 'peach', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
    { label: 'Ocean Blue', value: 'blue', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-5 text-left my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">เพิ่มกำหนดการส่วนตัว / การแจ้งเตือน</h3>
              <p className="text-xs text-slate-500">บันทึกลงปฏิทิน (ส่วนตัวหรือแชร์ให้เพื่อน)</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อกิจกรรม / เตือนความจำ *</label>
            <input
              type="text"
              required
              placeholder="e.g. อ่านหนังสือเตรียมสอบ Midterm, นัดประชุมโปรเจกต์กลุ่ม"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white transition-colors"
            />
          </div>

          {/* Type & Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ประเภท (Category)</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="Personal">ส่วนตัว (Personal Reminder)</option>
                <option value="Task">งาน / ทบทวนบทเรียน (Study Task)</option>
                <option value="Exam">เตรียมสอบ (Exam Prep)</option>
                <option value="Workshop">เวิร์กช็อป / กิจกรรม (Workshop/Activity)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">วันในสัปดาห์ (Day)</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="MON">วันจันทร์ (Monday)</option>
                <option value="TUE">วันอังคาร (Tuesday)</option>
                <option value="WED">วันพุธ (Wednesday)</option>
                <option value="THU">วันพฤหัสบดี (Thursday)</option>
                <option value="FRI">วันศุกร์ (Friday)</option>
                <option value="SAT">วันเสาร์ (Saturday)</option>
                <option value="SUN">วันอาทิตย์ (Sunday)</option>
              </select>
            </div>
          </div>

          {/* Time Slots */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">เวลาเริ่ม (Start Time)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">เวลาสิ้นสุด (End Time)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">สถานที่ / ช่องทางออนไลน์</label>
            <input
              type="text"
              placeholder="e.g. หอสมุดกลาง ชั้น 4 หรือ Google Meet"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          {/* Color Theme */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">สีประจำการแจ้งเตือน</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {themeOptions.map((th) => (
                <button
                  key={th.value}
                  type="button"
                  onClick={() => setColorTheme(th.value as any)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center transition-all ${
                    colorTheme === th.value ? `${th.bg} ring-2 ring-indigo-400` : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility / Privacy Options (Requirement 8) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block mb-2">การแชร์และความเป็นส่วนตัว (Privacy & Sharing):</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  visibility === 'private' ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-400/20' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Lock className={`w-4 h-4 mt-0.5 ${visibility === 'private' ? 'text-purple-600' : 'text-slate-400'}`} />
                <div>
                  <h5 className="font-bold text-xs text-slate-900">ส่วนตัว (Only Me)</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">เห็นได้เฉพาะคุณคนเดียวบนปฏิทิน</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('shared_friends')}
                className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  visibility === 'shared_friends' ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-400/20' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Users className={`w-4 h-4 mt-0.5 ${visibility === 'shared_friends' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <h5 className="font-bold text-xs text-slate-900">แชร์ให้เพื่อนที่เลือก (Share with Friends)</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">เพื่อนที่เลือกจะเห็นกำหนดการนี้ด้วย</p>
                </div>
              </button>
            </div>

            {/* Friend Selection when 'shared_friends' is active */}
            {visibility === 'shared_friends' && (
              <div className="mt-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col gap-2">
                <span className="text-xs font-bold text-indigo-900">เลือกเพื่อนที่ต้องการแชร์กำหนดการนี้:</span>
                <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5 pr-1">
                  {availableUsers.length === 0 ? (
                    <p className="text-xs text-slate-400">ยังไม่มีรายชื่อเพื่อนในระบบ</p>
                  ) : (
                    availableUsers.map((u) => {
                      const isSelected = selectedFriendIds.includes(u.uid);
                      return (
                        <div
                          key={u.uid}
                          onClick={() => handleToggleFriendShare(u.uid)}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-white border-indigo-500 shadow-xs' : 'bg-slate-50/50 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                            <span className="text-xs font-bold text-slate-800">{u.name}</span>
                            <span className="text-[10px] text-slate-400">({u.role})</span>
                          </div>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">รายละเอียดเพิ่มเติม / Note</label>
            <textarea
              rows={2}
              placeholder="บันทึกรายละเอียดของนัดหมายนี้..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกลงปฏิทิน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
