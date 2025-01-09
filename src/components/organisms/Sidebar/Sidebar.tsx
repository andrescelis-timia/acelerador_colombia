'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { GlobeAltIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { SidebarProps } from './types';

export const Sidebar = ({ isExpanded, onToggle, navItems }: SidebarProps) => {
  const pathname = usePathname();
  const [showCountries, setShowCountries] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('CO');

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setShowCountries(false);
  };

  return (
    <div className={`fixed top-0 left-0 h-full bg-[#0A3977] flex flex-col py-6 transition-all duration-300 ${
      isExpanded ? 'w-[180px]' : 'w-[60px]'
    }`}>
      <div className="px-3 mb-6 flex items-center justify-between">
        <div className="w-6 h-6" />
        <button
          onClick={onToggle}
          className="bg-[#0067B2] p-1.5 rounded-full hover:bg-[#0067B2]/80 transition-colors"
        >
          <ChevronDoubleRightIcon 
            className={`w-4 h-4 text-white transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center space-y-4">
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className={`p-3 rounded-lg transition-colors w-full flex items-center ${
              pathname === item.href ? 'bg-[#0067B2]' : 'hover:bg-[#0067B2]/50'
            }`}
          >
            <item.icon className="w-6 h-6 text-white" />
            {isExpanded && (
              <span className="ml-3 text-white text-sm whitespace-nowrap">
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="flex flex-col items-center space-y-4 pt-4">
        <div className="relative">
          <button 
            type="button"
            onClick={() => setShowCountries(!showCountries)}
            className="p-3 hover:bg-[#0067B2]/50 rounded-lg transition-colors flex items-center"
          >
            <GlobeAltIcon className="w-6 h-6 text-white" />
            {isExpanded && (
              <span className="ml-3 text-white text-sm whitespace-nowrap">
                País
              </span>
            )}
          </button>
          
          {showCountries && (
            <div className="absolute bottom-full left-14 mb-2 bg-white rounded-lg shadow-lg p-2 z-[9999] min-w-[100px]">
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors block mb-2 w-full"
                onClick={() => handleCountrySelect('AR')}
                title="Argentina"
              >
                <Image
                  src={`/flags/ar.svg`}
                  alt="Argentina"
                  width={24}
                  height={16}
                />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors block w-full"
                onClick={() => handleCountrySelect('CO')}
                title="Colombia"
              >
                <Image
                  src={`/flags/co.svg`}
                  alt="Colombia"
                  width={24}
                  height={16}
                />
              </button>
            </div>
          )}
        </div>
        
        <div className="w-6 h-4 overflow-hidden">
          <Image
            src={`/flags/${selectedCountry.toLowerCase()}.svg`}
            alt={selectedCountry === 'AR' ? 'Argentina' : 'Colombia'}
            width={24}
            height={16}
          />
        </div>
      </div>
    </div>
  );
}; 