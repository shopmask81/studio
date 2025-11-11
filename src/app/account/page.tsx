import { ProtectedRoute } from '@/components/auth/protected-route';
import { AccountDetails } from '@/components/account/account-details';

export default function AccountPage() {
  return (
    <ProtectedRoute>
        <AccountDetails />
    </ProtectedRoute>
  );
}
