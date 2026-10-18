# D-Team by Darius Niesporek – Website-Vorschau

Passwortgeschützte Vorschau der neuen Website von D-Team by Darius Niesporek.

Alle Inhalte und Fotos sind verschlüsselt (PBKDF2-SHA256 mit 600.000 Runden,
AES-256-CBC, HMAC-SHA256) und werden erst im Browser nach Eingabe des Passworts
entschlüsselt. Dieses Repository enthält deshalb keinen lesbaren Seiteninhalt.

Die Dateien werden aus dem unverschlüsselten Quellordner mit
`tools/build_protected.py` erzeugt und nicht von Hand bearbeitet.
