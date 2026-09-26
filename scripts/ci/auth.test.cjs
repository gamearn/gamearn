const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const source = babel.transformSync(fs.readFileSync('src/context/AuthContext.js', 'utf8'), {
  configFile: false, babelrc: false, presets: ['@babel/preset-react'],
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;

function harness(options = {}) {
  const calls = [];
  const user = {uid:'test', getIdTokenResult:async()=>({claims:{}})};
  const states=[];
  class ApiError extends Error { constructor(statusCode) {super(`HTTP ${statusCode}`);this.statusCode=statusCode;} }
  const firebase = {
    getCurrentUser:()=>user,
    friendlyAuthError:e=>e.message,
    onUserChanged:()=>()=>{},
    signInWithGoogleIdToken:async token=>{calls.push(['google',token]);if(options.firebaseError)throw Error('Firebase rejected token');return user;},
    signInWithFacebookToken:async token=>{calls.push(['facebook',token]);return user;},
    signInWithAppleToken:async(...args)=>{calls.push(['apple',...args]);return user;},
  };
  const React = {
    createContext:()=>({Provider:'provider'}),
    useState:initial=>{const i=states.length;states.push(initial);return[initial,v=>{states[i]=v;}];},
    useRef:current=>({current}), useCallback:cb=>cb, useEffect:()=>{},
    createElement:(_type,props)=>props, useContext:()=>{},
  };
  const response=options.response || {type:'success',params:{id_token:'google-token'}};
  const mocks={
    react:React,
    'react-native':{Platform:{OS:options.platform || 'android'}},
    '@react-native-async-storage/async-storage':{getItem:async()=>null,setItem:async()=>{},removeItem:async()=>{}},
    'expo-constants':{executionEnvironment:'standalone'},
    'expo-auth-session/providers/google':{
      discovery:{},useAuthRequest:()=>[{clientId:'client',redirectUri:'com.gamearn:/oauthredirect',codeVerifier:'verifier'},null,async()=>response],
    },
    'expo-auth-session':{
      ResponseType:{IdToken:'id_token',Code:'code',Token:'token'},
      exchangeCodeAsync:async args=>{calls.push(['exchange',args]);return{idToken:'exchanged-token'};},
      AuthRequest:class {async promptAsync(){return response;}},
    },
    'expo-web-browser':{maybeCompleteAuthSession(){}},
    'expo-crypto':{randomUUID:()=> 'raw-nonce',CryptoDigestAlgorithm:{SHA256:'sha256'},digestStringAsync:async()=> 'hashed-nonce'},
    'expo-apple-authentication':{
      isAvailableAsync:async()=>true,
      AppleAuthenticationScope:{FULL_NAME:0,EMAIL:1},
      signInAsync:async args=>{calls.push(['appleRequest',args]);return{identityToken:'apple-token',state:options.badState?'bad':args.state,fullName:{givenName:'Ada'}};},
    },
    '../config/appConfig':{GOOGLE_CLIENT_IDS:{iosClientId:'ios.apps.googleusercontent.com'},FACEBOOK_APP_ID:'fb-id'},
    '../utils/gamePower':{calculateGamePower:()=>0,formatGP:(x)=>String(x),calculateValuePoints:()=>0,formatVP:(x)=>String(x)},
    '../services/firebase':firebase,
    '../services/apiClient':{ApiError},
    '../services/api':{auth:{login:async()=>{calls.push(['backend']);if(options.backendStatus)throw new ApiError(options.backendStatus);},me:async()=>({wallet:{balance:10}})},wallet:{}},
  };
  const context={exports:{},require:name=>{if(!(name in mocks))throw Error(`Unexpected import: ${name}`);return mocks[name];}};
  vm.runInNewContext(source,context);
  const api=context.exports.AuthProvider({children:null}).value;
  return {api,calls,states};
}

test('Google cancellation never creates a Firebase/backend session',async()=>{
  const h=harness({response:{type:'cancel'}});
  assert.equal(await h.api.signUpWithGoogle(),null);
  assert.equal(h.calls.length,0);
});
test('Google authorization code is exchanged before Firebase and backend login',async()=>{
  const h=harness({response:{type:'success',params:{code:'code'}}});
  await h.api.signUpWithGoogle();
  assert.deepEqual(h.calls.map(c=>c[0]),['exchange','google','backend']);
  assert.equal(h.calls[0][1].extraParams.code_verifier,'verifier');
  assert.equal(h.calls[1][1],'exchanged-token');
});
test('Firebase and backend authentication failures reach the login screen',async()=>{
  await assert.rejects(harness({firebaseError:true}).api.signUpWithGoogle(),/Firebase rejected/);
  await assert.rejects(harness({backendStatus:401}).api.signUpWithGoogle(),/HTTP 401/);
});
test('missing backend profile permits onboarding after valid authentication',async()=>{
  const h=harness({backendStatus:404});
  const user=await h.api.signUpWithGoogle();
  assert.equal(user.uid,'test');
  assert.equal(h.states[3],false);
});
test('Facebook token is passed to Firebase and backend',async()=>{
  const h=harness({response:{type:'success',params:{access_token:'fb-token'}}});
  await h.api.signUpWithFacebook();
  assert.deepEqual(h.calls.map(c=>c[0]),['facebook','backend']);
  assert.equal(h.calls[0][1],'fb-token');
});
test('Apple receives hashed nonce; Firebase receives raw nonce',async()=>{
  const h=harness({platform:'ios'});
  await h.api.signUpWithApple();
  assert.equal(h.calls[0][1].nonce,'hashed-nonce');
  assert.deepEqual(h.calls[1],['apple','apple-token','raw-nonce']);
  await assert.rejects(harness({platform:'ios',badState:true}).api.signUpWithApple(),/could not be verified/);
});
