const firebaseConfig={apiKey:"AIzaSyA_glPqNJ0hskcqjUcRkuTXiMI26x1ewxI",authDomain:"chat-app-50f5d.firebaseapp.com",projectId:"chat-app-50f5d",storageBucket:"chat-app-50f5d.firebasestorage.app",messagingSenderId:"745038747311",appId:"1:745038747311:web:27daf3ab76d174a69ce65a"};
const CLOUD_NAME="ahvi7zoy",PRESET="dilfinity",AI_AVATAR="https://cdn-icons-png.flaticon.com/512/4712/4712027.png";

let auth=null,db=null;
try{
  if(typeof firebase!=='undefined'&&!firebase.apps.length){
    firebase.initializeApp(firebaseConfig);
    auth=firebase.auth();
    db=firebase.firestore();
  }
}catch(e){}

let currentUser={uid:'user_'+Date.now(),displayName:'Dilfinity User',email:'user@dilfinity.app',photoURL:'https://randomuser.me/api/portraits/women/44.jpg',bio:'Connected'};
let activeChat={id:'global',name:'Global Lounge',isGlobal:true,avatar:'https://api.dicebear.com/7.x/bottts/svg?seed=Global'};
let allUsers=[],messagesCache={},statusCache=[],selectedAvatar="https://randomuser.me/api/portraits/women/44.jpg",currentSection='global';
let mediaRecorder=null,audioChunks=[],localStream=null;

const REAL_AVATARS=["https://randomuser.me/api/portraits/women/44.jpg","https://randomuser.me/api/portraits/women/68.jpg","https://randomuser.me/api/portraits/women/32.jpg","https://randomuser.me/api/portraits/women/26.jpg","https://randomuser.me/api/portraits/men/32.jpg","https://randomuser.me/api/portraits/men/75.jpg","https://randomuser.me/api/portraits/men/46.jpg","https://randomuser.me/api/portraits/men/22.jpg"];

function initCanvas(){
  const canvas=document.getElementById('bgCanvas');if(!canvas)return;
  const ctx=canvas.getContext('2d');let w=canvas.width=innerWidth,h=canvas.height=innerHeight;
  addEventListener('resize',()=>{w=canvas.width=innerWidth;h=canvas.height=innerHeight;});
  const stars=Array.from({length:120},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.5+0.5,alpha:Math.random()*0.7+0.2,tw:Math.random()*0.03+0.01}));
  function draw(){
    ctx.clearRect(0,0,w,h);const isDark=document.documentElement.getAttribute('data-mode')==='dark';
    stars.forEach(s=>{s.alpha+=Math.sin(Date.now()*s.tw)*0.01;s.alpha=Math.max(0.15,Math.min(0.9,s.alpha));ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=isDark?`rgba(255,255,255,${s.alpha})`:`rgba(139,92,246,${s.alpha*0.8})`;ctx.fill();});
    requestAnimationFrame(draw);
  }
  draw();
}

function enterApp(userData){
  if(userData) currentUser=userData;
  document.getElementById('welcomeHero')?.classList.add('hidden');
  document.getElementById('authModal')?.classList.add('hidden');
  document.getElementById('appWorkspace')?.classList.remove('hidden');
  if(document.getElementById('myAvatarImg')) document.getElementById('myAvatarImg').src=currentUser.photoURL;
  if(document.getElementById('myDisplayName')) document.getElementById('myDisplayName').innerText=currentUser.displayName;
  
  loadInitialData();
  listenRealtimeStatus();
  selectChat({id:'global',name:'Global Lounge',isGlobal:true,avatar:'https://api.dicebear.com/7.x/bottts/svg?seed=Global'});
}

function loadInitialData(){
  allUsers=[
    {id:'global',name:'Global Lounge',avatar:'https://api.dicebear.com/7.x/bottts/svg?seed=Global',isGlobal:true,isOnline:true,bio:'Public room'},
    {id:'ai',name:'Dilfinity AI ✨',avatar:AI_AVATAR,isOnline:true,isAI:true,bio:'AI Assistant'},
    {id:'zain',name:'Zain Ahmed ⚡',avatar:REAL_AVATARS[4],isOnline:true,bio:'Connecting Hearts ✦'},
    {id:'sana',name:'Sana Mir 🌸',avatar:REAL_AVATARS[1],isOnline:true,bio:'Always smiling :)'}
  ];
  renderConversations();
}

function listenRealtimeStatus(){
  if(!db) return;
  try{
    db.collection('status').orderBy('createdAt','desc').onSnapshot(snap=>{
      statusCache=[];
      snap.forEach(doc=>{ statusCache.push({id:doc.id,...doc.data()}); });
      if(currentSection==='status') renderStatusTab();
    });
  }catch(e){}
}

function renderConversations(){
  const list=document.getElementById('conversationsList');if(!list)return;
  
  if(currentSection==='status'){
    renderStatusTab();
    return;
  }
  
  document.querySelector('.chat-window')?.classList.remove('hidden');
  list.innerHTML='';
  const search=document.getElementById('chatSearchInput')?.value.toLowerCase()||'';
  let filtered=allUsers;
  if(search) filtered=filtered.filter(u=>u.name.toLowerCase().includes(search));

  filtered.forEach(u=>{
    const div=document.createElement('div');
    div.className=`conv-item ${activeChat.id===u.id?'active':''}`;
    div.innerHTML=`
      <img src="${u.avatar}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;">
      <div style="flex:1;overflow:hidden;margin-left:10px;">
        <b style="font-size:0.88rem;display:block">${u.name}</b>
        <span style="font-size:0.75rem;color:var(--txt2);">${u.bio||'Tap to chat'}</span>
      </div>
      <span style="font-size:0.6rem;color:#10b981;">●</span>
    `;
    div.onclick=()=>selectChat(u);
    list.appendChild(div);
  });
}

function renderStatusTab(){
  const list=document.getElementById('conversationsList');if(!list)return;
  list.innerHTML=`
    <div style="padding:12px 6px">
      <div class="status-item-box" id="myStatusAddBtn">
        <div style="position:relative">
          <img src="${currentUser.photoURL}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">
          <div style="position:absolute;bottom:0;right:0;background:var(--p);color:#fff;border-radius:50%;width:18px;height:18px;display:grid;place-items:center;font-size:10px"><i class="fa-solid fa-plus"></i></div>
        </div>
        <div>
          <b style="font-size:0.9rem;display:block">My status</b>
          <span style="font-size:0.75rem;color:var(--txt2)">Tap to add status update</span>
        </div>
      </div>
      <div style="font-size:0.75rem;font-weight:700;color:var(--txt2);margin:16px 12px 8px">RECENT UPDATES</div>
      <div id="recentStatusContainer"></div>
    </div>
  `;

  document.getElementById('myStatusAddBtn')?.addEventListener('click',addNewStatus);

  const container=document.getElementById('recentStatusContainer');
  if(!container) return;

  if(statusCache.length===0){
    container.innerHTML='<div style="text-align:center;padding:20px;color:var(--txt2);font-size:0.8rem">No status updates yet.<br>Be the first to add one!</div>';
    return;
  }

  statusCache.forEach(st=>{
    const item=document.createElement('div');
    item.className='status-item-box';
    item.innerHTML=`
      <img src="${st.avatar}" class="status-ring-avatar">
      <div style="flex:1">
        <b style="font-size:0.88rem;display:block">${st.name}</b>
        <span style="font-size:0.72rem;color:var(--txt2)">Today at ${st.time||'Just now'}</span>
      </div>
    `;
    item.onclick=()=>openStatusViewer(st);
    container.appendChild(item);
  });
}

function addNewStatus(){
  const text=prompt('Enter status text/caption:','Enjoying my day! ✨');
  if(text===null) return;
  
  const newSt={
    uid:currentUser.uid,
    name:currentUser.displayName,
    avatar:currentUser.photoURL,
    image:currentUser.photoURL,
    text:text||'My Status',
    time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
  };
  
  statusCache.unshift(newSt);
  if(db){
    try{ db.collection('status').add({...newSt,createdAt:firebase.firestore.FieldValue.serverTimestamp()}); }catch(e){}
  }
  toast('Status added! 🟢');
  renderStatusTab();
}

function openStatusViewer(st){
  const modal=document.getElementById('statusViewerModal');if(!modal)return;
  modal.classList.remove('hidden');
  document.getElementById('statusViewerAvatar').src=st.avatar;
  document.getElementById('statusViewerName').innerText=st.name;
  document.getElementById('statusViewerImage').src=st.image;
  document.getElementById('statusViewerText').innerText=st.text||'';
  document.getElementById('statusViewerTime').innerText=st.time||'Today';
  setTimeout(()=>{ modal.classList.add('hidden'); },5000);
}

function selectChat(c){
  activeChat=c;
  currentSection='chat';
  document.getElementById('chatHeaderTitle').innerText=c.name;
  document.getElementById('chatStatusLabel').innerText=c.isAI?'AI Assistant • Online':'128 members • 12 online now';
  renderMessages();
}

function renderMessages(){
  const feed=document.getElementById('messageFeed');if(!feed)return;
  feed.innerHTML='<div class="feed-date-separator"><span>Today</span></div>';

  if(!messagesCache[activeChat.id]){
    messagesCache[activeChat.id]=[
      {senderId:'system',text:`Welcome to ${activeChat.name}! Start chatting now ✨`,time:'Now'}
    ];
  }

  messagesCache[activeChat.id].forEach(m=>{
    const isMe=m.senderId===currentUser.uid;
    const div=document.createElement('div');
    div.className=`msg-bubble-wrapper ${isMe?'sent':'received'}`;
    div.innerHTML=`<div class="msg-bubble">${m.text}<div class="msg-meta"><span>${m.time||'Now'}</span> <span class="blue-ticks">✓✓</span></div></div>`;
    feed.appendChild(div);
  });
  feed.scrollTop=feed.scrollHeight;
}

function sendMessage(){
  const inp=document.getElementById('chatInputText');if(!inp)return;
  const txt=inp.value.trim();if(!txt)return;

  const timeNow=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  if(!messagesCache[activeChat.id]) messagesCache[activeChat.id]=[];

  messagesCache[activeChat.id].push({senderId:currentUser.uid,text:txt,time:timeNow});
  inp.value='';
  renderMessages();

  if(activeChat.id==='ai'){
    setTimeout(()=>{
      messagesCache['ai'].push({
        senderId:'ai',
        text:`I'm Dilfinity AI ✨ You said: "${txt}"`,
        time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
      });
      renderMessages();
    },600);
  }
}

function showAuthModal(type){
  const modal=document.getElementById('authModal');
  const loginForm=document.getElementById('loginForm');
  const signUpForm=document.getElementById('signUpForm');
  if(modal) modal.classList.remove('hidden');
  if(loginForm) loginForm.classList.toggle('hidden',type!=='login');
  if(signUpForm) signUpForm.classList.toggle('hidden',type!=='signup');
  const title=document.getElementById('authTitle');
  if(title) title.innerText=type==='login'?'Welcome Back':'Create Account';
}

function toast(msg){
  let box=document.getElementById('toastBox');
  if(!box){
    box=document.createElement('div');box.id='toastBox';
    box.style.cssText='position:fixed;bottom:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(box);
  }
  const t=document.createElement('div');
  t.style.cssText='background:var(--p,#8b5cf6);color:white;padding:10px 16px;border-radius:10px;font-size:0.85rem;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
  t.innerText=msg;
  box.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

// FILE UPLOAD HELPER FUNCTION
function triggerFileUpload(acceptType, typeName){
  const input=document.createElement('input');
  input.type='file';
  input.accept=acceptType;
  input.onchange=e=>{
    const file=e.target.files[0];
    if(!file) return;
    const fileUrl=URL.createObjectURL(file);
    let htmlContent='';
    
    if(typeName==='image'){
      htmlContent=`<img src="${fileUrl}" style="max-width:220px;border-radius:12px;" onclick="window.open('${fileUrl}')">`;
    }else if(typeName==='video'){
      htmlContent=`<video controls src="${fileUrl}" style="max-width:220px;border-radius:12px;"></video>`;
    }else if(typeName==='doc'){
      htmlContent=`<a href="${fileUrl}" target="_blank" style="color:var(--p);font-weight:bold;text-decoration:none">📄 ${file.name}</a>`;
    }

    if(!messagesCache[activeChat.id]) messagesCache[activeChat.id]=[];
    messagesCache[activeChat.id].push({
      senderId:currentUser.uid,
      text:htmlContent,
      time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
    });
    renderMessages();
    toast(`${typeName.toUpperCase()} sent successfully 📎`);
  };
  input.click();
}

// REAL VOICE NOTES FUNCTION
async function handleVoiceRecording(){
  const btn=document.getElementById('recordVoiceBtn');
  if(!mediaRecorder||mediaRecorder.state==='inactive'){
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      mediaRecorder=new MediaRecorder(stream);
      audioChunks=[];
      mediaRecorder.ondataavailable=e=>audioChunks.push(e.data);
      mediaRecorder.onstop=async()=>{
        const blob=new Blob(audioChunks,{type:'audio/mp3'});
        const audioUrl=URL.createObjectURL(blob);
        const audioHTML=`<audio controls src="${audioUrl}" style="width:200px;height:36px"></audio>`;
        messagesCache[activeChat.id].push({
          senderId:currentUser.uid,
          text:audioHTML,
          time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
        });
        renderMessages();
        toast('Voice note sent 🎙️');
      };
      mediaRecorder.start();
      btn.style.color='#ef4444';
      toast('Recording... Press again to stop 🎙️');
    }catch(err){ toast('Microphone permission required!'); }
  }else{
    mediaRecorder.stop();
    btn.style.color='var(--txt2)';
  }
}

// CALL FUNCTION
async function startCall(type){
  try{
    localStream=await navigator.mediaDevices.getUserMedia({video:type==='video',audio:true});
    document.getElementById('localVideo').srcObject=localStream;
    document.getElementById('callModal')?.classList.remove('hidden');
    document.getElementById('callTitle').innerText=`${type==='video'?'Video':'Audio'} Call - ${activeChat.name}`;
    toast('Call started 📞');
  }catch(e){
    document.getElementById('callModal')?.classList.remove('hidden');
    toast('Call ringing... 📞');
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  initCanvas();

  document.getElementById('heroSignUpBtn')?.addEventListener('click',()=>showAuthModal('signup'));
  document.getElementById('heroSignInBtn')?.addEventListener('click',()=>showAuthModal('login'));
  document.getElementById('closeAuthBtn')?.addEventListener('click',()=>document.getElementById('authModal')?.classList.add('hidden'));

  document.getElementById('switchToSignUp')?.addEventListener('click',e=>{e.preventDefault();showAuthModal('signup');});
  document.getElementById('switchToLogin')?.addEventListener('click',e=>{e.preventDefault();showAuthModal('login');});

  document.querySelectorAll('.avatar-opt').forEach(img=>img.addEventListener('click',()=>{
    document.querySelectorAll('.avatar-opt').forEach(i=>i.classList.remove('selected'));
    img.classList.add('selected');selectedAvatar=img.dataset.avatar;
  }));

  document.getElementById('loginForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const email=document.getElementById('loginEmail')?.value.trim()||'user@dilfinity.app';
    toast('Signing in... 🔑');
    setTimeout(()=>{
      enterApp({uid:'usr_'+Date.now(),displayName:email.split('@')[0]||'User',email,photoURL:selectedAvatar});
      toast('Welcome back! Chats opened 🚀');
    },300);
  });

  document.getElementById('signUpForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const name=document.getElementById('signUpName')?.value.trim()||'User';
    const email=document.getElementById('signUpEmail')?.value.trim()||'user@dilfinity.app';
    toast('Creating account... ✨');
    setTimeout(()=>{
      enterApp({uid:'usr_'+Date.now(),displayName:name,email,photoURL:selectedAvatar});
      toast(`Welcome ${name}! 🎉 Chats opened.`);
    },300);
  });

  document.getElementById('googleSignInBtn')?.addEventListener('click',()=>{
    enterApp({uid:'g_'+Date.now(),displayName:'Google User',email:'google@dilfinity.app',photoURL:REAL_AVATARS[2]});
    toast('Google login success 🚀');
  });

  document.getElementById('guestNavBtn')?.addEventListener('click',()=>{
    enterApp({uid:'guest_'+Date.now(),displayName:'Guest User #'+Math.floor(1000+Math.random()*9000),email:'guest@dilfinity.app',photoURL:REAL_AVATARS[1]});
    toast('Guest mode active ⚡');
  });

  document.documentElement.setAttribute('data-mode', 'light');
  document.documentElement.setAttribute('data-theme', 'violet');

  document.getElementById('themeSelectBtn')?.addEventListener('click',()=>document.getElementById('themeMenu')?.classList.toggle('hidden'));
  document.querySelectorAll('.theme-option').forEach(o=>o.addEventListener('click',e=>{
    document.documentElement.setAttribute('data-theme',e.currentTarget.dataset.theme);
    document.getElementById('themeMenu')?.classList.add('hidden');
  }));

  document.getElementById('modeToggleBtn')?.addEventListener('click',()=>{
    const cur=document.documentElement.getAttribute('data-mode')||'light',next=cur==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-mode',next);
    document.getElementById('modeIcon').className=next==='dark'?'fa-solid fa-sun':'fa-solid fa-moon';
    document.getElementById('modeLabel').innerText=next==='dark'?'Light':'Dark';
  });

  document.getElementById('sendMessageBtn')?.addEventListener('click',sendMessage);
  document.getElementById('chatInputText')?.addEventListener('keypress',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}});
  document.getElementById('recordVoiceBtn')?.addEventListener('click',handleVoiceRecording);

  // ATTACHMENT TRAY TOGGLE & BUTTONS FIX
  document.getElementById('toggleAttachBtn')?.addEventListener('click',(e)=>{
    e.stopPropagation();
    document.getElementById('attachmentTray')?.classList.toggle('hidden');
    document.getElementById('emojiPickerBox')?.classList.add('hidden');
  });

  document.getElementById('uploadPhotoBtn')?.addEventListener('click',()=>{
    document.getElementById('attachmentTray')?.classList.add('hidden');
    triggerFileUpload('image/*', 'image');
  });

  document.getElementById('uploadVideoBtn')?.addEventListener('click',()=>{
    document.getElementById('attachmentTray')?.classList.add('hidden');
    triggerFileUpload('video/*', 'video');
  });

  document.getElementById('uploadDocBtn')?.addEventListener('click',()=>{
    document.getElementById('attachmentTray')?.classList.add('hidden');
    triggerFileUpload('.pdf,.doc,.docx,.txt', 'doc');
  });

  // EMOJI PICKER TOGGLE & SELECTION FIX
  document.getElementById('toggleEmojiBtn')?.addEventListener('click',(e)=>{
    e.stopPropagation();
    document.getElementById('emojiPickerBox')?.classList.toggle('hidden');
    document.getElementById('attachmentTray')?.classList.add('hidden');
  });

  document.querySelectorAll('#emojiPickerBox span').forEach(s=>{
    s.addEventListener('click',()=>{
      const input = document.getElementById('chatInputText');
      if(input) input.value += s.innerText;
    });
  });

  // CLOSE TRAYS ON CLICK OUTSIDE
  document.addEventListener('click',(e)=>{
    if(!e.target.closest('#toggleAttachBtn') && !e.target.closest('#attachmentTray')){
      document.getElementById('attachmentTray')?.classList.add('hidden');
    }
    if(!e.target.closest('#toggleEmojiBtn') && !e.target.closest('#emojiPickerBox')){
      document.getElementById('emojiPickerBox')?.classList.add('hidden');
    }
    if(!e.target.closest('#themeSelectBtn') && !e.target.closest('#themeMenu')){
      document.getElementById('themeMenu')?.classList.add('hidden');
    }
  });

  function setActive(id){
    document.querySelectorAll('.left-action-sidebar .action-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
  }

  document.getElementById('btnGlobalLounge')?.addEventListener('click',()=>{ currentSection='global';setActive('btnGlobalLounge');renderConversations();selectChat(allUsers[0]); });
  document.getElementById('btnDirectDms')?.addEventListener('click',()=>{ currentSection='direct';setActive('btnDirectDms');renderConversations(); });
  document.getElementById('btnStatusStories')?.addEventListener('click',()=>{ currentSection='status';setActive('btnStatusStories');renderStatusTab(); });
  document.getElementById('btnGroupChats')?.addEventListener('click',()=>{ currentSection='groups';setActive('btnGroupChats');renderConversations(); });
  document.getElementById('btnDilfinityAI')?.addEventListener('click',()=>{ currentSection='ai';setActive('btnDilfinityAI');selectChat(allUsers[1]); });

  document.getElementById('btnInviteFriends')?.addEventListener('click',()=>{ navigator.clipboard?.writeText(location.href);toast('Invite link copied 🔗'); });
  document.getElementById('btnEditProfile')?.addEventListener('click',()=>{
    const n=prompt('New name:',currentUser.displayName);if(!n)return;
    currentUser.displayName=n;
    if(document.getElementById('myDisplayName')) document.getElementById('myDisplayName').innerText=n;
    toast('Profile updated ✏️');
  });

  document.getElementById('btnLogout')?.addEventListener('click',()=>location.reload());

  document.getElementById('callMenuBtn')?.addEventListener('click',()=>document.getElementById('callMenu')?.classList.toggle('hidden'));
  document.getElementById('threeDotsBtn')?.addEventListener('click',()=>document.getElementById('threeDotsMenu')?.classList.toggle('hidden'));

  document.getElementById('startAudioCallBtn')?.addEventListener('click',()=>startCall('audio'));
  document.getElementById('startVideoCallBtn')?.addEventListener('click',()=>startCall('video'));
  document.getElementById('endCallBtn')?.addEventListener('click',()=>{
    if(localStream){ localStream.getTracks().forEach(t=>t.stop()); localStream=null; }
    document.getElementById('callModal')?.classList.add('hidden');
    toast('Call ended');
  });

  document.getElementById('menuClearChat')?.addEventListener('click',()=>{
    messagesCache[activeChat.id]=[];renderMessages();toast('Chat cleared 🗑️');
    document.getElementById('threeDotsMenu')?.classList.add('hidden');
  });

  document.getElementById('closeStatusViewer')?.addEventListener('click',()=>document.getElementById('statusViewerModal')?.classList.add('hidden'));

  document.getElementById('demoFeaturesBtn')?.addEventListener('click',()=>document.getElementById('demoModal')?.classList.remove('hidden'));
  document.getElementById('closeDemoBtn')?.addEventListener('click',()=>document.getElementById('demoModal')?.classList.add('hidden'));
  document.getElementById('gotItDemoBtn')?.addEventListener('click',()=>document.getElementById('demoModal')?.classList.add('hidden'));

  document.getElementById('lockAppToggleBtn')?.addEventListener('click',()=>document.getElementById('appLockOverlay')?.classList.remove('hidden'));
  document.getElementById('unlockAppBtn')?.addEventListener('click',()=>{
    if(document.getElementById('lockPinInput')?.value==='1234'){
      document.getElementById('appLockOverlay')?.classList.add('hidden');toast('Unlocked 🔓');
    }else{ document.getElementById('lockError')?.classList.remove('hidden'); }
  });
});