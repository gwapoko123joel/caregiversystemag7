import { supabase } from '../lib/supabaseClient';

// ============================================
// HEALTH WORKER LOGIN (Caregiver + Practitioner)
// Now includes Access ID verification
// ============================================
export async function healthWorkerLogin(accessId: string, email: string, password: string) {
  try {
    // Step 1: Verify Access ID exists in system_users
    const { data: userRecord, error: lookupError } = await supabase
      .from('system_users')
      .select('*')
      .eq('access_id', accessId.trim().toUpperCase())
      .single();

    if (lookupError || !userRecord) {
      return {
        success: false,
        error: 'Access ID not recognized. Please check your ID or contact your administrator.',
        code: 'INVALID_ACCESS_ID',
      };
    }

    // Step 2: Block admin from using health worker login
    if (userRecord.role === 'admin') {
      return {
        success: false,
        error: 'Administrative accounts cannot access this portal. Use the governance access point.',
        code: 'ADMIN_BLOCKED',
      };
    }

    // Step 3: Verify the email matches the Access ID
    if (userRecord.email.toLowerCase() !== email.trim().toLowerCase()) {
      return {
        success: false,
        error: 'The email address does not match the registered Access ID. Please verify your credentials.',
        code: 'EMAIL_MISMATCH',
      };
    }

    // Step 4: Check account status
    if (userRecord.status !== 'authorized') {
      return {
        success: false,
        error: `Your account status is "${userRecord.status}". Contact your administrator for access.`,
        code: 'NOT_AUTHORIZED',
      };
    }

    // Step 5: Check if account is active
    if (!userRecord.is_active) {
      return {
        success: false,
        error: 'Your account has been deactivated. Contact your administrator.',
        code: 'DEACTIVATED',
      };
    }

    // Step 6: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      return {
        success: false,
        error: 'Authentication failed. Please check your password.',
        code: 'AUTH_FAILED',
      };
    }

    // Step 7: Verify the auth user matches the system_users record
    // Update user_id in system_users if it's a first-time link
    if (!userRecord.user_id || userRecord.user_id !== authData.user.id) {
      const { error: linkError } = await supabase
        .from('system_users')
        .update({ user_id: authData.user.id })
        .eq('access_id', accessId.trim().toUpperCase());

      if (linkError) {
        console.error('Failed to link user_id:', linkError);
      }
    }

    // Step 8: Success
    return {
      success: true,
      user: authData.user,
      role: userRecord.role,
      accessId: userRecord.access_id,
      fullName: userRecord.full_name,
      redirectTo: userRecord.role === 'medical_practitioner'
        ? '/dashboard/practitioner'
        : '/dashboard/caregiver',
    };

  } catch (err) {
    console.error('Health worker login error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN',
    };
  }
}

// ============================================
// ADMIN GOVERNANCE LOGIN (Admin Only)
// ============================================
export async function adminGovernanceLogin(accessId: string, email: string, password: string) {
  try {
    // Step 1: Verify Access ID exists and belongs to an admin
    const { data: adminCheck, error: checkError } = await supabase
      .from('system_users')
      .select('user_id, access_id, role, email, status, is_active')
      .eq('access_id', accessId.trim().toUpperCase())
      .single();

    if (checkError || !adminCheck) {
      // Log failed attempt
      await logAdminAttempt(email, accessId, false, 'Invalid Access ID');
      return {
        success: false,
        error: 'Access ID not recognized. This attempt has been logged.',
        code: 'INVALID_ACCESS_ID',
      };
    }

    // Step 2: Verify it's actually an admin access ID
    if (adminCheck.role !== 'admin') {
      await logAdminAttempt(email, accessId, false, 'Non-admin Access ID used');
      return {
        success: false,
        error: 'This Access ID does not have governance privileges. This attempt has been logged.',
        code: 'NOT_ADMIN',
      };
    }

    // Step 3: Verify the email matches the access ID
    if (adminCheck.email.toLowerCase() !== email.trim().toLowerCase()) {
      await logAdminAttempt(email, accessId, false, 'Email mismatch');
      return {
        success: false,
        error: 'Credentials do not match the registered governance account. This attempt has been logged.',
        code: 'EMAIL_MISMATCH',
      };
    }

    // Step 4: Check account status
    if (adminCheck.status !== 'authorized') {
      await logAdminAttempt(email, accessId, false, `Account status: ${adminCheck.status}`);
      return {
        success: false,
        error: `Governance account status: "${adminCheck.status}". Contact super admin.`,
        code: 'NOT_AUTHORIZED',
      };
    }

    if (!adminCheck.is_active) {
      await logAdminAttempt(email, accessId, false, 'Account deactivated');
      return {
        success: false,
        error: 'This governance account has been deactivated.',
        code: 'DEACTIVATED',
      };
    }

    // Step 5: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      await logAdminAttempt(email, accessId, false, 'Wrong password');
      return {
        success: false,
        error: 'Authentication failed. Security passphrase is incorrect. This attempt has been logged.',
        code: 'AUTH_FAILED',
      };
    }

    // Step 6: Verify the auth user matches the system_users record
    // Update user_id in system_users if it's a first-time link
    if (!adminCheck.user_id || adminCheck.user_id !== authData.user.id) {
      const { error: linkError } = await supabase
        .from('system_users')
        .update({ user_id: authData.user.id })
        .eq('access_id', accessId.trim().toUpperCase());

      if (linkError) {
        console.error('Failed to link admin user_id:', linkError);
      }
    }

    // Step 7: Log successful login
    await logAdminAttempt(email, accessId, true, '');

    // Step 8: Success
    return {
      success: true,
      user: authData.user,
      role: 'admin',
      accessId: adminCheck.access_id,
      redirectTo: '/dashboard/admin',
    };

  } catch (err) {
    console.error('Admin governance login error:', err);
    await logAdminAttempt(email, accessId, false, 'System error');
    return {
      success: false,
      error: 'Governance authentication system error. Try again later.',
      code: 'UNKNOWN',
    };
  }
}

// ============================================
// LOG ADMIN LOGIN ATTEMPTS
// ============================================
async function logAdminAttempt(email: string, accessId: string, success: boolean, reason: string) {
  try {
    await supabase.from('admin_login_attempts').insert({
      email: email || '',
      access_id_entered: accessId || '',
      success,
      failure_reason: reason,
      attempted_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log admin attempt:', err);
  }
}

// ============================================
// SIGN OUT
// ============================================
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    return false;
  }
  return true;
}

// ============================================
// GET CURRENT SESSION
// ============================================
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: userData } = await supabase
    .from('system_users')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  return {
    session,
    user: session.user,
    role: userData?.role || null,
    accessId: userData?.access_id || null,
    fullName: userData?.full_name || '',
  };
}
