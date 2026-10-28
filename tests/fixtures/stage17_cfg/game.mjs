// Golden Stage 17 LLVM dispatcher, captured before readability pass.
export function register(ctx){
ctx.register("G_DefaultRtsFile",function(){
const v=[];
let block="0",prev="",fuel=0;
while(true){if(++fuel>ctx.instructionBudget)throw Error("LLVM instruction budget exceeded: G_DefaultRtsFile");if((fuel&1048575)===0 && ctx.blockProgress)ctx.blockProgress("G_DefaultRtsFile",block,fuel);switch(block){
case "0":{
v["1"]=ctx.load(ctx.ptr("g_gameType"),"i32");
v["2"]=((v["1"]&1)|0);
v["3"]=+((v["2"]|0)===(0|0));
prev=block;block=ctx.requireDefined(v["3"],"branch") ? "4" : "27";break;
break;}
case "4":{
v["5"]=((v["1"]&8)|0);
v["6"]=+((v["5"]|0)===(0|0));
prev=block;block=ctx.requireDefined(v["6"],"branch") ? "7" : "27";break;
break;}
case "7":{
v["8"]=((v["1"]&4)|0);
v["9"]=+((v["8"]|0)===(0|0));
prev=block;block=ctx.requireDefined(v["9"],"branch") ? "17" : "10";break;
break;}
case "10":{
v["11"]=ctx.call("testkopen",[ctx.requireDefined(ctx.ptr("__tuf381909b8939_.str.88_720bf0c"),"noundef call argument"),ctx.requireDefined(0,"noundef call argument")],["ptr", "i8"]);
v["12"]=+((v["11"]|0)===(0|0));
prev=block;block=ctx.requireDefined(v["12"],"branch") ? "13" : "16";break;
break;}
case "13":{
v["14"]=ctx.call("testkopen",[ctx.requireDefined(ctx.ptr("__tuf381909b8939_.str.87_045d138"),"noundef call argument"),ctx.requireDefined(0,"noundef call argument")],["ptr", "i8"]);
v["15"]=+((v["14"]|0)===(0|0));
prev=block;block=ctx.requireDefined(v["15"],"branch") ? "16" : "27";break;
break;}
case "16":{
prev=block;block="27";break;
break;}
case "17":{
v["18"]=((v["1"]&2)|0);
v["19"]=+((v["18"]|0)===(0|0));
prev=block;block=ctx.requireDefined(v["19"],"branch") ? "27" : "20";break;
break;}
case "20":{
v["21"]=ctx.call("testkopen",[ctx.requireDefined(ctx.ptr("__tuf381909b8939_.str.87_045d138"),"noundef call argument"),ctx.requireDefined(0,"noundef call argument")],["ptr", "i8"]);
v["22"]=+((v["21"]|0)===(0|0));
prev=block;block=ctx.requireDefined(v["22"],"branch") ? "23" : "26";break;
break;}
case "23":{
v["24"]=ctx.call("testkopen",[ctx.requireDefined(ctx.ptr("__tuf381909b8939_.str.88_720bf0c"),"noundef call argument"),ctx.requireDefined(0,"noundef call argument")],["ptr", "i8"]);
v["25"]=+((v["24"]|0)===(0|0));
prev=block;block=ctx.requireDefined(v["25"],"branch") ? "26" : "27";break;
break;}
case "26":{
prev=block;block="27";break;
break;}
case "27":{
const _phi=Object.create(null);
_phi["28"]=prev==="16" ? ctx.ptr("__tuf381909b8939_.str.88_720bf0c") : prev==="26" ? ctx.ptr("__tuf381909b8939_.str.87_045d138") : prev==="0" ? ctx.ptr("__tuf381909b8939_.str.86_1ebe619") : prev==="4" ? ctx.ptr("__tuf381909b8939_.str.89_6e97aab") : prev==="13" ? ctx.ptr("__tuf381909b8939_.str.87_045d138") : prev==="23" ? ctx.ptr("__tuf381909b8939_.str.88_720bf0c") : prev==="17" ? ctx.ptr("__tuf381909b8939_.str.2_7e04ec0") : (()=>{throw Error("invalid predecessor")})();
Object.assign(v,_phi);
return ctx.requireDefined(v["28"],"return");
break;}
default:throw Error("bad LLVM basic block "+block);}}});
}
