export interface ResponseUserDto {
  id_user: string;
  email: string;
  country: 'CO' | 'PE' | 'AR';
  role: 'ADMIN' | 'APP_OWNER' | 'SERVICE_OWNER' | 'DATA_ENGINEER';
} 