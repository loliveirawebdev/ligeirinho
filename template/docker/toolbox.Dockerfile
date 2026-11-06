# The one image with every tool, pinned to exact versions (rules/stack.md). The host only needs Docker and make.
FROM mcr.microsoft.com/playwright:v1.65.0-noble

ARG PNPM_VERSION=9.15.4
ARG GITLEAKS_VERSION=8.30.0

RUN npm install --global pnpm@${PNPM_VERSION} \
  && architecture="$(dpkg --print-architecture | sed 's/amd64/x64/')" \
  && curl -fsSL "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_${architecture}.tar.gz" \
     | tar -xz -C /usr/local/bin gitleaks \
  && git config --system --add safe.directory '*'

# Dependencies and caches live in volumes, never in the mounted folder (slow on macOS).
ENV npm_config_store_dir=/pnpm-store \
    NX_CACHE_DIRECTORY=/nx-cache \
    NX_DAEMON=false \
    NX_NO_CLOUD=true \
    NX_PARALLEL=3

WORKDIR /workspace
