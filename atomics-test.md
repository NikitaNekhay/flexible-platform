 # 1. List all atomics
  curl -s -H "Authorization: Bearer <TOKEN>" http://localhost:8080/api/v1/atomics | head -c 2000
    curl -s http://localhost:8080/api/v1/atomics | head -c 2000

  # 2. Get single atomic detail (replace T1059.001 with a real technique ID from the list)
  curl -s -H "Authorization: Bearer <TOKEN>" http://localhost:8080/api/v1/atomics/T1059.001 | head -c 2000