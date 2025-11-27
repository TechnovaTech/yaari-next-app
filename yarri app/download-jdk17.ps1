$url = "https://download.java.net/java/GA/jdk17.0.2/dfd4a8d0985749f896bed50d7138ee7f/8/GPL/openjdk-17.0.2_windows-x64_bin.zip"
$output = "jdk17.zip"
Write-Host "Downloading Java 17..."
Invoke-WebRequest -Uri $url -OutFile $output
Write-Host "Extracting..."
Expand-Archive -Path $output -DestinationPath "." -Force
Write-Host "Java 17 downloaded to: jdk-17.0.2"
