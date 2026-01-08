import { redirect } from 'next/navigation';
import { getSession, getUserPermissions } from '@/lib/auth';

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch user permissions to decide where to redirect
  const permissions = await getUserPermissions(session.user.id);

  // If admin, go to dashboard
  if (permissions === 'ADMIN') {
    redirect('/dashboard');
  }

  // Define module priority for redirection
  const modulePriority = ['dashboard', 'orders', 'bills', 'menu', 'inventory', 'tables', 'reports', 'analytics', 'outlets'];

  // Find the first module the user has 'view' access to
  const firstAllowedModule = modulePriority.find(module =>
    Array.isArray(permissions) && permissions.some((p: any) => p.module === module && p.can_view)
  );

  if (firstAllowedModule) {
    redirect(`/${firstAllowedModule}`);
  }

  // Fallback if no specific module access found, send to unauthorized to avoid loop
  redirect('/unauthorized');
}

