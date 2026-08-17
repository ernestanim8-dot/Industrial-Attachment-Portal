$body = @{
    name = "Test Admin"
    email = "testadmin@test.com"
    password = "password123"
    role = "admin"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body $body
    Write-Host "SUCCESS:"
    $response | ConvertTo-Json
} catch {
    Write-Host "ERROR:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        Write-Host $reader.ReadToEnd()
    }
}
