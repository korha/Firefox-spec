user.js config file:
custom user.js settings, improve privacy and security.

useraddon@addon.xpi:
Features:
- Avoid proxy settings for large files (speed vs privacy, e.g.: Youtube media files, maps images, panorams and etc.);
- Use additional proxy for sites which blocked clients from Tor network;
- Decode obfuscated and redirected links (privacy, prevent tracking);
- Remove analytics data from URLs (privacy, e.g.: UTM-labels);
- Redirect some CDN requests to local CDN - load files from local disk.
(efficiency, privacy, save bandwith, currently support: ajax.aspnetcdn.com, ajax.googleapis.com, code.jquery.com, yastatic.net);
- Whitelist cookies stored between sessions;
- Block nonstandard (HTTP:80, HTTPS:443) ports;
- Block IP-addresses from private network ranges;
- Force HTTPS if available (like a HTTPS-Everywhere);
- Redirect to Onion-mirror if available;
- Fix some sites which broken if referer header is disabled;
- Add whitelist cookies (stored between sessions);
- Fix HTTPS + Mixed Content problem on some sites (e10s bug: bugzil.la/1261585)
- Force HTTP-only cookies (disable available via JS) (security);
- Force HTTPS cookies if received from HTTPS (security);
- Fix CloudFlare links ("path" part URL trimmed after captcha by default);
- Prompt HTTP redirects if needed (301/302/303/307 response code);
- Add custom headers for important sites (Content-Security-Policy, Referrer-Policy, X-Content-Type-Options, X-Frame-Options, X-Xss-Protection);
- Toggle Offline mode, media allowed, SVG enabled, images, cookies, stict TLS (disable TLSv1.0/v1.1), unsafe TLS negotiation (RFC 5746) buttons;
- other minor fixes.

useraddonhelper@addon.xpi:
Provide "Copy direct link" feature in "Save File" dialog - download files directly (avoid current proxy settings)
Right-button mouse gestures:
U - scroll to top;
UR - open selected links in new tabs;
R - switch to next tab;
DR - close current tab;
D - scroll to bottom;
DL - load homepage in new tab;
L - switch to previous tab;
UL - copy selected links to clipboard.

useraddonpolicy@addon.xpi:
Custom content policy:
Allow: JavaScripts, Images, StyleSheets, top-level Documents, XBL, XmlHttpRequests, DTD, Fetch, ImageSet;
Block: Objects (plugins), Refresh, Ping, Object-SubRequests (plugins), external Fonts, CSP-reports, XSLT, Beacons, WebManifests;
Whitelist: WebSockets;
Frames: "Click-to-Load" feature (similar to built-in "Click-to-Play" for plugins)

useraddonsizeround@addon.xpi (WebExtension):
Round inner window size to 200x100 by timeout (prevent window size fingerprint via JS or CSS Media Queries)
