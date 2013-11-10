/** 
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*   jQuery TExpreso plugin - Oct/2013
*
* 	Requiere :
*		jQuery	1.5+
*		TExpreso - 1.0+
*
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*  Copyright © 2013 Jorge Colombo (Buenos Aires, Argentina); 
*  Licensed MIT 
*
*  contacto: jcolombo@ymail.com
* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*	
*/

/* jQuery, window */
(function ($, window) {
    'use strict';
	
    var VERSION = '1.1',
		urls = [],	
		ATTR_TPL_NAME = 'data-te-name',
		ATTR_TPL_TYPE = 'data-te-type',
		options = {
			addInterceptor: null,		// Nota: debe ser prototipeada como: function addInterceptor( tname, html ) y DEBE RETORNAR el html ya sea adaptado o no. 
			templateType: 'text/html',	// El attrib 'type' para denotar que el contenido es un partial template en el DOM, ej: <script type="text/html" id="miTemplate"></script>
		};

	function getTExpreso() { 
		if (window.TExpreso == undefined) { $.error("Failed to obtain TExpreso v1.x, you must load it!"); return; };
		return window.TExpreso;
	};

	function has(tname, ttype) { return getTExpreso().has(tname, ttype); };
	
	function hasUrl(tname) { return urls.indexOf(tname) >= 0 };

	/** 
	* Devuelve string con info textual del estado
	*/
	function getStatsInfo() { 
		var af = function(x) { x=x?x:'template'; var ns = getTExpreso().names(x); return x+'s: '+( ns.length>0 ? ns.length+' ['+ns.join(', ')+']' : '(no)' ); };
		return $.TExpreso.ME + ' >> '+af()+', '+af('helper');
	};
	
	/**
	* Cargar template/helper desde string 
	*/
	function addFromString(tname, thtml, ttype, overwrite) {
		var rv;
		if (tname && ttype && thtml) {
			if (ttype=='helper') rv = getTExpreso().addHelper( tname, eval(thtml), overwrite );
			else rv = getTExpreso().add( tname, thtml, overwrite, options.addInterceptor );
		};
		return !!rv ? 1 : 0;
	};
	
	/**  
	* Cargar el archivo de url suministrado y agregar todos los templates y/o helpers ubicados en él.
	* Los archivos pueden contener uno o más templates de la forma <script type="text/html" id="miTemplate">...</script>
	* Si el <script> indica attr: data-te-name='xxxxx' se tomará su valor como nombre del template/helper.
	* Si el <script> indica attr: data-te-type='helper' se tomará su contenido como helper (debe ser function anonima).
	*/
	function addFromUrl(url, doit, overwrite) {
		if (!url || ( !overwrite && hasUrl(url))) { // antes ver si ya fue cargado el url
			if (doit) doit(0); return; 
		};  
		var cant=0;
		return $.ajax({
				url: url,
				dataType: 'text', 
			}).done(function (d) {
				$(d).filter('script').each(function (i,el) {
					var rv=false, id = $(el).attr(ATTR_TPL_NAME), ttype = $(el).attr(ATTR_TPL_TYPE);
					if (ttype=='helper') rv = getTExpreso().addHelper( (id?id:el.id), eval($(el).html()), overwrite );
					else rv = getTExpreso().add( (id?id:el.id), $(el).html(), overwrite, options.addInterceptor );
					if (rv) cant++;	// rv indica si TExpreso efectuó el add
				});
			}).always(function() {
				urls.push(url);
				if (doit) doit(cant,url);
			});
	};

	/**  
	* Agregar el template indicado en id o bien todos los templates ubicados en el DOM.
	* Los templates registados son por defecto del tipo 'template', salvo que se le indique
	* attr: data-te-type='helper'.
	*
	* @param id		tag id del <script> template a registrar (default: buscar todos en el DOM)
	*/
	function addFromDom( id ) {
		var _normalize = function(e) {
			if (e.tagName!=='SCRIPT') {  
				// reemplazar por SCRIPT los [data-template] si no lo son.
				// Nota: no es posible setear simplemente "display:none;" (hide) dado q los eventos escuchados (onClick/onChange) se repetirian para estos div/span/sections/etc. tambien. 
				var $scr = $('<script type="'+ options.templateType +'">');
				$scr.html($(e).html());
				var dn = $(e).attr(ATTR_TPL_NAME), dt = $(e).attr(ATTR_TPL_TYPE), id = e.id;
				$(e).remove();
				$scr.attr('id',id);
				if (dn) $scr.attr(ATTR_TPL_NAME, dn);
				if (dt) $scr.attr(ATTR_TPL_TYPE, dt);
				$('body').append($scr);
			}
		};
		
		// si se indicó param 'id' solo registrar ese, sino todos los ubicados en el DOM
		var cant = 0, ids = id ? [ id ] : $('script[type="'+options.templateType+'"]').map( function () { _normalize(this); return this.id; } );

		$.each(ids, function() {
			var rv, el = document.getElementById(this);
            if (el === null) $.error('script id not found: #' + this);
            else {
				if ( $(el).attr(ATTR_TPL_TYPE) == 'helper') rv = getTExpreso().addHelper( this, eval($(el).html()) );
				else rv = getTExpreso().add( this, $(el).html(), false, options.addInterceptor );
				if (rv) cant++;	// rv indica si TExpreso efectuó el add
            }
		});
		
		return cant;		// cantidad de templates/etc efectivamente agregada
	};
	
	/** ----------------------------------------- */
	/** Exponer public methods en jQuery.TExpreso */
	/** ----------------------------------------- */
	
	$.TExpreso = {
		VERSION: VERSION,
		ME: 'jQuery TExpreso v.'+VERSION+' ( '+getTExpreso().ME+' )',
		setAddInterceptor: function(fn){ options.addInterceptor=fn; },	// ver options por su prototype
		addFromString: addFromString, 									//(templateName, templateType, html)
		addFromDom: addFromDom,
		addFromUrl: addFromUrl,											//(url,[doitCallBack])
		getStatsInfo: getStatsInfo,
		getNames: getTExpreso().names,									// ( [ ttype ] ) "template" | "helper" (default: "template")
		has: has,
		hasUrl: hasUrl,
	};

	/** 
	 * JQuery Plugin: Renderizar template c/ data model suministrado en los elementos subyacentes.
	 *
	 * @param tpl			nombre del template a renderizar (debe estar previamente registrado)
	 * @param data			scope con data model
	 * @param retainMem		object de contenido de variables de template. O, true (boolean) si desea retener estado previo de las variables (default: false).
	*/
	$.fn.texpreso = function (tpl, data, retainMem) {
		var inst = getTExpreso();
		return this.each( function () {
			$(this).html( inst.render( tpl, data, retainMem ) ); 
		});
	};
	$.fn.TExpreso = $.fn.texpreso;  // sinonimo en minusc
	
}(jQuery, window));
