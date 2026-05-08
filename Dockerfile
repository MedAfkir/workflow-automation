# syntax=docker/dockerfile:1.7

FROM bellsoft/liberica-openjdk-alpine:26 AS builder

WORKDIR /build

COPY gradlew ./
COPY gradle ./gradle
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew

COPY settings.gradle build.gradle ./
COPY core/core-domain/build.gradle              core/core-domain/
COPY core/core-engine/build.gradle              core/core-engine/
COPY core/core-plugin-sdk/build.gradle          core/core-plugin-sdk/
COPY infrastructure/infra-persistence/build.gradle  infrastructure/infra-persistence/
COPY infrastructure/infra-templating/build.gradle   infrastructure/infra-templating/
COPY infrastructure/infra-yaml/build.gradle         infrastructure/infra-yaml/
COPY infrastructure/infra-secrets/build.gradle      infrastructure/infra-secrets/
COPY infrastructure/infra-secrets-vault/build.gradle infrastructure/infra-secrets-vault/
COPY applications/app-api/build.gradle          applications/app-api/

COPY core ./core
COPY infrastructure ./infrastructure
COPY applications ./applications

RUN ./gradlew --no-daemon :applications:app-api:bootJar -x test

FROM bellsoft/liberica-openjdk-alpine:26 AS extractor

WORKDIR /tmp/extract
COPY --from=builder /build/applications/app-api/build/libs/app-api-1.0-SNAPSHOT.jar app.jar
RUN java -Djarmode=tools -jar app.jar extract --layers --launcher

FROM bellsoft/liberica-openjre-alpine:26

RUN apk add --no-cache curl tini

RUN addgroup -S workflow && adduser -S -G workflow workflow

WORKDIR /app

COPY --from=extractor --chown=workflow:workflow /tmp/extract/app/dependencies/         ./
COPY --from=extractor --chown=workflow:workflow /tmp/extract/app/spring-boot-loader/   ./
COPY --from=extractor --chown=workflow:workflow /tmp/extract/app/snapshot-dependencies/ ./
COPY --from=extractor --chown=workflow:workflow /tmp/extract/app/application/          ./

USER workflow

EXPOSE 8080

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl --fail --silent http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["/sbin/tini", "--", "sh", "-c", "exec java --enable-preview $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
