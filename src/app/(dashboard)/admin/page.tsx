import UserList from '@/components/admin/user-list';
import ClientList from '@/components/admin/client-list';

export default function AdminPage() {
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
