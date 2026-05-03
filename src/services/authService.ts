import { supabase } from '../lib/supabaseClient';

// ============================================
// HEALTH WORKER LOGIN (Caregiver + Practitioner)
// Verifies Access ID + Email + Password against caregivers table
// ============================================
export async function healthWorkerLogin(accessId: string, email: string, password: string) {
  try {
    // Step 1: Verify Access ID exists in caregivers
    const { data: userRecord, error: lookupError } = await supabase
      .from('caregivers')
      .select('*')
      .eq('unique_access_id', accessId.trim().toUpperCase())
      .maybeSingle();

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
    if (!userRecord.email || userRecord.email.toLowerCase() !== email.trim().toLowerCase()) {
      return {
        success: false,
        error: 'The email address does not match the registered Access ID. Please verify your credentials.',
        code: 'EMAIL_MISMATCH',
      };
    }

    // Step 4: Check if account is active (primary authorization gate)
    if (!userRecord.is_active) {
      return {
        success: false,
        error: 'Your account has been deactivated or is pending approval. Contact your administrator.',
        code: 'NOT_ACTIVE',
      };
    }

    // Step 5: Authenticate with Supabase Auth
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

    // Step 6: Verify the auth user UID matches the caregivers record ID
    // In caregivers, id IS the auth UID — no separate user_id column needed
    if (userRecord.id !== authData.user.id) {
      // Sign them back out — UID mismatch is a security concern
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Account integrity check failed. Contact your administrator.',
        code: 'UID_MISMATCH',
      };
    }

    // Step 7: Update last_login_at (best-effort, non-blocking)
    // Wrapped in try/catch because triggers may restrict this — failure is non-fatal
    try {
      await supabase
        .from('caregivers')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', authData.user.id);
    } catch (updateErr) {
      console.warn('[AuthService] Could not update last_login_at:', updateErr);
    }

    // Step 8: Success
    return {
      success: true,
      user: authData.user,
      role: userRecord.role,
      accessId: userRecord.unique_access_id,
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
// Verifies Access ID + Email + Password against caregivers table
// All attempts logged to admin_login_attempts
// ============================================
export async function adminGovernanceLogin(accessId: string, email: string, password: string) {
  try {
    // Step 1: Verify Access ID exists and belongs to an admin
    const { data: adminCheck, error: checkError } = await supabase
      .from('caregivers')
      .select('id, unique_access_id, role, email, is_active, full_name')
      .eq('unique_access_id', accessId.trim().toUpperCase())
      .maybeSingle();

    if (checkError || !adminCheck) {
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
    if (!adminCheck.email || adminCheck.email.toLowerCase() !== email.trim().toLowerCase()) {
      await logAdminAttempt(email, accessId, false, 'Email mismatch');
      return {
        success: false,
        error: 'Credentials do not match the registered governance account. This attempt has been logged.',
        code: 'EMAIL_MISMATCH',
      };
    }

    // Step 4: Check if account is active (primary authorization gate)
    if (!adminCheck.is_active) {
      await logAdminAttempt(email, accessId, false, 'Account deactivated or not active');
      return {
        success: false,
        error: 'This governance account has been deactivated or is not active.',
        code: 'NOT_ACTIVE',
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

    // Step 6: Verify the auth user UID matches the caregivers record ID
    if (adminCheck.id !== authData.user.id) {
      await supabase.auth.signOut();
      await logAdminAttempt(email, accessId, false, 'UID mismatch');
      return {
        success: false,
        error: 'Account integrity check failed. This attempt has been logged.',
        code: 'UID_MISMATCH',
      };
    }

    // Step 7: Update last_login_at (best-effort, non-blocking)
    try {
      await supabase
        .from('caregivers')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', authData.user.id);
    } catch (updateErr) {
      console.warn('[AuthService] Could not update admin last_login_at:', updateErr);
    }

    // Step 8: Log successful login
    await logAdminAttempt(email, accessId, true, '');

    // Step 9: Success
    return {
      success: true,
      user: authData.user,
      role: 'admin',
      accessId: adminCheck.unique_access_id,
      fullName: adminCheck.full_name,
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
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return null;

    // In caregivers, id IS the auth UID — query directly by id
    const { data: userData, error: userError } = await supabase
      .from('caregivers')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (userError) {
      console.error('[AuthService] Profile fetch error during session check:', userError);
    }

    return {
      session,
      user: session.user,
      role: userData?.role || null,
      accessId: userData?.unique_access_id || null,
      fullName: userData?.full_name || '',
    };
  } catch (err) {
    console.error('[AuthService] Unexpected error in getCurrentSession:', err);
    return null;
  }
}