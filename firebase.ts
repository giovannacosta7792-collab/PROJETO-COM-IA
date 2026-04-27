import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth, db, loginWithGoogle, logout, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, query, where, orderBy, addDoc, deleteDoc, updateDoc, increment, serverTimestamp, getDoc, runTransaction } from 'firebase/firestore';

export interface SavedBlob {
  id: string;
  userId: string;
  color: string;
  complexity: number;
  smoothness: number;
  seed: number;
  likesCount: number;
  isPublic: boolean;
  createdAt: any;
}

interface BlobState {
  color: string;
  complexity: number;
  smoothness: number;
  seed: number;
}

interface BlobContextType extends BlobState {
  user: User | null;
  authLoading: boolean;
  savedBlobs: SavedBlob[];
  roomId: string | null;
  roomData: any | null;
  setColor: (color: string) => void;
  setComplexity: (complexity: number) => void;
  setSmoothness: (smoothness: number) => void;
  setSeed: (seed: number) => void;
  randomize: () => void;
  saveBlob: () => Promise<void>;
  deleteBlob: (id: string) => Promise<void>;
  loadBlob: (blob: BlobState) => void;
  toggleLike: (blobId: string) => Promise<void>;
  login: () => Promise<void>;
  signout: () => Promise<void>;
  createRoom: () => Promise<void>;
  joinRoom: (id: string) => Promise<void>;
  leaveRoom: () => void;
}

const BlobContext = createContext<BlobContextType | undefined>(undefined);

export const BlobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [color, setColor] = useState('#3b82f6');
  const [complexity, setComplexity] = useState(6);
  const [smoothness, setSmoothness] = useState(50);
  const [seed, setSeed] = useState(Math.random());
  const [savedBlobs, setSavedBlobs] = useState<SavedBlob[]>([]);
  
  // Party Mode State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<any | null>(null);
  const isRemoteUpdate = React.useRef(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      
      if (u) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', u.uid);
        await setDoc(userRef, {
          uid: u.uid,
          displayName: u.displayName,
          email: u.email,
          photoURL: u.photoURL,
          createdAt: serverTimestamp()
        }, { merge: true });
      }
    });
    return unsubscribe;
  }, []);

  // Firestore Sync (Blobs)
  useEffect(() => {
    if (!user) {
      setSavedBlobs([]);
      return;
    }

    const q = query(
      collection(db, 'blobs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const blobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedBlob[];
      setSavedBlobs(blobs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'blobs');
    });

    return unsubscribe;
  }, [user]);

  // Party Mode Listener
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoomData(data);
        
        // Update local state if it's a remote change
        isRemoteUpdate.current = true;
        setColor(data.color);
        setComplexity(data.complexity);
        setSmoothness(data.smoothness);
        setSeed(data.seed);
        setTimeout(() => { isRemoteUpdate.current = false; }, 50);
      } else {
        setRoomId(null);
        setRoomData(null);
      }
    });

    return unsubscribe;
  }, [roomId]);

  // Sync Local State to Room
  useEffect(() => {
    if (!roomId || isRemoteUpdate.current) return;

    const updateRoom = async () => {
      try {
        await updateDoc(doc(db, 'rooms', roomId), {
          color,
          complexity,
          smoothness,
          seed,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error updating room:", error);
      }
    };

    const timeout = setTimeout(updateRoom, 100); // Debounce
    return () => clearTimeout(timeout);
  }, [color, complexity, smoothness, seed, roomId]);

  const randomize = useCallback(() => {
    setSeed(Math.random());
  }, []);

  const saveBlob = async () => {
    if (!user) {
      alert('Faça login para salvar seus designs!');
      return;
    }

    try {
      const blobData = {
        userId: user.uid,
        color,
        complexity,
        smoothness,
        seed,
        likesCount: 0,
        isPublic: true,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'blobs'), blobData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'blobs');
    }
  };

  const deleteBlob = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blobs', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `blobs/${id}`);
    }
  };

  const loadBlob = useCallback((blob: BlobState) => {
    setColor(blob.color);
    setComplexity(blob.complexity);
    setSmoothness(blob.smoothness);
    setSeed(blob.seed);
  }, []);

  const toggleLike = async (blobId: string) => {
    if (!user) return;

    const likeRef = doc(db, 'blobs', blobId, 'likes', user.uid);
    const blobRef = doc(db, 'blobs', blobId);

    try {
      await runTransaction(db, async (transaction) => {
        const likeDoc = await transaction.get(likeRef);
        if (likeDoc.exists()) {
          transaction.delete(likeRef);
          transaction.update(blobRef, { likesCount: increment(-1) });
        } else {
          transaction.set(likeRef, {
            blobId,
            userId: user.uid,
            createdAt: serverTimestamp()
          });
          transaction.update(blobRef, { likesCount: increment(1) });
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `blobs/${blobId}/likes`);
    }
  };

  const login = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const signout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const createRoom = async () => {
    if (!user) return;
    try {
      const roomRef = await addDoc(collection(db, 'rooms'), {
        hostId: user.uid,
        color,
        complexity,
        smoothness,
        seed,
        activeUsers: 1,
        updatedAt: serverTimestamp()
      });
      setRoomId(roomRef.id);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const joinRoom = async (id: string) => {
    if (!user) return;
    try {
      const roomSnap = await getDoc(doc(db, 'rooms', id));
      if (roomSnap.exists()) {
        setRoomId(id);
      } else {
        alert("Sala não encontrada!");
      }
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  const leaveRoom = () => {
    setRoomId(null);
    setRoomData(null);
  };

  return (
    <BlobContext.Provider value={{ 
      user,
      authLoading,
      color, 
      complexity, 
      smoothness, 
      seed,
      savedBlobs,
      roomId,
      roomData,
      setColor,
      setComplexity,
      setSmoothness,
      setSeed,
      randomize,
      saveBlob,
      deleteBlob,
      loadBlob,
      toggleLike,
      login,
      signout,
      createRoom,
      joinRoom,
      leaveRoom
    }}>
      {children}
    </BlobContext.Provider>
  );
};

export const useBlobContext = () => {
  const context = useContext(BlobContext);
  if (!context) {
    throw new Error('useBlobContext must be used within a BlobProvider');
  }
  return context;
};
