# Project
PROJECT_ROOT := $(shell pwd)
PROJECT_BIN := ./bin
APP_NAME = authx
APP_SRC := ./cmd/$(APP_NAME)
TEST_SRC := ./pkg/...
SRC_STATIC_WEB := ./pkg/api/web/static
SRC_TEMPLATES := ./pkg/api/web/templates
TARGET_STATIC_WEB := ./static
TARGET_TEMPLATES := ./templates

# Deployment
IMAGE_NAME := cybersamx/$(APP_NAME)

# Colorized print
BOLD := $(shell tput bold)
RED := $(shell tput setaf 1)
BLUE := $(shell tput setaf 4)
CYAN := $(shell tput setaf 6)
RESET := $(shell tput sgr0)

# Set up the default target all and set up phony targets.

.PHONY: all

all: run

##@ run: Run application

.PHONY: run

run: copy-files start-db-container
	@-echo "$(BOLD)$(BLUE)Running $(APP_NAME)...$(RESET)"
	@cd $(APP_SRC); go run .

##@ run: Install dependencies

.PHONY: install

install:
	@-echo "$(BOLD)$(BLUE)Installing dependencies...$(RESET)"
	@cd $(APP_SRC); go mod download

##@ build: Build application

.PHONY: build

build: copy-files
	@-echo "$(BOLD)$(BLUE)Building $(APP_NAME)...$(RESET)"
	@mkdir -p $(PROJECT_BIN)
	CGO_ENABLED=0 go build -o $(PROJECT_BIN) $(APP_SRC)

##@ copy-files: Copy the static directory

.PHONY: copy-files

copy-files:
	@-echo "$(BOLD)$(BLUE)Copying config files, web assets, and templates...$(RESET)"
	@-rm -rf $(PROJECT_BIN)/$(TARGET_STATIC_WEB)
	@-rm -rf $(PROJECT_BIN)/$(TARGET_TEMPLATES)
	@mkdir -p $(PROJECT_BIN)/$(TARGET_STATIC_WEB)
	@mkdir -p $(PROJECT_BIN)/$(TARGET_TEMPLATES)
	@cp -rf $(SRC_STATIC_WEB)/* $(PROJECT_BIN)/$(TARGET_STATIC_WEB)
	@cp -rf $(SRC_TEMPLATES)/* $(PROJECT_BIN)/$(TARGET_TEMPLATES)
	@cp $(APP_SRC)/config.yaml $(PROJECT_BIN)

##@ docker-build: Build Docker image

.PHONY: docker

docker:
	@-echo "$(BOLD)$(BLUE)Building $(APP_NAME) docker image...$(RESET)"
	@docker \
		build \
		-t $(IMAGE_NAME) \
		.

##@ lint: Run linter

.PHONY: lint

lint:
	@-echo "$(BOLD)$(BLUE)Linting $(APP_NAME)...$(RESET)"
	golangci-lint run -v

##@ format: Run gofmt

.PHONY: format

format:
	@-echo "$(BOLD)$(BLUE)Formatting $(APP_NAME)...$(RESET)"
	gofmt -e -s -w .

##@ test: Run tests

.PHONY: test

test: start-db-container
	@-echo "$(BOLD)$(CYAN)Running tests...$(RESET)"
	CGO_ENABLED=0 go test $(TEST_SRC) -v -count=1 -coverprofile cover.out
	go tool cover -func cover.out

##@ test-container: Run tests and databases as containers within a netwwork context (useful for CI)

.PHONY: test-container

test-containers:
	@-echo "$(BOLD)$(CYAN)Running tests and dependencies as docker containers...$(RESET)"
	@docker-compose -f docker/docker-compose.test.yaml up --build --abort-on-container-exit

##@ start-db-container: Start database containers if they aren't running in the background

.PHONY: start-db-container

start-db-container: scripts/start-db-container.sh
		@-echo "$(BOLD)$(BLUE)Starting database container...$(RESET)"
		$(PROJECT_ROOT)/scripts/start-db-container.sh

##@ end-db-container: End database containers if they are running in the background

.PHONY: end-db-container

end-db-container:
		@-echo "$(BOLD)$(BLUE)Ending database container...$(RESET)"
		@docker-compose -f docker/docker-compose.test.yaml down --volumes

##@ clean: Clean output files and build cache

.PHONY: clean

clean:
	@-echo "$(BOLD)$(RED)Removing build cache, test cache and files...$(RESET)"
	@-rm -rf $(PROJECT_BIN)
	go clean -testcache

##@ help: Help

.PHONY: help

help: Makefile
	@-echo " Usage:\n  make $(BLUE)<target>$(RESET)"
	@-echo
	@-sed -n 's/^##@//p' $< | column -t -s ':' | sed -e 's/[^ ]*/ &/2'
