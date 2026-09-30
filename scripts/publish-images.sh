#!/usr/bin/env bash

set -a
source .env
set +a

set -euo pipefail

REPOSITORY_URL="git@github.com:Som-Energia/webforms-link-generator.git"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_DIR="$SCRIPT_DIR/webforms-link-generator"

GIT_TAG="$(git describe --tags --always)"
TAG="${1:-}"
if [[ -z "$TAG" ]]; then
  read -r -p "Versió de la imatge (p. ex. 0.1.1) [$GIT_TAG]: " TAG
  TAG="${TAG:-$GIT_TAG}"
fi

if [[ -z "$TAG" ]]; then
  echo "Error: cal indicar una versió per a la imatge." >&2
  exit 1
fi

echo "Es publicarà la imatge: $IMAGE_URL:$TAG"
read -r -p "És correcta aquesta versió? [y/N]: " CONFIRMATION
if [[ ! "$CONFIRMATION" =~ ^[yYsS]$ ]]; then
  echo "Publicació cancel·lada."
  exit 0
fi

if [[ -e "$REPOSITORY_DIR" ]]; then
  if [[ ! -d "$REPOSITORY_DIR" ]] || ! git -C "$REPOSITORY_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Error: $REPOSITORY_DIR existeix però no és un repositori Git vàlid." >&2
    exit 1
  fi

  echo "S'utilitza el repositori existent: $REPOSITORY_DIR"
else
  echo "Clonant el repositori..."
  git clone "$REPOSITORY_URL" "$REPOSITORY_DIR"
fi

read -r -p "Usuari de Harbor: " HARBOR_USERNAME
read -r -s -p "Token de Harbor: " HARBOR_PASSWORD
echo

printf '%s' "$HARBOR_PASSWORD" | docker login harbor.somenergia.coop \
  --username "$HARBOR_USERNAME" \
  --password-stdin
unset HARBOR_PASSWORD

echo "Construint $IMAGE_URL$TAG..."
docker build --pull -t "$IMAGE_URL:$TAG" "$REPOSITORY_DIR"

echo "Publicant $IMAGE_URL:$TAG..."
docker push "$IMAGE_URL:$TAG"

echo
echo "Imatge publicada:"
docker inspect --format='{{index .RepoDigests 0}}' "$IMAGE_URL:$TAG"
