-- OPTIONAL cleanup. Nothing depends on running this.
--
-- The app once had a paid tier. When payments were removed the code stopped
-- using these, but a database keeps whatever was created in it, so they are
-- still sitting in the project doing nothing.
--
-- Both are confirmed unused: no code reads either, and the profiles table is
-- empty. Dropping them is permanent, so run this only if you want the tidier
-- schema. Leaving them costs nothing but a little confusion later.
--
-- Run in the Supabase SQL editor.

-- Column that recorded whether a plan had been paid for.
alter table sessions drop column if exists paid;

-- Table that stored per-account premium status.
drop table if exists profiles;
