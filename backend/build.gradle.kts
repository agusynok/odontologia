import org.gradle.api.artifacts.dsl.LockMode

plugins {
    java
    id("org.springframework.boot") version "4.2.0"
}

group = "dev.odontologia"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
        vendor = JvmVendorSpec.ADOPTIUM
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(platform(org.springframework.boot.gradle.plugin.SpringBootPlugin.BOM_COORDINATES))
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-flyway")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.eclipse.angus:angus-mail")
    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("org.flywaydb:flyway-database-postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

val integrationTest = sourceSets.create("integrationTest") {
    compileClasspath += sourceSets.main.get().output
    runtimeClasspath += sourceSets.main.get().output
}

configurations[integrationTest.implementationConfigurationName]
    .extendsFrom(configurations.testImplementation.get())
configurations[integrationTest.runtimeOnlyConfigurationName]
    .extendsFrom(configurations.testRuntimeOnly.get())

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

if (providers.gradleProperty("entregaLocal").isPresent) {
    val frontendDirectory = layout.projectDirectory.dir("../frontend")
    val npm = if (System.getProperty("os.name").startsWith("Windows", ignoreCase = true)) {
        listOf("cmd.exe", "/d", "/c", "npx.cmd", "--yes", "npm@12.2.3")
    } else {
        listOf("npx", "--yes", "npm@12.2.3")
    }

    val installFrontend = tasks.register<Exec>("installDeliveryFrontend") {
        workingDir(frontendDirectory.asFile)
        commandLine(npm + "ci")
    }

    val buildFrontend = tasks.register<Exec>("buildDeliveryFrontend") {
        dependsOn(installFrontend)
        workingDir(frontendDirectory.asFile)
        commandLine(npm + listOf("run", "build"))
    }

    tasks.bootJar {
        dependsOn(buildFrontend)
        archiveClassifier.set("local")
        from(frontendDirectory.dir("dist")) {
            into("BOOT-INF/classes/static")
        }
    }
}

tasks.register<Test>("integrationTest") {
    description = "Comprueba migraciones, arranque y concurrencia contra bases efímeras en PostgreSQL."
    group = "verification"
    testClassesDirs = integrationTest.output.classesDirs
    classpath = integrationTest.runtimeClasspath
    shouldRunAfter(tasks.test)
    // La disponibilidad de PostgreSQL y las variables locales cambian fuera del árbol de fuentes.
    outputs.upToDateWhen { false }
    outputs.doNotCacheIf("La conexión real debe comprobarse en cada ejecución") { true }
}

dependencyLocking {
    lockAllConfigurations()
    lockMode = LockMode.STRICT
}

tasks.register("resolveAndLockAll") {
    description = "Resuelve todas las configuraciones; usar --write-locks solo al actualizar dependencias."
    doLast {
        configurations.filter { it.isCanBeResolved }.forEach { it.resolve() }
    }
}
