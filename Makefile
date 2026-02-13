# Kimagure Project Makefile

.PHONY: build dev dev-stop dev-emu dev-front deploy-web deploy-funcs format test clean verify

# Build
build:
	pnpm run build

build-local:
	node scripts/generate-releases.js
	pnpm --filter @kimagure/backend build && pnpm --filter @kimagure/frontend build

# Development
dev: build-local
	@echo "Starting Emulators (Debug Mode)..."
	npx firebase emulators:start --config firebase.json

dev-stop:
	@echo "Stopping existing emulator processes..."
	-@powershell -Command "Get-NetTCPConnection -LocalPort 5001, 8080, 5000, 9099, 4000, 4400, 4500 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $$_.OwningProcess -Force -ErrorAction SilentlyContinue }"

# Deployment
deploy: build
	npx firebase deploy

# Code Quality
format:
	pnpm biome format --write .

lint:
	pnpm biome check .

fix:
	pnpm biome check --write .
	pnpm --filter @kimagure/frontend lint --fix

# Testing
test:
	pnpm test

# Verification Cycle
verify:
	@powershell -Command "if (!(Test-Path .tmp)) { New-Item -ItemType Directory -Path .tmp }"
	make fix
	make lint > .tmp/lint.log
	pnpm --filter @kimagure/backend test > .tmp/test.log
	make build-local > .tmp/build.log
	@echo "Verification successful. Cleaning up .tmp..."
	@powershell -Command "Remove-Item .tmp/* -Force"

# Android
android-build:
	@echo "Syncing Android project with bubblewrap (preserving version)..."
	@pwsh -ExecutionPolicy Bypass -File scripts/update_android_project.ps1
	cd android && gradlew bundleRelease
	@pwsh -ExecutionPolicy Bypass -Command "Copy-Item android/app/build/outputs/bundle/release/app-release.aab android/app-release.aab -Force"
	@echo "Build complete. AAB is located at: android/app-release.aab"

android-release:
	@echo "Updating Android project with bubblewrap (incrementing version)..."
	@powershell -ExecutionPolicy Bypass -Command "Copy-Item twa-manifest.json android/twa-manifest.json -Force"
	cd android && bubblewrap update --yes
	@powershell -ExecutionPolicy Bypass -Command "Copy-Item android/twa-manifest.json twa-manifest.json -Force"
	cd android && gradlew bundleRelease
	@powershell -ExecutionPolicy Bypass -Command "Copy-Item android/app/build/outputs/bundle/release/app-release.aab android/app-release.aab -Force"
	@echo "Release build complete. AAB is located at: android/app-release.aab"

android-clean:
	cd android && gradlew clean
