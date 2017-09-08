"use strict";
const {utils:Cu}=Components;
const {require}=Cu.import("resource://gre/modules/commonjs/toolkit/require.js",{});
const {Bootstrap}=require("resource://gre/modules/commonjs/sdk/addon/bootstrap.js");
var {startup,shutdown,install,uninstall}=new Bootstrap(__SCRIPT_URI_SPEC__.replace("bootstrap.js",""));