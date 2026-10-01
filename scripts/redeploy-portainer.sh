#!/usr/bin/env bash

# Redeploy a Portainer stack while preserving its stored configuration.
set -euo pipefail

if [[ $# -ne 1 ]]; then
  printf 'Usage: %s IMAGE_TAG\n' "${0##*/}" >&2
  exit 2
fi

IMAGE_TAG="$1"
PORTAINER_URL="${PORTAINER_URL:?set PORTAINER_URL}"
PORTAINER_API_TOKEN="${PORTAINER_API_TOKEN:?set PORTAINER_API_TOKEN}"
PORTAINER_STACK_NAME="${PORTAINER_STACK_NAME:?set PORTAINER_STACK_NAME}"
PORTAINER_URL="${PORTAINER_URL%/}"

curl_args=(
  --fail-with-body
  --silent
  --show-error
  --header "X-API-Key: $PORTAINER_API_TOKEN"
  --header 'Content-Type: application/json'
)
if [[ "${PORTAINER_INSECURE_TLS:-}" == "1" ]]; then
  curl_args+=(--insecure)
fi

portainer_request() {
  local method="$1"
  local path="$2"
  local payload="${3:-}"

  if [[ -n "$payload" ]]; then
    curl "${curl_args[@]}" --request "$method" --data "$payload" "$PORTAINER_URL$path"
  else
    curl "${curl_args[@]}" --request "$method" "$PORTAINER_URL$path"
  fi
}

stacks="$(portainer_request GET /api/stacks)"
if ! stack="$(jq -ce --arg name "$PORTAINER_STACK_NAME" 'map(select(.Name == $name)) | first // empty' <<<"$stacks")"; then
  printf "Portainer stack '%s' was not found.\n" "$PORTAINER_STACK_NAME" >&2
  exit 1
fi

stack_id="$(jq -er '.Id' <<<"$stack")"
endpoint_id="$(jq -er '.EndpointId' <<<"$stack")"
stack_file="$(portainer_request GET "/api/stacks/$stack_id/file")"
stack_detail="$(portainer_request GET "/api/stacks/$stack_id")"

environment="$(jq -ce --arg tag "$IMAGE_TAG" '
  (.Env // []) as $env
  | if any($env[]; .name == "IMAGE_TAG")
    then $env | map(if .name == "IMAGE_TAG" then .value = $tag else . end)
    else $env + [{"name": "IMAGE_TAG", "value": $tag}]
    end
' <<<"$stack_detail")"
prune="$(jq -ce '.Option.Prune // false' <<<"$stack_detail")"
stack_file_content="$(jq -er '.StackFileContent' <<<"$stack_file")"
payload="$(jq -cn \
  --arg stack_file_content "$stack_file_content" \
  --argjson environment "$environment" \
  --argjson prune "$prune" \
  '{StackFileContent: $stack_file_content, Env: $environment, Prune: $prune, RepullImageAndRedeploy: true}')"

portainer_request PUT "/api/stacks/$stack_id?endpointId=$endpoint_id" "$payload" >/dev/null
printf "Portainer stack '%s' redeploy requested with IMAGE_TAG=%s.\n" "$PORTAINER_STACK_NAME" "$IMAGE_TAG"
