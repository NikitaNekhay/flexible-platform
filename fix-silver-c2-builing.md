 Run these commands to fix them:                              
               
──# Fix the C2 entrypoint script (most likely cause)─────────────────────────────────────────────────────────────────────
  sed -i 's/\r//' ".\lab/backend/lab/provision/c2-docker-entrypoint.sh"               
  sed─-i─'s/\r//'─".\lab/lab/provision/c2-server.sh"
  and the same for other sh files in the lab/provision folder.
                                                                                                                         
  Or if you're on PowerShell/Windows, use dos2unix inside the container or convert with:                                 
                                                                                                                         
  # PowerShell - convert all entrypoint scripts                                                                          
(Get-Content ".\lab\provision\c2-docker-entrypoint.sh" -Raw) -replace "`r`n", "`n" | Set-Content ".\lab\provision\c2-docker-entrypoint.sh" -NoNewline

(Get-Content ".\lab\provision\c2-server.sh" -Raw) -replace "`r`n", "`n" | Set-Content ".\lab\provision\c2-server.sh" -NoNewline

(Get-Content ".\lab\provision\victim-linux.sh" -Raw) -replace "`r`n", "`n" | Set-Content ".\lab\provision\victim-linux.sh" -NoNewline

(Get-Content ".\lab\provision\victim-docker-entrypoint.sh" -Raw) -replace "`r`n", "`n" | Set-Content ".\lab\provision\victim-docker-entrypoint.sh" -NoNewline

  Then to prevent it happening again, configure Git to not convert line endings for these files. Add to .gitattributes:

  *.sh text eol=lf

  After fixing, rebuild the container:

  docker compose up --build sliver-c2

  The root cause: Git on Windows may check out files with CRLF line endings. The Linux container then sees bash\r in the
  shebang which is invalid.