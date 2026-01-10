import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredPermission="reports" requiredAction="view">
      {children}
    </ProtectedRoute>
  );
}

