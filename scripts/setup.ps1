Write-Host "Setting up Jam Digital Masjid Foundation..."
Write-Host "Installing backend dependencies..."
Set-Location backend
npm install
Set-Location ..
Write-Host "Installing admin dependencies..."
Set-Location admin
npm install
Set-Location ..
Write-Host "Copying environment files..."
Copy-Item backend\.env.example backend\.env
Copy-Item admin\.env.example admin\.env
Write-Host "Setup complete!"
