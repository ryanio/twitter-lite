function e(){return(e=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var s=arguments[t];for(var r in s)Object.prototype.hasOwnProperty.call(s,r)&&(e[r]=s[r])}return e}).apply(this,arguments)}const t=require("crypto"),s=require("oauth-1.0a"),r=require("cross-fetch"),n=require("querystring"),o=require("./stream"),a=require("oauth-signature"),i=require("get-random-values"),c=(e,t="1.1")=>`https://${e}.twitter.com/${t}`,h={subdomain:"api",consumer_key:null,consumer_secret:null,access_token_key:null,access_token_secret:null,bearer_token:null,version:"1.1",extension:!0},u=["direct_messages/events/new","direct_messages/welcome_messages/new","direct_messages/welcome_messages/rules/new","media/metadata/create","collections/entries/curate","tweets"],d=["media/upload"],l={"Content-Type":"application/json",Accept:"application/json"};function _(e){return e.replace(/!/g,"%21").replace(/\*/g,"%2A").replace(/'/g,"%27").replace(/\(/g,"%28").replace(/\)/g,"%29")}class m{constructor(e){const r=Object.assign({},h,e);this.authType=r.bearer_token?"App":"User",this.client=(({key:e,secret:r})=>s({consumer:{key:e,secret:r},signature_method:"HMAC-SHA1",hash_function:(e,s)=>t.createHmac("sha1",s).update(e).digest("base64")}))({key:r.consumer_key,secret:r.consumer_secret}),this.token={key:r.access_token_key,secret:r.access_token_secret},this.url=c(r.subdomain,r.version),this.oauth=c(r.subdomain,"oauth"),this.config=r}static async _handleResponse(t){const s=t.headers;if(t.ok)return 204===t.status||"0"===t.headers.get("content-length")?{_headers:s}:t.json().then(e=>(e._headers=s,e));throw e({_headers:s},await t.json())}static async _handleResponseTextOrJson(e){let t=await e.text();if(e.ok)return n.parse(t);{let e;try{e=JSON.parse(t)}catch(s){e=t}return Promise.reject(e)}}async getBearerToken(){const e={Authorization:"Basic "+Buffer.from(this.config.consumer_key+":"+this.config.consumer_secret).toString("base64"),"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"};return await r("https://api.twitter.com/oauth2/token",{method:"POST",body:"grant_type=client_credentials",headers:e}).then(m._handleResponse)}async getRequestToken(e){const t={url:`${this.oauth}/request_token`,method:"POST"};let s={};e&&(s={oauth_callback:e}),s&&(t.url+="?"+n.stringify(s));const o=this.client.toHeader(this.client.authorize(t,{}));return await r(t.url,{method:"POST",headers:Object.assign({},l,o)}).then(m._handleResponseTextOrJson)}async getAccessToken(e){const t={url:`${this.oauth}/access_token`,method:"POST"};let s={oauth_verifier:e.oauth_verifier,oauth_token:e.oauth_token};s.oauth_verifier&&s.oauth_token&&(t.url+="?"+n.stringify(s));const o=this.client.toHeader(this.client.authorize(t));return await r(t.url,{method:"POST",headers:Object.assign({},l,o)}).then(m._handleResponseTextOrJson)}_makeRequest(e,t,s){const r={url:`${this.url}/${t}${this.config.extension?".json":""}`,method:e};s&&("POST"===e?r.data=s:r.url+="?"+n.stringify(s));let o={};return o="User"===this.authType?this.client.toHeader(this.client.authorize(r,this.token)):{Authorization:`Bearer ${this.config.bearer_token}`},{requestData:r,headers:o}}get(e,t){const{requestData:s,headers:n}=this._makeRequest("GET",e,t);return r(s.url,{headers:n}).then(m._handleResponse)}createOauthSignature(e,t,s,r,n){const o={httpMethod:e,url:t,parameters:s,consumerSecret:r,tokenSecret:n};return{encodedSignature:a.generate(o.httpMethod,o.url,o.parameters,o.consumerSecret,o.tokenSecret),signature:a.generate(o.httpMethod,o.url,o.parameters,o.consumerSecret,o.tokenSecret,{encodeSignature:!1})}}generateNonce(){const e="0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~",t=[];return i(new Uint8Array(32)).forEach(s=>t.push(e[s%e.length])),t.join("")}post(e,t){const{requestData:s,headers:o}=this._makeRequest("POST",e,u.includes(e)?null:t),a=Object.assign({},l,o);if(u.includes(e))t=JSON.stringify(t);else{if(d.includes(e)){const e=this.generateNonce(),r=Math.floor((new Date).getTime()/1e3),n=this.createOauthSignature("POST",s.url,{oauth_consumer_key:this.config.consumer_key,oauth_token:this.config.access_token_key,oauth_nonce:e,oauth_timestamp:r,oauth_signature_method:this.client.signature_method,oauth_version:this.client.version,media_data:t.media_data},this.config.consumer_secret,this.config.access_token_secret);t.oauth_consumer_key=this.config.consumer_key,t.oauth_nonce=e,t.oauth_signature=n.signature,t.oauth_signature_method=this.client.signature_method,t.oauth_timestamp=r,t.oauth_token=this.config.access_token_key,t.oauth_version=this.client.version}t=_(n.stringify(t)),a["Content-Type"]="application/x-www-form-urlencoded",d.includes(e)&&(a["Content-Transfer-Encoding"]="base64",delete a.Accept,delete a.Authorization)}return r(s.url,{method:"POST",headers:a,body:t}).then(m._handleResponse)}put(e,t,s){const{requestData:n,headers:o}=this._makeRequest("PUT",e,t),a=Object.assign({},l,o);return s=JSON.stringify(s),r(n.url,{method:"PUT",headers:a,body:s}).then(m._handleResponse)}stream(t,s){if("User"!==this.authType)throw new Error("Streams require user context authentication");const a=new o,i={url:`${c("stream")}/${t}${this.config.extension?".json":""}`,method:"POST"};s&&(i.data=s);const h=this.client.toHeader(this.client.authorize(i,this.token));return r(i.url,{method:"POST",headers:e({},h,{"Content-Type":"application/x-www-form-urlencoded"}),body:_(n.stringify(s))}).then(e=>{a.destroy=this.stream.destroy=()=>e.body.destroy(),e.ok?a.emit("start",e):(e._headers=e.headers,a.emit("error",e)),e.body.on("data",e=>a.parse(e)).on("error",e=>a.emit("error",e)).on("end",()=>a.emit("end",e))}).catch(e=>a.emit("error",e)),a}}module.exports=m;
//# sourceMappingURL=twitter.modern.js.map
