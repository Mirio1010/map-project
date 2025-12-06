# Supabase Database Setup

This document describes the database tables and setup required for the Map Project application.

## Required Tables

### 1. `profiles` Table

Stores user profile information.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  email TEXT,
  profile_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### 2. `locations` Table

Stores pinned locations/places.

```sql
CREATE TABLE locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  address TEXT,
  description TEXT,
  category TEXT,
  images TEXT[],
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  rating INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all locations
CREATE POLICY "Locations are viewable by everyone"
  ON locations FOR SELECT
  USING (true);

-- Policy: Users can insert their own locations
CREATE POLICY "Users can insert own locations"
  ON locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own locations
CREATE POLICY "Users can update own locations"
  ON locations FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own locations
CREATE POLICY "Users can delete own locations"
  ON locations FOR DELETE
  USING (auth.uid() = user_id);
```

### 3. `friends` Table (NEW - Required for Friend System)

Stores friend relationships between users.

```sql
CREATE TABLE friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own friendships
CREATE POLICY "Users can view own friendships"
  ON friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policy: Users can insert their own friend relationships
CREATE POLICY "Users can add friends"
  ON friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own friend relationships
CREATE POLICY "Users can remove friends"
  ON friends FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. Storage Bucket: `avatars` (Optional - for Profile Pictures)

Create a storage bucket for profile pictures:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `avatars`
3. Set it to **Public** (or configure RLS policies)
4. Add the following policy:

```sql
-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload own profile picture"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access to profile pictures
CREATE POLICY "Profile pictures are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

## Setup Instructions

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the SQL Scripts**
   - Copy and paste each table creation script above
   - Run them in order (profiles, locations, friends)
   - Verify tables are created successfully

3. **Create Storage Bucket** (if using profile pictures)
   - Follow the storage bucket setup above
   - Or skip this if you don't need profile picture uploads

4. **Verify RLS Policies**
   - Check that Row Level Security is enabled on all tables
   - Verify policies are working correctly

## Notes

- The `friends` table uses a UNIQUE constraint on `(user_id, friend_id)` to prevent duplicate friendships
- Friend relationships are one-way: if User A adds User B, only A can see B's pins (unless you want bidirectional, which would require additional logic)
- The `profiles` table should have an `email` column that matches the auth.users email for friend lookup
- Make sure the `profiles` table has an `email` column that gets populated when users sign up

## Updating Existing `profiles` Table

If your `profiles` table doesn't have an `email` column, add it:

```sql
-- Add email column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles with email from auth.users
UPDATE profiles
SET email = (
  SELECT email 
  FROM auth.users 
  WHERE auth.users.id = profiles.id
)
WHERE email IS NULL;
```

