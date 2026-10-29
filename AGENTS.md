<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Admin car details use current overview bookings and Excel cards with exact normalized registration matching in src/lib/admin-car.ts; history reads use the ordinary staff client and shared customer tread presentation, so live data never becomes preview data.
- Customer tread classification lives in src/lib/tread.ts with separate season thresholds and boundary tests, so future settings can change limits without duplicating rules in the UI.
- Arrival lookup, local status keys and timestamped arrival writes live in src/lib/arrival.ts; the kiosk and overview share these to prevent inconsistent status identities until self-hosted persistence is connected.
- Signed-in customer data (cars, bookings, cancel/rebook, profile incl. address) goes through src/lib/customer.functions.ts, matching by verified e-mail or profile phone via src/lib/customer-match.ts (tested), so customers never get direct table access.
- Booking/Excel parsing and service classification live in src/lib/bookings.ts (tested in bookings.test.ts); keep UI free of parsing logic so rules stay testable.
- Overview schedule rows are derived in src/lib/bookings.ts without adding synthetic bookings to imported data, so search and statistics only count actual bookings.
- Visitor file downloads go through deliverFile in src/lib/download.ts (blob + iOS share fallback) so they keep working on touch devices and Safari.
- Booking lists print the active tab's filtered content using window.print and the A4 print stylesheet; reuse displayed rows so printed selections cannot diverge from the screen.
- The app must keep running on the user's own server: Dockerfile and docker-compose.yml build with NITRO_PRESET=node-server and run .output/server/index.mjs, so avoid adding Lovable-only backend services or required env vars without telling the user first (see SELF-HOSTING.md).
- Staff roles (superadmin/mekaniker/kund) live in the user_roles table checked via has_role(); the first signed-up account becomes superadmin by trigger. Never read roles from local storage. Data sits in Lovable Cloud (plain PostgreSQL) during development so it can be moved to the user's own server later.
- Branding values (logo, colours, company fields) are read and written only through useSettings in src/lib/settings.ts and edited on the /installningar page, so every page shares one source instead of duplicating storage code.
- The settings page separates branding in Allmänt from the existing UserAdmin in Konto, so account management is reused without duplicating access logic.
- Excel car storage is upserted into car_storage via src/lib/car-storage-sync.ts (mergeCard keeps stored values when the new file has blanks; cars absent from a file are never deleted) so import history survives.
- Menu visibility per role lives in src/lib/nav-access.ts (tested) and staff pages wrap their content in RequireRole, so "/" stays the public booking page and staff tools sit behind login at /oversikt.
- Staff booking moves go through staffMoveBooking in src/lib/staff-booking.functions.ts (superadmin checked server-side); cancelling reuses the "avbokad" status so bookings are never deleted and history/statistics survive.
- Booking schedule (work passes + slot step) is stored in app_config key 'schedule' and applied via applySchedule in src/lib/bookings.ts; the root layout loads it on the client and booking server functions call loadScheduleServer before validating, so client and server use the same times.
