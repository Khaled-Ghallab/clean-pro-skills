# EVAL FIXTURE — intentionally insecure Dockerfile. Never run, copy, or deploy.
FROM node:latest                 # I10: mutable base, no pin

ARG NPM_TOKEN                    # I9: build arg persists in history
ENV API_KEY=sk_live_PLANTED     # I9: secret baked into a layer

WORKDIR /app
COPY . .                        # ships .git/.env if no .dockerignore
RUN npm install

CMD ["node", "server.js"]       # I8: no USER — runs as root
