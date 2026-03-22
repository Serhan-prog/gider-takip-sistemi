FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

ENV TZ=Europe/Istanbul

COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p uploads

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]