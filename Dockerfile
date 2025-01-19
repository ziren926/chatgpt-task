FROM node:18-alpine AS frontendbuilder
WORKDIR /app
COPY . .
RUN cd /app && cd ui && npm install && CI=false npm run build && cd ..
RUN cd /app && mkdir -p public
RUN cp -r ui/build/* public/

# 第二阶段：构建 Go 应用
FROM golang:1.19-alpine3.18 AS binarybuilder
RUN apk --no-cache --no-progress add git
WORKDIR /app
COPY . .
COPY --from=frontendbuilder /app/public /app/public
RUN cd /app && ls -la && go mod tidy && go build .

# 第三阶段：最终镜像
FROM alpine:latest
ENV TZ="Asia/Shanghai"
RUN apk --no-cache --no-progress add \
    ca-certificates \
    tzdata && \
    cp "/usr/share/zoneinfo/$TZ" /etc/localtime && \
    echo "$TZ" >  /etc/timezone
WORKDIR /app
COPY --from=binarybuilder /app/nav /app/

VOLUME ["/app/data"]
EXPOSE 6412
ENTRYPOINT [ "/app/nav" ]