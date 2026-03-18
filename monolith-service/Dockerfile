# Build stage
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy root pom and common-lib first for better caching
COPY pom.xml .
COPY common-lib/ ./common-lib/
COPY monolith-service/ ./monolith-service/

# Build monolith-service
RUN mvn clean package -pl monolith-service -am -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=build /app/monolith-service/target/monolith-service-*.jar app.jar
COPY --from=build /app/monolith-service/src/main/resources/keys/ keys/

EXPOSE 8081

# RAM Optimization for Render Free (512MB)
ENV JAVA_OPTS="-Xms256m -Xmx400m -XX:+UseG1GC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
