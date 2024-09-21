VERSION := unknown
GIT_REVISION := $(shell git rev-parse --short HEAD)
DB_MONITOR_VERSION = $(shell cat cmd/db-monitor/VERSION)
LOG_COLLECTOR_VERSION = $(shell cat cmd/log-collector/VERSION)
BUILD_DIR := $(shell pwd)/build
GO_BIN := go

build: test clean
	# build server
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GO_BIN) build -trimpath -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.GitRevision=$(GIT_REVISION) -w -s" -o ./build/linux/minerva ./cmd/minerva
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(GO_BIN) build -trimpath -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.GitRevision=$(GIT_REVISION) -w -s" -o ./build/windows/minerva.exe ./cmd/minerva
	#CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 $(GO_BIN) build -trimpath -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.GitRevision=$(GIT_REVISION) -w -s" -o ./build/darwin/minerva ./cmd/minerva

	@cp ./config/minerva.yaml ./build/linux/minerva.yaml
	# @cp ./config/minerva.yaml ./build/windows/minerva.yaml
	# @cp ./config/minerva.yaml ./build/darwin/minerva.yaml
	# package
	# @mkdir ./release

build-ldapcli: 
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GO_BIN) build -trimpath -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.GitRevision=$(GIT_REVISION) -w -s" -o ./build/linux/ldapcli ./cmd/ldapcli
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(GO_BIN) build -trimpath -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.GitRevision=$(GIT_REVISION) -w -s" -o ./build/windows/ldapcli.exe ./cmd/ldapcli

build-sqlite-zig: test clean
	$(MAKE) build-sqlite-zig-windows
	$(MAKE) build-sqlite-zig-linux
	@cp ./config/minerva.yaml ./build/minerva.yaml

build-sqlite-zig-windows: 
	CGO_ENABLED=1 GOOS=windows GOARCH=amd64 \
	CC="zig cc -target x86_64-windows-gnu" \
	CXX="zig c++ -target x86_64-windows-gnu" \
	$(GO_BIN) build \
		-trimpath \
		-tags="sqlite" \
		-ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.GitRevision=$(GIT_REVISION) -w -s" \
		-o ./build/windows/minerva.exe \
		./cmd/minerva

build-sqlite-zig-linux:
	CGO_ENABLED=1 GOOS=linux GOARCH=arm64 \
	CC="zig cc -target aarch64-linux-musl" \
	CXX="zig c++ -target aarch64-linux-musl" \
	CGO_CFLAGS="-D_LARGEFILE64_SOURCE" \
	$(GO_BIN) build \
		-trimpath \
		-tags="sqlite" \
		-ldflags "-X github.com/waylen888/tab-buddy/g.Version=$(VERSION) -X github.com/waylen888/tab-buddy/g.GitRevision=$(GIT_REVISION) -w -s" \
		-o ./build/linux/tabbud \
		.

build-sqlite: test clean
	xgo \
		-go="go-1.19.7" \
		-targets="windows/amd64,linux/amd64" \
		-tags="sqlite" \
		-trimpath \
		-ldflags="-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.GitRevision=$(GIT_REVISION) -w -s" \
		-out="./build/minerva" \
		./cmd/minerva


test: 
	$(GO_BIN) test -covermode=atomic -race ./...

release: build
	@mkdir -p release
	@mv ./build/linux/ ./release/minerva && tar -zcf ./release/minerva-linux-$(VERSION).tar ./release/minerva

build-app:
	npm run build -prefix=app

build-doc:
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 $(GO_BIN) build -trimpath -ldflags "-w -s" -o ./build/darwin/doc ./cmd/doc
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(GO_BIN) build -trimpath -ldflags "-w -s" -o ./build/windows/doc.exe ./cmd/doc

build-owl:
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 $(GO_BIN) build -trimpath -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -w -s" -o ./build/darwin/owl-darwin ./cmd/owl
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GO_BIN) build -trimpath -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -w -s" -o ./build/linux/owl-linux ./cmd/owl
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(GO_BIN) build -trimpath -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -w -s" -o ./build/windows/owl-windows.exe ./cmd/owl
	@echo "$(VERSION)" > $(BUILD_DIR)/VERSION
	@tar -zcvf ./build/minerva-owl-bin-$(VERSION).tar.gz \
	-C $(BUILD_DIR) VERSION \
	-C $(BUILD_DIR)/darwin owl-darwin \
	-C $(BUILD_DIR)/linux owl-linux \
	-C $(BUILD_DIR)/windows owl-windows.exe

build-3tpbeat:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GO_BIN) build -ldflags "-w -s" -o ./build/linux/3tpbeat ./cmd/3tpbeat

build-ployip:
	$(eval PID=$(filter-out $@,$(MAKECMDGOALS)))
%:      # thanks to chakrit
	@:    # thanks to William Pursell
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GO_BIN) build -ldflags "-X main.PID=$(PID) -w -s" -o ./build/linux/ployip ./cmd/ployip
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(GO_BIN) build -ldflags "-X main.PID=$(PID) -w -s" -o ./build/windows/ployip.exe ./cmd/ployip

build-logmaker:
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 $(GO_BIN) build -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -w -s" -o ./build/darwin/logmaker-darwin ./cmd/logmaker
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GO_BIN) build -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -w -s" -o ./build/linux/logmaker-linux ./cmd/logmaker
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(GO_BIN) build -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -w -s" -o ./build/windows/logmaker-windows.exe ./cmd/logmaker

build-tinyproc:
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 $(GO_BIN) build -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -w -s" -o ./build/darwin/tinyproc-darwin ./cmd/tinyproc
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GO_BIN) build -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -w -s" -o ./build/linux/tinyproc-linux ./cmd/tinyproc
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(GO_BIN) build -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -w -s" -o ./build/windows/tinyproc-windows.exe ./cmd/tinyproc

build-selectfile:
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(GO_BIN) build -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -w -s" -o ./build/windows/selectfile.exe ./cmd/selectfile

build-log-collector:
	$(GO_BIN) build -ldflags "-X main.Version=$(LOG_COLLECTOR_VERSION) -w -s" -o ./build/darwin/log-collector ./cmd/log-collector
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GO_BIN) build -ldflags "-X main.Version=$(LOG_COLLECTOR_VERSION) -w -s" -o ./build/linux/log-collector ./cmd/log-collector
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(GO_BIN) build -ldflags "-X main.Version=$(LOG_COLLECTOR_VERSION) -w -s" -o ./build/windows/log-collector.exe ./cmd/log-collector

build-snpmockserver:
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(GO_BIN) build -ldflags "-X gitlab01.mitake.com.tw/RD1/GO/mitake-minerva.git/v2/g.Version=$(VERSION) -w -s" -o ./build/windows/snpmockserver.exe ./cmd/snpmockserver

clean:
	@rm -rf ./build
	@rm -rf ./release

compile-protobuf:
	protoc --proto_path=proto --go_out=. --go-grpc_out=. proto/*/*.proto
	
.PHONY: clean test