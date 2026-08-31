@echo off
set JAVA_HOME=d:\Project\JamDigitalMasjid\android-tv\jdk17\jdk-17.0.12+7
set ANDROID_HOME=d:\Project\JamDigitalMasjid\android-tv\android_sdk
set PATH=%JAVA_HOME%\bin;%PATH%
echo JAVA_HOME=%JAVA_HOME%
java -version
gradlew.bat clean test 2>&1
