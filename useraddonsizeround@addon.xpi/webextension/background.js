function func()
{
  Promise.all([browser.windows.getAll()]).then(([all]) =>
  {
    all.forEach(win =>
    {
      browser.tabs.query({windowId: win.id}).then(tabs =>
      {
        var tabWidth = tabs[0].width;
        var tabHeight = tabs[0].height;
        if (tabWidth % 200 || tabHeight % 100)
        {
          let newTabWidth = Math.floor(tabWidth/200)*200; if (newTabWidth < 1000) newTabWidth = 1000;
          let newTabHeight = Math.floor(tabHeight/100)*100; if (newTabHeight < 600) newTabHeight = 600;
          browser.windows.update(win.id, {width: newTabWidth+(win.width-tabWidth), height: newTabHeight+(win.height-tabHeight)});
        }
      });
    });
  });
}

browser.browserAction.onClicked.addListener(() =>
{
  Promise.all([browser.windows.getAll()]).then(([all]) =>
  {
    all.forEach(win =>
    {
      browser.tabs.query({windowId: win.id}).then(tabs =>
      {
        var tabWidth = tabs[0].width;
        var tabHeight = tabs[0].height;
        if (tabWidth % 200 || tabHeight % 100)
        {
          let newTabWidth = Math.floor(tabWidth/200)*200; if (newTabWidth < 1000) newTabWidth = 1000;
          let newTabHeight = Math.floor(tabHeight/100)*100; if (newTabHeight < 600) newTabHeight = 600;
          browser.windows.update(win.id, {width: newTabWidth+(win.width-tabWidth), height: newTabHeight+(win.height-tabHeight)});
          setTimeout(func, 0);
        }
      });
    });
  });
});
