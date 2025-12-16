// Supabase Edge Function to handle new user provisioning
// This function serves as a backup/safety mechanism
// The primary mechanism is a database trigger on auth.users
// @ts-nocheck - Supabase Edge Functions use Deno runtime, not Node.js

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// Define the Supabase client for Edge Functions
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Helper to derive username from email or user metadata
function deriveUsername(email: string, rawUserMetaData: any): string {
  if (rawUserMetaData?.username) {
    return rawUserMetaData.username;
  }
  // Extract username from email (part before @)
  return email.split('@')[0];
}

// Helper to derive full name from metadata or email
function deriveName(email: string, rawUserMetaData: any): string {
  if (rawUserMetaData?.full_name) {
    return rawUserMetaData.full_name;
  }
  if (rawUserMetaData?.name) {
    return rawUserMetaData.name;
  }
  // Use email as fallback
  return email.split('@')[0];
}

// Helper to get avatar URL
function getAvatarUrl(userId: string, rawUserMetaData: any): string {
  if (rawUserMetaData?.avatar_url) {
    return rawUserMetaData.avatar_url;
  }
  // Return dicebear avatar URL
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
}

// Function to handle new user signups
async function handleNewUser(user: any) {
  console.log('Handling new user signup:', user.id);
  
  try {
    if (!user.email) {
      console.error('User email is missing');
      return { error: 'User email is required' };
    }

    const username = deriveUsername(user.email, user.raw_user_meta_data);
    const fullName = deriveName(user.email, user.raw_user_meta_data);
    const avatarUrl = getAvatarUrl(user.id, user.raw_user_meta_data);

    // 1. Create or update entry in profiles table
    // Note: The database trigger should handle this, but we're being defensive here
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          email: user.email,
          username: username,
          full_name: fullName,
          avatar_url: avatarUrl,
          is_verified: false,
          role: 'user',
          points: 0,
          level: 'bronze',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )
      .select();
    
    if (profileError) {
      console.error('Error upserting profile entry:', profileError.message);
      // Don't fail the entire signup if profile upsert fails
      // The database trigger should have already created it
      console.warn('Profile upsert failed but continuing:', profileError);
    } else {
      console.log('Profile upserted successfully:', profileData?.[0]?.user_id);
    }

    console.log('Successfully provisioned new user:', user.id);
    return { success: true };
    
  } catch (error) {
    console.error('Error in handleNewUser:', error.message);
    return { error: error.message };
  }
}

// Main function that gets called by Supabase
Deno.serve(async (req) => {
  try {
    // Get the event data from the request
    const { record } = await req.json();
    
    if (!record) {
      return new Response(
        JSON.stringify({ error: 'No record provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle the new user
    const result = await handleNewUser(record);
    
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in main function:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
