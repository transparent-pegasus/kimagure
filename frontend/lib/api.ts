import { getAnalytics, isSupported } from "firebase/analytics";
import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, onAuthStateChanged } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";

// Firebase configuration (should be in .env or similar if not public)
// For now, assuming standard firebase config object is available or passed.
// In a real app, this would be a proper config object.
const firebaseConfig = {
  // TODO: Replace with your actual Firebase config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

// Lazy initialization to avoid SSG errors
let _app: ReturnType<typeof initializeApp> | null = null;
let _emulatorsInitialized = false;

const getFirebaseApp = () => {
  if (typeof window === "undefined") return null;

  if (!_app) {
    _app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }

  return _app;
};

export const app = getFirebaseApp();
export const functions = app ? getFunctions(app, "us-central1") : null;
export const auth = app ? getAuth(app) : null;


// Initialize Analytics
export const analytics =
  typeof window !== "undefined"
    ? isSupported().then((yes) => (yes && app ? getAnalytics(app) : null))
    : Promise.resolve(null);

// Connect to emulators if running locally
if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_EMULATOR === "true" &&
  !_emulatorsInitialized
) {
  if (functions && auth) {
    const emulatorUrl = new URL(
      process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_URL || "http://127.0.0.1:5001",
    );

    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFunctionsEmulator(functions, emulatorUrl.hostname, Number(emulatorUrl.port));

    _emulatorsInitialized = true;
  }
}

export interface MenuInput {
  mealPlans: any[];
  preferences: any;
}

export interface MenuOutput {
  meals: any[];
  totalCalorie: number;
  totalNutrients: any[];
  reason: string;
  date: string;
}

export const suggestMenu = async (input: MenuInput, date: string): Promise<MenuOutput> => {
  if (!functions) throw new Error("Firebase not initialized");

  // Ensure auth is initialized (anonymous sign-in completed)
  await getCurrentUser();

  const suggestMenuFn = httpsCallable<{ input: MenuInput; date: string }, MenuOutput>(
    functions,
    "suggest_menu",
  );
  const result = await suggestMenuFn({ date, input });

  return result.data;
};

export const saveHistory = async (data: any): Promise<{ success: boolean; id: string }> => {
  if (!functions) throw new Error("Firebase not initialized");

  // Ensure auth is initialized (anonymous sign-in completed)
  await getCurrentUser();

  const saveHistoryFn = httpsCallable<any, { success: boolean; id: string }>(
    functions,
    "save_history",
  );
  const result = await saveHistoryFn(data);

  return result.data;
};

export interface HistoryItem {
  id: string; // YYYY-MM-DD
  date: string;
  input?: MenuInput;
  output: MenuOutput;
  createdAt: string;
}

/**
 * Get current user, waiting for initialization if necessary
 */
export const getCurrentUser = (): Promise<any> => {
  return new Promise((resolve) => {
    if (!auth) {
      resolve(null);

      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  if (!functions) throw new Error("Firebase not initialized");

  // Ensure auth is initialized
  await getCurrentUser();

  try {
    const getHistoryFn = httpsCallable<void, HistoryItem[]>(functions, "get_history");
    const result = await getHistoryFn();

    return result.data;
  } catch (error) {
    console.error("getHistory: Failed to fetch history", error);

    return [];
  }
};
export const getUserProfile = async (): Promise<any> => {
  if (!functions) throw new Error("Firebase not initialized");

  // Ensure auth is initialized before calling
  await getCurrentUser();

  const getProfileFn = httpsCallable<any, any>(functions, "get_user_profile");
  const result = await getProfileFn({});

  return result.data;
};

export const updateUserProfile = async (profile: any): Promise<{ success: boolean }> => {
  if (!functions) throw new Error("Firebase not initialized");

  // Ensure auth is initialized before calling
  await getCurrentUser();

  const updateProfileFn = httpsCallable<{ profile: any }, { success: boolean }>(
    functions,
    "update_user_profile",
  );
  const result = await updateProfileFn({ profile });

  return result.data;
};
