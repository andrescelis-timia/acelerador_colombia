'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { GlobeAltIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { SidebarProps } from './types';
import { useAuth } from '@/lib/context/AuthContext';

export const Sidebar = ({ isExpanded, onToggle, navItems }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [showCountries, setShowCountries] = useState(false);
  const { country, countries, setCountry } = useAuth();

  // Active match: el item cuyo href (o algun matchPrefix) es el prefijo mas
  // especifico (mas largo) del pathname. Asi /admin/docs/roles mantiene
  // 'Documentacion' activo en lugar de 'Admin', y rutas como /object-detail/X
  // activan 'Objetos' via matchPrefixes.
  const matchesItem = (item: typeof navItems[number]): { ok: boolean; matchedLen: number } => {
    if (item.href === '/') return { ok: pathname === '/', matchedLen: 1 };
    const candidates = [item.href, ...(item.matchPrefixes || [])];
    let best = 0;
    for (const c of candidates) {
      if (pathname === c || pathname.startsWith(c + '/')) {
        if (c.length > best) best = c.length;
      }
    }
    return { ok: best > 0, matchedLen: best };
  };
  const activeHref = navItems
    .map(item => ({ item, ...matchesItem(item) }))
    .filter(x => x.ok)
    .sort((a, b) => b.matchedLen - a.matchedLen)[0]?.item.href;

  const handleCountrySelect = (selectedCountry: string) => {
    setCountry(selectedCountry);
    setShowCountries(false);
    router.push('/project');
  };

  return (
    <div className={`fixed top-0 left-0 h-full bg-timia-surface flex flex-col py-6 transition-all duration-500 ease-in-out border-r border-timia-border scrollbar-dark ${
      isExpanded ? 'w-[180px]' : 'w-[64px]'
    }`}>
      {/* Logo / Toggle */}
      <div className="px-3 mb-8 flex items-center justify-between h-7">
        {isExpanded ? (
          <img
            key="logo"
            src="/logo_timia_white.svg"
            alt="TIMIA"
            width={100}
            height={20}
            className="ml-1 opacity-90 animate-[fadeIn_400ms_ease-in-out]"
          />
        ) : (
          <img
            key="favicon"
            src="/Favicon-TIMIA-150x150.png"
            alt="TIMIA"
            width={28}
            height={28}
            className="ml-0.5 rounded animate-[fadeIn_400ms_ease-in-out]"
          />
        )}
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-white/5 transition-smooth ml-auto"
        >
          <ChevronDoubleRightIcon 
            className={`w-4 h-4 text-timia-subtle transition-transform duration-500 ease-in-out ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative p-3 rounded-lg transition-smooth flex items-center ${
                isActive
                  ? 'bg-timia-accent/15 text-white sidebar-active-indicator'
                  : 'text-timia-subtle hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-timia-accent' : 'text-timia-subtle group-hover:text-white'}`} />
              {isExpanded && (
                <span className="ml-3 text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Country Selector */}
      <div className="flex flex-col items-center space-y-3 pt-4 px-2 border-t border-timia-border mt-4">
        {countries.length > 1 && (
          <div className="relative w-full">
            <button 
              type="button"
              onClick={() => setShowCountries(!showCountries)}
              className="p-3 hover:bg-white/5 rounded-lg transition-smooth flex items-center w-full"
            >
              <GlobeAltIcon className="w-5 h-5 text-timia-subtle" />
              {isExpanded && (
                <span className="ml-3 text-timia-subtle text-sm whitespace-nowrap">
                  País
                </span>
              )}
            </button>
            
            {showCountries && (
              <div className="absolute bottom-full left-14 mb-2 glass-strong rounded-xl shadow-dark-lg p-2 z-[9999] min-w-[100px] animate-fade-in">
                {countries.map((countryCode) => (
                  <button
                    key={countryCode}
                    type="button"
                    className="p-2 hover:bg-white/10 rounded-lg transition-smooth block w-full"
                    onClick={() => handleCountrySelect(countryCode)}
                    title={countryCode}
                  >
                    <Image
                      src={`/flags/${countryCode.toLowerCase()}.svg`}
                      alt={countryCode}
                      width={24}
                      height={16}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {country && (
          <div className="w-6 h-4 overflow-hidden rounded-sm">
            <Image
              src={`/flags/${country.toLowerCase()}.svg`}
              alt={country}
              width={24}
              height={16}
            />
          </div>
        )}
      </div>
    </div>
  );
};