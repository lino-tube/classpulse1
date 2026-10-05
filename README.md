# ClassPulse
**See learning problems before they become results.**

ClassPulse is a classroom prototype: students check their understanding, lecturers run an intervention, and students can get visual explanations or arrange individual help while the lesson continues.

## What is new
- **Seven-minute intervention:** all intervention labels, recommendations, history examples and the timer now use seven minutes. The timer starts at 07:00, survives refreshes, and uses a shared end time in live mode.
- **Visual Learning / Teaching Visuals:** a selected array topic becomes a diagram automatically. Students can follow the lecturer’s topic or explore their own example. Typed explanations and supported microphone transcription detect the most recently mentioned supported concept and update the diagram. Examples cover array creation, indexing, loops, one-dimensional arrays, and two-dimensional arrays. Diagrams can be downloaded as SVG pictures.
- **One-on-One Help:** requests can be sent at any time during a live lesson, including before or during an intervention. Students can save drafts; lecturers review requests and respond when available. The request includes a name, topic, specific questions and optional availability. Active duplicate requests for the same student and topic are prevented.
- **One-on-One Requests:** the lecturer accepts a request and enters a future date and time, chooses **On campus** (campus/building/room) or **Microsoft Teams** (an HTTPS meeting link), and adds preparation instructions. Students see pending, accepted, scheduled, declined or cancelled status. Lecturers can change appointments; students can cancel requests.
- **Live demo server:** messages, teaching topics, timer state and appointments are shared across browsers/devices connected to the same server. Failed updates are queued per tab and retried while the tab stays open.
- The existing **My Voice**, classroom check-ins, dashboards, history and settings remain included.

## Start the live demo (recommended)
Python 3 is required for the included server; no Python packages are needed.
1. Extract the ZIP. Open the extracted `classpulse` folder in VS Code.
2. Open **Terminal → New Terminal** in that folder.
3. Run `python server.py` (Windows also supports `py -3 server.py`).
4. Open `http://localhost:8000` in your browser.
5. Use separate tabs for Student and Lecturer, with the credentials below. Enter only email and password; the account determines the workspace automatically.

On Windows, you can also double-click `start-demo.bat` inside the folder and then open `http://localhost:8000`.

### Demonstrate on separate devices
Run `python server.py --host 0.0.0.0` on the lecturer’s computer. Connect the devices to the same trusted Wi-Fi, then open `http://COMPUTER-LAN-IP:8000` on each device, replacing `COMPUTER-LAN-IP` with the computer’s local network IPv4 address. The computer’s firewall must allow the demo port. The default server binds only to the host computer until this option is used. This is a single-class demonstration, not a publicly secured service.

Microphone transcription may be unavailable over plain HTTP on another device. For reliable microphone testing, use the host’s `localhost` page or an HTTPS deployment, in a browser with speech-recognition support. Typed explanations and shared lecturer topics work without microphone access.

### Static / local mode
Opening `index.html` directly, or using a plain static server such as VS Code Live Server, still runs the UI without the included live backend. Shared updates then rely on localStorage and only work across tabs in the same browser/origin. Direct file URLs have browser-specific storage behavior. Use `server.py` for cross-device demonstrations.

## Demo credentials
| Role | Email | Password |
| --- | --- | --- |
| Student | ST12344@rcconnect.edu.za | Student123 |
| Lecturer | lecturer@rcconnect.edu.za | Lecturer123 |

There is no role selector. Student accounts open the student dashboard; lecturer accounts open the lecturer dashboard. Opening a page for the other role is denied and redirects to the account’s own dashboard with an access-denied notice. Mixed account credentials are rejected.

Logins are per-tab. The prototype uses one shared class and demo accounts. A student’s one-on-one request identity is stored on that browser/device, so return on the same browser to see that student’s appointments. Different devices can submit separate requests with their own names.

## Suggested demonstration
1. Sign in as Lecturer and open **Teaching Visuals**. Choose **Array Indexing** and press **Try a sample explanation**. The diagram highlights index 2 and shows `numbers[2] = 30`.
2. Sign in as Student in another tab or connected device. Open **Visual Learning**. Leave **Follow the lecturer** enabled to see the shared topic. Uncheck it to explore your own values, type a new explanation, or listen through your microphone.
3. For microphone testing, let the lecturer know first and press **Start listening**. Say “A two-dimensional array has rows and columns”. The picture changes to a grid. Use **Stop listening** when finished. If recognition ends, press Start listening again to resume. Editing the topic, values or transcript automatically switches the student to their own visual. You can correct a misheard transcript manually.
4. On the lecturer side, open **Interventions**, then **Start 7-Minute Intervention**. Student **One-on-One Help** accepts requests immediately; the countdown does not restrict sending. For a quick presentation, the lecturer can use the clearly labelled **Complete intervention (demo)** button to simulate completion. Refreshing the intervention page keeps the countdown.
5. At any time during the lesson, a student who needs individual help opens **One-on-One Help**, enters the topic and questions, then sends the request. The lecturer can leave it awaiting review until they are available. After the timer finishes, re-check the classroom pulse as usual.
6. The lecturer opens **One-on-One Requests**, accepts, and sets a future date and time, then chooses a campus location or pastes a Microsoft Teams meeting link. The student can click **Join Microsoft Teams meeting** for online appointments. The student sees the appointment and preparation instructions automatically. Times are explicitly labelled with the lecturer’s device time zone.
7. Existing **My Voice** contributions can also be sent privately or queued for the lecturer to play. Connect the lecturer device to a speaker through operating system audio/Bluetooth settings.

## Visual learning boundaries
The pictures are generated as precise SVG topic diagrams by JavaScript. This version does **not** call an AI image service or generate arbitrary pictures from arbitrary lessons. Topic recognition uses keywords for the five array topics listed above. Number lists such as “values 10, 20, 30, 40” can populate the example; “index 2” chooses the highlighted element. Other explanations retain the selected diagram. Students or lecturers should check that the recognised topic matches the lesson.

Speech-to-text uses the browser’s available `SpeechRecognition` service and an English (South Africa) language setting. Availability depends on the browser, permissions and its recognition service. The browser may process audio through an external service. ClassPulse stores no raw audio; shared lecturer transcripts are visible to the demo class. Transcription starts only after a button press. Unsupported browsers keep topic selection, typed explanations, samples and shared visuals working. Voice and microphone actions explain their fallback when selected, rather than silently remaining disabled.

## Demo limitations and data
Authentication and role guards are browser-side demonstrations, not secure access controls. The server shares demo state without authenticated per-user permissions. “Private” messages are separated in the interface but are not confidential against someone inspecting the demo API/storage. Use sample information; production needs secure authentication, access rules, encrypted transport and per-class isolation.

The lecturer metrics and re-check improvement are still sample/simulated statistics, not computed from all connected students. The support request workflow, appointments, diagrams, timer and shared updates are functional demonstration features.

The server saves demo content in `demo-state.json` beside `server.py`. To start a clean demo, stop the server and delete that generated file, then restart. For local-only mode, clear the site’s browser storage. Pending outgoing updates are kept in the originating tab’s session storage; keep that tab open when offline. A completed update appears on other connected devices after the next refresh cycle (about 1.5 seconds).

## Main files
- Student: `student-dashboard.html`, `student-checkin.html`, `student-confirmation.html`, `visual-learning.html`, `student-support.html`
- Lecturer: `lecturer-dashboard.html`, `live-session.html`, `intervention.html`, `teaching-visuals.html`, `lecturer-support.html`, `history.html`, `session-summary.html`, `settings.html`
- Shared UI: `css/styles.css`, `js/app.js`, `js/auth.js`
- Features: `js/student.js`, `js/lecturer.js`, `js/voice.js`, `js/learning.js`, `js/visuals.js`, `js/support.js`, `js/live.js`
- Live demo: `server.py`, `start-demo.bat`

## If a button seems unavailable
- **One-on-one request:** prepare and send it at any time during the lesson. There is no requirement to start or finish an intervention first. The lecturer reviews requests when available. The seven-minute timer and its demo completion control are independent of requests.
- **Visual topic / text:** editing automatically leaves Follow the lecturer, so you can explore without unlocking fields first. Re-enable Follow the lecturer to receive class updates.
- **Microphone / voice:** browsers without speech support show an explanation and retain typed alternatives. Stop listening is available only while microphone transcription is running.
- **Connection:** a slow or missing demo server times out so page controls can initialise in local mode. Cross-device updates require the included server, while local-mode requests appear in lecturer tabs in the same browser/origin.
