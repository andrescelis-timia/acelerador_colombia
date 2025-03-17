'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserByEmail } from '@/services/User';
import { useRouter } from 'next/navigation';
import { ErrorModal } from '@/components/molecules/ErrorModal';

export type AuthContextType = {
  user: User | null;
  country: string;
  countries: string[];
  setCountry: (country: string) => void;
  signInWithGoogle: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  country: '',
  countries: [],
  setCountry: () => {},
  signInWithGoogle: async () => {},
  loading: true
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al iniciar sesión con Google');
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        try {
          const userData = await getUserByEmail(user.email);
          
          if (Array.isArray(userData) && userData.length > 0) {
            const userCountries = userData.map(user => user.country);
            
            setUser(user);
            setCountries(userCountries);
            document.cookie = `session=${user.uid}; path=/; secure; samesite=strict`;
            
            const savedCountry = localStorage.getItem('selectedCountry');
            
            if (savedCountry && userCountries.includes(savedCountry as 'CO' | 'AR')) {
              setCountry(savedCountry as 'CO' | 'AR');
            } else {
              setCountry(userCountries[0]);
              localStorage.setItem('selectedCountry', userCountries[0]);
            }
          } else {
            console.error('Usuario no tiene países asignados:', userData);
            setErrorMessage('Usuario no tiene países asignados');
            handleLogout();
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
          setErrorMessage(error instanceof Error ? error.message : 'Error al obtener datos del usuario');
          handleLogout();
        }
      } else {
        handleLogout();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    setUser(null);
    setCountries([]);
    setCountry('');
    localStorage.removeItem('selectedCountry');
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  };

  useEffect(() => {
    if (country) {
      localStorage.setItem('selectedCountry', country);
    }
  }, [country]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      country, 
      countries, 
      setCountry, 
      signInWithGoogle,
      loading 
    }}>
      {children}
      <ErrorModal 
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 