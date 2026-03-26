export interface ResponseUserDto {
  id_user: string;
  email: string;
  country: 'CO' | 'PE';
  role: 'ADMIN' | 'OWNER' | 'DEVELOPER';
} 