## IXM Archive Viewer

Automize now ships an internal-only IXM Archive Viewer reachable at `/dashboard/archives`. The Discord bot shares deep links that target `/dashboard/archives/{archiveId}` so reviewers can inspect transcripts, attachments, and metadata that live in Supabase.

### Environment variables

| Name                            | Required         | Description                                                                                                                                                                |
| ------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅               | Project URL used by both the App Router server layer and client-side TanStack Query hooks.                                                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅               | Public anon key. The session JWT provided to IXM reviewers must include the `role = 'ixm_internal'` custom claim so RLS allows read-only access.                           |
| `SUPABASE_ADMIN_KEY`            | ✅ (server-only) | Service-role key used inside `lib/db/admin.ts` for SSR data that must bypass RLS. Never expose this to the browser.                                                        |
| `AUTOMIZE_DOMAIN`               | optional         | If you deploy Automize behind a vanity domain, configure this so Automize links render with the correct hostname; otherwise the UI falls back to `window.location.origin`. |

Run `npm run dev` to start the local environment after exporting the variables above.

### Supabase RLS policies

Grant read-only access to IXM reviewers by scoping every archive row to JWTs that declare the `ixm_internal` role:

```sql
alter table public.discord_channel_archives enable row level security;

create policy "Allow IXM internal archive reads"
	on public.discord_channel_archives for select
	using (auth.jwt()->>'role' = 'ixm_internal');
```

Apply a similar whitelist to the Storage bucket so the UI must mint signed URLs:

```sql
-- bucket: discord-archives
create policy "Allow ixm_internal signed access" on storage.objects
	for select using (
		bucket_id = 'discord-archives'
		and auth.jwt()->>'role' = 'ixm_internal'
	);
```

> **Important:** the `discord-archives` bucket remains `private`. Never expose the raw object keys—always call `supabase.storage.from('discord-archives').createSignedUrl(...)` from the client. Signed URLs in the Archive Viewer expire after 60 seconds and the UI automatically prompts the user to retry if a link has gone stale.

### Feature overview

- TanStack Query + Supabase client-side hooks: `useArchives`, `useArchiveDetails`, and `useSignedUrl` power the list and detail experiences with refetch-on-focus caching.
- `/dashboard/archives`: grouped by Discord category with collapsible channel stacks, quick message/attachment counts, live filters (guild/channel/category/batch/date), pagination (20/page), plus bulk transcript downloads and metadata CSV export.
- `/dashboard/archives/{archiveId}`: monochrome detail view with inline transcript preview, image attachment embeds (while keeping signed download links), and quick copy actions for Automize links, storage prefixes, and batch IDs.

### Development flow

```bash
npm install
npm run dev
```

Use the Discord bot to request archives, then open the Automize deep link inside your authenticated IXM session to exercise the new UI.
