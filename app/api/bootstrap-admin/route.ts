import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabaseClient } from '@/lib/supabase';

const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET;

const bootstrapSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  secret: z.string().min(1),
});

async function adminExists() {
  const client = createServiceSupabaseClient();
  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1);

  if (error) {
    throw new Error(`Failed to check existing admins: ${error.message}`);
  }

  return Array.isArray(data) && data.length > 0;
}

export async function POST(request: NextRequest) {
  try {
    if (!BOOTSTRAP_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Bootstrap secret is not configured.' },
        { status: 500 }
      );
    }

    const payload = await request.json();
    const { email, password, secret } = bootstrapSchema.parse(payload);

    if (secret !== BOOTSTRAP_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Invalid bootstrap secret.' },
        { status: 401 }
      );
    }

    if (await adminExists()) {
      return NextResponse.json(
        { success: false, error: 'An administrator already exists.' },
        { status: 409 }
      );
    }

    const client = createServiceSupabaseClient();

    // Create user WITHOUT email confirmation to bypass potential trigger issues
    const { data: createdUser, error: createError } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { bootstrap: true }, // Mark this as a bootstrap user
    });

    if (createError) {
      console.error('[Bootstrap] Supabase error details:', {
        message: createError.message,
        status: createError.status,
        code: (createError as any).code,
        name: createError.name,
        stack: createError.stack,
      });
      
      // If user creation fails due to database error, it's likely the trigger
      // Let's provide helpful guidance
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to create user: ${createError.message}`,
          details: (createError as any).code || createError.name,
          hint: 'This error is likely caused by a database trigger. Run nuclear-option-disable-trigger.sql in Supabase SQL Editor to fix.'
        },
        { status: 500 }
      );
    }

    if (!createdUser?.user?.id) {
      console.error('[Bootstrap] User created but no ID returned');
      return NextResponse.json(
        { success: false, error: 'User created but no ID returned.' },
        { status: 500 }
      );
    }

    const userId = createdUser.user.id;

    // Wait for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: existingProfile } = await client
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      // Update it to admin if it's not already
      if (existingProfile.role !== 'admin') {
        const { error: updateError } = await client
          .from('profiles')
          .update({ 
            role: 'admin',
            activated_at: new Date().toISOString() 
          })
          .eq('id', userId);

        if (updateError) {
          console.error('[Bootstrap] Failed to update profile to admin:', updateError);
        }
      }
    } else {
      // Trigger didn't create profile, create it manually
      const { error: profileError } = await client
        .from('profiles')
        .insert({
          id: userId,
          email,
          role: 'admin',
          invited_by: null,
          invited_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('[Bootstrap] Failed to create admin profile:', profileError);
        return NextResponse.json(
          { success: false, error: 'Failed to persist admin profile.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bootstrap administrator created successfully.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Invalid payload.' },
        { status: 400 }
      );
    }

    console.error('[Bootstrap] Unexpected error', error);

    return NextResponse.json(
      { success: false, error: 'Unable to bootstrap administrator.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: 'Method not allowed.' }, { status: 405 });
}


