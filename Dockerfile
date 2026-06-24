# syntax=docker/dockerfile:1

# --- deps: install node modules ---
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- builder: build Next standalone output + install chromium ---
FROM node:22-slim AS builder
WORKDIR /app
# Browsers live at a fixed, copyable path (outside node_modules).
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# Install chromium + its OS dependencies into the builder. --with-deps pulls the
# apt libs; the browser binary lands under /ms-playwright.
RUN npx playwright install --with-deps chromium

# --- runner: minimal production image with chromium available ---
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
# Tell playwright-core where the browser binaries are.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Install the chromium OS runtime libraries in the runner. We use the playwright
# package (copied below into node_modules) to install the exact deps it needs.
# Done after node_modules are present so `npx playwright` resolves locally.

# Next standalone output (strips node_modules to a traced subset).
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# The standalone tracer does NOT include playwright / @google-cloud/storage
# because they are declared serverExternalPackages (intentionally not bundled).
# Copy the runtime packages (and their deps) into the standalone node_modules so
# they resolve at runtime.
COPY --from=builder /app/node_modules ./node_modules

# Copy the chromium browser binaries built in the builder stage.
COPY --from=builder /ms-playwright /ms-playwright

# Install the chromium OS libraries in this final image.
RUN npx playwright install-deps chromium && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 8080
CMD ["node", "server.js"]
