import { UserInfoProps } from './types';

export const UserInfo = ({ email }: UserInfoProps) => {
  return (
    <div>
      <h1 className="text-[#0A3977] text-xl font-semibold">Plataforma de Ingestas</h1>
      <p className="text-gray-500 text-sm">Bienvenido usuario: {email}</p>
    </div>
  );
}; 