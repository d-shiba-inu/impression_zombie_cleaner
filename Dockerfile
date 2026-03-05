# 1. ベースイメージの定義
ARG RUBY_VERSION=3.2.0
FROM registry.docker.com/library/ruby:$RUBY_VERSION-slim as base

WORKDIR /rails

# 本番環境の設定
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development"

# 2. ビルド用ステージ（ここで Node.js と Gem を入れるワン）
FROM base as build

# Node.js (v20) とビルドに必要なパッケージをインストール
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    curl \
    git \
    libpq-dev \
    libvips \
    pkg-config \
    gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && apt-get install nodejs -y

# Gem のインストール
COPY Gemfile Gemfile.lock ./
COPY vendor/gems/ /rails/vendor/gems/
RUN bundle install && \
    bundle exec bootsnap precompile --gemfile

# 🌟 フロントエンドの準備（ここが追加ポイント！）
COPY package.json package-lock.json ./
RUN npm install

# 全ファイルをコピー
COPY . .

# 🌟 Docker の中で React をビルドするワン！
RUN npm run build

# Bootsnap と Rails アセットのプリコンパイル
RUN bundle exec bootsnap precompile app/ lib/ && \
    SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

# 3. 実行用ステージ（最終的な軽いイメージ）
FROM base

# 実行に必要な最小限のパッケージだけ入れるワン
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libvips postgresql-client && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# ビルドステージで作った成果物をコピー
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY --from=build /rails /rails

# セキュリティ設定
RUN useradd rails --create-home --shell /bin/bash && \
    chown -R rails:rails db log storage tmp
USER rails:rails

ENTRYPOINT ["/rails/bin/docker-entrypoint"]
EXPOSE 3000
CMD ["./bin/rails", "server"]