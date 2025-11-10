# ---- Config ----
COMPOSE ?= docker compose

# Default env file (fall back to .env if you really want),
# but we provide explicit targets for dev/prod below.
ENV_FILE ?= .env.dev

# ---- Common macros ----
# Run compose with a specific env file.
define do_compose
	$(COMPOSE) --env-file $(1) $(2)
endef

# Show a friendly header
define banner
	@echo "======================================="
	@echo "$(1)"
	@echo "======================================="
endef

# ---- Dev targets ----
dev-up:
	$(call banner,Starting DEV stack)
	$(call do_compose,.env.dev,up -d)

dev-down:
	$(call banner,Stopping DEV stack)
	$(call do_compose,.env.dev,down)

dev-ps:
	$(call do_compose,.env.dev,ps)

dev-logs:
	$(call banner,Following DEV logs (ctrl+c to stop))
	$(call do_compose,.env.dev,logs -f db wordpress reverse-proxy)

dev-redeploy: dev-down dev-up dev-ps dev-logs

dev-build:
	$(call banner,Build DEV images)
	$(call do_compose,.env.dev,build)

# ---- Prod targets ----
prod-up:
	$(call banner,Starting PROD stack)
	$(call do_compose,.env.prod,up -d)

prod-down:
	$(call banner,Stopping PROD stack)
	$(call do_compose,.env.prod,down)

prod-ps:
	$(call do_compose,.env.prod,ps)

prod-logs:
	$(call banner,Following PROD logs (ctrl+c to stop))
	$(call do_compose,.env.prod,logs -f wordpress reverse-proxy)

prod-redeploy: prod-down prod-up prod-ps prod-logs

prod-build:
	$(call banner,Build PROD images)
	$(call do_compose,.env.prod,build)

# ---- Generic helpers ----
up:
	$(call banner,Starting stack using $(ENV_FILE))
	$(call do_compose,$(ENV_FILE),up -d)

down:
	$(call banner,Stopping stack using $(ENV_FILE))
	$(call do_compose,$(ENV_FILE),down)

ps:
	$(call do_compose,$(ENV_FILE),ps)

logs:
	$(call do_compose,$(ENV_FILE),logs -f)

build:
	$(call do_compose,$(ENV_FILE),build)

# ---- Testing targets ----
test-install:
	$(call banner,Installing test dependencies)
	cd tests && npm install

test:
	$(call banner,Running API tests)
	cd tests && npm test

test-watch:
	$(call banner,Running tests in watch mode)
	cd tests && npm run test:watch

test-coverage:
	$(call banner,Running tests with coverage)
	cd tests && npm run test:coverage

test-ci:
	$(call banner,Running tests in CI mode)
	cd tests && npm run test:ci

test-setup: dev-build dev-up
	$(call banner,Waiting for WordPress to be ready...)
	@timeout 180 bash -c 'until curl -k -f -s https://api.mycompany.local:8443/wp-json/ > /dev/null 2>&1; do sleep 5; echo "Waiting for WordPress..."; done' || (echo "WordPress failed to start" && exit 1)
	@echo "WordPress is ready!"

test-full: test-setup test-install test
	$(call banner,Full test suite completed)

test-clean:
	$(call banner,Cleaning test artifacts)
	cd tests && rm -rf node_modules coverage dist

