let {Services}=Components.utils.import("resource://gre/modules/Services.jsm",{});
function install(data,reason){}
function uninstall(data,reason){}
function startup(data,reason)
{
Services.prefs.setBoolPref("extensions.useraddonsizeround@addon.getAddons.cache.enabled",false);
Services.prefs.setBoolPref("extensions.useraddonsizeround@addon.update.enabled",false);
Services.prefs.setCharPref("extensions.useraddonsizeround@addon.update.url","https://0.0.0.0/");
data.webExtension.startup().then(({browser})=>{return new Promise((resolve,reject)=>{browser.runtime.onConnect.addListener(resolve);});});
}
function shutdown(data,reason){}
