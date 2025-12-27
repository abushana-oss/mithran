import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private supabaseServiceKey: string;
  private adminClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL') || '';
    this.supabaseAnonKey = this.configService.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY') || '';
    this.supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY') || '';

    if (!this.supabaseUrl || !this.supabaseAnonKey || !this.supabaseServiceKey) {
      throw new Error(
        'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY must be set in environment variables'
      );
    }

    // Admin client with SERVICE ROLE key for operations that bypass RLS
    // This client should ONLY be used for admin operations like token verification
    this.adminClient = createClient(this.supabaseUrl, this.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Get Supabase client authenticated with user's access token
   * This ensures RLS policies work correctly with auth.uid()
   *
   * @param accessToken - User's Supabase access token
   * @returns Authenticated Supabase client
   */
  getClient(accessToken?: string): SupabaseClient {
    if (!accessToken) {
      return this.adminClient;
    }

    // Create client with user's auth context for RLS
    return createClient(this.supabaseUrl, this.supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  async verifyToken(token: string): Promise<any> {
    const { data, error } = await this.adminClient.auth.getUser(token);

    if (error) {
      throw new Error(`Invalid token: ${error.message}`);
    }

    return data.user;
  }
}
