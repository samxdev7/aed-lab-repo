# Etapa 1: Build (Maven + JDK 21)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cachear dependencias: solo se re-descargan si cambia el pom.xml
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Compilar el proyecto
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# Etapa 2: Runtime (solo JRE 21, imagen liviana)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Usuario sin privilegios (buena práctica de seguridad)
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copiar el JAR ejecutable generado por spring-boot-maven-plugin
COPY --from=build /app/target/*.jar app.jar

# Render inyecta la variable PORT; 8080 es el valor por defecto en local
ENV PORT=8080
EXPOSE 8080

# Ajusta la JVM al límite de memoria del contenedor (Render free = 512 MB)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseSerialGC"

# Shell form para expandir ${PORT} y ${JAVA_OPTS}; exec para que la JVM reciba SIGTERM
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT} -jar app.jar"]
