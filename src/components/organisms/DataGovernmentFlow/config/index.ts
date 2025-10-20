import { CountryConfig } from '../types';
import { CO_CONFIG } from './co';
import { PE_CONFIG } from './pe';

export const getCountryConfig = (country: 'CO' | 'PE'): CountryConfig => {
  switch (country) {
    case 'CO':
      return CO_CONFIG;
    case 'PE':
      return PE_CONFIG;
    default:
      return CO_CONFIG; // Fallback a Colombia
  }
};

export { CO_CONFIG, PE_CONFIG };