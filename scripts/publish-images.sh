#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

set -a
source .env
set +a

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

read -r -p "Usuari de Harbor: " HARBOR_USERNAME
read -r -s -p "Token de Harbor: " HARBOR_PASSWORD
echo

printf '%s' "$HARBOR_PASSWORD" | docker login harbor.somenergia.coop \
  --username "$HARBOR_USERNAME" \
  --password-stdin
unset HARBOR_PASSWORD

echo "Construint $IMAGE_URL:$TAG..."
docker build --pull -t "$IMAGE_URL:$TAG" "$ROOT_DIR"

echo "Publicant $IMAGE_URL:$TAG..."
docker push "$IMAGE_URL:$TAG"

echo
echo "Imatge publicada:"
docker inspect --format='{{index .RepoDigests 0}}' "$IMAGE_URL:$TAG"

echo "Sol·licitant el redeploy a Portainer..."
bash "$SCRIPT_DIR/redeploy-portainer.sh" "$TAG"
