#!/usr/bin/env bash
# Refresh every clean git clone under the reference-clones root to upstream
# default-branch tip (depth-1, blobless). Detach at FETCH_HEAD.
# Evidence only — not package vendoring.
#
# Env:
#   LLM_WIKI_REPOS_ROOT                 clone directory (default: <git-toplevel>/repos
#                                       or ./repos if not in a git work tree)
#   LLM_WIKI_REFRESH_TIMEOUT_SECONDS    per-remote timeout (default: 30)

set -u

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if project_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"; then
  :
else
  project_root="$(cd -- "$script_dir/.." && pwd)"
fi

reference_root="${LLM_WIKI_REPOS_ROOT:-$project_root/repos}"
network_timeout_seconds="${LLM_WIKI_REFRESH_TIMEOUT_SECONDS:-30}"

if [[ ! -d "$reference_root" ]]; then
  printf 'reference clone directory does not exist: %s\n' "$reference_root" >&2
  printf 'create it or set LLM_WIKI_REPOS_ROOT; acquire clones first.\n' >&2
  exit 1
fi
if [[ ! "$network_timeout_seconds" =~ ^[1-9][0-9]*$ ]]; then
  printf 'refresh timeout must be a positive integer: %s\n' \
    "$network_timeout_seconds" >&2
  exit 1
fi

failures=0
refreshed=0
skipped=0

printf 'repository\tresult\tbefore\tafter\tupstream_default\n'

shopt -s nullglob
for repository in "$reference_root"/*; do
  [[ -d "$repository" ]] || continue
  git -C "$repository" rev-parse --git-dir >/dev/null 2>&1 || continue

  name="${repository#"$reference_root"/}"
  before="$(git -C "$repository" rev-parse --short=12 HEAD 2>/dev/null || printf 'unknown')"

  if [[ -n "$(git -C "$repository" status --porcelain 2>/dev/null)" ]]; then
    printf '%s\tfailed-dirty\t%s\t%s\t-\n' "$name" "$before" "$before"
    skipped=$((skipped + 1))
    failures=$((failures + 1))
    continue
  fi

  remote_url="$(git -C "$repository" remote get-url origin 2>/dev/null || true)"
  if [[ -z "$remote_url" ]]; then
    printf '%s\tfailed-no-origin\t%s\t%s\t-\n' "$name" "$before" "$before"
    failures=$((failures + 1))
    continue
  fi

  remote_head="$(
    timeout "$network_timeout_seconds" \
      git ls-remote --symref "$remote_url" HEAD 2>/dev/null
  )"
  remote_status=$?
  if (( remote_status != 0 )); then
    printf '%s\tfailed-remote-query\t%s\t%s\t-\n' \
      "$name" "$before" "$before"
    failures=$((failures + 1))
    continue
  fi

  default_ref="$(
    printf '%s\n' "$remote_head" |
      awk '$1 == "ref:" { print $2; exit }'
  )"
  default_branch="${default_ref#refs/heads/}"
  if [[ -z "$default_ref" || "$default_branch" == "$default_ref" ]]; then
    printf '%s\tfailed-no-default-branch\t%s\t%s\t-\n' "$name" "$before" "$before"
    failures=$((failures + 1))
    continue
  fi

  if ! timeout "$network_timeout_seconds" \
    git -C "$repository" fetch \
      --depth=1 \
      --filter=blob:none \
      --prune \
      origin \
      "$default_branch" >/dev/null 2>&1; then
    printf '%s\tfailed-fetch\t%s\t%s\t%s\n' \
      "$name" "$before" "$before" "$default_branch"
    failures=$((failures + 1))
    continue
  fi

  if ! git -C "$repository" switch --detach FETCH_HEAD >/dev/null 2>&1; then
    printf '%s\tfailed-checkout\t%s\t%s\t%s\n' \
      "$name" "$before" "$before" "$default_branch"
    failures=$((failures + 1))
    continue
  fi

  if git -C "$repository" show-ref --verify --quiet \
    "refs/heads/$default_branch"; then
    if ! git -C "$repository" update-ref \
      "refs/heads/$default_branch" \
      FETCH_HEAD; then
      printf '%s\tfailed-local-ref\t%s\t%s\t%s\n' \
        "$name" "$before" "$before" "$default_branch"
      failures=$((failures + 1))
      continue
    fi
  fi

  after="$(git -C "$repository" rev-parse --short=12 HEAD)"
  printf '%s\trefreshed\t%s\t%s\t%s\n' \
    "$name" "$before" "$after" "$default_branch"
  refreshed=$((refreshed + 1))
done
shopt -u nullglob

printf 'summary\trefreshed=%d\tskipped=%d\tfailed=%d\t-\n' \
  "$refreshed" "$skipped" "$failures"

if (( failures > 0 )); then
  exit 1
fi
