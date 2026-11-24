import { CountryConfig } from '../types';
import { CO_CONFIG } from './co';
import { PE_CONFIG } from './pe';
import { AR_CONFIG } from './ar';

export type CountryCode = 'CO' | 'PE' | 'AR';

export const getCountryConfig = (country: CountryCode): CountryConfig => {
  switch (country) {
    case 'CO':
      return CO_CONFIG;
    case 'PE':
      return PE_CONFIG;
    case 'AR':
      return AR_CONFIG;
    default:
      return CO_CONFIG;
  }
};

export { CO_CONFIG, PE_CONFIG, AR_CONFIG };
