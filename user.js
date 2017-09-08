//=============== Channel Prefs ===============
user_pref("app.update.channel", "no");//No update channel

//=============== Security Prefs ===============
user_pref("security.tls.insecure_fallback_hosts", "");//Disable insecure fallback (default)
user_pref("security.tls.unrestricted_rc4_fallback", false);//Disable RC4 fallback (default, removed in FF53+)
user_pref("security.tls.enable_0rtt_data", false);//Disable TLS1.3 0-RTT (round-trip time) (default)

user_pref("security.ssl.treat_unsafe_negotiation_as_broken", true);//Mark insecure TLS handshake
user_pref("security.ssl.require_safe_negotiation", true);//Disable insecure TLS handshake
user_pref("security.ssl.enable_ocsp_stapling", true);//Enable OCSP stapling (default)
user_pref("security.ssl.enable_false_start", true);//Enable TLS False Start (default)

user_pref("security.remember_cert_checkbox_default_setting", false);//Disable auto check remember cert
user_pref("security.ask_for_password", 1);//Ask for the master password every time it's needed
user_pref("security.password_lifetime", 1);//Ask for the master password every 1 min (only if security.ask_for_password;2)

user_pref("security.family_safety.mode", 0);//Disable detecting Family Safety mode and importing the root cert (only Win8.1+) (TB default)

user_pref("security.enterprise_roots.enabled", false);//Disable enterprise root certs (default)

user_pref("security.OCSP.enabled", 0);//Don't use OCSP for certificate validation
user_pref("security.OCSP.require", true);//Error when OCSP request fail (if OCSP enabled)

user_pref("security.pki.sha1_enforcement_level", 1);//All SHA1 certs are blocked

user_pref("security.pki.name_matching_mode", 3);//Only use name information from the SAN ('2'/'1' fall back to the Common Name for certs valid before 23 Aug '2015'/'2016')

user_pref("security.pki.netscape_step_up_policy", 3);//id-Netscape-stepUp is never considered equivalent to id-kp-serverAuth ('2'/'1' considered equivalent when the notBefore 23 August '2015'/'2016')

user_pref("security.pki.certificate_transparency.mode", 0);//Disable Certificate Transparency support (default)

user_pref("security.webauth.u2f", false);//Disable U2F (default)
user_pref("security.webauth.u2f_enable_softtoken", false);//Disable U2F soft token (default)
user_pref("security.webauth.u2f_enable_usbtoken", false);//Disable U2F USB token (default)

user_pref("security.ssl.errorReporting.enabled", false);//Disable TLS error reporting (TB default)
user_pref("security.ssl.errorReporting.url", "https://0.0.0.0/");//Spoof TLS error reporting URL
user_pref("security.ssl.errorReporting.automatic", false);//Disable automatic TLS error reporting (default)

user_pref("security.mixed_content.send_hsts_priming", false);//Disable HTST priming request to attempt to see if mixed-content available over HTTPS
user_pref("security.mixed_content.use_hsts", false);//Don't change the order of evaluation of mixed-content and HSTS upgrades

//=============== All Prefs ===============
user_pref("keyword.enabled", false);//Disable send non-URLs entered in the LocationBar to the search engine (default)
user_pref("general.useragent.locale", "en-US");//Unify app locale (TB default)
user_pref("general.useragent.compatMode.firefox", false);//Disable compatibility mode (default)

user_pref("general.useragent.site_specific_overrides", false);//Disable override the useragent for a specific site

user_pref("general.warnOnAboutConfig", false);//Disable warning on about:config page

user_pref("browser.bookmarks.max_backups", 0);//Disable bookmarks backups

user_pref("browser.cache.disk.enable", false);//Disable disk cache (TB default)

user_pref("browser.cache.disk.smart_size.first_run", false);//Disable first-time cache smart-sizing
user_pref("browser.cache.disk.smart_size.enabled", false);//Disable cache smart-sizing
user_pref("browser.cache.disk.capacity", 0);//Size (in KB) disk cache (if not smart-sizing)
user_pref("browser.cache.memory.enable", true);//Enable memory cache (default)

user_pref("browser.cache.disk_cache_ssl", false);//Disable disk cache for TLS (if disk cache enabled)

user_pref("browser.cache.offline.enable", false);//Disable Offline cache (TB default)
user_pref("offline-apps.allow_by_default", false);//Offline apps prompt for use offline cache (if offline cache enabled)

user_pref("browser.cache.offline.capacity", 0);//None of Offline cache size

user_pref("offline-apps.quota.warn", 1);//Warned if Offline app disk exceeds this amount (in KB)

user_pref("browser.download.forbid_open_with", true);// Don't show "Open with" option on download dialog

user_pref("dom.indexedDB.enabled", false);//Disable IndexedDB (TB default)
user_pref("dom.indexedDB.experimental", false);//Disable IndexedDB experimental features (default)

user_pref("dom.fileHandle.enabled", false);//Disable File Handle (low-level disk files operations, need Indexed DB)

user_pref("dom.select_events.enabled", false);//Disable selection events***

user_pref("dom.select_events.textcontrols.enabled", false);//Selection events on text controls are enabled (if selection events enabled)

//user_pref("dom.workers.enabled", false);//Disable Web Workers (as TB)

user_pref("dom.serviceWorkers.enabled", false);//Disable ServiceWorkers (default)

user_pref("dom.enable_performance", false);//Disable DOM Performance (performance.timing.* values) (TB default)

user_pref("dom.enable_resource_timing", false);//Disable resource timings (performance.GetEntries* values) (TB default)

user_pref("dom.enable_user_timing", false);//Disable high-resolution timing markers (TB default, removed in FF55+)

user_pref("dom.enable_performance_observer", false);//Disable Performance Observer API (active in Nightly)

user_pref("dom.requestIdleCallback.enabled", false);//Disable RequestIdleCallback API (active in Nightly, true in FF55+)

user_pref("dom.gamepad.enabled", false);//Disable Gamepad API (TB default)
user_pref("dom.gamepad.test.enabled", false);//Disable Gamepad API test (default)
user_pref("dom.gamepad.non_standard_events.enabled", false);//Disable Gamepad API nonstandard events (active in Alpha)
user_pref("dom.gamepad.extensions.enabled", false);//Disable Gamepad API extensions (default, true in FF55+)

user_pref("dom.keyboardevent.code.enabled", false);//Disable KeyboardEvent.code (removed in FF55+)

user_pref("dom.keyboardevent.dispatch_during_composition", false);//Disable TextEventDispatcher dispatches keydown and keyup events even during composition (default)

user_pref("browser.display.use_document_fonts", 0);//Never use document fonts (limit fonts to prevent fingerprint)***

user_pref("browser.display.background_color", "#D8D8D8");//Default background color

user_pref("browser.send_pings", false);//Disable pings (this attributes would be useful for letting websites track visitors clicks) (default, TB default)
user_pref("browser.send_pings.max_per_link", 0);//None of pings that are sent per link click (if pings enabled)
user_pref("browser.send_pings.require_same_host", true);//Only send pings to the same host (if pings enabled)

user_pref("browser.helperApps.deleteTempFileOnExit", true);//Delete temporary files on exit

user_pref("mathml.disabled", true);//Disable MatML (TorButton High/Medium level)

user_pref("media.cache_size", 0);//Media cache size in KB (TB default)

user_pref("media.play-stand-alone", false);//Don't play video opened as top-level documents

user_pref("media.navigator.enabled", false);//Disable Media Navigator (media device enumeration for WebRTC) (TB default)
user_pref("media.navigator.video.enabled", false);//Disable video capability for WebRTC

user_pref("media.peerconnection.enabled", false);//Disable WebRTC (TB default)
user_pref("media.peerconnection.video.enabled", false);//Disable WebRTC video support
user_pref("media.peerconnection.simulcast", false);//Disable WebRTC simulcast
user_pref("media.peerconnection.default_iceservers", "[]");//Reset default STUN/TURN servers
user_pref("media.peerconnection.ice.force_interface", "force_fake_interface");//WebRTC limit to only a single interface
user_pref("media.peerconnection.ice.relay_only", true);//WebRTC only generate relay (TURN) candidates for WebRTC
user_pref("media.peerconnection.use_document_iceservers", false);//Don't use STUN/TURN servers provided by the page
user_pref("media.peerconnection.identity.enabled", false);//Disable WebRTC Identity
user_pref("media.peerconnection.identity.timeout", 1);//Retrieve WebRTC Identity timeout
user_pref("media.peerconnection.ice.no_host", true);//Don't eliminate all local addresses from the candidates for WebRTC STUN/TURN
user_pref("media.peerconnection.ice.default_address_only", true);//Limit WebRTC STUN/TURN candidates to the default interface only

user_pref("media.peerconnection.turn.disable", true);//Force disable WebRTC

user_pref("dom.webaudio.enabled", false);//Disable WebAudio (TB default)

user_pref("media.getusermedia.screensharing.enabled", false);//Disable screensharing

user_pref("media.getusermedia.screensharing.allowed_domains", "");//None of screensharing allowing domains

user_pref("media.getusermedia.audiocapture.enabled", false);//Disable audio capture (default)

user_pref("media.webvtt.regions.enabled", false);//Disable TextTrack WebVTT Region extension support (default)

user_pref("media.track.enabled", false);//Disable AudioTrack and VideoTrack support (default)

user_pref("media.webspeech.recognition.enable", false);//Disable WebSpeech Recognition API (default)
user_pref("media.webspeech.synth.enabled", false);//Disable WebSpeech Synth API (default, TB default)

user_pref("media.autoplay.enabled", false);//Disable autoplay HTML5 media elements

user_pref("media.video_stats.enabled", false);//Disable the video stats to prevent fingerprinting (TB default)

user_pref("gfx.layerscope.enabled", false);//Disable LayerScope tool (default)
user_pref("gfx.layerscope.port", 65535);//Spoof LayerScope tool port

user_pref("gfx.downloadable_fonts.enabled", false);//Disable download fonts
user_pref("gfx.downloadable_fonts.fallback_delay", -1);//Disable hide text when font download (TB default)

user_pref("gfx.downloadable_fonts.woff2.enabled", false);//Disable download WOFF2 fonts

user_pref("gfx.font_rendering.graphite.enabled", false);//Disable Graphite fonts (TB default)

user_pref("gfx.font_rendering.opentype_svg.enabled", false);//Disable OpenType SVG fonts (TorButton High/Medium level)

//user_pref("canvas.capturestream.enabled", false);//Disable Canvas CaptureStream (as TB)

user_pref("canvas.imagebitmap_extensions.enabled", false);//Disable the Canvas ImageBitmap-extensions (default)

user_pref("accessibility.force_disabled", 1);//Force disable accessibility tools

user_pref("accessibility.typeaheadfind", true);//Enable Find As You Type
user_pref("accessibility.typeaheadfind.soundURL", "");//Never play an alert sound if the typed character doesn't match anything on the page
user_pref("accessibility.typeaheadfind.enablesound", false);//Never play an alert sound if the typed character doesn't match anything on the page
user_pref("accessibility.typeaheadfind.prefillwithselection", true);//If text is selected when pressing Ctrl+F, load that text into the Find Bar for searching

user_pref("findbar.highlightAll", true);//Highlight all results in findbar

user_pref("toolkit.autocomplete.richBoundaryCutoff", 0);//None of characters to consider emphasizing for rich autocomplete results

user_pref("toolkit.telemetry.server", "https://0.0.0.0/");//Spoof telemetry pings URL
user_pref("toolkit.telemetry.infoURL", "");//Spoof information URL about telemetry
user_pref("toolkit.telemetry.unified", false);//Don't use unified telemetry behavior (TB default)

user_pref("toolkit.identity.enabled", false);//Disable Identity module (default, removed in FF54+)

user_pref("devtools.chrome.enabled", false);//Disable debugging chrome (default)

user_pref("devtools.debugger.remote-enabled", false);//Disable remote debugging connections (default)

user_pref("devtools.debugger.remote-port", 65535);//Spoof remote debugging port
user_pref("devtools.debugger.force-local", true);//Force debugger server binding on the loopback interface
user_pref("devtools.debugger.prompt-connection", true);//Display a prompt when a new connection starts to accept/reject it (default)

user_pref("devtools.remote.wifi.scan", false);//Disable scan for DevTools devices via WiFi
user_pref("devtools.remote.wifi.visible", false);//Disable UI options for controlling device visibility over WiFi

user_pref("devtools.devices.url", "https://0.0.0.0/");//Spoof URL of the remote JSON catalog used for device simulation

user_pref("devtools.gcli.hideIntro", true);//Hide the DevTools introductory text

user_pref("devtools.gcli.jquerySrc", "https://0.0.0.0/");//Spoof URL of the remote JSON catalog used for device simulation
user_pref("devtools.gcli.lodashSrc", "https://0.0.0.0/");//Spoof jquery.min.js alias URL for inject command
user_pref("devtools.gcli.underscoreSrc", "https://0.0.0.0/");//Spoof lodash.min.js alias URL for inject command

user_pref("devtools.gcli.imgurClientID", "");//Reset Imgur upload client ID
user_pref("devtools.gcli.imgurUploadURL", "https://0.0.0.0/");//Spoof Imgur's upload URL

user_pref("devtools.telemetry.supported_performance_marks", "");//None of supported performace marks for telemetry

user_pref("view_source.wrap_long_lines", true);//Word-wrap long lines in view-source: tab

user_pref("plain_text.wrap_long_lines", true);//Word-wrap long lines in plain-text documents

user_pref("nglayout.enable_drag_images", false);//Don't draw images while dragging

user_pref("application.use_ns_plugin_finder", false);//Don't use Netscape plug-in finder (default)

user_pref("browser.fixup.alternate.enabled", false);//Disable fixup URL with prefix and suffix in URL-bar (TB default)
user_pref("browser.fixup.alternate.prefix", "");//Empty fixup URL prefix
user_pref("browser.fixup.alternate.suffix", "");//Empty fixup URL suffix
user_pref("browser.fixup.hide_user_pass", true);//Hide user/password in LocationBar (default)

user_pref("browser.urlbar.autocomplete.enabled", false);//Disable LocationBar autocomplete

user_pref("print.print_headerleft", "");//Print customization: empty header left
user_pref("print.print_headercenter", "");//Print customization: empty header center (default)
user_pref("print.print_headerright", "");//Print customization: empty header right
user_pref("print.print_footerleft", "");//Print customization: empty footer left
user_pref("print.print_footercenter", "");//Print customization: empty footer center (default)
user_pref("print.print_footerright", "");//Print customization: empty footer right

user_pref("print.save_print_settings", false);//Don't save the printings after each print job

user_pref("dom.disable_beforeunload", true);//Disable DOM beforeunload event (message showes when tab closed)
user_pref("dom.disable_window_flip", true);//Disable window flip via JS
user_pref("dom.disable_window_move_resize", true);//Disable window move/resize via JS
user_pref("dom.disable_window_status_change", true);//Disable change window status via JS

user_pref("dom.disable_window_open_feature.titlebar", true);//Prevents the title bar from being hidden in popup window
user_pref("dom.disable_window_open_feature.close", true);//Prevents the close button from being disabled in popup window
user_pref("dom.disable_window_open_feature.toolbar", true);//Prevents the navigation toolbar from being hidden in popup window
user_pref("dom.disable_window_open_feature.location", true);//Prevents the address bar from being hidden in popup window
user_pref("dom.disable_window_open_feature.personalbar", true);//Prevents the bookmarks toolbar from being hidden in popup window
user_pref("dom.disable_window_open_feature.menubar", true);//Prevents the menubar from being hidden in popup window
user_pref("dom.disable_window_open_feature.resizable", true);//Prevents popup window resizable (default)
user_pref("dom.disable_window_open_feature.minimizable", true);//Prevents popup window minimization
user_pref("dom.disable_window_open_feature.status", true);//Prevents popup window change status (default)

user_pref("dom.allow_scripts_to_close_windows", false);//Prevent close window via JS (default)

user_pref("dom.popup_maximum", 4);//The maximum number of popups from a single non-click event
user_pref("dom.popup_allowed_events", "click");//A space-separated list of the events that are allowed to create popups

user_pref("dom.storage.enabled", true);//Enable DOM Storage (default)

user_pref("dom.input.dirpicker", false);//Disable Directory API (disabled)

user_pref("dom.sysmsg.enabled", false);//Disable system messages and activities (default)

user_pref("dom.webapps.useCurrentProfile", false);//Disable pre-installed applications (default)

user_pref("privacy.popups.disable_from_plugins", 2);//Disable popups from plugins by default (default)

user_pref("privacy.donottrackheader.enabled", false);//Don't send Do-not-Track HTTP header (sic!) (default)
user_pref("privacy.trackingprotection.enabled", false);//Disable tracking protection in all modes (default)
user_pref("privacy.trackingprotection.pbmode.enabled", false);//Disable tracking protection in Private Browsing mode (TB default)

user_pref("dom.event.clipboardevents.enabled", false);//Disable websites access to onCut/onCopy/onPaste events
user_pref("dom.event.highrestimestamp.enabled", true);//Highres (but truncated in TB) timestamps prevent uptime leaks (TB default)

user_pref("dom.webcomponents.enabled", false);//Disable WebComponents (default)

user_pref("javascript.enabled", true);//Enable JavaScript (default)
user_pref("javascript.options.baselinejit", false);//Disable Baseline JIT (JS performance optimization) (TorButton High/Medium level)
user_pref("javascript.options.ion", false);//Disable ION (JS performance optimization) (TorButton High/Medium level)
user_pref("javascript.options.asmjs", false);//Disable asm.js (JS performance optimization) (TB default)
user_pref("javascript.options.wasm", false);//Disable WASM (JS performance optimization) (default)
user_pref("javascript.options.wasm_baselinejit", false);//Disable WASM Baseline JIT (JS performance optimization) (default)
user_pref("javascript.options.native_regexp", false);//Don't use native JS RegExp (TorButton High/Medium level)

user_pref("security.fileuri.strict_origin_policy", true);//Enable Same-Origin policy feature (default)

user_pref("network.allow-experiments", false);//Disable Mozilla permission to silently opt you into tests

user_pref("network.notify.changed", false);//Disable the network changed event to get sent when a network topology or setup change is noticed while running

user_pref("network.notify.IPv6", false);//Don't allow network detection of IPv6

user_pref("network.tickle-wifi.enabled", false);//Disable WiFi tickle (default)

user_pref("network.protocol-handler.external-default", false);//Disable another external protocol handlers (TB default)
user_pref("network.protocol-handler.warn-external-default", true);//Warning before load external protocol handlers (default)

user_pref("network.protocol-handler.expose-all", false);//Don't expose all protocols handlers by default

user_pref("network.warnOnAboutNetworking", false);//Disable warning for about:networking page

user_pref("network.manage-offline-status", false);//Disable automatic "Work Offline" status (TB default)

user_pref("network.http.sendRefererHeader", 0);//Don't send referer header
user_pref("network.http.referer.spoofSource", true);//Spoof - use target URI as referer (if send referer header)
user_pref("network.http.referer.trimmingPolicy", 2);//Trim full referer to scheme://host:port
user_pref("network.http.referer.XOriginTrimmingPolicy", 2);//Trim full referer to scheme://host:port attached to cross-origin requests (if not trimmed previously)
user_pref("network.http.referer.XOriginPolicy", 2);//Send only hosts match attached to cross-origin requests (if send referer header)

user_pref("network.http.enablePerElementReferrer", false);//Disable per-element referer

user_pref("network.http.redirection-limit", 7);//Maximum number of consecutive redirects before aborting

user_pref("network.http.prompt-temp-redirect", true);//Prompt for redirects resulting in unsafe HTTP requests

user_pref("network.http.speculative-parallel-limit", 0);//The maximum number of current global half open sockets when mouse hover over links

user_pref("network.http.spdy.enabled", false);//Disable SPDY protocol (TB default)
user_pref("network.http.spdy.enabled.http2", false);//Disable SPDY/HTTP2 protocol (TB default)

user_pref("network.http.altsvc.enabled", false);//Disable HTTP Alternative Services (avoid proxy settings) (TB default)
user_pref("network.http.altsvc.oe", false);//Also disable HTTP Alternative Services (avoid proxy settings) (TB default)

user_pref("network.http.diagnostics", false);//Disable HTTP diagnostics (default)

user_pref("network.websocket.allowInsecureFromHTTPS", false);//Scripts loaded from a https origin can only open secure websockets (default)

user_pref("network.jar.open-unsafe-types", false);//Disable JAR from opening Unsafe File Types (default)
user_pref("network.jar.block-remote-files", true);//Loading remote JAR files using the jar: protocol will be prevented (TB default, true in FF55+)

user_pref("network.IDN_show_punycode", true);//All IDN (Internationalization Domain Name) names will be normalized to punycode (raw ANSI)

user_pref("network.dns.disableIPv6", true);//Turn off IPv6 name lookups

user_pref("network.dns.disablePrefetch", true);//Disable DNS prefetch (TB default)

user_pref("network.dns.blockDotOnion", true);//.onion hostnames are rejected before being given to DNS

user_pref("network.dns.localDomains", "0.0.0.0");//Spoof "localhost domain"

user_pref("network.dns.offline-localhost", false);//"localhost" shouldn't resolve when offline

user_pref("network.prefetch-next", false);//Disable the prefetch service (<link rel="next"> URLs)

user_pref("network.predictor.enabled", false);//Disable the predictive service (TB default)
user_pref("network.predictor.enable-hover-on-ssl", false);//Disable TLS links of the predictive service (default)
user_pref("network.predictor.enable-prefetch", false);//Disable prefetch of the predictive service (default, true in FF55+)

user_pref("network.auth.subresource-http-auth-allow", 0);//Don't allow sub-resources to open HTTP authentication credentials dialogs

user_pref("permissions.default.image", 1);//Accept images

user_pref("network.proxy.type", 1);//Use SOCKS5 proxy
user_pref("network.proxy.socks", "0.0.0.0");//SOCKS5 proxy address stub
user_pref("network.proxy.socks_port", 65535);//SOCKS5 proxy port stub
user_pref("network.proxy.socks_remote_dns", true);//Resolve DNS through SOCKS proxy if possible
user_pref("network.proxy.no_proxies_on", "");//Empty exclusions for No proxy (TB default)

user_pref("network.cookie.cookieBehavior", 1);//Dont't accept/send third-party cookies (TB default)
user_pref("network.cookie.thirdparty.sessionOnly", true);//Third-party cookies store only for current session
user_pref("network.cookie.leave-secure-alone", true);//Prevent HTTP responses from setting cookies with secure flag (default)
user_pref("network.cookie.lifetimePolicy", 2);//Cookies store only for current session (TB default)
user_pref("network.cookie.lifetime.days", 1);//Maximum day's when cookies stored (if not session-only)

user_pref("network.proxy.autoconfig_url", "data:application/x-ns-proxy-autoconfig;base64,ZnVuY3Rpb24gRmluZFByb3h5Rm9yVVJMKHVybCxob3N0KXtyZXR1cm4gIlNPQ0tTIDAuMC4wLjA6NjU1MzUiO30=");//Stub PAC-file
user_pref("network.proxy.autoconfig_url.include_path", false);//Strip off paths when sending URLs to PAC scripts (default)

user_pref("network.stricttransportsecurity.preloadlist", true);//Use the HSTS preload list by default (default)

user_pref("network.mdns.use_js_fallback", false);//Don't use JS mDNS as a fallback (default)

user_pref("intl.accept_languages", "en-US, en");//Unify Accept-Language header
user_pref("intl.menuitems.alwaysappendaccesskeys", "");//Unify always append access keys
user_pref("intl.menuitems.insertseparatorbeforeaccesskeys", "true");//Unify insert separator before accesskeys
user_pref("intl.charset.detector", "");//Unify charset detector
user_pref("intl.ellipsis", "\u2026");//Unify ellipsis symbol
user_pref("intl.locale.matchOS", false);//Don't using OS locale, force app locale (default)
user_pref("intl.fallbackCharsetList.ISO-8859-1", "windows-1252");//Fallback charset list for Unicode conversion
user_pref("font.language.group", "x-western");//Unify font language group

user_pref("security.xpconnect.plugin.unrestricted", false);//Disable plugins using external/untrusted scripts with XPCOM or XPConnect
user_pref("security.dialog_enable_delay", 0);//No security delay when installing add-ons or save file dialogs

user_pref("security.csp.enable", true);//Enable Content Security Policy feature (default)

user_pref("security.mixed_content.block_active_content", true);//Block active mixed-content
user_pref("security.mixed_content.block_display_content", false);//Don't block passive mixed-content (default)

user_pref("security.sri.enable", true);//Enable Sub-Resource Integrity feature (default)

user_pref("security.block_script_with_wrong_mime", true);//Block scripts with wrong MIME type such as image/ or video/ (default)

user_pref("security.ssl.enable_ocsp_must_staple", true);//OCSP must-staple (default)

user_pref("security.insecure_field_warning.contextual.enabled", true);//Show in-content login form warning UI for insecure login fields (default)

user_pref("security.cert_pinning.enforcement_level", 2);//Enforce strict Public Key Pinning (TB default)

user_pref("services.settings.server", "https://0.0.0.0/");//Spoof services security settings URL

user_pref("extensions.blocklist.enabled", false);//Disable blocklist
user_pref("extensions.blocklist.interval", 630720000);//Update blocklist interval in msec if enabled
user_pref("security.onecrl.maximum_staleness_in_seconds", 630720001);//Update blocklist interval for OneCRL OCSP bypass if enbled
user_pref("extensions.blocklist.url", "https://0.0.0.0/");//Spoof blocklist URL
user_pref("extensions.blocklist.detailsURL", "https://0.0.0.0/");//Spoof blocklist info
user_pref("extensions.blocklist.itemURL", "https://0.0.0.0/");//Spoof blocklist item URL
user_pref("services.blocklist.bucket", "");//Disable blocklists via Kinto
user_pref("services.blocklist.onecrl.collection", "");//Disable certificates blacklist via Kinto
user_pref("services.blocklist.addons.collection", "");//Disable addons blacklist via Kinto
user_pref("services.blocklist.plugins.collection", "");//Disable plugins blacklist via Kinto
user_pref("services.blocklist.gfx.collection", "");//Disable GFX blocklist via Kinto

user_pref("services.blocklist.update_enabled", false);//Disable blocklists updates via Kinto (TB default)

user_pref("security.onecrl.via.amo", false);//Disable certificate blocklist updates via services settings (default)

user_pref("middlemouse.paste", false);//Don't paste clipboard text via middle-mouse click (default)
user_pref("middlemouse.contentLoadURL", false);//Disable middle mouse click opening links from clipboard (default)

user_pref("clipboard.autocopy", false);//Don't use clipboard autocopy (default)

user_pref("layout.word_select.eat_space_to_next_word", false);//Don't select space on double-click on the word

user_pref("layout.css.visited_links_enabled", false);//Don't highlight visited links (prevent CSS history leak)

user_pref("layout.css.font-loading-api.enabled", false);//Disable download fonts via CSS

user_pref("dom.archivereader.enabled", false);//Disable ArchiveReader (default, removed in FF54+)

user_pref("plugins.load_appdir_plugins", false);//Don't load plugins from application directory (default)
user_pref("plugins.click_to_play", true);//Plugins will be in Click-to-Play mode (TB default)
user_pref("plugin.default.state", 0);//Disable plugins by default

user_pref("plugin.sessionPermissionNow.intervalInMinutes", 0);//Wait minutes before next allow plugin to work via allow it now
user_pref("plugin.persistentPermissionAlways.intervalInDays", 0);//Wait days before next allow plugin to work via allow it now persistently

user_pref("dom.ipc.plugins.flash.subprocess.crashreporter.enabled", false);//Disable CrashReport of FlashPlayer
user_pref("dom.ipc.plugins.reportCrashURL", false);//Don't include URL in CrashReport of FlashPlayer if enabled

user_pref("dom.ipc.processCount", 1);//Number of content processes in multiprocess mode

//user_pref("layout.word_select.eat_space_to_next_word", false);//(Already set)

user_pref("plugin.scan.Acrobat", "9999.0");//Minimum version of Adobe Acrobat plugin allowed

user_pref("plugin.scan.Quicktime", "9999.0");//Minimum version of Quicktime plugin allowed

user_pref("plugin.scan.WindowsMediaPlayer", "9999.0");//Minimum version of WindowsMediaPlayer plugin allowed

user_pref("plugin.scan.plid.all", false);//Don't find plugins via Windows Registry

user_pref("intl.tsf.enable", false);//Disable Text Services Framework (Windows Vista+ only)

user_pref("ui.trackpoint_hack.enabled", 0);//Disable trackpoint hack

user_pref("ui.elantech_gesture_hacks.enabled", 0);//Disable Elantech gesture hacks

user_pref("ui.osk.enabled", false);//Don't show the Windows on-screen keyboard (osk.exe) when a text field is focused
user_pref("ui.osk.require_win10", true);//Only try to show the On-Screen Keyboard on Windows 10 and later

user_pref("signon.rememberSignons", false);//Disable Password Manager (TB default)
user_pref("signon.rememberSignons.visibilityToggle", false);//Don't show Password Manager
user_pref("signon.autofillForms", false);//Disable auto-filling username/password form fields (TB default)
user_pref("signon.autofillForms.http", false);//Disable auto-filling username/password form fields on http (if auto-filling enabled) (default)

user_pref("signon.autologin.proxy", false);//Prompt for authentication if password is saved (default)
user_pref("signon.formlessCapture.enabled", false);//Disable formless login capture for Password Manager
user_pref("signon.storeWhenAutocompleteOff", false);//Don't save autofill data without autocomplete attribyte
user_pref("signon.schemeUpgrades", true);//Upgrade scheme if possible (http to https)
user_pref("signon.masterPasswordReprompt.timeout_ms", 0);//Master password prompt everytime for autocomplete

user_pref("browser.formfill.enable", false);//Disable save Form Fill data (TB default)
user_pref("browser.formfill.expire_days", 0);//Expire Form Fill data immediately
user_pref("browser.formfill.saveHttpsForms", false);//Disable save Form Fill data on HTTPS if enabled (removed in FF55+)

user_pref("webgl.force-enabled", false);//Don't WebGL force enabled
user_pref("webgl.disabled", true);//Disable WebGL
user_pref("webgl.min_capability_mode", true);//Force bare minimum features for WebGL if enabled (TB default)
user_pref("webgl.disable-extensions", true);//Disable WebGL extensions (TB default)
user_pref("webgl.disable-fail-if-major-performance-caveat", true);//Disable WebGL performance caveat (TB default)

user_pref("webgl.enable-webgl2", false);//Disable WebGL2 (TB default)

user_pref("webgl.enable-debug-renderer-info", false);//Disable WebGL debug renderer (default, true in FF53+)

user_pref("gfx.offscreencanvas.enabled", false);//Disable offscreen canvas (default)

user_pref("layers.acceleration.disabled", true);//Disable acceleration for all widgets (TB default)

user_pref("gfx.direct2d.disabled", true);//Disable the automatic detection and use of Direct2D (TB default)

user_pref("geo.enabled", false);//Disable Geolocation API (TB default)

user_pref("geo.wifi.xhr.timeout", 1);//Timeout for outbound network geolocation provider XHR in msecs if enabled

user_pref("device.sensors.enabled", false);//Disable Orientation API (TB default)

user_pref("device.storage.enabled", false);//Disable Device Storage API (default)

user_pref("browser.meta_refresh_when_inactive.disabled", true);//Block auto META refresh in foreground tabs

user_pref("xpinstall.whitelist.required", true);//Warn when sites try to install addons (default)
user_pref("xpinstall.signatures.required", false);//Disable requires add-on signatures
user_pref("extensions.minCompatiblePlatformVersion", "52.0");//Minimum compatible version for Extensions
user_pref("extensions.webExtensionsMinPlatformVersion", "52.0");//Minimum compatible version for WebExtensions

user_pref("extensions.webextensions.keepStorageOnUninstall", false);//Don't keep WebExtensions storage on uninstall (default)
user_pref("extensions.webextensions.keepUuidOnUninstall", false);//Don't keep WebExtensions UUID on uninstall (default)

user_pref("notification.feature.enabled", false);//Disable Desktop Notification (default)

//user_pref("dom.webnotifications.enabled", false);//Disable Web Notification (as TB)
//user_pref("dom.webnotifications.serviceworker.enabled", false);//Disable Web Notification of ServiceWorker (as TB)

user_pref("alerts.disableSlidingEffect", true);//Disable animation effect on alerts (removed in FF55+)
user_pref("alerts.showFavicons", false);//Don't show favicons in web notifications (default)

user_pref("full-screen-api.pointer-lock.enabled", false);//Disable Pointer Lock API on Full-Screen API***
user_pref("full-screen-api.warning.timeout", 0);//Sliding out effect in msecs on the Full-Screen API
user_pref("full-screen-api.warning.delay", 0);//Delay in msecs for the warning box to show when pointer stays on the top

user_pref("pointer-lock-api.prefixed.enabled", false);//Disable Pointer Lock API prefixed (default)

user_pref("dom.idle-observers-api.enabled", false);//Disable Idle Observers API (OS only)

user_pref("dom.vibrator.enabled", false);//Disable vibration (shaking the screen)***

user_pref("dom.battery.enabled", false);//Disable Battery API

user_pref("dom.push.enabled", false);//Disable Push API (default)

user_pref("dom.push.serverURL", "https://0.0.0.0/");//Spoof Push server URL
user_pref("dom.push.userAgentID", "");//Reset Push UserAgent ID

user_pref("dom.push.connection.enabled", false);//Prevent connection to the Push server

user_pref("dom.mozNetworkStats.enabled", false);//Disable WebNetworkStats (default, removed in FF53+)

user_pref("dom.mozSettings.enabled", false);//Disable WebSettings (default, removed in FF53+)
user_pref("dom.mozPermissionSettings.enabled", false);//Disable WebSettings permissions (default, removed in FF53+)

user_pref("dom.w3c_touch_events.enabled", 0);//Disable W3C touch events (TB default)

user_pref("dom.imagecapture.enabled", false);//Disable ImageCapture API (default)

user_pref("media.ondevicechange.enabled", false);//Disable W3C MediaDevices devicechange event***

user_pref("browser.dom.window.dump.enabled", false);//Disable JS dump() function (default)

user_pref("dom.netinfo.enabled", false);//Disable Network Information API

user_pref("social.whitelist", "");//None of domains origins that still need LocalStorage in the frameworker (TB default)
user_pref("social.directories", "");//None of domains origins for directory websites that can install providers for other sites (TB default)
user_pref("social.remote-install.enabled", false);//Disable Social API remote-install provider (TB default)
user_pref("social.toast-notifications.enabled", false);//Disable Social API notifications (TB default)

user_pref("dom.vr.enabled", false);//Disable Virtual Reality support (default)
user_pref("dom.vr.oculus.enabled", false);//Disable Oculus Virtual Reality support
user_pref("dom.vr.osvr.enabled", false);//Disable OSVR device (default)
user_pref("dom.vr.openvr.enabled", false);//Disable OpenVR device (default)
user_pref("dom.vr.poseprediction.enabled", false);//Disable Virtual Reality Pose prediction (default, true in FF55+)

user_pref("network.captive-portal-service.enabled", false);//Disable Captive Portal detection (default, TB default)

user_pref("captivedetect.canonicalURL", "http://0.0.0.0/success.txt");//Spoof canonical URL for detect Captive Portal
user_pref("captivedetect.maxRetryCount", 0);//Maximum count for detect Captive Portal

user_pref("dom.flyweb.enabled", false);//Disable FlyWeb (default)

user_pref("urlclassifier.malwareTable", "");//Disable registration malware tables in URLClassifier

user_pref("urlclassifier.phishTable", "");//Disable registration phish tables in URLClassifier

user_pref("urlclassifier.downloadBlockTable", "");//Disable registration application reputation tables in URLClassifier

user_pref("urlclassifier.downloadAllowTable", "");//Disable registration allowed remote lookups binaries tables in URLClassifier

user_pref("urlclassifier.disallow_completions", "");//Disable registration completions tables in URLClassifier

user_pref("urlclassifier.trackingTable", "");//Disable registration update/gethash tables in URLClassifier
user_pref("urlclassifier.trackingWhitelistTable", "");//Disable registration update/gethash whitelist tables in URLClassifier

user_pref("urlclassifier.gethash.timeout_ms", 1);//GetHash timeout for Safebrowsing

user_pref("browser.safebrowsing.phishing.enabled", false);//Disable SafeBrowsing phishing protection (TB default)

user_pref("browser.safebrowsing.malware.enabled", false);//Disable SafeBrowsing malware protection (TB default)

user_pref("browser.safebrowsing.downloads.enabled", false);//Disable SafeBrowsing for downloaded files (TB default)
user_pref("browser.safebrowsing.downloads.remote.enabled", false);//Disable SafeBrowsing remote lookups if enabled (TB default)
user_pref("browser.safebrowsing.downloads.remote.timeout_ms", 1);//Timeout of the remote lookups for SafeBrowsing
user_pref("browser.safebrowsing.downloads.remote.url", "https://0.0.0.0/");//Spoof server endpoint of remote lookups for SafeBrowsing
user_pref("browser.safebrowsing.downloads.remote.block_dangerous", false);//Disable SafeBrowsing remote lookups for dangerous
user_pref("browser.safebrowsing.downloads.remote.block_dangerous_host", false);//Disable SafeBrowsing remote lookups for dangerous sites
user_pref("browser.safebrowsing.downloads.remote.block_potentially_unwanted", false);//Disable SafeBrowsing remote lookups for potentially unwanted
user_pref("browser.safebrowsing.downloads.remote.block_uncommon", false);//Disable SafeBrowsing remote lookups for uncommon

user_pref("browser.safebrowsing.provider.google.lists", "");//Clear SafeBrowsing lists
user_pref("browser.safebrowsing.provider.google.updateURL", "https://0.0.0.0/");//Spoof SafeBrowsing Update URL
user_pref("browser.safebrowsing.provider.google.gethashURL", "https://0.0.0.0/");//Spoof SafeBrowsing GetHash URL
user_pref("browser.safebrowsing.provider.google.reportURL", "https://0.0.0.0/");//Spoof SafeBrowsing Report URL

user_pref("browser.safebrowsing.provider.google4.lists", "");//Clear SafeBrowsing v.4 lists
user_pref("browser.safebrowsing.provider.google4.updateURL", "https://0.0.0.0/");//Spoof SafeBrowsing v.4 Update URL
user_pref("browser.safebrowsing.provider.google4.gethashURL", "https://0.0.0.0/");//Spoof SafeBrowsing v.4 GetHash URL
user_pref("browser.safebrowsing.provider.google4.reportURL", "https://0.0.0.0/");//Spoof SafeBrowsing v.4 Report URL

user_pref("browser.safebrowsing.reportPhishMistakeURL", "https://0.0.0.0/");//Spoof SafeBrowsing Phish URL (removed in FF54+)
user_pref("browser.safebrowsing.reportPhishURL", "https://0.0.0.0/");//Spoof SafeBrowsing Phish URL
user_pref("browser.safebrowsing.reportMalwareMistakeURL", "https://0.0.0.0/");//Spoof SafeBrowsing MalwareMistake URL (removed in FF54+)

user_pref("browser.safebrowsing.blockedURIs.enabled", false);//Disable SafeBrowsing for plugin content (TB default)
user_pref("urlclassifier.blockedTable", "");//Disable registration blocking plugin content table

user_pref("browser.safebrowsing.provider.mozilla.lists", "");//Clear SafeBrowsing Mozilla lists
user_pref("browser.safebrowsing.provider.mozilla.updateURL", "https://0.0.0.0/");//Spoof SafeBrowsing Mozilla Update URL
user_pref("browser.safebrowsing.provider.mozilla.gethashURL", "https://0.0.0.0/");//Spoof SafeBrowsing Mozilla GetHash URL

user_pref("dom.wakelock.enabled", false);//Disable Wakelock (default)

user_pref("identity.fxaccounts.auth.uri", "https://0.0.0.0/");//Spoof Firefox Accounts auth server backend

user_pref("image.mozsamplesize.enabled", false);//Disable mozsample size (default, removed in FF53+)

//user_pref("beacon.enabled", false);//Disable Beacon's (sending additional analytics to web servers) (as TB, but blocked via useraddonpolicy)

user_pref("camera.control.face_detection.enabled", false);//Disable Camera face detection

//user_pref("dom.caches.enabled", false);//Disable Service Workers Cache and Cache Storage*** (as TB)

user_pref("dom.system_update.enabled", false);//Disable SystemUpdate API (default, removed in FF53+)

user_pref("dom.udpsocket.enabled", false);//Disable UDPSocket API (default)

user_pref("dom.beforeAfterKeyboardEvent.enabled", false);//Disable before keyboard events and after keyboard events by default (default, removed in FF53+)

user_pref("dom.presentation.enabled", false);//Disable Presentation API (default)
user_pref("dom.presentation.controller.enabled", false);//Disable Presentation API Controller (default)
user_pref("dom.presentation.receiver.enabled", false);//Disable Presentation API Receiver (default)

user_pref("dom.presentation.discovery.enabled", false);//Disable Presentation API Discovery (default)
user_pref("dom.presentation.discovery.timeout_ms", 1);//DOM Presentation API timeout in msecs
user_pref("dom.presentation.discoverable", false);//Disable Presentation API Discoverable (default)

user_pref("browser.addon-watch.interval", -1);//Disable the interval at which to check for slow running addons (removed in FF55+)

user_pref("browser.search.update", false);//Disable automatically check for updates to search plugins (TB default)
user_pref("browser.search.update.interval", 630720000);//Check updates interval to search plugins if enabled
user_pref("browser.search.suggest.enabled", false);//Disable search bar live search suggestions (TB default)
user_pref("browser.search.reset.enabled", false);//Disable Reset Search Prefs (default)
user_pref("browser.search.reset.whitelist", "");//Disable Reset Search Prefs whitelist (default)
user_pref("browser.search.geoSpecificDefaults", false);//Disable geo-specific search engines (TB default)
user_pref("browser.search.geoip.url", "https://0.0.0.0/");//Spoof GeoIP URL
user_pref("browser.search.geoip.timeout", 1);//GeoIP URL timeout in msecs

user_pref("browser.search.official", false);//?

user_pref("media.gmp-manager.url.override", "https://0.0.0.0/");//GMPInstallManager URL override

user_pref("media.gmp-manager.url", "https://0.0.0.0/");//Spoof update service URL for GMP install/updates

user_pref("reader.parse-on-load.enabled", false);//Disable Reader Mode (TB default)

user_pref("reader.parse-node-limit", 1);//Maximum node (elements) limit for aborting parse of Reader Mode

user_pref("reader.parse-on-load.force-enabled", false);//Don't Reader Mode force enabled

user_pref("reader.errors.includeURLs", false);//Don't include URLs to errors in Reader Mode (default)

user_pref("narrate.enabled", false);//Disable Narrate (voice reading in Reader Mode)

user_pref("webextensions.storage.sync.enabled", false);//Disable WebExtensions storage sync (default)
user_pref("webextensions.storage.sync.serverURL", "https://0.0.0.0/");//Spoof WebExtensions storage sync server URL

user_pref("plugins.rewrite_youtube_embeds", false);//Disable rewriting Youtube flash embeds to HTML5

user_pref("plugins.navigator_hide_disabled_flash", true);//Hide FlashPlayer plugin from navigator.plugins when it in Click-to-Play mode (prevent fingerprinting plugins but break some sites)

user_pref("dom.maxHardwareConcurrency", 1);//Maximum number of cores that navigator.hardwareCurrency returns (TB default)

//user_pref("dom.webkitBlink.dirPicker.enabled", false);//Disable File and Directory Entries API: DirPicker*** (as TB)
//user_pref("dom.webkitBlink.filesystem.enabled", false);//Disable File and Directory Entries API: FileSystem*** (as TB)

user_pref("media.block-autoplay-until-in-foreground", true);//Block autoplay media files until in foreground tab

//user_pref("security.mixed_content.send_hsts_priming", false);//(Already in Security section)
//user_pref("security.mixed_content.use_hsts", false);//(Already in Security section)

user_pref("dom.storageManager.enabled", false);//Disable Storage API

//=============== DataReporting Prefs ===============
user_pref("datareporting.policy.dataSubmissionEnabled", false);//Disable Data Reporting (TB default)
user_pref("datareporting.policy.dataSubmissionPolicyNotifiedTime", "0");//Reset Data Reporting submission time
user_pref("datareporting.policy.firstRunURL", "");//Reset Data Reporting first run URL (default)

//=============== HealthReport Prefs ===============
user_pref("datareporting.healthreport.infoURL", "https://0.0.0.0/");//Spoof Data Reporting info URL
user_pref("datareporting.healthreport.uploadEnabled", false);//Disable Health Report (TB default)
user_pref("datareporting.healthreport.about.reportUrl", "https://0.0.0.0/");//Spoof Health Report URL

//=============== DevTools Prefs ===============
user_pref("devtools.devedition.promo.shown", true);//DevEdition promo has been shown
user_pref("devtools.devedition.promo.url", "https://0.0.0.0/");//Spoof DevEdition promo URL

user_pref("devtools.devedition.promo.enabled", false);//Disable DevEdition promo (default, true in FF53+)

user_pref("devtools.toolbar.enabled", false);//Disable DevTools toolbar
user_pref("devtools.toolbar.visible", false);//Hide DevTools toolbar (default)

user_pref("devtools.webide.enabled", false);//Disable DevTools WebIDE by default (TB default)

user_pref("devtools.toolbox.host", "window");//Show DevTools in separate window
user_pref("devtools.toolbox.zoomValue", "1");//Reset DevTool toolbox zoom

user_pref("devtools.command-button-screenshot.enabled", true);//Show take a screenshot button on DevTools panel

user_pref("devtools.inspector.mdnDocsTooltip.enabled", false);//Disable MDN docs tooltip

user_pref("devtools.fontinspector.enabled", false);//Disable WebIDE font inspector

user_pref("devtools.debugger.enabled", false);//Disable DevTools debugger
user_pref("devtools.debugger.chrome-debugging-host", "0.0.0.0");//Spoof DevTools debugger host
user_pref("devtools.debugger.chrome-debugging-port", 65535);//Spoof DevTools debugger port
user_pref("devtools.debugger.remote-host", "0.0.0.0");//Spoof DevTools debugger remote host

user_pref("devtools.scratchpad.recentFilesMax", 0);//Disable recent files in DevTools ScratchPad

//=============== Firefox Branding Prefs ===============
user_pref("startup.homepage_override_url", "");//Reset override homepage
user_pref("startup.homepage_welcome_url", "");//Block Welcome page URL (TB default)
user_pref("startup.homepage_welcome_url.additional", "");//Reset additional Welcome page URL (TB default)
user_pref("app.update.interval", 630720000);//Time between checks for a new version in secs
user_pref("app.update.promptWaitTime", 630720000);//Give the user x seconds to react before showing the big UI
user_pref("app.update.url.manual", "https://0.0.0.0/");//Spoof update URL manual
user_pref("app.update.url.details", "https://0.0.0.0/");//Spoof URL for "More information about this update"

user_pref("app.update.checkInstallTime.days", 7300);//The number of days a binary is permitted to be old without checking for an update (if app.update.checkInstallTime)

//=============== Firefox l10n Prefs ===============
//user_pref("browser.search.geoSpecificDefaults", false);//(Alredy in All section)
//user_pref("general.useragent.locale", "en-US");//(Already in All section)

//=============== Firefox Prefs ===============
user_pref("extensions.strictCompatibility", true);//Strict compatible addons

user_pref("extensions.minCompatibleAppVersion", "52.0");//Minimum maxVersion an addon needs to say it's compatible with for it to be compatible by default
user_pref("extensions.checkCompatibility.temporaryThemeOverride_minAppVersion", "9999.0");//Minimum maxVersion of themes (i.e., disable all)

user_pref("extensions.getAddons.cache.enabled", false);//Disable addon metadata updating (TB default)
user_pref("extensions.getAddons.maxResults", 0);//Maximum number of search results to display on Get-Addons page
user_pref("extensions.getAddons.get.url", "https://0.0.0.0/");//Spoof URL when use for get addon on Get-Addons page
user_pref("extensions.getAddons.getWithPerformance.url", "https://0.0.0.0/");//Spoof performance addons URL on Get-Addons page
user_pref("extensions.getAddons.search.browseURL", "https://0.0.0.0/");//Spoof "See all results" URL on Get-Addons page
user_pref("extensions.getAddons.search.url", "https://0.0.0.0/");//Spoof the URL to use when the user performs an addons search on Get-Addons page
user_pref("extensions.webservice.discoverURL", "https://0.0.0.0/");//Spoof discover URL addons on Get-Addons page
user_pref("extensions.getAddons.recommended.url", "https://0.0.0.0/");//Spoof the URL to use when fetching the list of recommended addons on Get-Addons page
user_pref("extensions.getAddons.link.url", "https://0.0.0.0/");//Spoof Mozilla addons repository URL

user_pref("extensions.update.autoUpdateDefault", false);//Disable addons auto update installing

user_pref("extensions.hotfix.id", "");//Clear HotFix addon ID (TB default)

user_pref("extensions.systemAddon.update.url", "https://0.0.0.0/");//Spoof system addons URL update

user_pref("extensions.autoDisableScopes", 14);//Disable addons that are not installed by the user in all scopes by default

//user_pref("xpinstall.signatures.required", false);//(Already in All section)
user_pref("xpinstall.signatures.devInfoURL", "https://0.0.0.0/");//Spoof require signed addons info URL

user_pref("browser.dictionaries.download.url", "https://0.0.0.0/");//Spoof dictionary download

user_pref("app.update.checkInstallTime", false);//Don't check to see if the installation date is older than some threshold

user_pref("app.update.backgroundMaxErrors", 0);//The number of general background check failures to allow before notifying the user of the failure (i.e., always notifying)

user_pref("app.update.enabled", false);//Disable app updates

user_pref("app.update.auto", false);//Disable automatically download updates (if app updates are enabled)

user_pref("app.update.silent", false);//Disable silent auto update (Update Service will present no UI for any event) (default)

user_pref("app.update.badge", false);//Hide update events badge from hamburger button (removed in FF55+)

user_pref("app.update.staging.enabled", false);//Disable the Update Service apply updates in the background when it finishes downloading them (TB default)

user_pref("app.update.url", "https://0.0.0.0/");//Spoof update service URL

user_pref("app.update.service.enabled", false);//Don't use Mozilla Maintenance Service for updates

user_pref("extensions.update.enabled", false);//Disable extensions update
user_pref("extensions.update.url", "https://0.0.0.0/");//Spoof extensions update URL
user_pref("extensions.update.background.url", "https://0.0.0.0/");//Spoof extensions background update URL
user_pref("extensions.update.interval", 630720000);//Interval to check for updates to extensions and themes in secs

user_pref("extensions.dss.enabled", false);//Disable Dynamic Skin Switching (default)
user_pref("extensions.dss.switchPending", false);//Non-dynamic Dynamic Skin Switching pending after next restart (default)

user_pref("extensions.{972ce4c6-7e08-4474-a285-3208198ce6fd}.name", "Default");//Unify name of default theme addon
user_pref("extensions.{972ce4c6-7e08-4474-a285-3208198ce6fd}.description", "The default theme.");//Unify description of default theme addon

user_pref("lightweightThemes.update.enabled", false);//Disable auto updating of themes
user_pref("lightweightThemes.getMoreURL", "https://0.0.0.0/");//Spoof URL of get themes
user_pref("lightweightThemes.recommendedThemes", "[]");//Clear recommended themes list

user_pref("browser.eme.ui.enabled", false);//Disable DRM content (Encryption Media Extension) (TB default)

user_pref("browser.uitour.enabled", false);//Disable UI tour experience (TB default)
user_pref("browser.uitour.themeOrigin", "https://0.0.0.0/");//Spoof UI tour theme origin URL
user_pref("browser.uitour.url", "https://0.0.0.0/");//Spoof UI tour URL
user_pref("browser.uitour.readerViewTrigger", ".^");////RegExp match against the page's UI tour URL (sic) (removed in FF53+)

user_pref("browser.customizemode.tip0.shown", true);//Customization Mode tooltip help has been shown
user_pref("browser.customizemode.tip0.learnMoreUrl", "https://0.0.0.0/");//Spoof learn more URL in Customization Mode

//user_pref("keyword.enabled", false);//(Already in All section)

//user_pref("general.useragent.locale", "en-US");//(Already in All section)

user_pref("browser.shell.checkDefaultBrowser", false);//Disable check default browser at startup (TB default)
user_pref("browser.shell.shortcutFavicons", false);//Disable favicons in shortcuts

user_pref("browser.shell.skipDefaultBrowserCheck", true);//Skip default browser check (removed in FF55+)

user_pref("browser.startup.page", 1);//Load home page (set via browser.startup.homepage) at startup
user_pref("browser.startup.homepage", "about:blank");//Home page

user_pref("browser.slowStartup.notificationDisabled", true);//Disable "Slow Startup" options warning (TB default)
user_pref("browser.slowStartup.timeThreshold", 2000000000);//Large time treshold of "Slow Startup" in secs
user_pref("browser.slowStartup.maxSamples", 0);//Max samples count of "Slow Startup" options (TB default)

user_pref("browser.aboutHomeSnippets.updateUrl", "https://0.0.0.0/");//Spoof Mozilla content URL shown on about:home

user_pref("browser.casting.enabled", false);//Disable Simple Service Discovery (default)
user_pref("browser.fullscreen.animate", false);//Disable animation when go to fullscreen mode (removed in FF55+)

user_pref("browser.urlbar.autoFill", false);//Disable autocomplete suggestions in LocationBar and SearchBar
user_pref("browser.urlbar.autoFill.typed", false);//Disable inline autocomplete in LocationBar and SearchBar

user_pref("browser.urlbar.filter.javascript", true);//Filter out javascript: URLs from appearing in the LocationBar autocomplete dropdown (default)

user_pref("browser.urlbar.maxRichResults", 0);//Disable autocomplete when doing rich results

user_pref("browser.urlbar.suggest.history", false);//Disable history suggestion in LocationBar
user_pref("browser.urlbar.suggest.bookmark", false);//Disable bookmark suggestion in LocationBar
user_pref("browser.urlbar.suggest.openpage", false);//Disable open tab suggestion in LocationBar
user_pref("browser.urlbar.suggest.searches", false);//Disable search keyword suggestion in LocationBar (default, true in FF55+)
user_pref("browser.urlbar.userMadeSearchSuggestionsChoice", true);//User has been choice suggestions behavior
user_pref("browser.urlbar.daysBeforeHidingSuggestionsPrompt", 0);//Hide suggestion prompt

user_pref("browser.urlbar.maxCharsForSearchSuggestions", 0);//Maximum number of characters sent to the current search engine to fetch suggestions

user_pref("browser.urlbar.suggest.history.onlyTyped", true);//Typed suggestion will be used only for results from history

user_pref("browser.urlbar.trimURLs", true);//Hide http:// protocol from LocationBar (default)

user_pref("browser.urlbar.oneOffSearches", false);//Hide "One Off Searches" from LocationBar (default, true in FF55+)

user_pref("browser.download.useDownloadDir", false);//Always ask the user where to download files (TB default)
user_pref("browser.download.folderList", 2);//Download files to browser.download.dir folder
user_pref("browser.download.manager.addToRecentDocs", false);//Don't integrate activity into Windows recent documents (TB default)

user_pref("browser.download.showPanelDropmarker", true);//Show dropmarker with some options in download panel (removed in FF55+)

user_pref("browser.download.panel.shown", true);//Download button has been show at least once (TB default)

//user_pref("browser.helperApps.deleteTempFileOnExit", true);//(Already in All section)

user_pref("browser.search.searchEnginesURL", "https://0.0.0.0/");//Spoof search search engines URL

user_pref("browser.search.defaultenginename", "");//Reset default search engine name

user_pref("browser.search.order.1", "");//Reset name of first search engine in ordering of search engines in the engine list
user_pref("browser.search.order.2", "");//Reset name of second search engine in ordering of search engines in the engine list
user_pref("browser.search.order.3", "");//Reset name of third search engine in ordering of search engines in the engine list

//user_pref("browser.search.geoSpecificDefaults", false);//(Already in All section)
user_pref("browser.search.geoSpecificDefaults.url", "https://0.0.0.0/");//Spoof geo-specific search engines

user_pref("browser.search.defaultenginename.US", "");//Reset US-specific default engine name
user_pref("browser.search.order.US.1", "");//Reset name of first US-specific search engine in ordering of search engines in the engine list
user_pref("browser.search.order.US.2", "");//Reset name of second US-specific search engine in ordering of search engines in the engine list
user_pref("browser.search.order.US.3", "");//Reset name of third US-specific search engine in ordering of search engines in the engine list

user_pref("browser.search.hiddenOneOffs", "DuckDuckGo,Google,Twitter,Wikipedia (en),Yahoo,Disconnect,DuckDuckGoOnion,Startpage,YouTube,Amazon.com,Bing");//Comma seperated list of engines to hide in the search panel

//user_pref("browser.search.reset.enabled", false);//(Already in All section)

user_pref("browser.sessionhistory.max_entries", 4);//Maximum tab history entries (navigates via back/forward)

user_pref("permissions.manager.defaultsUrl", "");//Don't use built-in permissions (UITour/XPInstall/RemoteTroubleshooting)

user_pref("browser.link.open_newwindow", 1);//If link attempt to open in new window load it in current window/tab instead

user_pref("browser.link.open_newwindow.override.external", 2);//Open links from external apps in new window

user_pref("browser.link.open_newwindow.restriction", 0);//Disable links opening in a new window with no restrictions (divert everything) (TB default)

user_pref("browser.tabs.closeWindowWithLastTab", false);//Don't close window if last tab closed
user_pref("browser.tabs.insertRelatedAfterCurrent", false);//Open new tab at the end of the tab bar instead after the current tab
user_pref("browser.tabs.warnOnClose", true);//Show warning on close window with multiple tabs (default)
user_pref("browser.tabs.warnOnCloseOtherTabs", false);//Don't warn on close other tabs
user_pref("browser.tabs.warnOnOpen", false);//Don't warn on open browser.tabs.maxOpenBeforeWarn or more tabs
user_pref("browser.tabs.loadInBackground", true);//Load new tabs in background (default)
user_pref("browser.tabs.opentabfor.middleclick", true);//Open tab for middleclick on link (default)
user_pref("browser.tabs.loadDivertedInBackground", false);//Load the new diverted tab (normally meant to open in a new window, but that have instead been loaded in a new tab) in the foreground (default)
user_pref("browser.tabs.loadBookmarksInBackground", true);//Load bookmarks in background

user_pref("browser.tabs.animate", false);//Disable tab animation (removed in FF55+)
user_pref("browser.tabs.drawInTitlebar", true);//Draw tabs in titlebar (default)

user_pref("browser.tabs.selectOwnerOnClose", false);//Switch to the adjacent tab on close current tab instead switch to the owner tab

user_pref("browser.tabs.showAudioPlayingIcon", true);//Show audio playing icon on the tab (default)

user_pref("browser.ctrlTab.previews", false);//Disable Ctrl-Tab previews (default)

user_pref("browser.bookmarks.autoExportHTML", true);//At shutdown the bookmarks in your menu and toolbar will be exported as HTML to the bookmarks.html file

//user_pref("browser.bookmarks.max_backups", 0);//(Already in All section)

user_pref("browser.bookmarks.showRecentlyBookmarked", false);//Hide recently bookmarked items

//user_pref("dom.disable_window_open_feature.location", true);//(Already in All section)
//user_pref("dom.disable_window_status_change", true);//(Already in All section)
//user_pref("dom.disable_window_move_resize", true);//(Already in All section)
//user_pref("dom.disable_window_flip", true);//(Already in All section)

user_pref("privacy.popups.showBrowserMessage", false);//Don't show message on block popups

user_pref("privacy.item.cookies", true);//Probably obsolete pref

user_pref("privacy.clearOnShutdown.history", true);//Clear Browsing History on shutdown (if "Clear history when Firefox closes" checked) (default)
user_pref("privacy.clearOnShutdown.formdata", true);//Clear Form and Search History on shutdown (if "Clear history when Firefox closes" checked) (default)
user_pref("privacy.clearOnShutdown.downloads", true);//This pref synced with 'history' pref in reality (default)
user_pref("privacy.clearOnShutdown.cookies", true);//Clear Cookies on shutdown (if "Clear history when Firefox closes" checked) (default)
user_pref("privacy.clearOnShutdown.cache", true);//Clear Cache on shutdown (if "Clear history when Firefox closes" checked) (default)
user_pref("privacy.clearOnShutdown.sessions", true);//Clear Active Logins (sessions) on shutdown (if "Clear history when Firefox closes" checked) (default)
user_pref("privacy.clearOnShutdown.offlineApps", true);//Clear Offline Website Data on shutdown(if "Clear history when Firefox closes" checked)
user_pref("privacy.clearOnShutdown.siteSettings", true);//Clear Site Preferences on shutdown(if "Clear history when Firefox closes" checked)

user_pref("privacy.cpd.history", true);//Clear Browsing History by default in "Clear Recent History" dialog (default)
user_pref("privacy.cpd.formdata", true);//Clear Form and Search History by default in "Clear Recent History" dialog (default)
user_pref("privacy.cpd.passwords", true);//Clear Passwords by default in "Clear Recent History" dialog (not listed in dialog)
user_pref("privacy.cpd.downloads", true);//This pref synced with 'history' pref in reality
user_pref("privacy.cpd.cookies", true);//Clear Cookies by default in "Clear Recent History" dialog (default)
user_pref("privacy.cpd.cache", true);//Clear Cache by default in "Clear Recent History" dialog (default)
user_pref("privacy.cpd.sessions", true);//Clear Active Logins (sessions) by default in "Clear Recent History" dialog (default)
user_pref("privacy.cpd.offlineApps", true);//Clear Offline Website Data by default in "Clear Recent History" dialog
user_pref("privacy.cpd.siteSettings", true);//Clear Site Preferences by default in "Clear Recent History" dialog

user_pref("privacy.sanitize.timeSpan", 0);//"Clear everything" time span by default in "Clear Recent History" dialog
user_pref("privacy.sanitize.sanitizeOnShutdown", true);//Sanitize on shutdown (Clear history when Firefox closes)

user_pref("privacy.panicButton.enabled", false);//Disable Panic Button (Forget about some browsing history)

user_pref("privacy.firstparty.isolate", true);//Enable First Party Isolation feature (TB default)

//user_pref("network.captive-portal-service.enabled", false);//(Already in All section)

//user_pref("network.manage-offline-status", false);//(Already in All section)

user_pref("network.protocol-handler.external.mailto", false);//Disable external protocol handlers for Mail (TB default)
user_pref("network.protocol-handler.external.news", false);//Disable external protocol handlers for News (TB default)
user_pref("network.protocol-handler.external.snews", false);//Disable external protocol handlers for Secure News (TB default)
user_pref("network.protocol-handler.external.nntp", false);//Disable external protocol handlers for NNTP (TB default)
user_pref("network.protocol-handler.external.ms-windows-store", false);//Disable external protocol handlers for Windows Store apps (Windows 8+ only)

user_pref("network.protocol-handler.warn-external.mailto", true);//Show warning dialogs on external protocol handlers for Mail if handlers enabled (TB default)
user_pref("network.protocol-handler.warn-external.news", true);//Show warning dialogs on external protocol handlers for News if handlers enabled (TB default)
user_pref("network.protocol-handler.warn-external.snews", true);//Show warning dialogs on external protocol handlers for Secure News if handlers enabled (TB default)
user_pref("network.protocol-handler.warn-external.nntp", true);//Show warning dialogs on external protocol handlers for NNTP if handlers enabled (TB default)
user_pref("network.protocol-handler.warn-external.ms-windows-store", true);//Show warning dialogs on external protocol handlers for Windows Store apps if handlers enabled (Windows 8+ only)

//user_pref("network.protocol-handler.expose-all", false);//(Already in All section)
user_pref("network.protocol-handler.expose.mailto", false);//Don't expose MailTo protocol (default)
user_pref("network.protocol-handler.expose.news", false);//Don't expose News protocol (default)
user_pref("network.protocol-handler.expose.snews", false);//Don't expose SNews protocol (default)
user_pref("network.protocol-handler.expose.nntp", false);//Don't expose NNTP protocol (default)

//user_pref("accessibility.typeaheadfind", true);//(already in All section)

//user_pref("plugins.click_to_play", true);//(Already in All section)

//user_pref("plugin.default.state", 0);//(Already in All section)

user_pref("plugin.defaultXpi.state", 0);//Plugins bundled in XPIs in disabled state by default

user_pref("plugin.state.flash", 0);//FlashPlayer plugin in disabled state by default
user_pref("plugin.state.java", 0);//Java plugin in disabled state by default

user_pref("plugin.load_flash_only", true);//Load only FlashPlayer plugin

user_pref("browser.backspace_action", 2);//Disable Backspace and Shift+Backspace behavior

user_pref("layout.spellcheckDefault", 0);//Disable spellchecking

//user_pref("browser.send_pings", false);//(Already in All section)

user_pref("browser.contentHandlers.types.0.title", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.0.uri", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.0.type", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.1.title", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.1.uri", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.1.type", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.2.title", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.2.uri", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.2.type", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.3.title", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.3.uri", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.3.type", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.4.title", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.4.uri", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.4.type", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.5.title", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.5.uri", "");//Reset content handlers list
user_pref("browser.contentHandlers.types.5.type", "");//Reset content handlers list

user_pref("gecko.handlerService.schemes.webcal.0.name", "");//Reset Webcal type handler list
user_pref("gecko.handlerService.schemes.webcal.0.uriTemplate", "");//Reset Webcal type handler list
user_pref("gecko.handlerService.schemes.webcal.1.name", "");//Reset Webcal type handler list
user_pref("gecko.handlerService.schemes.webcal.1.uriTemplate", "");//Reset Webcal type handler list
user_pref("gecko.handlerService.schemes.webcal.2.name", "");//Reset Webcal type handler list
user_pref("gecko.handlerService.schemes.webcal.2.uriTemplate", "");//Reset Webcal type handler list
user_pref("gecko.handlerService.schemes.webcal.3.name", "");//Reset Webcal type handler list
user_pref("gecko.handlerService.schemes.webcal.3.uriTemplate", "");//Reset Webcal type handler list

user_pref("gecko.handlerService.schemes.mailto.0.name", "");//Reset Mailto type handler list
user_pref("gecko.handlerService.schemes.mailto.0.uriTemplate", "");//Reset Mailto type handler list
user_pref("gecko.handlerService.schemes.mailto.1.name", "");//Reset Mailto type handler list
user_pref("gecko.handlerService.schemes.mailto.1.uriTemplate", "");//Reset Mailto type handler list
user_pref("gecko.handlerService.schemes.mailto.2.name", "");//Reset Mailto type handler list
user_pref("gecko.handlerService.schemes.mailto.2.uriTemplate", "");//Reset Mailto type handler list
user_pref("gecko.handlerService.schemes.mailto.3.name", "");//Reset Mailto type handler list
user_pref("gecko.handlerService.schemes.mailto.3.uriTemplate", "");//Reset Mailto type handler list

user_pref("gecko.handlerService.schemes.irc.0.name", "");//Reset IRC type handler list
user_pref("gecko.handlerService.schemes.irc.0.uriTemplate", "");//Reset IRC type handler list
user_pref("gecko.handlerService.schemes.irc.1.name", "");//Reset IRC type handler list
user_pref("gecko.handlerService.schemes.irc.1.uriTemplate", "");//Reset IRC type handler list
user_pref("gecko.handlerService.schemes.irc.2.name", "");//Reset IRC type handler list
user_pref("gecko.handlerService.schemes.irc.2.uriTemplate", "");//Reset IRC type handler list
user_pref("gecko.handlerService.schemes.irc.3.name", "");//Reset IRC type handler list
user_pref("gecko.handlerService.schemes.irc.3.uriTemplate", "");//Reset IRC type handler list

user_pref("gecko.handlerService.schemes.ircs.0.name", "");//Reset IRCS type handler list
user_pref("gecko.handlerService.schemes.ircs.0.uriTemplate", "");//Reset IRCS type handler list
user_pref("gecko.handlerService.schemes.ircs.1.name", "");//Reset IRCS type handler list
user_pref("gecko.handlerService.schemes.ircs.1.uriTemplate", "");//Reset IRCS type handler list
user_pref("gecko.handlerService.schemes.ircs.2.name", "");//Reset IRCS type handler list
user_pref("gecko.handlerService.schemes.ircs.2.uriTemplate", "");//Reset IRCS type handler list
user_pref("gecko.handlerService.schemes.ircs.3.name", "");//Reset IRCS type handler list
user_pref("gecko.handlerService.schemes.ircs.3.uriTemplate", "");//Reset IRCS type handler list

user_pref("browser.geolocation.warning.infoURL", "https://0.0.0.0/");//Spoof geolocation info URL

user_pref("browser.rights.3.shown", true);//Rights gas been shown (TB default)

user_pref("browser.selfsupport.url", "https://0.0.0.0/");//Spoof Heartbeat telemetry URL (removed in FF55+)

user_pref("browser.sessionstore.resume_from_crash", false);//Don't restore the previous session after crash
user_pref("browser.sessionstore.resume_session_once", false);//Don't restore the previous session again in next session (default)

user_pref("browser.sessionstore.interval", 2000000000);//Minimal interval between two save operations of Session Restore in msecs
user_pref("browser.sessionstore.privacy_level", 2);//Seesion Store don't store any data (TB default)
user_pref("browser.sessionstore.max_tabs_undo", 0);//None of the tabs can be reopened (undo) per window
user_pref("browser.sessionstore.max_windows_undo", 0);//None of the windows can be reopened (undo) per session
user_pref("browser.sessionstore.max_resumed_crashes", 0);//Disable the previous session automatically restored after a crash
user_pref("browser.sessionstore.max_serialize_back", 0);//Nowhere of back button session history entries to restore
user_pref("browser.sessionstore.max_serialize_forward", 0);//Nowhere of forward button session history entries to restore
user_pref("browser.sessionstore.restore_on_demand", true);//Tabs will not be restored until they are focused if Session Store enabled (default)
user_pref("browser.sessionstore.restore_hidden_tabs", false);//Don't automatically restore hidden tabs (tabs in other tab groups)
user_pref("browser.sessionstore.restore_pinned_tabs_on_demand", true);//Pinned tabs will not be restored until they are focused (if Session Store enabled and browser.sessionstore.restore_on_demand)
user_pref("browser.sessionstore.upgradeBackup.latestBuildID", "");//Reset the version at which we performed the latest upgrade backup
user_pref("browser.sessionstore.upgradeBackup.maxUpgradeBackups", 0);//None of upgrade backups should be kept
user_pref("browser.sessionstore.cleanup.forget_closed_after", 0);//Forget closed windows/tabs immediately (after 0 msecs)

user_pref("accessibility.blockautorefresh", true);//Block auto META refresh

user_pref("places.history.enabled", false);//Never remember browsing and download history

user_pref("places.frecency.numVisits", 0);//None of the recent visits to sample when calculating frecency

user_pref("places.frecency.firstBucketCutoff", 0);//0 days for frecency calculation in 1st bucket
user_pref("places.frecency.secondBucketCutoff", 0);//0 days for frecency calculation in 2nd bucket
user_pref("places.frecency.thirdBucketCutoff", 0);//0 days for frecency calculation in 3rd bucket
user_pref("places.frecency.fourthBucketCutoff", 0);//0 days for frecency calculation in 4th bucket

user_pref("places.frecency.firstBucketWeight", 0);//0 weight of 1st bucket for frecency calculations
user_pref("places.frecency.secondBucketWeight", 0);//0 weight of 2nd bucket for frecency calculations
user_pref("places.frecency.thirdBucketWeight", 0);//0 weight of 3rd bucket for frecency calculations
user_pref("places.frecency.fourthBucketWeight", 0);//0 weight of 4th bucket for frecency calculations
user_pref("places.frecency.defaultBucketWeight", 0);//0 weight of default bucket for frecency calculations

user_pref("places.frecency.embedVisitBonus", 0);//0% bonus for places for frecency calculations of embeds visit (default)
user_pref("places.frecency.framedLinkVisitBonus", 0);//0% bonus for places for frecency calculations of framed link visit (default)
user_pref("places.frecency.linkVisitBonus", 0);//0% bonus for places for frecency calculations of link visit
user_pref("places.frecency.typedVisitBonus", 0);//0% bonus for places for frecency calculations of typed visit
user_pref("places.frecency.bookmarkVisitBonus", 0);//0% bonus for places for frecency calculations of bookmarks visit
user_pref("places.frecency.downloadVisitBonus", 0);//0% bonus for places for frecency calculations of download visit (default)
user_pref("places.frecency.permRedirectVisitBonus", 0);//0% bonus for places for frecency calculations of permanent redirection visit (default)
user_pref("places.frecency.tempRedirectVisitBonus", 0);//0% bonus for places for frecency calculations of temporary redirection visit (default)
user_pref("places.frecency.reloadVisitBonus", 0);//0% bonus for places for frecency calculations of reload visit (default)
user_pref("places.frecency.defaultVisitBonus", 0);//0% bonus for places for frecency calculations of default visit (default)

user_pref("places.frecency.unvisitedBookmarkBonus", 0);//0% bonus for places for frecency calculations of unvisited bookmark
user_pref("places.frecency.unvisitedTypedBonus", 0);//0% bonus for places for frecency calculations unvisited typed

user_pref("browser.ssl_override_behavior", 1);//Pre-populate site URL, but don't fetch certificate in the "Add Exception" dialog launched from TSL error pages

user_pref("browser.offline-apps.notify", false);//User should not be prompted when a web application supports offline apps (set true if Offline Web Content enabled)

user_pref("browser.zoom.siteSpecific", false);//Don't save and restore zoom levels on a per-site basis (TB default)

user_pref("breakpad.reportURL", "https://0.0.0.0/");//Spoof the breakpad report URL in about:crashes

user_pref("toolkit.crashreporter.infoURL", "https://0.0.0.0/");//Spoof URL for "Learn More" for CrashReporter

user_pref("app.support.baseURL", "https://0.0.0.0/");//Spoof base URL for web-based support pages

user_pref("app.support.e10sAccessibilityUrl", "https://0.0.0.0/");//Spoof multiprocess support URL

user_pref("app.feedback.baseURL", "https://0.0.0.0/");//Spoof base url for web-based feedback pages

user_pref("browser.privatebrowsing.autostart", true);//Start the Private Browsing mode at application startup (TB default)

user_pref("browser.tabs.remote.autostart", true);//Start the browser in multiprocess mode

user_pref("browser.taskbar.previews.enable", false);//Disable taskbar preview (Windows only) (default)
user_pref("browser.taskbar.previews.max", 0);//None of the taskbar preview (Windows only)
user_pref("browser.taskbar.lists.enabled", false);//Disable JumpList feature (Windows only)
user_pref("browser.taskbar.lists.frequent.enabled", false);//Disable Frequent JumpList feature (Windows only)
user_pref("browser.taskbar.lists.recent.enabled", false);//Disable Recent JumpList feature (Windows only) (default)
user_pref("browser.taskbar.lists.maxListItemCount", 0);//None of item count in JumpList feature (Windows only)
user_pref("browser.taskbar.lists.tasks.enabled", false);//Disable Tasks JumpList feature (Windows only)
user_pref("browser.taskbar.lists.refreshInSeconds", 630720000);//Refresh interval of JumpList feature items in secs (Windows only)

user_pref("services.sync.registerEngines", "");//Nothing the sync engines to use (removed in FF56)

user_pref("services.sync.syncedTabs.showRemoteIcons", false);//Don't show icons on synced tabs

user_pref("services.sync.sendTabToDevice.enabled", false);//Disable Send Tab to Device feature (removed in FF56)

user_pref("lightweightThemes.selectedThemeID", "");//Reset DevEdition theme ID

user_pref("browser.menu.showCharacterEncoding", "false");//Don't show "Show text encoding option" button is under the main Firefox button

user_pref("browser.newtab.preload", false);//Don't activates preloading of the new tab URL
user_pref("browser.newtabpage.introShown", true);//about:newtab intro has been shown (TB default)
user_pref("browser.newtabpage.enabled", false);//Disable content on about:newtab
user_pref("browser.newtabpage.enhanced", false);//Disable enhanced (sponsored tiles) content on about:newtab (TB default)
user_pref("browser.newtabpage.compact", false);//Disable Activity Stream inspired layout (default)
user_pref("browser.newtabpage.thumbnailPlaceholder", false);//Disable showing basic placeholders for missing thumbnails (default)
user_pref("browser.newtabpage.rows", 1);//Only one row of about:newtab grid if newtabpage enabled
user_pref("browser.newtabpage.columns", 1);//Only one column of about:newtab grid if newtabpage enabled
user_pref("browser.newtabpage.directory.source", "https://0.0.0.0/");//Spoof directory tiles download URL
user_pref("browser.newtabpage.directory.ping", "https://0.0.0.0/");//Spoof endpoint URL to send newtab click and view pings (removed in FF55+)
user_pref("browser.newtabpage.remote", false);//Don't activate the remote-hosted newtab page (default, TB default, removed in FF54+)
user_pref("browser.newtabpage.remote.mode", "dev");//Developer mode (instead production) equal endpoint disallowed for remote newtab communications (removed in FF54+)
user_pref("browser.newtabpage.remote.content-signing-test", false);//Disable content-signature tests for remote newtab (default)
user_pref("browser.newtabpage.remote.keys", "");//Reset verification keys for remote-hosted newtab page (removed in FF54+)

user_pref("toolkit.startup.max_resumed_crashes", -1);//Disable Startup Crash Tracking

user_pref("pdfjs.disabled", true);//Completely disable pdf.js
user_pref("pdfjs.firstRun", false);//pdf.js has been runned

user_pref("social.share.activationPanelEnabled", false);//Disable Social share panel (TB default)
user_pref("social.shareDirectory", "https://0.0.0.0/");//Spoof Social share directory URL

//user_pref("security.mixed_content.block_active_content", true);//(Already in All section)

user_pref("security.insecure_password.ui.enabled", true);//Show degraded UI for http pages with password fields (default)

//user_pref("security.insecure_field_warning.contextual.enabled", true);//(Already in All section)

//user_pref("security.cert_pinning.enforcement_level", 2);//(Already in All section)

user_pref("geo.wifi.uri", "https://0.0.0.0/");//The request URL of the geolocation backend
user_pref("geo.provider.use_corelocation", false);//Disable geolocation via MAC
user_pref("geo.provider.ms-windows-location", false);//Disable geolocation via Windows
user_pref("geo.provider.use_gpsd", false);//Disable geolocation via GPS

user_pref("identity.fxaccounts.remote.signup.uri", "https://0.0.0.0/");//Spoof the remote content URL shown for Firefox Account signup
user_pref("identity.fxaccounts.remote.force_auth.uri", "https://0.0.0.0/");//Spoof the URL where remote content that forces re-authentication for Firefox Accounts should be fetched
user_pref("identity.fxaccounts.remote.signin.uri", "https://0.0.0.0/");//Spoof the remote content URL shown for signin in Firefox Account
user_pref("identity.fxaccounts.remote.webchannel.uri", "https://0.0.0.0/");//Spoof the remote content URL where FxAccountsWebChannel messages originate
user_pref("identity.fxaccounts.settings.uri", "https://0.0.0.0/");//Spoof the URL we take the user to when they opt to "manage" their Firefox Account
user_pref("identity.fxaccounts.remote.profile.uri", "https://0.0.0.0/");//Spoof the remote URL of the Firefox Account rofile Server
user_pref("identity.fxaccounts.remote.oauth.uri", "https://0.0.0.0/");//Spoof the remote URL of the Firefox Account OAuth Server
user_pref("identity.fxaccounts.profile_image.enabled", false);//Don't display profile images of Firefox Account in the UI
user_pref("identity.sync.tokenserver.uri", "https://0.0.0.0/");//Spoof token server URL used by the Firefox Account Sync identity
user_pref("identity.mobilepromo.android", "https://0.0.0.0/");//Spoof URL for promo links to Android
user_pref("identity.mobilepromo.ios", "https://0.0.0.0/");//Spoof URL for promo links to iOS
user_pref("identity.fxaccounts.migrateToDevEdition", false);//Don't migrate any existing Firefox Account data from the default profile to the DevEdition profile (DevEdition only)

user_pref("media.eme.enabled", false);//Disable DRM (Encrypted Media Extensions) (TB default)
user_pref("media.eme.apiVisible", false);//Hide DRM (TB default, removed in FF54+)

user_pref("media.gmp.decoder.enabled", false);//Disable Gecko Media Plugins DRM (default)

user_pref("media.gmp.trial-create.enabled", false);//Don't run a DRM test-pattern

user_pref("media.gmp-eme-adobe.visible", false);//Hide Adobe DRM (TB default)
user_pref("media.gmp-eme-adobe.enabled", false);//Disable Adobe DRM (TB default)

user_pref("media.gmp-widevinecdm.visible", false);//Hide Widevine CDM DRM (TB default)
user_pref("media.gmp-widevinecdm.enabled", false);//Disable Widevine CDM DRM (TB default)

user_pref("browser.cache.frecency_experiment", -1);//No experiment with cache is run

user_pref("browser.translation.detectLanguage", false);//Disable Translation feature (default)
user_pref("browser.translation.neverForLanguages", "bg,cs,de,en,es,fr,ja,ko,nl,no,pl,pt,ru,tr,vi,zh");//Skip all Translation languages (browser\components\translation\Translation.jsm)
user_pref("browser.translation.ui.show", false);//Hide Translation UI (default)

user_pref("toolkit.telemetry.archive.enabled", false);//Telemetry pings don't archived locally

user_pref("experiments.enabled", false);//Disable Telemetry experiments (TB default)
user_pref("experiments.manifest.fetchIntervalSeconds", 630720000);//Fetch Telemetry experiments manifest interval if enabled
user_pref("experiments.manifest.uri", "https://0.0.0.0/");//Spoof Telemetry experiments manifest URL
user_pref("experiments.supported", false);//Telemetry experiments aren't supported by the current application profile

user_pref("media.gmp-provider.enabled", false);//Disable GMP support in the addon manager (TB default)

user_pref("privacy.trackingprotection.ui.enabled", false);//Hide TrackingProtection UI
user_pref("privacy.trackingprotection.introCount", 100);//Don't show TrackingProtection intro (browser\base\content\browser-trackingprotection.js)
user_pref("privacy.trackingprotection.introURL", "https://0.0.0.0/");//Spoof TrackingProtection intro URL

user_pref("browser.tabs.remote.autostart.1", true);//Enable multiprocess mode (another one pref)
user_pref("browser.tabs.remote.autostart.2", true);//Enable multiprocess mode (another one pref)

user_pref("browser.tabs.crashReporting.sendReport", false);//Disable CrashReport for the crashed tabs
user_pref("browser.tabs.crashReporting.includeURL", false);//Don't include URL in CrashReport for the crashed tabs (default)
user_pref("browser.tabs.crashReporting.requestEmail", false);//Don't include email address in CrashReport for the crashed tabs (default)
user_pref("browser.tabs.crashReporting.emailMe", false);//Don't email me after CrashReport for the crashed tabs (default)
user_pref("browser.tabs.crashReporting.email", "");//Reset email address for CrashReport for the crashed tabs

user_pref("extensions.e10sBlocksEnabling", false);//Disable block multiprocess mode by addons

user_pref("dom.ipc.cpows.allow-cpows-in-compat-addons", "");//Clear blacklist addons to use CPOWs

user_pref("browser.reader.detectedFirstArticle", true);//Avoid performing Reader Mode intros (TB default)
//user_pref("reader.parse-node-limit", 1);//(Already in All section)

//user_pref("reader.errors.includeURLs", false);//(Already in All section)

//user_pref("dom.serviceWorkers.enabled", false);//(Already in All section)
user_pref("dom.serviceWorkers.openWindow.enabled", false);//Disable ServiceWorkers open window (default)

//user_pref("dom.push.enabled", false);//(Already in All section)

//user_pref("media.webspeech.synth.enabled", false);//(Already in All section)

user_pref("browser.laterrun.enabled", false);//Disable Later Run feauture

user_pref("browser.migrate.automigrate.enabled", false);//Disable automigrate (default, true in FF53+)
user_pref("browser.migrate.automigrate.ui.enabled", false);//Disable automigrate UI

user_pref("extensions.pocket.enabled", false);//Disable Pocket extension

//user_pref("signon.schemeUpgrades", true);//(Already in All section)

user_pref("webchannel.allowObject.urlWhitelist", "");//Clear list of URLS that are allowed to send objects through webchannels

user_pref("browser.crashReports.unsubmittedCheck.enabled", false);//Shouldn't scan for unsubmitted crash reports (default, true in FF53+)
user_pref("browser.crashReports.unsubmittedCheck.chancesUntilSuppress", 0);//No one chance to send unsubmitted Crash Report
user_pref("browser.crashReports.unsubmittedCheck.autoSubmit", false);//Disable autosubmit unsubmitted crash reports (default)

//=============== WebIDE Prefs ===============
user_pref("devtools.webide.showProjectEditor", false);//Hide WebIDE project editor
user_pref("devtools.webide.templatesURL", "https://0.0.0.0/");//Spoof WebIDE templates URL
user_pref("devtools.webide.autoinstallADBHelper", false);//Disable autoinstall WebIDE ADB Helper (TB default)
user_pref("devtools.webide.autoinstallFxdtAdapters", false);//Disable autoinstall WebIDE Fxdt Adapter (TB default)
user_pref("devtools.webide.autoConnectRuntime", false);//Don't autoconnect WebIDE runtime
user_pref("devtools.webide.restoreLastProject", false);//Don't restore last WebIDE project
user_pref("devtools.webide.addonsURL", "https://0.0.0.0/");//Spoof WebIDE addons URL
user_pref("devtools.webide.simulatorAddonsURL", "https://0.0.0.0/");//Spoof WebIDE simulator addons URL
user_pref("devtools.webide.simulatorAddonID", "");//Clear WebIDE simulator addon ID
user_pref("devtools.webide.adbAddonURL", "https://0.0.0.0/");//Spoof WebIDE ADB addon URL
user_pref("devtools.webide.adbAddonID", "");//Clear WebIDE ADB addon ID
user_pref("devtools.webide.adaptersAddonURL", "https://0.0.0.0/");//Spoof WebIDE adapters addon URL
user_pref("devtools.webide.adaptersAddonID", "");//Clear WebIDE Adapters addon ID
user_pref("devtools.webide.monitorWebSocketURL", "ws://0.0.0.0/");//Spoof WebIDE monitor WebSocket URL
user_pref("devtools.webide.lastConnectedRuntime", "");//Reset WebIDE last connected runtime
user_pref("devtools.webide.lastSelectedProject", "");//Reset WebIDE last selected project
user_pref("devtools.webide.widget.autoinstall", false);//Disable autoinstall WebIDE widget (removed in FF55+)
user_pref("devtools.webide.widget.enabled", false);//Disable WebIDE widget (removed in FF55+)
user_pref("devtools.webide.widget.inNavbarByDefault", false);//Disable WebIDE widget in navigation bar if enabled (removed in FF55+)
user_pref("devtools.webide.zoom", "1");//Reset WebIDE zoom
user_pref("devtools.webide.autosaveFiles", false);//Don't autosave WebIDE files (removed in FF55+)

//=============== Services Sync Prefs ===============
user_pref("services.sync.serverURL", "https://0.0.0.0/");//Spoof Sync Server URL (removed in FF54+)
user_pref("services.sync.termsURL", "https://0.0.0.0/");//Spoof Sync Terms URL (removed in FF54+)
user_pref("services.sync.privacyURL", "https://0.0.0.0/");//Spoof Sync Privacy URL (removed in FF54+)
user_pref("services.sync.statusURL", "https://0.0.0.0/");//Spoof Sync Status URL (removed in FF54+)
user_pref("services.sync.syncKeyHelpURL", "https://0.0.0.0/");//Spoof Sync KeyHelp URL (removed in FF54+)

user_pref("services.sync.scheduler.eolInterval", 630720000);//Sync EOL interval in secs
user_pref("services.sync.scheduler.idleInterval", 630720000);//Sync idle interval in secs
user_pref("services.sync.scheduler.activeInterval", 630720000);//Sync active interval in secs
user_pref("services.sync.scheduler.immediateInterval", 630720000);//Sync immediate interval in secs
user_pref("services.sync.scheduler.idleTime", 630720000);//Sync Idle time in secs

user_pref("services.sync.scheduler.fxa.singleDeviceInterval", 630720000);//Sync Firefox Account single device interval in secs
user_pref("services.sync.scheduler.sync11.singleDeviceInterval", 630720000);//Sync11 single device interval in secs

user_pref("services.sync.errorhandler.networkFailureReportTimeout", 630720000);//Sync network failure report timeout in secs

user_pref("services.sync.engine.addons", false);//Disable sync addons (TB default)
user_pref("services.sync.engine.bookmarks", false);//Disable sync bookmarks
user_pref("services.sync.engine.history", false);//Disable sync history
user_pref("services.sync.engine.passwords", false);//Disable sync passwords
user_pref("services.sync.engine.prefs", false);//Disable sync prefs (TB default)
user_pref("services.sync.engine.tabs", false);//Disable sync tabs (TB default)
user_pref("services.sync.engine.tabs.filteredUrls", "^.*");//Filtered out all tabs from Sync

user_pref("services.sync.jpake.serverURL", "https://0.0.0.0/");//Spoof Sync Jpacke server URL (removed in FF54+)

user_pref("services.sync.addons.trustedSourceHostnames", "");//Clear comma-delimited list of hostnames to trust for add-on install

user_pref("services.sync.fxa.termsURL", "https://0.0.0.0/");//Spoof Sync Firefox Account terms URL
user_pref("services.sync.fxa.privacyURL", "https://0.0.0.0/");//Spoof Sync Firefox Account privacy URL

user_pref("services.sync.telemetry.submissionInterval", 630720000);//Sync telemetry submission interval in secs
user_pref("services.sync.telemetry.maxPayloadCount", 0);//Sync telemetry max payload count

user_pref("services.sync.validation.interval", 630720000);//Sync validation interval in secs

user_pref("services.sync.validation.percentageChance", 0);//Skipping sync validation (0% chance)

user_pref("services.sync.validation.maxRecords", 0);//Don't bother asking the sync server for the counts if we know validation

//=============== System Addons Prefs ===============
user_pref("extensions.pocket.api", "0.0.0.0");//Spoof Pocket API site
//user_pref("extensions.pocket.enabled", false);//(Already in Firefox section)
user_pref("extensions.pocket.oAuthConsumerKey", "");//Reset Pocket ID
user_pref("extensions.pocket.site", "0.0.0.0");//Spoof Pocket site

//=============== Hidden Prefs ===============
user_pref("app.update.lastUpdateTime.addon-background-update-timer", 0);//Reset last update time addon background update timer
user_pref("app.update.lastUpdateTime.background-update-timer", 0);//Reset last update time background update timer
user_pref("app.update.lastUpdateTime.blocklist-background-update-timer", 0);//Reset last update time blocklist background update timer
user_pref("app.update.lastUpdateTime.browser-cleanup-thumbnails", 0);//Reset last update time browser cleanup thumbnails
user_pref("app.update.lastUpdateTime.experiments-update-timer", 0);//Reset last update time experiments update timer
user_pref("app.update.lastUpdateTime.search-engine-update-timer", 0);//Reset last update time search engine update timer
user_pref("app.update.lastUpdateTime.xpi-signature-verification", 0);//Reset last update time xpi-signature verification
user_pref("browser.disableResetPrompt", true);//Disable the "Refresh" prompt that is displayed for stale profiles (TB default)
user_pref("browser.download.manager.retention", 1);//Completed and canceled downloads should be removed on quit (TB default)
user_pref("browser.download.manager.scanWhenDone", false);//Prevents AV remote reporting of downloads (TB default)
user_pref("browser.laterrun.bookkeeping.profileCreationTime", 0);//Reset profile creation time for Later Run
user_pref("browser.laterrun.bookkeeping.sessionCount", 1000);//High session count for Later Run
user_pref("browser.migrated-sync-button", true);//Don't trying add Sync button to customizing panel
user_pref("browser.pagethumbnails.capturing_disabled", true);//Disable page thumbnail collection
user_pref("browser.preferences.advanced.selectedTabIndex", 2);//Select "Network" tab in advanced settings by default
user_pref("browser.search.countryCode", "US");//Unify country code (disable GeoIP search lookups) (TB default)
user_pref("browser.search.isUS", true);//Unify country code (another pref)
user_pref("browser.search.order.extra.1", "");//Reset search engine order 1
user_pref("browser.search.order.extra.2", "");//Reset search engine order 2
user_pref("browser.search.region", "US");//Unify region (disable GeoIP search lookups) (TB default)
user_pref("browser.selfsupport.enabled", false);//Disable Heartbeat telemetry (TB default)
user_pref("browser.slowStartup.averageTime", 0);//Reset Slow Startup average time
user_pref("browser.slowStartup.samples", 0);//Reset Slow Startup samples count (TB default)
user_pref("browser.snippets.enabled", false);//Disable snippets
user_pref("browser.snippets.firstrunHomepage.enabled", false);//Disable firstrun snippets homepage
user_pref("browser.snippets.geoUrl", "https://0.0.0.0/");//Spoof check country code URL
user_pref("browser.snippets.statsUrl", "https://0.0.0.0/");//Spoof snippets telemetry URL
user_pref("browser.snippets.syncPromo.enabled", false);//Hide snippets sync promo
user_pref("browser.snippets.updateInterval", 630720000);//Update snippents interval
user_pref("browser.snippets.updateUrl", "https://0.0.0.0/");//Spoof snippets update URL
user_pref("browser.startup.homepage_override.mstone", "ignore");//Disable override homepage after upgrade
user_pref("browser.tabs.remote.force-enable", true);//Force enable multiprocess mode
user_pref("datareporting.sessions.current.activeTicks", 0);//Reset Data Reporting active ticks state
user_pref("datareporting.sessions.current.clean", false);//Reset Data Reporting clean state
user_pref("datareporting.sessions.current.firstPaint", -1);//Reset Data Reporting first paint state
user_pref("datareporting.sessions.current.main", -1);//Reset Data Reporting main state
user_pref("datareporting.sessions.current.sessionRestored", -1);//Reset Data Reporting session restored state
user_pref("datareporting.sessions.current.startTime", "0");//Reset Data Reporting start time 
user_pref("datareporting.sessions.current.totalTime", 0);//Reset Data Reporting total time state
user_pref("dom.allow_cut_copy", false);//Disable clipboard commands (cut/copy) from non-privileged content. This disables document.execCommand("cut"/"copy") to protect clipboard
user_pref("dom.mozTCPSocket.enabled", false);//Disable mozTCPSocket (TB default)
user_pref("experiments.activeExperiment", false);//Disable active experiments
user_pref("extensions.enabledScopes", 1);//Allow addons that are not installed by the user if it found in this profile only (TB default)
user_pref("extensions.getAddons.showPane", false);//Hide Get-Addons page in about:addons
user_pref("extensions.installDistroAddons", false);//Disable installing any distribution addons
user_pref("extensions.pendingOperations", false);//If there are pending operations then we must disable update the list of active addons (TB default)
user_pref("extensions.ui.lastCategory", "addons://list/extension");//Select "Extensions" tab in about:addons by default (TB default)
user_pref("geo.wifi.logging.enabled", false);//Disable Geolocation API logging
user_pref("geo.wifi.scan", false);//Disable Geolocation API via WiFi
user_pref("geo.wifi.timeToWaitBeforeSending", 630720000);//Geolocation API via WiFi sending interval
user_pref("idle.lastDailyNotification", 0);//Reset last daily notification time
user_pref("javascript.use_us_english_locale", true);//Enforce US English locale for JavaScript regardless of the system locale (TB default)
user_pref("media.getusermedia.browser.enabled", false);//Disable screensharing (false in FF53+)
user_pref("media.gmp-manager.lastCheck", 0);//Reset GMP last check time
user_pref("media.gmp-manager.updateEnabled", false);//Block pinging the GMP update/download server (TB default)
user_pref("media.webaudio.enabled", false);//Disable WebAudio API (TorButton High/Medium level)
user_pref("network.dns.disablePrefetchFromHTTPS", true);//Disable DNS prefetch from HTTPS if enabled
user_pref("network.protocol-handler.expose.file", true);//Allow expose File protocol
user_pref("network.protocol-handler.expose.http", true);//Allow expose HTTP protocol
user_pref("network.protocol-handler.expose.https", true);//Allow expose HTTPS protocol
user_pref("pdfjs.disableFontFace", true);//Disable FontsFace in pdf.js
user_pref("pdfjs.enableWebGL", false);//Disable WebGL in pdf.js
user_pref("permissions.memory_only", true);//Don't write any permission settings to disk, but keep them in a memory-only database (TB default)
user_pref("places.database.lastMaintenance", 0);//Reset places DB last maintenance time
user_pref("plugin.allowed_types", " ");//Disable all mime-type of plugins
user_pref("plugin.disable", true);//Disable to search plugins on first start (TB default)
user_pref("privacy.resistFingerprinting", true);//Change details that distinguish you from other users (TB default) (unhidden and false in FF55+)
user_pref("security.nocertdb", true);//Disable intermediate certificate caching (TB default)
user_pref("security.ssl.disable_session_identifiers", true);//Disable TLS Session Identifiers (TB default)
user_pref("services.sync.enabled", false);//Disable Sync Service
user_pref("social.enabled", false);//Disable Social API (migrated pref)
user_pref("storage.vacuum.last.places.sqlite", 0);//Reset places DB vacuum time
user_pref("toolkit.startup.last_success", 0);//Reset last success startup time
user_pref("toolkit.telemetry.cachedClientID", "");//Reset telemetry Client ID
user_pref("toolkit.telemetry.enabled", false);//Disable telemetry
user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);//Telemetry reporting policy has been shown
user_pref("ui.use_standins_for_native_colors", true);//Disable exposure of system colors to CSS or canvas (TB default)
user_pref("xpinstall.whitelist.add", "");//Empty whitelist URLs list for XPI install (TB default)
user_pref("xpinstall.whitelist.add.36", "");//Empty whitelist (36?) URLs list for XPI install (TB default)
user_pref("xpinstall.whitelist.add.test5", "");//Empty whitelist (test5?) URLs list for XPI install

//=============== TorBrowser Specific Prefs ===============
user_pref("network.http.referer.hideOnionSource", true);//Hide referer from onion site (TB default) (uplift in FF54+)
user_pref("privacy.suppressModifierKeyEvents", true);//Suppress ALT and SHIFT events (TB default)
user_pref("privacy.use_utc_timezone", true);//Use UTC Time Zone (TB default)
user_pref("svg.in-content.enabled", true);//Enable SVG images (uplift in FF53+ via "svg.disabled")

//=============== Obsolete Prefs ===============
user_pref("browser.newtabpage.preload", false);
user_pref("browser.pocket.api", "0.0.0.0");
user_pref("browser.pocket.enabled", false);
user_pref("browser.pocket.oAuthConsumerKey", "");
user_pref("browser.pocket.site", "0.0.0.0");
user_pref("browser.polaris.enabled", false);
user_pref("browser.safebrowsing.enabled", false);
user_pref("browser.search.redirectWindowsSearch", false);
user_pref("browser.sessionstore.privacy_level_deferred", 2);
user_pref("browser.syncPromoViewsLeftMap", "{\"addons\":0, \"passwords\":0, \"bookmarks\":0}");
user_pref("browser.usedOnWindows10", true);
user_pref("camera.control.autofocus_moving_callback.enabled", false);
user_pref("datareporting.healthreport.about.reportUrlUnified", "https://0.0.0.0/");
user_pref("datareporting.healthreport.documentServerURI", "https://0.0.0.0/");
user_pref("datareporting.healthreport.service.enabled", false);
user_pref("datareporting.policy.dataSubmissionEnabled.v2", false);
user_pref("devtools.appmanager.enabled", false);
user_pref("dom.disable_window_open_feature.scrollbars", true);
user_pref("dom.network.enabled", false);
user_pref("dom.push.udp.wakeupEnabled", false);
user_pref("dom.telephony.enabled", false);
user_pref("dom.vr.oculus050.enabled", false);
user_pref("dom.workers.sharedWorkers.enabled", false);
user_pref("geo.cell.scan", false);
user_pref("intl.charset.default", "windows-1252");
user_pref("javascript.options.baselinejit.content", false);
user_pref("javascript.options.ion.content", false);
user_pref("javascript.options.typeinference", false);
user_pref("media.audio_data.enabled", false);
user_pref("media.gmp-eme-adobe.autoupdate", false);
user_pref("media.gmp-gmpopenh264.autoupdate", false);
user_pref("media.gmp-gmpopenh264.enabled", false);
user_pref("media.gmp-widevinecdm.autoupdate", false);
user_pref("network.http.sendSecureXSiteReferrer", false);
user_pref("network.http.spdy.enabled.http2draft", false);
user_pref("network.http.spdy.enabled.v2", false);
user_pref("network.http.spdy.enabled.v3", false);
user_pref("network.http.spdy.enabled.v3-1", false);
user_pref("pageThumbs.enabled", false);
user_pref("plugin.expose_full_path", false);
user_pref("plugins.enumerable_names", "");
user_pref("plugins.hide_infobar_for_missing_plugin", true);
user_pref("plugins.hideMissingPluginsNotification", true);
user_pref("plugins.update.notifyUser", false);
user_pref("privacy.clearOnShutdown.passwords", true);
user_pref("privacy.donottrackheader.value", 1);
user_pref("security.enable_tls_session_tickets", false);
user_pref("security.tls.insecure_fallback_hosts.use_static_list", false);
user_pref("services.sync.ui.hidden", true);
user_pref("toolkit.telemetry.unifiedIsOptIn", true);

//=============== Future Prefs ===============
user_pref("browser.formautofill.experimental", false);//FF53: Disable experimantal Form Autofill feature
user_pref("browser.migrate.automigrate.undo-survey", "https://0.0.0.0/");//FF53: Spoof automigrate URL
user_pref("browser.storageManager.enabled", false);//FF53: Disable Site Data in preferences in conjunction with Dom StorageManager
user_pref("browser.tabs.remote.separateFileUriProcess", true);//FF53: Enforce separate content process for file URL
user_pref("dom.IntersectionObserver.enabled", false);//FF53: Disable DOM Intersection Observer (true in FF55+)
user_pref("extensions.getAddons.themes.browseURL", "https://0.0.0.0/");//FF53: Spoof Get-Addons themes URL
user_pref("extensions.shield-recipe-client.api_url", "https://0.0.0.0/");//FF53: Spoof Shield Telemetry system API URL
user_pref("extensions.shield-recipe-client.enabled", false);//FF53: Disable Shield Telemetry system
user_pref("extensions.webcompat-reporter.enabled", false);//FF53: Disable extensions compatibility reporter
user_pref("extensions.webcompat-reporter.newIssueEndpoint", "https://0.0.0.0/");//FF53: Spoof extensions compatibility reporter new issue URL
user_pref("extensions.webextensions.identity.redirectDomain", "0.0.0.0");//FF53: Spoof extensions compatibility reporter identity domain
user_pref("identity.fxaccounts.settings.devices.uri", "https://0.0.0.0/");//FF53: Spoof Firefox Account settings URL
user_pref("network.http.referer.userControlPolicy", 0);//FF53: Disable referer
user_pref("plugins.flashBlock.enabled", false);//FF53: Disable FlashPlayer blocklist
user_pref("privacy.trackingprotection.annotate_channels", false);//FF53: Disable passive (detection only) mode for Tracking Protection
user_pref("privacy.trackingprotection.lower_network_priority", false);//FF53: Disable lower priority of HTTP requests for resources on the Tracking Protection list
user_pref("svg.disabled", false);//FF53: Enable SVG images (default)
user_pref("urlclassifier.flashAllowExceptTable", "");//FF53: Disable registration Flash allow except table
user_pref("urlclassifier.flashAllowTable", "");//FF53: Disable registration Flash allow table
user_pref("urlclassifier.flashExceptTable", "");//FF53: Disable registration Flash except table
user_pref("urlclassifier.flashSubDocExceptTable", "");//FF53: Disable registration Flash subdocument except table
user_pref("urlclassifier.flashSubDocTable", "");//FF53: Disable registration Flash subdocument table
user_pref("urlclassifier.flashTable", "");//FF53: Disable registration Flash table

user_pref("browser.formautofill.enabled", false);//FF54: Disable Form Autofill feature
user_pref("browser.newtabpage.activity-stream.enabled", false);//FF54: Disable Activity Stream feature in NewTab page
user_pref("browser.safebrowsing.provider.google.reportMalwareMistakeURL", "https://0.0.0.0/");//FF54: Spoof Google SafeBrowsing MalwareMistake URL
user_pref("browser.safebrowsing.provider.google.reportPhishMistakeURL", "https://0.0.0.0/");//FF54: Spoof Google SafeBrowsing Phish URL
user_pref("browser.safebrowsing.provider.google4.reportMalwareMistakeURL", "https://0.0.0.0/");//FF54: Spoof Google SafeBrowsing v.4 MalwareMistake URL
user_pref("browser.safebrowsing.provider.google4.reportPhishMistakeURL", "https://0.0.0.0/");//FF54: Spoof Google SafeBrowsing v.4 Phish URL
user_pref("browser.urlbar.usepreloadedtopurls.enabled", false);//FF54: Disable preloaded top URLs on urlbar
user_pref("browser.urlbar.usepreloadedtopurls.expire_days", 1);//FF54: Expire preloaded top URLs after 1 day if enabled
user_pref("dom.vr.puppet.enabled", false);//FF54: Disable Virtual Reality puppet
user_pref("dom.vr.test.enabled", false);//FF54: Disable Virtual Reality test
user_pref("extensions.screenshots.system-disabled", true);//FF54: Disable distro screenshot addon
user_pref("geo.security.allowinsecure", false);//FF54: Disable geolocation on non-https sites
user_pref("privacy.firstparty.isolate.restrict_opener_access", true);//FF54: Enforce FPI restriction for window.opener

user_pref("app.releaseNotesURL", "https://0.0.0.0/");//FF55: Spoof release notes URL
user_pref("app.update.doorhanger", false);//FF55: Disable update doorhanger?
user_pref("browser.onboarding.enabled", false);//FF55: Disable onboarding (interactive tour/setup for new installs/profiles and features)
user_pref("browser.tabs.remote.allowLinkedWebInFileUriProcess", false);//FF55: Block web content in file processes
user_pref("dom.payments.request.enabled", false);//FF55: Disable DOM payments requests
user_pref("extensions.formautofill.addresses.enabled", false);//FF55: Disable autofill address
user_pref("extensions.formautofill.experimental", false);//FF55: Disable Form AutoFill
user_pref("extensions.formautofill.heuristics.enabled", false);//FF55: Disable Form AutoFill heuristics
user_pref("extensions.geckoProfiler.symbols.url", "https://0.0.0.0/");//FF55: Spoof profiler symbols URL
user_pref("extensions.screenshots.disabled", true);//FF55: Disable screenshot feature
user_pref("media.decoder-doctor.new-issue-endpoint", "https://0.0.0.0/");//FF55: Spoof decoder issue endpoint URL
user_pref("media.eme.chromium-api.enabled", false);//FF55: Disable Chromium API DRM
user_pref("network.auth.subresource-img-cross-origin-http-auth-allow", false);//FF55: Prevent cross-origin images from triggering an HTTP-Authentication prompt
user_pref("plugins.http_https_only", true);//FF55: Allow FlashPlayer plugin on http/https only
user_pref("security.insecure_field_warning.ignore_local_ip_address", false);//FF55: Don't ignore insecure field warning on local ip address if enabled
user_pref("toolkit.cosmeticAnimations.enabled", false);//FF55: Disable cosmetic animation on interface
user_pref("toolkit.telemetry.newProfilePing.enabled", false);//FF55: Disable new profile telemetry ping
user_pref("toolkit.telemetry.shutdownPingSender.enabled", false);//FF55: Disable shutdown ping sender
user_pref("urlclassifier.flashInfobarTable", "");//FF55: Disable registration Flash infobar tables in URLClassifier

user_pref("app.productInfo.baseURL", "https://0.0.0.0/");//FF56: Spoof product info base URL
user_pref("browser.onboarding.hidden", true);//FF56: Hide Onboarding
user_pref("browser.onboarding.newtour", "");//FF56: Reset Onboarding new tour
user_pref("browser.safebrowsing.provider.google.advisoryURL", "https://0.0.0.0/");//FF56: Spoof Google SafeBrowsing advisory URL
user_pref("browser.safebrowsing.provider.google4.advisoryURL", "https://0.0.0.0/");//FF56: Spoof Google SafeBrowsing v.4 advisory URL
user_pref("browser.urlbar.speculativeConnect.enabled", false);//FF56: Disable the preloading autocomplete URLs
user_pref("dom.forms.autocomplete.formautofill", false);//FF56: Disable autocomplete form autofill
user_pref("dom.gamepad.haptic_feedback.enabled", false);//FF56: Disable DOM GamePad feedback
user_pref("extensions.formautofill.creditCards.enabled", false);//FF56: Disable form autofill credit cards
user_pref("extensions.formautofill.firstTimeUse", false);//FF56: Form autofill already used
user_pref("intl.regional_prefs.use_os_locales", false);//FF56: Don't use OS locales
user_pref("services.sync.engine.addresses", false);//FF56: Disable sync addresses
user_pref("services.sync.engine.addresses.available", false);//FF56: Sync addresses not available
user_pref("services.sync.engine.bookmarks.validation.enabled", false);//FF56: Don't validate bookmarks for sync
user_pref("services.sync.engine.creditcards", false);//FF56: Don't sync credit cards
user_pref("services.sync.engine.creditcards.available", false);//FF56: Sync credit cards don't available
user_pref("toolkit.crashreporter.include_context_heap", false);//FF56: Don't include context heap in crash report
user_pref("toolkit.datacollection.infoURL", "https://0.0.0.0/");//FF56: Spoof datacollection info URL
user_pref("toolkit.telemetry.shutdownPingSender.enabledFirstSession", false);//FF56: Disable telemetry ping on shutdown on first session
user_pref("toolkit.telemetry.updatePing.enabled", false);//FF56: Disable telemetry pings

user_pref("browser.newtabpage.activity-stream.default.sites", "");//Nightly
user_pref("browser.newtabpage.activity-stream.feeds.localization", false);//Nightly
user_pref("browser.newtabpage.activity-stream.feeds.newtabinit", false);//Nightly
user_pref("browser.newtabpage.activity-stream.feeds.places", false);//Nightly
user_pref("browser.newtabpage.activity-stream.feeds.prefs", false);//Nightly
user_pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);//Nightly
user_pref("browser.newtabpage.activity-stream.feeds.snippets", false);//Nightly
user_pref("browser.newtabpage.activity-stream.feeds.systemtick", false);//Nightly
user_pref("browser.newtabpage.activity-stream.feeds.telemetry", false);//Nightly
user_pref("browser.newtabpage.activity-stream.feeds.topsites", false);//Nightly
user_pref("browser.newtabpage.activity-stream.showSearch", false);//Nightly
user_pref("browser.newtabpage.activity-stream.showTopSites", false);//Nightly
user_pref("browser.newtabpage.activity-stream.telemetry", false);//Nightly
user_pref("browser.newtabpage.activity-stream.telemetry.log", false);//Nightly
user_pref("browser.newtabpage.activity-stream.telemetry.ping.endpoint", "https://0.0.0.0/");//Nightly
user_pref("extensions.shield-recipe-client.run_interval_seconds", 630720000);//Nightly
user_pref("extensions.shield-recipe-client.startup_delay_seconds", 630720000);//Nightly
user_pref("extensions.shield-recipe-client.user_id", "");//Nightly
user_pref("extensions.webcompat.perform_ua_overrides", false);//Nightly

//=============== User Specific Prefs ===============
user_pref("browser.cache.memory.capacity", 262144);//Custom memory cache size in KB
//user_pref("browser.download.dir", "C:\\Downloads");//Default download directory
user_pref("browser.helperApps.neverAsk.saveToDisk", "application/x-bittorrent");//Save files without ask with that mimetypes
user_pref("dom.ipc.processCount", 3);//Number of content processes in multiprocess mode
user_pref("network.dns.blockDotOnion", false);//Enable .onion sites
user_pref("privacy.window.maxInnerHeight", 600);//Default inner height of new window
user_pref("privacy.window.maxInnerWidth", 1000);//Default inner width of new window
//user_pref("security.tls.version.min", 3);//TLS 1.2 minimum
user_pref("ui.window_class_override", "3faa1af1-ebce-38e8-e6d8-09145c5b7da5");//Override Win32 Window class with random value
