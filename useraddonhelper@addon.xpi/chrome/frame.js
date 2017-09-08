useraddonhelper={load:function(){addEventListener("mousedown",this.mDown,true);addEventListener("contextmenu",this.mClick,true);},
mDown:function(event){if(useraddonhelper.valid=(event.button==2))
{useraddonhelper.startX=event.screenX;useraddonhelper.startY=event.screenY;
var elem=event.target;while(elem.parentNode)elem=elem.parentNode;useraddonhelper.doc=elem;}},
mClick:function(event){if(useraddonhelper.valid)
{var x=event.screenX-useraddonhelper.startX;var y=useraddonhelper.startY-event.screenY;var X=x>=0?x:-x;var Y=y>=0?y:-y;
if(X+Y>60){
var res=x>0?((Y*2<X)?'2':(y>0?((X*2<Y)?'0':'1'):((X*2<Y)?'4':'3'))):((Y*2<X)?'6':(y>0?((X*2<Y)?'0':'7'):((X*2<Y)?'4':'5')));
switch(res){
case '0':useraddonhelper.doc.defaultView.scroll(0,0);break;
case '1':var doc=useraddonhelper.doc;var win=doc.defaultView;var links=[];
for(var i=0,j=doc.links.length;i<j;++i)if(win.getSelection().containsNode(doc.links[i],true))links.push(doc.links[i].href);
sendAsyncMessage("useraddonhelper@addon",{what:res,h:links,c:false});break;
case '4':useraddonhelper.doc.defaultView.scroll(0,1E9);break;
case '7':var doc=useraddonhelper.doc;var win=doc.defaultView;var text="";
for(link of doc.links)if(win.getSelection().containsNode(link,true))text+=link.href+'\n';
Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper).copyString(text);
default:sendAsyncMessage("useraddonhelper@addon",{what:res,h:null,c:false});break;}
event.preventDefault();}}}};useraddonhelper.load();