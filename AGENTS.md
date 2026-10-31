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
- Keep Rolldown runtime helpers in an independent bundler-runtime chunk so React initialization cannot depend on an uninitialized application chunk.
- Storage renewals use authenticated ownership checks in customer.functions.ts and immutable terms/price snapshots; customers read only their own approvals, staff read them in CarTools, and the example view never persists approvals.
- Customer tyre history uses completed owned booking keys and safe work-order projections through customer.functions.ts; per-visit tyre season/set are recorded in mechanic protocols, never inferred from current storage. The explicit /kund-exempel route always opens isolated sample data, even for signed-in staff.
- Staff screens share WorkshopBoard and workshop-board.ts status derivation with Stockholm dates; reception never queries storage or shows internal fields/account identity. Its filtering, labels, limits and polling use screen-settings.ts and staff-only app_config screens; only superadmin edits them. Both links share nav-access.ts Skärmar grouping.
- Admin car details use current overview bookings and Excel cards with exact normalized registration matching in src/lib/admin-car.ts; history reads use the ordinary staff client and shared customer tread presentation, so live data never becomes preview data.
- Customer tread classification lives in src/lib/tread.ts with separate season thresholds and boundary tests, so future settings can change limits without duplicating rules in the UI.
- Arrival lookup, local status keys and timestamped arrival writes live in src/lib/arrival.ts; the kiosk and overview share these to prevent inconsistent status identities until self-hosted persistence is connected.
- Signed-in customer data (cars, bookings, cancel/rebook, profile incl. address) goes through src/lib/customer.functions.ts, matching by verified e-mail or profile phone via src/lib/customer-match.ts (tested), so customers never get direct table access.
- Booking/Excel parsing and service classification live in src/lib/bookings.ts (tested in bookings.test.ts); keep UI free of parsing logic so rules stay testable.
- Overview schedule rows are derived in src/lib/bookings.ts without adding synthetic bookings to imported data, so search and statistics only count actual bookings.
- Visitor file downloads go through deliverFile in src/lib/download.ts (blob + iOS share fallback) so they keep working on touch devices and Safari.
- Booking lists print the active tab's filtered content using window.print and the A4 print stylesheet; reuse displayed rows so printed selections cannot diverge from the screen.
- The app must keep running on the user's own server: Dockerfile and docker-compose.yml build with NITRO_PRESET=node-server and run .output/server/index.mjs, so avoid adding Lovable-only backend services or required env vars without telling the user first (see SELF-HOSTING.md).
- Staff roles (superadmin/useradmin/mekaniker/kund) live in the user_roles table checked via has_role(), with is_admin()/is_staff() helpers for policies; useradmin is a limited admin that may only create mekaniker/kund accounts (checked server-side); the first signed-up account becomes superadmin by trigger. Never read roles from local storage. Data sits in Lovable Cloud (plain PostgreSQL) during development so it can be moved to the user's own server later.
- Branding values (logo, colours, company fields) are read and written only through useSettings in src/lib/settings.ts and edited on the /installningar page, so every page shares one source instead of duplicating storage code.
- The settings page separates branding in Allmänt from the existing UserAdmin in Konto, so account management is reused without duplicating access logic.
- Account categories and search normalization live in account-directory.ts; the existing superadmin-only UserRoles list reads paginated profile/car data through the ordinary RLS client and reuses customer-match contact rules so account search stays aligned with customer ownership.
- Excel car storage is upserted into car_storage via src/lib/car-storage-sync.ts (mergeCard keeps stored values when the new file has blanks; cars absent from a file are never deleted) so import history survives.
- Menu visibility per role lives in src/lib/nav-access.ts (tested) and staff pages wrap their content in RequireRole, so "/" stays the public booking page and staff tools sit behind login at /oversikt.
- Staff booking moves go through staffMoveBooking in src/lib/staff-booking.functions.ts (superadmin checked server-side); cancelling reuses the "avbokad" status so bookings are never deleted and history/statistics survive.
- Booking schedule (work passes + slot step) is stored in app_config key 'schedule' and applied via applySchedule in src/lib/bookings.ts; the root layout loads it on the client and booking server functions call loadScheduleServer before validating, so client and server use the same times.
- Service prices (tiers by rim inch) are stored in app_config key 'prices' and applied via applyPrices in src/lib/prices.ts, loaded together with the schedule, so booking pages and settings share one price source.
- Tread colour limits are stored in app_config key 'tread' and applied via applyTread in src/lib/tread.ts (also rewrites guide range texts), loaded with schedule and prices.
- Customer-claimed cars live in customer_cars (status kopplad/vantar via claimStatus in customer-match.ts); only 'kopplad' cars expose car_storage details, so typing someone else's regnr never reveals their tyres.
- Booking confirmation e-mails are built in src/lib/booking-email.ts and sent via the workshop's own SMTP (nodemailer); SMTP details are saved in the superadmin-only mail_settings table (Inställningar → E-post) with SMTP_* env vars as fallback, and send failures never fail the booking.
- Staff car tools (src/components/staff/car-tools.tsx) store internal notes, photo rows and wheel handovers in staff-only tables, with photos in the private car-photos bucket via signed URLs, so customers never see internal data.
