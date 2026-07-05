import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AppState } from '../types';

/**
 * Saves the entire application state for a user to Google Firestore
 */
export async function saveUserState(identifier: string, state: AppState): Promise<boolean> {
  if (!identifier) return false;
  try {
    const userDocRef = doc(db, 'users', identifier.trim().toLowerCase());
    await setDoc(userDocRef, {
      profile: state.profile,
      customTasks: state.customTasks,
      history: state.history,
      chatMessages: state.chatMessages || [],
      updatedAt: Date.now()
    }, { merge: true });
    return true;
  } catch (error: any) {
    console.error('Error saving user state to Firestore:', error);
    throw error;
  }
}

/**
 * Loads the user application state from Google Firestore
 */
export async function loadUserState(identifier: string): Promise<AppState | null> {
  if (!identifier) return null;
  try {
    const userDocRef = doc(db, 'users', identifier.trim().toLowerCase());
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        profile: data.profile,
        customTasks: data.customTasks || [],
        history: data.history || {},
        chatMessages: data.chatMessages || []
      } as AppState;
    }
    return null;
  } catch (error: any) {
    console.error('Error loading user state from Firestore:', error);
    throw error;
  }
}

/**
 * Generates a 6-digit secure OTP, saves it to Firestore, and returns it.
 */
export async function generateAndSaveOTP(identifier: string): Promise<string> {
  if (!identifier) return '';
  const sanitizedId = identifier.trim().toLowerCase();
  
  // Generate random 6 digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

  try {
    const otpDocRef = doc(db, 'otps', sanitizedId);
    await setDoc(otpDocRef, {
      code,
      expiresAt,
      timestamp: Date.now(),
      email: sanitizedId // Stored as standard lookup
    });
    return code;
  } catch (error: any) {
    console.error('Error saving OTP to Firestore:', error);
    throw error;
  }
}

/**
 * Verifies a 6-digit OTP entered by the user
 */
export async function verifyOTP(identifier: string, enteredCode: string): Promise<boolean> {
  if (!identifier || !enteredCode) return false;
  const sanitizedId = identifier.trim().toLowerCase();
  
  try {
    const otpDocRef = doc(db, 'otps', sanitizedId);
    const docSnap = await getDoc(otpDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const codeMatches = data.code === enteredCode.trim();
      const isNotExpired = Date.now() < data.expiresAt;
      return codeMatches && isNotExpired;
    }
    return false;
  } catch (error: any) {
    console.error('Error verifying OTP in Firestore:', error);
    throw error;
  }
}
