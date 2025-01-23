'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserByEmail } from '@/services/User';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // La cookie se establecerá a través del efecto de onAuthStateChanged
      console.log('Login exitoso:', result.user.email);
      router.push('/');
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        try {
          const userDataArray = await getUserByEmail(user.email);
          
          if (Array.isArray(userDataArray) && userDataArray.length > 0) {
            const userCountries = userDataArray.map(userData => userData.country);
            setUser(user);
            setCountries(userCountries);
            
            // Establecer cookie de sesión
            document.cookie = `session=${user.uid}; path=/`;
            
            // Cargar el país guardado
            const savedCountry = localStorage.getItem('selectedCountry');
            if (savedCountry && userCountries.includes(savedCountry)) {
              setCountry(savedCountry);
            } else {
              setCountry(userCountries[0]);
              localStorage.setItem('selectedCountry', userCountries[0]);
            }
          } else {
            setUser(null);
            setCountries([]);
            setCountry('');
            localStorage.removeItem('selectedCountry');
            document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          }
        } catch {
          setUser(null);
          setCountries([]);
          setCountry('');
          localStorage.removeItem('selectedCountry');
          document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        }
      } else {
        setUser(null);
        setCountries([]);
        setCountry('');
        localStorage.removeItem('selectedCountry');
        document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 