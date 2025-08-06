import { LoginForm } from '@/components/auth/login-form';
import { FolderKanban } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex items-center gap-2">
        <FolderKanban className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">ProTrack</h1>
      </div>
      <LoginForm />
    </div>
  );
}
