'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserByEmail } from '@/services/User';

export type AuthContextType = {
  user: User | null;
  country: string;
  countries: string[];
  setCountry: (country: string) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  country: '',
  countries: [],
  setCountry: () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState('');

  // Cargar el país del localStorage solo en el cliente
  useEffect(() => {
    const savedCountry = localStorage.getItem('selectedCountry');
    if (savedCountry) {
      setCountry(savedCountry);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        try {
          const userDataArray = await getUserByEmail(user.email);
          
          if (Array.isArray(userDataArray) && userDataArray.length > 0) {
            const userCountries = userDataArray.map(userData => userData.country);
            setUser(user);
            setCountries(userCountries);
            
            const savedCountry = localStorage.getItem('selectedCountry');
            if (!savedCountry || !userCountries.includes(savedCountry)) {
              setCountry(userCountries[0]);
              localStorage.setItem('selectedCountry', userCountries[0]);
            }
          } else {
            setUser(null);
            setCountries([]);
            setCountry('');
            localStorage.removeItem('selectedCountry');
          }
        } catch {
          setUser(null);
          setCountries([]);
          setCountry('');
          localStorage.removeItem('selectedCountry');
        }
      } else {
        setUser(null);
        setCountries([]);
        setCountry('');
        localStorage.removeItem('selectedCountry');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Persistir el país seleccionado cuando cambie
  useEffect(() => {
    if (country) {
      localStorage.setItem('selectedCountry', country);
    }
  }, [country]);

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, country, countries, setCountry }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 