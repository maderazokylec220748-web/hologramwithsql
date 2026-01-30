# Simple test script to test the API
Write-Host "Testing WIS AI API with filtered context..." -ForegroundColor Cyan

$uri = "http://localhost:5002/api/chat/message"
$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    question = "What scholarships do you offer?"
    conversationHistory = @()
} | ConvertTo-Json

Write-Host "Sending request to $uri" -ForegroundColor Yellow
Write-Host "Question: What scholarships do you offer?" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body $body -TimeoutSec 45
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Response received!" -ForegroundColor Green
        $jsonResponse = $response.Content | ConvertFrom-Json
        Write-Host "`n💬 Answer:" -ForegroundColor Cyan
        Write-Host $jsonResponse.answer
        Write-Host "`n📁 Category: $($jsonResponse.category)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Error: HTTP $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "Make sure the server is running on port 5002!" -ForegroundColor Yellow
}
