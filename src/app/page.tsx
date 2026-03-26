'use client';

import { useState, useEffect } from 'react';
import { HomeContent } from '@/components/organisms/HomeContent';
import { useAuth } from '@/lib/context/AuthContext';
import { getDashboardStats } from '@/services/Dashboard';
import type { DashboardStats } from '@/services/Dashboard/types';

export default function Home() {
  const { user, country } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats(user.email, country);
        setStats(data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.email, country]);

  return <HomeContent stats={stats} loading={loading} />;
}
