-- ─── Aviel Tax System — Supabase Database Schema ──────────────────────────────
-- Run this SQL in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/symvyrvluilhfpsbivys/editor)
-- to create the necessary table and Row Level Security (RLS) policies.

-- 1. Create the submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
    id bigint PRIMARY KEY,                          -- Unique submission ID (Date.now())
    "userId" uuid REFERENCES auth.users(id),        -- Reference to the authenticated user
    timestamp text NOT NULL,                        -- ISO date/time string of submission
    score integer NOT NULL,                         -- Calculated tax health score
    risk text NOT NULL,                             -- Calculated risk level (Low, Moderate, High, Critical)
    type text NOT NULL,                             -- 'Business' or 'Individual'
    name text NOT NULL,                             -- Contact / Taxpayer Name
    email text NOT NULL,                            -- Contact Email
    phone text,                                     -- Phone Number
    location text,                                  -- State or Location

    -- Business specific fields
    "bizName" text,                                 -- Business Name
    industry text,                                  -- Industry sector
    years text,                                     -- Years active
    employees text,                                 -- Employee count range
    cac text,                                       -- Registered with CAC (Yes/No)
    track text,                                     -- Records tracking standard (Poor/Fair/Good)
    consult text,                                   -- Retained tax consultant (Yes/No)
    returns text,                                   -- Tax returns filing frequency
    audit text,                                     -- Active tax audit / query (Yes/No)
    taxes jsonb,                                    -- Array of taxes registered for

    -- Individual specific fields
    employ text,                                    -- Employment status
    employer text,                                  -- Current employer name
    occupation text,                                -- Occupation
    state text,                                     -- State of residence
    income text,                                    -- Annual income range
    "incomeSources" jsonb,                          -- Array of income sources
    paye text,                                      -- PAYE deducted by employer (Yes/No)
    filed text,                                     -- Filed PIT returns before
    tcc text,                                       -- Tax Clearance Certificate status
    tin text,                                       -- Has TIN (Yes/No)
    query text,                                     -- Active tax authority queries (Yes/No)

    -- Common metadata
    concerns jsonb,                                 -- Array of main tax concerns
    issue text,                                     -- Details of specific issues
    "reportText" text,                              -- Full text of the AI-generated Tax Health Report
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Policy A: Allow users to view only their own submissions
CREATE POLICY "Users can select their own submissions" 
ON public.submissions 
FOR SELECT 
USING (auth.uid() = "userId");

-- Policy B: Allow users to insert their own submissions
CREATE POLICY "Users can insert their own submissions" 
ON public.submissions 
FOR INSERT 
WITH CHECK (auth.uid() = "userId");

-- Policy C: Allow anonymous submissions (if auth is optional or user is signing up later)
-- Note: Submissions created while logged out will be updated with their userId and uploaded when they log in.
CREATE POLICY "Enable insert for anonymous users"
ON public.submissions
FOR INSERT
WITH CHECK (auth.uid() IS NULL OR auth.uid() = "userId");
