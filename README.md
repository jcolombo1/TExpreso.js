# TExpreso.js

Liviano y veloz renderizador de datos a través de plantillas (Template Engine) similar a Handlebars y Mustache, pero con el agregado de "variables" para facilitar su lógica de ensamble.
A diferencia de los anteriores, cuenta con estructuras if..else..end, además de auto-path del contexto de datos y bloques auto-condicionales y auto-iterativos. 
Es súmamente simple de usar y al igual que Handlebars permite embeber funciones "helpers".

Incluye un plugin de jQuery (jquery.TExpreso.js) que facilita tanto la carga de templates y helpers desde urls remotas, como también su renderización dentro de elementos html.

Sin mostrar aún los métodos de renderizado, veamos un par de ejemplos sólo de <b>templates + datos</b> para entender su funcionalidad...
<em>Nota: Estos ejemplos están en el archivo "example.html" -puede observarlo en el explorador-)</em>

<b>Ejemplo 1:</b> 
  
  *Este pequeño template:*<br>
```html
  <p>{{saludo}} {{ nombre }} ! </p>
```
  *al renderizarlo con el siguiente contexto de datos:*
```html
var datos = { nombre: "Jorge", saludo: "Buenos días" };
```
  *el resultado será:*<br>
```html
<p>Buenos días Jorge ! </p>
```
  
  
<b>Ejemplo 2:</b> 

```html
<!-- Template -->

<div class='personsClass'>
  {{# if persons.length > 0 }}
  
	<ul>
		{{# persons }}
			<li> <b>{{firstName}} {{lastName}}</b> vive en {{address.city}} </li> 
		{{ end }}  
	</ul>
	<p>Hay {{persons.length}} personas</p>
	
  {{ else }}
     <p>No hay personas!</p>
  {{ end }}  
</div>
```
  *al renderizarlo con el siguiente contexto de datos:*
```html
<!-- ... contexto de datos a renderizar: -->
var myContext = {
  persons: [
    { firstName: 'Jorge', lastName: 'Colombo', address: { city: 'Los Polvorines', province: 'BA' }  },
    { firstName: 'Patry', lastName: 'Gutierrez', address: { city: 'Los Polvorines', province: 'BA' }  },
  ]
};
```
  *el resultado será:*<br>
```html
<div class='personsClass'>
  <ul>
      <li> <b>Jorge Colombo</b> vive en Los Polvorines </li> 
      <li> <b>Patry Gutierrez</b> vive en Los Polvorines </li> 
  </ul>
  <p>Hay 2 personas</p>
</div>
```
  *Pero, al renderizarlo con este contexto:*
```html
var myContext = { persons: [] };
```
  *el resultado será entonces:*<br>
```html
<div class='personsClass'>
  <p>No hay personas!</p>
</div>
```

/// continuará ...
