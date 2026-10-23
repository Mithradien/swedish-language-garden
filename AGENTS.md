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
- Booking/Excel parsing and service classification live in src/lib/bookings.ts (tested in bookings.test.ts); keep UI free of parsing logic so rules stay testable.
- Visitor file downloads go through deliverFile in src/lib/download.ts (blob + iOS share fallback) so they keep working on touch devices and Safari.
- Booking lists print the active tab's filtered content using window.print and the A4 print stylesheet; reuse displayed rows so printed selections cannot diverge from the screen.
- The app must keep running on the user's own server: Dockerfile and docker-compose.yml build with NITRO_PRESET=node-server and run .output/server/index.mjs, so avoid adding Lovable-only backend services or required env vars without telling the user first (see SELF-HOSTING.md).
