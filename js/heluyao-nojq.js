var Mustache=(typeof module!=="undefined"&&module.exports)||{};(function(exports){exports.name="mustache.js";exports.version="0.5.0-dev";exports.tags=["{{","}}"];exports.parse=parse;exports.compile=compile;exports.render=render;exports.clearCache=clearCache;exports.to_html=function(template,view,partials,send){var result=render(template,view,partials);if(typeof send==="function"){send(result)}else{return result}};var _toString=Object.prototype.toString;var _isArray=Array.isArray;var _forEach=Array.prototype.forEach;var _trim=String.prototype.trim;var isArray;if(_isArray){isArray=_isArray}else{isArray=function(obj){return _toString.call(obj)==="[object Array]"}}var forEach;if(_forEach){forEach=function(obj,callback,scope){return _forEach.call(obj,callback,scope)}}else{forEach=function(obj,callback,scope){for(var i=0,len=obj.length;i<len;++i){callback.call(scope,obj[i],i,obj)}}}var spaceRe=/^\s*$/;function isWhitespace(string){return spaceRe.test(string)}var trim;if(_trim){trim=function(string){return string==null?"":_trim.call(string)}}else{var trimLeft,trimRight;if(isWhitespace("\xA0")){trimLeft=/^\s+/;trimRight=/\s+$/}else{trimLeft=/^[\s\xA0]+/;trimRight=/[\s\xA0]+$/}trim=function(string){return string==null?"":String(string).replace(trimLeft,"").replace(trimRight,"")}}var escapeMap={"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#39;'};function escapeHTML(string){return String(string).replace(/&(?!\w+;)|[<>"']/g,function(s){return escapeMap[s]||s})}function debug(e,template,line,file){file=file||"<template>";var lines=template.split("\n"),start=Math.max(line-3,0),end=Math.min(lines.length,line+3),context=lines.slice(start,end);var c;for(var i=0,len=context.length;i<len;++i){c=i+start+1;context[i]=(c===line?" >> ":"    ")+context[i]}e.template=template;e.line=line;e.file=file;e.message=[file+":"+line,context.join("\n"),"",e.message].join("\n");return e}function lookup(name,stack,defaultValue){if(name==="."){return stack[stack.length-1]}var names=name.split(".");var lastIndex=names.length-1;var target=names[lastIndex];var value,context,i=stack.length,j,localStack;while(i){localStack=stack.slice(0);context=stack[--i];j=0;while(j<lastIndex){context=context[names[j++]];if(context==null){break}localStack.push(context)}if(context&&typeof context==="object"&&target in context){value=context[target];break}}if(typeof value==="function"){value=value.call(localStack[localStack.length-1])}if(value==null){return defaultValue}return value}function renderSection(name,stack,callback,inverted){var buffer="";var value=lookup(name,stack);if(inverted){if(value==null||value===false||(isArray(value)&&value.length===0)){buffer+=callback()}}else if(isArray(value)){forEach(value,function(value){stack.push(value);buffer+=callback();stack.pop()})}else if(typeof value==="object"){stack.push(value);buffer+=callback();stack.pop()}else if(typeof value==="function"){var scope=stack[stack.length-1];var scopedRender=function(template){return render(template,scope)};buffer+=value.call(scope,callback(),scopedRender)||""}else if(value){buffer+=callback()}return buffer}function parse(template,options){options=options||{};var tags=options.tags||exports.tags,openTag=tags[0],closeTag=tags[tags.length-1];var code=['var buffer = "";',"\nvar line = 1;","\ntry {",'\nbuffer += "'];var spaces=[],hasTag=false,nonSpace=false;var stripSpace=function(){if(hasTag&&!nonSpace&&!options.space){while(spaces.length){code.splice(spaces.pop(),1)}}else{spaces=[]}hasTag=false;nonSpace=false};var sectionStack=[],updateLine,nextOpenTag,nextCloseTag;var setTags=function(source){tags=trim(source).split(/\s+/);nextOpenTag=tags[0];nextCloseTag=tags[tags.length-1]};var includePartial=function(source){code.push('";',updateLine,'\nvar partial = partials["'+trim(source)+'"];','\nif (partial) {','\n  buffer += render(partial,stack[stack.length - 1],partials);','\n}','\nbuffer += "')};var openSection=function(source,inverted){var name=trim(source);if(name===""){throw debug(new Error("Section name may not be empty"),template,line,options.file)}sectionStack.push({name:name,inverted:inverted});code.push('";',updateLine,'\nvar name = "'+name+'";','\nvar callback = (function () {','\n  return function () {','\n    var buffer = "";','\nbuffer += "')};var openInvertedSection=function(source){openSection(source,true)};var closeSection=function(source){var name=trim(source);var openName=sectionStack.length!=0&&sectionStack[sectionStack.length-1].name;if(!openName||name!=openName){throw debug(new Error('Section named "'+name+'" was never opened'),template,line,options.file)}var section=sectionStack.pop();code.push('";','\n    return buffer;','\n  };','\n})();');if(section.inverted){code.push("\nbuffer += renderSection(name,stack,callback,true);")}else{code.push("\nbuffer += renderSection(name,stack,callback);")}code.push('\nbuffer += "')};var sendPlain=function(source){code.push('";',updateLine,'\nbuffer += lookup("'+trim(source)+'",stack,"");','\nbuffer += "')};var sendEscaped=function(source){code.push('";',updateLine,'\nbuffer += escapeHTML(lookup("'+trim(source)+'",stack,""));','\nbuffer += "')};var line=1,c,callback;for(var i=0,len=template.length;i<len;++i){if(template.slice(i,i+openTag.length)===openTag){i+=openTag.length;c=template.substr(i,1);updateLine='\nline = '+line+';';nextOpenTag=openTag;nextCloseTag=closeTag;hasTag=true;switch(c){case"!":i++;callback=null;break;case"=":i++;closeTag="="+closeTag;callback=setTags;break;case">":i++;callback=includePartial;break;case"#":i++;callback=openSection;break;case"^":i++;callback=openInvertedSection;break;case"/":i++;callback=closeSection;break;case"{":closeTag="}"+closeTag;case"&":i++;nonSpace=true;callback=sendPlain;break;default:nonSpace=true;callback=sendEscaped}var end=template.indexOf(closeTag,i);if(end===-1){throw debug(new Error('Tag "'+openTag+'" was not closed properly'),template,line,options.file)}var source=template.substring(i,end);if(callback){callback(source)}var n=0;while(~(n=source.indexOf("\n",n))){line++;n++}i=end+closeTag.length-1;openTag=nextOpenTag;closeTag=nextCloseTag}else{c=template.substr(i,1);switch(c){case'"':case"\\":nonSpace=true;code.push("\\"+c);break;case"\r":break;case"\n":spaces.push(code.length);code.push("\\n");stripSpace();line++;break;default:if(isWhitespace(c)){spaces.push(code.length)}else{nonSpace=true}code.push(c)}}}if(sectionStack.length!=0){throw debug(new Error('Section "'+sectionStack[sectionStack.length-1].name+'" was not closed properly'),template,line,options.file)}stripSpace();code.push('";',"\nreturn buffer;","\n} catch (e) { throw {error: e, line: line}; }");var body=code.join("").replace(/buffer \+= "";\n/g,"");if(options.debug){if(typeof console!="undefined"&&console.log){console.log(body)}else if(typeof print==="function"){print(body)}}return body}function _compile(template,options){var args="view,partials,stack,lookup,escapeHTML,renderSection,render";var body=parse(template,options);var fn=new Function(args,body);return function(view,partials){partials=partials||{};var stack=[view];try{return fn(view,partials,stack,lookup,escapeHTML,renderSection,render)}catch(e){throw debug(e.error,template,e.line,options.file)}}}var _cache={};function clearCache(){_cache={}}function compile(template,options){options=options||{};if(options.cache!==false){if(!_cache[template]){_cache[template]=_compile(template,options)}return _cache[template]}return _compile(template,options)}function render(template,view,partials){return compile(template)(view,partials)}})(Mustache);

var loadDataClass = function(){
	var localDB = null;
	var obj={
		openDB:function(){
			try {  
				if (!window.openDatabase) {  
					obj.updateStatus("Error: DB not supported");
				}  
				else {  
					obj.initDB();
				}
			}catch (e) {  
				if (e == 2) {
					obj.updateStatus("Error: Invalid database version.");  
				}  
				else {  
					obj.updateStatus("Error: Unknown error " + e + ".");  
				}  
				return;  
			}
		},
		initDB:function(){
			var shortName = 'heluyaoDB';
			var version = '1.0';
			var displayName = 'MyHeluyaoDB';
			var maxSize = 5242880;
			localDB = window.openDatabase(shortName, version, displayName, maxSize);
		},
		createTables:function(){
			var query = 'CREATE TABLE IF NOT EXISTS articles(id INTEGER NOT NULL PRIMARY KEY, title TEXT,byline TEXT,content TEXT,details TEXT);';  
			try {  
				localDB.transaction(function(transaction){
					transaction.executeSql(query, [], obj.nullDataHandler, obj.errorHandler);
					obj.updateStatus("Table 'articles' is present");  
				});  
			}   
			catch(e){
				obj.updateStatus("Error: Unable to create table 'articles' " + e + ".");
				return;
			}
		},
		onCreate:function(a_id,title,byline,content,details){
			if (a_id === ""){  
				obj.updateStatus("Error: 'id' are required fields!");  
			}else{  
				var query = "insert into articles (id,title,byline,content,details) VALUES (?, ?, ?, ?, ?);";
				try{  
					localDB.transaction(function(transaction){  
						transaction.executeSql(query, [a_id,title,byline,content,details], function(transaction, results){  
							if (!results.rowsAffected) {  
								obj.updateStatus("Error: No rows affected.");  
							}else {  
								obj.updateStatus("Inserted row with id " + results.insertId);  
							}
						}, obj.errorHandler);  
					});  
				}catch (e) {  
					obj.updateStatus("Error: Unable to perform an INSERT " + e + ".");  
				}
			}
		},
		getRow:function(id){
			try {  
				localDB.transaction(function(transaction){
					transaction.executeSql("SELECT * FROM Articles where id=?;", [id], function(transaction, results){
						var row = results.rows.item(0);
						var obj = {},details='',json;
						details = row['details'];
						if(details !== ''){
							json = JSON.parse(details);
						}
						obj.date = json.date;
						obj.keywords = json.keywords;
						obj.title = row['title'];
						obj.byline = row['byline'];
						obj.content = row['content'];
						OfflineAPP.showArticles(obj);
					},function(transaction, error){
						console.info("Error: " + error.code + "<br>Message: " + error.message);
					});
				});
			}catch(e){
				console.info("Error: Unable to select data from the db " + e + ".");
			}
		},
		errorHandler:function(transaction,error){
			obj.updateStatus("Error: " + error.message);
			return true;
		},
		nullDataHandler:function(transaction, results){},
		updateStatus:function(status){
			console.info( status);
		}
	}
	return obj;
}();

var OfflineAPP = function(){
	var that = this,
		tpl_list = "tpl-list",
		tpl_content = "tpl-articles",
		wrap_list = "wrap-list";
		wrap_content = "wrap-articles";
	
	this.init = function(){
		loadDataClass.openDB();
		if(ls.isoffline()){
			that.render();
		}else{
			if('1'!==ls.get('is_create_table')){
				ls.set('is_create_table','1');
				loadDataClass.createTables();
			}
			that.updata();
		}
	}
	this.updata = function(){
		var json,time = new Date().getTime(),ls_json = {"storylist":{}};
		if(d=ls.get('data-jsn')){
			json = JSON.parse(d);
			that.render(json);
		}else{
			h('js/data.js',{
				error:function(){
					window.setTimeout(function(){
						console.info('error');
					},1E3)
				},
				success:function(a){
					setTimeout(function(){
						json = JSON.parse(a);
						for(var i=0,len=json.articles.length;i<len;i++){
							ls.set('updata_time',time);
							ls_json["storylist"][json.articles[i].id] = {"id":json.articles[i].id,"title":json.articles[i].title,"snip":json.articles[i].snip,"date":json.articles[i].details.date};
							loadDataClass.onCreate(json.articles[i].id,json.articles[i].title,json.articles[i].byline,json.articles[i].content,JSON.stringify(json.articles[i].details));
						}
						ls.set('data-jsn',JSON.stringify(ls_json));
						that.render(ls_json);
					},100);
				}
			});
		}
	}
	this.getArticles=function(id){
		window.history&&window.history.pushState(null, '', '#'+id);
		loadDataClass.getRow(id);
	}
	this.showArticles = function(obj){
		var content = document.getElementById(tpl_content),
		wrapper_content = document.getElementById(wrap_content),
		TPL = content.innerHTML.replace(/[\n\t\r]/g, '');
		typeof obj === 'object'&&(wrapper_content.innerHTML = Mustache.to_html(TPL, obj));
	}
	this.render = function(json){
		var d;
		typeof json === 'object'?r():(function(){if(d=localStorage.getItem('data-jsn')){json = JSON.parse(d);r();}else{errorHandler('没有可用数据');}})();
		function r(){
			var obj = {},
				TPL = document.getElementById(tpl_list).innerHTML.replace(/[\n\t\r]/g, '');
			for(var i in json['storylist']){
				obj.id = json['storylist'][i].id;
				obj.title = json['storylist'][i].title;
				obj.snip = json['storylist'][i].snip;
				obj.date = json['storylist'][i].date;
				document.getElementById(wrap_list).innerHTML += Mustache.to_html(TPL, obj);
			}
		}
	}
	return {
		init:init,
		getArticles:getArticles,
		showArticles:showArticles
	}
}();