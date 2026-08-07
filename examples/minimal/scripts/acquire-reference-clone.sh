#!/usr/bin/env bash
# Acquire one latest-only, blobless reference clone (optional sparse paths).
# Evidence only — not package vendoring.
#
# Usage:
#   acquire-reference-clone.sh --name NAME --url URL [--sparse path ...]
#   acquire-reference-clone.sh --name NAME --url URL --branch main
#
# Env:
#   LLM_WIKI_REPOS_ROOT                 clone directory (default: <git-toplevel>/repos)
#   LLM_WIKI_REFRESH_TIMEOUT_SECONDS    network timeout (default: 30)

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if project_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"; then
  :
else
  project_root="$(cd -- "$script_dir/.." && pwd)"
fi

reference_root="${LLM_WIKI_REPOS_ROOT:-$project_root/repos}"
network_timeout_seconds="${LLM_WIKI_REFRESH_TIMEOUT_SECONDS:-30}"

name=""
url=""
branch=""
sparse_paths=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      name="${2:-}"
      shift 2
      ;;
    --url)
      url="${2:-}"
      shift 2
      ;;
    --branch)
      branch="${2:-}"
      shift 2
      ;;
    --sparse)
      shift
      while [[ $# -gt 0 && "$1" != --* ]]; do
        sparse_paths+=("$1")
        shift
      done
      ;;
    -h | --help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *)
      printf 'unknown argument: %s\n' "$1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$name" || -z "$url" ]]; then
  printf 'usage: %s --name NAME --url URL [--branch BR] [--sparse path ...]\n' \
    "$(basename "$0")" >&2
  exit 2
fi
if [[ ! "$network_timeout_seconds" =~ ^[1-9][0-9]*$ ]]; then
  printf 'timeout must be a positive integer: %s\n' "$network_timeout_seconds" >&2
  exit 2
fi
if [[ "$name" == *\/* || "$name" == "." || "$name" == ".." ]]; then
  printf 'name must be a single path segment: %s\n' "$name" >&2
  exit 2
fi

target="$reference_root/$name"
if [[ -e "$target" ]]; then
  printf 'already exists: %s\n' "$target" >&2
  exit 1
fi

mkdir -p "$reference_root"

clone_args=(
  clone
  --depth=1
  --filter=blob:none
  --single-branch
)
if [[ -n "$branch" ]]; then
  clone_args+=(--branch "$branch")
fi
if ((${#sparse_paths[@]} > 0)); then
  clone_args+=(--sparse --no-checkout)
fi
clone_args+=("$url" "$target")

if ! timeout "$network_timeout_seconds" git "${clone_args[@]}"; then
  printf 'clone failed or timed out: %s\n' "$url" >&2
  rm -rf "$target"
  exit 1
fi

if ((${#sparse_paths[@]} > 0)); then
  git -C "$target" sparse-checkout init --cone
  git -C "$target" sparse-checkout set "${sparse_paths[@]}"
  if [[ -n "$branch" ]]; then
    git -C "$target" checkout "$branch"
  else
    git -C "$target" checkout
  fi
fi

# Detach at current HEAD so the working tree is a pure evidence pin target.
head_commit="$(git -C "$target" rev-parse HEAD)"
git -C "$target" switch --detach "$head_commit" >/dev/null

printf 'acquired\t%s\t%s\t%s\n' \
  "$name" \
  "$(git -C "$target" rev-parse --short=12 HEAD)" \
  "$(git -C "$target" remote get-url origin)"
printf 'path\t%s\n' "$target"
