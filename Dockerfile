FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY backend/pom.xml ./
COPY backend/src ./src
RUN mvn package -DskipTests
EXPOSE 8080
CMD ["java", "-jar", "target/ledgerflow-0.1.0.jar"]
