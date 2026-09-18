import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getSavedUser,
  saveSavedUser,
  clearSavedUser,
  loginWithEmail,
  registerWithEmail,
  updateProfileLocal,
} from '../services/mockAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserSession() {
      try {
        const savedUser = await getSavedUser();
        if (savedUser) {
          setUser(savedUser);
          setUserProfile(savedUser);
        }
      } catch (err) {
        console.warn('Auth loading error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUserSession();
  }, []);

  const signIn = async (email, password) => {
    const loggedUser = await loginWithEmail(email, password);
    setUser(loggedUser);
    setUserProfile(loggedUser);
    return loggedUser;
  };

  const signUp = async (email, password, username) => {
    const newUser = await registerWithEmail(email, password, username);
    setUser(newUser);
    setUserProfile(newUser);
    return newUser;
  };

  const updateProfileData = async (updates) => {
    const updated = await updateProfileLocal(updates);
    setUser(updated);
    setUserProfile(updated);
    return updated;
  };

  const signOut = async () => {
    await clearSavedUser();
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        updateProfileData,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
