# Releasing

Releases are automated with [changesets](https://github.com/changesets/changesets).
Publishing happens from CI, never from a laptop.

## Day-to-day

Any change that should appear in a release gets a changeset:

```bash
npm run changeset
```

Pick a bump type and describe the change in the consumer's terms — what they can now
do, or what no longer breaks. The file lands in `.changeset/` and is committed with
the work it describes.

Changes that need no release (CI config, tests, internal refactors) don't need one.
Use `npx changeset add --empty` if CI complains and you're sure.

### Bump types

| Type    | When                                                      |
| ------- | --------------------------------------------------------- |
| `patch` | Bug fixes, docs, internal changes with no API effect.     |
| `minor` | New props, new languages, new behaviour that is additive. |
| `major` | Anything a consumer must change their code for.           |

Since this library's purpose is `vue-diff` parity, **removing or renaming a prop is a
major** even if it seems unused — the migration promise in the README depends on it.

## What CI does

Once activated (see below), [`release.yaml`](.github/workflows/release.yaml) runs on
every push to `main` and either:

1. **Opens or updates a "chore: version packages" PR** if changesets are pending. The
   PR applies the bumps, writes `CHANGELOG.md`, and deletes the consumed changesets.
2. **Publishes to npm** if no changesets remain — i.e. once that PR is merged.

So a release is: merge the version PR. Nothing else.

## One-time setup

> **Nothing below has been done yet, and none of it should be until the library has
> been tested extensively in a real application.** Publishing is currently blocked
> three ways: `release.yaml`'s push trigger is commented out, no npm credentials
> exist, and the repo is private. This section is the eventual runbook, not a
> checklist to work through now.

These are not in the workflow files because they're configured outside the repo.
**All of them require the repo to be public.**

### 0. Re-enable what was switched off during development

Several triggers were deliberately disabled while the project was unstable. None of
them announce themselves, so check each one before shipping:

| File                                 | Change                                                |
| ------------------------------------ | ----------------------------------------------------- |
| `.github/workflows/ci.yaml`          | Uncomment the `push` trigger.                         |
| `.github/workflows/release.yaml`     | Uncomment the `push` trigger (after step 1 below).    |
| `.github/workflows/deploy-demo.yaml` | Uncomment the `push` trigger (after the demo exists). |
| `.github/dependabot.yaml`            | npm interval back to `weekly`, PR limit back to `5`.  |

Security advisories were never affected — those are unscheduled.

### 1. npm trusted publishing (OIDC)

Publishing uses OIDC rather than a long-lived `NPM_TOKEN`, so there's no secret to
leak or rotate.

For the very first publish the package doesn't exist yet, so there's nothing to
configure trusted publishing on. Publish `0.1.0` manually once:

```bash
npm run verify
npm publish --access public --provenance
```

To rehearse this without publishing anything, `npm publish --dry-run` prints the
tarball contents and exits. `npm pack` writes the same tarball to disk, which you can
install into a test app with `npm install ../vue-diff-next/vue-diff-next-0.1.0.tgz` —
a closer simulation of a real consumer than `file:` linking, since it goes through the
`files` allowlist and the `exports` map.

Then on npmjs.com, under the package's **Settings → Trusted publishing**, add:

- Publisher: **GitHub Actions**
- Organization/user: `dmhendricks`
- Repository: `vue-diff-next`
- Workflow filename: `release.yaml`

Every later release goes through CI with no token.

### 2. GitHub Pages

In **Settings → Pages**, set **Source** to **GitHub Actions**. Do not pick a branch —
[`deploy-demo.yaml`](.github/workflows/deploy-demo.yaml) uploads an artifact, which the
branch-based source ignores.

### 3. Allow Actions to open PRs

In **Settings → Actions → General → Workflow permissions**, enable **Allow GitHub
Actions to create and approve pull requests**. Without it the version PR fails to open
with a permissions error, even though the workflow requests `pull-requests: write`.

## Verifying a release

```bash
npm view vue-diff-next version
npm view vue-diff-next dist.attestations   # provenance was recorded
```

Provenance links the published tarball to the commit and workflow that built it, and
shows as a verified badge on npm.
