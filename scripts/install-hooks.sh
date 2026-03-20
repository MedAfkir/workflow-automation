#!/usr/bin/env bash

set -e

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "not inside a git working tree."
    echo "  Run this from the repo root after `git clone`."
    exit 1
fi

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

if [ ! -d ".githooks" ]; then
    echo ".githooks/ directory not found at repo root."
    echo "  Are you on the right branch?"
    exit 1
fi

git config core.hooksPath .githooks
echo "git core.hooksPath set to .githooks (local to this clone)."

chmod +x .githooks/* 2>/dev/null || true

echo
echo "Active hooks:"
for hook in .githooks/*; do
    name=$(basename "$hook")
    [ -x "$hook" ] && status="" || status="NOT EXECUTABLE"
    case "$name" in
        commit-msg)
            echo "  $status commit-msg  - Conventional Commits format check"
            ;;
        pre-commit)
            echo "  $status pre-commit  - secret leak scan + CRLF detection"
            ;;
        *)
            echo "  $status $name"
            ;;
    esac
done

echo
if command -v gitleaks >/dev/null 2>&1; then
    echo "gitleaks installed ($(gitleaks version 2>/dev/null | head -1)) - secret scan ACTIVE."
else
    cat <<'EOF'
gitleaks not found - secret scanning will be SKIPPED (the hook still
  runs but only does the CRLF check).
  Install (one of):
    brew install gitleaks                              # macOS
    scoop install gitleaks                             # Windows
    apt install gitleaks                               # Debian/Ubuntu (recent)
    https://github.com/gitleaks/gitleaks/releases      # binary download
EOF
fi

echo
echo "Done. Try a commit to see the hooks in action."
