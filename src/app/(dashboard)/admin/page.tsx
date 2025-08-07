
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserList from '@/components/admin/user-list';
import ClientList from '@/components/admin/client-list';
import { useAuth } from '@/hooks/use-auth';
import AdminLoading from './loading';

export default function AdminPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && user?.role !== 'Admin') {
      router.push('/');
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || !user || user.role !== 'Admin') {
    return <AdminLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users and clients for your organization.</p>
      </div>
      <div className="space-y-8">
        <UserList />
        <ClientList />
      </div>
    </div>
  );
}
