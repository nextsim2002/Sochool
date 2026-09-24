import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USER } from '../data/initialData';
import { 
  auth, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  getDocs,
  query,
  where,
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInAnonymously
} from '../firebase';
import { sanitizeForFirestore } from '../utils/firestoreUtils';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: { name: string; email: string; role: UserRole; studentId?: string; institution?: string; password?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  sendFriendRequest: (targetUid: string) => Promise<void>;
  acceptFriendRequest: (targetUid: string) => Promise<void>;
  removeFriend: (targetUid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('sochool_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.uid) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUser(profile);
            localStorage.setItem('sochool_user_profile', JSON.stringify(profile));
          } else {
            // Also check by email
            const userEmail = (firebaseUser.email || '').trim().toLowerCase();
            if (userEmail) {
              const q = query(collection(db, 'users'), where('email', '==', userEmail));
              const querySnap = await getDocs(q);
              if (!querySnap.empty) {
                const profile = querySnap.docs[0].data() as UserProfile;
                setUser(profile);
                localStorage.setItem('sochool_user_profile', JSON.stringify(profile));
                return;
              }
            }

            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Campus User',
              email: firebaseUser.email || '',
              role: 'student',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              institution: 'University Campus'
            };
            await setDoc(userDocRef, sanitizeForFirestore(newProfile));
            setUser(newProfile);
            localStorage.setItem('sochool_user_profile', JSON.stringify(newProfile));
          }
        } catch (err) {
          console.warn('Firebase user sync fallback:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password?.trim() || '';

    try {
      let loggedInProfile: UserProfile | null = null;

      // 1. Try Firebase Auth with email & password
      if (cleanPassword) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          const userDocRef = doc(db, 'users', userCred.user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            loggedInProfile = docSnap.data() as UserProfile;
          }
        } catch (authErr: any) {
          console.warn('Firebase signInWithEmailAndPassword note:', authErr?.code || authErr);
        }
      }

      // 2. If profile not resolved yet, check Firestore users collection by email
      if (!loggedInProfile) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const candidate = querySnap.docs[0].data() as any;
            // Verify password if candidate has stored password/credential
            if (!candidate.password || !cleanPassword || candidate.password === cleanPassword) {
              loggedInProfile = candidate as UserProfile;
            }
          }
        } catch (dbErr) {
          console.warn('Firestore query by email note:', dbErr);
        }
      }

      // 3. Fallback to local accounts storage if offline or matching
      if (!loggedInProfile) {
        try {
          const registeredUsersJson = localStorage.getItem('sochool_registered_users');
          if (registeredUsersJson) {
            const registeredUsers: any[] = JSON.parse(registeredUsersJson);
            const found = registeredUsers.find(
              u => (u.email || '').trim().toLowerCase() === cleanEmail
            );
            if (found && (!found.password || !cleanPassword || found.password === cleanPassword)) {
              loggedInProfile = found as UserProfile;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }

      // 4. If user not found or password incorrect
      if (!loggedInProfile) {
        if (cleanPassword) {
          throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
        } else {
          // If passwordless login requested, create or fetch default
          const uid = 'user_' + Math.abs(cleanEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
          loggedInProfile = {
            uid,
            name: cleanEmail.split('@')[0] || 'User',
            email: cleanEmail,
            role: 'student',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            institution: 'University Campus'
          };
          try {
            await setDoc(doc(db, 'users', uid), sanitizeForFirestore(loggedInProfile));
          } catch (err) {
            console.warn(err);
          }
        }
      }

      setUser(loggedInProfile);
      localStorage.setItem('sochool_user_profile', JSON.stringify(loggedInProfile));
    } catch (e: any) {
      console.warn('Login failure:', e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; role: UserRole; studentId?: string; institution?: string; password?: string }) => {
    setLoading(true);
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPassword = data.password?.trim() || '';

    try {
      let uid = 'user_' + Date.now();

      // 1. Attempt to create Firebase Auth user
      if (cleanPassword) {
        try {
          const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          uid = userCred.user.uid;
        } catch (err: any) {
          console.warn('Firebase create auth user note:', err?.code || err);
          // If email is already in use in Firebase Auth, attempt to sign in or use generated uid
          if (err?.code === 'auth/email-already-in-use') {
            try {
              const signinCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
              uid = signinCred.user.uid;
            } catch (sErr) {
              console.warn('Sign-in after already-in-use note:', sErr);
            }
          }
        }
      }

      const newProfile: any = {
        uid,
        name: data.name.trim(),
        email: cleanEmail,
        role: data.role,
        avatar: data.role === 'instructor' 
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        studentId: data.studentId?.trim() || (data.role === 'student' ? 'ST-2024-' + Math.floor(1000 + Math.random() * 9000) : undefined),
        institution: data.institution?.trim() || 'University Campus',
        gradeLevel: data.role === 'instructor' ? 'Faculty Instructor' : 'Student',
        password: cleanPassword || undefined
      };

      // 2. Persist in Firestore
      try {
        await setDoc(doc(db, 'users', uid), sanitizeForFirestore(newProfile));
      } catch (err) {
        console.warn('Firebase set user doc warning:', err);
      }

      // 3. Persist in localStorage registered users directory for fast recovery
      try {
        const existingUsersJson = localStorage.getItem('sochool_registered_users');
        const existingUsers: any[] = existingUsersJson ? JSON.parse(existingUsersJson) : [];
        const filtered = existingUsers.filter(u => (u.email || '').trim().toLowerCase() !== cleanEmail);
        filtered.push(newProfile);
        localStorage.setItem('sochool_registered_users', JSON.stringify(filtered));
      } catch (err) {
        console.warn('Local registered users storage note:', err);
      }

      setUser(newProfile as UserProfile);
      localStorage.setItem('sochool_user_profile', JSON.stringify(newProfile));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn(e);
    }
    setUser(null);
    localStorage.removeItem('sochool_user_profile');
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('sochool_user_profile', JSON.stringify(updated));
    try {
      await setDoc(doc(db, 'users', user.uid), sanitizeForFirestore(updated), { merge: true });
    } catch (e) {
      console.warn(e);
    }
  };

  const sendFriendRequest = async (targetUid: string) => {
    if (!user || user.uid === targetUid) return;
    const sent = user.friendRequestsSent || [];
    if (sent.includes(targetUid)) return;

    const updatedSent = [...sent, targetUid];
    await updateUserProfile({ friendRequestsSent: updatedSent });

    // Update target user's friendRequestsReceived
    try {
      const targetDocRef = doc(db, 'users', targetUid);
      const targetSnap = await getDoc(targetDocRef);
      if (targetSnap.exists()) {
        const targetData = targetSnap.data() as UserProfile;
        const targetReceived = targetData.friendRequestsReceived || [];
        if (!targetReceived.includes(user.uid)) {
          await setDoc(targetDocRef, sanitizeForFirestore({
            ...targetData,
            friendRequestsReceived: [...targetReceived, user.uid]
          }), { merge: true });
        }
      }
    } catch (err) {
      console.warn('Friend request sync note:', err);
    }
  };

  const acceptFriendRequest = async (targetUid: string) => {
    if (!user) return;
    const currentFriends = user.friends || [];
    const received = user.friendRequestsReceived || [];
    const updatedFriends = currentFriends.includes(targetUid) ? currentFriends : [...currentFriends, targetUid];
    const updatedReceived = received.filter(id => id !== targetUid);

    await updateUserProfile({
      friends: updatedFriends,
      friendRequestsReceived: updatedReceived
    });

    // Update target user's friends and remove from friendRequestsSent
    try {
      const targetDocRef = doc(db, 'users', targetUid);
      const targetSnap = await getDoc(targetDocRef);
      if (targetSnap.exists()) {
        const targetData = targetSnap.data() as UserProfile;
        const targetFriends = targetData.friends || [];
        const targetSent = targetData.friendRequestsSent || [];
        await setDoc(targetDocRef, sanitizeForFirestore({
          ...targetData,
          friends: targetFriends.includes(user.uid) ? targetFriends : [...targetFriends, user.uid],
          friendRequestsSent: targetSent.filter(id => id !== user.uid)
        }), { merge: true });
      }
    } catch (err) {
      console.warn('Accept friend sync note:', err);
    }
  };

  const removeFriend = async (targetUid: string) => {
    if (!user) return;
    const currentFriends = user.friends || [];
    const updatedFriends = currentFriends.filter(id => id !== targetUid);
    await updateUserProfile({ friends: updatedFriends });

    try {
      const targetDocRef = doc(db, 'users', targetUid);
      const targetSnap = await getDoc(targetDocRef);
      if (targetSnap.exists()) {
        const targetData = targetSnap.data() as UserProfile;
        const targetFriends = targetData.friends || [];
        await setDoc(targetDocRef, sanitizeForFirestore({
          ...targetData,
          friends: targetFriends.filter(id => id !== user.uid)
        }), { merge: true });
      }
    } catch (err) {
      console.warn('Remove friend sync note:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      updateUserProfile,
      sendFriendRequest,
      acceptFriendRequest,
      removeFriend
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
