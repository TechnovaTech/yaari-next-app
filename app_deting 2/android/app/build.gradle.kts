import org.gradle.api.tasks.Copy

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.app_deting"
    compileSdk = flutter.compileSdkVersion
    // Align NDK with plugin expectation (agora_rtc_engine pins r27)
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.app_deting"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName

        // CleverTap manifest placeholders mapped from gradle.properties
        val ctAccountId = (project.findProperty("CLEVERTAP_ACCOUNT_ID") ?: "") as String
        val ctToken = (project.findProperty("CLEVERTAP_TOKEN") ?: "") as String
        val ctRegion = (project.findProperty("CLEVERTAP_REGION") ?: "") as String
        manifestPlaceholders["CLEVERTAP_ACCOUNT_ID"] = ctAccountId
        manifestPlaceholders["CLEVERTAP_TOKEN"] = ctToken
        manifestPlaceholders["CLEVERTAP_REGION"] = ctRegion
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    // Resolve duplicate native libs between agora_rtm and aosl transitive
    packagingOptions {
        jniLibs {
            pickFirsts += setOf("**/libaosl.so")
        }
    }
}

flutter {
    source = "../.."
}

// Ensure Flutter tool can locate the APK in project-root build folder
// by copying Android's module output after assemble tasks.
val flutterOutputDir = file("../../build/app/outputs/flutter-apk")

tasks.register<Copy>("copyFlutterApkDebug") {
    val apkDebug = file("$buildDir/outputs/apk/debug/app-debug.apk")
    from(apkDebug)
    into(flutterOutputDir)
}

tasks.register<Copy>("copyFlutterApkRelease") {
    val apkRelease = file("$buildDir/outputs/apk/release/app-release.apk")
    from(apkRelease)
    into(flutterOutputDir)
}

// Attach copy tasks only after the Android plugin has registered assemble tasks
afterEvaluate {
    tasks.findByName("assembleDebug")?.finalizedBy(tasks.named("copyFlutterApkDebug"))
    tasks.findByName("assembleRelease")?.finalizedBy(tasks.named("copyFlutterApkRelease"))
}
