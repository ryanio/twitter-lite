function e(){return(e=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e}).apply(this,arguments)}var t=require("crypto"),r=require("oauth-1.0a"),n=require("cross-fetch"),o=require("querystring"),s=require("./stream"),a=require("oauth-signature"),i=require("get-random-values"),u=function(e,t){return void 0===t&&(t="1.1"),"https://"+e+".twitter.com/"+t},c={subdomain:"api",consumer_key:null,consumer_secret:null,access_token_key:null,access_token_secret:null,bearer_token:null,version:"1.1",extension:!0},h=["direct_messages/events/new","direct_messages/welcome_messages/new","direct_messages/welcome_messages/rules/new","media/metadata/create","collections/entries/curate","tweets"],d=["media/upload"],l={"Content-Type":"application/json",Accept:"application/json"};function m(e){return e.replace(/!/g,"%21").replace(/\*/g,"%2A").replace(/'/g,"%27").replace(/\(/g,"%28").replace(/\)/g,"%29")}module.exports=function(){function _(e){var n,o=Object.assign({},c,e);this.authType=o.bearer_token?"App":"User",this.client=r({consumer:{key:(n={key:o.consumer_key,secret:o.consumer_secret}).key,secret:n.secret},signature_method:"HMAC-SHA1",hash_function:function(e,r){return t.createHmac("sha1",r).update(e).digest("base64")}}),this.token={key:o.access_token_key,secret:o.access_token_secret},this.url=u(o.subdomain,o.version),this.oauth=u(o.subdomain,"oauth"),this.config=o}_._handleResponse=function(t){try{var r=t.headers;return t.ok?204===t.status||"0"===t.headers.get("content-length")?Promise.resolve({_headers:r}):Promise.resolve(t.json().then(function(e){return e._headers=r,e})):Promise.resolve(t.json()).then(function(t){throw e({_headers:r},t)})}catch(e){return Promise.reject(e)}},_._handleResponseTextOrJson=function(e){try{return Promise.resolve(e.text()).then(function(t){if(e.ok)return o.parse(t);var r;try{r=JSON.parse(t)}catch(e){r=t}return Promise.reject(r)})}catch(e){return Promise.reject(e)}};var f=_.prototype;return f.getBearerToken=function(){try{var e={Authorization:"Basic "+Buffer.from(this.config.consumer_key+":"+this.config.consumer_secret).toString("base64"),"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"};return Promise.resolve(n("https://api.twitter.com/oauth2/token",{method:"POST",body:"grant_type=client_credentials",headers:e}).then(_._handleResponse))}catch(e){return Promise.reject(e)}},f.getRequestToken=function(e){try{var t=this,r={url:t.oauth+"/request_token",method:"POST"},s={};e&&(s={oauth_callback:e}),s&&(r.url+="?"+o.stringify(s));var a=t.client.toHeader(t.client.authorize(r,{}));return Promise.resolve(n(r.url,{method:"POST",headers:Object.assign({},l,a)}).then(_._handleResponseTextOrJson))}catch(e){return Promise.reject(e)}},f.getAccessToken=function(e){try{var t=this,r={url:t.oauth+"/access_token",method:"POST"},s={oauth_verifier:e.oauth_verifier,oauth_token:e.oauth_token};s.oauth_verifier&&s.oauth_token&&(r.url+="?"+o.stringify(s));var a=t.client.toHeader(t.client.authorize(r));return Promise.resolve(n(r.url,{method:"POST",headers:Object.assign({},l,a)}).then(_._handleResponseTextOrJson))}catch(e){return Promise.reject(e)}},f._makeRequest=function(e,t,r){var n={url:this.url+"/"+t+(this.config.extension?".json":""),method:e};return r&&("POST"===e?n.data=r:n.url+="?"+o.stringify(r)),{requestData:n,headers:"User"===this.authType?this.client.toHeader(this.client.authorize(n,this.token)):{Authorization:"Bearer "+this.config.bearer_token}}},f.get=function(e,t){var r=this._makeRequest("GET",e,t);return n(r.requestData.url,{headers:r.headers}).then(_._handleResponse)},f.createOauthSignature=function(e,t,r,n,o){var s={httpMethod:e,url:t,parameters:r,consumerSecret:n,tokenSecret:o};return{encodedSignature:a.generate(s.httpMethod,s.url,s.parameters,s.consumerSecret,s.tokenSecret),signature:a.generate(s.httpMethod,s.url,s.parameters,s.consumerSecret,s.tokenSecret,{encodeSignature:!1})}},f.generateNonce=function(){var e="0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~",t=[];return i(new Uint8Array(32)).forEach(function(r){return t.push(e[r%e.length])}),t.join("")},f.post=function(e,t){var r=this._makeRequest("POST",e,h.includes(e)?null:t),s=r.requestData,a=Object.assign({},l,r.headers);if(h.includes(e))t=JSON.stringify(t);else{if(d.includes(e)){var i=this.generateNonce(),u=Math.floor((new Date).getTime()/1e3),c=this.createOauthSignature("POST",s.url,{oauth_consumer_key:this.config.consumer_key,oauth_token:this.config.access_token_key,oauth_nonce:i,oauth_timestamp:u,oauth_signature_method:this.client.signature_method,oauth_version:this.client.version,media_data:t.media_data},this.config.consumer_secret,this.config.access_token_secret);t.oauth_consumer_key=this.config.consumer_key,t.oauth_nonce=i,t.oauth_signature=c.signature,t.oauth_signature_method=this.client.signature_method,t.oauth_timestamp=u,t.oauth_token=this.config.access_token_key,t.oauth_version=this.client.version}t=m(o.stringify(t)),a["Content-Type"]="application/x-www-form-urlencoded",d.includes(e)&&(a["Content-Transfer-Encoding"]="base64",delete a.Accept,delete a.Authorization)}return n(s.url,{method:"POST",headers:a,body:t}).then(_._handleResponse)},f.put=function(e,t,r){var o=this._makeRequest("PUT",e,t),s=o.requestData,a=Object.assign({},l,o.headers);return r=JSON.stringify(r),n(s.url,{method:"PUT",headers:a,body:r}).then(_._handleResponse)},f.stream=function(t,r){var a=this;if("User"!==this.authType)throw new Error("Streams require user context authentication");var i=new s,c={url:u("stream")+"/"+t+(this.config.extension?".json":""),method:"POST"};r&&(c.data=r);var h=this.client.toHeader(this.client.authorize(c,this.token));return n(c.url,{method:"POST",headers:e({},h,{"Content-Type":"application/x-www-form-urlencoded"}),body:m(o.stringify(r))}).then(function(e){i.destroy=a.stream.destroy=function(){return e.body.destroy()},e.ok?i.emit("start",e):(e._headers=e.headers,i.emit("error",e)),e.body.on("data",function(e){return i.parse(e)}).on("error",function(e){return i.emit("error",e)}).on("end",function(){return i.emit("end",e)})}).catch(function(e){return i.emit("error",e)}),i},_}();
//# sourceMappingURL=twitter.js.map
