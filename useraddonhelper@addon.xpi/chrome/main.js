useraddonhelper={
init:function(){messageManager.loadFrameScript("chrome://useraddonhelper/content/frame.js",true);messageManager.addMessageListener("useraddonhelper@addon",this.doIt);},
doIt:function(message){
switch(message.data.what){
case '6':gBrowser.mTabContainer.advanceSelectedTab(-1,true);break;
case '2':gBrowser.mTabContainer.advanceSelectedTab(1,true);break;
case '3':gBrowser.removeCurrentTab();break;
case '5':gBrowser.selectedTab=gBrowser.addTab(Services.prefs.getCharPref("browser.startup.homepage"));break;
case '1':for(tab of message.data.h)gBrowser.addTab(tab);break;}}};
Services.prefs.setBoolPref("extensions.useraddonhelper@addon.getAddons.cache.enabled",false);
Services.prefs.setBoolPref("extensions.useraddonhelper@addon.update.enabled",false);
Services.prefs.setCharPref("extensions.useraddonhelper@addon.update.url","https://0.0.0.0/");
useraddonhelper.init();