try {
    Write-Host "Testando endpoint do Google Calendar..." -ForegroundColor Yellow
    
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/google/calendar/events" -Method GET -ContentType "application/json"
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Blue
    Write-Host $response.Content
    
} catch {
    Write-Host "Erro ao testar endpoint:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
        Write-Host "Response: $($_.Exception.Response.Content.ReadAsStringAsync().Result)"
    }
}