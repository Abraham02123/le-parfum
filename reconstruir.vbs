' Lanza reconstruir.sh sin abrir ninguna ventana. Lo usa la tarea programada «LeParfum_Reconstruir» (cada 5 minutos).
CreateObject("WScript.Shell").Run """C:\Program Files\Git\bin\bash.exe"" -lc ""/d/tienda-perfumes/reconstruir.sh""", 0, False
