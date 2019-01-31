"use strict"

// глобальный объект в котором хранится структура
let $ = {
    _components:{}, // зарезервированная коллекция компанентов 
}

//   
class strapony {
    constructor(){
        this.el    = null
        this._call = null
        this._list = null
    }
    // добавляет шаблон в элемент
    set(id,a){
        if (this._list===null){
            this._list = new Map()
        }
        let b = this._list.get(id)
        if (b===undefined){
            b = a.el.cloneNode(false)
            a._call(b)
            this._list.set(id,b)
            this.el.appendChild(b)
        }else{
            a._call(b)
        }
        return b
    }
    // получаем элемент сгененрированный по шаблону
    get(id){
        if (this._list===null){ return null }
        let b = this._list.get(id)
        if (b===undefined){ return null }
        return b
    }
    // удаляет шаблон из элемента
    del(id){
        if (this._list!==null){
            let b = this._list.get(id)
            if (b!==undefined){
                b.parentNode.removeChild(b)
                this._list.delete(id)
            }
        }
    }
    // удаляет все созданные шаблоны
    clear(){
        if (this._list===null){return}
        for (let a of this._list){
           a[1].parentNode.removeChild(a[1])
           this._list.delete(a[0])
        }    
    }
    // назначает событие на дочерние элементы
    func(query,event,f){
        let l = this.el.querySelectorAll(query)
        for (let i=0;i<l.length;i++){
            let a = l[i]   
            a.dataset[f.name] = i
            a[event] = f
        }
    }
    //
    hide(){
        for (let i in this){
            if (this[i] instanceof strapony && this[i].el!==null){
                this[i].el.style.display = 'none'
            }
        }
    }
    show(){
        for (let i in this){
            if (this[i] instanceof strapony && this[i].el!==null){
                this[i].el.style.display = 'block'
            }
        }
    }
}

$.prepare = new Promise((resolve,reject)=>{ // подготовка
    // проходим по все элементам dom дерева и собираем только с выставленным атрибутом id
    let component_list = []
    let component_count = 0
    let l = document.querySelectorAll('*[id]')
    for (let j=0;j<l.length;j++){
        let el = l[j]
        let s = el.id.split('.')   // разбиваем идентификатор на несколько
        if (s.length===0){ continue }
        let a = $
        // дополняем название, если встретили короткую запись до дополняем id до полной записи
        if (s[0].length===0){
            let parent = el.parentNode
            while (parent!==null){
                if (parent.id!==undefined && parent.id!=='' && parent.id[0]!=='.'){
                    el.id = parent.id + el.id
                    s = el.id.split('.')
                    break
                }
                parent = parent.parentNode
            }
        }
        // заполняем
        for (let i=0;i<s.length;i++){
            let name = s[i]
            let b = a[name]
            if (b===undefined){     
                b = new strapony()
                a[name] = b
            }
            a = b
        }
        a.el = el
        // обрабатываем шаблоны
        if (s[0]==='TPL'){ 
            el.parentNode.removeChild(el)  // убераем его из документа
            el.removeAttribute('id')       // убераем атрибут id
            let s = el.innerHTML.replace(/`/g,'\\u0060').replace(/'/g,'\\u0027') // заменяем кавычки на юникод
            // создаем функцию шаблонизатора для достижения максимальной производительности
            a._call = new Function('d','d.innerHTML=`' + s + '`;')
        }
        // загружаем компоненты и запускаем их в работу
        const component = el.getAttribute('component')
        if (component){
            component_list.push(a)
            if (!$._components[component]){
                component_count = component_count + 1
                $._components[component] = fetch('/strapony/'+component+'.js')
                .then(response=>response.text())
                .then(text=>{
                    $._components[component] = new Function('"use strict";'+text)
                }).catch(err=>{
                    console.log(err)
                }).finally(()=>{
                    component_count = component_count - 1
                    if (component_count===0){
                        component_list.forEach(obj=>{
                            const component = obj.el.getAttribute('component')
                            if ($._components[component]){
                                obj._component = $._components[component].bind(obj)
                                obj._component()
                            }
                        })
                        resolve()
                    }
                })
            }    
        }
    }
})


document.addEventListener("load", event =>
  {
    $.prepare.then()
  }, true);
