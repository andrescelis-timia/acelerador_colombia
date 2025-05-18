export interface ResponseUserDto {
  id_user: string;
  email: string;
  country: 'CO' | 'AR' | 'HO';
  role: 'ADMIN' | 'USER';
} 