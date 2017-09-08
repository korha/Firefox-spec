"use strict";
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils", "resource://gre/modules/PlacesUtils.jsm");

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cm = Components.manager;
var localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
var procFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
var consoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
var roundTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
var proxyService = Cc["@mozilla.org/network/protocol-proxy-service;1"].getService(Components.interfaces.nsIProtocolProxyService);
var isStrictMode = false;
var cookiesPath = "";
var lastUriSpec = "", prevUriSpec = "";
var cdnPath = null;
var osDelim = '/';
var cloudFlareLink = null;
var mediaLinks = [];
var httpsForced = 0;
var proxyDirectUrl = null;
var proxyDirect = proxyService.newProxyInfo("direct", "", 0, 0, 0, null);
var proxyBlock = proxyService.newProxyInfo("socks", "0.0.0.0", 65535, 0, 0, null);
var logUri = false;

//-------------------------------------------------------------------------------------------------
var proxyFilter =
{
    applyFilter: function(proxyService, uri, proxy)
    {
        if (!uri.schemeIs("https")&&!uri.schemeIs("http")&&!uri.schemeIs("wss")&&Services.prefs.getBoolPref("extensions.useraddon.block.unwanted_requests"))
        {
            consoleService.logStringMessage("@Block URI: " + uri.spec);
            return proxyBlock;
        }
        if (logUri) consoleService.logStringMessage("@URI: " + uri.spec);
        if (proxyDirectUrl && proxyDirectUrl===uri.spec)
        {
            proxyDirectUrl=null;
            return proxyDirect;
        }
        else if(//Avoid proxy settings and use direct connection
        (uri.host.endsWith(".googlevideo.com") && uri.host!=="manifest.googlevideo.com") ||//Youtube media files
        uri.host==="fpdl.vimeocdn.com" ||//Vimeo media files
        ((uri.host.endsWith(".streamablevideo.com") || uri.host.endsWith(".streamable.com")) && uri.path.startsWith("/video/")) ||//Streamable media files
        uri.host==="api.mapbox.com" ||//OSRM-Project maps images
        uri.host.endsWith(".tile.openstreetmap.org") ||//OpenStreetMap images
        uri.host.endsWith(".tiles.virtualearth.net") ||//Bing Maps images
        uri.host==="geo0.ggpht.com" || uri.host==="geo1.ggpht.com" || uri.host==="geo2.ggpht.com" || uri.host==="geo3.ggpht.com" ||//Google Maps panorams
        uri.host==="khms0.google.com" || uri.host==="khms1.google.com" || uri.host==="khms2.google.com" || uri.host==="khms3.google.com" ||//Google Maps satellite images
        ((uri.host==="www.google.com" || uri.host==="maps.googleapis.com") && uri.path.startsWith("/maps/")))//Google Maps images
        {
            if(Services.prefs.getBoolPref("extensions.useraddon.proxyfilter.direct_enabled"))return proxyDirect;
        }
        else if(//Additional (non-tor) proxy
        uri.host==="fifa.com" || uri.host.endsWith(".fifa.com") ||
        uri.host==="forum.mozilla-russia.org" ||
        uri.host.endsWith(".jooble.org") ||
        uri.host.endsWith(".livejournal.com") ||
        uri.host==="olegon.ru" ||
        uri.host.endsWith(".olx.ua") || (uri.host.startsWith("olxua-ring") && uri.host.endsWith(".akamaized.net")) ||
        uri.host==="otzovik.com" ||
        uri.host==="uz.gov.ua" || uri.host.endsWith(".uz.gov.ua") ||
        uri.host==="www.avito.ru")
        {
            var proxyAdd=Services.prefs.getCharPref("extensions.useraddon.proxyfilter.additional").split(':');
            if(proxyAdd.length===3)return proxyService.newProxyInfo(proxyAdd[0],proxyAdd[1],proxyAdd[2],0,0,null);
        }
        return proxy;
    }
};

//-------------------------------------------------------------------------------------------------
//modifyRequest
function modifyRequest(subject)
{
var URI = subject.URI;
var isBreak = (lastUriSpec === URI.spec);
lastUriSpec = prevUriSpec;
prevUriSpec = URI.spec;
var delim = 0;
var isDocument = subject.loadFlags & subject.LOAD_DOCUMENT_URI;

//document
if (isDocument)
{
    //clean links
    //!-----
    if (URI.path.indexOf("aHR0c") > 0)
    {
        delim = 0;
        if ((delim = URI.path.indexOf("/aHR0cHM6Ly")) >= 0 || (delim = URI.path.indexOf("/aHR0cDovL")) >= 0)
            ++delim;
        //e.g.: https://sonikelf.ru/jexr/aHR0cDovL3NvbmlrZWxmLm1lL2cvNjQ2NTc0ODg3MzY0NjQ1Lz91bHA9aHR0cCUzQSUyRiUyRmV4YW1wbGUuY29tJTJGbW91c2UlMkZwcF80MzU0MzIuaHRtbA==
        //e.g.: http://rplus.ua/out/aHR0cDovL2V4YW1wbGUuY29tLw==

        else if ((delim = URI.path.indexOf("?a%3AaHR0cHM6Ly")) > 0 || (delim = URI.path.indexOf("?a%3AaHR0cDovL")) > 0)
            delim += 5;
        //e.g.: http://nemo-crack.org/engine/dude/index/leech_out.php?a%3AaHR0cDovL2V4YW1wbGUuY29tL29iNmsxbw==
        //e.g.: https://epidemz.co/go?a%3AaHR0cDovL2V4YW1wbGUuY29tL2ZoZmhmaGQ%3D

        else if ((delim = URI.path.indexOf("?a=aHR0cHM6Ly")) > 0 || (delim = URI.path.indexOf("?a=aHR0cDovL")) > 0)
            delim += 3;
        //e.g.: https://catcut.net/away4.php?a=aHR0cHM6Ly9leGFtcGxlLmNvbS8=

        else if ((delim = URI.path.indexOf(".php?link=aHR0cHM6Ly")) > 0 || (delim = URI.path.indexOf(".php?link=aHR0cDovL")) > 0)
            delim += 10;
        //e.g.: www.manhunter.ru -> http://www.region59.net/get_out.php?link=aHR0cDovL2V4YW1wbGUuY29tL29iNmsxbw==

        else if ((delim = URI.path.indexOf(".php?url=aHR0cHM6Ly")) > 0 || (delim = URI.path.indexOf(".php?url=aHR0cDovL")) > 0)
            delim += 9;
        //e.g.: http://www.mediaboom.org/engine/go.php?url=aHR0cDovL2V4YW1wbGUuY29tL29iNmsxbw%3D%3D

        if (delim > 0)
        {
            var newLink = URI.path.substr(delim);
            delim = newLink.indexOf('?', 9);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            delim = newLink.indexOf('&', 9);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            delim = newLink.indexOf('/', 9);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            subject.redirectTo(Services.io.newURI(Services.wm.getMostRecentWindow("navigator:browser").atob(decodeURIComponent(newLink)), null, null));
            return;
        }
    }
    //!-----
    if (URI.path.indexOf("=http") > 0)
    {
        delim = 0;
        if (URI.host==="an.yandex.ru" && ((delim = URI.path.indexOf("/?location=https://")) >= 0 || (delim = URI.path.indexOf("/?location=http://")) >= 0))
        {
            var newLink = URI.path.substr(delim+11);
            delim = newLink.indexOf("&jsredir=", 7);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            subject.redirectTo(Services.io.newURI(newLink, null, null));
            return;
            //e.g.: https://an.yandex.ru/mapuid/realtyramblerru/?location=https://news.rambler.ru/new1/&jsredir=1
        }
        if (URI.host==="cdn.embedly.com" && (URI.path.startsWith("/widgets/media.html?src=https%3A%2F%2F") || URI.path.startsWith("/widgets/media.html?src=http%3A%2F%2F")))
        {
            var newLink = URI.path.substr(24);
            delim = newLink.indexOf('&', 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            delim = newLink.indexOf('?', 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            newLink = decodeURIComponent(newLink);
            subject.redirectTo(Services.io.newURI("data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPkNkbi5FbWJlZGx5LmNvbTwvdGl0bGU+PC9oZWFkPjxib2R5PjxhIGhyZWY9" + Services.wm.getMostRecentWindow("navigator:browser").btoa("\"" + newLink + "\">" + newLink + "</a></body></html>"), null, null));
            return;
            //e.g.: https://cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.youtube.com%2Fembed%2F11111111111%3Ffeature%3Doembed&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D11111111111&image=https%3A%2F%2Fi.ytimg.com%2Fvi%2F11111111111%2Fhqdefault.jpg&key=11111111111111111111111111111111&type=text%2Fhtml&schema=youtube
        }
        if (URI.host==="disq.us" && (URI.path.startsWith("/url?url=https%3A%2F%2F") || URI.path.startsWith("/url?url=http%3A%2F%2F")))
        {
            var newLink = URI.path.substr(9);
            delim = newLink.indexOf('&', 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            delim = newLink.indexOf('?', 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            delim = newLink.indexOf("%3A", 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            subject.redirectTo(Services.io.newURI(decodeURIComponent(newLink), null, null));
            return;
            //e.g.: http://disq.us/url?url=http%3A%2F%2Fexample.com%3ADVSAbysaim9ScNoMQ_w9AeMXL0Y&cuid=1111111
        }
        if (URI.host==="forum.antichat.ru" && (URI.path.startsWith("/proxy.php?image=https%3A%2F%2F") || URI.path.startsWith("/proxy.php?image=http%3A%2F%2F")))
        {
            var newLink = URI.path.substr(17);
            delim = newLink.indexOf('&', 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            delim = newLink.indexOf('?', 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            subject.redirectTo(Services.io.newURI(decodeURIComponent(newLink), null, null));
            return;
            //e.g.: https://forum.antichat.ru/proxy.php?image=https%3A%2F%2Fexample.com%2Fposts%2F27980x.png&hash=3546564535f6225avcd
        }
        if (URI.host==="ouo.io" && URI.path.startsWith("/s/") && ((delim = URI.path.indexOf("?s=https://")) > 0 || (delim = URI.path.indexOf("?s=http://")) > 0))
        {
            subject.redirectTo(Services.io.newURI(URI.path.substr(delim+3), null, null));
            return;
            //e.g.: http://ouo.io/s/FPzwRnxl?s=http://example.com/Gcymgn
        }
        if (URI.path.startsWith("/gourl.php?") || URI.path.startsWith("/url.php?"))
            if ((delim = URI.path.indexOf("&i=https://")) > 0 || (delim = URI.path.indexOf("&i=http://")) > 0 ||
                (delim = URI.path.indexOf("?i=https://")) > 0 || (delim = URI.path.indexOf("?i=http://")) > 0)
        {
            subject.redirectTo(Services.io.newURI(URI.path.substr(delim+3), null, null));
            return;
            //e.g.: https://livetv.sx/gourl.php?lng=en&i=https://example.com/path/
            //e.g.: https://livetv.sx/url.php?i=https://example.com/
        }
        if (URI.host==="portableapps.com" && URI.path.startsWith("/redirect/"))
            if ((delim = URI.path.indexOf("&t=https%3A%2F%2F")) > 0 || (delim = URI.path.indexOf("&t=http%3A%2F%2F")) > 0 ||
                (delim = URI.path.indexOf("?t=https%3A%2F%2F")) > 0 || (delim = URI.path.indexOf("?t=http%3A%2F%2F")) > 0)
            {
                var newLink = URI.path.substr(delim+3);
                delim = newLink.indexOf('&', 13);
                if (delim > 0)
                    newLink = newLink.substr(0, delim);
                delim = newLink.indexOf('?', 13);
                if (delim > 0)
                    newLink = newLink.substr(0, delim);
                subject.redirectTo(Services.io.newURI(decodeURIComponent(newLink), null, null));
                return;
                //e.g.: http://portableapps.com/redirect/?a=Name&t=http%3A%2F%2Fexample.org
            }
        //-----
        if ((delim = URI.path.indexOf("&link=https://")) > 0 || (delim = URI.path.indexOf("&link=http://")) > 0)
        {
            var newLink = URI.path.substr(delim+6);
            subject.redirectTo(Services.io.newURI(decodeURIComponent(newLink), null, null));
            return;
            //e.g.: http://api.unian.net/zn/redirect.php?in&id=12345&link=https://economics.unian.net/123
        }
        if ((delim = URI.path.indexOf("/?ulp=https://")) >= 0 || (delim = URI.path.indexOf("/?ulp=http://")) >= 0)
        {
            var newLink = URI.path.substr(delim+6);
            delim = newLink.indexOf("?subid=", 7);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            delim = newLink.indexOf("&subid=", 7);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            subject.redirectTo(Services.io.newURI(newLink, null, null));
            return;
            //e.g.: https://ad.admitad.com/g/2316b654/?ulp=http://example.com/smart.html&subid=manual
        }
        if (URI.path.startsWith("/url?q=https://") || URI.path.startsWith("/url?q=http://"))
        {
            var newLink = URI.path.substr(7);
            delim = newLink.indexOf('&', 7);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            subject.redirectTo(Services.io.newURI(decodeURIComponent(newLink), null, null));
            return;
            //e.g.: play.google.com -> https://www.google.com/url?q=https://example.com/googleplay/?p%3Dways&sa=D&usg=465ABDG364
        }
        if ((delim = URI.path.indexOf("%3Fgoto_url%3Dhttps%253A%252F%252F")) > 0 || (delim = URI.path.indexOf("%26goto_url%3Dhttps%253A%252F%252F")) > 0 ||
            (delim = URI.path.indexOf("%3Fgoto_url%3Dhttp%253A%252F%252F")) > 0 || (delim = URI.path.indexOf("%26goto_url%3Dhttp%253A%252F%252F")) > 0)
        {
            var newLink = URI.path.substr(delim+14);
            delim = newLink.indexOf('?', 19);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            delim = newLink.indexOf('&', 19);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            newLink = decodeURIComponent(newLink);
            delim = newLink.indexOf('?', 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            delim = newLink.indexOf('&', 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            subject.redirectTo(Services.io.newURI(decodeURIComponent(newLink), null, null));
            return;
            //e.g.: http://s.bigmir.net/bm_clicks/?&zone=content.col3.sport&project=www&project_copy=www_split&url=http%3A%2F%2Fs.bigmir.net%2Fhp%2F%3Fclicks%3D1%26%26track_zone%3D%26id%3D8919%26goto_url%3Dhttp%253A%252F%252Fsport.bigmir.net%252Ftenis
        }
        //-----
        if ((delim = URI.path.indexOf("/away?to=https%3A%2F%2F")) >= 0 || (delim = URI.path.indexOf("/away?to=http%3A%2F%2F")) >= 0)
            delim += 9;
        //e.g.: http://fotostrana.ru/away?to=https%3A%2F%2Fexample.com%2FcMx8

        else if (URI.path.startsWith("/?go=https%3A%2F%2F") || URI.path.startsWith("/?go=http%3A%2F%2F"))
            delim = 5;
        //e.g.: http://www.ukr.net/?go=http%3A%2F%2Fexample.com%2F%3Futm_source%3Dukrnet

        else if (URI.path.startsWith("/go?") && ((delim = URI.path.indexOf("&to=https%3A%2F%2F")) > 0 || (delim = URI.path.indexOf("&to=http%3A%2F%2F")) > 0))
            delim += 4;
        //e.g.: https://novostroyki.lun.ua/go?category=click_building&action=building_page_site&label=premium&building_id=3035&to=http%3A%2F%2Fexample.com%2F

        else if ((delim = URI.path.indexOf("/go/?u=https%3A%2F%2F")) >= 0 || (delim = URI.path.indexOf("/go/?u=http%3A%2F%2F")) >= 0)
            delim += 7;
        //e,g,: https://4pda.ru/pages/go/?u=https%3A%2F%2Fexample.com%2F%3Fdevice%3Dgtrfv&e=42801985&f=http%3A%2F%2F4pda.ru%2Fforum%2Findex.php%3Fshowtopic

        else if ((delim = URI.path.indexOf("?goto=https%3A%2F%2F")) > 0 || (delim = URI.path.indexOf("&goto=https%3A%2F%2F")) > 0 ||
            (delim = URI.path.indexOf("?goto=http%3A%2F%2F")) > 0 || (delim = URI.path.indexOf("&goto=http%3A%2F%2F")) > 0)
            delim += 6;
        //e.g.: http://www.likeni.ru/bitrix/rk.php?id=287&event1=banner&event2=click&event3=1+%2F+%5B287%5D+%5Bright_2%5D+%D1%86%D0%B8%&goto=https%3A%2F%2Fexample.com%2F

        else if ((delim = URI.path.indexOf("?goto_url=https%3A%2F%2F")) > 0 || (delim = URI.path.indexOf("&goto_url=https%3A%2F%2F")) > 0 ||
            (delim = URI.path.indexOf("?goto_url=http%3A%2F%2F")) > 0 || (delim = URI.path.indexOf("&goto_url=http%3A%2F%2F")) > 0)
            delim += 10;
        //e.g.: http://s.bigmir.net/hp/?clicks=1&&track_zone=&id=111111&goto_url=http%3A%2F%2Fsport.bigmir.net%2Ftenis%2Fpath

        else if ((delim = URI.path.indexOf("/out?url=https%3A%2F%2F")) >= 0 || (delim = URI.path.indexOf("/out?url=http%3A%2F%2F")) >= 0)
            delim += 9;
        //e.g.: https://thequestion.ru/out?url=https%3A%2F%2Fexample.com%2F

        else if ((delim = URI.path.indexOf(".php?link=https%3A%2F%2F")) > 0 || (delim = URI.path.indexOf(".php?link=http%3A%2F%2F")) > 0)
            delim += 10;
        //e.g.: https://forum.antichat.ru/proxy.php?link=http%3A%2F%2Fexample.com%2Frhrvtdg&amp;hash=02446827bdefca24

        else if ((delim = URI.path.indexOf(".php?s=https%3A%2F%2F")) > 0 || (delim = URI.path.indexOf(".php?u=https%3A%2F%2F")) > 0 ||
                 (delim = URI.path.indexOf(".php?s=http%3A%2F%2F")) > 0 || (delim = URI.path.indexOf(".php?u=http%3A%2F%2F")) > 0)
            delim += 7;
            //e.g.: http://forum.rsload.net/away.php?s=http%3A%2F%2Fexample.com%2Fdduo5
            //e.g.: https://l.facebook.com/l.php?u=http%3A%2F%2Fexample.com%2F

        else if ((delim = URI.path.indexOf(".php?to=https%3A%2F%2F")) > 0 || (delim = URI.path.indexOf(".php?to=http%3A%2F%2F")) > 0)
            delim += 8;
        //e.g.: https://vk.com/away.php?to=https%3A%2F%2Fexample.com%2Fwatch

        else if (URI.path.startsWith("/redir/?u=https%3A%2F%2F") || URI.path.startsWith("/redir/?u=http%3A%2F%2F"))
            delim = 10;
        //e.g.: https://duck.co/redir/?u=https%3A%2F%2Fforum.duckduckhack.com%2F

        else if ((delim = URI.path.indexOf("/redirect?z=https%3A%2F%2F")) >= 0 || (delim = URI.path.indexOf("/redirect?q=https%3A%2F%2F")) >= 0 ||
            (delim = URI.path.indexOf("/redirect?z=http%3A%2F%2F")) >= 0 || (delim = URI.path.indexOf("/redirect?q=http%3A%2F%2F")) >= 0)
            delim += 12;
        //e.g.: http://t.umblr.com/redirect?z=http%3A%2F%2Fexample.com%2Fapp%2Fwww.com%3Fexturl
        //e.g.: https://www.youtube.com/redirect?q=http%3A%2F%2Fexample.com%2FLaunching

        else if ((delim = URI.path.indexOf("/redirect?url=https%3A%2F%2F")) >= 0 || (delim = URI.path.indexOf("/redirect?url=http%3A%2F%2F")) >= 0)
            delim += 14;
        //e.g.: https://tjournal.ru/redirect?url=http%3A%2F%2Fexample.com%2F2020

        else if ((delim = URI.path.indexOf("/?ulp=https%3A%2F%2F")) >= 0 || (delim = URI.path.indexOf("/?ulp=http%3A%2F%2F")) >= 0)
            delim += 6;
        //e.g.: http://sonikelf.me/g/646574887364645/?ulp=http%3A%2F%2Fexample.com%2Fmouse%2Fpp_435432.html

        else if ((delim = URI.path.indexOf("?url=https%3A%2F%2F")) > 0 || (delim = URI.path.indexOf("&url=https%3A%2F%2F")) > 0 ||
                 (delim = URI.path.indexOf("?url=http%3A%2F%2F")) > 0 || (delim = URI.path.indexOf("&url=http%3A%2F%2F")) > 0)
           delim += 5;
        //e.g.: https://out.reddit.com/m2_4sd3wm?url=https%3A%2F%2Fexample.com%2F2000%2F&token=fbymfeyfmm3336Ne&app_name=reddit.com
        //e.g.: https://www.google.com/url?sa=t&mct=k&q=&esrc=s&source=web&cd=11&ved=0htdbAgdhr6ghKDhf64hfgrfgjgfhTfhvfyf6e&url=https%3A%2F%2Fexample.com%2FLogin

        else if ((delim = URI.path.indexOf("/?url=https%3A%2F%2F")) >= 0 || (delim = URI.path.indexOf("/?url=http%3A%2F%2F")) >= 0)
            delim += 6;
        //e.g.: https://airvpn.org/external_link/?url=http%3A%2F%2Fexample.com%2F%7Eijuyh%2F
        //e.g.: https://dom.ria.com/secure_redirect/?url=http%3A%2F%2Fopenx-dom.ria.com%2Fwww%2Fdelivery%2Fck.php%3Foaparams%3D2__bannerid%3D67543__zoneid%3D05__oadest%3Dhttp%3A%2F%2Fexample.com%2F

        if (delim > 0)
        {
            var newLink = URI.path.substr(delim);
            delim = newLink.indexOf('?', 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            delim = newLink.indexOf('&', 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            subject.redirectTo(Services.io.newURI(decodeURIComponent(newLink), null, null));
            return;
        }
        //---
        if ((delim = URI.path.indexOf("/ext_link?url=https://")) >= 0 || (delim = URI.path.indexOf("/ext_link?url=http://")) >= 0)
        {
            subject.redirectTo(Services.io.newURI(URI.path.substr(delim+14), null, null));
            return;
            //e.g.: https://www.uapoker.info/ext_link?url=http://example.com/
        }
        if ((delim = URI.path.indexOf("_oadest=https://")) > 0 || (delim = URI.path.indexOf("_oadest=http://")) > 0)
        {
            subject.redirectTo(Services.io.newURI(URI.path.substr(delim+8), null, null));
            return;
            //e.g.: https://openx-dom.ria.com/www/delivery/ck.php?oaparams=2__bannerid=543__zoneid=52__oadest=http://example.com/v654
        }
        if ((delim = URI.path.indexOf(".php?go=https://")) > 0 || (delim = URI.path.indexOf(".php?go=http://")) > 0)
        {
            subject.redirectTo(Services.io.newURI(URI.path.substr(delim+8), null, null));
            return;
            //e.g.: https://www.israbox.pw/get/index.php?go=http://example.com/x.html
        }
        if ((delim = URI.path.indexOf(".php?url=https://")) > 0 || (delim = URI.path.indexOf(".php?url=http://")) > 0)
        {
            subject.redirectTo(Services.io.newURI(URI.path.substr(delim+9), null, null));
            return;
            //e.g.: http://www.oszone.net/go.php?url=http://example.com/
        }
        if ((delim = URI.path.indexOf("/?url=https://")) >= 0 || (delim = URI.path.indexOf("/?url=http://")) >= 0)
        {
            subject.redirectTo(Services.io.newURI(URI.path.substr(delim+6), null, null));
            return;
            //e.g.: https://steamcommunity.com/linkfilter/?url=http://example.com/page.php?id=2465746
        }
    }
    //!-----
    if (URI.path.startsWith("/go"))
    {
        delim = 0;
        if (URI.path.startsWith("/go/") && (URI.host==="hidemy.name" || URI.host==="sovsport.ru" || URI.host==="www.ua-football.com"))
        {
            var newLink = URI.path.substr(4);
            if (!newLink.startsWith("http"))
                newLink = "http://" + newLink;
            subject.redirectTo(Services.io.newURI(newLink, null, null));
            return;
            //e.g.: https://hidemy.name/go/example.com/
            //e.g.: http://sovsport.ru/go/http://example.com/
            //e.g.: http://www.ua-football.com/go/example.com/lfp/s019.jpg
        }
        //-----
        if (URI.path.startsWith("/go/https://") || URI.path.startsWith("/go/http://"))
            delim = 4;
        //e.g.: https://kp.md/go/https://0.0.0.0/link

        if (URI.path.startsWith("/go/?https://") || URI.path.startsWith("/go/?http://"))
            delim = 5;
        //e.g.: http://alterportal.ru/go/?http://example.com/user/

        if (URI.path.startsWith("/go.html?https://") || URI.path.startsWith("/go.html?http://"))
            delim = 9;
        //e.g.: http://riperam.org/go.html?http://example.com/intl/

        else if (URI.path.startsWith("/golink/https://") || URI.path.startsWith("/golink/http://"))
            delim = 8;
        //e.g.: https://www.meteoprog.ua/golink/http://example.com/order/

        else if (URI.path.startsWith("/golink/?https://") || URI.path.startsWith("/golink/?http://"))
            delim = 9;
        //e.g.: https://dom.ria.com/golink/?http://example.com

        else if (URI.path.startsWith("/go-to/https://") || URI.path.startsWith("/go-to/http://"))
            delim = 7;
        //e.g.: http://www.spy-soft.net/go-to/https://example.com/store/apps/details

        else if (URI.path.startsWith("/goto/https://") || URI.path.startsWith("/goto/http://"))
            delim = 6;
        //e.g.: http://molet.ru/goto/https://example.com/?from=748739

        else if (URI.path.startsWith("/goto/?/https://") || URI.path.startsWith("/goto/?/http://"))
            delim = 8;
        //e.g.: https://stackoff.ru/goto/?/http://example.com/

        if (delim > 0)
        {
            subject.redirectTo(Services.io.newURI(URI.path.substr(delim), null, null));
            return;
        }
    }
    //!-----
    if (URI.path.startsWith("/?http") && (URI.path.startsWith("/?https://") || URI.path.startsWith("/?http://")))
    {
        subject.redirectTo(Services.io.newURI(URI.path.substr(2), null, null));
        return;
        //e.g.: https://anonym.to/?http://example.com/
    }
    //!-----
    if ((delim = URI.path.indexOf("/https%3A//")) > 0 || (delim = URI.path.indexOf("/http%3A//")) > 0)
    {
        var newLink = URI.path.substr(delim+1);
        delim = newLink.indexOf('?', 10);
        if (delim > 0)
            newLink = newLink.substr(0, delim);
        subject.redirectTo(Services.io.newURI(decodeURIComponent(newLink), null, null));
        return;
        //e.g.: addons.mozilla.org -> https://outgoing.prod.mozaws.net/v1/73af80ed367c67a502140fab5b7712587b886557c6f57333fcfb63368545c7957/http%3A//example.com
    }
    //!-----
    if (URI.path.indexOf(".php?http") > 0 && ((delim = URI.path.indexOf(".php?https://")) > 0 || (delim = URI.path.indexOf(".php?http://")) > 0))
    {
        subject.redirectTo(Services.io.newURI(URI.path.substr(delim+5), null, null));
        return;
        //e.g.: http://forum.funkysouls.com/go.php?http://example.com/v/4654
    }
    //!-----
    if (URI.path.startsWith("/redirect"))
    {
        if (URI.path.startsWith("/redirect/https%3A%2F%2F") || URI.path.startsWith("/redirect/http%3A%2F%2F"))
        {
            var newLink = URI.path.substr(10);
            delim = newLink.indexOf('&', 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            delim = newLink.indexOf('?', 13);
            if (delim > 0)
                newLink = newLink.substr(0, delim);
            subject.redirectTo(Services.io.newURI(decodeURIComponent(newLink), null, null));
            return;
            //e.g.: https://thehost.ua/redirect/http%3A%2F%2Fexample.com
        }
        if (URI.path.startsWith("/redirector.html#https://") || URI.path.startsWith("/redirector.html#http://"))
        {
            subject.redirectTo(Services.io.newURI(URI.path.substr(17), null, null));
            return;
            //e.g.: https://hpc.name/redirector.html#http://example.com/mail.php
        }
    }
    //truncate links
    if(
    (delim=URI.path.indexOf("?action_"))>0||(delim=URI.path.indexOf("&action_"))>0||
    (delim=URI.path.indexOf("?admitad_uid="))>0||(delim=URI.path.indexOf("&admitad_uid="))>0||
    (delim=URI.path.indexOf("?campaign="))>0||(delim=URI.path.indexOf("&campaign="))>0||
    (delim=URI.path.indexOf("?fb_"))>0||(delim=URI.path.indexOf("&fb_"))>0||
    (delim=URI.path.indexOf("?from="))>0||((delim=URI.path.indexOf("&from="))>0&&URI.host!=="kb.mozillazine.org")||
    (delim=URI.path.indexOf("?ga_"))>0||(delim=URI.path.indexOf("&ga_"))>0||
    (delim=URI.path.indexOf("?_openstat="))>0||(delim=URI.path.indexOf("&_openstat="))>0||
    (delim=URI.path.indexOf("?ref="))>0||(delim=URI.path.indexOf("&ref="))>0||(delim=URI.path.indexOf("/ref="))>0||
    (delim=URI.path.indexOf("?ref_src="))>0||(delim=URI.path.indexOf("&ref_src="))>0||
    (delim=URI.path.indexOf("?referer="))>0||(delim=URI.path.indexOf("&referer="))>0||
    (delim=URI.path.indexOf("?referrer="))>0||(delim=URI.path.indexOf("&referrer="))>0||
    (delim=URI.path.indexOf("?source="))>0||(delim=URI.path.indexOf("&source="))>0||
    (delim=URI.path.indexOf("?utm_"))>0||(delim=URI.path.indexOf("&utm_"))>0||(delim=URI.path.indexOf("&amp;utm_"))>0||
    (delim=URI.path.indexOf("?yclid="))>0||(delim=URI.path.indexOf("&yclid="))>0)
    {
        var NewURI=URI.clone();
        NewURI.path=NewURI.path.substr(0,delim);
        subject.redirectTo(NewURI);
        return;
    }
}//(document)

//redirect to local cdn
function cdnLoad(url)
{
    if (osDelim === '\\') url = url.split('/').join('\\');
    url = cdnPath + url;
    localFile.initWithPath(url);
    if (localFile.exists())
    {
        var istream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        istream.init(localFile, 1, 292, 0);
        var bstream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
        bstream.setInputStream(istream);
        var data = bstream.readBytes(bstream.available());
        istream.close();
        return data;
    }
    consoleService.logStringMessage("@CDN fail: " + url);
    return null;
}

//add custom cookies
function cookieSet(subject, cookieFile)
{
    localFile.initWithPath(cookiesPath + cookieFile);
    if (localFile.exists())
    {
        var istream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        istream.init(localFile, 1, 292, 0);
        var bstream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
        bstream.setInputStream(istream);
        var stringlist = bstream.readBytes(bstream.available()).split('\n');
        istream.close();
        if (stringlist[0])
        {
            var cookieStr = stringlist[stringlist[0]];
            if (cookieStr.length)
            {
                try
                {
                    var cookies = subject.getRequestHeader("Cookie").split("; ");
                    var map = new Map();
                    for (var cookie of cookies)
                    {
                        var tmp = cookie.split('=');
                        if (tmp.length === 2)
                            map.set(tmp[0], tmp[1]);
                    }

                    var cookies = cookieStr.split("; ");
                    for (var cookie of cookies)
                    {
                        var tmp = cookie.split('=');
                        if (tmp.length === 2)
                            map.set(tmp[0], tmp[1]);
                    }

                    cookieStr = "";
                    for (var [key, value] of map.entries())
                        cookieStr += key + "=" + value + "; ";
                    cookieStr = cookieStr.substr(0, cookieStr.length-2);

                } catch(e){}
                subject.setRequestHeader("Cookie", cookieStr, false);
            }
        }
    }
}

//redirect to tor
function isTorRedirect(){return !Services.prefs.getBoolPref("network.dns.blockDotOnion");}

//protocols
var Dom=URI.host.split('.');
if(Dom.length<2){subject.cancel(Components.results.NS_BINDING_ABORTED);return;}

Dom.reverse();

//block nonstandard ports
if(URI.port!==-1&&Services.prefs.getBoolPref("extensions.useraddon.block.nonstandard_ports")){if(!(
(Dom[0]==="onion"&&URI.port>1024&&URI.port<49152)
)){subject.cancel(Components.results.NS_BINDING_ABORTED);consoleService.logStringMessage("@Block port: "+URI.spec);return;}}

//ip-address
if(Dom[0]>=0)
{
if(Dom.length===4&&Dom[3]>=1&&Dom[3]<=223&&Dom[2]>=0&&Dom[2]<=255&&Dom[1]>=0&&Dom[1]<=255&&Dom[0]<=255)
{
    if((
    Dom[3]==10||
   (Dom[3]==100&&(Dom[2]>=64&&Dom[2]<=127))||
    Dom[3]==127||
   (Dom[3]==169&&Dom[2]==254)||
   (Dom[3]==172&&(Dom[2]>=16&&Dom[2]<=31))||
   (Dom[3]==192&&(
        (Dom[2]==0&&(Dom[1]==0||Dom[1]==2))||
        (Dom[2]==88&&Dom[1]==99)||
         Dom[2]==168))||
   (Dom[3]==198&&(
        (Dom[2]>=18&&Dom[2]<=19)||
        (Dom[2]==51&&Dom[1]==100)))||
   (Dom[3]==203&&Dom[2]==0&&Dom[1]==113)
    )&&Services.prefs.getBoolPref("extensions.useraddon.block.private_network"))
    {subject.cancel(Components.results.NS_BINDING_ABORTED);consoleService.logStringMessage("@Block private network: " + URI.host);return;}
}
else
{subject.cancel(Components.results.NS_BINDING_ABORTED);consoleService.logStringMessage("@Block broken address: " + URI.host);return;}
}//(ip-address)

Dom.push("");
Dom.push("");

//http requests
if (URI.schemeIs("http"))
{
    var bCatch=false;
    switch(Dom[0])
    {
//==========
case "17":/*!!!*/
if(URI.prePath==="http://95.141.193.17")subject.setRequestHeader("Authorization","Basic cnNsb2FkLm5ldDpyc2xvYWQubmV0",false);break;//#auth: rsload.net

case "ac":/*!!!*/
switch(Dom[1])
{
case "google":
case "sci-hub":
bCatch=true;break;
}break;

case "academy":/*!!!*/
if(Dom[1]==="whitehatters")bCatch=true;break;

case "accountant":/*!!!*/
if(Dom[1]==="tpb")bCatch=true;break;

case "actor":/*!!!*/
if(Dom[1]==="state")bCatch=true;break;

case "ad":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "ae":/*!!!*/
switch(Dom[1])
{
case "2gis":
case "blogspot":
case "google":
case "youtube":
bCatch=true;break;
case "co":if(Dom[2]==="youtube")bCatch=true;break;
}break;

case "aero":/*!!!*/
if(Dom[1]==="pobeda")bCatch=true;break;

case "af":/*!!!*/
switch(Dom[1])
{
case "google":
case "kabuljan":
case "upload":
bCatch=true;break;
case "com":if(Dom[2]==="google")bCatch=true;break;
}break;

case "ag":/*!!!*/
switch(Dom[1])
{
case "google":
case "nzb":
bCatch=true;break;
case "com":if(Dom[2]==="google")bCatch=true;break;
}break;

case "agency":/*!!!*/
switch(Dom[1])
{
case "112":
case "deco":
bCatch=true;break;
}break;

case "ai":/*!!!*/
switch(Dom[1])
{
case "api":
case "inf":
case "lyrebird":
case "movix":
case "mycroft":
case "smartcat":
case "textio":
case "troops":
case "zo":
bCatch=true;break;
case "com":if(Dom[2]==="google")bCatch=true;break;
case "off":if(Dom[2]==="google")bCatch=true;break;
}break;

case "al":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "file":
case "youtube":
bCatch=true;break;
}break;

case "am":/*!!!*/
switch(Dom[1])
{
case "armeniasputnik":
case "azatutyun":
case "blogspot":
case "city01":
case "google":
case "infogr":
case "short":
case "shz":
case "tru":
case "youtube":
bCatch=true;break;
}break;

case "ao":/*!!!*/
switch(Dom[1])
{
case "co":if(Dom[2]==="google")bCatch=true;break;
case "it":if(Dom[2]==="google")bCatch=true;break;
}break;

case "ar":/*!!!*/
if(Dom[1]==="com"&&(Dom[2]==="blogspot"||Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "as":/*!!!*/
switch(Dom[1])
{
case "google":
case "opr":
case "tig":
bCatch=true;break;
}break;

case "asia":/*!!!*/
if(Dom[1]==="championat")bCatch=true;break;

case "at":/*!!!*/
switch(Dom[1])
{
case "32bitflo":
case "bitfire":
case "drkhsh":
case "emsisoft":
case "google":
case "haschek":
case "jabber":
case "mimikama":
case "newsletter2go":
case "rueckgr":
case "soeren-hentzschel":
case "tugraz":
case "xn--rckgr-kva"://#idn: rueckgr.at (latin+diactric)
case "youtube":
bCatch=true;break;
case "co":if(Dom[2]==="blogspot"||Dom[2]==="youtube")bCatch=true;break;
case "haschek":if(Dom[2]==="blog"||Dom[2]==="proxycheck")bCatch=true;break;
case "or":if(Dom[2]==="transist")bCatch=true;break;
case "st8":if(Dom[2]==="search")bCatch=true;break;
}break;

case "au":/*!!!*/
switch(Dom[1])
{
case "csiro":
bCatch=true;break;
case "com":
    switch(Dom[2])
    {
    case "2ton":
    case "blogspot":
    case "clickstudios":
    case "cso":
    case "emsisoft":
    case "glob":
    case "google":
    case "gpsoft":
    case "searx":
    case "surfthedream":
    case "youtube":
    bCatch=true;break;
    case "ebay":if(Dom[3]==="img")bCatch=true;break;
    }break;
case "net":if(Dom[2]==="iinet")bCatch=true;break;
case "org":if(Dom[2]==="cryptoaustralia"||Dom[2]==="linux"||Dom[2]==="openaustraliafoundation")bCatch=true;break;
}break;

case "ax":/*!!!*/
if(Dom[1]==="snorl")bCatch=true;break;

case "az":/*!!!*/
switch(Dom[1])
{
case "flatfy":
case "gabalafc":
case "google":
case "sputnik":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="youtube")bCatch=true;break;
}break;

case "ba":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "youtube":
bCatch=true;break;
}break;

case "bd":/*!!!*/
if(Dom[1]==="com"&&(Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "be":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "graspop":
case "mathiasbynens":
case "mths":
case "securelink":
case "youtu":
case "youtube":
case "zloy":
bCatch=true;break;
}break;

case "bf":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "bg":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "eway":
case "google":
case "softkey":
case "superhosting":
case "youtube":
bCatch=true;break;
}break;

case "bh":/*!!!*/
switch(Dom[1])
{
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "bi":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "bid":/*!!!*/
switch(Dom[1])
{
case "htl":
case "kickassproxy":
bCatch=true;break;
}break;

case "biz":/*!!!*/
switch(Dom[1])
{
case "antiddos":
case "bloginfo":
case "btcu":
case "bytesund":
case "cfud":
case "cin1team":
case "cyberciti":
case "d0wn":
case "elanex":
case "freeaccount":
case "getmetal":
case "hiox":
case "ibm":
case "legalrc":
case "neustar":
case "novostimira":
case "ntinfo":
case "pay4bit":
case "pornolab":
case "rubro":
case "rusadmin":
case "skladchina":
case "srsfckn":
case "suip":
case "tvgid":
case "vcdn":
case "vk-music":
case "webware":
case "zenguard":
case "zismo":
bCatch=true;break;
case "multi-vpn":if(Dom[2]===""||Dom[2]==="cabinet")bCatch=true;break;
}break;

case "bj":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "blog":/*!!!*/
switch(Dom[1])
{
case "ctrl":
case "stackoverflow":
case "watirmelon":
bCatch=true;break;
}break;

case "bn":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "bo":/*!!!*/
switch(Dom[1])
{
case "google":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "br":/*!!!*/
if(Dom[1]==="com")
    switch(Dom[2])
    {
    case "blogspot":
    case "emsisoft":
    case "google":
    case "newsletter2go":
    case "youtube":
    bCatch=true;break;
    }break;

case "bs":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "bt":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "business":/*!!!*/
if(Dom[1]==="evo")bCatch=true;break;

case "buzz":/*!!!*/
if(Dom[1]==="joker")bCatch=true;break;

case "bw":/*!!!*/
if(Dom[1]==="co"&&Dom[2]==="google")bCatch=true;break;

case "by":/*!!!*/
switch(Dom[1])
{
case "015":
case "023":
case "2doc":
case "ais":
case "allsoft":
case "biletix":
case "call-tracking":
case "coo":
case "dev":
case "flatfy":
case "footboom":
case "gismeteo":
case "gomselmash":
case "google":
case "gorod212":
case "gorod214":
case "gorod216":
case "hoster":
case "interfax":
case "lan1":
case "momondo":
case "petitions":
case "philips":
case "realt":
case "resta":
case "roomer":
case "rw":
case "satavto":
case "softkey":
case "sputnik":
case "star-media":
case "tam":
case "tuda-suda"://#tls1.0
case "tyt":
case "yandex":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="blogspot"||Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
case "tut":
{
    if(isDocument&&URI.path.startsWith("/#ua:"))
    {
        var NewURI=URI.clone();
        NewURI.path="/";
        subject.redirectTo(NewURI);
    }
    else
    switch(Dom[2])
    {
    case "api":
    case "bugaga":
    case "c1hit":
    case "c2hit":
    case "finance":
    case "news":
    case "preved":
    case "profile":
    case "r":
    case "realty":
    case "reklama-cluster":
    case "s1r":
    case "s2r":
    case "s3r":
    case "www":
    bCatch=true;break;
    case "afisha":if(Dom[3]==="img")bCatch=true;break;
    }
}break;
}break;

case "bz":/*!!!*/
switch(Dom[1])
{
case "epn":
case "molodost":
case "sci-hub":
case "zloy":
bCatch=true;break;
case "com":if(Dom[2]==="google")bCatch=true;break;
}break;

case "ca":/*!!!*/
switch(Dom[1])
{
case "1pw":
case "antiprism":
case "blogspot":
case "ccts-cprst"://#tls1.0
case "comparator":
case "cypherpunks":
case "defuse":
case "google":
case "hackfest":
case "hypatia":
case "identi":
case "jmvalin":
case "jvns":
case "macdevops":
case "newsletter2go":
case "pickysysadmin":
case "pirat":
case "psiphon":
case "radio-canada":
case "rainbowrailroad":
case "sauvez":
case "sickrage":
case "theglobeandmail":
case "ubc":
case "usherbrooke":
case "uwaterloo":
case "youtube":
case "zoomedia":
bCatch=true;break;
case "queensu":if(Dom[2]==="phy"&&(Dom[3]==="owl"||Dom[3]==="sno")&&URI.path.startsWith("/~phil/exiftool/"))bCatch=true;break;
}break;

case "cab":/*!!!*/
if(Dom[1]==="onion")bCatch=true;break;

case "cafe":/*!!!*/
if(Dom[1]==="hosting")bCatch=true;break;

case "cam":/*!!!*/
if(Dom[1]==="halide")bCatch=true;break;

case "cash":/*!!!*/
switch(Dom[1])
{
case "forum":
case "z":
bCatch=true;break;
}break;

case "cat":/*!!!*/
switch(Dom[1])
{
case "crypto":
case "google":
case "youtube":
bCatch=true;break;
}break;

case "cc":/*!!!*/
switch(Dom[1])
{
case "apparat":
case "arduino":
case "cryptography":
case "e-money":
case "extratorrent":
case "factor":
case "google":
case "laverna":
case "mako":
case "notepad":
case "nulled":
case "perma":
case "pgpmail":
case "pirateproxy":
case "pornolab":
case "raymond":
case "ripper":
case "sci-hub":
case "tilda":
case "tiny":
case "uxdesign":
case "vk":
bCatch=true;break;
case "shadowlife":if(isTorRedirect())
{
    var NewURI=URI.clone();
    NewURI.host="shadow7jnzxjkvpz.onion";
    subject.redirectTo(NewURI);
}break;
}break;

case "cd":/*!!!*/
switch(Dom[1])
{
case "google":
case "sanet":
bCatch=true;break;
}break;

case "center":/*!!!*/
switch(Dom[1])
{
case "digitalrights":
case "myrotvorets":
bCatch=true;break;
}break;

case "cf":/*!!!*/
switch(Dom[1])
{
case "backruffjpjn":
case "fuckcf":
case "google":
case "on1on":
case "pagallsca":
bCatch=true;break;
}break;

case "cg":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "ch":/*!!!*/
switch(Dom[1])
{
case "abuse":
case "bitmessage":
case "blogspot":
case "cern":
case "computec":
case "cryptowat":
case "cyon":
case "dasmagazin":
case "dfi":
case "digitalsafe":
case "emsisoft":
case "google":
case "gurochan":
case "hostpoint":
case "letemps":
case "lolicore":
case "mastercard":
case "newsletter2go":
case "novatrend":
case "nymity":
case "privacyfoundation":
case "protonmail":
case "punkt":
case "sandervenema":
case "searx":
case "swissnode":
case "threema":
case "torpat":
case "unicodata":
case "youtube":
case "zeniko":
bCatch=true;break;
}break;

case "chat":/*!!!*/
switch(Dom[1])
{
case "tox":
case "zeit":
}break;

case "ci":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "ck":/*!!!*/
if(Dom[1]==="co"&&Dom[2]==="google")bCatch=true;break;

case "cl":/*!!!*/
switch(Dom[1])
{
case "2gis":
case "blogspot":
case "google":
case "youtube":
}break;

case "click":/*!!!*/
if(Dom[1]==="clickclickclick")bCatch=true;break;

case "cloud":/*!!!*/
switch(Dom[1])
{
case "eucoc":
case "leeloo":
}break;

case "club":/*!!!*/
switch(Dom[1])
{
case "deathgrind":
case "fotograflar":
case "getmetal":
case "getsea":
case "mastersoftaste":
case "overhear":
case "rutracker":
case "you-blog":
bCatch=true;break;
}break;

case "cm":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "co":/*!!!*/
switch(Dom[1])
{
case "21":
case "4ray":
case "andrewchen":
case "angel":
case "atlas":
case "bettermetrics":
case "betternet":
case "blognot":
case "copperhead":
case "crew":
case "cryptobin":
case "d41":
case "djinni":
case "do":
case "duck":
case "elastic":
case "electrek":
case "ello":
case "emp3s":
case "epidemz":
case "fastcdn":
case "fireup":
case "fyre":
case "g":
case "gcdn":
case "google":
case "headwayapp":
case "hostr":
case "hpbn":
case "h-t":
case "ibb":
case "icpro":
case "ifunny":
case "jelly":
case "jifo":
case "katcr":
case "kostikov":
case "kukuruku":
case "ledger":
case "lever":
case "lokalise":
case "lpages":
case "lurkmore":
case "mlcdn":
case "modernapp":
case "niice":
case "nocms":
case "openload":
case "ostel":
case "pagedemo":
case "parnassus":
case "room":
case "rubri":
case "securityaffairs":
case "silk":
case "skilled":
case "spendabit":
case "startupclass":
case "statsbot":
case "stunning":
case "t":
case "thngs":
case "tidio":
case "tokumei":
case "tubeid":
case "uploadz":
case "vbstatic":
case "vine":
case "voat":
case "wal":
case "woolik":
case "w-x":
case "yourmajesty":
case "youtube":
case "zeit":
bCatch=true;break;
case "com":if(Dom[2]==="blogspot"||Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
case "republicrec":
{
    var NewURI=URI.clone();
    NewURI.host="smarturl.it";
    subject.redirectTo(NewURI);
}break;
case "stealthy":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "twnsnd":if(Dom[2]==="")bCatch=true;break;
case "unblocksites":if(Dom[2]==="")bCatch=true;break;
}break;

case "com":/*!!!*/
switch(Dom[1])
{
//(".com")
case "000webhostapp":
case "01counter":
case "100777":
case "101domain":
case "10minutemail":
case "1105media":
case "15gifts":
case "1843magazine":
case "1984hosting":
case "1and1":
case "1cloudstat":
case "1fichier":
case "1marafonbet":
case "1password":
case "2000things":
case "24timezones":
case "24xbtc":
case "2event":
case "2gis":
case "33across":
case "360":
case "360totalsecurity":
case "3cx":
case "3playmedia":
case "404techsupport":
case "4kdownload":
case "4shared":
case "6waves":
case "77sellers":
case "7digital":
case "7-tours":
case "8pecxstudios":
case "99bitcoins":
case "9cache":
case "9to5google":
case "9to5mac":
case "9to5toys":
case "a10networks":
case "a9t9":
case "aaathats3as":
case "aaspring":
case "abbyy":
case "abcnews":
case "aborche":
case "about":
case "abuseipdb":
case "acceptableads":
//(".com")
case "accountkit":
case "accredible":
case "accuranker":
case "aclsqdpgeaik":
case "acrbo":
case "acrylicwifi":
case "actility":
case "activehosted":
case "activestate":
case "activision":
case "act-on":
case "adafruit":
case "adcpm":
case "addevent":
case "addictivetips":
case "add-ins":
case "addme":
case "addthis":
case "addthiscdn":
case "addtoany":
case "addtocalendar":
case "adexchanger":
case "adguard":
case "adiumxtras":
case "adjust":
case "admitad":
case "adobe":
case "adobelogin":
case "adsense":
case "advancedrenamer":
case "advanxer":
case "advodka":
case "adwords":
case "adzos":
case "aerosock":
case "aescrypt":
case "affise":
case "afsanalytics":
case "agakat":
case "agilebits":
case "agilecrm":
case "agilemeasure":
case "ahla":
case "ahrefs":
case "aidanwoods":
case "aigents":
case "airbnb":
case "airbornos":
case "airpair":
case "aivanf":
case "aldeid":
case "alecpap":
case "alexeykopytko":
case "alexkras":
//(".com")
case "algolia":
case "algoroo":
case "alibaba":
case "alicdn":
case "aliexpress":
case "aliholic":
case "aliimg":
case "alipay":
case "allflac":
case "allmychanges":
case "alpari":
case "alphassl":
case "altair360":
case "altexsoft":
case "alzashop":
case "amazon":
case "amazon-adsystem":
case "amazonaws":
case "amd":
case "amplifr":
case "analitits":
case "android":
case "androidandme":
case "androidcentral":
case "androidforums":
case "androidheadlines":
case "androidify":
case "androidmtk":
case "androidpit":
case "angularjs":
case "aniview":
case "anonine":
case "anonops":
case "anonymizer":
case "anonymster":
case "answcdn":
case "answerdash":
case "answers":
case "answerscloud":
case "antisms":
case "antitree":
case "aol":
case "aolcdn":
case "aolplatforms":
case "apachehaus":
case "apachelounge":
case "apester":
case "apiato":
case "apk4fun":
case "apk-cloud":
case "apk-dl":
case "apkdom":
//(".com")
case "apkmirror":
case "apkplz":
case "apkpure":
case "apnews":
case "apollodata":
case "apowersoft":
case "appadvice":
case "appcues":
case "appendto":
case "apple":
case "applymagicsauce":
case "appmypolice":
case "appriver":
case "appsflyer":
case "appspot":
case "appthority":
case "apriorit":
case "arbornetworks":
case "arcan-fe":
case "arcgis":
case "arewee10syet":
case "arewewebextensionsyet":
case "arstechnica":
case "arubacloud":
case "arubanetworks":
case "asadotzler":
case "asciipr0n":
case "ashampoo":
case "asidecasev":
case "askask":
case "askubuntu":
case "aspnetcdn":
case "assembla":
case "astrill":
case "astrill4u":
case "astrillservices":
case "astrodigital":
case "asus":
case "atagar":
case "atavi":
case "atavist":
case "atdmt":
case "atgsvcs":
case "atlassian":
case "atmail":
case "audioboom":
case "auth":
case "auth0":
case "autohotkey":
case "autoitscript":
case "automattic":
case "autopilothq":
//(".com")
case "autoprofi":
case "avast":
case "av-desk":
case "avforums":
case "avianews":
case "avira":
case "avvo":
case "aweber":
case "aweber-static":
case "awesomeredirector":
case "axigen":
case "azadicdn":
case "azadify":
case "azirevpn":
case "babyalbum":
case "backblaze":
case "backchannel":
case "backstreetmerch":
case "baidu":
case "bamsoftware":
case "bandcamp":
case "bandicam":
case "bandpage":
case "bandsintown":
case "bankir":
case "bankofbets":
case "barracudadrive":
case "base64encrypt":
case "battlefield":
case "battleforthenet":
case "bayleaks":
case "bazaarvoice":
case "bazqux":
case "bbm":
case "bbthat":
case "bcbits":
case "bdstatic":
case "beakerbrowser":
case "beeketing":
case "beget":
case "bellingcat":
case "belmeta":
case "benjaminvandersloot":
case "bennadel":
case "b-e-soft":
case "bestbackups":
case "besttechie":
case "bestvpn":
case "bestvpnprovider":
case "bestvpnrating":
case "betaarchive":
//(".com")
case "betabrand":
case "betanews":
case "betrayingthemartyrs":
case "beyond3d":
case "bforex":
case "bibilgi":
case "bignerdranch":
case "bignox":
case "bill2fast":
case "binary-forum":
case "bing":
case "binotel":
case "binpress":
case "bintray":
case "biqle":
case "birdinflight":
case "bishopfox":
case "bitcasa":
case "bitcoinchain":
case "bitcoincharts":
case "bitcoinclassic":
case "bitcoinmagazine":
case "bitcoin-obmen":
case "bitcoinwisdom":
case "bitdefender":
case "bitgo":
case "bithumb":
case "bitly":
case "bitmovin":
case "bitnovosti":
case "bitpay":
case "bitplay":
case "bitporno":
case "bitshares":
case "bitsum":
case "bittrex":
case "bitvise":
case "blackeyelens":
case "blackhat":
case "blackhatworld":
case "blackvpn":
case "bleepingcomputer":
case "blend4web":
case "blockexplorer":
case "blockmetry":
case "blockstream":
case "blocktrail":
case "blogblog":
case "bloger51":
case "blogfoster":
//(".com")
case "blogger":
case "blogmint":
case "blogsmithmedia":
case "blogspot":
case "blogun":
case "bloomberg":
case "bmoattachments":
case "boldchat":
case "booking":
case "boomtrain":
case "bootstrapcdn":
case "bootswatch":
case "borngeek":
case "boston":
case "bostonglobe":
case "bounceexchange":
case "bountysource":
case "box":
case "boxcryptor":
case "boxpn":
case "bpsimulator":
case "bradfieldcs":
case "brainly":
case "braintreegateway":
case "branah":
case "branchable":
case "brassring":
case "brave":
case "breadwallet":
case "breakingviews":
case "brightcove":
case "brightfunnel":
case "brighttalk":
case "broadsign":
case "brokenbrowser":
case "browsealoud":
case "browsec":
case "browserling":
case "bsidesvancouver":
case "bstatic":
case "bt":
case "btc":
case "btcarmory":
case "btc-e":
case "btguard":
case "btosports":
case "buffer":
case "bufferapp":
//(".com")
case "bugcrowd":
case "builtabroad":
case "bukovel":
case "bulkcdn":
case "burnaware":
case "bus-tur":
case "buybitcoinworldwide":
case "buysellads":
case "buzzfeed":
case "bykvu":
case "bytes":
case "bytescout":
case "bytesized-hosting":
case "bytewerk":
case "cactusvpn":
case "caddyserver":
case "cagoi":
case "calibre-ebook":
case "calleasy":
case "callloop":
case "camelcamelcamel":
case "campmor":
case "camscanner":
case "canijailbreak":
case "caniuse"://#tls1.0
case "cannedbanners":
case "canon-europe":
case "canonical":
case "canva":
case "capitalg":
case "capterra-static":
case "captora":
case "careerwebsite":
case "carvoy":
case "casalemedia":
case "cccables":
case "ccdnss":
case "ccpgamescdn":
case "cdn77":
case "cdn-apple":
case "cdn-dena":
case "cdninstagram":
case "cdnjs":
case "cdnplanet":
case "cdntwrk":
case "cdw":
case "centralnic":
case "cerberusapp":
case "cerberusftp":
//(".com")
case "certificatedetails":
case "certsimple":
case "cezurity":
case "cfigroup":
case "cformanalytics":
case "championat":
case "changedetection":
case "changegid":
case "channeladvisor":
case "charactercounttool":
case "charlesproxy":
case "chatfuel":
case "chatlio":
case "chatsim":
case "chaturbate":
case "checkout51":
case "checktls":
case "chelseafc":
case "chemtable":
case "chilkatsoft":
case "chimpstatic":
case "chinainternetwatch":
case "chistilka":
case "chordist":
case "chris-pc":
case "chrome":
case "chromebook":
case "chromecast":
case "chromestatus":
case "chromestory":
case "chronopay":
case "chzbgr":
case "ciblelink":
case "ciphrex":
case "circleci":
case "cisco":
case "citrix":
case "citysitesglobal":
case "classzone":
case "cldup":
case "cleantechnica":
case "clearcenter":
case "clearos":
case "clevercards":
case "cleveroad":
case "clickcease":
case "clickdesk":
case "clickfunnels":
case "clickiocdna":
case "clickmeter":
//(".com")
case "clickworker":
case "clicky":
case "clip2net":
case "cliqz":
case "closingtracker":
case "cloudflare":
case "cloudflaressl":
case "cloudike":
case "cloudingenium":
case "cloudme":
case "cloudmetro":
case "clouduklive":
case "cloudup":
case "cmxlog":
case "cnbc":
case "cnet":
case "cnstrc":
case "coccoc":
case "codacy":
case "codeandsec":
case "codecademy":
case "codecguide":
case "codeclimate":
case "codenameone":
case "codeplex":
case "codeproject":
case "coderanch":
case "coderwall":
case "codeyarns":
case "codinghorror":
case "coffitivity":
case "cofounderslab":
case "cogi":
case "coinapult":
case "coinbase":
case "coincheck":
case "coinidol":
case "coinkite":
case "coinmarketcap":
case "cointelegraph":
case "coleure":
case "comcasttechnologysolutions":
case "comm100":
case "commandlinefu":
case "commonkey":
case "comodo":
case "comodobr":
case "comodoca":
case "comphelp":
//(".com")
case "compmastera":
case "compose":
case "computerhope":
case "computerworld":
case "condor":
case "conflicted-copy-resolver":
case "connatix":
case "consumerbarometer":
case "consumerist":
case "contentful":
case "content-security-policy":
case "contextis":
case "conversational":
case "conversica":
case "convertbar":
case "cookiesshow":
case "coolsymbol":
case "coolutils":
case "copiny":
case "copy":
case "copypoison":
case "corezoid":
case "corporatenetwork":
case "coschedule":
case "coub":
case "countermail":
case "coursehero":
case "coverity":
case "cq":
case "cqg":
case "craftcms":
case "crazyegg":
case "crazyengineers":
case "createjs":
case "creativecloud":
case "creativemarket":
case "crello":
case "crimerussia":
case "criteo":
case "crossmediapanel":
case "crowdflower":
case "crowdin":
case "crowdstrike":
case "crstat":
case "crunchbase":
case "crx4chrome":
case "cryptocoinsnews":
case "cryptocompare":
case "cryptoheaven":
case "cryptopals":
//(".com")
case "cryptopp":
case "crystalidea":
case "crystalknows":
case "csgpro":
case "csscreator":
case "css-tricks":
case "csswizardry":
case "cubby":
case "cubbyusercontent":
case "cubeupload":
case "cuonic":
case "current":
case "cursecdn":
case "custhelp":
case "customerservice-macys":
case "cvedetails":
case "cxense":
case "cyberark":
case "cyberghostvpn":
case "cybersixgill":
case "cybersyndicates":
case "cygwin":
case "cylance":
case "cyngn":
case "cyph":
case "cyphort":
case "cy-pr":
case "da-files":
case "daftlogic":
case "dailydot":
case "dailymotion":
case "dailytechtuts":
case "dallasnews":
case "danatrak":
case "danceconnection":
case "danielpocock":
case "daniweb":
case "darklaunch":
case "dark-os":
case "darkwebnews":
case "dashamail":
case "dashhudson":
case "dashlane":
case "databricks":
case "datahc":
case "datanyze":
case "daymonely":
case "dbheroapp":
case "dbpoweramp":
case "dd-wrt"://#tls1.0
case "decipheryou":
//(".com")
case "decomments":
case "deconstructoroffun":
case "deepdotweb":
case "deepl":
case "deepmemo":
case "deepmind":
case "deezer":
case "defaultrouterip":
case "delicious":
case "dell":
case "deloitte":
case "demandmedia":
case "depfile":
case "depositfiles":
case "desk":
case "deskun":
case "detectify":
case "devcereal":
case "devexpress":
case "deviantart":
case "devtodev":
case "dezeen":
case "dholera-smart-city-phase2"://#tls1.0
case "didierstevens":
case "dietsensor":
case "digicert":
case "digiday":
case "digitalbitbox":
case "digitalocean":
case "digitaltrends":
case "digitfreak":
case "digits":
case "dipisoft":
case "directiva":
case "discogs":
case "discordapp":
case "discover":
case "disqus":
case "disqusads":
case "disquscdn":
case "djangoproject":
case "dmca":
case "dnsbycomodo":
case "dnsdumpster":
case "dnsexit":
case "dnsleaktest":
case "dobovo":
case "dobrofon":
case "docker":
case "docs":
case "dodgethissecurity":
//(".com")
case "doileak":
case "do-know":
case "dokpub":
case "dom2000":
case "domaining":
case "domainiq":
case "domainit":
case "domaintools":
case "dominustemporis":
case "donaldjtrump":
case "donatstudios":
case "dosbox":
case "dotcom-tools":
case "doublepimpssl":
case "doublevpn":
case "downace":
case "downloadastro":
case "downloadfp":
case "download-torrent-now":
case "doyoudreamup":
case "dreamboxedit":
case "dreamhost":
case "dribbble":
case "drift":
case "driftt":
case "drinkcanvas":
case "drivermax":
case "driverscollection":
case "dropapk":
case "dropbox":
case "dropboxstatic":
case "dropboxusercontent":
case "dropcryptbox":
case "dropjiffy":
case "drownattack":
case "drweb":
case "dslreports":
case "duckduckgo":
case "duckduckhack":
case "ducttapemarketing":
case "dudamobile":
case "dummyimage":
case "dune-hd":
case "duo":
case "dva-ch":
case "dvdvideosoft":
case "dynadot":
case "dynamicyield":
case "dynstatus":
//(".com")
case "dzone":
case "e24cloud":
case "ea":
case "eaglecdn":
case "eagleplatform":
case "eam-gmbh":
case "earthvpn":
case "easports":
case "eatsa":
case "ebayimg":
case "ebaystatic":
case "ecenglish":
case "eclkmpsa":
case "economics-prorok":
case "econsultancy":
case "e-contenta":
case "editmysite":
case "educator":
case "edward-tour":
case "eehelp":
case "e-estonia":
case "egrinf":
case "ehow":
case "ehowcdn":
case "ehownowcdn":
case "eightforums":
case "eiu":
case "ekhokavkaza":
case "elance360":
case "elcomsoft":
case "eldos":
case "electrictoolbox":
case "electroname":
case "elefile":
case "elegantthemes":
case "elftronix":
case "elitepvpers":
case "elpassion":
case "eltechs":
case "eltima":
case "emailjs":
case "emailondeck":
case "emailprivacytester":
case "emarketer":
case "emarsys":
case "embarcadero":
case "embedagram":
case "embedcdn":
case "embedi":
case "embedly":
case "emc":
//(".com")
case "emercoin":
case "emexmail":
case "ems1":
case "en25":
case "encrypt-the-planet":
case "end702":
case "engadget":
case "enigmasoftware":
case "enlocked":
case "entrepreneur":
case "entrust":
case "envato":
case "envato-static":
case "epicbrowser":
case "epicport":
case "epicstars":
case "epochconverter":
case "equestionanswers":
case "ericsson":
case "erodr":
case "eset":
case "esetstatic":
case "essential":
case "espressif":
case "esputnik":
case "esri":
case "essentialobjects":
case "etsy":
case "ettus":
case "eurekalog":
case "europeup":
case "eurovoix":
case "eurovoix-world":
case "evbstatic":
case "evbuc":
case "eventbrite":
case "eventtracker":
case "eveonline":
case "everlane":
case "evernote":
case "everycaller":
case "evidon":
case "evil32":
case "evolution-hos":
case "examine":
case "example":
case "example-code":
case "excalibergaming":
case "exchangerwm":
case "eximb":
case "expertoption":
case "experts-exchange":
//(".com")
case "exploit-db":
case "explorepartsunknown":
case "exponea":
case "expressvpn":
case "express-vpn":
case "extremetech":
case "eyeo":
case "ezbsystems":
case "ezochat":
case "f5":
case "facebook":
case "fail0verflow":
case "fantasyliga":
case "fastcodesign":
case "fastcompany":
case "fastly":
case "fastmail":
case "fastspring":
case "fastytd":
case "fb":
case "fbsbx":
case "f-cdn":
case "fcminaj":
case "fctables":
case "fctablesmedia":
case "feaneron":
case "feathersjs":
case "feed.theplatform":
case "feedburner":
case "feedsyndicate":
case "feelguide":
case "feistyduck":
case "ffprofile":
case "ffwagency":
case "fifa":
case "figma":
case "filemaker":
case "filenurse":
case "fileplanet":
case "filesfetcher":
case "filestack":
case "filestackapi":
case "filestackcontent":
case "filesuffix":
case "film-4-you":
case "findproxyforurl":
case "findx":
case "finnwea":
case "firebase":
case "firebaseio":
case "fireeye":
case "fivethirtyeight":
//(".com")
case "fix4dll":
case "flagcounter":
case "flamesgroup":
case "flashphoner":
case "flashpoint-intel":
case "flashtalking":
case "flatpi":
case "flattr":
case "flexerasoftware":
case "flickr":
case "flightradar24":
case "flipboard":
case "flipkart":
case "flixcart":
case "flixster":
case "flocktory":
case "fogbugz":
case "fogcreek":
case "foliovision":
case "followupthen":
case "fontawesome":
case "fontdeck":
case "fonticons":
case "fonts":
case "fontshop":
case "fontsquirrel":
case "football-online2":
case "footboom":
case "forbes":
case "forbesimg":
case "forbytes":
case "forcepoint":
case "forexfactory":
case "formget":
case "fortawesome":
case "fortiguard":
case "fortinet":
case "forumodua":
case "fossbytes":
case "fossdroid":
case "fosshub":
case "foundeo":
case "foundrmag":
case "fourdots":
case "fourfourtwo":
case "foursixty":
case "foursquare":
case "foxylab":
case "fractalbrew":
case "freecall":
case "freecodecamp":
//(".com")
case "free-css-menu":
case "freedom-to-tinker":
case "freedrweb":
case "freeformatter":
case "free-invoice-generator":
case "freelancehunt":
case "freelancer":
case "freerangestock":
case "freesafeip":
case "freeyourmusic":
case "freshdesk":
case "fried":
case "friendlife":
case "friendlybit":
case "friendlyduck":
case "froglogic":
case "frontier":
case "frootvpn":
case "fsdn":
case "f-secure":
case "ft":
case "ftplike":
case "fullcontact":
case "fullstory":
case "funcaptcha":
case "funtasysport":
case "fuseclick":
case "futurism":
case "fuzzyreflection":
case "fvsch":
case "fwdcdn":
case "fxsitecompat":
case "g2crowd":
case "gadgethacks":
case "gamesinners":
case "gamespot":
case "gannett-cdn":
case "ganttpro":
case "garfieldtech":
case "gavick":
case "gawkermediagroup":
case "gdatasoftware":
case "gdcuffs":
case "gdevkievezhithorosho":
case "gearbest":
case "gearjunkie":
case "geek":
case "geekflare":
case "geeksdistrict":
case "geekwire":
case "geert-hofstede":
//(".com")
case "gemalto"://#tls1.0
case "genymotion":
case "geofeedia":
case "geo-servis":
case "geotrust":
case "getadblock":
case "getadmiral":
case "getbootstrap":
case "getchip":
case "getchute":
case "getclef":
case "getcloak":
case "getfeedback":
case "getfirebug":
case "getfirefox":
case "getfireshot":
case "getflywheel":
case "getgeekapps":
case "getgophish":
case "gethttpsforfree":
case "getkya":
case "getmoreproof":
case "getpocket":
case "getresponse":
case "getrockerbox":
case "getsatisfaction":
case "getsentry":
case "getsharex":
case "getsidekick":
case "getsitecontrol":
case "getsmartcontent":
case "getsmartlook":
case "getsync":
case "getwifiwidget":
case "getyounity":
case "gfycat":
case "ggpht":
case "gguid":
case "ghbtns":
case "ghostbin":
case "ghostery":
case "ghostmail":
case "gidforums":
case "gigablast":
case "giganews":
case "giganika":
case "gigya":
case "giphy":
case "gismeteo":
case "gitbook":
case "github":
//(".com")
case "githubusercontent":
case "gitlab":
case "git-scm":
case "gizmodo":
case "glashkoff":
case "glasswire":
case "globalfilesearch":
case "globallogic":
case "glype":
case "gmail":
case "gmx":
case "godaddy":
case "gofetchjobs":
case "gofundme":
case "gog":
case "gogetssl":
case "gohacking":
case "goldenfrog":
case "golospravdy":
case "gomakethings":
case "goodreads":
case "google":
case "googleadservices":
case "googleanalytics":
case "google-analytics":
case "googleapis":
case "googleapps":
case "googleblog":
case "googlecode":
case "googlecommerce":
case "googledrive":
case "googlegroups":
case "googlemail":
case "googlepages":
case "googleplex":
case "googlesource":
case "googlesyndication":
case "googletagmanager":
case "googletagservices":
case "googleusercontent":
case "googlevideo":
case "googleweblight":
case "gotinder":
case "gpm-digital":
case "grabduck":
case "grader":
case "grammarly":
case "granicus":
case "gr-assets":
case "gratipay":
//(".com")
case "gravatar":
case "greentechmedia":
case "greenwichmeantime":
case "greetings-day":
case "grepular":
case "greybox":
case "gromweb":
case "groovehq":
case "groovypost":
case "growsumo":
case "growthhackers":
case "grupoice":
case "grvcdn":
case "gstatic":
case "gstvnet":
case "gta5-mods":
case "gtmetrix":
case "guardicore":
case "guerrillamail":
case "gulli":
case "gv":
case "gyazo":
case "h3xed":
case "hackcanada":
case "hacked":
case "hackercodex":
case "hackernoon":
case "hackerone":
case "hackerrank":
case "hackertarget":
case "hackmag":
case "hackread":
case "hamrick":
case "handy":
case "hanselman":
case "harajgulf":
case "hardforum":
case "hasbrotoyshop":
case "hashcoins":
case "hasitleaked":
case "hastebin":
case "haveibeenpwned":
case "hawkhost":
case "haztek-software":
case "h-cdn":
case "hckrnews":
case "hddlife":
case "hdtracks":
case "headvpn":
//(".com")
case "heapanalytics":
case "heimdalsecurity":
case "hello":
case "hellobar":
case "helpnetsecurity":
case "herbertograca":
case "herdprotect":
case "here":
case "heroic":
case "herokuapp":
case "hetzner":
case "hex-rays":
case "hhdsoftware":
case "hideipvpn":
case "hidemyass":
case "hidester":
case "highcharts":
case "highwebmedia":
case "hipchat":
case "hireserve":
case "hit2k":
case "hitbtc":
case "hitskin":
case "hitwe":
case "hmailserver":
case "holbertonschool":
case "hoodiecrow":
case "hostingkartinok":
case "hostiso":
case "host-tracker":
case "hotellook":
case "hoteltonight":
case "hothardware":
case "hotmail":
case "hot-matures":
case "hotspotshield":
case "howsmyssl":
case "howtoforge":
case "howtogeek":
case "hpe":
case "hroomer":
case "hs-analytics":
case "hsappstatic":
case "hscripts":
case "hscta":
case "hsforms":
case "hsivonen":
case "hs-scripts":
case "hsstatic":
case "htbridge":
//(".com")
case "html5rocks":
case "html5test":
case "htmlburger":
case "htmlenc":
case "htmlremix":
case "htmlwasher":
case "httpstatuses":
case "httpwatch":
case "hubapi":
case "hubspot":
case "hubspotanalytics":
case "hugedomains":
case "hullabu":
case "hulu":
case "humanbenchmark":
case "humblebundle":
case "hurtom":
case "hushed":
case "hushmail":
case "hybrid-analysis":
case "hypercomments":
case "hyperloop-one":
case "i2coalition":
case "iab":
case "iabtechlab":
case "iacpublish":
case "iacpublishinglabs":
case "iandevlin":
case "ianix":
case "iblocklist":
case "ibm":
case "ibvpn":
case "icinga":
case "ic-live":
case "icloud":
case "iconfinder":
case "iconosquare":
case "iconpharm":
case "icons8":
case "icontact":
case "icq":
case "identrustssl":
case "ideone":
case "idmanagedsolutions":
case "idontplaydarts":
case "iexitapp":
case "ifcdn":
case "ifixit":
case "iflychat":
//(".com")
case "ifttt":
case "igodigital":
case "igoninlab":
case "iknowwhatyoudownload":
case "illiweb":
case "imageoptim":
case "images4et":
case "images-amazon":
case "imageshack":
case "imgbox"://#tls1.0
case "imgflip":
case "imgix":
case "imgjam":
case "imgpile":
case "imgur":
case "imprace":
case "impressivewebs":
case "impstyle":
case "imzy":
case "incapsula":
case "incloak":
case "independentreserve":
case "indiegogo":
case "indiemerch":
case "infinario":
case "infoarmor":
case "infobip":
case "infomaniak":
case "infoq":
case "informaction":
case "informatica":
case "infosecurity-magazine":
case "infragistics":
case "inhiro":
case "initex":
case "inmotionhosting":
case "inoxoft":
case "inportb":
case "inrepublic":
case "insidetracker":
case "instagram":
case "instantssl":
case "instmap":
case "instra":
case "intagme":
case "integralads":
case "intel":
case "intellisuggest":
case "intercomcdn":
case "interkassa":
case "internetdownloadmanager":
case "internet-israel":
//(".com")
case "intra2net":
case "inverse":
case "inversepath":
case "invisibler":
case "invisionapp":
case "invisioncommunity":
case "invisionpower":
case "invisionzone":
case "invitae":
case "ionicframework":
case "ipcim":
case "ip-echelon":
case "iprivacytools":
case "ipshka":
case "iptoasn":
case "ipvanish":
case "ipvm":
case "iqoption":
case "iranwire":
case "iridium":
case "ironsocket":
case "isabelmarant":
case "isc":
case "islandlivingantigua":
case "isleaked":
case "isnare":
case "ispyconnect":
case "issuu":
case "istat24":
case "isthereanydeal":
case "isthisfilesafe":
case "itechtics":
case "it-guild":
case "itldc":
case "itmages":
case "itracker360":
case "it-securityguard":
case "ivideon":
case "ixiacom":
case "ixquick":
case "ixquick-proxy":
case "izenpe":
case "jacobhenner":
case "jakearchibald":
case "jaleco":
case "jalopnik":
case "jamendo":
case "java":
case "javelinstrategy":
case "jdstrong":
//(".com")
case "jeded":
case "jessfraz":
case "jetbrains":
case "jhalderm":
case "jimcdn":
case "jimdo":
case "jimdo-server":
case "jimmydata":
case "jimstatic":
case "jmfeurprier":
case "joelonsoftware":
case "johnnybet":
case "joinjune":
case "joinposter":
case "jolla":
case "joomunited":
case "joshondesign":
case "jotform":
case "journalismisnotacrime":
case "joyent":
case "jquery":
case "jquerymobile":
case "jqueryui":
case "js.cnbcfm":
case "jsdelivr":
case "jsperf":
case "juick":
case "jujucharms":
case "jukedeck":
case "justanswer":
case "just-ask-kim":
case "justcollecting":
case "justfab":
case "justgetflux":
case "justice4assange":
case "justinobeirne":
case "jwpcdn":
case "jwplayer":
case "kaddr":
case "kaggle":
case "kalkis-research":
case "kaply":
case "karabas":
case "kashalot":
case "kaspersky":
case "kasperskyclub":
case "kasperskycontenthub":
case "kasperskypartners":
case "kastatic":
case "katiebroida":
case "kavkazr":
//(".com")
case "kcsoftwares":
case "keddr":
case "keepkey":
case "kemitchell":
case "keycdn":
case "keyerror":
case "keylength":
case "kickidler":
case "kickofflabs":
case "kickstarter":
case "kik":
case "kilograpp":
case "kindgeek":
case "kingoapp":
case "king-servers":
case "kingston":
case "kinja":
case "kinja-img":
case "kinja-static":
case "kinsta":
case "kissmetrics":
case "kiwi":
case "knightlab":
case "kolabnow":
case "konklone":
case "kovalevskyi":
case "kpmg":
case "krebsonsecurity":
case "kremalicious":
case "krymr":
case "kudago":
case "kuoll":
case "kursvalut":
case "kvartirkov":
case "kxcdn":
case "ladesk":
case "lalafo":
case "landflip":
case "lastpass":
case "latestsolution":
case "lavabit":
case "lawfareblog":
case "leadboxer":
case "leaddyno":
case "leakedsource":
case "leanplum":
case "leastauthority":
case "leboutique":
case "ledgerwallet":
case "lefotu":
case "leftlogic":
case "legiblenews":
//(".com")
case "lego":
case "legocdn":
case "lenmit":
case "lentainform":
case "letstalkpayments":
case "liberapay":
case "licdn":
case "lifehacker":
case "lifeinua":
case "lifewire":
case "lightboxcdn":
case "lightwidget":
case "likarni":
case "likegeeks":
case "lim-english":
case "lingvolive":
case "linkedin":
case "linkfire":
case "linkprofit":
case "linncdn":
case "linode":
case "linustechtips":
case "linux":
case "linux-apps":
case "linuxaria":
case "linux-audit":
case "linuxbabe":
case "linuxbierwanderung":
case "linuxjournal":
case "linuxmint":
case "linuxvoice":
case "liqpay":
case "listrak":
case "listrakbi":
case "literatureandlatte":
case "literotica":
case "lithium":
case "litmus":
case "live":
case "livechatinc":
case "livefilestore":
case "livefyre":
case "livejournal":
case "liveleak":
case "livepcsupport":
case "livepinger":
case "livesoccertv":
case "livesportsol":
case "livestream":
case "livetyping":
case "lmgtfy":
//(".com")
case "loadercdn":
case "localbitcoins":
case "localizecdn":
case "localizejs":
case "locomalito":
case "logaster":
case "logincasino":
case "loginfinder":
case "logitech":
case "logrocket":
case "longtailvideo":
case "lookout":
case "losslessclub":
case "losslessdown":
case "loungelizard":
case "luapower":
case "lucyparsonslabs":
case "luminvision":
case "lunchpoint":
case "luxoft":
case "lviv":
case "lynda":
case "lyngsat":
case "maanimo":
case "machinio":
case "mackeepersecurity":
case "macromedia":
case "macrumors":
case "macysassets":
case "madewithmarmalade":
case "magicaljellybean":
case "magicsignup":
case "magna-femina-webzine":
case "magneticone":
case "magneticonegroup":
case "mail1click":
case "mail-archive":
case "mailenable":
case "mailerlite":
case "mailfence":
case "mailinator":
case "mail-tester":
case "mailvelope":
case "makefastsites":
case "maketecheasier":
case "malwarebytes":
case "malwaredomains":
case "malwarefixes":
case "malwarehunterteam":
//(".com")
case "malwaretech":
case "malwaretips":
case "malwr":
case "manageengine":
case "mangocam":
case "manning":
case "manoverboard":
case "manualslib":
case "manychat":
case "manycontacts":
case "manymo":
case "mapbox":
case "mapiful":
case "mapkyca":
case "mapquest":
case "marcusengel":
case "marinetraffic":
case "marketgid":
case "marketo":
case "markmonitor":
case "markticle":
case "martau":
case "marvelapp":
case "marvelheroes":
case "marx":
case "masergy":
case "mastercard":
case "masterpasswordapp":
case "master-x":
case "matbea":
case "matejc":
case "materialdesignicons":
case "materialpalette":
case "mathsisfun":
case "mathworks":
case "mattboldt":
case "mattermark":
case "mattermedia":
case "mattrude":
case "maxcdn":
case "maxmind":
case "mcafeesecure":
case "mchanges":
case "measurementapi":
case "mediabiasfactcheck":
case "media-imdb":
case "mediaon":
case "mediapost":
case "mediavoice":
//(".com")
case "mediawayss":
case "medium":
case "meetup":
case "megaobzor":
case "megaproxy":
case "megazvonok":
case "meinbergglobal":
case "meldium":
case "merchbar":
case "mercury-browser":
case "merriam-webster":
case "messenger":
case "metadefender":
case "metalanarchy":
case "metal-archives"://#tls1.0
case "metalmusicarchives":
case "metasploit":
case "mgid":
case "mibbit":
case "mic":
case "micahflee":
case "microsoftonline":
case "microsoftpressstore":
case "microsoftstore":
case "middleeastmonitor":
case "mikrotik":
case "mindtheproduct":
case "minimalsearch":
case "miovision":
case "mirrorace":
case "mirrorcreator":
case "misja":
case "mixcloud":
case "mlv-cdn":
case "moat":
case "mobilenations":
case "mobilesecuritywiki":
case "models":
case "modernizr":
case "moneybookers":
case "mongodb":
case "monosnap":
case "monotypeimaging":
case "monster":
case "monumentvalleygame":
case "morgamic":
case "moto":
case "motorola":
case "moxielinks":
case "moz":
case "mozilla":
//(".com")
case "mozvr":
case "mp3va":
case "mqcdn":
case "mql5":
case "msdn":
case "mshcdn":
case "msn":
case "msocdn":
case "mspoweruser":
case "mssqltips":
case "mturk":
case "muchgames":
case "muckrock":
case "mulle-kybernetik":
case "multiloginapp":
case "multiscreensite":
case "murgee":
case "muscache":
case "muso":
case "mustang-browser":
case "mwrinfosecurity":
case "mxpnl":
case "mxtoolbox":
case "my":
case "myboogieboard":
case "mycelium":
case "mycityua":
case "myco":
case "mycommerce":
case "mydevices":
case "myetherwallet":
case "myfitnesspal":
case "myhackerhouse":
case "mykolab":
case "mylifebox":
case "mylivechat":
case "myoptimity":
case "myrouteonline":
case "myshopify":
case "myspace":
case "myspacecdn":
case "mysql":
case "mytopf":
case "mywot":
case "n4bb":
case "naij":
case "name":
case "namecheap":
case "namechk":
//(".com")
case "namepros":
case "nanosemantix":
case "napalmrecords":
case "naspers":
case "nation-music":
case "nature":
case "navalny":
case "nccgroup-webperf":
case "ndf81":
case "needforspeed":
case "neighborhoodsquare":
case "nemisj":
case "neomailbox":
case "nesdev":
case "neste":
case "netcraft":
case "netdna-cdn":
case "netdna-ssl":
case "netflix":
case "netlify":
case "netmarketshare":
case "netskope":
case "netsparker":
case "networkhealth":
case "networklessons":
case "networkredux":
case "netwrix":
case "neuralink":
case "newrelic":
case "newscientist":
case "newsland":
case "newsletter2go":
case "newspapers":
case "newsru":
case "newssyndication":
case "newtonew":
case "newzoo":
case "nexmo":
case "nextcloud":
case "nextdoor":
case "nextinpact":
case "nextleveltricks":
case "nginx":
case "ngrok":
case "nicehash":
case "nickwilsdon":
case "ni-mate":
case "nimplus":
case "n-ix":
case "nixsolutions":
case "nngroup":
case "noembed":
//(".com")
case "nofap":
case "noip":
case "noisli":
case "nomadlist":
case "nominate":
case "nomx":
case "noorenberghe":
case "nordicsemi":
case "nordvpn":
case "northaveeducation":
case "norton":
case "nosto":
case "notebookcheck-ru":
case "notifyninja"://#tls1.0
case "notoriousdev":
case "notsosecure":
case "novell":
case "noxapp-player":
case "nperf":
case "npmcdn":
case "npmdaily":
case "npmjs":
case "ntchosting":
case "nudgespot":
case "numberingplans":
case "nwebsec":
case "nyanimg":
case "nylotteryretailer":
case "nymbium":
case "nypost":
case "nyt":
case "nytimes":
case "o0bc":
case "oahermes":
case "objective-see":
case "oboom":
case "obozrevatel":
case "obsproject":
case "ocenaudio":
case "oculus":
case "od-cdn":
case "oddonion":
case "od-news":
case "odyssey-resources":
case "offensive-security":
case "office":
case "ofigenno":
case "ofsys":
case "okayfreedom":
case "okccdn":
//(".com")
case "okcupid":
case "okpay":
case "olark":
case "olimpua":
case "ondemand":
case "oneall":
case "oneconsult":
case "onedrive":
case "onehourtranslation":
case "onelogin":
case "onename":
case "oneretarget":
case "onesignal":
case "oneskyapp":
case "one-tab":
case "onetimesecret":
case "onlinehashcrack":
case "onlyoffice":
case "onmsft":
case "oo-software":
case "ooyala":
case "opbeat":
case "openai":
case "opencartforum":
case "openclassrooms":
case "opencorporates":
case "opendatabot":
case "opendime":
case "opendns":
case "openloadstatus":
case "openrice":
case "opensharecount":
case "opensignal":
case "opensourcefriday":
case "openstat":
case "openwebgames":
case "operacdn":
case "operamediaworks":
case "operasoftware":
case "operavpn":
case "opinionstage":
case "oplata":
case "optimizely":
case "optimizerwp":
case "optimizesmart":
case "optinchat":
case "optinmonster":
case "optnmnstr":
case "optsklad":
case "oreilly":
case "oreillystatic":
//(".com")
case "origin":
case "orstatic":
case "oslofreedomforum":
case "oup":
case "out-law":
case "outlook":
case "overdrive":
case "ovh":
case "owncube":
case "owndrive":
case "oxforddictionaries":
case "oxymoronical":
case "packetstatic":
case "packetstormsecurity":
case "packtpub":
case "padabum":
case "pageadviser":
case "pagefair":
case "palantir":
case "paloaltoonline":
case "pando":
case "paragonie":
case "parallels":
case "parastorage":
case "pardot":
case "parsely":
case "partage-facile":
case "partcatalog":
case "passbolt":
case "passcovery":
case "passmark":
case "passrecovery":
case "pastebin":
case "patheticcockroach":
case "patreon":
case "paulvincentroll":
case "paybis":
case "payeer":
case "paymentwall":
case "paypal":
case "paypalobjects":
case "payza":
case "pbsrc":
case "pcidatabase":
case "pcrisk":
case "pdfbuddy":
case "pechkin":
case "pediaview":
case "peerblock":
case "peerj":
//(".com")
case "peerlyst":
case "peername":
case "pegasuscart":
case "pendrivelinux":
case "pennynetwork":
case "pentestbox":
case "pentesterlab":
case "pentest-tools":
case "peoplesproject":
case "percona":
case "perezvoni":
case "perfectial":
case "perfect-privacy":
case "periscopedata":
case "permutationsofchaos":
case "personal":
case "personalics":
case "pesoto":
case "petri":
case "petrimazepa":
case "pgicyber":
case "pgpru":
case "pgregg":
case "philips":
case "phishlabs":
case "phishme":
case "phncdn":
case "phoneapks":
case "phonearena":
case "phoronix":
case "photographylife":
case "phpbb":
case "php-proxy":
case "phrozensoft":
case "piarplus":
case "piazza":
case "picasa":
case "picaton":
case "picbackman":
case "picnik":
case "piguiqproxy":
case "piliapp":
case "pinger":
case "pinimg":
case "pinterest":
case "piriform":
case "pismotek":
case "pixabay":
case "pixlee":
case "pixlr":
//(".com")
case "pjtsu":
case "placeimg":
case "plaid":
case "planoly":
case "plarium":
case "plategka":
case "playbuzz":
case "playithub":
case "playvk":
case "plcontent":
case "pledgie":
case "plesk":
case "pling":
case "plista":
case "plugmee":
case "pluralsight":
case "pochtoy":
case "pocketnow":
case "pokevision":
case "polarmobile":
case "polexp":
case "polldaddy":
case "poloniex":
case "pomodoneapp":
case "pompmall":
case "ponyfoo":
case "poodletest":
case "popsci":
case "pornhub":
case "portableapps":
case "portablefreeware":
case "postable":
case "postbox-inc":
case "postlight":
case "potolki":
case "pottermore":
case "powerbasic":
case "powerdns":
case "powerfolder":
case "pozvonim":
case "prankota":
case "pravda"://#tls1.0
case "pravo":
case "premsocks":
case "prepressure":
case "pretentiousname":
case "prezi":
case "preziusercontent":
case "primeliber":
case "primevideo":
//(".com")
case "primulinus":
case "printfriendly":
case "privacy-conference":
case "privateinternetaccess":
case "privaterelay":
case "privatetunnel":
case "privatevpn":
case "privnote":
case "probablydance":
case "proctoru":
case "productanalyticsplaybook":
case "producthunt":
case "programmableweb":
case "projectit":
case "promescent":
case "promocodewatch":
case "promodj":
case "promoheads":
case "proofpoint":
case "proovl":
case "proptiger":
case "proteansec":
case "protectedtext":
case "proterra":
case "protonmail":
case "protonvpn":
case "prouddev":
case "proverkassl":
case "proxfree":
case "proxifier":
case "proxy-chrome":
case "proxynova":
case "proxyserver":
case "proxyswitcher":
case "prsformusic":
case "prxbx":
case "psiphon3":
case "psiphonhealthyliving":
case "psiphontoday":
case "psm7"://#tls1.0
case "psmag":
case "psychologytoday":
case "psyhot":
case "ptsecurity":
case "publbox":
case "public.govdelivery":
case "pubnub":
case "pubpeer":
case "pulse-eight":
//(".com")
case "punchthrough":
case "punkrocktheory":
case "punycoder":
case "pupsek":
case "purevolume":
case "purevolumecdn":
case "purevpn":
case "pushbullet":
case "pusher":
case "pushingbox":
case "pwc":
case "px-lab":
case "pyatbaksov":
case "pydio":
case "pysana":
case "quackit":
case "qiberty":
case "qiwi":
case "qmerce":
case "qnap":
case "qnx":
case "qq":
case "qualcomm":
case "qualtrics":
case "qualys":
case "quantserve":
case "quantummetric":
case "queryxchange":
case "quintex":
case "quip":
case "qunitjs":
case "quora":
case "qupzilla":
case "qwant":
case "qwintry":
case "qz":
case "qzzr":
case "rabbitmq":
case "rackcdn":
case "racked":
case "rackspace":
case "radiofarda":
case "radiomarsho":
case "radio-t":
case "radware":
case "rapid7":
case "rapportive":
case "raptu":
case "ravencdn":
case "ravenjs":
case "raventools":
case "rawgit":
case "raxcdn":
//(".com")
case "razerzone":
case "rbth":
case "rdcdn":
case "rdpguard"://#tls1.0
case "rdtcdn":
case "readability":
case "realisticgroup":
case "realtimeboard":
case "realvnc":
case "reaqta":
case "reasoncoresecurity":
case "rebelmouse":
case "receive-sms-online":
case "recordedfuture":
case "recurse":
case "redbubble":
case "reddit":
case "redditblog":
case "redditmedia":
case "redditstatic":
case "red-forum":
case "redhat":
case "redline13":
case "redmondmag":
case "redtram":
case "redtube":
case "redtubepremium":
case "reference":
case "reformgovernmentsurveillance":
case "regex101":
case "remoteshaman":
case "remysharp":
case "requestpolicy":
case "resellerratings":
case "resilio":
case "reuters":
case "revealmobile":
case "reverbnation":
case "reviewthree":
case "revolverlab":
case "revolvy":
case "rhyolite":
case "riastatic":
case "richrelevance":
case "ridecabin":
case "rietta":
case "rigor":
case "ringcentral":
case "ringlabskiev":
case "ripple":
//(".com")
case "ripstech":
case "risovach":
case "ritetag":
case "riverbankcomputing":
case "robertnyman":
case "robtex":
case "rockpapershotgun":
case "rockstargames":
case "rocld":
case "rohitab":
case "rollbar":
case "rollcall":
case "romab":
case "romexsoftware":
case "roscontrol":
case "rosehosting":
case "rospravosudie":
case "rottentomatoes":
case "roundingwell":
case "routeapi":
case "router-reset":
case "rovertask":
case "rpxnow":
case "rssinclude":
case "rstudio":
case "rt":
case "ruby-forum":
case "rucaptcha":
case "rudrastyh":
case "rufabula":
case "rumorbus":
case "runbox":
case "runet-id":
case "rusblock":
case "ruvds":
case "rynok24":
case "s2member":
case "s81c":
case "saas-support":
case "sabressecurity":
case "safaribooksonline":
case "safe-in-cloud":
case "sagemath":
case "sail-horizon":
case "sakh":
case "salesforce":
case "salesforceliveagent":
case "samsaffron":
case "samwhited":
case "sandisk":
case "sap":
//(".com")
case "sapien":
case "sarahjamielewis":
case "sastaservers":
case "satoshibox":
case "saucelabs":
case "savoirfairelinux":
case "sbarjatiya":
case "sbup":
case "sc":
case "scala":
case "scaleway":
case "scanalert":
case "schneier":
case "sciencealert":
case "sciencedaily":
case "scientificamerican":
case "scirra":
case "scoopwhoop":
case "scorecardresearch":
case "scrapinghub":
case "screencast":
case "screenplayscripts":
case "screenshotmachine":
case "scribd":
case "scribdassets":
case "scrutinizer-ci":
case "sdlmedia":
case "se7ensins":
case "searchenginejournal":
case "secondlife":
case "sectorrent":
case "secure.oneallcdn":
case "secureage":
case "secureaplus":
case "securelist":
case "securestate":
case "secur-gsm":
case "securilla":
case "securiteam":
case "securityintelligence":
case "seekingalpha":
case "segment":
case "self-publishingschool":
case "semenkovich":
case "semrush":
case "semycvit":
case "sencha":
case "sendinblue":
case "sendmail":
case "sendpulse":
//(".com")
case "sendspace":
case "sendthisfile":
case "sendvid":
case "sensepost":
case "sensortower":
case "sentinelone":
case "sentrant":
case "seo-akademiya":
case "seochat":
case "seroundtable":
case "serps":
case "serpstat":
case "servedby-buysellads":
case "serverfault":
case "serverpress":
case "servers":
case "servethehome":
case "servicespeedup":
case "serving-sys":
case "sewitacademy":
case "sfdcstatic":
case "sfmta":
case "shadowproof":
case "shakr":
case "shareholder":
case "shareit":
case "sharethis":
case "sharethrough":
case "shatter-box":
case "shazam":
case "shoeshow":
case "shootonline":
case "shopify":
case "shopifyapps":
case "shopperapproved":
case "shotcutapp":
case "shoutmetech":
case "shutterstock":
case "si":
case "sibautomation":
case "sidbala":
case "siemens":
case "siftscience":
case "sigmobile":
case "signalvnoise":
case "silentcircle":
case "siliconangle":
case "simgbb":
case "similarweb":
case "sim-networks":
case "simple":
//(".com")
case "simplecast":
case "simplyislam":
case "singularlabs":
case "sinodun":
case "site24x7":
case "siteground":
case "siteheart":
case "sitepoint":
case "sizzlejs":
case "skimlinks":
case "skipcdn":
case "skiplagged":
case "skladchik":
case "skrill":
case "skype":
case "skypeassets":
case "skypicker":
case "skyscnr":
case "slack":
case "slack-edge":
case "slackhq":
case "slator":
case "slickjump":
case "slidesharecdn":
case "slivskladchik":
case "slotegrator":
case "slproweb":
case "smallhadroncollider":
case "smallnetbuilder":
case "smartblogger":
case "smartertools":
case "smartftp":
case "smartlook":
case "smartrecruiters":
case "smartsuppchat":
case "smashingconf":
case "smashingmagazine":
case "s-microsoft":
case "smofast":
case "smoozed":
case "smscentre":
case "s-msft":
case "smsonline-24":
case "snap":
case "snapchat":
case "snapengage":
case "snapwidget":
case "snazzymaps":
//(".com")
case "snbforums":
case "sndcdn":
case "snipcart":
case "snpedia":
case "snugpak":
case "soasta":
case "socialbakers":
case "socialrank":
case "softcube":
case "softinventive":
case "softonic":
case "softperfect":
case "softserveinc":
case "solidfilescdn":
case "solidfilesusercontent":
case "solidfoundationwebdev":
case "sonic":
case "sophos":
case "soundcloud":
case "sovest":
case "speakerdeck":
case "spectacles":
case "speedcurve":
case "speedify":
case "speedwealthy":
case "spicevpn":
case "spiceworks":
case "spideroak":
case "splitmetrics":
case "splitshire":
case "splone":
case "sporestack":
case "sportarena":
case "spotify":
case "sprashivalka":
case "spreadprivacy":
case "spreadshirt":
case "spreadshirtmedia":
case "springer":
case "sputnik-georgia":
case "sputniknews":
case "sputniknewslv":
case "spyoff":
case "sqrlid":
case "squarefree":
case "squarelovin":
case "squarespace":
case "ssd-life":
case "ssh":
case "sshtools":
//(".com")
case "ssl":
case "ssl247":
case "sslenforcer":
case "sslforfree":
case "ssl-images-amazon":
case "ssllabs":
case "sslmate":
case "sslshopper":
case "ssrn":
case "stackapps":
case "stackcommerce":
case "stackexchange":
case "stackoverflow":
case "stackoverflowbusiness":
case "stackpathdns":
case "stacksocial":
case "stalkscan":
case "starbucks":
case "startmail":
case "startpage":
case "startssl":
case "startupdigest":
case "statcounter":
case "statesreport":
case "static6":
case "static-cisco":
case "static-economist":
case "staticflickr":
case "staticmy":
case "statista":
case "statnews":
case "statoperator":
case "statuscake":
case "stdlib":
case "steamcommunity":
case "steamstatic"://#unsafe-negotiation/#cert
case "steamusercontent":
case "steemit":
case "steemitimages":
case "steganos":
case "stellarinfo":
case "st-hatena":
case "storiesads":
case "stratechery":
case "strchr":
case "streamable":
case "streamablevideo":
case "strikingly":
//(".com")
case "stripchat":
case "stripe":
case "stripecdn":
case "studio-moderna":
case "subgraph":
case "subscene":
case "sugarsync":
case "suishoshizuku":
case "sumologic":
case "sumome":
case "sunhater":
case "sunlightfoundation":
case "superforty":
case "superuser":
case "superutils":
case "surdotly":
case "surfeasy":
case "survivalmonkey":
case "suse":
case "svp-team":
case "swayfinance":
case "swift":
case "swiftinstitute":
case "swiftypecdn":
case "sxsw":
case "symantec":
case "symbianize":
case "syntraffic":
case "sysinternals":
case "system76":
case "systoolsgroup":
case "t8cdn":
case "tacdn":
case "tada":
case "tadst":
case "talosintelligence":
case "tamos":
case "tankionline":
case "taplend":
case "tchkcdn":
case "teamfortress":
case "teamgantt":
case "teamsid":
case "teamtreehouse":
case "teamviewer":
case "techatbloomberg":
case "techathlon":
case "techcrunch":
case "techdirt":
//(".com")
case "techinasia":
case "techlogon":
case "techmesto":
case "technetset":
case "technewsblogs":
case "technologyreview":
case "techpowerup":
case "techspot":
case "techsupportalert":
case "techwalla":
case "techwallacdn":
case "ted":
case "tedcdn":
case "tehnoetic":
case "tekrevue":
case "telegram-store":
case "telenor":
case "telerik":
case "telonko":
case "tempsky":
case "tenable":
case "tenderapp":
case "tenforums":
case "terabyteunlimited":
case "tesla":
case "teslamotors":
case "tether":
case "texnoera":
case "textio":
case "textnow":
case "textslashplain":
case "tgwidget":
case "thawte":
case "the2835":
case "theatlantic":
case "theatlas":
case "thebaffler":
case "thebitcoinstrip":
case "thecustomizewindows":
case "thedailywtf"://#tls1.0
case "the-elch":
case "theglobeandmail":
case "theguardian":
case "thehackerblog":
case "thehackernews":
case "thehacktoday":
case "thehaguesecuritydelta":
case "theice":
case "theinformation":
case "theintercept":
//(".com")
case "theiphonewiki":
case "themembershipguys":
case "themooltipass":
case "thenextweb":
case "theodysseyonline":
case "theoutbound":
case "therealdeal":
case "theredpin":
case "theringer":
case "theroadtodelphi":
case "thescene":
case "thetinhat":
case "theverge":
case "thewindowsclub":
case "thexnews":
case "thexyz":
case "thezdi":
case "thijsbroenink":
case "thinkific":
case "thinkpenguin"://#tls1.0
case "thinkwithgoogle":
case "thismessagewillselfdestruct":
case "thomas-krenn":
case "threatconnect":
case "threatpost":
case "threattrack":
case "thrivemarket":
case "thumbtack":
case "thumbtackstatic":
case "thumbzilla":
case "ticketstravelnetwork":
case "tidal":
case "tigertext":
case "tightvnc":
case "tildacdn":
case "tiltbrush":
case "timeanddate":
case "timezonedb":
case "tineye":
case "tintri":
case "tinyjpg":
case "tinymce":
case "tinypass":
case "tinypng":
case "tinyurl":
case "tip4commit":
case "tipeee":
case "tipsandtricks-hq":
case "tiqcdn":
case "tittygram":
case "tns-ua":
case "tnwcdn":
case "todoist":
case "togetherjs":
//(".com")
case "toggl":
case "tokbox":
case "tomtom":
case "toptal":
case "topvpnsoftware":
case "tornos":
case "tororango":
case "torrentfreak":
case "torrentprivacy":
case "torrentreactor":
case "torrentsmd":
case "total-uninstall":
case "toxstats":
case "tpbclean":
case "tpbonion":
case "tqn":
case "trackduck":
case "tracker-software":
case "trackjs":
case "tradepub":
case "tradingeconomics":
case "tradingview":
case "traffichunt":
case "trailofbits":
case "trans4mind":
case "transact24":
case "transcom":
case "transifex":
case "translatedby":
case "trash-mail":
case "travelsim":
case "trbimg":
case "trellian":
case "trello":
case "trendmd":
case "trevorfox":
case "trialpay":
case "trimage":
case "tripadvisor":
case "tripit":
case "trolleybust":
case "trovit":
case "troyhunt":
case "truckerpath":
case "truste":
case "trustpilot":
case "trustwave":
case "trwaftermarket":
case "tube8":
//(".com")
case "tucloudserver":
case "tuffmail":
case "tunetheweb":
case "tunnelbear":
case "turner":
case "turnon2fa":
case "turtlapp":
case "tutanota":
case "tutorialspoint":
case "tuts4you":
case "tutsplus":
case "tuxdiary":
case "twilio":
case "twimg":
case "twistermc":
case "twitter":
case "twittercommunity":
case "tynt":
case "typepad":
case "typeform":
case "typography":
case "ua-football":
case "ubembed":
case "uber":
case "ubereats":
case "ubi":
case "ubisoft":
case "ubnt":
case "ubuntu":
case "ucdn":
case "udemy":
case "uefa":
case "ukrcash":
case "ukrinform":
case "ukrreferat":
case "ukrsibbank":
case "u-login":
case "ultimatedown":
case "ultraedit":
case "ultrasurf-ru":
case "umblr":
case "unchecky":
case "unhandledexpression":
case "uni-delivery":
case "unionmetrics":
case "unitedplatform":
case "unitrade-express":
case "unity":
case "unity3d":
case "universalsrc":
case "unlockforus":
case "unpkg":
//(".com")
case "unsplash":
case "untappd":
case "up-4ever":
case "upguard":
case "uploadkadeh":
case "uploadvr":
case "uptimerobot":
case "upwork":
case "urbandictionary":
case "urchin":
case "url2png":
case "usatoday":
case "usbkill":
case "usemessages":
case "useoppty":
case "useproof":
case "userapi":
case "usercdn":
case "userecho":
case "useremarkable":
case "userlane":
case "userlike":
case "userscloud":
case "usersnap":
case "uservoice":
case "usndr":
case "utf8icons":
case "utorrent":
case "uvcdn":
case "uvnimg":
case "uzhnet":
case "vandyke":
case "vanillaforums":
case "varonis":
case "varvy":
case "veddro":
case "veeam":
case "veesp":
case "veil-framework":
case "veinteractive":
case "venmo":
case "venturebeat":
case "ventusky":
case "veracode":
case "verasafe":
case "verigio":
case "verisign":
case "verisignlabs":
case "veritas":
//(".com")
case "vessoft":
case "vevo":
case "vg247":
case "viapush":
case "viber":
case "viblast":
case "vice":
case "victorshi":
case "victorymerch":
case "victoryrecords":
case "videohelp":
case "videoyoutubedownloader":
case "vidora":
case "vidyard":
case "vidyow":
case "viewedit":
case "vikingvpn":
case "vimeo":
case "vimeocdn":
case "vinbazar":
case "vindicosuite":
case "vinditek":
case "vingrad":
case "vino75":
case "vircurex":
case "virgilsecurity":
case "virusbulletin":
case "virustotal":
case "virwire":
case "visualstudio":
case "visualstudiomagazine":
case "vivaldi":
case "vivatao":
case "vk":
case "vk-cc":
case "vlada-rykova":
case "vlasovstudio":
case "vmware":
case "vocajs":
case "vocal":
case "voidtools":
case "voodooshield":
case "vox":
case "vox-cdn":
case "voximplant":
case "voxmedia":
case "vpnbook":
case "vpncritic":
case "vpnme":
case "vpnmentor":
case "vpnranks":
case "vpnreviewer":
//(".com")
case "vpnreviewz":
case "vpntunnel":
case "vporn":
case "vpsserver":
case "vsanatorii":
case "vsavkin":
case "vulnhub":
case "vultr":
case "vuze":
case "w3bin":
case "w3schools":
case "w3techs":
case "walkerinfo":
case "walkme":
case "walletone":
case "wallsnroof":
case "walmart":
case "walmartimages":
case "wamba":
case "washingtonpost":
case "wayforpay":
case "waze":
case "weaponsofheroes":
case "weather":
case "webanketa":
case "webcamtoy":
case "webcodegeeks":
case "webcompat":
case "webdavsystem":
case "webdevwonders":
case "webhostbug":
case "webhostinggeeks":
case "webhostinghub":
case "webmasterworld":
case "weborama":
case "webpagefx":
case "webroot":
case "webrtchacks":
case "websequencediagrams":
case "websetnet":
case "webthemez":
case "webtrustukraine":
case "webtype":
case "webvisor":
case "webzilla":
case "welivesecurity":
case "westbyte":
case "westernunion":
case "westsidewholesale":
case "wetransfer":
//(".com")
case "wevideo":
case "wfxtriggers":
case "what3words":
case "whatbrowser":
case "whatismyip":
case "whatismyreferer":
case "whatleaks":
case "whatsapp":
case "wheretowatch":
case "whisk":
case "whitecase":
case "whitemobi":
case "whois-search":
case "whosarat":
case "whosdown":
case "wickr":
case "widevine":
case "widgetgen":
case "wilderssecurity":
case "wileyfox":
case "willshouse":
case "wimsbios":
case "windows8downloads":
case "windows-commandline":
case "windowsphone":
case "windscribe":
case "windsockusa":
case "windstream":
case "winsetupfromusb":
case "wintoflash":
case "winudf":
case "wire":
case "wirecdn":
case "wired":
case "wirexapp":
case "wisepass":
case "wistia":
case "witget":
case "withgoogle":
case "withoomph":
case "wixstatic":
case "wizzair":
case "wlanpros":
case "wmtransfer":
case "woelkli":
case "wolfram":
case "wolframalpha":
case "wolframcdn":
case "womentechmakers":
case "womenwhocode":
case "wondershare":
//(".com")
case "woolyss":
case "wordcounttools":
case "wordfence":
case "wordpress":
case "workramp":
case "workupload":
case "worldcuprussia":
case "worldofwarcraft":
case "wp":
case "wpengine":
case "wpvulndb":
case "wrike":
case "wsimg":
case "wsj":
case "wtfast":
case "wtigga":
case "wtrfall":
case "wunderground":
case "wunderlist":
case "wxug":
case "xabber":
case "xapo":
case "xboxlive":
case "xda-cdn":
case "xda-developers":
case "xhamster":
case "xhamsterlive":
case "xhcdn":
case "xkcd":
case "xml-sitemaps":
case "xn----7sbh1bxa"://ma-vr.com (cyrillic)
case "xn--80abmue"://belka.com (cyrillic)
case "xn----8sbkdqibmrdgt3a"://credit-online.com (cyrillic)
case "xo":
case "x-plarium":
case "xsolla":
case "xtendify":
case "xudongz":
case "xujan":
case "yablyk":
case "yahoo":
case "yahooapis":
case "yandex":
case "yandexdatafactory":
case "yaplakal":
case "yarnpkg":
case "yayfon":
case "ycombinator":
//(".com")
case "yelp":
case "yoast":
case "yotpo":
case "yottlyscript":
case "yottos":
case "youdo":
case "youpartnerwsp":
case "youporn":
case "yourbittorrent":
case "yourmembership":
case "youtube":
case "youtubedownloader":
case "youtubeeducation":
case "youtubegaming":
case "youtubego":
case "youtubeinmp3":
case "youtube-nocookie":
case "youtubesaver":
case "youtube-saver":
case "ytimg":
case "yubico":
case "yurichev":
case "zadarma":
case "zagranitsa":
case "zakird":
case "zarafa":
case "zcashcommunity":
case "zdassets":
case "zeltser":
case "zendesk":
case "zenithmedia":
case "zenmate":
case "zeranoe":
case "zerodium":
case "zerossl":
case "zerotier":
case "zhovner":
case "ziffdavis":
case "zillya":
case "zilore":
case "zimbio":
case "zimbra":
case "zimperium":
case "zingaya":
case "zinoui":
case "zkillboard":
case "zmags":
case "znak":
case "zoho":
case "zohodiscussions":
case "zohostatic":
//(".com")
case "zoiper":
case "zoomsupport":
case "zopim":
case "zscaler":
case "zulius":
case "zvooq":
case "zynamics":
case "zyteli":
bCatch=true;break;
//(".com")
case "abtosoftware":if(Dom[2]==="")bCatch=true;break;
case "ackuna":if(Dom[2]===""||URI.path==="/favicon.png"||URI.path.startsWith("/conversions/")||URI.path.startsWith("/css/")||URI.path.startsWith("/fonts/")||URI.path.startsWith("/img/")||URI.path.startsWith("/js/")||URI.path.startsWith("/timthumb/"))bCatch=true;break;
case "actiprosoftware":if(URI.path.startsWith("/App_Sprites/")||URI.path.startsWith("/content/")||URI.path.startsWith("/scripts/")||URI.path.startsWith("/Scripts/"))bCatch=true;break;
case "add0n":if(Dom[2]===""||Dom[2]==="cdn"||Dom[2]==="www")bCatch=true;break;
case "adobedtm":if(Dom[2]==="assets")bCatch=true;break;
case "alllossless":if(URI.path.startsWith("/cdn-cgi/"))bCatch=true;break;
case "allmusic":if(Dom[2]==="cdn-gce"||Dom[2]==="zt")bCatch=true;break;
case "androidfilehost":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "androidpolice":if(Dom[2]==="www"&&(URI.path.startsWith("/wordpress/")||URI.path.startsWith("/wp-content/")))bCatch=true;break;
case "apollodata":if(Dom[2]===""||Dom[2]==="dev-blog"||Dom[2]==="www")bCatch=true;break;
case "auslogics":if(Dom[2]==="www")bCatch=true;break;
case "avangate":if(Dom[2]==="www"&&(URI.path==="/favicon.ico"||URI.path.startsWith("/assets/")||URI.path.startsWith("/docs/")||URI.path.startsWith("/resources/")||URI.path.startsWith("/temp/")))bCatch=true;break;
case "barisderin":if(Dom[2]==="")bCatch=true;break;
case "bizrate":if(Dom[2]==="medals")bCatch=true;break;
case "blackberry":if(URI.path.startsWith("/content/")||URI.path.startsWith("/etc/"))bCatch=true;break;
case "blizzard":if(URI.path.startsWith("/static/"))bCatch=true;break;
case "botbi":if(Dom[2]===""||Dom[2]==="images")bCatch=true;break;
case "bronto":if(Dom[2]==="cdn"||URI.path.startsWith("/wp-content/")||URI.path.startsWith("/wp-includes/"))bCatch=true;break;
case "bugmenot":if(URI.path.startsWith("/cdn-cgi/"))bCatch=true;break;
case "businessinsider":if(Dom[2].startsWith("static")||URI.path.startsWith("/assets/")||URI.path.startsWith("/esi/"))bCatch=true;break;
case "buydig":if(URI.path.startsWith("/Assets/")||URI.path.startsWith("/assets/"))bCatch=true;break;
case "cheatsheet":if(URI.path.startsWith("/wp-content/"))bCatch=true;break;
case "cloudinary":if(Dom[2].startsWith("res")||URI.path.startsWith("/images/")||URI.path.startsWith("/javascripts/")||URI.path.startsWith("/stylesheets/"))bCatch=true;break;
case "crimea":if(Dom[2]==="chbrr")bCatch=true;else if(Dom[2]==="erblock")subject.cancel(Components.results.NS_BINDING_ABORTED);break;
case "devshed":if(Dom[2]==="images")bCatch=true;break;
case "dyn":if(Dom[2]===""||Dom[2]==="help")bCatch=true;break;
//(".com")
case "ebay":
{
    if(Dom[2]==="api"||Dom[2]==="ocsnext"||Dom[2]==="reg"||Dom[2]==="signin")bCatch=true;
    else if(isDocument&&Dom[2]==="www"&&(
    (delim=URI.path.indexOf("?_trk"))>0||
    (delim=URI.path.indexOf("&_trk"))>0||
    (delim=URI.path.indexOf("&hash="))>0||
    (delim=URI.path.indexOf("?hash="))>0))
    {
        var NewURI=URI.clone();
        NewURI.path=NewURI.path.substr(0,delim);
        subject.redirectTo(NewURI);
    }
}break;
//(".com")
case "economist":if(Dom[2]==="careers-network"||Dom[2]==="execed"||Dom[2]==="gmat"||Dom[2]==="gre"||Dom[2]==="jobs"||URI.path.startsWith("/_Incapsula_Resource?"))bCatch=true;break;
case "eltonjohn":if(Dom[2]==="support"||Dom[2]==="thecut"||(Dom[2]==="www"&&(URI.path.startsWith("/wp-content/")||URI.path.startsWith("/wp-includes/"))))bCatch=true;break;
case "emsisoft":if(Dom[2]==="cc"||Dom[2]==="decrypter"||Dom[2]==="static"||Dom[2]==="support"||Dom[2]==="www"||URI.path.startsWith("/wp-content/themes/")||URI.path.startsWith("/wp-content/uploads/"))bCatch=true;break;
case "espn":if(Dom[2]==="secure")bCatch=true;break;
case "eurosportplayer":if(Dom[2]==="i"||Dom[2]==="layout")bCatch=true;break;
case "fileflac":if(URI.path.startsWith("/cdn-cgi/"))bCatch=true;break;
case "formilla":if(Dom[2]==="www"&&(URI.path.startsWith("/blog/")||URI.path.startsWith("/css/")||URI.path.startsWith("/formilla-chat.asmx/")||URI.path.startsWith("/images/")||URI.path.startsWith("/img/")||URI.path.startsWith("/js/")||URI.path.startsWith("/remoteAssets/")||URI.path.startsWith("/ScriptResource.axd?")||URI.path.startsWith("/scripts/")||URI.path.startsWith("/userfiles/")||URI.path.startsWith("/WebResource.axd?")))bCatch=true;break;
case "fssta":if(Dom[2]==="a")bCatch=true;break;
case "funkysouls":if(isDocument&&URI.prePath==="http://forum.funkysouls.com")cookieSet(subject,"forum.funkysouls.com.txt");break;//#cookie
case "glassdoor":if(Dom[2]===""||Dom[2]==="media"||Dom[2].startsWith("static")||Dom[2]==="www")bCatch=true;break;
case "go":if((Dom[2]==="abc"&&Dom[3]==="merlin")||(Dom[2]==="registerdisney"&&Dom[3]==="cdn"))bCatch=true;break;
case "guidingtech":if(URI.path.startsWith("/cdn-cgi/"))bCatch=true;break;
case "guru3d":if(Dom[2]==="www")bCatch=true;break;
case "halalgoogling":if(URI.path==="/style.css"||URI.path.startsWith("/css/")||URI.path.startsWith("/images/")||URI.path.startsWith("/js/")||URI.path.startsWith("/userdata/"))bCatch=true;break;
case "huffpost":if(Dom[2]==="i"||Dom[2]==="img"||Dom[2]==="m"||Dom[2]==="s")bCatch=true;break;
case "idownloadblog":if(Dom[2]==="media")bCatch=true;break;
case "ilovefreesoftware":if(Dom[2]==="cdn"&&(URI.path.startsWith("/wp-content/plugins/")||URI.path.startsWith("/wp-content/themes/")||URI.path.startsWith("/wp-includes/js/")))bCatch=true;break;
//(".com")
case "imdb":
{
    if(Dom[2]==="secure")bCatch=true;
    else if(isDocument&&(
    (delim=URI.path.indexOf("?pf_"))>0||
    (delim=URI.path.indexOf("?ref_="))>0||
    (delim=URI.path.indexOf("&ref_="))>0))
    {
        var NewURI=URI.clone();
        NewURI.path=NewURI.path.substr(0,delim);
        subject.redirectTo(NewURI);
    }
}break;
//(".com")
case "introbar":if(Dom[2]==="cdn")bCatch=true;break;
case "ispringsolutions":if(Dom[2]==="www"&&URI.path.startsWith("/ispring_bitrix/"))bCatch=true;break;
case "ivave":if(Dom[2]==="")bCatch=true;break;
case "ixbt":if(URI.path.startsWith("/cgi-bin/")||URI.path.startsWith("/js/")||(Dom[2]==="forum"&&URI.path.indexOf(".cgi?")<0&&(URI.path.endsWith(".css")||URI.path.endsWith(".gif")||URI.path.endsWith(".ico")||URI.path.endsWith(".js")||URI.path.endsWith(".png"))))bCatch=true;break;
case "javhd":if(Dom[2]==="static")bCatch=true;break;
case "janrain":if(Dom[2]==="cdn-social"||Dom[2]==="dashboard"||URI.path.startsWith("/wp-admin/")||URI.path.startsWith("/wp-content/")||URI.path.startsWith("/wp-includes/"))bCatch=true;break;
case "jwplatform":if(Dom[2]==="content")bCatch=true;break;
case "kellyservices":if(Dom[2]==="sp")bCatch=true;break;
case "kerio":if(Dom[2]!=="download")bCatch=true;break;
case "kitware":if(Dom[2]==="blog"||Dom[2]==="gitlab"||URI.path==="/kitware.css"||URI.path==="/layout.css"||URI.path.startsWith("/cdash/")||URI.path.startsWith("/img/")||URI.path.startsWith("/js/")||URI.path.startsWith("/slideshow/")||URI.path.startsWith("/SpryAssets/"))bCatch=true;break;
case "koehn":if(Dom[2]==="search")bCatch=true;break;
case "kratko-news":if(URI.path==="/favicon.ico"||URI.path.startsWith("/wp-content/")||URI.path.startsWith("/wp-includes/"))bCatch=true;break;
case "lenovo":if(Dom[2]==="support")bCatch=true;break;
case "libiquity":if(Dom[2]==="shop")bCatch=true;break;
case "livecustomer":if(Dom[2]==="chat")bCatch=true;break;
case "look-at-media":if(Dom[2]==="auth")bCatch=true;break;
case "macys":if(Dom[2]==="assets")bCatch=true;break;
case "mailchimp":if(Dom[2]===""||Dom[2]==="blog"||Dom[2]==="cdn-images"||Dom[2]==="static")bCatch=true;break;
case "mashable":if(Dom[2]==="aws")bCatch=true;break;
case "mashape":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "mediafire":if(Dom[2]==="cdn"||Dom[2]==="cdnssl"||(Dom[2]==="www"&&(URI.path==="/blank.html"||URI.path==="/favicon.ico"||URI.path.startsWith("/images/")||URI.path.startsWith("/templates/"))))bCatch=true;break;
//(".com")
case "microsoft":
{
    switch(Dom[2])
    {
    case "":
    case "account":
    case "ajax":
    case "answers":
    case "azure":
    case "bingads"://#tls1.0
    case "build":
    case "c":
    case "cs":
    case "developer":
    case "docs":
    case "download":
    case "go":
    case "iecvlist":
    case "msdn":
    case "msrc":
    case "news":
    case "premier":
    case "privacy":
    case "social":
    case "techcommunity":
    case "technet":
    case "update":
    case "vlscppe":
    case "www":
    bCatch=true;break;
    case "support":if(URI.host==="fud.community.services.support.microsoft.com")bCatch=true;break;
    }
}break;
//(".com")
case "mobile-review":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;//#tls1.0
case "mobipicker":if(Dom[2]==="cdn")bCatch=true;break;
case "msi":if(Dom[2]!=="download")bCatch=true;break;
case "openwpm":if(Dom[2]==="audiofingerprint")bCatch=true;break;
case "opera":if(Dom[2]==="addons"||Dom[2]==="auth"||Dom[2]==="blogs"||Dom[2]==="dev"||Dom[2]==="www")bCatch=true;break;
case "oracle":if(Dom[2]==="www"&&(URI.path.startsWith("/assets/")||URI.path.startsWith("/us/assets/")))bCatch=true;break;
case "osxdaily":if(Dom[2]==="cdn")bCatch=true;break;
case "pagepeeker":if(Dom[2]==="")bCatch=true;break;
case "pcmag":if(Dom[2]==="g"||Dom[2]==="sm"||Dom[2]==="static"||Dom[2]==="uk")bCatch=true;break;
case "performgroup":if(Dom[2]==="images")bCatch=true;break;
case "prntscr":if(Dom[2]==="st"||URI.path.startsWith("/cdn-cgi/"))bCatch=true;break;
case "qwertyoruiop":if(Dom[2]==="yalu")bCatch=true;break;
case "readypulse":if(Dom[2]==="widgets")bCatch=true;break;
case "real":if(Dom[2]==="customer")bCatch=true;break;
case "recruiterbox":if(Dom[2]==="app"||URI.path.startsWith("/static/"))bCatch=true;break;
case "redcafestore":if(Dom[2]==="my")bCatch=true;break;
case "reddpics":if(URI.path.startsWith("/assets/"))bCatch=true;break;
case "ria":if(Dom[2]!=="avia")bCatch=true;break;
case "ru-board":if(Dom[2]==="forum")bCatch=true;break;
case "sharepoint":if(Dom[2]!=="")bCatch=true;break;
case "sitefinity":if(Dom[2]==="dec")bCatch=true;break;
case "slingbox":if(Dom[2]==="community")bCatch=true;break;
case "smotri":if(Dom[2]==="pics")bCatch=true;break;
case "sportsdirect":if(Dom[2]==="images"||(Dom[2]==="www"&&(URI.path.startsWith("/DesktopModules/")||URI.path.startsWith("/images/")||URI.path.startsWith("/portals/")||URI.path.startsWith("/Telerik.Web.UI.WebResource.axd?")||URI.path.startsWith("/WebResource.axd?"))))bCatch=true;break;
case "syncfusion":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "trustev":if(Dom[2]==="app")bCatch=true;break;
//(".com")
case "tumblr":
{
    switch(Dom[2])
    {
    case "": case "a": case "api": case "assets": case "defaultnamehere":
    case "embed": case "engineering": case "flickr": case "grugq": case "httpshaming":
    case "liebach": case "lifeatyahoo": case "marcheswoo": case "media": case "montereybayaquarium": case "mx":
    case "natawhat": case "nathanwentworth": case "platform": case "puxlit": case "srvcs": case "staff":
    case "static": case "tm319": case "v": case "victorinox-japan": case "vt": case "wongmjane":
    case "www": case "yahoo": case "yahooaccessibility": case "yahooadvertising": case "yahooanswers": case "yahooaviate":
    case "yahoomail": case "yahoomessenger": case "yahoopolicy": case "yahooresearch": case "yahoosearch": case "yahoo-security":
    bCatch=true;break;
    }
}break;
//(".com")
case "upaiyun":if(Dom[2]==="b0"&&Dom[3]==="upcdn")bCatch=true;break;
case "uvnc":if(isDocument&&URI.spec.startsWith("http://support1.uvnc.com/download/"))//#referer
subject.setRequestHeader("Referer","http://www.uvnc.com",false);break;
case "valvesoftware":if(Dom[2]==="developer")bCatch=true;break;
case "vellumatlanta":if(Dom[2]==="blog")bCatch=true;break;
case "versalpark":if(URI.path.startsWith("/css/")||URI.path.startsWith("/img/")||URI.path.startsWith("/js/"))bCatch=true;break;
case "viva64":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "voanews":if(Dom[2]==="gdb"||Dom[2]==="www")bCatch=true;break;
case "weebly":if(Dom[2]===""||Dom[2]==="www"||URI.path.startsWith("/files/"))bCatch=true;break;
case "whatismyipaddress":if(Dom[2]==="cdn"||Dom[2]==="forums")bCatch=true;break;
case "yimg":if(Dom[2]==="s")bCatch=true;break;
case "zakupka":if(Dom[2]==="blog"||Dom[2]==="images"||Dom[2]==="static"||URI.path.startsWith("/files/")||URI.path.startsWith("/inc/")||URI.path.startsWith("/lego/")||URI.path.startsWith("/local_files/")||URI.path.startsWith("/pics/")||URI.path.startsWith("/reg/")||URI.path.startsWith("/registration/")||URI.path.startsWith("/tpl/")||URI.path.startsWith("/track-image/"))bCatch=true;break;
case "zemanta":if(Dom[2]==="img"||Dom[2]==="one"||URI.path.startsWith("/cdn-cgi/")||URI.path.startsWith("/wp-content/")||URI.path.startsWith("/wp-includes/"))bCatch=true;break;
}break;

case "community":/*!!!*/
if(Dom[1]==="unix")bCatch=true;break;

case "coop":/*!!!*/
if(Dom[1]==="snowdrift")bCatch=true;break;

case "cr":/*!!!*/
switch(Dom[1])
{
case "kat":
case "mir"://#cert
case "rutracker":
case "youtube":
bCatch=true;break;
case "co":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "cricket":/*!!!*/
if(Dom[1]==="unlockpro")bCatch=true;break;

case "cu":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "cv":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "cx":/*!!!*/
switch(Dom[1])
{
case "multimedia":
case "ring":
bCatch=true;break;
}break;

case "cy":/*!!!*/
if(Dom[1]==="com"&&(Dom[2]==="2gis"||Dom[2]==="blogspot"||Dom[2]==="google"))bCatch=true;break;

case "cz":/*!!!*/
switch(Dom[1])
{
case "2gis":
case "alza":
case "bitster":
case "bivs":
case "blogspot":
case "brmlab":
case "brutalassault":
case "czc":
case "decodoma":
case "dnssec-validator":
case "emkei":
case "flatfy":
case "funtasysport":
case "google":
case "heureka":
case "im":
case "im9":
case "knihcentrum":
case "knot-dns":
case "mall":
case "nic":
case "notino":
case "prodejparfemu":
case "sdilej":
case "seznam":
case "shoproku":
case "solidpixels":
case "szn":
case "turris":
case "youtube":
bCatch=true;break;
}break;

case "dance":/*!!!*/
if(Dom[1]==="coin")bCatch=true;break;

case "dating":/*!!!*/
if(Dom[1]==="pure")bCatch=true;break;

case "de":/*!!!*/
switch(Dom[1])
{
//(".de")
case "aix-cloud":
case "aixpro":
case "alditalk":
case "anonym-surfen":
case "b1-systems":
case "base64-image":
case "bayern":
case "ben-stock":
case "bitsofco":
case "blaucloud":
case "blogspot":
case "blutmagie":
case "bund":
case "c3d2":
case "citizen-cam":
case "cloudu":
case "cure53":
case "datenspuren":
case "denic":
case "deskmodder":
case "dzne":
case "edv-luehr":
case "emsisoft":
case "enaikoon":
case "energy-charts":
case "entropia":
case "fabiankeil":
case "fobos":
case "fr32k":
case "fraunhofer":
case "freeshell":
case "freeware":
case "gehrcke":
case "geraspora":
case "giz":
case "google":
case "heise":
case "hermes-net":
case "hetzner":
case "hhu":
case "hhunetsec":
case "hosttest":
case "icanprove":
case "ioam":
case "iridiumbrowser":
case "ix":
case "kuketz-blog":
case "lidl":
case "manitu":
case "metager":
case "mh-nexus":
case "motorola":
case "newsletter2go":
case "nimmerland":
case "ocloud":
case "palant":
case "parckwart":
case "paviro":
case "perfectpixel":
case "perlgeek":
case "phihag":
case "posteo":
case "qxxq":
case "schnellno":
case "searx":
case "sempervideo":
case "spreadshirt":
case "suma-ev":
case "taz":
case "teamhack":
case "techregion":
case "thawte":
case "tician":
case "tu-dresden":
case "uberspace":
case "uni-duesseldorf":
case "uni-hannover":
case "viscircle":
case "wauland":
case "wolkesicher":
case "youtube":
case "zwiebelfreunde":
bCatch=true;break;
//(".de")
case "abload":if(URI.path.startsWith("/res/")||URI.path.startsWith("/thumb/"))bCatch=true;break;
case "bestblog":if(isTorRedirect())
{
    var NewURI=URI.clone();
    NewURI.host="tpq5sxk5cgdf35uq.onion";
    subject.redirectTo(NewURI);
}break;
case "ccc":if(Dom[2]==="events")bCatch=true;break;
case "com":if(Dom[2]==="sound-park")bCatch=true;break;
case "elaon":if(Dom[2]==="suche")bCatch=true;break;
case "gotrust":if(Dom[2]==="searx")bCatch=true;break;
case "i2p2":if(Dom[2]==="trac")bCatch=true;break;
}break;

case "dj":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "dk":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "computerworld":
case "cryptoparty":
case "google":
case "gratisdns":
case "it-jobbank":
case "nianet":
case "radio24syv":
case "searx":
case "simonclausen":
case "youtube":
bCatch=true;break;
}break;

case "dm":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "do":/*!!!*/
switch(Dom[1])
{
case "google":
case "smartprogress":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "dz":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "ec":/*!!!*/
switch(Dom[1])
{
case "google":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
case "rus":if(Dom[2]==="lib")bCatch=true;break;
}break;

case "edu":/*!!!*/
switch(Dom[1])
{
case "chapman":
case "cmd":
case "example":
case "harding":
case "iu":
case "mit":
case "northwestern":
case "princeton":
case "sans":
case "stanford":
case "udel":
case "uh":
case "uic":
case "utdallas":
case "vanderbilt":
case "washington":
bCatch=true;break;
case "berkeley":if(Dom[2]==="eecs"||URI.path==="/favicon.ico"||URI.path.startsWith("/cache/")||URI.path.startsWith("/fonts/")||URI.path.startsWith("/images/")||URI.path.startsWith("/js/")||URI.path.startsWith("/wp-content/"))bCatch=true;break;
case "colorado":if(Dom[2]==="fedauth"||URI.path.startsWith("/profiles/")||URI.path.startsWith("/sites/"))bCatch=true;break;
case "mit":if(Dom[2]==="scratch"||Dom[2]==="web")bCatch=true;break;
case "wisc":if(Dom[2]==="kb")bCatch=true;break;
}break;

case "ee":/*!!!*/
switch(Dom[1])
{
case "bestapartments":
case "dreamo":
case "eev":
case "fastvps":
case "google":
case "hansa":
case "lhv":
case "pmo":
case "postimees":
case "softkey":
case "sputnik-news":
case "swedbank":
case "upload":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="blogspot"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "eg":/*!!!*/
if(Dom[1]==="com"&&(Dom[2]==="blogspot"||Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "email":/*!!!*/
switch(Dom[1])
{
case "mailinabox":
case "mytemp":
bCatch=true;break;
}break;

case "engineering":/*!!!*/
if(Dom[1]==="slack")bCatch=true;break;

case "es":/*!!!*/
switch(Dom[1])
{
case "emsisoft":
case "google":
case "itmag":
case "itun":
case "newsletter2go":
case "osi":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="blogspot"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "et":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "eu":/*!!!*/
switch(Dom[1])
{
case "5670":
case "americascardroom":
case "botconf":
case "certum"://#tls1.0
case "chainfire":
case "dcentproject":
case "diasp":
case "digitalcityindex":
case "dnscrypt":
case "e-manual":
case "emsisoft":
case "european-privacy-seal":
case "exante":
case "fondy":
case "google":
case "heraut":
case "infobus":
case "itunix":
case "juliareda":
case "lcsnet":
case "movim":
case "mrtino":
case "neos":
case "nslookup":
case "ping":
case "rightcopyright":
case "s3arch":
case "secureupload":
case "thepiratebeach":
case "time4vps":
case "torrentz2":
case "traceroute":
case "tracert":
case "unbubble":
case "webbug":
bCatch=true;break;
case "uvnc":if(isDocument&&URI.spec.startsWith("http://www.unvc.eu/download/"))//#referer
subject.setRequestHeader("Referer","http://www.uvnc.com",false);break;
case "voidlinux":if(Dom[2]==="build"||Dom[2]==="forum"||Dom[2]==="repo"||Dom[2]==="wiki")bCatch=true;break;
case "xenobite":if(Dom[2]==="torcheck")bCatch=true;break;
}break;

case "events":/*!!!*/
switch(Dom[1])
{
case "itweekend":
case "unlocked":
bCatch=true;break;
}break;

case "example":/*!!!*/
subject.cancel(Components.results.NS_BINDING_ABORTED);break;

case "exchange":/*!!!*/
if(Dom[1]==="duty")bCatch=true;break;

case "exit":/*!!!*/
subject.cancel(Components.results.NS_BINDING_ABORTED);break;

case "expert":/*!!!*/
if(Dom[1]==="kurs")bCatch=true;break;

case "faith":/*!!!*/
if(Dom[1]==="usunblock")bCatch=true;break;

case "fi":/*!!!*/
switch(Dom[1])
{
case "ahmia":
case "blogspot":
case "google":
case "hsivonen":
case "klikki":
case "youtube":
bCatch=true;break;
case "nn":if(Dom[2]==="parazite")bCatch=true;break;
case "pp":if(Dom[2]==="parazite")bCatch=true;break;
}break;

case "fj":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "fm":/*!!!*/
switch(Dom[1])
{
case "anchor":
case "apps":
case "ask":
case "audiobox":
case "baltika":
case "files":
case "google":
case "hightech":
case "last":
case "lst":
case "myzuka":
case "pir":
case "player":
case "spec":
bCatch=true;break;
}break;

case "fo":/*!!!*/
if(Dom[1]==="archive")bCatch=true;break;

case "fr":/*!!!*/
switch(Dom[1])
{
case "afnic":
case "aquilenet":
case "blogspot":
case "charliehebdo":
case "cnil":
case "courdecassation":
case "derpy":
case "emsisoft":
case "fiat-tux":
case "google":
case "handbrake":
case "idrix":
case "imirhil":
case "infini":
case "inria":
case "inrialpes":
case "irif":
case "newsletter2go":
case "obspm":
case "roflcopter":
case "trendmicro":
case "veracrypt":
case "weborama":
case "youtube":
bCatch=true;break;
case "homecomputing":if(Dom[2]==="search")bCatch=true;break;
case "irisa":if(Dom[2]==="fpcentral")bCatch=true;break;
}break;

case "fund":/*!!!*/
switch(Dom[1])
{
case "cyber":
case "opentech":
bCatch=true;break;
}break;

case "ga":/*!!!*/
switch(Dom[1])
{
case "alilialili":
case "cr4wl":
case "google":
bCatch=true;break;
}break;

case "garden":/*!!!*/
if(Dom[1]==="oversight")bCatch=true;break;

case "gd":/*!!!*/
switch(Dom[1])
{
case "is":
case "v":
bCatch=true;break;
}break;

case "ge":/*!!!*/
switch(Dom[1])
{
case "google":
case "radiotavisupleba":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="yandex")bCatch=true;break;
}break;

case "gf":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "gg":/*!!!*/
switch(Dom[1])
{
case "ddg":
case "discord":
case "dm":
case "google":
bCatch=true;break;
}break;

case "gh":/*!!!*/
if(Dom[1]==="com"&&(Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "gi":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "gl":/*!!!*/
switch(Dom[1])
{
case "gnu":
case "goo":
case "google":
bCatch=true;break;
}break;

case "global":/*!!!*/
if(Dom[1]==="wint")bCatch=true;break;

case "gm":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "google":/*!!!*/
bCatch=true;break;

case "gov":/*!!!*/
switch(Dom[1])
{
case "cbp":
case "cdc":
case "census":
case "cio":
case "cpsc":
case "dc":
case "dhs":
case "dni":
case "donotcall":
case "fbi":
case "fbijobs":
case "fcc":
case "fda":
case "federalregister":
case "ftc":
case "georgia":
case "greatagain":
case "gsa":
case "gsaadvantage":
case "house":
case "ice":
case "investor":
case "justice":
case "loc":
case "manufacturing":
case "nasa":
case "nih":
case "nist":
case "opm":
case "privacyshield":
case "sec":
case "state":
case "supremecourt":
case "time":
case "treasury":
case "usa":
case "us-cert":
case "ustr":
case "whitehouse":
bCatch=true;break;
}break;

case "gp":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "gr":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "emsisoft":
case "google":
case "void":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "gratis":/*!!!*/
if(Dom[1]==="soundpark")bCatch=true;break;

case "gt":/*!!!*/
switch(Dom[1])
{
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "guru":/*!!!*/
switch(Dom[1])
{
case "gdz":
case "hsl":
bCatch=true;break;
}break;

case "gy":/*!!!*/
switch(Dom[1])
{
case "ef":
case "google":
case "snag":
bCatch=true;break;
}break;

case "help":/*!!!*/
if(Dom[1]==="zaborona")bCatch=true;break;

case "hk":/*!!!*/
switch(Dom[1])
{
case "2ch":
case "blogspot":
case "google":
case "hkdnr":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "hn":/*!!!*/
switch(Dom[1])
{
case "google":
case "youtube":
bCatch=true;break;
}break;

case "host":/*!!!*/
switch(Dom[1])
{
case "relcom":
case "unlockpro":
bCatch=true;break;
}break;

case "hosting":/*!!!*/
if(Dom[1]==="fastvps")bCatch=true;break;

case "hr":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "download":
case "google":
case "kiboke-studio":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="youtube")bCatch=true;break;
}break;

case "ht":/*!!!*/
switch(Dom[1])
{
case "google":
case "myip":
case "vpn":
bCatch=true;break;
}break;

case "hu":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "potato":
case "shiki":
case "youtube":
bCatch=true;break;
case "co":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "i2p":/*!!!*/
subject.cancel(Components.results.NS_BINDING_ABORTED);break;

case "id":/*!!!*/
switch(Dom[1])
{
case "kaskus":
case "youtubego":
bCatch=true;break;
case "co":if(Dom[2]==="blogspot"||Dom[2]==="google"||Dom[2]==="kaskus"||Dom[2]==="youtube"||Dom[2]==="youtubego")bCatch=true;break;
}break;

case "ie":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "equalit":
case "google":
case "independent":
case "virginmediatv":
case "youtube":
bCatch=true;break;
case "akeo":if(Dom[2]==="rufus")bCatch=true;break;
}break;

case "il":/*!!!*/
if(Dom[1]==="co"&&(Dom[2]==="blogspot"||Dom[2]==="cashback"||Dom[2]==="google"||Dom[2]==="maccabi-tlv"||Dom[2]==="youtube"))bCatch=true;break;

case "im":/*!!!*/
switch(Dom[1])
{
case "adium":
case "antidote":
case "cbox":
case "chatme":
case "conversations":
case "crisp":
case "dlab":
case "ejabberd":
case "gitter":
case "google":
case "grouvi":
case "livesport":
case "lut":
case "pidgin":
case "plus":
case "point":
case "prosody":
case "ricin":
case "ricochet":
case "riot":
case "shrinks":
case "sib":
case "silence":
case "spot":
case "toss":
case "tox":
case "zloy":
bCatch=true;break;
case "co":if(Dom[2]==="google")bCatch=true;break;
}break;

case "in":/*!!!*/
switch(Dom[1])
{
case "appear":
case "blogspot":
case "btdb":
case "cryptoparty":
case "damagelab":
case "emsisoft":
case "epeak":
case "exploit":
case "hitsk":
case "mixpix":
case "mothereff":
case "pinboard":
case "psb4ukr":
case "queit":
case "shopiapps":
case "skytorrents":
case "telega":
case "theadarshmehta":
case "urbanculture":
case "wiiare":
case "youtube":
case "youtubego":
case "zcha":
bCatch=true;break;
case "co":if(Dom[2]==="comodo"||Dom[2]==="google"||Dom[2]==="lmism"||Dom[2]==="mastercard"||Dom[2]==="youtube"||Dom[2]==="youtubego")bCatch=true;break;
case "semantica":if(Dom[2]==="")bCatch=true;break;
}break;

case "info":/*!!!*/
switch(Dom[1])
{
//(".info")
case "200ok":
case "antizapret":
case "askquest":
case "asm32":
case "autonum":
case "avamd":
case "bdupload":
case "bem":
case "binsearch":
case "blockchain":
case "browserprint":
case "chadaev":
case "ch-ui":
case "comss":
case "crystalmark":
case "cyberguerrilla":
case "darkmail":
case "dcherukhin":
case "easyway":
case "educing":
case "extstat":
case "frontender":
case "google":
case "guardianproject":
case "hot-game":
case "hr-portal":
case "hwinfo":
case "info":
case "ipcheck":
case "ipinfo":
case "it52":
case "javascript":
case "javascriptkit":
case "kowalczyk":
case "krasnoturinsk":
case "lafibre":
case "libraryofbabel"://#tls1.0
case "longurl":
case "lostfilm":
case "marc":
case "metal1":
case "moneycraft":
case "moonchildproductions":
case "mumble":
case "mydigitallife":
case "namecoin":
case "nsupdate":
case "openssource":
//(".info")
case "oxdef":
case "policyreview":
case "polygraph":
case "privatebin":
case "prohoster":
case "rubbeldiekatz":
case "samsclass":
case "sat-one":
case "searx":
case "smi1":
case "snig":
case "socialnie-seti":
case "song365mp3":
case "spybot":
case "steamdb":
case "supertarif":
case "sweet32":
case "tcfmailvault":
case "thesimplecomputer":
case "trisquel":
case "uapoker":
case "unbeam":
case "webvr":
case "wikimix":
case "worms2d":
case "ykyuen":
bCatch=true;break;
//(".info")
case "ip-check":if(URI.path==="/cache.css.php"||URI.path==="/favicon.ico"||URI.path.startsWith("/images/")||URI.path.startsWith("/images2/")||URI.path.startsWith("/ip-check.png?")||URI.path.startsWith("/iptools.php?"))bCatch=true;break;
case "onionmail":if(isTorRedirect())
{
    var NewURI=URI.clone();
    NewURI.host="louhlbgyupgktsw7.onion";
    subject.redirectTo(NewURI);
}break;
case "rutor":if(isTorRedirect())
{
    var NewURI=URI.clone();
    NewURI.host="rutorc6mqdinc4cz.onion";
    subject.redirectTo(NewURI);
}break;
case "ultravnc":if(Dom[2]==="forum")
{
    var NewURI=URI.clone();
    NewURI.host="forum.ultravnc.net";
    subject.redirectTo(NewURI);
}break;
}break;

case "int":/*!!!*/
switch(Dom[1])
{
case "coe":
case "interpol":
bCatch=true;break;
}break;

case "invalid":/*!!!*/
subject.cancel(Components.results.NS_BINDING_ABORTED);break;

case "io":/*!!!*/
switch(Dom[1])
{
//(".io")
case "1dmp":
case "adbust":
case "adnauseam":
case "adster":
case "airbrake":
case "arkos":
case "atom":
case "atom-data":
case "augur":
case "avatars":
case "avs":
case "bbhub":
case "bhf":
case "bitcore":
case "biterrant":
case "blazingfast":
case "blitz":
case "blockr":
case "branch":
case "buoyant":
case "burly":
case "bwbx":
case "c9":
case "censys":
case "center":
case "cex":
case "chronobank":
case "citizenweb":
case "clef":
case "cloudron":
case "cnnx":
case "codecov":
case "codedump":
case "codepen":
case "coincap":
case "coindash":
case "coinspot":
case "comae":
case "compressor":
case "conan":
case "confluent":
case "copay":
case "corion":
case "coveralls":
case "cozy":
case "crates":
//(".io")
case "crazyengineers":
case "cyberduck":
case "cyberresilience":
case "dadrian":
case "dam":
case "dashpay":
case "dbhub":
case "debtstracker":
case "deer":
case "devdocs":
case "dgx":
case "dictation":
case "digitaldownloads":
case "digix":
case "dream":
case "drp":
case "dudes":
case "elev":
case "elsevier":
case "enpass":
case "expo":
case "fftf":
case "filepicker":
case "filippo":
case "fixer":
case "freestar":
case "getgalileo":
case "getsale":
case "getsocial":
case "ghost":
case "ghostcall":
case "git":
case "gitbooks":
case "github":
case "gladly":
case "gnu":
case "goaccess":
case "gogs":
case "golos":
case "google":
case "gooroo":
case "greenhouse":
case "grsm":
case "hackr":
case "hashflare":
case "hexo":
case "honeybadger":
case "hughsk":
case "hunter":
//(".io")
case "hydrogenaud":
case "icomoon":
case "imagify":
case "imbox":
case "instant":
case "intercom":
case "iohk":
case "ipfs":
case "itch":
case "jaxx":
case "jsao":
case "juicer":
case "kadira":
case "kaimi":
case "kerberos":
case "keybase":
case "kilometer":
case "kraken":
case "kuna":
case "l2":
case "landscape":
case "lessbets":
case "limbik":
case "linkerd":
case "logz":
case "luminati":
case "mailfire":
case "maly":
case "mantishub":
case "manybot":
case "mare":
case "material":
case "maxweiss":
case "mdza":
case "mebius":
case "meduza":
case "mgba":
case "minilock":
case "minter":
case "mirrorhub":
case "modulus":
case "morsecode":
case "mountainduck":
case "msgsafe":
case "nethone":
case "nic":
case "onthe":
case "osnova":
case "ouo":
case "oversec":
//(".io")
case "owner":
case "packagecontrol":
case "pantheon":
case "pantheonsite":
case "peekin":
case "pendo":
case "picture":
case "pokeinthe":
case "polybius":
case "polyfill":
case "postimg":
case "potok":
case "powr":
case "prerender":
case "privacytools":
case "pubwise":
case "pyd":
case "quicknotes":
case "raygun":
case "readthedocs":
case "realm":
case "reep":
case "relap":
case "renderjs":
case "report-uri":
case "restream":
case "reviewable":
case "samepage":
case "sandcats":
case "sandstorm":
case "scans":
case "scaphold":
case "schd":
case "search404":
case "securityheaders":
case "sentry":
case "setka":
case "shapeshift":
case "sharedrop":
case "shields":
case "shinyapps":
case "shodan":
case "snapster":
case "socket":
case "stackshare":
case "stamped":
case "statuspage":
case "steem":
case "storj":
//(".io")
case "strem":
case "sympli":
case "talky":
case "taxtools":
case "teknik":
case "tent":
case "textback":
case "tito":
case "toptal":
case "toshi":
case "toxme":
case "trezor":
case "tribl":
case "truefactor":
case "uizard":
case "urlscan":
case "utox":
case "verifyemailaddress":
case "vuvuzela":
case "wallit":
case "weborama":
case "webrecorder":
case "webtask":
case "whatshelp":
case "wireguard":
case "wurfl":
case "zcoin":
case "zeplin":
case "zeronet":
case "zmap":
case "zopim":
bCatch=true;break;
//(".io")
case "antichat":if(Dom[2]==="reg"||Dom[2]==="verbal")bCatch=true;break;
case "keywordtool":if(URI.path.startsWith("/sites/"))bCatch=true;break;
case "qt":if(Dom[2]!=="master")bCatch=true;break;
}break;

case "iq":/*!!!*/
switch(Dom[1])
{
case "google":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google")bCatch=true;break;
}break;

case "ir":/*!!!*/
if(Dom[1]==="anetwork")bCatch=true;break;

case "is":/*!!!*/
switch(Dom[1])
{
case "archive":
case "blogspot":
case "cryptech":
case "crypto":
case "cryptoparty":
case "cryptostorm":
case "cryptoworld":
case "dnscrypt":
case "flibusta":
case "google":
case "insight":
case "lokun":
case "mailpile":
case "mumble":
case "perfectmoney":
case "solas":
case "taskforce":
case "time":
case "unseen":
case "who":
case "xmpp":
case "youtube":
bCatch=true;break;
case "rutor":if(isTorRedirect())
{
    var NewURI=URI.clone();
    NewURI.host="rutorc6mqdinc4cz.onion";
    subject.redirectTo(NewURI);
}break;
}break;

case "ist":/*!!!*/
if(Dom[1]==="nxd")bCatch=true;break;

case "it":/*!!!*/
switch(Dom[1])
{
case "2gis":
case "abenthung":
case "amazon":
case "aruba":
case "bitcoin":
case "blogspot":
case "bzfd":
case "coggle":
case "cybrary":
case "ebanoe":
case "emsisoft":
case "google":
case "greenaddress":
case "insane-voices-labirynth":
case "justpaste":
case "newsletter2go":
case "placehold":
case "redd":
case "shattered":
case "smarturl":
case "sproot":
case "youtube":
bCatch=true;break;
}break;

case "je":/*!!!*/
switch(Dom[1])
{
case "google":
bCatch=true;break;
case "co":if(Dom[2]==="google")bCatch=true;break;
}break;

case "jm":/*!!!*/
if(Dom[1]==="com"&&(Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "jo":/*!!!*/
switch(Dom[1])
{
case "google":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "jobs":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "jp":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "liftware":
case "xmpp":
case "youtube":
bCatch=true;break;
case "co":
    switch(Dom[2])
    {
    case "avast":
    case "google":
    case "youtube":
    bCatch=true;break;
    case "nintendo":if([3]==="www")bCatch=true;break;
    }break;
case "ne":if(Dom[1]==="google")bCatch=true;break;
}break;

case "ke":/*!!!*/
if(Dom[1]==="co"&&(Dom[2]==="blogspot"||Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "kg":/*!!!*/
switch(Dom[1])
{
case "2gis":
case "google":
case "sputnik":
bCatch=true;break;
}break;

case "kh":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "ki":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "kr":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "youtube":
bCatch=true;break;
case "co":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "kw":/*!!!*/
if(Dom[1]==="com"&&(Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "kz":/*!!!*/
switch(Dom[1])
{
case "2gis":
case "7232":
case "biletix"://#tls1.0
case "egemen":
case "flatfy":
case "footboom":
case "go13":
case "google":
case "inaktau":
case "inalmaty":
case "inastana":
case "informburo":
case "kazedu":
case "kazpic":
case "kundelik":
case "meteoprog":
case "momondo":
case "naimi":
case "philips":
case "ps":
case "smsc":
case "softk":
case "sputniknews":
case "webmoney":
case "yandex":
case "youtube":
bCatch=true;break;
}break;

case "la":/*!!!*/
switch(Dom[1])
{
case "bugzil":
case "google":
case "mzl":
case "softarchive":
case "youtube":
case "yuki":
bCatch=true;break;
}break;

case "lb":/*!!!*/
if(Dom[1]==="com"&&(Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "li":/*!!!*/
switch(Dom[1])
{
case "archive":
case "blogspot":
case "cock":
case "earth":
case "google":
case "href":
case "ragu":
case "rme":
bCatch=true;break;
}break;

case "lib":/*!!!*/
subject.cancel(Components.results.NS_BINDING_ABORTED);break;

case "life":/*!!!*/
switch(Dom[1])
{
case "anapa":
case "bzh":
bCatch=true;break;
}break;

case "link":/*!!!*/
switch(Dom[1])
{
case "app":
case "clicknupload":
case "onion":
case "sgnl":
bCatch=true;break;
}break;

case "live":/*!!!*/
if(Dom[1]==="1984")bCatch=true;break;

case "lk":/*!!!*/
switch(Dom[1])
{
case "google":
case "youtube":
bCatch=true;break;
}break;

case "local":/*!!!*/
case "localhost":/*!!!*/
subject.cancel(Components.results.NS_BINDING_ABORTED);break;

case "love":/*!!!*/
if(Dom[1]==="security")bCatch=true;break;

case "ls":/*!!!*/
if(Dom[1]==="co"&&Dom[2]==="google")bCatch=true;break;

case "lt":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "cert":
case "gismeteo":
case "google":
case "softkey":
case "youtube":
bCatch=true;break;
}break;

case "lu":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "circl":
case "google":
case "youtube":
bCatch=true;break;
}break;

case "lv":/*!!!*/
switch(Dom[1])
{
case "80":
case "bsd":
case "gismeteo":
case "google":
case "mt":
case "privatbank":
case "softkey":
case "youtube":
bCatch=true;break;
case "city24":if(Dom[2]==="media"||URI.path==="/FaviconCity24.ico"||URI.path.startsWith("/resources/")||URI.path.startsWith("/site/"))bCatch=true;break;
case "com":if(Dom[2]==="youtube")bCatch=true;break;
case "delfi":case "delphi":if(Dom[2].startsWith("g"))bCatch=true;break;//#+
}break;

case "ly":/*!!!*/
switch(Dom[1])
{
case "bit":
case "buff":
case "clck":
case "embed":
case "learning":
case "minute":
case "rebrand":
case "sur":
case "verify":
case "whisp":
case "youtube":
bCatch=true;break;
case "adf":if(isDocument&&Dom[2]===""&&(delim=URI.path.indexOf("/http://"))>0)
{
    var newLink=URI.path.substr(delim+1);
    delim=newLink.indexOf("&mod",13);
    if (delim>0)
        newLink=newLink.substr(0,delim);
    subject.redirectTo(Services.io.newURI(newLink,null,null));
}break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "ma":/*!!!*/
switch(Dom[1])
{
case "youtube":
bCatch=true;break;
if(Dom[1]==="co"&&(Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;
}break;

case "md":/*!!!*/
switch(Dom[1])
{
case "ava":
case "blogspot":
case "eway":
case "gismeteo":
case "google":
case "kp":
case "pesoto":
case "softkey":
case "sputnik":
case "youtube":
case "zbor":
bCatch=true;break;
}break;

case "me":/*!!!*/
switch(Dom[1])
{
//(".me")
case "4it":
case "about":
case "andydavies":
case "anonymousemail":
case "benedikt-bitterli":
case "benmarshall":
case "bespalov":
case "bloggeek":
case "brainstorage":
case "cackle":
case "cdm":
case "changeagain":
case "connectify":
case "danwin1210":
case "disconnect":
case "discord":
case "dontblock":
case "dotbit":
case "doublehop":
case "drop":
case "dropmail":
case "drupalize":
case "faceless":
case "fb":
case "filmix":
case "filterbypass":
case "football-russian":
case "garron":
case "gobuilder":
case "google":
case "gpuhash":
case "hack":
case "hide":
case "hmdw":
case "hynek":
case "instaplus":
case "ipsw":
case "key":
case "kvch":
case "line":
case "livefootballol":
case "live-sport":
case "live-tv":
case "lleo":
case "m":
case "maps":
case "markwinter":
case "meshwith":
case "mssg":
case "multirom":
case "mycdn":
//(".me")
case "my-hit":
case "myzuka"://#tls1.0 (cs*.myzuka.me)
case "ndex":
case "nekto":
case "onelink":
case "passwork":
case "paypal":
case "proxylists":
case "rajk":
case "rodovid":
case "scotthel":
case "searx":
case "secserv":
case "sign":
case "soft-club":
case "sportsfree":
case "start":
case "t":
case "telegram":
case "tofo":
case "torrentpier":
case "torrents":
case "torrentz2":
case "twrp":
case "uid":
case "uip":
case "unknowncheats":
case "unroll":
case "uport":
case "vgy":
case "vid":
case "vmail":
case "vpnlove":
case "vpnsecure":
case "websta":
case "wiert":
case "wp-rocket":
case "xmusik":
case "ymarkov":
case "youtube":
case "yuq":
case "zhartun":
bCatch=true;break;
//(".me")
case "rtsp":if(Dom[2]==="")bCatch=true;break;
case "vk":if(Dom[2]==="pp")bCatch=true;break;
}break;

case "media":/*!!!*/
switch(Dom[1])
{
case "bits":
case "firstlook":
case "griffon":
case "smilebright":
case "zona":
bCatch=true;break;
}break;

case "men":/*!!!*/
if(Dom[1]==="usbypass")bCatch=true;break;

case "menu":/*!!!*/
switch(Dom[1])
{
case "backup":
case "dedicated":
case "https":
case "license":
case "shared":
case "vds":
bCatch=true;break;
}break;

case "mg":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "mil":/*!!!*/
if(Dom[1]==="uscg")bCatch=true;break;

case "mk":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="youtube")bCatch=true;break;
}break;

case "ml":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "mm":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "mn":/*!!!*/
switch(Dom[1])
{
case "google":
case "youtube":
bCatch=true;break;
}break;

case "mobi":/*!!!*/
switch(Dom[1])
{
case "antrax":
case "cosmos":
case "flightbook":
case "sender":
bCatch=true;break;
}break;

case "moe":/*!!!*/
switch(Dom[1])
{
case "catbox":
case "mixtape":
bCatch=true;break;
}break;

case "money":/*!!!*/
switch(Dom[1])
{
case "abcd":
case "vpn":
case "web":
bCatch=true;break;
}break;

case "ms":/*!!!*/
switch(Dom[1])
{
case "1drv":
case "aka":
case "ch9":
case "gfx":
case "google":
case "jotfor":
case "mmr":
case "myip":
case "onestore":
case "rbl":
case "take":
bCatch=true;break;
}break;

case "mt":/*!!!*/
if(Dom[1]==="com"&&(Dom[2]==="blogspot"||Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "mu":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "mv":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "mw":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "mx":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "designers":
case "gfx":
case "google":
case "yac":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "my":/*!!!*/
switch(Dom[1])
{
case "11st":
case "11street":
case "blogspot":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "mz":/*!!!*/
if(Dom[1]==="co"&&Dom[2]==="google")bCatch=true;break;

case "na":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "name":/*!!!*/
switch(Dom[1])
{
case "davidwalsh":
case "hidemy":
case "hpc":
case "joeyh":
case "kevinlocke":
case "raz0r":
case "simply":
case "themarfa":
case "webmoney":
case "xaker":
bCatch=true;break;
}break;

case "ne":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "net":/*!!!*/
switch(Dom[1])
{
//(".net")
case "0bin":
case "13377x":
case "2chb":
case "4sqi":
case "5socks":
case "8ch":
case "acestream":
case "acilci":
case "acint":
case "adhoc2":
case "advmaker":
case "ai-cdn":
case "akamai":
case "akamaihd":
case "akamaized":
case "allmenda":
case "alternativeto":
case "am15":
case "anarplex":
case "anonbox":
case "anonymous-proxy-servers":
case "anonymox":
case "anteru":
case "antibounce":
case "apnic":
case "appelsiini":
case "appliedi":
case "archdaily":
case "arneswinnen":
case "arrfab":
case "arsdnet":
case "arstechnica":
case "asbra":
case "asp":
case "audiojungle":
case "authorize":
case "awsstatic":
case "azkware":
case "azurecomcdn":
case "azureedge":
case "azureml":
case "bandpagecdn":
case "behance":
case "bgpmon":
case "bing":
case "bither":
case "bitmask":
case "boingboing":
case "bolehvpn":
case "bufferbloat":
//(".net")
case "busybox":
case "bytebrand":
case "cachefly":
case "cacti":
case "casperlefantom":
case "cdnmk":
case "chameleonx":
case "chaoswebs":
case "chinadigitaltimes":
case "cjdroute":
case "clamav":
case "clicknupload":
case "clickssl":
case "cloudfront":
case "codecanyon":
case "commotionwireless":
case "comodo":
case "computeruniverse":
case "comss":
case "condecdn":
case "cosmonova":
case "cotse":
case "crackstation":
case "cryptologie":
case "cryptor":
case "cult-of-tech":
case "daringfireball"://#tls1.0
case "datatables":
case "datensturm":
case "d-cd":
case "ddos-guard":
case "debian":
case "debojj":
case "derpicdn":
case "designshack":
case "deviantart":
case "devside":
case "die":
case "digitalrivercontent":
case "diskcryptor":
case "dmcdn":
case "dmpcloud":
case "domaincoin":
case "doubleclick":
case "downloadsource":
case "downthemall":
case "drakonix":
case "drmu":
case "dslr":
case "dzcdn":
case "edgefonts":
case "edgekey":
case "elie":
case "emu-land":
case "enigmabox":
//(".net")
case "enigmail":
case "epidemz":
case "ethercalc":
case "ethicalhacker":
case "eviltracker":
case "example":
case "ex-fs":
case "exnews":
case "facebook":
case "fakeaccount":
case "falkvinge":
case "fancybear":
case "fanfiction":
case "fastly":
case "fbcdn":
case "ficbook":
case "filejoker":
case "filetrip":
case "flashgot":
case "flatassembler":
case "flisland":
case "fonts":
case "footboom":
case "forexfactory":
case "formgeek":
case "fortify":
case "fotocdn":
case "freecodecs":
case "freehaven":
case "freenode":
case "freepress":
case "free-proxy-list":
case "freifunk":
case "fs-uae":
case "gaijin":
case "gamedev":
case "gamekiller":
case "gandi":
case "geekpic":
case "geti2p":
case "getprivate":
case "ghacks":
case "glancecdn":
case "golemproject":
case "google":
case "gotraffic":
case "gravitec":
case "greenhost":
case "guifi":
case "gwern":
//(".net")
case "habracdn":
case "hackademix":
case "happyassassin":
case "hashcat":
case "he":
case "headway-widget":
case "helpingyouonline":
case "helpscout":
case "hiddenservice":
case "hope":
case "hot-chilli":
case "howsecureismypassword":
case "how-to-hide-ip":
case "hsadspixel":
case "hs-analytics":
case "hsappstatic":
case "hscollectedforms":
case "hscta":
case "hsforms":
case "hsleadflows":
case "hsstatic":
case "html5up":
case "httpschecker":
case "hubspot":
case "hubspotservices":
case "huzhe":
case "hyperboria":
case "icq":
case "imeidata":
case "imgix":
case "influencerdb":
case "insinuator":
case "internapcdn":
case "internic":
case "intsig":
case "ip2isp":
case "ipleak":
case "iridiummobile":
case "ivpn":
case "iwantcheats":
case "iwpr":
case "joxi":
case "jsdelivr":
case "jsfiddle":
case "jshell":
case "jtvnw":
case "juniper":
case "jurik-phys":
//(".net")
case "kat-top":
case "kevinkuang":
case "kievsmi":
case "kode54":
case "koderoot":
case "kpcdn":
case "kpitv":
case "krxd":
case "kubuntuforums":
case "kultprosvet":
case "kupi":
case "kuranin":
case "laquadrature":
case "launchpad":
case "launchpadlibrarian":
case "leadpages":
case "leakreporter":
case "literarydevices":
case "litevault":
case "live":
case "livejournal":
case "livetv123":
case "livetv141":
case "livetvcdn":
case "lowsnr":
case "lunarsoft":
case "lurkmore":
case "maidsafe":
case "maone":
case "marketo":
case "mathoverflow":
case "mattwilcox":
case "mdel":
case "medi-8":
case "mediaarea":
case "megaleecher":
case "mesamatrix":
case "metager":
case "metricskey":
case "moevideo":
case "momondo":
case "mozaws":
case "mradx":
case "mullvad":
case "myanimelist":
case "myfonts":
case "mystealthyfreedom":
case "mywot":
case "nashaplaneta":
case "nativo":
//(".net")
case "neosmart":
case "neowin":
case "netbreeze":
case "netdrive":
case "new-admin":
case "newdream":
case "newproxylist":
case "nightmarez":
case "nirsoft":
case "noscript":
case "nos-oignons":
case "nrholding":
case "ntinternals":
case "nullschool":
case "nytsoi":
case "oauth":
case "oftc":
case "ollcdn":
case "oneplus":
case "onion-router":
case "onlyzero":
case "onmodulus":
case "openhub":
case "openreputation":
case "openvpn":
case "openx":
case "opta":
case "orphus":
case "osmand":
case "outflux":
case "pageshot":
case "palemoon":
case "password-hashing":
case "patternsinthevoid":
case "peaknetworks":
case "peercoin":
case "peervpn":
case "peoplefinder":
case "php":
case "picdn":
case "pictshare":
case "pimg":
case "pingdom":
case "placeit":
case "playkey":
case "plus":
case "ponychat":
case "popads":
case "pornolab":
case "portknox":
case "portswigger":
case "postovoy":
//(".net")
case "privatoria":
case "programka":
case "projectinsight":
case "pro-tv":
case "proxy-site":
case "pushresponse":
case "pushsender":
case "pvplive":
case "qrator":
case "quicksilvermail":
case "quoracdn":
case "realfavicongenerator":
case "rebz":
case "recaptcha":
case "receivesmsonline":
case "recode":
case "redcdn":
case "remote-shell":
case "reniji":
case "researchgate":
case "reutersmedia":
case "revsci":
case "rg-adguard":
case "rgstatic":
case "ripe":
case "riseup":
case "rookmedia":
case "rootvpn":
case "roundcube":
case "rublacklist":
case "ruslab":
case "rutracker":
case "safe-mail":
case "saraeff":
case "satsis":
case "scirra":
case "screencloud":
case "screenshot":
case "searchspring":
case "secretovobmena":
case "secretvpn":
case "securityz":
case "sekao":
case "seoxa":
case "sftcdn":
case "shareicon":
case "simplesafe":
case "sipiko":
case "sixxs":
case "sks-keyservers":
case "skyscanner":
//(".net")
case "slideshare":
case "slimbrowser":
case "smi2":
case "socks-proxy":
case "softdroid":
case "softkey":
case "softlayer":
case "sohabr":
case "soverin":
case "spenibus":
case "spinics":
case "sportplayer":
case "sprashivai":
case "srware":
case "sstatic":
case "staticman":
case "storywars":
case "sucuri":
case "syncthing":
case "sypexgeo":
case "taleo":
case "tangentsoft":
case "tapochek":
case "techjourney":
case "teinon":
case "terrty":
case "thatoneprivacysite":
case "thealphacentauri":
case "thecybershadow":
case "thejh":
case "thewebatom":
case "timeinc":
case "tochka":
case "toolslib":
case "topbug":
case "torguard":
case "torservers":
case "trackcmp":
case "trmm":
case "tsyrklevich":
case "tunec":
case "tunnelbroker":
case "tusfiles":
case "typekit":
case "uicdn":
case "ukr":
case "unbound":
case "unian":
case "unifeht":
case "unilead":
case "urini":
//(".net")
case "v-cdn":
case "vclicks":
case "vfemail":
case "videochatmodule":
case "vikings":
case "vilny":
case "viralpatel":
case "vivaldi":
case "vk-cdn":
case "vkuservideo":
case "vlasti":
case "vpn":
case "vpn99":
case "vpncreative":
case "vrypan":
case "vytoki":
case "wambacdn":
case "wbstatic":
case "web4africa":
case "web-capture":
case "webcollage":
case "webfinger":
case "webxakep":
case "weltsport":
case "whichbrowser":
case "whoer":
case "whois":
case "wideup":
case "wikiislam":
case "winscp":
case "wircon-int":
case "wistia":
case "wordcounter":
case "worldota":
case "worldssl":
case "wsj":
case "wzor":
case "xato":
case "xmpp":
case "xsolla":
case "yandex":
case "yastatic":
case "yeinlookatdatunicorn":
case "ym-com":
case "ywxi":
case "zapili":
case "zaxid":
case "z-dn":
case "zencdn":
case "zerobin":
case "zetetic":
case "zonemaster":
case "zophar":
bCatch=true;break;
//(".net")
case "101datacenter":if(Dom[2]==="images")bCatch=true;break;
case "anoncoin":if((Dom[2]===""||Dom[2]==="www")&&isTorRedirect())
{
    var NewURI=URI.clone();
    NewURI.host="futz4b7tmqzoxnc6.onion";
    subject.redirectTo(NewURI);
}break;
case "battle":if(Dom[2]==="dev"||Dom[2]==="livechat"||URI.path.startsWith("/forums/")||URI.path.startsWith("/notification/")||URI.path.startsWith("/static/")||URI.path.startsWith("/support/"))bCatch=true;break;
case "bigmir":if(Dom[2]==="auto"||Dom[2]==="finance"||Dom[2]==="ivona"||Dom[2]==="news"||Dom[2]==="passport"||Dom[2]==="s"||Dom[2]==="sc"||Dom[2]==="sport"||Dom[2]==="techno"||Dom[2]==="www")bCatch=true;break;
case "catcut":if(!URI.path.startsWith("/go.php?"))bCatch=true;break;
case "dailyuploads":if(Dom[2]==="")bCatch=true;break;
case "forumotion":if(Dom[2]===""||Dom[2]==="www"||URI.path==="/0-ltr.css")bCatch=true;break;
case "fusion":if(Dom[2]===""||URI.path.startsWith("/_static/")||URI.path.startsWith("/wp-includes/")||URI.path.startsWith("/wp-content/"))bCatch=true;break;
case "ghserv":if(Dom[2]==="lists")bCatch=true;break;
case "glibre":if(Dom[2]==="searx")bCatch=true;break;
case "greasespot":if(Dom[2]==="cdn"||Dom[2]==="stats")bCatch=true;break;
case "hitfile":case "turbobit":if(Dom[2]===""&&(URI.path.startsWith("/favicon/")||URI.path.startsWith("/fd1/")||URI.path.startsWith("/fd2/")||URI.path.startsWith("/files/")||URI.path.startsWith("/locale/")||URI.path.startsWith("/platform/")||URI.path.startsWith("/pmbzqa/")))bCatch=true;break;//#+
case "javascripter":if(Dom[2]==="www"&&(URI.path.startsWith(10)==="/hi-icons/"||URI.path.startsWith(8)==="/images/"))bCatch=true;break;
case "libertarianizm":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
//(".net")
case "megogo":
{
    if(URI.path==="/favicon.ico"||URI.path.startsWith("/s/"))bCatch=true;break;var del=URI.path.indexOf('/',1);
    if(del>0){++del;if(URI.path.substr(del,8)==="profile/"||URI.path.substr(del,3)==="tv/"||URI.path.substr(del,5)==="view/")bCatch=true;}break;
}
//(".net")
case "mozilla":if(Dom[2]==="cdn")bCatch=true;break;
case "msecnd":if(Dom[2]==="vo")bCatch=true;break;
case "ngenix":if(Dom[2]==="cdn")bCatch=true;break;
case "opentracker":if(Dom[2]==="api"||Dom[2]==="script")bCatch=true;break;
case "rsload":if(Dom[2]==="")bCatch=true;break;
case "sourceforge":if(Dom[2]===""||Dom[2]==="downloads"||Dom[2]==="images")bCatch=true;break;
case "staticworld":if(Dom[2]==="core0")bCatch=true;break;
case "steinscraft":if(Dom[2]==="searx")bCatch=true;break;
case "uaprom":if(Dom[2]==="ua"&&Dom[3]==="static-cache")bCatch=true;break;
case "ucoz":if(Dom[2].startsWith("s"))bCatch=true;break;
case "ultravnc":if(Dom[2]==="forum")bCatch=true;break;
case "uploadbits":if(Dom[2]==="")bCatch=true;break;
case "uploaded":if(isDocument&&URI.path==="/404")
subject.redirectTo(Services.io.newURI("data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPiF1cGxvYWRlZC5uZXQ8L3RpdGxlPjwvaGVhZD48Ym9keT51cGxvYWRlZC5uZXQ6IDQwNDwvYm9keT48L2h0bWw+",null,null));
else if((Dom[2]===""&&URI.path==="/")||URI.path==="/favicon.ico"||URI.path.startsWith("/img/")||URI.path.startsWith("/js/")||URI.path.startsWith("/js2/")||URI.path.startsWith("/video/"))bCatch=true;break;
case "windows":if(Dom[2]==="core"&&Dom[3]==="blob")bCatch=true;break;
case "zaycev":if(Dom[2]==="cdndl"||URI.path.startsWith("/static/images/")||URI.path.startsWith("/static/js/")||URI.path.startsWith("/static/styles/"))bCatch=true;break;
}break;

case "network":/*!!!*/
switch(Dom[1])
{
case "golem":
case "landflip":
case "mass":
case "tent":
bCatch=true;break;
}break;

case "news":/*!!!*/
switch(Dom[1])
{
case "aftershock":
case "noodleremover":
case "securethe":
case "stavropol":
case "unfiltered":
case "ura":
bCatch=true;break;
}break;

case "nf":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "ng":/*!!!*/
switch(Dom[1])
{
case "google":
case "jiji":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="blogspot"||Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "ni":/*!!!*/
switch(Dom[1])
{
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "ninja":/*!!!*/
switch(Dom[1])
{
case "digi":
case "freevpn":
bCatch=true;break;
}break;

case "nl":/*!!!*/
switch(Dom[1])
{
case "annevankesteren":
case "beveiligingnieuws":
case "blogspot":
case "bof":
case "comodo":
case "computel":
case "cwi":
case "emsisoft":
case "e-wise":
case "google":
case "iamexpat":
case "indymedia":
case "jandemooij":
case "joostrijneveld":
case "marc-stevens":
case "naviware":
case "newsletter2go":
case "opengo":
case "os-tech":
case "rutracker":
case "stichtingbrein":
case "stoffelen":
case "tue":
case "usenet":
case "virtuallifestyle":
case "xs4all":
case "youtube":
bCatch=true;break;
}break;

case "no":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "censorship":
case "deltager":
case "espenandersen":
case "google":
case "inet":
case "ingebrigtsen":
case "mycall":
case "nrkbeta":
case "youtube":
bCatch=true;break;
}break;

case "np":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "nr":/*!!!*/
switch(Dom[1])
{
case "google":
bCatch=true;break;
case "com":if(Dom[2]==="google")bCatch=true;break;
}break;

case "nu":/*!!!*/
switch(Dom[1])
{
case "alf":
case "cipher":
case "cryptostorm":
case "google":
case "kognitionskyrkan":
case "onion":
case "parabola":
case "validator":
bCatch=true;break;
}break;

case "nyc":/*!!!*/
if(Dom[1]==="link")bCatch=true;break;

case "nz":/*!!!*/
switch(Dom[1])
{
case "btc-e":
case "emsisoft":
case "geek":
case "mega":
bCatch=true;break;
case "co":
    switch(Dom[2])
    {
    case "blogspot":
    case "contraspin":
    case "cryptopia":
    case "fanboy":
    case "google":
    case "mega":
    case "nzpost":
    case "shoeconnection":
    case "spinbin":
    case "youtube":
    bCatch=true;break;
    }break;
case "org":if(Dom[2]==="national"||Dom[2]==="nzfvc"||Dom[2]==="safesource")bCatch=true;break;
}break;

case "om":/*!!!*/
if(Dom[1]==="com"&&(Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "one":/*!!!*/
switch(Dom[1])
{
case "encrypt":
case "konvert":
case "proxybay":
bCatch=true;break;
}break;

case "onion":/*!!!*/
switch(Dom[1])
{
case "344c6kbnjnljjzlz"://#mirror vfemail.net
case "3g2upl4pq6kufc4m"://#mirror duckduckgo.com
case "3kyl4i7bfdgwelmf"://#mirror wefightcensorship.org
case "5jp7xtmox6jyoqd5"://#mirror pad.riseup.net//#cert
case "6zc6sejeho3fwrd4"://#mirror share.riseup.net//#cert
case "7lvd7fa5yfbdqaii"://#mirror we.riseup.net//#cert
case "a2af37vnxe44tcgo"://#mirror sw.surge.sh//#cert
case "anonopsmazrmrvws"://#mirror anonops.com//#cert
case "bitmailendavkbec"://#mirror bitmessage.ch//#cert
case "blockchainbdgpzk"://#mirror blockchain.info
case "cyphdbyhiddenbhs"://#mirror www.cyph.com
case "facebookcorewwwi"://#mirror facebook.com
case "fbcdn23dssr3jqnq"://#mirror fbcdn.net
case "fbsbx2q4mvcl63pw"://#mirror fbsbx.com
case "jlve2y45zacpbz6s"://#mirror torstatus.rueckgr.at//#cert
case "mpf3i4k43xc2usxj"://#mirror samwhited.com//#cert
case "privacyintyqcroe"://#mirror privacyinternational.org
case "propub3r6espa33w"://#mirror propublica.org
case "protonirockerxow"://#mirror protonmail.com
case "ronxgr5zb4dkwdpt"://#mirror derpibooru.org//#cert
case "xpgylzydxykgdqyg"://#mirror lists.riseup.net//#cert
case "y6xjgkgwj47us5ca"://#from theintercept.com
case "zsolxunfmbfuq7wf"://#mirror mail.riseup.net//#cert
bCatch=true;break;
case "rutrackerripnext":if(isDocument&&URI.spec.startsWith("http://rutrackerripnext.onion/forum/"))
{
    if(Services.prefs.getBoolPref("extensions.useraddon.cookies.fullmode.rutracker.org")||URI.path.substr(7,15)==="tracker.php?nm=")
    cookieSet(subject,"rutracker.org.txt");break;//#cookie
}break;
default:
{
    var bAbort=false;
    if(Dom[1].length===16){for(var i=15;i>=0;--i){var ch=Dom[1].charAt(i);if(!((ch>='a'&&ch<='z')||(ch>='2'&&ch<='7'))){bAbort=true;break;}}}else bAbort=true;
    if(bAbort)subject.cancel(Components.results.NS_BINDING_ABORTED);
}break;
}break;

case "online":/*!!!*/
switch(Dom[1])
{
case "freeu":
case "rns":
case "searchdata":
case "sportstavki":
case "susid":
case "unseen":
bCatch=true;break;
}break;

case "org":/*!!!*/
switch(Dom[1])
{
//(".org")
case "01":
case "0daymusic":
case "0xacab":
case "24hoursppc":
case "24smi":
case "4cdn":
case "4chan":
case "757":
case "7tor":
case "90live":
case "aboutcookies":
case "accessfirefox":
case "accessnow":
case "aclu":
case "aclunc":
case "aclu-wa":
case "acm":
case "acolyer":
case "adblockbrowser":
case "adblockplus":
case "aircrack-ng":
case "airvpn":
case "aktivix":
case "allfon":
case "alteroot":
case "altlinux":
case "amnesty":
case "ampproject":
case "anticenz":
case "apache":
case "apachefriends":
case "apc":
case "arbornetworks":
case "archive":
case "archlinux":
case "arhivach":
case "article19":
case "arxiv":
case "asteroidos":
case "autistici":
case "av-test":
case "avtonom":
case "azadliq":
case "azatliq":
case "b0ltai":
case "backconnect":
case "backinstock":
case "basicinternetsecurity":
case "bbb":
case "bearssl":
case "belaruspartisan":
//(".org")
case "bellard":
case "betterads":
case "bettercrypto":
case "bigfangroup":
case "bitbucket":
case "bitcoin":
case "bitcoin-bank":
case "bitcoincore":
case "bitcoinity":
case "bitcoinknots":
case "bitcointalk":
case "bitlbee":
case "bitload":
case "bitmessage":
case "bit-tracker":
case "bleachbit":
case "blockstack":
case "boum":
case "briarproject":
case "browserid":
case "browser-update":
case "btdigg":
case "byteball":
case "byuu":
case "cabforum":
case "calomel":
case "calyxinstitute":
case "canarywatch":
case "capnproto":
case "ccianet":
case "cdn77":
case "cdt":
case "centos":
case "cert":
case "certificate-transparency":
case "change":
case "changewindows":
case "charset":
case "charter97":
case "chatsecure":
case "chocolatey":
case "chromium":
case "ciphershed":
case "cisecurity":
case "citizenlab":
case "claws-mail":
case "clementine-player":
case "cloudns":
case "cloudpiercer":
//(".org")
case "cloudsecurityalliance":
case "cmake":
case "codefisher":
case "coincenter":
case "combot":
case "confidantmail":
case "contribs":
case "countrycode":
case "couragefound":
case "coursera":
case "cpj":
case "cpunks":
case "creativecommons":
case "crowdsupply":
case "cryptojedi":
case "cryptolux":
case "cryptomator":
case "cryptome":
case "cryptopunks":
case "cryptostorm":
case "ctrlq":
case "cuckoosandbox":
case "current":
case "cyanogenmod":
case "cyberguerrilla":
case "d3js":
case "dash":
case "datproject":
case "datprotocol":
case "debian":
case "debian-administration":
case "decentraleyes":
case "dedic":
case "defcon":
case "defectivebydesign":
case "demandprogress":
case "diasporafoundation":
case "digininja":
case "digitalcontentnext":
case "discourse":
case "disroot":
case "dlang":
case "dmarc":
case "dmarcian":
case "dmoz":
case "dnscrypt":
case "dnscurve":
case "documentcloud":
case "documentfoundation":
//(".org")
case "dokuwiki":
case "donorschoose":
case "do-not-tracker":
case "dostup-rutracker":
case "dottech":
case "dotua":
case "dovecot":
case "dragonflybsd":
case "dreamwidth":
case "dronebl":
case "drupal":
case "dyne":
case "easycoding":
case "easywallet":
case "ecen5032":
case "eclipse":
case "ecosia":
case "edri":
case "edx":
case "eff":
case "electrum":
case "emacswiki":
case "emcssl":
case "emojikeyboard":
case "emsisoft":
case "enable-cors":
case "enigmagroup":
case "eonetwork":
case "epic":
case "esrb":
case "ethereum":
case "eurekalert":
case "europalibera":
case "europeancopyrightsociety":
case "example":
case "exim":
case "exposefacts":
case "fail2ban":
case "fc00":
case "f-droid":
case "fedorahosted":
case "fedoraproject":
case "ffconf":
case "ffmpeg":
case "fidoalliance":
case "fightforthefuture":
case "file-extensions":
case "filezilla-project":
case "firefoxdownload":
case "firefoxosdevices":
case "firstlook":
case "flowplayer":
//(".org")
case "foobar2000":
case "fordfound":
case "fosdem":
case "fossencdi":
case "fossies":
case "fpf":
case "framabee":
case "framasoft":
case "freeanons":
case "freebfg":
case "freebogatov":
case "freebsd":
case "freedesktop":
case "freedombox":
case "freedomboxfoundation":
case "freedomhouse":
case "free-music-download":
case "freenetproject":
case "freeonlinephone":
case "freeopenvpn":
case "freeswitch":
case "freetype":
case "freeyourdata":
case "fri-gate":
case "fsf":
case "fteproxy":
case "fuzzing-project":
case "gajim":
case "game2day":
case "gentoo":
case "getfedora":
case "getfoxyproxy":
case "getkong":
case "getlantern":
case "getmonero":
case "ghost":
case "gibberfish":
case "gimp":
case "globalchokepoints":
case "globaleaks":
case "globalnetworkinitiative":
case "globalvoices":
case "gmplib":
case "gnome":
case "gnu":
case "gnunet":
case "gnupg":
case "goal-online":
case "godbolt":
case "golang":
case "googletransparencyproject":
case "gpg4win":
case "gpgtools":
case "greasyfork":
case "guessemoji":
//(".org")
case "guidestar":
case "habrastorage":
case "haiku-os":
case "harvardlawreview":
case "hbr":
case "hdclub":
case "hellsy":
case "henrypp"://#cert
case "hicount":
case "hivos":
case "h-node":
case "hrw":
case "hsto":
case "hstspreload":
case "html5hive":
case "html5sec":
case "httpoxy":
case "httpsnow":
case "huridocs":
case "iaaf":
case "iacr":
case "iana":
case "icann":
case "icij":
case "idelreal":
case "ieee-security":
case "ietf":
case "ifilez":
case "igniterealtime":
case "ikon-gallery":
case "imagemagick":
case "immunicity":
case "imperialviolet":
case "indybay":
case "inforesist":
case "informnapalm":
case "inkscape":
case "inkscapetutorials":
case "integram":
case "intelexit":
case "internet":
case "internetdefenseprize":
case "internetsociety":
case "internews":
case "intsystem":
case "inventati":
case "ip-check":
case "ipv6tracker":
case "isc":
case "iswebvrready":
case "itstep":
case "jitsi":
case "jooble"://#tls1.0
case "joomla":
case "jpope":
case "jquery":
//(".org")
case "jquerytools":
case "js":
case "jstor":
case "justiceforpunters":
case "justnetcoalition":
case "justsecurity":
case "kalypto":
case "kamailio":
case "kde":
case "keepassx":
case "keepassxc":
case "kernel":
case "kfarwell":
case "khanacademy":
case "kiwibyrd":
case "kohanaframework":
case "kolab":
case "kontalk":
case "kontragent":
case "koozali":
case "krita":
case "krourke":
case "kujiu":
case "kyivpride":
case "labnol":
case "lalit":
case "letsencrypt":
case "libav":
case "libraryfreedomproject":
case "libraw"://#tls1.0
case "libreboot":
case "libreoffice":
case "libreswan":
case "libsodium":
case "libwebsockets":
case "liftware":
case "lightwitch":
case "linphone":
case "linuxcontainers":
case "linuxquestions":
case "linux-sunxi":
case "litecoin":
case "lnt":
case "loginz":
case "lora-alliance"://#tls1.0
case "lua":
case "macports":
case "mailbox":
case "mailtothejail":
case "mathjax":
//(".org")
case "matrix":
case "mayfirst":
case "mediawiki":
case "memcached":
case "merproject":
case "metacpan":
case "metakgp":
case "metalarea":
case "metalrock":
case "metelyk":
case "micropython":
case "midnight-commander":
case "mitmproxy":
case "mitre":
case "moderncrypto":
case "modsecurity"://#tls1.0
case "moodle":
case "mosh":
case "moxie":
case "mozfr":
case "mozilla":
case "mozilla-community":
case "mozillademos":
case "mozilla-russia":
case "mpc-hc":
case "mpi-sws":
case "mulliner":
case "musescore":
case "musicbrainz":
case "musl-libc":
case "mvps":
case "myklad":
case "myplano":
case "myrome":
case "myshadow":
case "nahnews":
case "nameid":
case "ndi":
case "ndxdev":
case "neg9":
case "netbeans":
case "netblocks":
case "netbsd":
case "netzpolitik":
case "newamerica":
case "nexacenter":
case "nghttp2":
case "niij":
case "niskanencenter":
case "nlg":
//(".org")
case "nmap":
case "nodejs":
case "nomoreransom":
case "noref":
case "notepad-plus-plus":
case "ntppool":
case "nuget":
case "nvaccess":
case "oecd":
case "omicsonline":
case "omnirom":
case "onionscan":
case "onionshare":
case "onlineprivacyfoundation":
case "openbsd":
case "openbugbounty":
case "opendnssec":
case "opengl":
case "openmailbox":
case "openmedia":
case "opennic":
case "opennicproject":
case "openoffice":
case "openpgpjs":
case "openpli":
case "open-resource":
case "openresty":
case "openrightsgroup":
case "openrunet":
case "openrussia":
case "opensmtpd":
case "opensource":
case "openssl":
case "opensubtitles":
case "opensuse":
case "openswan":
case "opentown":
case "opentrackers":
case "openuserjs":
case "openwireless":
case "openwrt":
case "opus-codec":
case "orwall":
case "orwl":
case "osmocom":
case "ostif":
case "ovdinfo":
case "owasp":
case "owncloud":
case "oxfamamerica":
case "packagist":
case "palary":
//(".org")
case "parsemail":
case "passwordday":
case "passwordstore":
case "patientprivacyrights":
case "pcisecuritystandards":
case "pcportal":
case "people-mozilla":
case "perl":
case "persona":
case "perspectives-project":
case "petsymposium":
case "pfsense":
case "pgcon":
case "phpclasses":
case "phpnuke":
case "phys":
case "picload":
case "pirates-forum":
case "piwik":
case "ploneconf":
case "pogo":
case "poolp":
case "posativ":
case "postimg":
case "pqrs":
case "prism-break":
case "privacy-cd":
case "privacyinternational":
case "privoxy":
case "project-osrm":
case "propublica":
case "prostovpn":
case "proxyportal":
case "pryaniki":
case "public-inbox":
case "publicsuffix":
case "punknews":
case "pureftpd":
case "pwsafe":
case "pycon-au":
case "python":
case "pythonhosted":
case "qbittorrent":
case "quantamagazine":
case "qubes-os":
case "rabbit-hole":
case "radioazadlyg":
case "radiosvoboda":
case "random":
case "raspberrypi":
//(".org")
case "rdot":
case "reactos":
case "readthedocs":
case "redbot":
case "reembed":
case "regehr":
case "renewablefreedom":
case "reporterslab":
case "reqrypt":
case "resetthenet":
case "revealnews":
case "reverse4you":
case "reversephonelookup":
case "reviewboard":
case "rfc-editor":
case "rferl":
case "rockbox":
case "rosettacode":
case "rsdn":
case "rsf":
case "ruby-doc":
case "rubygems":
case "rufootballtv":
case "ruheight":
case "ru-sfera":
case "rust-lang":
case "rutracker":
case "rutrk":
case "safer-networking":
case "sailfishos":
case "salut-a-toi":
case "samba":
case "sans":
case "savecrypto":
case "sba-research":
case "schokokeks":
case "scientificlinux":
case "sdcard":
case "seamonkey-project":
case "securedrop":
case "secure-email":
case "securitee":
case "securityinabox":
case "securitywithoutborders":
case "servo":
case "sfconservancy":
case "sha2017":
case "shadowsocks":
case "signal":
case "simplednscrypt":
case "skylots":
//(".org")
case "slashcrypto":
case "slashdot":
case "slashdotmedia":
case "socialcoders":
case "social-engineer":
case "softether"://#tls1.0
case "sourceware":
case "spamhaus":
case "sparkleshare":
case "spectator":
case "speex":
case "spring96":
case "sqlite":
case "squirrelmail":
case "stallman":
case "standardnotes":
case "stellar":
case "stopbadware":
case "stopkillerrobots":
case "stopmakingsense":
case "strongswan":
case "stunnel":
case "sumatrapdfreader":
case "svaboda":
case "svoboda":
case "swehack":
case "sympa"://#tls1.0
case "syncany":
case "tahoe-lafs":
case "takemetal":
case "targeted":
case "team29":
case "team-cymru":
case "technicaldeathmetal":
case "telegram":
case "teleport":
case "testrun":
case "thc":
case "themoviedb":
case "theory":
case "thepiratebay":
case "thepropertygazette":
case "theukrainians":
case "threejs":
case "tinc-vpn":
case "tizen":
case "tmdb":
case "top500":
case "topg":
case "tor2web":
//(".org")
case "torproject":
case "torrent-tv":
case "torstorm":
case "torworld":
case "tosdr":
case "tpblist":
case "traccar":
case "trackersimulator":
case "transparency":
case "travis-ci":
case "tribler":
case "trollingeffects":
case "t-ru":
case "trustdirectory":
case "trustworthyinternet":
case "truthinadvertising":
case "turkeyblocks":
case "tuxfamily":
case "ualife":
case "ubuntuforums":
case "uclibc":
case "unbound":
case "uncensoreddns":
case "unglobalcompact":
case "unhosted":
case "unixcorn":
case "updatemybrowser":
case "uploadx":
case "usenix":
case "userscripts-mirror":
case "userstyles":
case "vanila":
case "vaultier":
case "videolan":
case "virtualbox":
case "voip-info":
case "vseadresa":
case "vuejs":
case "vxheaven":
case "w":
case "w3":
case "wada-ama":
case "wallabag":
case "waterfoxproject":
case "weakdh":
case "webkit":
case "webmproject":
case "webpagetest":
case "webrtc":
case "webcookies":
case "web-send":
case "websocket":
case "webypass":
//(".org")
case "weechat":
case "weforum":
case "whatwg":
case "whispersystems":
case "whonix":
case "wi-fi":
case "wiki2":
case "wikibooks":
case "wikidata":
case "wikileaks":
case "wikimedia":
case "wikimediafoundation":
case "wikinews":
case "wikipedia":
case "wikiquote":
case "wikisource":
case "wikiversity":
case "wikivoyage":
case "wiktionary":
case "wildleaks":
case "windows-security":
case "winehq":
case "winpcap":
case "wireshark":
case "wj32":
case "wmflabs":
case "wmfusercontent":
case "wordcamp":
case "worldbank":
case "worldclasswebsites":
case "worldcubeassociation":
case "worldprivacyforum":
case "wpscan":
case "wxwidgets":
case "xiph":
case "xmpp":
case "xnode":
case "yadvashem":
case "yoyo":
case "yt-dl":
case "yunohost":
case "zarunet":
case "zenphoto":
case "zoomeye":
case "zotero":
case "zxing":
bCatch=true;break;
//(".org")
case "boost":if(Dom[2]==="svn")bCatch=true;break;
case "doom9":if(Dom[2]==="forum")bCatch=true;break;
case "fossamail":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "go-beyond":if(isTorRedirect())
{
    var NewURI=URI.clone();
    NewURI.host="potatooezyf2aql6.onion";
    subject.redirectTo(NewURI);
}break;
case "indymedia":if(Dom[2]===""||Dom[2]==="belarus"||Dom[2]==="de"||Dom[2]==="publish"||Dom[2]==="ukraine"||Dom[2]==="www")bCatch=true;break;
case "lifehack":if(Dom[2]==="m"||URI.path.startsWith("/wp-admin/")||URI.path.startsWith("/wp-content/"))bCatch=true;break;
case "lineageos":if(Dom[2]==="download"||Dom[2]==="mirrorbits"||Dom[2]==="review")bCatch=true;break;
case "live-rutor":if(isTorRedirect())
{
    var NewURI=URI.clone();
    NewURI.host="rutorc6mqdinc4cz.onion";
    subject.redirectTo(NewURI);
}break;
case "openownership":if(Dom[2]==="register")bCatch=true;break;
case "palemoon":if(Dom[2]===""||Dom[2]==="addons"||Dom[2]==="forum"||Dom[2]==="linux"||Dom[2]==="start"||Dom[2]==="www")bCatch=true;break;
case "plone":if(Dom[2]===""||Dom[2]==="community"||Dom[2]==="training")bCatch=true;break;
case "rada4you":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
//(".org")
case "secushare":if(isTorRedirect())
{
    var NewURI=URI.clone();
    NewURI.host="secushare.cheettyiapsyciew.onion";
    subject.redirectTo(NewURI);
}break;
case "uainfo":if(Dom[2]==="")bCatch=true;break;
case "wefightcensorship":if(isTorRedirect())
{
    var NewURI=URI.clone();
    NewURI.host="3kyl4i7bfdgwelmf.onion";
    subject.redirectTo(NewURI);
}break;
case "xfce":if(Dom[2]===""||Dom[2]==="blog"||Dom[2]==="bugzilla"||Dom[2]==="docs"||Dom[2]==="forum"||Dom[2]==="git"||Dom[2]==="wiki"||Dom[2]==="www")bCatch=true;break;
}break;

case "pa":/*!!!*/
switch(Dom[1])
{
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "pe":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "pg":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "ph":/*!!!*/
switch(Dom[1])
{
case "barthe":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
case "telegra":if(Dom[2]==="edit")bCatch=true;break;
}break;

case "pk":/*!!!*/
switch(Dom[1])
{
case "google":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="tribune"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "pl":/*!!!*/
switch(Dom[1])
{
case "8ch":
case "adocean":
case "avlab":
case "bcf-software":
case "callpage":
case "certum"://#tls1.0
case "coinmine":
case "daftcode":
case "dnscrypt":
case "dobreprogramy":
case "dpcdn":
case "fakeimg":
case "flatfy":
case "gemius":
case "google":
case "hackinq":
case "ipsec":
case "meteoprog":
case "morfitronik":
case "newsletter2go":
case "ppstatic":
case "salesmanago":
case "samy":
case "skyscanner":
case "softkey":
case "wp":
case "wprost":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google")bCatch=true;break;
case "one":if(Dom[2]==="good"&&Dom[3]==="searx")bCatch=true;break;
}break;

case "pm":/*!!!*/
switch(Dom[1])
{
case "2ch":
case "temp":
case "zeus":
bCatch=true;break;
}break;

case "pn":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "pr":/*!!!*/
switch(Dom[1])
{
case "kas":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google")bCatch=true;break;
}break;

case "press":/*!!!*/
switch(Dom[1])
{
case "freedom":
case "immunicity":
case "katproxy":
case "mascherari":
case "proxybay":
bCatch=true;break;
}break;

case "pro":/*!!!*/
switch(Dom[1])
{
case "allfon":
case "audiosex":
case "beholder":
case "blackview":
case "boosters":
case "classifiedhub":
case "debian":
case "e-news":
case "fotobiz":
case "geekteam":
case "harlamoff":
case "htmlmail":
case "itportal":
case "kplus":
case "labster":
case "mechanism":
case "rcdn":
case "shurl":
case "simplepay":
case "tormirror":
case "usocial":
case "vektort13":
bCatch=true;break;
}break;

case "ps":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "pt":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="youtube")bCatch=true;break;
}break;

case "pub":/*!!!*/
if(Dom[1]==="isu")bCatch=true;break;

case "pw":/*!!!*/
switch(Dom[1])
{
case "123bay":
case "cryptoseb":
case "demonoid":
case "israbox":
case "leakbase":
case "logdog":
case "nesterov":
case "notepad":
case "pwproxy":
case "snippets":
case "system33":
case "tpm":
case "xxcdn":
bCatch=true;break;
}break;

case "py":/*!!!*/
if(Dom[1]==="com"&&(Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "qa":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "re":/*!!!*/
switch(Dom[1])
{
case "appsto"://#unsafe-negotiation
case "beginners":
case "challenges":
case "chloe":
case "lurkmo":
bCatch=true;break;
}break;

case "red":/*!!!*/
if(Dom[1]==="pirateproxy")bCatch=true;break;

case "reviews":/*!!!*/
if(Dom[1]==="bitcoincasinos")bCatch=true;break;

case "rip":/*!!!*/
if(Dom[1]==="onion")bCatch=true;break;

case "ro":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "flatfy":
case "google":
case "ing":
case "pieseauto":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="youtube")bCatch=true;break;
}break;

case "rocks":/*!!!*/
switch(Dom[1])
{
case "it-sec":
case "peteris":
bCatch=true;break;
}break;

case "rs":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "docs":
case "eway":
case "exploitee":
case "google":
case "inv":
case "serde":
case "serviceworke":
case "youtube":
bCatch=true;break;
}break;

case "ru":/*!!!*/
switch(Dom[1])
{
//(".ru")
case "101domain":
case "1c-bitrix":
case "1c-bitrix-cdn":
case "1cloud":
case "1dedic":
case "1prime":
case "1rnd":
case "1tulatv":
case "1tv":
case "1zaicev":
case "2gis":
case "2ip":
case "2kom":
case "31tv":
case "3dlion":
case "4pda":
case "5dec":
case "5oclick":
case "6to4":
case "7pisem":
case "7x7-journal":
case "8magazin":
case "9111":
case "abonentik":
case "action-media":
case "actis":
case "addreality":
case "adfox":
case "adhands":
case "adindex":
case "adme":
case "adregain":
case "adriver":
case "adv":
case "advodom":
case "aeroflot":
case "afisha":
case "agima":
case "aimp":
case "airbnb":
case "akbars":
case "aktiv-company":
case "alfabank":
case "aliexpress-internet":
case "aliexpress-shoping":
case "aliprofi":
case "alittlebit":
case "alleurovision":
//(".ru")
case "allinvestments":
case "allsoft":
case "amberdata":
case "amocrm":
case "anekdot":
case "anonima":
case "antichat":
case "anti-malware":
case "anybalance":
case "anyref":
case "aori":
case "apicaller":
case "apiok":
case "appleinsider":
case "appsmail":
case "apteka245":
case "aptekarsk":
case "arigus-tv":
case "artlebedev":
case "artreal":
case "arttel":
case "atb-online":
case "atlas":
case "atname":
case "auchan":
case "auto":
case "autoi":
case "autoit-script":
case "autorambler":
case "autoreview":
case "avast":
case "aviasales":
case "avito":
case "avtodispetcher":
case "avtogsm":
case "avtokompaniya":
case "avtovokzaly":
case "ayu":
case "azbuka-ineta":
case "azbyka":
case "aziada":
case "b2b-center":
case "babyblog":
case "baikal-daily":
case "banki":
case "bankir":
case "bankuralsib":
case "basealt":
case "bbdogroup":
//(".ru")
case "beeline":
case "begun":
case "belive":
case "beritur":
case "bestchange":
case "bettingbusiness":
case "bezoblog":
case "bfm":
case "bible":
case "bibleonline":
case "biguniverse":
case "biletix":
case "bimatoprost":
case "bioware":
case "bisv":
case "bitcoin-wallet":
case "bitrix24":
case "biz360":
case "biznes-prost":
case "bizon365":
case "blablacar":
case "blackarch":
case "blogspot":
case "blogtool":
case "blogun":
case "bnkomi":
case "bogi":
case "bookmakersrating":
case "boomstarter":
case "bosfera":
case "bragazeta":
case "bspb":
case "bugtraq":
case "buro247":
case "businessman":
case "buyon":
case "buyoncdn":
case "byfashion":
case "bytemag":
case "calc":
case "callbackkiller":
case "callibri":
case "callx":
case "canapecrm":
case "canon":
case "capitaller":
case "carambatv":
case "carbonsoft":
//(".ru")
case "career":
case "caricatura":
case "cars":
case "cctld":
case "cdnvideo":
case "centralreg":
case "ceramica"://#tls1.0
case "championat-rostov":
case "changecopyright":
case "chita":
case "chitai-gorod":
case "chitaitext":
case "cifrus":
case "citilink":
case "clck":
case "cldmail":
case "clients-cdnnow":
case "cloud4y":
case "cloudim":
case "cloudpayments":
case "cmtt":
case "coca-cola":
case "codebeer":
case "colorscheme":
case "comboplayer":
case "comicsia":
case "computeruniverse":
case "comss":
case "contrasterra":
case "copirayter":
case "coreradio":
case "corporacia":
case "coworking":
case "crbb":
case "creshtal":
case "cryptopro":
case "cryptostore":
case "csdota2":
case "csgo-happy":
case "ctclove":
case "c-t-s":
case "cyberplat":
case "dadata":
case "dadu":
case "dailystavropol":
case "dalee":
case "darkside":
case "darmoid":
case "dataart":
case "ddriver":
case "defendset":
case "dellin":
//(".ru")
case "demiart"://#tls1.0
case "democrator":
case "demos":
case "dengisend":
case "dentalmagazine":
case "derpiboo":
case "devline":
case "devprom":
case "dfiles":
case "dgl":
case "digiseller":
case "digitalsharks":
case "digitaltarget":
case "digitec":
case "dimonvideo":
case "directadvert":
case "dirty":
case "dixy":
case "dnevnik":
case "dniester":
case "docdoc":
case "domainparking":
case "domainreseller":
case "domkadrov":
case "donutor":
case "dostavista":
case "downloadmaster":
case "dp":
case "drive":
case "drive2":
case "drweb":
case "dtf":
case "dumedia":
case "dusha-orthodox":
case "dvfu":
case "dxdt":
case "dxm-shop":
case "dzenpoisk":
case "eat-me":
case "e-disclosure":
case "edsd":
case "edu71":
case "e-ecolog":
case "eer":
case "egais":
case "eg-online":
case "egrp365":
case "elec":
case "elitsy":
//(".ru")
case "elsevier":
case "emaro-ssl":
case "emsisoft":
case "e-mts":
case "enaza":
case "enum":
case "erlyvideo"://#tls1.0
case "eserv":
case "esetnod32":
case "esltutor":
case "esquire":
case "e-traffic":
case "eurocups":
case "euroinvision":
case "evacosmetics":
case "everypony":
case "eway24":
case "exelab":
case "extra-mir":
case "extyl-pro":
case "ezolive":
case "falcongaze":
case "fantlab":
case "fastvps":
case "fe-nix":
case "ferra":
case "festival":
case "film":
case "findface":
case "finparty":
case "firefox-ok":
case "firstvds":
case "fixim":
case "fl":
case "flapps":
case "flatfy":
case "footballhd":
case "footboom":
case "forum4":
case "forumhouse":
case "fotostrana":
case "free-kassa":
case "freelansim":
case "freerunet":
case "fregataero":
case "friday":
case "fsin-pismo":
case "fuckav":
case "futurist":
//(".ru")
case "galya":
case "garstelecom":
case "gazeta":
case "gdemoi":
case "geekbrains":
case "geektimes":
case "genbank":
case "getname":
case "gismeteo":
case "glavbukh":
case "glonass-iac":
case "gmbox":
case "go26":
case "goengels":
case "gold-free":
case "google":
case "gorod60":
case "gosbus":
case "gosmonitor":
case "gosuslugi":
case "gotroitsk":
case "govoritmoskva":
case "grandcapital":
case "gruzpoisk":
case "gsmcorporacia":
case "gzt-sv":
case "habr":
case "habrahabr":
case "hackware":
case "hackzona":
case "hackzone":
case "handyhost":
case "happy-hack":
case "hddlife":
case "hh":
case "hhcdn":
case "hhid":
case "hideme":
case "hi-news":
case "hlmod":
case "homemediaserver":
case "hostink":
case "htmlacademy":
case "htmlweb":
case "i10":
case "ibank2":
case "i-check-you":
case "icondesigne":
//(".ru")
case "ienglish":
case "igalya":
case "ihc":
case "ihor":
case "iloveeconomics":
case "imgbb":
case "imgd":
case "imglink":
case "imgsmail":
case "indicator":
case "infobox":
case "infokolomna":
case "infotecs":
case "infourok":
case "infowatch":
case "inna":
case "inopressa":
case "inosmi":
case "insales24":
case "instam":
case "instruccija":
case "interface31":
case "iotas":
case "iphones":
case "ircity":
case "irina-lorens":
case "i-services":
case "ispring":
case "isprogfun":
case "ispsystem":
case "istat24":
case "istpravda":
case "it-actual":
case "itbestsellers":
case "iteam":
case "itex":
case "itfollow":
case "itmages":
case "itnan":
case "itroad":
case "itsumma":
case "ivi":
case "ivsezaodnogo":
case "iz":
case "izvestia":
case "jabber":
case "japancar":
case "javascript":
case "jc9":
case "jino":
case "joosy":
//(".ru")
case "joxi":
case "jugger":
case "jumpoutpopup":
case "justclick":
case "kaimi":
case "kakprosto":
case "kartaslov":
case "kasperskyclub":
case "kasperskypartners":
case "kavkazvideo":
case "kazanfirst":
case "kazned":
case "kbpravda":
case "kerio":
case "khashaev":
case "khl":
case "kinopoisk":
case "kitchenmag":
case "kixbox":
case "klerk":
case "knep":
case "kodtelefona":
case "kommersant"://#tls1.0
case "kprf":
case "kredit-otziv":
case "kremlinpress":
case "krotovroman":
case "kr-znamya":
case "kstu":
case "ktonanovenkogo":
case "kupibilet":
case "kurso":
case "kwork":
case "labaved":
case "lankey":
case "learnathome":
case "lenizdat":
case "lenta":
case "leonidvolkov":
case "leonov-do":
case "leprosorium":
case "letu":
case "letyshops":
case "lfhk":
case "life":
case "lifehacker":
case "life-pay":
case "ligakvartir":
case "linkmeup":
//(".ru")
case "linkyou":
case "litl-admin":
case "litres":
case "livecomm":
case "liveinternet":
case "livelib":
case "liveproxy":
case "liveresult":
case "livetex":
case "logaster":
case "loginza":
case "loskutkova":
case "loveplanet":
case "lurkmore":
case "luxup":
case "maam":
case "magictab":
case "majordomo":
case "make-trip":
case "malls":
case "mamba":
case "mcdonalds":
case "mcgrp":
case "mchost":
case "mediabuttons":
case "mediamarkt":
case "mediarepost":
case "mediasphera":
case "medstolet":
case "mega-billing":
case "megafon":
case "megamozg":
case "megaplan":
case "megastock":
case "mephi":
case "mfo-dvr":
case "mfuturemusic":
case "micromarketing":
case "mining-bitcoin":
case "mipt":
case "mirea":
case "mirf":
case "mirtesen":
case "mirznanii":
case "mkb":
case "mkrf":
case "mobak":
case "modkit":
case "modulbank":
case "moikrug":
//(".ru")
case "momondo":
case "moonback":
case "moscow-faq":
case "moskva-krym":
case "mp3music":
case "mtdata":
case "mtml":
case "mtsgid":
case "mtt":
case "mvd":
case "mvoin":
case "my-chrome":
case "myfreesoft":
case "mylinker":
case "myoffice":
case "mypozirator":
case "myrusakov":
case "mysku":
case "mysku-st":
case "myslo":
case "nag":
case "naked-science":
case "nalog":
case "ndflka":
case "neotelecom":
case "netfox":
case "newkaliningrad":
case "newsko":
case "newsli":
case "newstube":
case "nick-name":
case "nikoncashback":
case "nkj":
case "noblocker":
case "nordportal":
case "noteskeeper":
case "novayagazeta":
case "noveogroup":
case "novostivoronezha":
case "now":
case "nplus1":
case "npo-echelon":
case "nserver":
case "nstarikov":
case "nsychev":
case "nvrnet":
case "obi":
case "odnoklassniki":
case "odnoklassniki-forum":
case "odnorazovoe":
//(".ru")
case "ognyvo":
case "ohranatruda":
case "ok":
case "okhtalab":
case "okhta-mall":
case "olegon":
case "olly":
case "omnidesk":
case "onetile":
case "onlimegames":
case "onlinesim":
case "onlinetrade":
case "ony":
case "open":
case "openbank":
case "openprovider":
case "openvpn":
case "oprf":
case "orelgrad":
case "orphus":
case "osdaily":
case "osp":
case "ostagram":
case "ostrovok":
case "otr-online":
case "otvetapp":
case "otvetus":
case "otzyv":
case "overclockers":
case "ovrload":
case "owindows":
case "oz-n":
case "ozon":
case "ozone":
case "pantone":
case "parnasparty":
case "pashkevi4":
case "paulov":
case "payment":
case "payonline":
case "payu":
case "pcweek":
case "pelicam":
case "pentalweb":
case "pentestit":
case "person-agency":
case "philips":
//(".ru")
case "photoload":
case "pikabu":
case "pilot":
case "pinall":
case "piratbit":
case "pirate-party":
case "planeta":
case "plati":
case "platina":
case "playcast":
case "pluso":
case "pnp":
case "pochta":
case "polit":
case "popmechanic":
case "popsters":
case "portal-credo":
case "postio":
case "postnauka":
case "ppc-help":
case "pravobraz":
case "pravoved":
case "pravtor":
case "pravzhizn":
case "president-msk":
case "prison-fakes":
case "private-names":
case "privetapp":
case "prodoctorov":
case "productcenter":
case "professionali":
case "profibeer":
case "propolevskoy":
case "prototypes":
case "providesupport":
case "proza":
case "psbank":
case "ptsecurity":
case "ptutu":
case "pushall":
case "qip":
case "qlean":
case "qsupport":
case "quran-online":
case "rabota-ipoisk":
case "radmin":
case "rae":
case "raexpert":
//(".ru")
case "rambler":
case "raritetus":
case "rassrochka24":
case "rbk":
case "read":
case "realnoevremya":
case "reenter":
case "refocus":
case "reformal":
case "reg":
case "reg-alfabank":
case "regberry":
case "reggi":
case "reghouse":
case "regionalrealty":
case "registre":
case "regnum":
case "relap":
case "relevate":
case "remontista":
case "republic":
case "retailcrm":
case "retailrocket":
case "rfc2":
case "rg":
case "ria":
case "riafan":
case "ridus":
case "riseteam":
case "rk37":
case "rl0":
case "rmansys":
case "rncb":
case "robasta":
case "robokassa":
case "rocketbank":
case "roem":
case "roi":
case "roomguru":
case "rosbank":
case "rsdn":
case "rt":
case "rtr-vesti":
case "runfo":
case "rusdialog":
case "ru-sf":
case "rusk":
case "russiabase":
case "rutoken":
//(".ru")
case "rutube":
case "ruweb":
case "s2cms":
case "s5o":
case "safework":
case "saint-petersburg":
case "salenames":
case "samelectrik":
case "sapato":
case "sape":
case "saveimg":
case "sberbank":
case "sbis":
case "sbrf":
case "scorocode":
case "searchengines":
case "searchlikes":
case "secretmag":
case "securelist":
case "sedmitza":
case "seeks":
case "selcdn":
case "selectel":
case "sendsay":
case "seonews":
case "seowizard":
case "sergey-ivanisov":
case "sergiopizza":
case "serovglobus":
case "serverclub":
case "shareholder":
case "shazoo":
case "shelvin":
case "shkolazhizni":
case "shopandmall":
case "showgogo":
case "site39":
case "sitesecure":
case "sitesoft":
case "skyscanner":
case "slasher":
case "slon":
case "smarthead":
case "smart-kinder":
case "smi2":
case "sm-news":
case "smozaika":
case "smsc":
case "smsnenado":
case "sngb":
//(".ru")
case "snob":
case "snp"://#tls.0
case "socialmart":
case "sociate":
case "socparsing":
case "soctraf":
case "softkey":
case "softmap":
case "soft-tuning":
case "softxaker":
case "sonikelf":
case "soulibre":
case "sovcombank":
case "sovest":
case "spark":
case "spark-interfax":
case "sport-express":
case "sports":
case "sprashivai":
case "sprinthost":
case "spsr":
case "ssd-life":
case "stableit":
case "stackoff":
case "stadium":
case "stazhirovka":
case "std3":
case "stdcpp":
case "steamstat":
case "stihi":
case "stihi-russkih-poetov":
case "streloy":
case "studyflow":
case "subnet05":
case "sudrf":
case "supereon":
case "superjob":
case "surfingbird":
case "svezem":
case "sweb":
case "syl":
case "syssoft":
case "systemintegra":
case "taganrogprav":
case "taiget":
case "takiedela":
case "talkdriver":
case "tamos":
//(".ru")
case "tao":
case "tc26":
case "technicparts":
case "tele2":
case "telenet":
case "tellows":
case "telphin":
case "temp-mail":
case "tendence":
case "terrabank":
case "terraelectronica":
case "terrasoft":
case "texterra":
case "the-bosha":
case "thechess":
case "thefurnish":
case "thequestion":
case "threatpost":
case "tickets":
case "timepad":
case "timezero":
case "tinkoff":
case "tiras":
case "tivision":
case "tjournal":
case "tmc-agent"://#tls1.0
case "tmfeed":
case "tmtm":
case "tns-counter":
case "tomesto":
case "topbrands":
case "toptop":
case "toster":
case "tourister":
case "tproger":
case "translate":
case "trashbox":
case "trendynyc":
case "trudcomplex":
case "trueconf":
case "trv-science":
case "tssltd":
case "ttk-chita":
case "tuneronline":
case "tu-tu":
case "tvc":
case "tvrain":
case "tvzvezda":
//(".ru")
case "tyumengorod":
case "ubank":
case "uenews":
case "u-f":
case "ufanet":
case "uglion":
case "uhtt":
case "ulmart":
case "ulogin":
case "u-mama":
case "uralsib":
case "urevroservis":
case "userstory":
case "utmagazine":
case "uxcrowd":
case "vashkontrol"://#tls1.0
case "vc":
case "vedomosti":
case "vedtver":
case "vellisa":
case "vengovision":
case "versia":
case "version6":
case "vfl":
case "viaset":
case "vid":
case "videomore":
case "videonow":
case "video-public":
case "vidfest":
case "vigo":
case "vingrad":
case "vitdim":
case "vitek":
case "vkmusicplay":
case "vknotify":
case "vkontakte":
case "vkontakte-hack":
case "vkorpe":
case "vnews34":
case "voipnotes":
case "vokzal62":
case "votpusk"://#tls1.0
case "vpnmonster":
case "vsexshop":
case "vtb":
case "vtb24":
case "warthunder":
case "watchalfavit":
case "webasyst":
case "web-canape":
//(".ru")
case "webhost1":
case "webim":
case "webmoney":
case "webnames":
case "webrover":
case "wedwillow":
case "wi-fi":
case "wildberries":
case "wildo":
case "windowstips":
case "woddarkages":
case "w-o-s":
case "wowworks":
case "wp-kama":
case "xakep":
case "xdlab":
case "ya":
case "yababa":
case "yadro":
case "yagla":
case "yandex":
case "yaostrov":
case "yaprobki":
case "yapx":
case "yarcube":
case "yatr":
case "yodnews":
case "yota":
case "youtube":
case "zaimitut":
case "zaimy-russia":
case "zaks":
case "zalinux":
case "zalogo":
case "zamos":
case "zapretservice":
case "zarplata":
case "zbp":
case "zeadmin":
case "zeronights":
case "zhyk":
case "zipler":
case "zp":
case "zrkuban":
case "zyxel":
bCatch=true;break;
//(".ru")
case "360tv":if(Dom[2]===""&&URI.path.startsWith("/static/"))bCatch=true;break;
case "3dnews":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "amiro":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "astr":if(Dom[2]==="st")bCatch=true;break;
case "astrakhan":if(Dom[2]==="")bCatch=true;break;
case "audit-it":if(URI.path.startsWith("/bitrix/"))bCatch=true;break;
case "avangard":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "besprovodnoe":if((Dom[2]===""&&URI.path==="/")||URI.path.startsWith("/carousel/")||URI.path.startsWith("/catalog/")||URI.path.startsWith("/image/")||URI.path.startsWith("/images/"))bCatch=true;break;
case "burgerking":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "com":if(Dom[2]==="autosport"||Dom[2]==="google"||Dom[2]==="kurs"||Dom[2]==="sinoptik"||Dom[2]==="zenmate")bCatch=true;break;
case "creambee":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "crimea":if(Dom[2]==="gup-krymenergo")bCatch=true;break;
case "dni":if(Dom[2]==="www")bCatch=true;break;
case "dns-shop":if(Dom[2]==="a"||Dom[2]==="c"||Dom[2]==="s")bCatch=true;break;//#cert
case "domru":if(Dom[2]===""||Dom[2]==="tv"||Dom[2]==="www"||Dom[2]==="zakupki")bCatch=true;break;
case "dronk":if(Dom[2]==="")bCatch=true;break;
case "drugvokrug":if(Dom[2]==="")bCatch=true;break;
case "factus":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "farpost":if((Dom[2]==="baza"&&Dom[3]==="static")||URI.path==="/favicon.ico"||URI.path.startsWith("/badbrowser?")||URI.path.startsWith("/resources/"))bCatch=true;break;
case "finam":if(Dom[2]===""||Dom[2]==="edox"||Dom[2]==="forex"||Dom[2]==="forexcabinet"||Dom[2]==="ibank"||Dom[2]==="travel"||Dom[2]==="www"||Dom[2]==="zaoik")bCatch=true;break;
case "get-albums":if(URI.path.startsWith("/cdn-cgi/"))bCatch=true;break;
case "gov":if(Dom[2]==="rk"||Dom[2]==="rkn")bCatch=true;break;
case "huifikator":if(URI.path==="/ajax-loader.gif"||URI.path==="/favicon.png"||URI.path==="/stats.php"||URI.path==="/style.css"||URI.path.startsWith("/images/")||URI.path.startsWith("/js/"))bCatch=true;break;
case "insales":if(Dom[2].substr(0,6)==="assets"&&URI.path.startsWith("/assets/"))bCatch=true;break;
//(".ru")
case "karaoke":if(Dom[2]==="api"||Dom[2]==="live"||Dom[2]==="static-cdn")bCatch=true;break;
case "kaspersky":if(Dom[2]==="academy"||Dom[2]==="acronis"||Dom[2]==="blog"||Dom[2]==="business"||Dom[2]==="dream"||Dom[2]==="newvirus"||Dom[2]==="safeboard"||Dom[2]==="support"||Dom[2]==="virusdesk")bCatch=true;break;
case "key":if(URI.path.startsWith("/catalog/")||URI.path.startsWith("/css/")||URI.path.startsWith("/fonts/")||URI.path.startsWith("/images/")||URI.path.startsWith("/img/")||URI.path.startsWith("/js/"))bCatch=true;break;
case "kulturologia":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "labirint":if(Dom[2]==="css"||Dom[2]==="img"||Dom[2]==="img1"||Dom[2]==="img2"||(Dom[2]==="www"&&(URI.path.startsWith("/ajax/")||URI.path.startsWith("/images/")||URI.path.startsWith("/uservisit/"))))bCatch=true;break;
case "lpgenerator":if(Dom[2]==="media"||Dom[2]==="static"||Dom[2]==="t")bCatch=true;break;
case "mail":if(Dom[2]!=="torg")bCatch=true;break;
case "mediametrics":if(Dom[2]==="")bCatch=true;break;
case "minsvyaz":if(Dom[2]==="reestr")bCatch=true;break;
case "msk":if(Dom[2]==="echo")bCatch=true;break;
//(".ru")
case "mts":
{
    switch(Dom[2])
    {
    case "autopay":
    case "b2b":
    case "ihelper":
    case "moicontent":
    case "pay":
    case "shop":
    case "ssl":
    case "ug":
    bCatch=true;break;
    }break;
}
//(".ru")
case "nanosemantics":if(Dom[2]==="biz"||Dom[2]==="cdn")bCatch=true;break;
case "ngs":if(Dom[2]===""||Dom[2]==="auto"||Dom[2]==="passport"||Dom[2]==="s")bCatch=true;break;
case "nic":if(Dom[2]===""||Dom[2]==="hosting"||Dom[2]==="m"||Dom[2]==="mail"||Dom[2]==="parking"||Dom[2]==="www")bCatch=true;break;
case "ntv":if(Dom[2]==="img2"||URI.path.startsWith("/images/"))bCatch=true;break;
case "office24":if(Dom[2]==="mail")bCatch=true;break;
case "opennet":if(Dom[2]===""||Dom[2]==="www")bCatch=true;break;
case "org":if(Dom[2]==="amnesty"||Dom[2]==="asi"||Dom[2]==="day"||Dom[2]==="linux"||Dom[2]==="valdikss")bCatch=true;break;
case "printdirect":if(URI.path==="/login"||URI.path.startsWith("/assets/")||URI.path.startsWith("/bootstrap/")||URI.path.startsWith("/cache/")||URI.path.startsWith("/css/")||URI.path.startsWith("/images/")||URI.path.startsWith("/js/")||URI.path.startsWith("/scripts/")||URI.path.startsWith("/style/")||URI.path.startsWith("/templates/"))bCatch=true;break;
case "r01":if(Dom[2]==="partner")bCatch=true;break;
case "rarus":if(Dom[2]==="job"||Dom[2]==="my")bCatch=true;break;
case "rghost":if(isDocument&&Dom[2]==="")
{
    var NewURI=URI.clone();
    NewURI.host="rgho.st";
    subject.redirectTo(NewURI);
}break;
//(".ru")
case "sotmarket":if(Dom[2]==="img"||URI.path.startsWith("/ajx/")||URI.path.startsWith("/d/"))bCatch=true;break;
case "spb":if(Dom[2]==="gov")bCatch=true;break;
case "subscribe":if(URI.path.startsWith("/css/")||URI.path.startsWith("/js/")||URI.path.startsWith("/img/")||URI.path.startsWith("/skin/")||URI.path.startsWith("/static/"))bCatch=true;break;
case "svpressa":if(Dom[2]==="")bCatch=true;break;
case "tass":if(Dom[2].substr(0,3)==="cdn")bCatch=true;break;
case "timeout":if(Dom[2]==="www")bCatch=true;break;
case "tvigle":if(Dom[2]==="cloud"||URI.path.startsWith("/crop/")||URI.path.startsWith("/static/")||URI.path.startsWith("/res/"))bCatch=true;break;
case "utro":if(Dom[2]==="")bCatch=true;break;
case "uweb":if(Dom[2].substr(0,2)==="s7"&&URI.path.startsWith("/src/"))bCatch=true;break;
case "vl":if(Dom[2]==="static"||URI.path==="/favicon.ico"||URI.path.startsWith("/ajax/")||URI.path.startsWith("/css/")||URI.path.startsWith("/images/")||URI.path.startsWith("/js/")||URI.path.startsWith("/widgets/"))bCatch=true;break;
}break;

case "rw":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "sa":/*!!!*/
switch(Dom[1])
{
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "sb":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "sc":/*!!!*/
switch(Dom[1])
{
case "google":
case "netrox":
case "prnt":
bCatch=true;break;
}break;

case "se":/*!!!*/
switch(Dom[1])
{
case "beetroot":
case "blogspot":
case "craigslist":
case "dfri":
case "emsisoft":
case "encyclopediadramatica":
case "google":
case "haxx":
case "imbox":
case "ipredator":
case "kau":
case "kth":
case "leap":
case "ovpn":
case "payson":
case "prq":
case "thepiratebay":
case "torrentproject":
case "triop":
case "yourserver":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="thepiratebay")bCatch=true;break;
}break;

case "services":/*!!!*/
if(Dom[1]==="marketingautomation")bCatch=true;break;

case "sg":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "sh":/*!!!*/
switch(Dom[1])
{
case "crt":
case "flo":
case "google":
case "habitat":
case "ian":
case "now":
case "popcorntime":
case "proxy":
case "pstadler":
case "puu":
case "surge":
case "transfer":
case "vds":
bCatch=true;break;
case "ftp":if(Dom[2]==="suche")bCatch=true;break;
}break;

case "si":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "jit":
case "youtube":
}break;

case "site":/*!!!*/
if(Dom[1]==="ccdns")bCatch=true;break;

case "sk":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "nasadomena":
case "sk-nic":
case "yadi":
case "youtube":
}break;

case "sl":/*!!!*/
if(Dom[1]==="com"&&Dom[2]==="google")bCatch=true;break;

case "sm":/*!!!*/
switch(Dom[1])
{
case "google":
case "puri":
bCatch=true;break;
}break;

case "sn":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "youtube":
bCatch=true;break;
}break;

case "so":/*!!!*/
switch(Dom[1])
{
case "bin":
case "google":
case "lurkmore":
bCatch=true;break;
}break;

case "social":/*!!!*/
if(Dom[1]==="mastodon")bCatch=true;break;

case "software":/*!!!*/
if(Dom[1]==="sigma")bCatch=true;break;

case "solutions":/*!!!*/
switch(Dom[1])
{
case "haschek":
case "platis":
bCatch=true;break;
}break;

case "soy":/*!!!*/
if(Dom[1]==="youtube")bCatch=true;break;

case "space":/*!!!*/
switch(Dom[1])
{
case "04dn8g4f":
case "cmtt":
case "coin":
case "fake-login":
case "kickassx":
case "magneto":
case "mercurius":
case "soundpark":
case "thanassis":
case "usbypass":
bCatch=true;break;
}break;

case "sr":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "srl":/*!!!*/
if(Dom[1]==="unblocked")bCatch=true;break;

case "st":/*!!!*/
switch(Dom[1])
{
case "alfabank":
case "av":
case "avito":
case "cipherli":
case "google":
case "li":
case "process":
case "shorte":
case "top":
case "x":
case "yandex":
bCatch=true;break;
case "prom":if(Dom[2]==="ua"&&Dom[3]==="images")bCatch=true;break;
}break;

case "su":/*!!!*/
switch(Dom[1])
{
case "aimp":
case "akuma":
case "cryptoworld":
case "decker":
case "drp":
case "e-news":
case "free-soft":
case "idvd":
case "ipic":
case "miui":
case "monsterbeats":
case "prologic":
case "ssoft":
case "stolica-s":
case "webmoney":
case "worldcarding":
bCatch=true;break;
}break;

case "support":/*!!!*/
if(Dom[1]==="you")bCatch=true;break;

case "sv":/*!!!*/
switch(Dom[1])
{
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "sx":/*!!!*/
if(Dom[1]==="livetv")bCatch=true;break;

case "td":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "team":/*!!!*/
if(Dom[1]==="facility")bCatch=true;break;

case "tech":/*!!!*/
switch(Dom[1])
{
case "upml":
bCatch=true;break;
case "sourced":if(Dom[2]==="blog")bCatch=true;break;
}break;

case "test":/*!!!*/
subject.cancel(Components.results.NS_BINDING_ABORTED);break;

case "tg":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "th":/*!!!*/
if(Dom[1]==="co"&&(Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "tj":/*!!!*/
switch(Dom[1])
{
case "tcell":
case "the":
bCatch=true;break;
case "com":if(Dom[2]==="google")bCatch=true;break;
}break;

case "tk":/*!!!*/
switch(Dom[1])
{
case "google":
case "patthoyts":
case "tcl":
case "woafre":
bCatch=true;break;
}break;

case "tl":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "tm":/*!!!*/
switch(Dom[1])
{
case "asterios":
case "google":
bCatch=true;break;
}break;

case "tn":/*!!!*/
switch(Dom[1])
{
case "google":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "to":/*!!!*/
switch(Dom[1])
{
case "1tube":
case "4pda":
case "amzn":
case "anon":
case "anonym":
case "bigcinema":
case "bigfile":
case "cxz":
case "dev":
case "dropfile":
case "easycrypt":
case "easylist":
case "encrypt":
case "exfs":
case "google":
case "hdstream":
case "isohunt":
case "lnk":
case "load":
case "lurkmore":
case "nnmclub":
case "onion":
case "ovpn":
case "phonenumber":
case "piratebay":
case "tawk":
case "thepiratebay":
case "ti":
case "toloka":
case "torrenty":
case "tshare":
case "uloz":
case "uploads":
case "xa":
case "yp":
bCatch=true;break;
case "ul":if(isDocument)
subject.redirectTo(Services.io.newURI(URI.path.startsWith("/folder/")?"http://uploaded.net/folder/"+URI.path.substr(8):"http://uploaded.net/file"+URI.path,null,null));break;
}break;

case "today":/*!!!*/
switch(Dom[1])
{
case "archive":
case "bash":
case "freelance":
case "thrive":
case "type":
case "webcall":
bCatch=true;break;
}break;

case "tools":/*!!!*/
if(Dom[1]==="kali")bCatch=true;break;

case "top":/*!!!*/
switch(Dom[1])
{
case "aff1xstavka":
case "cback":
case "etproxy":
case "freedon":
case "kickassproxy":
case "omemo":
case "redstode":
case "tpblist":
case "unlockpro":
bCatch=true;break;
}break;

case "tr":/*!!!*/
if(Dom[1]==="com"&&(Dom[2]==="blogspot"||Dom[2]==="google"||Dom[2]==="yandex"||Dom[2]==="youtube"||(Dom[2]==="turkcell"&&(Dom[2]==="curio"||Dom[2].startsWith("s")))))bCatch=true;break;

case "training":/*!!!*/
if(Dom[1]==="terminal")bCatch=true;break;

case "travel":/*!!!*/
switch(Dom[1])
{
case "tutu":
case "webmoney":
bCatch=true;break;
}break;

case "trust":/*!!!*/
if(Dom[1]==="nccgroup")bCatch=true;break;

case "tt":/*!!!*/
switch(Dom[1])
{
case "db":
case "google":
bCatch=true;break;
}break;

case "tv":/*!!!*/
switch(Dom[1])
{
case "1internet":
case "allfon":
case "cmlt":
case "currenttime":
case "e-pay":
case "eurovision":
case "football-russia":
case "footballua":
case "gisclub":
case "hitbox":
case "ivi":
case "kodi":
case "livecoding":
case "lostfilm":
case "megafon":
case "nativeroll":
case "ororo":
case "ororo-mirror":
case "ovva":
case "periscope":
case "plex":
case "smashcast":
case "topcinema":
case "tushkan":
case "tviz":
case "twitch":
case "ukrstream":
case "vidible":
case "youtube":
case "zendesk":
bCatch=true;break;
case "okko":if(Dom[2]==="movies")bCatch=true;break;
case "tet":if(Dom[2]==="static")bCatch=true;break;
}break;

case "tw":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "tz":/*!!!*/
if(Dom[1]==="co"&&(Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;

case "ua":/*!!!*/
switch(Dom[1])
{
//(".ua")
case "0312":
case "032":
case "0332":
case "0342":
case "0352":
case "0362":
case "0372":
case "0382":
case "0412":
case "0432":
case "0462":
case "0472":
case "048":
case "0522":
case "0532":
case "0542":
case "0552":
case "056":
case "0564":
case "057":
case "061":
case "0642":
case "112":
case "1gb"://#tls1.0
case "1plus1":
case "27":
case "2gis":
case "44":
case "5":
case "62":
case "add":
case "agromat"://#tls1.0
case "ain":
case "allsoft":
case "apostrophe":
case "auchan":
case "aval":
case "avast":
case "banker":
case "bemobile":
case "besplatka":
case "bigl":
case "bin"://#tls1.0
case "binotel":
case "bit":
case "bitrix24":
case "busfor":
case "canon":
//(".ua")
case "cdn":
case "citrus":
case "citysites":
case "comments":
case "country":
case "credit365":
case "delo":
case "depo":
case "divani":
case "doc":
case "donbass":
case "dou":
case "drweb":
case "eurabota":
case "f":
case "flagma":
case "focus":
case "football24":
case "freelance":
case "free-lance":
case "freelawyer"://#tls1.0
case "gazeta":
case "gismeteo":
case "glavnoe":
case "globalcredit":
case "globalfreelance":
case "globalmoney":
case "google":
case "grad":
case "guru":
case "harvest":
case "hh":
case "hisense":
case "hostmaster":
case "hostpro":
case "hromadske":
case "hvosting":
case "infa":
case "instankoservis":
case "intellias":
case "io":
case "iok":
case "ipay":
case "istore":
case "itweekend":
case "jobs":
case "joinfo":
case "kabanchik":
case "kinoafisha":
case "kreditmarket":
case "kuna":
case "kyivstar":
case "lb":
//(".ua")
case "lifecell":
case "luxnet":
case "lvivskyi-kvartal":
case "matchday":
case "megabite":
case "meteoprog":
case "modnakasta":
case "momondo":
case "monexy":
case "moneyboom":
case "moyo":
case "mport":
case "novaposhta":
case "obmenka":
case "obyava":
case "okko":
case "osvita":
case "overclockers":
case "payback":
case "pb":
case "philips":
case "podcastersparadise":
case "podrobnosti":
case "pogliad":
case "pokupon":
case "posh":
case "privat24":
case "privatbank":
case "privatmarket":
case "promodo":
case "rabota":
case "rbc":
case "register":
case "repka":
case "rieltor":
case "romastyle":
case "roomer":
case "rozetka":
case "sberbank":
case "sinoptik":
case "site":
case "smarthouse":
case "smarts":
case "smsc":
case "softkey":
case "softserve":
case "sport-express":
case "strana":
case "stylus":
case "talent":
case "thehost":
case "themir":
case "tickets":
case "topmall":
case "tsn":
//(".ua")
case "turbosms":
case "tvgid":
case "uapay":
case "ukrinform":
case "unian":
case "unit":
case "upc":
case "uteka":
case "uticket":
case "vashmagazin":
case "vkino":
case "vlasne":
case "vodiy":
case "vps":
case "vtb":
case "webmoney":
case "wnet":
case "work":
case "xsport":
case "yandex":
case "youtube":
case "yt":
case "zn":
bCatch=true;break;
//(".ua")
case "20minut":if(Dom[2]==="img"||Dom[2]==="te"||Dom[2]==="vn")bCatch=true;break;
case "24tv":if(URI.path.startsWith("/images/")||URI.path.startsWith("/javascripts/")||URI.path.startsWith("/stylesheets/"))bCatch=true;break;
case "3mob":if(Dom[2]==="sim")bCatch=true;break;
case "autocentre":if(Dom[2]===""||Dom[2]==="cdn2"||Dom[2]==="ct"||Dom[2]==="www")bCatch=true;break;
case "ck":if(Dom[2]==="discover")bCatch=true;break;
case "com":
{
    switch(Dom[2])
    {
    //(".com.ua")
    case "04141":
    case "04563":
    case "04598":
    case "04868":
    case "0512":
    case "05136":
    case "05161":
    case "05447":
    case "0566":
    case "0569":
    case "06153":
    case "0619":
    case "0623":
    case "06236":
    case "06237":
    case "06239":
    case "06242":
    case "06252":
    case "06267":
    case "06272":
    case "06274":
    case "06277":
    case "0629":
    case "06452":
    case "20k":
    case "3849":
    case "3g-internet-svit":
    case "3gstar":
    case "4594":
    case "5692":
    case "6262":
    case "6264":
    case "antikor":
    case "aoz":
    case "arou":
    case "bankbook":
    case "bankvostok":
    case "beconnect":
    case "bitcoin24":
    case "blablacar":
    case "brudno":
    case "btcbank":
    case "btc-trade":
    case "businessvisit":
    case "callmenow":
    case "cf-rabota":
    case "champion"://#tls1.0
    case "childdevelop":
    case "city":
    case "c-tel":
    case "declarations":
    //(".com.ua")
    case "deshevle-net":
    case "downloadmaster":
    case "e-btc":
    case "ema":
    case "energy-shop":
    case "epravda":
    case "esputnik":
    case "eurointegration":
    case "evro-tel":
    case "extreme-device":
    case "fan-sport":
    case "fastvps":
    case "fclviv":
    case "foxtrot":
    case "freehost":
    case "gadgetstyle"://#tls1.0
    case "gmhost":
    case "google":
    case "gpssoft":
    case "happynet":
    case "holder":
    case "igas":
    case "img":
    case "iok":
    case "istat24":
    case "kid-auto":
    case "knpartners":
    case "kurs":
    case "leoderm":
    case "lifecell":
    case "local":
    case "master-plus":
    case "m-city":
    case "mediatec":
    case "mediatraffic":
    case "megamakler":
    case "mir3g":
    case "mirsmart":
    case "mirtechniki":
    case "mobi-china":
    case "mobirator":
    case "mobitech":
    case "ms-deluxe":
    case "mts":
    case "multi-market":
    case "obolok":
    case "payback":
    case "pesoto":
    case "phonet":
    case "planshetandroid":
    case "pn":
    case "politerno":
    case "portmone":
    case "pravda":
    case "pravda-kr":
    case "privatblog":
    //(".com.ua")
    case "privatization":
    case "ptclick":
    case "rabota":
    case "rialtotenders":
    case "rozetka":
    case "salemor":
    case "satmarket":
    case "sbrf":
    case "skobka":
    case "skyscanner":
    case "sota-buh":
    case "ssltools":
    case "tall":
    case "thehost":
    case "ticketspot":
    case "took":
    case "ubanks":
    case "uklon":
    case "ukraine":
    case "urdn":
    case "usb-modem":
    case "vicshop":
    case "vitech":
    case "vivat-book":
    case "vkino":
    case "vseceni":
    case "vsenovostroyki":
    case "websters":
    case "world-smartphones":
    case "yandex":
    case "youcontrol":
    case "youtube":
    case "zlatopil":
    bCatch=true;break;
    //(".com.ua")
    case "5ok":if(Dom[3]==="www"&&(URI.path.startsWith("/_ui/")||URI.path.startsWith("/cart/")||URI.path.startsWith("/medias/")))bCatch=true;break;
    case "bus":if(URI.path.startsWith("/static/"))bCatch=true;break;
    case "fozzyshop":if(URI.path.startsWith("/img/")||URI.path.startsWith("/modules/")||URI.path.startsWith("/themes/")||URI.path.substr(6,14)==="-home_default/"||URI.path.substr(6,15)==="-large_default/")bCatch=true;break;
    }break;
}
//(".ua")
case "comfy":if(Dom[2]===""&&(URI.path.startsWith("/cdn-cgi/")||URI.path.startsWith("/media/")||URI.path.startsWith("/persistent_login/")||URI.path.startsWith("/skin/")))bCatch=true;break;
case "dp":if(Dom[2]==="gorod"||Dom[2]==="informator")bCatch=true;break;
case "easypay":if(Dom[2]!=="feedback")bCatch=true;break;
case "finance":if(Dom[2]===""||Dom[2]==="context"||Dom[2]==="forum"||Dom[2]==="labc"||Dom[2]==="static")bCatch=true;break;
case "giga":if(Dom[2]==="forum")bCatch=true;break;
//(".ua")
case "gov":
{
    switch(Dom[2])
    {
    case "bank"://#tls1.0
    case "cybercrime":
    case "ecomapa":
    case "kievcity":
    case "land":
    case "minjust":
    case "nazk":
    case "npu":
    case "poslugy":
    case "prozorro":
    case "ssu":
    case "uz"://#tls1.0 (booking.uz.gov.ua)
    bCatch=true;break;
    }break;
}
//(".ua")
case "hotline":if(URI.path==="/favicon.ico"||URI.path.startsWith("/img/")||URI.path.startsWith("/public/")||URI.path.startsWith("/js/"))bCatch=true;break;
case "i":
{
    switch(Dom[2])
    {
    case "finance":
    case "goroskop":
    case "i"://#tls1.0
    case "i3"://#tls1.0
    case "mail":
    case "map":
    case "mc8":
    case "os1":
    case "passport":
    case "perevod":
    case "prikol":
    case "r":
    case "tv":
    case "vs1":
    case "weather":
    bCatch=true;break;
    }break;
}
case "in":if(Dom[2]==="e-dem"||Dom[2]==="egogo"||Dom[2]==="eway"||Dom[2]==="ipnews"||Dom[2]==="it-community"||Dom[2]==="konkurent"||Dom[2]==="t2t"||(Dom[2]==="torrent-tv"&&URI.path.startsWith("/cdn-cgi/")))bCatch=true;break;
case "intertelecom":if(Dom[2]==="assa")bCatch=true;break;
case "kh":if(Dom[2]==="2day")bCatch=true;break;
case "kiev":if(Dom[2]==="avtovokzal"||Dom[2]==="e-kvytok"||Dom[2]==="itbc")bCatch=true;break;
case "ks":if(Dom[2]==="simplix")bCatch=true;break;
case "lun":if(Dom[2]==="cdn"||Dom[2]==="day"||Dom[2]==="novostroyki"||Dom[2]==="orbit2"||Dom[2]==="sosedi"||Dom[2]==="www")bCatch=true;break;
case "lviv":if((Dom[2]==="loe"&&Dom[3]==="info")||Dom[2]==="varianty")bCatch=true;break;
//(".ua")
case "meta":
{
    if(URI.path==="/favicon_small.ico"||URI.path.startsWith("/brw_reg.js")||URI.path.startsWith("/cnt/")||URI.path.startsWith("/img/")||URI.path.startsWith("/js/"))bCatch=true;break;
    switch(Dom[2])
    {
    case "":
    case "context":
    case "foto":
    case "media":
    case "news":
    case "passport":
    case "picsnews":
    case "pogoda":
    case "static":
    case "video":
    case "webmail":
    bCatch=true;break;
    }break;
}
//(".ua")
case "net":if(Dom[2]==="bel"||Dom[2]==="blocklist"||Dom[2]==="c8"||Dom[2]==="censor")bCatch=true;break;
case "olx":if(Dom[2]===""||Dom[2]==="api"||Dom[2]==="s1"||Dom[2]==="s2"||Dom[2]==="ssl"||Dom[2]==="www")bCatch=true;break;
case "org":
{
    switch(Dom[2])
    {
    case "humanrights":
    case "investigator":
    case "kamaok":
    case "lgbt":
    case "nix":
    case "pravoslaviavolyni":
    case "risu":
    bCatch=true;break;
    }break;
}
//(".ua")
case "oschadbank":if(Dom[2]==="online")bCatch=true;break;
case "pl":if(Dom[2]==="tribuna")bCatch=true;break;
case "pp":if(Dom[2]==="ilya")bCatch=true;break;
case "prom":if(Dom[2]==="my"||Dom[2]==="support")bCatch=true;break;
case "te":if(Dom[2]==="109"||Dom[2]==="realno")bCatch=true;break;
case "telekritika":if(Dom[2]==="ru"||Dom[2]==="ua")bCatch=true;break;
case "vn":if(Dom[2]==="discover")bCatch=true;break;
case "vodafone":if(Dom[2]!=="on-line")bCatch=true;break;
}break;

case "ug":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "youtube":
bCatch=true;break;
case "co":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "uk":/*!!!*/
switch(Dom[1])
{
case "emsisoft":
case "pigtailsinpaint":
case "wowjs":
bCatch=true;break;
//(.uk)
case "co":
{
    switch(Dom[2])
    {
    case "andylangton":
    case "arstechnica":
    case "bbci":
    case "benjojo":
    case "blackberryexclusive":
    case "blogspot":
    case "centurymedia":
    case "condenast":
    case "digitalworldz":
    case "emisaccess":
    case "eventbrite":
    case "geegeez"://#tls1.0
    case "google":
    case "guardianapps":
    case "guim":
    case "linn":
    case "lukasa":
    case "marcus-povey":
    case "motorola":
    case "news":
    case "newsletter2go":
    case "olifer":
    case "pcreview":
    case "regmedia":
    case "reviews":
    case "scotthelme":
    case "socialistworker":
    case "theregister":
    case "thesun":
    case "thetimes":
    case "ukfast":
    case "viacreative":
    case "voucherslug":
    case "wired":
    case "yourvotematters":
    case "youtube":
    case "zoella":
    bCatch=true;break;
    case "bbc":if(Dom[3]==="fig"||Dom[3]==="newsimg"||Dom[3]==="open"||Dom[3]==="static")bCatch=true;break;
    case "gridhosted":if(Dom[3]==="org"&&Dom[4]==="justiceforpunters")bCatch=true;break;
    case "ibtimes":if(Dom[3]==="g"||Dom[3]==="gc")bCatch=true;break;
    case "telegraph":if(Dom[3]==="eip")bCatch=true;break;
    }break;
}
//(.uk)
case "gov":if(Dom[2]===""||Dom[2]==="ncsc"||Dom[2]==="service"||Dom[2]==="www")bCatch=true;break;
case "me":if(Dom[2]==="dan")bCatch=true;break;
case "org":
    switch(Dom[2])
    {
    case "dephormation":
    case "greennet":
    case "indymedia":
    case "knightnet":
    case "nddcbru":
    case "premier":
    case "swp":
    bCatch=true;break;
    }break;
}break;

case "us":/*!!!*/
switch(Dom[1])
{
case "amung":
case "asep":
case "bram":
case "disq":
case "donttrack":
case "ericw":
case "fourfront":
case "franceftars":
case "geni":
case "google":
case "icio":
case "imageshack":
case "lanik":
case "mastercard":
case "phreaker":
case "replicant":
case "sharknet":
case "streaming-tv":
case "thesafety":
case "ultrasurf"://#tls1.0 (ultrasurf.us)
case "zloy":
case "zoom":
bCatch=true;break;
}break;

case "uy":/*!!!*/
switch(Dom[1])
{
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="blogspot"||Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "uz":/*!!!*/
switch(Dom[1])
{
case "google":
bCatch=true;break;
case "co":if(Dom[2]==="google")bCatch=true;break;
}break;

case "vc":/*!!!*/
switch(Dom[1])
{
case "verified":
bCatch=true;break;
case "com":if(Dom[2]==="google")bCatch=true;break;
case "staya":if(Dom[2]==="jobs")bCatch=true;break;
}break;

case "ve":/*!!!*/
switch(Dom[1])
{
case "co":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
case "com":if(Dom[2]==="google"||Dom[2]==="youtube")bCatch=true;break;
}break;

case "vg":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "vi":/*!!!*/
if(Dom[1]==="co"&&Dom[2]==="google")bCatch=true;break;

case "video":/*!!!*/
if(Dom[1]==="ixbt")bCatch=true;break;

case "vn":/*!!!*/
switch(Dom[1])
{
case "blogspot":
case "google":
case "youtube":
bCatch=true;break;
case "com":if(Dom[2]==="google")bCatch=true;break;
}break;

case "vu":/*!!!*/
if(Dom[1]==="google")bCatch=true;break;

case "watch":/*!!!*/
if(Dom[1]==="dns")bCatch=true;break;

case "website":/*!!!*/
switch(Dom[1])
{
case "dostup":
case "refbanners":
bCatch=true;break;
}break;

case "wiki":/*!!!*/
if(Dom[1]==="traditio")bCatch=true;break;

case "work":/*!!!*/
switch(Dom[1])
{
case "natocdn":
case "workinghardinit":
bCatch=true;break;
}break;

case "works":/*!!!*/
switch(Dom[1])
{
case "howdns":
case "rutracker":
bCatch=true;break;
}break;

case "world":/*!!!*/
switch(Dom[1])
{
case "bsg":
case "data":
case "ttc":
bCatch=true;break;
}break;

case "ws":/*!!!*/
switch(Dom[1])
{
case "blackbiz":
case "cbox":
case "cont":
case "cyph":
case "geocities":
case "google":
case "lfootball":
case "livefootball":
case "myfootball":
case "nnm-club":
case "nzbfinder":
case "salda":
case "tilda":
case "tmwsd":
case "uplod":
case "utbs":
case "xn--uih"://#idn: thismessagewillselfdestruct.com (unicode image)
bCatch=true;break;
}break;

case "wtf":/*!!!*/
if(Dom[1]==="jpg")bCatch=true;break;

case "xn--p1ai":/*!!!*/
switch(Dom[1])
{
case "xn--152-1dd8d"://#idn: 152fz.rf (cyrillic)
case "xn----7sbfkscajgsvub0a1l"://#idn: kvartiry-domiki.rf (cyrillic)//#tls1.0
case "xn--80aaggvgieoeoa2bo7l"://#idn: nadal'niyvostok.rf (cyrillic)//#unsafe-negotiation
case "xn--80ag3aejvc"://#idn: fanfrog.rf (cyrillic)
case "xn--80ailbalrjicxf"://#idn: antipodpiski.rf (cyrillic)
case "xn--80aqc2a"://#idn: ajri.rf (cyrillic)
case "xn----8sbfgf1bdjhf5a1j"://#idn: modnye-slova.rf (cyrillic)
case "xn--90aha1bhc1b"://#idn: zerebro.rf (cyrillic)
case "xn--b1aaefabsd1cwaon"://#idn: doverievseti.rf (cyrillic)
case "xn--b1aew"://#idn: mvd.rf (cyrillic)
case "xn----dtbofgvdd5ah"://#idn: kto-zvonit.rf (cyrillic)
bCatch=true;break;
}break;

case "xyz":/*!!!*/
switch(Dom[1])
{
case "1xorp":
case "abc":
case "albumdl":
case "datmusic":
case "emerproxy":
case "gens":
case "henkaku":
case "i2pbote":
case "med-online":
case "shbr":
case "twngo":
bCatch=true;break;
}break;

case "yandex":/*!!!*/
if(Dom[1]==="clickhouse")bCatch=true;break;

case "za":/*!!!*/
if(Dom[1]==="co"&&(Dom[2]==="blogspot"||Dom[2]==="google"||Dom[2]==="routersetup"||Dom[2]==="youtube"))bCatch=true;break;

case "zm":/*!!!*/
if(Dom[1]==="co"&&Dom[2]==="google")bCatch=true;break;

case "zone":/*!!!*/
switch(Dom[1])
{
case "bi":
case "itch":
case "trust":
bCatch=true;break;
}break;

case "zw":/*!!!*/
if(Dom[1]==="co"&&(Dom[2]==="google"||Dom[2]==="youtube"))bCatch=true;break;
//==========
    }
    if (bCatch)
    {
        if(isBreak)
        {
            subject.cancel(Components.results.NS_BINDING_ABORTED);
            consoleService.logStringMessage("@Fallback HTTPS: " + prevUriSpec);
        }
        else if(Services.prefs.getBoolPref("extensions.useraddon.force_https"))
        {
            var NewURI=URI.clone();
            NewURI.scheme="https";
            subject.redirectTo(NewURI);
            ++httpsForced;
        }
    }
}//(http requests)
//(https requests)
else if(URI.schemeIs("https"))
{
    var newHost=null;
    var ishttps=false;
    switch(Dom[0])
    {
//==========
case "ac":/*!!!https*/
if(Dom[1]==="sci-hub"&&isTorRedirect())newHost="scihub22266oqcxt.onion";break;

case "ae":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "al":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "am":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "ar":/*!!!https*/
if(Dom[1]==="com"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "as":/*!!!https*/
if(Dom[1]==="tig"&&Dom[2]==="mike"&&isTorRedirect())newHost="tigas3l7uusztiqu.onion";break;

case "at":/*!!!https*/
switch(Dom[1])
{
case "co":if(Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;
case "rueckgr":if(Dom[2]==="torstatus"&&isTorRedirect()){ishttps=true;newHost="jlve2y45zacpbz6s.onion";}break;
}break;

case "au":/*!!!https*/
if(Dom[1]==="com"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "ba":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "be":/*!!!https*/
switch(Dom[1])
{
case "blogspot":if(Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;
case "youtu":if(isDocument)
{
    var newLink=URI.path.substr(1);
    delim=newLink.indexOf('?');
    if(delim>0)newLink=newLink.substr(0,delim);
    subject.redirectTo(Services.io.newURI("https://www.youtube.com/watch?v="+newLink,null,null));
}break;
}break;

case "bg":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "br":/*!!!https*/
if(Dom[1]==="com"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "by":/*!!!https*/
switch(Dom[1])
{
case "com":if(Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;
case "tut":if(isDocument&&URI.path.startsWith("/#ua:"))
{
    var NewURI=URI.clone();
    NewURI.path="/";
    subject.redirectTo(NewURI);
}break;
}break;

case "bz":/*!!!https*/
if(Dom[1]==="sci-hub"&&isTorRedirect())newHost="scihub22266oqcxt.onion";break;

case "ca":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "cab":/*!!!https*/
if(isDocument&&Dom[1]==="onion"&&Dom[2]!==""&&isTorRedirect())
{
    var tmp="://"+Dom[2]+".onion/";
    tmp="data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPiFUb3IyV2ViPC90aXRsZT48L2hlYWQ+PGJvZHk+"+Services.wm.getMostRecentWindow("navigator:browser").btoa(URI.spec+"<br /><a href=\"http"+tmp+"\">http"+tmp+"</a><br /><a href=\"https"+tmp+"\">https"+tmp+"</a></body></html>");
    subject.redirectTo(Services.io.newURI(tmp,null,null));
}break;

case "cash":/*!!!https*/
if(Dom[1]==="z"&&Dom[2]===""&&isTorRedirect())newHost="zcashph5mxqjjby2.onion";break;

case "cc":/*!!!https*/
if(Dom[1]==="sci-hub"&&isTorRedirect())newHost="scihub22266oqcxt.onion";break;

case "ch":/*!!!https*/
switch(Dom[1])
{
case "bitmessage":if(isTorRedirect()){ishttps=true;newHost="bitmailendavkbec.onion";}break;
case "blogspot":if(Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;
case "gurochan":if(isTorRedirect())newHost="gurochanocizhuhg.onion";break;
case "lolicore":if(isTorRedirect())newHost="lolicore75rq3tm5.onion";break;
}break;

case "cl":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "co":/*!!!https*/
if(Dom[1]==="com"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "com":/*!!!https*/
switch(Dom[1])
{
case "aliexpress":if(isDocument&&(delim=URI.path.indexOf("?ws_ab_test="))>0)
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim);
    subject.redirectTo(NewURI);
}break;
case "anonops":if(isTorRedirect()){ishttps=true;newHost="anonopsmazrmrvws.onion";}break;
case "apple":if(isDocument&&Dom[2]==="itunes"&&((delim=URI.path.indexOf("?ls="))>0||(delim=URI.path.indexOf("?uo="))>0))
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim);
    subject.redirectTo(NewURI);
}break;
case "aspnetcdn":if(cdnPath&&URI.spec.startsWith("https://ajax.aspnetcdn.com/ajax/"))//#cdn
try{subject.getRequestHeader("Origin");}catch(e){
{
    var Url=URI.spec.substr(8);
    delim=Url.indexOf('?');if(delim>0)Url=Url.substr(0,delim);
    Url=cdnLoad(Url);if(Url)subject.redirectTo(Services.io.newURI(Url,URI.originCharset,null));
}}break;
case "blogspot":if(isDocument&&Dom[2]!=="")cookieSet(subject,"blogspot.com.txt");break;//#cookie
case "codeproject":if(isDocument&&URI.spec.startsWith("https://www.codeproject.com/KB/"))//#referer
subject.setRequestHeader("Referer","https://www.codeproject.com",false);break;
case "comodo":if(isDocument&&((delim=URI.path.indexOf("?track"))>0||(delim=URI.path.indexOf("&track"))>0||(delim=URI.path.indexOf("&amp;track="))>0))
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim);
    subject.redirectTo(NewURI);
}break;
case "cyph":if(isTorRedirect()){ishttps=true;newHost=URI.host.substr(0,URI.host.length-8)+"cyphdbyhiddenbhs.onion";}break;
case "deepdotweb":if(isTorRedirect()){newHost="deepdot35wvmeyd5.onion";}break;
case "duckduckgo":if(isTorRedirect()){ishttps=true;newHost="3g2upl4pq6kufc4m.onion";}break;
case "facebook":if(isDocument)
{
    if(Dom[2]===""||Dom[2].indexOf('-')>0){ishttps=true;newHost="www.facebook.com";}
    else if(isTorRedirect()){ishttps=true;newHost=(Dom[2]==="code")?"code.facebookcorewwwi.onion":"www.facebookcorewwwi.onion";}
    else if(
        (delim=URI.path.indexOf("?comment_id="))>0||
        (delim=URI.path.indexOf("&comment_id="))>0||
        (delim=URI.path.indexOf("?comment_tracking="))>0||
        (delim=URI.path.indexOf("&comment_tracking="))>0||
        (delim=URI.path.indexOf("?entry_point="))>0||
        (delim=URI.path.indexOf("&entry_point="))>0||
        (delim=URI.path.indexOf("?fref="))>0||
        (delim=URI.path.indexOf("&fref="))>0||
        (delim=URI.path.indexOf("?hc_location="))>0||
        (delim=URI.path.indexOf("&hc_location="))>0||
        (delim=URI.path.indexOf("?hc_ref="))>0||
        (delim=URI.path.indexOf("&hc_ref="))>0||
        (delim=URI.path.indexOf("?helpref="))>0||
        (delim=URI.path.indexOf("&helpref="))>0||
        (delim=URI.path.indexOf("?pnref="))>0||
        (delim=URI.path.indexOf("&pnref="))>0||
        (delim=URI.path.indexOf("?ref_"))>0||
        (delim=URI.path.indexOf("&ref_"))>0||
        (delim=URI.path.indexOf("?reply_comment_id="))>0||
        (delim=URI.path.indexOf("&reply_comment_id="))>0||
        (delim=URI.path.indexOf("?set="))>0||
        (delim=URI.path.indexOf("&set="))>0||
        (delim=URI.path.indexOf("?video_source="))>0||
        (delim=URI.path.indexOf("&video_source="))>0)
    {
        var NewURI=URI.clone();
        NewURI.path=NewURI.path.substr(0,delim);
        subject.redirectTo(NewURI);
    }
}break;
case "fb":if(isDocument&&Dom[2]===""){ishttps=true;newHost="www.facebook.com";}break;
case "fbsbx":if(isTorRedirect()){ishttps=true;newHost=URI.host.substr(0,URI.host.length-9)+"fbsbx2q4mvcl63pw.onion";}break;
case "google":if(isDocument&&Dom[2]==="play"&&URI.path.startsWith("/store"))
{
    delim=URI.path.indexOf("&rdid=");
    if(delim>0)
    {
        var NewURI=URI.clone();
        NewURI.path=NewURI.path.substr(0,delim);
        subject.redirectTo(NewURI);
    }
    else if(URI.path.indexOf("&hl=",6)<0&&URI.path.indexOf("?hl=",6)<0)
    {
        var NewURI=URI.clone();
        NewURI.path=NewURI.path+(NewURI.path.indexOf('?',6)>0?"&hl=en":"?hl=en");
        subject.redirectTo(NewURI);
    }
}break;
case "googleapis":if(cdnPath&&URI.spec.startsWith("https://ajax.googleapis.com/ajax/libs/"))//#cdn
try{subject.getRequestHeader("Origin");}catch(e){
{
    var Url=URI.spec.substr(8);
    delim=Url.indexOf('?');if(delim>0)Url=Url.substr(0,delim);
    Url=cdnLoad(Url);if(Url)subject.redirectTo(Services.io.newURI(Url,URI.originCharset,null));
}}break;
case "guerrillamail":if(isTorRedirect()){newHost="grrmailb3fxpjbwm.onion";}break;
case "instagram":if(isDocument&&Dom[2]==="www"&&URI.path.startsWith("/p/")&&(delim=URI.path.indexOf('/',3))>0&&++delim<URI.path.length)
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim);
    subject.redirectTo(NewURI);
}break;
case "jquery":if(cdnPath&&URI.prePath===("https://code.jquery.com"))//#cdn
try{subject.getRequestHeader("Origin");}catch(e){
{
    var Url=URI.spec.substr(8);
    delim=Url.indexOf('?');if(delim>0)Url=Url.substr(0,delim);
    Url=cdnLoad(Url);if(Url)subject.redirectTo(Services.io.newURI(Url,URI.originCharset,null));
}}break;
case "martau":if(Dom[2]==="www"){ishttps=true;newHost="martau.com";}break;
case "microsoft":if(Dom[2]==="ajax"&&URI.spec.startsWith("https://ajax.microsoft.com/ajax/")){ishttps=true;newHost="ajax.aspnetcdn.com";}break;
case "playbuzz":if(isDocument&&Dom[2]==="www"&&URI.path.startsWith("/item/")&&(delim=URI.path.indexOf('?',6))>0)
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim);
    subject.redirectTo(NewURI);
}break;
case "protonmail":if(isTorRedirect()){ishttps=true;newHost="protonirockerxow.onion";}break;
case "realvnc":if(isDocument&&URI.spec.startsWith("https://www.realvnc.com/download/vnc/"))//#referer
subject.setRequestHeader("Referer","https://www.realvnc.com",false);break;
case "ru-board":if(isDocument&&URI.prePath==="https://forum.ru-board.com")
{
    if(Services.prefs.getBoolPref("extensions.useraddon.cookies.fullmode.forum.ru-board.com")||(
    URI.path.startsWith("/post.cgi")||
    URI.path.startsWith("/postings.cgi")||
    URI.path.startsWith("/topic.cgi?forum=35&topic=")||
    URI.path.startsWith("/topic.cgi?forum=51&topic=")||
    URI.path.startsWith("/topic.cgi?forum=55&topic=")||
    URI.path.startsWith("/topic.cgi?forum=75&topic=")||
    URI.path.startsWith("/topic.cgi?forum=93&topic=")))
    cookieSet(subject,"forum.ru-board.com.txt");break;//#cookie
}break;
case "samwhited":if(isTorRedirect()){ishttps=true;newHost="mpf3i4k43xc2usxj.onion";}break;
case "vimeo":if(isDocument&&Dom[2]==="player"&&URI.path.startsWith("/video/"))
{
    delim=URI.path.indexOf('?',7);
    if(delim>0)
    {
        var NewURI=URI.clone();
        NewURI.path=NewURI.path.substr(0,delim);
        subject.redirectTo(NewURI);
    }
}break;
case "vk":if(isDocument)
{
    if(Dom[2]==="new")
    {
        ishttps=true;
        newHost="vk.com";
    }
    else if(URI.path.startsWith("/share"))
        subject.cancel(Components.results.NS_BINDING_ABORTED);
    else
    {
        var delim=URI.path.indexOf("?recom=");
        if(delim>0)
        {
            var NewURI=URI.clone();
            NewURI.path=NewURI.path.substr(0,delim);
            subject.redirectTo(NewURI);
        }
    }
}break;
case "walmart":if(isDocument&&Dom[2]==="www"&&((delim=URI.path.indexOf("?sourceid="))>0||(delim=URI.path.indexOf("?wmlspartner="))>0||(delim=URI.path.indexOf("&wpa_"))>0))
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim);
    subject.redirectTo(NewURI);
}break;
case "yahoo":if(isDocument&&((delim=URI.path.indexOf("/RU=https%3"))>0||(delim=URI.path.indexOf("/RU=http%3"))>0))
{
    var newLink=URI.path.substr(delim+4);
    delim=newLink.indexOf('/',6);
    if(delim>0)newLink=newLink.substr(0,delim);
    delim=newLink.indexOf('?',6);
    if(delim>0)newLink=newLink.substr(0,delim);
    delim=newLink.indexOf('&',6);
    if(delim>0)newLink=newLink.substr(0,delim);
    subject.redirectTo(Services.io.newURI(decodeURIComponent(newLink),null,null));
}break;
case "youtube":if(isDocument)
{
    if(Dom[2]==="")
    {
        var NewURI=URI.clone();
        NewURI.host="www.youtube.com";
        subject.redirectTo(NewURI);
    }
    else if(URI.path.startsWith("/embed/"))
    {
        if((delim=URI.path.indexOf('?',7))>0||(delim=URI.path.indexOf('&',7))>0)
        {
            var NewURI=URI.clone();
            NewURI.path=NewURI.path.substr(0,delim);
            subject.redirectTo(NewURI);
        }
    }
    else if(URI.path.startsWith("/v/"))
    {
        var NewURI=URI.clone();
        NewURI.path="/watch?v="+NewURI.path.substr(3);
        if ((delim=NewURI.path.indexOf('&',9))>0||(delim=NewURI.path.indexOf('?',9))>0)
            NewURI.path=NewURI.path.substr(0,delim);
        subject.redirectTo(NewURI);
    }
    else if((delim=URI.path.indexOf("&v="))>0)
    {
        var NewURI=URI.clone();
        NewURI.path="/watch?v="+NewURI.path.substr(delim+3);
        subject.redirectTo(NewURI);
    }
    else if((delim=URI.path.indexOf("&feature="))>0||(delim=URI.path.indexOf("&spfreload="))>0||(delim=URI.path.indexOf("&pbjreload="))>0||(delim=URI.path.indexOf("&pbj="))>0)
    {
        var NewURI=URI.clone();
        NewURI.path=NewURI.path.substr(0,delim);
        subject.redirectTo(NewURI);
    }
}break;
case "youtube-nocookie":
{
    var NewURI=URI.clone();
    NewURI.host="www.youtube.com";
    subject.redirectTo(NewURI);
}break;
}break;

case "cr":/*!!!https*/
if(Dom[1]==="rutracker"&&isTorRedirect())newHost="rutrackerripnext.onion";break;

case "cy":/*!!!https*/
if(Dom[1]==="com"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "cz":/*!!!https*/
switch(Dom[1])
{
case "blogspot":if(Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;
case "brmlab":if((Dom[2]===""||Dom[2]==="www")&&isTorRedirect())newHost="pmwdzvbyvnmwobk5.onion";break;
}break;

case "de":/*!!!https*/
switch(Dom[1])
{
case "blogspot":if(Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;
case "citizen-cam":if(isTorRedirect())newHost="eljwdzi4pgrrlwwq.onion";break;
case "gotrust":if(Dom[2]==="searx"&&isTorRedirect())newHost="nxhhwbbxc4khvvlw.onion";break;
case "parckwart":if(isTorRedirect())newHost="parckwartvo7fskp.onion";break;
}break;

case "dk":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "ee":/*!!!https*/
if(Dom[1]==="com"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "eg":/*!!!https*/
if(Dom[1]==="com"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "es":/*!!!https*/
if(Dom[1]==="com"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "eu":/*!!!https*/
switch(Dom[1])
{
case "s3arch":if(isTorRedirect())newHost="eb6w5ctgodhchf3p.onion";break;
case "torrentz2":if(isTorRedirect())newHost="torrentzwealmisr.onion";break;
case "voidlinux":if(isTorRedirect())
{
    if(Dom[2]==="build")newHost="s7y2awkwau4nbdpu.onion";
    else if(Dom[2]==="repo")newHost="fd6dqrupy3af4xwb.onion";
}break;
case "xenobite":if(Dom[2]==="torcheck"&&isTorRedirect())newHost="5deqglhxcoy3gbx6.onion";break;
}break;

case "example":/*!!!https*/
case "exit":/*!!!https*/
subject.cancel(Components.results.NS_BINDING_ABORTED);break;

case "fi":/*!!!https*/
switch(Dom[1])
{
case "ahmia":if(isTorRedirect())newHost="msydqstlz2kzerdg.onion";break;
case "blogspot":if(Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;
case "nn": case "pp":if(Dom[2]==="parazite"&&isTorRedirect())newHost="kpynyvym6xqi7wz2.onion";break;
}break;

case "fr":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "gr":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "gy":/*!!!https*/
if(Dom[1]==="ef"&&isTorRedirect())newHost="vturtipc7vmz6xjy.onion";break;

case "hk":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "hr":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "hu":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "i2p":/*!!!https*/
subject.cancel(Components.results.NS_BINDING_ABORTED);break;

case "id":/*!!!https*/
if(Dom[1]==="co"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "ie":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "il":/*!!!https*/
if(Dom[1]==="co"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "in":/*!!!https*/
switch(Dom[1])
{
case "blogspot":if(Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;
case "damagelab":if(isTorRedirect())newHost="damagelabo2jiykj.onion";break;
}break;

case "info":/*!!!https*/
if(Dom[1]==="blockchain"&&isTorRedirect()){ishttps=true;newHost="blockchainbdgpzk.onion";}break;

case "invalid":/*!!!https*/
switch(Dom[1])
{
case "direct":
{
    proxyDirectUrl=URI.path.substr(1);
    var NewURI=URI.clone();
    NewURI.spec=proxyDirectUrl;
    subject.redirectTo(NewURI);
}break;
case "shortcut":subject.redirectTo(Services.io.newURI(URI.path.substr(1),null,null));break;
default:subject.cancel(Components.results.NS_BINDING_ABORTED);break;
}break;

case "io":/*!!!https*/
switch(Dom[1])
{
case "keybase":if(isTorRedirect())newHost="fncuwbiisyh6ak3i.onion";break;
case "readthedocs":if(Dom[2]==="txtorcon"&&isTorRedirect())newHost="fncuwbiisyh6ak3i.onion";break;
}break;

case "is":/*!!!https*/
switch(Dom[1])
{
case "blogspot":if(Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;
case "cryptoparty":if(isTorRedirect())newHost="crypty22ijtotell.onion";break;
case "flibusta":if(isTorRedirect())newHost="flibustahezeous3.onion";break;
case "mailpile":if(isTorRedirect())newHost="clgs64523yi2bkhz.onion";break;
}break;

case "it":/*!!!https*/
switch(Dom[1])
{
case "blogspot":if(Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;
case "redd":
{
    var NewURI=URI.clone();
    NewURI.host="www.reddit.com";
    NewURI.path="/tb"+NewURI.path;
    subject.redirectTo(NewURI);
}break;
}break;

case "jp":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "ke":/*!!!https*/
if(Dom[1]==="co"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "kr":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "la":/*!!!https*/
if(isDocument&&Dom[1]==="bugzil"&&Dom[2]==="")
{subject.redirectTo(Services.io.newURI("https://bugzilla.mozilla.org/show_bug.cgi?id="+URI.path.substr(1),null,null));}break;

case "li":/*!!!https*/
switch(Dom[1])
{
case "blogspot":if(Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;
case "cock":if(isTorRedirect())
{
    if(Dom[2]==="")newHost="cockmailwwfvrtqj.onion";
    else if(Dom[2]==="mail")newHost="mail.cockmailwwfvrtqj.onion";
}break;
}break;

case "lib":/*!!!*/
subject.cancel(Components.results.NS_BINDING_ABORTED);break;

case "link":/*!!!https*/
if(isDocument&&Dom[1]==="onion"&&Dom[2]!==""&&isTorRedirect())
{
    var tmp="://"+Dom[2]+".onion/";
    tmp="data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPiFUb3IyV2ViPC90aXRsZT48L2hlYWQ+PGJvZHk+"+Services.wm.getMostRecentWindow("navigator:browser").btoa(URI.spec+"<br /><a href=\"http"+tmp+"\">http"+tmp+"</a><br /><a href=\"https"+tmp+"\">https"+tmp+"</a></body></html>");
    subject.redirectTo(Services.io.newURI(tmp,null,null));
}break;

case "local":/*!!!https*/
case "localhost":/*!!!https*/
subject.cancel(Components.results.NS_BINDING_ABORTED);break;

case "lt":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "lu":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "md":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "me":/*!!!https*/
switch(Dom[1])
{
case "danwin1210":if(Dom[2]==="searxes"&&isTorRedirect())newHost="searxeszsqlt6325.onion";break;
case "searx":if(isTorRedirect())newHost="ulrn6sryqaifefld.onion";break;
case "torrentz2":if(isTorRedirect())newHost="torrentzwealmisr.onion";break;
}break;

case "mk":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "mt":/*!!!https*/
if(Dom[1]==="com"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "mx":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "my":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "net":/*!!!https*/
switch(Dom[1])
{
case "8ch":if(isTorRedirect())newHost="oxwugzccvk3dk6tj.onion";break;
case "anarplex":if(isTorRedirect())newHost="y5fmhyqdr6r7ddws.onion";break;
case "bigmir":if(isDocument&&Dom[2]==="s"&&((delim=URI.path.indexOf("&url=https%3A%2F%2F"))>0||(delim=URI.path.indexOf("&url=http%3A%2F%2F"))>0))
{
    var newLink=URI.path.substr(delim+5);
    delim=newLink.indexOf('&',13);
    if(delim>0)newLink=newLink.substr(0,delim);
    delim=newLink.indexOf('?',13);
    if(delim>0)newLink=newLink.substr(0,delim);
    subject.redirectTo(Services.io.newURI(decodeURIComponent(newLink),null,null));
}break;
case "casperlefantom":if(Dom[2]==="search"&&isTorRedirect())newHost="nrybuqtxgxnavtla.onion";break;
case "fbcdn":if(isTorRedirect()){ishttps=true;newHost=URI.host.substr(0,URI.host.length-9)+"fbcdn23dssr3jqnq.onion";}break;
case "hiddenservice":if(isDocument&&Dom[2]!==""&&isTorRedirect())
{
    var tmp="://"+Dom[2]+".onion/";
    tmp="data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPiFUb3IyV2ViPC90aXRsZT48L2hlYWQ+PGJvZHk+"+Services.wm.getMostRecentWindow("navigator:browser").btoa(URI.spec+"<br /><a href=\"http"+tmp+"\">http"+tmp+"</a><br /><a href=\"https"+tmp+"\">https"+tmp+"</a></body></html>");
    subject.redirectTo(Services.io.newURI(tmp,null,null));
}break;
case "laquadrature":if(Dom[2]==="searx"&&isTorRedirect())newHost="searchb5a7tmimez.onion";break;
case "onion-router":if(isTorRedirect())newHost="hzmun3rnnxjhkyhg.onion";break;
case "riseup":
{
    if(isTorRedirect())
    switch(Dom[2])
    {
    case "": case "help": case "www":newHost="nzh3fv6jc6jskki3.onion";break;
    case "account": case "user":newHost="j6uhdvbhz74oefxf.onion";break;
    case "black":newHost="cwoiopiifrlzcuos.onion";break;
    case "lists":ishttps=true;newHost="xpgylzydxykgdqyg.onion";break;
    case "mail":ishttps=true;newHost="zsolxunfmbfuq7wf.onion";break;
    case "pad":ishttps=true;newHost="5jp7xtmox6jyoqd5.onion";break;
    case "share":ishttps=true;newHost="6zc6sejeho3fwrd4.onion";break;
    case "we":ishttps=true;newHost="7lvd7fa5yfbdqaii.onion";break;
    }
}break;
case "rutracker":if(isTorRedirect())newHost="rutrackerripnext.onion";break;
case "sourceforge":if(isDocument&&Dom[2]===""&&URI.path.startsWith("/projects/")&&(delim=URI.path.indexOf("/download?",9))>0)
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim+9);
    subject.redirectTo(NewURI);
}break;
case "yastatic":if(cdnPath&&URI.prePath==="https://yastatic.net")//#cdn
try{subject.getRequestHeader("Origin");}catch(e){
{
    var Url=URI.spec.substr(8);
    delim=Url.indexOf('?');if(delim>0)Url=Url.substr(0,delim);
    Url=cdnLoad(Url);if(Url)subject.redirectTo(Services.io.newURI(Url,URI.originCharset,null));
}}break;
case "zerobin":if(isTorRedirect())newHost="zerobinqmdqd236y.onion";break;
}break;

case "ng":/*!!!https*/
if(Dom[1]==="com"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "nl":/*!!!https*/
switch(Dom[1])
{
case "blogspot":if(Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;
case "rutracker":if(isTorRedirect())newHost="rutrackerripnext.onion";break;
}break;

case "no":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "nu":/*!!!https*/
switch(Dom[1])
{
case "kognitionskyrkan":if(isTorRedirect())newHost="wd43uqrbjwe6hpre.onion";break;
case "onion":if(isDocument&&Dom[2]!==""&&isTorRedirect())
{
    var tmp="://"+Dom[2]+".onion/";
    tmp="data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPiFUb3IyV2ViPC90aXRsZT48L2hlYWQ+PGJvZHk+"+Services.wm.getMostRecentWindow("navigator:browser").btoa(URI.spec+"<br /><a href=\"http"+tmp+"\">http"+tmp+"</a><br /><a href=\"https"+tmp+"\">https"+tmp+"</a></body></html>");
    subject.redirectTo(Services.io.newURI(tmp,null,null));
}break;
}break;

case "nz":/*!!!https*/
if(Dom[1]==="co"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "onion":/*!!!https*/
switch(Dom[1])
{
case "facebookcorewwwi":if(isDocument)
{
    if(
    (delim=URI.path.indexOf("?comment_id="))>0||
    (delim=URI.path.indexOf("&comment_id="))>0||
    (delim=URI.path.indexOf("?comment_tracking="))>0||
    (delim=URI.path.indexOf("&comment_tracking="))>0||
    (delim=URI.path.indexOf("?entry_point="))>0||
    (delim=URI.path.indexOf("&entry_point="))>0||
    (delim=URI.path.indexOf("?fref="))>0||
    (delim=URI.path.indexOf("&fref="))>0||
    (delim=URI.path.indexOf("?hc_location="))>0||
    (delim=URI.path.indexOf("&hc_location="))>0||
    (delim=URI.path.indexOf("?hc_ref="))>0||
    (delim=URI.path.indexOf("&hc_ref="))>0||
    (delim=URI.path.indexOf("?helpref="))>0||
    (delim=URI.path.indexOf("&helpref="))>0||
    (delim=URI.path.indexOf("?pnref="))>0||
    (delim=URI.path.indexOf("&pnref="))>0||
    (delim=URI.path.indexOf("?ref_"))>0||
    (delim=URI.path.indexOf("&ref_"))>0||
    (delim=URI.path.indexOf("?reply_comment_id="))>0||
    (delim=URI.path.indexOf("&reply_comment_id="))>0||
    (delim=URI.path.indexOf("?set="))>0||
    (delim=URI.path.indexOf("&set="))>0||
    (delim=URI.path.indexOf("?video_source="))>0||
    (delim=URI.path.indexOf("&video_source="))>0)
    {
        var NewURI=URI.clone();
        NewURI.path=NewURI.path.substr(0,delim);
        subject.redirectTo(NewURI);
    }
}break;
default:
{
    var bAbort=false;
    if(Dom[1].length===16){for(var i=15;i>=0;--i){var ch=Dom[1].charAt(i);if(!((ch>='a'&&ch<='z')||(ch>='2'&&ch<='7'))){bAbort=true;break;}}}else bAbort=true;
    if(bAbort)subject.cancel(Components.results.NS_BINDING_ABORTED);
}break;
}break;

case "org":/*!!!https*/
switch(Dom[1])
{
case "24hoursppc":if(isTorRedirect())newHost="24hourspkcmd7bvr.onion";break;
case "arhivach":if(isTorRedirect())newHost="arhivachovtj2jrp.onion";break;
case "autistici":if(isTorRedirect())newHost="wi7qkxyrdpu5cmvr.onion";break;
case "confidantmail":if(isTorRedirect())newHost="cwu7eglxcabwttzf.onion";break;
case "cryptopunks":if(isTorRedirect())newHost="crptpnkdgddolfag.onion";break;
case "cyberguerrilla":if(Dom[2]==="anonguide"&&isTorRedirect())newHost="yuxv6qujajqvmypv.onion";break;
case "debian":if((Dom[2]===""||Dom[2]==="www")&&isTorRedirect())newHost="sejnfjrq6szgca7v.onion";break;
case "fossencdi":if(Dom[2]==="searx"&&isTorRedirect())newHost="searx.cwuzdtzlubq5uual.onion";break;
case "gibberfish":if(Dom[2]==="search"&&isTorRedirect())newHost="o2jdk5mdsijm2b7l.onion";break;
case "habrastorage":
if(Dom[2]===""){ishttps=true;newHost="hsto.org";}
else if(Dom[2]==="habr")
{
    var NewURI=URI.clone();
    NewURI.host="hsto.org";
    NewURI.path="/getpro/habr"+NewURI.path;
    subject.redirectTo(NewURI);
}break;
case "inventati":if(isTorRedirect())newHost="wi7qkxyrdpu5cmvr.onion";break;
case "libraryfreedomproject":if(isTorRedirect())newHost="libraryxobbrbj33.onion";break;
case "mozilla":
{
    if(Dom[2]==="addons"&&(delim=URI.path.indexOf("?src="))>0)
    {
        var NewURI=URI.clone();
        NewURI.path=NewURI.path.substr(0,delim);
        subject.redirectTo(NewURI);
    }
    else if(isDocument&&Dom[2]==="mxr"&&Dom[3]===""){ishttps=true;newHost="dxr.mozilla.org";}
}break;
case "niij":if(Dom[2]==="poum"&&isTorRedirect()){ishttps=true;newHost="u75jkrt3umu2c7pn.onion";}break;
case "privacyinternational":if(isTorRedirect()){ishttps=true;newHost=URI.host.substr(0,URI.host.length-24)+"privacyintyqcroe.onion";}break;
case "privoxy":if(isTorRedirect())newHost="jvauzb4sb3bwlsnc.onion";break;
case "qubes-os":if(isTorRedirect())newHost="qubesos4rrrrz6n4.onion";break;
case "rutracker":if(isTorRedirect())newHost="rutrackerripnext.onion";break;
case "securedrop":if(isTorRedirect()&&(Dom[2]===""||Dom[2]==="www"))newHost="secrdrop5wyphb5x.onion";break;
case "swehack":if(isTorRedirect())newHost="swehackmzys2gpmb.onion";break;
case "thepiratebay":if(isTorRedirect())newHost="uj3wazyk5u4hnvtk.onion";break;
case "torproject":
{
    if(isTorRedirect())
    switch(Dom[2])
    {
    case "": case "www":newHost="expyuzz4wqqyqhjn.onion";break;
    case "archive":newHost="yjuwkcxlgo7f7o6s.onion";break;
    case "atlas":newHost="52g5y5karruvc7bz.onion";break;
    case "aus1":if(URI.path.indexOf("/no/")>0)subject.cancel(Components.results.NS_BINDING_ABORTED);else newHost="x3nelbld33llasqv.onion";break;
    case "aus2":newHost="vijs2fmpd72nbqok.onion";break;
    case "bridges":newHost="z5tfsnikzulwicxs.onion";break;
    case "cloud":newHost="icxe4yp32mq6gm6n.onion";break;
    case "collector":newHost="qigcb4g4xxbh5ho6.onion";break;
    case "compass":newHost="lwygejoa6fm26eef.onion";break;
    case "consensus-health":newHost="tgnv2pssfumdedyw.onion";break;
    case "deb":newHost="sdscoq7snqtznauu.onion";break;
    case "dist":newHost="rqef5a5mebgq46y5.onion";break;
    case "exonerator":newHost="zfu7x4fuagirknhb.onion";break;
    case "gettor":newHost="tngjm3owsslo3wgo.onion";break;
    case "gitweb":newHost="jqs44zhtxl2uo6gk.onion";break;
    case "help":newHost="54nujbl4qohb5qdp.onion";break;
    case "jenkins":newHost="f7lqb5oicvsahone.onion";break;
    case "media":newHost="n46o4uxsej2icp5l.onion";break;
    case "metrics":newHost="rougmnvswfsmd4dq.onion";break;
    case "munin":newHost="hhr6fex2giwmolct.onion";break;
    case "nagios":newHost="kakxayzmcc3zeomu.onion";break;
    case "nyx":newHost="ebxqgaz3dwywcoxl.onion";break;
    case "onion":newHost="yz7lpwfhhzcdyc5y.onion";break;
    case "onionoo":newHost="tgel7v4rpcllsrk2.onion";break;
    case "onionperf":newHost="llhb3u5h3q66ha62.onion";break;
    case "ooni":newHost="fqnqc7zix2wblwex.onion";break;
    case "research":newHost="wcgqzqyfi7a6iu62.onion";break;
    case "stem":newHost="vt5hknv6sblkgf22.onion";break;
    case "tb-manual":newHost="dgvdmophvhunawds.onion";break;
    case "trac": case "bugs": newHost="ea5faa5po25cf7fb.onion";break;
    case "webstats":newHost="gbinixxw7gnsh5jr.onion";break;
    case "www-staging":newHost="krkzagd5yo4bvypt.onion";break;
    }
}break;
case "userscripts-mirror":if(isDocument&&URI.path.endsWith(".html"))
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,NewURI.path.length-5);
    subject.redirectTo(NewURI);
}break;
case "whonix":if((Dom[2]===""||Dom[2]==="www")&&isTorRedirect())newHost="kkkkkkkkkk63ava6.onion";break;
case "wildleaks":if(Dom[2]==="secure"&&isTorRedirect())newHost="ppdz5djzpo3w5k2z.onion";break;
}break;

case "pe":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "pl":/*!!!https*/
if(URI.host==="searx.good.one.pl"&&isTorRedirect())newHost="searxl7u2y6gvonm.onion";break;

case "press":/*!!!https*/
if(Dom[1]==="mascherari"&&isTorRedirect())newHost="7tm2lzezyjwtpn2s.onion";break;

case "pt":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "pw":/*!!!https*/
if(Dom[1]==="system33"&&isTorRedirect())newHost="system33cb4tgdhz.onion";break;

case "qa":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "re":/*!!!https*/
if(Dom[1]==="chloe"&&isTorRedirect())newHost="chloenlpvlemmmmd.onion";break;

case "rip":/*!!!https*/
if(isDocument&&Dom[1]==="onion"&&Dom[2]!==""&&isTorRedirect())
{
    var tmp="://"+Dom[2]+".onion/";
    tmp="data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPiFUb3IyV2ViPC90aXRsZT48L2hlYWQ+PGJvZHk+"+Services.wm.getMostRecentWindow("navigator:browser").btoa(URI.spec+"<br /><a href=\"http"+tmp+"\">http"+tmp+"</a><br /><a href=\"https"+tmp+"\">https"+tmp+"</a></body></html>");
    subject.redirectTo(Services.io.newURI(tmp,null,null));
}break;

case "ro":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "rs":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "ru":/*!!!https*/
switch(Dom[1])
{
case "3dnews":if(isDocument&&(delim=URI.path.indexOf("?top-"))>0)
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim);
    subject.redirectTo(NewURI);
}break;
case "4pda":if(isDocument&&URI.spec.startsWith("https://4pda.ru/forum/"))
{
    if((Services.prefs.getBoolPref("extensions.useraddon.cookies.fullmode.4pda.ru")&&URI.path.substr(7,10)==="index.php?")||(
    URI.path.substr(7, 8)==="dl/post/"||
    URI.path.substr(7,24)==="index.php?act=attach&id="))
    cookieSet(subject,"4pda.ru.txt");break;//#cookie
}break;
case "autorambler":if(isDocument&&(delim=URI.path.indexOf("/?track="))>0)
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim);
    subject.redirectTo(NewURI);
}break;
case "blogspot":if(Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;
case "exelab":if(isTorRedirect())newHost="e4unrusy7se5evw5.onion";break;
case "geektimes":if(isDocument&&URI.path.startsWith("/p/"))
{
    var NewURI=URI.clone();
    NewURI.path="/post/"+NewURI.path.substr(3);
    subject.redirectTo(NewURI);
}break;
case "habr":if(isDocument&&URI.path.startsWith("/p/"))
{
    var NewURI=URI.clone();
    NewURI.host="habrahabr.ru";
    NewURI.path="/post/"+NewURI.path.substr(3);
    subject.redirectTo(NewURI);
}break;
case "hh":if(isDocument&&(delim=URI.path.indexOf("?query="))>0)
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim);
    subject.redirectTo(NewURI);
}break;
case "mail":if(isDocument&&Dom[2]==="files"&&Dom[3]===""&&URI.path.length===33)
{
    var bOk=true;for(var i=32;i>0;--i){var ch=URI.path.charAt(i);if(!((ch>='0'&&ch<='9')||(ch>='A'&&ch<='F'))){bOk=false;break;}}
    if(bOk){ishttps=true;newHost="cloud.mail.ru";}
}break;
case "moikrug":if(isDocument&&(delim=URI.path.indexOf("?f="))>0)
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim);
    subject.redirectTo(NewURI);
}break;
case "odnoklassniki":
{
    if(isDocument&&(Dom[2]===""||Dom[2]==="www")){ishttps=true;newHost="ok.ru";}
    else subject.cancel(Components.results.NS_BINDING_ABORTED);
}break;
case "ok":if(isDocument)
{
    if(URI.path.startsWith("/dk?st.cmd=addShare&"))subject.cancel(Components.results.NS_BINDING_ABORTED);
    else if(URI.prePath==="https://ok.ru")cookieSet(subject,"ok.ru.txt");break;//#cookie
}break;
case "thechess":if(isTorRedirect())newHost="theches3nacocgsc.onion";break;
case "vkontakte":
{
    if(isDocument&&Dom[2]===""){ishttps=true;newHost="vk.com";}
    else subject.cancel(Components.results.NS_BINDING_ABORTED);
}break;
case "xakep":if(isDocument&&Dom[2]==="www")
{
    ishttps=true;
    newHost="xakep.ru";
}break;
case "yandex":if(isDocument&&((delim=URI.path.indexOf("?track="))>0||(delim=URI.path.indexOf("&track="))>0))
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim);
    subject.redirectTo(NewURI);
}break;
}break;

case "se":/*!!!https*/
switch(Dom[1])
{
case "blogspot":if(Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;
case "com":if(Dom[2]==="thepiratebay"&&isTorRedirect())newHost="uj3wazyk5u4hnvtk.onion";break;
case "thepiratebay":if(isTorRedirect())newHost="uj3wazyk5u4hnvtk.onion";break;
case "torrentproject":if(isTorRedirect())newHost="x4torrentjjjjuxy.onion";break;
}break;

case "sg":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "sh":/*!!!https*/
switch(Dom[1])
{
case "surge":if(Dom[2]==="sw"&&isTorRedirect()){ishttps=true;newHost="repo.a2af37vnxe44tcgo.onion";break;}
case "transfer":if(isTorRedirect())newHost="jxm5d6emw5rknovg.onion";break;
}break;

case "si":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "sk":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "sn":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "st":/*!!!https*/
if(isDocument&&Dom[1]==="shorte")
{
    if(Dom[2]==="ads")
    {
        if(URI.path.startsWith("/ads.php?")&&(delim=URI.path.indexOf("&cp.enc_url=",9))>0)
        {
            var NewURI=URI.clone();
            NewURI.path="/ads.php?"+NewURI.path.substr(delim+1);
            delim=NewURI.path.indexOf('&');
            if(delim>0)NewURI.path=NewURI.path.substr(0,delim);
            subject.redirectTo(NewURI);
        }
    }
    else if(Dom[2]==="ssp")
    {
        delim=URI.path.indexOf("&url=http%3A%2F%2F");
        if(delim<0)delim=URI.path.indexOf("&url=https%3A%2F%2F");
        if(delim>0)
        {
            var newLink=URI.path.substr(delim+5);
            delim=newLink.indexOf('&',13);
            if(delim>0)newLink=newLink.substr(0,delim);
            delim=newLink.indexOf('?',13);
            if(delim>0)newLink=newLink.substr(0,delim);
            subject.redirectTo(Services.io.newURI(decodeURIComponent(newLink),null,null));
        }
        else subject.cancel(Components.results.NS_BINDING_ABORTED);
    }
}break;

case "test":/*!!!https*/
subject.cancel(Components.results.NS_BINDING_ABORTED);break;

case "to":/*!!!https*/
switch(Dom[1])
{
case "nnmclub":if(isTorRedirect())newHost="dsenxis5txr4zbxe.onion";break;
case "onion":if(isDocument&&Dom[2]!==""&&isTorRedirect())
{
    var tmp="://"+Dom[2]+".onion/";
    tmp="data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPiFUb3IyV2ViPC90aXRsZT48L2hlYWQ+PGJvZHk+"+Services.wm.getMostRecentWindow("navigator:browser").btoa(URI.spec+"<br /><a href=\"http"+tmp+"\">http"+tmp+"</a><br /><a href=\"https"+tmp+"\">https"+tmp+"</a></body></html>");
    subject.redirectTo(Services.io.newURI(tmp,null,null));
}break;
}break;

case "tr":/*!!!https*/
if(Dom[1]==="com"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "tw":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "ua":/*!!!https*/
switch(Dom[1])
{
case "hh":if(isDocument&&(delim=URI.path.indexOf("?query="))>0)
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim);
    subject.redirectTo(NewURI);
}break;
case "lun":if(isDocument&&Dom[2]==="www"&&(delim=URI.path.indexOf("/redirect?"))>0)
{
    var NewURI=URI.clone();
    NewURI.path=NewURI.path.substr(0,delim+9);
    subject.redirectTo(NewURI);
}break;
}break;

case "ug":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "uk":/*!!!https*/
if(Dom[1]==="co"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "uy":/*!!!https*/
if(Dom[1]==="com"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;

case "vn":/*!!!https*/
if(Dom[1]==="blogspot"&&Dom[2]!==""){ishttps=true;newHost=Dom[2]+".blogspot.com";}break;

case "ws":/*!!!https*/
switch(Dom[1])
{
case "livefootball":{ishttps=true;newHost="www.lfootball.ws";}break;
case "lfootball":if(Dom[2]===""){ishttps=true;newHost="www.lfootball.ws";}break;
}break;

case "xyz":/*!!!https*/
if(Dom[1]==="emerproxy"&&isTorRedirect())newHost="eivd4nanrtr2qkk6.onion";break;

case "za":/*!!!https*/
if(Dom[1]==="co"&&Dom[2]==="blogspot"&&Dom[3]!==""){ishttps=true;newHost=Dom[3]+".blogspot.com";}break;
//==========
    }
    if (newHost)
    {
        var NewURI=URI.clone();
        if(!ishttps)NewURI.scheme="http";
        NewURI.host=newHost;
        subject.redirectTo(NewURI);
    }
}//(https requests)
else subject.cancel(Components.results.NS_BINDING_ABORTED);
}//(modifyRequest)

//-------------------------------------------------------------------------------------------------
function TracingListener() {this.receivedData = [];}
TracingListener.prototype =
{
QueryInterface: function(aIID) {if (aIID.equals(Ci.nsIStreamListener) || aIID.equals(Ci.nsISupports)) return this; throw Cr.NS_NOINTERFACE;},
onStartRequest: function(request, context) {try {this.originalListener.onStartRequest(request, context);} catch (err) {request.cancel(err.result);}},
onDataAvailable: function(request, context, inputStream, offset, count)
{
    var binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci["nsIBinaryInputStream"]);
    binaryInputStream.setInputStream(inputStream);
    this.receivedData.push(binaryInputStream.readBytes(count));
},
onStopRequest: function(request, context, statusCode)
{
/*
    var storageStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci["nsIStorageStream"]);
    storageStream.init(8192, data.length, null);
    var os = storageStream.getOutputStream(0);
    if (data.length > 0)
        os.write(data, data.length);
    os.close();

    try {this.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), 0, data.length);} catch (e) {}
    try {this.originalListener.onStopRequest(request, context, statusCode);} catch (e) {}
*/
}
}

//-------------------------------------------------------------------------------------------------
function writeCookie(name, value, cookieFile)
{
    localFile.initWithPath(cookiesPath + cookieFile);
    if (localFile.exists())
    {
        var istream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        istream.init(localFile, 1, 292, 0);
        var bstream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
        bstream.setInputStream(istream);
        var stringlist = bstream.readBytes(bstream.available()).split('\n');
        istream.close();

        if (stringlist && stringlist.length)
        {
            var cookies = stringlist[stringlist[0]].split("; ");
            var map = new Map();
            for (var cookie of cookies)
            {
                var tmp = cookie.split('=');
                if (tmp.length === 2)
                    map.set(tmp[0], tmp[1]);
            }
            map.set(name, value);
    
            cookies = "";
            for (var [key, value] of map.entries())
                cookies += key + "=" + value + "; ";
            stringlist[stringlist[0]] = cookies.substr(0, cookies.length-2);
    
            cookies = stringlist.join('\n');
            var ostream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
            ostream.init(localFile, 2, 292, 0);
            var bstream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
            bstream.setOutputStream(ostream);
            bstream.writeBytes(cookies, cookies.length);
            ostream.close();
        }
    }
}

function handleCookie(cookie)
{
    if (cookie.isHttpOnly)
    {
        consoleService.logStringMessage((cookie.isSecure ? "@Cookie: https://" : "@Cookie: http://") + cookie.host + cookie.path + " => " + cookie.name + "=" + cookie.value);
        if (cookie.name === "scook" && cookie.host.endsWith(".sport.ua"))
            Services.cookies.remove(cookie.host, cookie.name, cookie.path, false, cookie.originAttributes);
        else if (cookie.name === "bb_session" && (cookie.host === ".rutrackerripnext.onion" || cookie.host === ".rutracker.org"))
            writeCookie(cookie.name, cookie.value, "rutracker.org.txt");
        else if (cookie.host === ".ok.ru" && cookie.name === "AUTHCODE")
            writeCookie(cookie.name, cookie.value, "ok.ru.txt");
        else if (cookie.host === ".funkysouls.com" && (cookie.name === "member_id" || cookie.name === "pass_hash"))
            writeCookie(cookie.name, cookie.value, "forum.funkysouls.com.txt");
        else if (cookie.host === ".4pda.ru" && (cookie.name === "member_id" || cookie.name === "pass_hash"))
            writeCookie(cookie.name, cookie.value, "4pda.ru.txt");
        else if (cookie.host === "forum.ru-board.com" && (cookie.name === "amembernamecookie" || cookie.name === "apasswordcookie"))
            writeCookie(cookie.name, cookie.value, "forum.ru-board.com.txt");
    }
    else if (cookie.host === ".rozetka.com.ua")
        consoleService.logStringMessage((cookie.isSecure ? "@Cookie: https://" : "@Cookie: http://") + cookie.host + cookie.path + " => " + cookie.name + "=" + cookie.value);
    else
    {
        Services.cookies.remove(cookie.host, cookie.name, cookie.path, false, cookie.originAttributes);
        Services.cookies.add(cookie.host, cookie.path, cookie.name, cookie.value, cookie.isSecure, true, true, 2145916800, cookie.originAttributes);
    }
}

//-------------------------------------------------------------------------------------------------
var httpRequestObserver =
{
observe: function(subject, topic, data)
{
    function setRespHeaders(aSubject, xFrame, CSP)
    {
        aSubject.setResponseHeader("Content-Security-Policy", CSP, false);
        aSubject.setResponseHeader("Referrer-Policy", "no-referrer", false);
        aSubject.setResponseHeader("X-Content-Type-Options", "nosniff", false);
        if (xFrame) aSubject.setResponseHeader("X-Frame-Options", xFrame, false);
        aSubject.setResponseHeader("X-Xss-Protection", "1; mode=block", false);
    }

    switch(topic)
    {
    case "http-on-examine-response":
    case "http-on-examine-cached-response":
    {
        subject.QueryInterface(Ci.nsIHttpChannel);

        //cookies
        try
        {
            var cookie = subject.getResponseHeader("Set-Cookie");
            if (cookie)
            {
                var add = subject.URI.schemeIs("https") ? (subject.URI.host==="rozetka.com.ua"?"; Secure":"; Secure; HttpOnly") : "; HttpOnly";
                var cookies = cookie.split('\n');
                for (var i = 0; i < cookies.length; ++i)
                    cookies[i] += add;
                subject.setResponseHeader("Set-Cookie", cookies.join('\n'), false);
            }
        } catch(e){}

        //media-files
        try
        {
            var media = subject.getResponseHeader("Content-Type");
            if ((media.startsWith("video/")||media.startsWith("audio/"))&&!subject.URI.host.endsWith(".googlevideo.com"))
            {
                if (mediaLinks.length > 200)
                {
                    var l1 = mediaLinks[mediaLinks.length-1];
                    var l2 = mediaLinks[mediaLinks.length-2];
                    mediaLinks = [];
                    mediaLinks.push(l2);
                    mediaLinks.push(l1);
                }
                mediaLinks.push(subject.URI.spec);
            }
        } catch(e){}

        //top-level document
        if (subject.loadFlags & subject.LOAD_DOCUMENT_URI)
        {
            var code=subject.responseStatus;
            if (code===301||code===302||code===303||code===307)
            {
                //cloudflare captcha
                if (code===302 && subject.URI.path.startsWith("/cdn-cgi/l/chk_captcha?id=") && cloudFlareLink)
                {
                    subject.setResponseHeader("Location", cloudFlareLink, false);
                    cloudFlareLink = null;
                }
                else
                {
                    var bCheck = Services.prefs.getBoolPref("extensions.useraddon.prompt.redirect");
                    if (!bCheck)
                        switch(subject.URI.host)
                        {
//301
case "amzn.to":
case "appsto.re":
case "bit.ly":
case "bitly.com":
case "buff":
case "bzfd.it":
case "go.microsoft.com":
case "goo.gl":
case "is.gd":
case "itun.es":
case "mir.cr":
case "mzl.la":
case "on.rt.com":
case "opr.as":
case "pb.ua":
case "philips.to":
case "schd.io":
case "shrink.im":
case "shz.am":
case "smarturl.it":
case "tinyurl.com":
case "trib.al":
case "www.reddit.com":
case "xa.to":
//302
case "clck.ru":
case "db":
case "git.io":
case "kas.pr":
case "noref.org":
case "redd.it":
case "rocld.com":
case "take.ms":
case "torpat.ch":
case "u.to":
case "vk.cc":
//303
case "www.tiny.cc":
                            bCheck = true;
                        }
                        if (bCheck)
                        {
                            try
                            {
                                var newLink = subject.getResponseHeader("Location");
                                if (newLink)
                                {
                                    if (newLink.startsWith("/"))
                                    {
                                        var NewURI = subject.URI.clone();
                                        NewURI.path = newLink;
                                        newLink = NewURI.spec;
                                    }
                                    subject.setResponseHeader("Location", "data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPkhUVFAg" + Services.wm.getMostRecentWindow("navigator:browser").
                                    btoa(code + "</title></head><body>" + subject.URI.spec + "<br /><a href=\"" + newLink + "\">" + newLink + "</a></body></html>"), false);
                                }
                            } catch(e){}
                        }
                }
            }
            else if (code===403)
            {
                try
                {
                    var server = subject.getResponseHeader("Server");
                    if (server && server === "cloudflare-nginx")
                        cloudFlareLink = subject.URI.spec;
                } catch(e){}
            }

            //CSP & etc headers
            if (isStrictMode)
                setRespHeaders(subject, "deny", "default-src 'none'");
            else
                switch (subject.URI.host)
                {
case "4pda.ru":
setRespHeaders(subject, "deny", subject.URI.path.startsWith("/forum/dl/post/") ? "default-src 'none'" :
"default-src 'none';script-src 'unsafe-inline' https://s.4pda.to/;style-src 'unsafe-inline' https://s.4pda.to/;img-src https://*.4pda.to/");break;

case "alterportal.ru":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline';style-src 'unsafe-inline';img-src https: http:;child-src https: http:");break;

case "bigfangroup.org":
setRespHeaders(subject, "deny", "default-src 'none';script-src https://bigfangroup.org/cdn-cgi/scripts/ https://www.google.com/recaptcha/api.js;img-src https: http:;child-src https://www.google.com/recaptcha/api/fallback");break;

case "disqus.com":
setRespHeaders(subject, null, "default-src 'none';script-src 'unsafe-inline' https://c.disquscdn.com/next/embed/;style-src 'unsafe-inline' https://c.disquscdn.com/next/embed/styles/;connect-src https://disqus.com/api/;img-src https://uploads.disquscdn.com/images/ https://a.disquscdn.com/get?url=https%3A%2F%2F https://a.disquscdn.com/get?url=http%3A%2F%2F;child-src data: https: http:");break;

case "duckduckgo.com":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' 'unsafe-eval' https://duckduckgo.com/;style-src 'unsafe-inline' https://duckduckgo.com/");break;
case "3g2upl4pq6kufc4m.onion":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' 'unsafe-eval' https://3g2upl4pq6kufc4m.onion/;style-src 'unsafe-inline' https://3g2upl4pq6kufc4m.onion/");break;

case "forum.funkysouls.com":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' http://forum.funkysouls.com/html/ http://forum.funkysouls.com/jscripts/;style-src 'unsafe-inline' http://forum.funkysouls.com/css/board.css;img-src https: http:;child-src https: http:");break;
case "funkysouls.com":
setRespHeaders(subject, "deny", "default-src 'none';style-src http://funkysouls.com/stylesheets/styles.css;img-src http://funkysouls.com/img/ http://releases.funkysouls.com/cover_small/");break;

case "forum.ru-board.com":
setRespHeaders(subject, "deny", "default-src 'none';img-src https: http:");break;

case "geektimes.ru":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' https://habracdn.net/gt/javascripts/;style-src 'unsafe-inline' https://habracdn.net/gt/styles/;img-src https: http:;child-src https: http:");break;
case "habrahabr.ru":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' https://habracdn.net/habr/javascripts/;style-src 'unsafe-inline' https://habracdn.net/habr/styles/;img-src https: http:;child-src https: http:");break;

case "itc.ua":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' http://itc.ua/wp-includes/js/ http://itc.ua/wp-content/ http://itcua.disqus.com/embed.js;style-src 'unsafe-inline' http://itc.ua/wp-content/themes/ https://maxcdn.bootstrapcdn.com/bootstrap/;img-src http://itc.ua/wp-content/uploads/;child-src https: http:;media-src https: http:");break;

case "livesport.ws":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' http://livesport.ws/engine/classes/js/ http://livesport.ws/templates/livesport/ http://livesport.ws/service.php;style-src 'unsafe-inline' http://livesport.ws/templates/livesport/css/;img-src http://livesport.ws/images/logo/teams/;connect-src http://livesport.ws/engine/modules/sports/sport_refresh.php");break;

case "online.rncb.ru":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' 'unsafe-eval' https://online.rncb.ru/web_banking/;style-src 'unsafe-inline' https://online.rncb.ru/web_banking/;img-src https://online.rncb.ru/web_banking/;connect-src https://online.rncb.ru/web_banking/");break;

case "rutorc6mqdinc4cz.onion":
case "live-rutor.org":
case "rutor.info":
case "rutor.is":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' 'self' data: http://ajax.googleapis.com/ajax/libs/jquery/;style-src 'unsafe-inline' 'self';img-src https: http:");break;

case "rutrackerripnext.onion":
case "rutracker.cr":
case "rutracker.net":
case "rutracker.nl":
case "rutracker.org":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' 'unsafe-eval' http://static.t-ru.org/templates/ https://static.t-ru.org/templates/;style-src 'unsafe-inline' http://static.t-ru.org/templates/ https://static.t-ru.org/templates/;img-src https: http:");break;

case "vk.com":
setRespHeaders(subject, "sameorigin", "default-src 'none';script-src 'unsafe-eval' 'unsafe-inline' blob: https://vk.com/js/;style-src 'unsafe-inline' https://vk.com/css/;img-src https://vk.com/images/ https://*.userapi.com/;connect-src https://vk.com/ blob: https://*.vkuservideo.net/video/hls/ https://api.vigo.ru/uxzoom/1/network_status;child-src https: http: blob:");break;

case "wildstat.ru":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' http://wildstat.ru/;style-src 'unsafe-inline' http://wildstat.ru/css/style.css;img-src http://wildstat.ru/img/flag/");break;

case "www.ghacks.net":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline';style-src https://www.ghacks.net/wp-content/themes/ https://cdn.ghacks.net/wp-content/;img-src https://cdn.ghacks.net/wp-content/uploads/");break;

case "www.guerrillamail.com":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' https://www.guerrillamail.com/js/;style-src 'unsafe-inline' https://www.guerrillamail.com/;connect-src https://www.guerrillamail.com/ajax.php");break;
case "grrmailb3fxpjbwm.onion":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' http://grrmailb3fxpjbwm.onion/js/;style-src 'unsafe-inline' http://grrmailb3fxpjbwm.onion/;connect-src http://grrmailb3fxpjbwm.onion/ajax.php");break;

case "www.lfootball.ws":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline';style-src 'unsafe-inline' https://www.lfootball.ws/templates/;img-src http://www.lfootball.ws/emblems/");break;

case "www.manhunter.ru":
setRespHeaders(subject, "deny", "default-src 'none';style-src http://www.manhunter.ru/styles_main.css;img-src http://www.manhunter.ru/upload/");break;

case "www.opennet.ru":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' https://www.opennet.ru/;style-src 'unsafe-inline' https://www.opennet.ru/;connect-src https://www.opennet.ru/cgi-bin/openforum/;img-src https://www.opennet.ru/opennews/pics_base/;child-src https: http:;media-src https: http:");break;

case "www.privat24.ua":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' 'unsafe-eval' https://www.privat24.ua/js/ https://pin.privatbank.ua/pinblok/;style-src 'unsafe-inline' https://www.privat24.ua/css/;connect-src wss://www.privat24.ua/ws/sr");break;
case "privat24.privatbank.ua":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' 'unsafe-eval' https://*.privatbank.ua/;style-src 'unsafe-inline' https://*.privatbank.ua/;connect-src https://*.privatbank.ua/;img-src https://*.privatbank.ua/;child-src https://*.privatbank.ua/");break;
case "my-payments.privatbank.ua":
case "my-payments-p24.privatbank.ua":
setRespHeaders(subject, null, "default-src 'none';script-src 'unsafe-inline' 'unsafe-eval' https://*.privatbank.ua/;style-src 'unsafe-inline' https://*.privatbank.ua/;connect-src https://*.privatbank.ua/;img-src https://*.privatbank.ua/;child-src https://*.privatbank.ua/");break;

case "www.ua-football.com":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' https://www.ua-football.com/js/;style-src 'unsafe-inline' https://www.ua-football.com/css/;connect-src https://www.ua-football.com/forum/comments/list/news_id/;img-src https: http:;child-src https: http:");break;

case "www.youtube.com":
setRespHeaders(subject, null, "default-src 'none';script-src 'unsafe-inline' 'unsafe-eval' https://www.youtube.com/yts/jsbin/ https://www.google.com/recaptcha/api.js https://www.gstatic.com/recaptcha/;style-src 'unsafe-inline' https://www.youtube.com/yts/cssbin/;connect-src https://www.youtube.com/ https://*.googlevideo.com/videoplayback;img-src https://i.ytimg.com/;child-src https://www.google.com/recaptcha/");break;

case "xakep.ru":
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline';style-src 'unsafe-inline' https://xakep.ru/wp-content/plugins/bwp-minify/min/;img-src https://xakep.ru/wp-content/uploads/");break;

default:
if(subject.URI.host.endsWith(".wikipedia.org"))
setRespHeaders(subject, "deny", "default-src 'none';script-src 'unsafe-inline' 'unsafe-eval' https://*.wikipedia.org/w/load.php;style-src 'unsafe-inline' https://*.wikipedia.org/w/load.php;img-src https://upload.wikimedia.org/wikipedia/ https://wikimedia.org/api/;media-src https://upload.wikimedia.org/wikipedia/");break;
                }
        }
        break;
    }
    //case "cookie-changed":
    case "private-cookie-changed":
    {
        if (data === "added" || data === "changed")
        {
            try
            {
                subject.QueryInterface(CI.nsIArray);
                var elems = subject.enumerate();
                while (elems.hasMoreElements())
                    handleCookie(elems.getNext().QueryInterface(CI.nsICookie2));
            }
            catch (e)
            {
                subject.QueryInterface(Ci.nsICookie2);
                handleCookie(subject);
            }
        }
        break;
    }
    case "http-on-modify-request":
    {
        subject.QueryInterface(Ci.nsIHttpChannel);
        modifyRequest(subject);
        break;
    }
    }
}
};

//-------------------------------------------------------------------------------------------------
var UIBuilder =
{
    widgetTools: false,
    widgetExternal: false,
    widgetMediaLinks: false,
    widgetStrictMode: false,
    widgetSpeedCloseTabs: false,
    widgetSearchDefault: false,
    widgetSearchEngines: false,
    widgetOpenUrlFromClipboard: false,
    setupUI: function(window)
    {
        if (!UIBuilder.widgetTools)
        {
            window.CustomizableUI.createWidget(
            {
                type: "custom",
                defaultArea: window.CustomizableUI.AREA_NAVBAR,
                id: "useraddon-tools",
                onBuild: function(aDocument)
                {
var toolbarbutton = aDocument.createElement("toolbarbutton");
toolbarbutton.setAttribute("id", "useraddon-tools");
toolbarbutton.setAttribute("label", "Tools");
toolbarbutton.setAttribute("tooltiptext", "Tools");
toolbarbutton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
toolbarbutton.setAttribute("type", "button");
toolbarbutton.setAttribute("image", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC0klEQVQ4y42RTWicVRSGn3PunZmkzQxNS0yQGgiFIhSl/lUtXUjFVUhXxWzEn4It4lbcuBOxuhcXuhSy6EZFVJidWCJFCNWFSKQGiZDUxMT5yXwz33fvOS6GBJc+cBZn8b6L55XFxcWLKVVvAaaqAORsHGJmuLu4O2b58Gdy8liv3W7fiHNzc+eu33jzhYfPPXaAkzRgtYCpkkRIKiQRKoEEjIASqN384MML7XZ7JoJ7Mcq2u0MfoTzo9sP2/b8nG/VQU0XBFffgWJqdbQ3m509uh0hUDfOARBEVFTxGshnV7NxUunPnl+nvv1ufCKJepuTu+HBY+tLSI7Uzrzz9BwJYBkDdDQFXpQqBlDPFSy9f2Fq68uiw1lCv14OLYCGoxRBclSxC6SIARHd3ESwGsjupViPv7Q7qP6z+Xg9Bvd8b2T+dQe52R9bpFSOBLhDLsjSAOLaaLYwLqqnjNN55rz2ztraZ/rrfq7rdwnI2HHxvtz8EdoD6/v5+BaA5ZRMRj5Gq0SB98fnPEysrP+aNjd2y3x96s9nIr117dn9YVCDigAnI4cwx5Qw4wIHD1ldf3j1dqwUTILvb19++sbawcOpPd3tiMChLwIAgIciRA3eKYsS91hRaJXMHL4qKjz5+8beFhVM/pUTv/ZtXdm/fvjcDuMNk0LFFBWRQDDv1yMid/uXnz+6MipLZ2WZ59er5X1OiEwIjYP/SpTMb2agnp6kSdOwgZ0mpyjFSutF9/frFu89dPrvX7RQCpBhBBHEnZGMiJVq5ohnGeXRzc7MMQT3WSBq8qirfvnXr2jefrby6+uknqw9sbXWaQMOcZkpMVxUnU+aEalSAOBgMvCxH0bA5tzQyIVUD4/GnTveefOYhLPPgwbCqu8uEmRw312NR5YS5K4BMT0+fb7Va76rq0TT/RUSOTlVdRRAVcrbO+vr62wKwvLzc8HGj8/8QEXFVrf4FaOKb4T1LMRcAAAAASUVORK5CYII=");
var menuPopup = toolbarbutton.appendChild(window.document.createElement("menupopup"));

var mItemOfflineMode = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemOfflineMode.setAttribute("label", "Offline Mode");
mItemOfflineMode.setAttribute("class", "menuitem-iconic");
mItemOfflineMode.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACvklEQVQ4y5VTz29UVRT+zrn3znReh2mh0CmhM0AoECKoxWp0gY0hujGVzfiLhLBgDSv+CjZAIgRki4mmxJWkEGOEaEIwEqAmbU2NWA3tUBhnXt70/Zj37j0sSjcyXfgtTnJyzvlyTr7vELrg7JWvBrM4OCRCbAWg/9SZASYOTU/flO5GUC33nfurNfx5PrdWlpd6tg548sfsvSNdCTYUi30//fgIlXI/1kMY95G1trcrgROCH8QwOgARg5gAEDJr0fRDtIIQh/Mj8DKBPvvl1cHKYOlMwSt6gtV7iwUz+tnh7chpDRBBRDB1dwEzCxEya+FsBmsF1jlo2wnf/7O57fj0L0vrruu3Y3z4TgWzSwtAlsISQEzIs4K2DuScQ6En13VYRNDwQ/QXDV7dUYJzFs45bB8qwa8DOrOCtGNRb7TBzCBmEBGiJEWjtYKmHyJNU+wsv4JTE1UsNaNlqzxfxHn+s9ycJgKSNMNTPwIrDSeEOLXopBbOOpDWYCcgItE54yRZ3DR569evg5Vk9q3XdmdasSDNHP4NEijtoI2B0gaaNGyWrqrCFkoxRXFbDQ0N4vSxbaesdfb+3YcfaJd13Efv7sWBXVtespzIahAIkqSD3t4SkiQGwFCK1VAPT+i80d/d/n7yk5nfpjeOvXnw5Miu3fuZGUop/L24nPxej25zbzlZfBTdeOOHyWZ/En1s1xzr3B11c+p6MjY2WjU5fWh8fPy9YrGY5XvyqdGms2XzRpekrtR4PD/tBf69txfmayPDw7WBVmtfuVLZ5+p1R5cuXxwbPfj6nYJX0MYYiAiMySEMV5ClGZgZ2mj8Mzf/887zXzzeqtSnG65dQ1CroRkE3+iBzQNeHHW+jePU8AsJmUm9+CEBQZwfgNrtZYL0q2oVQa0GVa2i8eABE/4HLuzdc8LL7NG1/NaTJ9efAzRGQQmyzbqWAAAAAElFTkSuQmCC");
mItemOfflineMode.addEventListener("command", function(event){Services.io.offline = !Services.io.offline;});

var mItemMediaEnable = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemMediaEnable.setAttribute("label", "Media Enable");
mItemMediaEnable.setAttribute("class", "menuitem-iconic");
mItemMediaEnable.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABQklEQVQ4y7WTsUoDQRRFT5aHTDHIFilSbBHEQoKFiHUqKws/wA/wA/YTrCVVKsknWIiFhViJxVaSakkhi0gIS1gkxRSLDNkUsyZR3JgIPhh4zB3ue/fAwH/WKPSKUegVq97ISjHYK7t48+njTquIk7fiOU6KcadVuYVXJTzt97AIiPCw2908QpDeoNSR64fRHwyiS3QfRIPOqqP+GOE99Ipla6XLu3U3MLoJgM0zEDCqXirJegb942vqGpTNnaEVJlbg4vD3CLen2+Wqilz55MrHisIYs6RVGMRnLmej30XSCMleUJNXdBYRDHqYHO7bX1nUPpvk3AnDITR8UApEHEAAk8EghSAAJbBzNa3NDT46C1eTQm4A6wCJAMrREoE5T2ArnNYEQA4a4HjhN4FJBWpdnjn60SLC48nqX/e92ncuwgxZi2VyrNj8VwAAAABJRU5ErkJggg==");
mItemMediaEnable.addEventListener("command", function(event){Services.prefs.setBoolPref("extensions.useraddon.media.enabled", !Services.prefs.getBoolPref("extensions.useraddon.media.enabled"));});

var mItemJavaScriptEnable = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemJavaScriptEnable.setAttribute("label", "JavaScript Enable");
mItemJavaScriptEnable.setAttribute("class", "menuitem-iconic");
mItemJavaScriptEnable.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACe0lEQVQ4y3WSTWhUZxSGn+/eO5OZJOo4kgYl2dg2ghghiKUbt4ZSU7qpG1diFwXXbkQqbnQtiIKIlKIbN24jWK0I0k2KWMYURNq0xGSiibFkJnfuPT8u5sdR6Vl/5znPe84X6NR3t2rFUqt8fSDi61SsgjkYuDmY4+4p5muYr7r5c5x766F4NekCBvLSie3l+NiFmTEGixH9lavTzLTUbNmuZkt3LbxMJ+88XvtWlze+6L0MyuGpsTLNDJ68yPljSagtC/N1YeG18SaNKBUTdo+WaeXGqW/GMZOZHsDdPxsZSlhtGmpg7riDO4g6ae683nREnZ/vL7LyJkNV/utFwLw6VIzJlF6j4UDojkAtIGqI5Jy5UVs0lR/6AGwZKkTkYhgB/L01EDqcXBxVyW+f/nIMoAdw82SgEEgVCO3JAXAcJ2DetsjVMJW029cDBPMoANbpd7xt0tHHAw5tQ5XNjwDmHYC/S/3OH4I7gXZE7QNEfUtsA8zp/B287xJ/L2XcmF3i/M1lhou7Pzl67s/p9wy6AHWIu7k7+guLOQ/m6hycKjF1YJD1NSn/8iifnTnzdCY+dmX+yORXJ2fdfPvEzkFCUvjAHe799op9ewtsrcRkmVMYiKhUIp49zyYSV7/s5uOYc+3uC5LYMRUijIARYXhW5dDoVjYaSgCCR4xUY0TZk7h55dLxz6kOF/i/+vGnf3i2kDG6IyFEgVYm1FdzVL0WT06f3Fv7t7E/idsLzMTAoVCIeteoDCfMzdfxuMS2LVBfE+4/bLCZ2vfJ0vrKccmrv15eXD8iKp+ayg5TqapKyVQwFUa2RTTSEtFfyEYjuJj/noudfXhx/523rst+WP1HSuMAAAAASUVORK5CYII=");
mItemJavaScriptEnable.addEventListener("command", function(event){Services.prefs.setBoolPref("javascript.enabled", !Services.prefs.getBoolPref("javascript.enabled"));});

menuPopup.appendChild(window.document.createElement("menuseparator"));

var mItemSvgEnable = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemSvgEnable.setAttribute("label", "SVG Enable");
mItemSvgEnable.setAttribute("class", "menuitem-iconic");
mItemSvgEnable.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACfUlEQVQ4y22Tu2tUURDGf2fuzd3sZtfgxsRkERMfcYMKKmqTJoWCqJ0IgmAjaGHrX2BjY2ctGAW1sLKIElCI+CgiJiBijGJ8pTHB3ZtsXnv3njMWyb1swIHDmTPMfHNm5htTq9XUGAOAMQYRof7rBd/fDPNx8TDZA5c5dbwFacmhqiSSxPiJAhApzE6OMTE2SiFXYvBoDx0Dip/JY4zBGINzDudcGuOHS+AUKiuwMDXC3ORD+ncNcOTkBWgfQFWx1iIieJ6XAiSAcnc0JlxSivzEm75NqdTJobPXsPl+rLU0Gg0ajQZxHANgraVerxPHMc455MppQ992peXvOPPLOfoHz0HQkWbwPA/P8xARVBURIQiC9O23BgoYlhYr+Jk2csVeVDVtkohsql9E0vpVFUkc87lW6vU1liuz/E9UNT3NIsYYVJVs3xDFnGPq5QNY/r7JOUnSbEtuSRFzOygPXWJhbpZ3j29S+/oUjapYa3HObSorGaOqYsIwVOugUlM62w2NHyN8ef2I+UqdrcUCXT0lstvKaL6XJW8X3d40rcVetFBe/10YhjoXKvefO04cEVqzBrNSpTbznD/LW6guRMjKD1SFz955jkW3iHNl9uw/QGbHIKZarSoYVuuQCTYo7Rk8MRhV3FqIXfnD6lpMRAETzfN+7BmdTHHw4h389SZBW9bQvBMAThWTacfPtFPYsK/+niGzOEnHvjKeH6wDWGtTuooI1lqAlEAJYG36CROjw3RuUUqDV1EFP+F6FEX4vo+IEMcxqkoQBBuzjpgbH+bT2xG6u9rYe+YGkt+5vkzJWJqXpJk09u8Hvry6x+y3KXYPHKTvxHVMtjv1/QegS0syuP4kfwAAAABJRU5ErkJggg==");
mItemSvgEnable.addEventListener("command", function(event){var x=Services.prefs.getBoolPref("svg.in-content.enabled");
Services.prefs.setBoolPref("svg.in-content.enabled",!x);Services.prefs.setBoolPref("svg.disabled",x);});

var mItemImagesEnable = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemImagesEnable.setAttribute("label", "Images Enable All");
mItemImagesEnable.setAttribute("class", "menuitem-iconic");
mItemImagesEnable.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABOElEQVQ4y62SMUsDQRCFv9lcAlbW1mJhlUKxsgim0SKFhY1g5V+IhQhWWlpZieIPsE6tIGInqG2IrSHNcZA0OW7HYjeX5O5MAjqwu2+Z2bfv7Sz8MQTg4OThySo1axWruOFxMoHtNH58vTusBwBWqd2f76asmk7p4vDEptFs7QA4Ausyx6cXrFU3Zkpuf7xxc3mGiNuPFACwXt1kq743kyBwrvMECpQEglHmlyiJ8yW+bmxBoSSGwJg5BAYtUgAwiEKiXjctji18RWViK5SNsrocM4jCvIXEW+iEAaZbKbx5iPDZq9AJg3H/s11IEiGOZ79BkggKGC/BTFpYOLSoCwrf7fe5Z13NfobAS7i9vlrg+iOUfqaN3sLKUj+VqNOKc187o4CXRrO1LeISIkKK/YNlcwjP/Ef8AAAailonSuCiAAAAAElFTkSuQmCC");
mItemImagesEnable.addEventListener("command", function(event){Services.prefs.setIntPref("permissions.default.image", 1);});

var mItemImages1stOnly = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemImages1stOnly.setAttribute("label", "Images 1st Only");
mItemImages1stOnly.setAttribute("class", "menuitem-iconic");
mItemImages1stOnly.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACAUlEQVQ4y6WTz2sTQRTHP7O7qVliLaTGINLgoeKPKjlEPEgPxQraQ6kXRXrxIOixlxYRxVM9eupJrP4BlYBICy1iiyJ6UiwYkFYtQm1roYlLNm2668x42GSbkLQXH8zMG95735nvvO/Af5oAuDoyMac0PUpplCYYFV/W+Kren30/PthrAShNz7MHl0NUHU7hEvg1m/7hyQsAAYAKIjfvjnIsndnzyovzH3n88B5CBPvqDQA4mT7Lud6+PQGsgHUjgAZMAVY1souZIuAlKnk7FDSYwsAyjKaFdmGejp9jnG7forzgIYTZSKHkFHDW18IiX8EPJ0Jy8xMDyTn2Z7pQ5VW8/DSX4gneVAFkhcL3goWx1tJw+sXIC2JHM8jNb2xvrODl/3Crr8iVaNf1ui5IKfD9xjcoKRDKQ/8tEolJTFNi7NvGjtt3jFoKu1nOS1NaymFEE2hZxrBMfNfGd7amdrqgYXXxc13h0PFXnEiZmBFN9JCFX1hB+x3IkkP2dRu3R3P36yg8GXsUFrd+GSKiDVo7O5HuV3zXYH05iTp4ngNtLWQdFxiv78Jh2w31q2KSWOoUfv4DWiZwN5LEu0fQwqgIabpWB7zrH57sFiJQmBCC7A2QxQW0PsLMrMfTpTPolzMIIQIVCt6Gv7GZ/Zoa0JbdRvn38kTKbB8U157LZnn/ABBr40W6LWdvAAAAAElFTkSuQmCC");
mItemImages1stOnly.addEventListener("command", function(event){Services.prefs.setIntPref("permissions.default.image", 3);});

var mItemImagesDisable = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemImagesDisable.setAttribute("label", "Images Disable");
mItemImagesDisable.setAttribute("class", "menuitem-iconic");
mItemImagesDisable.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAByUlEQVQ4y6WTwWsTQRSHv7fZxMZaeywVD9ZoRQQLVlqQCtUiJGiOIoiC0P9A9CBCq9B660VPYuxRxLMHPWhB0ZOCDeQUElGMxkgTFjdI3Ow8D5tukjatgg9m5zc7w2/eN28G/jME4Pz1JytGmTZGMUrQWtrv0KZbv3ybuThjAxhlenkuGbpq+Am7QHcM0teengYIDEwwM3tjgYNj49umnF99z/3Fm4gE4/UMADg8dpyJmdS2BnZAvdlAgYiAvT6zRUQk4JLWujaCQkQsbMv6i4GF9soAoO7UcCrlcLFnoOhE8YwQtZTEoEfdqW1G8FsIhZqNVY713Pk3QrYSo1Cz2/XfWAXfFzyv9xkMfX1DIveQqbU8hTuPOdCYZGUjwlYxVHrFyewiI6eS7Og7xs/SR658yXAhPXCuXQWFb/kPPQ0mPt9lXyrJzsEBmm6VeH+U4dERiu+y810ID+4t9TRYu3qb+K4++s/Ohf9+LUyi2jzUhTAcd8P720lV37Mf51Meb/kyvlulWa/i/viOquYE4MTso9ciTIkE5RERQg2MNnJccjPsPZIgZjdxK2VKxQq+Z5Lyr8/2RXp3So1/S1WPqppVUZ0/86zx/A+61tAV4i6jYwAAAABJRU5ErkJggg==");
mItemImagesDisable.addEventListener("command", function(event){Services.prefs.setIntPref("permissions.default.image", 2);});

menuPopup.appendChild(window.document.createElement("menuseparator"));

var mItemCookies1stOnly = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemCookies1stOnly.setAttribute("label", "Cookies 1st Only");
mItemCookies1stOnly.setAttribute("class", "menuitem-iconic");
mItemCookies1stOnly.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC5ElEQVQ4y33T21OMcRwG8Ofdd7dtt3c7KR0UGmtWWqtpbcUw5TBDpWgazTQOucXFZiYuyMgMxoUYbgyGC8MNwzhTSBQzjHJMbCkVZVc6bdu7u+/v+/5cYMZF9fwBn/k+z8xXwN+01JSWMFVxEqlWIgZS2XsiOrGi+uE1TBEBAJprSo+LRqki0VGEsLjZ4CphtM+Fzqar8A67j+Ydatw1GaBpqSktEY1ShaVoJ/Qih6+1Hr7WR7h35SxsxRXQGaTKW7vt6ycFmKo4Ex1FCHo6cPncEZA8CvKNYk1mJpQ+F8xL1oEp5JwUIFIzTIlm+N1fsHZlHjhjuF1/H5wY/H3tiJ5hAXFmnwzQEjFwlcCJgTMGTgz5S3PBiUH2+9BbfxEGvSTV7l02KIrabq0onuecnVpe3cD+XKCylpHeT9BHJ4MTw52GOnBiGPzVD1dXK6JnpiJr4z5h8dbDUdbCHekRyWknRTH0wePq3FAAEDfnzhrwurvL4jNWQ8M5UmKiEPTLaO/9hMzinQgPi0Cw5wOCni6EaHVIsOcj4BuarYwNG84/ctWJFxq6XKWOSM0P18ucsCQLIi1Z+N7fAdO0RMTFp8D78Tk4BQGu4sadK5gTF4sY20p43j9ZuGnZkmPCvzFu7lpUQkROIsVBnELsBds1JiWA67cuoSBnFTqYHw0jbnj8PsRETMeC8XHMkOUMYaJlLzvn37UXbMszsSACA9/gYn5clz1Im2eGwajH0PAIXr17h3hZcWomAjiE5qHvHdDHpQAQ8NjrxnyLGeERErZkH0BkpARrqhltAW/5hIBWFU9/a2sa9xNBSl0Md0BGmGRAmb0KAFCefRAmyQiF2Fxxwgov3aMbHLEuT+ebdaHRCdp2eRhCqIDPA8+QnrQCZxor4R74ia89va+FqT7tWqXNqtPoq/p0IflPJZ3JZrUg3GSEZ3AQL5pb4B3zrpkS+D+FexblEVeqGTEbI+WtwoL7G098rf0N1LBY6KdVYIEAAAAASUVORK5CYII=");
mItemCookies1stOnly.addEventListener("command", function(event){Services.prefs.setIntPref("network.cookie.cookieBehavior", 1);});

var mItemCookiesEnable = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemCookiesEnable.setAttribute("label", "Cookies Enable All");
mItemCookiesEnable.setAttribute("class", "menuitem-iconic");
mItemCookiesEnable.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC9ElEQVQ4y32TTUxcZRSGn3vvBGbKKDA0gaEtpcUWTa00DIFK2jpYFRtLUwIpqZoYF65cgEZdacLGuNC2qS6MjTaNGhfWNjGiFpSCaZsIAaoygTKdqf2BaQEZ2mH4uXe+cz8XaBcGfJOT96yexXnfY/CPho4calKutLquelREIaKGlcjxJ9t/Psv/yAC4fKzlmOn1twWrG/AXbkK7QmoiSvzSGeZn73xQ/+6FN1cDmENHDjWZXn/b1gOvkW0apCPnSUe6+eH0CSoa27B8/je+eyt0cFWAcqU1WN2AMxXn68/eQxZTyEKKfTU1OIkoW2oPosRtXRXguqryweAW7MkY+/fuQ4uio/tHtMpgT0TJX7cVERVaDeBxRaG14IpCiwJRPLcrjBbFwtICN3u+xJed4+98e3fSMj03PJZ1Umv1cV17rwIwRdTQ3VujZAfWgyg6ejrRophJ3iZ6PUJgwyPsfOEdo3zPU/nbG17dkbth24eWx/tTT3vYC2C9FC77a27q+uFgqB5DazYX5OHYi1y9eYXqxtfJ9eeRivWQnhvDk4GNtYex07OlmfRd38nuaJd1qjcebanKM2+P9T3hX/8wueU1jCdiPFBQTGFwE+mRiyyYdygNv0K8/zQ5xhrWPvY0U8O/VLy4u/aoBfDFhVu9zaG8SOJKfzDW933hTCJqllXWG2ZqmsGR8zz0+LP4/PfIWlNE6s8I+Zt3MnMjkpUlybPmv9c88P7Amcajl/c0Hx/2GYbRaRiAdimvKCN3XTH9n39KoLSEeTWNqCWM5Q5irhSNxhhMTsRwvHMUlNehFwcBcJ1RirbvIjHcgX1vej5tB0bNlbO1Ppm89utiRifJWRvAzYxT1VwBmSkCG4uZm/wNce2v6tpPLa0IaProj/GSbUV9gbK96PQlAAa++R0AWYpSHAojkvDef6b/6uq5lsrsnJKB4I6XDa0dcB3QDlrby+46jHx7Qs9eG6taERDver5TbOcZcTKIk0HsZVeOc39fHtX1NwGLcNIWpoz3AAAAAElFTkSuQmCC");
mItemCookiesEnable.addEventListener("command", function(event){Services.prefs.setIntPref("network.cookie.cookieBehavior", 0);});

var mItemCookiesDisable = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemCookiesDisable.setAttribute("label", "Cookies Disable");
mItemCookiesDisable.setAttribute("class", "menuitem-iconic");
mItemCookiesDisable.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC3klEQVQ4y33T20uTcRwG8Ofdu6Pb1JbhIU2HmpSywqWiJGoWOU1LDCMqiu6qixlUN528KbrITjcRkRdiN4pS2cEOmh2oCBTMzJiWeJ5bzTWdzr2/7/vrooIunM8f8OHLw/MV8Dc9ddVVTJbsRHIGEQPJrI+Irm+pfdGKZSIAQHdd9VUxzFATl1UBfXQSuEzwTTrw/W0LZr3Tl20X3pwMBSh66qqrxDBDTVrFcWhEDn9/J/z9HXjSfBuWyhqodIYTbaesu0ICTJbscVkVCLqG0HTnEmjBB/L7UJKdDWnSgZS8nWAS2UMCRHKmMS4Fgelv2FFsA2cMDzvbwYkhMDkI0+o0EGfWUICSiIHLBE4MnDFwYijdXAhODAsBP8Y6G6HTGAxPT+d7RFE5ohTFes7ZzaLaLvbnApn1/Br7Co0pAZwYHnU9AycGz88pOIb7YVqzDjn7zgq5hy6uyCg/tjEiIf2GKGqfv6wt1AKAeKAw8cfs9MjemMztUHAOc9QKBAMLGBz7iuzK4wjXRyA4+hlB1zDUShViraVY9M8kSXNeXX2H45nY0DXsqM6KVDgdHwv08WmITMvBxNQQjCvjEB1jxuyXd+AUBLiM+4+akRy9ClGWYrj6Xm3Yn593RfhXxoOTm6qIyE4kZREntbXsqMIoLeJe212UFWzFgtsJz8AnBH1e6GISwSKNkFViprBUs0329Y+tZUdsRhbE4o9xzLud8A70wVxUAo1WhdmJYYy8fw1JrbMrlgI4hO6ZiSFoos0ABMwM9CKpsARhEUZwaR46vQqxa81gP90HlwSUsnhrfODtfIAIhnW5CPp+QWfQQl92DhF7rsF0uAFqpQQuS6lCqIG01Fh2a/Xhjal5uzTe9mbEpiQhzKACzXnA/B74nFMYHZz+ICz3aa0nLBkqheaMyh8o1bvdxvj0ZKiVDHMuJya+u0CSXLIs8H86ysNtXKZazrmFc7lX4Pz8tvbFp78BMsZXx1aNz98AAAAASUVORK5CYII=");
mItemCookiesDisable.addEventListener("command", function(event){Services.prefs.setIntPref("network.cookie.cookieBehavior", 2);});

menuPopup.appendChild(window.document.createElement("menuseparator"));

var mItemStrictTls = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemStrictTls.setAttribute("label", "Strict TLS");
mItemStrictTls.setAttribute("class", "menuitem-iconic");
mItemStrictTls.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACfklEQVQ4y22ST0ucVxTGf/fOOONMZ6y0scZZlPEPTVeldOeii0ChlJYsQr5A6aKEKLgRl4LbfIVuQsZNFvkAoeuGFoNCiUGrGUZJwUj0LW+dce49554uRhM1vatzz58fz3nudVw5q6urtZTSoqrOqupHqoqqHqnqUxG5v7Cw8O/Ffnfx0mq1vkwpPW40GpMjIyN470kpcXp6yuHhIe12u62qt5eWljbeA7RarZqqrk9PT8+EENjf3+fk5ARVpVgsMj4+DsDm5uaOqn6xvLzcA/DnAFW9OzExMRNjZHt7+2We580YYynGWMrzvLm1tfV3CIFGozEjInPnc8XzQERmq9Uqu7u7xBh/mJ+f71zYrrOysvJNp9PZbDabiMjs/wHGvPfkeY6ItK+aKyLtGCPee1R17JIHv3R+tPj0BuGggqpSu7WGK0TMBDMBEzQqew++IqVEefyY69+vce/zdVcEMIxv79zEO0/JVSi47yjg8AyfVSNdzemvnJCIADzZ+e3dCmaCYTyTR9SL1/jA1SgxRIFRIJH4h9f6F0fhFf3U5evKHM76vH0FZ4LDSASy7BlH2RoJx+/799nde0igR549p5+1UQskU9TCRQVxINUi1dHPqPtrKAmnyqs/K3zyaaA6OknvtIxZFyNhZ4DBP7BIMsWI5McbvMn+ICIUUyL2+yiBPHtBzPZIJjgSWLyswEiIBYZHm5QLHxMINKd+ZnJKEA4Y+rBBoTREsC4OuwzAwsCsFOhlzwmFOp4aUMIQPBnd3iESc1J9BLX3FAyMmS3/hK8UwJXxDOMZAhSjR6zniPZJpoCByTtAsj6/vlwcUE0wi6Sz+G0OPaspDsVMAfgPiQeW89MOx5kAAAAASUVORK5CYII=");
mItemStrictTls.addEventListener("command", function(event){Services.prefs.setIntPref("security.tls.version.min", Services.prefs.getIntPref("security.tls.version.min") >= 3 ? 1 : 3);});

var mItemStrictHandshake = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemStrictHandshake.setAttribute("label", "Strict Handshake");
mItemStrictHandshake.setAttribute("class", "menuitem-iconic");
mItemStrictHandshake.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACfklEQVQ4y22ST0ucVxTGf/fOOONMZ6y0scZZlPEPTVeldOeii0ChlJYsQr5A6aKEKLgRl4LbfIVuQsZNFvkAoeuGFoNCiUGrGUZJwUj0LW+dce49554uRhM1vatzz58fz3nudVw5q6urtZTSoqrOqupHqoqqHqnqUxG5v7Cw8O/Ffnfx0mq1vkwpPW40GpMjIyN470kpcXp6yuHhIe12u62qt5eWljbeA7RarZqqrk9PT8+EENjf3+fk5ARVpVgsMj4+DsDm5uaOqn6xvLzcA/DnAFW9OzExMRNjZHt7+2We580YYynGWMrzvLm1tfV3CIFGozEjInPnc8XzQERmq9Uqu7u7xBh/mJ+f71zYrrOysvJNp9PZbDabiMjs/wHGvPfkeY6ItK+aKyLtGCPee1R17JIHv3R+tPj0BuGggqpSu7WGK0TMBDMBEzQqew++IqVEefyY69+vce/zdVcEMIxv79zEO0/JVSi47yjg8AyfVSNdzemvnJCIADzZ+e3dCmaCYTyTR9SL1/jA1SgxRIFRIJH4h9f6F0fhFf3U5evKHM76vH0FZ4LDSASy7BlH2RoJx+/799nde0igR549p5+1UQskU9TCRQVxINUi1dHPqPtrKAmnyqs/K3zyaaA6OknvtIxZFyNhZ4DBP7BIMsWI5McbvMn+ICIUUyL2+yiBPHtBzPZIJjgSWLyswEiIBYZHm5QLHxMINKd+ZnJKEA4Y+rBBoTREsC4OuwzAwsCsFOhlzwmFOp4aUMIQPBnd3iESc1J9BLX3FAyMmS3/hK8UwJXxDOMZAhSjR6zniPZJpoCByTtAsj6/vlwcUE0wi6Sz+G0OPaspDsVMAfgPiQeW89MOx5kAAAAASUVORK5CYII=");
mItemStrictHandshake.addEventListener("command", function(event){Services.prefs.setBoolPref("security.ssl.require_safe_negotiation", !Services.prefs.getBoolPref("security.ssl.require_safe_negotiation"));});

menuPopup.appendChild(window.document.createElement("menuseparator"));

var mItemLogUri = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemLogUri.setAttribute("label", "Log URI");
mItemLogUri.setAttribute("class", "menuitem-iconic");
mItemLogUri.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACSElEQVQ4y3WRT0jTYRjHP++2NCUxKf9EsjArCEQQCV0S2CWkQCLzUkju3jHQw6yZuwRBSIoevESHyP7QJSKiQ6ODZWaYNQUNndNEk6WbG8s9v6eDLZzTLzw88Hzf98vnfR/j9XoVwOl0js/NzVU4nc5AMBg8meoAdrv9vMfjecU/xX+G9veXl4dDsQQ2EaGmpga3293scrlobW29tLWrKiLy0ufztaQCPrwbebyeX4yBzYCGhgb6+/oCp+vO0NvTE6h11dHb0xOoPlULgMfjMSLywOfztczO/24aN4fPfay/TOPQ5xba29tVVTUpotv1ZyOpXq9XRURFRDs7Oy3x51mD9y5q2827YwAOEQFg/leYSDzBdhlj6OrqAuBC5VezEY1T9OMFnlvdjXdu38BhWRYAzqIDWKoZAZ6ODgBsxqD+bEb9gq2gZCnv4JGZLQTKYjjCylqU3XQ82oYVs1hbVmq6PlVxuxRgk0BVsdsS5Oz17hqwZ2aQ4ffCatlVcvNLF1LzTQKjBJdmyXJU7Xj5RHiAtbDFekTxx4vTvP9/MLUwRUHZ04zL++yHyIqMMzokHGvuJvlkOs23iQiqMBmaZDGZyKjq0BtWFi1imktp3XVSW0sjUJSJuQmiFfE005VzlvHpEhJjzxk+eoV6lGQymUmQesKX+VhaxadX6RgIkFXZxLNvoyjsQqAQXJpl5P5ymvmWCciG1w+/U5hfCJgMAoeIYFmWtfBo0QAYTMrTrd0Yo8CGiOSkBQC4r7ltO2zP7DBz2GzpR/8CirJSnjHl0tcAAAAASUVORK5CYII=");
mItemLogUri.addEventListener("command", function(event){logUri=!logUri;});

var mItemRedirectPrompt = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemRedirectPrompt.setAttribute("label", "Redirect Prompt");
mItemRedirectPrompt.setAttribute("class", "menuitem-iconic");
mItemRedirectPrompt.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABwUlEQVQ4y52TQWgTQRSGv9nMJo3ZTaFSPIsptWKCemovChVDMSe9CdWLForiSWpQFG9pS+mhiCB4EtpexJ5ckYCIFjxYC4K0Fru9VHryoE2apF2zGy+7YSrJgn0wMPPPe//M/O8fCImrH/tvjXw+fyUsR7QCc8WUBpyJxWL3zVjnpbhuvEro5uh05uVWKEGumBLAHSAPHG5oCLPDIB41SehmydCNsYgWfVY4MdsIaqRSnATmgYsB5noOu24NUZfIhkxK5N24Lj8Aa0GOplxgSi0GNhxv7+1uvYrzp+buubXpqltJT5ycX1NvLf3TzwI3FPwBMF6u/36UIHkEEbm+cG7lUyu9gidcU/R4bmXtAkB6gReaqBTeD/502nUhIDitYI+DydfLrEA1rItNDXoU7Dv/EQGBKkzvQQiWFOxmu+Tcm1SkpZH8LrxThHwIjFtZ22sazGMAMIANoAKUrCG7KhQjzQC3FfJvwKI/zwDbwCoeW8CSNWQv7nMicA84Dlzw133+aBoTOIrGa+BJ28+UK6ZGgUnA/GerDOStrP007DceAhId3dLsGe5KJ49FTwlNeDubzvL63K8vlR/Otv/+ZvwFZS9+PoHy6NYAAAAASUVORK5CYII=");
mItemRedirectPrompt.addEventListener("command", function(event){Services.prefs.setBoolPref("extensions.useraddon.prompt.redirect", !Services.prefs.getBoolPref("extensions.useraddon.prompt.redirect"));});

var mItemRestart = menuPopup.appendChild(window.document.createElement("menuitem"));
mItemRestart.setAttribute("label", "Restart");
mItemRestart.setAttribute("class", "menuitem-iconic");
mItemRestart.setAttribute("image",
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC0ElEQVQ4y41TXUsUYRg9O/POzG5+1K46aqi71aqVq5VWRlkYhpUXXVUXfnSV1l0UFeWNGwQZREJEP8AugpakDCLUUDAVCqstJCkTNXM1bdXU2Z2Zd963iyg0tDqXz3PO83V4bFgBB+qLMmS7dENUJNNG7Oeaq5snluPZlgsevuVVdC05uNm7KVskIkYmh1+R1XE7A8cD1p9cYbkC82HXmURnYraakAx3igfOWFc+NK0GAPx+/xKN+Ke4sNaXLIhSoGBLgdI/2A8ODreajtB0qDDv6KaB2dSp828D75tXnIBaYiZj1kLfhz5MTk/1f/r8aYRIMjzqukR3gqeJUT7x1xV6rwefy0I0a3Ly21VGrQsmNXunv4fhVt0gogjGedtiPgEAf3sxGZ5N2WlGjBJKcVCbm29s/tpStx+7LsU6YrZregQL0XmE56b1mTXRriUu1DytTKUGe5Qgu3aocSoU2Y7ON52tgerHpb9IhxqKPZJDLpEIUZtOPrlW7PfYO/xD0d82VjVWxVBhbiTfU+AikoTgx2BkaCAU3+HvoIub7b28LdEUcYUxlIoRe25PQ0+EAIApfq9ZozhdhBB0v+kyGYfdsGZ3AOgBgP31e3JArYMW56fT1ZRMZlkIjY9fBHBFOHb/WBJMXrc+dQM+fh7AVHjq9thYqEI3uAsAym7uy81Ym95FFDmLKNIDi1H4sn1wOJSLRf6CDGLTopVJ8epqG4Av46MggnyWGhp6rwdtR+6U5CU5Uzt963LiZVk6xRkH4xyiIMKT4Vk1NDpUQXTTcMxpGjQ9At/GPJjUQEtLKwBAUpT6zDRvvCRK8KZ5AQ5wcDDGQBmFLEsCkQ391pfZ0czBwcHdpq6TSJTCNH7ezhLk8nfDwWd57q35Lz+8mLEYC3PGAc4sxnk3WRXXYMM/UNVYGiPanW061dvvlT+s/a9nWoy7J1oWDFMsI4Lt9XL5H4DJM+Ra80GXAAAAAElFTkSuQmCC");
mItemRestart.addEventListener("command", function(event)
{if (Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService).confirm(null, "Restart Browser", "Restart Browser?") &&
!Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool).data)
Cc['@mozilla.org/toolkit/app-startup;1'].getService(Ci.nsIAppStartup).quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);});

toolbarbutton.addEventListener("command", function(event)
{
mItemOfflineMode.setAttribute("default", Services.io.offline);
mItemMediaEnable.setAttribute("default", Services.prefs.getBoolPref("extensions.useraddon.media.enabled"));
mItemJavaScriptEnable.setAttribute("default", Services.prefs.getBoolPref("javascript.enabled"));
mItemSvgEnable.setAttribute("default", Services.prefs.getBoolPref("svg.in-content.enabled"));
var val = [false, false, false];
var tmp = Services.prefs.getIntPref("permissions.default.image");
if (tmp === 1) val[0] = true; else if (tmp === 2) val[2] = true; else if (tmp === 3) val[1] = true;
mItemImagesEnable.setAttribute("default", val[0]);
mItemImages1stOnly.setAttribute("default", val[1]);
mItemImagesDisable.setAttribute("default", val[2]);
val[0] = val[1] = val[2] = false;
tmp = Services.prefs.getIntPref("network.cookie.cookieBehavior");
if (tmp === 1) val[0] = true; else if (tmp === 2) val[2] = true; else if (tmp === 0) val[1] = true;
mItemCookies1stOnly.setAttribute("default", val[0]);
mItemCookiesEnable.setAttribute("default", val[1]);
mItemCookiesDisable.setAttribute("default", val[2]);
mItemStrictTls.setAttribute("default", Services.prefs.getIntPref("security.tls.version.min") >= 3);
mItemStrictHandshake.setAttribute("default", Services.prefs.getBoolPref("security.ssl.require_safe_negotiation"));
mItemLogUri.setAttribute("default", logUri);
mItemRedirectPrompt.setAttribute("default", Services.prefs.getBoolPref("extensions.useraddon.prompt.redirect"));
mItemRestart.setAttribute("label", "Restart (" + httpsForced + ")");
menuPopup.showPopup(this, -1, -1, "popup", "bottomleft", "topleft");
}, true);
return toolbarbutton;
                }
            });
            UIBuilder.widgetTools = true;
        }

//--
function getClipboard()
{
    var clip  = Cc["@mozilla.org/widget/clipboard;1"].createInstance(Ci.nsIClipboard);
    var trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
    trans.addDataFlavor("text/unicode"); clip.getData(trans, clip.kGlobalClipboard);
    var str = new Object(); var len = new Object();
    try
    {
        trans.getTransferData("text/unicode", str, len);
        if (str)
        {
            var arrUrl = str.value.QueryInterface(Ci.nsISupportsString).toString().
                split('\r\n').filter(function(x){return(x!==(''));}).join('\n').split('\n').filter(function(x){return(x!==(''));});
            if (arrUrl.length) return arrUrl;
        }
    }catch(e){}
    return null;
}
function getUrlBar(event)
{
    var gURLBar = event.currentTarget.ownerDocument.getElementById("urlbar");
    if (gURLBar)
    {
        var query = gURLBar.value;
        if (query && query.length && !query.startsWith("https://") && !query.startsWith("http://") && !query.startsWith("ftp://") && !query.startsWith("file://")) return query;
    }
    return null;
}
function uniq(a)
{
    var seen = {}; var out = []; var len = a.length; var j = 0;
    for (var i = 0; i < len; i++)
    {
        var item = a[i];
        if(seen[item] !== 1)
        {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
}
//--

        //External
        if (!UIBuilder.widgetExternal)
        {
            window.CustomizableUI.createWidget(
            {
                type: "custom",
                defaultArea: window.CustomizableUI.AREA_NAVBAR,
                id: "useraddon-external",
                onBuild: function(aDocument)
                {
var toolbarbutton = aDocument.createElement("toolbarbutton");
toolbarbutton.setAttribute("id", "useraddon-external");
toolbarbutton.setAttribute("label", "External");
toolbarbutton.setAttribute("tooltiptext", "External");
toolbarbutton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
toolbarbutton.setAttribute("type", "button");
toolbarbutton.setAttribute("image", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACJ0lEQVQ4y7WTTUhUYRSGn/vdb34ymaYiQxEswgoE+6GEFsZEP9BUQouCiFpEGC0s2gUtdNEibFPYpkUEFURBZBQRGJhBhRQhgpZgZOoYOk4z987fnbn3+267yBLKhe/y8PLAOTwHFiMXrj7ZerN78Fp9S+fqf3XN+YYzsqG19dTei1ZOncgs2TaUHnkxuiCAXFEfi8ebY+vWrqqsq4kemw03RUV0fW/22zv1X4BQtC62a/fOWLFYpnJpyGjcWL0jpyIHVVXzq/Tn56nfuwZA2+W71rTlRHzfR3sltOuwZ/8+fMDXPlprtFYMj6bybweT54funbg1BxBv7fQbtzQQDlcQCIaQMoAhBAC+1ijl4bkurlsiYzu8/2Q/TIyNnpnoac9IgFwuj20XUTpA2JdILRHCBx+U1ihP4RRLZDI2yZlZSsnEUZBNa1quH5YAiakkZniKqmqILDMIBX2EECitKZdd8nmHbNYma1vYVpps3sEkgHYLSABPuRRLCtcTaG0CEsMwEUIjBMiA+rWalCbI0P1CcvLszIfblgSorV1ppzOJCH6O9LRJQAq2Nx/CK7sIQ+B5HqYpKTqWPZUYb5t8fePOnCP+mYqaze2Xuh53lAsO+XyRlJXiY39v/8TI8PEfQ91f5jgzH8AXklBFGL/skUiOqb5nD65kxkc6Ct8HvL+km1fPYIicKvOy99H4QM/Tk7mvb/oW9EwbDpyObzpyritY1bCcxc5PIFr/gw8IJcUAAAAASUVORK5CYII=");
var menuPopup = toolbarbutton.appendChild(window.document.createElement("menupopup"));

var external = Services.prefs.getCharPref("extensions.useraddon.external").split('|');
for (var i = 0; i < external.length; ++i)
    if (external[i] === "?")
        menuPopup.appendChild(window.document.createElement("menuseparator"));
    else
    {
        var tmp = external[i].split('^');
        if (tmp.length === 3)
        {
            var mItem = menuPopup.appendChild(window.document.createElement("menuitem"));
            mItem.setAttribute("label", tmp[0]);
            mItem.setAttribute("class", "menuitem-iconic");
            mItem.setAttribute("cmdline1", "^" + tmp[1]);
            mItem.setAttribute("cmdline2", "^" + tmp[2]);
            mItem.addEventListener("click", function(event)
            {
                var arrUrl = getClipboard();
                if (arrUrl)
                {
                    arrUrl = uniq(arrUrl);
                    if (event.shiftKey) arrUrl.reverse();
                    if (procFile.exists())
                    {
                        var arg = (event.button === 2 ? (event.preventDefault(), this.getAttribute("cmdline2")) : this.getAttribute("cmdline1")) + ' ';
                        if (event.ctrlKey)
                            for (var i = 0; i < arrUrl.length; ++i)
                            {
                                var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
                                process.init(procFile);
                                process.run(false, [arg+arrUrl[i]+"^"], 1);
                            }
                        else
                        {
                            var process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
                            process.init(procFile);
                            process.run(false, [arg+arrUrl.join(' ')+"^"], 1);
                        }
                    }
                }
            });
        }
    }
toolbarbutton.addEventListener("command", function(event) {menuPopup.showPopup(this, -1, -1, "popup", "bottomleft", "topleft");}, true);
return toolbarbutton;
                }
            });
            UIBuilder.widgetExternal = true;
        }

        //MediaLinks
        if (!this.widgetMediaLinks)
        {
            window.CustomizableUI.createWidget({
                type: "custom",
                defaultArea: window.CustomizableUI.AREA_NAVBAR,
                id: "useraddon-medialinks",
                onBuild: function(aDocument)
                {
var toolbarbutton = aDocument.createElement("toolbarbutton");
toolbarbutton.setAttribute("id", "useraddon-medialinks");
toolbarbutton.setAttribute("label", "MediaLinks");
toolbarbutton.setAttribute("tooltiptext", "MediaLinks");
toolbarbutton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
toolbarbutton.setAttribute("type", "button");
toolbarbutton.setAttribute("image", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABQklEQVQ4y7WTsUoDQRRFT5aHTDHIFilSbBHEQoKFiHUqKws/wA/wA/YTrCVVKsknWIiFhViJxVaSakkhi0gIS1gkxRSLDNkUsyZR3JgIPhh4zB3ue/fAwH/WKPSKUegVq97ISjHYK7t48+njTquIk7fiOU6KcadVuYVXJTzt97AIiPCw2908QpDeoNSR64fRHwyiS3QfRIPOqqP+GOE99Ipla6XLu3U3MLoJgM0zEDCqXirJegb942vqGpTNnaEVJlbg4vD3CLen2+Wqilz55MrHisIYs6RVGMRnLmej30XSCMleUJNXdBYRDHqYHO7bX1nUPpvk3AnDITR8UApEHEAAk8EghSAAJbBzNa3NDT46C1eTQm4A6wCJAMrREoE5T2ArnNYEQA4a4HjhN4FJBWpdnjn60SLC48nqX/e92ncuwgxZi2VyrNj8VwAAAABJRU5ErkJggg==");
toolbarbutton.addEventListener("click", function(event)
{
    var uri = ">";
    for (var i = mediaLinks.length-1; i >= 0; --i)
        uri += "<a href=\"" + mediaLinks[i] + "\">" + mediaLinks[i] + "</a><br /><a href=\"https://direct.invalid/" + mediaLinks[i] + "\">&lt;Direct&gt;</a><br /><br />";
    uri = "data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPk1lZGlhTGlzdDwvdGl0bGU+PC9oZWFkPjxib2R5" + Services.wm.getMostRecentWindow("navigator:browser").btoa(uri + "</body></html>");
    var getBrowser = event.currentTarget.ownerDocument.defaultView.getBrowser;
    switch(event.button)
    {
        case 0: getBrowser().loadURI(uri); break;
        case 1: getBrowser().selectedTab = getBrowser().addTab(uri); break;
        case 2: event.preventDefault(); getBrowser().addTab(uri); break;
    }
}, true);
return toolbarbutton;
                }
            });
            this.widgetMediaLinks = true;
        }

        //StrictMode
        if (!this.widgetStrictMode)
        {
            window.CustomizableUI.createWidget({
                type: "custom",
                defaultArea: window.CustomizableUI.AREA_NAVBAR,
                id: "useraddon-strictmode",
                onBuild: function(aDocument)
                {
var toolbarbutton = aDocument.createElement("toolbarbutton");
toolbarbutton.setAttribute("id", "useraddon-strictmode");
toolbarbutton.setAttribute("label", "StrictMode");
toolbarbutton.setAttribute("tooltiptext", "StrictMode");
toolbarbutton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
toolbarbutton.setAttribute("type", "button");
toolbarbutton.setAttribute("image", isStrictMode ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjElEQVQ4y8WTsUorQRSGv3FVjAhxHsBSX2AhtjbCCOFaiGAhCja2oqDNltv6DolpfISt8gS72Ai30EpyvXAJTjCp3FmPhTtrEq+VhQMHZuY//8eBf0aJCN9ZM3xzzfrNtVIEYIAYiApI3FjTtLZXTj4+gSkg3r24CIv3RjOt/To5+ayJCCJCB9LX83O5bTbl5fRUOpB2wJSV/js6kttmU3r7+9KB1PsqQBtMC1J7fCzdRkMeDw6kBWkL0t/b29JtNCTb3JQWpG0w3qd8Cm2lcGAE4o2dnfD+7o56vc5oNOJPr0etVmP48JApiGYhOSx9E4AcKErIyupq+NTvAxAEAc/9fqYgCiCZAzygSuEvMF9eKCAfDFj0YlGQAwI44OWrdyBgHMRrWoc151iCqta0Dh3EMpnOZIw5xOtah950Y212Y23mz+tah/lUjBUgh3hrzNy1NnMQOYi6Y5CtD8gkYAjRlbXZAnBlbTaESCARSP6neV+VwplSWDCvEM9ApCFZLpsG8Em7nI7xx37jGzeb2i8Tzz9LAAAAAElFTkSuQmCC" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABrUlEQVQ4y8WSPariUBTH/y9JI4gf4Ee8mCZMYQQFc2sRpkkaF+AC7HQHKbOKWcFbQrZgmDRKtDAIiUIEExWS2jPF4MOnwzBTvQMX7j2/e/6cL+CrTXx8cM5Nxtg7YyyK4zj4FybcL7qum0Rkz2YzTkS2ruvmM5tOpy/sI4Nms/k+n8/5er2GYRjMdV1NluVIluVvRGRPJhO+3+8xGAyY7/va8Xj88UlAluVosVhow+GQua6L0WjEfN/XAHw3DIPvdjtIkgTHcTwA1vF4DADg7bHOfr9vArDH4zEPggDlchl5nuNwOKBQKCCOYw+AtVwunXvM23NXe72eCcBWVZWnafq7TlHE+Xz2AFir1cp5/C89C9xuNwBAnucQRfHF/9cxdrtdE4DdarU4AAiC8HGKxSLLskyr1+vR6XQKXgQ6nY5JRLaiKPwedDgcvCzL4mq1ygRBQKlUYtfrVavValGSJMGnPSAiW1VVLkkSJElCGIYeEVlEZIVh6N39qqpyIrJfMqhUKlGSJFqj0WCbzcYjImu73TppmgZ/YpfLJXhpiKIoZrvd/qkoivk/7GvtF6UBz9lKF2MLAAAAAElFTkSuQmCC");
toolbarbutton.addEventListener("command", function(event)
{
    isStrictMode = !isStrictMode;
    var btnIcon = isStrictMode ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjElEQVQ4y8WTsUorQRSGv3FVjAhxHsBSX2AhtjbCCOFaiGAhCja2oqDNltv6DolpfISt8gS72Ai30EpyvXAJTjCp3FmPhTtrEq+VhQMHZuY//8eBf0aJCN9ZM3xzzfrNtVIEYIAYiApI3FjTtLZXTj4+gSkg3r24CIv3RjOt/To5+ayJCCJCB9LX83O5bTbl5fRUOpB2wJSV/js6kttmU3r7+9KB1PsqQBtMC1J7fCzdRkMeDw6kBWkL0t/b29JtNCTb3JQWpG0w3qd8Cm2lcGAE4o2dnfD+7o56vc5oNOJPr0etVmP48JApiGYhOSx9E4AcKErIyupq+NTvAxAEAc/9fqYgCiCZAzygSuEvMF9eKCAfDFj0YlGQAwI44OWrdyBgHMRrWoc151iCqta0Dh3EMpnOZIw5xOtah950Y212Y23mz+tah/lUjBUgh3hrzNy1NnMQOYi6Y5CtD8gkYAjRlbXZAnBlbTaESCARSP6neV+VwplSWDCvEM9ApCFZLpsG8Em7nI7xx37jGzeb2i8Tzz9LAAAAAElFTkSuQmCC" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABrUlEQVQ4y8WSPariUBTH/y9JI4gf4Ee8mCZMYQQFc2sRpkkaF+AC7HQHKbOKWcFbQrZgmDRKtDAIiUIEExWS2jPF4MOnwzBTvQMX7j2/e/6cL+CrTXx8cM5Nxtg7YyyK4zj4FybcL7qum0Rkz2YzTkS2ruvmM5tOpy/sI4Nms/k+n8/5er2GYRjMdV1NluVIluVvRGRPJhO+3+8xGAyY7/va8Xj88UlAluVosVhow+GQua6L0WjEfN/XAHw3DIPvdjtIkgTHcTwA1vF4DADg7bHOfr9vArDH4zEPggDlchl5nuNwOKBQKCCOYw+AtVwunXvM23NXe72eCcBWVZWnafq7TlHE+Xz2AFir1cp5/C89C9xuNwBAnucQRfHF/9cxdrtdE4DdarU4AAiC8HGKxSLLskyr1+vR6XQKXgQ6nY5JRLaiKPwedDgcvCzL4mq1ygRBQKlUYtfrVavValGSJMGnPSAiW1VVLkkSJElCGIYeEVlEZIVh6N39qqpyIrJfMqhUKlGSJFqj0WCbzcYjImu73TppmgZ/YpfLJXhpiKIoZrvd/qkoivk/7GvtF6UBz9lKF2MLAAAAAElFTkSuQmCC";
    var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
    var windows = wm.getEnumerator("navigator:browser");
    while (windows.hasMoreElements())
    {
        var btn = windows.getNext().QueryInterface(Ci.nsIDOMWindow).document.getElementById("useraddon-strictmode");
        if (btn) btn.setAttribute("image", btnIcon);
    }
}, true);
return toolbarbutton;
                }
            });
            this.widgetStrictMode = true;
        }

        //SpeedCloseTabs
        if (!this.widgetSpeedCloseTabs)
        {
            window.CustomizableUI.createWidget({
                type: "custom",
                defaultArea: window.CustomizableUI.AREA_NAVBAR,
                id: "useraddon-speedclosetabs",
                onBuild:function(aDocument)
                {
var toolbarbutton = aDocument.createElement("toolbarbutton");
toolbarbutton.setAttribute("id", "useraddon-speedclosetabs");
toolbarbutton.setAttribute("label", "SpeedCloseTabs");
toolbarbutton.setAttribute("tooltiptext", "SpeedCloseTabs");
toolbarbutton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
toolbarbutton.setAttribute("type", "button");
toolbarbutton.setAttribute("image", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABRUlEQVQ4y6WSsW7CMBCGPyP2EoSEhDp1aB+ANnM7ZEtWIiG28gSdeJiwRsqcbB26p32BLp2qShYRbXmBv4tJCQQWful0Z/vznX02ABKexET3SGLMEUmMNUMSEwkPoOuCgBsyRgAEEn1gDXy4vVdAH1zyBzJeiCWejcSEHhlDYARcOj8EnrgFYMkbv4AFvoBP59+JuxgyLo4dmj6n1CPrIOITyNpZu36I/xt4jVwTFxKBxNiteS4OJBaa1VzdyLNewewseu7Oa2P4PpLggDGAWti2+VbWCPRalvXEne9jgKqqGuBgMEDAPktZlhJo1wOqqqph7DFb37XWUuQ5oe9T5DlYC8Bmszm4VxvbsdYSRhHLJCGMIqxLsFqtGrZNsM8agZZJUld5nM8xQFEUjephGCKgjW17BdI0bYyn02nr3zBpmooz9Ac4xu8v9PtJ1gAAAABJRU5ErkJggg==");
toolbarbutton.addEventListener("click", function(event)
{
    var getBrowser = event.currentTarget.ownerDocument.defaultView.getBrowser;
    var cTab = getBrowser().mCurrentTab;
    switch(event.button)
    {
        case 0: var tabs = getBrowser().mTabContainer.childNodes; var left = false;
        for (var i = tabs.length-1; i >= 0; --i) {if (left) getBrowser().removeTab(tabs[i]); if (tabs[i] === cTab) left = true;} break;
        case 1: getBrowser().removeAllTabsBut(cTab); getBrowser().removeTab(cTab); break;
        case 2: event.preventDefault(); var tabs = getBrowser().mTabContainer.childNodes;
        for (var i = tabs.length-1; i >= 0; --i) {if (tabs[i] === cTab) break; getBrowser().removeTab(tabs[i]);} break;
    }
}, true);
return toolbarbutton;
                }
            });
            this.widgetSpeedCloseTabs = true;
        }

        //SearchDefault
        if (!this.widgetSearchDefault)
        {
            window.CustomizableUI.createWidget({
                type: "custom",
                defaultArea: window.CustomizableUI.AREA_NAVBAR,
                id: "useraddon-searchdefault",
                onBuild:function(aDocument)
                {
var searchEngines = Services.prefs.getCharPref("extensions.useraddon.searchengines").split('|');
if (!searchEngines.length) searchEngines.push("SearchDefault^https://invalid.invalid/^");
searchEngines = searchEngines[0].split('^');
if (searchEngines.length != 3) searchEngines = ["SearchDefault", "https://invalid.invalid/", ""];

var toolbarbutton = aDocument.createElement("toolbarbutton");
toolbarbutton.setAttribute("id", "useraddon-searchdefault");
toolbarbutton.setAttribute("label", "SearchDefault");
toolbarbutton.setAttribute("tooltiptext", searchEngines[0]);
toolbarbutton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
toolbarbutton.setAttribute("type", "button");
toolbarbutton.setAttribute("search1", searchEngines[1]);
toolbarbutton.setAttribute("search2", searchEngines[2]);
toolbarbutton.setAttribute("image", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAByklEQVQ4y62Sz2vTYBzGP2/fJMatiwENtmSDbTJFRNmpBz2Invxx0L9AZIfBHIoKOjwKjgk7FIQ5Bf8CbyJsJ0H0NESm6MkKW81s56Yuri4tTdJ4aNGFVFHcc3yf7/Ph5fl+4T8lfutc6hjEylwjbRxHUSz8usO6+5iV8m3u+qU/A8Z2DWH33iMl1IQXBGsU358lX3nWHnCl6yj9+54ghKTqzfPp4038+hJ6x0F227fQNJswdHn39hBTdUdJADLd4wghWf82S7FwhvuR3zS8l4y4j9izfw5dH8DK3oDihVQsPKLspDN9BIBlZ+xXuKXpYI3V8jgAhnkaIA5Q1SwAURRxp/qmbT9V73Vr1k4CwtBtVisEo5rdFqCqPa0yPycBU/UlarUCAFbmeiI8jMTKXAVgo/IUQCaGcopJ2jjG9s4cOdnFAW+eFw2Pi/oA3b0PMMwTRFGIs3CeOb8cX+Pl9GH69s4ipRF7bzRqpFL6z35KH0aZWJmO/2BzOAy/s7o8gab1IRUTIZRWga9wFs4x+fVh/BKb4Rmk3EEYbrBYOEm+8pxhBNq2fqQ08f3y5hOOA/KDJVQ1Gwv/pZpbqLgzBMEXFgun/iW8JfoBQP2lHV8/X40AAAAASUVORK5CYII=");
toolbarbutton.addEventListener("click", function(event)
{
    var query;
    if (event.ctrlKey)
    {
        query = getClipboard();
        if (query) query = query[0];
    }
    else
        query = getUrlBar(event);
    if (query)
    {
        query = this.getAttribute("search1") + query + this.getAttribute("search2");
        var getBrowser = event.currentTarget.ownerDocument.defaultView.getBrowser;
        switch(event.button)
        {
        case 0: getBrowser().loadURI(query); break;
        case 1: getBrowser().selectedTab = getBrowser().addTab(query); break;
        case 2: event.preventDefault(); getBrowser().addTab(query); break;
        }
        getBrowser().selectedBrowser.focus();
    }
}, true);
return toolbarbutton;
                }
            });
            this.widgetSearchDefault = true;
        }

        //SearchEngines
        if (!this.widgetSearchEngines)
        {
            window.CustomizableUI.createWidget({
                type: "custom",
                defaultArea: window.CustomizableUI.AREA_NAVBAR,
                id: "useraddon-searchengines",
                onBuild:function(aDocument)
                {
var toolbarbutton = aDocument.createElement("toolbarbutton");
toolbarbutton.setAttribute("id", "useraddon-searchengines");
toolbarbutton.setAttribute("label", "SearchEngines");
toolbarbutton.setAttribute("tooltiptext", "SearchEngines");
toolbarbutton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
toolbarbutton.setAttribute("type", "button");
toolbarbutton.setAttribute("image", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAbElEQVQ4y+2SsQ3AIAwEnyjbsAAD0HgaRkgY4efwHEgswDxOHSGgoOXLk/2S5UMpxbCRC5s5BcA94M9kJy8LUkpva63j3nuQzMsTSDoR+TERAUnXDc9EUlWLMZqqjmVbmVhrta0vhBDcMXGeD93UIvPro++EAAAAAElFTkSuQmCC");
var menuPopup = toolbarbutton.appendChild(window.document.createElement("menupopup"));

var searchEngines = Services.prefs.getCharPref("extensions.useraddon.searchengines").split('|');
for (var i = 1; i < searchEngines.length; ++i)
    if (searchEngines[i] === "?")
        menuPopup.appendChild(window.document.createElement("menuseparator"));
    else
    {
        var tmp = searchEngines[i].split('^');
        if (tmp.length === 3)
        {
            var mItem = menuPopup.appendChild(window.document.createElement("menuitem"));
            mItem.setAttribute("label", tmp[0]);
            mItem.setAttribute("class", "menuitem-iconic");
            mItem.setAttribute("search1", tmp[1]);
            mItem.setAttribute("search2", tmp[2]);
            mItem.addEventListener("click", function(event)
            {
                var query;
                if (event.ctrlKey)
                {
                    query = getClipboard();
                    if (query) query = query[0];
                }
                else
                    query = getUrlBar(event);
                if (query)
                {
                    query = this.getAttribute("search1") + query + this.getAttribute("search2");
                    var getBrowser = event.currentTarget.ownerDocument.defaultView.getBrowser;
                    switch(event.button)
                    {
                    case 0: getBrowser().loadURI(query); break;
                    case 1: getBrowser().selectedTab = getBrowser().addTab(query); break;
                    case 2: event.preventDefault(); getBrowser().addTab(query); break;
                    }
                    getBrowser().selectedBrowser.focus();
                }
            });
        }
    }
toolbarbutton.addEventListener("command", function(event) {menuPopup.showPopup(this, -1, -1, "popup", "bottomleft", "topleft");}, true);
return toolbarbutton;
                }
            });
            this.widgetSearchEngines = true;
        }

        //OpenUrlFromClipboard
        if (!this.widgetOpenUrlFromClipboard)
        {
            window.CustomizableUI.createWidget({
                type: "custom",
                defaultArea: window.CustomizableUI.AREA_NAVBAR,
                id: "useraddon-openurlfromclipboard",
                onBuild: function(aDocument)
                {
var toolbarbutton = aDocument.createElement("toolbarbutton");
toolbarbutton.setAttribute("id", "useraddon-openurlfromclipboard");
toolbarbutton.setAttribute("label", "OpenUrlFromClipboard");
toolbarbutton.setAttribute("tooltiptext", "OpenUrlFromClipboard");
toolbarbutton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
toolbarbutton.setAttribute("type", "button");
toolbarbutton.setAttribute("image", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAyUlEQVQ4y6WT0Q3DMAhEn6NudJkJZgozmZncj5bIVVMlVZAsCxsOOABuSrtq2Ps2MiEzAYiIdgqwbdsoB0m4ezOzAUICd2/tl4OZiEgkA5KIQNL7wLp6A3i8jG0USEQ0SSOiXhIJMrMV+BcHBTCnK+mUF3dvSymSYWZkZgNhsg/Dd6Bdr2BLRczcc0aCmPSpvJ2rQ8b/kSp7uTtIlwAOyN/lcdVw/psb9JXBur6Ga77rlD6DLWfOvY/R+xjz++EyzdN4RWo37jaBJ7axkj4n4RK6AAAAAElFTkSuQmCC");
toolbarbutton.addEventListener("click", function(event)
{
    var arrUrl = getClipboard();
    if (arrUrl)
    {
        var getBrowser = event.currentTarget.ownerDocument.defaultView.getBrowser;
        switch(event.button)
        {
        case 0:
        {
            if (event.ctrlKey)
            {
                var uri = ">";
                for (var i = 0; i < arrUrl.length; ++i) uri += "<a href=\"" + arrUrl[i] + "\">" + arrUrl[i] + "</a><br /><a href=\"https://direct.invalid/" + arrUrl[i] + "\">&lt;Direct&gt;</a><br />";
                getBrowser().loadURI("data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPlRleHRMaW5rczwvdGl0bGU+PC9oZWFkPjxib2R5" + Services.wm.getMostRecentWindow("navigator:browser").btoa(uri + "</body></html>"));
            }
            else
            {
                getBrowser().loadURI(arrUrl[0]);
                for (var i = 1; i < arrUrl.length; ++i) getBrowser().addTab(arrUrl[i]);
            }
            break;
        }
        case 1:
        {
            if (event.ctrlKey)
            {
                var uri = ">";
                for (var i = 0; i < arrUrl.length; ++i) uri += "<a href=\"" + arrUrl[i] + "\">" + arrUrl[i] + "</a><br /><a href=\"https://direct.invalid/" + arrUrl[i] + "\">&lt;Direct&gt;</a><br />";
                getBrowser().selectedTab = getBrowser().addTab("data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPlRleHRMaW5rczwvdGl0bGU+PC9oZWFkPjxib2R5" + Services.wm.getMostRecentWindow("navigator:browser").btoa(uri + "</body></html>"));
            }
            else
            {
                for (var i = 0; i < arrUrl.length; ++i) getBrowser().selectedTab = getBrowser().addTab(arrUrl[i]);
            }
            break;
        }
        case 2:
        {
            event.preventDefault();
            if (event.ctrlKey)
            {
                var uri = ">";
                for (var i = 0; i < arrUrl.length; ++i) uri += "<a href=\"" + arrUrl[i] + "\">" + arrUrl[i] + "</a><br /><a href=\"https://direct.invalid/" + arrUrl[i] + "\">&lt;Direct&gt;</a><br />";
                getBrowser().addTab("data:text/html;base64,PGh0bWw+PGhlYWQ+PHRpdGxlPlRleHRMaW5rczwvdGl0bGU+PC9oZWFkPjxib2R5" + Services.wm.getMostRecentWindow("navigator:browser").btoa(uri + "</body></html>"));
            }
            else
            {
                for (var i = 0; i < arrUrl.length; ++i) getBrowser().addTab(arrUrl[i]);
            }
            break;
        }
        }
    }
}, true);
return toolbarbutton;
                }
            });
            this.widgetOpenUrlFromClipboard = true;
        }

        //
        var document = window.document;
        var getBrowser = document.defaultView.getBrowser;

        //StopAllTabs
        if (!document.getElementById("useraddon-stopalltabs"))
        {
            var tabContext = getBrowser().tabContainer.contextMenu;
            var menuItem = document.createElement("menuitem");
            menuItem.setAttribute("id", "useraddon-stopalltabs");
            menuItem.setAttribute("label", "Stop All Tabs");
            menuItem.setAttribute("oncommand", "for(var i=0,len=getBrowser().tabs.length;i<len;++i)getBrowser().getBrowserAtIndex(i).stop();");
            menuItem.setAttribute("image", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB8UlEQVQ4y+2ST0tUYRSHn3PfO5ZedZwUdUJzdCU6jEEa0aoP0F7azCxahEXbaNGnCNI2EcxK+gBtpz8uVMgRFSIkSaNFqaOG3jv3jvc9LUYxLfsEHXg58B6ehwPnB/9LAKanp28DT1W1H0BVOeprqvoKGD8zWwMe5vP51+7R5+TIyGBvMtmKSN0rApXK3sDCwsrj0dEcqVQbUh9SqewOzM+XJ4HMsaC3ra2V9fXvGGNwHAdjDOl0OxdtTGpjnZ3yEqIxYpX2m9ex1vYBHAsQcU7BxjjI/j6jO5skJKQ74aC1GvH+AQcvizSlezkjkFNwIgiIZ96S6unC62yBza9gQ7Q7ies65BbLrBbuDP+xgTEOjmPwVpZoTHp4HR7O6gf4uQd+gFZDGvuzdPRdZmdx+YVbLBZLY2NXERF6ejrrpxEhimu4LR5sfTuBfR/8AOfTMolMjsBNZF1VvTU3t/D76QC4sV2hub0ZqtVTsB74YA0c1qjFsecWCgX5W0A2njxa1jDM2oZmpBqcwL6P7cpgw4im7a0V57yE2TB6v7v4kci6xFeGseYC2tBInBkkTPezNTOLDcN3cp5AQb5M3H0mRiYuXctiXBetHRIHAT9KM0Tbm1NDpfkH8q+cK8jn/PiUjcJ7GkXYKELr7/nQm9n7AvoLSWP5Vhg/qiAAAAAASUVORK5CYII=");
            tabContext.insertBefore(menuItem, tabContext.lastChild.nextSibling);
        }

        //CopyURLAllTabs
        if (!document.getElementById("useraddon-copyurlalltabs"))
        {
            var tabContext = getBrowser().tabContainer.contextMenu;
            var menuItem = document.createElement("menuitem");
            menuItem.setAttribute("id", "useraddon-copyurlalltabs");
            menuItem.setAttribute("label", "Copy URL All Tabs");
            menuItem.setAttribute("oncommand", "var arrUrl='';for(var i=0,len=getBrowser().tabs.length;i<len;++i)arrUrl+=decodeURI(getBrowser().getBrowserAtIndex(i).currentURI.spec)+'\\n';Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper).copyString(arrUrl);");
            menuItem.setAttribute("image", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAApUlEQVQ4y7WSsRECIRBF/zFUQAmElMBoB/RhA2eusWc3dKBSAAEBwYaGG5OdOXPinehP//Bm9y1AZwYAsNbelFK7ukwpjUR0bQEEACw9zjmfjTGT1npsAeS7Iud8AgBjzIWIpuYES9FaH0spzxjj4aMD59xcF977YY0b0aKvcSO3nq12sxlQryt6P5IAAGa+fwuQABBC2HdN0L3C3wAtN8z8wC/yAhseRAqy6A88AAAAAElFTkSuQmCC");
            tabContext.insertBefore(menuItem, tabContext.lastChild.nextSibling);
        }

        //Set max available size
        var windowTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        windowTimer.initWithCallback(function timerShot()
        {
            windowTimer.cancel();
            getBrowser().maxWidth = Services.prefs.getIntPref("extensions.useraddon.window.maxAvailInnerWidth");
            getBrowser().maxHeight = Services.prefs.getIntPref("extensions.useraddon.window.maxAvailInnerHeight");
            getBrowser().parentElement.style.backgroundColor = "#101010";
            var btn = Services.wm.getMostRecentWindow("navigator:browser").document.getElementById("useraddonsizeround_addon-browser-action");
            if (btn) {try {btn.click();} catch(e){}}
        }, 1200, Ci.nsITimer.TYPE_ONE_SHOT);
    },
    tearDownUI: function(window)
    {
        var custUi = window.CustomizableUI;
        custUi.destroyWidget("useraddon-tools");
        custUi.destroyWidget("useraddon-external");
        custUi.destroyWidget("useraddon-medialinks");
        custUi.destroyWidget("useraddon-strictmode");
        custUi.destroyWidget("useraddon-speedclosetabs");
        custUi.destroyWidget("useraddon-searchdefault");
        custUi.destroyWidget("useraddon-searchengines");
        custUi.destroyWidget("useraddon-openurlfromclipboard");

        var getBrowser = window.document.defaultView.getBrowser;
        var tabContext = getBrowser().tabContainer.contextMenu;
        var elem = window.document.getElementById("useraddon-stopalltabs"); if (elem) tabContext.removeChild(elem);
        elem = window.document.getElementById("useraddon-copyurlalltabs"); if (elem) tabContext.removeChild(elem);
    }
}

//-------------------------------------------------------------------------------------------------
var WindowListener =
{
    setupBrowserUI: function(window, closebar) {try {UIBuilder.setupUI(window);} catch(e){}},
    tearDownBrowserUI: function(window) {UIBuilder.tearDownUI(window);},
    onOpenWindow: function(xulWindow)
    {
        var domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
        domWindow.addEventListener("load", function listener()
        {
            domWindow.removeEventListener("load", listener, false);
            if (domWindow.document.documentElement.getAttribute("windowtype") === "navigator:browser") WindowListener.setupBrowserUI(domWindow);
        }, false);
    },
    onCloseWindow: function(xulWindow) {},
    onWindowTitleChange: function(xulWindow, newTitle)
    {
        var content = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow).document.getElementById("content");
        if (content) content.ownerDocument.title = "";
    }
};

//-------------------------------------------------------------------------------------------------
function subfolderBookmark(rootId)
{
    var bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
    for (var it = 0; ; ++it)
    {
        var id = bmsvc.getIdForItemAt(rootId, it);
        if (id >= 0)
        {
            var type = bmsvc.getItemType(id);
            if (type === bmsvc.TYPE_FOLDER)
            {
                bmsvc.setItemDateAdded(id, 0);
                bmsvc.setItemLastModified(id, 0);
                subfolderBookmark(id);
            }
            else if (type === bmsvc.TYPE_BOOKMARK)
            {
                bmsvc.setItemDateAdded(id, 0);
                bmsvc.setItemLastModified(id, 0);
            }
        }
        else
            break;
    }
}

//-------------------------------------------------------------------------------------------------
var BootstrapAddon =
{
    install: function(data, reason) {},
    uninstall: function(data, reason) {},
    startup: function(data, reason)
    {
        osDelim = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS === "WINNT" ? '\\' : '//';
        const dirService = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
        const profilePath = dirService.get("ProfD", Ci.nsIFile).path;
        var processPath = dirService.get("CurProcD", Ci.nsIFile).path; processPath = processPath.substr(0, processPath.length-8);

        //cfg
        Services.prefs.setBoolPref("extensions.useraddon@addon.getAddons.cache.enabled", false);
        Services.prefs.setBoolPref("extensions.useraddonpolicy@addon.getAddons.cache.enabled", false);
        Services.prefs.setBoolPref("extensions.useraddon@addon.update.enabled", false);
        Services.prefs.setBoolPref("extensions.useraddonpolicy@addon.update.enabled", false);
        Services.prefs.setCharPref("extensions.useraddon@addon.update.url", "https://0.0.0.0/");
        Services.prefs.setCharPref("extensions.useraddonpolicy@addon.update.url", "https://0.0.0.0/");
        Services.prefs.setBoolPref("extensions.useraddon.block.nonstandard_ports", true);
        Services.prefs.setBoolPref("extensions.useraddon.block.private_network", true);
        Services.prefs.setBoolPref("extensions.useraddon.block.unwanted_requests", true);
        Services.prefs.setBoolPref("extensions.useraddon.cookies.fullmode.4pda.ru", false);
        Services.prefs.setBoolPref("extensions.useraddon.cookies.fullmode.forum.ru-board.com", false);
        Services.prefs.setBoolPref("extensions.useraddon.cookies.fullmode.rutracker.org", false);
        try {cookiesPath = Services.prefs.getCharPref("extensions.useraddon.cookies.path");} catch (e) {cookiesPath = profilePath + osDelim + '!' + osDelim + "cookies" + osDelim;}
        try {Services.prefs.getCharPref("extensions.useraddon.external");} catch (e) {Services.prefs.setCharPref("extensions.useraddon.external", "");}
        Services.prefs.setBoolPref("extensions.useraddon.force_https", true);
        Services.prefs.setBoolPref("extensions.useraddon.prompt.redirect", false);
        Services.prefs.setBoolPref("extensions.useraddon.prompt.subdocument", true);
        try {Services.prefs.getBoolPref("extensions.useraddon.media.enabled");} catch (e) {Services.prefs.setBoolPref("extensions.useraddon.media.enabled", true);}
        try {Services.prefs.getCharPref("extensions.useraddon.proxyfilter.additional");} catch (e) {Services.prefs.setCharPref("extensions.useraddon.proxyfilter.additional", "");}
        try {Services.prefs.getBoolPref("extensions.useraddon.proxyfilter.direct_enabled");} catch (e) {Services.prefs.setBoolPref("extensions.useraddon.proxyfilter.direct_enabled", false);}
        try {Services.prefs.getCharPref("extensions.useraddon.searchengines");} catch (e) {Services.prefs.setCharPref("extensions.useraddon.searchengines", "");}
        try {Services.prefs.getIntPref("extensions.useraddon.window.maxAvailInnerWidth");} catch (e) {Services.prefs.setIntPref("extensions.useraddon.window.maxAvailInnerWidth", 1000);}
        try {Services.prefs.getIntPref("extensions.useraddon.window.maxAvailInnerHeight");} catch (e) {Services.prefs.setIntPref("extensions.useraddon.window.maxAvailInnerHeight", 600);}
        try {Services.prefs.getIntPref("extensions.useraddon.window.roundtime");} catch (e) {Services.prefs.setIntPref("extensions.useraddon.window.roundtime", 20000);}

        //cdn path
        try
        {
            cdnPath = Services.prefs.getCharPref("extensions.useraddon.cdn.path");
            if (cdnPath === "-") cdnPath = null;
        }
        catch (e)
        {
            var del = processPath.lastIndexOf(osDelim);
            cdnPath = processPath.substr(0, del+1) + "CDN" + osDelim;
        }

        //download path
        var downloadDir = null;
        try {downloadDir = Services.prefs.getCharPref("browser.download.dir");} catch (e) {}
        if (!downloadDir)
        {
            var del = processPath.lastIndexOf(osDelim);
            if (del >= 0) Services.prefs.setCharPref("browser.download.dir", processPath.substr(0, del+1) + "Downloads");
        }

        //external path
        procFile.initWithPath(processPath + osDelim + "!EXT" + osDelim + "Ext.exe");

        //homepage+newtabpage
        var homeNewTabPage = "file:///" + encodeURIComponent(profilePath).split('%3A').join(':').split('%5C').join('/') + "/!/web/home.html";
        Cc['@mozilla.org/browser/aboutnewtab-service;1'].getService(Ci.nsIAboutNewTabService).newTabURL = homeNewTabPage;
        Services.prefs.setCharPref("browser.startup.homepage", homeNewTabPage);

        //proxy filter
        proxyService.registerFilter(proxyFilter, 1000);

        //do not disturb
        try {Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService).QueryInterface(Ci.nsIAlertsDoNotDisturb).manualDoNotDisturb = true;} catch (e) {}

        //main
        var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        var windows = wm.getEnumerator("navigator:browser");
        while (windows.hasMoreElements())
            WindowListener.setupBrowserUI(windows.getNext().QueryInterface(Ci.nsIDOMWindow), false);
        wm.addListener(WindowListener);

        //observers
        Services.obs.addObserver(httpRequestObserver, "http-on-modify-request", false);
        Services.obs.addObserver(httpRequestObserver, "http-on-examine-response", false);
        Services.obs.addObserver(httpRequestObserver, "http-on-examine-cached-response", false);
        Services.obs.addObserver(httpRequestObserver, "private-cookie-changed", false);
        //Services.obs.addObserver(httpRequestObserver, "http-on-examine-merged-response", false);
        //Services.obs.addObserver(httpRequestObserver, "cookie-changed", false);

        //timer
        var it = 0;
        roundTimer.initWithCallback(function timerShot()
        {
            if (++it < 40)
            {
                var btn = Services.wm.getMostRecentWindow("navigator:browser").document.getElementById("useraddonsizeround_addon-browser-action");
                if (btn) {try {btn.click();} catch(e){}}
            }
            else
            {
                roundTimer.cancel();

                //round timer
                roundTimer.initWithCallback(function timerShot()
                {
                    var btn = Services.wm.getMostRecentWindow("navigator:browser").document.getElementById("useraddonsizeround_addon-browser-action");
                    if (btn) {try {btn.click();} catch(e){}}
                }, Services.prefs.getIntPref("extensions.useraddon.window.roundtime"), Ci.nsITimer.TYPE_REPEATING_SLACK);

                //default search engine
                var engine = Services.search.getEngineByName("DefaultEngine");
                if (!engine)
                {
                    Services.search.addEngineWithDetails("DefaultEngine", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAw0lEQVR4AY2RwQqCQBCG9yT0KuqzpgeFfiJv9QBWJ+sJ6ijZU9hhgzJcpllmxSWk2o9hf8cPHVc1LISYo8GTuXAKoQTZAmQwIA+DBWaDEKACTXBEIEJuLytqyXBVvpJZIUJvb2vaU8GlfaVHpJDY2NLONbecMZIoNDYYKlxrydkTGoXu6xM6J/AMrKy4NJ18QcsrmAPdyHCd6UHlKNRuSJ/SV1KFGP2UspHPjN1BfbKWPf/zqH/+LCFCiiteuKPmFA/9NwcHZ1DIAAtUAAAAAElFTkSuQmCC", null, null, "GET", "https://0.0.0.0/");
                    engine = Services.search.getEngineByName("DefaultEngine");
                }
                if (engine)
                {
                    Services.search.moveEngine(engine, 0);
                    Services.search.currentEngine = engine;
                    var defaultEngines = Services.search.getDefaultEngines();
                    for (var i of defaultEngines)
                        Services.search.removeEngine(i);
                }
    
                //remove unwanted bookmarks
                var bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
    
                var bookmarkId = bmsvc.getIdForItemAt(bmsvc.toolbarFolder, 0);
                if (bookmarkId >= 0 && bmsvc.getItemType(bookmarkId) === bmsvc.TYPE_BOOKMARK && bmsvc.getItemTitle(bookmarkId) === "Most Visited") bmsvc.removeItem(bookmarkId);
    
                bookmarkId = bmsvc.getIdForItemAt(bmsvc.toolbarFolder, 0);
                if (bookmarkId >= 0 && bmsvc.getItemType(bookmarkId) === bmsvc.TYPE_BOOKMARK && bmsvc.getItemTitle(bookmarkId) === "H") bmsvc.changeBookmarkURI(bookmarkId, Services.io.newURI(homeNewTabPage, null, null));
    
                bookmarkId = bmsvc.getIdForItemAt(bmsvc.bookmarksMenuFolder, 0);
                if (bookmarkId >= 0 && bmsvc.getItemType(bookmarkId) === bmsvc.TYPE_BOOKMARK && bmsvc.getItemTitle(bookmarkId) === "Recently Bookmarked") bmsvc.removeItem(bookmarkId);
    
                bookmarkId = bmsvc.getIdForItemAt(bmsvc.bookmarksMenuFolder, 0);
                if (bookmarkId >= 0 && bmsvc.getItemType(bookmarkId) === bmsvc.TYPE_BOOKMARK && bmsvc.getItemTitle(bookmarkId) === "Recent Tags") bmsvc.removeItem(bookmarkId);
    
                bookmarkId = bmsvc.getIdForItemAt(bmsvc.bookmarksMenuFolder, 0);
                if (bmsvc.getItemType(bookmarkId) === bmsvc.TYPE_SEPARATOR) bmsvc.removeItem(bookmarkId);

                subfolderBookmark(bmsvc.placesRoot);
            }
        }, 1500, Ci.nsITimer.TYPE_REPEATING_SLACK);
    },
    shutdown: function(data, reason)
    {
        //round timer
        roundTimer.cancel();

        //proxy filter
        proxyService.unregisterFilter(proxyFilter);

        //newtabpage
        Cc['@mozilla.org/browser/aboutnewtab-service;1'].getService(Ci.nsIAboutNewTabService).resetNewTabURL();

        //main
        var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        var windows = wm.getEnumerator("navigator:browser");
        while (windows.hasMoreElements())
            WindowListener.tearDownBrowserUI(windows.getNext().QueryInterface(Ci.nsIDOMWindow));
        wm.removeListener(WindowListener);

        //observers
        Services.obs.removeObserver(httpRequestObserver, "http-on-modify-request");
        Services.obs.removeObserver(httpRequestObserver, "http-on-examine-response");
        Services.obs.removeObserver(httpRequestObserver, "http-on-examine-cached-response");
        Services.obs.removeObserver(httpRequestObserver, "private-cookie-changed");
        //Services.obs.removeObserver(httpRequestObserver, "http-on-examine-merged-response");
        //Services.obs.removeObserver(httpRequestObserver, "cookie-changed");

        //bookmarks
        subfolderBookmark(Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService).placesRoot);

        Services.prefs.setIntPref("app.update.lastUpdateTime.addon-background-update-timer", 0);
        Services.prefs.setIntPref("app.update.lastUpdateTime.background-update-timer", 0);
        Services.prefs.setIntPref("app.update.lastUpdateTime.blocklist-background-update-timer", 0);
        Services.prefs.setIntPref("app.update.lastUpdateTime.browser-cleanup-thumbnails", 0);
        Services.prefs.setIntPref("app.update.lastUpdateTime.experiments-update-timer", 0);
        Services.prefs.setIntPref("app.update.lastUpdateTime.search-engine-update-timer", 0);
        Services.prefs.setIntPref("app.update.lastUpdateTime.xpi-signature-verification", 0);
        Services.prefs.setIntPref("idle.lastDailyNotification", 0);
        Services.prefs.setIntPref("media.gmp-manager.lastCheck", 0);
        Services.prefs.setIntPref("places.database.lastMaintenance", 0);
        Services.prefs.setIntPref("storage.vacuum.last.places.sqlite", 0);
        Services.prefs.setIntPref("toolkit.startup.last_success", 0);
    }
}

//-------------------------------------------------------------------------------------------------
function install(data,reason){try{BootstrapAddon.install(data,reason);}catch(e){}}
function uninstall(data,reason){try{BootstrapAddon.uninstall(data,reason);}catch(e){}}
function startup(data,reason){try{BootstrapAddon.startup(data,reason);}catch(e){}}
function shutdown(data,reason){try{BootstrapAddon.shutdown(data,reason);}catch(e){}}
