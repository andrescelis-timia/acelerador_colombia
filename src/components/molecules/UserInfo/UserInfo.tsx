import { UserInfoProps } from './types';

export const UserInfo = ({ email }: UserInfoProps) => {
  return (
    <div>
      <h1 className="text-white text-lg font-semibold tracking-tight">Plataforma de Ingestas</h1>
      <p className="text-gray-400 text-sm">Bienvenido usuario: {email}</p>
    </div>
  );
}; 