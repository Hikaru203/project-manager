FROM maven:3.9-eclipse-temurin-21-alpine as builder
WORKDIR /app
COPY pom.xml .
COPY common-lib common-lib
COPY api-gateway api-gateway
COPY project-service project-service
COPY task-service task-service
COPY comment-service comment-service
COPY notification-service notification-service
COPY audit-service audit-service

RUN mvn clean install -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/notification-service/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
