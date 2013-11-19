/** 
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*   TExpreso (Template Engine) - Oct/2013
*
* 	Requiere : nada :)
*
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*  Copyright © 2013 Jorge Colombo (Buenos Aires, Argentina); 
*  Licensed MIT 
*
*  contacto: jcolombo@ymail.com
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

(function (window) {
    'use strict';
	
	function TExpreso() { 

		var self 	= this,
			VERSION	= '1.2',
			rexp 	= { DBEG: '\\{\\{', DEND: '\\}\\}' },
			cache, MEM, rexpHlps;	
	
		this.reset = function() { 
			cache = {tpl: {}, hlp: {}};
			MEM = {};
			rexpHlps = {};
			self.addHelper('set', _h_set);	// built-in helper "set"
			self.addHelper('if', _h_if);	// built-in helper "if"
			self.addHelper('|', _h_bar);	// built-in helper "|"
			self.overwrite = false;			// sobrescribir templates ante .add() de uno ya registrado (default: false)
			self.VERSION = VERSION;
			self.ME = 'TExpreso v.'+VERSION;
		};

		/**
		 * Registrar template indicado y suministrado.  
		 * Una vez efectuado puede verificarse la string .error == '' para corroborar resultado satisfactorio (u obtener causa de error). 
		 *
		 * .add( tname , str [, overwrite] [, addInterceptor])	Returns: template compilado que si bien no tiene utilidad externizada, se puede usar en tests.
		 *		Compila y regista el template suministrado bajo el nombre indicado
		 *
		 * @param tname				template name con el que se registra
		 * @param str				source template a compilar
		 * @param overwrite			sobrescribirlo si ya estuviese registrado
		 * @param addInterceptor	function que recibe (y debe retornar) el source template antes de ser compilado (con o sin adaptaciones/reformas)
		 *							-> debe ser prototipeada como: function addInterceptor( tname, html ) y DEBE RETORNAR el html ya sea adaptado o no. 
		*/
		this.add = function(tname, str, overwrite, addInterceptor) {
			if (cache.tpl[tname] && !(overwrite||self.overwrite)) { console.info('try overwrite template: '+tname); return false;};
			self.tname = tname; self.error = '';  //actual template, reset error
			var tpl = typeof addInterceptor==='function' ? _parse( addInterceptor(tname,str) ) : _parse(str);
			if (tpl) cache.tpl[tname] = tpl; else if (cache.tpl[tname]) cache.tpl[tname] = undefined;  // (si ya existía set undefined si parser error)
			return tpl;
		};
		
		/**
		 * Registrar function helper.
		 * Una vez efectuado puede verificarse la string .error == '' para corroborar resultado satisfactorio (u obtener causa de error). 
		 *
		 * .addHelper( name , fn [, overwrite] )			Returns: no
		 *		Regista la function para ser usada en los templates
		 *
		 * @param name		name asociado con el que se registra y será usado en los templates
		 * @param fn		function
		 * @param overwrite	sobrescribirlo si ya estuviese registrado
		 * @param rexpp  	regex especial a aplicar en parseo de sus parámetros (ver ejemplo en "if")
		*/
		this.addHelper = function(name, fn, overwrite, rexpp) {
			var rv; self.tname = name; self.error = '';  //actual template, reset error
			if (typeof fn!=='function') _error('Invalid helper add');
			else if (cache.hlp[name] && !(overwrite||self.overwrite)) console.info('try overwrite helper: '+name);
			else { cache.hlp[name] = fn; rv = true; if (rexpp) rexpHlps[name] = rexpp; };
			return rv;
		};
		
		/**
		 * Renderizar template indicado y retorna el contenido html resultante.  
		 * Una vez efectuado puede verificarse la string .error == '' para corroborar resultado satisfactorio (u obtener causa de error). 
		 *
		 * .render( tname [, scope, retainMem] )				Returns: string-html renderizado
		 *		Renderiza el template indicado con "tname"
		 *
		 * @param tname		Template name previamente registado con .add(...)
		 * @param scope		data model a renderizar ( default: {} )
		 * @param retainMem	object de contenido de variables de template. O, true boolean si desea retener estado previo de las vars (default false).
		*/
		this.render = function(tname, scope, retainMem) {
			var tpl = cache.tpl[tname];
			self.tname = tname; self.error = '';  //actual template, reset error
			MEM = typeof retainMem=='object' ? retainMem : !retainMem ? MEM = {} : MEM;
			if (tpl) return _rend( tpl.T, (scope ? scope : {}) );
			_error('Template '+tname+' not found');
			return '';
		};

		/**
		 * Renderizar template y registrarlo si no existe (ver forma de llamadas). 
		 * Una vez efectuado puede verificarse la string .error == '' para corroborar resultado satisfactorio (u obtener causa de error). 
		 * 
		 * .express( sourceId, targetId, scope )		Returns: string-html renderizado
		 *		Renderiza en el tag id "targetId" el template contenido en el tag id "sourceId" <script>
		 *
		 * .express( sourceId, scope )					Returns: string-html renderizado
		 *		Renderiza el template contenido en el tag id "sourceId" <script>
		 *
		 * .express( sourceTemplate, scope )			Returns: string-html renderizado
		 *		Renderiza el template suministado en string "sourceTemplate" (supone uso del return)
		 *
		 * @param sourceId			tag id del contenedor <script> del template (id será además el template name). 
		 * @param targetId			tag id donde renderizar el template (sobrescribirá todo el contenido html).
		 * @param scope				data model a renderizar.
		 * @param sourceTemplate	contenido template
		 *					 
		*/
		this.express = function(arg1, arg2, arg3) {
			var sco = (arg3!==undefined ? arg3 : arg2), rv = '', e;
			self.tname = '???'; self.error = '';
			if (!/^[\w-:\.]+$/g.test(arg1)) return _rend( _parse(arg1)['T'], sco);
			if (!cache.tpl[arg1]) if ((e=window.document.getElementById(arg1))) { self.add(arg1, e.text); console.info('agrega '+arg1); };
			if ((rv=self.render(arg1, sco))) if ((e=window.document.getElementById(arg2))) e.innerHTML = rv;
			return rv;
		};

		/** Sólo para usar con tests */
		this.get = function(tname) { return cache.tpl[tname]; };

		/**
		 * Retorna true o false indicando si ya fue registrado el template (template o helper).
		 *
		 * .has( tname [, ttype] )			Returns: boolean
		 *
		 * @param tname		name asociado con el que se registra
		 * @param ttype		string con 'template' ó 'helper' (default: 'template')
		*/
		this.has = function(tname, ttype) { return (( ttype=='helper' ? cache.hlp[tname] : cache.tpl[tname] ) ? true : false ); };

		/**
		 * Retorna array de names de templates registrados (template o helper).
		 *
		 * .names( [ ttype ] )			Returns: array[string]
		 *
		 * @param ttype		string con 'template' ó 'helper' (default: 'template')
		*/
		this.names = function(ttype) { 
			var rv = [], obj = ttype=='helper' ? cache.hlp : cache.tpl;
			for (var i in obj) { rv.push(i); };
			return rv; 
		};

		/**
		 * Cambiar delimitador entre los posibles: {{ }}, [[ ]] ó (( )).
		 *
		 * .delimiter( [ s ] )			Returns: no
		 *
		 * @param s		string indicando: '{' ó '[' ó '(' (default: '{')
		*/
		this.delimiter = function(s) {
			if ( s=='[' || s==']' ) { rexp.DBEG = '\\[\\['; rexp.DEND = '\\]\\]'; } else if ( s=='(' || s==')' ) { rexp.DBEG = '\\(\\('; rexp.DEND = '\\)\\)'; } else { rexp.DBEG = '\\{\\{'; rexp.DEND = '\\}\\}'; };
		};
		
		/* ------------------------------------------------------------------ */
		/* ------------------------------------------------------------------ */
		
		function _rend (node, scope) {
			if (!node) return'';
			//_seeScope(scope);
			var buf = '';
			for (var i in node) {
				if (typeof node[i] === 'string') buf += _rendStr(node[i], scope);
				else {
					var ok = false, fn, op = node[i].op;  // op[0] es '#' o '^'
					if ( (fn=cache.hlp[op[1]]) ) { 
						// helper block  
						var t = function(sc){ return _rend(node[i].T, _doScope(sc,scope)); };
						var e = function(sc){ return node[i].E?_rend(node[i].E, _doScope(sc,scope)):''; };
						buf += fn( {T: t, E: e, op: op, s: scope, m: MEM, get: _get, _getx: _getx, _error: _error, cache: cache} );
						ok=true;
					} else {
						var x = op.length==2 ? _get(scope,op[1]) : null, inv = op[0]=='^';
						if ( ((!!x||x===0) && !inv)||((!x&&x!==0) && inv) ) { // por true/object/etc 
							if (x instanceof Array) {
								if (x.length>0) {
									for (var j in x) {
										var row = typeof x[j]==='object' ? x[j] : { '%content': x[j] }; 
										row['%index'] = parseInt(j); row['%row'] = parseInt(j)+1;  // buildin array vars (%index y %row)
										buf += _rend( node[i].T, _doScope(row,scope) );
									};
									ok=true;
								}
							} else {
								buf += _rend( node[i].T, ((x instanceof Object) ? _doScope(x,scope) : scope) ); // segun object o primitiva 
								ok=true;
							}	
						}
					};	
					if (!ok && node[i].E) { buf += _rend( node[i].E, scope ); } // !! por false
				}	
			};
			return buf;
		};
		
		function _rendStr(str, scope) {
			var pp, bp, np = 0;
			var buf = '', m, pat = new RegExp(rexp.DBEG+'\\s*[^'+rexp.DEND+']+\\s*'+rexp.DEND, 'gm');
			while ((m=pat.exec(str))) {
				pp = np; bp = m.index; np = m[0].length+m.index;
				buf += _rmvcms(str.substring(pp, bp));
				var op = _opMaker(str.substring(bp, np));
				if (op[0]==='>') {
					buf += self.render(op[1], scope, true);  // retain MEM
				} else {
					var fn, x = op.length==2 ? _get(scope,op[1]) : null;
					if (x||x===0) buf += x;
					else if ( (fn=cache.hlp[op[1]]) ) {	// helper no-block
						buf += fn( {op: op, s: scope, m: MEM, get: _get, _getx: _getx, _error: _error, cache: cache} );
					}
				}
			};
			return buf + _rmvcms(str.substring(np, str.length));
		};

		function _rmvcms(str) { return str.replace(/\/+\*.+?\*\//g,''); };
		
		function _doScope(loc, parent) {
			if (typeof parent==='object' && loc!==parent) loc['..'] = parent;
			return loc;
		};
		
		function _parse (str) {
			if (!str) return null;
			
			var node = _new(0), 
				curr = node,
				m, x, deep = 0, pp, bp, np = 0,
				pat = new RegExp(rexp.DBEG+'\\s*(end|else|[#\\^].+?)\\s*'+rexp.DEND, 'gm');
			
			function _xget() { return str.substring(pp, bp); };
			function _new(d, o) { return { d: d, op: o, f: -1 } };  // f (flag) -> -1=en fase T (x true), 255=en fase E (x else), 0-n= en fase I (x elseif n);  
			function _push(o, v) {
				if (!v) return;
				var ix = o.f < 0 ? 'T' : o.f < 255 ? 'I'+o.f : 'E';
				if (o[ix]===undefined) o[ix] = [v]; else o[ix].push( v );
			};
			
			curr.op = ['prog'];
			
			while ((m=pat.exec(str))) {
				pp = np; bp = m.index; np = m[0].length+m.index;
				x = _new( null, _opMaker(str.substring(bp, np)) ); 
				
				if (/\^|#/.test(x.op[0])) {
					_push( curr, _xget() ); 
					_push( curr, x ); 
					x.d = ++deep;
					x.p = curr;
					curr = x;
				} else if (x.op[1]==='else') {
					if (!curr || curr===undefined || curr.d==0 || curr.f>=255) { _error('invalid spare "else" for: '+(curr && curr.op[1]?curr.op[1]:'??')); return null; };
					_push( curr, _xget() ); 
					curr.f = 255;
				} else if (x.op[1]==='end') {
					_push( curr, _xget() ); 
					curr = curr.p;
					deep--;
					if (!curr) { _error('invalid spare "end"'); return null; };
				};
			};
			pp = np; bp = str.length;
			_push( curr, _xget() ); 
			if (!curr || curr.d>0) { _error('missing any "end"'); return null; };
			return node;
		};
		
		function _epat(s, pat) { 
			var c, arr = [];   
			while ((c=pat.exec(s))) { arr.push(c[0].trim()); };
			return arr;
		};
		
		function _opMaker( s ) {
			var rv, c, re = new RegExp(rexp.DBEG+'|'+rexp.DEND); 
			var arr = _epat( (s.split(re))[1], /"[^"]+?"|""|\s*[^"\s]+/g );  //parsear params con y sin comillas
			var b = arr.shift();
			if ((c=b.charAt(0)) && (c === '>' || c === '#' || c === '^')) { rv = [c]; if ((c=b.slice(1))) rv.push(c); } else { rv = ['', b]; };
			for (var i in arr) {
				if (!arr[i]) continue;
				if (rv.length==2 && (c=rexpHlps[rv[1]])) rv = rv.concat( _epat(arr[i],c) );  // si helper req rex propio
				else rv.push(arr[i]);
			};
			return rv;
		};

		/**
		 * Retorna el valor o contenido de una variable obtenida desde el object-scope suministrado.
		 *
		 * ._get( o, p )			Returns: valor
		 *
		 * @param o			object scope desde donde obtener el valor
		 * @param ttype		property (nombre, path completo de la variable)
		*/
		function _get(o,p) {
			var r, s, mem;
			try{
				if (p=='true') r = true;										//true
				else if (/^["'].+["']$/.test(p)) r = p.substring(1,p.length-1); //literal
				else if (/^\d+\.?\d*$/.test(p)) r = p;							//dígitos
				else if (/^[%\$\w][\w\.\$]*$/.test(p)) {						//en objs
					try{
						r = mem = p.charAt(0)=='$' ? MEM : o, s = p.split('.'); 
						for (var i in s) { r = r[s[i]]; }; 
					} catch(x){	r = undefined }; 
					if (r===undefined && mem['..']) r = _get(mem['..'], p); 	//** busca valor en parents (recursiva!)
				};
			} catch(x){}; 
			return r; 
		};
		
		function _getx(op, scope) {  
			var pars=[], ps = op.slice(2); //descartar 0-1 (mark y hlp name)
			for (var i in ps) { pars.push( _get(scope,ps[i]) || '' ); };
			return pars;
		};

		function _error(m) { self.error = m = '[ template: '+self.tname+' ] '+ m; console.error(m, ' '); };
		
		//  build-in helpers
		
		function _h_set(options) {
			var vals = options._getx( options.op, options.s );
			var sfx = function(p,v) { 
				if (/^\$\w+$/.test(p)) MEM[p] = v;
				else options._error('invalid var in "set": "'+p+'"');
			};
			if (typeof options.T=='function') {		// forma: {{#set key}} value... {{end}}
				sfx( (options.op[2]||''), options.T(options.s) );
			} else {								// forma: {{set key value}}  
				vals.shift(); 
				sfx( (options.op[2].replace('=','')||''), (vals.join('')||'') );
			};
			return '';
		};	

		function _h_if(options) {
			//forma: {{#if <conditions> }} .. [ {{else}} .. ] {{end}}
			//Nota: "if" no recorre ascendencia para obtener el valor de un objeto (como lo hace _get())
			var v;
			if (typeof options.T!=='function') { options._error('invalid "if" (should be #if)'); return''; };
			var rx = /[%\$a-z\.][\w\.\$]*|["'][^"]+?["']/ig;
			var x, cond='', pp, np=0, bp, m;
			try { // encabezar cada variable c/ "this."
				var expr = options.op.slice(2).join(' '); 
				while ((m=rx.exec(expr))) {
					pp = np; bp = m.index; np = m[0].length+m.index;
					cond += expr.substring(pp, bp);
					cond += ( /^[\."']|true|false|null|undefined|NaN|Infinity/.test(m[0]) ? '' : 'this.' ) + m[0];
				};
				cond = "return ("+ cond + expr.slice(np) +");";
				// crea function y la ejecuta (se evita uso de eval)
				var ctx = {}; 
				for (var i in options.s) { ctx[i] = options.s[i]; };
				for (var i in options.m) { ctx[i] = options.m[i]; };
				var nf = new Function(cond);
				v = nf.call(ctx);
			} catch(x) { 
				options._error(x+' (in "if" condition)');
			};
			return ( v ? options.T(options.s) : options.E(options.s) );
		};

		function _h_bar(options) {
			// forma: {{#| val}} noVal... {{end}} o forma: {{| val oVal1 oValn ...}}
			var rv = '', vals = options._getx( options.op, options.s );
			for(var i in vals) { if (vals[i] && typeof vals[i]!='object'){ rv = vals[i]; break;} };
			if (typeof options.T=='function' && !rv) rv = options.T(options.s);
			if (options.E) options._error('invalid "else" in bar helper "|"');
			return rv;
		};

		self.reset();
		
	};
	
	window.TExpreso = new TExpreso();
	
}(window));

/** 
* Decompila el template code desde el arbol de nodos (compilado).
* ej: code = logScript(.get('t1'));   // decompila sin reindentar
* ej: code = logScript(.get('t1'),'',true);  // decompila reindentando lindo!

	
function logScript(node, ind, reIndent) {		// solo para usarlo desde test
	var buf = '', xind = '', xlf = '';
	if (reIndent) { xind = '\t'; xlf = '\n'; };
	
	var ite = function(arr, ind) {
		for (var i in arr) {
			if (typeof arr[i]=='string') buf = buf + ind + arr[i] + xlf;
			else buf = buf + logScript(arr[i], ind, reIndent);
		}    
	};
	
	ind = ind || '';
	var h = node.op[0] === 'prog';
	var opx = [].concat(node.op);
	buf = buf + ( h ? '' : ind + '{{' + opx.shift() + opx.join(' ') + '}}' + xlf );
	ite( node.T, ind+(h?'':xind) );
	if (node.E) {
		buf = buf + ind + '{{else}}' + xlf;
		ite( node.E, ind+(h?'':xind) );
	};	
	buf = buf + ( h ? '' : ind + '{{end}}' + xlf );
	return buf;
};

		function _seeScope(sc) {
			console.info('---');
			for (var i in sc) {
				if (i=='..') console.info('..');
				else console.info(i +' = '+ (typeof sc[i]=='object'?'<parent>':sc[i]));
			}
		};

*/
