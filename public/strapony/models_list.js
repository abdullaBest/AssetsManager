const root = this.el
const title = root.getAttribute('title')

let list = new Map()
let list_div_selected = null

//this.onselect
root.style.overflow ='auto'
root.style.height = 'calc(100% - 41px)'

this.add = (name)=>{
    let div = list.get(name) 
    if (!div){
        div = document.createElement('div')
        let span = document.createElement('span')
        div.appendChild(span)
        div.setAttribute('name',name)
        span.style.margin='1px 0 0 10px'
        span.innerText = name
        root.appendChild(div)
        list.set(name,div) 
        //
        div.addEventListener('click',div_select,false)
    }
}

this.remove = (name)=>{
    let div = list.get(name) 
    if (div){
        div.remove()
    }
}

const div_select = (e)=>{
    let d = e.target
    if (d.tagName==='SPAN'){
        d = d.parentNode
    }
    let name = d.getAttribute('name')
    let div = list.get(name)
    if (!div) { return }
    if (list_div_selected){
        list_div_selected.style.backgroundColor = ''
        list_div_selected.style.color = 'black'
    }

    list_div_selected = div
    list_div_selected.style.backgroundColor = 'blue'
    list_div_selected.style.color = 'white'
    
    if (this.onselect){
        this.onselect(name)
    }

}
