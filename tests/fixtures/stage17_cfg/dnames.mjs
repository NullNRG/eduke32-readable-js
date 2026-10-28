// Golden Stage 17 LLVM dispatcher, captured before readability pass.
export function register(ctx){
ctx.register("_Z27G_ProcessDynamicNameMappingPKcP7dynitems",function(p0,p1,p2){
const v=[];
v["0"]=p0;
v["1"]=p1;
v["2"]=p2;
let block="entry",prev="",fuel=0;
while(true){if(++fuel>ctx.instructionBudget)throw Error("LLVM instruction budget exceeded: _Z27G_ProcessDynamicNameMappingPKcP7dynitems");if((fuel&1048575)===0 && ctx.blockProgress)ctx.blockProgress("_Z27G_ProcessDynamicNameMappingPKcP7dynitems",block,fuel);switch(block){
case "entry":{
v["4"]=+(((v["2"])&65535)<((30720)&65535));
v["5"]=+(v["0"]!==0);
v["6"]=(((v["5"]&v["4"])<<31)>>31);
prev=block;block=ctx.requireDefined(v["6"],"branch") ? "7" : "20";break;
break;}
case "7":{
v["8"]=ctx.call("hash_find",[ctx.requireDefined(ctx.ptr("__tu67bccee3be5d__ZL7h_names_436f040"),"noundef call argument"),ctx.requireDefined(v["0"],"noundef call argument")],["ptr", "ptr"]);
v["9"]=BigInt.asIntN(64,(BigInt(v["8"])&BigInt(2147483648)));
v["10"]=+(BigInt.asIntN(64,BigInt(v["9"]))===BigInt.asIntN(64,BigInt(0)));
prev=block;block=ctx.requireDefined(v["10"],"branch") ? "11" : "20";break;
break;}
case "11":{
v["12"]=BigInt.asIntN(64,(BigInt(v["8"])&BigInt(2147483647)));
v["13"]=(v["1"]+(ctx.offset(v["12"]) * 24));
v["14"]=ctx.load(v["13"],"ptr");
v["15"]=ctx.call("strcmp",[ctx.requireDefined(v["14"],"noundef call argument"),ctx.requireDefined(v["0"],"noundef call argument")],["ptr", "ptr"]);
v["16"]=+((v["15"]|0)===(0|0));
prev=block;block=ctx.requireDefined(v["16"],"branch") ? "17" : "20";break;
break;}
case "17":{
v["18"]=(v["13"]+(ctx.offset(8) * 1));
v["19"]=ctx.load(v["18"],"ptr");
ctx.store(v["19"],"i16",v["2"]);
prev=block;block="20";break;
break;}
case "20":{
return undefined;
break;}
default:throw Error("bad LLVM basic block "+block);}}});
}
