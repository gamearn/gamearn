import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_USER = '@gamearn_current_user';
const STORAGE_KEY_USERS = '@gamearn_users_db';

const DEFAULT_USER = {
  uid: 'user_demo_123',
  email: 'player@gamearn.com',
  username: 'ProGamer_99',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  bio: 'Ready to rule Whot and Ludo!',
  coins: 2500,
  cashBalance: 5000,
  streak: 0,
  lastStreakDate: null,
  gamesPlayed: 32,
  wins: 24,
  isAdmin: true,
  createdAt: new Date().toISOString(),
};

export const getSavedUser = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY_USER);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const saveSavedUser = async (user) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    return user;
  } catch (e) {
    console.error('Error saving user:', e);
    return user;
  }
};

export const clearSavedUser = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_USER);
  } catch (e) {
    console.error('Error clearing user:', e);
  }
};

export const loginWithEmail = async (email, password) => {
  let existingUser = await getSavedUser();
  if (!existingUser) {
    existingUser = { ...DEFAULT_USER, email, username: email.split('@')[0] };
  } else {
    existingUser = { ...existingUser, email };
  }
  await saveSavedUser(existingUser);
  return existingUser;
};

export const registerWithEmail = async (email, password, username) => {
  const newUser = {
    ...DEFAULT_USER,
    uid: 'user_' + Date.now(),
    email,
    username: username || email.split('@')[0],
    createdAt: new Date().toISOString(),
  };
  await saveSavedUser(newUser);
  return newUser;
};

export const updateProfileLocal = async (updates) => {
  const currentUser = await getSavedUser();
  const updated = { ...currentUser, ...updates };
  await saveSavedUser(updated);
  return updated;
};
