var {components,Cu,Cc,Ci}=require("chrome");
var unload=require("sdk/system/unload");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
let policy =
{
    classDescription: "UserAddonPolicy",
    classID: components.ID("{C79B1DD3-63EA-3E73-4D11-0486053C20DE}"),
    contractID: "@addon/useraddonpolicy;1",
    xpcom_categories: ["content-policy"],
    init: function()
    {
        let registrar = components.manager.QueryInterface(Ci.nsIComponentRegistrar);
        registrar.registerFactory(this.classID, this.classDescription, this.contractID, this);
        let catMan = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);
        for (let category of this.xpcom_categories) catMan.addCategoryEntry(category, this.contractID, this.contractID, false, true);
        unload.when((function(){
        for (let category of this.xpcom_categories) catMan.deleteCategoryEntry(category, this.contractID, false);
        Services.tm.currentThread.dispatch(function(){registrar.unregisterFactory(this.classID, this);}.bind(this), Ci.nsIEventTarget.DISPATCH_NORMAL);}).bind(this));
    },
    shouldLoad: function(aContentType, aContentLocation, aRequestOrigin, aContext, aMimeTypeGuess, aExtra)
    {
        switch (aContentType)
        {
        case 7://SUBDOCUMENT
        try
        {
            if (aContext && (aContentLocation.schemeIs("https") || aContentLocation.schemeIs("http")))
            {
                var contentDocument = aContext.contentDocument;
                if (contentDocument && contentDocument.documentURI === "about:blank")
                {
                    if (contentDocument.body.title === "#FRAME-LOAD#" ||
                        (aContentLocation.host === "cdn.embedly.com" && aContentLocation.path.startsWith("/widgets/media.html?src=http")) ||
                        (aContentLocation.host === "content.googleapis.com" && aRequestOrigin.host === "drive.google.com") ||
                        (aContentLocation.host === "d.livescore.in" && aRequestOrigin.host === "www.livescore.in") ||
                        (aContentLocation.host === "d.myscore.com.ua" && aRequestOrigin.host === "www.myscore.com.ua") ||
                        (aContentLocation.host === "ok.ru" && aRequestOrigin.host === "ok.ru") ||
                        (aContentLocation.host === "vk.com" && aRequestOrigin.host === "vk.com" && aContentLocation.path.startsWith("/al_")) ||
                        (aContentLocation.host === "www.google.com" && aContentLocation.path.startsWith("/recaptcha/api2/bframe?")) ||
                        (aContentLocation.host === "www.work.ua" && aRequestOrigin.host === "www.work.ua") ||
                        (aRequestOrigin.host === "cloud.mail.ru" && (aContentLocation.host.endsWith(".cldmail.ru") || aContentLocation.host.endsWith(".files.attachmail.ru"))) ||
                        (aRequestOrigin.host === "privat24.privatbank.ua" && aContentLocation.spec.startsWith("https://my-payments-p24.privatbank.ua/mypayments/")) ||
                        (aRequestOrigin.host === "yadi.sk" && aContentLocation.host === "downloader.disk.yandex.ru") ||
                        !Services.prefs.getBoolPref("extensions.useraddon.prompt.subdocument"))
                        return Ci.nsIContentPolicy.ACCEPT;

                        if ((aContentLocation.host === "www.youtube.com" || aContentLocation.host === "www.youtube-nocookie.com") && aContentLocation.path.startsWith("/embed/"))
                        {
                            var videoId = aContentLocation.path.substr(7);
                            var delim = videoId.indexOf('?');
                            if (delim >= 0)
                                videoId = videoId.substr(0, delim);
                            contentDocument.body.innerHTML = "<a href=\"https://www.youtube.com/embed/" + videoId +
                            "\" style=\"background-color:#ffd606\">https://www.youtube.com/embed/" + videoId +
                            "</a><br /><br /><a href=\"https://www.youtube.com/watch?v=" + videoId +
                            "\" style=\"background-color:#ffd606\">https://www.youtube.com/watch?v=" + videoId + "</a>";
                        }
                        else
                            contentDocument.body.innerHTML = "<a href=\"" + aContentLocation.spec + "\" style=\"background-color:#ffd606\">" + aContentLocation.spec + "</a>";
                        aContext.setAttribute("style", (aContentLocation.host === "www.instagram.com" || aContentLocation.host === "streamable.com") ?
                        "border:dotted;background-color:#c5c5c5;height:50px;" : "border:dotted;background-color:#c5c5c5;");
                        contentDocument.body.title = "#FRAME-LOAD#";
                }
            }
        } catch(e) {}
        return Ci.nsIContentPolicy.REJECT_REQUEST;
        case 15://MEDIA
        if (Services.prefs.getBoolPref("extensions.useraddon.media.enabled"))
        return Ci.nsIContentPolicy.ACCEPT;
        break;
        case 16://WEBSOCKET
        if ((aRequestOrigin.host === "www.privat24.ua" && aContentLocation.spec === "wss://www.privat24.ua/ws/sr") ||
            (aRequestOrigin.host === "streamable.com" && aContentLocation.spec === "wss://chat.streamable.com/"))
        return Ci.nsIContentPolicy.ACCEPT;
        break;
        //case  1://OTHER
          case  2://SCRIPT
          case  3://IMAGE
          case  4://STYLESHEET
        //case  5://OBJECT
          case  6://DOCUMENT
        //case  8://REFRESH
          case  9://XBL
        //case 10://PING
          case 11://XMLHTTPREQUEST
        //case 12://OBJECT_SUBREQUEST
          case 13://DTD
        //case 14://FONT
        //case 17://CSP_REPORT
        //case 18://XSLT
        //case 19://BEACON
          case 20://FETCH
          case 21://IMAGESET
        //case 22://WEB_MANIFEST
        return Ci.nsIContentPolicy.ACCEPT;
        }
        if (Services.prefs.getBoolPref("extensions.useraddon.block.unwanted_requests"))
        {
            console.log("@Block policy: " + aContentType + "|" + aContentLocation.spec + "|" + aRequestOrigin.spec);
            return Ci.nsIContentPolicy.REJECT_REQUEST;
        }
        return Ci.nsIContentPolicy.ACCEPT;
    },
    shouldProcess: function(contentType, contentLocation, requestOrigin, node, mimeTypeGuess, extra) {return Ci.nsIContentPolicy.ACCEPT;},
    createInstance: function(outer, iid) {if (outer) throw Cr.NS_ERROR_NO_AGGREGATION; return this.QueryInterface(iid);},
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIContentPolicy, Ci.nsIFactory])
};
const {process}=require("sdk/remote/child");
process.port.on("init",()=>{policy.init();});