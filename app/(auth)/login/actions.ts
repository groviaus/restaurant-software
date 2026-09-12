'use server'

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function loginAction(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Clear the Next.js router cache to prevent stale state on next loads
  revalidatePath('/', 'layout');
  
  return { success: true };
}
