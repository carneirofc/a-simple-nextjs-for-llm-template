# src/i18n

## Purpose

Internationalisation: supported locales, dictionaries, locale negotiation/routing helpers, formatting. Built on Next 16 primitives only (`[lang]` root segment, `src/proxy.ts`, `next/root-params`) — no i18n library.

## Ownership

- `config.ts` — `locales` (first = default), `Locale` (from Zod enum), `localeNames`, `LOCALE_COOKIE`, `hasLocale`.
- `dictionaries/en.ts` — source-of-truth strings + `Dictionary` / `ValidationKey` types. `dictionaries/<locale>.ts` — typed `Dictionary`.
- `dictionaries.ts` — `getDictionaryFor(locale)`; `server.ts` — `getLocale()` / `getDictionary()` via `next/root-params`.
- `negotiate.ts` (Accept-Language), `localize-path.ts` (prefix helpers), `interpolate.ts` (`{name}` placeholders), `format.ts` (`Intl` formatting), `locale-switcher.tsx`.
- Routing lives in `src/proxy.ts` (redirects unprefixed URLs: cookie → Accept-Language → default; sets the cookie on prefixed URLs).

## Local Contracts

- **No hard-coded user-visible strings** anywhere in `src/app`, `src/features` or `src/components`. Add a key to `dictionaries/en.ts` and every other locale in the same change (typecheck fails otherwise).
- Server Components: `await getDictionary()` / `await getLocale()` (no prop drilling). They do **not** work in Client Components, Server Actions or Route Handlers.
- Client Components receive the dictionary slice they need as props (`labels: Dictionary["notes"]["form"]`) plus `locale` when formatting. Never import a whole dictionary into a client component — except error boundaries (`error.tsx`), which use `getDictionaryFor` because they cannot receive props.
- Zod error messages are `ValidationKey`s (`.min(1, "required" satisfies ValidationKey)`); UI translates them with `<FieldErrors messages={dictionary.validation} />`.
- Placeholders: `"{count} items"` + `interpolate()`. Plurals: `new Intl.PluralRules(locale)` choosing between keys (`one`/`other`). Dates/numbers: add a helper to `format.ts`; never `toLocaleString()` without an explicit locale.
- Dates render in UTC (labelled) so server and client output match; switching to user time zones requires passing the zone from the server.
- Internal links include the locale: `` `/${locale}/path` `` (use `localizePath` for computed paths).
- Adding a locale: append to `locales`, add `localeNames` entry, add `dictionaries/<locale>.ts`, register it in `dictionaries.ts`, add a test case.

## Work Guidance

- Keep dictionary files under the 150-line limit by splitting namespaces into `dictionaries/<locale>/<namespace>.ts` once they grow.

## Verification

- `pnpm typecheck` (dictionary completeness), `pnpm test` (`src/i18n/*.test.ts`, `src/proxy.test.ts`).

## Child Index

None.
