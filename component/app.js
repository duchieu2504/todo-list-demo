import html from '../core.js'
import { connect } from '../store.js'
import header from '../component/header.js'
import footer from '../component/footer.js'
import todoList from '../component/todoList.js'
function app({ todos }) {
    return html`
        <section class="todoapp">
            ${header()}
            ${todos.length > 0 && todoList()}
            ${todos.length > 0 && footer()}
        </section>
    `
}

export default connect()(app)