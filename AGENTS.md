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

## Architecture rules
- Homepage search uses a public /search route over existing public approved files, visible images, news and cases; private workbench routes stay guarded so basic search never requires login or exposes private records.
- Monitoring interactions use a persisted demo snapshot store and a cleanup-safe refresh hook; retries remain explicitly simulated until a real operations service is connected.
- Analysis tabs share one role-scoped persisted analysisSelectionStore object ID, with a persisted multi-selection override; resolve by stable IDs without replacing missing saved objects with unrelated files.
- System-management lists use the shared FullPagination and useListPagination on filtered rows; CrudTable pagination is opt-in to keep unrelated lists unchanged and preserve source indices for row actions.
- User and admin data/image routes reuse the same managers, statistics pages and image-statistics details; role changes navigation destinations and existing privileged actions, not layout or aggregation algorithms.
- Analysis tabs reuse AnalysisObjectSelector and analysisScope for file metadata-scoped demo observations and real image statistics; files without compatible measurements show empty states rather than invented values.
- ChinaMap renders bundled DataV China province GeoJSON with d3-geo, preserving the site callback and shared map color tokens; no runtime network request is needed.
- Mock file merging stores immutable source snapshots and the selected strategy on the generated filesStore row, so provenance survives source edits or deletion without changing source associations.
- ChartBox accepts an optional wrapper class for flex layouts so chart panels can fill a shared grid height without changing fixed-height charts elsewhere.
- Trait radar charts use Recharts with per-indicator normalization to independently derived physical-unit maxima, retaining unscaled values and sample statistics for tooltips and exports; reuse the installed library rather than adding a second chart engine.
- All app data (trees, files, images, profiles) lives in persisted global stores under `src/store/` (localStorage-backed via `createPersistedStore`); pages read/write only through these stores so the persistence layer can later be swapped for a real API.
- Images use the existing persisted imagesStore; imageData defines seed metadata and shared visibility/date/status helpers, and all statistics are derived from the currently accessible images so uploads, labels and deletions stay consistent.
- Demo dataset upgrades use optional persisted-store migrations to replace only identifiable old seed rows and preserve uploaded records and user folders.
- Image KPI drill-down links use a dedicated details route with metric and date-range search parameters, deriving records from the same imagesStore and visibility rules as the overview.

- Image visualization stores its multi-directory selection globally; a shared scope helper removes ancestor/descendant overlaps and drives both charts and KPI detail pages.
