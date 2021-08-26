// Lưu dữ liệu vào LocalStorage
const TODOS_STORAGE_KEY = 'TODOS'
const storage = { 
    //lấy ra được dữ liệu trong localStorage
    get() {
        return JSON.parse(localStorage.getItem(TODOS_STORAGE_KEY)) || []
    },
    // Gán dữ liệu vào LocalStorage
    //LocalStorage chỉ cho phép chúng ta lưu biến với kiểu String, vì vậy để lưu Object hoặc Array ta có thể convert sang Json.
    set(todos) {
        localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos))  
    }
}

// Dữ liệu mặc định của Store
/*
const init = {
    todos: [
        {
            title: 'Learn',
            completed: false,
        }
    ]
}
*/
const init = {
    todos: storage.get(),  // lấy dữ liệu từ localStorage
    filter: 'all',
    filters: {
        all: () => true,
        active: todo => !todo.completed,
        completed: todo => todo.completed
    },
    editIndex: null,
}

// Reducer()
const actions = {
    add({ todos }, title) {
        if(title) {
            todos.push({title, completed: false})
            storage.set(todos) // lưu dữ liệu vào LocalStorage
        }
    },
    toggle({ todos }, index) {
        const todo = todos[index]
        todo.completed = !todo.completed
        storage.set(todos)
    },
    toggleAll({ todos }, completed) {
        todos.forEach(todo => todo.completed = completed)
        storage.set(todos)
    },
    destroy({ todos}, index) {
        todos.splice(index, 1)
        storage.set(todos)
    },
    switchFilter(state, filter) {
        state.filter = filter
    },
    clearCompleted(state) {
        state.todos = state.todos.filter(state.filters.active);
        storage.set(state.todos)
    },
    startEdit(state, index) {
        state.editIndex = index
    },
    endEdit(state, title) {
        if(state.editIndex !== null) {
            if(title) {
                state.todos[state.editIndex].title = title
                storage.set(state.todos)
            } else {
                this.destroy(state, state.editIndex)
            }
            state.editIndex = null
        }
    },
    canceEdit(state) {
        state.editIndex = null
    }
}
// console.log(actions['add'])
function reducer(state = init, action, args)  {
    actions[action] && actions[action](state, ...args)      
    return state
}


//logger: phần mềm trung gian console
function withLogger(reducer) {
    return (prevstate, action, args) => {
        console.group(action)
        console.log("Prev State:", prevstate)
        console.log("Prev arguments:", args)
        const nextState = reducer(prevstate, action, args)

        console.log("Next state",nextState)
        console.groupEnd(action)
        return nextState

    }
}

// CreateSrore
function html([first, ...strings], ...values) {
    return values.reduce(
        (acc, cur) => acc.concat(cur, strings.shift()),
        [first]
    )
    .filter(x => x && x !== true || x === 0)
    .join('')
}

function createStore(reducer) {
    let state = reducer()
    const roots = new Map()
    function render() {
        for(const [root, component] of roots) {
            const output = component() //connect()(App)(....)
            root.innerHTML = output
        }
    }
    return {
        //
        attach(component, root) {
            roots.set(root, component)
            render()
        },
        connect(selector = state => state) { 
            return component => (props, ...args) => 
            component(Object.assign({}, props, selector(state), ...args))
        },
        dispatch(action, ...args) {
            state = reducer(state, action, args)
            render()
        }
    }
}

// Store
const { attach, connect, dispatch} = createStore(withLogger(reducer))
window.dispatch = dispatch

//Html
function Header() {
    return html`
        <header class="header">
			<h1>todos</h1>
			<input 
                class="new-todo" placeholder="What needs to be done?" autofocus
                onkeyup="event.keyCode === 13 && dispatch('add', this.value.trim())">
		</header>
    `
}

function TodoItem({ todo, index, editIndex }) {
    // console.log(todo)
    return html`
        <li class="${todo.completed && 'completed'} ${editIndex === index && 'editing'}">
            <div class="view">
                <input class="toggle" type="checkbox"  ${todo.completed && 'checked'} onchange="dispatch('toggle', ${index})">

                <label ondblclick="dispatch('startEdit', ${index})">${todo.title}</label>

                <button class="destroy" onclick="dispatch('destroy', ${index})"></button>
            </div>

            <input class="edit" 
                value="${todo.title}" onkeyup="event.keyCode === 13 && dispatch('endEdit', this.value.trim()) || event.keyCode === 27 && dispatch('canceEdit')"
                onblur="dispatch('endEdit', this.value.trim())">
        </li>
    `
}

function TodoList({ todos, filter, filters }) {
    // Destrucsring: {todos} = props
    // console.log(props)
    return html`
        <section class="main">
            <input id="toggle-all" class="toggle-all" type="checkbox" onchange="dispatch('toggleAll', this.checked)"
            ${todos.every(filters.completed) && 'checked'}>

            <label for="toggle-all">Mark all as complete</label>

            <ul class="todo-list">
                ${todos.filter(filters[filter]).map((todo, index) => connect()(TodoItem)({ todo, index }))}
            </ul>
		</section>
    `
}
// connect()(TodoList)

function Footer({ todos, filter, filters }) {
    return html`
        <footer class="footer">
            <span class="todo-count">
                <strong>${todos.filter(filters.active).length}</strong>
                 item left
            </span>
            <ul class="filters">
                ${Object.keys(filters).map(type => html`
                    <li>
                        <a class="${filter === type && 'selected'}" href="#" onclick="dispatch('switchFilter', '${type}')">
                            ${type[0].toUpperCase() + type.slice(1)}
                        </a>
                    </li>
                `)}
                
            </ul>
            ${todos.filter(filters.completed).length > 0 && 
                html`
                <button class="clear-completed" onclick="dispatch('clearCompleted')">Clear completed</button>
            `}
        </footer>
    `
}


// View
function App({ todos }) {
    return html`
        <section class="todoapp">
            ${connect()(Header)()}
            ${todos.length > 0 && connect()(TodoList)()}
            ${todos.length > 0 && connect()(Footer)()}
        </section>
    `
}

attach(connect()(App), document.querySelector('#root'))


