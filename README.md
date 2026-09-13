# Smart Mudra Detection Website

A browser-based prototype that uses MediaPipe Hands to detect hand landmarks and estimate mudra accuracy.

## Features

- Real-time webcam hand tracking
- Mudra classification (Gyan, Apana, Prana)
- Confidence score for detected/selected mudra
- Rule-level testing points for each mudra (pass/fail percentage per finger rule)

## How to Run

1. Open this folder in VS Code.
2. Use Live Server extension OR any static server:

```powershell
# from this folder
python -m http.server 5500
```

3. Open `http://localhost:5500` in browser.
4. Allow camera access.

## Testing Tips

- Keep one hand visible and centered.
- Use good lighting.
- Hold mudra still for at least 2 seconds.
- Use the "Target Mudra for Test" dropdown to force score one mudra and verify specific rule points.

## Important

This is a training/feedback tool, not medical advice.
