const root = this.el
const title = root.getAttribute('title')
const content = root.children[0]

let left = root.getAttribute('left')
let top = root.getAttribute('top')
let width = root.getAttribute('width')
let height = root.getAttribute('height')

let div_title = document.createElement('div')
div_title.style.width='100%'
div_title.style.height='20px'
div_title.style.backgroundColor='blue'
div_title.style.color='white'
div_title.style.fontFamily = 'monospace'
div_title.style.fontSize = '16px'
let div_title_span = document.createElement('span')
div_title_span.style.margin = '0 0 0 20px'
div_title_span.innerText = title
div_title.appendChild(div_title_span)

root.style.position = 'absolute'
root.style.backgroundColor = '#a5a5a5'
root.style.left = left+'px'
root.style.top = top+'px'
root.style.width = width+'px'
root.style.height = height+'px'
root.prepend(div_title)


function getCoords(elem) {   // кроме IE8-
  let box = elem.getBoundingClientRect();
  return {
    top: box.top + pageYOffset,
    left: box.left + pageXOffset
  }
}

div_title.onmousedown = function(e) {

  let coords = getCoords(div_title);
  let shiftX = e.pageX - coords.left;
  let shiftY = e.pageY - coords.top;

  function moveAt(e) {
    let x = e.pageX - shiftX
    let y = e.pageY - shiftY
    if (x<0) { x=0 }
    if (y<0) { y=0 }

    root.style.left = x + 'px';
    root.style.top = y + 'px';
  }

  document.onmousemove = function(e) {
    moveAt(e);
  }

  div_title.onmouseup = function() {
    document.onmousemove = null;
    div_title.onmouseup = null;
  }

}

div_title.ondragstart = function() {
  return false;
}

