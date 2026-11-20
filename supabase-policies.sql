-- Run in Supabase SQL Editor after creating the private bucket `mediavault-files`.
-- Users may only upload/list/read/delete objects in their own UUID folder.
create policy "Users can upload to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'mediavault-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view own files"
on storage.objects for select to authenticated
using (
  bucket_id = 'mediavault-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'mediavault-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);
