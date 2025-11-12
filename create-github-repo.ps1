# PowerShell script to create GitHub repository
# You'll need to provide your GitHub personal access token

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
}

$body = @{
    name = "medical-triage-system"
    description = "Full-stack Medical Triage System for hospitals - React frontend with NestJS backend, real-time queue management, and patient tracking"
    private = $false
    auto_init = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "Repository created successfully!" -ForegroundColor Green
    Write-Host "Repository URL: $($response.html_url)" -ForegroundColor Cyan
    Write-Host "Clone URL: $($response.clone_url)" -ForegroundColor Cyan
    
    # Add remote and push
    git remote add origin $response.clone_url
    git push -u origin main
    
    Write-Host "Code pushed to GitHub successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Error creating repository: $($_.Exception.Message)" -ForegroundColor Red
}
