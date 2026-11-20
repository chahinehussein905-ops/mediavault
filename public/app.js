import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = window.MEDIA_VAULT_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.MEDIA_VAULT_SUPABASE_ANON_KEY || "";
const BUCKET = "mediavault-files";
const $ = (id) => document.getElementById(id);
let supabase, mode = "signin", user = null;

function error(message){ $("authError").textContent=message; $("authError").classList.remove("hidden"); }
function clearError(){ $("authError").classList.add("hidden"); }
function showAuth(){ $("authView").classList.remove("hidden"); $("appView").classList.add("hidden"); $("logout").classList.add("hidden"); $("userLabel").textContent=""; }
function showApp(){ $("authView").classList.add("hidden"); $("appView").classList.remove("hidden"); $("logout").classList.remove("hidden"); $("userLabel").textContent=user?.email||""; loadFiles(); }
function setMode(next){mode=next;document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===mode));$("emailAction").innerHTML=(mode==="signin"?"Sign in":"Create account")+" <span>↗</span>";$("password").autocomplete=mode==="signin"?"current-password":"new-password";clearError();}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.tab)));

if(!SUPABASE_URL || !SUPABASE_ANON_KEY){
  error("Setup needed: add your Supabase project URL and publishable anon key in public/config.js. See README.");
} else {
  supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;user?showApp():showAuth();});
  const {data:{session}}=await supabase.auth.getSession();user=session?.user||null;user?showApp():showAuth();
}

$("emailAction").addEventListener("click",async()=>{
  if(!supabase)return error("Add your Supabase URL and anon key first.");
  clearError();const email=$("email").value.trim(),password=$("password").value;
  if(!email||!password)return error("Enter your email and password.");
  const result=mode==="signin"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password,options:{emailRedirectTo:location.origin}});
  if(result.error)return error(result.error.message);
  if(mode==="signup"&&!result.data.session)error("Check your email to confirm your account, then sign in.");
});
async function oauth(provider){if(!supabase)return error("Add your Supabase URL and anon key first.");clearError();const {error:e}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:location.origin}});if(e)error(e.message);}
$("google").addEventListener("click",()=>oauth("google"));
$("apple").addEventListener("click",()=>oauth("apple"));
$("logout").addEventListener("click",async()=>{await supabase?.auth.signOut();});
$("fileInput").addEventListener("change",async e=>{
  const files=[...e.target.files];e.target.value="";if(!files.length||!user)return;
  for(const file of files){
    if(!(file.type.startsWith("image/")||file.type.startsWith("video/"))){alert(`${file.name} is not an image or video.`);continue;}
    if(file.size>50*1024*1024){alert(`${file.name} is over the 50 MB limit.`);continue;}
    $("status").textContent=`Uploading ${file.name}…`;
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=`${user.id}/${Date.now()}-${crypto.randomUUID()}-${safe}`;
    const {error:e}=await supabase.storage.from(BUCKET).upload(path,file,{upsert:false,contentType:file.type});
    if(e)alert(`Upload failed: ${e.message}`);
  }
  $("status").textContent="Your private library";loadFiles();
});
async function loadFiles(){
  if(!supabase||!user)return;
  const {data,error:e}=await supabase.storage.from(BUCKET).list(user.id,{limit:100,sortBy:{column:"created_at",order:"desc"}});
  if(e){$("status").textContent=`Storage: ${e.message}`;return;}
  const grid=$("grid");grid.innerHTML="";
  const items=(data||[]).filter(x=>x.name&&!x.name.startsWith("."));
  if(!items.length){grid.innerHTML='<div class="empty"><div class="empty-icon">＋</div><h3>Your library starts here</h3><p>Upload an image or video to see it appear here.</p></div>';return;}
  for(const item of items){
    const path=`${user.id}/${item.name}`,{data:signed,error:se}=await supabase.storage.from(BUCKET).createSignedUrl(path,3600);
    if(se||!signed)continue;
    const isVideo=/\.(mp4|mov|webm|m4v|ogg)$/i.test(item.name);
    const tile=document.createElement("article");tile.className="tile";
    const media=document.createElement(isVideo?"video":"img");media.src=signed.signedUrl;if(isVideo){media.controls=true;media.preload="metadata";}else media.alt=item.name;
    const info=document.createElement("div");info.className="tile-info";
    const name=document.createElement("span");name.className="tile-name";name.textContent=item.name;
    const del=document.createElement("button");del.textContent="Delete";del.addEventListener("click",async()=>{if(confirm("Delete this file?")){const {error}=await supabase.storage.from(BUCKET).remove([path]);if(error)alert(error.message);loadFiles();}});
    info.append(name,del);tile.append(media,info);grid.append(tile);
  }
}
