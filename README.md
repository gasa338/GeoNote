# GeoNote — location reminders (version 2.0)

React Native app (Expo SDK 58, Expo Router, TypeScript).
Draw a **zone** around a place, add a note or a task list, and get a notification
(or an alarm) the moment you enter it, leave it, or both — also when the app is closed (APK).
Zones can be edited and deleted from the zone details or the "⋮" button in any zone list.
The app also watches itself: if the phone puts it to sleep to save battery, it tells you
(Settings → Location & notifications → "Is GeoNote working?", see `src/features/health/`).

- **Map:** OpenStreetMap via Leaflet — no Google key. Optional free CARTO key (`EXPO_PUBLIC_CARTO_KEY` in `.env`) for the design's map style.
- **Languages:** English (main) and Serbian.
- **Sections:** Map · My zones · More (Places nearby, Following, Events, Account, Settings).
  Places, posts and stories are invented examples until the Django API exists.
- **Code guide (Serbian):** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (once) |
| `npm start` | Run in **Expo Go** on your phone (scan the QR code) |
| `npm run start:tunnel` | Same, if phone and PC are not on the same Wi-Fi |
| `npm run start:dev` | Run with a development build instead of Expo Go |
| `npm run android:local` | Build on your PC — **only with Android Studio + USB phone** (otherwise: “adb ENOENT”) |
| `npm run generate:map` | Rebuild the bundled Leaflet + marker icons (after updating `leaflet`) |
| `npm run docs` | Generate code documentation into `docs/api/` (open `docs/api/index.html`) |
| `npm run typecheck` | Check types (`tsc --noEmit`) |
| `npm run lint` | Check code style |

### Build an APK to test on the phone (Windows, EAS)

```powershell
npx eas-cli@latest login            # once
$env:EAS_NO_VCS=1                   # only if the folder is not a git repository
npx eas-cli@latest build --profile preview --platform android
```


## Logo

The "GeoNote" wordmark is drawn in `src/components/Logo.tsx`. To use an image instead, save it as
`assets/images/logo.png` and set `USE_IMAGE_LOGO = true` in that file.
The phone home-screen icon is `assets/images/icon.png` (1024 × 1024) plus the `android-icon-*.png` files — needs a new build.

## Expo Go vs real build

| | Expo Go (`npm start`) | Real build (APK) |
|---|---|---|
| Location tracking | while the app is open | also when the app is closed |
| "All the time" location permission | not needed | needed |
| Settings → Testing → *Live distance* | ✓ | – |

The app detects this automatically (`src/utils/runtime.ts → IS_EXPO_GO`).

## Testing

1. Settings → **Location & notifications → Ask for all permissions** (in the APK choose location **"Allow all the time"**).
2. Add a zone (choose Notification or Alarm, and On entering / On leaving / Both).
3. Settings → Testing → **Arrive at …** fires the reminder immediately.
4. Real test: close the app and walk to the place.
5. On Xiaomi / Samsung / Huawei: Settings → Apps → GeoNote → Battery → **Unrestricted**.
6. The card **Is GeoNote working?** shows what may block reminders, with a **Fix** button for each.

## Django model (for phase 2)

Matches `src/data/types.ts → Zone` and `src/data/api/mappers.ts → ZoneDTO`:

```python
class Zone(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    address = models.CharField(max_length=255, null=True, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    radius = models.PositiveIntegerField(default=200)
    kind = models.CharField(max_length=10, choices=[("personal", "Personal"), ("shopping", "Shopping"), ("task", "Errand")])
    content_mode = models.CharField(max_length=4, choices=[("note", "Note"), ("list", "List")])
    note = models.TextField(blank=True)
    checklist = models.JSONField(default=list)   # [{id, text, done}]
    trigger = models.CharField(max_length=5, choices=[("enter", "Enter"), ("exit", "Exit"), ("both", "Both")])
    repeat = models.CharField(max_length=6, choices=[("always", "Always"), ("once", "Once")])
    alert_style = models.CharField(max_length=12, choices=[("notification", "Notification"), ("alarm", "Alarm")])
    active = models.BooleanField(default=True)
    reset_checklist_on_trigger = models.BooleanField(default=False)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    last_trigger_event = models.CharField(max_length=5, null=True, blank=True)  # "enter" / "exit"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

Ids are UUIDs created on the phone. Keep the local copy as the source for reminders (the
background task must work without internet) and add a sync step — see `docs/ARCHITECTURE.md`.
