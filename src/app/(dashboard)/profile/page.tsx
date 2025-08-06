
import ProfileForm from '@/components/dashboard/profile-form';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          View your profile details and update your information.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
