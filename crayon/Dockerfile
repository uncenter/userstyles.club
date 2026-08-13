FROM node:26-alpine AS build
WORKDIR /repo
RUN npm install -g pnpm@11

COPY . .
RUN pnpm install --filter=crayon... --frozen-lockfile
RUN pnpm --filter @userstyles.club/atcute generate
RUN pnpm --filter crayon build

RUN echo "injectWorkspacePackages: true" >> pnpm-workspace.yaml
RUN pnpm --filter crayon deploy /repo/out

FROM node:26-alpine AS runtime
WORKDIR /repo/crayon
ENV NODE_ENV=production
COPY --from=build /repo/out .
RUN rm -f pnpm-lock.yaml pnpm-workspace.yaml

CMD ["node", "dist/main.js"]
